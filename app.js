const SUPABASE_URL = "https://nubkrxxreuiqefvjbloj.supabase.co";
const SUPABASE_KEY = "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let currentProfile = null;

/* =========================
   ELEMENTS
========================= */

const loginButton =
  document.querySelector("#loginBtn") ||
  document.querySelector("#login");

const coinsElement =
  document.querySelector("#coins");

/* =========================
   LOGIN
========================= */

async function login() {
  const email = prompt("اكتب إيميلك للدخول:");

  if (!email) return;

  const cleanEmail = email.trim();

  if (!cleanEmail.includes("@")) {
    alert("اكتب إيميل صحيح.");
    return;
  }

  const { error } =
    await supabaseClient.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

  if (error) {
    console.error(error);
    alert("صار خطأ:\n" + error.message);
    return;
  }

  alert(
    "تم إرسال رابط تسجيل الدخول إلى إيميلك 📧\n\n" +
    "افتح الإيميل واضغط الرابط."
  );
}

/* =========================
   LOAD PROFILE
========================= */

async function loadProfile() {
  if (!currentUser) return;

  const { data, error } =
    await supabaseClient.rpc("get_my_profile");

  if (error) {
    console.error("Profile error:", error);
    return;
  }

  currentProfile =
    Array.isArray(data) ? data[0] : data;

  if (!currentProfile) return;

  if (coinsElement) {
    coinsElement.textContent =
      Number(
        currentProfile.galaxy_coins || 0
      ).toLocaleString();
  }

  if (loginButton) {
    loginButton.textContent = "حسابي";
  }
}

/* =========================
   AUTH
========================= */

async function loadUser() {
  const { data, error } =
    await supabaseClient.auth.getUser();

  if (error) {
    console.log("Auth:", error.message);
    return;
  }

  currentUser = data.user || null;

  if (currentUser) {
    await loadProfile();
    await checkAdmin();
  }
}

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    currentUser = session?.user || null;

    if (currentUser) {
      await loadProfile();
      await checkAdmin();
    } else {
      if (coinsElement) {
        coinsElement.textContent = "0";
      }

      if (loginButton) {
        loginButton.textContent = "تسجيل الدخول";
      }
    }
  }
);

/* =========================
   ADMIN CHECK
========================= */

async function checkAdmin() {
  if (!currentUser) return;

  const { data, error } =
    await supabaseClient.rpc("is_admin");

  if (error) {
    console.log("Admin:", error.message);
    return;
  }

  if (data === true) {
    createAdminButton();
  }
}

/* =========================
   ADMIN BUTTON
========================= */

