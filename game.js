'use strict';
const $=s=>document.querySelector(s);
const {Game,REWARDS,WIDTH,HEIGHT}=DivooleeEngine;
const game=new Game(),sound=new MagicAudio(),canvas=$('#game'),ctx=canvas.getContext('2d');
const turntable=new CharacterTurntable('assets/turntable-atlas.png');
const sheet=new Image(),atlas=new Image();sheet.src='assets/jump-sheet.png';atlas.src='assets/magic-atlas.png';
// Custom source rectangles retain every hand and horn of the generated poses.
const motion={camera:0,squash:0,squashVelocity:0,lean:0,face:1,pose:2,fromPose:2,blend:1};
const frames=[[45,185,455,580],[570,85,465,680],[1070,30,375,620],[1495,210,470,560]];
let lang='fa',best=0,storage=null,receipt=null,keys={},touchDirection=0,dragX=null,last=0,visualTime=0,particles=[],shake=0,flash=0,toastTime=0,renderScale=1,offsetX=0,offsetY=0,cssW=480,cssH=720;
try{storage=window.localStorage;best=Number(storage.getItem('dv-ascent-best'))||0;lang=storage.getItem('divoolee-language')||'fa';receipt=DivooleeRewards.read(storage)}catch{}
if(!['fa','en'].includes(lang))lang='fa';
const tr=(fa,en)=>lang==='fa'?fa:en,num=n=>Math.floor(n).toLocaleString(lang==='fa'?'fa-IR':'en-US');
const worlds=[['جنگل مهتابی','Moonlit Forest'],['هتل ترانسیلوانیا؛ شعبه در ایران','Transylvania Hotel · Iran Branch'],['کارخانه هیولاها؛ سالیوان در ایران','Monster Factory · Sullivan in Iran'],['درون بیرون؛ فرمان گمشده','Inside Out · The Lost Command']];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stars=Array.from({length:65},(_,i)=>({x:Math.sin(i*12.989)*330,y:(i*127)%960,z:1+(i%4),phase:i*.9}));
function toast(fa,en){$('#toast').textContent=tr(fa,en);toastTime=3;$('#toast').classList.add('visible')}
function getReceipt(){return storage?DivooleeRewards.read(storage):null}
function translate(){document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';document.querySelectorAll('[data-fa]').forEach(e=>e.innerHTML=e.dataset[lang]);$('#language').textContent=lang==='fa'?'English ◎':'فارسی ◎';$('#heroTurn').setAttribute('aria-label',tr('لمس کن تا دیوولی بچرخد','Tap to turn Divoolee'));canvas.setAttribute('aria-label',tr('پرش عمودی دیوولی؛ با کلیدهای چپ و راست حرکت کن و با فاصله جهش کن.','Vertical Divoolee game. Arrow keys steer; Space boosts.'));updateHUD();updateRewards();audioLabels();try{storage?.setItem('divoolee-language',lang)}catch{}}
function updateHUD(){
 $('#homeAgain').hidden=!['over','won'].includes(game.state);$('#score').textContent=num(game.score);$('#speed').textContent=game.speed.toFixed(1)+'×';$('#world').textContent=tr(...worlds[Math.min(3,Math.floor((game.level-1)/4))])+' · '+num(game.level);
 $('#lives').setAttribute('aria-label',tr(`${num(game.lives)} جان باقی مانده`,`${game.lives} lives remaining`));
 $('#lives').querySelectorAll('i').forEach((e,i)=>e.classList.toggle('spent',i>=game.lives));$('#lifeCount').textContent=num(game.lives)+'/ '+num(3);
 $('#power').textContent=[game.shield?tr('◈ سپر','◈ Shield'):'',game.magnet>0?tr('✦ آهن‌ربا ','✦ Magnet ')+num(game.magnet):'',game.slow>0?tr('◷ زمان آهسته ','◷ Slow time ')+num(game.slow):''].filter(Boolean).join(' · ');
 const ready=game.boostCooldown<=0;$('#jump').textContent=ready?tr('جهش ↑','Boost ↑'):tr('جهش ','Boost ')+(Math.ceil(game.boostCooldown*10)/10).toFixed(1);$('#jump').classList.toggle('cooling',!ready);
 $('#pause').textContent=game.state==='paused'?'▶':'Ⅱ';$('#pause').ariaLabel=game.state==='paused'?tr('ادامه بازی','Resume'):tr('مکث','Pause');
 $('#claimShortcut').hidden=true;
}
function updateRewards(){
 $('#best').textContent=num(best);const eligibleScore=game.state==='over'?(game.result?.score||0):game.score;const next=REWARDS.find(p=>p.threshold>eligibleScore);$('#progress').style.width=Math.min(100,eligibleScore/(next?.threshold||3000)*100)+'%';
 $('#nextReward').textContent=receipt?tr('جایزهٔ این مرورگر قبلاً انتخاب شده است.','This browser’s campaign reward is already selected.'):next?tr(`${num(next.threshold-eligibleScore)} امتیاز تا ${next.fa}`,`${num(next.threshold-eligibleScore)} points to ${next.en}`):tr('انتخاب جایزه پس از تمام‌شدن سه جان.','Select a reward after all three lives are used.');
 $('#rewardList').innerHTML=REWARDS.map(p=>`<div class="reward-mini"><span class="reward-icon">${p.icon}</span><div><strong>${tr(p.fa,p.en)}</strong><small>${num(p.threshold)} ${tr('امتیاز همین دور','this run’s points')}</small></div><span class="lock">${receipt?(receipt.prize===p.id?'✓':'—'):eligibleScore>=p.threshold?'✦':'◇'}</span></div>`).join('');
}
function audioLabels(){const e=$('#sound');e.textContent=sound.enabled?'♪':'♪̸';e.setAttribute('aria-label',tr(sound.enabled?'قطع همه صداها':'روشن کردن صدا',sound.enabled?'Mute all audio':'Enable audio'));e.setAttribute('aria-pressed',String(sound.enabled));$('#music').textContent=tr(sound.music?'موسیقی: روشن':'موسیقی: خاموش',sound.music?'Music: on':'Music: off');$('#music').setAttribute('aria-pressed',String(sound.music))}
function modal(html){$('#dialogBody').innerHTML=html;if(!$('#dialog').open)$('#dialog').showModal()}
function closeModal(){ $('#dialog').close();if(game.state==='paused'){game.pause();sound.active(true)} }
async function signup(){await sound.unlock();audioLabels();modal(`<span class="eyebrow">MAGIC ASCENT</span><h2>${tr('آمادهٔ صعودی؟','Ready to rise?')}</h2><p>${tr('پرش روی سکوها خودکار است. چپ و راست هدایت کن؛ برای فرار از خطر، جهش را بزن. سه جان داری.','Bounce automatically on platforms. Steer left and right; use Boost to dodge danger. You have three lives.')}</p><form id="signup"><label for="name">${tr('نام و نام خانوادگی','Full name')}</label><input id="name" required minlength="3" maxlength="80" autocomplete="name"><label for="phone">${tr('شماره همراه','Mobile number')}</label><input id="phone" required inputmode="tel" autocomplete="tel" dir="ltr" placeholder="0912 345 6789"><p class="demo-note">${tr('فرم نمایشی است؛ نام و شماره ارسال یا ذخیره نمی‌شوند.','Demo form: your name and number are neither sent nor saved.')}</p><p id="formError" role="alert"></p><button class="primary">${tr('شروع با ۳ شعله ✦','Start with 3 flames ✦')}</button></form>`);
 $('#signup').onsubmit=e=>{e.preventDefault();const phone=$('#phone').value.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[\s()-]/g,'');if(!/^(09\d{9}|\+989\d{9})$/.test(phone)||$('#name').value.trim().length<3){$('#formError').textContent=tr('نام کامل و شماره همراه معتبر ایران وارد کن.','Enter your full name and a valid Iranian mobile number.');return}$('#dialog').close();$('#dialogBody').replaceChildren();start()};
}
function start(){game.reset();Object.assign(motion,{camera:0,squash:0,squashVelocity:0,lean:0,face:1,pose:2,fromPose:2,blend:1});particles=[];keys={};touchDirection=0;dragX=null;$('#welcome').hidden=true;$('.arena').classList.add('playing');sound.active(true);sound.effect('start');updateHUD();updateRewards();canvas.focus();}
function showRewards(){
 if(game.state==='playing'){game.pause();sound.active(false)}receipt=getReceipt();
 const finished=game.state==='over'&&!!game.result;
 const earned=finished?game.result.score:0;
 const available=REWARDS.filter(p=>p.threshold<=earned);
 modal(`<span class="eyebrow">${finished?'YOUR ASCENT · YOUR REWARDS':'REWARD TRAIL'}</span><h2>${finished?tr('تا اینجا به این جوایز رسیدی','Here’s what you reached'):tr('جوایز پایان بازی','End-of-run rewards')}</h2>${finished?`<div class="results-score">${num(earned)}</div><p>${tr('سه جانت تمام شد. مسیر و امتیاز بازی صفر شده، اما نتیجهٔ این دور برای انتخاب جایزه آماده است.','Your three lives are gone. The route and live score reset, but this run’s result is ready for reward selection.')}</p>`:''}<p>${finished?(available.length?tr('از بین جایزه‌های روشن‌شده فقط یکی را انتخاب کن.','Choose just one of the unlocked rewards.'):tr('این بار به حداقل جایزه نرسیدی؛ یک صعود تازه امتحان کن.','No reward threshold reached this time. Try a fresh ascent.')):tr('جوایز بعد از تمام‌شدن هر سه جان نشان داده می‌شوند. رکورد قبلی برای جایزه حساب نمی‌شود.','Rewards are offered after all three lives are used. Previous records do not count.')}</p><p class="demo-note">${tr('جوایز نمایشی‌اند؛ فقط یک جایزه در کل این کمپین و همین مرورگر.','Demo rewards. Only one campaign reward in this browser.')}</p>${receipt?`<div class="receipt"><h3>${tr('جایزهٔ انتخاب‌شدهٔ تو','Your selected reward')}</h3><p>${tr(...rewardTitle(receipt.prize))}</p><code>${escapeHTML(receipt.code)}</code></div>`:''}<div class="end-rewards">${REWARDS.map(p=>`<div class="prize ${finished&&earned>=p.threshold?'earned':'locked'}"><h3>${p.icon} ${tr(p.fa,p.en)}</h3><p>${rewardDescription(p.id)} · ${num(p.threshold)} ${tr('امتیاز','points')}</p><button data-claim="${p.id}" ${receipt||!finished||earned<p.threshold||!storage?'disabled':''}>${receipt?tr('انتخاب کمپین انجام شده','Campaign reward already selected'):!finished?tr('بعد از پایان سه جان','After all three lives'):earned<p.threshold?tr('در این دور نرسیدی','Not reached this run'):tr('این جایزه را انتخاب می‌کنم','I choose this reward')}</button></div>`).join('')}</div>${finished?`<p>${available.length&&!receipt?tr('با شروع دور بعد، فرصت انتخاب از نتیجهٔ این دور از دست می‌رود.','Starting a new run discards this unclaimed result.'):''}</p><button id="restartAfterResult" class="secondary">${tr('شروع دور تازه ↻','Start a new run ↻')}</button>`:''}`);
 document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>confirmReward(b.dataset.claim));
 const restart=$('#restartAfterResult');if(restart)restart.onclick=()=>{$('#dialog').close();start()};
}
function rewardTitle(id){const p=REWARDS.find(p=>p.id===id);return p?[p.fa,p.en]:['جایزهٔ انتخاب‌شده','Selected reward']}
function rewardDescription(id){return ({discount:tr('کد تخفیف نمایشی بلیط','Demo ticket discount code'),album:tr('انتخاب موسیقی یکی از سه نمایش','Choose one of three show soundtracks'),stationery:tr('دفتر، پک مدادرنگی و بج سینه','Notebook, colored pencils and pin badge'),keychain:tr('جاکلیدی با شکل دیوولی','A silicone Divoolee keychain'),ticket:tr('یک بلیط برای نمایش','One show ticket')})[id]}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function confirmReward(id){
 const p=REWARDS.find(p=>p.id===id);if(!p)return;
 modal(`<span class="eyebrow">YOUR ONE REWARD</span><h2>${tr(p.fa,p.en)}</h2><p>${tr('با تأیید، این تنها جایزهٔ تو در این کمپین خواهد بود. می‌توانی برگردی و یکی دیگر از جایزه‌های همین نتیجه را انتخاب کنی.','Confirming makes this your only campaign reward. You can go back and choose another reward reached in this result.')}</p>${id==='album'?`<label for="album">${tr('انتخاب آلبوم','Choose soundtrack')}</label><select id="album">${worlds.slice(1).map((w,i)=>`<option value="${i}">${tr(...w)}</option>`).join('')}</select>`:''}<p id="claimError" role="alert"></p><button id="confirmClaim" class="primary">${tr('تأیید همین جایزه','Confirm this reward')}</button><button id="backRewards" class="secondary">${tr('برگشت','Go back')}</button>`);
 $('#backRewards').onclick=showRewards;
 $('#confirmClaim').onclick=async()=>{
  $('#confirmClaim').disabled=true;
  const execute=()=>{
   receipt=getReceipt();if(receipt)throw Error('already_claimed');
   const code='DEMO-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)).slice(0,10).toUpperCase();
   const album=id==='album'?Number($('#album').value):null;
   receipt=DivooleeRewards.claim(storage,game,id,code,album);best=Math.max(best,game.result.score);saveBest();sound.effect('win');sound.active(false);updateRewards();updateHUD();showWin();
  };
  try{if(navigator.locks?.request)await navigator.locks.request('divoolee-one-reward',execute);else execute()}catch(e){const error=$('#claimError');if(error)error.textContent=tr(e.message==='already_claimed'?'قبلاً جایزه انتخاب شده است.':'دریافت انجام نشد؛ ذخیره‌سازی مرورگر باید فعال باشد.',e.message==='already_claimed'?'A reward has already been chosen.':'Could not claim. Browser storage must be available.');$('#confirmClaim')?.removeAttribute('disabled')}
 };
}
function showWin(){modal(`<span class="eyebrow">MAGIC ACHIEVED</span><h2>${tr('جادوت جواب داد!','Your magic worked!')}</h2><p>${tr(...rewardTitle(receipt.prize))}</p><code class="code">${escapeHTML(receipt.code)}</code>${receipt.album!==null&&receipt.album!==undefined?`<p>${tr(...worlds[receipt.album+1])}</p>`:''}<p>${tr('دریافت نمایشی ثبت شد. این کد اعتبار واقعی ندارد. ادامهٔ بازی برای رکورد آزاد است؛ جایزهٔ دیگری در این مرورگر داده نمی‌شود.','Demo claim recorded. This code has no real value. You may keep playing for a record, but this browser cannot claim another prize.')}</p><button class="primary" id="again">${tr('بازی برای رکورد','Play for a record')}</button>`);$('#again').onclick=()=>{$('#dialog').close();start()}}
function gameOver(result){best=Math.max(best,result.score);saveBest();sound.active(false);keys={};touchDirection=0;updateHUD();updateRewards();showRewards()}
function saveBest(){try{storage?.setItem('dv-ascent-best',String(best))}catch{}}
function story(){modal(`<span class="eyebrow">THE ASCENT OF DIVOOLEE</span><h2>${tr('ساده شروع می‌شود…','It starts simple…')}</h2><p>${tr('جادوی صحنه در آسمان پخش شده است. دیوولی با هر فرود دوباره می‌پرد؛ تو مسیرش را انتخاب می‌کنی. امتیاز از ارتفاع تازه و شعله‌ها می‌آید، نه از صبرکردن.','The stage’s magic is scattered across the sky. Divoolee bounces on every landing; you choose the route. Points come from new height and sparks, never from waiting.')}</p><h3>${tr('سه جان؛ یک شانس برای انتخاب','Three lives. One reward choice.')}</h3><p>${tr('دو ضربهٔ اول یک شعله کم می‌کند و تو را به سکو برمی‌گرداند. بعد از ضربهٔ سوم مسیر و امتیاز صفر می‌شود و جایزه‌های آن دور نشان داده می‌شوند؛ از بین آن‌ها فقط یکی را انتخاب کن.','The first two hits consume a flame and return you to a platform. The third resets the route and score, then reveals rewards reached in that run. Choose only one.')}</p><h3>${tr('هرچه بالاتر، سخت‌تر','Higher means harder')}</h3><p>${tr('سرعت بازی تا ۳٫۶ برابر زیاد می‌شود و سکوها باریک‌تر می‌شوند؛ سکوهای بنفش حرکت می‌کنند و سکوهای صورتی بعد از فرود می‌شکنند. از امتیاز ۹۰۰، نزدیک جایزهٔ لوازم‌التحریر، گوی‌های آتش پس از هشدار از کنار می‌آیند. جهش را برای فرار نگه دار؛ شارژ آن ۲٫۶ ثانیه طول می‌کشد.','Game speed rises up to 3.6×. Platforms narrow. Purple ones move; pink ones crumble after landing. From 900 points, near the stationery reward, fireballs arrive from the sides after a warning. Save Boost for dodging; it recharges in 2.6 seconds.')}</p><h3>${tr('جادوهای کمکی','Helpful spells')}</h3><p>${tr('◈ سپر یک ضربه را می‌گیرد. ✦ آهن‌ربا ۸ ثانیه شعله‌ها را جذب می‌کند. ◷ زمان آهسته برای ۶ ثانیه فرصت واکنش بیشتری می‌دهد.','◈ Shield absorbs one hit. ✦ Magnet attracts sparks for 8 seconds. ◷ Slow time gives you 6 seconds of extra reaction time.')}</p><h3>${tr('همراهان آیندهٔ دیوولی','Future Divoolee partners')}</h3><p>${tr('دروازهٔ برند، مأموریت هفتگی، جادوی سفارشی و جایزهٔ مشترک برای اسپانسرها؛ همراه با سقف موجودی و گزارش کمپین در نسخهٔ متصل به سرور. این‌ها مسیر توسعهٔ آینده‌اند.','Branded portals, weekly quests, custom spells and co-branded prizes for sponsors, with inventory caps and campaign reporting in a server-connected edition. These are future development options.')}</p>`)}
function burst(x,y,color='#b9a1ff',count=18){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*180,life:.5+Math.random()*.4,size:2+Math.random()*4,color})}
function processEvents(){for(const e of game.drain()){
 if(e.type==='collect'){sound.effect(e.kind?'spell':'collect');burst(e.x,e.y,e.kind?'#d694ff':'#86fff2');updateRewards()}
 else if(e.type==='life'){sound.effect('life');shake=reduced?0:.32;flash=.3;burst(game.player.x+22,game.player.y+28,'#6bbdff',30);toast('یک شعله از دست رفت؛ '+num(e.lives)+' جان مانده.','One flame lost. '+e.lives+' lives remain.')}
 else if(e.type==='gameover'){sound.effect('gameover');gameOver(e)}
 else if(e.type==='shield'){sound.effect('shield');burst(game.player.x+22,game.player.y+28,'#ac9bff',25);toast('سپر ضربه را گرفت.','Your shield absorbed the hit.')}
 else if(e.type==='boost'){motion.squashVelocity=-2.8;sound.effect('boost');burst(game.player.x+22,game.player.y+50,'#e195ff',25)}
 else if(e.type==='jump'){motion.squash=.18;motion.squashVelocity=-1.5;sound.effect('jump');}else if(e.type==='warning')sound.effect('warning');
}}
function drawPose(context,index,x,y,w,h,face=1){if(!sheet.complete||!sheet.naturalWidth)return;const [sx,sy,sw,sh]=frames[index],scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;context.save();context.translate(x+w/2,y+h);context.scale(face,1);context.drawImage(sheet,sx,sy,sw,sh,-dw/2,-dh,dw,dh);context.restore()}
function vfx(index,x,y,w,h,alpha=1,rotation=0){if(!atlas.complete||!atlas.naturalWidth)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+w/2,y+h/2);ctx.rotate(rotation);const sw=atlas.naturalWidth/4;ctx.drawImage(atlas,index*sw,0,sw,atlas.naturalHeight,-w/2,-h/2,w,h);ctx.restore()}
function drawBackground(){
 // Perspective depth layers: stars and magic volumes move at distinct depths.
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<3;i++){const z=i+1,x=240+Math.sin(visualTime*.07+i*2)*210,y=220+i*155+Math.sin(visualTime*.12+i)*40+(motion.camera*.025/z)%80;vfx(3,x-150/z,y-160/z,300/z,320/z,.11,Math.sin(visualTime*.05+i)*.15)}
 for(const s of stars){const depth=s.z,parallax=(-motion.camera*.14/depth)%960,y=((s.y+visualTime*(5+depth*2)+parallax)%960)-120,x=WIDTH/2+s.x/depth+Math.sin(visualTime*.2+s.phase)*10;ctx.globalAlpha=.2+.3*(.5+.5*Math.sin(visualTime+s.phase));ctx.fillStyle=depth%2?'#80f7ed':'#c393ff';ctx.shadowBlur=depth===1?12:0;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(x,y,Math.max(.8,3/depth),0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
function draw(){
 ctx.setTransform(devicePixelRatio>2?2:devicePixelRatio||1,0,0,devicePixelRatio>2?2:devicePixelRatio||1,0,0);ctx.clearRect(0,0,cssW,cssH);ctx.translate(offsetX,offsetY);ctx.scale(renderScale,renderScale);ctx.save();ctx.beginPath();ctx.rect(0,0,WIDTH,HEIGHT);ctx.clip();
 if(shake>0)ctx.translate(Math.sin(visualTime*70)*shake*10,Math.cos(visualTime*55)*shake*8);
 drawBackground();
 if(game.state==='idle'){ctx.restore();drawHero();return}
 for(const p of game.platforms){const y=p.y-motion.camera;if(y<-30||y>HEIGHT+40)continue;ctx.save();const fade=p.crumble<0?1:Math.max(0,1-p.crumble*3);ctx.globalAlpha=fade;const color=p.kind==='moving'?'#c399ff':p.kind==='crumble'?'#ff97cf':'#78f4e2';ctx.shadowBlur=16;ctx.shadowColor=color;const g=ctx.createLinearGradient(0,y,0,y+24);g.addColorStop(0,color);g.addColorStop(.18,'#52808c');g.addColorStop(1,'#152d4e');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(p.x,y,p.w,18,8);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#e5fffbbb';ctx.fillRect(p.x+9,y+1,p.w-18,2);if(p.kind==='crumble'){ctx.strokeStyle='#ffdaed';ctx.beginPath();ctx.moveTo(p.x+p.w*.5,y+2);ctx.lineTo(p.x+p.w*.43,y+9);ctx.lineTo(p.x+p.w*.55,y+16);ctx.stroke()}ctx.restore()}
 for(const s of game.sparks){const y=s.y-motion.camera+Math.sin(visualTime*3+s.x)*3;if(y<-60||y>HEIGHT+60)continue;vfx(s.kind?1:0,s.x-17,y-23,34,44,.95);if(s.kind){ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(['','◈','✦','◷'][s.kind],s.x,y+30)}}
 for(const h of game.hazards){const y=h.y-motion.camera;if(h.warn>0){ctx.save();ctx.globalAlpha=.35+.4*Math.sin(visualTime*16)**2;ctx.strokeStyle='#ffab65';ctx.setLineDash([7,12]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WIDTH,y);ctx.stroke();ctx.fillStyle='#ffc88c';ctx.font='bold 24px Arial';ctx.textAlign=h.vx>0?'left':'right';ctx.fillText(h.vx>0?'! →':'← !',h.vx>0?12:WIDTH-12,y-12);ctx.restore()}else{for(let i=3;i>=1;i--)vfx(2,h.x-Math.sign(h.vx)*i*17-21,y-24,42,48,.15*(4-i));vfx(2,h.x-26,y-30,52,60,1,Math.sin(h.age*6)*.08)}}
 for(const p of particles){ctx.save();ctx.globalAlpha=Math.min(1,p.life*1.4);ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y-motion.camera,p.size,0,Math.PI*2);ctx.fill();ctx.restore()}
 const p=game.player,py=p.y-motion.camera;
 if(game.invincible<=0||Math.floor(visualTime*12)%2===0){
  ctx.save();ctx.globalCompositeOperation='screen';vfx(1,p.x-14,py+23,48,70,.4+Math.sin(visualTime*5)*.1);vfx(0,p.x+7,py+35,33,52,.35);ctx.restore();
  if(game.shield||game.invincible>0){ctx.save();ctx.strokeStyle=game.shield?'#bb9aff':'#80faff';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=14;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x+22,py+28,37,46,0,0,Math.PI*2);ctx.stroke();ctx.restore()}
  const index=p.vy<-430?1:p.vy<80?2:p.vy<350?3:0;
  ctx.save();ctx.translate(p.x+22,py+58);ctx.rotate(motion.lean);const flightStretch=Math.max(-.055,Math.min(.08,-p.vy/8500));ctx.scale(1+motion.squash-flightStretch,1-motion.squash+flightStretch);ctx.shadowColor='#bf7fff';ctx.shadowBlur=14;const ease=motion.blend*motion.blend*(3-2*motion.blend);const facing=(motion.face<0?-1:1)*Math.max(.65,Math.abs(motion.face));if(ease<1){ctx.globalAlpha=1-ease;drawPose(ctx,motion.fromPose,-34,-78,68,82,facing)}ctx.globalAlpha=ease;drawPose(ctx,motion.pose,-34,-78,68,82,facing);ctx.restore();
 }
 if(game.score>=300){const g=ctx.createLinearGradient(0,HEIGHT-80,0,HEIGHT);g.addColorStop(0,'#b955ff00');g.addColorStop(1,'#af4ffb44');ctx.fillStyle=g;ctx.fillRect(0,HEIGHT-80,WIDTH,80)}
 if(flash>0){ctx.fillStyle=`rgba(96,155,255,${flash*.38})`;ctx.fillRect(0,0,WIDTH,HEIGHT)}
 if(game.state==='paused'){ctx.fillStyle='#07122599';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.fillStyle='#e5fffa';ctx.font='bold 26px Vazirmatn,Arial';ctx.textAlign='center';ctx.fillText(tr('یک نفس، بعد بالاتر','A breath, then higher'),WIDTH/2,HEIGHT/2)}
 ctx.restore();
}
function drawHero(){const c=$('#heroSprite');if(!c)return;const h=c.getContext('2d');h.clearRect(0,0,c.width,c.height);h.shadowColor='#a46aff';h.shadowBlur=25;if(!turntable.draw(h,10,15,c.width-20,c.height-45))drawPose(h,2,10,15,c.width-20,c.height-45)}
function resize(){const r=canvas.getBoundingClientRect();cssW=r.width;cssH=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);renderScale=Math.min(cssW/WIDTH,cssH/HEIGHT);offsetX=(cssW-WIDTH*renderScale)/2;offsetY=(cssH-HEIGHT*renderScale)/2;}
new ResizeObserver(resize).observe(canvas);
let uiTick=0;
function animateBody(dt){
 const blend=1-Math.exp(-dt*14);motion.camera+=(game.camera-motion.camera)*blend;
 motion.squashVelocity+=(-motion.squash*170-motion.squashVelocity*15)*dt;motion.squash+=motion.squashVelocity*dt;
 motion.lean+=(Math.max(-.16,Math.min(.16,game.player.vx/2100))-motion.lean)*(1-Math.exp(-dt*12));
 motion.face+=(game.player.facing-motion.face)*(1-Math.exp(-dt*18));
 const target=game.player.vy<-430?1:game.player.vy<80?2:game.player.vy<350?3:0;
 if(target!==motion.pose){motion.fromPose=motion.pose;motion.pose=target;motion.blend=0}motion.blend=Math.min(1,motion.blend+dt/.11);
}
function frame(now){const dt=Math.min((now-last)/1000||0,1/30);last=now;if(!document.hidden){visualTime+=reduced?dt*.2:dt;turntable.update(dt);let dir=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0)+touchDirection;if(dragX!==null)dir=Math.max(-1,Math.min(1,(dragX-(game.player.x+22))/30));game.update(dt,dir);processEvents();animateBody(dt);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);if(game.state==='playing'&&!reduced&&Math.random()<.65){particles.push({x:game.player.x+22+(Math.random()-.5)*15,y:game.player.y+43,vx:(Math.random()-.5)*18,vy:25+Math.random()*35,life:.35,size:1+Math.random()*2.5,color:Math.random()<.5?'#bf8aff':'#66efff'})}shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt);toastTime-=dt;if(toastTime<=0)$('#toast').classList.remove('visible');uiTick+=dt;if(uiTick>.09){uiTick=0;updateHUD();updateRewards()}draw()}requestAnimationFrame(frame)}
function togglePause(){if(game.pause()){keys={};touchDirection=0;dragX=null;sound.active(game.state==='playing');updateHUD()}}
$('#heroTurn').onclick=async()=>{const front=turntable.toggle();$('#heroTurn').setAttribute('aria-pressed',String(front));await sound.unlock();sound.effect('collect')};
$('#pause').onclick=togglePause;$('#start').onclick=signup;$('#language').onclick=()=>{lang=lang==='fa'?'en':'fa';translate()};$('#close').onclick=closeModal;$('#dialog').addEventListener('cancel',()=>{if(game.state==='paused'){game.pause();sound.active(true)}});
$('#sound').onclick=async()=>{sound.enabled=!sound.enabled;await sound.unlock();sound.apply();audioLabels()};$('#music').onclick=async()=>{sound.music=!sound.music;await sound.unlock();sound.apply();audioLabels()};$('#claimShortcut').onclick=showRewards;
$('#homeAgain').onclick=start;
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{if(b.dataset.panel==='game'){closeModal();return}if(game.state==='playing'){game.pause();sound.active(false)}b.dataset.panel==='story'?story():showRewards()});
window.addEventListener('keydown',e=>{if($('#dialog').open||/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(['Space','ArrowUp'].includes(e.code)&&!e.repeat)game.boost();if(e.code==='KeyP'&&!e.repeat)togglePause()});
window.addEventListener('keyup',e=>keys[e.code]=false);
function unfocus(){keys={};touchDirection=0;dragX=null;if(game.state==='playing'){game.pause();sound.active(false)}}window.addEventListener('blur',unfocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)unfocus()});
$('#jump').onpointerdown=e=>{e.preventDefault();game.boost()};
for(const [id,d] of [['left',-1],['right',1]]){const b=$('#'+id);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touchDirection=d};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>touchDirection=0}
canvas.onpointerdown=e=>{if(game.state!=='playing')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);dragX=(e.clientX-canvas.getBoundingClientRect().left-offsetX)/renderScale};canvas.onpointermove=e=>{if(dragX!==null)dragX=(e.clientX-canvas.getBoundingClientRect().left-offsetX)/renderScale};canvas.onpointerup=canvas.onpointercancel=()=>dragX=null;
window.addEventListener('storage',e=>{if(e.key===DivooleeRewards.KEY){receipt=getReceipt();updateRewards();if($('#dialog').open&&$('#dialogBody [data-claim]'))showRewards()}});
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'read_game_progress',description:'Read the current vertical game state and the local demo reward lock.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(!input||Object.keys(input).length)throw Error('No arguments accepted');return{score:game.score,lives:game.lives,state:game.state,level:game.level,best,claimed:!!getReceipt()}}})}catch{}}
sheet.onload=drawHero;translate();requestAnimationFrame(frame);
