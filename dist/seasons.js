// An artistic seasonal palette, not a regional planting calendar.
export const SEASONS = {
 spring:{name:'春',title:'春 · 花信',note:'花枝初醒，嫩叶与花瓣接住春雨。',paper:'#f0eee3',ground:0xe8e8d8,sun:0xffedce,sky:0xf5f4dc},
 summer:{name:'夏',title:'夏 · 繁荫',note:'浓绿层叠，绣球与夏花迎着阵雨。',paper:'#e8ecdf',ground:0xe5e8d9,sun:0xfff5d5,sky:0xffffec},
 autumn:{name:'秋',title:'秋 · 拾叶',note:'枫叶转红，银杏染金，风留下细碎落叶。',paper:'#eee3d2',ground:0xe3d5bd,sun:0xffdbad,sky:0xf6e4ca},
 winter:{name:'冬',title:'冬 · 静藏',note:'落叶枝干覆着薄雪，常绿植物静静越冬。',paper:'#e5edf1',ground:0xe5ebee,sun:0xe3edff,sky:0xe8f0ff}
};

export const DECIDUOUS = new Set(['maple','ginkgo','sakura','magnolia','wisteria','hydrangea']);
const BLOOM = {
 sakura:[1,0,0,0],magnolia:[1,0,0,0],tulip:[1,0,0,0],wisteria:[1,.3,0,0],
 hydrangea:[.25,1,.3,0],bougain:[.7,1,.6,0],salvia:[.3,1,.6,0],daisy:[1,.8,.45,0],
 allium:[.55,1,.15,0],grass:[.2,.55,1,.6],muhly:[.05,.2,1,.4]
};
const DORMANT = new Set(['tulip','daisy','allium','salvia','hosta']);
export function normalizeSeason(value){return Object.hasOwn(SEASONS,value)?value:'summer';}
export function seasonalLook(id,part,season){
 const index=['spring','summer','autumn','winter'].indexOf(normalizeSeason(season));
 const result={fraction:1,tint:null,mix:0,height:index===3&&DORMANT.has(id)?.38:1};
 if(part==='flower'){
  result.fraction=(BLOOM[id]??[1,1,.4,0])[index];
  if(index===2){result.tint=0xb79c88;result.mix=.45;}
  if(index===3){result.tint=0xc5b6a1;result.mix=.7;}
 }else if(part==='leaf'){
  if(index===0){result.tint=0xb6ca7c;result.mix=.24;result.fraction=['sakura','magnolia','wisteria'].includes(id)?.38:.9;}
  if(index===1){result.tint=0x3f794d;result.mix=id==='echeveria'?.05:.18;}
  if(index===2){
   if(DECIDUOUS.has(id)){result.tint=id==='ginkgo'?0xe7b94e:id==='maple'?0xc05e3d:0xc99150;result.mix=.85;result.fraction=.72;}
   else if(['grass','muhly'].includes(id)){result.tint=0xc4ab78;result.mix=.65;}
  }
  if(index===3){result.fraction=DECIDUOUS.has(id)?0:DORMANT.has(id)?.25:.75;result.tint=0xb5c6bc;result.mix=.35;}
 }else if(part==='stem'&&index===3){result.tint=0xb6b8b4;result.mix=.4;}
 return result;
}
