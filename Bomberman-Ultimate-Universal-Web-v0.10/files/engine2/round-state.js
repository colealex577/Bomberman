/* Bomberman 2.0.2: round-owned bomb inventory and input actions. */
(function(global){
 'use strict';
 var attempts=0,placed=0,staleRemoved=0,blocked={inactive:0,occupied:0,capacity:0},last=null;
 function G(){return global.gGameEngine}
 function guest(){return !!(global.B115&&global.B115.role==='guest')}
 function live(a,g){return !!(a&&a.alive!==false&&g&&((g.players||[]).indexOf(a)>=0||(g.bots||[]).indexOf(a)>=0))}
 function syncOwned(a){
  var g=G();if(!a||!g||!Array.isArray(g.bombs)||guest())return a&&a.bombs||[];
  var owned=Array.isArray(a.bombs)?a.bombs:(a.bombs=[]),world=g.bombs;
  // Preserve array identity for existing explosion callbacks. Only discard objects no longer in this round.
  for(var i=owned.length-1;i>=0;i--){var b=owned[i];if(!b||world.indexOf(b)<0||owned.indexOf(b)!==i){owned.splice(i,1);staleRemoved++}}
  for(var j=0;j<world.length;j++){var b=world[j];if(b&&!b.exploded&&b.owner===a&&owned.indexOf(b)<0)owned.push(b)}
  return owned;
 }
 function capacity(a){return syncOwned(a).filter(function(b){return b&&!b.exploded&&!(b.__v160Moving&&(!b.owner||b.owner===a||b.__v16215Launcher===a||b.__v16211TravelOwner===a||b.__v16212TravelOwner===a))}).length}
 function occupied(a){var g=G(),p=a&&a.position;if(!g||!p)return false;return (g.bombs||[]).some(function(b){if(!b||b.exploded)return false;var q=b.position;if(b.__v160Moving&&b.bmp){if(global.BomberFix16219&&global.BomberFix16219.actualTile)q=global.BomberFix16219.actualTile(b)||q;else if(global.Utils&&global.Utils.convertToEntityPosition)q=global.Utils.convertToEntityPosition(b.bmp)||q;}return q&&q.x===p.x&&q.y===p.y})}
 function normal(a){
  var g=G();attempts++;last={round:g&&g.__setupSerial,slot:a&&a.id,kind:'normal'};
  if(!live(a,g)||guest()||g.lobbyOpen||g.matchFinished||g.menu&&g.menu.visible||typeof a.placeBomb!=='function'){blocked.inactive++;last.result='inactive';return false}
  syncOwned(a);a.bombKickArmed=false;
  if(occupied(a)){blocked.occupied++;last.result='occupied';return false}
  if(capacity(a)>=a.bombsMax){blocked.capacity++;last.result='capacity';return false}
  var b=a.placeBomb();if(b){placed++;last.result='placed'}else last.result='placement-rejected';return b;
 }
 function actorFor(action){var g=G();return (g&&g.players||[]).find(function(a){return a&&a.controls&&(a.controls.bomb===action||(a.controls.kick||(a.id===1?'kick2':'kick'))===action)})}
 function dispatch(action){var a=actorFor(action);if(!a||guest())return false;if(a.controls.bomb===action){if(typeof a.placeBomb!=='function')return false;normal(a);return true}if(live(a,G())&&typeof a.throwBombNow==='function'){syncOwned(a);a.throwBombNow();return true}return false}
 function afterSpawn(g){if(!g||guest())return;(g.players||[]).concat(g.bots||[]).forEach(function(a){if(!a)return;if(global.BomberSpeed161&&a.isBot)global.BomberSpeed161.normalize(a);else a.velocity=2;});}
 global.BomberEngine2Round=Object.freeze({isCurrent:function(a){return live(a,G())&&!guest()},syncOwned:syncOwned,capacity:capacity,occupied:occupied,normal:normal,dispatch:dispatch,afterSpawn:afterSpawn,snapshot:function(){var g=G();return{attempts:attempts,placed:placed,staleRemoved:staleRemoved,blocked:Object.assign({},blocked),last:last,actors:(g&&g.players||[]).concat(g&&g.bots||[]).map(function(a){return{slot:a.id,bot:!!a.isBot,simulated:!!a.simulatedHuman,speed:a.velocity,owned:(a.bombs||[]).length,capacity:a.bombsMax}})}}});
})(window);
