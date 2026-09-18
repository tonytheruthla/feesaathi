// FeeSaathi service worker — minimal: makes the app installable and
// claims clients immediately on update. Network-first everything;
// no offline caching yet (the app is API-driven).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
