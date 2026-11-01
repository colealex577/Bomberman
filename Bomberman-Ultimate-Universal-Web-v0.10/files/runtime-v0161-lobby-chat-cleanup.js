(function(){
'use strict';
var VERSION='v0.16.1',installed=false;
function S(){return window.B115||null}
function O(){try{return window.BomberHumanObserver152&&BomberHumanObserver152.state?BomberHumanObserver152.state():null}catch(e){return null}}
function publicActive(){var s=S(),o=O(),mode=o&&o.mode||'';if(mode==='observe'||mode==='joined')return true;return !!(s&&s.kind==='public'&&(s.started||s.role==='host'||s.role==='guest'||s.role==='simulated'))}
function clearIfOutside(){if(publicActive())return false;try{if(window.BomberBehavior157&&BomberBehavior157.clearChat)BomberBehavior157.clearChat()}catch(e){}return true}
function settleClear(){[0,40,120,300,750,1300,1900].forEach(function(ms){setTimeout(clearIfOutside,ms)})}
function patch(){
 var b=window.BomberBehavior157;if(!b||!b.death||typeof b.death.leave!=='function')return false;
 if(b.death.leave.__v161LobbyCleanup){installed=true;return true}
 var old=b.death.leave;
 function leave(){var r=old.apply(this,arguments);clearIfOutside();settleClear();return r}
 leave.__v161LobbyCleanup=true;leave.__v161Wrapped=old;b.death.leave=leave;
 var a=window.BomberHumanObserver152;if(a&&typeof a.leaveObserver==='function'&&!a.leaveObserver.__v161LobbyCleanup){var oldLeave=a.leaveObserver;function observerLeave(){var r=oldLeave.apply(this,arguments);clearIfOutside();settleClear();return r}observerLeave.__v161LobbyCleanup=true;observerLeave.__v161Wrapped=oldLeave;a.leaveObserver=observerLeave}
 installed=true;return true
}
window.BomberLobbyCleanup161={version:VERSION,publicActive:publicActive,clearIfOutside:clearIfOutside,settleClear:settleClear};
var tries=0,t=setInterval(function(){if(patch()||++tries>1200)clearInterval(t)},25);setInterval(function(){if(!installed)patch()},250);
})();