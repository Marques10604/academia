const VERSION = '0.1.0';
const CACHE = 'academia-' + VERSION;
const ASSETS = [
  // ASSETS-START
  './',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './manifest.webmanifest',
  './src/actions/workout.js',
  './src/app.js',
  './src/data/db.js',
  './src/data/exercises.js',
  './src/data/program.js',
  './src/domain/dates.js',
  './src/domain/draft.js',
  './src/domain/history.js',
  './src/domain/numbers.js',
  './src/domain/plan.js',
  './src/domain/progression.js',
  './src/ui/dom.js',
  './src/ui/exercise.js',
  './src/ui/onboarding.js',
  './src/ui/reasons.js',
  './src/ui/settings.js',
  './src/ui/summary.js',
  './src/ui/today.js',
  './src/ui/workout.js',
  './src/version.js',
  './styles.css',
  // ASSETS-END
];

// Pre-cache atomico: ou a versao inteira entra no cache, ou nao instala.
// Sem ativacao forcada e sem tomar clientes: uma versao nova espera todas as janelas
// do app fecharem, para nunca trocar o codigo no meio de um treino.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('academia-') && k !== CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      if (req.mode === 'navigate') return caches.match('./index.html');
      return fetch(req);
    })
  );
});
