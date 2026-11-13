import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../Bomberman-Ultimate-Universal-Web-v0.10/files');
let updates=0,visibility;const document={hidden:false,addEventListener(type,fn){if(type==='visibilitychange')visibility=fn}};
const g={playing:true,lobbyOpen:false,menu:{visible:false},__setupSerial:1,update(){updates++}};const c=vm.createContext({window:null,document,gGameEngine:g,Number,Math,Date,console});c.window=c;
vm.runInContext(fs.readFileSync(path.join(root,'engine2/lifecycle.js'),'utf8'),c);
const L=c.BomberEngine2Lifecycle;
for(let i=0;i<20;i++){L.tick({delta:35});L.tick({delta:15});}assert.equal(updates,50);assert.equal(L.clock().droppedMs,0);assert.ok(L.clock().catchUpSteps>0);
let before=updates;L.tick({delta:1000});assert.equal(updates-before,5);assert.ok(L.clock().droppedMs>=900);
document.hidden=true;visibility();before=updates;L.tick({delta:1000});assert.equal(updates,before);document.hidden=false;visibility();L.tick({delta:20});assert.equal(updates,before+1);
c.B115={role:'guest'};before=updates;L.tick({delta:80});assert.equal(updates,before+1);c.B115.role='spectator';L.tick({delta:80});assert.equal(updates,before+2);
// Native tile lookup returns the same object, and a destroyed tile cannot remain in the index.
vm.runInContext(fs.readFileSync(path.join(root,'js/core.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(root,'js/GameEngine.js'),'utf8'),c);
const e=c.gGameEngine,t={position:{x:2,y:3},material:'wood'};e.tiles=[t];e.__engine2TileIndexActive=true;assert.equal(e.getTile({x:2,y:3}),t);e.tiles.splice(0,1);assert.equal(e.getTileMaterial({x:2,y:3}),'grass');const w={position:{x:2,y:3},material:'wall'};e.tiles=[w];assert.equal(e.getTileMaterial({x:2,y:3}),'wall');
console.log('CLOCK AND TILE INDEX PASS: 50Hz jitter recovery, bounded stall, guest single update, hidden pause, live tile removal/replacement');
