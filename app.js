/* =========================================================
   GALAXY ARENA
   Main App
   ========================================================= */

"use strict";

/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://nubkrxxreuiqefvjbloj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";

let supabaseClient = null;

try {
  if (!window.supabase) {
    throw new Error("Supabase library did not load.");
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  console.log("Galaxy Arena: Supabase connected.");
} catch (error) {
  console.error("Supabase initialization error:", error);
}


/* =========================
   HELPERS
========================= */

function showMessage(message) {
  alert(message);
}

function getElement(id) {
  return document.getElementById(id);
}


/* =========================
   LOGIN
========================= */

async function login() {

  if (!supabaseClient) {
    showMessage(
      "صار خطأ بالاتصال بالخدمة.\nحاول تحديث الصفحة."
    );
    return;
  }

  const email = prompt(
    "اكتب إيميلك للدخول إلى Galaxy Arena:"
  );

  if (!email) {
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail.includes("@")) {
    showMessage("اكتب إيميل صحيح.");
    return;
  }

  try {

    showMessage(
      "جاري إرسال رابط تسجيل الدخول إلى إيميلك..."
    );

    const { error } =
      await supabaseClient.auth.signInWithOtp({

        email: cleanEmail,

        options: {
          emailRedirectTo:
            window.location.origin
        }

      });

    if (error) {
      console.error("Login error:", error);

      showMessage(
        "صار خطأ بتسجيل الدخول:\n\n" +
        error.message
      );

      return;
    }

    showMessage(
      "تم إرسال رابط الدخول إلى إيميلك ✅\n\n" +
      "افتح الإيميل واضغط على الرابط."
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "صار خطأ غير متوقع.\nحاول مرة ثانية."
    );
  }
}


/* =========================
   LOAD USER
========================= */

async function loadUser() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("getUser error:", error);
      return;
    }

    if (!data || !data.user) {
      updateCoins(0);
      return;
    }

    console.log(
      "Logged in:",
      data.user.email
    );

    await loadProfile();
    await checkAdmin();

  } catch (error) {

    console.error(
      "loadUser error:",
      error
    );
  }
}


/* =========================
   LOAD PROFILE
========================= */

async function loadProfile() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_my_profile"
    );

    if (error) {

      console.error(
        "Profile error:",
        error
      );

      return;
    }

    console.log(
      "Profile:",
      data
    );

    let profile = data;

    /*
      بعض RPC functions ترجع object
      وبعضها ممكن ترجع array.
    */

    if (Array.isArray(data)) {
      profile = data[0];
    }

    if (!profile) {
      updateCoins(0);
      return;
    }

    const coins =
      Number(profile.galaxy_coins || 0);

    updateCoins(coins);

    updateLoginButton();

  } catch (error) {

    console.error(
      "loadProfile error:",
      error
    );
  }
}


/* =========================
   UPDATE COINS
========================= */

function updateCoins(amount) {

  const coinsElement =
    getElement("coins");

  if (!coinsElement) {
    return;
  }

  const safeAmount =
    Number.isFinite(Number(amount))
      ? Number(amount)
      : 0;

  coinsElement.textContent =
    safeAmount.toLocaleString("en-US");
}


/* =========================
   UPDATE LOGIN BUTTON
========================= */

async function updateLoginButton() {

  const loginBtn =
    getElement("loginBtn");

  if (!loginBtn) {
    return;
  }

  try {

    const {
      data
    } = await supabaseClient.auth.getUser();

    if (data && data.user) {

      loginBtn.textContent =
        "✅ تم تسجيل الدخول";

    } else {

      loginBtn.textContent =
        "تسجيل الدخول";

    }

  } catch (error) {

    console.error(error);
  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    updateCoins(0);

    const loginBtn =
      getElement("loginBtn");

    if (loginBtn) {
      loginBtn.textContent =
        "تسجيل الدخول";
    }

    const adminButton =
      getElement("galaxyAdminButton");

    if (adminButton) {
      adminButton.remove();
    }

    const adminPanel =
      getElement("galaxyAdminPanel");

    if (adminPanel) {
      adminPanel.remove();
    }

    showMessage(
      "تم تسجيل الخروج ✅"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "تعذر تسجيل الخروج."
    );
  }
}


/* =========================
   ADMIN CHECK
========================= */

