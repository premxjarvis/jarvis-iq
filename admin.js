// ======================================
// JARVIS IQ - SECURE ADMIN AUTHENTICATION
// ======================================

const SUPABASE_URL = "https://ftbtsnylhyaskftmqtre.supabase.co";

// अपनी पूरी Publishable Key यहाँ डालना।
const SUPABASE_KEY = "sb_publishable_D__I3-qiKwsGz4jJHLVPpQ_m75FM9MJ";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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
    message.textContent = "Please enter email and password.";
    return;
  }

  message.textContent = "Verifying admin account...";

  try {
    // Authenticate user
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    // Verify admin role from database
    const { data: admin, error: roleError } =
      await supabaseClient
        .from("admin_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

    if (roleError) throw roleError;

    if (!admin) {
      await supabaseClient.auth.signOut();
      message.textContent = "Access denied: You are not an admin.";
      return;
    }

    message.textContent = "✅ Admin verified successfully!";

    document.getElementById("adminPassword").value = "";

    alert("Welcome, JARVIS IQ Super Admin!");

    // Dashboard will be connected in the next step.

  } catch (error) {
    console.error("Admin login error:", error);
    message.textContent = error.message || "Login failed.";
  }
};
