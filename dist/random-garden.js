import { normalizeSeason, seasonalLook } from './seasons.js';

const TREES=['banyan','maple','ginkgo','sakura','magnolia'];
const FLOWERS=['bougain','hydrangea','salvia','tulip','daisy','allium'];
const LEAVES=['fern','monstera','hosta','grass','muhly','echeveria'];
const VINES=['ivy','pothos','wisteria'];

// Every seed samples new species, density, colony centres and individual positions.
// There are no named themes or fixed planting slots; geometry only keeps roots on a slab.
export function generateGarden({seed,season='spring'}={}) {
 const initial=Number(seed)>>>0;let value=initial;season=normalizeSeason(season);
 const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
 const between=(a,b)=>a+(b-a)*random(),integer=(a,b)=>Math.floor(between(a,b+1));
 const pick=a=>a[integer(0,a.length-1)];
 function palette(ids,min){
  const shuffled=[...ids];for(let i=shuffled.length-1;i>0;i--){const j=integer(0,i);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  return shuffled.slice(0,integer(min,ids.length)).map(id=>({id,weight:between(.2,1.4)*(FLOWERS.includes(id)? .55+seasonalLook(id,'flower',season).fraction:1)}));
 }
 function species(pool){let ticket=random()*pool.reduce((sum,p)=>sum+p.weight,0);for(const p of pool){ticket-=p.weight;if(ticket<=0)return p.id;}return pool.at(-1).id;}
 const treePool=palette(TREES,2),flowerPool=palette(FLOWERS,3),leafPool=palette(LEAVES,3),vinePool=palette(VINES,1);
 const plants=[],radii=[];
 const onSlab=(x,z,level)=>Math.abs(x)<=4.72&&Math.abs(z)<=2.86&&!(level===1&&Math.abs(x)<1.6&&Math.abs(z)<1.16);
 function point(level){for(let tries=0;tries<100;tries++){const p={x:between(-4.6,4.6),z:between(-2.75,2.75)};if(onSlab(p.x,p.z,level))return p;}return {x:-3,z:0};}
 function add(id,x,z,level,scale){
  if(!onSlab(x,z,level))return false;
  const radius=TREES.includes(id)?.68*scale:VINES.includes(id)?.2:.17*scale;
  if(plants.some((p,i)=>p.level===level&&Math.hypot(p.x-x,p.z-z)<radius+radii[i]))return false;
  plants.push({id:`random-${initial.toString(36)}-${plants.length}`,species:id,x,z,level,scale,rotation:between(0,Math.PI*2)});radii.push(radius);return true;
 }
 const target=integer(40,80),lowerTarget=Math.round(target*between(.36,.6)),flowerShare=between(.25,.78);
 for(const level of [0,1]){
  const treeCount=integer(1,3);
  for(let i=0;i<treeCount;i++)for(let retry=0;retry<100;retry++){
   const p=point(level),scale=between(.58,.98);
   // Favour the far half for taller silhouettes without fixing their positions.
   if(p.z>1&&random()<.7)continue;
   if(plants.some(q=>q.level===level&&TREES.includes(q.species)&&Math.hypot(q.x-p.x,q.z-p.z)<2.4))continue;
   if(add(species(treePool),p.x,p.z,level,scale))break;
  }
  const colonies=Array.from({length:integer(2,5)},()=>({...point(level),radius:between(.55,1.65),accent:species(flowerPool),foliage:species(leafPool)}));
  const count=(level===0?lowerTarget:target-lowerTarget)-treeCount;
  for(let i=0;i<count;i++)for(let retry=0;retry<80;retry++){
   const colony=pick(colonies),angle=between(0,Math.PI*2),r=Math.sqrt(random())*colony.radius;
   const p=random()<.78&&retry<45?{x:colony.x+Math.cos(angle)*r,z:colony.z+Math.sin(angle)*r}:point(level);
   const flower=random()<flowerShare,id=random()<.62?(flower?colony.accent:colony.foliage):species(flower?flowerPool:leafPool);
   if(add(id,p.x,p.z,level,between(.5,1.18)))break;
  }
 }
 // Trailing plants follow randomly chosen terrace edges, not a fixed row of slots.
 for(let i=0,n=integer(3,10);i<n;i++)for(let retry=0;retry<60;retry++){
  const edge=integer(0,3),x=edge<2?between(-4.65,4.65):(edge===2?-4.69:4.69),z=edge<2?(edge===0?-2.83:2.83):between(-2.7,2.7);
  if(add(species(vinePool),x,z,1,between(.6,1.05)))break;
 }
 return {seed:initial,season,plants};
}
