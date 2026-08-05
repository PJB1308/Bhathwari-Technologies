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
})();
