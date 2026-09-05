"use strict";

/* =====================================================
   GALAXY ARENA
   Clean Frontend
===================================================== */

const SUPABASE_URL =
  "https://nubkrxxreuiqefvjbloj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";

let client = null;

/* =====================================================
   INIT SUPABASE
===================================================== */

function initSupabase() {
  try {
    if (!window.supabase) {
      console.error("Supabase library not loaded");
      return false;
    }

    client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    console.log("Supabase connected");
    return true;

  } catch (error) {
    console.error("Supabase init error:", error);
    return false;
  }
}

/* =====================================================
   HELPERS
===================================================== */

function $(id) {
  return document.getElementById(id);
}

function message(text) {
  window.alert(text);
}

function setCoins(value) {
  const element = $("coins");

  if (!element) return;

  const amount = Number(value);

  element.textContent =
    Number.isFinite(amount)
      ? amount.toLocaleString("en-US")
      : "0";
}

/* =====================================================
   LOGIN
===================================================== */

async function login() {

  if (!client) {
    message(
      "تعذر الاتصال بالخدمة.\n" +
      "حدّث الصفحة وحاول مرة ثانية."
    );
    return;
  }

  const email = window.prompt(
    "اكتب إيميلك للدخول إلى Galaxy Arena:"
  );

  if (!email) return;

  const cleanEmail =
    email.trim().toLowerCase();

  if (
    !cleanEmail ||
    !cleanEmail.includes("@") ||
    !cleanEmail.includes(".")
  ) {
    message("الإيميل غير صحيح.");
    return;
  }

  const button = $("loginBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "جاري الإرسال...";
  }

  try {

    const result =
      await client.auth.signInWithOtp({

        email: cleanEmail,

        options: {
          emailRedirectTo:
            window.location.origin + "/"
        }

      });

    if (result.error) {

      console.error(
        "Magic Link error:",
        result.error
      );

      message(
        "تعذر إرسال رابط الدخول:\n\n" +
        result.error.message
      );

      return;
    }

    message(
      "تم إرسال رابط الدخول ✅\n\n" +
      "افتح بريدك الإلكتروني وتحقق من Spam / Junk أيضًا."
    );

  } catch (error) {

    console.error(
      "Login exception:",
      error
    );

    message(
      "صار خطأ أثناء إرسال الإيميل."
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        "تسجيل الدخول";
    }
  }
}

/* =====================================================
   LOAD SESSION
===================================================== */

async function loadSession() {

  if (!client) return;

  try {

    const {
      data,
      error
    } =
      await client.auth.getSession();

    if (error) {
      console.error(error);
      return;
    }

    if (data?.session?.user) {

      console.log(
        "Current user:",
        data.session.user.email
      );

      await loadProfile();
      await checkAdmin();

    } else {

      setCoins(0);

    }

  } catch (error) {

    console.error(
      "Session error:",
      error
    );
  }
}

/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile() {

  if (!client) return;

  try {

    const {
      data,
      error
    } =
      await client.rpc(
        "get_my_profile"
      );

    if (error) {

      console.error(
        "Profile RPC error:",
        error
      );

      return;
    }

    let profile = data;

    if (Array.isArray(data)) {
      profile = data[0];
    }

    if (!profile) {
      setCoins(0);
      return;
    }

    setCoins(
      Number(profile.galaxy_coins || 0)
    );

    const loginButton =
      $("loginBtn");

    if (loginButton) {
      loginButton.textContent =
        "✅ الحساب";
    }

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );
  }
}

/* =====================================================
   AUTH LISTENER
===================================================== */

function setupAuth() {

  if (!client) return;

  client.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "Auth:",
        event
      );

      if (session?.user) {

        /*
          لا نستعمل await داخل callback
          حتى ما نسبب تعليق بالـAuth listener.
        */

        setTimeout(
          async () => {
            await loadProfile();
            await checkAdmin();
          },
          0
        );

      } else {

        setCoins(0);

      }
    }
  );
}

/* =====================================================
   ADMIN CHECK
===================================================== */

