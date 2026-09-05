"use strict";

/* =====================================================
   GALAXY ARENA
   APP.JS
   EMAIL + PASSWORD AUTH
===================================================== */

const SUPABASE_URL =
  "https://nubkrxxreuiqefvjbloj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;


/* =====================================================
   INIT SUPABASE
===================================================== */

function initSupabase() {

  if (!window.supabase) {
    alert("❌ Supabase library لم يتم تحميلها.");
    return false;
  }

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

  return true;
}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(message) {
  alert(message);
}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

  if (!supabaseClient) {
    showMessage("❌ Supabase غير متصل.");
    return;
  }

  const email =
    prompt("📧 اكتب الإيميل:");

  if (!email) return;

  const password =
    prompt("🔐 اكتب كلمة المرور:");

  if (!password) return;

  showMessage("⏳ جاري تسجيل الدخول...");

  try {

    const loginPromise =
      supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

    const timeoutPromise =
      new Promise((_, reject) => {

        setTimeout(() => {

          reject(
            new Error(
              "انتهت مهلة الاتصال بـ Supabase بعد 15 ثانية."
            )
          );

        }, 15000);

      });

    const { data, error } =
      await Promise.race([
        loginPromise,
        timeoutPromise
      ]);

    if (error) {

      showMessage(
        "❌ فشل تسجيل الدخول\n\n" +
        "Message:\n" +
        (error.message || "Unknown") +
        "\n\nCode:\n" +
        (error.code || "N/A") +
        "\n\nStatus:\n" +
        (error.status || "N/A")
      );

      return;
    }

    currentUser = data.user;

    await loadProfile();

    showMessage(
      "✅ تم تسجيل الدخول بنجاح!"
    );

    updateUI();

    if (currentUser) {
      await createAdminPanel();
    }

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    showMessage(
      "❌ مشكلة بالاتصال\n\n" +
      (error.message || error)
    );
  }
}


/* =====================================================
   REGISTER
===================================================== */

async function register() {

  if (!supabaseClient) {

    showMessage(
      "❌ Supabase غير متصل."
    );

    return;
  }

  const username =
    prompt("👤 اكتب اسم المستخدم:");

  if (!username) return;


  const email =
    prompt("📧 اكتب الإيميل:");

  if (!email) return;


  const password =
    prompt(
      "🔐 اكتب كلمة المرور:\n\n" +
      "يجب أن تكون 6 أحرف أو أكثر."
    );

  if (!password) return;


  if (password.length < 6) {

    showMessage(
      "❌ كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
    );

    return;
  }


  showMessage(
    "⏳ جاري إنشاء الحساب..."
  );


  try {

    const signupPromise =
      supabaseClient.auth.signUp({

        email: email.trim(),

        password: password,

        options: {

          data: {

            username:
              username.trim()

          }

        }

      });


    const timeoutPromise =
      new Promise((_, reject) => {

        setTimeout(() => {

          reject(
            new Error(
              "انتهت مهلة الاتصال بـ Supabase بعد 15 ثانية."
            )
          );

        }, 15000);

      });


    const { data, error } =
      await Promise.race([

        signupPromise,

        timeoutPromise

      ]);


    if (error) {

      showMessage(

        "❌ فشل إنشاء الحساب\n\n" +

        "Message:\n" +

        (error.message ||
          "Unknown") +

        "\n\nCode:\n" +

        (error.code ||
          "N/A") +

        "\n\nStatus:\n" +

        (error.status ||
          "N/A")

      );

      return;
    }


    currentUser =
      data.user;


    if (currentUser) {

      await loadProfile();

    }


    showMessage(

      "🎉 تم إنشاء الحساب بنجاح!\n\n" +

      "أهلاً بك في Galaxy Arena 🚀"

    );


    updateUI();


    if (currentUser) {

      await createAdminPanel();

    }


  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );


    showMessage(

      "❌ مشكلة بالاتصال\n\n" +

      (error.message ||
        error)

    );

  }
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

  if (!supabaseClient) return;

  const { error } =
    await supabaseClient.auth.signOut();


  if (error) {

    showMessage(
      "❌ تعذر تسجيل الخروج:\n\n" +
      error.message
    );

    return;
  }


  currentUser = null;

  currentProfile = null;


  updateUI();


  showMessage(
    "👋 تم تسجيل الخروج."
  );
}


/* =====================================================
   LOAD SESSION
===================================================== */

