/* v2.2.0: layout only. No game actor, rank, input or network state is modified. */
(function(w){'use strict';
 var doc=w.document, dock=null, moved=new Map();
 function $(id){return doc.getElementById(id)}
 function move(el){if(!el||!dock||el.parentNode===dock)return;if(!moved.has(el)){var marker=doc.createComment('bm212 dock '+el.id);el.parentNode.insertBefore(marker,el);moved.set(el,marker)}dock.appendChild(el)}
 function restore(){moved.forEach(function(marker,el){if(marker.parentNode){marker.parentNode.insertBefore(el,marker);marker.remove()}});moved.clear()}
 function sync(){var b=doc.body,g=w.gGameEngine,s=w.B115;if(!b)return;var touch=b.classList.contains('touch-ui'),watch=!!(touch&&g&&s&&!b.classList.contains('bm210-home')&&(s.role==='spectator'||g.playing&&(!g.menu||!g.menu.visible)&&(g.__v152RosterMode==='observe'||g.spectatorMode||b.classList.contains('qol_has_stats')&&g.players&&g.players[0]&&g.players[0].alive===false&&s.role!=='offline')));b.classList.toggle('bm212-watch',watch);b.classList.toggle('bm212-remote-watch',watch&&s.role==='spectator');if(!watch){if(dock&&!dock.hidden){restore();dock.hidden=true}return}
  var container=$('localStage')&&$('localStage').parentNode;if(!container)return;if(!dock){dock=doc.createElement('div');dock.id='bm212ObserverDock';dock.hidden=true;container.insertBefore(dock,$('mobileControls'))}dock.hidden=false;
  // The existing chat DOM and its listeners are retained, not recreated. The
  // old mobile chat strip is used for simulated observers, actual chat for live.
  ['v154MobileChat','v154MobileChatOverlay','v152ObserverHud','v157SpectatingBar'].forEach(function(id){move($(id))});if(s.role==='spectator')move($('chatPanel'));
 }
 function init(){sync();w.setInterval(sync,200);w.addEventListener('resize',sync,{passive:true});w.addEventListener('orientationchange',sync,{passive:true})}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
