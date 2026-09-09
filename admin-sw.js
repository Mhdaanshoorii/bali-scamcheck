const CACHE = "bsc-admin-v11";
const SHELL = ["./admin.html", "./admin-manifest.json", "./icon.png", "./admin-fix.js"];

async function injectFix(response) {
  if (!response) return response;
  const text = await response.text();
  if (text.includes("admin-fix.js")) return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  const patched = text.replace("</body>", '<script src="./admin-fix.js?v=11"></script>\n</body>');
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(patched, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of SHELL) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (url.endsWith("admin.html")) {
          await cache.put(url, await injectFix(r));
        } else if (r.ok) {
          await cache.put(url, r.clone());
        }
      } catch (_) {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("bsc-admin-") && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  /* Critical: never cache Supabase/auth/API traffic. */
  if (url.origin !== self.location.origin) return;
  if (req.method !== "GET") return;

  if (url.pathname.endsWith("/admin.html") || url.pathname.endsWith("/admin.html/")) {
    event.respondWith((async () => {
      try {
        const r = await fetch(req, { cache: "no-store" });
        const patched = await injectFix(r.clone());
        const c = await caches.open(CACHE);
        await c.put("./admin.html", patched.clone());
        return patched;
      } catch (_) {
        return caches.match("./admin.html");
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const r = await fetch(req);
      const c = await caches.open(CACHE);
      if (r.ok) await c.put(req, r.clone());
      return r;
    } catch (_) {
      return cached || caches.match("./admin.html");
    }
  })());
});
