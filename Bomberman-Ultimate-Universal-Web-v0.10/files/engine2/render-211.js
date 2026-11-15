/* Bomberman 2.1.3: independent, display-paced rendering. The CreateJS
 * simulation ticker and all game/network timing remain untouched. */
(function(w){
 'use strict';
 var WIDTH=545,HEIGHT=416,STEP=20,owner=null,frameId=0;
 var key='BombermanRenderSettingsV211',cfg={fps:'auto',scale:2};
 function read(){try{var v=JSON.parse(w.localStorage.getItem(key)||'{}');if(['auto',60,120].indexOf(v.fps)>=0)cfg.fps=v.fps;if([1,2,3].indexOf(v.scale)>=0)cfg.scale=v.scale}catch(e){}}
 read();
 function now(){return w.performance.now()}
 function publicActive(o){var s=w.B115,g=o&&o.game;return !!(g&&g.playing&&!g.matchFinished&&!(g.menu&&g.menu.visible)&&((s&&s.kind==='public'&&(s.role==='host'||s.role==='guest'||s.role==='simulated'||s.role==='roster'))||g.__v152RosterMode==='observe'||g.__v152RosterMode==='joined'))}
 function rate(){return cfg.fps===60?60:cfg.fps===120?120:(publicActive(owner)?owner.autoCap:120)}
 function tune(o,t){if(cfg.fps!=='auto'||!publicActive(o)){o.autoCap=120;o.healthAt=t;o.healthTicks=o.ticks;o.good=0;return}if(!o.healthAt){o.healthAt=t;o.healthTicks=o.ticks;return}var elapsed=t-o.healthAt;if(elapsed<1000)return;var hz=(o.ticks-o.healthTicks)*1000/elapsed;o.measuredSimulationHz=Math.round(hz*10)/10;o.healthAt=t;o.healthTicks=o.ticks;if(elapsed>2500||w.document.hidden){o.good=0;return}if(hz<44){o.autoCap=o.autoCap>60?60:30;o.good=0}else if(hz>=48){if(++o.good>=6){o.autoCap=o.autoCap===30?60:120;o.good=0}}else{o.good=0}}
 function scaleStage(o){var n=cfg.scale,c=o.stage.canvas;if(c.width!==WIDTH*n)c.width=WIDTH*n;if(c.height!==HEIGHT*n)c.height=HEIGHT*n;o.stage.scaleX=n;o.stage.scaleY=n;var ctx=c.getContext('2d');if(ctx)ctx.imageSmoothingEnabled=false;}
 function members(g){var out=[];(g.players||[]).concat(g.bots||[],g.bombs||[]).forEach(function(a){if(a&&a.bmp&&a.bmp.parent===g.stage&&a.bmp.visible!==false&&a.alive!==false&&!a.exploded)out.push(a)});return out;}
 function capture(o){var t=now(),g=o.game,seq=Number(g.__setupSerial)||0,next=new Map(),prior=o.round===seq?o.current:new Map();members(g).forEach(function(a){var b=a.bmp,x=Number(b.x),y=Number(b.y);if(!Number.isFinite(x)||!Number.isFinite(y))return;var p=prior.get(a);var valid=p&&p.bmp===b&&Math.hypot(x-p.x,y-p.y)<=Math.max(12,(g.tileSize||32)*1.25)&&t-o.sampleAt<100;next.set(a,{bmp:b,x:x,y:y,px:valid?p.x:x,py:valid?p.y:y})});o.current=next;o.round=seq;o.sampleAt=t;o.ticks++;}
 function restore(list){for(var i=list.length-1;i>=0;i--){var p=list[i];p[0].x=p[1];p[0].y=p[2]}}
 function paint(o,t){var g=o.game,s=o.stage;if(g.stage!==s||!s.canvas)return false;var c=s.canvas;if(!c.getClientRects().length||w.document.hidden)return false;
  // Only interpolate when the snapshots belong to the active round. Network
  // corrections outside the simulation tick, teleports and new sprites snap.
  var a=Math.max(0,Math.min(1,(t-o.sampleAt)/STEP)),saved=[],liveRound=(Number(g.__setupSerial)||0)===o.round;
  if(liveRound)o.current.forEach(function(p,actor){var b=p.bmp;if(actor.bmp!==b||b.parent!==s||actor.alive===false||actor.exploded||b.visible===false||b.x!==p.x||b.y!==p.y)return;var dx=(p.px-p.x)*(1-a),dy=(p.py-p.y)*(1-a);if(!dx&&!dy)return;saved.push([b,b.x,b.y]);b.x+=dx;b.y+=dy;var l=actor.nameLabel;if(l&&l.parent===s&&l.visible!==false){saved.push([l,l.x,l.y]);l.x+=dx;l.y+=dy}});
  var tick=s.tickOnUpdate;try{s.tickOnUpdate=false;o.original.call(s);o.draws++;return true}finally{s.tickOnUpdate=tick;restore(saved)}
 }
 function loop(t){frameId=0;var o=owner;if(!o)return;frameId=w.requestAnimationFrame(loop);tune(o,t);var period=1000/rate();if(!o.nextAt)o.nextAt=t; if(t+0.85<o.nextAt)return; o.nextAt+=period;if(t-o.nextAt>period)o.nextAt=t+period;
  if(paint(o,t)){o.recent.push(t);while(o.recent.length>1&&t-o.recent[0]>1000)o.recent.shift();}
 }
 function attach(g){var s=g&&g.stage;if(!s||!s.canvas||typeof s.tick!=='function'||typeof w.requestAnimationFrame!=='function')return false;if(owner&&owner.stage===s)return true;
  if(owner){owner.stage.update=owner.original;if(frameId)w.cancelAnimationFrame(frameId)}
  var o=owner={game:g,stage:s,original:s.update,current:new Map(),sampleAt:0,round:-1,ticks:0,draws:0,nextAt:0,recent:[],autoCap:120,healthAt:0,healthTicks:0,good:0,measuredSimulationHz:0};scaleStage(o);
  // Stage.update used to tick animations and draw at once. Keep exactly one
  // Stage.tick per original call (including the guest frame path), then sample.
  s.update=function(event){if(s.canvas&&s.tickOnUpdate)s.tick(event);capture(o)};
  frameId=w.requestAnimationFrame(loop);return true;
 }
 function configure(v){v=v||{};if(['auto',60,120].indexOf(v.fps)>=0)cfg.fps=v.fps;if([1,2,3].indexOf(v.scale)>=0)cfg.scale=v.scale;try{w.localStorage.setItem(key,JSON.stringify(cfg))}catch(e){}if(owner){scaleStage(owner);owner.nextAt=0;owner.recent=[];owner.autoCap=120;owner.healthAt=0;owner.good=0}syncControls();return settings();}
 function settings(){return {fps:cfg.fps,scale:cfg.scale}}
 function snapshot(){var o=owner,c=o&&o.stage.canvas,r=o&&o.recent||[];return {targetFPS:rate(),mode:cfg.fps,scale:cfg.scale,logicalWidth:WIDTH,logicalHeight:HEIGHT,width:c?c.width:WIDTH*cfg.scale,height:c?c.height:HEIGHT*cfg.scale,simulationHz:o&&o.game.fps||50,simulationStageTicks:o?o.ticks:0,measuredSimulationHz:o?o.measuredSimulationHz:0,adaptivePublicCap:o?o.autoCap:120,renderFrames:o?o.draws:0,measuredRenderFPS:r.length>1?Math.round((r.length-1)*1000/(r[r.length-1]-r[0])):0,activeRenderer:!!o,snapshotObjects:o?o.current.size:0}}
 function syncControls(){var f=w.document.getElementById('bm211FPS'),s=w.document.getElementById('bm211Resolution');if(f)f.value=String(cfg.fps);if(s)s.value=String(cfg.scale)}
 function bind(){var btn=w.document.getElementById('bm211Graphics'),dialog=w.document.getElementById('bm211GraphicsDialog'),close=w.document.getElementById('bm211GraphicsClose'),f=w.document.getElementById('bm211FPS'),s=w.document.getElementById('bm211Resolution');if(!btn||!dialog)return;syncControls();btn.addEventListener('click',function(){syncControls();if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','')});close.addEventListener('click',function(){if(dialog.close)dialog.close();else dialog.removeAttribute('open')});f.addEventListener('change',function(){configure({fps:f.value==='auto'?'auto':Number(f.value)})});s.addEventListener('change',function(){configure({scale:Number(s.value)})});}
 if(w.document.readyState==='loading')w.document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
 w.BomberEngine2Render=Object.freeze({version:'2.1.3',attach:attach,configure:configure,settings:settings,snapshot:snapshot});
})(window);
