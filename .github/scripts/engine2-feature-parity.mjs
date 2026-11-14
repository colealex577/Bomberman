import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..');
const reference=JSON.parse(fs.readFileSync(path.join(root,'.github/fixtures/engine2-baseline-manifest.json'),'utf8'));
const baseline=path.resolve(root,'../baseline');
const changed202=JSON.parse(fs.readFileSync(path.join(root,'ENGINE2_202_CHANGED_FILES.json'),'utf8'));
const changed210=JSON.parse(fs.readFileSync(path.join(root,'ENGINE2_210_CHANGED_FILES.json'),'utf8'));
const changed211=JSON.parse(fs.readFileSync(path.join(root,'ENGINE2_211_CHANGED_FILES.json'),'utf8'));
const changedRetry=JSON.parse(fs.readFileSync(path.join(root,"ENGINE2_212_CHANGED_FILES.json"),"utf8"));
const excluded=new Set([...changedRetry,...changed211,...changed210,...changed202.map(p=>'Bomberman-Ultimate-Universal-Web-v0.10/'+p),
  'Bomberman-Ultimate-Universal-Web-v0.10/index.html',
  'Bomberman-Ultimate-Universal-Web-v0.10/sw.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/app.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/js/InputEngine.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/js/GameEngine.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/preload-v0150.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v0161-speed-standard.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016211-travel-chat-drops.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016214-launch-speed-version.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016215-bomb-travel.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016221-return-controls.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016222-return-defense-controls.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016230-round-skill-version.js',
  'Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v0130-social.js'
]);
function files(dir){const acc=[];function scan(sub=''){for(const d of fs.readdirSync(path.join(dir,sub),{withFileTypes:true})){
 if(d.name==='.git')continue;const p=path.join(sub,d.name);if(d.isDirectory())scan(p);else acc.push(p.replaceAll(path.sep,'/'))}}scan();return acc}
const old=Object.keys(reference.sha256).sort(),now=files(root);let preserved=0;
assert.equal(reference.commit,'210388cb9888e82b42ce9c844ba65e1c04f94aaf');
for(const f of old){
 assert.ok(now.includes(f),'MISSING ORIGINAL SOURCE OR ASSET: '+f);
 if(excluded.has(f))continue;
 const oldHash=reference.sha256[f];
 const newHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
 assert.equal(newHash,oldHash,'UNCHANGED FEATURE SOURCE MUTATED: '+f);preserved++;
}
const prior202=JSON.parse(fs.readFileSync(path.join(root,'.github/fixtures/engine2-202-manifest.json'),'utf8'));
const approved210=new Set([...changed210,...changed211,...changedRetry]);let preserved202=0;
for(const [f,h] of Object.entries(prior202.sha256)){assert.ok(now.includes(f),'MISSING 2.0.2 SOURCE: '+f);if(approved210.has(f))continue;assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'),h,'UNDECLARED CHANGE: '+f);preserved202++;}
console.log('2.0.2 BASELINE INVENTORY',JSON.stringify({retained:Object.keys(prior202.sha256).length,byteIdentical:preserved202,declaredChanges:approved210.size}));
const game=path.join(root,'Bomberman-Ultimate-Universal-Web-v0.10');
const html=fs.readFileSync(path.join(game,'index.html'),'utf8');
const app=fs.readFileSync(path.join(game,'files/app.js'),'utf8');
const loader=fs.readFileSync(path.join(game,'files/engine2/runtime-loader.js'),'utf8');
const kick=fs.readFileSync(path.join(game,'files/runtime-v0160-bomb-kick.offline.js'),'utf8');
const ai=fs.readFileSync(path.join(game,'files/runtime-v0162-ai-core.offline.js'),'utf8');
const lb=fs.readFileSync(path.join(game,'files/runtime-v0127-leaderboard.js'),'utf8');
const multi=fs.readFileSync(path.join(game,'files/multiplayer-v0129.js'),'utf8');
const net=fs.readFileSync(path.join(game,'files/net-v0115-core.js'),'utf8');
const pub=fs.readFileSync(path.join(game,'files/runtime-v016223-public-presence-controls.js'),'utf8');
const friend=fs.readFileSync(path.join(game,'files/runtime-v016225-friends-game-routing.js'),'utf8');
const manifest=JSON.parse(loader.match(/var MANIFEST=(\[[\s\S]*?\]);/)[1]);
const checks={
  bombKick: /function\s+(?:startBombMoving|traceRoute)/.test(kick)&&/kick/.test(kick),
  aiProfiles: /humanProfile/.test(ai)&&/standardProfile/.test(ai),
  offlineRuntime: ['runtime-v0160-bomb-kick.offline.js','runtime-v0162-ai-core.offline.js','runtime-v01626-ai-test-room.offline.js'].every(x=>fs.existsSync(path.join(game,'files',x))),
  leaderboard: /BombermanRatingV1/.test(lb),
  multiplayer: /BomberMultiplayer/.test(multi),
  peerConnection: /function\(.*\)|new Peer|loadPeer/.test(net),
  publicMatchmaking: /fallbackDeadline/.test(pub),
  privateFriends: /throwDirectionIndex|friend/i.test(friend),
  localControls: /localMultiBtn/.test(html),
  audio: fs.existsSync(path.join(game,'files/sound/game.ogg')),
  scoring: /Top 10 victory/.test(fs.readFileSync(path.join(game,'files/runtime-v0127.js'),'utf8')),
  stage: /id="canvas"/.test(html),
  serviceWorker: /sw\.js\?v=211/.test(app),
  compatibilityManifest: manifest.length===39 && manifest.filter(x=>x.kind==='packed').length===3,
  newLifecycle: /BomberEngine2Lifecycle/.test(fs.readFileSync(path.join(game,'files/js/GameEngine.js'),'utf8')),
  oldSourceUnmodified: preserved===old.filter(f=>!excluded.has(f)).length
};
for(const [name,ok] of Object.entries(checks))assert.ok(ok,'Missing or disconnected feature contract: '+name);
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x=>x[1]),loaded=manifest.map(x=>x.src);
let checkedPaths=0;for(const p of [...scripts,...loaded]){
 assert.ok(fs.existsSync(path.join(game,p.split('?')[0])),'Missing script reference: '+p);checkedPaths++;
}
console.log('ENGINE2 FEATURE INVENTORY PASS',JSON.stringify({priorFiles:old.length,retained:old.length,byteIdentical:preserved,changed:old.length-preserved,added:now.length-old.length,checks,scriptRefs:checkedPaths}));
