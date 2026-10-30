(function(){
'use strict';
var VERSION='v0.13.7',S=window.B115,installed=false;
if(!S)return;
var challengeRequest=null,legacyChallenge=null,lastPublicClick=0,publicRetryUsed=false;
var simChat={name:'',botTalker:false,botLines:0,nextBotAt:0,replyTimer:null,lastReplyAt:0};
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function clean(v){return String(v||'Player').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Player'}
function hash(s){s=String(s||'');var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function same(a,b){return!!(a&&b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y))}
function score(){try{return Math.max(0,Math.min(1000,Math.round(Number(localStorage.getItem('BombermanRatingV1'))||0)))}catch(e){return 0}}
function rank(sc,name){try{return window.BomberLeaderboard127?BomberLeaderboard127.rank(sc,name):null}catch(e){return null}}
function savedName(){try{return clean(localStorage.getItem('BombermanPlayerName')||S.localName||'Player')}catch(e){return clean(S.localName||'Player')}}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function setHidden(el,v){if(el&&el.hidden!==!!v)el.hidden=!!v}

/* One final visible owner for text that old compatibility loops keep rewriting. */
function ensureStyle(){
 if($('v137-style'))return;var st=document.createElement('style');st.id='v137-style';st.textContent=`
#buildVersion136{display:none!important}#buildVersion137{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
.v137_legacy_hidden{display:none!important}.v137_lb_desc{margin:4px 0 0;color:#aaa;font-size:10px}.v137_set_post{margin:0 0 8px;padding:7px 8px;border-radius:7px;background:rgba(153,204,0,.09);border:1px solid rgba(153,204,0,.22);font:800 11px/1.25 Arial,sans-serif;color:#d9ff9d}.v137_set_post[hidden]{display:none!important}
#v130PostStats>.v132_set_post,#v130ElimStats>.v132_set_post{display:none!important}
body:not(.v137_chat_active) #chatPanel,body:not(.v137_chat_active) #chatToggleBtn,body:not(.v137_chat_active) #chatToast{display:none!important}body.v137_chat_panel_open #chatToggleBtn,body.desktop-ui.v137_chat_active #chatToggleBtn{display:none!important}
#qolPostMatch .qol_status,#qolEliminated .qol_status,#qolRematchPrompt .qol_status{min-height:17px}.v137_challenge_waiting{opacity:.72;cursor:wait!important}
`;document.head.appendChild(st)
}
function badge(){var b=$('buildVersion137');if(!b){b=document.createElement('div');b.id='buildVersion137';document.body.appendChild(b)}setText(b,VERSION)}
function leaderboardText(){
 var panel=$('v127LeaderboardPanel');if(!panel)return;var head=panel.querySelector('.v127_lb_head'),legacy=head&&head.querySelector('p');if(legacy)legacy.classList.add('v137_legacy_hidden');
 if(head&&!$('v137LeaderboardDesc')){var d=document.createElement('div');d.id='v137LeaderboardDesc';d.className='v137_lb_desc';d.textContent='Top 50 of a roughly 600-player population. Scores and records move gradually as players gain and lose points.';var box=head.querySelector('div');if(box)box.appendChild(d)}
 var oldNote=panel.querySelector('.v127_lb_note:not(#v137LeaderboardNote)');if(oldNote)oldNote.classList.add('v137_legacy_hidden');
 if(!$('v137LeaderboardNote')){var n=document.createElement('div');n.id='v137LeaderboardNote';n.className='v127_lb_note';n.textContent='Challenge any listed player. Availability changes over time, and accepted challenges use that player’s rating and difficulty.';var card=panel.querySelector('.v127_lb_card');if(card)card.appendChild(n)}
}
function stableMatchText(){
 var local=clean(S.localName||savedName()),remote=clean(S.remoteName||'Opponent'),ls=score(),lr=rank(ls,local),rs=null,rr=null;
 try{var p=window.BomberLeaderboard127&&BomberLeaderboard127.profile(remote);if(p){rs=Number(p.score)||0;rr=p.displayRank||p.rank}}catch(e){}
 if(S.role==='host'||S.role==='guest'){var g=G(),rp=g&&g.players&&g.players[S.role==='guest'?0:1];if(rp&&Number.isFinite(Number(rp.rating))){rs=Math.max(0,Math.min(1000,Math.round(Number(rp.rating))));rr=rank(rs,remote)}}
 return'ONLINE • '+local+' '+ls+(lr?' (#'+lr+')':'')+' vs '+remote+(rs!==null?' '+rs:'')+(rr?' (#'+rr+')':'')
}
function ensureStableMatchStatus(){
 var bar=S.els&&S.els.matchBar||$('onlineMatchBar'),legacy=S.els&&S.els.matchStatus||$('onlineMatchStatus');if(!bar||!legacy)return;legacy.classList.add('v137_legacy_hidden');var stable=$('v137MatchStatus');if(!stable){stable=document.createElement('span');stable.id='v137MatchStatus';legacy.insertAdjacentElement('afterend',stable)}
 if((S.role==='simulated'||((S.role==='host'||S.role==='guest')&&S.started))&&!bar.hidden)setText(stable,stableMatchText());else setText(stable,'ONLINE')
}
function phaseFor(s){try{return window.BomberWhole132&&BomberWhole132.phaseFor?BomberWhole132.phaseFor(s):''}catch(e){return''}}
function setSummaryText(s){if(!s||Number(s.bestOf)<=1)return'';var local=clean(S.localName||savedName()),opp=clean(S.remoteName||s.opponent||'Opponent'),ph=phaseFor(s);if(s.complete){var winner=Number(s.localWins)>Number(s.opponentWins)?local:opp;return'set winner · '+winner+' · '+s.localWins+'–'+s.opponentWins}return'set · '+local+' '+s.localWins+'–'+s.opponentWins+' '+opp+(ph?' · '+ph:'')}
function ensureSetSummaryFor(overlay,id,statsId){var root=$(overlay),stats=$(statsId);if(!root||!stats)return;var card=root.querySelector('.qol_card'),el=$(id);if(!el&&card){el=document.createElement('div');el.id=id;el.className='v137_set_post';el.hidden=true;stats.insertAdjacentElement('beforebegin',el)}var s=null;try{s=BomberSocial130.set()}catch(e){}var text=setSummaryText(s);if(el){setHidden(el,!text);if(text)setText(el,text)}}
function ensureStableRoundSummary(){ensureSetSummaryFor('qolPostMatch','v137PostSetSummary','v130PostStats');ensureSetSummaryFor('qolEliminated','v137ElimSetSummary','v130ElimStats')}

/* Self-heal the modal if the old choice panel gets stranded hidden behind Map/Rounds. */
function corePanels(){return{name:$('nameSetupPanel'),choice:$('lobbyChoice'),private:$('privateMatchPanel'),waiting:$('onlineWaitingPanel')}}
function showCore(name){var p=corePanels();Object.keys(p).forEach(function(k){if(p[k])p[k].hidden=k!==name})}
function anyCoreVisible(){var p=corePanels();return Object.keys(p).some(function(k){return p[k]&&!p[k].hidden})}
function repairLobby(){
 var lobby=S.els&&S.els.lobby||$('multiplayerLobby'),g=G();if(!lobby||lobby.hidden)return false;if(S.started){lobby.hidden=true;return true}var searching=(S.kind==='public'||S.kind==='private')&&(S.role==='host'||S.role==='guest');if(searching){showCore('waiting');return true}
 if(!anyCoreVisible()){showCore(savedName()?'choice':'name');return true}var p=corePanels();if(p.waiting&&!p.waiting.hidden&&!searching){showCore(savedName()?'choice':'name');return true}if(g&&!g.lobbyOpen)g.lobbyOpen=true;return true
}
function patchLobby(){
 if(window.BomberOnline&&BomberOnline.openLobby&&!BomberOnline.__v137OpenLobby){BomberOnline.__v137OpenLobby=true;var old=BomberOnline.openLobby;BomberOnline.openLobby=function(){var r=old.apply(this,arguments);[0,60,220,650].forEach(function(ms){setTimeout(repairLobby,ms)});return r}}
 document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#publicMatchBtn');if(!b)return;lastPublicClick=Date.now();publicRetryUsed=false;setTimeout(repairLobby,80);setTimeout(function(){var lobby=$('multiplayerLobby');if(!lobby||lobby.hidden||S.started)return;if((S.kind!=='public'||(S.role!=='host'&&S.role!=='guest'))&&!publicRetryUsed&&Date.now()-lastPublicClick>=1200){publicRetryUsed=true;try{if(typeof b.onclick==='function')b.onclick()}catch(x){}setTimeout(repairLobby,120)}},1400)},true)
}

/* Challenge result is decided immediately but deliberately revealed 3–5 s later. */
function challengeToast(msg){var t=$('v136ChallengeToast');if(!t){t=document.createElement('div');t.id='v136ChallengeToast';t.style.cssText='position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:12000;padding:10px 14px;border-radius:10px;background:rgba(18,14,18,.94);border:1px solid rgba(255,255,255,.2);color:#fff;font:700 12px/1.3 Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45);pointer-events:none';document.body.appendChild(t)}setText(t,msg);t.hidden=false;clearTimeout(t.__v137Timer);t.__v137Timer=setTimeout(function(){t.hidden=true},2600)}
function challengeButtons(waiting){document.querySelectorAll('.v136_challenge_btn').forEach(function(b){b.disabled=!!waiting;b.classList.toggle('v137_challenge_waiting',!!waiting);b.textContent=waiting&&challengeRequest&&b.dataset.player===challengeRequest.name?'Waiting…':'Challenge'})}
function decisionDelay(){return 3000+Math.floor(Math.random()*2001)}
function cancelChallengeRequest(){if(challengeRequest&&challengeRequest.timer)clearTimeout(challengeRequest.timer);challengeRequest=null;challengeButtons(false)}
function requestChallenge(name,opts){
 name=clean(name);if(!name||challengeRequest)return false;opts=opts||{};var delay=opts.immediate?0:decisionDelay(),accepted=opts.accept===true||(opts.accept!==false&&window.BomberChallenge136&&BomberChallenge136.availability&&BomberChallenge136.availability(name)),offline=opts.offline===true||(opts.offline!==false&&(hash('v137|decline|'+name+'|'+Math.floor(Date.now()/300000))%100)<68);
 challengeRequest={name:name,started:Date.now(),delay:delay,accepted:accepted,offline:offline,timer:null};challengeButtons(true);challengeToast('Challenging '+name+'…');challengeRequest.timer=setTimeout(function(){var req=challengeRequest;if(!req||req.name!==name)return;challengeRequest=null;challengeButtons(false);if(req.accepted){challengeToast(name+' accepted your challenge.');var panel=$('v127LeaderboardPanel');if(panel)panel.hidden=true;setTimeout(function(){try{if(legacyChallenge)legacyChallenge(name)}catch(e){}},180)}else challengeToast(req.offline?name+' is offline.':name+' declined your challenge.')},delay);return true
}
function patchChallenges(){if(!window.BomberChallenge136||BomberChallenge136.__v137Delayed)return false;BomberChallenge136.__v137Delayed=true;legacyChallenge=BomberChallenge136.challenge;BomberChallenge136.challenge=function(name){return requestChallenge(name)};document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.v136_challenge_btn');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();requestChallenge(b.getAttribute('data-player')||b.dataset.player)},true);return true}

/* Leaving a round must clear every spectator/game-over surface. */
function clearGameOver(){['spectatorBanner','remoteSpectatorBanner'].forEach(function(id){var e=$(id);if(e)e.hidden=true});try{if(window.BomberQOL){BomberQOL.eliminatedOpen=false;if(G()&&G().menu&&G().menu.visible){['qolEliminated','qolPostMatch','qolRematchPrompt'].forEach(function(id){var e=$(id);if(e)e.hidden=true})}}}catch(e){}}
function patchMenuCleanup(){if(window.Menu&&!Menu.prototype.__v137CleanShow){Menu.prototype.__v137CleanShow=true;var old=Menu.prototype.show;Menu.prototype.show=function(){var r=old.apply(this,arguments);clearGameOver();cancelChallengeRequest();return r}}document.addEventListener('click',function(e){var id=e.target&&e.target.id;if(id==='qolMenuBtn'||id==='qolElimMenuBtn'||id==='onlineDisconnectBtn'||id==='lobbyCloseBtn')clearGameOver()},true)}

/* Limited simulated-player conversation. Direct replies bypass older random chat suppression. */
var BOT_CHAT=['i hate bots lol','these bots are so annoying','bots always get in the way','ngl i hate playing with bots','the bots in this game are wild','bro these bots are griefing me','i swear the bots target me every game'];
var BOT_ACCUSATIONS=['bro are you a bot lol','wait are u a bot','you move like a bot 😭','ngl thought you were a bot for a sec','are you actually a bot lol','that movement is kinda bot-like'];
var HELLO=['yo','hey lol','sup','hey','yoo'],GG=['gg','ggs','gg man','good game','yea gg'],AGAIN=['yeah im down','sure run it back','yeah again','one more lol','bet'],BOT_REPLY=['nah lol','bro im not a bot 😭','thats what a bot would say','i was literally gonna ask you that','no lol are you?'],GENERIC=['lol','yeah','fair','true','fr','same','lmao','nahh','maybe','idk lol'];
function pick(a,salt){if(!a||!a.length)return'';return a[(hash((S.remoteName||'player')+'|'+salt+'|'+Date.now())+Math.floor(Math.random()*a.length))%a.length]}
function typing(on){var old=$('v137Typing');if(old)old.remove();if(!on||!S.els||!S.els.chatMessages)return;var row=document.createElement('div');row.id='v137Typing';row.className='chat_line v132_typing';var who=document.createElement('strong');who.textContent=clean(S.remoteName);var body=document.createElement('span');body.textContent='is typing...';row.appendChild(who);row.appendChild(body);S.els.chatMessages.appendChild(row);S.els.chatMessages.scrollTop=S.els.chatMessages.scrollHeight}
function rawRemoteChat(name,text){var fn=window.BomberOnline&&BomberOnline.appendChat;if(typeof fn==='function')return fn(name,text,false);return S.appendChat(name,text,false)}
function simulatedMessage(text,delay){if(S.role!=='simulated'||!text)return false;var name=clean(S.remoteName),wait=Math.max(500,Number(delay)||1000);setTimeout(function(){if(S.role==='simulated'&&clean(S.remoteName)===name)typing(true)},Math.max(0,wait-450));setTimeout(function(){if(S.role!=='simulated'||clean(S.remoteName)!==name)return;typing(false);rawRemoteChat(name,text)},wait);return true}
function replyFor(text){var t=String(text||'').toLowerCase();if(/\bbot\b|computer|npc/.test(t))return pick(BOT_REPLY,'botreply');if(/\b(hi|hey|hello|yo|sup)\b/.test(t))return pick(HELLO,'hello');if(/\bgg\b|good game/.test(t))return pick(GG,'gg');if(/rematch|again|one more|run it back/.test(t))return pick(AGAIN,'again');if(/\?/.test(t))return pick(['idk lol','maybe','yeah i think so','probably','nah','i guess'],'question');return pick(GENERIC,'generic')}
function scheduleReply(text){if(S.role!=='simulated')return;var now=Date.now();if(now-simChat.lastReplyAt<2300||simChat.replyTimer)return;var important=/\?|\bbot\b|\b(hi|hey|hello|yo|sup|gg)\b|rematch|again/i.test(text);if(!important&&Math.random()>.72)return;var reply=replyFor(text);if(!reply)return;var delay=850+Math.floor(Math.random()*1700);simChat.replyTimer=setTimeout(function(){simChat.replyTimer=null;if(S.role!=='simulated')return;simChat.lastReplyAt=Date.now();simulatedMessage(reply,550+Math.floor(Math.random()*650))},delay)}
function botTalker(name){return(hash('v137|bot-talk|'+clean(name))%100)<34}
function resetSimChat(){var name=clean(S.remoteName||'Opponent');if(simChat.name===name)return;clearTimeout(simChat.replyTimer);simChat={name:name,botTalker:botTalker(name),botLines:0,nextBotAt:Date.now()+12000+(hash('v137|bot-time|'+name)%17000),replyTimer:null,lastReplyAt:0}}
function ambientBotChat(){if(S.role!=='simulated')return;resetSimChat();var g=G();if(!simChat.botTalker||simChat.botLines>=2||Date.now()<simChat.nextBotAt||!g||!g.playing||g.menu.visible||g.matchFinished)return;var pool=(hash('v137|bot-kind|'+simChat.name+'|'+simChat.botLines)%100)<46?BOT_ACCUSATIONS:BOT_CHAT;simulatedMessage(pick(pool,'ambient'+simChat.botLines),900+Math.floor(Math.random()*1300));simChat.botLines++;simChat.nextBotAt=Date.now()+30000+(hash('v137|bot-next|'+simChat.name+'|'+simChat.botLines)%30000)}
function patchChat(){if(S.__v137Chat)return;S.__v137Chat=true;var old=S.sendChat;S.sendChat=function(t){var text=String(t||'').trim(),r=old.apply(S,arguments);if(text&&S.role==='simulated')scheduleReply(text);return r}}
function syncChat(){var active=S.role==='simulated'||(S.started&&(S.role==='host'||S.role==='guest'));document.body.classList.toggle('v137_chat_active',active);var p=S.els&&S.els.chatPanel||$('chatPanel'),toggle=S.els&&S.els.chatToggle||$('chatToggleBtn'),toast=S.els&&S.els.chatToast||$('chatToast');if(!active){if(p)p.hidden=true;if(toggle)toggle.hidden=true;if(toast)toast.hidden=true;typing(false)}document.body.classList.toggle('v137_chat_panel_open',!!(active&&p&&!p.hidden))}

/* Long-range late-game shuttle detector + a multi-tile recovery route. */
function key(p){return p?Number(p.x)+','+Number(p.y):''}
function parseKey(k){var a=String(k||'0,0').split(',');return{x:Number(a[0])||0,y:Number(a[1])||0}}
function trackBots(){var g=G(),bots=g&&g.bots||[];for(var i=0;i<bots.length;i++){var b=bots[i];if(!b||b.alive===false||!b.position)continue;var k=key(b.position),h=b.__v137Trail||(b.__v137Trail=[]);if(h[h.length-1]!==k){h.push(k);if(h.length>64)h.splice(0,h.length-64)}}}
function longLoop(bot){var h=bot&&bot.__v137Trail||[],n=h.length;if(n<17||bot.escapeMode)return false;var late=!!bot.hyperAggressive;try{late=late||bot.remainingWoodCount()<=18}catch(e){}if(!late)return false;for(var half=7;half<=Math.min(24,Math.floor((n-1)/2));half++){var start=n-1-half*2,matches=0,total=half+1;if(start<0)continue;for(var i=0;i<=half;i++)if(h[n-1-i]===h[start+i])matches++;if(matches/total>=.82)return true}var w=h.slice(-28),seen={},minX=999,maxX=-999,minY=999,maxY=-999;for(var j=0;j<w.length;j++){seen[w[j]]=1;var p=parseKey(w[j]);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)}var unique=Object.keys(seen).length,span=(maxX-minX)+(maxY-minY),cur=w[w.length-1],hits=0;for(var q=0;q<w.length-7;q++)if(w[q]===cur)hits++;return span>=7&&unique<=Math.ceil(w.length*.62)&&hits>=1}
function safeStep(bot,p){var g=G();try{return!!(p&&bot.inBounds(p)&&g.getTileMaterial(p)==='grass'&&!bot.hasBomb(p)&&bot.isSafe(p))}catch(e){return false}}
function freshPath(bot){
 var g=G(),trail=bot.__v137Trail||[],recent={};trail.slice(-28).forEach(function(k){recent[k]=(recent[k]||0)+1});var candidates=[];
 for(var y=1;y<g.tilesY-1;y++)for(var x=1;x<g.tilesX-1;x++){var pos={x:x,y:y},k=key(pos);if(recent[k]||!safeStep(bot,pos))continue;var md=Math.abs(x-bot.position.x)+Math.abs(y-bot.position.y);if(md<4)continue;candidates.push({p:pos,score:md+(hash(k+'|'+(bot.displayName||''))%17)/10})}
 candidates.sort(function(a,b){return b.score-a.score});for(var i=0;i<Math.min(24,candidates.length);i++){var path=null;try{path=bot.findPath(bot.position,candidates[i].p,true)}catch(e){}if(path&&path.length>2)return path.slice(1)}
 var dirs=[[1,0],[-1,0],[0,1],[0,-1]],first=[];for(var d=0;d<dirs.length;d++){var p={x:bot.position.x+dirs[d][0],y:bot.position.y+dirs[d][1]};if(safeStep(bot,p))first.push(p)}first.sort(function(a,b){return(recent[key(a)]||0)-(recent[key(b)]||0)});return first.length?[first[0]]:null
}
function followBreakPath(bot){var path=bot&&bot.__v137BreakPath;if(!path||!path.length||bot.escapeMode)return false;while(path.length&&same(path[0],bot.position))path.shift();if(!path.length){bot.__v137BreakPath=null;return false}if(!safeStep(bot,path[0])){bot.__v137BreakPath=null;return false}try{bot.setNextTile(path[0]);return true}catch(e){bot.__v137BreakPath=null;return false}}
function breakLongLoop(bot){if(!longLoop(bot)||Date.now()<(bot.__v137LoopBreakUntil||0))return false;var path=freshPath(bot);if(!path||!path.length)return false;bot.__v137BreakPath=path.slice();bot.__v137LoopBreakUntil=Date.now()+3200;bot.__v137LoopBreaks=(bot.__v137LoopBreaks||0)+1;bot.__v137Trail=(bot.__v137Trail||[]).slice(-6);return followBreakPath(bot)}
function patchAI(){if(!window.Bot||Bot.prototype.__v137LongLoop)return false;Bot.prototype.__v137LongLoop=true;var old=Bot.prototype.chooseNextAction;Bot.prototype.chooseNextAction=function(){if(followBreakPath(this)||breakLongLoop(this))return;return old.apply(this,arguments)};return true}

function install(){
 if(installed)return true;if(!window.BomberChallenge136||!window.BomberLeaderboard127||!window.BomberSocial130||!window.BomberWhole132||!window.Bot||!S.els)return false;installed=true;ensureStyle();badge();patchLobby();patchChallenges();patchMenuCleanup();patchChat();patchAI();leaderboardText();ensureStableMatchStatus();ensureStableRoundSummary();repairLobby();syncChat();
 window.BomberStability137={version:VERSION,repairLobby:repairLobby,requestChallenge:requestChallenge,decisionDelay:decisionDelay,botTalker:botTalker,replyFor:replyFor,longLoop:longLoop,breakLongLoop:breakLongLoop,clearGameOver:clearGameOver};
 if(/[?&]netdebug=1(?:&|$)/.test(location.search))BomberStability137.debug={forceChallenge:function(name,outcome){return requestChallenge(name,{immediate:true,accept:outcome!=='decline'&&outcome!=='offline',offline:outcome==='offline'})},setTrail:function(bot,a){bot.__v137Trail=(a||[]).slice();return bot.__v137Trail},forceReply:function(text){var r=replyFor(text);simulatedMessage(r,20);return r},botRate:function(names){var n=0;for(var i=0;i<names.length;i++)if(botTalker(names[i]))n++;return names.length?n/names.length:0},breakPath:function(bot){return bot&&bot.__v137BreakPath?bot.__v137BreakPath.slice():[]}};return true
}
var tries=0,t=setInterval(function(){if(install()||++tries>900)clearInterval(t)},40);
setInterval(function(){if(!installed)return;ensureStyle();badge();repairLobby();leaderboardText();ensureStableMatchStatus();ensureStableRoundSummary();syncChat();trackBots();ambientBotChat()},180);
window.addEventListener('resize',function(){if(installed){repairLobby();leaderboardText();ensureStableRoundSummary()}},{passive:true});
})();
