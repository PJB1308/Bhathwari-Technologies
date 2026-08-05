(function () {
  "use strict";

  var SUPABASE_URL = "https://qnenzxnhxfpybhhyhjtw.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZW56eG5oeGZweWJoaHloanR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjE0MjQsImV4cCI6MjEwMTQ5NzQyNH0.iF5sSHMAxkNe2mUGaew5MD871TB8JgMX-tVdEoko94w";
  var loading = document.getElementById("orders-loading");
  var list = document.getElementById("orders-list");
  var empty = document.getElementById("orders-empty");

  function formatMoney(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0); }
  function itemText(item) { return (item.name || item.sku || item.id || "Item") + " × " + (item.quantity || 1); }

  async function loadOrders() {
    if (!window.supabase) return showMessage("Unable to load account details. Please refresh the page.");
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    var sessionRes = await client.auth.getSession();
    var user = sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
    if (!user) {
      if (loading) loading.innerHTML = 'Please <a href="/login">log in</a> to view your orders.';
      return;
    }
    var result = await client.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    console.debug("orders query result", { userId: user.id, result: result });
    if (result.error) {
      console.error("Unable to load orders:", result.error);
      return showMessage("Unable to load your orders. Please refresh and try again.");
    }
    if (loading) loading.hidden = true;
    if (!result.data || !result.data.length) {
      console.debug("No orders found for user:", user.id, result.data);
      empty.querySelector("p").textContent = "You don't have any saved orders yet. Please ensure you are signed in with the same account used during checkout.";
      empty.hidden = false;
      return;
    }
    renderOrders(result.data);
  }

  function showMessage(message) { if (loading) loading.textContent = message; }

  function renderOrders(orders) {
    list.hidden = false;
    orders.forEach(function (order) {
      var card = document.createElement("article");
      var header = document.createElement("div");
      var reference = document.createElement("strong");
      var date = document.createElement("small");
      var status = document.createElement("span");
      var details = document.createElement("div");
      var total = document.createElement("strong");
      var items = document.createElement("p");
      var orderItems = Array.isArray(order.items) ? order.items : [];

      card.className = "order-card";
      header.className = "order-card-head";
      reference.textContent = order.razorpay_order_id || ("Order #" + String(order.id).slice(0, 8));
      date.textContent = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Order date unavailable";
      var displayStatus = order.status || "pending";
      var statusClass = String(displayStatus).toLowerCase();
      if (displayStatus.toLowerCase() === "processing") {
        displayStatus = "Success";
        statusClass = "success";
      }
      status.className = "order-status is-" + statusClass;
      status.textContent = displayStatus.toUpperCase();
      header.appendChild(reference); header.appendChild(date); header.appendChild(status);
      total.textContent = formatMoney(order.total_amount);
      items.textContent = orderItems.length ? orderItems.map(itemText).join(" · ") : "Order items";
      details.appendChild(total); details.appendChild(items);
      card.appendChild(header); card.appendChild(details);
      list.appendChild(card);
    });
  }

  loadOrders();
})();
