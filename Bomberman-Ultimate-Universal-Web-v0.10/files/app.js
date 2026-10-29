const LOCAL_MESSAGES={Player1:'Player 1',Player2:'Player 2',move:'move',bomb:'plant the bomb',mute:'mute / unmute sound',restart:'restart',menu:'menu'};
let getLocalsMessage=(name)=>LOCAL_MESSAGES[name]||name;
function GUILocalization(){document.querySelector('#player1').textContent=getLocalsMessage('Player1');document.querySelector('#player2').textContent=getLocalsMessage('Player2');document.querySelector('#movement1').textContent=getLocalsMessage('move');document.querySelector('#bomb1').textContent=getLocalsMessage('bomb');document.querySelector('#movement2').textContent=getLocalsMessage('move');document.querySelector('#bomb2').textContent=getLocalsMessage('bomb');document.querySelector('#mute').textContent=getLocalsMessage('mute');document.querySelector('#restart').textContent=getLocalsMessage('restart');document.querySelector('#menu').textContent=getLocalsMessage('menu')}
let Storage={setValue:(key,value)=>{localStorage[key]=JSON.stringify(value)},getValue:(key)=>{let result;try{if(localStorage[key])result=JSON.parse(localStorage[key])}catch(e){throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`)}return result}};
class StorageError extends Error{constructor(msg){super();this.name='StorageError';this.message=msg||'Storage Error';this.stack=(new Error()).stack}}
window.BOMBERMAN_CURRENT_VERSION='v0.12.6';
const BOMBERMAN_DIAG=(new URLSearchParams(location.search)).get('diag')||'all';
const DIAG_LEVEL={base:0,'118':1,'119':2,'120':3,'120end':4,'121':5,'122':6,'122menu':7,all:7};
function diagAllows(level){return (DIAG_LEVEL[BOMBERMAN_DIAG]??7)>=level}
function loadScript(id,src,cb){if(document.getElementById(id)){if(cb)cb();return}const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>{if(cb)cb()};s.onerror=()=>{console.error('Bomberman module failed:',src);if(cb)cb()};document.head.appendChild(s)}
function holdVersion126(){let v=document.getElementById('buildVersionCurrent126');if(!v){v=document.createElement('div');v.id='buildVersionCurrent126';document.body.appendChild(v);let s=v.style;s.position='fixed';s.top='calc(env(safe-area-inset-top, 0px) + 5px)';s.left='calc(env(safe-area-inset-left, 0px) + 6px)';s.zIndex='2147483647';s.display='block';s.padding='2px 5px';s.borderRadius='4px';s.background='rgba(0,0,0,.76)';s.color='#fff';s.font='700 9px/1.25 Arial,sans-serif';s.pointerEvents='none'}v.textContent=window.BOMBERMAN_CURRENT_VERSION}
function refreshCharacterMenu(){let n=0;const t=setInterval(()=>{if(window.BomberCharacter&&window.gGameEngine&&gGameEngine.playerBoyImg&&gGameEngine.menu){clearInterval(t);if(gGameEngine.menu.visible){gGameEngine.menu.hide();gGameEngine.menu.show()}return}if(++n>100)clearInterval(t)},80)}
function hideBootLoading(){const e=document.getElementById('bootLoading');if(e)e.hidden=true}
function wrapSetupForBoot(){if(!window.GameEngine||GameEngine.prototype.__bootReady126)return;GameEngine.prototype.__bootReady126=true;const old=GameEngine.prototype.setup;GameEngine.prototype.setup=function(){const r=old.apply(this,arguments);hideBootLoading();return r}}
function finishCompat(){holdVersion126();if(diagAllows(6))refreshCharacterMenu()}
function loadRuntime121Safely(cb){const NativeMO=window.MutationObserver;if(!NativeMO){loadScript('runtime-v0121-loader','./files/runtime-v0121.js?v=0121',cb);return}function SafeMO(callback){const real=new NativeMO(callback),nativeObserve=real.observe.bind(real);real.observe=function(target,options){if(target===document.documentElement&&options&&options.childList&&options.subtree)return;return nativeObserve(target,options)};return real}SafeMO.prototype=NativeMO.prototype;window.MutationObserver=SafeMO;loadScript('runtime-v0121-loader','./files/runtime-v0121.js?v=0121',()=>{window.MutationObserver=NativeMO;if(cb)cb()})}
function loadCompatibilityNow(){
  if(!diagAllows(1)){finishCompat();return}
  loadScript('runtime-v0118-fix-loader','./files/runtime-v0116-fix.js?v=0118',()=>{
    if(!diagAllows(2)){finishCompat();return}
    loadScript('runtime-v0119-loader','./files/runtime-v0119.js?v=0119',()=>{
      if(!diagAllows(3)){finishCompat();return}
      loadScript('runtime-v0120-loader','./files/runtime-v0120.js?v=0120',()=>{
        if(!diagAllows(4)){finishCompat();return}
        loadScript('runtime-v0120-endfix-loader','./files/runtime-v0120-endfix.js?v=0120',()=>{
          if(!diagAllows(5)){finishCompat();return}
          loadRuntime121Safely(()=>{
            if(!diagAllows(6)){finishCompat();return}
            loadScript('runtime-v0122-loader','./files/runtime-v0122.js?v=0122',()=>{
              if(!diagAllows(7)){finishCompat();return}
              loadScript('runtime-v0122-menufix-loader','./files/runtime-v0122-menufix.js?v=0122',finishCompat)
            })
          })
        })
      })
    })
  })
}
function loadCompatibilityWhenBaseReady(){let tries=0;const t=setInterval(()=>{const S=window.B115;if(S&&window.BomberOnline&&S.els&&S.els.chatPanel&&S.els.publicBtn&&S.els.privateBtn){clearInterval(t);loadCompatibilityNow();return}if(++tries>250){clearInterval(t);console.error('Bomberman base networking did not finish initializing')}} ,20)}
document.addEventListener('DOMContentLoaded',()=>{GUILocalization();wrapSetupForBoot();holdVersion126();gGameEngine.load();loadCompatibilityWhenBaseReady()});
window.addEventListener('error',()=>{const e=document.getElementById('bootLoading');if(e&&!e.hidden)e.textContent='Loading Bomberman…'});
setInterval(holdVersion126,1000);