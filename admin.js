// ==========================================
// JARVIS IQ - COMPLETE ADMIN DASHBOARD
// Founder: Prem Patel
// ==========================================

const SUPABASE_URL =
"https://ftbtsnylhyaskftmqtre.supabase.co";

// IMPORTANT: Use your complete sb_publishable_ key.
const SUPABASE_KEY = "PASTE_YOUR_COMPLETE_PUBLISHABLE_KEY";


// ==========================================
// SUPABASE INITIALIZATION
// ==========================================

if (!window.supabase) {
    alert("Supabase library failed to load.");
    throw new Error("Supabase library missing.");
}

if (
    !SUPABASE_KEY.startsWith("sb_publishable_") ||
    SUPABASE_KEY === "PASTE_YOUR_COMPLETE_PUBLISHABLE_KEY"
) {
    console.error("Invalid or missing Publishable Key.");
} else {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
}

const db = () => window.supabaseClient;

let adminVerified = false;
let editingQuestionId = null;


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function showError(error) {
    console.error("JARVIS IQ:", error);
    alert(error.message || "Something went wrong.");
}


// ==========================================
// ADMIN LOGIN PANEL
// ==========================================

window.openAdminLogin = function () {
    getElement("adminLogin").hidden = false;
    getElement("adminEmail").focus();
};

window.closeAdminLogin = function () {
    getElement("adminLogin").hidden = true;
    setText("adminMessage", "");
};


// ==========================================
// VERIFY SUPER ADMIN
// ==========================================

