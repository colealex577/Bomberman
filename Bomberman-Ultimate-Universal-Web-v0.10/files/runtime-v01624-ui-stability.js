(function(){
'use strict';
var VERSION=window.BomberBuildVersion||'v0.16.2.9',installed=false;
function $(id){return document.getElementById(id)}
function setText(node,text){if(node&&node.textContent!==text)node.textContent=text}
function ensureStyle(){
 var s=$('v1624UiStyle');if(s)return s;s=document.createElement('style');s.id='v1624UiStyle';s.textContent=`
[id^="buildVersion"]{display:none!important}
#onlineMatchStatus{display:none!important}
#v137MatchStatus{display:inline-block!important;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qol_stat_name,.qol_stat_count,.v125_points,#v130SetHud,#v137MatchStatus{font-variant-numeric:tabular-nums}
body.qol_toolbar_active .game_toolbar{width:min(96vw,545px)!important;max-width:545px!important;box-sizing:border-box!important;min-width:0!important}
#onlineMatchBar{min-width:0!important;max-width:100%!important}
`; (document.head||document.documentElement).appendChild(s);return s
}
function ownVersion(){
 ensureStyle();window.BomberBuildVersion=VERSION;
 var b=$('releaseBadge1561');if(b){var strong=b.querySelector('strong'),label='Bomberman '+VERSION+', Remastered by Cole Alexander';setText(strong,VERSION);if(b.getAttribute('aria-label')!==label)b.setAttribute('aria-label',label)}
 var title='Bomberman '+VERSION;if(document.title!==title)document.title=title
}
function stableMatchChrome(){
 var S=window.B115,bar=S&&S.els&&S.els.matchBar||$('onlineMatchBar'),legacy=S&&S.els&&S.els.matchStatus||$('onlineMatchStatus');if(legacy)legacy.classList.add('v137_legacy_hidden');
 var stable=$('v137MatchStatus');if(stable&&bar&&stable.parentNode!==bar)try{bar.appendChild(stable)}catch(e){}
}
function stableHud(){var hud=$('qolStatHud');if(!hud)return;var nodes=hud.querySelectorAll('.qol_stat_name,.qol_stat_count,.v125_points');for(var i=0;i<nodes.length;i++)if(nodes[i].getAttribute('aria-live')!=='off')nodes[i].setAttribute('aria-live','off')}
function cleanupDuplicateTyping(){var ids=['v137Typing','v157Typing','v158Typing'],keep=null;for(var i=ids.length-1;i>=0;i--){var e=$(ids[i]);if(!e)continue;if(!keep)keep=e;else e.remove()}}
function install(){if(installed)return true;if(!document.body)return false;installed=true;ownVersion();stableMatchChrome();stableHud();cleanupDuplicateTyping();window.BomberUIStability1624={version:VERSION,refresh:function(){ownVersion();stableMatchChrome();stableHud();cleanupDuplicateTyping()}};return true}
var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},25);
setInterval(function(){if(!installed)return;ownVersion();stableMatchChrome();stableHud();cleanupDuplicateTyping()},1200);
})();
