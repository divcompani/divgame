/* Interactive multi-view character rendering. The atlas remains unmodified on disk. */
(function(){'use strict';
class CharacterTurntable{
 constructor(url){this.image=new Image();this.texture=null;this.frames=[];this.value=0;this.from=0;this.to=0;this.elapsed=1;this.duration=.9;this.ready=false;this.image.onload=()=>this.prepareTexture();this.image.src=url;}
 prepareTexture(){
  const c=document.createElement('canvas');c.width=this.image.naturalWidth;c.height=this.image.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(this.image,0,0);
  // Exterior color-key masking during display preserves enclosed white eyes.
  // Flood-fill only neutral background pixels connected to the image border.
  const data=g.getImageData(0,0,c.width,c.height),p=data.data,w=c.width,h=c.height,n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
  const visit=i=>{if(i<0||i>=n||seen[i])return;seen[i]=1;const k=i*4,lo=Math.min(p[k],p[k+1],p[k+2]),hi=Math.max(p[k],p[k+1],p[k+2]);if(p[k+3]===0||(lo>130&&hi-lo<48)){queue[tail++]=i;p[k+3]=0}};
  for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
  while(head<tail){const i=queue[head++],x=i%w;if(x>0)visit(i-1);if(x<w-1)visit(i+1);visit(i-w);visit(i+w)}
  g.putImageData(data,0,0);this.texture=c;
  for(let i=0;i<8;i++){const x0=Math.floor((i%4)*w/4),x1=Math.floor((i%4+1)*w/4),y0=Math.floor(Math.floor(i/4)*h/2),y1=Math.floor((Math.floor(i/4)+1)*h/2);let left=x1,right=x0,top=y1,bottom=y0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(p[(y*w+x)*4+3]>180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
   this.frames.push([left,top,right-left+1,bottom-top+1]);
  }
  this.ready=true;
 }
 toggle(){this.from=this.value;this.to=this.to===7?0:7;this.elapsed=0;return this.to===7;}
 update(dt){if(this.elapsed>=this.duration)return;this.elapsed=Math.min(this.duration,this.elapsed+dt);const t=this.elapsed/this.duration,e=t*t*(3-2*t);this.value=this.from+(this.to-this.from)*e;}
 draw(ctx,x,y,w,h){if(!this.ready)return false;const a=Math.floor(this.value),b=Math.min(7,a+1),mix=this.value-a;
  const paint=(index,alpha)=>{if(alpha<=0)return;const [sx,sy,sw,sh]=this.frames[index],scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(this.texture,sx,sy,sw,sh,x+(w-dw)/2,y+h-dh,dw,dh);ctx.restore()};
  paint(a,1-mix);paint(b,mix);return true;
 }
}
window.CharacterTurntable=CharacterTurntable;
})();
