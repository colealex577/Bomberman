(function(){
'use strict';
var installed=false,S=null,V=null;
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function isLocalHuman(player){var g=G();if(!g||!player||!S)return false;var idx=g.players.indexOf(player);if(S.role==='simulated')return idx===0;if(S.role==='guest')return idx===1;if(S.role==='host')return idx===0;return false}
function markLocalEliminated(){var r=V&&V.round&&V.round();if(r)r.localEliminated=true}
function patchElimination(){
 if(!window.GameEngine)return;
 if(!GameEngine.prototype.__v127LocalElimFix){GameEngine.prototype.__v127LocalElimFix=true;var oldHuman=GameEngine.prototype.handleHumanDeath;GameEngine.prototype.handleHumanDeath=function(player){if(isLocalHuman(player))markLocalEliminated();return oldHuman.apply(this,arguments)}}
 if(S&&!S.__v127GuestElimFix){S.__v127GuestElimFix=true;var oldGuest=S.guestData;S.guestData=function(d){var r=oldGuest.apply(S,arguments);if(d&&d.type==='spectate'&&S.role==='guest')markLocalEliminated();return r}}
}
function patchSimulatedProfile(){
 if(!S||S.__v127SimProfileSeed||!window.BomberCharacter||!S.startSimulated)return;S.__v127SimProfileSeed=true;var old=S.startSimulated;
 S.startSimulated=function(){var g=G(),a=BomberCharacter.random(),rating=BomberCharacter.randomSimRating();S.simulatedRating=rating;if(g){g.simulatedAppearance=JSON.parse(JSON.stringify(a));g.simulatedRating=rating}var r=old.apply(S,arguments);setTimeout(function(){var gg=G(),sim=gg&&gg.simulatedOpponent;if(!sim)return;if(!sim.characterAppearance&&gg.simulatedAppearance){try{var sheet=BomberCharacter.makeSheet(gg.simulatedAppearance);if(sheet&&sim.bmp){sim.bmp.spriteSheet=new createjs.SpriteSheet({images:[sheet],frames:{width:48,height:48,regX:10,regY:12},animations:{idle:[0,0,'idle'],down:[0,3,'down',.1],left:[4,7,'left',.1],up:[8,11,'up',.1],right:[12,15,'right',.1],dead:[16,16,'dead',.1]}});sim.characterAppearance=JSON.parse(JSON.stringify(gg.simulatedAppearance));try{sim.bmp.gotoAndPlay('idle')}catch(e){}}}catch(e){}}},80);return r}
}
function removeMatchmakingLog(){
 var panel=$('v127SettingsPanel');if(!panel)return;
 ['v127SearchActivitySection'].forEach(function(id){var e=$(id);if(e)e.remove()});
 var sections=panel.querySelectorAll('.v127_section');for(var i=sections.length-1;i>=0;i--){var h=sections[i].querySelector('h3'),txt=h&&String(h.textContent||'');if(/matchmaking log|search activity/i.test(txt))sections[i].remove()}
}
function ensureCompatStyle(){if($('v127-fix-style'))return;var s=document.createElement('style');s.id='v127-fix-style';s.textContent='#qolElimRematchNow{display:none!important}#v127RematchNow:not([hidden]){display:inline-block!important;visibility:visible!important;opacity:1!important}';document.head.appendChild(s)}
function fixRematchButton(){var old=$('qolElimRematchNow'),current=$('v127RematchNow');if(old)old.style.setProperty('display','none','important');if(current)current.onclick=function(){if(V&&V.requestRematch)V.requestRematch()}}
function fixSettingsHandlers(){
 if(!V)return;removeMatchmakingLog();ensureCompatStyle();fixRematchButton();var tile=$('mainSettingsTile'),panel=$('v127SettingsPanel');
 if(tile&&!tile.__v127CleanSettings){tile.__v127CleanSettings=true;tile.onclick=function(){if(panel)panel.hidden=false;removeMatchmakingLog()}}
 if(V.openSettings&&!V.__cleanOpenSettings){V.__cleanOpenSettings=true;V.openSettings=function(){if(panel)panel.hidden=false;removeMatchmakingLog()}}
}
function install(){
 if(installed)return true;S=window.B115;V=window.BomberV127;if(!S||!V||!window.GameEngine||!V.round||!window.BomberCharacter)return false;
 patchElimination();patchSimulatedProfile();fixSettingsHandlers();V.fixLayerReady=true;installed=true;return true
}
var tries=0,t=setInterval(function(){if(install()){clearInterval(t);fixSettingsHandlers();setInterval(fixSettingsHandlers,300)}else if(++tries>700)clearInterval(t)},40);
})();
