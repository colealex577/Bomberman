(function(){
'use strict';
var VERSION='v0.16.2.24',observer=null,boundBox=null,lastKey='',lastAt=0,seen=typeof WeakSet!=='undefined'?new WeakSet():null;
function S(){return window.B115||null}
function P(){return window.BomberPublicPresence16223||null}
function clean(v,n){return String(v||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n||160)}
function wasSeen(node){if(!node)return true;if(seen){if(seen.has(node))return true;seen.add(node);return false}if(node.__v16224SpectatorRelayed)return true;node.__v16224SpectatorRelayed=true;return false}
function relayRow(node){var s=S(),p=P();if(!s||!p||!p.broadcastChat||s.kind!=='public'||(s.role!=='host'&&s.role!=='simulated')||!node||node.nodeType!==1)return false;if(wasSeen(node))return false;var who=node.querySelector&&node.querySelector('strong'),body=node.querySelector&&node.querySelector('span'),name=clean(who&&who.textContent||s.localName||'Player',14),text=clean(body&&body.textContent||'',160);if(!text)return false;var key=name+'\n'+text,now=Date.now();if(key===lastKey&&now-lastAt<300)return false;lastKey=key;lastAt=now;return !!p.broadcastChat(name,text)}
function scan(relay){var s=S(),box=s&&s.els&&s.els.chatMessages||document.getElementById('chatMessages');if(!box)return false;if(box!==boundBox){if(observer)try{observer.disconnect()}catch(e){}boundBox=box;seen=typeof WeakSet!=='undefined'?new WeakSet():null;Array.prototype.forEach.call(box.children||[],function(n){wasSeen(n)});observer=new MutationObserver(function(records){records.forEach(function(r){Array.prototype.forEach.call(r.addedNodes||[],function(n){if(n&&n.nodeType===1&&n.classList&&n.classList.contains('chat_line'))relayRow(n)})})});observer.observe(box,{childList:true})}if(relay)Array.prototype.forEach.call(box.children||[],function(n){if(n&&n.classList&&n.classList.contains('chat_line'))relayRow(n)});return true}
function install(){scan(true);window.BomberAuthoritativeSpectatorChat16224={version:VERSION,scan:function(){return scan(true)},relayRow:relayRow};if(document.body)document.body.setAttribute('data-v016224-authoritative-chat','1')}
setInterval(install,80);install();
})();