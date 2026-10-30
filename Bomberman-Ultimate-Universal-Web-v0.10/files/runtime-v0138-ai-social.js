(function(){
'use strict';
var VERSION='v0.13.8',S=window.B115,installed=false;
if(!S)return;
var PERSONAS=['friendly','competitive','salty','goofy','quiet','tactical','chill','chaotic'];
var AMBIENT={
 friendly:['nice dodge lol','good movement','this ones actually close','lol this is fun','that was a good escape','gg either way','youre making me work for it'],
 competitive:['im not giving up that lane','ok now im locked in','you keep getting away lol','next bomb gets you','im taking mid','this map is opening up','alright no more freebies'],
 salty:['bro that bomb was so cheap lol','nahh how did you get out','these blocks hate me','i swear every pickup is on your side','ok that was annoying','you got so lucky there','im getting griefed lol'],
 goofy:['i have no plan whatsoever','why did i go this way lol','speed shoes go brrr','bomb geometry is my enemy','im just vibing rn','this map is chaos','i definitely meant to do that'],
 quiet:['nice','lol','close','gg','welp','ok','fair'],
 tactical:['you keep favoring that lane','board is almost open','im watching the exits','that corner is dangerous','need a better angle','too many open lanes now','im saving a bomb for the turn'],
 chill:['all good lol','this is a good match','im just playing','nice one','no stress','lol fair','we go again'],
 chaotic:['YOLO bomb','why am i over here lol','everything is exploding','im sending it','no idea whats happening','ok this is cursed','MORE BOMBS']
};
var START_MORE=['yo gl','alright lets go','hey good luck','ok im ready','lets run it','sup lol','alr bet','good luck man','this map again lol','ok lets see how this goes','im locked in','lets get it'];
var DEATH_MORE=['nahh lol','ok you got me','i walked into that','that escape was bad','lol i sold so hard','nice bomb','i shouldve moved sooner','welp','good one','i got greedy again','fair enough','that lane got me'];
var KILL_MORE=['gg lol','caught you there','that lane worked','close one','i thought you were getting out','got the angle','that was lucky lol','nice try','finally got you','that bomb actually worked','barely','gg man'];
var REPLY={
 greeting:['yo','hey lol','sup','yoo','hey man','whats up'],
 gg:['gg','ggs','good game','yea gg','gg man','good one'],
 rematch:['yeah im down','run it back','sure lol','bet','yeah again','one more'],
 bot:['nah lol','bro im not a bot 😭','thats what a bot would say','i was gonna ask you that','lol no','youre the one moving like a bot'],
 compliment:['lol thanks','appreciate it','you too','that was kinda clean ngl','thanks man'],
 insult:['lol ok','talking already?','we will see','alright bet','keep that energy','😭'],
 lag:['same it felt weird for a sec','mine seems fine rn','yeah that looked laggy','maybe lol','i saw that stutter'],
 speed:['the shoes are huge','speed pickups are so good','yeah once you get shoes its way easier','im trying to get more speed','speed matters a ton late game'],
 bomb:['bomb placement is everything','yeah the chain bombs get crazy','im trying not to trap myself lol','late game bombs are scary','i keep watching the blast lanes'],
 question:['maybe','probably lol','idk honestly','yeah i think so','nah i dont think so','could be'],
 generic:['lol','yeah','fair','true','fr','same','lmao','nahh','maybe','ok lol','i get you']
};
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function clamp(v,a,b){v=Number(v);return Math.max(a,Math.min(b,isFinite(v)?v:a))}
function clean(v){return String(v||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Player'}
function hash(s){s=String(s||'');var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function pos(k){var a=String(k||'0,0').split(',');return{x:Number(a[0])||0,y:Number(a[1])||0}}
function persona(name){return PERSONAS[hash('v138|persona|'+clean(name))%PERSONAS.length]}
function pick(pool,salt){if(!pool||!pool.length)return'';var seed=hash((S.remoteName||'player')+'|'+salt+'|'+Math.floor(Date.now()/1300));return pool[seed%pool.length]}
function merge(base,extra){var a=Array.isArray(base)?base.slice():[],seen={};for(var i=0;i<a.length;i++)seen[a[i]]=1;for(var j=0;j<extra.length;j++)if(!seen[extra[j]]){seen[extra[j]]=1;a.push(extra[j])}return a}
function badge(){var old=$('buildVersion137');if(old)old.style.display='none';var b=$('buildVersion138');if(!b){b=document.createElement('div');b.id='buildVersion138';b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none';document.body.appendChild(b)}if(b.textContent!==VERSION)b.textContent=VERSION}
function expandSocial(){S.SIM_START=merge(S.SIM_START,START_MORE);S.SIM_DEATH=merge(S.SIM_DEATH,DEATH_MORE);S.SIM_KILL=merge(S.SIM_KILL,KILL_MORE)}

/* Movement governor: one authoritative speed, one watchdog, one pattern breaker. */
function motion(bot){if(!bot.__v138Motion){bot.__v138Motion={lastPxX:Number(bot.bmp&&bot.bmp.x)||0,lastPxY:Number(bot.bmp&&bot.bmp.y)||0,lastMovedAt:Date.now(),lastSampleAt:Date.now(),trail:[],recovery:null,recoveryReason:'',cooldownUntil:0,lastAxis:'',breaks:0,stuckBreaks:0}}return bot.__v138Motion}
function speedStep(){var g=G();return g&&g.ultimateMode?4:.8}
function baseSpeed(){var g=G();return g&&g.ultimateMode?4:2}
function ensureSpeed(bot){
 if(!bot)return 0;if(bot.__v138BaseSpeed==null){bot.__v138BaseSpeed=baseSpeed();var step=speedStep(),raw=Number(bot.velocity)||bot.__v138BaseSpeed;var inferred=Math.max(0,Math.round((raw-bot.__v138BaseSpeed)/Math.max(.01,step)));bot.__v138Shoes=inferred}
 var exact=bot.__v138BaseSpeed+Math.max(0,Number(bot.__v138Shoes)||0)*speedStep();if(Math.abs((Number(bot.velocity)||0)-exact)>.001)bot.velocity=exact;return exact
}
function movementActive(bot){var g=G();return!!(bot&&bot.alive!==false&&bot.started&&g&&g.playing&&!g.lobbyOpen&&g.menu&&!g.menu.visible)}
function sheltering(bot){try{return!!(bot.escapeMode&&bot.trackedBombStillDangerous&&bot.trackedBombStillDangerous()&&bot.isSafe(bot.position))}catch(e){return false}}
function record(bot){
 if(!bot||!bot.bmp||!bot.position)return;var m=motion(bot),now=Date.now(),x=Number(bot.bmp.x)||0,y=Number(bot.bmp.y)||0,dx=x-m.lastPxX,dy=y-m.lastPxY;if(Math.sqrt(dx*dx+dy*dy)>.45){m.lastMovedAt=now;m.lastPxX=x;m.lastPxY=y}
 var k=key(bot.position);if(k&&m.trail[m.trail.length-1]!==k){m.trail.push(k);if(m.trail.length>72)m.trail.splice(0,m.trail.length-72)}m.lastSampleAt=now
}
function axisProblem(bot){
 var h=motion(bot).trail;if(h.length<8)return'';var w=h.slice(-30),hm=0,vm=0,hr=0,vr=0,lastH=0,lastV=0,minX=999,maxX=-999,minY=999,maxY=-999;
 for(var i=0;i<w.length;i++){var p=pos(w[i]);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);if(!i)continue;var q=pos(w[i-1]),dx=p.x-q.x,dy=p.y-q.y;if(dx){hm++;var hs=dx>0?1:-1;if(lastH&&hs!==lastH)hr++;lastH=hs}if(dy){vm++;var vs=dy>0?1:-1;if(lastV&&vs!==lastV)vr++;lastV=vs}}
 var xs=maxX-minX,ys=maxY-minY;if(vm>=6&&hm<=Math.max(2,Math.floor(vm*.18))&&ys>=2&&vr>=3)return'vertical';if(hm>=6&&vm<=Math.max(2,Math.floor(hm*.18))&&xs>=2&&hr>=3)return'horizontal';
 var n=w.length;for(var half=3;half<=Math.min(12,Math.floor(n/2));half++){var ok=0;for(var j=0;j<half;j++)if(w[n-1-j]===w[n-1-half-j])ok++;if(ok/half>=.86)return'cycle'}return''
}
function problem(bot){if(!movementActive(bot)||bot.escapeMode||sheltering(bot))return'';var m=motion(bot),axis=axisProblem(bot);if(axis)return axis;if(Date.now()-m.lastMovedAt>1900)return'stuck';return''}
function safe(bot,p){var g=G();try{return!!(p&&bot.inBounds(p)&&g.getTileMaterial(p)==='grass'&&!bot.hasBomb(p)&&bot.isSafe(p))}catch(e){return false}}
function recentMap(bot){var h=motion(bot).trail.slice(-34),r={};for(var i=0;i<h.length;i++)r[h[i]]=(r[h[i]]||0)+1;return r}
function recoveryPath(bot,reason){
 var g=G();if(!g||!bot.position)return null;var recent=recentMap(bot),c=[],bx=bot.position.x,by=bot.position.y;
 for(var y=1;y<g.tilesY-1;y++)for(var x=1;x<g.tilesX-1;x++){var p={x:x,y:y};if(!safe(bot,p))continue;var d=Math.abs(x-bx)+Math.abs(y-by);if(d<2)continue;var perp=reason==='vertical'?Math.abs(x-bx):reason==='horizontal'?Math.abs(y-by):0;if((reason==='vertical'||reason==='horizontal')&&perp<2)continue;var seen=recent[key(p)]||0,score=d+perp*5-seen*12+(hash(key(p)+'|'+clean(bot.displayName||''))%23)/20;c.push({p:p,score:score})}
 if(!c.length&&(reason==='vertical'||reason==='horizontal'))return recoveryPath(bot,'stuck');c.sort(function(a,b){return b.score-a.score});for(var i=0;i<Math.min(36,c.length);i++){var path=null;try{path=bot.findPath(bot.position,c[i].p,true)}catch(e){}if(path&&path.length>2)return path.slice(1,Math.min(path.length,10))}
 var dirs=reason==='vertical'?[[1,0],[-1,0],[0,1],[0,-1]]:reason==='horizontal'?[[0,1],[0,-1],[1,0],[-1,0]]:[[1,0],[-1,0],[0,1],[0,-1]];for(var d=0;d<dirs.length;d++){var q={x:bx+dirs[d][0],y:by+dirs[d][1]};if(safe(bot,q)&&!(recent[key(q)]>2))return[q]}return null
}
function startRecovery(bot,reason){var m=motion(bot),now=Date.now();if(now<m.cooldownUntil||bot.escapeMode)return false;var p=recoveryPath(bot,reason);if(!p||!p.length)return false;m.recovery=p.slice();m.recoveryReason=reason;m.lastAxis=reason;m.cooldownUntil=now+850;m.breaks++;if(reason==='stuck')m.stuckBreaks++;m.trail=m.trail.slice(-4);return followRecovery(bot)}
function followRecovery(bot){var m=motion(bot),p=m.recovery;if(!p||!p.length||bot.escapeMode)return false;while(p.length&&same(p[0],bot.position))p.shift();if(!p.length){m.recovery=null;m.recoveryReason='';m.cooldownUntil=Date.now()+900;return false}if(!safe(bot,p[0])){m.recovery=null;m.recoveryReason='';return false}try{bot.setNextTile(p[0]);return true}catch(e){m.recovery=null;m.recoveryReason='';return false}}
function watchdog(bot){record(bot);ensureSpeed(bot);var why=problem(bot);if(why)startRecovery(bot,why)}
function patchMovement(){
 if(!window.Bot||Bot.prototype.__v138Movement)return false;Bot.prototype.__v138Movement=true;
 var oldApply=Bot.prototype.applyBonus;Bot.prototype.applyBonus=function(bonus){ensureSpeed(this);var isSpeed=bonus&&bonus.type==='speed',r=oldApply.apply(this,arguments);if(isSpeed)this.__v138Shoes=(Number(this.__v138Shoes)||0)+1;ensureSpeed(this);return r};
 var oldAggro=Bot.prototype.updateEndgameAggression;Bot.prototype.updateEndgameAggression=function(){var r=oldAggro.apply(this,arguments);ensureSpeed(this);return r};
 var oldChoose=Bot.prototype.chooseNextAction;Bot.prototype.chooseNextAction=function(){ensureSpeed(this);if(!this.escapeMode&&(followRecovery(this)||startRecovery(this,problem(this))))return;var before={x:this.targetPosition&&this.targetPosition.x,y:this.targetPosition&&this.targetPosition.y};var r=oldChoose.apply(this,arguments);ensureSpeed(this);if(!this.escapeMode&&same(this.position,this.targetPosition)&&same(before,this.targetPosition)&&Date.now()-motion(this).lastMovedAt>1900)startRecovery(this,'stuck');return r};
 var oldUpdate=Bot.prototype.update;Bot.prototype.update=function(){ensureSpeed(this);var r=oldUpdate.apply(this,arguments);watchdog(this);ensureSpeed(this);return r};return true
}
function syncBots(){var g=G(),bots=g&&g.bots||[];for(var i=0;i<bots.length;i++)if(bots[i]&&bots[i].alive!==false)watchdog(bots[i])}

/* Social personality layer. It adds interaction without duplicating replies already produced by v0.13.7. */
var social={name:'',persona:'',ambientAt:0,ambientCount:0,lastRemoteCount:0,pending:[]};
function remoteCount(){var rows=document.querySelectorAll('#chatMessages .chat_line'),n=0,name=clean(S.remoteName);for(var i=0;i<rows.length;i++){var strong=rows[i].querySelector('strong');if(strong&&clean(strong.textContent)===name)n++}return n}
function typing(on){var e=$('v138Typing');if(e)e.remove();if(!on||!S.els||!S.els.chatMessages)return;var row=document.createElement('div');row.id='v138Typing';row.className='chat_line v132_typing';var who=document.createElement('strong');who.textContent=clean(S.remoteName);var body=document.createElement('span');body.textContent='is typing...';row.appendChild(who);row.appendChild(body);S.els.chatMessages.appendChild(row);S.els.chatMessages.scrollTop=S.els.chatMessages.scrollHeight}
function say(text,delay){if(S.role!=='simulated'||!text)return false;var name=clean(S.remoteName),wait=Math.max(350,Number(delay)||900);setTimeout(function(){if(S.role==='simulated'&&clean(S.remoteName)===name)typing(true)},Math.max(0,wait-380));setTimeout(function(){if(S.role!=='simulated'||clean(S.remoteName)!==name)return;typing(false);var fn=window.BomberOnline&&BomberOnline.appendChat;if(typeof fn==='function')fn(name,text,false);else S.appendChat(name,text,false)},wait);return true}
function resetSocial(){var name=clean(S.remoteName||'Opponent');if(social.name===name)return;for(var i=0;i<social.pending.length;i++)clearTimeout(social.pending[i]);social={name:name,persona:persona(name),ambientAt:Date.now()+14000+(hash('v138|ambient|'+name)%15000),ambientCount:0,lastRemoteCount:remoteCount(),pending:[]}}
function personaReply(text){var t=String(text||'').toLowerCase(),p=social.persona||persona(S.remoteName),pool=REPLY.generic;if(/\b(hi|hey|hello|yo|sup)\b/.test(t))pool=REPLY.greeting;else if(/\bgg\b|good game/.test(t))pool=REPLY.gg;else if(/rematch|again|one more|run it back/.test(t))pool=REPLY.rematch;else if(/\bbot\b|npc|computer/.test(t))pool=REPLY.bot;else if(/nice|good job|clean|well played|wp/.test(t))pool=REPLY.compliment;else if(/\bez\b|trash|bad|suck|noob/.test(t))pool=REPLY.insult;else if(/lag|stutter|ping/.test(t))pool=REPLY.lag;else if(/shoe|speed|fast|slow/.test(t))pool=REPLY.speed;else if(/bomb|blast|explod/.test(t))pool=REPLY.bomb;else if(/\?/.test(t))pool=REPLY.question;var x=pick(pool,'reply|'+p+'|'+t.slice(0,24));if(p==='salty'&&pool===REPLY.generic&&Math.random()<.45)x=pick(['nah lol','idk about that','sure 😭','whatever lol','ok bro'],'salty');if(p==='friendly'&&pool===REPLY.generic&&Math.random()<.45)x=pick(['lol yeah','fair enough','true man','haha yeah','i get you'],'friendly');if(p==='quiet'&&x.length>12)x=pick(['lol','yeah','fair','true','maybe'],'quiet');return x}
function patchChatFallback(){if(S.__v138ChatFallback)return;S.__v138ChatFallback=true;var old=S.sendChat;S.sendChat=function(t){var text=String(t||'').trim(),before=remoteCount(),r=old.apply(S,arguments);if(text&&S.role==='simulated'){resetSocial();var p=social.persona,chance=p==='quiet'?.28:p==='friendly'?.88:p==='competitive'?.76:.66;if(Math.random()<chance){var timer=setTimeout(function(){if(S.role!=='simulated'||clean(S.remoteName)!==social.name)return;if(remoteCount()<=before)say(personaReply(text),500+Math.floor(Math.random()*650))},4300);social.pending.push(timer)}}return r}}
function ambientSocial(){if(S.role!=='simulated')return;resetSocial();var g=G();if(!g||!g.playing||g.menu.visible||g.matchFinished||Date.now()<social.ambientAt||social.ambientCount>=4)return;var p=social.persona,pool=AMBIENT[p]||AMBIENT.chill;var wood=999;try{var b=g.simulatedOpponent||g.bots.find(function(x){return x&&x.simulatedHuman});if(b&&b.remainingWoodCount)wood=b.remainingWoodCount()}catch(e){}var extra=wood<=12?['map is wide open now','late game is getting sketchy','no blocks left to hide behind lol','ok now its just lanes']:[];say(pick(pool.concat(extra),'ambient|'+social.ambientCount),700+Math.floor(Math.random()*900));social.ambientCount++;social.ambientAt=Date.now()+18000+(hash('v138|next|'+social.name+'|'+social.ambientCount)%24000)}

function install(){if(installed)return true;if(!window.Bot||!window.BomberStability137||!S.els)return false;installed=true;expandSocial();patchMovement();patchChatFallback();badge();window.BomberAI138={version:VERSION,persona:persona,problem:problem,axisProblem:axisProblem,recoveryPath:recoveryPath,ensureSpeed:ensureSpeed,watchdog:watchdog};if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberAI138.debug={setTrail:function(bot,a){motion(bot).trail=(a||[]).slice();return motion(bot).trail},setStuck:function(bot,ms){motion(bot).lastMovedAt=Date.now()-(ms||2500);return motion(bot).lastMovedAt},state:function(bot){var m=motion(bot);return{speed:ensureSpeed(bot),shoes:bot.__v138Shoes,problem:problem(bot),trail:m.trail.slice(),recovery:m.recovery?m.recovery.slice():[],breaks:m.breaks,stuckBreaks:m.stuckBreaks}},personaRate:function(names){var out={};for(var i=0;i<names.length;i++){var p=persona(names[i]);out[p]=(out[p]||0)+1}return out},reply:function(text){resetSocial();return personaReply(text)}};return true}
var tries=0,t=setInterval(function(){if(install()||++tries>900)clearInterval(t)},40);
setInterval(function(){if(!installed)return;badge();syncBots();ambientSocial()},120);
})();
