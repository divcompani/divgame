/* Original procedural score and effects. No external audio or copyrighted recordings. */
(function(){'use strict';
class MagicAudio{
 constructor(){this.ctx=null;this.enabled=true;this.music=true;this.playing=false;this.tick=0;this.next=0;this.timer=null;try{this.enabled=localStorage.getItem('dv-sound')!=='off';this.music=localStorage.getItem('dv-music')!=='off'}catch{}}
 async unlock(){try{if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.42;this.master.connect(this.ctx.destination);this.fx=this.ctx.createGain();this.fx.gain.value=.7;this.fx.connect(this.master);this.musicGain=this.ctx.createGain();this.musicGain.gain.value=.28;this.musicGain.connect(this.master);this.timer=setInterval(()=>this.schedule(),100)}await this.ctx.resume();this.apply()}catch{this.enabled=false}}
 apply(){if(this.ctx){this.master.gain.setTargetAtTime(this.enabled?.42:0,this.ctx.currentTime,.06);this.musicGain.gain.setTargetAtTime(this.music&&this.playing?.28:0,this.ctx.currentTime,.12)}try{localStorage.setItem('dv-sound',this.enabled?'on':'off');localStorage.setItem('dv-music',this.music?'on':'off')}catch{}}
 active(yes){this.playing=yes;this.apply();if(this.ctx)this.next=Math.max(this.next,this.ctx.currentTime+.05)}
 tone(frequency,duration=.2,type='sine',volume=.3,delay=0,endFrequency=null,music=false){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);if(endFrequency)o.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(music?this.musicGain:this.fx);o.start(t);o.stop(t+duration+.03);o.onended=()=>{o.disconnect();g.disconnect()}}
 effect(name){if(!this.ctx||!this.enabled)return;
  const tune=(notes,d=.12,type='sine',v=.23)=>notes.forEach((f,i)=>this.tone(f,d+.05,type,v,i*d));
  if(name==='jump')this.tone(230,.16,'sine',.18,0,620);
  if(name==='boost'){this.tone(170,.28,'triangle',.26,0,970);this.tone(970,.23,'sine',.12,.1,1400)}
  if(name==='collect')tune([880,1320],.055,'sine',.2);
  if(name==='spell')tune([440,660,880,1320],.08);
  if(name==='life'){this.tone(260,.5,'triangle',.45,0,65);this.tone(800,.17,'sine',.2)}
  if(name==='gameover')tune([440,349,294,220,110],.17,'triangle',.28);
  if(name==='win')tune([523,659,784,1047,784,1047,1319],.13,'sine',.32);
  if(name==='warning')tune([622,622],.09,'triangle',.17);
  if(name==='shield')tune([350,900,540],.09);
  if(name==='start')tune([330,440,660],.1);
 }
 schedule(){if(!this.ctx||!this.playing||!this.enabled||!this.music||this.ctx.state!=='running')return;const now=this.ctx.currentTime;if(this.next<now)this.next=now+.03;
  const notes=[0,7,12,14,7,12,19,14,0,7,10,14,7,10,17,14],roots=[146.83,130.81,174.61,110];
  while(this.next<now+.16){const i=this.tick++,beat=i%16,root=roots[Math.floor(i/16)%4],delay=this.next-now;
   this.tone(root*Math.pow(2,notes[beat]/12),.7,'sine',.15,delay,null,true);
   if(beat%4===0)this.tone(root/2,1.1,'triangle',.19,delay,null,true);
   if(beat===0){this.tone(root*2,3.2,'sine',.06,delay,null,true);this.tone(root*3,3.2,'sine',.04,delay,null,true)}
   if(beat%4===2)this.tone(1100,.035,'triangle',.025,delay,650,true);
   this.next+=.235;
  }
 }
}
window.MagicAudio=MagicAudio;
})();
