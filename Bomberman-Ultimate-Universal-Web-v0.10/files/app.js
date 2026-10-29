const LOCAL_MESSAGES={Player1:'Player 1',Player2:'Player 2',move:'move',bomb:'plant the bomb',mute:'mute / unmute sound',restart:'restart',menu:'menu'};
let getLocalsMessage=(name)=>LOCAL_MESSAGES[name]||name;
function GUILocalization(){
 document.querySelector('#player1').textContent=getLocalsMessage('Player1');document.querySelector('#player2').textContent=getLocalsMessage('Player2');document.querySelector('#movement1').textContent=getLocalsMessage('move');document.querySelector('#bomb1').textContent=getLocalsMessage('bomb');document.querySelector('#movement2').textContent=getLocalsMessage('move');document.querySelector('#bomb2').textContent=getLocalsMessage('bomb');document.querySelector('#mute').textContent=getLocalsMessage('mute');document.querySelector('#restart').textContent=getLocalsMessage('restart');document.querySelector('#menu').textContent=getLocalsMessage('menu');
}
let Storage={setValue:(key,value)=>{localStorage[key]=JSON.stringify(value)},getValue:(key)=>{let result;try{if(localStorage[key])result=JSON.parse(localStorage[key])}catch(e){throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`)}return result}};
class StorageError extends Error{constructor(msg){super();this.name='StorageError';this.message=msg||'Storage Error';this.stack=(new Error()).stack}}
function loadScript(id,src,cb){if(document.getElementById(id)){if(cb)cb();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>{if(cb)cb()};document.head.appendChild(s)}
function dataDiagnosticsDisabled(){try{return new URLSearchParams(location.search).get('nodata')==='1'}catch(e){return false}}
function loadCompatibility(){
 loadScript('runtime-v0118-fix-loader','./files/runtime-v0116-fix.js?v=0118',function(){
  loadScript('runtime-v0119-loader','./files/runtime-v0119.js?v=0119',function(){
   if(dataDiagnosticsDisabled())return;
   loadScript('net-v0120-data-loader','./files/net-v0120-data.js?v=0120',function(){
    loadScript('runtime-v0120-qol-loader','./files/runtime-v0120-qol.js?v=0120',function(){
     loadScript('runtime-v0120-qol-fix-loader','./files/runtime-v0120-qol-fix.js?v=0120c',function(){
      loadScript('runtime-v0123-loader','./files/runtime-v0123.js?v=0123',function(){
       loadScript('runtime-v0123-fix-loader','./files/runtime-v0123-fix.js?v=0123b',function(){
        loadScript('runtime-v0123-final-loader','./files/runtime-v0123-final.js?v=0123c');
       });
      });
     });
    });
   });
  });
 });
}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=0123c').catch(()=>{}))}
document.addEventListener('DOMContentLoaded',()=>{loadCompatibility();GUILocalization();gGameEngine.load()});