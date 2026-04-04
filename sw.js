// ─────────────────────────────────────────────────────────────────────────────
//  Verbarium PRO — Service Worker
//  Estratégia: Offline-First com cache versionado
//  Versão do cache: mude CACHE_VERSION para forçar atualização em todos os
//  dispositivos dos usuários quando você publicar uma nova versão do app.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'verbarium-v1.0.0';

// Recursos que serão cacheados na instalação (essenciais para offline)
const CORE_ASSETS = [
  '/verbarium/',
  '/verbarium/index.html',
  '/verbarium/manifest.json',
  '/verbarium/firebase-config.js',
  '/verbarium/icons/icon-192.png',
  '/verbarium/icons/icon-512.png',
];

// CDN resources — cacheados na primeira visita, servidos offline depois
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.3/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Playfair+Display+SC:wght@400;700&family=EB+Garamond:ital,wght@0,400;1,400&family=Lora:ital,wght@0,400;1,400&family=Josefin+Sans:wght@300;400;600&family=Spectral:ital,wght@0,400;1,400&display=swap',
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
// Roda uma vez quando o SW é instalado.
// Cacheia todos os core assets e tenta cachear os CDN assets.
self.addEventListener('install', event => {
  console.log('[SW] Instalando Verbarium v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {
      // Core assets — obrigatórios
      await cache.addAll(CORE_ASSETS);
      console.log('[SW] Core assets cacheados ✓');

      // CDN assets — tentativa (pode falhar se offline na primeira vez)
      const cdnPromises = CDN_ASSETS.map(url =>
        cache.add(url).catch(err => {
          console.warn('[SW] CDN não disponível offline ainda:', url.slice(0, 60));
        })
      );
      await Promise.allSettled(cdnPromises);
      console.log('[SW] CDN assets processados ✓');

      // Força ativação imediata sem esperar o tab fechar
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
// Remove caches de versões antigas para liberar espaço.
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Verbarium v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_VERSION)
          .map(name => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Ativo e controlando todos os clientes ✓');
      return self.clients.claim();
    })
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
// Estratégia Offline-First:
//   1. Verifica o cache primeiro
//   2. Se não estiver no cache, busca na rede
//   3. Salva a resposta da rede no cache para uso futuro
//   4. Se a rede falhar e não houver cache, retorna página offline

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora requests que não sejam GET
  if (event.request.method !== 'GET') return;

  // Ignora chrome-extension e outros protocolos
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Cache hit — retorna imediatamente e atualiza em background (stale-while-revalidate)
        const networkUpdate = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_VERSION).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => { /* offline — sem problema, já temos o cache */ });

        return cachedResponse;
      }

      // Cache miss — busca na rede e cacheia
      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline e sem cache — retorna fallback para HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ─── SYNC (opcional — para Google Drive no futuro) ───────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'verbarium-sync') {
    console.log('[SW] Background sync disparado');
    // Implementação futura: sincronizar com Google Drive
  }
});

// ─── MENSAGENS ───────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Verbarium Service Worker carregado — versão', CACHE_VERSION);
