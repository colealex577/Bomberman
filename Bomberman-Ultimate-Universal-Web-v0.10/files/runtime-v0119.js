(function(){
'use strict';
var VERSION='v0.11.9',installed=false,publicSearching=false,publicIndex=0,publicGeneration=0;

function $(id){return document.getElementById(id)}
function savedName(){try{var n=localStorage.getItem('BombermanPlayerName');return n?String(n).replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,14):''}catch(e){return''}}
function showVersion(){
  var old=$('buildVersion');if(old){old.style.setProperty('display','none','important')}
  var v=$('buildVersion119');if(!v){v=document.createElement('div');v.id='buildVersion119';v.setAttribute('aria-label','Game version');(document.body||document.documentElement).appendChild(v)}
  v.textContent=VERSION;var s=v.style;function imp(k,val){try{s.setProperty(k,val,'important')}catch(e){s[k]=val}}
  imp('position','fixed');imp('top','calc(env(safe-area-inset-top, 0px) + 5px)');imp('left','calc(env(safe-area-inset-left, 0px) + 6px)');imp('right','auto');imp('bottom','auto');imp('z-index','2147483647');imp('display','block');imp('visibility','visible');imp('opacity','1');imp('transform','none');imp('margin','0');imp('padding','2px 5px');imp('border-radius','4px');imp('background','rgba(0,0,0,.62)');imp('color','rgba(255,255,255,.92)');imp('font','700 9px/1.25 Arial,sans-serif');imp('pointer-events','none');
}
function ready(){return !!(window.B115&&window.BomberOnline&&B115.els&&B115.PUBLIC&&B115.connectFresh&&B115.startPrivateHost&&B115.startPrivateJoin)}
function cleanName(v){v=String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim();return v.slice(0,14)}
function forceNormal(){
  var S=window.B115;if(S){S.ultimate=false}
  if(window.gGameEngine){gGameEngine.ultimateMode=false;if(gGameEngine.setMusicRate)gGameEngine.setMusicRate(1)}
  var m=$('gameMusic');if(m)try{m.playbackRate=1}catch(e){}
}
function removeUltimateUI(){
  ['ultimateModeBtn','ultimateModeHint'].forEach(function(id){var e=$(id);if(e&&e.parentNode)e.parentNode.removeChild(e)});
}
function buildLobby(){
  var lobby=$('multiplayerLobby');if(!lobby)return;
  lobby.innerHTML='<div class="lobby_card v0119_lobby">'+
    '<div class="lobby_heading"><div><h2>Online Multiplayer</h2><p>Find a public match or play privately with a friend.</p></div><button id="lobbyCloseBtn" class="lobby_close" type="button" aria-label="Back">×</button></div>'+
    '<div id="nameSetupPanel" class="lobby_section" hidden><div class="lobby_state_icon">👤</div><h3>Choose a username</h3><p>You only need to do this once. It will be saved on this device.</p><div class="lobby_name_row"><input id="playerNameInput" type="text" maxlength="14" autocomplete="nickname" spellcheck="false" placeholder="username"><small>Shown above your character and in match chat.</small></div><div id="nameSetupStatus" class="online_status error" hidden></div><button id="saveNameBtn" class="lobby_primary" type="button">Continue</button></div>'+
    '<div id="lobbyChoice" class="lobby_choice" hidden><div class="host_customization compact_drop_settings"><div class="host_customization_header"><div><strong>Item drops</strong><small>Chance a destroyed block contains a power-up</small></div><span id="dropRateValue" class="drop_rate_value">16% · DEFAULT</span></div><input id="dropRateSlider" class="drop_rate_slider" type="range" min="16" max="100" step="1" value="16"><div class="drop_rate_scale"><span>16%</span><span>100%</span></div><div id="dropRateNote" class="drop_rate_note">Chance a destroyed block contains a power-up.</div></div><button id="publicMatchBtn" class="lobby_primary" type="button">Search Public Match<small>Find an opponent automatically</small></button><button id="privateMatchBtn" class="lobby_primary" type="button">Private Match<small>Use a one-digit access code (1–9)</small></button><button id="localMultiBtn" class="lobby_secondary" type="button">Play Local Multiplayer</button></div>'+
    '<div id="privateMatchPanel" class="lobby_section" hidden><div class="lobby_state_icon">🔒</div><h3>Private Match</h3><p>Pick one number from 1 to 9 and give your friend the same number.</p><div class="private_code_row"><label for="privateCodeInput">Access code</label><input id="privateCodeInput" type="text" inputmode="numeric" maxlength="1" placeholder="1–9"></div><div class="match_choice_grid"><button id="privateHostBtn" class="lobby_primary" type="button">Host Private</button><button id="privateJoinBtn" class="lobby_primary" type="button">Join Private</button></div><button class="lobby_secondary" type="button" data-lobby-back>Back</button></div>'+
    '<div id="onlineWaitingPanel" class="lobby_section" hidden><div class="lobby_state_icon">⌁</div><h3 id="onlineWaitTitle">Searching…</h3><p id="onlineWaitText"></p><div id="onlineStatus" class="online_status working">Searching…</div><button class="lobby_secondary" type="button" data-lobby-back>Cancel</button></div></div>';
}
function addStyle(){
  if($('v0119-style'))return;var st=document.createElement('style');st.id='v0119-style';st.textContent='#buildVersion{display:none!important}.v0119_lobby .lobby_choice{gap:9px}.v0119_lobby .compact_drop_settings{margin:0 0 10px;padding:9px 11px}.v0119_lobby .compact_drop_settings .host_customization_header{margin-bottom:5px;align-items:center}.v0119_lobby #nameSetupPanel .lobby_name_row{margin:10px 0 4px}.v0119_lobby #nameSetupPanel .lobby_primary{width:100%;min-height:46px;margin-top:8px}.v0119_lobby #lobbyChoice .lobby_primary{min-height:67px}.v0119_lobby .lobby_heading p{margin-bottom:0}.game_toolbar:empty{display:none!important}';document.head.appendChild(st)
}
function refreshEls(){
  var S=B115,E=S.els;
  E.lobby=$('multiplayerLobby');E.panel_name=$('nameSetupPanel');E.panel_choice=$('lobbyChoice');E.panel_private=$('privateMatchPanel');E.panel_waiting=$('onlineWaitingPanel');E.panel_public=null;
  E.status=$('onlineStatus');E.waitTitle=$('onlineWaitTitle');E.waitText=$('onlineWaitText');E.name=$('playerNameInput');E.nameStatus=$('nameSetupStatus');E.saveName=$('saveNameBtn');E.privateCode=$('privateCodeInput');E.publicBtn=$('publicMatchBtn');E.privateBtn=$('privateMatchBtn');E.privateHost=$('privateHostBtn');E.privateJoin=$('privateJoinBtn');E.localBtn=$('localMultiBtn');E.close=$('lobbyCloseBtn');E.back=document.querySelectorAll('[data-lobby-back]');E.drop=$('dropRateSlider');E.dropValue=$('dropRateValue');E.dropNote=$('dropRateNote');E.ultimate=null;E.ultimateLobby=null;
  E.localStage=$('localStage');E.remoteStage=$('remoteStage');E.video=$('remoteVideo');E.remoteSpec=$('remoteSpectatorBanner');E.remoteSpecTitle=$('remoteSpectatorTitle');E.remoteSpecSub=$('remoteSpectatorSubtitle');E.matchBar=$('onlineMatchBar');E.matchStatus=$('onlineMatchStatus');E.disconnect=$('onlineDisconnectBtn');E.chatToggle=$('chatToggleBtn');E.chatToast=$('chatToast');E.chatPanel=$('chatPanel');E.chatClose=$('chatCloseBtn');E.chatMessages=$('chatMessages');E.chatForm=$('chatForm');E.chatInput=$('chatInput');
}
function panel(name){['name','choice','private','waiting'].forEach(function(x){var e=B115.els['panel_'+x];if(e)e.hidden=x!==name})}
function setSavedName(){
  var S=B115,E=S.els,raw=cleanName(E.name&&E.name.value);if(!raw){if(E.nameStatus){E.nameStatus.textContent='Enter a username to continue.';E.nameStatus.hidden=false}if(E.name)E.name.focus();return}
  S.localName=raw;if(E.name)E.name.value=raw;if(E.nameStatus)E.nameStatus.hidden=true;try{localStorage.setItem('BombermanPlayerName',raw)}catch(e){}panel('choice');S.status('')
}
function openLobby(){
  var S=B115;S.destroyNetwork();publicSearching=false;S.setRole('offline');S.kind='';S.code='';forceNormal();if(window.gGameEngine){gGameEngine.lobbyOpen=true;gGameEngine.simulatedOpponentMode=false;if(gGameEngine.menu)gGameEngine.menu.hide()}S.els.lobby.hidden=false;S.status('');var n=savedName();if(n){S.localName=n;if(S.els.name)S.els.name.value=n;panel('choice')}else{if(S.els.name)S.els.name.value='';if(S.els.nameStatus)S.els.nameStatus.hidden=true;panel('name');setTimeout(function(){if(S.els.name)S.els.name.focus()},80)}
}
function closeLobby(){
  var S=B115;S.destroyNetwork();publicSearching=false;S.setRole('offline');S.kind='';forceNormal();if(window.gGameEngine){gGameEngine.lobbyOpen=false;gGameEngine.simulatedOpponentMode=false}S.els.lobby.hidden=true;if(window.gGameEngine&&gGameEngine.menu)gGameEngine.menu.show();S.ensureMusic()
}
function back(){B115.destroyNetwork();publicSearching=false;B115.setRole('offline');B115.kind='';panel('choice');B115.status('')}
function localMulti(){var S=B115;S.destroyNetwork();publicSearching=false;S.kind='';S.setRole('offline');S.els.lobby.hidden=true;S.els.matchBar.hidden=true;forceNormal();if(window.gGameEngine){gGameEngine.simulatedOpponentMode=false;gGameEngine.playerNames=['Player 1','Player 2'];gGameEngine.lobbyOpen=false;gGameEngine.menu.setMode('multi');S.ensureMusic()}}
function showPrivate(){B115.readName();panel('private');B115.status('Choose a one-digit code from 1–9 and share it with your friend.','')}
function cleanupAttempt(){var S=B115;try{if(S.conn)S.conn.close()}catch(e){}try{if(S.peer)S.peer.destroy()}catch(e){}S.conn=S.peer=null}
function claimOrJoin(i,g){
  var S=B115;if(!publicSearching||g!==S.generation||S.started||S.kind!=='public')return;if(i>=S.PUBLIC.length){setTimeout(function(){claimOrJoin(0,g)},350);return}publicIndex=i+1;cleanupAttempt();S.setRole('host');S.status('Searching public matches…','working');var id=S.PUBLIC[i],p=new Peer(id,S.ICE);S.peer=p;S.recover(p);
  p.on('open',function(){if(publicSearching&&g===S.generation&&S.peer===p){S.setRole('host');S.status('Waiting for public player…','working')}});
  p.on('connection',function(c){if(!publicSearching||g!==S.generation||S.peer!==p||!S.host()){try{c.close()}catch(e){}return}S.acceptHost(c)});
  p.on('error',function(e){if(S.peer!==p)return;var type=e&&e.type;if(type==='unavailable-id'){try{p.destroy()}catch(x){}if(S.peer===p)S.peer=null;S.setRole('guest');S.status('Player found • connecting…','good');S.connectFresh(id,g,function(ok){if(!ok&&publicSearching&&g===S.generation){S.setRole('host');claimOrJoin(i+1,g)}})}else{try{p.destroy()}catch(x){}if(S.peer===p)S.peer=null;claimOrJoin(i+1,g)}})
}
function startPublic(){
  var S=B115;S.destroyNetwork();S.readName();publicSearching=true;publicIndex=0;S.kind='public';S.code='';S.setRole('host');S.waiting('Searching public match','Looking for an available opponent…');S.status('Searching public matches…','working');S.startFallback();publicGeneration=S.generation;forceNormal();S.loadPeer(function(){claimOrJoin(0,publicGeneration)})
}
function resumePublic(){var S=B115;if(!publicSearching||S.started||S.kind!=='public')return;cleanupAttempt();S.setRole('host');setTimeout(function(){claimOrJoin(publicIndex,publicGeneration)},80)}
function preGuestStart(){var S=B115;if(window.gGameEngine){gGameEngine.lobbyOpen=false;gGameEngine.playing=true;if(gGameEngine.menu)gGameEngine.menu.hide()}if(S.els.lobby)S.els.lobby.hidden=true;if(S.els.localStage)S.els.localStage.hidden=true;if(S.els.remoteStage)S.els.remoteStage.hidden=false}
function install(){
  if(installed||!ready())return false;installed=true;var S=B115;showVersion();addStyle();removeUltimateUI();forceNormal();buildLobby();refreshEls();
  S.panel=panel;
  S.render=function(){forceNormal();if(S.els.drop){S.els.drop.value=S.dropRate;S.els.drop.disabled=S.guest();if(S.els.dropValue)S.els.dropValue.textContent=S.dropRate===16?'16% · DEFAULT':S.dropRate+'%';if(S.els.dropNote)S.els.dropNote.textContent='Chance a destroyed block contains a power-up.'}};
  S.applyMode=function(){forceNormal();S.render()};
  var oldGuestData=S.guestData;S.guestData=function(d){if(d&&d.type==='reject'&&publicSearching&&!S.started){resumePublic();return}if(d&&d.type==='start')preGuestStart();return oldGuestData.call(S,d)};
  var oldStartHostMatch=S.startHostMatch;S.startHostMatch=function(id,name){publicSearching=false;forceNormal();return oldStartHostMatch.call(S,id,name)};
  var oldStartSim=S.startSimulated;S.startSimulated=function(){publicSearching=false;forceNormal();return oldStartSim.apply(S,arguments)};
  S.els.publicBtn.onclick=startPublic;S.els.privateBtn.onclick=showPrivate;S.els.privateHost.onclick=S.startPrivateHost;S.els.privateJoin.onclick=S.startPrivateJoin;S.els.localBtn.onclick=localMulti;S.els.close.onclick=closeLobby;S.els.saveName.onclick=setSavedName;
  for(var i=0;i<S.els.back.length;i++)S.els.back[i].onclick=back;
  S.els.privateCode.oninput=function(){this.value=this.value.replace(/[^1-9]/g,'').slice(0,1)};
  S.els.drop.oninput=function(){if(!S.guest())S.applyDrop(this.value,false)};
  S.els.name.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();setSavedName()}});
  if(S.els.disconnect){S.els.disconnect.onclick=function(){S.destroyNetwork();publicSearching=false;S.kind='';S.els.matchBar.hidden=true;S.els.remoteStage.hidden=true;S.els.localStage.hidden=false;S.setRole('offline');forceNormal();if(window.gGameEngine){gGameEngine.simulatedOpponentMode=false;gGameEngine.lobbyOpen=false;gGameEngine.menu.show();S.ensureMusic()}}}
  window.BomberOnline.openLobby=openLobby;
  S.setRole('offline');S.applyDrop(S.dropRate||16,true);forceNormal();return true
}
showVersion();var tries=0,t=setInterval(function(){showVersion();if(install()||++tries>500)clearInterval(t)},40);setInterval(showVersion,600);['pageshow','focus','visibilitychange'].forEach(function(ev){window.addEventListener(ev,showVersion,{passive:true})});
})();
