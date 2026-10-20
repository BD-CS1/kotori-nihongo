const CACHE='kotori-v1-20261020';
const CORE=['./','index.html','styles.css','data.js','core.js','app.js','manifest.webmanifest','assets/icon.svg','assets/strokes.json','analyzer-worker.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(async path=>{const r=await fetch(new Request(path,{cache:'reload'}));if(r.ok&&!r.redirected)await c.put(path,r);}))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kotori-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/.well-known/')||u.pathname.includes('/cdn-cgi/'))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(async()=>await caches.match('index.html')||await caches.match('./')));return;}
const ext=/\.(js|css|json|svg|gz|webmanifest|txt|md)$/i.test(u.pathname);if(!ext)return;
e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request);if(cached)return cached;const r=await fetch(e.request);if(r.ok&&!r.redirected&&new URL(r.url).origin===u.origin)c.put(e.request,r.clone());return r;}));});
