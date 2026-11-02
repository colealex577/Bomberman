(function(){
'use strict';
var VERSION='v0.16.2.25',seen=typeof WeakSet==='function'?new WeakSet():null;
function S(){return window.B115||null}
function shouldBlock(c,d){if(!c||!d||typeof d!=='object')return false;var md=c.metadata||{};if(md.friendProbe)return false;if(!md.presence)return false;if(d.type!=='friendHello'&&d.type!=='friendPresence')return false;var s=S();return !(s&&s.conn===c&&s.online&&s.online())}
function wrap(c){if(!c)return;if(seen&&seen.has(c))return;if(seen)seen.add(c);else if(c.__v16225Isolation)return;var old=c.send;if(typeof old!=='function')return;c.send=function(d){if(shouldBlock(c,d))return true;return old.apply(c,arguments)};c.__v16225Isolation=true}
function patchPeer(){if(!window.Peer||!Peer.prototype)return false;var old=Peer.prototype.connect;if(typeof old!=='function')return false;if(!old.__v16225Isolation){var f=function(){var c=old.apply(this,arguments);wrap(c);return c};f.__v16225Isolation=true;f.__v16225Friends=old.__v16225Friends;Peer.prototype.connect=f}return true}
function scan(){var s=S(),p=s&&s.peer;if(p&&p.connections)Object.keys(p.connections).forEach(function(k){(p.connections[k]||[]).forEach(wrap)});if(s&&s.conn)wrap(s.conn)}
function install(){patchPeer();scan();if(window.BomberFriends16225&&!window.BomberFriendsProtocol16225){window.BomberFriendsProtocol16225={version:VERSION,wrap:wrap,scan:scan};if(document.body)document.body.setAttribute('data-v016225-friends-protocol','1')}return!!window.BomberFriendsProtocol16225}
var n=0,t=setInterval(function(){if(install()||++n>1800)clearInterval(t)},25);setInterval(function(){patchPeer();scan()},80);
})();
