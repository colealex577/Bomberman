import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'../..'),files=path.join(root,'Bomberman-Ultimate-Universal-Web-v0.10','files');
const src=f=>fs.readFileSync(path.join(files,f),'utf8');
function extract(code,name,target){const start=code.indexOf('function '+name+'(');assert(start>=0,name);const brace=code.indexOf('{',start);let depth=0,quote='',escaped=false,end=-1;for(let i=brace;i<code.length;i++){const c=code[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break}}assert(end>start);return code.slice(start,end).replace('function '+name+'(','function '+target+'(')}
// Real installers under compressed time, with all competing marker writers included.
function stress(){
 const writes={},calls={},protos={};
 for(const [owner,props] of Object.entries({Player:['placeBomb','tryKickBomb','throwBombNow','setBombsListener','detectBombCollision','detectFireCollision'],Bot:['plantBomb','setNextTile','chooseNextAction','isSafe','beginEscapePlan','trackedBombStillDangerous','activeBombCount','hasBomb'],Bomb:['update','explode'],Bonus:['init'],GameEngine:['setup','drawBonuses'],BomberKick160:['startBombMoving']})){
  const proto={};for(const prop of props){const key=owner+'.'+prop;writes[key]=0;calls[key]=0;let f=function(){calls[key]++;return false};Object.defineProperty(proto,prop,{get(){return f},set(v){writes[key]++;f=v},configurable:true})}protos[owner]=owner==='BomberKick160'?proto:{prototype:proto};
 }
 const c=vm.createContext({window:null,console,...protos,markTravel(){},markCompat(f){for(const k of ['__v16215Travel','__v16211OwnerGrace','__v16212OwnerPass','__v16214LaunchSpeed'])f[k]=true;return f},G(){return {bombs:[],players:[],bots:[]}},movingTravel(){return false},outward(){return false},updateTravelState(){},updateFallbackTravel(){},ownerOf(){return null},ownerImpactProtected(){return false},moving(){return false},clone(p){return p},mirrorTypeAt(){return ''},renderKick(){},renderHeart(){},defend(){return false},redirect(a,p){return p},blocked:0,detours:0,kickCount(){return 0},planTypes(){return []},actual(){return null},norm(d){return d}});c.window=c;
 const defs=[
 ['runtime-v016211-travel-chat-drops.js','patchStartMoving','start211'],['runtime-v016211-travel-chat-drops.js','patchActorKick','actor211'],['runtime-v016211-travel-chat-drops.js','patchBombUpdate','update211'],['runtime-v016211-travel-chat-drops.js','patchReturnCap','explode211'],
 ['runtime-v016212-owner-pass.js','patchTravelMarking','travel212'],['runtime-v016212-owner-pass.js','patchBombUpdate','update212'],['runtime-v016212-owner-pass.js','patchPlayerCollision','collision212'],['runtime-v016212-owner-pass.js','patchBonuses','bonuses212'],
 ['runtime-v016213-front-launch.js','patchStarts','start213'],['runtime-v016214-launch-speed-version.js','patchStarts','start214'],['runtime-v016214-launch-speed-version.js','patchBombSpeed','update214'],['runtime-v016215-bomb-travel.js','patchStarts','start215'],['runtime-v016215-bomb-travel.js','patchBombUpdate','update215'],['runtime-v016216-wall-response.js','patchBombUpdate','update216'],
 ['runtime-v016219-travel-capacity-ai.js','patchPlayerCapacity','capacity219'],['runtime-v016219-travel-capacity-ai.js','patchBotRemoteSafety','safety219'],['runtime-v016221-return-controls.js','patchLaunchStampAndLead','stamp221'],['runtime-v016221-return-controls.js','patchDirectThrow','throw221'],['runtime-v016221-return-controls.js','patchBombUpdate','update221'],['runtime-v016221-return-controls.js','patchFireFeedback','fire221'],['runtime-v016222-return-defense-controls.js','patchPlayer','throw222'],['runtime-v016222-return-defense-controls.js','patchAI','ai222'],['runtime-v016222-return-defense-controls.js','patchTokens','tokens222'],['runtime-v016233-opening-kick-guard.js','install','guard233'],['runtime-v016234-border-only.js','install','guard234'],['runtime-v0161-bomb-kick-polish.js','installImpactPatch','impact161'],['runtime-v0161-bomb-kick-polish.js','installBonusIconPatch','icon161'],['runtime-v0161-bomb-kick-polish.js','installRoundPatch','round161'],['runtime-v0161-bomb-kick-compat.js','patchBonus','compat161']];
 for(const [f,n,target] of defs)vm.runInContext(extract(src(f),n,target),c,{filename:f+':'+n});
 // Initial construction and all subsequent periodic compatibility checks. Test both early and late installs.
 for(const [,,name] of defs)c[name]();const initial={...writes};
 for(let t=0;t<600000;t+=20){for(let i=0;i<defs.length;i++){const interval=[60,100,120,140,180][i%5];if(t%interval===0)c[defs[i][2]]()}}
 for(const key of ['Player.placeBomb','Player.tryKickBomb','BomberKick160.startBombMoving','Bomb.update','Bomb.explode','Bonus.init','GameEngine.setup','GameEngine.drawBonuses','Bot.setNextTile','Bot.chooseNextAction','Bot.plantBomb','Player.throwBombNow','Player.setBombsListener'])assert.equal(writes[key],initial[key],key+' kept wrapping');
 c.Player.prototype.placeBomb.call({bombs:[],bombKickArmed:false});assert.equal(calls['Player.placeBomb'],1);
 c.Bomb.prototype.update.call({exploded:true});assert.equal(calls['Bomb.update'],1);
 return {assignments:writes,minutes:10};
}
function rounds(){
 const events={};let activeCalls=0,remoteCalls=0,hostCalls=0;const g={players:[],bots:[],bombs:[],stage:{addChild(){}},menu:{visible:false},playing:true,matchFinished:false,lobbyOpen:false,ultimateMode:false,getTileMaterial(){return "grass"},__setupSerial:0};
 const c=vm.createContext({window:null,console,gGameEngine:g,B115:{role:'offline'},document:{addEventListener(n,f){(events[n]??=[]).push(f)}},Utils:{comparePositions:(a,b)=>a.x===b.x&&a.y===b.y,convertToEntityPosition:b=>({x:Math.round(b.x/32),y:Math.round(b.y/32)}),removeFromArray(a,b){const i=a.indexOf(b);if(i>=0)a.splice(i,1)}},setupActor(a){a.bombKickCharges??=0},same:(a,b)=>a.x===b.x&&a.y===b.y,clone:a=>({...a}),refreshHud(){},targetFor(){return null},consumeCharge(a){a.bombKickCharges--},startBombMoving(b,d,a){b.__v160Moving=true;b.moveDirection=d;b.bmp={x:(b.position.x+1)*32,y:b.position.y*32}},Bomb:function(p,s){this.position=p;this.strength=s;this.bmp={};this.exploded=false;this.setExplodeListener=f=>this.done=f}});c.window=c;
 for(const f of ['js/core.js','engine2/round-state.js','engine2/input-controller.js','js/InputEngine.js'])vm.runInContext(src(f),c);
 c.Player={prototype:{}};const packed=src('runtime-v0160-bomb-kick.offline.js');const a=packed.indexOf('Player.prototype.placeBomb=function()'),b=packed.indexOf('Player.prototype.update=function()',a);vm.runInContext(packed.slice(a,b),c);
 c.G=()=>g;c.ensureBomb=()=>{};for(const n of ["canPlace","plant","kickPlant"])vm.runInContext(extract(src("multiplayer-v0129.js"),n,n),c);
 c.gInputEngine.setup();let prior;
 for(let round=1;round<=20;round++){
  g.__setupSerial=round;g.bombs=[];c.gInputEngine.removeAllListeners();c.BomberEngine2Input.resetActions(c.gInputEngine);
  const p=Object.assign(Object.create(c.Player.prototype),{id:0,alive:true,velocity:2,position:{x:1,y:1},controls:{bomb:'bomb'},bombs:[{position:{x:99,y:99},exploded:false}],bombsMax:1,bombStrength:1,bombKickCharges:1,bombKickArmed:false,getBombKickDirection(){return {x:1,y:0}}});
  const p2=Object.assign(Object.create(c.Player.prototype),{id:1,alive:true,position:{x:15,y:11},controls:{bomb:'bomb2'},bombs:[],bombsMax:1,bombStrength:1,bombKickCharges:0});g.players=[p,p2];
  // Deliberately leave a stale listener: round-owned dispatch must target the new player, not the old closure.
  c.gInputEngine.addListener('bomb',()=>{activeCalls++;if(prior)prior.placeBomb()});
  for(const cb of events.keyup)cb({keyCode:32,target:null,preventDefault(){}});
  assert.equal(g.bombs.length,1,'round '+round+' normal placement lost');assert.equal(g.bombs[0].owner,p);assert.equal(p.bombs.length,1);assert.equal(activeCalls,0);
  assert.equal(c.BomberEngine2Round.normal(p),false,'occupied tile accepted');p.position={x:2,y:1};assert.equal(c.BomberEngine2Round.normal(p),false,'capacity exceeded');
  const first=g.bombs[0];first.exploded=true;g.bombs=[]; // stale object deliberately retained in player list
  p.bombKickArmed=true;const travel=p.placeBomb();assert.ok(travel?.__v160Moving);assert.equal(p.bombKickCharges,0);assert.equal(p.bombs.length,1);
  const stationary=c.BomberEngine2Round.normal(p);assert.ok(stationary,'own traveling bomb incorrectly blocks stationary bomb');assert.equal(g.bombs.length,2);
  c.BomberEngine2Round.dispatch('bomb2');assert.equal(g.bombs.length,3);assert.equal(g.bombs[2].owner,p2);remoteCalls++;
  g.bombs[2].exploded=true;g.bombs.splice(2,1);c.B115.role='host';const rb=c.plant(p2,p2.position.x,p2.position.y);assert.ok(rb,'host failed remote normal placement');assert.equal(rb.owner,p2);assert.equal(rb.__v125OwnerSlot,1);rb.exploded=true;g.bombs.splice(2,1);p2.bombKickCharges=1;p2.getBombKickDirection=()=>({x:-1,y:0});const kb=c.kickPlant(p2,p2.position.x,p2.position.y);assert.ok(kb?.__v160Moving,'host failed remote traveling placement');assert.equal(kb.__v125OwnerSlot,1);hostCalls+=2;c.B115.role='offline';
  if(prior)assert.equal(prior.placeBomb(),false,'previous round actor placed a bomb');prior=p;
  c.B115.role='guest';assert.equal(c.BomberEngine2Round.normal(p),false,'guest created authoritative bomb');c.B115.role='offline';
 }
 assert.equal(events.keyup.length,1);return {rounds:20,normalBombs:c.BomberEngine2Round.snapshot().placed,localPlayer2Placements:remoteCalls,hostRemotePlacements:hostCalls,staleRemoved:c.BomberEngine2Round.snapshot().staleRemoved};
}
function speeds(){const g={players:[],bots:[],ultimateMode:false};const c=vm.createContext({window:null,gGameEngine:g,Player:{prototype:{applyBonus(b){if(b.type==='speed')this.velocity+=.8}}},Bot:{prototype:{init(){},update(){},applyBonus(b){if(b.type==='speed')this.velocity+=.8},updateEndgameAggression(){this.velocity=7}}},B115:{role:'offline'},setInterval(fn){fn();return 1},clearInterval(){},console});c.window=c;vm.runInContext(src('runtime-v0161-speed-standard.js'),c);vm.runInContext(extract(src('runtime-v0140-stability-social.js'),'ensureSpeed','speedInMovement'),c);c.authority=()=>true;
 for(const ultimateMode of [false,true]){g.ultimateMode=ultimateMode;for(const d of ['easy','normal','hard','expert'])for(const rating of [null,150,550,950]){
  const b=Object.assign(Object.create(c.Bot.prototype),{isBot:true,simulatedHuman:rating!==null,humanRating:rating,v125Difficulty:d,velocity:7,bonusCounts:{speed:0}});
  assert.equal(c.speedInMovement(b),2);b.applyBonus({type:"speed"});assert.equal(b.bonusCounts.speed,1);assert.equal(b.velocity,2+(ultimateMode?4:.8));b.bonusCounts.speed=0;b.velocity=8;assert.equal(c.speedInMovement(b),2);b.bonusCounts.speed=2;assert.equal(c.speedInMovement(b),2+2*(ultimateMode?4:.8));b.bonusCounts.speed=0;assert.equal(c.speedInMovement(b),2);c.B115.role='guest';b.velocity=3.7;c.BomberSpeed161.normalize(b);assert.equal(b.velocity,3.7);c.B115.role='offline';
 }}return {difficultyRatingModeCases:32,baseline:2,ultimateStep:4,normalStep:.8};}
console.log('ENGINE2 ROUND BOMB SPEED REGRESSION PASS',JSON.stringify({stress:stress(),rounds:rounds(),speed:speeds()}));
