/* Bomberman 2.0: bounded, non-invasive long-session diagnostics.
 * No timer or game-play wrapper is installed. Use
 *   BomberEngine2Diagnostics.snapshot()
 *   BomberEngine2Diagnostics.history()
 * in the browser console if a future long-session issue occurs.
 */
(function(global){
 'use strict';
 var history=[],frameSamples=[],frameCount=0,roundCount=0,slowFrames=0;
 var MAX_HISTORY=40,MAX_SAMPLES=240;
 var previous={};
 function now(){return global.performance&&typeof global.performance.now==='function'?global.performance.now():Date.now()}
 function safeCount(x){return x&&typeof x.length==='number'?x.length:0}
 function scene(g){
  if(!g)return {};
  var stage=g.stage;
  return {
   roundToken:Number(g.__setupSerial)||0,
   players:safeCount(g.players),bots:safeCount(g.bots),bombs:safeCount(g.bombs),
   bonuses:safeCount(g.bonuses),tiles:safeCount(g.tiles),
   stageChildren:stage&&typeof stage.getNumChildren==='function'?stage.getNumChildren():safeCount(stage&&stage.children),
   lobbyOpen:!!g.lobbyOpen,playing:!!g.playing,
   networkRole:String(g.networkRole||'offline')
  }
 }
 function snapshot(){
  var g=global.gGameEngine,s=scene(g),d=frameSamples.slice().sort(function(a,b){return a-b}),
   p95=d.length?d[Math.min(d.length-1,Math.floor(d.length*.95))]:0;
  var net=global.BomberMultiplayer,inp=global.BomberEngine2Input;
  return {
   version:'2.1.3',rounds:roundCount,frames:frameCount,
   scene:s,lastSampleMs:frameSamples.length?frameSamples[frameSamples.length-1]:0,
   p95FrameWorkMs:Math.round(p95*10)/10,
   maxFrameWorkMs:d.length?Math.round(d[d.length-1]*10)/10:0,
   slowFrameSamples:slowFrames,
   keyboard:inp&&inp.snapshot?inp.snapshot():null,
   render:global.BomberEngine2Render?global.BomberEngine2Render.snapshot():null,
   roundState:global.BomberEngine2Round?global.BomberEngine2Round.snapshot():null,
   network:net?{roundId:net.roundId,roundNumber:net.roundNumber,worldRevision:net.worldRevision,metrics:Object.assign({},net.metrics||{})}:null,
   memory:global.performance&&global.performance.memory?{usedJSHeapSize:global.performance.memory.usedJSHeapSize,totalJSHeapSize:global.performance.memory.totalJSHeapSize}:null
  }
 }
 function beforeRestart(g){
  previous=scene(g);
 }
 function afterSetup(g){
  roundCount++;
  history.push({at:Date.now(),round:roundCount,before:previous,after:scene(g)});
  if(history.length>MAX_HISTORY)history.shift();
  previous={};
 }
 function measureFrame(g,render){
  frameCount++;
  if(frameCount%10!==0)return render();
  var start=now();
  try{return render()}finally{
   var elapsed=Math.max(0,now()-start);
   frameSamples.push(elapsed);
   if(frameSamples.length>MAX_SAMPLES)frameSamples.shift();
   if(elapsed>35)slowFrames++;
  }
 }
 global.BomberEngine2Diagnostics=Object.freeze({beforeRestart:beforeRestart,afterSetup:afterSetup,measureFrame:measureFrame,snapshot:snapshot,history:function(){return history.map(function(x){return{at:x.at,round:x.round,before:Object.assign({},x.before),after:Object.assign({},x.after)}})}});
})(window);
