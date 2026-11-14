(function(){
'use strict';
var VERSION='v0.16.2.9-ai',installed=false;
var DIRS=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];
function G(){return window.gGameEngine||null}
function now(){return Date.now()}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function num(v,d){v=Number(v);return isFinite(v)?v:d}
function clone(p){return p?{x:Number(p.x)||0,y:Number(p.y)||0}:null}
function same(a,b){return !!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function dist(a,b){return a&&b?Math.abs(Number(a.x)-Number(b.x))+Math.abs(Number(a.y)-Number(b.y)):99}
function next(p,d){return{x:Number(p.x)+Number(d.x),y:Number(p.y)+Number(d.y)}}
function authority(){return !window.B115||B115.role!=='guest'}
function hash(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function noise(seed){return((hash(seed)%20001)/10000)-1}
function difficulty(bot){try{return String(bot&&bot.v125Difficulty||(window.BomberV125&&BomberV125.getDifficulty&&BomberV125.getDifficulty())||'normal').toLowerCase()}catch(e){return'normal'}}
function rating(bot){var r=num(bot&&bot.humanRating,NaN);if(!isFinite(r))r=num(bot&&bot.rating,NaN);return isFinite(r)?clamp(r,0,1000):650}
function nameOf(bot){return String(bot&&((bot.displayName||bot.__v152Profile&&bot.__v152Profile.name)||('bot'+num(bot.statSlot,0)))||'bot')}
function styleFor(bot){
 if(!bot||!bot.simulatedHuman)return'cpu';
 var existing=String(bot.__v162Style||bot.gameplayPersonality||bot.personality||'').toLowerCase();
 if(/hunter|trapper|cautious|collector|controller|wildcard/.test(existing))return existing;
 var styles=['hunter','trapper','cautious','collector','controller','wildcard'];
 var s=styles[hash('v162-style|'+nameOf(bot))%styles.length];bot.__v162Style=s;return s
}
function standardProfile(bot){
 var d=difficulty(bot),p={kind:'ai',difficulty:d,rating:null,style:'cpu',human:false};
 var cfg={
  easy:{skill:.28,planning:.34,danger:.58,attack:.28,prediction:.12,kick:.18,trap:.12,execution:.72,risk:.42,launchRadius:0,kickScan:780,kickThreshold:170,mobility:.18,offenseChance:.42},
  normal:{skill:.52,planning:.57,danger:.76,attack:.53,prediction:.36,kick:.43,trap:.38,execution:.88,risk:.57,launchRadius:1,kickScan:580,kickThreshold:138,mobility:.42,offenseChance:.72},
  hard:{skill:.76,planning:.79,danger:.91,attack:.79,prediction:.69,kick:.77,trap:.72,execution:.96,risk:.68,launchRadius:3,kickScan:390,kickThreshold:102,mobility:.72,offenseChance:.91},
  expert:{skill:.90,planning:.91,danger:.98,attack:.91,prediction:.84,kick:.92,trap:.88,execution:.995,risk:.74,launchRadius:4,kickScan:260,kickThreshold:82,mobility:.88,offenseChance:.99}
 }[d]||null;
 if(!cfg)return standardProfile(Object.assign({},bot,{v125Difficulty:'normal'}));
 Object.keys(cfg).forEach(function(k){p[k]=cfg[k]});
 p.neverMineKick=(d==='hard'||d==='expert');p.directKickAlways=(d==='expert');p.error=.005;return p
}
function humanProfile(bot){
 var r=rating(bot),base=clamp((r-120)/880,.04,1),style=styleFor(bot),seed='v162|'+nameOf(bot)+'|'+r;
 var spread=.20-(base*.10);
 function trait(n,bias){return clamp(base+noise(seed+'|'+n)*spread+(bias||0),.03,1)}
 var p={kind:'simulated-human',difficulty:'human',rating:r,style:style,human:true};
 p.skill=base;p.planning=trait('planning');p.danger=trait('danger',r>=850?.035:0);p.attack=trait('attack');p.prediction=trait('prediction',r>=900?.05:0);p.kick=trait('kick',r>=875?.07:0);p.trap=trait('trap');p.execution=trait('execution');p.risk=trait('risk');p.mobility=trait('mobility');
 if(style==='hunter'){p.attack=clamp(p.attack+.13,0,1);p.risk=clamp(p.risk+.08,0,1)}
 else if(style==='trapper'){p.trap=clamp(p.trap+.16,0,1);p.prediction=clamp(p.prediction+.10,0,1);p.kick=clamp(p.kick+.07,0,1)}
 else if(style==='cautious'){p.danger=clamp(p.danger+.11,0,1);p.risk=clamp(p.risk-.14,0,1);p.attack=clamp(p.attack-.07,0,1)}
 else if(style==='collector'){p.attack=clamp(p.attack-.06,0,1);p.risk=clamp(p.risk-.04,0,1)}
 else if(style==='controller'){p.mobility=clamp(p.mobility+.12,0,1);p.prediction=clamp(p.prediction+.07,0,1)}
 else if(style==='wildcard'){p.risk=clamp(p.risk+.13,0,1);p.execution=clamp(p.execution-.07,0,1)}
 // Elite simulated humans intentionally have a higher tactical ceiling than standard Expert.
 if(r>=900){var elite=(r-900)/100;p.planning=Math.max(p.planning,.93+.07*elite);p.prediction=Math.max(p.prediction,.90+.10*elite);p.kick=Math.max(p.kick,.94+.06*elite);p.trap=Math.max(p.trap,.90+.10*elite);p.mobility=Math.max(p.mobility,.91+.09*elite);p.attack=Math.max(p.attack,.90+.10*elite)}
 p.launchRadius=r>=950?6:r>=875?5:r>=775?4:r>=650?2:r>=500?1:0;
 p.kickScan=r>=900?210:r>=775?300:r>=650?430:650;
 p.kickThreshold=r>=950?60:r>=875?70:r>=775?86:r>=650?110:r>=500?145:185;
 p.neverMineKick=r>=700;p.directKickAlways=r>=875;
 p.error=clamp(.17*(1-p.execution)+.008,.008,.17);
 p.offenseChance=clamp(.18+p.attack*.80,.16,.985);
 return p
}
function profile(bot){
 if(!bot)return standardProfile({v125Difficulty:'normal'});
 var sig=bot.simulatedHuman?('h|'+rating(bot)+'|'+nameOf(bot)+'|'+styleFor(bot)):('a|'+difficulty(bot));
 if(bot.__v162Profile&&bot.__v162ProfileSig===sig)return bot.__v162Profile;
 var p=bot.simulatedHuman?humanProfile(bot):standardProfile(bot);bot.__v162Profile=p;bot.__v162ProfileSig=sig;return p
}
function adjustIntentScore(bot,type,score){
 var p=profile(bot),s=Number(score)||0,finish=easyFinishPriority(bot,p);
 if(finish){if(type==='attack')s+=140;if(type==='collect')s-=180;if(type==='clear')s-=90}
 if(!p.human){if(type==='attack')s+=(p.attack-.5)*22;if(type==='collect')s+=(p.difficulty==='easy'?7:(p.difficulty==='expert'?-3:0));if(type==='clear')s+=(p.difficulty==='easy'?5:(p.difficulty==='expert'?-5:0));return s}
 if(p.style==='hunter'&&type==='attack')s+=14;else if(p.style==='trapper'&&type==='attack')s+=10;else if(p.style==='collector'&&type==='collect')s+=17;else if(p.style==='cautious'&&type==='attack')s-=10;else if(p.style==='controller'&&type==='attack')s+=6;else if(p.style==='wildcard')s+=noise(nameOf(bot)+'|intent|'+type+'|'+Math.floor(now()/1700))*7;
 if(type==='attack')s+=(p.attack-.5)*18;if(type==='collect')s+=(1-p.attack)*4;
 s+=noise(nameOf(bot)+'|goal|'+type+'|'+Math.floor(now()/1900))*(1-p.planning)*20;return s
}
function state(bot){if(!bot.__v162AI)bot.__v162AI={kickPlan:null,forcedKick:null,kickArm:null,kickArmSerial:0,lastKickArmReason:'',nextKickScan:0,lastKick:null,lastEmergency:0,lastDecision:'',profileSig:'',inPreChoose:false,lastPreChooseAt:0,pauseUntil:0,nextHumanPause:0,loopBreakUntil:0,lastLoopReason:'',lastMovingKickAvoid:0,pendingKickEscape:null,activeKickEscape:null,activeKickEscapeUntil:0,activeMovingKickEscape:null,activeMovingKickEscapeUntil:0,defensiveKickBomb:null,defensiveKickDir:null,defensiveKickUntil:0,nextEliteIntercept:0,lastEliteIntercept:0};return bot.__v162AI}
function clearKickArm(bot,reason){if(!bot)return;var st=state(bot);st.kickArm=null;st.lastKickArmReason=reason||'cleared';bot.__v162KickReady=false;bot.__v162KickReadyKind=''}
function armKickIntent(bot,kind,opt){if(!bot||!(bot.bombKickCharges>0))return null;opt=opt||{};var d=clone(opt.dir),bomb=opt.bomb||null;if(!d)return null;if((kind==='push'||kind==='escape')&&(!bomb||bomb.exploded))return null;var st=state(bot),ttl=kind==='travel'?1200:650,a={id:++st.kickArmSerial,kind:kind,dir:d,bomb:bomb,target:opt.target?clone(opt.target):null,score:num(opt.score,0),escapePath:opt.escapePath&&opt.escapePath.map?opt.escapePath.map(clone):null,plan:opt.plan||null,reason:opt.reason||kind,created:now(),expires:now()+ttl};st.kickArm=a;st.lastKickArmReason=a.reason;bot.__v162KickReady=true;bot.__v162KickReadyKind=kind;return a}
function armedKick(bot,kind,bomb,dir){if(!bot)return null;var st=state(bot),a=st.kickArm;if(!a)return null;if(!(bot.bombKickCharges>0)||now()>a.expires){clearKickArm(bot,'expired');return null}if(kind&&a.kind!==kind&&!(kind==='push'&&a.kind==='escape'))return null;if(bomb&&a.bomb&&a.bomb!==bomb)return null;if(dir){var d=clone(dir);if(!d||!same(d,a.dir))return null}return a}
function hasArmedKick(bot,kind,bomb,dir){return !!armedKick(bot,kind,bomb,dir)}
function commitArmedKick(bot,arm,bomb){if(!bot||!arm)return false;var current=armedKick(bot,null,arm.bomb||bomb,arm.dir);if(!current||current.id!==arm.id)return false;var st=state(bot);clearKickArm(bot,'used');if(arm.kind==='travel'){var choice=arm.plan||{dir:clone(arm.dir),target:arm.target&&clone(arm.target),score:arm.score,__v162:true};onTravelKickUsed(bot,choice)}else{st.lastKick={at:now(),type:arm.kind==='escape'?'escape':'push',score:arm.score||0,dir:clone(arm.dir),target:arm.target&&clone(arm.target)};st.lastDecision=arm.kind==='escape'?'kick-escape':'kick-push-attack'}return true}
function living(bot){var g=G(),all=g&&g.getPlayersAndBots?g.getPlayersAndBots():(g?(g.players||[]).concat(g.bots||[]):[]);return all.filter(function(x){return x&&x!==bot&&x.alive!==false})}
function target(bot){try{var t=bot.getBestOpponent&&bot.getBestOpponent();if(t&&t.alive!==false)return t}catch(e){}var a=living(bot);a.sort(function(x,y){return dist(bot.position,x.position)-dist(bot.position,y.position)});return a[0]||null}
function actorHearts(a){return Math.max(0,num(a&&a.hearts,0))}
function pathBetween(bot,a,b){try{return bot&&bot.findPath?bot.findPath(a,b,true):null}catch(e){return null}}
function easyFinishPriority(bot,p){
 if(!bot||!p||p.skill<.72)return null;var best=null,foes=living(bot);
 for(var i=0;i<foes.length;i++){var t=foes[i];if(actorHearts(t)>0||!sameOpenRegion(bot,bot.position,t.position))continue;var path=pathBetween(bot,bot.position,t.position),len=path&&path.length?path.length-1:dist(bot.position,t.position);if(len>6)continue;var lane=(bot.simulatedBlast&&blastHits(bot,bot.position,t.position))||len<=2,score=(6-len)*18+(lane?45:0);if(!best||score>best.score)best={target:t,path:path,len:len,score:score}}
 return best
}
function material(p){var g=G();return g&&p?g.getTileMaterial(p):'wall'}
function bombAt(p,except){var g=G();if(!g)return null;for(var i=0;i<(g.bombs||[]).length;i++){var b=g.bombs[i];if(b&&b!==except&&!b.exploded&&same(b.position,p))return b}return null}
function actorAt(p,except){var g=G(),a=g&&g.getPlayersAndBots?g.getPlayersAndBots():[];for(var i=0;i<a.length;i++)if(a[i]&&a[i]!==except&&a[i].alive!==false&&same(a[i].position,p))return a[i];return null}
function sameOpenRegion(bot,a,b){
 var g=G();if(!g||!bot||!a||!b||material(a)!=='grass'||material(b)!=='grass')return false;if(same(a,b))return true;
 var q=[clone(a)],seen={};seen[key(a)]=1;
 while(q.length){var cur=q.shift();for(var i=0;i<DIRS.length;i++){var n=next(cur,DIRS[i]),nk=key(n);if(seen[nk]||!bot.inBounds(n)||material(n)!=='grass')continue;if(same(n,b))return true;seen[nk]=1;q.push(n)}}
 return false
}
function perimeterTurn(pos,d){var g=G();if(!g)return null;var l=1,r=g.tilesX-2,t=1,b=g.tilesY-2,q=null;if(d.x&&pos.y===t&&(pos.x===l||pos.x===r))q={x:0,y:1};else if(d.x&&pos.y===b&&(pos.x===l||pos.x===r))q={x:0,y:-1};else if(d.y&&pos.x===l&&(pos.y===t||pos.y===b))q={x:1,y:0};else if(d.y&&pos.x===r&&(pos.y===t||pos.y===b))q={x:-1,y:0};return q&&material(next(pos,q))==='grass'?q:null}
function wallResponse(pos,d){var q=perimeterTurn(pos,d);if(q)return{dir:q,type:'corner'};var rev={x:-d.x,y:-d.y};if(material(next(pos,rev))==='grass')return{dir:rev,type:'bounce'};return null}
function simulateKick(origin,dir,maxSteps){
 var p=clone(origin),d=clone(dir),route=[],seen={},events=[];maxSteps=Math.max(1,maxSteps||16);if(!p||!d)return{route:route,events:events,stopped:'invalid'};
 for(var i=1;i<=maxSteps;i++){
  var np=next(p,d),m=material(np),ev='';
  if(m==='wood')return{route:route,events:events,stopped:'wood',final:clone(p),impact:clone(np),dir:clone(d)};
  if(m==='wall'){
   var wr=wallResponse(p,d);if(!wr)return{route:route,events:events,stopped:'wall',final:clone(p),dir:clone(d)};
   d=clone(wr.dir);ev=wr.type;events.push({step:i,type:ev,at:clone(p),dir:clone(d)});np=next(p,d);m=material(np);if(m!=='grass')return{route:route,events:events,stopped:m,final:clone(p),dir:clone(d)}
  }
  if(m!=='grass')return{route:route,events:events,stopped:m,final:clone(p),dir:clone(d)};
  p=clone(np);route.push({position:clone(p),dir:clone(d),step:i,event:ev});
  var sk=key(p)+'|'+d.x+','+d.y;if(seen[sk])return{route:route,events:events,stopped:'cycle',final:clone(p),dir:clone(d)};seen[sk]=1
 }
 return{route:route,events:events,stopped:'fuse',final:clone(p),dir:clone(d)}
}
function moveVector(a){
 if(!a)return{x:0,y:0};if(a.targetPosition&&!same(a.targetPosition,a.position)){var dx=a.targetPosition.x-a.position.x,dy=a.targetPosition.y-a.position.y;return Math.abs(dx)>=Math.abs(dy)?{x:dx>0?1:-1,y:0}:{x:0,y:dy>0?1:-1}}
 if(num(a.dirX,0))return{x:a.dirX>0?1:-1,y:0};if(num(a.dirY,0))return{x:0,y:a.dirY>0?1:-1};var d=a.lastMoveDirection;if(d&&(d.x||d.y))return{x:d.x?d.x/Math.abs(d.x):0,y:d.y?d.y/Math.abs(d.y):0};return{x:0,y:0}
}
function predicted(targetActor,kickStep,p){
 var out=clone(targetActor&&targetActor.position);if(!out||!p||p.prediction<.22)return out;var d=moveVector(targetActor);if(!d.x&&!d.y)return out;var g=G(),bombFrames=Math.max(5,Math.ceil((g&&g.tileSize||32)/5)),vel=Math.max(1,num(targetActor.velocity,2)),playerFrames=Math.max(5,Math.ceil((g&&g.tileSize||32)/vel)),moves=Math.floor((kickStep*bombFrames/playerFrames)*(.45+p.prediction*.7));moves=Math.min(moves,p.prediction>.9?4:p.prediction>.7?3:2);
 for(var i=0;i<moves;i++){var n=next(out,d);if(material(n)!=='grass'||bombAt(n,null))break;out=n}return out
}
function fuseSteps(){var g=G(),fps=(window.createjs&&createjs.Ticker&&createjs.Ticker.getMeasuredFPS&&createjs.Ticker.getMeasuredFPS())||(g&&g.fps)||50,tile=g&&g.tileSize||32;return Math.max(8,Math.min(24,Math.floor((2*fps)/(Math.max(5,Math.ceil(tile/5))))))}
function travelFuseSteps(){var g=G();if(!g)return 52;var horizontal=Math.max(1,g.tilesX-3),vertical=Math.max(1,g.tilesY-3);return Math.max(40,Math.min(72,2*(horizontal+vertical)+4))}
function blastHits(bot,origin,tpos){if(!bot||!origin||!tpos||!bot.simulatedBlast)return false;var a=bot.simulatedBlast(origin,bot.bombStrength)||[];for(var i=0;i<a.length;i++)if(same(a[i],tpos))return true;return false}
function kickCandidate(bot,origin,dir,t,p,pathLen){
 var sim=simulateKick(origin,dir,travelFuseSteps()),best=-999,direct=false,predictedHit=false,bounced=false,corner=false,hitStep=0,finalBlastHit=false,nearScore=-999;
 for(var e=0;e<sim.events.length;e++){if(sim.events[e].type==='bounce')bounced=true;if(sim.events[e].type==='corner')corner=true}
 for(var i=0;i<sim.route.length;i++){
  var step=sim.route[i].step,tp=predicted(t,step,p),rp=sim.route[i].position,s=0;
  if(same(rp,tp)){s=230-step*2;direct=true;predictedHit=true;hitStep=step}
  else if(same(rp,t.position)){s=205-step*2;direct=true;hitStep=step}
  else{var d=dist(rp,tp);if(d===1)s=92-step;else if(d===2)s=44-step*.5;if(s>nearScore)nearScore=s}
  if(s>best)best=s
 }
 var impactPos=direct&&hitStep&&sim.route[hitStep-1]?sim.route[hitStep-1].position:(sim.final||sim.impact||origin),ft=predicted(t,travelFuseSteps(),p);
 if(!direct&&blastHits(bot,impactPos,ft)){best=Math.max(best,155);finalBlastHit=true}else if(!direct&&blastHits(bot,impactPos,t.position)){best=Math.max(best,128);finalBlastHit=true}
 var woodTerminated=sim.stopped==='wood',confirmedHit=direct||finalBlastHit;
 // Competent bots may not use a travelling Kick as disguised wood-clearing.
 if(woodTerminated&&!direct&&(!p.human||p.rating>=300)){confirmedHit=false;finalBlastHit=false;best=Math.min(best,12)}
 // Near-misses are useful as weak pressure for a true beginner, but they are not a
 // valid offensive Kick for competent opponents.
 if(!confirmedHit&&(!p.human||p.rating>=300))best=Math.min(best,18);
 if(bounced&&confirmedHit)best+=12+18*p.prediction;if(corner&&confirmedHit)best+=14+20*p.kick;
 best-=Math.max(0,pathLen||0)*5.5;
 if(p.style==='trapper'&&confirmedHit)best+=(bounced||corner)?12:4;if(p.style==='hunter'&&direct)best+=9;if(p.style==='cautious')best-=4;
 return{origin:clone(origin),dir:clone(dir),target:t,targetPosition:clone(t.position),route:sim.route,events:sim.events,score:best,direct:direct,predictedHit:predictedHit,finalBlastHit:finalBlastHit,confirmedHit:confirmedHit,woodTerminated:woodTerminated,stopped:sim.stopped,bounced:bounced,corner:corner,hitStep:hitStep,impactPosition:clone(impactPos),pathLen:pathLen||0,created:now()}
}
function routeHazardsForCandidate(bot,c){
 var bad={},limit=c&&c.route?c.route.length:0;if(c&&c.direct&&c.hitStep)limit=Math.min(limit,c.hitStep);
 for(var i=0;c&&c.route&&i<limit;i++)bad[key(c.route[i].position)]=1;
 var impact=c&&c.impactPosition;if(impact&&bot&&bot.simulatedBlast){var blast=bot.simulatedBlast(impact,bot.bombStrength)||[];for(var j=0;j<blast.length;j++)bad[key(blast[j])]=1}
 return bad
}
function kickRefuge(bot,c,p){
 if(!bot||!c)return{ok:false,path:null,count:0};var bad=routeHazardsForCandidate(bot,c),start=clone(c.launcherPosition||c.origin||bot.position),sk=key(start),q=[start],seen={},parent={},depth={},safe=[];seen[sk]=1;depth[sk]=0;
 var maxDepth=p&&p.skill>=.85?7:p&&p.skill>=.6?6:5;
 while(q.length){var cur=q.shift(),ck=key(cur),d=depth[ck]||0;if(d>0&&!bad[ck]){var safeNow=true;try{safeNow=bot.isSafe(cur)}catch(e){}if(safeNow){safe.push(ck);if(safe.length>=2){var path=[],walk=ck;while(walk){var a=walk.split(',');path.push({x:Number(a[0]),y:Number(a[1])});if(walk===sk)break;walk=parent[walk]}path.reverse();return{ok:true,path:path,count:safe.length}}}}
  if(d>=maxDepth)continue;for(var i=0;i<DIRS.length;i++){var n=next(cur,DIRS[i]),nk=key(n);if(seen[nk]||!bot.inBounds(n)||material(n)!=='grass'||bombAt(n,null)||actorAt(n,bot))continue;if(bad[nk])continue;seen[nk]=1;parent[nk]=ck;depth[nk]=d+1;q.push(n)}
 }
 return{ok:safe.length>0,path:null,count:safe.length}
}
function kickOpportunityAllowed(bot,c,p){
 if(!c)return false;var noob=!!(p&&p.human&&p.rating<300);
 if(!c.confirmedHit&&!noob)return false;
 var refuge=kickRefuge(bot,c,p),needed=p&&p.skill>=.74?2:1;c.selfSafe=refuge.count>=needed;c.escapePath=refuge.path;c.escapeCount=refuge.count;
 if(c.selfSafe)return true;
 // Very low-rated simulated humans can still make the occasional bad launch, but
 // even they reject it most of the time. Standard CPUs never knowingly do this.
 return noob&&Math.random()<.08
}
function walkable(bot,p){return !!(bot&&p&&bot.inBounds(p)&&material(p)==='grass'&&!bot.hasBomb(p))}
function launchOrigins(bot,p){
 var out=[{origin:clone(bot.position),path:[clone(bot.position)],len:0}],r=Math.max(0,p.launchRadius||0),g=G();if(!r||!g)return out;
 for(var y=Math.max(1,bot.position.y-r);y<=Math.min(g.tilesY-2,bot.position.y+r);y++)for(var x=Math.max(1,bot.position.x-r);x<=Math.min(g.tilesX-2,bot.position.x+r);x++){
  var q={x:x,y:y},md=dist(bot.position,q);if(!md||md>r||!walkable(bot,q))continue;var path=null;try{path=bot.findPath(bot.position,q,true)}catch(e){}if(!path||path.length<2||path.length-1>r)continue;var occupied=false;for(var pi=1;pi<path.length;pi++)if(actorAt(path[pi],bot)){occupied=true;break}if(occupied)continue;out.push({origin:q,path:path,len:path.length-1})
 }
 return out
}
function findKickAttack(bot,t,p){
 if(!bot||!t||t.alive===false||!(bot.bombKickCharges>0)||bot.activeBombCount()>=bot.bombsMax)return null;
 // Hard connectivity gate: offensive traveling Kicks are illegal across sealed wood/wall regions.
 // This is checked independently of trajectory scoring so no stale/legacy heuristic can authorize it.
 if(!sameOpenRegion(bot,bot.position,t.position))return null;
 var origins=launchOrigins(bot,p),best=null;
 for(var o=0;o<origins.length;o++){if(!sameOpenRegion(bot,origins[o].origin,t.position))continue;for(var d=0;d<DIRS.length;d++){
  var first=next(origins[o].origin,DIRS[d]);if(material(first)!=='grass')continue;
  var c=kickCandidate(bot,origins[o].origin,DIRS[d],t,p,origins[o].len);c.path=origins[o].path;
  if(!kickOpportunityAllowed(bot,c,p))continue;
  if(!best||c.score>best.score)best=c
 }}
 if(!best||best.score<p.kickThreshold)return null;
 if(p.directKickAlways&&best.direct)return best;
 if(p.human&&Math.random()<p.error*.45)return null;
 if(Math.random()>p.offenseChance&&best.score<180)return null;
 return best
}
function kickIntent(bot){try{var s=window.BomberAI150&&BomberAI150.state&&BomberAI150.state(bot);return s&&s.intent?s.intent.type:''}catch(e){return''}}
function planTravelKick(bot,opp){
 var a=armedKick(bot,'travel');if(!a)return null;
 return{dir:clone(a.dir),target:a.target&&clone(a.target),score:a.score||220,__v162:true,__v162ArmId:a.id,escapePath:a.escapePath&&a.escapePath.map(clone)}
}
function onTravelKickUsed(bot,choice){var st=state(bot),forced=st.forcedKick,esc=(forced&&forced.escapePath)||st.pendingKickEscape;if(esc&&esc.length>1){st.activeKickEscape=esc.map(clone);st.activeKickEscapeUntil=now()+2600;try{bot.setNextTile(esc[1])}catch(e){}}if(st.forcedKick&&choice&&choice.__v162)st.forcedKick=null;st.pendingKickEscape=null;st.lastKick={at:now(),type:'travel',score:choice&&choice.score||0,dir:choice&&clone(choice.dir),target:choice&&choice.target?clone(choice.target):null}}
function followKickEscape(bot){var st=state(bot),path=st.activeKickEscape;if(!path||!path.length)return false;if(now()>st.activeKickEscapeUntil){st.activeKickEscape=null;return false}var goal=path[path.length-1];if(same(bot.position,goal)){st.activeKickEscape=null;return false}var route=null;try{route=bot.findPath(bot.position,goal,true)}catch(e){}if(!route||route.length<2){st.activeKickEscape=null;return false}var n=route[1];if(material(n)!=='grass'||bombAt(n,null)||actorAt(n,bot)){st.activeKickEscape=null;return false}bot.setNextTile(n);st.lastDecision='kick-escape-follow';return true}
function pushOpportunity(bot,bomb,dir,t,p){var sim=simulateKick(bomb.position,dir,fuseSteps()),best=-999,direct=false,hitStep=0;for(var i=0;i<sim.route.length;i++){var tp=predicted(t,sim.route[i].step,p);if(same(sim.route[i].position,tp)||same(sim.route[i].position,t.position)){best=Math.max(best,210-sim.route[i].step*2);direct=true;hitStep=sim.route[i].step}else if(p.human&&p.rating<300&&dist(sim.route[i].position,tp)===1)best=Math.max(best,54-sim.route[i].step)}var impact=direct&&hitStep&&sim.route[hitStep-1]?sim.route[hitStep-1].position:(sim.final||sim.impact||bomb.position),blast=false;if(!direct&&bot&&bot.simulatedBlast){var a=bot.simulatedBlast(impact,bomb.strength||bot.bombStrength)||[],tp2=predicted(t,fuseSteps(),p);for(var j=0;j<a.length;j++)if(same(a[j],tp2)||same(a[j],t.position)){blast=true;best=Math.max(best,118);break}}if(sim.stopped==='wood'&&!direct&&(!p.human||p.rating>=300)){blast=false;best=Math.min(best,12)}return{score:best,confirmedHit:direct||blast,direct:direct,hitStep:hitStep,impactPosition:clone(impact),route:sim.route,events:sim.events,origin:clone(bomb.position),target:t,stopped:sim.stopped,woodTerminated:sim.stopped==='wood'}}
function defensiveKickEscapePath(bot,bomb,dir,p){
 if(!bot||!bomb||!dir)return null;var sim=simulateKick(bomb.position,dir,Math.min(36,remainingMovingSteps(bomb)+12)),hazard={},start=clone(bot.position),sk=key(start),maxDepth=p&&p.skill>=.85?8:6;
 // The bot is allowed to trail behind the kicked bomb while leaving the corridor.
 // What matters is that the destination gets off the bomb's return axis before it rebounds.
 for(var i=0;i<sim.route.length;i++)hazard[key(sim.route[i].position)]=1;var impact=sim.final||sim.impact;if(impact&&bot.simulatedBlast){var blast=bot.simulatedBlast(impact,bomb.strength||bot.bombStrength)||[];for(var j=0;j<blast.length;j++)hazard[key(blast[j])]=1}
 var q=[start],seen={},parent={},depth={},cands=[];seen[sk]=1;depth[sk]=0;
 while(q.length){var cur=q.shift(),ck=key(cur),d=depth[ck]||0,off=dir.x?Math.abs(cur.y-start.y):Math.abs(cur.x-start.x);if(d>0&&off>0&&!hazard[ck]){var safe=true;try{safe=bot.isSafe(cur)}catch(e){}if(safe)cands.push({k:ck,p:clone(cur),d:d,off:off,score:d*6-off*24-dist(cur,bomb.position)*2})}if(d>=maxDepth)continue;for(var z=0;z<DIRS.length;z++){var n=next(cur,DIRS[z]),nk=key(n),blocking=bombAt(n,bomb);if(seen[nk]||!bot.inBounds(n)||material(n)!=='grass'||blocking||actorAt(n,bot))continue;seen[nk]=1;parent[nk]=ck;depth[nk]=d+1;q.push(n)}}
 if(!cands.length)return null;cands.sort(function(a,b){return a.score-b.score});var walk=cands[0].k,path=[];while(walk){var a=walk.split(',');path.push({x:Number(a[0]),y:Number(a[1])});if(walk===sk)break;walk=parent[walk]}path.reverse();return path
}
function followMovingKickEscape(bot){var st=state(bot),path=st.activeMovingKickEscape;if(!path||path.length<2)return false;if(now()>st.activeMovingKickEscapeUntil){st.activeMovingKickEscape=null;return false}var goal=path[path.length-1];if(same(bot.position,goal)){st.activeMovingKickEscape=null;st.defensiveKickBomb=null;return false}var route=pathBetween(bot,bot.position,goal);if(!route||route.length<2){st.activeMovingKickEscape=null;return false}var n=route[1],blocking=bombAt(n,null);if(material(n)!=='grass'||actorAt(n,bot)){st.activeMovingKickEscape=null;return false}if(blocking){if(st.defensiveKickBomb===blocking&&blocking.__v160Moving){st.lastDecision='kick-escape-wait-clear';return true}st.activeMovingKickEscape=null;return false}bot.setNextTile(n);st.lastDecision=st.defensiveKickBomb?'kick-escape-lateral-follow':'moving-kick-escape-follow';return true}
function immediateEscapeWeak(bot){try{var e=bot.findEscapePath(null,null);return !e||e.length<2}catch(e){return true}}
function tryEmergencyKick(bot,p){
 if(!bot||!(bot.bombKickCharges>0)||now()-state(bot).lastEmergency<180)return false;var emergency=false;try{emergency=!bot.isSafe(bot.position)||immediateEscapeWeak(bot)}catch(e){emergency=true}if(!emergency)return false;
 var best=null;
 for(var i=0;i<DIRS.length;i++){var bp=next(bot.position,DIRS[i]),b=bombAt(bp,null);if(!b)continue;var after=next(bp,DIRS[i]);if(material(after)!=='grass'||actorAt(after,null))continue;var score=60;try{if(!bot.isSafe(bp))score+=20;if(bot.isSafe(after))score+=14}catch(e){}if(!best||score>best.score)best={bomb:b,dir:DIRS[i],score:score}}
 if(!best)return false;if(p.kind==='ai'&&p.difficulty!=='hard'&&p.difficulty!=='expert')return false;if(p.human&&p.kick<.58)return false;if(p.human&&Math.random()<p.error)return false;
 var arm=armKickIntent(bot,'escape',{bomb:best.bomb,dir:best.dir,score:best.score,reason:'emergency-escape'});if(!arm)return false;
 if(bot.tryKickBomb&&bot.tryKickBomb(best.bomb,best.dir)){var st=state(bot),exit=defensiveKickEscapePath(bot,best.bomb,best.dir,p);st.lastEmergency=now();st.defensiveKickBomb=best.bomb;st.defensiveKickDir=clone(best.dir);st.defensiveKickUntil=now()+3200;if(exit&&exit.length>1){st.activeMovingKickEscape=exit;st.activeMovingKickEscapeUntil=now()+3000;try{bot.setNextTile(exit[1])}catch(e){}st.lastDecision='kick-escape-lateral'}return true}clearKickArm(bot,'escape-failed');return false
}
function tryStrategicPushKick(bot,p){
 if(!bot||!(bot.bombKickCharges>0)||bot.escapeMode)return false;var t=target(bot);if(!t)return false;var best=null;
 for(var i=0;i<DIRS.length;i++){var bp=next(bot.position,DIRS[i]),b=bombAt(bp,null);if(!b||b.exploded)continue;var d=DIRS[i];if(!sameOpenRegion(bot,b.position,t.position))continue;var c=pushOpportunity(bot,b,d,t,p);c.launcherPosition=clone(bot.position);if(!kickOpportunityAllowed(bot,c,p)||!c.confirmedHit||c.score<p.kickThreshold-10)continue;if(!best||c.score>best.score)best={bomb:b,dir:d,score:c.score,target:t,escapePath:c.escapePath}}
 if(!best)return false;if(p.human&&p.rating<300){if(Math.random()>.28)return false}else if(!p.directKickAlways&&Math.random()>(p.offenseChance*(.72+.28*p.kick)))return false;
 var arm=armKickIntent(bot,'push',{bomb:best.bomb,dir:best.dir,target:best.target.position,score:best.score,escapePath:best.escapePath,plan:best,reason:'offensive-push'});if(!arm)return false;
 if(bot.tryKickBomb&&bot.tryKickBomb(best.bomb,best.dir)){if(best.escapePath&&best.escapePath.length>1){var st=state(bot);st.activeKickEscape=best.escapePath.map(clone);st.activeKickEscapeUntil=now()+2200;try{bot.setNextTile(best.escapePath[1])}catch(e){}}return true}clearKickArm(bot,'push-failed');return false
}
function authorizePushKick(bot,arm,bomb,dir){
 if(!bot||!arm||!bomb||!dir)return false;if(arm.kind==='escape')return true;if(arm.kind!=='push')return false;var p=profile(bot),t=arm.plan&&arm.plan.target||target(bot);if(!t||t.alive===false||!sameOpenRegion(bot,bomb.position,t.position))return false;var c=pushOpportunity(bot,bomb,dir,t,p);return !!(c.confirmedHit&&c.score>=p.kickThreshold-10&&!(c.woodTerminated&&!c.direct&&(!p.human||p.rating>=300)))
}
function interceptGeometry(bot,bomb,dir){
 if(!bot||!bomb||!bomb.__v160Moving||!bomb.moveDirection)return null;var ours=simulateKick(bot.position,dir,travelFuseSteps()),theirs=simulateKick(bomb.position,bomb.moveDirection,Math.min(36,remainingMovingSteps(bomb))),best=null;
 for(var i=0;i<ours.route.length;i++)for(var j=0;j<theirs.route.length;j++){if(!same(ours.route[i].position,theirs.route[j].position))continue;var dt=Math.abs(ours.route[i].step-theirs.route[j].step);if(dt>2)continue;var dot=ours.route[i].dir.x*theirs.route[j].dir.x+ours.route[i].dir.y*theirs.route[j].dir.y;if(Math.abs(dot)>0)continue;var score=180-dt*22-ours.route[i].step*2;if(!best||score>best.score)best={position:clone(ours.route[i].position),ourStep:ours.route[i].step,theirStep:theirs.route[j].step,score:score,dir:clone(dir)}}
 return best
}
function eliteInterceptPlan(bot,p){
 if(!bot||!p||!p.human||p.rating<900||!(bot.bombKickCharges>0)||bot.activeBombCount()>=bot.bombsMax)return null;var st=state(bot);if(now()<st.nextEliteIntercept)return null;st.nextEliteIntercept=now()+240;var g=G(),best=null;
 for(var i=0;i<(g&&g.bombs||[]).length;i++){var b=g.bombs[i];if(!b||b.exploded||!b.__v160Moving||!b.moveDirection||b.owner===bot||!b.owner||b.owner.alive===false)continue;for(var d=0;d<DIRS.length;d++){if(material(next(bot.position,DIRS[d]))!=='grass')continue;var hit=interceptGeometry(bot,b,DIRS[d]);if(!hit)continue;var deflect=simulateKick(hit.position,DIRS[d],Math.min(26,remainingMovingSteps(b))),threat=false;for(var r=0;r<deflect.route.length;r++){if(same(deflect.route[r].position,b.owner.position)||blastHits(bot,deflect.route[r].position,b.owner.position)){threat=true;break}}if(!threat)continue;var c={origin:clone(bot.position),dir:clone(DIRS[d]),route:simulateKick(bot.position,DIRS[d],hit.ourStep+2).route,impactPosition:clone(hit.position),confirmedHit:true,direct:true,score:hit.score+55,launcherPosition:clone(bot.position)};var refuge=kickRefuge(bot,c,p);if(refuge.count<2)continue;var plan={eliteIntercept:true,interceptBomb:b,interceptPosition:clone(hit.position),dir:clone(DIRS[d]),score:c.score,escapePath:refuge.path,created:now(),target:b.owner};if(!best||plan.score>best.score)best=plan}}
 return best
}
function authorizeTravelKick(bot,arm){
 if(!bot||!arm||arm.kind!=='travel'||!(bot.bombKickCharges>0))return false;var p=profile(bot),plan=arm.plan||{};if(plan.eliteIntercept){var b=plan.interceptBomb;if(!b||b.exploded||!b.__v160Moving||!b.moveDirection||b.owner===bot)return false;var hit=interceptGeometry(bot,b,arm.dir);return !!(hit&&dist(hit.position,plan.interceptPosition)<=1)}
 var t=plan.target;if(!t||t.alive===false||!sameOpenRegion(bot,bot.position,t.position))return false;var c=kickCandidate(bot,bot.position,arm.dir,t,p,0);if(!c.confirmedHit||c.score<p.kickThreshold)return false;if(c.woodTerminated&&!c.direct&&(!p.human||p.rating>=300))return false;return kickOpportunityAllowed(bot,c,p)
}
function tryEliteBombIntercept(bot,p){var plan=eliteInterceptPlan(bot,p);if(!plan)return false;var st=state(bot),arm=armKickIntent(bot,'travel',{dir:plan.dir,target:plan.target&&plan.target.position,score:plan.score,escapePath:plan.escapePath,plan:plan,reason:'elite-bomb-intercept'});if(!arm||!authorizeTravelKick(bot,arm)){clearKickArm(bot,'elite-intercept-invalid');return false}st.forcedKick=plan;var b=bot.plantBomb();if(!b){clearKickArm(bot,'elite-intercept-placement-failed');st.forcedKick=null;return false}if(plan.escapePath&&plan.escapePath.length>1)try{bot.setNextTile(plan.escapePath[1])}catch(e){}st.lastEliteIntercept=now();st.lastDecision='elite-kick-intercept';return true}
function shouldAutoKick(bot,bomb,dir){
 if(!bot||!bomb||!(bot.bombKickCharges>0)||!dir)return false;
 // Collision itself may never invent a Bomb Kick. It only executes a previously
 // chosen internal push/escape intent. This prevents incidental walking into a bomb
 // from turning into an accidental throw.
 return !!(armedKick(bot,'push',bomb,dir)||armedKick(bot,'escape',bomb,dir))
}
function atOrigin(bot,plan){return plan&&same(bot.position,plan.origin)}
function executeKickPlan(bot,plan){
 var st=state(bot),p=profile(bot);if(!plan||!plan.target||plan.target.alive===false||!(bot.bombKickCharges>0)){st.kickPlan=null;return false}
 // Revalidate at execution time. A plan is discarded if the target is no longer in the same open region
 // or if the exact trajectory no longer produces a confirmed hit.
 if(!sameOpenRegion(bot,bot.position,plan.target.position)){st.kickPlan=null;st.forcedKick=null;st.pendingKickEscape=null;st.lastDecision='kick-reject-disconnected';return false}
 if(now()-plan.created>5000){st.kickPlan=null;return false}
 if(!atOrigin(bot,plan)){
  var path=null;try{path=bot.findPath(bot.position,plan.origin,true)}catch(e){}if(!path||path.length<2){st.kickPlan=null;return false}bot.setNextTile(path[1]);st.lastDecision='kick-reposition';return true
 }
 if(bot.activeBombCount()>=bot.bombsMax||bot.hasBomb(bot.position)){st.kickPlan=null;return false}
 var live=kickCandidate(bot,bot.position,plan.dir,plan.target,p,0);if(!kickOpportunityAllowed(bot,live,p)||!live.confirmedHit||live.score<p.kickThreshold){st.kickPlan=null;st.forcedKick=null;st.pendingKickEscape=null;st.lastDecision='kick-reject-stale';return false}live.target=plan.target;live.path=[clone(bot.position)];plan=live;
 if(p.human&&p.skill<.7&&Math.random()<p.error*.35){st.kickPlan=null;return false}
 st.forcedKick=plan;var arm=armKickIntent(bot,'travel',{dir:plan.dir,target:plan.target&&plan.target.position,score:plan.score,escapePath:plan.escapePath,plan:plan,reason:'offensive-travel'});if(!arm){st.forcedKick=null;st.kickPlan=null;return false}var b=bot.plantBomb();if(!b){clearKickArm(bot,'travel-placement-failed');st.forcedKick=plan;return false}if(plan.escapePath&&plan.escapePath.length>1)try{bot.setNextTile(plan.escapePath[1])}catch(e){}st.kickPlan=null;st.lastDecision='kick-attack';return true
}
function maybeKickAttack(bot,p){
 var st=state(bot);if(st.kickPlan&&executeKickPlan(bot,st.kickPlan))return true;if(!(bot.bombKickCharges>0)||now()<st.nextKickScan||bot.escapeMode)return false;st.nextKickScan=now()+p.kickScan;
 var t=target(bot);if(!t)return false;var plan=findKickAttack(bot,t,p);if(!plan)return false;st.kickPlan=plan;return executeKickPlan(bot,plan)
}
function boardPhase(){var g=G(),wood=0;if(g)for(var i=0;i<(g.tiles||[]).length;i++)if(g.tiles[i]&&g.tiles[i].material==='wood')wood++;var inner=g?Math.max(1,(g.tilesX-2)*(g.tilesY-2)):165,open=wood<=Math.max(14,Math.floor(inner*.10));return{wood:wood,inner:inner,open:open}}
function kickBonusPath(bot,p){
 // Only simulated humans deliberately seek loose Kick tokens. Standard CPU AI can
 // still collect one incidentally, preserving the gameplay distinction requested.
 if(!p.human||(bot.bombKickCharges||0)>0)return null;var phase=boardPhase(),g=G(),best=null;
 (g&&g.bonuses||[]).forEach(function(b){if(!b||String(b.type)!=='kick'||material(b.position)!=='grass')return;var path=null;try{path=bot.findPath(bot.position,b.position,true)}catch(e){}if(!path||path.length<2)return;var len=path.length-1,max=phase.open?Math.round(5+p.skill*9):Math.round(2+p.skill*3);if(p.style==='collector')max+=2;if(len>max)return;var score=len-(p.kick*4)-(phase.open?8:0);if(!best||score<best.score)best={path:path,score:score,open:phase.open,wood:phase.wood}});return best
}
function reachable(bot,start,blocked,maxDepth){
 var g=G(),bad={},q=[clone(start)],seen={},depth={};(blocked||[]).forEach(function(p){bad[key(p)]=1});if(!start)return 0;seen[key(start)]=1;depth[key(start)]=0;var count=0;while(q.length){var cur=q.shift(),ck=key(cur),d=depth[ck];if(!bad[ck])count++;if(d>=maxDepth)continue;for(var i=0;i<DIRS.length;i++){var n=next(cur,DIRS[i]),nk=key(n);if(seen[nk]||bad[nk]||!bot.inBounds(n)||material(n)!=='grass'||bombAt(n,null))continue;seen[nk]=1;depth[nk]=d+1;q.push(n)}}return count
}
function mobilityBonus(bot,origin,p){
 if(!origin||p.mobility<.22||!bot.simulatedBlast)return 0;var blast=bot.simulatedBlast(origin,bot.bombStrength)||[],targets=living(bot),bonus=0,depth=p.mobility>.85?7:p.mobility>.6?6:5;
 for(var i=0;i<targets.length;i++){var t=targets[i],before=reachable(bot,t.position,[],depth),after=reachable(bot,t.position,blast,depth),cut=Math.max(0,before-after);bonus+=cut*(2.5+p.mobility*3.5);if(before>0&&after===0)bonus+=42+58*p.trap;var pred=predicted(t,2,p);if(blastHits(bot,origin,pred))bonus+=12+28*p.prediction}
 return bonus
}
function maybeKickPickup(bot,p){if(!p.human||bot.escapeMode||!bot.isSafe(bot.position))return false;var finish=easyFinishPriority(bot,p);if(finish){state(bot).lastDecision='finish-kill-over-pickup';return false}var b=kickBonusPath(bot,p);if(!b)return false;bot.setNextTile(b.path[1]);state(bot).lastDecision=b.open?'collect-kick-open':'collect-kick';return true}
function remainingMovingSteps(bomb){var g=G(),fps=(window.createjs&&createjs.Ticker&&createjs.Ticker.getMeasuredFPS&&createjs.Ticker.getMeasuredFPS())||(g&&g.fps)||50,tile=g&&g.tileSize||32,speed=Math.max(3,Math.min(8,num(bomb&&bomb.moveSpeed,5))),framesPerTile=Math.max(1,Math.ceil(tile/speed)),remaining=Math.max(1,num(bomb&&bomb.timerMax,2)*fps-num(bomb&&bomb.timer,0));return Math.max(2,Math.min(72,Math.ceil(remaining/framesPerTile)))}
function movingKickLookahead(p){if(!p)return 10;if(!p.human)return p.difficulty==='expert'?30:p.difficulty==='hard'?22:p.difficulty==='normal'?14:9;return p.rating>=950?34:p.rating>=850?28:p.rating>=700?20:p.rating>=500?14:9}
function movingKickEscapePath(bot,bad,maxDepth,bomb){
 var start=clone(bot.position),sk=key(start),q=[start],seen={},parent={},depth={};seen[sk]=1;depth[sk]=0;var candidates=[];
 while(q.length){var cur=q.shift(),ck=key(cur),d=depth[ck]||0;if(d>0&&!bad[ck]){var safe=true;try{safe=bot.isSafe(cur)}catch(e){}if(safe)candidates.push({k:ck,p:clone(cur),d:d,score:d*5-dist(cur,bomb.position)*3})}if(d>=maxDepth)continue;
  for(var i=0;i<DIRS.length;i++){var n=next(cur,DIRS[i]),nk=key(n);if(seen[nk]||!bot.inBounds(n)||material(n)!=='grass'||bombAt(n,null)||actorAt(n,bot)||bad[nk])continue;seen[nk]=1;parent[nk]=ck;depth[nk]=d+1;q.push(n)}}
 if(!candidates.length)return null;candidates.sort(function(a,b){return a.score-b.score});var walk=candidates[0].k,path=[];while(walk){var a=walk.split(',');path.push({x:Number(a[0]),y:Number(a[1])});if(walk===sk)break;walk=parent[walk]}path.reverse();return path
}
function avoidMovingKick(bot,p){
 var g=G();if(!g||!bot||bot.alive===false)return false;if(p.human&&p.rating<300&&Math.random()<.10)return false;var threatened=null,look=movingKickLookahead(p);
 for(var i=0;i<(g.bombs||[]).length;i++){
  var b=g.bombs[i];if(!b||b.exploded||!b.__v160Moving||!b.moveDirection)continue;var own=b.owner===bot;if(own&&b!==state(bot).defensiveKickBomb&&Number(b.__v161WallInteractions||0)<1)continue;var sim=simulateKick(b.position,b.moveDirection,Math.min(remainingMovingSteps(b),look)),hit=99,hazard={};
  for(var j=0;j<sim.route.length;j++){hazard[key(sim.route[j].position)]=sim.route[j].step;if(same(sim.route[j].position,bot.position)||same(sim.route[j].position,bot.targetPosition)){hit=Math.min(hit,sim.route[j].step)}}
  var impact=sim.final||sim.impact;if(impact&&bot.simulatedBlast){var blast=bot.simulatedBlast(impact,b.strength||bot.bombStrength)||[],impactStep=Math.max(1,sim.route.length);for(var z=0;z<blast.length;z++){hazard[key(blast[z])]=Math.min(hazard[key(blast[z])]||99,impactStep);if(same(blast[z],bot.position)||same(blast[z],bot.targetPosition))hit=Math.min(hit,impactStep)}}
  if(hit<99&&(!threatened||hit<threatened.hit))threatened={bomb:b,sim:sim,hit:hit,hazard:hazard}
 }
 var st=state(bot);if(!threatened){st.activeMovingKickEscape=null;return false}var trigger=p.skill>=.9?look:p.skill>=.72?Math.min(18,look):Math.min(11,look);if(threatened.hit>trigger)return false;
 var bad={};Object.keys(threatened.hazard).forEach(function(k){if(threatened.hazard[k]<=Math.max(7,threatened.hit+5))bad[k]=1});
 var path=movingKickEscapePath(bot,bad,p.skill>=.9?7:p.skill>=.72?6:4,threatened.bomb);if(!path||path.length<2)return false;st.activeMovingKickEscape=path;st.activeMovingKickEscapeUntil=now()+2200;bot.setNextTile(path[1]);st.lastMovingKickAvoid=now();st.lastDecision='avoid-moving-kick';return true
}

function breakTacticalLoop(bot){
 var st=state(bot),api=window.BomberStability140;if(!api||typeof api.corridorProblem!=='function')return false;var why='';try{why=api.corridorProblem(bot)||''}catch(e){why=''}if(!why)return false;
 // Tactical kick repositioning sits above the legacy movement chain. Without this
 // handoff it can repeatedly intercept chooseNextAction and starve the proven
 // corridor/cycle breaker. Drop only the tactical plan, not the bot's personality.
 st.kickPlan=null;st.forcedKick=null;clearKickArm(bot,'loop-break');st.activeKickEscape=null;st.nextKickScan=now()+850;st.loopBreakUntil=now()+950;st.lastLoopReason=why;st.lastDecision='loop-break-'+why;
 try{var s150=window.BomberAI150&&BomberAI150.state&&BomberAI150.state(bot);if(s150){s150.intent=null;s150.waitUntil=0;s150.targetHold=null}}catch(e){}
 try{if(typeof api.forceNovelRoute==='function'&&api.forceNovelRoute(bot,why))return true}catch(e){}
 return false
}
function preChoose(bot){
 if(!authority()||!bot||bot.alive===false||bot.tutorialDummy)return false;var p=profile(bot),st=state(bot),preNow=now();if(st.inPreChoose||preNow-st.lastPreChooseAt<8)return false;st.lastPreChooseAt=preNow;st.inPreChoose=true;
 try{
  st.profileSig=bot.__v162ProfileSig;
  if(tryEmergencyKick(bot,p)){if(st.lastDecision!=='kick-escape-lateral')st.lastDecision='kick-escape';return true}
  if(followMovingKickEscape(bot))return true;
  if(followKickEscape(bot))return true;
  if(avoidMovingKick(bot,p))return true;
  if(bot.escapeMode)return false;
  // Strong opponents capitalize on a verified Kick opportunity before legacy loop
  // recovery can turn a clean shot into needless corridor wandering. Elite human-like
  // opponents may also deliberately intercept/deflect an enemy travelling bomb.
  if(p.human&&p.rating>=900&&tryEliteBombIntercept(bot,p))return true;
  if(p.skill>=.72){if(tryStrategicPushKick(bot,p))return true;if(maybeKickAttack(bot,p))return true}
  if(breakTacticalLoop(bot))return true;
  if(st.loopBreakUntil>now())return false;
  // Low/average simulated humans occasionally need an extra beat to decide. This is
  // a safe reaction delay, not random danger blindness; elite humans almost never do it.
  if(p.human){var t=now();if(st.pauseUntil>t){if(bot.__v140Motion)bot.__v140Motion.lastMovedAt=t;try{bot.animate('idle')}catch(e){}return true}if(t>=st.nextHumanPause&&p.execution<.80){st.nextHumanPause=t+1800+Math.floor((.4+p.execution)*2200);var safe=true;try{safe=bot.isSafe(bot.position)}catch(e){}if(safe&&Math.random()<(.20*(1-p.execution))){st.pauseUntil=t+70+Math.floor((1-p.execution)*430);st.lastDecision='human-hesitation';if(bot.__v140Motion)bot.__v140Motion.lastMovedAt=t;try{bot.animate('idle')}catch(e){}return true}}}
  // Existing human fumbles/micro-movements remain in the legacy chain; this layer only takes over for valuable tactical kick opportunities.
  if(p.skill<.72){if(tryStrategicPushKick(bot,p))return true;if(maybeKickAttack(bot,p))return true}
  if((bot.bombKickCharges||0)===0&&maybeKickPickup(bot,p))return true;
  return false
 }finally{st.inPreChoose=false}
}
function randomSimRating(){var r=Math.random(),v;if(r<.12)v=150+Math.random()*200;else if(r<.38)v=350+Math.random()*200;else if(r<.70)v=550+Math.random()*200;else if(r<.90)v=750+Math.random()*150;else v=900+Math.random()*101;return clamp(Math.round(v/10)*10,0,1000)}
function patchRatingBreadth(){if(window.BomberCharacter&&!BomberCharacter.__v162RatingBreadth){BomberCharacter.__v162RatingBreadth=true;BomberCharacter.randomSimRating=randomSimRating}}
function patch(){
 if(!window.Bot||Bot.prototype.__v162AICore)return false;Bot.prototype.__v162AICore=true;
 var oldChoose=Bot.prototype.chooseNextAction,oldScore=Bot.prototype.scoreBombPlacement,oldShould=Bot.prototype.shouldPlantStrategicBomb,oldInit=Bot.prototype.init;
 Bot.prototype.init=function(){var r=oldInit.apply(this,arguments);this.__v162AI=null;this.__v162Profile=null;this.__v162ProfileSig='';this.__v162KickReady=false;this.__v162KickReadyKind='';return r};
 Bot.prototype.scoreBombPlacement=function(origin){var base=num(oldScore.apply(this,arguments),0),p=profile(this);return base+mobilityBonus(this,origin,p)};
 Bot.prototype.shouldPlantStrategicBomb=function(op){var base=!!oldShould.apply(this,arguments),p=profile(this);if(this.simulatedHuman){if(base&&Math.random()<p.error*.35)return false;if(base)return true;if(!op||this.activeBombCount()>=this.bombsMax||this.hasBomb(this.position))return false;var s=this.scoreBombPlacement(this.position),threshold=54-p.attack*34-p.trap*12;if(s>=threshold)return Math.random()<p.offenseChance;return false}if(p.difficulty==='easy')return base&&Math.random()<.62;if(p.difficulty==='normal')return base;if(base)return true;if(!op||p.attack<.7||this.activeBombCount()>=this.bombsMax||this.hasBomb(this.position))return false;var score=this.scoreBombPlacement(this.position),th=p.difficulty==='expert'?8:13;return score>=th&&Math.random()<p.offenseChance};
 Bot.prototype.chooseNextAction=function(){if(preChoose(this))return;return oldChoose.apply(this,arguments)};
 return true
}
function install(){
 if(installed)return true;if(!window.Bot||!window.BomberAI150||!window.BomberKick160||!G())return false;patchRatingBreadth();if(!patch())return false;installed=true;
 window.BomberAI162={version:VERSION,profile:profile,state:state,adjustIntentScore:adjustIntentScore,preChoose:preChoose,planTravelKick:planTravelKick,onTravelKickUsed:onTravelKickUsed,shouldAutoKick:shouldAutoKick,authorizeTravelKick:authorizeTravelKick,authorizePushKick:authorizePushKick,armKickIntent:armKickIntent,hasArmedKick:hasArmedKick,armedKick:armedKick,commitArmedKick:commitArmedKick,clearKickArm:clearKickArm,findKickAttack:findKickAttack,simulateKick:simulateKick,randomSimRating:randomSimRating,mobilityBonus:mobilityBonus,breakTacticalLoop:breakTacticalLoop,debug:{profile:profile,state:state,adjustIntentScore:adjustIntentScore,findKickAttack:findKickAttack,simulateKick:simulateKick,kickCandidate:kickCandidate,kickOpportunityAllowed:kickOpportunityAllowed,kickRefuge:kickRefuge,pushOpportunity:pushOpportunity,kickBonusPath:kickBonusPath,maybeKickPickup:maybeKickPickup,easyFinishPriority:easyFinishPriority,avoidMovingKick:avoidMovingKick,movingKickLookahead:movingKickLookahead,movingKickEscapePath:movingKickEscapePath,defensiveKickEscapePath:defensiveKickEscapePath,followMovingKickEscape:followMovingKickEscape,sameOpenRegion:sameOpenRegion,boardPhase:boardPhase,predicted:predicted,reachable:reachable,breakTacticalLoop:breakTacticalLoop,tryEmergencyKick:tryEmergencyKick,tryStrategicPushKick:tryStrategicPushKick,eliteInterceptPlan:eliteInterceptPlan,tryEliteBombIntercept:tryEliteBombIntercept,interceptGeometry:interceptGeometry,authorizeTravelKick:authorizeTravelKick,authorizePushKick:authorizePushKick,armKickIntent:armKickIntent,armedKick:armedKick,commitArmedKick:commitArmedKick,clearKickArm:clearKickArm,planTravelKick:planTravelKick,followKickEscape:followKickEscape}};
 return true
}
var tries=0,t=setInterval(function(){patchRatingBreadth();if(install()||++tries>1200)clearInterval(t)},25);
})();
