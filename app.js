// ========================================
// GALAXY ARENA - SUPABASE CONNECTION
// ========================================

// بيانات مشروع Supabase
const SUPABASE_URL = "https://nubkrxxreuiqefvjbloj.supabase.co";

// هذا هو الـ Publishable key الذي حصلت عليه من Supabase
const SUPABASE_KEY =
    "sb_publishable_PwgyR9vD2dVXwODaZ5yq5g__Aj5O9Sr";


// تحميل مكتبة Supabase من الإنترنت
const supabaseScript = document.createElement("script");

supabaseScript.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

supabaseScript.onload = () => {

    // إنشاء اتصال Supabase
    const supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log("Galaxy Arena: Supabase connected ✅");


    // ========================================
    // عناصر الصفحة
    // ========================================

    const loginButton =
        document.querySelector("#loginButton");

    const coinsElement =
        document.querySelector("#coins");


    // ========================================
    // تسجيل الدخول
    // ========================================

    if (loginButton) {

        loginButton.addEventListener("click", async () => {

            const email = prompt(
                "اكتب إيميلك حتى نرسل لك رابط تسجيل الدخول:"
            );

            if (!email) {
                return;
            }

            loginButton.disabled = true;
            loginButton.textContent = "جاري الإرسال...";


            const { error } =
                await supabase.auth.signInWithOtp({

                    email: email,

                    options: {
                        emailRedirectTo:
                            window.location.origin
                    }

                });


            if (error) {

                console.error(error);

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

        });

    }


    // ========================================
    // قراءة المستخدم الحالي
    // ========================================

    async function loadUser() {

        const {
            data: { user }
        } = await supabase.auth.getUser();


        if (!user) {

            console.log(
                "لا يوجد مستخدم مسجل الدخول."
            );

            return;

        }


        console.log(
            "المستخدم:",
            user.email
        );


        await loadProfile();

    }


    // ========================================
    // قراءة البروفايل والـ Galaxy Coins
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


        console.log(
            "Galaxy Arena Profile:",
            data
        );


        // نتيجة RPC ممكن تكون object أو array
        const profile =
            Array.isArray(data)
                ? data[0]
                : data;


        if (!profile) {

            console.log(
                "لم يتم العثور على البروفايل."
            );

            return;

        }


        // قراءة Galaxy Coins
        const coins =
            Number(profile.galaxy_coins || 0);


        // عرض العملات بالواجهة
        if (coinsElement) {

            coinsElement.textContent =
                coins.toLocaleString();

        }


        console.log(
            "Galaxy Coins:",
            coins
        );


        // تغيير زر الدخول
        if (loginButton) {

            loginButton.textContent =
                "تم تسجيل الدخول ✓";

        }

    }


    // ========================================
    // مراقبة تسجيل الدخول / الخروج
    // ========================================

    supabase.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                await loadProfile();

            }

        }
    );


    // ========================================
    // تشغيل النظام
    // ========================================

    loadUser();

};


// إضافة مكتبة Supabase للصفحة
document.head.appendChild(supabaseScript);