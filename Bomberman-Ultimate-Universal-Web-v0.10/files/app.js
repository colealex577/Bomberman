const LOCAL_MESSAGES={Player1:'Player 1',Player2:'Player 2',move:'move',bomb:'plant the bomb',mute:'mute / unmute sound',restart:'restart',menu:'menu'};
let getLocalsMessage=(name)=>LOCAL_MESSAGES[name]||name;
function GUILocalization(){
 document.querySelector('#player1').textContent=getLocalsMessage('Player1');document.querySelector('#player2').textContent=getLocalsMessage('Player2');document.querySelector('#movement1').textContent=getLocalsMessage('move');document.querySelector('#bomb1').textContent='Space = normal bomb • E = Bomb Kick';document.querySelector('#movement2').textContent=getLocalsMessage('move');document.querySelector('#bomb2').textContent='Shift = normal bomb • Q = Bomb Kick';document.querySelector('#mute').textContent=getLocalsMessage('mute');document.querySelector('#restart').textContent=getLocalsMessage('restart');document.querySelector('#menu').textContent=getLocalsMessage('menu');
}
let Storage={setValue:(key,value)=>{localStorage[key]=JSON.stringify(value)},getValue:(key)=>{let result;try{if(localStorage[key])result=JSON.parse(localStorage[key])}catch(e){throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`)}return result}};
class StorageError extends Error{constructor(msg){super();this.name='StorageError';this.message=msg||'Storage Error';this.stack=(new Error()).stack}}
try{localStorage.setItem('BombermanSingleMapV133','classic');localStorage.setItem('BombermanMultiMapV133','classic')}catch(e){}

/* The existing public API is preserved; the new coordinator owns module ordering. */
function loadCompatibility(){return BomberEngine2Loader.run()}
function loadScript(id,src,cb){var p=BomberEngine2Loader.script(id,src);if(cb)p.then(cb).catch(function(err){console.error(err)});return p}
function loadPackedScript(id,src,cb){if(!window.BomberPackedLoader)return Promise.reject(new Error('Packed runtime loader missing'));var p=BomberPackedLoader.load(id,src);if(cb)p.then(function(){cb()}).catch(function(err){console.error(err)});return p}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
 window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js?v=202dev').catch(function(){})});
}
document.addEventListener('DOMContentLoaded',function(){
 loadScript('runtime-v016225-friends-protocol-isolation-loader','./files/runtime-v016225-friends-protocol-isolation.js?v=202dev');
 loadScript('runtime-v016225-friends-game-routing-loader','./files/runtime-v016225-friends-game-routing.js?v=202dev');
 loadCompatibility();GUILocalization();gGameEngine.load();
});
