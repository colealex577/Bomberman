(function(){
'use strict';
function formatScore(v){v=Math.max(0,Math.min(1000,Math.round(Number(v)||0)));return v>=1000?'1000 MAX':String(v)}
function scoreLabel(){var p=document.getElementById('characterPreviewRating');if(p&&window.BomberCharacter)p.textContent='Score '+formatScore(BomberCharacter.getRating())}
function cleanupMenu(){
  var g=window.gGameEngine,m=g&&g.menu;if(!g||!m||!m.views||!window.createjs)return;
  var cards=[];
  for(var i=0;i<m.views.length;i++){
    var v=m.views[i],clicks=v&&v._listeners&&v._listeners.click;
    if(v instanceof createjs.Shape&&clicks&&clicks.length&&(v.x===-50||v.x===50))v.x=0;
    if(v instanceof createjs.Container&&v.children&&v.children.some(function(c){return String(c&&c.text||'').toLowerCase()==='character'}))cards.push(v);
  }
  if(cards.length){cards.forEach(function(card){try{g.stage.removeChild(card)}catch(e){}});m.views=m.views.filter(function(v){return cards.indexOf(v)===-1})}
  var tile=document.getElementById('mainCustomizeTile');if(tile){
    var nm=tile.querySelector('.customize_name'),stored='';try{stored=localStorage.getItem('BombermanPlayerName')||''}catch(e){}if(nm)nm.textContent=(window.B115&&B115.localName&&B115.localName!=='Player'?B115.localName:stored)||'Player';
    if(!tile.__v123ScoreOpen){tile.__v123ScoreOpen=true;tile.onclick=function(){if(window.BomberCharacter&&BomberCharacter.open){BomberCharacter.open();scoreLabel();setTimeout(scoreLabel,0)}}}
  }
  scoreLabel()
}
var tries=0,t=setInterval(function(){cleanupMenu();if(window.BomberCharacter&&document.getElementById('mainCustomizeTile')&&++tries>80)clearInterval(t)},50);setInterval(cleanupMenu,120);window.addEventListener('pageshow',cleanupMenu,{passive:true});
})();
