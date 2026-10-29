export function installCamera({renderer,scene,camera,title,motion,onOpen,onClose}){
 const $=s=>document.querySelector(s),dialog=$('#model-ref'),photo=$('#model-ref img'),button=$('#reference');let timer=0,flashTimer=0,previousFocus;
 function finish(){clearTimeout(timer);clearTimeout(flashTimer);document.body.classList.remove('camera-flash');dialog.classList.remove('developing');dialog.classList.add('developed')}
 const syncMotion=()=>{document.body.classList.toggle('camera-motion-off',!motion());if(!motion())finish()};syncMotion();
 async function capture(){
  clearTimeout(timer);clearTimeout(flashTimer);onOpen();renderer.render(scene,camera);photo.src=renderer.domElement.toDataURL('image/png');
  $('#photo-caption').textContent=title+' / '+new Date().toLocaleDateString('en-CA');
  dialog.classList.remove('developing','developed');photo.style.transition='none';photo.style.filter='grayscale(1)';void photo.offsetWidth;photo.style.transition='';photo.style.filter='';if(!dialog.open){previousFocus=document.activeElement;dialog.showModal()}
  button.setAttribute('aria-pressed','true');
  if(motion()){document.body.classList.remove('camera-flash');void document.body.offsetWidth;document.body.classList.add('camera-flash');flashTimer=setTimeout(()=>document.body.classList.remove('camera-flash'),450);void dialog.offsetWidth;dialog.classList.add('developing');timer=setTimeout(()=>{dialog.classList.remove('developing');dialog.classList.add('developed')},2700)}else finish();
 }
 function close(){dialog.close()}
 button.onclick=capture;$('#photo-retake').onclick=capture;$('#photo-close').onclick=close;
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 dialog.addEventListener('close',()=>{finish();button.setAttribute('aria-pressed','false');previousFocus?.focus({preventScroll:true});onClose()});
 $('#photo-save').onclick=()=>{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),w=photo.naturalWidth,h=photo.naturalHeight,pad=Math.round(w*.045),bottom=Math.round(w*.12);canvas.width=w+pad*2;canvas.height=h+pad+bottom;ctx.fillStyle='#faf8f1';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(photo,pad,pad,w,h);ctx.fillStyle='#424342';ctx.font=Math.round(w*.018)+'px Arial';ctx.fillText($('#photo-caption').textContent,pad,pad+h+bottom*.55);canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Draven-'+title.replace(/[^a-z0-9]+/gi,'-')+'-instant-photo.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png')};
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',syncMotion);addEventListener('storage',e=>{if(e.key==='draven-v4-motion')syncMotion()});
}
