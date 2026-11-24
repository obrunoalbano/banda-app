/*
 * Service worker do banda app (PWA). Escopo mínimo e seguro para um app com dados privados:
 * - NÃO guarda páginas nem respostas da API em cache (dados de banda mudam e são por usuário).
 * - Navegação: sempre rede; sem internet, mostra a página /offline (guardada na instalação).
 * - Ícones e a página offline ficam em cache para abrir o app sem conexão.
 * Ao mudar este arquivo, suba CACHE (o navegador troca o worker e apaga o cache antigo).
 */
const CACHE = "banda-app-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
