#!/bin/sh
set -eu
RACOTA_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
sh "$RACOTA_ROOT/deploy/racota.sh" config --quiet
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T racota-gateway nginx -t
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T backend python manage.py check --deploy
sh "$RACOTA_ROOT/deploy/racota.sh" exec -T frontend node -e '
const assert=require("node:assert/strict");
(async()=>{
 const gateway="http://racota-gateway:8080";
 for(const [path,host] of [["/az","racotagames.com"],["/api/games/","app.racotagames.com"],["/api/backend/auth/session/","racotagames.com"],["/healthz","app.racotagames.com"]]){
  const r=await fetch(gateway+path,{headers:{Host:host,"X-Forwarded-Proto":"https"}});
  assert.equal(r.status,200,host+path);
  if(path==="/az"){const body=await r.text();assert(body.includes("https://racotagames.com/az"));assert(!body.includes("http://backend:8000/media/"));}
  if(path.endsWith("session/")){const cookie=r.headers.get("set-cookie")||"";assert(cookie.includes("Secure"));assert(!cookie.includes("Domain="));}
 }
 const robots=await fetch(gateway+"/robots.txt",{headers:{Host:"racotagames.com"}}).then(r=>r.text());
 assert(robots.includes("https://racotagames.com/sitemap.xml"));
 const map=await fetch(gateway+"/sitemap.xml",{headers:{Host:"racotagames.com"}}).then(r=>r.text());
 assert(map.includes("https://racotagames.com/en/about"));
 console.log("Internal gateway, domains, cookies, API, sitemap and robots verified.");
})().catch(e=>{console.error(e.message);process.exit(1)});'
