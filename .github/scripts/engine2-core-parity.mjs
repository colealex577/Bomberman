import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'../..');
const external=process.env.BASELINE_DIR || path.resolve(root,'../baseline');
const base=fs.existsSync(path.join(external,'Bomberman-Ultimate-Universal-Web-v0.10/files/app.js'))?external:path.resolve(root,'.github/fixtures/engine2-baseline');
function load(dir){
 const head=path.join(dir,'Bomberman-Ultimate-Universal-Web-v0.10/files');
 const counters={dom:{},ticks:0,fps:0,tileDraws:0,bonusDraws:0,spawnBots:0,spawnPlayers:0,
                   resets:0,menuShows:0,menuUpdates:0,stageUpdates:0,frames:0,
                   removed:0,playerUpdates:0,botUpdates:0,bombUpdates:0,muted:0};
 let timers=new Map(),nextTimer=0;
 const events={};
 const document={addEventListener(name,fn){(events[name]??=[]).push(fn);counters.dom[name]=(counters.dom[name]||0)+1}};
 const ticker={hasEventListener(name){return name==='tick'&&!!this.tickFn},addEventListener(name,fn){if(name==='tick'){counters.ticks++;this.tickFn=fn}},setFPS(fps){counters.fps=fps}};
 const local=new Map([['soundDefaultV07Applied',true],['soundPreferenceSet',true],['muted',false]]);
 const ctx=vm.createContext({document,window:null,console,Storage:{getValue:k=>local.get(k),setValue:(k,v)=>local.set(k,v)},
   setTimeout(cb){let i=++nextTimer;timers.set(i,cb);return i},clearTimeout(i){timers.delete(i)},
   createjs:{Ticker:ticker},Number,Math,Date});ctx.window=ctx;
 function source(rel){vm.runInContext(fs.readFileSync(path.join(head,rel),'utf8'),ctx,{filename:rel})}
 source('js/core.js');
 if(dir===root){source('engine2/input-controller.js');source('engine2/lifecycle.js')}
 source('js/InputEngine.js');source('js/GameEngine.js');
 const g=ctx.gGameEngine;
 g.stage={removeAllChildren(){counters.removed++},update(){counters.stageUpdates++}};
 g.menu={visible:true,show(){counters.menuShows++},hide(){this.visible=false},update(){counters.menuUpdates++}};
 g.resetSpectating=function(){counters.resets++};
 g.drawTiles=function(){counters.tileDraws++};
 g.drawBonuses=function(){counters.bonusDraws++};
 g.spawnBots=function(){counters.spawnBots++;this.bots=[{update(){counters.botUpdates++}}]};
 g.spawnPlayers=function(){counters.spawnPlayers++;this.players=[{update(){counters.playerUpdates++}}]};
 g.playing=false;g.soundtrackLoaded=false;g.lobbyOpen=false;
 function fire(name,keyCode,target){for(const cb of events[name]||[])cb({keyCode,target,preventDefault(){}})}
 function drainTimers(){const list=Array.from(timers.entries());timers.clear();for(const [id,cb] of list)cb()}
 for(let i=0;i<40;i++){
  if(i===0)g.setup();else g.restart();
  drainTimers();
  assert.equal(ctx.gInputEngine.listeners.mute.length,1,'Duplicate mute listener at round '+i);
  assert.equal(ctx.gInputEngine.listeners.escape.length,1,'Duplicate escape listener at round '+i);
  assert.equal(ctx.gInputEngine.listeners.restart.length,1,'Duplicate restart listener at round '+i);
  assert.equal(events.keydown.length,1,'Duplicate keydown handler at round '+i);
  assert.equal(events.keyup.length,1,'Duplicate keyup handler at round '+i);
  fire('keydown',38,null); assert.equal(ctx.gInputEngine.actions.up,true);
  fire('keyup',38,null); assert.equal(ctx.gInputEngine.actions.up,false);
 }
 g.menu.visible=false;
 for(let i=0;i<20;i++)ticker.tickFn();
 return {counters,setupSerial:g.__setupSerial,inputListeners:Object.keys(ctx.gInputEngine.listeners).sort(),
   actions:Object.keys(ctx.gInputEngine.actions).sort(),inputHandlers:{keydown:events.keydown.length,keyup:events.keyup.length},
   stats:ctx.BomberEngine2Lifecycle?.snapshot(),inputStats:ctx.BomberEngine2Input?.snapshot()};
}
const old=load(base),cur=load(root);
const props=['counters','setupSerial','inputListeners','actions','inputHandlers'];
for(const p of props){assert.deepEqual(JSON.parse(JSON.stringify(cur[p])),JSON.parse(JSON.stringify(old[p])), 'Mismatch in '+p)}
assert.equal(cur.stats.setups,40);assert.equal(cur.stats.restarts,39);assert.equal(cur.stats.frames,20);
assert.equal(cur.inputStats.domListeners,2);
console.log('ENGINE2 CORE PARITY: PASS',JSON.stringify({rounds:40,frames:20,inputListeners:cur.inputHandlers,modules:cur.inputListeners,stats:cur.stats}));
