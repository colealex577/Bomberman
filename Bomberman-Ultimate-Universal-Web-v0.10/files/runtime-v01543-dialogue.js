(function(){
'use strict';
var VERSION='v0.15.4.2-dialogue',installed=false,inDialogue=false,pending=[],conversationSerial=0,lastRosterKey='',recentDeath=null,recentPickup=null,lastUserLine=null,aliveMemory={},pickupMemory={};
function G(){return window.gGameEngine||null}
function S(){return window.B115||null}
function A(){return window.BomberHumanObserver152||null}
function active(){var g=G(),m=g&&g.__v152RosterMode;return m==='observe'||m==='joined'}
function clean(v){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,160)}
function pick(a){return a&&a.length?a[Math.floor(Math.random()*a.length)]:''}
function uniq(a){var out=[],seen={};(a||[]).forEach(function(x){x=clean(x).slice(0,14);if(x&&!seen[x]){seen[x]=1;out.push(x)}});return out}
function shortName(v){var n=clean(v).slice(0,14).replace(/[_-]+/g,' ').trim(),first=n.split(/\s+/)[0]||n,m=first.match(/^[A-Za-z]+/),letters=m?m[0]:first,camel=letters.match(/^[A-Z]?[a-z]+(?=[A-Z]|$)/);if(camel&&camel[0].length>=2)letters=camel[0];return(letters||first||n).slice(0,10)}
function profiles(){var a=A(),st=a&&a.state?a.state():null;return st&&Array.isArray(st.profiles)?st.profiles:[]}
function simNames(){var g=G(),names=[];profiles().forEach(function(p){if(p&&p.name)names.push(p.name)});(g&&g.bots||[]).forEach(function(b){if(b&&b.simulatedHuman&&b.displayName)names.push(b.displayName)});return uniq(names)}
function simEntities(){var g=G();return(g&&g.bots||[]).filter(function(b){return!!(b&&b.simulatedHuman)})}
function livingEntities(){var g=G(),a=[];(g&&g.players||[]).forEach(function(e){if(e&&e.alive!==false)a.push(e)});(g&&g.bots||[]).forEach(function(e){if(e&&e.alive!==false)a.push(e)});return a}
function playerName(){var s=S(),g=G(),p=g&&g.players&&g.players[0];return clean(s&&s.localName||p&&p.displayName||'').slice(0,14)}
function isSimName(name){name=clean(name).slice(0,14);return simNames().some(function(n){return n===name})}
function wood(){var g=G(),n=0;(g&&g.tiles||[]).forEach(function(t){if(t&&t.material==='wood')n++});return n}
function stageInfo(){var audit=null;try{audit=window.BomberObserver153&&BomberObserver153.audit?BomberObserver153.audit():null}catch(e){}var state=audit&&Number(audit.state)||0,w=wood(),alive=livingEntities().length;if(!state){if(w<=8)state=10;else if(w<=18)state=8;else if(w<=30)state=6;else if(w<=45)state=4;else state=2}var key=state<=2?'opening':state<=4?'early':state<=6?'mid':state<=8?'late':'endgame';if(alive<=2)key='duel';return{state:state,key:key,wood:w,alive:alive,audit:audit}}
function counts(e){var c=e&&e.bonusCounts||{};return{speed:Number(c.speed)||0,bomb:Number(c.bomb)||0,fire:Number(c.fire)||0}}
function nameOf(e){return clean(e&&e.displayName||'').slice(0,14)}
function livingSimNames(){return uniq(simEntities().filter(function(e){return e.alive!==false}).map(nameOf))}
function deadSimNames(){var live=livingSimNames(),all=simNames();return all.filter(function(n){return live.indexOf(n)<0})}
function ctx(){var names=simNames(),live=livingSimNames(),dead=deadSimNames(),st=stageInfo(),p=playerName();return{a:names[0]||'Player',b:names[1]||names[0]||'Player',alive:live,dead:dead,stage:st,player:p,pshort:shortName(p),ashort:shortName(names[0]||'Player'),bshort:shortName(names[1]||names[0]||'Player')}}
function fill(t,c){return String(t||'').replace(/\{a\}/g,c.a).replace(/\{b\}/g,c.b).replace(/\{ashort\}/g,c.ashort).replace(/\{bshort\}/g,c.bshort).replace(/\{player\}/g,c.player||'you').replace(/\{pshort\}/g,c.pshort||'you')}
var POOLS={
 opening:[
  'alright lets not die in the first thirty seconds','first pickup is mine just saying','i always forget how boxed in the start feels','watch the first corner bombs lol','im trying not to overplant early','everybody acts peaceful for like ten seconds','the first open lane always turns into chaos','im taking the outside first','middle already looks sketchy','i need one shoe before i start doing anything stupid','im not chasing anybody this early','early bombs are always the ones that get me somehow','lets see who gets greedy first','im staying away from the center until it opens','first round of blocks is always awkward','i swear the bots know exactly when to cross early','im just trying to make some space first','nobody trap themselves immediately please','the opening always feels calm until one chain starts','i need room before i start fighting anybody','im clearing toward the middle','i always want one extra bomb before i pressure','the first few lanes decide a lot actually','im playing boring for a minute lol'
 ],
 early:[
  'okay now there is actually room to move','the board is starting to open up','somebody is gonna get caught reaching for a pickup','i can finally rotate without getting boxed','this is where i start taking dumb risks','i need more speed before the middle gets bad','im watching the intersections now','the bots are already cutting across weird','one more upgrade and im good','this is the part where everyone pretends they have a plan','i keep almost committing to the wrong lane','the side lanes are way safer right now','im not giving up that pickup for free','you can actually pressure people now','the map is opening faster than i expected','im trying to keep two exits every time i plant','i hate when a bot arrives exactly as the fuse ends','there are enough gaps now to start baiting','somebody is definitely getting greedy for shoes','im keeping away from long rows until i have speed','this is getting less random now','i can finally see what everyone is trying to do','one clean trap could change the whole round','im trying not to chase straight behind anybody'
 ],
 mid:[
  'okay this is actually getting tactical now','middle is getting dangerous','everybody has enough upgrades to be annoying now','i dont like how open those rows are getting','one bad chain and half the map lights up','im watching exits more than people now','this is where extra bombs start mattering','the bots get way more annoying around here','i keep seeing traps one second too late','nobody has enough cover anymore','im trying to make people cross first','this board is starting to feel small','im not following anyone into a straight lane','too many bombs can be on screen now','the safe routes keep disappearing','this is usually where i start playing too aggressive','i need to stop taking the same turn every time','every intersection feels like a coin flip now','im trying to hold the center without actually standing in it','one pickup can still be worth a huge detour here','the map looks open but there are still awful dead ends','im watching the perpendicular lanes now','this is the point where range gets scary','im trying to save one bomb instead of dumping all of them','people get predictable when the board reaches this point','i keep wanting to chase and then remembering the bots exist','the next death is probably gonna be from somebody getting greedy'
 ],
 late:[
  'this board is basically all sightlines now','there is nowhere good to hide anymore','one bomb can control an entire row now','this is where speed saves you','im not touching a corner unless i have to','the whole map feels exposed','every plant needs an exit now','late game is just trying not to overcommit','one chain could end two people at once','the bots get so much more aggressive when it opens up','im watching every cross lane now','there are barely any safe pockets left','this is the scary part of having too much range','one wrong turn and thats it','im not chasing through the middle anymore','everyone can reach everyone now','the outside edge is starting to feel like a trap','i keep checking behind me even when nobody is there lol','the board got open really fast','this is where patience actually wins rounds','i dont trust any lane with two bombs in it','one fake retreat can set up a whole trap here','nobody gets a free pickup this late','im trying to make somebody else commit first','the map is officially too open for comfort','this is about to get really fast','every bomb feels louder late game lol'
 ],
 endgame:[
  'there is literally nowhere left to hide','every bomb is a real threat now','one mistake ends the round from here','okay im actually locked in now','the board is completely open','this is pure lane control now','i hate how far every blast reaches','nobody can relax anymore','im saving an exit before every single bomb','this is the part where one tiny mistake looks huge','everyone is moving like the floor is lava now','the whole map is basically one giant crossfire','im not picking anything up unless its completely free','one bad read and you are gone','this is the most stressful part of the round','somebody needs to make the first mistake','im trying not to blink at the wrong time lol','every route is visible now','there is no sneaking around anybody anymore','the next chain could just end it','i dont trust myself with this much speed','the last few blocks disappearing changes everything','this is basically a reaction test now','whoever gets impatient probably loses','every intersection is dangerous now','im not planting unless i know exactly where im going after','this round got serious fast'
 ],
 duel:[
  'okay just two left now','finally a clean 1v1','no more crowd to hide behind','one bomb could end this now','alright this is actually close','now every route matters','the board is way too open for two people','okay no excuses now','this is just lane reads now','somebody is gonna get baited into a turn','im not giving up the middle for free','one bad chase and its over','this is where people start faking retreats','i know somebody is waiting for the other person to plant first','final two always makes the map feel smaller','every pickup is basically bait now','this is getting sweaty lol','no bots left to blame if this goes bad','this is the real match now','im watching the exits more than the bombs','one clean cut off ends it','nobody wants to be the first one to commit','this could end in like two seconds','the whole round comes down to one lane now','someone is absolutely about to choke a corner','this is a patience contest now','im not chasing that bait','okay this is actually fun to watch','one crossfire and thats it','both sides know exactly what the other is trying to do now'
 ],
 spectator:[
  'im just watching the chaos now','okay commentator mode','that looked way closer from the outside lol','you see way more traps once youre dead','i can tell exactly where this is going and i hate it','im watching every bad decision now','this is easier when i dont have to dodge anything','somebody is about to get greedy','im calling it now that middle lane causes the next death','watch the long row','the outside looks safe but it really isnt','i would not take that corner right now','that setup is either genius or terrible','somebody needs to stop repeating that route','the map looks even more open as a spectator','i can see like three ways that goes wrong','dont chase that too far','that pickup is bait at this point','the next bomb placement matters a lot','one of you is getting impatient','i would rotate out of there','that was almost really bad','okay that escape was clean','that lane is getting way too predictable','somebody check the other side of the map lol','im rooting for whoever makes this end first','this round is way easier to understand from here','i can see the trap forming already','the bots look extra weird from spectator mode','im not saying i would do better but i definitely see the mistake now'
 ],
 long:[
  'this round has been going forever lol','how are we still in the same round','everybody is refusing to die','okay somebody has to end this eventually','this might actually be the longest round today','we have been doing this for ages','i forgot what the map looked like at the start','this round has had like three different eras','we are all way too stubborn','this has turned into an endurance event','nobody wants to be the person who finally sells','i cannot believe this is still going','this round needs a closing argument','we have been circling these lanes forever','at this point the map knows us personally','somebody please commit to something','this round has survived way too many close calls','i feel like we started this yesterday','everybody is playing like they have one life left irl lol','okay the next clean trap needs to count'
 ],
 praise:[
  'that was actually clean','nice escape','good pressure there','that was a really good read','okay that dodge was nice','you timed that perfectly','that lane cut was smart','that was way cleaner than it looked','good patience there','you waited for exactly the right moment','that was a nasty angle','okay that bait worked','you made that look easy','good recovery','that turn saved you','that was a perfect little trap','nice job keeping an exit','that chain was actually well set up','you read the cross lane perfectly','that was a good fake','you got out by like one tile','that was smart not greedy','good restraint there','that was a really good rotate','you almost made that look planned lol'
 ],
 roast:[
  'you almost sold that so hard','same lane again 😭','that was way greedier than it needed to be','you really trusted that corner huh','that almost became a self elimination','you are making this harder than it needs to be','why did you go back into that lane lol','that pickup was not worth all that','you nearly walked into your own setup','you keep giving the same route away','that was a brave amount of bad judgment','you had like three exits and chose the worst one','you are flirting with disaster now','that was almost a spectacular mistake','stop trying to squeeze through there lol','you got away with that one','that route is getting painfully predictable','you are one greedy bomb away from being done','that was not the lane i would have picked','you almost boxed yourself for no reason','that looked intentional until the last second','you keep testing the same bad idea','somehow that worked and im annoyed about it','that was chaos not strategy lol','you are playing with the fuse timer way too much'
 ],
 user:[
  '{pshort} that was close','nice dodge {pshort}','{pshort} watch that long lane','good pressure {pshort}','{pshort} you keep taking the middle lol','you almost had me there {pshort}','{pshort} that pickup was worth it','okay {pshort} that was actually clean','{pshort} stop making me chase you lol','i see what youre trying to do {pshort}','{pshort} youre getting way too comfortable over there','nice escape {pshort}','{pshort} that route is getting predictable','you keep baiting the same turn {pshort}','{pshort} one of these greedy bombs is gonna get you','okay {pshort} i did not expect that angle','{pshort} you almost trapped yourself there','youre making the middle annoying {pshort}','{pshort} i know youre waiting for me to cross','good patience {pshort}'
 ]
};
var PICKUP={
 speed:['okay the speed is noticeable now','those shoes are gonna matter late game','you are getting way too fast lol','another shoe??','speed is carrying that escape route','that pickup just changed the whole movement pace','you can cross lanes way faster now','okay maybe stop taking every shoe','that speed makes the middle way safer','you are gonna overshoot a corner with all that speed eventually','shoes are honestly the best pickup here','that extra speed was absolutely worth it'],
 bomb:['more bombs means this is about to get messy','okay thats a lot of bomb pressure now','extra bomb is huge on this open board','you can cover two exits way easier now','another bomb pickup is dangerous for everybody','that changes how many lanes you can threaten','you really did not need more bombs lol','okay now the chains are gonna get ridiculous','that extra bomb was worth the detour','you can actually force movement with that now','bomb capacity is getting scary','one more bomb and the whole row is yours'],
 fire:['that range is getting kind of stupid now','okay the blast reaches forever','more fire range this late is scary','that pickup just made every long lane worse','you can hit across half the map now','range is great until it catches you too lol','that fire upgrade changes the safe distance a lot','okay nobody stand in a straight line anymore','that blast range is gonna punish somebody','you can control intersections from way farther now','the map just got smaller with that range','too much fire is its own problem honestly']
};
var DEATH_SELF=[
 'yeah that one was completely on me','i knew that lane was bad and went anyway','i got way too greedy there','i thought i had one more tile','that exit disappeared so fast','i saw the bomb and still committed lol','okay i deserved that','that crossfire was brutal','i should have rotated earlier','i got boxed in so clean','i was watching the wrong fuse','that chain caught me perfectly','i chased way too hard','i picked the worst possible exit','i thought i could squeeze through','that was a rough way to go out','i absolutely misread that corner','i had no business going back there','welp spectator duty now','i donated that one 😭'
];
var DEATH_OTHER=[
 'rip {target}','{target} got caught hard there','that lane finally got {target}','okay {target} had nowhere to go','that was a brutal exit for {target}','{target} almost slipped out','that chain deleted {target}','i knew that corner was gonna get somebody','{target} got greedy for one second','that trap closed so fast on {target}','rough one {target}','{target} got boxed in from both sides','that timing was nasty on {target}','i thought {target} was getting out of that','one bad turn and {target} was done','that was way closer than it looked for {target}','{target} had like half a tile of hope there','that cross lane completely ruined {target}','okay that was a clean catch on {target}','{target} is definitely mad about that one'
];
var RESPONSE={
 question:['lol honestly depends on the round','probably yeah','maybe, ask me again after this round 😭','i think so','depends how open the map is','honestly i change my mind every game','yeah usually','not always but pretty often','i was literally thinking the same thing','probably but im not committing to that answer lol'],
 gg:['gg','yeah gg','good round','that was actually a fun one','gg that got way closer than i expected','good game lol','yeah that was solid','gg, the end got sweaty','that was a good round','gg 😭'],
 compliment:['lol ty','appreciate it','that was mostly luck but ill take it','thanks lol','i thought i was dead there honestly','ty, that angle worked way better than expected','haha thanks','i got lucky with the timing','i will absolutely pretend that was planned','thanks, barely pulled that off'],
 laugh:['😭','lol','lmao yeah','fr lol','okay fair','😂','yeah that was ridiculous','i knowww','that was so dumb lol','im glad somebody else saw that'],
 generic:['yeah','fair','true lol','i can see that','same honestly','maybe','thats fair','yeah i get what you mean','lol probably','i was thinking that too','depends how this round goes','okay fair point']
};
var CONVOS={
 general:[
  [['a','{bshort} you always take middle first?'],['b','only when you leave it open'],['a','fair lol']],
  [['a','you going for every shoe again {bshort}?'],['b','if you keep leaving them for me yeah'],['a','thats a yes then 😭']],
  [['a','i swear the bots wait until im trapped'],['b','they probably say the same thing about you'],['a','rude but fair']],
  [['a','you actually plan your bombs or just send it'],['b','little bit of both lol'],['a','that explains a lot']],
  [['a','{bshort} stop stealing every pickup'],['b','get there first'],['a','im trying 😭']],
  [['a','this round already feels weird'],['b','you say that every round'],['a','because every round is weird']],
  [['a','how many bombs is too many bombs'],['b','one more than whatever i have'],['a','terrible answer lol']],
  [['a','you ever trust the bots for even one second'],['b','absolutely not'],['a','correct answer']],
  [['a','i keep forgetting how fast you are'],['b','sounds like a you problem'],['a','it keeps becoming one']],
  [['a','{bshort} why do you always rotate that way'],['b','because you keep expecting the other way'],['a','okay dont expose me like that']]
 ],
 opening:[
  [['a','first shoe is mine'],['b','you say that every round'],['a','because it keeps being true']],
  [['a','no early self traps this time'],['b','thats a low bar'],['a','let me have goals']],
  [['a','im clearing toward middle'],['b','cool im avoiding you then'],['a','probably smart']],
  [['a','you planting immediately?'],['b','obviously'],['a','chaos from second one nice']],
  [['a','{bshort} dont box me in at spawn'],['b','no promises'],['a','great 😭']]
 ],
 early:[
  [['a','map is opening pretty fast'],['b','yeah somebody is gonna get greedy soon'],['a','probably me']],
  [['a','you have enough room now {bshort}'],['b','yeah now i can actually be annoying'],['a','you were managing before']],
  [['a','i want that pickup'],['b','then go get it'],['a','you say that like youre not camping it']],
  [['a','these intersections are getting bad'],['b','thats where the fun starts'],['a','your definition of fun is concerning']],
  [['a','im keeping two exits now'],['b','look at you learning'],['a','dont ruin this for me']]
 ],
 mid:[
  [['a','okay this got tactical fast'],['b','you mean you stopped sprinting at people'],['a','temporary adjustment']],
  [['a','{bshort} you keep taking the same lane'],['b','and you keep letting me'],['a','noted']],
  [['a','too many bombs on screen now'],['b','not enough'],['a','you are the problem']],
  [['a','i almost chased you into that'],['b','thats why i went there'],['a','yeah i figured that out late']],
  [['a','middle is cursed now'],['b','middle is always cursed'],['a','fair']]
 ],
 late:[
  [['a','this board has zero cover'],['b','good, no hiding'],['a','i preferred hiding a little']],
  [['a','one bad turn ends this'],['b','then dont turn bad'],['a','incredible advice thanks']],
  [['a','{bshort} stop baiting that row'],['b','stop following me into it'],['a','also fair']],
  [['a','i hate how open this is'],['b','i love it'],['a','of course you do']],
  [['a','every bomb reaches forever now'],['b','makes it interesting'],['a','makes it terrifying']]
 ],
 endgame:[
  [['a','nobody has anywhere to hide now'],['b','exactly'],['a','you sound way too happy about that']],
  [['a','im waiting for somebody else to mess up'],['b','same'],['a','great so we live here now']],
  [['a','one crossfire and this is done'],['b','then make one'],['a','working on it']],
  [['a','{bshort} you commit first'],['b','no you'],['a','very productive']],
  [['a','this is basically a reaction test'],['b','you nervous?'],['a','extremely lol']]
 ],
 duel:[
  [['a','just us now {bshort}'],['b','finally'],['a','dont choke then']],
  [['a','no bots left to blame'],['b','i wasnt planning to blame them'],['a','saving this message']],
  [['a','you gonna chase or wait'],['b','yes'],['a','helpful 😭']],
  [['a','{bshort} one bomb could end this'],['b','then place a good one'],['a','im trying']],
  [['a','this got quiet fast'],['b','im concentrating'],['a','same actually']],
  [['a','you keep watching that lane'],['b','because you keep looking at it'],['a','okay mind your business']],
  [['a','whoever gets impatient loses'],['b','so youre doomed'],['a','wow']],
  [['a','i know youre baiting the corner'],['b','do you though'],['a','now im less sure']]
 ],
 spectator:[
  [['a','welp im on commentary now'],['b','please dont backseat drive'],['a','absolutely backseat driving']],
  [['a','i can see every trap from here'],['b','very useful now that youre dead'],['a','let me contribute 😭']],
  [['a','{bshort} that lane is bad'],['b','youre literally dead'],['a','and therefore unbiased']],
  [['a','i would not go that way'],['b','good thing youre not playing'],['a','wow okay']],
  [['a','spectating is way less stressful'],['b','must be nice'],['a','it really is']]
 ]
};
function replaceTarget(t,name){return String(t||'').replace(/\{target\}/g,shortName(name)||name||'them')}
function chooseSpeaker(preferred,c){var live=c.alive||[],all=simNames();if(preferred&&isSimName(preferred))return preferred;if(live.length)return pick(live);return pick(all)||preferred||'Player'}
function replyToUser(c){if(!lastUserLine||Date.now()-lastUserLine.at>26000||lastUserLine.used)return null;var t=lastUserLine.text.toLowerCase(),pool=RESPONSE.generic;if(t.indexOf('?')>=0)pool=RESPONSE.question;else if(/\bgg\b|good game/.test(t))pool=RESPONSE.gg;else if(/nice|good job|clean|great|well played|wp/.test(t))pool=RESPONSE.compliment;else if(/lol|lmao|haha|😂|😭/.test(t))pool=RESPONSE.laugh;if(Math.random()<.44){lastUserLine.used=true;return pick(pool)}return null}
function contextualLine(speaker,c){var now=Date.now(),st=c.stage;if(recentDeath&&now-recentDeath.at<22000&&Math.random()<.64){if(speaker===recentDeath.name)return pick(DEATH_SELF);return replaceTarget(pick(DEATH_OTHER),recentDeath.name)}if(recentPickup&&now-recentPickup.at<16000&&Math.random()<.46){var pp=PICKUP[recentPickup.type]||[];if(pp.length)return pick(pp)}var user=replyToUser(c);if(user)return user;if(st.alive<=2)return pick(POOLS.duel);if(c.dead.length&&Math.random()<.48)return pick(POOLS.spectator);if(now-(window.BomberDialogue1543&&BomberDialogue1543.roundStartedAt||now)>75000&&Math.random()<.34)return pick(POOLS.long);if(c.player&&Math.random()<.27)return fill(pick(POOLS.user),c);var roll=Math.random();if(roll<.13)return pick(POOLS.praise);if(roll<.24)return pick(POOLS.roast);return pick(POOLS[st.key]||POOLS.mid)}
function convoPool(c){var key=c.dead.length?'spectator':c.stage.key,base=(CONVOS[key]||[]).concat(CONVOS.general||[]);return base}
function startConversation(c){var names=simNames();if(names.length<2)return null;var script=pick(convoPool(c));if(!script||!script.length)return null;var a=names[0],b=names[1];if(Math.random()<.5){var z=a;a=b;b=z}var cc={a:a,b:b,ashort:shortName(a),bshort:shortName(b),player:c.player,pshort:c.pshort},turns=script.map(function(x){return{name:x[0]==='b'?b:a,text:fill(x[1],cc)}});conversationSerial++;pending=turns.slice(1);return turns[0]}
function nextTurn(c,preferred){if(pending.length){var turn=pending.shift();return{name:turn.name,text:turn.text,scripted:true}}if(Math.random()<.22){var start=startConversation(c);if(start)return{name:start.name,text:start.text,scripted:true}}return{name:chooseSpeaker(preferred,c),text:contextualLine(preferred,c),scripted:false}}
function monitor(){if(!active()){aliveMemory={};pickupMemory={};recentDeath=null;recentPickup=null;pending=[];return}var c=ctx(),key=c.a+'|'+c.b;if(key!==lastRosterKey){lastRosterKey=key;aliveMemory={};pickupMemory={};recentDeath=null;recentPickup=null;pending=[]}simNames().forEach(function(n){if(aliveMemory[n]===undefined)aliveMemory[n]=true});simEntities().forEach(function(e){var n=nameOf(e);if(!n)return;var alive=e.alive!==false;if(aliveMemory[n]===true&&!alive)recentDeath={name:n,at:Date.now()};aliveMemory[n]=alive;var cc=counts(e),prev=pickupMemory[n]||{speed:cc.speed,bomb:cc.bomb,fire:cc.fire};['speed','bomb','fire'].forEach(function(k){if(cc[k]>prev[k])recentPickup={name:n,type:k,count:cc[k],at:Date.now()}});pickupMemory[n]=cc})}
function carry(target,source,key){try{if(source&&source[key]!==undefined)target[key]=source[key]}catch(e){}}
function installAppend(){var s=S();if(!s||!s.appendChat)return false;if(s.appendChat.__v01543Dialogue)return true;var old=s.appendChat;function wrapped(name,text,self){if(inDialogue)return old.apply(this,arguments);if(!active()){if(self)lastUserLine=null;return old.apply(this,arguments)}if(self){lastUserLine={text:clean(text),at:Date.now(),used:false};return old.apply(this,arguments)}if(!isSimName(name))return old.apply(this,arguments);monitor();var c=ctx(),turn=nextTurn(c,clean(name).slice(0,14));inDialogue=true;try{return old.call(this,turn.name||name,turn.text||text,false)}finally{inDialogue=false}}wrapped.__v01543Dialogue=true;wrapped.__v01543Old=old;['__v140Dedupe','__v140Old','__v01532NoRosterToast','__v01532Public'].forEach(function(k){carry(wrapped,old,k)});s.appendChat=wrapped;if(window.BomberOnline&&BomberOnline.appendChat===old)BomberOnline.appendChat=wrapped;return true}
function poolCount(o){var n=0;Object.keys(o).forEach(function(k){if(Array.isArray(o[k]))n+=o[k].length});return n}
function install(){if(installed)return true;if(!S()||!A()||!G())return false;installed=true;installAppend();window.BomberDialogue1543={version:VERSION,roundStartedAt:Date.now(),state:function(){return{pending:pending.length,conversationSerial:conversationSerial,stage:stageInfo(),recentDeath:recentDeath,recentPickup:recentPickup,lastUserLine:lastUserLine,simNames:simNames()}},poolCounts:{context:poolCount(POOLS),pickup:poolCount(PICKUP),death:DEATH_SELF.length+DEATH_OTHER.length,response:poolCount(RESPONSE),conversations:Object.keys(CONVOS).reduce(function(n,k){return n+CONVOS[k].length},0)},debug:{forceConversation:function(key){var c=ctx(),save=c.stage.key;if(key)c.stage.key=key;pending=[];var t=startConversation(c);if(t)pending.unshift(t);return pending.length},next:function(name){monitor();return nextTurn(ctx(),name||simNames()[0])},monitor:monitor,stage:stageInfo,clearConversation:function(){pending=[]}}};return true}
var tries=0,t=setInterval(function(){if(install()||++tries>1200)clearInterval(t)},25);setInterval(function(){if(!installed)return;monitor();installAppend()},250);
})();
