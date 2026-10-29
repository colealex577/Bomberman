(function(){
'use strict';

var VERSION='v0.12.0';
var S=window.B115;
if(!S)return;

var Q=window.BomberQOL={
  version:VERSION,
  rematchWaiting:false,
  rematchPromptOpen:false,
  postMatchOpen:false,
  eliminatedOpen:false,
  simIntroBlockUntil:0,
  simIntroSerial:0,
  controlMode:'joystick'
};

function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function isDataGuest(){return !!(window.BomberDataSync&&BomberDataSync.active&&BomberDataSync.role==='guest')}
function isOnline(){return !!(S&&S.online&&S.online())}
function isSimulated(){return S&&S.role==='simulated'}
function currentLocalPlayer(){var g=G();if(!g||!g.players)return null;return S.role==='guest'?g.players[1]:g.players[0]}
function button(text,id,cls){var b=document.createElement('button');b.type='button';b.id=id||'';b.className=cls||'qol_btn';b.textContent=text;return b}
function hide(el){if(el)el.hidden=true}
function show(el){if(el)el.hidden=false}

function addStyle(){
  if($('qol-v0120-style'))return;
  var st=document.createElement('style');st.id='qol-v0120-style';st.textContent=`
    #buildVersion,#buildVersion119{display:none!important}
    #buildVersion120{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);left:calc(env(safe-area-inset-left,0px) + 6px);z-index:2147483647;padding:2px 5px;border-radius:4px;background:rgba(0,0,0,.62);color:rgba(255,255,255,.94);font:700 9px/1.25 Arial,sans-serif;pointer-events:none}
    #multiplayerLobby [hidden],.lobby_choice[hidden],.lobby_section[hidden]{display:none!important}
    .qol_overlay[hidden],#qolStatHud[hidden],#qolTouchSettings[hidden],#qolDpad[hidden]{display:none!important}
    .qol_overlay{position:fixed;inset:0;z-index:7000;display:flex;align-items:center;justify-content:center;background:rgba(10,4,8,.68);padding:18px;box-sizing:border-box}
    .qol_card{width:min(92vw,430px);background:#2b1722;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:18px;color:#fff;text-align:center;box-shadow:0 14px 48px rgba(0,0,0,.38)}
    .qol_card h3{margin:0 0 7px;font-size:22px}.qol_card p{margin:0 0 14px;color:rgba(255,255,255,.7)}
    .qol_actions{display:grid;gap:9px}.qol_actions.two{grid-template-columns:1fr 1fr}
    .qol_btn{min-height:46px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:rgba(255,255,255,.08);color:#fff;font-weight:800;cursor:pointer;padding:9px 12px}
    .qol_btn.primary{background:#567b25;border-color:#8fbd4a}.qol_btn.warn{background:#6b3139}.qol_btn:disabled{opacity:.55;cursor:default}
    .qol_status{min-height:17px;margin-top:10px;font-size:12px;color:#b9ef8c}
    #game.qol_game_frame{position:relative}
    body.qol_has_stats #game.qol_game_frame{padding-top:44px;padding-bottom:44px;box-sizing:content-box}
    body.qol_has_stats #game.qol_game_frame .spectator_banner{top:44px;bottom:44px;left:0;right:0}
    #qolStatHud{position:absolute;inset:0;pointer-events:none;z-index:6}
    .qol_stat_box{position:absolute;width:120px;min-height:34px;box-sizing:border-box;padding:4px 6px;border-radius:6px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.12);color:#fff;font:700 9px/1.2 Arial,sans-serif;text-align:left}
    .qol_stat_box[data-slot="0"]{left:0;top:3px}.qol_stat_box[data-slot="2"]{right:0;top:3px}.qol_stat_box[data-slot="1"]{left:0;bottom:3px}.qol_stat_box[data-slot="3"]{right:0;bottom:3px}
    .qol_stat_name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}.qol_stat_values{display:flex;gap:7px;font-size:9px;font-weight:700}.qol_stat_values span{white-space:nowrap}
    .qol_stat_box.dead{opacity:.55}
    .game_toolbar{display:none!important}body.qol_toolbar_active .game_toolbar{display:flex!important}
    .control_panel{display:none!important}body.qol_round_live:not(.touch-ui) .control_panel{display:block!important}
    .mobile_controls{display:none!important}body.touch-ui.qol_round_live .mobile_controls{display:flex!important}
    #qolTouchSettings{margin:0 0 10px;padding:9px 11px;border:1px solid rgba(255,255,255,.1);border-radius:10px;text-align:left}
    .qol_touch_head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:7px}.qol_touch_head strong{font-size:13px}.qol_touch_head small{color:rgba(255,255,255,.55)}
    .qol_touch_buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}.qol_touch_buttons button{min-height:38px}.qol_touch_buttons button.active{background:#567b25;border-color:#8fbd4a}
    #qolDpad{width:148px;height:148px;position:relative;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .qol_dpad_btn{position:absolute;width:48px;height:48px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(255,255,255,.12);padding:0;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .qol_dpad_btn svg{width:25px;height:25px;display:block;margin:auto;pointer-events:none;fill:#fff}
    .qol_dpad_btn[data-dir="up"]{left:50px;top:0}.qol_dpad_btn[data-dir="down"]{left:50px;bottom:0}.qol_dpad_btn[data-dir="left"]{left:0;top:50px}.qol_dpad_btn[data-dir="right"]{right:0;top:50px}
    .qol_dpad_btn[data-dir="down"] svg{transform:rotate(180deg)}.qol_dpad_btn[data-dir="left"] svg{transform:rotate(-90deg)}.qol_dpad_btn[data-dir="right"] svg{transform:rotate(90deg)}
    body.qol_use_dpad #mobileJoystick{display:none!important}body:not(.qol_use_dpad) #qolDpad{display:none!important}
    @media(max-width:640px){body.qol_has_stats #game.qol_game_frame{padding-top:40px;padding-bottom:40px}.qol_stat_box{width:108px;font-size:8px;padding:3px 5px}.qol_stat_values{gap:5px;font-size:8px}body.qol_has_stats #game.qol_game_frame .spectator_banner{top:40px;bottom:40px}.qol_actions.two{grid-template-columns:1fr}}
  `;document.head.appendChild(st)
}

function showVersion(){
  var v=$('buildVersion120');if(!v){v=document.createElement('div');v.id='buildVersion120';(document.body||document.documentElement).appendChild(v)}v.textContent=VERSION;v.setAttribute('aria-label','Game version')
}

function buildOverlay(id,title){
  var root=$(id);if(root)return root;
  root=document.createElement('div');root.id=id;root.className='qol_overlay';root.hidden=true;
  var card=document.createElement('div');card.className='qol_card';
  var h=document.createElement('h3');h.textContent=title||'';h.className='qol_title';
  var p=document.createElement('p');p.className='qol_copy';
  var actions=document.createElement('div');actions.className='qol_actions';
  var status=document.createElement('div');status.className='qol_status';
  card.appendChild(h);card.appendChild(p);card.appendChild(actions);card.appendChild(status);root.appendChild(card);document.body.appendChild(root);return root
}

function ensureOverlays(){
  var elim=buildOverlay('qolEliminated','You’re out');var ea=elim.querySelector('.qol_actions');if(!ea.children.length){var spec=button('Spectate','qolSpectateBtn','qol_btn primary'),menu=button('Back to menu','qolElimMenuBtn','qol_btn');ea.classList.add('two');ea.appendChild(spec);ea.appendChild(menu);spec.onclick=function(){Q.eliminatedOpen=false;hide(elim);var b=$('spectatorBanner');if(b)show(b);syncLiveUI()};menu.onclick=backToMenu}
  var post=buildOverlay('qolPostMatch','Round over');var pa=post.querySelector('.qol_actions');if(!pa.children.length){var random=button('New random match','qolRandomBtn','qol_btn primary'),replay=button('Replay opponent','qolReplayBtn','qol_btn'),back=button('Back to menu','qolMenuBtn','qol_btn');pa.appendChild(random);pa.appendChild(replay);pa.appendChild(back);random.onclick=startRandomMatch;replay.onclick=requestRematch;back.onclick=backToMenu}
  var prompt=buildOverlay('qolRematchPrompt','Rematch?');var ra=prompt.querySelector('.qol_actions');if(!ra.children.length){var yes=button('Accept','qolRematchAccept','qol_btn primary'),no=button('Decline','qolRematchDecline','qol_btn warn');ra.classList.add('two');ra.appendChild(yes);ra.appendChild(no);yes.onclick=function(){resolveRematchPrompt(true)};no.onclick=function(){resolveRematchPrompt(false)}}
}

function showEliminated(label){
  ensureOverlays();Q.eliminatedOpen=true;var o=$('qolEliminated');o.querySelector('.qol_title').textContent=label||'You’re out';o.querySelector('.qol_copy').textContent='Keep watching the round or return to the menu.';o.querySelector('.qol_status').textContent='';var banner=$('spectatorBanner');if(banner)hide(banner);show(o);syncLiveUI()
}

function showPostMatch(result){
  ensureOverlays();Q.postMatchOpen=true;Q.eliminatedOpen=false;Q.rematchWaiting=false;hide($('qolEliminated'));hide($('qolRematchPrompt'));
  var o=$('qolPostMatch');o.querySelector('.qol_title').textContent=result||'Round over';o.querySelector('.qol_copy').textContent='Choose what you want to do next.';o.querySelector('.qol_status').textContent='';var rb=$('qolReplayBtn');if(rb){rb.disabled=false;rb.textContent='Replay opponent'}show(o);syncLiveUI()
}
Q.showPostMatch=showPostMatch;

function closeRoundOverlays(){Q.postMatchOpen=false;Q.eliminatedOpen=false;Q.rematchPromptOpen=false;Q.rematchWaiting=false;hide($('qolPostMatch'));hide($('qolEliminated'));hide($('qolRematchPrompt'))}

function removeCanvasHud(g){if(!g||!g.stage||!g.statHud)return;for(var i=0;i<g.statHud.length;i++){var c=g.statHud[i]&&g.statHud[i].container;if(c)try{g.stage.removeChild(c)}catch(e){}}g.statHud=[]}
function ensureStatHud(){
  var game=$('game');if(!game)return null;game.classList.add('qol_game_frame');var hud=$('qolStatHud');if(hud)return hud;hud=document.createElement('div');hud.id='qolStatHud';for(var i=0;i<4;i++){var b=document.createElement('div');b.className='qol_stat_box';b.dataset.slot=String(i);b.hidden=true;var n=document.createElement('div');n.className='qol_stat_name';var vals=document.createElement('div');vals.className='qol_stat_values';vals.innerHTML='<span data-k="heart">♥ ×0</span><span data-k="speed">SPD ×0</span><span data-k="bomb">BMB ×0</span><span data-k="fire">FIR ×0</span>';b.appendChild(n);b.appendChild(vals);hud.appendChild(b)}game.appendChild(hud);return hud
}
function updateExternalStats(){
  var g=G(),hud=ensureStatHud();if(!g||!hud)return;removeCanvasHud(g);var slots=g.getContestantsByStatSlot?g.getContestantsByStatSlot():[];for(var i=0;i<4;i++){var box=hud.querySelector('[data-slot="'+i+'"]'),e=slots[i];if(!box)continue;var visible=!!(g.playing&&g.menu&&!g.menu.visible&&!g.lobbyOpen&&e);box.hidden=!visible;if(!visible)continue;box.classList.toggle('dead',e.alive===false);var name=box.querySelector('.qol_stat_name');name.textContent=e.displayName||('Player '+(i+1));var n=e.bonusCounts||{};var set=function(k,t){var x=box.querySelector('[data-k="'+k+'"]');if(x)x.textContent=t};set('heart','♥ ×'+(Number(e.hearts)||0));set('speed','SPD ×'+(Number(n.speed)||0));set('bomb','BMB ×'+(Number(n.bomb)||0));set('fire','FIR ×'+(Number(n.fire)||0))}
}
function installExternalStats(){
  if(!window.GameEngine||GameEngine.prototype.__qolExternalStats)return;GameEngine.prototype.__qolExternalStats=true;GameEngine.prototype.createStatHud=function(){removeCanvasHud(this);ensureStatHud();updateExternalStats()};GameEngine.prototype.updateStatHud=updateExternalStats;removeCanvasHud(G());ensureStatHud();updateExternalStats()
}

function savedControlMode(){try{var m=localStorage.getItem('BombermanTouchControlMode');return m==='arrows'?'arrows':'joystick'}catch(e){return'joystick'}}
function setControlMode(mode){Q.controlMode=mode==='arrows'?'arrows':'joystick';document.body.classList.toggle('qol_use_dpad',Q.controlMode==='arrows');try{localStorage.setItem('BombermanTouchControlMode',Q.controlMode)}catch(e){}var j=$('qolJoystickMode'),a=$('qolArrowMode');if(j){j.classList.toggle('active',Q.controlMode==='joystick');j.setAttribute('aria-pressed',Q.controlMode==='joystick'?'true':'false')}if(a){a.classList.toggle('active',Q.controlMode==='arrows');a.setAttribute('aria-pressed',Q.controlMode==='arrows'?'true':'false')}
}
function mobileAction(action,down){
  if(S.guest&&S.guest()&&window.BomberOnline&&typeof BomberOnline.sendTouchAction==='function'){BomberOnline.sendTouchAction(action,!!down);return}
  if(!window.gInputEngine)return;gInputEngine.actions[action]=!!down;if(!down&&gInputEngine.listeners[action])for(var i=0;i<gInputEngine.listeners[action].length;i++)try{gInputEngine.listeners[action][i]()}catch(e){}
}
function bindDpadButton(btn){var a=btn.getAttribute('data-action'),held=false;function down(e){e.preventDefault();if(held)return;held=true;try{btn.setPointerCapture(e.pointerId)}catch(x){}mobileAction(a,true)}function up(e){e.preventDefault();if(!held)return;held=false;mobileAction(a,false)}btn.addEventListener('pointerdown',down,{passive:false});btn.addEventListener('pointerup',up,{passive:false});btn.addEventListener('pointercancel',up,{passive:false});btn.addEventListener('lostpointercapture',up,{passive:false});btn.addEventListener('selectstart',function(e){e.preventDefault()});btn.addEventListener('contextmenu',function(e){e.preventDefault()})}
function ensureDpad(){
  var controls=$('mobileControls');if(!controls)return;var d=$('qolDpad');if(!d){d=document.createElement('div');d.id='qolDpad';d.setAttribute('aria-label','Arrow controls');var dirs=[['up','up'],['down','down'],['left','left'],['right','right']];for(var i=0;i<dirs.length;i++){var b=document.createElement('button');b.type='button';b.className='qol_dpad_btn';b.dataset.dir=dirs[i][0];b.dataset.action=dirs[i][1];b.setAttribute('aria-label','Move '+dirs[i][0]);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5 4.5 16.5h15z"></path></svg>';b.draggable=false;bindDpadButton(b);d.appendChild(b)}controls.insertBefore(d,controls.firstChild)}
  d.addEventListener('selectstart',function(e){e.preventDefault()});d.addEventListener('contextmenu',function(e){e.preventDefault()})
}
function ensureTouchSettings(){
  var choice=$('lobbyChoice');if(!choice)return;var box=$('qolTouchSettings');if(!box){box=document.createElement('div');box.id='qolTouchSettings';box.innerHTML='<div class="qol_touch_head"><div><strong>Touch controls</strong><small>Choose your movement layout</small></div></div><div class="qol_touch_buttons"></div>';var row=box.querySelector('.qol_touch_buttons'),j=button('Joystick','qolJoystickMode','qol_btn'),a=button('Arrow pad','qolArrowMode','qol_btn');j.onclick=function(){setControlMode('joystick')};a.onclick=function(){setControlMode('arrows')};row.appendChild(j);row.appendChild(a);choice.insertBefore(box,choice.firstChild)}setControlMode(Q.controlMode)
}

function localAliveForControls(){var p=currentLocalPlayer();return !p||p.alive!==false}
function syncLiveUI(){
  var g=G();if(!g)return;var live=!!(g.playing&&g.menu&&!g.menu.visible&&!g.lobbyOpen&&!g.matchFinished&&!Q.postMatchOpen&&!Q.eliminatedOpen&&localAliveForControls());document.body.classList.toggle('qol_round_live',live);document.body.classList.toggle('qol_has_stats',!!(g.playing&&g.menu&&!g.menu.visible&&!g.lobbyOpen));var bar=S.els&&S.els.matchBar;document.body.classList.toggle('qol_toolbar_active',!!(bar&&!bar.hidden));updateExternalStats()
}

function forceNormalBotsImmediate(){var g=G();if(!g||!g.bots)return;for(var i=0;i<g.bots.length;i++){var b=g.bots[i];if(b&&!b.simulatedHuman){b.started=true;b.startTimer=b.startTimerMax||0}}}
function holdSimulatedOnly(ms){var g=G();if(!g)return;g.__v0118OpeningHold=false;forceNormalBotsImmediate();var sim=g.simulatedOpponent;if(!sim)return;sim.__v0118OpeningHold=true;sim.started=false;sim.startTimer=0;var serial=++Q.simIntroSerial;setTimeout(function(){if(serial!==Q.simIntroSerial||S.role!=='simulated')return;var gg=G(),ss=gg&&gg.simulatedOpponent;if(ss){ss.__v0118OpeningHold=false;ss.started=true;ss.startTimer=ss.startTimerMax||0}},ms||1000)}
function installOpeningDelayFix(){
  if(S.__qolOpeningFix)return;S.__qolOpeningFix=true;var baseSimSay=S.simSay;S.simSay=function(pool){if(pool===S.SIM_START&&Date.now()<Q.simIntroBlockUntil)return;return baseSimSay.apply(S,arguments)};var oldStartSim=S.startSimulated;S.startSimulated=function(){var r=oldStartSim.apply(S,arguments);if(S.role==='simulated'){Q.simIntroBlockUntil=Date.now()+6500;holdSimulatedOnly(1000);var serial=Q.simIntroSerial;setTimeout(function(){if(serial!==Q.simIntroSerial||S.role!=='simulated')return;try{baseSimSay.call(S,S.SIM_START)}catch(e){}},1000)}return r};var oldStartHost=S.startHostMatch;S.startHostMatch=function(){var r=oldStartHost.apply(S,arguments);setTimeout(forceNormalBotsImmediate,0);return r}
}

function restartLocalRound(){var g=G();if(!g)return;closeRoundOverlays();var b=$('spectatorBanner');if(b)hide(b);g.matchFinished=false;g.spectatorFinished=false;g.spectatorMode=false;if(g.menu)g.menu.hide();g.restart();forceNormalBotsImmediate();syncLiveUI()}
function restartGuestRound(){if(window.BomberDataSync){BomberDataSync.localAuthority=null;BomberDataSync.lastSeq=0}restartLocalRound()}
function restartSimulatedRound(){restartLocalRound();holdSimulatedOnly(1000)}
function startOnlineRematchAsHost(){if(!(S.host&&S.host())||!S.conn||!S.conn.open)return;Q.rematchWaiting=false;restartLocalRound();S.send({type:'qolRematchStart'});var st=$('qolPostMatch')&&$('qolPostMatch').querySelector('.qol_status');if(st)st.textContent='Rematch started.'}

function setPostStatus(text){var o=$('qolPostMatch');if(o){var s=o.querySelector('.qol_status');if(s)s.textContent=text||''}}
function requestRematch(){
  if(isSimulated()){Q.rematchWaiting=true;var rb=$('qolReplayBtn');if(rb){rb.disabled=true;rb.textContent='Opponent deciding…'}setPostStatus('Rematch requested…');setTimeout(function(){if(!Q.rematchWaiting||S.role!=='simulated')return;Q.rematchWaiting=false;restartSimulatedRound()},2000);return}
  if(!isOnline()||!S.conn||!S.conn.open){setPostStatus('Opponent is no longer connected.');return}
  Q.rematchWaiting=true;var b=$('qolReplayBtn');if(b){b.disabled=true;b.textContent='Waiting for opponent…'}setPostStatus('Rematch request sent.');S.send({type:'qolRematchRequest',name:S.localName})
}

function showRematchPrompt(name){
  ensureOverlays();Q.rematchPromptOpen=true;var o=$('qolRematchPrompt');o.querySelector('.qol_title').textContent='Rematch?';o.querySelector('.qol_copy').textContent=(name||'Your opponent')+' wants to play again.';o.querySelector('.qol_status').textContent='';show(o)
}
function resolveRematchPrompt(accept){
  var wasOpen=Q.rematchPromptOpen;Q.rematchPromptOpen=false;hide($('qolRematchPrompt'));if(!wasOpen)return;
  if(!accept){S.send({type:'qolRematchResponse',accepted:false});return}
  if(S.host&&S.host()){S.send({type:'qolRematchResponse',accepted:true});setTimeout(startOnlineRematchAsHost,100)}else{S.send({type:'qolRematchResponse',accepted:true})}
}
function handleRematchRequest(d){
  if(Q.rematchWaiting){if(S.host&&S.host()){S.send({type:'qolRematchResponse',accepted:true});setTimeout(startOnlineRematchAsHost,100)}else S.send({type:'qolRematchResponse',accepted:true});return}
  showRematchPrompt((d&&d.name)||S.remoteName)
}
function handleRematchResponse(d){
  if(!Q.rematchWaiting)return;Q.rematchWaiting=false;if(!d.accepted){var rb=$('qolReplayBtn');if(rb){rb.disabled=false;rb.textContent='Replay opponent'}setPostStatus('Opponent declined the rematch.');return}if(S.host&&S.host())startOnlineRematchAsHost();else setPostStatus('Opponent accepted. Starting…')
}

function startRandomMatch(){
  if(isOnline())try{S.send({type:'qolOpponentLeft'})}catch(e){}closeRoundOverlays();Q.simIntroSerial++;var g=G();if(g){g.lobbyOpen=true;g.simulatedOpponentMode=false;if(g.menu)g.menu.hide()}if(S.els&&S.els.matchBar)S.els.matchBar.hidden=true;if(S.els&&S.els.lobby)S.els.lobby.hidden=false;var pub=S.els&&S.els.publicBtn;if(pub&&typeof pub.onclick==='function'){pub.onclick()}else if(window.BomberOnline&&BomberOnline.openLobby){BomberOnline.openLobby()}syncLiveUI()
}
function backToMenu(){
  try{if(isOnline())S.send({type:'qolOpponentLeft'})}catch(e){}closeRoundOverlays();Q.simIntroSerial++;try{S.destroyNetwork()}catch(e){}try{S.setRole('offline')}catch(e){}S.kind='';if(S.els){hide(S.els.lobby);hide(S.els.matchBar);hide(S.els.remoteStage);show(S.els.localStage)}var g=G();if(g){g.lobbyOpen=false;g.simulatedOpponentMode=false;g.spectatorMode=false;g.spectatorFinished=false;g.matchFinished=false;if(g.menu)g.menu.show()}syncLiveUI()
}

function installNetworkQol(){
  if(S.__qolNetwork)return;S.__qolNetwork=true;var oldHostData=S.hostData;S.hostData=function(d){if(d&&d.type==='qolRematchRequest'){handleRematchRequest(d);return}if(d&&d.type==='qolRematchResponse'){handleRematchResponse(d);return}if(d&&d.type==='qolOpponentLeft'){showPostMatch('Opponent left');setPostStatus('Your opponent returned to matchmaking or the menu.');return}return oldHostData.call(S,d)};
  var oldGuestData=S.guestData;S.guestData=function(d){if(d&&d.type==='qolRematchRequest'){handleRematchRequest(d);return}if(d&&d.type==='qolRematchResponse'){handleRematchResponse(d);return}if(d&&d.type==='qolRematchStart'){restartGuestRound();return}if(d&&d.type==='qolOpponentLeft'){showPostMatch('Opponent left');setPostStatus('Your opponent returned to matchmaking or the menu.');return}var r=oldGuestData.call(S,d);if(d&&d.type==='start')setTimeout(forceNormalBotsImmediate,0);if(d&&d.type==='spectate'&&isDataGuest())showEliminated(d.title||'You’re out');if(d&&d.type==='matchEnd'&&isDataGuest()){var g=G();if(g&&g.menu)g.menu.hide();showPostMatch(d.text||'Round over')}return r}
}

function installRoundFlow(){
  if(!window.GameEngine||GameEngine.prototype.__qolRoundFlow)return;GameEngine.prototype.__qolRoundFlow=true;
  var oldMultiSpec=GameEngine.prototype.beginMultiplayerSpectating;GameEngine.prototype.beginMultiplayerSpectating=function(playerIndex){var r=oldMultiSpec.apply(this,arguments);var localIndex=S.role==='guest'?1:0;if(playerIndex===localIndex)showEliminated('You’re out');return r};
  var oldSpec=GameEngine.prototype.beginSpectating;GameEngine.prototype.beginSpectating=function(){var r=oldSpec.apply(this,arguments);if(isSimulated())showEliminated('You’re out');return r};
  var oldFinish=GameEngine.prototype.finishCompetitiveMatch;GameEngine.prototype.finishCompetitiveMatch=function(){if(this.matchFinished)return;var result=this.getLastLivingContestantLabel?this.getLastLivingContestantLabel():'Round over';var r=oldFinish.apply(this,arguments);if(this.menu)this.menu.hide();showPostMatch(result);return r};
  var oldFinishSpec=GameEngine.prototype.finishSpectating;GameEngine.prototype.finishSpectating=function(result){var r=oldFinishSpec.apply(this,arguments);if(isSimulated())showPostMatch(result||'Round over');return r};
  var oldGameOver=GameEngine.prototype.gameOver;GameEngine.prototype.gameOver=function(status){var r=oldGameOver.apply(this,arguments);if(isSimulated()){var result=status==='win'?'You won!':'Round over';if(this.menu)this.menu.hide();showPostMatch(result)}return r}
}

function install(){
  if(!window.GameEngine||!window.Player||!window.Bot||!window.BomberOnline||!S.__dataSyncInstalled||!S.els||!S.els.lobby||!S.els.publicBtn||!$('nameSetupPanel'))return false;if(Q.installed)return true;Q.installed=true;addStyle();showVersion();ensureOverlays();ensureDpad();Q.controlMode=savedControlMode();ensureTouchSettings();setControlMode(Q.controlMode);installExternalStats();installOpeningDelayFix();installNetworkQol();installRoundFlow();syncLiveUI();return true
}

showVersion();var tries=0,t=setInterval(function(){showVersion();ensureDpad();ensureTouchSettings();if(install()||++tries>500)clearInterval(t)},40);setInterval(function(){showVersion();syncLiveUI()},120);['pageshow','focus','visibilitychange','resize','orientationchange'].forEach(function(ev){window.addEventListener(ev,function(){showVersion();syncLiveUI()},{passive:true})});

})();
