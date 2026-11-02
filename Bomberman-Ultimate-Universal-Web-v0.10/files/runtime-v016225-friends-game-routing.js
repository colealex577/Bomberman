(function(){
'use strict';
var VERSION='v0.16.2.25',KICK_PACKET='v16225KickDir2',seen=typeof WeakSet==='function'?new WeakSet():null,throwBase=null,throwWrap=null;
function S(){return window.B115||null}
function F(){return window.BomberFriends16225||null}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||14)}
function syncSavedName(){var s=S();if(!s)return false;var live=clean(s.localName,14),stored='';try{stored=clean(localStorage.getItem('BombermanPlayerName'),14)}catch(e){}if(stored&&(!live||/^Player(?:\s*1)?$/i.test(live))){s.localName=stored;if(s.els&&s.els.name&&(!s.els.name.value||/^Player(?:\s*1)?$/i.test(s.els.name.value)))s.els.name.value=stored;return true}return false}
function friendPacket(d){return!!(d&&typeof d==='object'&&(d.type==='friendHello'||d.type==='friendPresence'))}
function receiveFriend(d){var f=F();if(!f||!friendPacket(d)||typeof f.receiveHello!=='function')return false;try{f.receiveHello(d);return true}catch(e){return false}}
function sendHello(c){syncSavedName();var f=F();if(!c||!c.open||!f||typeof f.hello!=='function')return false;try{c.send(f.hello());return true}catch(e){return false}}
function scheduleHello(c){[0,180,700,1500].forEach(function(ms){setTimeout(function(){if(c&&c.open)sendHello(c)},ms)})}
function attach(c){if(!c)return c;if(seen&&seen.has(c))return c;if(seen)seen.add(c);else if(c.__v16225GameRoute)return c;c.__v16225GameRoute=true;c.on('data',function(d){var f=F(),s=S();if(friendPacket(d)){receiveFriend(d);return}if(d&&d.type===KICK_PACKET&&f&&s&&s.host&&s.host()&&s.conn===c&&throwBase){try{throwBase(1,d.dir,true)}catch(e){}}});c.on('open',function(){scheduleHello(c)});if(c.open)scheduleHello(c);return c}
function patchDirectional(){var f=F();if(!f||typeof f.throwDirectionIndex!=='function')return false;var cur=f.throwDirectionIndex;if(cur===throwWrap||cur.__v16225GameRouteThrow)return true;throwBase=cur;throwWrap=function(idx,d,authoritative){var ss=S();if(!authoritative&&Number(idx)===0&&ss&&ss.guest&&ss.guest()){try{return!!ss.send({type:KICK_PACKET,dir:d,version:VERSION})}catch(e){return false}}return throwBase.apply(f,arguments)};throwWrap.__v16225GameRouteThrow=true;f.throwDirectionIndex=throwWrap;return true}
function scan(){syncSavedName();var s=S(),p=s&&s.peer;if(s&&s.conn)attach(s.conn);if(p&&p.connections)Object.keys(p.connections).forEach(function(k){(p.connections[k]||[]).forEach(attach)})}
function install(){var s=S(),f=F();if(!s||!f)return false;syncSavedName();patchDirectional();scan();if(!window.BomberFriendsGameRoute16225){window.BomberFriendsGameRoute16225={version:VERSION,attach:attach,install:install,kickPacket:KICK_PACKET,receiveFriend:receiveFriend,sendHello:sendHello,syncSavedName:syncSavedName};if(document.body)document.body.setAttribute('data-v016225-friends-game-route','1')}return true}
var n=0,t=setInterval(function(){if(install()||++n>1800)clearInterval(t)},25);setInterval(function(){syncSavedName();patchDirectional();scan()},80);
})();
