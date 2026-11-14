/* Bomberman 2.0: declarative, testable compatibility module loader.
 * One ordered manifest replaces the nested callback chain. Actual game modules
 * remain byte-for-byte preserved until individually refactored and verified.
 */
(function(global){
 'use strict';
 var MANIFEST=[
 {
  "kind": "script",
  "id": "runtime-v0118-fix-loader",
  "src": "./files/runtime-v0116-fix.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0119-loader",
  "src": "./files/runtime-v0119.js?v=211"
 },
 {
  "kind": "script",
  "id": "net-v0120-data-loader",
  "src": "./files/multiplayer-v0129.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0120-qol-loader",
  "src": "./files/runtime-v0120-qol.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0120-qol-fix-loader",
  "src": "./files/runtime-v0120-qol-fix.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0123-loader",
  "src": "./files/runtime-v0123.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0123-fix-loader",
  "src": "./files/runtime-v0123-fix.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0123-final-loader",
  "src": "./files/runtime-v0123-final.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0123-polish-loader",
  "src": "./files/runtime-v0123-polish.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0124-loader",
  "src": "./files/runtime-v0124.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0125-core-loader",
  "src": "./files/runtime-v0125-core.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0125-connect-loader",
  "src": "./files/runtime-v0125-connect.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0126-ai-loader",
  "src": "./files/runtime-v0126-ai.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0127-loader",
  "src": "./files/runtime-v0127.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0127-fix-loader",
  "src": "./files/runtime-v0127-fix.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0127-leaderboard-loader",
  "src": "./files/runtime-v0127-leaderboard.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0127-menu-fix-loader",
  "src": "./files/runtime-v0127-menu-fix.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0130-social-loader",
  "src": "./files/runtime-v0130-social.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0130-fix-loader",
  "src": "./files/runtime-v0130-fix.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0131-polish-loader",
  "src": "./files/runtime-v0131-polish.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0132-whole-loader",
  "src": "./files/runtime-v0132-whole.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0133-maps-loader",
  "src": "./files/runtime-v0133-maps.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0134-gameplay-loader",
  "src": "./files/runtime-v0134-gameplay.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0135-polish-loader",
  "src": "./files/runtime-v0135-polish.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0136-challenge-loader",
  "src": "./files/runtime-v0136-challenge.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0137-stability-loader",
  "src": "./files/runtime-v0137-stability.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0138-ai-social-loader",
  "src": "./files/runtime-v0138-ai-social.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0140-stability-social-loader",
  "src": "./files/runtime-v0140-stability-social.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0143-intelligence-loader",
  "src": "./files/runtime-v0143-intelligence.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0150-ai-loader",
  "src": "./files/runtime-v0150-ai.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0144-opening-loader",
  "src": "./files/runtime-v0144-opening.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0152-human-observer-loader",
  "src": "./files/runtime-v0152-human-observer.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v0150-release-loader",
  "src": "./files/runtime-v0150-release.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v01543-dialogue-loader",
  "src": "./files/runtime-v01543-dialogue.js?v=211"
 },
 {
  "kind": "packed",
  "id": "runtime-v0160-bomb-kick-loader",
  "src": "./files/runtime-v0160-bomb-kick.js.gz.b64?v=211"
 },
 {
  "kind": "packed",
  "id": "runtime-v0162-ai-core-loader",
  "src": "./files/runtime-v0162-ai-core.js.gz.b64?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v01621-gameplay-fixes-loader",
  "src": "./files/runtime-v01621-gameplay-fixes.js?v=211"
 },
 {
  "kind": "script",
  "id": "runtime-v01624-ui-stability-loader",
  "src": "./files/runtime-v01624-ui-stability.js?v=211"
 },
 {
  "kind": "packed",
  "id": "runtime-v01626-ai-test-room-loader",
  "src": "./files/runtime-v01626-ai-test-room.js.gz.b64?v=211"
 }
];
 var status={state:'idle',index:-1,loaded:[],failed:null,startedAt:0,finishedAt:0};
 var jobs=Object.create(null),started=false,dialogueClock=false,ready=null;
 function script(id,src){
  if(jobs[id])return jobs[id];
  jobs[id]=new Promise(function(resolve,reject){
   var s=document.getElementById(id),done=false;
   function loaded(){if(done)return;done=true;try{s.dataset.bomberLoaded='1'}catch(e){}resolve()}
   function failed(){if(done)return;done=true;reject(new Error('Module did not load: '+id+' '+src))}
   if(s){
    if(s.dataset&&s.dataset.bomberLoaded==='1'){loaded();return}
    s.addEventListener('load',loaded,{once:true});s.addEventListener('error',failed,{once:true});
    setTimeout(function(){if(!done&&s.dataset&&s.dataset.bomberLoaded==='1')loaded()},0);
    return;
   }
   s=document.createElement('script');s.id=id;s.src=src;
   s.onload=loaded;s.onerror=failed;(document.head||document.documentElement).appendChild(s)
  }).catch(function(err){delete jobs[id];throw err});
  return jobs[id]
 }
 function packed(id,src){
  if(!global.BomberPackedLoader)return Promise.reject(new Error('Packed runtime loader missing: '+id));
  return global.BomberPackedLoader.load(id,src)
 }
 function disabled(){try{return new URLSearchParams(location.search).get('nodata')==='1'}catch(e){return false}}
 function dialogueRoundClock(){
  if(dialogueClock)return;dialogueClock=true;
  var roundKey='';setInterval(function(){var d=global.BomberDialogue1543,a=global.BomberHumanObserver152;
   if(!d||!a||!a.state)return;
   var st=a.state(),k=(st.mode||'')+'|'+(st.roundSerial||0);
   if(k!==roundKey){roundKey=k;d.roundStartedAt=Date.now()}
  },250);
 }
 var preloaded=Object.create(null);
 function hintUpcoming(start){if(disabled()||!global.location||!/^https?:$/.test(global.location.protocol))return;for(var j=start;j<Math.min(MANIFEST.length,start+6);j++){var item=MANIFEST[j];if(item.kind!=='script'||preloaded[item.id]||document.getElementById(item.id))continue;preloaded[item.id]=true;var l=document.createElement('link');l.rel='preload';l.as='script';l.href=item.src;(document.head||document.documentElement).appendChild(l)}}
 function run(){
  if(started)return ready;
  started=true;status.state='loading';status.startedAt=Date.now();
  var chain=Promise.resolve();
  MANIFEST.forEach(function(item,i){
   chain=chain.then(function(){
    if(disabled()&&i>=2)return;
    if(item.id==='runtime-v0160-bomb-kick-loader')dialogueRoundClock();
    status.index=i;hintUpcoming(i);
    return (item.kind==='packed'?packed(item.id,item.src):script(item.id,item.src))
      .then(function(){status.loaded.push(item.id)});
   });
  });
  ready=chain.then(function(){status.state='ready';status.finishedAt=Date.now();return status})
    .catch(function(err){status.state='error';status.failed={at:status.index,message:String(err&&err.message||err)};status.finishedAt=Date.now();console.error('Bomberman startup failed:',err);throw err});
  /* Event handlers can observe the rejection via diagnostics without leaving an unhandled promise. */
  ready.catch(function(){});
  return ready
 }
 global.BomberEngine2Loader=Object.freeze({version:'2.1.1',manifest:MANIFEST,run:run,script:script,
  status:function(){return{state:status.state,index:status.index,loaded:status.loaded.slice(),failed:status.failed,startedAt:status.startedAt,finishedAt:status.finishedAt}}
 });
})(window);