function createAdminButton() {

  if (
    document.querySelector(
      "#galaxyAdminButton"
    )
  ) {
    return;
  }

  const button =
    document.createElement("button");

  button.id = "galaxyAdminButton";
  button.textContent =
    "⚙️ لوحة الأدمن";

  button.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    z-index:9999;
    padding:12px 18px;
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
      0 0 20px
      rgba(168,85,247,.5);
  `;

  button.onclick =
    openAdminPanel;

  document.body.appendChild(button);
}

/* =========================
   ADMIN PANEL
========================= */

function openAdminPanel() {

  if (
    document.querySelector(
      "#galaxyAdminPanel"
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
    z-index:10000;
    background:rgba(0,0,0,.88);
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

      <h2>
        ⚙️ Galaxy Arena Admin
      </h2>

      <input
        id="adminUsername"
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

  document.querySelector(
    "#adminClose"
  ).onclick = () => {
    panel.remove();
  };

  document.querySelector(
    "#adminAdd"
  ).onclick = () => {
    adminCoins("add");
  };

  document.querySelector(
    "#adminRemove"
  ).onclick = () => {
    adminCoins("remove");
  };
}

/* =========================
   ADMIN COINS
========================= */

async function adminCoins(action) {

  const username =
    document.querySelector(
      "#adminUsername"
    )?.value.trim();

  const amount =
    Number(
      document.querySelector(
        "#adminAmount"
      )?.value
    );

  if (!username || !amount || amount <= 0) {
    alert(
      "اكتب Username وعدد Coins صحيح."
    );
    return;
  }

  const rpc =
    action === "add"
      ? "admin_add_coins"
      : "admin_remove_coins";

  const { error } =
    await supabaseClient.rpc(
      rpc,
      {
        receiver_username:
          username,
        amount:
          amount
      }
    );

  if (error) {
    alert(
      "صار خطأ:\n" +
      error.message
    );
    return;
  }

  alert(
    action === "add"
      ? "تمت إضافة Galaxy Coins ✅"
      : "تم حذف Galaxy Coins ✅"
  );

  await loadProfile();
}

/* =========================
   PAYTABS
========================= */

async function createPayTabsPayment(
  amount,
  packageName,
  coins
) {

  if (!currentUser) {
    alert(
      "سجل دخولك أولاً."
    );
    return;
  }

  const response =
    await fetch(
      `${SUPABASE_URL}/functions/v1/quick-service`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          apikey:
            SUPABASE_KEY
        },

        body: JSON.stringify({
          amount:
            Number(amount),

          customerName:
            currentProfile?.username ||
            "Galaxy Arena User",

          customerEmail:
            currentUser.email,

          packageName:
            packageName ||
            `${coins} Galaxy Coins`
        })
      }
    );

  const result =
    await response.json();

  console.log(
    "PayTabs:",
    result
  );

  if (!result.success) {
    alert(
      "تعذر إنشاء الدفع:\n" +
      (result.error ||
        "خطأ غير معروف")
    );
    return;
  }

  const paymentUrl =
    result?.data?.redirect_url ||
    result?.data?.payment_url;

  if (!paymentUrl) {
    alert(
      "PayTabs لم يرجع رابط الدفع."
    );
    return;
  }

  window.location.href =
    paymentUrl;
}

/* =========================
   START
========================= */

if (loginButton) {
  loginButton.onclick = login;
}

loadUser();
/* =========================
   GALAXY ARENA ADMIN
========================= */

async function galaxyAdminCheck() {
  const { data: userData } =
    await supabaseClient.auth.getUser();

  if (!userData?.user) return;

  const { data, error } =
    await supabaseClient.rpc("is_admin");

  if (error || data !== true) return;

  if (document.getElementById("galaxyAdminButton")) return;

  const button = document.createElement("button");

  button.id = "galaxyAdminButton";
  button.textContent = "⚙️ لوحة الأدمن";

  button.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    z-index:99999;
    padding:13px 18px;
    border:0;
    border-radius:12px;
    background:linear-gradient(135deg,#7c3aed,#a855f7);
    color:#fff;
    font-weight:bold;
    cursor:pointer;
    box-shadow:0 0 25px rgba(168,85,247,.6);
  `;

  button.onclick = galaxyOpenAdmin;

  document.body.appendChild(button);
}


function galaxyOpenAdmin() {

  if (document.getElementById("galaxyAdminPanel")) {
    return;
  }

  const panel = document.createElement("div");

  panel.id = "galaxyAdminPanel";

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
    ">

      <h2>⚙️ Galaxy Arena Admin</h2>

      <input
        id="galaxyAdminUsername"
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
        id="galaxyAdminAmount"
        type="number"
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

      <button id="galaxyAddCoins"
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

      <button id="galaxyRemoveCoins"
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

      <button id="galaxyCloseAdmin"
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


  document.getElementById(
    "galaxyCloseAdmin"
  ).onclick = () => {
    panel.remove();
  };


  document.getElementById(
    "galaxyAddCoins"
  ).onclick = () => {
    galaxyChangeCoins("add");
  };


  document.getElementById(
    "galaxyRemoveCoins"
  ).onclick = () => {
    galaxyChangeCoins("remove");
  };
}


async function galaxyChangeCoins(action) {

  const username =
    document.getElementById(
      "galaxyAdminUsername"
    ).value.trim();

  const amount =
    Number(
      document.getElementById(
        "galaxyAdminAmount"
      ).value
    );

  if (!username || !amount || amount <= 0) {
    alert("اكتب Username وعدد Coins صحيح.");
    return;
  }

  const rpc =
    action === "add"
      ? "admin_add_coins"
      : "admin_remove_coins";

  const { error } =
    await supabaseClient.rpc(
      rpc,
      {
        receiver_username: username,
        amount: amount
      }
    );

  if (error) {
    alert("خطأ:\n" + error.message);
    return;
  }

  alert(
    action === "add"
      ? "تمت إضافة Coins ✅"
      : "تم حذف Coins ✅"
  );

  await loadProfile();
}


/* تشغيل لوحة الأدمن */
setTimeout(() => {
  galaxyAdminCheck();
}, 1000);
