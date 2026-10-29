/* Resume only after three seconds without mouse, touch, wheel or keyboard input. */
export function installIdleTour({setTour,canResume=()=>true,toggle}){
 let timer=0;const pointers=new Set(),keys=new Set();
 const motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&localStorage.getItem('draven-v4-motion')!=='reduced';
 function schedule(){clearTimeout(timer);if(document.hidden||pointers.size||keys.size||!motion())return;timer=setTimeout(()=>{if(!document.hidden&&!pointers.size&&!keys.size&&motion()&&canResume())setTour(true)},3000)}
 function activity(e){if(!toggle||!e.target.closest?.(toggle))setTour(false);schedule()}
 document.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);activity(e)},{passive:true});
 document.addEventListener('pointermove',activity,{passive:true});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{pointers.delete(e.pointerId);schedule()},{passive:true});
 document.addEventListener('wheel',activity,{passive:true});
 document.addEventListener('keydown',e=>{keys.add(e.code);activity(e)});
 document.addEventListener('keyup',e=>{keys.delete(e.code);schedule()});
 document.addEventListener('click',schedule);
 document.addEventListener('visibilitychange',()=>{pointers.clear();keys.clear();setTour(false);schedule()});
 addEventListener('blur',()=>{pointers.clear();keys.clear();setTour(false);clearTimeout(timer)});addEventListener('focus',schedule);
 addEventListener('storage',e=>{if(e.key==='draven-v4-motion'){setTour(false);schedule()}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{setTour(false);schedule()});
 addEventListener('pagehide',()=>clearTimeout(timer));
 return {schedule,pause:()=>{clearTimeout(timer);setTour(false)}};
}
