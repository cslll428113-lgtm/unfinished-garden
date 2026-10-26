// A separate, gesture-started bus keeps planting feedback independent of ambience.
const KEY='unfinished-garden-plant-feedback';

// A quiet leaf/soil brush with a rounded envelope, without an impact transient.
// No pitched oscillator, chime, or imported game recording.
export function plantingTexture(sampleRate,seed=1){
 const data=new Float32Array(Math.ceil(sampleRate*.24));
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const grains=Array.from({length:5},(_,i)=>({start:.015+i*.022+random()*.009,length:.025+random()*.018,level:.10+random()*.08}));
 let low=0,body=0,soft=0,peak=0;
 const pole=hz=>1-Math.exp(-2*Math.PI*hz/sampleRate);
 const lowPole=pole(450),bodyPole=pole(2200),softPole=pole(2600);
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,n=random()*2-1;
  low+=lowPole*(n-low);body+=bodyPole*(n-body);soft+=softPole*((body-low)-soft);
  const attack=Math.sin(Math.min(1,t/.025)*Math.PI/2)**2;
  const tail=Math.exp(-Math.max(0,t-.025)/.038);
  const fade=Math.sin(Math.min(1,Math.max(0,.24-t)/.035)*Math.PI/2)**2;
  let texture=.22;
  for(const grain of grains){const u=(t-grain.start)/grain.length;if(u>0&&u<1)texture+=Math.sin(Math.PI*u)**2*grain.level;}
  data[i]=soft*texture*attack*tail*fade;
  peak=Math.max(peak,Math.abs(data[i]));
 }
 // Peak is 14.5 dB below the previous impact: gentle even on headphones.
 for(let i=0;i<data.length;i++)data[i]*=.09/Math.max(peak,.001);
 data[data.length-1]=0;
 return data;
}
export class PlantFeedback {
 constructor({Audio=globalThis.AudioContext||globalThis.webkitAudioContext,storage=globalThis.localStorage,page=globalThis.document}={}){
  this.Audio=Audio;this.storage=storage;this.page=page;this.enabled=true;this.generation=0;this.active=new Set();this.lastVariant=-1;
  try{this.enabled=storage?.getItem(KEY)!=='off';}catch{}
  page?.addEventListener('visibilitychange',()=>{if(page.hidden){this.generation++;this.stop();this.ctx?.suspend().catch(()=>{});}});
 }
 stop(){for(const source of this.active){source.stop();source.disconnect();}this.active.clear();}
 setEnabled(enabled){this.enabled=enabled;this.generation++;try{this.storage?.setItem(KEY,enabled?'on':'off');}catch{}if(!enabled&&this.ctx){this.stop();this.ctx.suspend().catch(()=>{});}}
 async play(){
  if(!this.enabled||this.page?.hidden)return false;
  if(!this.Audio)throw new Error('Audio unavailable');
  const generation=this.generation;
  this.ctx??=new this.Audio();const c=this.ctx;
  await c.resume();
  if(!this.enabled||this.page?.hidden||generation!==this.generation)return false;
  this.buffers??=[91,237,541,883,1297].map(seed=>{const data=plantingTexture(c.sampleRate,seed),buffer=c.createBuffer(1,data.length,c.sampleRate);buffer.getChannelData(0).set(data);return buffer;});
  const variant=(this.lastVariant+1+Math.floor(Math.random()*(this.buffers.length-1)))%this.buffers.length;this.lastVariant=variant;
  // Keep rapid planting from building into a loud wash of overlapping impacts.
  if(this.active.size>=3){const oldest=this.active.values().next().value;oldest.stop();oldest.disconnect();this.active.delete(oldest);}
  const source=c.createBufferSource();source.buffer=this.buffers[variant];source.playbackRate.value=.94+Math.random()*.12;
  source.connect(c.destination);this.active.add(source);source.onended=()=>{source.disconnect();this.active.delete(source);};source.start();
  return true;
 }
}