async function checkAdmin() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      data: userData
    } =
      await supabaseClient.auth.getUser();

    if (!userData || !userData.user) {
      return;
    }

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "is_admin"
      );

    if (error) {

      console.error(
        "Admin check error:",
        error
      );

      return;
    }

    console.log(
      "Is admin:",
      data
    );

    if (data === true) {

      createAdminButton();

    }

  } catch (error) {

    console.error(
      "checkAdmin error:",
      error
    );
  }
}


/* =========================
   ADMIN BUTTON
========================= */

function createAdminButton() {

  if (
    getElement(
      "galaxyAdminButton"
    )
  ) {
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
    bottom:20px;
    right:20px;
    z-index:99999;
    padding:13px 18px;
    border:0;
    border-radius:12px;
    background:linear-gradient(
      135deg,
      #7c3aed,
      #a855f7
    );
    color:#fff;
    font-weight:bold;
    cursor:pointer;
    box-shadow:
      0 0 25px
      rgba(168,85,247,.6);
  `;

  button.addEventListener(
    "click",
    openAdminPanel
  );

  document.body.appendChild(button);
}


/* =========================
   ADMIN PANEL
========================= */

function openAdminPanel() {

  if (
    getElement(
      "galaxyAdminPanel"
    )
  ) {
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
    background:rgba(0,0,0,.9);
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
      box-shadow:
        0 0 50px
        rgba(124,58,237,.5);
    ">

      <h2 style="
        margin-top:0;
        text-align:center;
      ">
        ⚙️ Galaxy Arena Admin
      </h2>

      <p style="
        text-align:center;
        opacity:.7;
      ">
        إدارة Galaxy Coins
      </p>

      <input
        id="galaxyAdminUsername"
        type="text"
        placeholder="Username"
        autocomplete="off"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          margin:8px 0;
          border-radius:10px;
          border:1px solid #444;
          background:#1b1930;
          color:white;
          outline:none;
        "
      >

      <input
        id="galaxyAdminAmount"
        type="number"
        min="1"
        placeholder="عدد Galaxy Coins"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          margin:8px 0;
          border-radius:10px;
          border:1px solid #444;
          background:#1b1930;
          color:white;
          outline:none;
        "
      >

      <button
        id="galaxyAddCoins"
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
          cursor:pointer;
        "
      >
        ➕ إضافة Coins
      </button>

      <button
        id="galaxyRemoveCoins"
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
          cursor:pointer;
        "
      >
        ➖ حذف Coins
      </button>

      <button
        id="galaxyCloseAdmin"
        type="button"
        style="
          width:100%;
          padding:13px;
          margin-top:15px;
          border:0;
          border-radius:10px;
          background:#333;
          color:white;
          cursor:pointer;
        "
      >
        إغلاق
      </button>

    </div>
  `;

  document.body.appendChild(panel);


  const closeButton =
    getElement(
      "galaxyCloseAdmin"
    );

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      () => panel.remove()
    );

  }


  const addButton =
    getElement(
      "galaxyAddCoins"
    );

  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {
        adminChangeCoins("add");
      }
    );

  }


  const removeButton =
    getElement(
      "galaxyRemoveCoins"
    );

  if (removeButton) {

    removeButton.addEventListener(
      "click",
      () => {
        adminChangeCoins("remove");
      }
    );

  }
}


/* =========================
   ADMIN CHANGE COINS
========================= */

async function adminChangeCoins(
  action
) {

  if (!supabaseClient) {
    showMessage(
      "Supabase غير متصل."
    );
    return;
  }

  const usernameInput =
    getElement(
      "galaxyAdminUsername"
    );

  const amountInput =
    getElement(
      "galaxyAdminAmount"
    );

  if (
    !usernameInput ||
    !amountInput
  ) {
    return;
  }

  const username =
    usernameInput.value.trim();

  const amount =
    Number(amountInput.value);

  if (!username) {

    showMessage(
      "اكتب Username."
    );

    return;
  }

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {

    showMessage(
      "اكتب عدد Coins صحيح."
    );

    return;
  }

  const rpcName =
    action === "add"
      ? "admin_add_coins"
      : "admin_remove_coins";

  try {

    const {
      error
    } =
      await supabaseClient.rpc(
        rpcName,
        {
          receiver_username:
            username,

          amount:
            amount
        }
      );

    if (error) {

      console.error(
        "Coin RPC error:",
        error
      );

      showMessage(
        "صار خطأ:\n\n" +
        error.message
      );

      return;
    }

    showMessage(
      action === "add"
        ? "تمت إضافة Galaxy Coins بنجاح ✅"
        : "تم حذف Galaxy Coins بنجاح ✅"
    );

    await loadProfile();

    amountInput.value = "";

  } catch (error) {

    console.error(error);

    showMessage(
      "صار خطأ أثناء تعديل Coins."
    );
  }
}


