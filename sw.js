/* Release procedure: bump VERSION and index.html app-release together.
   All six assets must be available before a new worker can activate. */
'use strict';
const VERSION='2026-10-12.2';
const PREFIX='macau-rewards-offline-';
const CACHE=PREFIX+VERSION;
const ROOT=new URL('./',self.location.href);
const ASSETS=['index.html','manifest.webmanifest','icons/icon-32.png','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
const absolute=path=>new URL(path,ROOT).href;
async function installShell(){
 const responses=await Promise.all(ASSETS.map(async path=>{
  const url=new URL(path,ROOT);url.searchParams.set('offline-release',VERSION);
  const response=await fetch(new Request(url.href,{cache:'reload',credentials:'same-origin'}));
  if(!response.ok||response.type==='opaque')throw Error('Offline asset unavailable: '+path);
  if(path==='index.html'&&!(await response.clone().text()).includes('name="app-release" content="'+VERSION+'"'))throw Error('HTML release does not match worker');
  if(path.endsWith('.png')&&!(response.headers.get('content-type')||'').includes('image/png'))throw Error('Invalid image response');
  if(path==='manifest.webmanifest')await response.clone().json();
  return [absolute(path),response];
 }));
 try{const cache=await caches.open(CACHE);await Promise.all(responses.map(([url,response])=>cache.put(url,response)))}catch(error){await caches.delete(CACHE);throw error}
}
self.addEventListener('install',event=>event.waitUntil(installShell()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='OFFLINE_STATUS')event.waitUntil((async()=>{
  const cache=await caches.open(CACHE),all=await Promise.all(ASSETS.map(path=>cache.match(absolute(path))));
  event.ports?.[0]?.postMessage({type:'OFFLINE_STATUS',version:VERSION,ready:all.every(Boolean)});
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 const path=url.pathname.slice(ROOT.pathname.length);
 // Only app document routes use the HTML fallback; missing scripts/images never get HTML.
 if(req.mode==='navigate'&&(path===''||path==='index.html')){
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(absolute('index.html'));if(cached)return cached;try{return await fetch(req)}catch{return new Response('離線檔案已被移除，請連網重新開啟程式。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})}})());return;
 }
 if(ASSETS.includes(path))event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(absolute(path));return cached||fetch(req)})());
});
