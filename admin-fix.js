const SUPABASE_URL="https://mqfipqpmsuapfctotjzo.supabase.co";
const SUPABASE_KEY="sb_publishable_4sFZXYku2HwgJ7wvHWwKLA_tN-nKxk-";

async function bscAuth(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(SUPABASE_URL + "/auth/v1/" + path, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: controller.signal, cache: "no-store"
    });
    const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch {}
    if (!r.ok) throw new Error(d.error_description || d.msg || d.message || t || "Login gagal");
    return d;
  } finally { clearTimeout(timer); }
}

async function bscUser(token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + token },
    cache: "no-store"
  });
  if (!r.ok) throw new Error("Session expired");
  return r.json();
}

async function login() {
  const b = document.getElementById("loginBtn"), m = document.getElementById("loginMsg");
  b.disabled = true; m.textContent = "Memproses login...";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    if (!email || !password) throw new Error("Email dan password wajib diisi.");
    const d = await bscAuth("token?grant_type=password", { email, password });
    if (!d.access_token) throw new Error("Token login tidak diterima.");
    accessToken = d.access_token;
    sessionStorage.setItem("bsc_admin_token", d.access_token);
    if (d.refresh_token) sessionStorage.setItem("bsc_admin_refresh", d.refresh_token);
    showApp(email); await loadAll(); toast("Login berhasil");
  } catch (e) {
    m.textContent = e.name === "AbortError" ? "Koneksi timeout. Coba LOGIN lagi." : (e.message || "Login gagal");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("login").classList.remove("hidden");
  } finally { b.disabled = false; }
}

async function restore() {
  const token = sessionStorage.getItem("bsc_admin_token");
  const refresh = sessionStorage.getItem("bsc_admin_refresh");
  if (!token && !refresh) return;

  try {
    if (token) {
      const u = await bscUser(token);
      accessToken = token;
      showApp(u.email || "Admin");
      await loadAll();
      return;
    }
  } catch (_) {}

  if (!refresh) {
    sessionStorage.removeItem("bsc_admin_token");
    sessionStorage.removeItem("bsc_admin_refresh");
    return;
  }

  try {
    const d = await bscAuth("token?grant_type=refresh_token", { refresh_token: refresh });
    accessToken = d.access_token;
    sessionStorage.setItem("bsc_admin_token", d.access_token);
    if (d.refresh_token) sessionStorage.setItem("bsc_admin_refresh", d.refresh_token);
    const u = await bscUser(d.access_token);
    showApp(u.email || "Admin");
    await loadAll();
  } catch (e) {
    sessionStorage.removeItem("bsc_admin_token");
    sessionStorage.removeItem("bsc_admin_refresh");
    document.getElementById("loginMsg").textContent = "Sesi berakhir. Silakan login kembali.";
  }
}

/* Never let the service worker/browser cache authenticated Supabase GET responses. */
window.api = async function(path, opt = {}) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...opt,
    cache: "no-store",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      ...(opt.headers || {})
    }
  });
  const t = await r.text();
  let d = null; try { d = t ? JSON.parse(t) : null; } catch {}
  if (!r.ok) throw new Error((d && (d.message || d.error)) || t || ("HTTP " + r.status));
  return d;
};
