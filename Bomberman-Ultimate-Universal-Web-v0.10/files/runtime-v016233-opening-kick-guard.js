(function(){
'use strict';
var detours=0,blocked=0;
function G(){return window.gGameEngine||null}
function k(p){return p&&p.x+','+p.y}
function eq(a,b){return !!(a&&b&&a.x===b.x&&a.y===b.y)}
function move(p,d){return{x:p.x+d.x,y:p.y+d.y}}
function legal(b,p){var g=G();if(!g||!p)return false;if(g.getTileMaterial&&g.getTileMaterial(p)!=='grass')return false;
 if(b.hasBomb&&b.hasBomb(p))return false;if(b.isSafe&&!b.isSafe(p))return false;
 var actors=(g.players||[]).concat(g.bots||[]);
 return !actors.some(function(a){return a&&a!==b&&a.alive!==false&&eq(a.position,p)})
}
function steps(b,p){return[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].map(function(d){return move(p,d)}).filter(function(n){return legal(b,n)})}
function state(b){return b.__v16233Opening||(b.__v16233Opening={round:null,seen:[],plan:[],started:0})}
function obs(b){var s=state(b),g=G(),id=g&&(g.__v127Round||g.__v16230RestartToken||g.__v152RosterMode||g);
 if(s.round!==id){s.round=id;s.seen=[];s.plan=[];s.started=Date.now()}
 var a=k(b.position);if(a&&s.seen[s.seen.length-1]!==a){s.seen.push(a);if(s.seen.length>10)s.seen.shift()}return s
}
function route(b,s,avoid){var q=[{p:b.position,path:[]}],seen={};seen[k(b.position)]=1;var best=null,score=-1e9;
 for(var i=0;i<q.length;i++){var v=q[i];if(v.path.length>=5)continue;var n=steps(b,v.p);
  for(var j=0;j<n.length;j++){var p=n[j],name=k(p);if(seen[name])continue;seen[name]=1;
   var path=v.path.concat([p]);q.push({p:p,path:path});if(k(path[0])===avoid)continue;
   var bonus=(G().bonuses||[]).some(function(t){return t&&eq(t.position,p)});
   var wood=!!(b.hasAdjacentWood&&b.hasAdjacentWood(p));
   var val=(s.seen.indexOf(name)<0?13:0)+Math.min(path.length,4)*3+(wood?5:0)+(bonus?9:0);
   if(val>score){score=val;best=path}
  }
 }return best
}
function redirect(b,p){if(!p||!b.position)return p;var s=obs(b),g=G(),h=s.seen;
 if(!g||!g.playing||!g.menu||g.menu.visible||g.lobbyOpen||b.alive===false||b.escapeMode||b.hyperAggressive||
    Date.now()-s.started>45000||(b.isSafe&&!b.isSafe(b.position))){s.plan=[];return p}
 if(s.plan.length){if(k(s.plan[0])===k(b.position))s.plan.shift();
  if(s.plan.length&&legal(b,s.plan[0]))return s.plan.shift();s.plan=[]}
 if(h.length<4||k(p)!==h[h.length-2]||h[h.length-1]!==h[h.length-3]||h[h.length-2]!==h[h.length-4])return p;
 var path=route(b,s,k(p));if(!path||!path.length)return p;s.plan=path.slice(1);detours++;return path[0]
}
function dir(a){var d=null;try{d=a.getBombKickDirection&&a.getBombKickDirection()}catch(e){}
 d=d||a.lastMoveDirection;if(!d)return null;var x=Number(d.x)||0,y=Number(d.y)||0;
 if(Math.abs(x)>=Math.abs(y)&&x)return{x:x>0?1:-1,y:0};if(y)return{x:0,y:y>0?1:-1};return null
}
function outward(a){var g=G(),p=a&&a.position,d=a&&dir(a);if(!g||!p||!d||!isFinite(Number(g.tilesX))||!isFinite(Number(g.tilesY)))return false;
 var n=move(p,d);return(n.x<=0||n.y<=0||n.x>=g.tilesX-1||n.y>=g.tilesY-1)&&(!g.getTileMaterial||g.getTileMaterial(n)==='wall')
}
function install(){var B=window.Bot,P=window.Player;
 if(B&&B.prototype.setNextTile&&!B.prototype.setNextTile.__v16233){var old=B.prototype.setNextTile;
  function set(p){var n=p;try{n=redirect(this,p)}catch(e){}return old.call(this,n)}set.__v16233=true;B.prototype.setNextTile=set}
 if(P&&P.prototype.placeBomb&&!P.prototype.placeBomb.__v16233){var prior=P.prototype.placeBomb;
  function place(){if(this.bombKickArmed&&Number(this.bombKickCharges)>0&&outward(this)){blocked++;return false}return prior.apply(this,arguments)}
  place.__v16233=true;P.prototype.placeBomb=place}
}
window.BomberFix16233={version:'v0.16.2.33',outward:outward,redirect:redirect,install:install,stats:function(){return{detours:detours,blockedOutwardThrows:blocked}}};
install();setInterval(install,180);
})();