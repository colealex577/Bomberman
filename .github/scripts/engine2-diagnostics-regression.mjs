import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
const script=path.resolve(import.meta.dirname,'../../Bomberman-Ultimate-Universal-Web-v0.10/files/engine2/stability-diagnostics.js');
const stage={getNumChildren:()=>17};
const game={players:[{}],bots:[{},{}],bombs:[{}],bonuses:[],tiles:new Array(100),stage,playing:true};
const ctx=vm.createContext({window:null,gGameEngine:game,console,Date,Number,Math,Object,Array});ctx.window=ctx;
vm.runInContext(fs.readFileSync(script,'utf8'),ctx,{filename:script});
const d=ctx.BomberEngine2Diagnostics;
for(let i=0;i<180;i++){
 game.__setupSerial=i;
 d.beforeRestart(game);
 d.afterSetup(game);
}
assert.equal(d.history().length,40,'Round diagnostics leaked past 40 history records');
for(let i=0;i<5000;i++)d.measureFrame(game,()=>{});
const snap=d.snapshot();
assert.equal(snap.rounds,180);
assert.equal(snap.frames,5000);
assert.equal(snap.scene.stageChildren,17);
assert.equal(snap.scene.bots,2);
assert.equal(snap.scene.bombs,1);
assert.equal(snap.scene.tiles,100);
assert.ok(Number.isFinite(snap.p95FrameWorkMs));
assert.ok(!('history' in snap),'Snapshot unexpectedly embeds entire history');
console.log('ENGINE2 DIAGNOSTICS BOUNDED PASS',JSON.stringify({rounds:snap.rounds,frames:snap.frames,history:d.history().length,scene:snap.scene}));
