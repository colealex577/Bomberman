(function(){
'use strict';
var VERSION='v0.15.1',installed=false;
function badge(){var all=document.querySelectorAll('[id^="buildVersion"]');for(var i=0;i<all.length;i++)if(all[i].id!=='buildVersion150')all[i].style.display='none';var b=document.getElementById('buildVersion150');if(!b){b=document.createElement('div');b.id='buildVersion150';b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none';document.body.appendChild(b)}b.textContent=VERSION;document.title='Bomberman '+VERSION}
function install(){if(installed)return true;if(!window.BomberAI150||!window.BomberOpening144||!window.BomberPreload150||!window.BomberMatchmaking151||!window.BomberPolish151)return false;installed=true;badge();window.BomberRelease150={version:VERSION,ai:'persistent-intent/time-aware/reservation/loop-recovery + farming/human-movement polish',preload:'native-images',matchmaking:'first-run public-search repair',openingFix:BomberOpening144.version};return true}
var n=0,t=setInterval(function(){if(install()||++n>900)clearInterval(t)},40);setInterval(function(){if(installed)badge()},1000);
})();
