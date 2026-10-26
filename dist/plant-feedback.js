// A separate, gesture-started bus keeps planting feedback independent of ambience.
const KEY='unfinished-garden-plant-feedback';

// Original noise-based foley: compact earth impact, irregular grit, leafy tail.
// No pitched oscillator, chime, or imported game recording.
export function plantingTexture(sampleRate,seed=1){
 const data=new Float32Array(Math.ceil(sampleRate*.24));
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const grains=Array.from({length:11},(_,i)=>({start:.006+i*.008+random()*.006,length:.004+random()*.011,level:.10+random()*.13}));
 let bass=0,body=0,leaf=0,peak=0;
 const pole=hz=>1-Math.exp(-2*Math.PI*hz/sampleRate);
 const bassPole=pole(160),bodyPole=pole(1800),leafPole=pole(3400);
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,n=random()*2-1;
  bass+=bassPole*(n-bass);body+=bodyPole*(n-body);leaf+=leafPole*(n-leaf);
  const attack=Math.min(1,t/.0025),fade=Math.min(1,(.24-t)/.025);
  const impact=(bass*3.8+body*.27)*Math.exp(-t/ .027)*attack;
  let crunch=0;
  for(const grain of grains){const u=(t-grain.start)/grain.length;if(u>0&&u<1)crunch+=Math.sin(Math.PI*u)*grain.level;}
  const rustle=Math.max(0,t-.025)/.035*Math.exp(-Math.max(0,t-.025)/.035);
  data[i]=(impact+(body-bass)*crunch+(leaf-body)*rustle*.7)*Math.max(0,fade);
  peak=Math.max(peak,Math.abs(data[i]));
 }
 // Fixed headroom for repeated placement; the buffer ends at zero without clicks.
 for(let i=0;i<data.length;i++)data[i]*=.48/Math.max(peak,.001);
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
