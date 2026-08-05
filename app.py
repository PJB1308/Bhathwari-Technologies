from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from dotenv import load_dotenv
import os
import json
import urllib.request
import urllib.error
import razorpay
import uuid

# Load environment variables
load_dotenv()

# Get Razorpay keys and admin credentials from environment
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ADMIN_USER = os.getenv("ADMIN_USER")
ADMIN_PASS = os.getenv("ADMIN_PASS")

if not ADMIN_USER or not ADMIN_PASS:
    raise RuntimeError("ADMIN_USER and ADMIN_PASS must be set in environment variables.")

# Initialize Razorpay client
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY must be set in environment variables.")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/cart")
def cart():
    return render_template("cart.html")

@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/orders")
def orders():
    return render_template("orders.html")


PRODUCTS = {
    "plc": {"name": "Panasonic PLC Controller", "price": 32999},
    "servo": {"name": "Servo Motor", "price": 9999},
    "hmi": {"name": "HMI Display", "price": 14999},
    "vfd": {"name": "VFD Drive", "price": 12999},
}


@app.post("/api/payments/create-order")
def create_payment_order():
    """Create a Razorpay order from server-validated cart items."""
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return jsonify(error="Razorpay test keys are not configured."), 500

    data = request.get_json(silent=True) or {}
    items = data.get("items")
    if not isinstance(items, list) or not items:
        return jsonify(error="Your cart is empty."), 400

    amount_paise = 0
    for item in items:
        if not isinstance(item, dict):
            return jsonify(error="Invalid cart item."), 400
        product = PRODUCTS.get(item.get("id"))
        quantity = item.get("quantity")
        if not product or isinstance(quantity, bool) or not isinstance(quantity, int) or not 1 <= quantity <= 10:
            return jsonify(error="Invalid product or quantity."), 400
        # Pricing comes from the server; never accept a total sent by the browser.
        amount_paise += product["price"] * quantity * 100

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"bt_{uuid.uuid4().hex[:24]}",
        })
    except razorpay.errors.BadRequestError:
        return jsonify(error="Unable to create the payment order. Please try again."), 502

    return jsonify(order_id=order["id"], amount=order["amount"], currency=order["currency"], key_id=RAZORPAY_KEY_ID)


def supabase_service_request(method, path, query=None, payload=None):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Supabase configuration is missing on the server. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.")

    url = SUPABASE_URL.rstrip("/") + path
    if query:
        url += "?" + query
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Prefer": "return=representation"
    }

    request_obj = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request_obj) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        payload = error.read().decode("utf-8")
        error_message = f"Supabase request failed: {error.code} {payload}"
        if error.code in (401, 403):
            error_message = (
                "Supabase request failed with authentication/row-level security error. "
                "Ensure SUPABASE_SERVICE_KEY is the service-role key from Supabase Settings > API. "
                f"Response: {payload}"
            )
        raise RuntimeError(error_message)


def save_order_to_supabase(order_payload):
    return supabase_service_request("POST", "/rest/v1/orders", payload=order_payload)


def get_all_orders_from_supabase():
    return supabase_service_request("GET", "/rest/v1/orders", query="select=*&order=created_at.desc")


def get_user_by_id(user_id):
    if not user_id:
        return None
    try:
        user = supabase_service_request(
            "GET",
            f"/auth/v1/admin/users/{urllib.request.quote(user_id)}"
        )
        if isinstance(user, list) and user:
            return user[0]
        if isinstance(user, dict):
            return user
    except RuntimeError:
        return None
    return None


def update_order_status(razorpay_order_id, status):
    return supabase_service_request(
        "PATCH",
        "/rest/v1/orders",
        query=f"razorpay_order_id=eq.{urllib.request.quote(razorpay_order_id)}",
        payload={"status": status}
    )


@app.post("/api/payments/verify")
def verify_payment():
    """Confirm the signature returned by Checkout before marking an order paid."""
    data = request.get_json(silent=True) or {}
    required_fields = ("razorpay_order_id", "razorpay_payment_id", "razorpay_signature")
    if not all(isinstance(data.get(field), str) and data[field] for field in required_fields):
        return jsonify(error="Payment verification data is incomplete."), 400

    try:
        client.utility.verify_payment_signature({field: data[field] for field in required_fields})
    except razorpay.errors.SignatureVerificationError:
        return jsonify(error="Payment verification failed."), 400

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return jsonify(error="Supabase service key is not configured on the server."), 500

    order_payload = {
        "user_id": data.get("user_id"),
        "status": "pending",
        "total_amount": data.get("total_amount"),
        "items": data.get("items"),
        "razorpay_order_id": data.get("razorpay_order_id"),
        "razorpay_payment_id": data.get("razorpay_payment_id")
    }

    if not order_payload["user_id"] or not isinstance(order_payload["user_id"], str):
        return jsonify(error="Missing authenticated user ID for order save."), 400

    try:
        saved_order = save_order_to_supabase(order_payload)
    except RuntimeError as error:
        return jsonify(error=str(error)), 500

    return jsonify(verified=True, order_saved=True, order=saved_order)


def is_admin_authenticated():
    return session.get("admin_logged_in") is True


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if username == ADMIN_USER and password == ADMIN_PASS:
            session["admin_logged_in"] = True
            return redirect(url_for("admin_orders"))
        return render_template("admin_login.html", error="Invalid credentials.")
    return render_template("admin_login.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))


@app.route("/admin/orders")
def admin_orders():
    if not is_admin_authenticated():
        return redirect(url_for("admin_login"))
    return render_template("admin_orders.html")


@app.route("/api/admin/orders")
def api_admin_orders():
    if not is_admin_authenticated():
        return jsonify(error="Unauthorized"), 401
    try:
        orders = get_all_orders_from_supabase()
    except RuntimeError as error:
        return jsonify(error=str(error)), 500

    if isinstance(orders, list):
        for order in orders:
            user_profile = get_user_by_id(order.get("user_id"))
            if user_profile:
                order["user_email"] = user_profile.get("email")
                metadata = user_profile.get("user_metadata") or {}
                order["user_name"] = metadata.get("full_name") or user_profile.get("email")
            elif order.get("user_id"):
                order["user_id_fallback"] = order.get("user_id")
    return jsonify(orders=orders)


@app.post("/api/admin/orders/confirm")
def api_admin_confirm_order():
    if not is_admin_authenticated():
        return jsonify(error="Unauthorized"), 401
    data = request.get_json(silent=True) or {}
    razorpay_order_id = data.get("razorpay_order_id")
    if not razorpay_order_id:
        return jsonify(error="Missing order identifier."), 400
    try:
        result = update_order_status(razorpay_order_id, "processing")
    except RuntimeError as error:
        return jsonify(error=str(error)), 500
    return jsonify(updated=result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)

    app.run(host="0.0.0.0", debug=True)