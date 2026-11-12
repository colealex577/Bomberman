/* Bomberman 2.0: canonical keyboard listener ownership.
 * InputEngine remains the public API for all legacy, AI and networking modules.
 */
(function(global){
 'use strict';
 var subscribers=0,dispatches=0,installed=false;
 function attach(instance){
   if(instance.__setupComplete)return false;
   instance.__setupComplete=true;
   instance.__engine2KeyDown=function(event){return instance.onKeyDown(event)};
   instance.__engine2KeyUp=function(event){return instance.onKeyUp(event)};
   document.addEventListener('keydown',instance.__engine2KeyDown);
   document.addEventListener('keyup',instance.__engine2KeyUp);
   subscribers+=2;installed=true;return true;
 }
 function resetActions(instance){
   if(!instance||!instance.actions)return;
   Object.keys(instance.actions).forEach(function(key){instance.actions[key]=false});
 }
 function dispatch(instance,action){
   if(global.BomberEngine2Round&&global.BomberEngine2Round.dispatch(action)){dispatches++;return;}
   var callbacks=(instance.listeners&&instance.listeners[action])||[];
   /* Snapshot: a callback may rebuild a round and replace the listeners array. */
   callbacks.slice().forEach(function(cb){dispatches++;cb()});
 }
 global.BomberEngine2Input=Object.freeze({
   attach:attach,dispatch:dispatch,resetActions:resetActions,
   snapshot:function(){return{installed:installed,domListeners:subscribers,eventsDispatched:dispatches}}
 });
})(window);
