(function(){
'use strict';
var VERSION='v0.15.1',capturedStart=null,lastRepair=0,repairing=false;
function S(){return window.B115||null}
function button(){return document.getElementById('publicMatchBtn')}
function live(){var s=S();return!!(s&&(s.started||s.role==='simulated'||(s.kind==='public'&&(s.role==='host'||s.role==='guest'))))}
function capture(){var b=button();if(!b)return false;if(typeof b.onclick==='function'&&b.onclick!==repairStart)capturedStart=b.onclick;if(!b.__v151PublicCapture){b.__v151PublicCapture=true;b.addEventListener('click',function(){if(typeof b.onclick==='function'&&b.onclick!==repairStart)capturedStart=b.onclick;[0,70,220].forEach(function(ms){setTimeout(function(){ensureStarted(b)},ms)})},true)}return!!capturedStart}
function repairStart(b){return ensureStarted(b||button())}
function ensureStarted(b){var s=S();if(!s||live()||repairing)return true;b=b||button();if(!b)return false;var fn=capturedStart;if(typeof b.onclick==='function'&&b.onclick!==repairStart)fn=capturedStart=b.onclick;if(typeof fn!=='function')return false;var t=Date.now();if(t-lastRepair<55)return false;lastRepair=t;repairing=true;try{fn.call(b)}catch(e){try{if(window.console&&console.warn)console.warn('[v0.15.1] public matchmaking repair',e)}catch(x){}}finally{repairing=false}return live()}
function install(){capture();window.BomberMatchmaking151={version:VERSION,ready:function(){return!!capturedStart},ensureStarted:ensureStarted,isLive:live};if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberMatchmaking151.debug={captured:function(){return!!capturedStart},dropHandler:function(){var b=button();if(b)b.onclick=null;return!!b},restoreHandler:function(){var b=button();if(b&&capturedStart)b.onclick=capturedStart;return!!(b&&b.onclick)},repair:function(){return ensureStarted(button())}};return true}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#publicMatchBtn');if(!b)return;if(typeof b.onclick==='function'&&b.onclick!==repairStart)capturedStart=b.onclick;setTimeout(function(){ensureStarted(b)},45)},true);
var tries=0,t=setInterval(function(){capture();if(++tries>1200)clearInterval(t)},25);
if(document.readyState!=='loading')install();else document.addEventListener('DOMContentLoaded',install,{once:true});
})();
