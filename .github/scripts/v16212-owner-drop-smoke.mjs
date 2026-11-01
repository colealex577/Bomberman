import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

let fakeNow=100000;
Date.now=()=>fakeNow;
globalThis.window=globalThis;
globalThis.setInterval=(fn)=>{fn();return 1};
globalThis.clearInterval=()=>{};
globalThis.addEventListener=()=>{};
const ids={};
const ctx={fillStyle:'',imageSmoothingEnabled:false,fillRect(){}};
function element(tag){return{tagName:tag,id:'',style:{},setAttribute(k,v){this[k]=v},appendChild(){},querySelector(){return null},getContext(){return ctx}}}
globalThis.document={title:'',body:{attrs:{},setAttribute(k,v){this.attrs[k]=v}},head:{appendChild(e){if(e.id)ids[e.id]=e}},documentElement:{appendChild(e){if(e.id)ids[e.id]=e}},getElementById(id){return ids[id]||null},createElement:element};
globalThis.createjs={Bitmap:function(src){this.src=src;this.x=0;this.y=0}};
globalThis.Utils={convertToBitmapPosition(p){return{x:p.x*32,y:p.y*32}}};

function Player(){this.position={x:1,y:1};this.bmp={x:32,y:32};this.alive=true}
Player.prototype.tryKickBomb=function(b,d){b.__v160Moving=true;b.moveDirection=d;b.owner=this;return true};
Player.prototype.placeBomb=function(){const b=new Bomb();b.__v160Moving=true;b.moveDirection={x:1,y:0};b.owner=this;return b};
Player.prototype.detectBombCollision=function(){return engine.bombs.some(b=>b.position&&b.position.x===2&&b.position.y===1)};
function Bomb(){this.__v160Moving=false;this.moveDirection=null;this.position={x:2,y:1};this.bmp={x:64,y:32};this.owner=null;this.exploded=false}
Bomb.prototype.update=function(){const hit=engine.players.find(a=>a.position&&a.position.x===1&&a.position.y===1);if(hit){this.hitActor=hit;this.exploded=true}};
function Bonus(position,t){this.init(position,t)}
Bonus.prototype.types=['speed','bomb','fire','kick'];
Bonus.prototype.init=function(position,t){this.type=['speed','bomb','fire','kick'][t]||'speed';this.position={...position};this.bmp={}};
function GameEngine(){}
GameEngine.prototype.drawBonuses=function(){};
Object.assign(globalThis,{Player,Bomb,Bonus,GameEngine});
const engine=globalThis.gGameEngine={players:[],bots:[],bombs:[],tiles:[],bonuses:[],stage:{addChild(){},removeChild(){}},kickBonusImg:'kick.png',moveToFront(){}};
globalThis.BomberKick160={startBombMoving(b,d,a){b.__v160Moving=true;b.moveDirection=d;b.owner=a;return true},debug:{}};

const here=path.dirname(fileURLToPath(import.meta.url));
const runtime=path.resolve(here,'../../Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v016212-owner-pass.js');
vm.runInThisContext(fs.readFileSync(runtime,'utf8'));
assert.ok(BomberFix16212);
assert.equal(BomberFix16212.version,'v0.16.2.12');

const owner=new Player(),other=new Player();other.position={x:9,y:9};engine.players=[owner,other];
const moving=new Bomb();Object.assign(moving,{owner,__v160Moving:true,moveDirection:{x:1,y:0},__v16211TravelOwner:owner,__v16211TravelStartedAt:fakeNow,__v16211Outbound:true});engine.bombs=[moving];moving.update();
assert.equal(moving.exploded,false,'outbound bomb must ignore its owner as an impact target');
assert.deepEqual(engine.players,[owner,other],'owner must be restored after bomb update');
assert.equal(owner.detectBombCollision({x:64,y:32}),false,'owner must be able to pass through its protected traveling bomb');
assert.equal(BomberFix16212.ownerImpactProtected(moving,other),false,'other actors never inherit owner protection');

moving.__v16211Outbound=false;moving.moveDirection={x:-1,y:0};fakeNow+=3100;
assert.equal(BomberFix16212.ownerImpactProtected(moving,owner),false,'redirect plus grace expiry restores owner impact');
other.position={x:1,y:1};engine.players=[other];const hostile=new Bomb();Object.assign(hostile,{owner,__v160Moving:true,__v16211TravelOwner:owner,__v16211TravelStartedAt:fakeNow,__v16211Outbound:true});hostile.update();assert.equal(hostile.hitActor,other,'another player must still trigger impact immediately');

engine.players=[];const heart=new Bonus({x:3,y:3},3),kick=new Bonus({x:4,y:3},4);assert.equal(heart.type,'heart');assert.equal(kick.type,'kick');assert.deepEqual(Bonus.prototype.types,['speed','bomb','fire','heart','kick']);
const ge=new GameEngine();Object.assign(ge,{tiles:[],bonuses:[],ultimateMode:true,bonusesPercent:100,stage:engine.stage,kickBonusImg:'kick.png',moveToFront(){}});for(let i=0;i<20;i++)ge.tiles.push({material:'wood',position:{x:i+1,y:1},bmp:{}});globalThis.gGameEngine=ge;ge.drawBonuses();const counts=ge.bonuses.reduce((m,b)=>(m[b.type]=(m[b.type]||0)+1,m),{});assert.ok((counts.heart||0)>0,'heart must remain in the normal drop pool');assert.equal(counts.kick,2,'20 drops should contain only two random Kick pickups');assert.equal(ge.bombKickMaxDrops,4);assert.equal(BomberFix16212.kickCount(50),4);
console.log('v0.16.2.12 owner/drop smoke: PASS',counts);
