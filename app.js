// ========================================
// GALAXY ARENA - APP.JS V2
// LOGIN + COINS + ADMIN PANEL
// ========================================

const SUPABASE_URL = "https://nubkrxxreuiqefvjbloj.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";


// تحميل Supabase
const supabaseScript = document.createElement("script");

supabaseScript.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

supabaseScript.onload = async () => {

    const supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("Galaxy Arena: Supabase connected ✅");


    // ========================================
    // عناصر الموقع
    // ========================================

    const loginButton =
        document.querySelector("#loginButton");

    const coinsElement =
        document.querySelector("#coins");


    // ========================================
    // إنشاء Admin Panel
    // ========================================

    const adminButton = document.createElement("button");

    adminButton.id = "adminButton";
    adminButton.textContent = "👑 Admin Panel";

    adminButton.style.display = "none";
    adminButton.style.margin = "20px auto";
    adminButton.style.display = "none";

    document.body.appendChild(adminButton);


    // ========================================
    // نافذة Admin
    // ========================================

    const adminPanel = document.createElement("div");

    adminPanel.id = "adminPanel";

    adminPanel.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.85);
            z-index:9999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        ">

            <div style="
                width:100%;
                max-width:500px;
                background:#101326;
                border:1px solid #7c3aed;
                border-radius:20px;
                padding:25px;
                text-align:center;
                box-shadow:0 0 40px rgba(124,58,237,.4);
            ">

                <h2 style="color:#a855f7;">
                    👑 Galaxy Arena Admin
                </h2>

                <p style="color:#94a3b8;">
                    إدارة Galaxy Coins
                </p>

                <input
                    id="adminUsername"
                    type="text"
                    placeholder="Username اللاعب"
                    style="
                        width:100%;
                        padding:14px;
                        margin:10px 0;
                        border-radius:10px;
                        border:1px solid #272a42;
                        background:#070914;
                        color:white;
                        text-align:center;
                    "
                >

                <input
                    id="adminAmount"
                    type="number"
                    min="1"
                    placeholder="عدد Galaxy Coins"
                    style="
                        width:100%;
                        padding:14px;
                        margin:10px 0;
                        border-radius:10px;
                        border:1px solid #272a42;
                        background:#070914;
                        color:white;
                        text-align:center;
                    "
                >

                <button id="addCoinsButton">
                    🪙 إضافة Coins
                </button>

                <button id="removeCoinsButton">
                    ➖ سحب Coins
                </button>

                <button
                    id="closeAdminButton"
                    style="background:#374151;"
                >
                    إغلاق
                </button>

                <p
                    id="adminMessage"
                    style="
                        margin-top:15px;
                        color:#facc15;
                    "
                ></p>

            </div>

        </div>
    `;

    adminPanel.style.display = "none";

    document.body.appendChild(adminPanel);


    // ========================================
    // فتح وإغلاق Admin Panel
    // ========================================

    adminButton.onclick = () => {

        adminPanel.style.display = "block";

    };


    document.querySelector("#closeAdminButton").onclick = () => {

        adminPanel.style.display = "none";

    };


    // ========================================
    // تحميل Profile
    // ========================================

    async function loadProfile() {

        const {
            data,
            error
        } = await supabase.rpc(
            "get_my_profile"
        );


        if (error) {

            console.error(
                "Profile error:",
                error
            );

            return;

        }


        const profile =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!profile) {

            return;

        }


        const coins =
            Number(profile.galaxy_coins || 0);


        if (coinsElement) {

            coinsElement.textContent =
                coins.toLocaleString();

        }


        if (loginButton) {

            loginButton.textContent =
                "تم تسجيل الدخول ✓";

        }


        console.log(
            "Galaxy Coins:",
            coins
        );

    }


    // ========================================
    // فحص الأدمن
    // ========================================

    async function checkAdmin() {

        const {
            data: { user }
        } = await supabase.auth.getUser();


        if (!user) {

            adminButton.style.display = "none";

            return;

        }


        const {
            data,
            error
        } = await supabase.rpc(
            "is_admin"
        );


        if (error) {

            console.error(
                "Admin check error:",
                error
            );

            adminButton.style.display = "none";

            return;

        }


        if (data === true) {

            adminButton.style.display = "block";

            console.log(
                "👑 Admin detected"
            );

        } else {

            adminButton.style.display = "none";

        }

    }


    // ========================================
    // إضافة Coins
    // ========================================

    document.querySelector(
        "#addCoinsButton"
    ).onclick = async () => {

        const username =
            document.querySelector(
                "#adminUsername"
            ).value.trim();

        const amount =
            Number(
                document.querySelector(
                    "#adminAmount"
                ).value
            );


        if (!username || !amount || amount <= 0) {

            alert(
                "اكتب Username وعدد Coins صحيح."
            );

            return;

        }


        const {
            data,
            error
        } = await supabase.rpc(
            "admin_add_coins",
            {
                receiver_username: username,
                amount: amount
            }
        );


        if (error) {

            console.error(error);

            document.querySelector(
                "#adminMessage"
            ).textContent =
                "❌ " + error.message;

            return;

        }


        document.querySelector(
            "#adminMessage"
        ).textContent =
            "✅ تمت إضافة " +
            amount.toLocaleString() +
            " Coins إلى " +
            username;


        document.querySelector(
            "#adminAmount"
        ).value = "";

    };


    // ========================================
    // سحب Coins
    // ========================================

    document.querySelector(
        "#removeCoinsButton"
    ).onclick = async () => {

        const username =
            document.querySelector(
                "#adminUsername"
            ).value.trim();

        const amount =
            Number(
                document.querySelector(
                    "#adminAmount"
                ).value
            );


        if (!username || !amount || amount <= 0) {

            alert(
                "اكتب Username وعدد Coins صحيح."
            );

            return;

        }


        const {
            data,
            error
        } = await supabase.rpc(
            "admin_remove_coins",
            {
                receiver_username: username,
                amount: amount
            }
        );


        if (error) {

            console.error(error);

            document.querySelector(
                "#adminMessage"
            ).textContent =
                "❌ " + error.message;

            return;

        }


        document.querySelector(
            "#adminMessage"
        ).textContent =
            "✅ تمت إزالة " +
            amount.toLocaleString() +
            " Coins من " +
            username;


        document.querySelector(
            "#adminAmount"
        ).value = "";

    };


    // ========================================
    // تسجيل الدخول
    // ========================================

    if (loginButton) {

        loginButton.addEventListener(
            "click",
            async () => {

                const email =
                    prompt(
                        "اكتب إيميلك حتى نرسل لك رابط تسجيل الدخول:"
                    );


                if (!email) {

                    return;

                }


                loginButton.disabled = true;

                loginButton.textContent =
                    "جاري الإرسال...";


                const {
                    error
                } =
                    await supabase.auth.signInWithOtp({

                        email: email,

                        options: {

                            emailRedirectTo:
                                window.location.origin

                        }

                    });


                if (error) {

                    alert(
                        "حدث خطأ أثناء تسجيل الدخول:\n" +
                        error.message
                    );

                    loginButton.disabled = false;

                    loginButton.textContent =
                        "تسجيل الدخول";

                    return;

                }


                alert(
                    "تم إرسال رابط تسجيل الدخول إلى إيميلك 📧"
                );


                loginButton.disabled = false;

                loginButton.textContent =
                    "تم إرسال الرابط ✓";

            }
        );

    }


    // ========================================
    // عند تسجيل الدخول
    // ========================================

    supabase.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                await loadProfile();

                await checkAdmin();

            } else {

                adminButton.style.display =
                    "none";

            }

        }
    );


    // ========================================
    // تشغيل النظام
    // ========================================

    await loadProfile();

    await checkAdmin();

};


// إضافة المكتبة
document.head.appendChild(
    supabaseScript
);
