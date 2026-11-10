// ======================================
// JARVIS IQ - ADMIN AUTHENTICATION
// ======================================

// Supabase Project URL
const SUPABASE_URL =
"https://ftbtsnylhyaskftmqtre.supabase.co";

// अपनी पूरी Publishable Key यहाँ डालो
const SUPABASE_KEY = "sb_publishable_WlOXFSWJ2tSJ_Q2D5WiVog_Uprgo-Dm-qiKwsGz4jJHLVPpQ_m75FM9MJ";

// Check Supabase library
if (!window.supabase) {
alert("Supabase library failed to load. Please refresh.");
throw new Error("Supabase library not loaded");
}

// Check configuration
if (
!SUPABASE_KEY.startsWith("sb_publishable_") ||
SUPABASE_KEY === "PASTE_FULL_SB_PUBLISHABLE_KEY_HERE"
) {
console.error("Supabase Publishable Key is missing or incomplete.");
} else {
window.supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);
}

// Open Admin Login
window.openAdminLogin = function () {
document.getElementById("adminLogin").hidden = false;
document.getElementById("adminEmail").focus();
};

// Close Admin Login
window.closeAdminLogin = function () {
document.getElementById("adminLogin").hidden = true;
document.getElementById("adminMessage").textContent = "";
};

// Admin Login
window.adminLogin = async function () {
const email = document.getElementById("adminEmail").value.trim();
const password = document.getElementById("adminPassword").value;
const message = document.getElementById("adminMessage");

if (!email || !password) {
message.textContent = "Enter your email and password.";
return;
}

if (!window.supabaseClient) {
message.textContent = "Invalid or missing Supabase Publishable Key.";
return;
}

message.textContent = "Verifying admin account...";

try {
// Authenticate user
const { data, error } =
await window.supabaseClient.auth.signInWithPassword({
email: email,
password: password
});

if (error) throw error;

// Verify Super Admin role
const { data: admin, error: roleError } =
  await window.supabaseClient
    .from("admin_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "super_admin")
    .maybeSingle();

if (roleError) throw roleError;

if (!admin) {
  await window.supabaseClient.auth.signOut();
  message.textContent = "Access denied: Super Admin only.";
  return;
}

message.textContent = "SUCCESS: Super Admin verified!";
document.getElementById("adminPassword").value = "";

alert("Welcome, JARVIS IQ Super Admin!");

} catch (error) {
console.error("Admin Login Error:", error);
message.textContent = error.message || "Login failed.";
}
};
