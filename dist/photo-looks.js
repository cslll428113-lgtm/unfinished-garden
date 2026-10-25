import { SEASONS, normalizeSeason } from './seasons.js';
// Lighting and photographic treatment share one recipe across the live view and exports.
export const PHOTO_LOOKS = {
 day:{name:'晴日',icon:'☀',note:'清透日光 · 干净的叶色与柔和阴影',swatch:['#f4f2df','#b5c5a6']},
 dawn:{name:'晨雾',icon:'◒',note:'微暖晨光 · 青灰薄雾与轻盈的绿',swatch:['#f5dfd0','#9dbbb7'],sun:'#ffe5c9',sky:'#d9e9e8',bounce:'#8faaa4',fill:'#cce5e6',sunPower:1.85,ambient:1.65,fillPower:.65,position:[-9,6,-7],exposure:1.02,top:'#ecede3',bottom:'#bdcfc9',ground:'#c9d5c9',fogNear:22,fogFar:55,saturation:.88,contrast:.96,brightness:1.03,sepia:0,vignette:.04,cpuTint:[.97,1,1],cpuBrightness:1},
 dusk:{name:'暮色',icon:'◐',note:'低角度夕照 · 暖亮部与灰紫色阴影',swatch:['#f0cbb4','#ab9eae'],sun:'#ffd1a0',sky:'#c7c8df',bounce:'#8b829a',fill:'#c1c9eb',sunPower:2.3,ambient:1.05,fillPower:.7,position:[-12,5,8],exposure:.98,top:'#e9d5c8',bottom:'#b8a7ad',ground:'#d4c6b5',fogNear:30,fogFar:68,saturation:.96,contrast:1.04,brightness:1,sepia:.035,vignette:.12,cpuTint:[1.05,.97,.92],cpuBrightness:.94},
 film:{name:'胶片',icon:'▣',note:'柔暖底色 · 克制饱和度与微暗边缘',swatch:['#e5d7b9','#929c7d'],sun:'#ffe6be',sky:'#e3e5d5',bounce:'#929077',fill:'#cad9cd',sunPower:2.45,ambient:1.2,fillPower:.5,position:[-9,11,7],exposure:.96,top:'#e9e2cd',bottom:'#c2c7af',ground:'#d2d3bc',fogNear:33,fogFar:75,saturation:.82,contrast:1.09,brightness:1.02,sepia:.12,vignette:.16,cpuTint:[1.01,1,.94],cpuBrightness:.96},
 moon:{name:'月色',icon:'☾',note:'银蓝月光 · 留得住植物细节的夜色',swatch:['#9faec7','#455d7b'],sun:'#c5d9ff',sky:'#98afd4',bounce:'#586784',fill:'#b5c5ed',sunPower:1.45,ambient:1.25,fillPower:.7,position:[6,12,-8],exposure:1.02,top:'#a7b6cc',bottom:'#657d99',ground:'#8197af',fogNear:24,fogFar:64,saturation:.8,contrast:1.06,brightness:.98,sepia:0,vignette:.2,cpuTint:[.79,.89,1.08],cpuBrightness:.85},
 blush:{name:'柔粉',icon:'✿',note:'淡粉柔光 · 花瓣般轻柔的低反差',swatch:['#f2dce1','#c6b9cb'],sun:'#ffe1e1',sky:'#eadfe9',bounce:'#b19ba8',fill:'#ddd8ec',sunPower:1.9,ambient:1.65,fillPower:.55,position:[-7,10,9],exposure:1.02,top:'#eee1e4',bottom:'#d2c3cf',ground:'#ded6d4',fogNear:24,fogFar:60,saturation:.85,contrast:.97,brightness:1.02,sepia:.015,vignette:.06,cpuTint:[1.03,.97,1.02],cpuBrightness:1}
};
export const normalizeLook=value=>Object.hasOwn(PHOTO_LOOKS,value)?value:'day';
export const normalizeStrength=value=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function mixColor(a,b,t){a=parseInt(a.slice(1),16);b=parseInt(b.slice(1),16);return '#'+[16,8,0].map(shift=>Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t).toString(16).padStart(2,'0')).join('');}
export function photoLook(season,type='day',strength=1){
 season=normalizeSeason(season);type=normalizeLook(type);const t=normalizeStrength(strength),palette=SEASONS[season];
 // Keep the original airy daylight as the unfiltered baseline.
 const daylightBackground={spring:['#faf4e8','#e9ebdc'],summer:['#f3f3e9','#e6ebde'],autumn:['#faf0dc','#e8ddc8'],winter:['#f5f7f6','#dce6eb']}[season];
 const base={sun:hex(palette.sun),sky:hex(palette.sky),bounce:'#8f9f86',fill:'#d9e9d7',sunPower:3.6,ambient:2.1,fillPower:.7,position:[-8,15,8],exposure:1.22,top:daylightBackground[0],bottom:daylightBackground[1],ground:hex(palette.ground),concrete:'#e2e0d1',fogNear:34,fogFar:75,saturation:1,contrast:1,brightness:1,sepia:0,vignette:0,cpuTint:[1,1,1],cpuBrightness:1,cpuDirectionalMix:0};
 let selected={...base,...PHOTO_LOOKS[type],...(type==='day'?{}:{concrete:'#e5e6de',cpuDirectionalMix:1})};
 if(season==='winter'&&type!=='day'){
  // Even warm styles retain silver-blue snow, ground and ambient bounce.
  selected={...selected,sun:mixColor(selected.sun,'#d5e6ff',.6),sky:mixColor(selected.sky,'#c4d9f1',.55),ground:mixColor(selected.ground,'#becddd',.65),top:mixColor(selected.top,'#dce5ed',.5),bottom:mixColor(selected.bottom,'#aebed2',.5),sepia:selected.sepia*.3,cpuTint:selected.cpuTint.map((n,i)=>n*.5+[.91,.97,1.06][i]*.5)};
 }
 const result={type,name:PHOTO_LOOKS[type].name,note:PHOTO_LOOKS[type].note,strength:t};
 for(const key of ['sun','sky','bounce','fill','top','bottom','ground','concrete'])result[key]=mixColor(base[key],selected[key],t);
 for(const key of ['sunPower','ambient','fillPower','exposure','fogNear','fogFar','saturation','contrast','brightness','sepia','vignette','cpuBrightness','cpuDirectionalMix'])result[key]=base[key]+(selected[key]-base[key])*t;
 for(const key of ['position','cpuTint'])result[key]=base[key].map((n,i)=>n+(selected[key][i]-n)*t);
 if(season==='winter'&&type==='dusk')result.note='冬日暮光 · 银蓝雪面与微暖的天色';
 result.filter=`saturate(${result.saturation}) contrast(${result.contrast}) brightness(${result.brightness}) sepia(${result.sepia})`;
 result.vignetteColor=`rgba(29,39,47,${result.vignette})`;
 return result;
}
export function paintPhoto(ctx,source,width,height,look){
 ctx.save();ctx.filter='none';
 const backdrop=ctx.createLinearGradient(0,0,0,height);backdrop.addColorStop(0,look.top);backdrop.addColorStop(1,look.bottom);ctx.fillStyle=backdrop;ctx.fillRect(0,0,width,height);
 ctx.filter=look.filter;ctx.drawImage(source,0,0,width,height);ctx.filter='none';
 const shade=ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,Math.hypot(width,height)/2);shade.addColorStop(.55,'rgba(29,39,47,0)');shade.addColorStop(1,look.vignetteColor);ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);ctx.restore();
}
