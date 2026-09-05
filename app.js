const SUPABASE_URL = "https://nubkrxxreuiqefvjbloj.supabase.co";
const SUPABASE_KEY = "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;

/* =========================
   ELEMENTS
========================= */

const loginButton = document.querySelector("#loginBtn");
const coinsElement = document.querySelector("#coins");

/* =========================
   LOGIN
========================= */

async function login() {
  const email = prompt("اكتب إيميلك:");

  if (!email) return;

  const { error } = await db.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    alert("صار خطأ: " + error.message);
    return;
  }

  alert("تم إرسال رابط تسجيل الدخول إلى إيميلك 📧");
}

/* =========================
   PROFILE
========================= */

async function loadProfile() {
  const { data, error } = await db.rpc("get_my_profile");

  if (error) {
    console.log("Profile error:", error);
    return;
  }

  currentProfile = Array.isArray(data) ? data[0] : data;

  if (!currentProfile) return;

  if (coinsElement) {
    coinsElement.textContent =
      Number(currentProfile.galaxy_coins || 0).toLocaleString();
  }

  if (loginButton) {
    loginButton.textContent = "حسابي";
  }
}

/* =========================
   AUTH
========================= */

async function loadUser() {
  const { data } = await db.auth.getUser();

  currentUser = data?.user || null;

  if (currentUser) {
    await loadProfile();
    await checkAdmin();
  }
}

db.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user || null;

  if (currentUser) {
    await loadProfile();
    await checkAdmin();
  }
});

/* =========================
   ADMIN
========================= */

async function checkAdmin() {
  const { data, error } = await db.rpc("is_admin");

  if (error) {
    console.log("Admin check error:", error);
    return;
  }

  if (data === true) {
    createAdminButton();
  }
}

function createAdminButton() {
  if (document.querySelector("#galaxyAdminButton")) return;

  const button = document.createElement("button");

  button.id = "galaxyAdminButton";
  button.textContent = "⚙️ لوحة الأدمن";

  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 18px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg,#7c3aed,#a855f7);
    color: white;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(168,85,247,.5);
  `;

  button.onclick = openAdminPanel;

  document.body.appendChild(button);
}

function openAdminPanel() {
  if (document.querySelector("#galaxyAdminPanel")) return;

  const panel = document.createElement("div");

  panel.id = "galaxyAdminPanel";

  panel.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0,0,0,.85);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  panel.innerHTML = `
    <div style="
      width:100%;
      max-width:420px;
      background:#111022;
      color:white;
      border-radius:20px;
      padding:25px;
      box-shadow:0 0 40px rgba(124,58,237,.5);
    ">

      <h2 style="margin-top:0;">⚙️ Galaxy Arena Admin</h2>

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

  document.querySelector("#adminClose").onclick = () => {
    panel.remove();
  };

  document.querySelector("#adminAdd").onclick = async () => {
    await adminCoins("add");
  };

  document.querySelector("#adminRemove").onclick = async () => {
    await adminCoins("remove");
  };
}

async function adminCoins(action) {
  const username = document.querySelector("#adminUsername").value.trim();
  const amount = Number(
    document.querySelector("#adminAmount").value
  );

  if (!username || !amount || amount <= 0) {
    alert("اكتب Username والمبلغ بشكل صحيح");
    return;
  }

  const rpc =
    action === "add"
      ? "admin_add_coins"
      : "admin_remove_coins";

  const { data, error } = await db.rpc(rpc, {
    receiver_username: username,
    amount: amount
  });

  if (error) {
    alert("خطأ: " + error.message);
    return;
  }

  alert(
    action === "add"
      ? "تمت إضافة العملات ✅"
      : "تم حذف العملات ✅"
  );

  await loadProfile();
}

/* =========================
   PAYTABS
========================= */

async function createPayTabsPayment({
  amount,
  packageName,
  coins
}) {
  if (!currentUser) {
    alert("سجل دخولك أولاً حتى تشتري Galaxy Coins.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("مبلغ الدفع غير صحيح.");
    return;
  }

  const customerName =
    currentProfile?.username ||
    currentUser.email?.split("@")[0] ||
    "Galaxy Arena User";

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/quick-service`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY
      },
      body: JSON.stringify({
        amount: Number(amount),
        customerName,
        customerEmail: currentUser.email,
        packageName:
          packageName ||
          `Galaxy Coins ${coins || ""}`
      })
    }
  );

  const result = await response.json();

  console.log("PayTabs:", result);

  if (!result.success) {
    alert(
      "تعذر إنشاء عملية الدفع:\n" +
      (result.error || "خطأ غير معروف")
    );
    return;
  }

  const paymentUrl =
    result?.data?.redirect_url ||
    result?.data?.payment_url;

  if (!paymentUrl) {
    alert(
      "تم الاتصال بـ PayTabs لكن لم يصل رابط الدفع."
    );
    return;
  }

  window.location.href = paymentUrl;
}

/* =========================
   STORE BUTTONS
========================= */

function setupStoreButtons() {
  /*
    نبحث عن أزرار المتجر بدون الاعتماد
    على ID معين داخل index.html.
  */

  const buttons = document.querySelectorAll(
    "button, a"
  );

  buttons.forEach((button) => {
    const text = (
      button.textContent || ""
    ).toLowerCase();

    if (
      text.includes("شراء") ||
      text.includes("coins") ||
      text.includes("coin")
    ) {
      if (button.dataset.paytabsReady) return;

      button.dataset.paytabsReady = "true";

      button.addEventListener("click", async (event) => {
        /*
          مؤقتاً نستخدم نافذة بسيطة لاختيار المبلغ.
          بعدها نسوي Packages حقيقية داخل المتجر.
        */

        event.preventDefault();

        if (!currentUser) {
          alert("سجل دخولك أولاً.");
          return;
        }

        const amount = prompt(
          "اكتب سعر الباقة بالدولار:\nمثال: 1"
        );

        if (!amount) return;

        const coins = prompt(
          "اكتب عدد Galaxy Coins للباقة:\nمثال: 1000"
        );

        if (!coins) return;

        await createPayTabsPayment({
          amount: Number(amount),
          coins: Number(coins),
          packageName: `${coins} Galaxy Coins`
        });
      });
    }
  });
}

/* =========================
   START
========================= */

if (loginButton) {
  loginButton.addEventListener("click", login);
}

setupStoreButtons();
loadUser();
