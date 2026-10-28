const LOCAL_MESSAGES={Player1:'Player 1',Player2:'Player 2',move:'move',bomb:'plant the bomb',mute:'mute / unmute sound',restart:'restart',menu:'menu'};
let getLocalsMessage=(name)=>LOCAL_MESSAGES[name]||name;
function GUILocalization(){document.querySelector('#player1').textContent=getLocalsMessage('Player1');document.querySelector('#player2').textContent=getLocalsMessage('Player2');document.querySelector('#movement1').textContent=getLocalsMessage('move');document.querySelector('#bomb1').textContent=getLocalsMessage('bomb');document.querySelector('#movement2').textContent=getLocalsMessage('move');document.querySelector('#bomb2').textContent=getLocalsMessage('bomb');document.querySelector('#mute').textContent=getLocalsMessage('mute');document.querySelector('#restart').textContent=getLocalsMessage('restart');document.querySelector('#menu').textContent=getLocalsMessage('menu')}
let Storage={setValue:(key,value)=>{localStorage[key]=JSON.stringify(value)},getValue:(key)=>{let result;try{if(localStorage[key])result=JSON.parse(localStorage[key])}catch(e){throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`)}return result}};
class StorageError extends Error{constructor(msg){super();this.name='StorageError';this.message=msg||'Storage Error';this.stack=(new Error()).stack}}
window.BOMBERMAN_CURRENT_VERSION='v0.12.5';
function loadScript(id,src,cb){if(document.getElementById(id)){if(cb)cb();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>{if(cb)cb()};s.onerror=()=>{console.error('Bomberman module failed:',src);if(cb)cb()};document.head.appendChild(s)}
function holdVersion125(){const v=document.getElementById('buildVersion119')||document.getElementById('buildVersion120')||document.getElementById('buildVersion121')||document.getElementById('buildVersion122')||document.getElementById('buildVersion123')||document.getElementById('buildVersion124')||document.getElementById('buildVersion125')||document.getElementById('buildVersion');if(!v)return;const fix=()=>{if(v.textContent!==window.BOMBERMAN_CURRENT_VERSION)v.textContent=window.BOMBERMAN_CURRENT_VERSION};fix();if(!v.__v125observer&&window.MutationObserver){v.__v125observer=true;new MutationObserver(fix).observe(v,{childList:true,characterData:true,subtree:true})}}
function refreshCharacterMenu(){let n=0;const t=setInterval(()=>{if(window.BomberCharacter&&window.gGameEngine&&gGameEngine.playerBoyImg&&gGameEngine.menu){clearInterval(t);if(gGameEngine.menu.visible){gGameEngine.menu.hide();gGameEngine.menu.show()}return}if(++n>100)clearInterval(t)},80)}
function hideBootLoading(){const e=document.getElementById('bootLoading');if(e)e.hidden=true}
function wrapSetupForBoot(){if(!window.GameEngine||GameEngine.prototype.__bootReady125)return;GameEngine.prototype.__bootReady125=true;const old=GameEngine.prototype.setup;GameEngine.prototype.setup=function(){const r=old.apply(this,arguments);hideBootLoading();return r}}
function loadRuntime121Safely(cb){
  const NativeMO=window.MutationObserver;
  if(!NativeMO){loadScript('runtime-v0121-loader','./files/runtime-v0121.js?v=0121',cb);return}
  function SafeMO(callback){
    const real=new NativeMO(callback),nativeObserve=real.observe.bind(real);
    real.observe=function(target,options){
      if(target===document.documentElement&&options&&options.childList&&options.subtree){return}
      return nativeObserve(target,options);
    };
    return real;
  }
  SafeMO.prototype=NativeMO.prototype;
  window.MutationObserver=SafeMO;
  loadScript('runtime-v0121-loader','./files/runtime-v0121.js?v=0121',()=>{window.MutationObserver=NativeMO;if(cb)cb()});
}
function loadCompatibilityNow(){loadScript('runtime-v0118-fix-loader','./files/runtime-v0116-fix.js?v=0118',()=>loadScript('runtime-v0119-loader','./files/runtime-v0119.js?v=0119',()=>loadScript('runtime-v0120-loader','./files/runtime-v0120.js?v=0120',()=>loadScript('runtime-v0120-endfix-loader','./files/runtime-v0120-endfix.js?v=0120',()=>loadRuntime121Safely(()=>loadScript('runtime-v0122-loader','./files/runtime-v0122.js?v=0122',()=>loadScript('runtime-v0122-menufix-loader','./files/runtime-v0122-menufix.js?v=0122',()=>{holdVersion125();refreshCharacterMenu()})))))))}
function loadCompatibilityWhenBaseReady(){let tries=0;const t=setInterval(()=>{const S=window.B115;if(S&&window.BomberOnline&&S.els&&S.els.chatPanel&&S.els.publicBtn&&S.els.privateBtn){clearInterval(t);loadCompatibilityNow();return}if(++tries>250){clearInterval(t);console.error('Bomberman base networking did not finish initializing')}} ,20)}
document.addEventListener('DOMContentLoaded',()=>{GUILocalization();wrapSetupForBoot();gGameEngine.load();loadCompatibilityWhenBaseReady()});
window.addEventListener('error',()=>{const e=document.getElementById('bootLoading');if(e&&!e.hidden)e.textContent='Loading Bomberman…'});
setInterval(holdVersion125,400);