async function verifySuperAdmin() {

    if (!db()) {
        throw new Error("Supabase Publishable Key is missing.");
    }

    const {
        data: { user },
        error
    } = await db().auth.getUser();

    if (error) throw error;

    if (!user) {
        throw new Error("Please login first.");
    }

    const { data, error: roleError } = await db()
        .from("admin_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

    if (roleError) throw roleError;

    if (!data) {
        await db().auth.signOut();
        throw new Error("Access denied: Super Admin only.");
    }

    adminVerified = true;
    return user;
}


// ==========================================
// ADMIN LOGIN
// ==========================================

window.adminLogin = async function () {

    const email = getElement("adminEmail").value.trim();
    const password = getElement("adminPassword").value;
    const message = getElement("adminMessage");

    if (!email || !password) {
        message.textContent = "Enter email and password.";
        return;
    }

    if (!db()) {
        message.textContent =
            "Invalid or missing Supabase Publishable Key.";
        return;
    }

    message.textContent = "Verifying Super Admin...";

    try {

        const { data, error } = await db().auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        await verifySuperAdmin();

        getElement("adminPassword").value = "";
        getElement("adminLogin").hidden = true;

        const dashboard = getElement("adminDashboard");

        if (dashboard) {
            dashboard.hidden = false;
        }

        alert("Welcome, JARVIS IQ Super Admin!");

        await loadAdminOverview();

    } catch (error) {

        adminVerified = false;
        message.textContent = error.message || "Login failed.";
        console.error(error);

    }
};


// ==========================================
// ADMIN ACCESS CHECK
// ==========================================

async function requireAdmin() {

    if (!adminVerified) {
        await verifySuperAdmin();
    }

}


// ==========================================
// DASHBOARD OVERVIEW
// ==========================================

window.loadAdminOverview = async function () {

    try {

        await requireAdmin();

        const [questions, students, results] = await Promise.all([

            db()
                .from("questions")
                .select("id", { count: "exact", head: true }),

            db()
                .from("profiles")
                .select("id", { count: "exact", head: true }),

            db()
                .from("quiz_results")
                .select("id", { count: "exact", head: true })

        ]);

        if (questions.error) throw questions.error;
        if (students.error) throw students.error;
        if (results.error) throw results.error;

        setText("adminTotalQuestions", questions.count ?? 0);
        setText("adminTotalStudents", students.count ?? 0);
        setText("adminTotalResults", results.count ?? 0);

        setText(
            "adminSecurity",
            "SUPER ADMIN VERIFIED • DATABASE CONNECTED"
        );

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// DASHBOARD TAB NAVIGATION
// ==========================================

window.adminShowTab = async function (tab, button) {

    const title = tab.charAt(0).toUpperCase() + tab.slice(1);

    document.querySelectorAll(".admin-tab-content").forEach(panel => {
        panel.hidden = true;
    });

    const possibleIds = [
        "adminTab-" + tab,
        "admin-" + tab,
        "admin" + title,
        tab + "Section"
    ];

    let target = null;

    for (const id of possibleIds) {
        target = getElement(id);
        if (target) break;
    }

    if (target) target.hidden = false;

    document.querySelectorAll(".admin-nav button").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) button.classList.add("active");

    try {

        await requireAdmin();

        if (tab === "overview") {
            await loadAdminOverview();
        }

        if (tab === "questions") {
            await loadAdminQuestions();
        }

        if (tab === "students") {
            await loadAdminStudents();
        }

        if (tab === "results") {
            await loadAdminResults();
        }

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// QUESTION MANAGER
// ==========================================

window.loadAdminQuestions = async function () {

    try {

        await requireAdmin();

        const { data, error } = await db()
            .from("questions")
            .select(`
                id,
                class_level,
                subject,
                chapter,
                difficulty,
                question_text,
                options,
                hint,
                source,
                source_year,
                created_at
            `)
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) throw error;

        const container = getElement("questionManagerList");

        if (!container) return;

        if (!data || data.length === 0) {
            container.textContent = "No questions found.";
            return;
        }

        container.innerHTML = data.map(question => `

            <div class="admin-question-card">

                <h3>${escapeHTML(question.question_text)}</h3>

                <p>
                    Class ${escapeHTML(question.class_level)}
                    • ${escapeHTML(question.subject)}
                    • ${escapeHTML(question.chapter)}
                </p>

                <p>Difficulty: ${escapeHTML(question.difficulty)}</p>

                <button onclick="editAdminQuestion(${question.id})">
                    ✏️ EDIT
                </button>

                <button onclick="deleteAdminQuestion(${question.id})">
                    🗑️ DELETE
                </button>

            </div>

        `).join("");

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// ADD / EDIT QUESTION
// ==========================================

window.saveAdminQuestion = async function () {

    try {

        await requireAdmin();

        const classLevel = Number(getElement("qClass").value);
        const subject = getElement("qSubject").value.trim();
        const chapter = getElement("qChapter").value.trim();
        const difficulty = getElement("qDifficulty").value;
        const questionText = getElement("qText").value.trim();
        const optionsText = getElement("qOptions").value.trim();
        const answerNumber = Number(getElement("qAnswer").value);
        const hint = getElement("qHint").value.trim();
        const explanation = getElement("qExplanation").value.trim();

        if (
            !classLevel ||
            !subject ||
            !chapter ||
            !questionText ||
            !optionsText
        ) {
            alert("Please fill all required question fields.");
            return;
        }

        let options;

        try {
            options = JSON.parse(optionsText);

            if (!Array.isArray(options)) {
                throw new Error();
            }

        } catch {

            options = optionsText
                .split("\n")
                .map(option => option.trim())
                .filter(Boolean);

        }

        if (options.length < 2) {
            alert("At least 2 options are required.");
            return;
        }

        if (
            !Number.isInteger(answerNumber) ||
            answerNumber < 1 ||
            answerNumber > options.length
        ) {
            alert("Enter the correct option number.");
            return;
        }

        const payload = {

            class_level: classLevel,
            subject,
            chapter,
            difficulty,
            question_text: questionText,
            options,
            correct_answer: answerNumber - 1,
            hint,
            explanation

        };

        let result;

        if (editingQuestionId !== null) {

            result = await db()
                .from("questions")
                .update(payload)
                .eq("id", editingQuestionId);

        } else {

            result = await db()
                .from("questions")
                .insert([payload]);

        }

        if (result.error) throw result.error;

        editingQuestionId = null;

        alert("Question saved successfully!");

        clearQuestionForm();

        await loadAdminQuestions();
        await loadAdminOverview();

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// EDIT QUESTION
// ==========================================

window.editAdminQuestion = async function (id) {

    try {

        await requireAdmin();

        const { data, error } = await db()
            .from("questions")
            .select(`
                id,
                class_level,
                subject,
                chapter,
                difficulty,
                question_text,
                options,
                hint
            `)
            .eq("id", id)
            .single();

        if (error) throw error;

        editingQuestionId = id;

        getElement("qClass").value = data.class_level;
        getElement("qSubject").value = data.subject;
        getElement("qChapter").value = data.chapter;
        getElement("qDifficulty").value = data.difficulty;
        getElement("qText").value = data.question_text;
        getElement("qOptions").value =
            JSON.stringify(data.options, null, 2);

        getElement("qHint").value = data.hint || "";

        // These columns are intentionally not exposed to the browser.
        // Re-enter their values when editing.
        getElement("qAnswer").value = "";
        getElement("qExplanation").value = "";

        alert(
            "Editing question. Re-enter the correct option number and explanation before saving."
        );

        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// DELETE QUESTION
// ==========================================

window.deleteAdminQuestion = async function (id) {

    if (!confirm("Delete this question permanently?")) return;

    try {

        await requireAdmin();

        const { error } = await db()
            .from("questions")
            .delete()
            .eq("id", id);

        if (error) throw error;

        alert("Question deleted successfully.");

        await loadAdminQuestions();
        await loadAdminOverview();

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// CLEAR QUESTION FORM
// ==========================================

window.clearQuestionForm = function () {

    const ids = [
        "qClass",
        "qSubject",
        "qChapter",
        "qDifficulty",
        "qText",
        "qOptions",
        "qAnswer",
        "qHint",
        "qExplanation"
    ];

    ids.forEach(id => {
        const element = getElement(id);
        if (element) element.value = "";
    });

    editingQuestionId = null;

};


// ==========================================
// STUDENT MANAGER - READ ONLY
// ==========================================

window.loadAdminStudents = async function () {

    try {

        await requireAdmin();

        const { data, error } = await db()
            .from("profiles")
            .select(`
                id,
                username,
                full_name,
                class_level,
                xp,
                streak,
                created_at
            `)
            .order("created_at", { ascending: false })
            .limit(200);

        if (error) throw error;

        const container = getElement("studentsList");

        if (!container) return;

        if (!data.length) {
            container.textContent = "No students registered yet.";
            return;
        }

        container.innerHTML = data.map(student => `

            <div class="admin-student-card">

                <h3>${escapeHTML(student.full_name || student.username)}</h3>

                <p>Username: ${escapeHTML(student.username)}</p>

                <p>Class: ${escapeHTML(student.class_level)}</p>

                <p>XP: ${escapeHTML(student.xp)}</p>

                <p>Streak: ${escapeHTML(student.streak)}</p>

                <p>Joined: ${escapeHTML(formatDate(student.created_at))}</p>

            </div>

        `).join("");

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// STUDENT RESULTS - READ ONLY
// ==========================================

window.loadAdminResults = async function () {

    try {

        await requireAdmin();

        const { data, error } = await db()
            .from("quiz_results")
            .select(`
                id,
                user_id,
                subject,
                chapter,
                total_questions,
                correct_answers,
                xp_earned,
                time_taken,
                created_at
            `)
            .order("created_at", { ascending: false })
            .limit(200);

        if (error) throw error;

        const container = getElement("resultsList");

        if (!container) return;

        if (!data.length) {
            container.textContent = "No quiz results available.";
            return;
        }

        container.innerHTML = data.map(result => `

            <div class="admin-result-card">

                <h3>${escapeHTML(result.subject)}</h3>

                <p>Chapter: ${escapeHTML(result.chapter)}</p>

                <p>
                    Score:
                    ${escapeHTML(result.correct_answers)}
                    /
                    ${escapeHTML(result.total_questions)}
                </p>

                <p>XP Earned: ${escapeHTML(result.xp_earned)}</p>

                <p>Time: ${escapeHTML(result.time_taken)} seconds</p>

                <p>User ID: ${escapeHTML(result.user_id)}</p>

                <p>Date: ${escapeHTML(formatDate(result.created_at))}</p>

            </div>

        `).join("");

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// ADMIN LOGOUT
// ==========================================

window.adminLogout = async function () {

    if (!confirm("Are you sure you want to logout?")) return;

    try {

        if (db()) {
            const { error } = await db().auth.signOut();
            if (error) throw error;
        }

        adminVerified = false;

        const dashboard = getElement("adminDashboard");
        if (dashboard) dashboard.hidden = true;

        getElement("adminLogin").hidden = false;

        setText("adminMessage", "Logged out successfully.");

        alert("Admin logged out.");

    } catch (error) {
        showError(error);
    }

};


// ==========================================
// DEBUG STATUS
// ==========================================

console.log("JARVIS IQ Admin JS Loaded");
console.log("Supabase Library:", !!window.supabase);
console.log("Supabase Client:", !!window.supabaseClient);