async function checkAdmin() {

  if (!client) return;

  try {

    const {
      data: sessionData
    } =
      await client.auth.getSession();

    if (!sessionData?.session?.user) {
      return;
    }

    const {
      data,
      error
    } =
      await client.rpc(
        "is_admin"
      );

    if (error) {

      console.error(
        "Admin check error:",
        error
      );

      return;
    }

    if (data === true) {
      createAdminButton();
    }

  } catch (error) {

    console.error(
      "Admin error:",
      error
    );
  }
}

/* =====================================================
   ADMIN BUTTON
===================================================== */

function createAdminButton() {

  if ($("galaxyAdminButton")) {
    return;
  }

  const button =
    document.createElement("button");

  button.id =
    "galaxyAdminButton";

  button.type =
    "button";

  button.textContent =
    "⚙️ لوحة الأدمن";

  button.style.cssText = `
    position:fixed;
    right:20px;
    bottom:20px;
    z-index:99999;
    padding:13px 18px;
    border:0;
    border-radius:12px;
    background:linear-gradient(135deg,#7c3aed,#a855f7);
    color:white;
    font-weight:bold;
    cursor:pointer;
    box-shadow:0 0 25px rgba(168,85,247,.6);
  `;

  button.onclick =
    openAdminPanel;

  document.body.appendChild(button);
}

/* =====================================================
   ADMIN PANEL
===================================================== */

function openAdminPanel() {

  if ($("galaxyAdminPanel")) {
    return;
  }

  const panel =
    document.createElement("div");

  panel.id =
    "galaxyAdminPanel";

  panel.style.cssText = `
    position:fixed;
    inset:0;
    z-index:100000;
    background:rgba(0,0,0,.92);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
  `;

  panel.innerHTML = `

    <div style="
      width:100%;
      max-width:420px;
      background:#111022;
      color:white;
      border-radius:20px;
      padding:25px;
      box-sizing:border-box;
    ">

      <h2 style="text-align:center">
        ⚙️ Galaxy Arena Admin
      </h2>

      <input
        id="adminUsername"
        type="text"
        placeholder="Username"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          margin:8px 0;
          border-radius:10px;
          border:1px solid #444;
          background:#1b1930;
          color:white;
        "
      >

      <input
        id="adminAmount"
        type="number"
        min="1"
        placeholder="Galaxy Coins"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          margin:8px 0;
          border-radius:10px;
          border:1px solid #444;
          background:#1b1930;
          color:white;
        "
      >

      <button
        id="adminAdd"
        type="button"
        style="
          width:100%;
          padding:13px;
          margin-top:10px;
          border:0;
          border-radius:10px;
          background:#22c55e;
          color:white;
          font-weight:bold;
        "
      >
        ➕ إضافة Coins
      </button>

      <button
        id="adminRemove"
        type="button"
        style="
          width:100%;
          padding:13px;
          margin-top:10px;
          border:0;
          border-radius:10px;
          background:#ef4444;
          color:white;
          font-weight:bold;
        "
      >
        ➖ حذف Coins
      </button>

      <button
        id="adminClose"
        type="button"
        style="
          width:100%;
          padding:13px;
          margin-top:15px;
          border:0;
          border-radius:10px;
          background:#333;
          color:white;
        "
      >
        إغلاق
      </button>

    </div>
  `;

  document.body.appendChild(panel);

  $("adminClose").onclick =
    () => panel.remove();

  $("adminAdd").onclick =
    () => changeCoins("add");

  $("adminRemove").onclick =
    () => changeCoins("remove");
}

/* =====================================================
   CHANGE COINS
===================================================== */

async function changeCoins(action) {

  if (!client) return;

  const username =
    $("adminUsername")?.value.trim();

  const amount =
    Number($("adminAmount")?.value);

  if (!username) {

    message(
      "اكتب Username."
    );

    return;
  }

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {

    message(
      "اكتب عدد Coins صحيح."
    );

    return;
  }

  const functionName =
    action === "add"
      ? "admin_add_coins"
      : "admin_remove_coins";

  try {

    const {
      error
    } =
      await client.rpc(
        functionName,
        {
          receiver_username:
            username,

          amount:
            amount
        }
      );

    if (error) {

      console.error(error);

      message(
        "صار خطأ:\n\n" +
        error.message
      );

      return;
    }

    message(
      action === "add"
        ? "تمت إضافة Coins ✅"
        : "تم حذف Coins ✅"
    );

    await loadProfile();

    $("adminAmount").value = "";

  } catch (error) {

    console.error(error);

    message(
      "تعذر تعديل Coins."
    );
  }
}

