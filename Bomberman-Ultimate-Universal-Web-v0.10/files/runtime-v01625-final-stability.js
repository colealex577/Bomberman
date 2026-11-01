(function(){
'use strict';
var VERSION='v0.16.2.5',installed=false,normalizing=false,observer=null;
window.BOMBERMAN_BUILD_VERSION=VERSION;
function $(id){return document.getElementById(id)}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function ensureStyle(){
 var s=$('v1625FinalStyle');if(s)return;s=document.createElement('style');s.id='v1625FinalStyle';s.textContent=`
[id^="buildVersion"],#releaseBadge1561,#v139SearchShield{display:none!important}
#buildVersion1625{display:block!important;position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.72);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
#onlineMatchStatus{display:none!important}#v137MatchStatus{display:inline-block!important;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;(document.head||document.documentElement).appendChild(s)
}
function version(){
 ensureStyle();window.BOMBERMAN_BUILD_VERSION=VERSION;var b=$('buildVersion1625');if(!b){b=document.createElement('div');b.id='buildVersion1625';b.setAttribute('aria-label','Game version');document.body.appendChild(b)}setText(b,VERSION);if(document.title!=='Bomberman '+VERSION)document.title='Bomberman '+VERSION;
 var legacy=$('releaseBadge1561');if(legacy)legacy.hidden=true
}
function scrubText(t){t=String(t||'');return t.replace(/simulated fallback/ig,'matchmaking fallback').replace(/simulated opponent/ig,'public opponent').replace(/simulated player/ig,'player').replace(/simulated/ig,'public')}
function normalizeLobby(){
 if(normalizing)return;var root=$('multiplayerLobby');if(!root)return;normalizing=true;try{
  var h=root.querySelector('.lobby_heading h2');if(h)setText(h,'Online Multiplayer');var hp=root.querySelector('.lobby_heading p');if(hp)setText(hp,'Find a public match or play privately with a friend.');
  var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while((n=walker.nextNode())){var t=n.nodeValue||'',x=scrubText(t);if(x!==t)n.nodeValue=x}
  // v0.13.9 and v0.14.0 both installed public-search shields. Keep only the newer owner.
  var old=$('v139SearchShield');if(old)old.hidden=true;if(document.body.classList.contains('v139_public_latched'))document.body.classList.remove('v139_public_latched');
 }finally{normalizing=false}
}
function cleanupTyping(){var ids=['v137Typing','v139Typing','v157Typing','v158Typing'],keep=null;for(var i=ids.length-1;i>=0;i--){var e=$(ids[i]);if(!e)continue;if(!keep)keep=e;else e.remove()}}
function observe(){
 if(observer||!window.MutationObserver)return;var root=$('multiplayerLobby');if(!root)return;observer=new MutationObserver(function(){normalizeLobby();version();cleanupTyping()});observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']})
}
function install(){if(installed||!document.body)return false;installed=true;version();normalizeLobby();cleanupTyping();observe();window.BomberFinalStability1625={version:VERSION,refresh:function(){version();normalizeLobby();cleanupTyping()}};return true}
var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},25);
setInterval(function(){if(!installed)return;version();normalizeLobby();cleanupTyping();if(!observer)observe()},700);
})();
