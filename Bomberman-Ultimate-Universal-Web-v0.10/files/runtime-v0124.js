(function(){
'use strict';
var VERSION='v0.12.4';
var AI_KEY='BombermanMultiplayerAIEnabled';
var S=window.B115,Q=window.BomberQOL,installed=false;
if(!S)return;
var localAI=loadLocalAI(),matchAI=localAI,keySent={};

function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function isDataGuest(){return !!(window.BomberDataSync&&BomberDataSync.active&&BomberDataSync.role==='guest'&&S.role==='guest')}
function editable(t){if(!t)return false;var n=String(t.tagName||'').toLowerCase();return n==='input'||n==='textarea'||n==='select'||!!t.isContentEditable}
function loadLocalAI(){try{return localStorage.getItem(AI_KEY)!=='0'}catch(e){return true}}
function saveLocalAI(v){try{localStorage.setItem(AI_KEY,v?'1':'0')}catch(e){}}
function setMatchAI(v,remote){matchAI=v!==false;S.multiplayerAIEnabled=matchAI;var g=G();if(g)g.multiplayerAIEnabled=matchAI;if(!remote){localAI=matchAI;saveLocalAI(localAI)}renderAI();return matchAI}
function restoreLocalAI(){matchAI=localAI;S.multiplayerAIEnabled=matchAI;var g=G();if(g)g.multiplayerAIEnabled=matchAI;renderAI()}

function addStyle(){
 if($('v0124-style'))return;var st=document.createElement('style');st.id='v0124-style';st.textContent=`
#buildVersion,#buildVersion119,#buildVersion120,#buildVersion121,#buildVersion122,#buildVersion123{display:none!important}
#buildVersion124{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.62);color:rgba(255,255,255,.94);font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
#v124AiSetting{margin:0 0 10px;padding:9px 11px}.v124_ai_toggle{min-width:72px;min-height:36px;border:1px solid rgba(255,255,255,.22);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;font-weight:900;cursor:pointer}.v124_ai_toggle.on{background:#567b25;border-color:#8fbd4a;color:#fff}.v124_ai_toggle:disabled{opacity:.55;cursor:default}.v124_ai_note{margin-top:6px;color:rgba(255,255,255,.62);font-size:10px;line-height:1.3}
#qolEliminated .qol_actions.v124_three{grid-template-columns:repeat(3,1fr)}#qolElimRematchNow[hidden]{display:none!important}@media(max-width:640px){#qolEliminated .qol_actions.v124_three{grid-template-columns:1fr}}
`;(document.head||document.documentElement).appendChild(st)
}
function showVersion(){var v=$('buildVersion124');if(!v){v=document.createElement('div');v.id='buildVersion124';v.setAttribute('aria-label','Game version');(document.body||document.documentElement).appendChild(v)}v.textContent=VERSION}

function ensureAISetting(){
 var choice=(S.els&&S.els.panel_choice)||$('lobbyChoice');if(!choice)return null;var box=$('v124AiSetting');if(!box){box=document.createElement('div');box.id='v124AiSetting';box.className='host_customization compact_drop_settings';box.innerHTML='<div class="host_customization_header"><div><strong>AI opponents</strong><small>Standard AI players in multiplayer rounds</small></div><button id="v124AiToggle" class="v124_ai_toggle" type="button" aria-pressed="true">ON</button></div><div id="v124AiNote" class="v124_ai_note"></div>';var drop=choice.querySelector('.compact_drop_settings');if(drop&&drop.nextSibling)choice.insertBefore(box,drop.nextSibling);else choice.insertBefore(box,choice.firstChild);var b=$('v124AiToggle');if(b)b.onclick=function(){if(this.disabled)return;setMatchAI(!localAI,false);if(S.host&&S.host()&&S.conn&&S.conn.open&&!S.started)S.send({type:'v124Settings',aiEnabled:matchAI})}}
 renderAI();return box
}
function renderAI(){var b=$('v124AiToggle'),n=$('v124AiNote');if(b){b.textContent=matchAI?'ON · 2 AI':'OFF · PLAYERS ONLY';b.classList.toggle('on',matchAI);b.setAttribute('aria-pressed',matchAI?'true':'false');b.disabled=!!(S.guest&&S.guest()&&S.started)}if(n)n.textContent=matchAI?'Two standard AI opponents join multiplayer rounds.':'No standard AI opponents. Player matchmaking still works.'}

function patchSpawning(){
 if(!window.GameEngine||GameEngine.prototype.__v124AISpawn)return;GameEngine.prototype.__v124AISpawn=true;var old=GameEngine.prototype.spawnBots;GameEngine.prototype.spawnBots=function(){var saved=this.botsCount,multi=this.playersCount===2||this.simulatedOpponentMode;this.multiplayerAIEnabled=matchAI;if(multi&&!matchAI)this.botsCount=0;try{return old.apply(this,arguments)}finally{this.botsCount=saved}}
}

function patchNetworkSettings(){
 if(S.__v124NetworkSettings)return;S.__v124NetworkSettings=true;
 var oldStart=S.startHostMatch;S.startHostMatch=function(){if(S.conn&&S.conn.open)S.send({type:'v124Settings',aiEnabled:matchAI});var r=oldStart.apply(S,arguments);renderAI();return r};
 var oldGuest=S.guestData;S.guestData=function(d){if(d&&d.type==='v124Settings'){setMatchAI(d.aiEnabled,true);return}var r=oldGuest.apply(S,arguments);if(d&&d.type==='dataState')cleanupGuestBombs(d.bombs||[]);return r};
 var oldRole=S.setRole;S.setRole=function(r){if(r!=='guest')resetKeyState(false);var out=oldRole.apply(S,arguments);if(r==='offline'&&!S.started)restoreLocalAI();renderAI();return out}
}

function removeBombEverywhere(b){
 var g=G();if(!g||!b)return;try{if(b.bmp)g.stage.removeChild(b.bmp)}catch(e){};var all=[];if(g.players)all=all.concat(g.players);if(g.bots)all=all.concat(g.bots);for(var i=0;i<all.length;i++){var a=all[i]&&all[i].bombs;if(!a)continue;for(var j=a.length-1;j>=0;j--)if(a[j]===b)a.splice(j,1)}for(var k=g.bombs.length-1;k>=0;k--)if(g.bombs[k]===b)g.bombs.splice(k,1)
}
function forceGuestExplode(b){if(!b||b.exploded||!window.BomberDataSync)return;var prev=BomberDataSync.guestExplodeId;BomberDataSync.guestExplodeId=b.__dataNetId||'';try{b.explode()}catch(e){removeBombEverywhere(b)}BomberDataSync.guestExplodeId=prev}
function cleanupGuestBombs(list){
 if(!isDataGuest())return;var g=G();if(!g||!g.bombs)return;var live={},seen={};for(var i=0;i<list.length;i++){var d=list[i];if(d&&d.id)live[String(d.id)]=1}
 for(var j=g.bombs.length-1;j>=0;j--){var b=g.bombs[j];if(!b||b.exploded)continue;var id=String(b.__dataNetId||'');if(!id){removeBombEverywhere(b);continue}if(seen[id]){removeBombEverywhere(b);continue}seen[id]=1;if(live[id]){b.__v124MissingStates=0;continue}b.__v124MissingStates=(Number(b.__v124MissingStates)||0)+1;if(b.__v124MissingStates>=2)forceGuestExplode(b)}
}

function patchInputEdges(){
 if(S.__v124InputEdges)return;S.__v124InputEdges=true;var oldRemote=S.remoteAction;S.remoteAction=function(a,d){if(!window.gInputEngine)return oldRemote.apply(S,arguments);d=!!d;var prev=!!gInputEngine.actions[a];if(isDataGuest()&&a==='bomb2'){gInputEngine.actions[a]=d;return}if(prev===d){gInputEngine.actions[a]=d;return}return oldRemote.call(S,a,d)};
 var oldSend=S.send;S.send=function(d){if(d&&d.type==='key'&&isDataGuest()){var a=String(d.action||''),v=!!d.down;if(keySent[a]===v)return;keySent[a]=v}return oldSend.apply(S,arguments)};
 var map={ArrowUp:'up2',KeyW:'up2',ArrowDown:'down2',KeyS:'down2',ArrowLeft:'left2',KeyA:'left2',ArrowRight:'right2',KeyD:'right2',Space:'bomb2',ShiftLeft:'bomb2',ShiftRight:'bomb2'};
 window.addEventListener('keydown',function(e){if(!isDataGuest()||editable(e.target))return;var a=map[e.code];if(!a)return;S.send({type:'key',action:a,down:true})},true);
 window.addEventListener('keyup',function(e){if(!isDataGuest()||editable(e.target))return;var a=map[e.code];if(!a)return;S.send({type:'key',action:a,down:false})},true);
 window.addEventListener('blur',function(){resetKeyState(true)},{passive:true});document.addEventListener('visibilitychange',function(){if(document.hidden)resetKeyState(true)},{passive:true})
}
function resetKeyState(sendRelease){var keys=['up2','down2','left2','right2','bomb2'];for(var i=0;i<keys.length;i++){var k=keys[i],was=keySent[k]===true||(window.gInputEngine&&gInputEngine.actions[k]);if(window.gInputEngine)gInputEngine.actions[k]=false;if(sendRelease&&isDataGuest()&&was)S.send({type:'key',action:k,down:false});keySent[k]=false}}

function hasNormalAI(){var g=G();if(!g||!g.bots)return false;for(var i=0;i<g.bots.length;i++)if(g.bots[i]&&!g.bots[i].simulatedHuman)return true;return false}
function ensureImmediateRematch(){
 var elim=$('qolEliminated');if(!elim)return null;var actions=elim.querySelector('.qol_actions');if(!actions)return null;var b=$('qolElimRematchNow');if(!b){b=document.createElement('button');b.type='button';b.id='qolElimRematchNow';b.className='qol_btn';b.textContent='Rematch now';b.hidden=true;actions.insertBefore(b,actions.firstChild);b.onclick=function(){if(!hasNormalAI())return;var replay=$('qolReplayBtn');if(!replay)return;b.disabled=true;b.textContent=S.role==='simulated'?'Rematching…':'Waiting for opponent…';var st=elim.querySelector('.qol_status');if(st)st.textContent=S.role==='simulated'?'Starting a fresh round…':'Rematch request sent. You can restart without waiting for the AI round to finish.';replay.click()}}
 return b
}
function syncImmediateRematch(){
 var elim=$('qolEliminated'),b=ensureImmediateRematch();if(!elim||!b)return;var show=!elim.hidden&&hasNormalAI()&&(S.role==='simulated'||(S.online&&S.online()));b.hidden=!show;var actions=elim.querySelector('.qol_actions');if(actions)actions.classList.toggle('v124_three',show);if(!show){b.disabled=false;b.textContent='Rematch now';return}if(b.disabled&&Q&&!Q.rematchWaiting){var lp=S.role==='guest'?(G()&&G().players&&G().players[1]):(G()&&G().players&&G().players[0]);if(lp&&lp.alive===false){b.disabled=false;b.textContent='Rematch now';var st=elim.querySelector('.qol_status'),post=$('qolPostMatch'),ps=post&&post.querySelector('.qol_status');if(st)st.textContent=(ps&&ps.textContent)||'Rematch was not accepted.'}}
}

function install(){
 if(installed)return true;if(!window.GameEngine||!window.BomberDataSync||!S.__dataSyncInstalled||!window.BomberQOL||!BomberQOL.installed||!S.els||!S.els.panel_choice)return false;installed=true;addStyle();showVersion();setMatchAI(localAI,true);patchSpawning();patchInputEdges();patchNetworkSettings();ensureAISetting();ensureImmediateRematch();window.BomberV124={version:VERSION,getAIEnabled:function(){return matchAI},setAIEnabled:function(v){return setMatchAI(!!v,false)},cleanupGuestBombs:cleanupGuestBombs,resetGuestInput:function(){resetKeyState(true)}};return true
}
addStyle();showVersion();var tries=0,t=setInterval(function(){showVersion();ensureAISetting();ensureImmediateRematch();if(install()||++tries>600)clearInterval(t)},40);setInterval(function(){showVersion();ensureAISetting();renderAI();syncImmediateRematch()},120);['pageshow','focus','resize','orientationchange'].forEach(function(ev){window.addEventListener(ev,function(){showVersion();ensureAISetting();syncImmediateRematch()},{passive:true})});
})();