/* =====================================================
   BUY COINS
===================================================== */

async function buyCoins() {

  if (!client) {

    message(
      "Supabase غير متصل."
    );

    return;
  }

  try {

    const {
      data
    } =
      await client.auth.getSession();

    if (!data?.session?.user) {

      message(
        "سجّل الدخول أولاً."
      );

      return;
    }

    const {
      data: packages,
      error
    } =
      await client.rpc(
        "get_coin_packages"
      );

    if (error) {

      console.error(error);

      message(
        "تعذر تحميل باقات Coins:\n\n" +
        error.message
      );

      return;
    }

    if (
      !packages ||
      packages.length === 0
    ) {

      message(
        "لا توجد باقات Coins مفعلة حاليًا."
      );

      return;
    }

    let text =
      "🪙 باقات Galaxy Coins\n\n";

    packages.forEach(
      (item, index) => {

        text +=
          `${index + 1}. ` +
          `${Number(item.coins).toLocaleString()} Coins — ` +
          `$${item.price_usd}\n`;

      }
    );

    const choice =
      window.prompt(
        text +
        "\nاكتب رقم الباقة:"
      );

    if (!choice) return;

    const index =
      Number(choice) - 1;

    if (
      !Number.isInteger(index) ||
      !packages[index]
    ) {

      message(
        "اختيار غير صحيح."
      );

      return;
    }

    await startPayment(
      packages[index]
    );

  } catch (error) {

    console.error(
      "Buy error:",
      error
    );

    message(
      "صار خطأ أثناء تحميل المتجر."
    );
  }
}

/* =====================================================
   PAYMENT
===================================================== */

async function startPayment(pkg) {

  try {

    message(
      "جاري تجهيز الدفع..."
    );

    const {
      data,
      error
    } =
      await client.functions.invoke(
        "quick-service",
        {
          body: {
            package_id:
              pkg.id
          }
        }
      );

    if (error) {

      console.error(
        "Function error:",
        error
      );

      message(
        "تعذر إنشاء الدفع:\n\n" +
        error.message
      );

      return;
    }

    const url =
      data?.redirect_url ||
      data?.payment_url ||
      data?.redirectUrl ||
      data?.url;

    if (!url) {

      console.error(
        "Payment response:",
        data
      );

      message(
        "لم يتم الحصول على رابط الدفع."
      );

      return;
    }

    window.location.assign(url);

  } catch (error) {

    console.error(
      "Payment error:",
      error
    );

    message(
      "صار خطأ في الاتصال بصفحة الدفع."
    );
  }
}

/* =====================================================
   BUTTONS
===================================================== */

function setupButtons() {

  const loginBtn =
    $("loginBtn");

  if (loginBtn) {

    loginBtn.addEventListener(
      "click",
      login
    );

  }

  const heroBtn =
    $("heroLoginBtn");

  if (heroBtn) {

    heroBtn.addEventListener(
      "click",
      login
    );

  }

  const buyBtn =
    $("buyCoinsBtn");

  if (buyBtn) {

    buyBtn.addEventListener(
      "click",
      buyCoins
    );

  }
}

/* =====================================================
   START
===================================================== */

async function start() {

  console.log(
    "🌌 Galaxy Arena starting..."
  );

  if (!initSupabase()) {

    message(
      "تعذر تشغيل نظام الحسابات.\n" +
      "تأكد من اتصال الإنترنت."
    );

    return;
  }

  setupButtons();

  setupAuth();

  await loadSession();

  console.log(
    "🌌 Galaxy Arena ready."
  );
}

/* =====================================================
   RUN
===================================================== */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    start
  );

} else {

  start();

}
