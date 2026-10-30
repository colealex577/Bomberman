(function(){
'use strict';
var VERSION='v0.14.2',S=window.B115,installed=false;
if(!S)return;
var publicTxn={active:false,button:null,startedAt:0,deadline:0,retries:0,retrying:false};
var chatGuardDepth=0;
var CHAT_MIN_GAP=4200,POWER_HINT_CHANCE=.22,SPECTATOR_PICK_CHANCE=.10,BRAG_CHANCE=.32,DUEL_CHAT_CHANCE=.45;
function freshSocial(name){return{name:name||'',used:{},reserved:{},lastBotCount:null,lastPickupTotal:0,lastDanger:false,spectating:false,duel:false,nextSpectator:Date.now()+14000,nextDuel:Date.now()+11000,nextQuestion:Date.now()+22000,questions:0,pendingQuestion:null,lastLineAt:0,bonusSeen:{},nextBonusHint:Date.now()+18000,lastBragAt:0,matchSerial:(freshSocial.serial=(freshSocial.serial||0)+1)}}
var social=freshSocial('');

var QUESTIONS={
 friendly:[['play','you play this a lot?'],['map','whats your favorite map?'],['bots','do the bots always act this weird for you lol'],['mode','you like ultimate mode or normal better?'],['style','do you usually chase people or play safe?'],['pickup','which powerup do you go for first?'],['bomb','you like big blast range or more bombs?'],['speed','how many shoes is too many lol'],['round','you usually play best of 3 or single rounds?']],
 competitive:[['play','how many games have you played lol'],['map','what map are you best at?'],['style','you always play this aggressive?'],['bots','you think the bots are harder late game?'],['pickup','you prioritize shoes or bombs?'],['bomb','you ever try to chain every bomb at once?'],['speed','you think speed matters more than range?'],['round','you want the next round too?'],['lane','which lane do you usually control?']],
 salty:[['bots','be honest do the bots target me more 😭'],['map','which map has the worst bot paths lol'],['play','you get matches like this often?'],['pickup','why are all the good pickups on your side lol'],['bomb','do my bombs just hate me today?'],['speed','how do you always get the shoes first lol'],['style','you always run away that clean?'],['round','you really wanna run this back after this?']],
 goofy:[['map','what map is the most chaotic to you lol'],['bots','which bot would you trust least'],['play','you ever accidentally trap yourself too?'],['pickup','if you had to pick one powerup forever what is it'],['bomb','how many bombs before the board becomes cursed'],['speed','would 20 shoes even be controllable lol'],['style','do you actually have a strategy right now'],['round','one more after this if we survive?']],
 quiet:[['map','fav map?'],['play','you play a lot?'],['mode','ultimate or normal?'],['pickup','shoes or bombs?'],['style','aggressive or safe?'],['bomb','more bombs or range?'],['round','another after?']],
 tactical:[['style','you usually chase or play safe?'],['map','which map do you think is most balanced?'],['bots','you notice bots looping late game too?'],['pickup','what pickup do you value most late game?'],['bomb','do you prefer bomb count or blast range?'],['speed','how much speed do you like before it gets sketchy?'],['lane','do you watch exits or chase the center?'],['round','best of 3 or one and done?']],
 chill:[['play','you been playing long?'],['map','what map do you like most?'],['mode','you prefer normal or ultimate?'],['pickup','whats your favorite pickup?'],['bomb','you like a lot of bombs or just a couple?'],['speed','you grab every shoe you see?'],['style','you more patient or aggressive?'],['round','you usually rematch people?']],
 chaotic:[['mode','ultimate mode yes or no lol'],['map','which map gets the craziest?'],['bots','would you trust a bot with one bomb left?'],['pickup','how many powerups before this gets stupid lol'],['bomb','how many bombs can we get on screen at once'],['speed','you ever get so fast you cant turn?'],['style','do you plan anything or just send it'],['round','we running another chaos round after this?']]
};
var DUEL_LINES=['ok just us now','welp 1v1 now lol','alright now its actually us','no more bots to blame lol','ok final two','this got way more serious','alright your move','nowhere to hide now lol','board is open lets go','ok this is the real match now','finally no bots in the way','alright this is cleaner now','just you and me now','ok no distractions now','time for the actual duel','this board is way too open for a 1v1','welp now every bomb matters','alright final two lets see it','no bots left to save either of us','ok now i can actually focus on you','last two standing lol','this is about to get sketchy','alright now we settle it','ok im locking in now'];
var SPEC_START=['welp im spectating now lol','ok im watching this','you better beat the bots now','im out 😭 im watching','alright finish them off','gg im on spectator duty now','welp guess im your commentator now','ok im dead but im still watching','im out, dont lose to the bots now lol','alright you got the board now','spectator mode it is','rip me, finish this','ok lets see if you can close it','im watching every bad decision now lol','fine ill coach from the grave','welp carry us now'];
var SPEC_KILL=['nice one','one down lol','good bomb','that bot got deleted','ok that was clean','nice, keep going','you caught that one','lol rip that bot','that was a perfect lane','ok you read that bot','nice trap','you boxed that one in','clean elimination','that bot had nowhere to go','good timing','you got it right at the turn','that one never saw it coming','ok that was actually nice','you baited that perfectly','good pressure'];
var SPEC_ONE=['one bot left','last bot now','ok just one more','you got one left','finish the last one lol','last one standing between you and the win','one more bot, dont sell now','ok final bot','just clean up the last one','one left, youve got this','last bot is gonna be annoying watch','alright hunt the last one down'];
var SPEC_CLOSE=['that was close','bro you almost got cooked','nice escape','i thought that got you','how did you get out of that lol','good dodge','you got out by like one tile','i thought you were done there','that turn saved you','ok that escape was clean','barely made that one','you slipped right through it','that blast was way too close','nice read on the fuse','good exit','that was almost a disaster'];
var SPEC_PICK=['good pickup','nice grab','that pickup helps','worth it lol','grab everything at this point','good, take the upgrade','thatll help late game','nice, keep stacking','free upgrade, easy','good pickup timing','yeah you needed that','take every advantage now'];
var SPEC_AMBIENT=['careful in the open lanes','that bot keeps taking the same route lol','watch the long corridor','id grab a powerup if you can','late game bots get weird','dont let it pin you on a row','you can bait it into a lane','board is basically wide open now','watch the corners when the board opens','dont chase straight behind it','make it cross your blast line','keep an exit before you plant','that bot is gonna cut across eventually','you can pressure it without following the same row','dont get greedy with the next bomb','the open middle is dangerous','try changing lanes before it does','watch for a chain bomb','you have room to rotate around it','make the bot come to you'];
var DUEL_RELEVANT=['you keep taking that lane','im watching your exits','dont get comfortable lol','that pickup might save you','youre fast now','this board is wide open','one bomb can end this now','i know where youre trying to go','stop running the same lane lol','ok that was a good dodge','you almost had me there','im trying to cut off the row','you keep circling the outside','im not following you down that lane','youre trying to bait me into the turn','i saw that setup','that corner is getting dangerous','youre stacking way too much speed','im saving an exit before i bomb','you keep slipping past the blast','i need to cut your route off','youre making the middle annoying','i know youre waiting for me to cross','one wrong turn and this is over','im not giving you that pickup for free','you keep checking the same opening','this is turning into a lane battle','youre really making me chase','im gonna force you out of that side','that bomb almost boxed me in','youre getting too comfortable over there','im watching that powerup too','this is way closer than i expected','im trying to make you commit first','dont think i didnt see that bomb','you almost trapped yourself there','that route is getting predictable','i need one clean angle','this board has zero cover now','im not stepping into that crossfire'];
var START_MORE=['alright lets make this a good one','yo lets see what happens','good luck dont trap yourself lol','ok loading in','im ready when you are','alright im here','lets run a clean one','yo this map could get messy','good luck, watch the bots','ok lets gooo','ready now','im actually awake this round lol','lets see who gets the first shoes','dont steal every pickup this time lol','alright no excuses','here we go again','ok im trying something different this round','lets make the bots regret spawning','good luck have fun','aight im locked in'];
var DEATH_MORE=['welp i got folded','ok that angle was nasty','i definitely should not have gone there','that bomb caught the exact exit','i got too greedy for that pickup','rip, i had no lane left','ok that one was on me','i saw it too late','that crossfire was brutal','i thought i had one more tile','welp i donated that round','i chased way too hard','ok you earned that one','i got boxed in so bad','that was a rough exit','i shouldve taken the other lane','yeah i deserved that lol','i was staring at the wrong bomb','that chain got me','i ran out of room fast'];
var KILL_MORE=['caught the exit','that crossfire worked','i knew youd take that lane','got you at the turn','that setup finally worked','i almost let you out lol','that was closer than it looked','i had to cut off both exits','ok that bomb placement was perfect','i got the timing right for once','you nearly slipped out','that was the lane i wanted','i saw you commit to that side','finally got the angle','that chain actually did what i wanted','i thought you were escaping that','you made me work for that one','that was a risky bomb but it paid off','i had one tile on you there','ok that was satisfying'];
var POWER_HINT={
 speed:['get those shoes lol','youre really leaving the shoes?','grab the speed shoes','those shoes are just sitting there','take the shoes before a bot does','you walked right past the speed lol','free shoes over there','id grab that speed if i were you','those shoes are worth the detour','dont leave the speed pickup','go get the shoes, seriously','youre gonna want that speed late game'],
 bomb:['get that bomb pickup','youre leaving a bomb upgrade there','grab the extra bomb','that bomb upgrade is free','take the bomb capacity before it disappears','you walked past an extra bomb lol','id take that bomb upgrade','more bombs never hurts here','go grab that bomb pickup','you can pressure way harder with that bomb','that extra bomb is worth it','dont donate that bomb pickup to a bot'],
 fire:['get that fire range','youre leaving the fire upgrade?','grab the flame pickup','that range upgrade is just sitting there','take the fire before a bot gets it','you walked past blast range lol','id grab that range upgrade','more fire range would help a lot','go get the fire pickup','that blast upgrade is worth the detour','dont leave that range on the board','you could use that extra fire range']
};
var BRAG={
 speed:['i got {n} shoes lol','im at {n} shoes now','{n} shoes is kinda ridiculous','i somehow have {n} shoes already','bro i have {n} shoes','{n} speed pickups, im flying','i keep finding shoes, im at {n}','ok {n} shoes might be enough lol','i have {n} shoes and zero brakes','youre not catching me with {n} shoes'],
 bomb:['i got {n} bomb pickups lol','im at {n} bomb upgrades now','{n} bomb pickups is getting stupid','i somehow have {n} bomb upgrades','bro i have {n} extra bomb pickups','im stacking bombs, {n} upgrades already','i keep finding bombs, im at {n}','ok {n} bomb upgrades is plenty','i have {n} bomb pickups, this is dangerous','{n} bomb upgrades and im still grabbing more'],
 fire:['i got {n} fire upgrades lol','im at {n} fire pickups now','{n} range upgrades is wild','i somehow have {n} fire upgrades','bro i have {n} blast upgrades','my range is getting stupid, {n} pickups','i keep finding fire, im at {n}','ok {n} range upgrades might be enough','i have {n} fire pickups, watch the lanes','{n} blast upgrades and the map is tiny now']
};
var ANSWERS={
 map:['classic is hard to beat','i like the open ones','shuffle is fun when it isnt cursed','depends, some maps make the bots weird','probably classic for actual strategy','the tighter maps are more stressful','i like maps with a few long lanes','random is fun until it gives you chaos','classic feels the fairest','i change my mind every few rounds'],
 play:['yeah ive played a bunch','on and off mostly','enough to know when im about to trap myself lol','i play more than i probably should','not forever but i know the basics','a decent amount lately','yeah this game gets addictive','i still make dumb mistakes though','some days im way better than others','long enough to hate corner traps'],
 bots:['yeah the bots get strange late game','fr they love those long lanes','some of them are actually nasty','they either cook or forget how to move lol','open maps make them way more aggressive','i never trust a bot near a powerup','they get unpredictable when the wood is gone','sometimes the bots make better traps than people','they love crossing at the worst possible time','i swear one bot always chooses violence'],
 mode:['ultimate is hilarious but normal is cleaner','normal feels more tactical to me','ultimate gets ridiculous fast','depends if i want strategy or chaos','i like normal when i actually care about winning','ultimate with tons of pickups is fun','normal is easier to read','ultimate turns every mistake into an explosion','i switch between them','both are good for different reasons'],
 style:['i usually try to cut off exits','i chase until it gets dangerous','i like making people commit to a lane','mostly patient until the board opens','i play safer when there are lots of bombs','i try to keep two exits whenever i can','depends how much speed i have','i like pressure more than camping','i usually rotate instead of chasing straight','i get way more aggressive late game'],
 pickup:['shoes are probably my favorite','extra bombs are huge once the board opens','fire range is underrated','i take whatever is safest to grab','speed first usually','bomb capacity if i already have some speed','i like stacking a little of everything','i get greedy for shoes every time','range is great until you trap yourself','honestly i grab almost anything thats exposed'],
 bomb:['more bombs is probably stronger for pressure','range is nice but too much gets dangerous','i like having a few bombs and medium range','chain bombs are fun until they backfire','bomb count first for me','range matters a lot in open lanes','i dont like max range when im too fast','i usually want enough bombs to cover two exits','big range makes baiting easier','depends how much room is left'],
 speed:['there is definitely such a thing as too fast lol','i like enough speed to cross a lane quickly','shoes are amazing late game','too much speed makes corners weird','i usually keep grabbing them anyway','speed saves you from so many bad bombs','i want at least a few before the board opens','fast is good until you overshoot an exit','i probably value shoes too much','once youre fast the whole match changes'],
 round:['best of 3 feels pretty fair','single rounds are good when the match is long','i usually rematch if it was close','yeah id run another one','best of 5 can get intense','one round never feels like enough after a close game','depends how chaotic the bots were','im usually down for another','sets are better when both players are close','i like a quick rematch'],
 lane:['i try to own the intersections more than one lane','i watch the exits before i chase','middle control matters once the wood is gone','i like rotating between rows instead of camping one','i avoid getting stuck on the outer edge','long lanes are great if you keep an exit','i try to make the other player cross first','i watch perpendicular exits a lot','i dont like staying on one axis too long','corners are only good if you know the escape']
};

function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function clean(v){return String(v||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Player'}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function hash(s){s=String(s||'');var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function persona(){try{return window.BomberAI138&&BomberAI138.persona?BomberAI138.persona(S.remoteName||'Opponent'):'chill'}catch(e){return'chill'}}
function normLine(text){return String(text||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function unavailable(text){var k=normLine(text);return!!(k&&(social.used[k]||social.reserved[k]))}
function reserve(text){var k=normLine(text);if(k)social.reserved[k]=1;return k}
function release(text){var k=normLine(text);if(k)delete social.reserved[k]}
function markUsed(text){var k=normLine(text);if(k){delete social.reserved[k];social.used[k]=1}return k}
function pickUnused(pool,salt){if(!pool||!pool.length)return'';var a=pool.filter(function(x){return x&&!unavailable(x)});if(!a.length)return'';var seed=hash((S.remoteName||'player')+'|'+salt+'|'+social.matchSerial+'|'+Math.floor(Date.now()/700));return a[(seed+Math.floor(Math.random()*a.length))%a.length]}
function merge(base,extra){var a=Array.isArray(base)?base.slice():[],seen={};for(var i=0;i<a.length;i++)seen[normLine(a[i])]=1;for(var j=0;j<extra.length;j++){var k=normLine(extra[j]);if(k&&!seen[k]){seen[k]=1;a.push(extra[j])}}return a}
function badge(){['buildVersion138','buildVersion139'].forEach(function(id){var old=$(id);if(old)old.style.display='none'});var b=$('buildVersion140');if(!b){b=document.createElement('div');b.id='buildVersion140';b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none';document.body.appendChild(b)}if(b.textContent!==VERSION)b.textContent=VERSION}
function style(){if($('v140-style'))return;var s=document.createElement('style');s.id='v140-style';s.textContent='#buildVersion138,#buildVersion139{display:none!important}body.v140_public_latched #lobbyChoice,body.v140_public_latched #v131RoundSets,body.v140_public_latched #v133MultiMapSetting{visibility:hidden!important}#v140SearchShield{position:absolute;inset:76px 18px 18px;z-index:60;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(28,16,24,.96);border:1px solid rgba(255,255,255,.13);color:#fff;font:800 14px/1.4 Arial,sans-serif;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.35)}#v140SearchShield[hidden]{display:none!important}#v140SearchShield small{display:block;margin-top:7px;color:rgba(255,255,255,.62);font-size:10px;font-weight:600}.lobby_card{position:relative}#qolPostMatch .v140_legacy_result_copy{display:none!important}#v140PostCopy{margin:0 0 14px;color:rgba(255,255,255,.72)}';document.head.appendChild(s)}

/* Public matchmaking stays latched through intermediate lobby redraws. */
function ensureShield(){var lobby=$('multiplayerLobby'),card=lobby&&lobby.querySelector('.lobby_card'),x=$('v140SearchShield');if(!card)return null;if(!x){x=document.createElement('div');x.id='v140SearchShield';x.hidden=true;x.innerHTML='<div>Searching for a public match…<small>Keeping matchmaking active</small></div>';card.appendChild(x)}return x}
function publicLive(){return!!(S.started||S.role==='simulated'||(S.kind==='public'&&(S.role==='host'||S.role==='guest')))}
function clearPublicLatch(){publicTxn.active=false;publicTxn.button=null;publicTxn.retries=0;publicTxn.retrying=false;document.body.classList.remove('v140_public_latched');var x=$('v140SearchShield');if(x)x.hidden=true}
function latchPublic(button){if(publicTxn.retrying)return;if(!publicTxn.active){publicTxn.active=true;publicTxn.startedAt=Date.now();publicTxn.deadline=Date.now()+6200;publicTxn.retries=0}publicTxn.button=button||publicTxn.button||$('publicMatchBtn');document.body.classList.add('v140_public_latched');var x=ensureShield();if(x)x.hidden=false}
function stabilizePublic(){if(!publicTxn.active)return;var lobby=$('multiplayerLobby');if(!lobby||lobby.hidden||S.started||S.role==='simulated'){clearPublicLatch();return}if(publicLive()){clearPublicLatch();return}var age=Date.now()-publicTxn.startedAt,marks=[650,1550,2850];if(publicTxn.retries<marks.length&&age>=marks[publicTxn.retries]){var b=publicTxn.button||$('publicMatchBtn');if(b){publicTxn.retries++;publicTxn.retrying=true;try{b.click()}catch(e){}publicTxn.retrying=false}}if(Date.now()>publicTxn.deadline){var x=$('v140SearchShield');if(x)x.innerHTML='<div>Could not start matchmaking.<small>Please try Search Public Match again.</small></div>';setTimeout(clearPublicLatch,1200)}}
function patchPublic(){document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('#publicMatchBtn');if(t){setTimeout(function(){latchPublic(t)},0);return}var id=e.target&&e.target.id;if(id==='joinBackBtn'||id==='hostCancelBtn'||id==='lobbyCloseBtn'||id==='onlineDisconnectBtn')clearPublicLatch()},true)}

/* Single AI movement owner. Map collision and host/guest authority remain in the engine. */
function motion(bot){
 if(!bot.__v140Motion)bot.__v140Motion={lastX:Number(bot.bmp&&bot.bmp.x)||0,lastY:Number(bot.bmp&&bot.bmp.y)||0,lastMovedAt:Date.now(),trail:[],samples:[],lastBreak:0,breaks:0,hardResets:0,banAxis:'',banX:0,banY:0,banUntil:0,targetKey:'',targetSince:Date.now(),lastDecision:'',reverseAxis:'',reverseAt:0,reverseCount:0,exitAxis:'',exitUntil:0,loopBlocks:0,route:null,routeReason:'',routeUntil:0,ambushSince:0};
 return bot.__v140Motion;
}
function authority(){return S.role!=='guest'}
function movementActive(bot){var g=G();return!!(authority()&&bot&&bot.alive!==false&&bot.started&&g&&g.playing&&!g.lobbyOpen&&!g.matchFinished&&g.menu&&!g.menu.visible)}
function targetHuman(){var g=G(),a=g&&g.players||[];for(var i=0;i<a.length;i++)if(a[i]&&a[i].alive!==false&&!a[i].isBot)return a[i];return null}
function point(k){var a=String(k||'0,0').split(',');return{x:Number(a[0])||0,y:Number(a[1])||0}}
function distance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
function centered(bot){var p=Utils.convertToBitmapPosition(bot.position);return Math.abs(p.x-bot.bmp.x)<.01&&Math.abs(p.y-bot.bmp.y)<.01}
function trackedDanger(bot){var g=G(),b=bot.escapeThreatBomb;return!!(bot.escapeMode&&b&&g&&g.bombs.indexOf(b)>=0&&(!b.exploded||(b.fires&&b.fires.length)))}
function exposedBaitBonus(bot,bait){var g=G();if(!g||!bait)return null;for(var i=0;i<(g.bonuses||[]).length;i++){var b=g.bonuses[i];if(b&&same(b.position,bait)&&g.getTileMaterial(b.position)==='grass')return b}return null}
function strictItemAmbush(bot){
 var bait=bot&&bot.__v134Bait,m=bot&&motion(bot),t=targetHuman(),now=Date.now();
 if(!bot||!bot.simulatedHuman||!bait||bait.triggered||!bait.ambush||!same(bot.position,bait.ambush)||!centered(bot)||!safe(bot,bot.position)||!exposedBaitBonus(bot,bait)||!t||!bot.blastWouldHit(bot.position,bait))return false;
 if(m.ambushBait!==bait){m.ambushBait=bait;m.ambushSince=now}
 if(now-m.ambushSince>4000||now-bait.created>14000)return false;
 var d=distance(t.position,bait);if(d>5)return false;
 var path=bot.findPath(t.position,{x:bait.x,y:bait.y},true);if(!path||path.length>6)return false;
 return d<=3||!!(t.targetPosition&&distance(t.targetPosition,bait)<d);
}
function pruneAmbush(bot){var bait=bot&&bot.__v134Bait;if(!bait)return false;var expired=Date.now()-bait.created>14000||!exposedBaitBonus(bot,bait)||!targetHuman();if(!expired&&(!same(bot.position,bait.ambush)||strictItemAmbush(bot)))return false;bot.__v134Bait=null;bot.__v134BaitCooldown=Date.now()+2200;return true}
function sample(bot){
 if(!bot||!bot.bmp||!bot.position)return;var m=motion(bot),now=Date.now(),x=Number(bot.bmp.x)||0,y=Number(bot.bmp.y)||0,threshold=Math.max(4,(G().tileSize||50)*.2);
 // Small jitter and changing intentions do not reset the spatial progress clock.
 if(Math.hypot(x-m.lastX,y-m.lastY)>=threshold){m.lastMovedAt=now;m.lastX=x;m.lastY=y}
 if(centered(bot)){var k=key(bot.position);if(k&&m.trail[m.trail.length-1]!==k){m.trail.push(k);m.samples.push({k:k,t:now});if(m.trail.length>160)m.trail.shift()}}
 m.samples=m.samples.filter(function(s){return now-s.t<Math.max(16000,Math.max(G().tilesX,G().tilesY)*G().tileSize/Math.max(1,bot.velocity)*60)}).slice(-160);
 var tk=key(bot.targetPosition);if(tk!==m.targetKey){m.targetKey=tk;m.targetSince=now}
}
function corridorProblem(bot){
 var m=motion(bot),h=m.samples.length?m.samples.map(function(s){return s.k}):m.trail.slice(-160);if(h.length<7)return'';
 // Work in a moving row/column band, not a fixed number of adjacent tiles.
 // Minor lane detours are allowed; three substantial alternating runs are not.
 for(var axis=0;axis<2;axis++){
  var runs=[],sign=0,start=null,last=null,minLane=Infinity,maxLane=-Infinity;
  for(var i=0;i<h.length;i++){
   var p=point(h[i]),along=axis?p.y:p.x,lane=axis?p.x:p.y;
   if(minLane===Infinity||Math.max(maxLane,lane)-Math.min(minLane,lane)>2){runs=[];sign=0;start=null;last=null;minLane=lane;maxLane=lane}
   minLane=Math.min(minLane,lane);maxLane=Math.max(maxLane,lane);
   if(last!==null&&along!==last){var dir=along>last?1:-1;if(sign&&dir!==sign){if(Math.abs(last-start)>=3)runs.push({sign:sign,length:Math.abs(last-start)});start=last}if(start===null)start=last;sign=dir}
   last=along;
   if(runs.length>=2&&sign&&runs[runs.length-1].sign!==sign&&Math.abs(along-start)>=1)return axis?'vertical':'horizontal';
  }
 }
 var w=h.slice(-24),seen={};w.forEach(function(k){seen[k]=(seen[k]||0)+1});
 if(w.length>=8&&Object.keys(seen).length<=w.length*.5)return'cycle';return'';
}
function recentMap(bot){var r={};motion(bot).trail.slice(-56).forEach(function(k){r[k]=(r[k]||0)+1});return r}
function safe(bot,p){var g=G();return!!(p&&bot.inBounds(p)&&g.getTileMaterial(p)==='grass'&&!bot.hasBomb(p)&&bot.isSafe(p))}
function walkable(bot,avoidDanger){return(bot.getWalkableNeighbors(bot.position,avoidDanger)||[]).filter(function(p){return p&&!same(p,bot.position)})}
function onBannedLane(m,p){return m.banAxis==='horizontal'?Number(p.y)===m.banY:m.banAxis==='vertical'?Number(p.x)===m.banX:false}
function blockedByBan(bot,from,to){var m=motion(bot);if(Date.now()>m.banUntil||!m.banAxis)return false;return onBannedLane(m,to)&&(!onBannedLane(m,from)||corridorAxis(from,to)===m.banAxis)}
function botSlot(bot){var a=G().bots||[],i=a.indexOf(bot);return i<0?Number(bot.statSlot)||0:i}
// One flood fill per plan. Actors affect tie-breaking only; they never remove edges.
function routes(bot,ignoreBan){
 var start={x:bot.position.x,y:bot.position.y},queue=[[start]],seen={};seen[key(start)]=true;
 for(var i=0;i<queue.length;i++){
  var path=queue[i],cur=path[path.length-1],a=bot.getWalkableNeighbors(cur,true)||[],slot=botSlot(bot);
  a.sort(function(x,y){return(hash(key(x)+'|'+slot)%31)-(hash(key(y)+'|'+slot)%31)});
  for(var j=0;j<a.length;j++){var n=a[j],k=key(n);if(seen[k]||(!ignoreBan&&blockedByBan(bot,cur,n)))continue;seen[k]=true;queue.push(path.concat([{x:n.x,y:n.y}]))}
 }
 return queue;
}
function occupancyCost(bot,path){var a=G().bots||[],cost=0;for(var i=0;i<a.length;i++){var b=a[i];if(b===bot||b.alive===false)continue;var other=b.__v140Motion&&b.__v140Motion.route;for(var j=1;j<Math.min(path.length,5);j++)if(same(path[j],b.position)||other&&other.some(function(p){return same(p,path[j])}))cost+=2}return cost}
function novelPath(bot,reason){
 var m=motion(bot),axis=reason==='horizontal'||reason==='vertical'?reason:'',all=routes(bot,!!axis),cur=bot.position,recent=recentMap(bot),human=openBoard(bot)?targetHuman():null,c=[];
 for(var i=0;i<all.length;i++){
  var path=all[i],end=path[path.length-1];if(path.length<3)continue;
  var firstExit=-1,off=axis==='horizontal'?Math.abs(end.y-cur.y):Math.abs(end.x-cur.x);
  if(axis){for(var j=1;j<path.length;j++)if(axis==='horizontal'?path[j].y!==cur.y:path[j].x!==cur.x){firstExit=j;break}if(firstExit<0||off<1||(off<2&&path.length-firstExit<3))continue;
   // Do not leave for one tile and then return to the abandoned corridor.
   if(path.slice(firstExit).some(function(p){return axis==='horizontal'?p.y===cur.y:p.x===cur.x}))continue;
  }
  var score=(axis?firstExit*1000:0)+path.length*3+(recent[key(end)]||0)*12+occupancyCost(bot,path)+(human?distance(end,human.position)*2:0);
  if(!axis&&path.length>7)score+=(path.length-7)*10;
  c.push({path:path,score:score});
 }
 c.sort(function(a,b){return a.score-b.score});return c.length?c[0].path:null;
}
function clearRoute(bot){var m=motion(bot);m.route=null;m.routeReason='';m.routeUntil=0;if(bot.__v138Motion)bot.__v138Motion.recovery=null}
function clearStaleIntent(bot){
 bot.clearEscapePlan();clearRoute(bot);bot.__v137BreakPath=null;bot.__v135PowerupTarget=null;bot.__v134Bait=null;bot.__v134BaitCooldown=Date.now()+2200;
 var m=motion(bot);m.exitAxis='';m.exitUntil=0;m.lastDecision='';m.reverseCount=0;
 bot.setNextTile(bot.position); // Pixel-based steering recenters without teleporting.
}
function commitRoute(bot,path,reason){
 if(!path||path.length<2)return false;var m=motion(bot);m.route=path.slice(1);m.routeReason=reason;m.routeUntil=Date.now()+Math.max(4000,path.length*(G().tileSize/Math.max(1,bot.velocity))*40+2000);
 if(bot.__v138Motion)bot.__v138Motion.recovery=m.route;
 bot.setNextTile(m.route[0]);return true;
}
function followRoute(bot){
 var m=motion(bot);if(!m.route)return false;if(Date.now()>m.routeUntil){clearRoute(bot);return false}
 while(m.route.length&&same(m.route[0],bot.position)&&centered(bot))m.route.shift();
 if(!m.route.length){var completed=m.routeReason;clearRoute(bot);if(completed!=='hunt'){if(completed==='horizontal'||completed==='vertical')m.banUntil=Date.now()+4500;m.trail=m.trail.slice(-1);m.samples=[]}return false}
 var next=m.route[0];if(!safe(bot,next)||distance(bot.position,next)>1){clearRoute(bot);return false}
 bot.setNextTile(next);return true;
}
function forceNeighbor(bot){var a=walkable(bot,true).filter(function(p){return!blockedByBan(bot,bot.position,p)});if(!a.length)return false;return commitRoute(bot,[bot.position,a[botSlot(bot)%a.length]],'neighbor')}
function forceNovelRoute(bot,reason){
 if(!authority()||!bot||strictItemAmbush(bot)||!bot.isSafe(bot.position))return false;
 var m=motion(bot),axis=reason==='horizontal'||reason==='vertical'?reason:'',p=novelPath(bot,reason);
 if(!p)return axis?false:forceNeighbor(bot);
 m.lastBreak=Date.now();m.breaks++;m.trail=m.trail.slice(-1);m.samples=[];m.lastDecision='';m.reverseCount=0;
 if(axis){m.banAxis=axis;m.banX=bot.position.x;m.banY=bot.position.y;m.banUntil=Date.now()+12000;m.exitAxis='';m.exitUntil=0}
 return commitRoute(bot,p,reason);
}
function hardRecover(bot,reason){
 if(!authority()||!bot||strictItemAmbush(bot))return false;var m=motion(bot),unsafe=!bot.isSafe(bot.position),path=unsafe?bot.findEscapePath(null,null):null;
 // If every exit is unsafe, holding is preferable to forcing a random step.
 if(unsafe&&(!path||path.length<2))return false;
 clearStaleIntent(bot);var ok;
 if(unsafe){bot.beginEscapePlan(path,bot.getMostImmediateThreatBomb());bot.setNextTile(path[1]);ok=true}else ok=forceNovelRoute(bot,reason||'stuck');
 m.lastBreak=Date.now();m.lastMovedAt=Date.now();m.hardResets++;m.lastX=bot.bmp.x;m.lastY=bot.bmp.y;return ok;
}
function escapeDisposition(bot){
 if(!bot.escapeMode)return'';var m=motion(bot),age=Date.now()-m.lastMovedAt,real=trackedDanger(bot),path=bot.escapePath,done=!path||bot.escapePathIndex>=path.length||same(bot.position,bot.escapeDestination)&&centered(bot);
 if(real&&done&&centered(bot)&&bot.isSafe(bot.position))return'hold';
 if(age>=1750)return'recover';
 if(!real&&done)return'recover';return'hold';
}
function openBoard(bot){return!!(bot&&(bot.hyperAggressive||(bot.remainingWoodCount&&bot.remainingWoodCount()<=10)))}
function corridorAxis(a,b){if(!a||!b)return'';if(a.y===b.y&&a.x!==b.x)return'horizontal';if(a.x===b.x&&a.y!==b.y)return'vertical';return''}
function corridorDecision(bot){
 var m=motion(bot),t=bot.targetPosition,h=m.trail;if(!t||same(t,bot.position)||h.length<2)return'';
 var decision=key(bot.position)+'>'+key(t);if(decision===m.lastDecision)return'';m.lastDecision=decision;
 var axis=corridorAxis(bot.position,t),prev=point(h[h.length-2]),now=Date.now();
 if(same(t,prev)){if(m.reverseAxis===axis&&now-m.reverseAt<16000)m.reverseCount++;else m.reverseCount=1;m.reverseAxis=axis;m.reverseAt=now;
  if(m.reverseCount>=2){m.exitAxis=axis;m.exitUntil=now+12000;m.loopBlocks++;return axis}}
 return'';
}
function forceCorridorExit(bot){var m=motion(bot);if(!m.exitAxis||Date.now()>m.exitUntil)return false;return forceNovelRoute(bot,m.exitAxis)}
function patchOpenBoardTargeting(){
 if(Bot.prototype.__v141HumanTarget)return;Bot.prototype.__v141HumanTarget=true;
 var oldOpponent=Bot.prototype.getBestOpponent,oldBonus=Bot.prototype.__v134BonusPath||Bot.prototype.getBestBonusPath;
 Bot.prototype.getBestOpponent=function(){if(openBoard(this)){var h=targetHuman();if(h&&h!==this)return h}return oldOpponent.apply(this,arguments)};
 Bot.prototype.getBestBonusPath=function(){return openBoard(this)?null:oldBonus.apply(this,arguments)};
}
function ensureSpeed(bot){
 if(!bot||!authority())return bot&&bot.velocity;var base={easy:1.55,normal:2,hard:2.4,expert:2.75},g=G(),step=g.ultimateMode?4:.8;
 if(bot.__v138Shoes==null)bot.__v138Shoes=Math.max(0,Number(bot.bonusCounts&&bot.bonusCounts.speed)||0);
 if(bot.__v138BaseSpeed==null)bot.__v138BaseSpeed=Math.max(g.ultimateMode?4:2,Number(bot.velocity)||0);
 var b=!bot.simulatedHuman&&base[bot.v125Difficulty]||bot.__v138BaseSpeed,shoes=Math.max(0,Number(bot.__v138Shoes)||0),v=b+shoes*step;
 if(bot.hyperAggroSpeedApplied){if(!bot.simulatedHuman){var floor={easy:2.25,hard:3.15,expert:3.65}[bot.v125Difficulty];v=floor?Math.max(v,floor):Math.max(b*1.6,g.ultimateMode?6:3.2)+shoes*step}else v=Math.max(v,2.65+(Number(bot.humanSkill)||0)*.82)}
 bot.velocity=v;return v;
}
function watchdog(bot){
 if(!movementActive(bot))return'';pruneAmbush(bot);sample(bot);ensureSpeed(bot);if(strictItemAmbush(bot))return'';
 var m=motion(bot),now=Date.now(),esc=escapeDisposition(bot);
 if(esc==='hold')return'';
 if(esc==='recover'&&now-m.lastBreak>650){hardRecover(bot,'escape-stale');return'escape-stale'}
 if(now-m.lastMovedAt>=1750&&now-m.lastBreak>750){hardRecover(bot,'stuck');return'stuck'}
 // Route decisions happen at actual centers, never at rounded half-tile positions.
 if(!centered(bot)||m.route)return'';
 var why=corridorProblem(bot);if(why&&now-m.lastBreak>1000){m.exitAxis=why;m.exitUntil=now+12000;forceNovelRoute(bot,why);return why}return'';
}
function huntRoute(bot){
 var opponent=bot.getBestOpponent();if(!opponent)return false;
 var all=routes(bot,false),best=null,bestScore=Infinity,recent=recentMap(bot);
 for(var i=1;i<all.length;i++){var p=all[i],end=p[p.length-1],d=distance(end,opponent.position),lane=bot.blastWouldHit(end,opponent.position),score=p.length+ d*2-(lane?5:0)+(recent[key(end)]||0)*.7+occupancyCost(bot,p)*.25;if(score<bestScore){best=p;bestScore=score}}
 return best&&commitRoute(bot,best.slice(0,7),'hunt');
}
function patchMovement(){
 if(!window.Bot||Bot.prototype.__v140Movement)return false;Bot.prototype.__v140Movement=true;patchOpenBoardTargeting();
 var strategy=Bot.prototype.__v134Strategy||Bot.prototype.chooseNextAction,oldUpdate=Bot.prototype.update,oldMove=Bot.prototype.moveToTargetPosition,rawSet=Bot.prototype.__v134OldSetNextTile||Bot.prototype.setNextTile;
 window.BomberMovementController={ensureSpeed:ensureSpeed};
 // Replace the AI steering boundary instead of wrapping each historical avoidance rule.
 Bot.prototype.setNextTile=function(p){if(!authority()||!p)return;rawSet.call(this,p);var dx=this.targetBitmapPosition.x-this.bmp.x,dy=this.targetBitmapPosition.y-this.bmp.y;
  // Finish centering the current lane before turning across a perpendicular lane.
  var center=Utils.convertToBitmapPosition(this.position);
  if(Math.abs(dx)>.01&&Math.abs(dy)>.01){if(Math.abs(this.bmp.x-center.x)>.01){dx=center.x-this.bmp.x;dy=0}else{dy=center.y-this.bmp.y;dx=0}}
  this.dirX=Math.abs(dx)>.01?(dx>0?1:-1):0;this.dirY=this.dirX?0:Math.abs(dy)>.01?(dy>0?1:-1):0;
  if(this.dirX)this.direction=this.dirX>0?'right':'left';else if(this.dirY)this.direction=this.dirY>0?'down':'up';
 };
 Bot.prototype.moveToTargetPosition=function(){if(!authority())return;this.setNextTile(this.targetPosition);var before={x:this.bmp.x,y:this.bmp.y};
  // Clamp a centering step too: the base mover clamps only against the final target.
  var velocity=this.velocity,center=Utils.convertToBitmapPosition(this.position),dx=this.targetBitmapPosition.x-this.bmp.x,dy=this.targetBitmapPosition.y-this.bmp.y;
  if(Math.abs(dx)>.01&&Math.abs(dy)>.01){var gap=this.dirX?Math.abs(center.x-this.bmp.x):Math.abs(center.y-this.bmp.y);this.velocity=Math.min(velocity,gap)}
  try{oldMove.call(this)}finally{this.velocity=velocity}
  if(this.bmp.x===before.x&&this.bmp.y===before.y&&!centered(this)){clearRoute(this);this.setNextTile(this.position)}
 };
 Bot.prototype.chooseNextAction=function(){
  if(!authority())return;pruneAmbush(this);sample(this);ensureSpeed(this);
  if(!centered(this)){this.setNextTile(this.position);return}
  // The original committed escape planner always outranks ordinary route commitment.
  if(this.escapeMode||!this.isSafe(this.position)){clearRoute(this);return strategy.apply(this,arguments)}
  if(strictItemAmbush(this)){if(window.BomberGameplay134)BomberGameplay134.tryBaitTrap(this);return}
  var m=motion(this);
  if(!m.route||m.routeReason==='hunt'){var loop=corridorProblem(this);if(loop){clearRoute(this);m.exitAxis=loop;m.exitUntil=Date.now()+12000;if(forceNovelRoute(this,loop))return}}
  if(followRoute(this)||forceCorridorExit(this))return;
  if(openBoard(this)){
   this.__v134Bait=null;
   // Preserve tactical placement and timed escape validation, without reselecting a lane each tile.
   var op=this.getBestOpponent(),spare=this.bombsMax-this.activeBombCount();
   if(op&&spare>0&&!this.hasBomb(this.position)&&(this.blastWouldHit(this.position,op.position)||distance(this.position,op.position)<=5&&this.scoreBombPlacement(this.position)>=8)){
    var esc=this.findEscapePath(this.position,this.bombStrength,spare>1);if(esc&&esc.length>1){var b=this.plantBomb();if(b){this.beginEscapePlan(esc,b);this.setNextTile(esc[1]);return}}
   }
   if(huntRoute(this))return;
   // No safe route: wait rather than walking into projected fire.
   this.setNextTile(this.position);return;
  }
  var r;
  if(window.BomberGameplay134&&BomberGameplay134.tryBaitTrap(this))return;
  r=strategy.apply(this,arguments);
  if(!this.escapeMode){var why=corridorDecision(this)||corridorProblem(this);if(why)forceNovelRoute(this,why);else if(blockedByBan(this,this.position,this.targetPosition)){if(!forceNovelRoute(this,'stuck'))this.setNextTile(this.position)}}return r;
 };
 Bot.prototype.update=function(){var r=oldUpdate.apply(this,arguments);watchdog(this);return r};return true;
}

/* One visible owner for the post-match score text. Older rating/score writers update a hidden legacy node. */
function ensurePostOwner(){var post=$('qolPostMatch');if(!post)return null;var legacy=post.querySelector('.qol_copy:not(#v140PostCopy)');if(legacy)legacy.classList.add('v140_legacy_result_copy');var stable=$('v140PostCopy');if(!stable){stable=document.createElement('p');stable.id='v140PostCopy';stable.className='qol_copy';if(legacy)legacy.insertAdjacentElement('afterend',stable);else{var card=post.querySelector('.qol_card');if(card)card.insertBefore(stable,card.querySelector('.qol_actions'))}}return stable}
function syncPostOwner(){var stable=ensurePostOwner(),g=G();if(!stable)return'';var res=g&&g.__v123RatingResult,text='Choose what you want to do next.';if(res&&Number.isFinite(Number(res.after))){var d=Number(res.delta)||0;text+=' Score '+Math.max(0,Math.min(1000,Math.round(Number(res.after))))+' ('+(d>0?'+':'')+d+').'}if(stable.textContent!==text)stable.textContent=text;return text}

/* Chat dedupe and expanded contextual dialogue. */
function resetMatchSocial(name){social=freshSocial(name||'');return social}
function isSimRemote(name,local){return S.role==='simulated'&&!local&&clean(name)===clean(S.remoteName)}
function wrapChat(owner,keyName){if(!owner||typeof owner[keyName]!=='function'||owner[keyName].__v140Dedupe)return;var old=owner[keyName];function wrapped(name,text,local){if(chatGuardDepth)return old.apply(this,arguments);var remote=isSimRemote(name,local),root=S.els&&S.els.chatMessages,before=root?Array.prototype.slice.call(root.children):[],r;chatGuardDepth++;try{r=old.apply(this,arguments)}finally{chatGuardDepth--}if(remote&&root){var after=Array.prototype.slice.call(root.children),added=after.filter(function(n){return before.indexOf(n)<0});for(var i=0;i<added.length;i++){var row=added[i],strong=row.querySelector&&row.querySelector('strong'),span=row.querySelector&&row.querySelector('span');if(!span||strong&&clean(strong.textContent)!==clean(S.remoteName))continue;var finalText=span.textContent||'',k=normLine(finalText);if(k&&social.used[k]){row.remove();continue}if(k)markUsed(finalText)}}else if(remote){var k=normLine(text);if(k&&social.used[k])return false;if(k)markUsed(text)}return r}wrapped.__v140Dedupe=true;wrapped.__v140Old=old;owner[keyName]=wrapped}
function patchChatDedupe(){wrapChat(window.BomberOnline,'appendChat');wrapChat(S,'appendChat')}
function rawChat(text){if(S.role!=='simulated'||!text)return false;var fn=window.BomberOnline&&BomberOnline.appendChat,name=clean(S.remoteName);if(typeof fn==='function')fn(name,text,false);else if(S.appendChat)S.appendChat(name,text,false);social.lastLineAt=Date.now();return true}
function typing(on){['v137Typing','v138Typing','v139Typing','v140Typing'].forEach(function(id){var old=$(id);if(old)old.remove()});if(!on||!S.els||!S.els.chatMessages)return;var row=document.createElement('div');row.id='v140Typing';row.className='chat_line v132_typing';var who=document.createElement('strong');who.textContent=clean(S.remoteName);var body=document.createElement('span');body.textContent='is typing...';row.appendChild(who);row.appendChild(body);S.els.chatMessages.appendChild(row);S.els.chatMessages.scrollTop=S.els.chatMessages.scrollHeight}
function say(pool,salt,delay){if(S.role!=='simulated'||!pool||!pool.length||Date.now()-social.lastLineAt<CHAT_MIN_GAP)return false;var name=clean(S.remoteName),text=pickUnused(pool,salt);if(!text)return false;reserve(text);var wait=Math.max(480,Number(delay)||850);setTimeout(function(){if(S.role==='simulated'&&clean(S.remoteName)===name)typing(true)},Math.max(0,wait-350));setTimeout(function(){if(S.role==='simulated'&&clean(S.remoteName)===name){typing(false);rawChat(text)}else release(text)},wait);return true}
function simBot(){var g=G();if(!g)return null;return g.simulatedOpponent||(g.bots||[]).find(function(b){return b&&b.simulatedHuman})||null}
function localPlayer(){var g=G();return g&&g.players&&g.players[0]}
function liveRegularBots(){var g=G(),sim=simBot(),a=[];if(!g)return a;(g.bots||[]).forEach(function(b){if(b&&b!==sim&&!b.simulatedHuman&&b.alive!==false)a.push(b)});return a}
function pickupTotal(p){var c=p&&p.bonusCounts||{},n=0;Object.keys(c).forEach(function(k){n+=Number(c[k])||0});return n}
function inBombDanger(p){var g=G();if(!g||!p||!p.position)return false;for(var i=0;i<(g.bombs||[]).length;i++){var b=g.bombs[i];if(!b||b.exploded)continue;var a=[];try{a=b.getDangerPositions()}catch(e){}for(var j=0;j<a.length;j++)if(same(a[j],p.position))return true}return false}
function askQuestion(){if(S.role!=='simulated'||social.questions>=3)return false;var list=QUESTIONS[persona()]||QUESTIONS.chill,unused=list.filter(function(q){return q&&q[1]&&!unavailable(q[1])});if(!unused.length)return false;var q=unused[Math.floor(Math.random()*unused.length)];social.pendingQuestion={kind:q[0],at:Date.now()};social.questions++;social.nextQuestion=Date.now()+30000+Math.floor(Math.random()*20000);return say([q[1]],'question-'+q[0]+'-'+social.questions,700+Math.floor(Math.random()*650))}
function answerFor(text){var t=String(text||'').toLowerCase(),q=social.pendingQuestion&&social.pendingQuestion.kind,pool=null;if(q&&ANSWERS[q])pool=ANSWERS[q];else if(/map/.test(t))pool=ANSWERS.map;else if(/shoe|speed|fast|slow/.test(t))pool=ANSWERS.speed;else if(/power|pickup|upgrade/.test(t))pool=ANSWERS.pickup;else if(/bomb|blast|range|fire/.test(t))pool=ANSWERS.bomb;else if(/bot/.test(t))pool=ANSWERS.bots;else if(/round|rematch|again|set/.test(t))pool=ANSWERS.round;else if(/lane|row|corridor|exit/.test(t))pool=ANSWERS.lane;else if(/\bwhy\b/.test(t))pool=['probably the pathing','maybe because the board is so open','i was wondering the same thing','could just be bad timing','might be the bomb layout','honestly not sure lol','probably because every route is exposed now','i think the lane setup caused it'];else if(/\bhow\b/.test(t))pool=['mostly timing i think','lots of luck lol','just watching the lanes','i kinda wing it','trying to keep two exits open','watching where the blast crosses','mostly not committing too early','i just look for the safest turn'];else pool=['yeah lol','fair','true','i get that','same honestly','maybe','probably','fr','that makes sense','i can see that','lol yeah','kinda','depends honestly','i was thinking that too'];return pickUnused(pool,'answer|'+(q||'generic')+'|'+t.slice(0,20))||''}
function remoteCount(){var rows=document.querySelectorAll('#chatMessages .chat_line'),name=clean(S.remoteName),n=0;for(var i=0;i<rows.length;i++){var strong=rows[i].querySelector('strong');if(strong&&clean(strong.textContent)===name)n++}return n}
function patchChatAnswers(){if(S.__v140Answers)return;S.__v140Answers=true;var old=S.sendChat;S.sendChat=function(t){var text=String(t||'').trim(),before=remoteCount(),hadQ=!!social.pendingQuestion,r=old.apply(S,arguments);if(text&&S.role==='simulated'&&(hadQ||/[?]/.test(text))){social.pendingQuestion=null;setTimeout(function(){if(S.role==='simulated'&&remoteCount()<=before){var ans=answerFor(text);if(ans)say([ans],'answer-fallback',550)}},4700)}return r}}
function expandLegacyPools(){if(!S)return;S.SIM_START=merge(S.SIM_START,START_MORE);S.SIM_DEATH=merge(S.SIM_DEATH,DEATH_MORE);S.SIM_KILL=merge(S.SIM_KILL,KILL_MORE)}
function powerHintLine(type){return pickUnused(POWER_HINT[type]||[],'power-hint-'+type)}
function bragPool(type,count){var src=BRAG[type]||[],n=Math.max(0,Number(count)||0);return src.map(function(x){return x.replace(/\{n\}/g,String(n))})}
function bragLine(type,count){return pickUnused(bragPool(type,count),'brag-'+type+'-'+count)}
function exposedBonuses(){var g=G(),out=[];if(!g)return out;for(var i=0;i<(g.bonuses||[]).length;i++){var b=g.bonuses[i];if(b&&b.position&&g.getTileMaterial(b.position)==='grass')out.push(b)}return out}
function tickPowerHints(now,me){if(!me||!me.position||now<social.nextBonusHint)return;var list=exposedBonuses(),live={},best=null,bestD=999;for(var i=0;i<list.length;i++){var b=list[i],k=b.type+'@'+key(b.position),d=Math.abs(me.position.x-b.position.x)+Math.abs(me.position.y-b.position.y);live[k]=1;if(!social.bonusSeen[k])social.bonusSeen[k]={at:now};if(d<=4&&now-social.bonusSeen[k].at>5000&&d<bestD){best=b;bestD=d}}Object.keys(social.bonusSeen).forEach(function(k){if(!live[k])delete social.bonusSeen[k]});if(!best)return;social.nextBonusHint=now+24000+Math.floor(Math.random()*16000);if(Math.random()>POWER_HINT_CHANCE)return;var line=powerHintLine(best.type);if(line&&say([line],'left-power-'+best.type+'-'+key(best.position),620)){var bk=best.type+'@'+key(best.position);if(social.bonusSeen[bk])social.bonusSeen[bk].at=now+9000}}
function maybeBrag(bot,type,count){if(!bot||!bot.simulatedHuman||S.role!=='simulated'||[5,8,12].indexOf(count)<0)return false;if(Date.now()-social.lastBragAt<18000||Math.random()>BRAG_CHANCE)return false;var line=bragLine(type,count);if(!line)return false;var ok=say([line],'pickup-brag-'+type+'-'+count,650+Math.floor(Math.random()*500));if(ok)social.lastBragAt=Date.now();return ok}
function resetPickupCounters(){var g=G(),bots=g&&g.bots||[];for(var i=0;i<bots.length;i++)if(bots[i])bots[i].__v140PickupCounts={speed:0,bomb:0,fire:0}}
function patchPickupBrag(){if(!window.Bot||Bot.prototype.__v140PickupBrag)return;Bot.prototype.__v140PickupBrag=true;var old=Bot.prototype.applyBonus;Bot.prototype.applyBonus=function(bonus){var type=bonus&&bonus.type,r=old.apply(this,arguments);if(this.simulatedHuman&&(type==='speed'||type==='bomb'||type==='fire')){var c=this.__v140PickupCounts||(this.__v140PickupCounts={speed:0,bomb:0,fire:0});c[type]=(Number(c[type])||0)+1;maybeBrag(this,type,c[type])}return r}}
function patchMatchReset(){if(S.__v140MatchReset)return;S.__v140MatchReset=true;if(typeof S.startSimulated==='function'){var os=S.startSimulated;S.startSimulated=function(){resetMatchSocial('');var r=os.apply(S,arguments);social.name=clean(S.remoteName||'Opponent');setTimeout(resetPickupCounters,0);return r}}if(window.GameEngine&&!GameEngine.prototype.__v140SocialReset){GameEngine.prototype.__v140SocialReset=true;var or=GameEngine.prototype.restart;GameEngine.prototype.restart=function(){if(S.role==='simulated')resetMatchSocial(clean(S.remoteName||'Opponent'));var r=or.apply(this,arguments);setTimeout(resetPickupCounters,0);return r}}}
function tickSocial(){if(S.role!=='simulated')return;if(!social.name)social.name=clean(S.remoteName||'Opponent');var g=G(),me=localPlayer(),sim=simBot();if(!g||!me||!sim||!g.playing||g.menu.visible||g.matchFinished)return;var bots=liveRegularBots(),count=bots.length,pickups=pickupTotal(me),danger=inBombDanger(me),now=Date.now();if(social.lastBotCount===null)social.lastBotCount=count;if(!social.lastPickupTotal)social.lastPickupTotal=pickups;tickPowerHints(now,me);if(sim.alive===false&&me.alive!==false){if(!social.spectating){social.spectating=true;if(Math.random()<.7)say(SPEC_START,'spec-start',650)}if(count<social.lastBotCount){if(Math.random()<.45)say(count===1?SPEC_ONE:SPEC_KILL,'spec-kill-'+count+'-'+social.lastBotCount,700);social.nextSpectator=now+12000}if(pickups>social.lastPickupTotal&&Math.random()<SPECTATOR_PICK_CHANCE)say(SPEC_PICK,'spec-pick-'+pickups,650);if(social.lastDanger&&!danger&&Math.random()<.35)say(SPEC_CLOSE,'spec-close-'+now,600);if(now>=social.nextSpectator&&count>0){if(Math.random()<.5)say(SPEC_AMBIENT,'spec-ambient-'+count+'-'+Math.floor(now/8000),700);social.nextSpectator=now+16000+Math.floor(Math.random()*12000)}}var justTwo=sim.alive!==false&&me.alive!==false&&count===0;if(justTwo&&!social.duel){social.duel=true;if(Math.random()<.6)say(DUEL_LINES,'duel-start',650);social.nextDuel=now+11000+Math.floor(Math.random()*8000)}if(!justTwo)social.duel=false;if(justTwo&&now>=social.nextDuel){var did=false;if(now>=social.nextQuestion&&Math.random()<.16)did=askQuestion();if(!did&&Math.random()<DUEL_CHAT_CHANCE)say(DUEL_RELEVANT,'duel-relevant-'+Math.floor(now/8000),620+Math.floor(Math.random()*550));social.nextDuel=now+12000+Math.floor(Math.random()*10000)}else if(!social.spectating&&now>=social.nextQuestion&&Math.random()<.07)askQuestion();social.lastBotCount=count;social.lastPickupTotal=pickups;social.lastDanger=danger}

function install(){if(installed)return true;if(!window.Bot||!window.BomberAI138||!window.BomberStability137||!S.els)return false;installed=true;style();badge();patchPublic();patchMovement();patchChatDedupe();patchChatAnswers();patchPickupBrag();patchMatchReset();expandLegacyPools();ensurePostOwner();var api={version:VERSION,corridorProblem:corridorProblem,strictItemAmbush:strictItemAmbush,forceNovelRoute:forceNovelRoute,watchdog:watchdog,answerFor:answerFor,syncPostOwner:syncPostOwner};window.BomberStability140=api;window.BomberStability139=api;if(/[?&]netdebug=1(?:&|$)/.test(location.search))api.debug={setTrail:function(bot,a){var m=motion(bot);m.trail=(a||[]).slice();m.samples=m.trail.map(function(k){return{k:k,t:Date.now()}});return m.trail},setStuck:function(bot,ms){var m=motion(bot);m.lastX=bot.bmp.x;m.lastY=bot.bmp.y;m.lastMovedAt=Date.now()-(ms||2500);return m.lastMovedAt},state:function(bot){var m=motion(bot);return{problem:corridorProblem(bot),breaks:m.breaks,hardResets:m.hardResets,recovery:m.route?m.route.slice():[],banAxis:m.banAxis,strictAmbush:strictItemAmbush(bot),escapeMode:!!bot.escapeMode,exitAxis:m.exitAxis,reverseCount:m.reverseCount,loopBlocks:m.loopBlocks}},pruneAmbush:pruneAmbush,latchPublic:function(){latchPublic($('publicMatchBtn'));return publicTxn.active},cancelPublic:clearPublicLatch,publicState:function(){return{active:publicTxn.active,retries:publicTxn.retries,live:publicLive()}},spectatorLine:function(){return pickUnused(SPEC_AMBIENT,'debug-spec')},duelLine:function(){return pickUnused(DUEL_RELEVANT,'debug-duel')},question:function(){var a=QUESTIONS[persona()]||QUESTIONS.chill;for(var i=0;i<a.length;i++)if(!unavailable(a[i][1]))return a[i][1];return''},resetSocial:function(){return resetMatchSocial(clean(S.remoteName||'Opponent')).matchSerial},uniqueLines:function(pool,n){var out=[];for(var i=0;i<n;i++){var x=pickUnused(pool,'debug-unique-'+i);if(!x)break;markUsed(x);out.push(x)}return out},powerHintLine:powerHintLine,bragLine:bragLine,hardRecover:hardRecover,clearStaleIntent:clearStaleIntent,forceEscapeStale:function(bot){if(!bot)return'';bot.escapeMode=true;motion(bot).lastX=bot.bmp.x;motion(bot).lastY=bot.bmp.y;motion(bot).lastMovedAt=Date.now()-3000;var old=bot.trackedBombStillDangerous,oldSafe=bot.isSafe,oldWalk=bot.getWalkableNeighbors;bot.trackedBombStillDangerous=function(){return true};bot.isSafe=function(){return true};bot.getWalkableNeighbors=function(){return[{x:bot.position.x+(bot.position.x+1<G().tilesX-1?1:-1),y:bot.position.y}]};var r=watchdog(bot);bot.trackedBombStillDangerous=old;bot.isSafe=oldSafe;bot.getWalkableNeighbors=oldWalk;return r},postText:function(){return syncPostOwner()},corridorDecision:corridorDecision,chatConfig:function(){return{minGap:CHAT_MIN_GAP,powerHintChance:POWER_HINT_CHANCE,spectatorPickupChance:SPECTATOR_PICK_CHANCE,bragChance:BRAG_CHANCE,duelChatChance:DUEL_CHAT_CHANCE}}};return true}
style();badge();var tries=0,t=setInterval(function(){if(install()||++tries>900)clearInterval(t)},40);setInterval(function(){if(!installed)return;badge();stabilizePublic();patchChatDedupe();expandLegacyPools();syncPostOwner();var g=G(),bots=g&&g.bots||[];for(var i=0;i<bots.length;i++)if(bots[i]&&bots[i].alive!==false)watchdog(bots[i]);tickSocial()},100);
})();

