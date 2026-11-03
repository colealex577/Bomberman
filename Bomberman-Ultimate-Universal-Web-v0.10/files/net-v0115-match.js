(function(){
'use strict';
var S=window.B115;if(!S)return;

S.PRIVATE_PROTOCOL='private-v2-authoritative-1';
S.panel=function(n){['choice','public','private','waiting'].forEach(function(x){var e=S.els['panel_'+x];if(e)e.hidden=x!==n})};
S.waiting=function(t,b){S.panel('waiting');if(S.els.waitTitle)S.els.waitTitle.textContent=t;if(S.els.waitText)S.els.waitText.textContent=b||''};
S.clearFallback=function(){if(S.fallback)clearInterval(S.fallback);S.fallback=null};
S.startFallback=function(){S.clearFallback();var end=Date.now()+20000;S.fallback=setInterval(function(){if(S.started||!S.online()){S.clearFallback();return}var n=Math.max(0,Math.ceil((end-Date.now())/1000));S.status((S.host()?'Waiting for public player':'Searching public matches')+' • simulated fallback in '+n+'s','working');if(n<=0){S.clearFallback();S.startSimulated()}},1000)};

/* Existing public connection acceptance remains unchanged. */
S.acceptHost=function(c){
 if(!c)return;
 var md=c.metadata||{},token=String(md.token||''),sameToken=!!(token&&S.remoteSessionToken&&token===S.remoteSessionToken),sameFallback=S.cleanName(md.name||'')===S.cleanName(S.remoteName||'')&&(!md.kind||md.kind===S.kind)&&(!S.code||!md.code||String(md.code)===String(S.code)),resume=!!(S.started&&md.resume&&(sameToken||(!S.remoteSessionToken&&sameFallback)));
 if(S.conn&&S.conn.open&&S.conn!==c&&!resume){try{c.send({type:'reject'})}catch(e){}try{c.close()}catch(e){}return}
 if(S.conn&&S.conn!==c){var old=S.conn;S.conn=null;try{old.close()}catch(e){}}
 if(!S.started&&token)S.remoteSessionToken=token;else if(resume&&token)S.remoteSessionToken=token;
 S.conn=c;
 c.on('open',function(){if(S.conn!==c)return;S.clearFallback();S.startHeartbeat();S.status(S.started?'Player reconnected • resynchronizing…':'Player found • completing handshake…','good');S.send({type:'hostHello',name:S.localName,ultimate:S.ultimate,dropRate:S.dropRate,kind:S.kind,code:S.code,resume:!!S.started})});
 c.on('data',function(d){if(S.conn===c){S.noteNetwork();S.hostData(d)}});
 c.on('close',function(){if(S.conn!==c)return;S.stopHeartbeat();S.conn=null;if(S.started&&S.els.matchStatus)S.els.matchStatus.textContent='PLAYER 2 RECONNECTING…'});
 c.on('error',function(e){if(S.conn===c)S.status('Connection error: '+((e&&e.type)||'unknown'),'error')})
};

function clearPrivateHello(c){if(c&&c.__privateHelloTimer){clearInterval(c.__privateHelloTimer);c.__privateHelloTimer=null}}
function rejectPrivate(c,reason){try{c.send({type:'privateReject',reason:reason||'Private connection rejected.'})}catch(e){}setTimeout(function(){try{c.close()}catch(e){}},20)}
function privateHello(c){
 if(!c||!c.open||S.conn!==c||!S.host()||S.kind!=='private')return;
 try{c.send({type:'privateHostHello',protocol:S.PRIVATE_PROTOCOL,build:window.BomberBuildVersion||'',code:S.code,roomEpoch:S.privateRoomEpoch,name:S.localName,ultimate:S.ultimate,dropRate:S.dropRate,resume:!!S.started})}catch(e){}
}

/* Private rooms use one direct, persistent data connection. No public/reverse race. */
S.acceptPrivateHost=function(c){
 if(!c||!S.host()||S.kind!=='private'){try{c&&c.close()}catch(e){}return}
 var md=c.metadata||{},code=String(md.code||''),protocol=String(md.privateProtocol||''),token=String(md.token||''),resume=!!md.resume;
 if(code!==String(S.code)){rejectPrivate(c,'Wrong private room code.');return}
 if(protocol!==S.PRIVATE_PROTOCOL){rejectPrivate(c,'Private multiplayer version mismatch.');return}
 var sameToken=!!(token&&S.remoteSessionToken&&token===S.remoteSessionToken);
 if(S.started&&!resume){rejectPrivate(c,'Private match already in progress.');return}
 if(S.started&&S.remoteSessionToken&&!sameToken){rejectPrivate(c,'Private reconnect token mismatch.');return}
 if(S.conn&&S.conn.open&&S.conn!==c){
   if(!(S.started&&resume&&sameToken)){rejectPrivate(c,'Private room already has a player.');return}
   var old=S.conn;S.conn=null;try{old.close()}catch(e){}
 }
 S.conn=c;S.privateHandshakeComplete=false;
 if(token)S.remoteSessionToken=token;
 function onOpen(){
   if(S.conn!==c||!S.host()||S.kind!=='private')return;
   S.clearFallback();S.startHeartbeat();
   S.status(S.started?'Friend reconnected • restoring private match…':'Friend found • synchronizing private match…','good');
   privateHello(c);clearPrivateHello(c);
   c.__privateHelloTimer=setInterval(function(){if(S.conn!==c||!c.open||S.privateHandshakeComplete){clearPrivateHello(c);return}privateHello(c)},500)
 }
 c.on('open',onOpen);
 c.on('data',function(d){if(S.conn===c){S.noteNetwork();S.hostData(d)}});
 c.on('close',function(){clearPrivateHello(c);if(S.conn!==c)return;S.stopHeartbeat();S.conn=null;S.privateHandshakeComplete=false;if(S.started&&S.els.matchStatus)S.els.matchStatus.textContent='PRIVATE • FRIEND DISCONNECTED • RECONNECTING…';else if(!S.started)S.status('Private room '+S.code+' ready • waiting for friend','good')});
 c.on('error',function(e){if(S.conn===c)S.status('Private connection error: '+((e&&e.type)||'unknown'),'error')});
 if(c.open)setTimeout(onOpen,0)
};

S.hostData=function(d){
 if(!d||typeof d!=='object')return;S.noteNetwork();
 if(d.type==='privateGuestReady'){
   if(S.kind!=='private'||!S.host()||String(d.protocol||'')!==S.PRIVATE_PROTOCOL||String(d.code||'')!==String(S.code)||String(d.roomEpoch||'')!==String(S.privateRoomEpoch||''))return;
   var token=String(d.token||'');if(S.started&&S.remoteSessionToken&&token!==S.remoteSessionToken)return;
   if(token)S.remoteSessionToken=token;
   S.privateHandshakeComplete=true;clearPrivateHello(S.conn);
   S.remoteName=S.cleanName(d.name||S.remoteName||'Player 2');
   S.send({type:'privateAccepted',protocol:S.PRIVATE_PROTOCOL,build:window.BomberBuildVersion||'',code:S.code,roomEpoch:S.privateRoomEpoch,resume:!!S.started});
   if(!S.started)S.startHostMatch(S.conn&&S.conn.peer,d.name);
   else{S.status('Friend reconnected • restoring private match…','good');if(window.BomberMultiplayer&&BomberMultiplayer.resync)BomberMultiplayer.resync('private-reconnect')}
 }else if(d.type==='guestReady'){
   /* Public/legacy path only. */
   S.remoteName=S.cleanName(d.name||S.remoteName||'Player 2');if(!S.started)S.startHostMatch(S.conn&&S.conn.peer,d.name);else{S.status('Player reconnected • restoring match…','good');S.send({type:'hostHello',name:S.localName,ultimate:S.ultimate,dropRate:S.dropRate,kind:S.kind,code:S.code,resume:true});if(window.BomberMultiplayer&&BomberMultiplayer.resync)BomberMultiplayer.resync('reconnect')}
 }else if(d.type==='key')S.remoteAction(d.action,!!d.down);
 else if(d.type==='streamAck'){S.streamAck=true;if(S.streamRetry)clearTimeout(S.streamRetry)}
 else if(d.type==='streamRetry'){S.streamAck=false;S.streamTo(S.conn.peer,0)}
 else if(d.type==='chat')S.appendChat(S.remoteName,d.text,false);
 else if(d.type==='ping')S.send({type:'pong',at:d.at||0});
 else if(d.type==='pong')S.lastPongAt=Date.now()
};

/* Public matchmaking intentionally preserved. */
S.startPublicHost=function(){S.destroyNetwork();S.readName();S.kind='public';S.setRole('host');S.waiting('Hosting public match','Waiting for another public player. If nobody arrives, a simulated opponent joins automatically.');S.status('Opening public host slot…','working');S.startFallback();S.loadPeer(function(){S.claimPublic(0)})};
S.claimPublic=function(i){if(!S.host()||S.kind!=='public')return;if(i>=S.PUBLIC.length){S.status('Public host slots are busy • simulated fallback remains active','warn');return}var p=new Peer(S.PUBLIC[i],S.ICE);S.peer=p;S.recover(p);p.on('open',function(){if(S.peer===p)S.status('Public lobby open • waiting for player…','working')});p.on('connection',function(c){if(S.peer===p&&S.host())S.acceptHost(c);else try{c.close()}catch(e){}});p.on('error',function(e){if(S.peer!==p)return;if(e&&e.type==='unavailable-id'){try{p.destroy()}catch(x){}S.peer=null;S.claimPublic(i+1)}else S.status('Host error: '+((e&&e.type)||'unknown'),'error')})};

S.startPrivateHost=function(){
 var code=String((S.els.privateCode&&S.els.privateCode.value)||'').trim();if(!/^[1-9]$/.test(code)){S.status('Enter one number from 1 to 9.','error');return}
 S.destroyNetwork();S.readName();S.code=code;S.kind='private';S.privateRoomEpoch=S.makeSessionToken();S.privateHandshakeComplete=false;S.ensureSessionToken();S.setRole('host');
 S.waiting('Private match • code '+code,'Your friend should choose Private → Join and enter '+code+'.');S.status('Opening private room '+code+'…','working');
 var generation=S.generation;
 S.loadPeer(function(){
   if(generation!==S.generation||!S.host()||S.kind!=='private'||S.code!==code)return;
   var p=new Peer(S.privateId(code),S.ICE);S.peer=p;S.recover(p);
   p.on('open',function(){if(S.peer===p&&generation===S.generation)S.status('Private room '+code+' ready • waiting for friend','good')});
   p.on('connection',function(c){if(S.peer===p&&generation===S.generation&&S.host()&&S.kind==='private')S.acceptPrivateHost(c);else try{c.close()}catch(e){}});
   p.on('error',function(e){if(S.peer!==p||generation!==S.generation)return;S.status(e&&e.type==='unavailable-id'?'Code '+code+' is already being hosted. Choose Join if that is your friend.':'Private host error: '+((e&&e.type)||'unknown'),'error')})
 })
};

function connectPublicFresh(id,generation,done){
 if(generation!==S.generation)return done(false);S.ensureSessionToken();try{if(S.peer)S.peer.destroy()}catch(e){}S.peer=S.conn=null;
 var p=new Peer(S.ICE),finished=false,timer=null;S.peer=p;S.recover(p);
 function fail(){if(finished)return;finished=true;if(timer)clearTimeout(timer);try{p.destroy()}catch(e){}if(S.peer===p)S.peer=null;if(S.conn&&S.conn.peer===id)S.conn=null;done(false)}
 p.on('open',function(){if(generation!==S.generation)return fail();var c=p.connect(id,{serialization:'json',reliable:true,metadata:{kind:S.kind,code:S.code,name:S.localName,resume:!!S.started,token:S.sessionToken}});S.conn=c;
   function success(){if(finished)return;finished=true;if(timer)clearTimeout(timer);S.connectedHostId=id;S.startHeartbeat();done(true)}
   c.on('open',function(){if(S.conn!==c)return;S.status(S.started?'Reconnected • resynchronizing…':'Host found • connecting…','good');S.send({type:'guestReady',name:S.localName,kind:S.kind,code:S.code,resume:!!S.started,token:S.sessionToken});success()});
   c.on('data',function(d){if(S.conn===c){S.noteNetwork();S.guestData(d)}});c.on('error',function(){if(!c.open)fail()});c.on('close',function(){if(S.conn!==c)return;S.stopHeartbeat();S.conn=null;if(S.started){if(S.els.matchStatus)S.els.matchStatus.textContent='RECONNECTING TO HOST…';S.reconnectGuest()}else if(!finished)fail()});timer=setTimeout(function(){if(!c.open)fail()},6200)
 });
 p.on('call',S.incomingCall);p.on('error',function(){fail()})
}

function connectPrivateFresh(id,generation,done){
 if(generation!==S.generation)return done(false);S.ensureSessionToken();
 try{if(S.peer)S.peer.destroy()}catch(e){}S.peer=S.conn=null;S.privateHandshakeComplete=false;
 var p,finished=false,timer=null,c=null,readyTimer=null,startProbe=null,helloSeen=false,accepted=false;
 function clearProbe(){if(startProbe)clearInterval(startProbe);startProbe=null}
 function clearLocal(){if(timer)clearTimeout(timer);timer=null;if(readyTimer)clearInterval(readyTimer);readyTimer=null;clearProbe()}
 function fail(reason){if(finished)return;finished=true;clearLocal();try{c&&c.close()}catch(e){}try{p&&p.destroy()}catch(e){}if(S.peer===p)S.peer=null;if(S.conn===c)S.conn=null;if(reason)S.status(reason,'working');done(false)}
 function probeStart(){if(generation!==S.generation||!S.guest()||S.kind!=='private'||S.started||S.conn!==c||!c||!c.open){clearProbe();return}try{c.send({type:'privateGuestReady',protocol:S.PRIVATE_PROTOCOL,build:window.BomberBuildVersion||'',code:S.code,roomEpoch:S.privateRoomEpoch,name:S.localName,resume:false,token:S.sessionToken})}catch(e){}}
 function success(){if(finished)return;finished=true;accepted=true;if(timer)clearTimeout(timer);timer=null;if(readyTimer)clearInterval(readyTimer);readyTimer=null;S.privateHandshakeComplete=true;S.connectedHostId=id;S.startHeartbeat();startProbe=setInterval(probeStart,1000);done(true)}
 function sendReady(){if(!c||!c.open||!helloSeen||accepted||S.conn!==c)return;try{c.send({type:'privateGuestReady',protocol:S.PRIVATE_PROTOCOL,build:window.BomberBuildVersion||'',code:S.code,roomEpoch:S.privateRoomEpoch,name:S.localName,resume:!!S.started,token:S.sessionToken})}catch(e){}}
 try{p=new Peer(S.ICE)}catch(e){return done(false)}
 S.peer=p;S.recover(p);
 p.on('open',function(){
   if(generation!==S.generation)return fail();
   try{c=p.connect(id,{serialization:'json',reliable:true,metadata:{kind:'private',code:S.code,name:S.localName,resume:!!S.started,token:S.sessionToken,privateProtocol:S.PRIVATE_PROTOCOL,build:window.BomberBuildVersion||''}})}catch(e){return fail()}
   S.conn=c;
   c.on('open',function(){if(S.conn!==c)return;S.status(S.started?'Private host found • restoring match…':'Private host found • verifying room…','good')});
   c.on('data',function(d){
     if(S.conn!==c||!d||typeof d!=='object')return;S.noteNetwork();
     if(d.type==='privateHostHello'){
       if(String(d.protocol||'')!==S.PRIVATE_PROTOCOL||String(d.code||'')!==String(S.code)){fail('Private room version mismatch • both players need this build');return}
       helloSeen=true;S.privateRoomEpoch=String(d.roomEpoch||'');sendReady();if(!readyTimer)readyTimer=setInterval(sendReady,500)
     }else if(d.type==='privateAccepted'){
       if(String(d.protocol||'')!==S.PRIVATE_PROTOCOL||String(d.code||'')!==String(S.code)||String(d.roomEpoch||'')!==String(S.privateRoomEpoch||'')){fail('Private handshake mismatch • retrying room '+S.code+'…');return}
       success()
     }else if(d.type==='privateReject'){fail(String(d.reason||'Private room rejected connection.')+' • retrying…');return}
     S.guestData(d)
   });
   c.on('error',function(){if(!c.open)fail()});
   c.on('close',function(){clearProbe();if(S.conn!==c)return;S.stopHeartbeat();S.conn=null;S.privateHandshakeComplete=false;if(S.started){if(S.els.matchStatus)S.els.matchStatus.textContent='PRIVATE • RECONNECTING TO HOST…';S.reconnectGuest()}else if(generation===S.generation&&S.guest()&&S.kind==='private'){S.status('Private connection interrupted • retrying room '+S.code+'…','working');if(S.retry)clearTimeout(S.retry);S.retry=setTimeout(function(){S.retry=null;if(generation===S.generation&&S.guest()&&S.kind==='private'&&!S.started)S.retryPrivate(generation)},300)}else if(!finished)fail()});
   timer=setTimeout(function(){if(!accepted)fail('Private handshake timed out • retrying room '+S.code+'…')},15000)
 });
 p.on('error',function(e){if(e&&e.type==='peer-unavailable')fail();else if(!finished)fail()})
}

S.connectFresh=function(id,generation,done){return S.kind==='private'?connectPrivateFresh(id,generation,done):connectPublicFresh(id,generation,done)};
S.reconnectGuest=function(){if(!S.guest()||!S.started||!S.connectedHostId||S.reconnectTimer||S.reconnectInFlight)return;var generation=S.generation,id=S.connectedHostId;S.reconnectTimer=setTimeout(function(){S.reconnectTimer=null;if(generation!==S.generation||!S.guest()||!S.started||S.connectionHealthy&&S.connectionHealthy())return;S.status(S.kind==='private'?'Reconnecting to private host…':'Reconnecting to host…','working');S.reconnectInFlight=true;S.connectFresh(id,generation,function(ok){S.reconnectInFlight=false;if(!ok&&generation===S.generation&&S.guest()&&S.started)S.reconnectGuest()})},450)};

S.startPublicJoin=function(){S.destroyNetwork();S.readName();S.kind='public';S.setRole('guest');S.waiting('Finding public match','Searching public host slots. If none answers, a simulated opponent joins automatically.');S.status('Searching public matches…','working');S.startFallback();var g=S.generation;S.loadPeer(function(){S.scanPublic(0,g)})};
S.scanPublic=function(i,g){if(g!==S.generation||!S.guest()||S.kind!=='public')return;if(i>=S.PUBLIC.length){S.retry=setTimeout(function(){S.scanPublic(0,g)},800);return}S.status('Searching public lobby '+(i+1)+'/'+S.PUBLIC.length+'…','working');S.connectFresh(S.PUBLIC[i],g,function(ok){if(!ok)S.scanPublic(i+1,g)})};

S.startPrivateJoin=function(){
 var code=String((S.els.privateCode&&S.els.privateCode.value)||'').trim();if(!/^[1-9]$/.test(code)){S.status('Enter one number from 1 to 9.','error');return}
 S.destroyNetwork();S.readName();S.code=code;S.kind='private';S.privateRoomEpoch='';S.privateHandshakeComplete=false;S.ensureSessionToken();S.setRole('guest');
 S.waiting('Joining private match • code '+code,'Looking for your friend. Private rooms do not use simulated fallback.');S.status('Looking for room '+code+'…','working');var g=S.generation;S.loadPeer(function(){S.retryPrivate(g)})
};
S.retryPrivate=function(g){if(g!==S.generation||!S.guest()||S.kind!=='private')return;S.connectFresh(S.privateId(S.code),g,function(ok){if(!ok&&g===S.generation&&S.guest()&&S.kind==='private'){S.status('Room '+S.code+' not found yet • retrying…','working');S.retry=setTimeout(function(){S.retryPrivate(g)},900)}})};

S.guestData=function(d){
 if(!d||typeof d!=='object')return;S.noteNetwork();
 if(d.type==='privateHostHello'){
   S.remoteName=S.cleanName(d.name||'Player 1');S.applyDrop(d.dropRate,true);S.applyMode(d.ultimate,true);S.status(d.resume?'Private host restored • synchronizing authoritative state…':'Connected to '+S.remoteName+' • synchronizing authoritative state…','good')
 }else if(d.type==='privateAccepted'){
   S.status(d.resume?'Private connection restored • loading current round…':'Private connection verified • loading match…','good')
 }else if(d.type==='hostHello'){
   S.remoteName=S.cleanName(d.name||'Player 1');S.applyDrop(d.dropRate,true);S.applyMode(d.ultimate,true);S.status(d.resume?'Reconnected to '+S.remoteName+' • syncing…':'Connected to '+S.remoteName+'…','good')
 }else if(d.type==='start'){
   S.started=true;S.clearFallback();if(d.names){S.remoteName=S.cleanName(d.names[0]);S.localName=S.cleanName(d.names[1])}S.applyDrop(d.dropRate,true);S.applyMode(d.ultimate,true);S.els.lobby.hidden=true;S.els.matchBar.hidden=false;S.els.matchStatus.textContent=(S.kind==='private'?'PRIVATE':'PUBLIC')+' • '+S.localName+' vs '+S.remoteName;S.chatVisibility();setTimeout(function(){if(!S.streamAck&&S.conn&&S.conn.open)S.send({type:'streamRetry'})},5000)
 }else if(d.type==='settings')S.applyDrop(d.dropRate,true),S.applyMode(d.ultimate,true);
 else if(d.type==='bomb')S.guestBomb();
 else if(d.type==='spectate'){S.els.remoteSpecTitle.textContent=d.title||'GAME OVER';S.els.remoteSpecSub.textContent=d.subtitle||'SPECTATING';S.els.remoteSpec.hidden=false}
 else if(d.type==='matchEnd'){S.els.remoteSpecTitle.textContent='MATCH OVER';S.els.remoteSpecSub.textContent=d.text||'ROUND COMPLETE';S.els.remoteSpec.hidden=false}
 else if(d.type==='chat')S.appendChat(S.remoteName,d.text,false);
 else if(d.type==='ping')S.send({type:'pong',at:d.at||0});
 else if(d.type==='pong')S.lastPongAt=Date.now()
};

S.incomingCall=function(c){S.call=c;c.answer();c.on('stream',function(st){S.streamAck=true;S.els.video.srcObject=st;S.els.remoteStage.hidden=false;S.els.localStage.hidden=true;S.els.lobby.hidden=true;S.els.matchBar.hidden=false;try{var p=S.els.video.play();if(p&&p.catch)p.catch(function(){})}catch(e){}S.ensureMusic();S.send({type:'streamAck'});S.chatVisibility()});c.on('error',function(){if(S.conn&&S.conn.open)S.send({type:'streamRetry'})})};
S.startHostMatch=function(id,name){if(S.started)return;S.started=true;S.clearFallback();S.remoteName=S.cleanName(name||'Player 2');if(window.gGameEngine){gGameEngine.simulatedOpponentMode=false;gGameEngine.playerNames=[S.localName,S.remoteName];gGameEngine.lobbyOpen=false;S.els.lobby.hidden=true;S.els.matchBar.hidden=false;S.els.matchStatus.textContent=(S.kind==='private'?'PRIVATE':'PUBLIC')+' • '+S.localName+' vs '+S.remoteName;gGameEngine.menu.setMode('multi')}S.send({type:'start',ultimate:S.ultimate,dropRate:S.dropRate,names:[S.localName,S.remoteName],kind:S.kind,code:S.code});S.chatVisibility();setTimeout(function(){S.streamTo(id,0)},500)};
S.streamTo=function(id,n){if(!S.host()||!S.peer||!S.conn||!S.conn.open||S.streamAck)return;var canvas=S.$('canvas');if(!canvas||!canvas.captureStream){S.els.matchStatus.textContent='STREAM ERROR — UPDATE BROWSER';return}try{if(S.call)S.call.close()}catch(e){}try{var st=canvas.captureStream(30);S.call=S.peer.call(id,st,{metadata:{type:'bomberman',attempt:n}});S.call.on('error',function(){if(n<4)S.streamRetry=setTimeout(function(){S.streamTo(id,n+1)},1200)});S.streamRetry=setTimeout(function(){if(!S.streamAck&&n<4)S.streamTo(id,n+1)},3200)}catch(e){S.status('Stream error: '+e.message,'error')}};
S.startSimulated=function(){if(S.kind!=='public'||!S.online())return;S.readName();S.remoteName=S.SIM_NAMES[Math.floor(Math.random()*S.SIM_NAMES.length)];S.destroyNetwork();S.kind='public';S.setRole('simulated');S.els.lobby.hidden=true;S.els.remoteStage.hidden=true;S.els.localStage.hidden=false;S.els.matchBar.hidden=false;S.els.matchStatus.textContent='PUBLIC • SIMULATED • '+S.localName+' vs '+S.remoteName;if(window.gGameEngine){gGameEngine.playerNames=[S.localName,S.remoteName];gGameEngine.lobbyOpen=false;gGameEngine.simulatedOpponentMode=true;gGameEngine.menu.setMode('simulated');S.ensureMusic();S.chatVisibility();setTimeout(function(){S.simSay(S.SIM_START)},550)}};
})();
