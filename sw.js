const VERSION = '0.5.1';
const CACHE = 'academia-' + VERSION;
const ASSETS = [
  // ASSETS-START
  './',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './index.html',
  './manifest.webmanifest',
  './src/actions/workout.js',
  './src/app.js',
  './src/data/daily.js',
  './src/data/db.js',
  './src/data/exercises.js',
  './src/data/prefs.js',
  './src/data/program.js',
  './src/domain/backup.js',
  './src/domain/body.js',
  './src/domain/dates.js',
  './src/domain/draft.js',
  './src/domain/goals.js',
  './src/domain/history.js',
  './src/domain/numbers.js',
  './src/domain/plan.js',
  './src/domain/profile.js',
  './src/domain/progress.js',
  './src/domain/progression.js',
  './src/domain/protein.js',
  './src/domain/records.js',
  './src/domain/reminder.js',
  './src/domain/report.js',
  './src/domain/timer.js',
  './src/domain/units.js',
  './src/domain/week.js',
  './src/platform/device.js',
  './src/ui/backup.js',
  './src/ui/body.js',
  './src/ui/chart.js',
  './src/ui/datefmt.js',
  './src/ui/dom.js',
  './src/ui/exercise.js',
  './src/ui/firstday.js',
  './src/ui/history.js',
  './src/ui/onboarding.js',
  './src/ui/protein.js',
  './src/ui/reasons.js',
  './src/ui/reminder.js',
  './src/ui/report.js',
  './src/ui/settings.js',
  './src/ui/summary.js',
  './src/ui/tabs.js',
  './src/ui/today.js',
  './src/ui/video.js',
  './src/ui/workout.js',
  './src/version.js',
  './styles.css',
  // ASSETS-END
];

// Pre-cache atomico: ou a versao inteira entra no cache, ou nao instala.
// Cada arquivo e pedido com cache: 'reload' (ignora o cache HTTP do navegador): o GitHub Pages
// entrega os arquivos com cache de 10 minutos, e sem isso uma versao publicada logo depois da
// anterior poderia guardar arquivos velhos no pre-cache.
// Sem ativacao forcada e sem tomar clientes: uma versao nova espera todas as janelas
// do app fecharem, para nunca trocar o codigo no meio de um treino.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
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
