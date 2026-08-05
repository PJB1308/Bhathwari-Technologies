(function () {
  "use strict";

  var loading = document.getElementById("admin-orders-loading");
  var list = document.getElementById("admin-orders-list");

  function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function itemText(item) {
    return (item.name || item.id || "Item") + " × " + (item.quantity || 1);
  }

  async function loadAdminOrders() {
    try {
      var response = await fetch("/api/admin/orders");
      var payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load orders.");
      renderOrders(payload.orders || []);
    } catch (error) {
      if (loading) loading.textContent = error.message || "Unable to load admin orders.";
    }
  }

  function renderOrders(orders) {
    if (!orders.length) {
      loading.textContent = "No orders found.";
      return;
    }
    if (loading) loading.hidden = true;
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
      var userInfo = document.createElement("p");
      var action = document.createElement("button");
      var orderItems = Array.isArray(order.items) ? order.items : [];

      card.className = "order-card";
      header.className = "order-card-head";
      reference.textContent = order.razorpay_order_id || ("Order #" + String(order.id).slice(0, 8));
      date.textContent = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Order date unavailable";
      status.className = "order-status is-" + (String(order.status || "pending").toLowerCase());
      status.textContent = String(order.status || "pending").toUpperCase();
      if (order.user_name || order.user_email || order.user_id_fallback) {
        userInfo.className = "order-user-info";
        if (order.user_name || order.user_email) {
          userInfo.textContent = (order.user_name ? order.user_name : "Customer") + (order.user_email ? " — " + order.user_email : "");
        } else {
          userInfo.textContent = "User ID: " + order.user_id_fallback;
        }
      }
      action.className = "btn btn-outline";
      action.textContent = "Confirm order";
      action.disabled = order.status !== "pending";
      action.addEventListener("click", function () {
        confirmOrder(order.razorpay_order_id, card);
      });

      header.appendChild(reference);
      header.appendChild(date);
      header.appendChild(status);
      total.textContent = formatMoney(order.total_amount);
      items.textContent = orderItems.length ? orderItems.map(itemText).join(" · ") : "Order items";
      details.appendChild(total);
      if (order.user_name || order.user_email) {
        details.appendChild(userInfo);
      }
      details.appendChild(items);
      if (order.status === "pending") {
        details.appendChild(action);
      }
      card.appendChild(header);
      card.appendChild(details);
      list.appendChild(card);
    });
  }

  async function confirmOrder(razorpayOrderId, card) {
    try {
      var response = await fetch("/api/admin/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_order_id: razorpayOrderId })
      });
      var payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to confirm order.");
      card.querySelector(".order-status").textContent = "PROCESSING";
      card.querySelector(".order-status").className = "order-status is-success";
      var btn = card.querySelector("button");
      if (btn) btn.disabled = true;
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to confirm order.");
    }
  }

  loadAdminOrders();
})();
