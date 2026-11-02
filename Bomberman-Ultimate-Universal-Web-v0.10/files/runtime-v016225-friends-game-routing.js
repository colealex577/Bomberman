(function(){
'use strict';
var VERSION='v0.16.2.25',seen=typeof WeakSet==='function'?new WeakSet():null,acceptBase=null,acceptWrap=null,peerConnectBase=null,peerConnectWrap=null;
function S(){return window.B115||null}
function F(){return window.BomberFriends16225||null}
function friendPacket(d){return!!(d&&typeof d==='object'&&(d.type==='friendHello'||d.type==='friendPresence'))}
function handleFriend(d){var f=F();if(!f||!friendPacket(d))return false;try{f.receiveHello(d)}catch(e){}return true}
function attach(c){if(!c)return c;if(seen&&seen.has(c))return c;if(seen)seen.add(c);else if(c.__v16225GameRoute)return c;c.__v16225GameRoute=true;c.on('data',function(d){var f=F(),s=S();if(friendPacket(d)){handleFriend(d);return}if(d&&d.type==='v16225KickDir'&&f&&s&&s.host&&s.host()&&s.conn===c&&f.throwDirectionIndex){try{f.throwDirectionIndex(1,d.dir,true)}catch(e){}}});return c}
function patchAcceptHost(){var s=S();if(!s||typeof s.acceptHost!=='function')return false;var cur=s.acceptHost;if(cur===acceptWrap||cur.__v16225GameRouteAccept)return true;acceptBase=cur;acceptWrap=function(c){attach(c);return acceptBase.apply(s,arguments)};acceptWrap.__v16225GameRouteAccept=true;s.acceptHost=acceptWrap;return true}
function patchPeerConnect(){if(!window.Peer||!Peer.prototype||typeof Peer.prototype.connect!=='function')return false;var cur=Peer.prototype.connect;if(cur===peerConnectWrap||cur.__v16225GameRouteConnect)return true;peerConnectBase=cur;peerConnectWrap=function(){var c=peerConnectBase.apply(this,arguments);attach(c);return c};peerConnectWrap.__v16225GameRouteConnect=true;if(cur.__v16225Friends)peerConnectWrap.__v16225Friends=true;if(cur.__v16225Isolation)peerConnectWrap.__v16225Isolation=true;Peer.prototype.connect=peerConnectWrap;return true}
function scan(){var s=S(),p=s&&s.peer;if(s&&s.conn)attach(s.conn);if(p&&p.connections)Object.keys(p.connections).forEach(function(k){(p.connections[k]||[]).forEach(attach)})}
function install(){var s=S(),f=F();if(!s||!f)return false;patchAcceptHost();patchPeerConnect();scan();if(!window.BomberFriendsGameRoute16225){window.BomberFriendsGameRoute16225={version:VERSION,attach:attach,install:install};if(document.body)document.body.setAttribute('data-v016225-friends-game-route','1')}return true}
var n=0,t=setInterval(function(){if(install()||++n>1800)clearInterval(t)},25);setInterval(function(){patchAcceptHost();patchPeerConnect();scan()},120);
})();