async function loadSession() {

  if (!supabaseClient) return;


  const { data, error } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(
      "SESSION ERROR:",
      error
    );

    return;
  }


  currentUser =
    data.session
      ? data.session.user
      : null;


  if (currentUser) {

    await loadProfile();

  }


  updateUI();
}


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile() {

  if (
    !supabaseClient ||
    !currentUser
  ) {
    return;
  }


  const { data, error } =
    await supabaseClient.rpc(
      "get_my_profile"
    );


  if (error) {

    console.error(
      "PROFILE ERROR:",
      error
    );

    return;
  }


  if (data) {

    currentProfile =
      Array.isArray(data)
        ? data[0]
        : data;

  }


  updateCoins();
}


/* =====================================================
   UPDATE COINS
===================================================== */

function updateCoins() {

  const coinsElement =
    document.querySelector("#coins");


  if (!coinsElement) return;


  const coins =
    currentProfile?.galaxy_coins ?? 0;


  coinsElement.textContent =
    Number(coins)
      .toLocaleString();
}


/* =====================================================
   UPDATE UI
===================================================== */

function updateUI() {

  updateCoins();


  const loginBtn =
    document.querySelector(
      "#loginBtn"
    );


  const heroLoginBtn =
    document.querySelector(
      "#heroLoginBtn"
    );


  if (currentUser) {


    if (loginBtn) {

      loginBtn.textContent =
        "تسجيل الخروج";

      loginBtn.onclick =
        logout;

    }


    if (heroLoginBtn) {

      heroLoginBtn.textContent =
        "👤 حسابي";

      heroLoginBtn.onclick =
        () => {

          alert(

            "👤 حساب Galaxy Arena\n\n" +

            "📧 الإيميل:\n" +

            (currentUser.email ||
              "") +

            "\n\n" +

            "🪙 Galaxy Coins:\n" +

            Number(
              currentProfile
                ?.galaxy_coins ?? 0
            ).toLocaleString()

          );

        };

    }


    createRegisterButton(
      false
    );


  } else {


    if (loginBtn) {

      loginBtn.textContent =
        "تسجيل الدخول";

      loginBtn.onclick =
        login;

    }


    if (heroLoginBtn) {

      heroLoginBtn.textContent =
        "🚀 تسجيل الدخول";

      heroLoginBtn.onclick =
        login;

    }


    createRegisterButton(
      true
    );

  }
}


/* =====================================================
   REGISTER BUTTON
===================================================== */

function createRegisterButton(
  show
) {

  let registerBtn =
    document.querySelector(
      "#registerBtn"
    );


  if (!show) {

    if (registerBtn) {

      registerBtn.remove();

    }

    return;
  }


  if (registerBtn) return;


  const loginBtn =
    document.querySelector(
      "#loginBtn"
    );


  if (!loginBtn) return;


  registerBtn =
    document.createElement(
      "button"
    );


  registerBtn.id =
    "registerBtn";


  registerBtn.type =
    "button";


  registerBtn.textContent =
    "🆕 إنشاء حساب";


  registerBtn.style.marginRight =
    "8px";


  registerBtn.onclick =
    register;


  loginBtn.parentNode.insertBefore(

    registerBtn,

    loginBtn.nextSibling

  );
}


/* =====================================================
   ADMIN CHECK
===================================================== */

async function checkAdmin() {

  if (
    !supabaseClient ||
    !currentUser
  ) {

    return false;

  }


  const { data, error } =
    await supabaseClient.rpc(
      "is_admin"
    );


  if (error) {

    console.error(
      "ADMIN CHECK:",
      error
    );

    return false;

  }


  return data === true;
}


/* =====================================================
   ADMIN PANEL
===================================================== */

async function createAdminPanel() {

  const isAdmin =
    await checkAdmin();


  if (!isAdmin) return;


  if (
    document.querySelector(
      "#adminPanel"
    )
  ) {

    return;

  }


  const panel =
    document.createElement(
      "section"
    );


  panel.id =
    "adminPanel";


  panel.className =
    "section";


  panel.innerHTML = `

    <h2>👑 Admin Panel</h2>

    <div class="card">

      <h3>🪙 إدارة Galaxy Coins</h3>

      <input
        id="adminUsername"
        type="text"
        placeholder="Username"
      >

      <input
        id="adminAmount"
        type="number"
        placeholder="Amount"
      >

      <div style="margin-top:10px;">

        <button
          id="addCoinsAdmin"
          type="button"
        >
          ➕ إضافة Coins
        </button>

        <button
          id="removeCoinsAdmin"
          type="button"
        >
          ➖ إزالة Coins
        </button>

      </div>

    </div>

  `;


  document
    .querySelector("main")
    .appendChild(panel);


  document
    .querySelector(
      "#addCoinsAdmin"
    )
    .onclick =
      () => changeCoins(
        "add"
      );


  document
    .querySelector(
      "#removeCoinsAdmin"
    )
    .onclick =
      () => changeCoins(
        "remove"
      );
}


