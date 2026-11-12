import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),game=path.join(root,'Bomberman-Ultimate-Universal-Web-v0.10');
let t=1_000_000;class Clock extends Date{static now(){return t}};
const math=Object.create(Math);math.random=()=>0.05;
function node(){return {children:[],dataset:{},textContent:'',className:'',appendChild(x){this.children.push(x);return x},removeChild(x){this.children.splice(this.children.indexOf(x),1)},get firstChild(){return this.children[0]},scrollHeight:0,scrollTop:0}}
const box=node(),packets=[];const c=vm.createContext({window:null,Date:Clock,Math:math,console,setInterval:()=>1,document:{createElement:node}});c.window=c;
const player={displayName:'Player',alive:true,position:{x:1,y:1}},actor=(n,r)=>({displayName:n,simulatedHuman:true,rating:r,humanRating:r,__v16232SkillRating:r,alive:true,bonusCounts:{},hearts:0,bombKickCharges:0,bombsMax:1,bombStrength:1,position:{x:5,y:5},isSafe(){return true}});
const rookie=actor('rookie55',180),mid=actor('mid55',550),elite=actor('elite55',950),cpu={displayName:'AI 4',alive:true};
c.B115={role:'simulated',kind:'public',generation:1,localName:'Player',remoteName:mid.displayName,els:{chatMessages:box},send:d=>packets.push(d)};
c.gGameEngine={playing:true,menu:{visible:false},lobbyOpen:false,players:[player],bots:[rookie,mid,elite,cpu],tiles:Array.from({length:40},()=>({material:'wood'})),bombs:[],__setupSerial:1};
vm.runInContext(fs.readFileSync(path.join(game,'files/engine2/social-210.js'),'utf8'),c);
const api=c.BomberSocial210, dbg=api.debug;const ctx=()=>api.read(),advance=(ms)=>{t+=ms;api.tick()},rows=()=>box.children.map(x=>({name:x.children[0].textContent,text:x.children[1].textContent}));
function assertNoText(regex){assert.ok(!rows().some(r=>regex.test(r.text)),JSON.stringify(rows()))}
assert.equal(api.identity(rookie).tier,'rookie');assert.equal(api.identity(mid).tier,'mid');assert.equal(api.identity(elite).tier,'elite');assert.equal(api.identity(mid).style,api.identity({...mid,humanRating:999}).style);assert.equal(api.identity({...mid,humanRating:999}).rating,999);
assert.equal(api.classify('how do i kick a bomb?'),'kickHow');assert.equal(api.classify('how many bombs do you have?'),'bomb');assert.equal(api.classify('are you a bot?'),'identity');assert.equal(ctx().phase,'opening');api.tick();
assert.ok(api.onHuman('Player','@mid55 how do i kick a bomb?',true));advance(2500);assert.match(rows().at(-1).text,/WASD/);assert.equal(rows().at(-1).name,'mid55');
advance(3000);mid.bombKickCharges=3;assert.ok(api.onHuman('Player','@mid55 do you have kick?',true));advance(2600);assert.match(rows().at(-1).text,/3 kick charges/);
advance(3000);assert.ok(api.onHuman('Player','@elite55 are you a bot?',true));advance(2600);assert.match(rows().at(-1).text,/simulated player/);
// Pending playing reply may not survive an elimination or new round.
advance(3000);assert.ok(api.onHuman('Player','@mid55 how many bombs?',true));mid.alive=false;advance(2600);assertNoText(/i can place 1 at a time/);assert.equal(ctx().people.find(x=>x.a===mid).role,'watching');
advance(3000);assert.ok(api.onHuman('Player','@mid55 are you watching?',true));advance(2600);assert.match(rows().at(-1).text,/watching/);
advance(3000);assert.ok(api.onHuman('Player','@elite55 how many bombs?',true));c.gGameEngine.__setupSerial++;advance(3000);assertNoText(/i can place 1 at a time/);
// Explicit role/state revalidation at delivery.
let cx=ctx(),x=cx.people.find(x=>x.a===elite);dbg.reset(cx);assert.ok(dbg.enqueue(x,cx,'script',{force:true,text:'@rookie55 opening?',script:1,require:'phase',delay:500}));c.gGameEngine.tiles=[];advance(1000);assertNoText(/opening\?/);assert.equal(ctx().phase,'open');
// Spectator gets factual current state, no pickup or playing claim.
const watcher=ctx().people.find(x=>x.a===mid);assert.match(api.answer(watcher,ctx(),'status'),/watching/);assert.match(api.answer(watcher,ctx(),'bomb'),/watch the blast lanes/);
// Host can relay a generated line via the existing guest packet; guest never generates.
c.B115.role='host';c.B115.conn={open:true};api.tick();assert.ok(api.onHuman('Player','@elite55 rating?',true));advance(3000);assert.ok(packets.some(d=>d.type==='v155AiChat'&&d.name==='elite55'));c.B115.role='guest';advance(5000);assert.equal(api.read(),null);assert.equal(dbg.state().pending.length,0);
console.log('SOCIAL 2.1.0 PASS',JSON.stringify({tiers:3,stableStyle:true,contextualReplies:true,deathCancels:true,newRoundCancels:true,phaseCancels:true,guestNoGeneration:true,hostRelay:true,rendered:rows().length}));
