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
api.tick();
function kill(victim,attacker,returned=false){victim.__v220DeathContext={setup:c.gGameEngine.__setupSerial,attacker,returned};victim.alive=false;advance(10)}
function pending(kind,name){return dbg.state().pending.some(q=>q.kind===kind&&q.name===name)}
kill(mid,player);assert(pending('killedByPlayer',mid.displayName));advance(900);assert(rows().some(r=>r.name===mid.displayName&&/Player/.test(r.text)));
kill(rookie,rookie);assert(pending('selfDeath',rookie.displayName));advance(2000);assert(rows().some(r=>r.name===rookie.displayName&&/own bomb/.test(r.text)));
kill(elite,player,true);assert(pending('returnedDeath',elite.displayName));advance(2000);assert(rows().some(r=>r.name===elite.displayName&&/return/i.test(r.text)));
let observer=null;c.BomberSocial155={state:()=>({population:{pending:observer}})};mid.alive=true;elite.alive=true;rookie.alive=true;c.gGameEngine.__setupSerial++;advance(10);
observer={name:'newcomer',rating:550,stage:'observing',queued:false};advance(10);assert(pending('observerArrive','newcomer'));advance(1000);observer.stage='queued';observer.queued=true;advance(10);assert(pending('observerQueue','newcomer'));advance(2000);assert(rows().some(r=>r.name==='newcomer'&&/queued|next round/.test(r.text)));
observer=null;const join=actor('newcomer',550);join.__v155Population=true;c.gGameEngine.bots.push(join);c.gGameEngine.__setupSerial++;advance(10);assert(pending('observerJoin','newcomer'));advance(1000);assert(rows().some(r=>r.name==='newcomer'&&/in|turn|spot/.test(r.text)));c.gGameEngine.__setupSerial++;advance(10);assert(!pending('observerJoin','newcomer'));
advance(20000);join.bonusCounts.kick=1;advance(10);assert(pending('kick','newcomer'));advance(2000);advance(2000);advance(2000);assert(rows().some(r=>r.name==='newcomer'&&/kick/.test(r.text)));console.log('CONTEXT EVENTS PASS');
