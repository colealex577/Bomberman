import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..','Bomberman-Ultimate-Universal-Web-v0.10');
const context=vm.createContext({console,Math,Map,Number,JSON,window:null});context.window=context;
let time=0,raf=null,requests=0,ticks=0,draws=0,visual=[],data=new Map();
context.performance={now:()=>time};context.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};context.document={readyState:'loading',hidden:false,addEventListener(){},getElementById(){return null}};context.requestAnimationFrame=fn=>{raf=fn;return ++requests};context.cancelAnimationFrame=()=>{raf=null};
const stage={canvas:{width:545,height:416,getContext(){return {}},getClientRects(){return [1]}},tickOnUpdate:true,tick(){ticks++},update(){if(this.tickOnUpdate)this.tick();draws++;visual.push(actor.bmp.x);assert.equal(this.scaleX,this.canvas.width/545);assert.equal(actor.nameLabel.x,actor.bmp.x+10)}};
let actor={alive:true,bmp:{x:0,y:0,parent:stage},nameLabel:{x:10,y:0,parent:stage}};const g={stage,players:[actor],bots:[],bombs:[],fps:50,tileSize:32,__setupSerial:1};
vm.runInContext(fs.readFileSync(path.join(root,'files/engine2/render-211.js'),'utf8'),context);
const R=context.BomberEngine2Render;assert.equal(R.attach(g),true);const initial=requests;R.attach(g);assert.equal(requests,initial,'one render loop');assert.equal(stage.canvas.width,1090);assert.equal(stage.canvas.height,832);
// Independent scheduling: 120 display frames and 50 simulation updates in one second.
for(let i=0,j=0;i<120;i++){time=i*1000/120;while(j<50&&j*20<=time+0.001){const save=time;time=j*20;actor.bmp.x=j*2;actor.nameLabel.x=actor.bmp.x+10;stage.update();j++;time=save}const x=actor.bmp.x;const cb=raf;cb(time);assert.equal(actor.bmp.x,x,'render must restore physics state');assert.equal(actor.nameLabel.x,x+10);}
assert.equal(ticks,50);assert.equal(draws,120);assert.equal(R.snapshot().simulationStageTicks,50);assert.ok(visual.some(x=>x%2!==0),'interpolated positions between ticks');
// A render setting change cannot change simulation or actors. Ultra is 9x pixels.
R.configure({fps:60,scale:3});assert.equal(stage.canvas.width,1635);assert.equal(stage.canvas.height,1248);assert.equal(g.fps,50);let before=draws;for(let i=0;i<120;i++){time=1000+i*1000/120;raf(time)}assert.equal(draws-before,60);
// New round: no interpolation from removed actors; async guest corrections snap.
g.__setupSerial++;actor.bmp.x=400;actor.nameLabel.x=410;time=2000;stage.update();time=2010;raf(time);assert.equal(visual.at(-1),400);
actor.bmp.x=350;actor.nameLabel.x=360;time=2030;raf(time);assert.equal(visual.at(-1),350);assert.equal(actor.bmp.x,350);
// Stage tick keeps honoring tickOnUpdate, and hidden canvas avoids unnecessary draws.
stage.tickOnUpdate=false;let b=ticks;stage.update();assert.equal(ticks,b);stage.tickOnUpdate=true;context.document.hidden=true;before=draws;time=2050;raf(time);assert.equal(draws,before);
R.configure({fps:120,scale:1});assert.equal(stage.canvas.width,545);assert.equal(stage.canvas.height,416);assert.equal(R.snapshot().simulationHz,50);
console.log('RENDER REGRESSION PASS: 120 draws / 50 stage ticks; 60 cap; restored state; 1x/2x/3x; round and correction snap; single RAF owner');
