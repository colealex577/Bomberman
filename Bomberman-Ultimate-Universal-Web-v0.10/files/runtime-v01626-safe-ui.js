(function(){
'use strict';
var VERSION='v0.16.2.6',installed=false;
window.BOMBERMAN_BUILD_VERSION=VERSION;
function $(id){return document.getElementById(id)}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function ensureStyle(){
 var s=$('v1626SafeStyle');if(s)return;s=document.createElement('style');s.id='v1626SafeStyle';s.textContent=`
[id^="buildVersion"]:not(#buildVersion1626),#releaseBadge1561,#v139SearchShield{display:none!important}
#buildVersion1626{display:block!important;position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.72);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
#onlineMatchStatus{display:none!important}#v137MatchStatus{display:inline-block!important;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;(document.head||document.documentElement).appendChild(s)
}
function version(){
 ensureStyle();window.BOMBERMAN_BUILD_VERSION=VERSION;
 if(!document.body)return;
 var b=$('buildVersion1626');if(!b){b=document.createElement('div');b.id='buildVersion1626';b.setAttribute('aria-label','Game version');document.body.appendChild(b)}setText(b,VERSION);
 if(document.title!=='Bomberman '+VERSION)document.title='Bomberman '+VERSION;
 var old=$('v139SearchShield');if(old&&!old.hidden)old.hidden=true
}
function scrubText(t){return String(t||'').replace(/simulated fallback/ig,'matchmaking fallback').replace(/simulated opponent/ig,'public opponent').replace(/simulated player/ig,'player').replace(/simulated/ig,'public')}
function normalizeLobby(){
 var root=$('multiplayerLobby');if(!root)return;
 var h=root.querySelector('.lobby_heading h2');if(h)setText(h,'Online Multiplayer');
 var p=root.querySelector('.lobby_heading p');if(p)setText(p,'Find a public match or play privately with a friend.');
 var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while((n=walker.nextNode())){var t=n.nodeValue||'',x=scrubText(t);if(x!==t)n.nodeValue=x}
}
function cleanupTyping(){var ids=['v137Typing','v139Typing','v157Typing','v158Typing'],keep=null;for(var i=ids.length-1;i>=0;i--){var e=$(ids[i]);if(!e)continue;if(!keep)keep=e;else e.remove()}}
function refresh(){version();normalizeLobby();cleanupTyping()}
function scheduleRefresh(){[0,80,250,650].forEach(function(ms){setTimeout(refresh,ms)})}
function install(){
 if(installed||!document.body)return false;installed=true;refresh();
 document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('#multiplayerLobby,#publicMatchBtn,#onlineHostBtn,#onlineShowJoinBtn,#localMultiBtn,#lobbyCloseBtn,#hostCancelBtn,#joinBackBtn');if(t)scheduleRefresh()},true);
 window.addEventListener('pageshow',scheduleRefresh,{passive:true});window.addEventListener('focus',scheduleRefresh,{passive:true});
 window.BomberSafeUI1626={version:VERSION,refresh:refresh};return true
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
