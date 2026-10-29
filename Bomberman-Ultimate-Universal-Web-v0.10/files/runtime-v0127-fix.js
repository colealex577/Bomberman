(function(){
'use strict';
var S=window.B115,V=window.BomberV127;
if(!S||!V||!window.GameEngine)return;
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function isLocalHuman(player){var g=G();if(!g||!player)return false;var idx=g.players.indexOf(player);if(S.role==='simulated')return idx===0;if(S.role==='guest')return idx===1;if(S.role==='host')return idx===0;return false}
function markLocalEliminated(){var r=V.round&&V.round();if(r)r.localEliminated=true}

if(!GameEngine.prototype.__v127LocalElimFix){
 GameEngine.prototype.__v127LocalElimFix=true;
 var oldHuman=GameEngine.prototype.handleHumanDeath;
 GameEngine.prototype.handleHumanDeath=function(player){if(isLocalHuman(player))markLocalEliminated();return oldHuman.apply(this,arguments)}
}
if(!S.__v127GuestElimFix){
 S.__v127GuestElimFix=true;var oldGuest=S.guestData;
 S.guestData=function(d){var r=oldGuest.apply(S,arguments);if(d&&d.type==='spectate'&&S.role==='guest')markLocalEliminated();return r}
}

function renderLogDisplay(){
 var root=$('v127LogListDisplay');if(!root)return;var a=(V.getLog?V.getLog():[]).slice().reverse().slice(0,40);root.textContent='';
 if(!a.length){var empty=document.createElement('div');empty.className='v127_empty';empty.textContent='No public matchmaking activity recorded on this device yet.';root.appendChild(empty);return}
 for(var i=0;i<a.length;i++){var x=a[i],row=document.createElement('div');row.className='v127_log_row';var time=document.createElement('time'),user=document.createElement('strong'),result=document.createElement('span'),t=new Date(x.ts);time.textContent=t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});user.textContent=x.username||'Player';result.textContent=x.result||x.event||'';row.appendChild(time);row.appendChild(user);row.appendChild(result);root.appendChild(row)}
}
function detachHotLog(){var live=$('v127LogList');if(live){live.id='v127LogListDisplay';renderLogDisplay()}}
function ensureCompatStyle(){if($('v127-fix-style'))return;var s=document.createElement('style');s.id='v127-fix-style';s.textContent='#qolElimRematchNow{display:none!important}#v127RematchNow:not([hidden]){display:inline-block!important;visibility:visible!important;opacity:1!important}';document.head.appendChild(s)}
function fixRematchButton(){var old=$('qolElimRematchNow'),current=$('v127RematchNow');if(old)old.style.setProperty('display','none','important');if(current)current.onclick=function(){if(V.requestRematch)V.requestRematch()}}
function fixSettingsHandlers(){
 detachHotLog();ensureCompatStyle();fixRematchButton();var tile=$('mainSettingsTile'),panel=$('v127SettingsPanel'),clear=$('v127ClearLog');
 if(tile&&!tile.__v127StableLog){tile.__v127StableLog=true;tile.onclick=function(){if(panel)panel.hidden=false;renderLogDisplay()}}
 if(clear&&!clear.__v127StableLog){clear.__v127StableLog=true;clear.onclick=function(){if(V.clearLog)V.clearLog();renderLogDisplay()}}
 if(V.openSettings&&!V.__stableOpenSettings){V.__stableOpenSettings=true;V.openSettings=function(){if(panel)panel.hidden=false;renderLogDisplay()}}
}
setInterval(fixSettingsHandlers,300);setTimeout(fixSettingsHandlers,0);
V.renderLocalLog=renderLogDisplay;
})();
