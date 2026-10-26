// A separate, gesture-started bus keeps planting feedback independent of ambience.
const KEY='unfinished-garden-plant-feedback';
export class PlantFeedback {
 constructor({Audio=globalThis.AudioContext||globalThis.webkitAudioContext,storage=globalThis.localStorage,page=globalThis.document}={}){
  this.Audio=Audio;this.storage=storage;this.page=page;this.enabled=true;this.generation=0;
  try{this.enabled=storage?.getItem(KEY)!=='off';}catch{}
  page?.addEventListener('visibilitychange',()=>{if(page.hidden){this.generation++;this.ctx?.suspend().catch(()=>{});}});
 }
 setEnabled(enabled){this.enabled=enabled;this.generation++;try{this.storage?.setItem(KEY,enabled?'on':'off');}catch{}if(!enabled&&this.ctx)this.ctx.suspend().catch(()=>{});}
 async play(){
  if(!this.enabled||this.page?.hidden)return false;
  if(!this.Audio)throw new Error('Audio unavailable');
  const generation=this.generation;
  this.ctx??=new this.Audio();const c=this.ctx;
  await c.resume();
  if(!this.enabled||this.page?.hidden||generation!==this.generation)return false;
  // Two quiet, rounded notes: a soft landing followed by a tiny upward bloom.
  for(const [frequency,delay,level,duration] of [[392,0,.12,.15],[587.33,.07,.075,.23]]){
   const t=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(frequency*1.12,t+duration);
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(level,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   osc.connect(gain).connect(c.destination);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  return true;
 }
}
