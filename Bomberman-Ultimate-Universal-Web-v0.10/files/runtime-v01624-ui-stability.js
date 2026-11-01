(function(){
'use strict';
var VERSION='v0.16.2.4',installed=false,patched=false;
function $(id){return document.getElementById(id)}
function setNativeText(node,text){var d=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');if(d&&d.set)d.set.call(node,text);else node.textContent=text}
function stableButtonText(node,value){
 if(!node||node.disabled||!window.BomberSocial130||typeof BomberSocial130.set!=='function')return value;
 var id=node.id;if(id!=='qolReplayBtn'&&id!=='v127RematchNow'&&id!=='v127SpectateRematch')return value;
 var s=null;try{s=BomberSocial130.set()}catch(e){}var next=!!(s&&Number(s.bestOf)>1&&!s.complete),done=!!(s&&Number(s.bestOf)>1&&s.complete);
 if(id==='v127SpectateRematch')return next?'Request next round':(done?'Request new set':'Request rematch');
 return next?'Next round now':(done?'New set':'Rematch now')
}
function patchRedundantDomWrites(){
 if(patched)return;patched=true;
 var td=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
 if(td&&td.get&&td.set){Object.defineProperty(Node.prototype,'textContent',{configurable:td.configurable,enumerable:td.enumerable,get:td.get,set:function(v){var next=v==null?'':String(v);next=stableButtonText(this,next);var cur='';try{cur=td.get.call(this)}catch(e){}if(cur===next)return;td.set.call(this,next)}})}
 var hd=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 if(hd&&hd.get&&hd.set){Object.defineProperty(Element.prototype,'innerHTML',{configurable:hd.configurable,enumerable:hd.enumerable,get:hd.get,set:function(v){var next=v==null?'':String(v),cur='';try{cur=hd.get.call(this)}catch(e){}if(cur===next)return;hd.set.call(this,next)}})}
 var oldSet=Element.prototype.setAttribute;
 if(oldSet&&!oldSet.__v1624Stable){var fn=function(name,value){var next=String(value);try{if(this.getAttribute(name)===next)return}catch(e){}return oldSet.call(this,name,value)};fn.__v1624Stable=true;Element.prototype.setAttribute=fn}
}
function ensureStyle(){
 var s=$('v1624UiStyle');if(s)return s;s=document.createElement('style');s.id='v1624UiStyle';s.textContent=`
[id^="buildVersion"]{display:none!important}
#buildVersion1624{display:block!important;position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
#onlineMatchStatus{display:none!important}
#v137MatchStatus{display:inline-block!important;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qol_stat_name,.qol_stat_count,.v125_points,#v130SetHud,#v137MatchStatus{font-variant-numeric:tabular-nums}
`;(document.head||document.documentElement).appendChild(s);return s
}
function badge(){
 ensureStyle();var b=$('buildVersion1624');if(!b){b=document.createElement('div');b.id='buildVersion1624';b.setAttribute('aria-label','Game version');(document.body||document.documentElement).appendChild(b)}if(b.textContent!==VERSION)setNativeText(b,VERSION);var title='Bomberman '+VERSION;if(document.title!==title)document.title=title
}
function stableMatchChrome(){
 var S=window.B115,bar=S&&S.els&&S.els.matchBar||$('onlineMatchBar'),legacy=S&&S.els&&S.els.matchStatus||$('onlineMatchStatus');if(legacy)legacy.classList.add('v137_legacy_hidden');
 var stable=$('v137MatchStatus');if(stable&&bar&&stable.parentNode!==bar){try{bar.appendChild(stable)}catch(e){}}
}
function stableHud(){
 var hud=$('qolStatHud');if(!hud)return;var boxes=hud.querySelectorAll('.qol_stat_box');for(var i=0;i<boxes.length;i++){
  var b=boxes[i],name=b.querySelector('.qol_stat_name'),points=b.querySelector('.v125_points');
  if(name&&name.getAttribute('aria-live')!=='off')name.setAttribute('aria-live','off');if(points&&points.getAttribute('aria-live')!=='off')points.setAttribute('aria-live','off');
  var counts=b.querySelectorAll('.qol_stat_count');for(var j=0;j<counts.length;j++)if(counts[j].getAttribute('aria-live')!=='off')counts[j].setAttribute('aria-live','off')
 }
}
function normalizeButtons(){
 ['qolReplayBtn','v127RematchNow','v127SpectateRematch'].forEach(function(id){var e=$(id);if(!e||e.disabled)return;var next=stableButtonText(e,e.textContent);if(e.textContent!==next)setNativeText(e,next)})
}
function cleanupDuplicateTyping(){
 var ids=['v137Typing','v157Typing','v158Typing'],found=null;for(var i=ids.length-1;i>=0;i--){var e=$(ids[i]);if(!e)continue;if(!found)found=e;else e.remove()}
}
function install(){
 if(installed)return true;if(!document.body)return false;patchRedundantDomWrites();installed=true;badge();stableMatchChrome();stableHud();normalizeButtons();cleanupDuplicateTyping();
 window.BomberUIStability1624={version:VERSION,refresh:function(){badge();stableMatchChrome();stableHud();normalizeButtons();cleanupDuplicateTyping()}};return true
}
var tries=0,t=setInterval(function(){if(install()||++tries>800)clearInterval(t)},25);
setInterval(function(){if(!installed)return;badge();stableMatchChrome();stableHud();normalizeButtons();cleanupDuplicateTyping()},500);
})();