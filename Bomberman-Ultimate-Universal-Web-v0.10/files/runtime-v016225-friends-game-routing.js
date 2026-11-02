(function(){
'use strict';
var VERSION='v0.16.2.25',baseHost=null,baseGuest=null,hostWrap=null,guestWrap=null;
function S(){return window.B115||null}
function F(){return window.BomberFriends16225||null}
function friendPacket(d){return!!(d&&typeof d==='object'&&(d.type==='friendHello'||d.type==='friendPresence'))}
function handleFriend(d){var f=F();if(!f||!friendPacket(d))return false;try{f.receiveHello(d)}catch(e){}return true}
function buildHost(){if(hostWrap)return hostWrap;hostWrap=function(d){var f=F();if(d&&d.type==='v16225KickDir'&&f&&f.throwDirectionIndex){try{return!!f.throwDirectionIndex(1,d.dir,true)}catch(e){return false}}if(handleFriend(d))return true;return baseHost&&baseHost.apply(S(),arguments)};hostWrap.__v16225FriendsRoute=true;return hostWrap}
function buildGuest(){if(guestWrap)return guestWrap;guestWrap=function(d){if(handleFriend(d))return true;return baseGuest&&baseGuest.apply(S(),arguments)};guestWrap.__v16225FriendsRoute=true;return guestWrap}
function install(){var s=S(),f=F();if(!s||!f)return false;var h=s.hostData,g=s.guestData;if(h!==hostWrap){if(h&&!h.__v16225FriendsRoute)baseHost=h;s.hostData=buildHost()}if(g!==guestWrap){if(g&&!g.__v16225FriendsRoute)baseGuest=g;s.guestData=buildGuest()}if(!window.BomberFriendsGameRoute16225){window.BomberFriendsGameRoute16225={version:VERSION,install:install};if(document.body)document.body.setAttribute('data-v016225-friends-game-route','1')}return true}
var n=0,t=setInterval(function(){if(install()||++n>1800)clearInterval(t)},25);setInterval(install,80);
})();
