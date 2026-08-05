(function () {
  "use strict";

  // Paste the Project URL and anon/publishable key from Supabase Dashboard > Settings > API.
  var SUPABASE_URL = "https://qnenzxnhxfpybhhyhjtw.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZW56eG5oeGZweWJoaHloanR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjE0MjQsImV4cCI6MjEwMTQ5NzQyNH0.iF5sSHMAxkNe2mUGaew5MD871TB8JgMX-tVdEoko94w";

  var form = document.getElementById("login-form");
  var message = document.getElementById("login-message");
  var title = document.getElementById("login-title");
  var intro = document.getElementById("login-intro");
  var submitBtn = document.getElementById("login-submit");
  var nameField = document.getElementById("name-field");
  var tabLogin = document.getElementById("tab-login");
  var tabSignup = document.getElementById("tab-signup");
  var emailInput = document.getElementById("login-email");
  var passwordInput = document.getElementById("login-password");
  var nameInput = document.getElementById("login-name");

  if (!form) return;

  var currentMode = "login";

  function setMode(mode, prefilledEmail) {
    currentMode = mode;
    message.innerHTML = "";
    message.className = "login-message";

    if (mode === "signup") {
      tabLogin.classList.remove("is-active");
      tabLogin.setAttribute("aria-selected", "false");
      tabSignup.classList.add("is-active");
      tabSignup.setAttribute("aria-selected", "true");

      title.textContent = "Create account";
      intro.textContent = "Sign up to track orders, save components, and request quotes.";
      submitBtn.innerHTML = 'Sign up <span>→</span>';
      if (nameField) nameField.style.display = "grid";
    } else {
      tabSignup.classList.remove("is-active");
      tabSignup.setAttribute("aria-selected", "false");
      tabLogin.classList.add("is-active");
      tabLogin.setAttribute("aria-selected", "true");

      title.textContent = "Welcome back";
      intro.textContent = "Log in to view orders, saved components and account details.";
      submitBtn.innerHTML = 'Log in <span>→</span>';
      if (nameField) nameField.style.display = "none";
    }

    if (prefilledEmail) {
      emailInput.value = prefilledEmail;
    }
  }

  if (tabLogin) {
    tabLogin.addEventListener("click", function () { setMode("login"); });
  }
  if (tabSignup) {
    tabSignup.addEventListener("click", function () { setMode("signup"); });
  }

  function showNewUserPrompt(email, msgText) {
    message.className = "login-message is-error";
    message.innerHTML =
      '<p class="login-msg-text">' + (msgText || "No account found for this email.") + '</p>' +
      '<button type="button" id="prompt-signup-btn" class="signup-prompt-btn">' +
      'New user? Click here to Sign Up with <strong>' + escapeHtml(email) + '</strong> →</button>';

    var promptBtn = document.getElementById("prompt-signup-btn");
    if (promptBtn) {
      promptBtn.addEventListener("click", function () {
        setMode("signup", email);
        if (passwordInput) passwordInput.focus();
      });
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var name = nameInput ? nameInput.value.trim() : "";

    if (!email || !password) return;

    submitBtn.disabled = true;
    message.className = "login-message";

    var isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);

    if (currentMode === "signup") {
      message.textContent = "Creating your account…";

      if (!isSupabaseConfigured) {
        // Fallback demo sign up when Supabase keys are not set yet
        window.setTimeout(function () {
          message.className = "login-message is-success";
          message.innerHTML = 'Account created successfully! Welcome aboard, <strong>' + escapeHtml(email) + '</strong>. Redirecting to catalog…';
          window.setTimeout(function () { window.location.href = "/"; }, 1200);
        }, 600);
        return;
      }

      try {
        var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        var res = await client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: name }
          }
        });
        if (res.error) throw res.error;

        message.className = "login-message is-success";
        if (res.data && res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
          message.textContent = "An account with this email already exists. Switching to Log in mode…";
          window.setTimeout(function () { setMode("login", email); }, 1500);
        } else {
          message.textContent = "Account created successfully! Check your email to confirm, or redirecting to home…";
          window.setTimeout(function () { window.location.href = "/"; }, 1500);
        }
      } catch (err) {
        message.className = "login-message is-error";
        if (err.message === "Failed to fetch") {
          message.innerHTML = '<strong>Connection Error (Failed to fetch):</strong> Unable to reach Supabase. Please verify your <strong>Project URL</strong> in <code>static/js/login.js</code> or check if an adblocker is blocking <code>supabase.co</code>.';
        } else {
          message.textContent = err.message || "Unable to create account. Please try again.";
        }
      } finally {
        submitBtn.disabled = false;
      }

    } else {
      // Log in Mode
      message.textContent = "Logging you in…";

      if (!isSupabaseConfigured) {
        // Fallback demo log in when Supabase keys are not set yet
        window.setTimeout(function () {
          // Offer sign up prompt in demo mode if login fails or for user demonstration
          showNewUserPrompt(email, "Supabase API keys missing. In demo mode, sign up is available!");
          submitBtn.disabled = false;
        }, 500);
        return;
      }

      try {
        var clientLogin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        var response = await clientLogin.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (response.error) throw response.error;

        message.textContent = "Login successful. Redirecting to catalog…";
        message.className = "login-message is-success";
        window.setTimeout(function () { window.location.href = "/"; }, 800);
      } catch (error) {
        var errMsg = error.message || "";
        if (errMsg === "Failed to fetch") {
          message.innerHTML = '<strong>Connection Error (Failed to fetch):</strong> Unable to reach Supabase. Please verify your <strong>Project URL</strong> in <code>static/js/login.js</code> or check if an adblocker is blocking <code>supabase.co</code>.';
        } else if (errMsg.toLowerCase().includes("email not confirmed")) {
          message.className = "login-message is-error";
          message.innerHTML = '<strong>Email Not Confirmed:</strong> Please check your inbox to confirm your email, or disable <em>Confirm Email</em> in Supabase Dashboard > Authentication > Providers > Email.';
        } else if (errMsg.toLowerCase().includes("invalid login credentials") || errMsg.toLowerCase().includes("user not found")) {
          showNewUserPrompt(email, "Invalid credentials or account not found.");
        } else {
          message.textContent = errMsg || "Unable to log in. Please check your email/password and try again.";
          message.className = "login-message is-error";
        }
      } finally {
        submitBtn.disabled = false;
      }
    }
  });
})();

