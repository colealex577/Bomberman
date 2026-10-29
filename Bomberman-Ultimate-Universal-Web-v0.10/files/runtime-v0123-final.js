(function(){
'use strict';
var SCORE_KEY='BombermanRatingV1';
var INIT_KEY='BombermanScoreV1Initialized';
var S=window.B115;
var installed=false;
function $(id){return document.getElementById(id)}
function G(){return window.gGameEngine||null}
function score(){try{var v=Math.round(Number(localStorage.getItem(SCORE_KEY)));return isFinite(v)?Math.max(0,Math.min(1000,v)):0}catch(e){return 0}}
function setScore(v){v=Math.max(0,Math.min(1000,Math.round(Number(v)||0)));try{localStorage.setItem(SCORE_KEY,String(v))}catch(e){}return v}
function ensureScoreInitialized(){try{if(localStorage.getItem(INIT_KEY)!=='1'){localStorage.setItem(SCORE_KEY,'0');localStorage.setItem(INIT_KEY,'1')}}catch(e){}}
function formatScore(v){v=Math.max(0,Math.min(1000,Math.round(Number(v)||0)));return v>=1000?'1000 MAX':String(v)}

function removeLegacyCanvasCharacterCard(){
  var g=G(),m=g&&g.menu;if(!g||!m||!m.views)return;
  var card=null,cy=0;
  for(var i=0;i<m.views.length;i++){
    var v=m.views[i];if(!v||!v.children)continue;
    for(var j=0;j<v.children.length;j++){if(v.children[j]&&String(v.children[j].text||'').toLowerCase()==='character'){card=v;cy=Number(v.y)||0;break}}
    if(card)break;
  }
  if(!card)return;
  // v0.12.3's recovered canvas menu patch nudged the original labels/icons outward.
  // Restore them before replacing its center card with the HTML Customize tile below.
  for(var k=0;k<m.views.length;k++){
    var x=m.views[k];if(!x||x===card||typeof x.x!=='number'||typeof x.y!=='number')continue;
    if(x.y<cy-10||x.y>cy+130)continue;
    if(x.x>=45&&x.x<205)x.x+=50;
    else if(x.x>325&&x.x<505)x.x-=50;
  }
  try{g.stage.removeChild(card)}catch(e){}
  var idx=m.views.indexOf(card);if(idx>=0)m.views.splice(idx,1)
}

function ensureCustomizeTile(){
  var tile=$('mainCustomizeTile');if(tile)return tile;
  tile=document.createElement('button');tile.type='button';tile.id='mainCustomizeTile';tile.setAttribute('aria-label','Customize character');
  tile.innerHTML='<canvas width="48" height="48" aria-hidden="true"></canvas><strong>Customize</strong><span class="customize_name"></span><small class="customize_score"></small>';
  tile.onclick=function(){if(window.BomberCharacter&&BomberCharacter.open)BomberCharacter.open()};
  document.body.appendChild(tile);
  if(!$('v0123-final-style')){var st=document.createElement('style');st.id='v0123-final-style';st.textContent=`
#mainCustomizeTile{position:fixed;z-index:6500;display:none;box-sizing:border-box;border:0;border-radius:0;background:rgba(0,0,0,.5);color:#fff;font-family:Helvetica,Arial,sans-serif;text-align:center;cursor:pointer;padding:6px 4px 5px;align-items:center;justify-content:flex-start;flex-direction:column;gap:1px}
#mainCustomizeTile canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges}
#mainCustomizeTile strong{font-size:14px;line-height:1.1;color:#74b9ff;font-weight:500}
#mainCustomizeTile .customize_name{font-size:9px;line-height:1.1;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#mainCustomizeTile .customize_score{font-size:8px;line-height:1.1;color:#b9ef8c;font-weight:800}
#mainCustomizeTile:hover{background:rgba(0,0,0,.68)}
`;document.head.appendChild(st)}
  return tile
}
function drawCustomizePreview(tile){
  if(!tile||!window.BomberCharacter)return;var c=tile.querySelector('canvas'),ctx=c&&c.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,48,48);try{var sheet=BomberCharacter.makeSheet(BomberCharacter.get());if(sheet)ctx.drawImage(sheet,0,0,48,48,0,0,48,48)}catch(e){}
}
function syncCustomizeTile(){
  var g=G(),tile=ensureCustomizeTile();if(!g||!g.menu||!tile)return;
  removeLegacyCanvasCharacterCard();
  var panel=$('characterPanel'),post=$('qolPostMatch'),elim=$('qolEliminated'),rematch=$('qolRematchPrompt');
  var show=!!(g.menu.visible&&!g.lobbyOpen&&(!panel||panel.hidden)&&(!post||post.hidden)&&(!elim||elim.hidden)&&(!rematch||rematch.hidden));
  tile.style.display=show?'flex':'none';if(!show)return;
  var canvas=$('canvas'),r=canvas&&canvas.getBoundingClientRect();if(!r||!r.width)return;
  var scale=Math.max(.65,Math.min(1.25,r.width/(g.size&&g.size.w||544))),w=110*scale,h=100*scale;
  tile.style.width=w+'px';tile.style.height=h+'px';tile.style.left=(r.left+(r.width-w)/2)+'px';tile.style.top=(r.top+r.height-h-2*scale)+'px';
  var pc=tile.querySelector('canvas');pc.style.width=(48*scale)+'px';pc.style.height=(48*scale)+'px';
  var nm=tile.querySelector('.customize_name'),sc=tile.querySelector('.customize_score');if(nm)nm.textContent=(window.B115&&B115.localName)||localStorage.getItem('BombermanPlayerName')||'Player';if(sc)sc.textContent='Score '+formatScore(score());drawCustomizePreview(tile)
}

function setEntityPosition(e,pos){
  if(!e||!pos)return;e.id=3;e.statSlot=3;e.position={x:pos.x,y:pos.y};var bp=Utils.convertToBitmapPosition(pos);if(e.bmp){e.bmp.x=bp.x;e.bmp.y=bp.y}e.targetPosition={x:pos.x,y:pos.y};e.targetBitmapPosition={x:bp.x,y:bp.y};if(e.updatePosition)e.updatePosition();if(e.updateNameLabel)e.updateNameLabel()
}
function enforceSimBottomRight(){
  var g=G();if(!g||S.role!=='simulated'||!g.simulatedOpponent)return;var pos=g.getSpawnSlotPosition?g.getSpawnSlotPosition(3):{x:g.tilesX-2,y:g.tilesY-2};setEntityPosition(g.simulatedOpponent,pos);g.simulatedOpponent.__v123BottomRight=true;if(g.updateStatHud)g.updateStatHud()
}
function scheduleSimSpawnFix(){[20,120,360,700].forEach(function(ms){setTimeout(enforceSimBottomRight,ms)})}

function patchSpawning(){
  if(S.__v123FinalSpawn)return;S.__v123FinalSpawn=true;var oldStart=S.startSimulated;S.startSimulated=function(){var r=oldStart.apply(S,arguments);scheduleSimSpawnFix();return r};
  if(window.GameEngine&&!GameEngine.prototype.__v123FinalRestart){GameEngine.prototype.__v123FinalRestart=true;var oldRestart=GameEngine.prototype.restart;GameEngine.prototype.restart=function(){var r=oldRestart.apply(this,arguments);if(S.role==='simulated')scheduleSimSpawnFix();return r}}
}
function patchCompetitiveScoringOnly(){
  if(!window.GameEngine||GameEngine.prototype.__v123FinalScore)return;GameEngine.prototype.__v123FinalScore=true;
  var oldSpec=GameEngine.prototype.beginSpectating;GameEngine.prototype.beginSpectating=function(){var competitive=S.role==='simulated'||S.online(),before=score(),r=oldSpec.apply(this,arguments);if(!competitive){setScore(before);this.__v123RatingSettled=false;this.__v123RatingResult=null}return r};
  var oldOver=GameEngine.prototype.gameOver;GameEngine.prototype.gameOver=function(status){var competitive=S.role==='simulated'||S.online(),before=score(),r=oldOver.apply(this,arguments);if(!competitive){setScore(before);this.__v123RatingSettled=false;this.__v123RatingResult=null}return r}
}
function relabelScoreLanguage(){
  var p=$('characterPreviewRating');if(p&&window.BomberCharacter)p.textContent='Score '+formatScore(BomberCharacter.getRating());
  var post=$('qolPostMatch');if(post&&!post.hidden){var copy=post.querySelector('.qol_copy');if(copy&&copy.textContent.indexOf('Rating ')>=0)copy.textContent=copy.textContent.replace('Rating ','Score ')}
}
function syncHudScore(){
  var g=G(),hud=$('qolStatHud');if(!g||!hud)return;var local=S.role==='guest'?1:0,box=hud.querySelector('.qol_stat_box[data-slot="'+(local===0?0:3)+'"]');if(box)box.setAttribute('data-rating',formatScore(score()));
}
function install(){
  if(installed)return true;if(!window.BomberCharacter||!window.GameEngine||!window.Menu||!window.BomberQOL||!BomberQOL.installed)return false;ensureScoreInitialized();patchSpawning();patchCompetitiveScoringOnly();ensureCustomizeTile();installed=true;scheduleSimSpawnFix();syncCustomizeTile();return true
}
ensureScoreInitialized();var tries=0,t=setInterval(function(){if(install()||++tries>600)clearInterval(t)},40);setInterval(function(){if(installed){syncCustomizeTile();syncHudScore();relabelScoreLanguage();var g=G();if(S.role==='simulated'&&g&&g.simulatedOpponent&&!g.simulatedOpponent.__v123BottomRight)scheduleSimSpawnFix()}},180);window.addEventListener('resize',syncCustomizeTile,{passive:true});window.addEventListener('orientationchange',function(){setTimeout(syncCustomizeTile,100)},{passive:true});
})();
