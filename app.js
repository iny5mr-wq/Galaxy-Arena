"use strict";

/* =====================================================
   GALAXY ARENA
   APP.JS
===================================================== */

const SUPABASE_URL =
  "https://nubkrxxreuiqefvjbloj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";

let supabaseClient = null;


/* =====================================================
   SUPABASE INIT
===================================================== */

function initSupabase() {

  try {

    if (!window.supabase) {

      console.error(
        "Supabase JS library was not loaded."
      );

      return false;
    }

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    console.log(
      "🌌 Galaxy Arena: Supabase connected"
    );

    return true;

  } catch (error) {

    console.error(
      "Supabase initialization error:",
      error
    );

    return false;
  }
}


/* =====================================================
   HELPERS
===================================================== */

function $(id) {
  return document.getElementById(id);
}


function showMessage(text) {
  window.alert(text);
}


function setCoins(amount) {

  const element =
    $("coins");

  if (!element) {
    return;
  }

  const value =
    Number(amount);

  element.textContent =
    Number.isFinite(value)
      ? value.toLocaleString("en-US")
      : "0";
}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

  if (!supabaseClient) {

    showMessage(
      "Supabase غير متصل.\n\n" +
      "حدّث الصفحة وحاول مرة ثانية."
    );

    return;
  }

  const email =
    window.prompt(
      "اكتب إيميلك للدخول إلى Galaxy Arena:"
    );

  if (!email) {
    return;
  }

  const cleanEmail =
    email.trim().toLowerCase();

  if (
    !cleanEmail.includes("@") ||
    !cleanEmail.includes(".")
  ) {

    showMessage(
      "الإيميل غير صحيح."
    );

    return;
  }

  const button =
    $("loginBtn");

  if (button) {

    button.disabled = true;

    button.textContent =
      "جاري الإرسال...";
  }

  try {

    console.log(
      "Sending Magic Link to:",
      cleanEmail
    );

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithOtp({

        email:
          cleanEmail,

        options: {

          emailRedirectTo:
            window.location.origin + "/"

        }

      });


    console.log(
      "Supabase login response:",
      {
        data,
        error
      }
    );


    if (error) {

      console.error(
        "SUPABASE LOGIN ERROR",
        error
      );

      showMessage(
        "❌ خطأ Supabase\n\n" +

        "Message:\n" +
        (error.message || "Unknown") +

        "\n\nCode:\n" +
        (error.code || "N/A") +

        "\n\nStatus:\n" +
        (error.status || "N/A")
      );

      return;
    }


    showMessage(
      "✅ تم إرسال رابط تسجيل الدخول.\n\n" +

      "افتح الإيميل وتحقق من Spam / Junk."
    );


  } catch (error) {

    console.error(
      "LOGIN EXCEPTION:",
      error
    );

    showMessage(
      "❌ حدث خطأ غير متوقع\n\n" +

      (error?.message ||
        "Unknown error")
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
   GET SESSION
===================================================== */

async function loadSession() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      return;
    }


    if (
      data?.session?.user
    ) {

      console.log(
        "👤 Logged user:",
        data.session.user.email
      );

      await loadProfile();

      await checkAdmin();

    } else {

      setCoins(0);
    }


  } catch (error) {

    console.error(
      "Load session error:",
      error
    );
  }
}


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

  if (!supabaseClient) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "get_my_profile"
      );


    if (error) {

      console.error(
        "Profile RPC error:",
        error
      );

      return;
    }


    console.log(
      "Profile:",
      data
    );


    let profile =
      data;


    if (
      Array.isArray(data)
    ) {

      profile =
        data[0];
    }


    if (!profile) {

      setCoins(0);

      return;
    }


    setCoins(
      Number(
        profile.galaxy_coins || 0
      )
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
   AUTH STATE
===================================================== */

function setupAuthListener() {

  if (!supabaseClient) {
    return;
  }


  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "AUTH EVENT:",
        event
      );


      if (session?.user) {

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

  if (!supabaseClient) {
    return;
  }


  try {

    const {
      data: sessionData
    } =
      await supabaseClient.auth.getSession();


    if (
      !sessionData?.session?.user
    ) {

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
      "ADMIN:",
      data
    );


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

  if (
    $("galaxyAdminButton")
  ) {

    return;
  }


  const button =
    document.createElement(
      "button"
    );


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
    background:linear-gradient(
      135deg,
      #7c3aed,
      #a855f7
    );
    color:white;
    font-weight:bold;
    cursor:pointer;
    box-shadow:
      0 0 25px
      rgba(168,85,247,.6);
  `;


  button.onclick =
    openAdminPanel;


  document.body.appendChild(
    button
  );
}


/* =====================================================
   ADMIN PANEL
===================================================== */

function openAdminPanel() {

  if (
    $("galaxyAdminPanel")
  ) {

    return;
  }


  const panel =
    document.createElement(
      "div"
    );


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
      box-shadow:0 0 50px rgba(124,58,237,.5);
    ">

      <h2 style="text-align:center">
        ⚙️ Galaxy Arena Admin
      </h2>

      <p style="
        text-align:center;
        opacity:.7;
      ">
        إدارة Galaxy Coins
      </p>


      <input
        id="adminUsername"
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
        "
      >


      <input
        id="adminAmount"
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


  document.body.appendChild(
    panel
  );


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

async function changeCoins(
  action
) {

  if (!supabaseClient) {
    return;
  }


  const username =
    $("adminUsername")
      ?.value
      .trim();


  const amount =
    Number(
      $("adminAmount")
        ?.value
    );


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
        "❌ خطأ:\n\n" +
        error.message
      );

      return;
    }


    showMessage(
      action === "add"
        ? "✅ تمت إضافة Coins"
        : "✅ تم حذف Coins"
    );


    await loadProfile();


    if ($("adminAmount")) {
      $("adminAmount").value = "";
    }


  } catch (error) {

    console.error(error);

    showMessage(
      "حدث خطأ أثناء تعديل Coins."
    );
  }
}


/* =====================================================
   BUY COINS
===================================================== */

async function buyCoins() {

  if (!supabaseClient) {

    showMessage(
      "Supabase غير متصل."
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      showMessage(
        "خطأ في الحساب:\n\n" +
        error.message
      );

      return;
    }


    if (
      !data?.session?.user
    ) {

      showMessage(
        "سجّل الدخول أولاً."
      );

      return;
    }


    const {
      data: packages,
      error: packageError
    } =
      await supabaseClient.rpc(
        "get_coin_packages"
      );


    if (packageError) {

      console.error(
        packageError
      );

      showMessage(
        "تعذر تحميل الباقات:\n\n" +
        packageError.message
      );

      return;
    }


    if (
      !packages ||
      packages.length === 0
    ) {

      showMessage(
        "لا توجد باقات Coins مفعلة حاليًا."
      );

      return;
    }


    let text =
      "🪙 Galaxy Coins\n\n";


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


    await startPayment(
      packages[index]
    );


  } catch (error) {

    console.error(
      "Buy Coins error:",
      error
    );

    showMessage(
      "❌ خطأ في المتجر:\n\n" +
      (error?.message || "Unknown")
    );
  }
}


/* =====================================================
   PAYMENT
===================================================== */

async function startPayment(pkg) {

  try {

    showMessage(
      "جاري تجهيز الدفع..."
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
              pkg.id
          }
        }
      );


    if (error) {

      console.error(
        "Edge Function error:",
        error
      );

      showMessage(
        "❌ خطأ بالدفع:\n\n" +
        error.message
      );

      return;
    }


    console.log(
      "Payment response:",
      data
    );


    const paymentUrl =
      data?.redirect_url ||
      data?.payment_url ||
      data?.redirectUrl ||
      data?.url;


    if (!paymentUrl) {

      showMessage(
        "تم الاتصال بالدفع، لكن لم يتم استلام رابط الدفع."
      );

      return;
    }


    window.location.href =
      paymentUrl;


  } catch (error) {

    console.error(
      "Payment exception:",
      error
    );

    showMessage(
      "❌ حدث خطأ في الدفع:\n\n" +
      (error?.message || "Unknown")
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


  const heroLoginBtn =
    $("heroLoginBtn");


  if (heroLoginBtn) {

    heroLoginBtn.addEventListener(
      "click",
      login
    );

  }


  const buyCoinsBtn =
    $("buyCoinsBtn");


  if (buyCoinsBtn) {

    buyCoinsBtn.addEventListener(
      "click",
      buyCoins
    );

  }
}


/* =====================================================
   START
===================================================== */

async function startGalaxyArena() {

  console.log(
    "🌌 Galaxy Arena starting..."
  );


  const connected =
    initSupabase();


  if (!connected) {

    showMessage(
      "تعذر تشغيل نظام الحسابات."
    );

    return;
  }


  setupButtons();

  setupAuthListener();

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
    startGalaxyArena
  );

} else {

  startGalaxyArena();

}
