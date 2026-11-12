import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'../..');
const game=path.join(root,'Bomberman-Ultimate-Universal-Web-v0.10','files');
const MINUTES=10;

// Execute the real speed and round-lifecycle runtime source under synthetic time.
function updateWrappers(){
 const calls={botUpdate:0,writes:0},intervals=[];let f=function(){calls.botUpdate++};
 const proto=Object.create({applyBonus(){},fade(){},die(){}});
 Object.defineProperty(proto,'update',{get(){return f},set(next){f=next;calls.writes++},configurable:true});
 Object.assign(proto,{init(){},applyBonus(){},die(){}});
 const ctx=vm.createContext({window:null,console,document:{getElementById(){return null},body:{setAttribute(){}}},
  Player:{prototype:{applyBonus(){},fade(){},die(){}}},Bot:{prototype:proto},
  GameEngine:{prototype:{restart(){}}},gGameEngine:{bots:[],players:[],playing:false,stage:{},menu:{}},
  Math,Number,Date,setInterval(fn,ms){intervals.push({fn,ms,at:ms,active:true});return intervals.length},
  clearInterval(i){if(intervals[i-1])intervals[i-1].active=false},setTimeout(){return 1},clearTimeout(){}});
 ctx.window=ctx;
 for(const f of ['runtime-v0161-speed-standard.js','runtime-v016230-round-skill-version.js'])
  vm.runInContext(fs.readFileSync(path.join(game,f),'utf8'),ctx,{filename:f});
 const initial=calls.writes;
 for(let t=0;t<MINUTES*60000;t+=10){for(const i of intervals){if(i.active&&i.at<=t){i.at=t+i.ms;i.fn()}}}
 assert.ok(calls.writes<=2,'Bot.update wrappers grew with elapsed play time');
 ctx.Bot.prototype.update.call({alive:true,bonusCounts:{}});
 assert.equal(calls.botUpdate,1,'Base bot update was called more than once');
 return calls;
}

// Extract only the actual patch installers. They should be idempotent even
// when several modules repeatedly check the same prototype on their own timers.
function extract(code,name,target){const start=code.indexOf('function '+name+'(');assert(start>=0,name);const brace=code.indexOf('{',start);let depth=0,quote='',escaped=false,end=-1;
 for(let i=brace;i<code.length;i++){const c=code[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break}}
 assert(end>start,name+' unclosed');return code.slice(start,end).replace('function '+name+'(','function '+target+'(')}

function kickWrappers(){
 const writes={},protos={};
 for(const [owner,properties] of Object.entries({Player:['tryKickBomb','placeBomb','throwBombNow','setBombsListener'],Bot:['plantBomb'],Bomb:['update']})){
  const proto={};for(const prop of properties){const key=owner+'.'+prop;writes[key]=0;let f=function(){return false};Object.defineProperty(proto,prop,{get(){return f},set(v){writes[key]++;f=v},configurable:true})}
  protos[owner]={prototype:proto};
 }
 const ctx=vm.createContext({window:null,console,...protos,BomberKick160:{startBombMoving(){}},markTravel(){},
  markCompat(f){for(const k of ['__v16215Travel','__v16211OwnerGrace','__v16212OwnerPass','__v16214LaunchSpeed'])f[k]=true;return f}});
 ctx.window=ctx;
 const defs=[
  ['runtime-v016211-travel-chat-drops.js','patchActorKick','patch211'],
  ['runtime-v016212-owner-pass.js','patchTravelMarking','patch212'],
  ['runtime-v016215-bomb-travel.js','patchStarts','patch215'],
  ['runtime-v016219-travel-capacity-ai.js','patchPlayerCapacity','patch219'],
  ['runtime-v016221-return-controls.js','patchLaunchStampAndLead','patch221'],
  ['runtime-v016221-return-controls.js','patchDirectThrow','throw221'],
  ['runtime-v016222-return-defense-controls.js','patchPlayer','throw222'],
 ];
 for(const [file,fn,name] of defs){const source=fs.readFileSync(path.join(game,file),'utf8');vm.runInContext(extract(source,fn,name),ctx,{filename:file+':'+fn})}
 for(const [,,name] of defs)ctx[name]();
 const initial={...writes},direct=ctx.Player.prototype.throwBombNow;
 assert.ok(direct.__v16222&&direct.__v16221,'Latest Bomb Kick direct-action owner lacks both compatibility markers');
 for(let t=0;t<MINUTES*60000;t+=20){
  if(t%100===0){ctx.patch211();ctx.patch212()}
  if(t%120===0){ctx.patch215();ctx.patch221();ctx.throw221();ctx.throw222()}
  if(t%180===0)ctx.patch219();
 }
 assert.equal(writes['Bot.plantBomb'],initial['Bot.plantBomb'],'Bot.plantBomb wrapper depth grew with elapsed play time');
 assert.equal(ctx.Player.prototype.throwBombNow,direct,'Bomb Kick direct-action owner changed during play');
 assert.equal(writes['Player.throwBombNow'],initial['Player.throwBombNow'],'Bomb Kick direct-action handlers fought over the same method');
 return {writes,initial};
}
const a=updateWrappers(),b=kickWrappers();
const scores=fs.readFileSync(path.join(game,'runtime-v0130-social.js'),'utf8');
assert.ok(scores.includes('if(a&&a.innerHTML!==h)a.innerHTML=h'),'Score DOM writes not memoized');
const diagnostics=fs.readFileSync(path.join(game,'engine2/stability-diagnostics.js'),'utf8');
assert.ok(diagnostics.includes('MAX_HISTORY=40')&&diagnostics.includes('MAX_SAMPLES=240'),'Unbounded diagnostic history');
console.log('ENGINE2 10-MINUTE LONG-SESSION STABILITY PASS',JSON.stringify({simulatedMinutes:MINUTES,botUpdateAssignments:a.writes,botPlantAssignments:b.writes['Bot.plantBomb'],directThrowAssignments:b.writes['Player.throwBombNow'],domWritesMemoized:true,boundedDiagnostics:true}));
