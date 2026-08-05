(function () {
  "use strict";

  // Paste the Project URL and anon/publishable key from Supabase Dashboard > Settings > API.
  // The anon/publishable key is safe for browser use when Row Level Security is enabled.
  var SUPABASE_URL = "";
  var SUPABASE_ANON_KEY = "";
  var form = document.getElementById("login-form");
  var message = document.getElementById("login-message");

  if (!form) return;
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      message.textContent = "Add your Supabase Project URL and anon key in static/js/login.js to enable login.";
      message.className = "login-message is-error";
      return;
    }

    var submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    message.textContent = "Logging you in…";
    message.className = "login-message";
    try {
      var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var response = await client.auth.signInWithPassword({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
      });
      if (response.error) throw response.error;
      message.textContent = "Login successful. Redirecting to the catalog…";
      message.className = "login-message is-success";
      window.setTimeout(function () { window.location.href = "/"; }, 800);
    } catch (error) {
      message.textContent = error.message || "Unable to log in. Please try again.";
      message.className = "login-message is-error";
    } finally {
      submit.disabled = false;
    }
  });
})();
