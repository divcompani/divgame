/* Divoolee Magic Ascent — fixed world coordinates, independent of rendering. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DivooleeEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WIDTH=480,HEIGHT=720,GRAVITY=1650,JUMP=650;
const REWARDS=[
 {id:'discount',threshold:200,icon:'％',fa:'کد تخفیف ۱۵٪',en:'15% discount'},
 {id:'album',threshold:600,icon:'♫',fa:'آلبوم موسیقی نمایش',en:'Original soundtrack'},
 {id:'stationery',threshold:1200,icon:'✎',fa:'پک لوازم‌التحریر',en:'Stationery set'},
 {id:'keychain',threshold:2000,icon:'♧',fa:'جاکلیدی سیلیکونی دیوولی',en:'Divoolee silicone keychain'},
 {id:'ticket',threshold:3000,icon:'▣',fa:'بلیط رایگان نمایش',en:'Free show ticket'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Game{
 constructor(random=Math.random){this.random=random;this.events=[];this.reset();this.state='idle';}
 emit(type,data={}){this.events.push({type,...data});}
 drain(){const e=this.events;this.events=[];return e;}
 reset(){
  this.state='playing';this.speed=1.05;this.score=0;this.height=0;this.bonus=0;this.level=1;this.lives=3;this.camera=0;this.time=0;
  this.shield=0;this.magnet=0;this.slow=0;this.invincible=0;this.boostCooldown=0;this.hazardClock=3;
  this.platformId=0;this.platforms=[{id:0,x:150,y:665,baseX:150,w:180,kind:'normal',phase:0,landed:false,crumble:-1}];
  this.sparks=[];this.hazards=[];this.player={x:218,y:605,w:44,h:58,vx:0,vy:-JUMP,facing:1};
  this.lastLanding=null;this.result=null;this.events=[];
  while(this.platforms.at(-1).y>-200)this.addPlatform();this.emit('start');
 }
 addPlatform(){
  const previous=this.platforms.at(-1),lv=Math.min(this.level,14);
  const w=Math.max(48,121-lv*5.5),gap=78+Math.min(lv*2.2,25)+this.random()*8;
  const center=clamp(previous.baseX+previous.w/2+(this.random()-.5)*(202+lv*3),65,WIDTH-65);
  let kind='normal';if(lv>=2&&this.random()<.38)kind='moving';else if(lv>=4&&this.random()<.38)kind='crumble';
  const p={id:++this.platformId,x:center-w/2,baseX:center-w/2,y:previous.y-gap,w,kind,phase:this.random()*Math.PI*2,landed:false,crumble:-1};
  this.platforms.push(p);
  if(this.random()<.48)this.sparks.push({platformId:p.id,x:center,y:p.y-32,kind:this.random()<.10?1+Math.floor(this.random()*3):0,taken:false});
 }
 boost(){if(this.state!=='playing'||this.boostCooldown>0)return false;this.player.vy=-760;this.boostCooldown=2.6;this.emit('boost');return true;}
 pause(){if(this.state==='playing'){this.state='paused';return true}if(this.state==='paused'){this.state='playing';return true}return false;}
 end(){const result={score:this.score,height:this.height,level:this.level};this.reset();this.events=[];this.state='over';this.score=0;this.result=result;this.emit('gameover',result);}
 damage(reason){
  if(this.state!=='playing'||this.invincible>0)return false;
  if(this.shield){this.shield=0;this.emit('shield');}else{this.lives--;this.emit('life',{lives:this.lives,reason});}
  if(this.lives<=0){this.end();return true}
  this.invincible=2.5;this.hazards=[];
  const visible=this.platforms.filter(p=>p.y>this.camera+240&&p.y<this.camera+HEIGHT-80&&p.crumble<0);
  let safe=visible.at(-1);
  if(!safe){safe={id:++this.platformId,x:clamp(this.player.x-35,30,WIDTH-130),baseX:clamp(this.player.x-35,30,WIDTH-130),y:this.camera+470,w:120,kind:'normal',phase:0,landed:true,crumble:-1};this.platforms.push(safe);this.platforms.sort((a,b)=>b.y-a.y)}
  this.player.x=safe.x+safe.w/2-this.player.w/2;this.player.y=safe.y-this.player.h-3;this.player.vy=-JUMP;this.player.vx=0;this.boostCooldown=0;return true;
 }
 takeReward(id){if(this.state!=='over'||!this.result)return false;const prize=REWARDS.find(r=>r.id===id);if(!prize||this.result.score<prize.threshold)return false;this.state='won';this.emit('win',{id,score:this.result.score});return true;}
 update(dt,direction=0){
  if(this.state!=='playing')return;dt=clamp(dt,0,1/30);
  this.speed=Math.min(3.6,1.05+this.score/700);
  const steps=Math.max(1,Math.ceil(dt*this.speed*120));
  for(let i=0;i<steps&&this.state==='playing';i++)this.step(dt/steps,direction);
 }
 step(dt,direction){
  const factor=this.speed*(this.slow>0?.62:1),step=dt*factor;this.time+=step;
  this.magnet=Math.max(0,this.magnet-dt);this.slow=Math.max(0,this.slow-dt);this.invincible=Math.max(0,this.invincible-dt);this.boostCooldown=Math.max(0,this.boostCooldown-dt);
  const p=this.player;
  p.vx+=(clamp(direction,-1,1)*285-p.vx)*Math.min(1,step*19);if(Math.abs(p.vx)>8)p.facing=p.vx>0?1:-1;
  p.x=clamp(p.x+p.vx*step,0,WIDTH-p.w);const previousBottom=p.y+p.h;p.vy+=GRAVITY*step;p.y+=p.vy*step;
  for(const platform of this.platforms){
   if(platform.kind==='moving')platform.x=platform.baseX+Math.sin(this.time*(1.1+this.level*.065)+platform.phase)*22;
   if(platform.crumble>=0)platform.crumble+=step;
   if(platform.crumble>.22)continue;
   if(p.vy>0&&previousBottom<=platform.y+5&&p.y+p.h>=platform.y&&p.x+p.w-5>platform.x&&p.x+5<platform.x+platform.w){
    p.y=platform.y-p.h;p.vy=-JUMP;this.lastLanding=platform.id;
    if(platform.kind==='crumble')platform.crumble=0;
    this.emit('jump');break;
   }
  }
  this.height=Math.max(this.height,605-p.y);this.score=Math.floor(this.height/5)+this.bonus;this.level=1+Math.floor(this.score/180);
  this.camera=Math.min(this.camera,p.y-HEIGHT*.47);
  // No score is awarded for time spent waiting. Later stages also rise from below.
  if(this.score>=180)this.camera-=step*Math.min(58,10+this.level*2.6);
  this.platforms=this.platforms.filter(q=>q.y<this.camera+HEIGHT+100&&q.crumble<1.5);
  if(!this.platforms.length){this.damage('fall');return}
  while(this.platforms.at(-1).y>this.camera-180)this.addPlatform();
  for(const s of this.sparks){
   if(s.taken)continue;const anchor=this.platforms.find(q=>q.id===s.platformId);
   if(anchor&&this.magnet<=0){s.x=anchor.x+anchor.w/2;s.y=anchor.y-32}
   let dx=p.x+p.w/2-s.x,dy=p.y+p.h/2-s.y;
   if(this.magnet>0&&Math.hypot(dx,dy)<150){s.x+=dx*dt*6;s.y+=dy*dt*6}
   if(Math.hypot(dx,dy)<34){s.taken=true;this.bonus+=s.kind?15:8;if(s.kind===1)this.shield=1;if(s.kind===2)this.magnet=8;if(s.kind===3)this.slow=6;this.emit('collect',{x:s.x,y:s.y,kind:s.kind})}
  }
  this.sparks=this.sparks.filter(s=>!s.taken&&s.y<this.camera+HEIGHT+40);
  if(this.score>=900){
   this.hazardClock-=step;
   if(this.hazardClock<=0){let fromLeft=this.random()<.5;this.hazards.push({x:fromLeft?-36:WIDTH+36,y:clamp(p.y+20,this.camera+140,this.camera+570),vx:(fromLeft?1:-1)*Math.min(460,240+this.level*14),warn:.85,r:17,age:0});this.hazardClock=Math.max(.85,2.8-this.level*.12);this.emit('warning')}
  }
  for(const h of this.hazards){h.age+=step;if(h.warn>0){h.warn-=dt;continue}h.x+=h.vx*step;let x=clamp(h.x,p.x+7,p.x+p.w-7),y=clamp(h.y,p.y+7,p.y+p.h-7);if(Math.hypot(h.x-x,h.y-y)<h.r){this.damage('fire');break}}
  this.hazards=this.hazards.filter(h=>h.age<6&&h.x>-100&&h.x<WIDTH+100);
  if(this.state==='playing'&&p.y>this.camera+HEIGHT+30){if(this.invincible>0)this.invincible=0;this.damage('fall')}
 }
}
return{Game,REWARDS,WIDTH,HEIGHT,GRAVITY,JUMP,clamp};
});
