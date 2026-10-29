(function(){
'use strict';
var S=window.B115,installed=false,observer=null,cleaning=false;
if(!S)return;
function sanitizeNow(){if(cleaning||!window.BomberSocial130)return;cleaning=true;try{BomberSocial130.sanitize()}finally{cleaning=false}}
function install(){
 if(installed||!window.BomberSocial130||!window.BomberMultiplayer||!BomberMultiplayer.ready)return false;
 installed=true;
 var guest=S.guestData;
 S.guestData=function(d){
  if(S.role==='guest'&&d&&(d.type==='v130SetState'||d.type==='v130Stats')&&d.set&&!d.__v130GuestPerspective){
   var original=d.set;
   d=Object.assign({},d,{__v130GuestPerspective:true,set:Object.assign({},original,{localWins:Number(original.opponentWins)||0,opponentWins:Number(original.localWins)||0,opponent:S.remoteName||'Opponent'})});
  }
  return guest.apply(S,[d]);
 };
 sanitizeNow();
 if(window.MutationObserver&&document.body){observer=new MutationObserver(function(){sanitizeNow()});observer.observe(document.body,{subtree:true,childList:true,characterData:true})}
 return true;
}
var n=0,t=setInterval(function(){if(install()||++n>500)clearInterval(t)},40);
})();
