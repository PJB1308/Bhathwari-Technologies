(function () {
  "use strict";

  var CART_KEY = "bhathwari-cart-v1";
  var productCatalog = {
    plc: { name: "Panasonic PLC Controller", sku: "BT-PLC-4402", price: 32999, category: "Controller" },
    servo: { name: "Servo Motor", sku: "BT-SRV-1187", price: 9999, category: "Motor" },
    hmi: { name: "HMI Display", sku: "BT-HMI-2903", price: 14999, category: "Display" },
    vfd: { name: "VFD Drive", sku: "BT-VFD-6610", price: 12999, category: "Drive" }
  };

  function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function formatMoney(amount) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount); }
  function cartQuantity(cart) { return Object.keys(cart).reduce(function (total, id) { return total + cart[id]; }, 0); }
  function cartTotal(cart) { return Object.keys(cart).reduce(function (total, id) { return total + productCatalog[id].price * cart[id]; }, 0); }
  function updateCartCount() { var count = cartQuantity(getCart()); document.querySelectorAll(".cart-count, [data-cart-count]").forEach(function (node) { node.textContent = count; }); }

  var toast = document.querySelector(".toast"), toastTimer;
  function showToast(message) { if (!toast) return; toast.querySelector(".toast-text").textContent = message; toast.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200); }

  var header = document.querySelector(".site-header"), navToggle = document.querySelector(".nav-toggle");
  if (navToggle && header) navToggle.addEventListener("click", function () { var open = header.classList.toggle("is-search-open"); navToggle.setAttribute("aria-expanded", String(open)); if (open) header.querySelector(".nav-search input").focus(); });

  document.querySelectorAll(".add-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      var card = button.closest(".product-card"), id = card.dataset.id, cart = getCart();
      var quantity = Number(card.querySelector(".quantity-select").value) || 1;
      cart[id] = (cart[id] || 0) + quantity; saveCart(cart); updateCartCount();
      button.classList.add("is-added"); button.querySelector(".add-btn-label").textContent = "Added";
      showToast(quantity + " × " + productCatalog[id].name + " added to cart");
      setTimeout(function () { button.classList.remove("is-added"); button.querySelector(".add-btn-label").textContent = "Add to Cart"; }, 1200);
    });
  });

  var searchInput = document.querySelector(".nav-search input"), cards = Array.prototype.slice.call(document.querySelectorAll(".product-card")), emptyState = document.querySelector(".empty-state"), activeCategory = "all";
  function applyFilters() { var query = (searchInput && searchInput.value.trim().toLowerCase()) || "", visible = 0; cards.forEach(function (card) { var show = card.dataset.name.toLowerCase().indexOf(query) !== -1 && (activeCategory === "all" || card.dataset.category === activeCategory); card.classList.toggle("is-hidden", !show); if (show) visible++; }); if (emptyState) emptyState.classList.toggle("is-visible", visible === 0); }
  if (searchInput) searchInput.addEventListener("input", applyFilters);
  document.querySelectorAll(".filter-chip").forEach(function (chip) { chip.addEventListener("click", function () { document.querySelectorAll(".filter-chip").forEach(function (item) { item.classList.remove("is-active"); item.setAttribute("aria-pressed", "false"); }); chip.classList.add("is-active"); chip.setAttribute("aria-pressed", "true"); activeCategory = chip.dataset.category; applyFilters(); }); });

  function renderCart() {
    var list = document.getElementById("cart-items"); if (!list) return;
    var cart = getCart(), ids = Object.keys(cart).filter(function (id) { return productCatalog[id] && cart[id] > 0; }), empty = document.getElementById("empty-cart"), total = cartTotal(cart);
    list.innerHTML = ids.map(function (id) { var p = productCatalog[id], qty = cart[id]; return '<article class="cart-item" data-id="' + id + '"><div class="cart-item-art art-' + id + '"><span>' + p.category + '</span><i></i><i></i><i></i></div><div class="cart-item-info"><p class="cart-item-sku">' + p.sku + '</p><h2>' + p.name + '</h2><p>Ready to dispatch · 1 year replacement warranty</p><button class="remove-item" type="button">Delete</button></div><div class="cart-item-actions"><strong>' + formatMoney(p.price) + '</strong><small>per unit, excl. GST</small><div class="qty-control" aria-label="Quantity for ' + p.name + '"><button type="button" data-action="decrease" aria-label="Decrease quantity">−</button><span>' + qty + '</span><button type="button" data-action="increase" aria-label="Increase quantity">+</button></div></div></article>'; }).join("");
    empty.hidden = ids.length > 0; list.hidden = ids.length === 0;
    document.getElementById("subtotal").textContent = formatMoney(total); document.getElementById("order-total").textContent = formatMoney(total);
    document.getElementById("checkout-btn").disabled = ids.length === 0; updateCartCount();
  }
  document.addEventListener("click", function (event) { var item = event.target.closest(".cart-item"); if (!item) return; var id = item.dataset.id, cart = getCart(); if (event.target.closest(".remove-item")) { delete cart[id]; showToast("Item removed from cart"); } var control = event.target.closest("[data-action]"); if (control) { cart[id] += control.dataset.action === "increase" ? 1 : -1; if (cart[id] < 1) delete cart[id]; } saveCart(cart); renderCart(); });
  var checkout = document.getElementById("checkout-btn"); if (checkout) checkout.addEventListener("click", function () { showToast("Checkout is ready — a sales specialist will confirm your order."); });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) { var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }); }, { threshold: 0.12 }); revealEls.forEach(function (element) { observer.observe(element); }); } else revealEls.forEach(function (element) { element.classList.add("is-visible"); });
  updateCartCount(); renderCart();

  // Supabase Auth Integration
  var SUPABASE_URL = "https://qnenzxnhxfpybhhyhjtw.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZW56eG5oeGZweWJoaHloanR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjE0MjQsImV4cCI6MjEwMTQ5NzQyNH0.iF5sSHMAxkNe2mUGaew5MD871TB8JgMX-tVdEoko94w";

  function initAuthNavbar() {
    var slot = document.getElementById("auth-nav-slot");
    if (!slot || !window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function checkUser() {
      try {
        var res = await client.auth.getSession();
        var session = res.data ? res.data.session : null;
        if (session && session.user) {
          renderUserProfile(session.user);
        } else {
          renderLoginLink();
        }
      } catch (e) {
        renderLoginLink();
      }
    }

    function renderLoginLink() {
      slot.innerHTML = '<a class="login-link" href="/login">Log in</a>';
    }

    function renderUserProfile(user) {
      var name = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
      var initial = name.charAt(0).toUpperCase();

      slot.innerHTML =
        '<div class="profile-dropdown-wrapper">' +
          '<button type="button" id="profile-menu-btn" class="profile-menu-btn" aria-expanded="false" aria-haspopup="true">' +
            '<span class="profile-avatar">' + initial + '</span>' +
            '<span class="profile-name">' + escapeHtml(name) + '</span>' +
            '<span class="profile-caret">▾</span>' +
          '</button>' +
          '<div id="profile-dropdown-menu" class="profile-dropdown-menu" hidden>' +
            '<div class="profile-info-header">' +
              '<strong>' + escapeHtml(name) + '</strong>' +
              '<small>' + escapeHtml(user.email) + '</small>' +
            '</div>' +
            '<div class="profile-divider"></div>' +
            '<a href="/cart" class="profile-dropdown-item">🛒 Saved Cart</a>' +
            '<a href="/orders" class="profile-dropdown-item">📦 My Orders</a>' +
            '<button type="button" id="logout-btn" class="profile-dropdown-item is-logout">🚪 Log out</button>' +
          '</div>' +
        '</div>';

      var btn = document.getElementById("profile-menu-btn");
      var menu = document.getElementById("profile-dropdown-menu");
      var logoutBtn = document.getElementById("logout-btn");

      if (btn && menu) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var isOpen = !menu.hidden;
          menu.hidden = isOpen;
          btn.setAttribute("aria-expanded", String(!isOpen));
        });
        document.addEventListener("click", function (e) {
          if (!slot.contains(e.target)) {
            menu.hidden = true;
            btn.setAttribute("aria-expanded", "false");
          }
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener("click", async function () {
          try {
            await client.auth.signOut();
            showToast("Logged out successfully");
            renderLoginLink();
          } catch (err) {
            console.error(err);
          }
        });
      }
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }

    client.auth.onAuthStateChange(function (event, session) {
      if (session && session.user) {
        renderUserProfile(session.user);
      } else {
        renderLoginLink();
      }
    });

    checkUser();
  }

  initAuthNavbar();

  // Multi-step Checkout State Manager
  var currentStep = 1;
  var deliveryData = {};

  function setCheckoutStep(step) {
    if (step < 1 || step > 4) return;
    currentStep = step;

    var p1 = document.getElementById("panel-step-1");
    var p2 = document.getElementById("panel-step-2");
    var p3 = document.getElementById("panel-step-3");
    var p4 = document.getElementById("panel-step-4");

    if (p1) p1.style.display = step === 1 ? "block" : "none";
    if (p2) p2.style.display = step === 2 ? "block" : "none";
    if (p3) p3.style.display = step === 3 ? "block" : "none";
    if (p4) p4.style.display = step === 4 ? "block" : "none";

    var n1 = document.getElementById("step-nav-1");
    var n2 = document.getElementById("step-nav-2");
    var n3 = document.getElementById("step-nav-3");

    if (n1) { n1.className = "step-indicator " + (step === 1 ? "is-current" : (step > 1 ? "is-complete" : "")); }
    if (n2) { n2.className = "step-indicator " + (step === 2 ? "is-current" : (step > 2 ? "is-complete" : "")); }
    if (n3) { n3.className = "step-indicator " + (step === 3 ? "is-current" : (step > 3 ? "is-complete" : "")); }

    var mainTitle = document.getElementById("cart-main-title");
    var eyebrow = document.getElementById("cart-eyebrow");
    var checkoutBtn = document.getElementById("checkout-btn");

    if (step === 1) {
      if (mainTitle) mainTitle.textContent = "Your shopping cart";
      if (eyebrow) eyebrow.textContent = "Order review";
      if (checkoutBtn) { checkoutBtn.style.display = "block"; checkoutBtn.innerHTML = 'Proceed to Delivery <span>→</span>'; }
    } else if (step === 2) {
      if (mainTitle) mainTitle.textContent = "Delivery & Shipping";
      if (eyebrow) eyebrow.textContent = "Step 2 of 3";
      if (checkoutBtn) { checkoutBtn.style.display = "block"; checkoutBtn.innerHTML = 'Proceed to Payment <span>→</span>'; }
    } else if (step === 3) {
      if (mainTitle) mainTitle.textContent = "Payment & Confirmation";
      if (eyebrow) eyebrow.textContent = "Step 3 of 3";
      if (checkoutBtn) checkoutBtn.setAttribute("aria-label", "Pay with Razorpay");
      if (checkoutBtn) { checkoutBtn.style.display = "block"; checkoutBtn.innerHTML = 'Place Order & Confirm <span>→</span>'; }
      if (checkoutBtn) checkoutBtn.textContent = "Pay with Razorpay →";
    } else if (step === 4) {
      if (mainTitle) mainTitle.textContent = "Order Confirmed";
      if (eyebrow) eyebrow.textContent = "Complete";
      if (checkoutBtn) checkoutBtn.style.display = "none";
    }
  }

  var nav1 = document.getElementById("step-nav-1");
  var nav2 = document.getElementById("step-nav-2");
  var nav3 = document.getElementById("step-nav-3");

  if (nav1) nav1.addEventListener("click", function () { if (currentStep <= 3) setCheckoutStep(1); });
  if (nav2) nav2.addEventListener("click", function () { if (currentStep > 1 && currentStep <= 3) setCheckoutStep(2); });
  if (nav3) nav3.addEventListener("click", function () { if (currentStep > 2 && currentStep <= 3) setCheckoutStep(3); });

  var back1 = document.getElementById("back-to-step-1");
  var back2 = document.getElementById("back-to-step-2");
  var deliveryForm = document.getElementById("delivery-form");
  var placeOrderBtn = document.getElementById("place-order-btn");
  var saveAddressToggle = document.getElementById("save-address");
  var saveAddressLabel = document.getElementById("save-address-label");

  if (back1) back1.addEventListener("click", function () { setCheckoutStep(1); });
  if (back2) back2.addEventListener("click", function () { setCheckoutStep(2); });
  if (saveAddressToggle && saveAddressLabel) {
    saveAddressToggle.addEventListener("change", function () {
      saveAddressLabel.hidden = !saveAddressToggle.checked;
      if (saveAddressToggle.checked) document.getElementById("address-label").focus();
    });
  }

  if (deliveryForm) {
    deliveryForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      deliveryData = {
        name: document.getElementById("ship-name").value.trim(),
        phone: document.getElementById("ship-phone").value.trim(),
        company: document.getElementById("ship-company").value.trim(),
        gstin: document.getElementById("ship-gstin").value.trim(),
        address: document.getElementById("ship-address").value.trim(),
        city: document.getElementById("ship-city").value.trim(),
        state: document.getElementById("ship-state").value.trim(),
        pincode: document.getElementById("ship-pincode").value.trim()
      };

      var summaryText = document.getElementById("summary-address-text");
      if (summaryText) {
        summaryText.textContent = deliveryData.name + " · " + deliveryData.address + ", " + deliveryData.city + ", " + deliveryData.state + " - " + deliveryData.pincode + " (Ph: " + deliveryData.phone + ")";
      }
      var saveAddressCheckbox = document.getElementById("save-address");
      if (saveAddressCheckbox && saveAddressCheckbox.checked) await saveDeliveryAddress(deliveryData);
      setCheckoutStep(3);
    });
  }

  async function saveDeliveryAddress(address) {
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    try {
      var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var sessionRes = await client.auth.getSession();
      var user = sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
      if (!user) {
        showToast("Sign in to save this address to your account.");
        return;
      }

      var result = await client.from("addresses").upsert({
        user_id: user.id,
        address_label: (document.getElementById("address-label").value || "").trim() || "Saved address",
        full_name: address.name,
        phone: address.phone,
        company: address.company || null,
        gstin: address.gstin || null,
        address_line1: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      }, { onConflict: "user_id,full_name,phone,address_line1,city,state,pincode" });
      if (result.error) throw result.error;
      showToast("Address saved to your account.");
      loadSavedAddresses();
    } catch (error) {
      console.warn("Unable to save address:", error);
      showToast("Address could not be saved. You can still continue to payment.");
    }
  }

  async function loadSavedAddresses() {
    var section = document.getElementById("saved-addresses");
    var list = document.getElementById("saved-addresses-list");
    if (!section || !list || !window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    try {
      var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var sessionRes = await client.auth.getSession();
      var user = sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
      if (!user) return;

      var result = await client.from("addresses").select("*").order("created_at", { ascending: false });
      if (result.error) throw result.error;
      if (!result.data || !result.data.length) return;

      list.innerHTML = "";
      result.data.forEach(function (address) {
        var button = document.createElement("button");
        var title = document.createElement("strong");
        var details = document.createElement("span");
        var location = document.createElement("small");
        button.type = "button";
        button.className = "saved-address-card";
        title.textContent = address.address_label || "Saved address";
        details.textContent = address.full_name + " · " + address.address_line1;
        location.textContent = address.city + ", " + address.state + " – " + address.pincode;
        button.appendChild(title);
        button.appendChild(details);
        button.appendChild(location);
        button.addEventListener("click", function () { applySavedAddress(address); });
        list.appendChild(button);
      });
      section.hidden = false;
    } catch (error) {
      console.warn("Unable to load saved addresses:", error);
    }
  }

  function applySavedAddress(address) {
    var fields = {
      "ship-name": address.full_name,
      "ship-phone": address.phone,
      "ship-company": address.company || "",
      "ship-gstin": address.gstin || "",
      "ship-address": address.address_line1,
      "ship-city": address.city,
      "ship-state": address.state,
      "ship-pincode": address.pincode
    };
    Object.keys(fields).forEach(function (id) {
      var field = document.getElementById(id);
      if (field) field.value = fields[id];
    });
    if (saveAddressToggle) saveAddressToggle.checked = false;
    if (saveAddressLabel) saveAddressLabel.hidden = true;
    showToast("Saved address applied to delivery details.");
  }

  loadSavedAddresses();

  var checkoutSidebarBtn = document.getElementById("checkout-btn");
  if (checkoutSidebarBtn) {
    checkoutSidebarBtn.addEventListener("click", function () {
      if (currentStep === 1) {
        var cart = getCart();
        if (Object.keys(cart).length === 0) {
          showToast("Your cart is empty!");
          return;
        }
        setCheckoutStep(2);
      } else if (currentStep === 2) {
        if (deliveryForm && deliveryForm.reportValidity()) {
          deliveryForm.dispatchEvent(new Event("submit"));
        }
      } else if (currentStep === 3) {
        processOrderPlacement();
      }
    });
  }

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", function () {
      processOrderPlacement();
    });
  }

  async function processOrderPlacement() {
    var paymentCart = getCart();
    var paymentTotal = cartTotal(paymentCart);
    var paymentItems = Object.keys(paymentCart).filter(function (id) { return productCatalog[id] && paymentCart[id] > 0; }).map(function (id) {
      return { id: id, quantity: paymentCart[id] };
    });
    if (!paymentItems.length) {
      showToast("Your cart is empty!");
      return;
    }

    if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      showToast("Authentication service unavailable. Please refresh and try again.");
      return;
    }

    var currentUserId;
    try {
      var authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var sessionRes = await authClient.auth.getSession();
      var user = sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
      if (!user) {
        showToast("Please log in before placing an order.");
        window.setTimeout(function () { window.location.href = "/login"; }, 1200);
        return;
      }
      currentUserId = user.id;
    } catch (authError) {
      console.error("Unable to verify login session before payment:", authError);
      showToast("Unable to verify login session. Please refresh and try again.");
      return;
    }

    if (!window.Razorpay) {
      showToast("Razorpay checkout could not be loaded. Please refresh and try again.");
      return;
    }

    setPaymentButtonsLoading(true);
    try {
      var createResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: paymentItems })
      });
      var paymentOrder = await createResponse.json();
      if (!createResponse.ok) throw new Error(paymentOrder.error || "Unable to start payment.");

      var razorpay = new Razorpay({
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Bhathwari Technologies",
        description: "Industrial components order",
        order_id: paymentOrder.order_id,
        prefill: { name: deliveryData.name || "", contact: deliveryData.phone || "" },
        notes: { delivery_city: deliveryData.city || "", delivery_pincode: deliveryData.pincode || "" },
        theme: { color: "#f5a623" },
        modal: { ondismiss: function () { setPaymentButtonsLoading(false); } },
        handler: async function (response) {
          try {
            await completePaidOrder(response, paymentTotal, paymentItems, currentUserId);
          } catch (error) {
            console.error("Payment finalization failed:", error);
            showToast(error.message || "We could not complete your order. Please contact support.");
            setPaymentButtonsLoading(false);
          }
        }
      });
      razorpay.on("payment.failed", function () { setPaymentButtonsLoading(false); showToast("Payment was not completed. Please try again."); });
      razorpay.open();
    } catch (error) {
      console.error("Unable to create Razorpay order:", error);
      showToast(error.message || "Unable to start payment. Please try again.");
      setPaymentButtonsLoading(false);
    }
    return;
  }

  function setPaymentButtonsLoading(isLoading) {
    [placeOrderBtn, checkoutSidebarBtn].forEach(function (button) {
      if (!button) return;
      button.disabled = isLoading;
      if (button === placeOrderBtn) button.textContent = isLoading ? "Opening secure payment..." : "Pay securely with Razorpay →";
    });
  }

  async function completePaidOrder(response, total, orderItems, userId) {
    try {
      var verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          items: orderItems,
          total_amount: total,
          user_id: userId
        })
      });
      var verification = await verifyResponse.json();
      if (!verifyResponse.ok || !verification.verified) {
        throw new Error(verification.error || "Payment verification failed.");
      }
    } catch (error) {
      console.error("Payment verification and save failed:", error);
      showToast(error.message || "Unable to save your order. Please contact support.");
      setPaymentButtonsLoading(false);
      return;
    }

    var orderIdEl = document.getElementById("placed-order-id");
    var paymentIdEl = document.getElementById("placed-payment-id");
    var paymentIdWrapper = document.getElementById("rzp-payment-id-wrapper");
    if (orderIdEl) orderIdEl.textContent = "#" + response.razorpay_order_id;
    if (paymentIdEl) paymentIdEl.textContent = response.razorpay_payment_id;
    if (paymentIdWrapper) paymentIdWrapper.style.display = "inline-block";

    saveCart({});
    updateCartCount();
    setCheckoutStep(4);
    showToast("Payment received. Your order is confirmed and saved.");
  }
})();