/* =====================================================
   CHANGE COINS
===================================================== */

async function changeCoins(
  action
) {

  const username =
    document
      .querySelector(
        "#adminUsername"
      )
      ?.value.trim();


  const amount =
    Number(

      document
        .querySelector(
          "#adminAmount"
        )
        ?.value

    );


  if (!username) {

    showMessage(
      "❌ اكتب Username."
    );

    return;
  }


  if (
    !amount ||
    amount <= 0
  ) {

    showMessage(
      "❌ اكتب كمية Coins صحيحة."
    );

    return;
  }


  const functionName =
    action === "add"
      ? "admin_add_coins"
      : "admin_remove_coins";


  const { data, error } =
    await supabaseClient.rpc(

      functionName,

      {

        receiver_username:
          username,

        amount:
          amount

      }

    );


  if (error) {

    showMessage(

      "❌ فشلت العملية\n\n" +

      error.message

    );

    return;
  }


  showMessage(

    action === "add"

      ? "✅ تمت إضافة Coins بنجاح."

      : "✅ تمت إزالة Coins بنجاح."

  );
}


/* =====================================================
   BUY COINS - INSTAGRAM
===================================================== */

function buyCoins() {

  if (!currentUser) {

    showMessage(
      "🔐 لازم تسجل دخول أولاً حتى تشتري Galaxy Coins."
    );

    return;
  }


  const modal =
    document.getElementById(
      "instagramPurchaseModal"
    );


  if (!modal) {

    showMessage(
      "❌ نافذة شراء Instagram غير موجودة في index.html."
    );

    return;
  }


  modal.classList.add("show");
}


/* =====================================================
   INSTAGRAM PURCHASE
===================================================== */

function openInstagram() {

  const instagramUrl =
    "https://www.instagram.com/itz7yo/";


  window.open(
    instagramUrl,
    "_blank",
    "noopener,noreferrer"
  );
}


function closeInstagramPurchase() {

  const modal =
    document.getElementById(
      "instagramPurchaseModal"
    );


  if (modal) {

    modal.classList.remove(
      "show"
    );

  }
}


/* =====================================================
   SETUP INSTAGRAM BUTTONS
===================================================== */

function setupInstagramButtons() {

  const openInstagramBtn =
    document.getElementById(
      "openInstagramBtn"
    );


  if (openInstagramBtn) {

    openInstagramBtn.onclick =
      openInstagram;

  }


  const closeInstagramBtn =
    document.getElementById(
      "closeInstagramPurchase"
    );


  if (closeInstagramBtn) {

    closeInstagramBtn.onclick =
      closeInstagramPurchase;

  }
}


/* =====================================================
   AUTH LISTENER
===================================================== */

function setupAuthListener() {

  supabaseClient.auth.onAuthStateChange(

    async (
      event,
      session
    ) => {


      currentUser =
        session
          ? session.user
          : null;


      if (currentUser) {

        await loadProfile();

      } else {

        currentProfile =
          null;

      }


      updateUI();


      if (currentUser) {

        await createAdminPanel();

      }

    }

  );

}


/* =====================================================
   BUTTONS
===================================================== */

function setupButtons() {

  const loginBtn =
    document.querySelector(
      "#loginBtn"
    );


  if (loginBtn) {

    loginBtn.onclick =
      login;

  }


  const buyCoinsBtn =
    document.querySelector(
      "#buyCoinsBtn"
    );


  if (buyCoinsBtn) {

    buyCoinsBtn.onclick =
      buyCoins;

  }


  const heroLoginBtn =
    document.querySelector(
      "#heroLoginBtn"
    );


  if (heroLoginBtn) {

    heroLoginBtn.onclick =
      login;

  }


  setupInstagramButtons();

}


/* =====================================================
   START APP
===================================================== */

async function startApp() {

  if (!initSupabase()) {

    return;

  }


  setupButtons();


  setupAuthListener();


  await loadSession();


  if (currentUser) {

    await createAdminPanel();

  }


  updateUI();


  console.log(
    "🚀 Galaxy Arena started successfully."
  );

}


/* =====================================================
   RUN
===================================================== */

document.addEventListener(

  "DOMContentLoaded",

  startApp

);
