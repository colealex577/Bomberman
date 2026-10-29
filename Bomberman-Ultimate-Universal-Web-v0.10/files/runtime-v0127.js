(function(){
'use strict';
var VERSION='v0.12.7';
var SCORE_KEY='BombermanRatingV1';
var LOG_KEY='BombermanMatchmakingLogV127';
var S=window.B115,Q=window.BomberQOL,V125=window.BomberV125;
if(!S||!Q)return;
var installed=false,legacyReplay=null,activeLogId=null,networkGuard=false;
var rematch={outgoing:false,incoming:false,incomingName:'',simTimer:null};

function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function online(){return !!(S.online&&S.online())}
function simulated(){return S.role==='simulated'}
function clamp(v){v=Math.round(Number(v)||0);return Math.max(0,Math.min(1000,v))}
function score(){try{return clamp(localStorage.getItem(SCORE_KEY))}catch(e){return 0}}
function setScore(v){v=clamp(v);try{localStorage.setItem(SCORE_KEY,String(v))}catch(e){}return v}
function fmt(v){v=clamp(v);return v>=1000?'1000 MAX':String(v)}
function localSlot(){return S.role==='guest'?1:0}
function localPlayer(){var g=G();return g&&g.players&&g.players[localSlot()]||null}
function humanName(slot){var g=G();if(simulated()&&slot==='sim')return S.remoteName||'Opponent';var p=g&&g.players&&g.players[Number(slot)];return p&&p.displayName||((Number(slot)===0?S.localName:S.remoteName)||('Player '+(Number(slot)+1)))}
function round(){var g=G();if(!g)return null;if(!g.__v127Round)g.__v127Round={duelResolved:false,winner:null,loser:null,hadAI:false,aiBonusResolved:false,localEliminated:false};return g.__v127Round}
function standardAIAlive(){var g=G(),n=0;if(!g||!g.bots)return 0;for(var i=0;i<g.bots.length;i++)if(g.bots[i]&&!g.bots[i].simulatedHuman&&g.bots[i].alive!==false)n++;return n}
function entityFor(side){var g=G();if(!g)return null;if(side==='sim')return g.simulatedOpponent||null;return g.players&&g.players[Number(side)]||null}
function sendProfile(){if(!online()||!S.conn||!S.conn.open||!window.BomberCharacter)return;try{S.send({type:'v123Profile',appearance:BomberCharacter.get(),rating:score()})}catch(e){}}
function adjustLocal(delta){var after=setScore(score()+delta),p=localPlayer();if(p)p.rating=after;sendProfile();return after}
function adjustSim(delta){var g=G(),p=g&&g.simulatedOpponent;if(!p)return;if(window.BomberLeaderboard127&&BomberLeaderboard127.recordResult){var ranked=BomberLeaderboard127.recordResult(S.remoteName,delta);if(ranked){p.rating=ranked.score;g.simulatedRating=ranked.score||Number.MIN_VALUE;S.simulatedRating=g.simulatedRating;return}}var v=clamp((Number(p.rating)||Number(g.simulatedRating)||650)+delta);p.rating=v;g.simulatedRating=v;S.simulatedRating=v;try{if(g.updateStatHud)g.updateStatHud()}catch(e){}}
function markLegacyScoringDone(){var g=G();if(g)g.__v123RatingSettled=true}
function setLocalRatingResult(delta,label){var g=G();if(!g)return;g.__v123RatingResult={before:clamp(score()-delta),after:score(),delta:delta,won:delta>0,label:label||''}}

function applyDuelResult(loser,winner){
 var g=G(),r=round();if(!g||!r||r.duelResolved)return false;
 r.duelResolved=true;r.loser=loser;r.winner=winner;r.hadAI=standardAIAlive()>0;r.aiBonusResolved=!r.hadAI;markLegacyScoringDone();
 if(simulated()){
   if(winner===0){var w0=adjustLocal(10);setLocalRatingResult(10,'Human duel win');adjustSim(-10)}
   else if(loser===0){var l0=adjustLocal(-10);setLocalRatingResult(l0===score()?0:-10,'Human duel loss');adjustSim(10)}
 }else if(online()){
   var ls=localSlot();if(winner===ls){var before=score();adjustLocal(10);setLocalRatingResult(score()-before,'Human duel win')}
   else if(loser===ls){var beforeL=score();adjustLocal(-10);setLocalRatingResult(score()-beforeL,'Human duel loss');r.localEliminated=true}
 }
 if(simulated()&&loser===0)r.localEliminated=true;
 updateRematchAvailability();
 return true
}
function resolveOnlineDuel(loser){if(!online()||!(S.host&&S.host()))return false;var winner=loser===0?1:0,ok=applyDuelResult(loser,winner);if(ok&&S.conn&&S.conn.open)S.send({type:'v127DuelResolved',loser:loser,winner:winner});return ok}
function applyAIBonus(winner,awarded){var r=round();if(!r||r.aiBonusResolved)return;r.aiBonusResolved=true;if(!awarded)return;if(simulated()){
 if(winner===0){var b=score();adjustLocal(5);setLocalRatingResult(score()-b,'AI clear bonus')}else if(winner==='sim')adjustSim(5)
 }else if(online()&&winner===localSlot()){var before=score();adjustLocal(5);setLocalRatingResult(score()-before,'AI clear bonus')}
}
function checkAIBonus(){
 var g=G(),r=round();if(!g||!r||!r.duelResolved||!r.hadAI||r.aiBonusResolved)return;
 if(standardAIAlive()>0)return;
 var winnerEntity=entityFor(r.winner),awarded=!!(winnerEntity&&winnerEntity.alive!==false);
 if(online()){
   if(!(S.host&&S.host()))return;
   applyAIBonus(r.winner,awarded);if(S.conn&&S.conn.open)S.send({type:'v127AIBonus',winner:r.winner,awarded:awarded})
 }else if(simulated())applyAIBonus(r.winner,awarded)
}

function resetRoundState(){var g=G();if(!g)return;g.__v127Round={duelResolved:false,winner:null,loser:null,hadAI:false,aiBonusResolved:false,localEliminated:false};rematch.outgoing=false;rematch.incoming=false;rematch.incomingName='';if(rematch.simTimer){clearTimeout(rematch.simTimer);rematch.simTimer=null}updateRematchAvailability()}
function patchScoring(){
 if(!window.GameEngine||GameEngine.prototype.__v127Scoring)return;GameEngine.prototype.__v127Scoring=true;
 var oldHuman=GameEngine.prototype.handleHumanDeath;GameEngine.prototype.handleHumanDeath=function(player){
   var idx=this.players.indexOf(player),r=round();
   if(!r.duelResolved){
     if(online()&&this.playersCount===2&&idx>=0){if(S.host&&S.host())resolveOnlineDuel(idx);else markLegacyScoringDone()}
     else if(simulated()&&idx===0)applyDuelResult(0,'sim')
   }else markLegacyScoringDone();
   var out=oldHuman.apply(this,arguments);updateRematchAvailability();return out
 };
 var oldBot=GameEngine.prototype.handleBotDeath;GameEngine.prototype.handleBotDeath=function(bot){var out=oldBot.apply(this,arguments);checkAIBonus();return out};
 var oldRestart=GameEngine.prototype.restart;GameEngine.prototype.restart=function(){var out=oldRestart.apply(this,arguments);resetRoundState();return out};
 if(window.Bot&&!Bot.prototype.__v127FakeDeath){Bot.prototype.__v127FakeDeath=true;var oldDie=Bot.prototype.die;Bot.prototype.die=function(){if(this.simulatedHuman&&simulated()){var r=round();if(r&&!r.duelResolved)applyDuelResult('sim',0)}return oldDie.apply(this,arguments)}}
}

function hide(el){if(el)el.hidden=true}
function show(el){if(el)el.hidden=false}
function clearRoundOverlays(){Q.postMatchOpen=false;Q.eliminatedOpen=false;Q.rematchPromptOpen=false;Q.rematchWaiting=false;hide($('qolPostMatch'));hide($('qolEliminated'));hide($('qolRematchPrompt'));hide($('spectatorBanner'));hide($('remoteSpectatorBanner'));document.body.classList.add('qol_round_live')}
function restartLocalRound(){var g=G();if(!g)return;clearRoundOverlays();g.matchFinished=false;g.spectatorFinished=false;g.spectatorMode=false;if(g.menu)g.menu.hide();g.restart()}
function restartGuestRound(){if(window.BomberDataSync){BomberDataSync.localAuthority=null;BomberDataSync.lastSeq=0}restartLocalRound()}
function startHostRematch(){if(!(S.host&&S.host())||!S.conn||!S.conn.open)return;rematch.outgoing=false;rematch.incoming=false;restartLocalRound();S.send({type:'v127RematchStart'})}
function startSimRematch(){rematch.outgoing=false;rematch.incoming=false;restartLocalRound();var g=G(),sim=g&&g.simulatedOpponent;if(sim){sim.started=false;sim.startTimer=0;setTimeout(function(){var gg=G(),ss=gg&&gg.simulatedOpponent;if(ss){ss.started=true;ss.startTimer=ss.startTimerMax||0}},1000)}}
function statusText(t){var els=[$('qolEliminated'),$('qolPostMatch')];for(var i=0;i<els.length;i++){var s=els[i]&&els[i].querySelector('.qol_status');if(s)s.textContent=t||''}var f=$('v127SpectateRematch');if(f)f.textContent=rematch.outgoing?'Waiting for opponent…':'Request rematch'}
function setButtonsWaiting(waiting){['qolReplayBtn','qolElimRematchNow','v127RematchNow','v127SpectateRematch'].forEach(function(id){var b=$(id);if(!b)return;b.disabled=!!waiting;if(id==='qolReplayBtn')b.textContent=waiting?'Waiting for opponent…':'Replay opponent';else if(id!=='v127SpectateRematch')b.textContent=waiting?'Waiting for opponent…':'Rematch now'});statusText(waiting?'Rematch request sent.':'')}
function requestRematch(){
 if(rematch.outgoing)return;
 if(simulated()){
   rematch.outgoing=true;Q.rematchWaiting=true;setButtonsWaiting(true);statusText('Rematch requested… simulated opponent is deciding.');
   rematch.simTimer=setTimeout(function(){if(!rematch.outgoing||S.role!=='simulated')return;rematch.outgoing=false;Q.rematchWaiting=false;setButtonsWaiting(false);startSimRematch()},2000);return
 }
 if(!online()||!S.conn||!S.conn.open){statusText('Opponent is no longer connected.');return}
 rematch.outgoing=true;Q.rematchWaiting=true;setButtonsWaiting(true);S.send({type:'v127RematchRequest',name:S.localName});statusText('Rematch request sent. You can restart as soon as the other player accepts.')
}
function showIncomingPrompt(name){
 rematch.incoming=true;rematch.incomingName=name||S.remoteName||'Your opponent';var o=$('qolRematchPrompt');if(!o)return;Q.rematchPromptOpen=true;o.querySelector('.qol_title').textContent='Rematch?';o.querySelector('.qol_copy').textContent=rematch.incomingName+' wants to play again now.';var st=o.querySelector('.qol_status');if(st)st.textContent='Accept to stop the current AI round and start immediately.';show(o)
}
function answerRematch(accept){
 if(!rematch.incoming||!online()||!S.conn||!S.conn.open)return;rematch.incoming=false;Q.rematchPromptOpen=false;hide($('qolRematchPrompt'));S.send({type:'v127RematchResponse',accepted:!!accept});if(accept&&S.host&&S.host())setTimeout(startHostRematch,80)
}
function receiveRequest(d){
 if(!online())return;
 if(rematch.outgoing){S.send({type:'v127RematchResponse',accepted:true});rematch.outgoing=false;Q.rematchWaiting=false;setButtonsWaiting(false);if(S.host&&S.host())setTimeout(startHostRematch,80);return}
 showIncomingPrompt(d&&d.name)
}
function receiveResponse(d){
 if(!rematch.outgoing)return;rematch.outgoing=false;Q.rematchWaiting=false;setButtonsWaiting(false);if(!d||!d.accepted){statusText('Opponent declined the rematch.');return}statusText('Opponent accepted. Starting…');if(S.host&&S.host())setTimeout(startHostRematch,80)
}
function maybeRestorePrompt(){if(rematch.incoming)showIncomingPrompt(rematch.incomingName)}
function patchRematchNetwork(){
 if(S.__v127RematchNetwork)return;S.__v127RematchNetwork=true;
 var oh=S.hostData;S.hostData=function(d){if(d&&d.type==='v127RematchRequest'){receiveRequest(d);return}if(d&&d.type==='v127RematchResponse'){receiveResponse(d);return}if(d&&d.type==='v127DuelResolved'){applyDuelResult(d.loser,d.winner);return}if(d&&d.type==='v127AIBonus'){applyAIBonus(d.winner,!!d.awarded);return}var r=oh.apply(S,arguments);if(d&&d.type==='matchEnd')setTimeout(maybeRestorePrompt,0);return r};
 var og=S.guestData;S.guestData=function(d){if(d&&d.type==='v127RematchRequest'){receiveRequest(d);return}if(d&&d.type==='v127RematchResponse'){receiveResponse(d);return}if(d&&d.type==='v127RematchStart'){restartGuestRound();return}if(d&&d.type==='v127DuelResolved'){applyDuelResult(d.loser,d.winner);return}if(d&&d.type==='v127AIBonus'){applyAIBonus(d.winner,!!d.awarded);return}var r=og.apply(S,arguments);if(d&&d.type==='matchEnd')setTimeout(maybeRestorePrompt,0);return r}
}
function ensureRematchUI(){
 var elim=$('qolEliminated');if(elim){var a=elim.querySelector('.qol_actions'),b=$('v127RematchNow');if(a&&!b){b=document.createElement('button');b.id='v127RematchNow';b.type='button';b.className='qol_btn';b.textContent='Rematch now';b.onclick=requestRematch;a.insertBefore(b,a.firstChild)}var old=$('qolElimRematchNow');if(old)old.style.display='none'}
 var replay=$('qolReplayBtn');if(replay){if(!legacyReplay)legacyReplay=replay.onclick;replay.onclick=requestRematch;if(!rematch.outgoing){replay.disabled=false;if(replay.textContent==='Waiting for opponent…')replay.textContent='Replay opponent'}}
 var yes=$('qolRematchAccept'),no=$('qolRematchDecline');if(yes)yes.onclick=function(){answerRematch(true)};if(no)no.onclick=function(){answerRematch(false)};
 var floater=$('v127SpectateRematch');if(!floater){floater=document.createElement('button');floater.id='v127SpectateRematch';floater.type='button';floater.className='qol_btn';floater.textContent='Request rematch';floater.hidden=true;floater.onclick=requestRematch;document.body.appendChild(floater)}
 updateRematchAvailability()
}
function updateRematchAvailability(){
 var g=G(),r=g&&g.__v127Round,eligible=!!(r&&r.localEliminated&&(online()||simulated())),elim=$('qolEliminated'),b=$('v127RematchNow'),f=$('v127SpectateRematch');
 if(b)b.hidden=!(eligible&&elim&&!elim.hidden);if(f){var spectating=eligible&&(!elim||elim.hidden)&&g&&!g.matchFinished;f.hidden=!spectating;f.disabled=rematch.outgoing;f.textContent=rematch.outgoing?'Waiting for opponent…':'Request rematch'}
 if(rematch.incoming)maybeRestorePrompt()
}

function loadLog(){try{var a=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function saveLog(a){try{localStorage.setItem(LOG_KEY,JSON.stringify(a.slice(-100)))}catch(e){}}
function logEvent(username,event,result,id){var a=loadLog(),entry={id:id||('m'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),ts:Date.now(),username:String(username||'Player').slice(0,14),event:event||'Public search',result:result||''};a.push(entry);saveLog(a);renderLog();return entry.id}
function updateLog(id,result){if(!id)return;var a=loadLog();for(var i=a.length-1;i>=0;i--)if(a[i].id===id){a[i].result=result;a[i].done=Date.now();break}saveLog(a);renderLog()}
function observeOpponent(name,result){if(!name)return;logEvent(name,'Observed public player',result||('Matched with '+(S.localName||'Player')))}
function publicStart(kind){if(activeLogId)updateLog(activeLogId,'Cancelled / replaced by new search');activeLogId=logEvent(S.localName||'Player',kind==='host'?'Public host':'Public search','Searching…')}
function publicMatched(remote){if(activeLogId){updateLog(activeLogId,'Matched with '+String(remote||'Player'));activeLogId=null}observeOpponent(remote,'Matched with '+(S.localName||'Player'))}
function patchMatchLog(){
 if(S.__v127MatchLog)return;S.__v127MatchLog=true;
 var join=S.startPublicJoin;S.startPublicJoin=function(){networkGuard=true;var r=join.apply(S,arguments);networkGuard=false;publicStart('join');return r};
 var host=S.startPublicHost;S.startPublicHost=function(){networkGuard=true;var r=host.apply(S,arguments);networkGuard=false;publicStart('host');return r};
 var start=S.startHostMatch;S.startHostMatch=function(id,name){var r=start.apply(S,arguments);if(S.kind==='public')publicMatched(S.remoteName||name);return r};
 var guest=S.guestData;S.guestData=function(d){var r=guest.apply(S,arguments);if(d&&d.type==='start'&&S.kind==='public')publicMatched(S.remoteName);return r};
 var sim=S.startSimulated;S.startSimulated=function(){var id=activeLogId;networkGuard=true;var r=sim.apply(S,arguments);networkGuard=false;if(id){updateLog(id,'Simulated fallback: '+S.remoteName);if(activeLogId===id)activeLogId=null}return r};
 var destroy=S.destroyNetwork;S.destroyNetwork=function(){if(!networkGuard&&activeLogId){updateLog(activeLogId,'Cancelled / disconnected');activeLogId=null}return destroy.apply(S,arguments)}
}
function renderLog(){var root=$('v127LogList');if(!root)return;var a=loadLog().slice().reverse().slice(0,40);root.textContent='';if(!a.length){var e=document.createElement('div');e.className='v127_empty';e.textContent='No public matchmaking activity recorded on this device yet.';root.appendChild(e);return}for(var i=0;i<a.length;i++){var x=a[i],row=document.createElement('div');row.className='v127_log_row';var t=new Date(x.ts);row.innerHTML='<time></time><strong></strong><span></span>';row.querySelector('time').textContent=t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});row.querySelector('strong').textContent=x.username;row.querySelector('span').textContent=x.result||x.event;root.appendChild(row)}}

function settingsStyle(){if($('v127-style'))return;var st=document.createElement('style');st.id='v127-style';st.textContent=`
#buildVersion,#buildVersion119,#buildVersion120,#buildVersion121,#buildVersion122,#buildVersion123,#buildVersion124,#buildVersion125,#buildVersion126{display:none!important}
#buildVersion127{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.62);color:#fff;font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
#qolElimRematchNow{display:none!important}#v127SpectateRematch{position:fixed;z-index:6900;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);transform:translateX(-50%);min-height:38px;padding:7px 13px;background:rgba(35,25,31,.92)}#v127SpectateRematch[hidden]{display:none!important}
#mainSettingsTile{position:fixed;z-index:6500;display:none;border:0;background:rgba(0,0,0,.5);color:#fff;font-family:Helvetica,Arial,sans-serif;cursor:pointer;padding:6px 8px;text-align:center}#mainSettingsTile svg{display:block;width:25px;height:25px;margin:0 auto 3px;fill:#d6d6d6}#mainSettingsTile strong{display:block;font-size:12px;font-weight:600;color:#d6d6d6}#mainSettingsTile:hover{background:rgba(0,0,0,.68)}
#v127SettingsPanel{position:fixed;inset:0;z-index:8400;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,6,9,.76);backdrop-filter:blur(4px)}#v127SettingsPanel[hidden]{display:none!important}.v127_card{width:min(520px,95vw);max-height:92vh;overflow:auto;box-sizing:border-box;padding:17px;border:1px solid rgba(255,255,255,.17);border-radius:14px;background:#21111a;color:#fff;font-family:Helvetica,Arial,sans-serif;box-shadow:0 22px 70px rgba(0,0,0,.55)}.v127_head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v127_head h2{margin:0;font-size:22px}.v127_head p{margin:4px 0 0;color:#aaa;font-size:11px}.v127_close{border:0;background:transparent;color:#fff;font-size:27px}.v127_section{margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.1)}.v127_section h3{margin:0 0 5px;font-size:14px}.v127_section p{margin:0 0 9px;color:#aaa;font-size:10px;line-height:1.4}.v127_diff{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.v127_diff button,.v127_clear{min-height:37px;border:1px solid rgba(255,255,255,.17);border-radius:7px;background:rgba(255,255,255,.06);color:#fff;font-weight:800}.v127_diff button.active{background:#567b25;border-color:#8fbd4a}.v127_log_tools{display:flex;justify-content:flex-end;margin-bottom:7px}.v127_clear{min-height:31px;padding:5px 9px;font-size:10px}.v127_log{display:grid;gap:4px;max-height:235px;overflow:auto}.v127_log_row{display:grid;grid-template-columns:70px 105px 1fr;gap:7px;align-items:center;padding:6px 7px;border-radius:6px;background:rgba(255,255,255,.04);font-size:10px}.v127_log_row time{color:#888}.v127_log_row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.v127_log_row span{color:#b9ef8c}.v127_empty{padding:10px;color:#888;font-size:10px;text-align:center}@media(max-width:560px){.v127_diff{grid-template-columns:repeat(2,1fr)}.v127_log_row{grid-template-columns:58px 85px 1fr;font-size:9px}}
`;document.head.appendChild(st)}
function version(){var v=$('buildVersion127');if(!v){v=document.createElement('div');v.id='buildVersion127';v.setAttribute('aria-label','Game version');document.body.appendChild(v)}v.textContent=VERSION}
function ensureSettings(){
 if(!$('v127SettingsPanel')){var p=document.createElement('div');p.id='v127SettingsPanel';p.hidden=true;p.innerHTML='<div class="v127_card"><div class="v127_head"><div><h2>Settings</h2><p>Game and matchmaking options</p></div><button class="v127_close" type="button" aria-label="Close">×</button></div><section class="v127_section"><h3>Single-player AI difficulty</h3><p>This controls standard AI in single player. Multiplayer hosts can still choose a difficulty in the lobby.</p><div class="v127_diff"><button data-v127-diff="easy">Easy</button><button data-v127-diff="normal">Normal</button><button data-v127-diff="hard">Hard</button><button data-v127-diff="expert">Expert</button></div></section><section class="v127_section"><h3>Public matchmaking log</h3><p>This device only. The game is hosted on static GitHub Pages with peer-to-peer matchmaking, so there is no central application server that can truthfully list every search worldwide.</p><div class="v127_log_tools"><button id="v127ClearLog" class="v127_clear" type="button">Clear log</button></div><div id="v127LogList" class="v127_log"></div></section></div>';document.body.appendChild(p);p.querySelector('.v127_close').onclick=function(){p.hidden=true;syncSettingsTile()};p.querySelectorAll('[data-v127-diff]').forEach(function(b){b.onclick=function(){var d=this.getAttribute('data-v127-diff');if(window.BomberV125&&BomberV125.setDifficulty)BomberV125.setDifficulty(d);syncDifficulty()}});$('v127ClearLog').onclick=function(){saveLog([]);renderLog()}}
 var tile=$('mainSettingsTile');if(!tile){tile=document.createElement('button');tile.type='button';tile.id='mainSettingsTile';tile.setAttribute('aria-label','Settings');tile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13a7.7 7.7 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a8.1 8.1 0 0 0-1.7-1L15 3h-4l-.4 3a8.1 8.1 0 0 0-1.7 1L6.5 6l-2 3.4L6.6 11a7.7 7.7 0 0 0 0 2l-2.1 1.6 2 3.4 2.4-1a8.1 8.1 0 0 0 1.7 1l.4 3h4l.4-3a8.1 8.1 0 0 0 1.7-1l2.4 1 2-3.4L19.4 13ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z"/></svg><strong>Settings</strong>';tile.onclick=function(){$('v127SettingsPanel').hidden=false;syncDifficulty();renderLog();syncSettingsTile()};document.body.appendChild(tile)}
 syncDifficulty();renderLog();return tile
}
function syncDifficulty(){var d=window.BomberV125&&BomberV125.getDifficulty?BomberV125.getDifficulty():(localStorage.getItem('BombermanAIDifficultyV1')||'normal');document.querySelectorAll('[data-v127-diff]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-v127-diff')===d)})}
function syncSettingsTile(){var g=G(),tile=ensureSettings(),panel=$('v127SettingsPanel');if(!g||!g.menu||!tile)return;var char=$('characterPanel'),show=!!(g.menu.visible&&!g.lobbyOpen&&(!panel||panel.hidden)&&(!char||char.hidden));tile.style.display=show?'block':'none';if(!show)return;var c=$('canvas'),r=c&&c.getBoundingClientRect();if(!r||!r.width)return;var scale=Math.max(.65,Math.min(1.2,r.width/(g.size&&g.size.w||544))),w=82*scale,h=52*scale;tile.style.width=w+'px';tile.style.height=h+'px';tile.style.left=(r.left+9*scale)+'px';tile.style.top=(r.bottom-h-7*scale)+'px'}
function patchSingleDifficulty(){if(!window.Menu||Menu.prototype.__v127SingleDifficulty)return;Menu.prototype.__v127SingleDifficulty=true;var old=Menu.prototype.setMode;Menu.prototype.setMode=function(mode){if(mode==='single'&&window.BomberV125&&BomberV125.setDifficulty){var d='normal';try{d=localStorage.getItem('BombermanAIDifficultyV1')||'normal'}catch(e){}BomberV125.setDifficulty(d)}return old.apply(this,arguments)}}
function install(){if(installed)return true;if(!window.GameEngine||!window.Bot||!window.Menu||!window.BomberV125||!window.BomberAI126||!Q.installed||!S.hostData||!S.guestData)return false;installed=true;settingsStyle();version();ensureSettings();patchScoring();patchRematchNetwork();patchMatchLog();patchSingleDifficulty();resetRoundState();ensureRematchUI();window.BomberV127={version:VERSION,getScore:score,setScore:setScore,requestRematch:requestRematch,applyDuel:applyDuelResult,checkAIBonus:checkAIBonus,getLog:loadLog,logEvent:logEvent,clearLog:function(){saveLog([]);renderLog()},openSettings:function(){ensureSettings();$('v127SettingsPanel').hidden=false;syncDifficulty();renderLog()},round:round};return true}
settingsStyle();version();var tries=0,t=setInterval(function(){version();if(install()||++tries>700)clearInterval(t)},40);setInterval(function(){version();if(installed){ensureRematchUI();updateRematchAvailability();syncSettingsTile();syncDifficulty();checkAIBonus()}},120);window.addEventListener('resize',syncSettingsTile,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(syncSettingsTile,80)},{passive:true});
})();

