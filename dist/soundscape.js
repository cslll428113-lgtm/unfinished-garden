// Procedural sound: generated locally, no external audio or autoplay requests.
export class Soundscape{
 constructor(){this.enabled=false;this.volume=.35;this.world='white';this.rain=false;this.winter=false;this.layers=[];document.addEventListener('visibilitychange',()=>{if(!this.ctx)return;if(document.hidden)this.ctx.suspend();else if(this.enabled)this.ctx.resume().catch(()=>{});});}
 async toggle(){
  if(this.enabled){this.enabled=false;clearInterval(this.timer);this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.12);await this.ctx.suspend();return false;}
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');
  if(!this.ctx){this.ctx=new Audio();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate);let data=this.buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  await this.ctx.resume();this.enabled=true;this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.15);this.refresh();this.timer=setInterval(()=>{if(this.enabled&&!document.hidden&&this.world==='mountain'&&!this.rain)this.bird();},5300);return true;
 }
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.ctx)this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.1);}
 set(world,rain,winter){if(this.world===world&&this.rain===rain&&this.winter===winter)return;this.world=world;this.rain=rain;this.winter=winter;if(this.enabled)this.refresh();}
 refresh(){
  for(const layer of this.layers){layer.source.stop();layer.lfo.stop();layer.nodes.forEach(n=>n.disconnect());}this.layers=[];
  const add=(frequency,level,rate,depth)=>{const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),lfo=c.createOscillator(),mod=c.createGain();source.buffer=this.buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=level;lfo.frequency.value=rate;mod.gain.value=depth;source.connect(filter).connect(gain).connect(this.master);lfo.connect(mod).connect(gain.gain);source.start();lfo.start();this.layers.push({source,lfo,nodes:[source,filter,gain,lfo,mod]});};
  if(this.world==='coast'){add(950,.25,.12,.2);add(240,.13,.08,.06);}else add(this.world==='snow'?650:400,this.world==='white'?.05:.13,.16,.035);
  if(this.rain)add(this.winter?900:4200,this.winter?.035:.14,.8,.015);
 }
 tone(start,end,delay,duration,volume){if(!this.enabled||document.hidden)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(start,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.master);o.start(t);o.stop(t+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};}
 bird(){this.tone(1900,3000,0,.18,.065);this.tone(2400,1700,.22,.17,.045);}
}
