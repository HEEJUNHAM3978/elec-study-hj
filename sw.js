const CACHE = "elec-study-v63";
const ART_CACHE = "elec-art-v38";
const ASSETS = [
  "./전기기사-공부앱.html",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== ART_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var isPage = e.request.mode === "navigate" || /\.html(\?|$)|\/$/.test(new URL(e.request.url).pathname);
  if (isPage) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" }).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) { return hit || caches.match("./전기기사-공부앱.html"); });
      })
    );
    return;
  }
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;           /* DAS 동기화 등 다른 주소는 건드리지 않는다 */
  var isImg = /\.(webp|png|jpe?g|gif|svg)$/i.test(url.pathname);
  /* 캐릭터 그림(game-art/...)은 처음 쓸 때 받아 그림 캐시에 넣고, 다음부터는 캐시에서 바로 쓴다 */
  var cacheName = /\/game-art\//.test(url.pathname) ? ART_CACHE : CACHE;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(cacheName).then(function (c) { c.put(e.request, copy); }); }
        return res;
      }).catch(function () { return isImg ? new Response("", { status: 504 }) : caches.match("./전기기사-공부앱.html"); });
    })
  );
});