/* =========================
   BUY COINS
========================= */

async function buyCoins() {

  if (!supabaseClient) {

    showMessage(
      "الخدمة غير متصلة."
    );

    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();

    if (error || !data?.user) {

      showMessage(
        "سجّل دخول أولاً حتى تشتري Galaxy Coins."
      );

      return;
    }

    /*
      نعرض الباقات الموجودة في Supabase.
    */

    const {
      data: packages,
      error: packagesError
    } =
      await supabaseClient.rpc(
        "get_coin_packages"
      );

    if (packagesError) {

      console.error(
        packagesError
      );

      showMessage(
        "تعذر تحميل باقات Galaxy Coins."
      );

      return;
    }

    if (
      !packages ||
      packages.length === 0
    ) {

      showMessage(
        "حالياً ماكو باقات Coins مفعلة."
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
      prompt(
        text +
        "\nاكتب رقم الباقة:"
      );

    if (!choice) {
      return;
    }

    const index =
      Number(choice) - 1;

    if (
      !Number.isInteger(index) ||
      !packages[index]
    ) {

      showMessage(
        "اختيار غير صحيح."
      );

      return;
    }

    const selected =
      packages[index];

    await createPayTabsPayment(
      selected
    );

  } catch (error) {

    console.error(
      "Buy coins error:",
      error
    );

    showMessage(
      "صار خطأ أثناء شراء Coins."
    );
  }
}


/* =========================
   PAYTABS
========================= */

async function createPayTabsPayment(
  selectedPackage
) {

  try {

    showMessage(
      "جاري تجهيز صفحة الدفع..."
    );

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "quick-service",
        {
          body: {
            package_id:
              selectedPackage.id
          }
        }
      );

    if (error) {

      console.error(
        "PayTabs function error:",
        error
      );

      showMessage(
        "تعذر إنشاء عملية الدفع:\n\n" +
        error.message
      );

      return;
    }

    if (!data) {

      showMessage(
        "لم يتم استلام بيانات الدفع."
      );

      return;
    }

    /*
      حسب الاستجابة القادمة من Edge Function.
    */

    const paymentUrl =
      data.redirect_url ||
      data.payment_url ||
      data.redirectUrl ||
      data.url;

    if (!paymentUrl) {

      console.error(
        "Payment response:",
        data
      );

      showMessage(
        "تم إنشاء الطلب لكن لم يتم العثور على رابط الدفع."
      );

      return;
    }

    window.location.href =
      paymentUrl;

  } catch (error) {

    console.error(
      "Payment error:",
      error
    );

    showMessage(
      "صار خطأ بصفحة الدفع."
    );
  }
}


/* =========================
   BUTTON EVENTS
========================= */

function setupButtons() {

  const loginBtn =
    getElement("loginBtn");

  if (loginBtn) {

    loginBtn.addEventListener(
      "click",
      login
    );

  }


  const heroLoginBtn =
    getElement("heroLoginBtn");

  if (heroLoginBtn) {

    heroLoginBtn.addEventListener(
      "click",
      login
    );

  }


  const buyCoinsBtn =
    getElement("buyCoinsBtn");

  if (buyCoinsBtn) {

    buyCoinsBtn.addEventListener(
      "click",
      buyCoins
    );

  }

}


/* =========================
   AUTH STATE
========================= */

function setupAuthListener() {

  if (!supabaseClient) {
    return;
  }

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        "Auth event:",
        event
      );

      if (session?.user) {

        await loadProfile();
        await checkAdmin();

      } else {

        updateCoins(0);

      }

    }
  );
}


/* =========================
   START APP
========================= */

async function startGalaxyArena() {

  console.log(
    "🌌 Galaxy Arena starting..."
  );

  setupButtons();

  setupAuthListener();

  await loadUser();

  console.log(
    "🌌 Galaxy Arena ready."
  );
}


/* =========================
   START
========================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startGalaxyArena
  );

} else {

  startGalaxyArena();

}
