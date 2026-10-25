// Seeded compositions: plants grow in small communities around an open courtyard.
export const GARDEN_THEMES = [
 {id:'blush',name:'花信来迟',note:'淡粉花枝、奶白小花，沿着露台缓缓铺开。',seasons:['spring'],trees:['sakura','magnolia'],flowers:['tulip','daisy','allium'],leaves:['hosta','fern','echeveria'],vines:['wisteria','ivy'],color:'#b8889a'},
 {id:'lilac',name:'紫藤写信',note:'紫色花穗垂过混凝土，风从枝叶间穿过。',seasons:['spring','summer'],trees:['magnolia','maple'],flowers:['allium','salvia','hydrangea'],leaves:['hosta','fern'],vines:['wisteria','ivy'],color:'#9891b5'},
 {id:'blue',name:'雨后蓝调',note:'雾蓝花团藏进浓绿，留一条安静的小径。',seasons:['summer'],trees:['banyan','maple'],flowers:['hydrangea','salvia','allium'],leaves:['fern','monstera','hosta'],vines:['pothos','ivy'],color:'#819ba9'},
 {id:'rose',name:'玫瑰色回声',note:'玫粉花瀑与轻柔草穗，接住楼边的光。',seasons:['summer','autumn'],trees:['maple','ginkgo'],flowers:['bougain','daisy','muhly'],leaves:['grass','hosta','echeveria'],vines:['ivy','pothos'],color:'#b78691'},
 {id:'gold',name:'金风留白',note:'银杏与枫叶染上秋色，草穗在空隙里摇晃。',seasons:['autumn'],trees:['ginkgo','maple'],flowers:['muhly','daisy'],leaves:['grass','fern','echeveria'],vines:['ivy','pothos'],color:'#ae955d'},
 {id:'snow',name:'雪落青庭',note:'雪白楼面衬着常绿叶片，枝条留下清瘦的线。',seasons:['winter'],trees:['banyan','maple'],flowers:['echeveria','grass'],leaves:['fern','ivy','echeveria'],vines:['ivy','pothos'],color:'#829eab'},
 {id:'silver',name:'冬日来信',note:'裸枝、银蓝莲座与草穗，把冬天留得轻一点。',seasons:['winter'],trees:['ginkgo','magnolia'],flowers:['echeveria','grass'],leaves:['fern','hosta','echeveria'],vines:['ivy','pothos'],color:'#9ca7b6'},
 {id:'green',name:'森间慢生',note:'树冠、蕨叶与垂藤叠出绿意，让建筑慢慢隐入自然。',seasons:['spring','summer','autumn','winter'],trees:['banyan','maple'],flowers:['fern','echeveria'],leaves:['fern','monstera','hosta'],vines:['ivy','pothos'],color:'#7c9273'}
];
export function generateGarden({seed,season='spring',excludeTheme}={}) {
 const initial=Number(seed)>>>0;let value=initial;
 const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
 const between=(a,b)=>a+(b-a)*random(),pick=a=>a[Math.floor(random()*a.length)];
 const themes=GARDEN_THEMES.filter(t=>t.seasons.includes(season)&&t.id!==excludeTheme);
 const theme=pick(themes.length?themes:GARDEN_THEMES.filter(t=>t.seasons.includes('spring')));
 const plants=[],mirror=random()<.5?-1:1;
 function add(species,x,z,level,scale){
  x*=mirror;
  if(Math.abs(x)>4.75||Math.abs(z)>3||level===1&&Math.abs(x)<1.55&&Math.abs(z)<1.12)return false;
  if(plants.some(p=>p.level===level&&Math.hypot(p.x-x,p.z-z)<.25))return false;
  plants.push({id:`draw-${initial.toString(36)}-${plants.length}`,species,x,z,level,scale,rotation:between(0,Math.PI*2)});return true;
 }
 for(const level of [0,1]){
  // Tall silhouettes sit at the rear; the central opening and front remain readable.
  add(pick(theme.trees),between(-3.9,-3.1),between(-2.25,-1.75),level,between(.68,.86));
  add(pick(theme.trees),between(2.65,3.65),between(-2.3,-1.8),level,between(.61,.8));
  const anchors=[[-3.65,1.85],[3.45,1.8],[-3.8,-1.65],[2.7,-2.25]];
  for(const [cx,cz] of anchors){
   const accent=pick(theme.flowers),foliage=pick(theme.leaves),count=3+Math.floor(random()*2);
   for(let i=0;i<count;i++){
    for(let retry=0;retry<20;retry++){
     const angle=between(0,Math.PI*2),radius=between(.28,.86);
     if(add(i%3===0?foliage:accent,cx+Math.cos(angle)*radius,cz+Math.sin(angle)*radius,level,between(.6,.98)))break;
    }
   }
  }
  for(let i=0;i<3;i++)add(pick(theme.flowers),-1.8+i*1.7+between(-.2,.2),between(2.25,2.7),level,between(.6,.85));
 }
 for(const x of [-4.3,-2.5,-.4,1.5,3.6])add(pick(theme.vines),x+between(-.18,.18),between(2.87,2.98),1,between(.65,.95));
 add(pick(theme.vines),-4.72,between(-.4,.5),1,between(.7,.95));
 return {seed:initial,serial:initial.toString(36).toUpperCase().padStart(7,'0'),theme:{...theme},season,plants};
}
