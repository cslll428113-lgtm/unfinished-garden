import {growthProfile} from './growth.js';
export const isTrailingVine=id=>id==='ivy'||id==='pothos';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// Actual slab edges, rather than the slightly inset area used for picking roots.
export function nearestVineEdge(p){
 const edges=[
  {distance:5.2-p.x,nx:1,nz:0}, {distance:5.2+p.x,nx:-1,nz:0},
  {distance:3.25-p.z,nx:0,nz:1}, {distance:3.25+p.z,nx:0,nz:-1},
 ];
 if(Math.abs(p.z)<.65){
  if(p.x>=1.4)edges.push({distance:p.x-1.4,nx:-1,nz:0,inner:true});
  if(p.x<=-1.4)edges.push({distance:-1.4-p.x,nx:1,nz:0,inner:true});
 }
 if(Math.abs(p.x)<1.05){
  if(p.z>=.95)edges.push({distance:p.z-.95,nx:0,nz:-1,inner:true});
  if(p.z<=-.95)edges.push({distance:-.95-p.z,nx:0,nz:1,inner:true});
 }
 return edges.sort((a,b)=>a.distance-b.distance)[0];
}

export function vineLayout(p,{time=1,growth=1}={}){
 const age=growthProfile(time),size=(p.scale??1)*growth;
 const spread=size*age.spread,leafScale=Math.min(1.5,spread),edge=nearestVineEdge(p);
 const trailing=p.level===1&&edge.distance<.85;
 const pothos=p.species==='pothos',count=pothos?5:8;
 const paths=[];
 for(let b=0;b<count;b++){
  const phase=b*2.399+(p.rotation??0),length=(pothos?1.35+(Math.sin(phase*1.71)+1)*.62:1.25+(Math.sin(phase*1.71)+1)*.45)*spread;
  const points=[];
  for(let j=0;j<=16;j++){
   const t=j/16;
   if(trailing){
    const reach=length*t,clearance=pothos?.22+.32*leafScale:.15+.18*leafScale,over=Math.max(0,reach-edge.distance-clearance);
    const outward=Math.min(reach,edge.distance+clearance)+Math.sin(over*2.7+b)*.035*Math.min(over,1)+Math.min(over*.06,.12);
    let side=(b-(count-1)/2)*(pothos?.24:.11)*spread*Math.sin(Math.min(t*2,1)*Math.PI/2)+Math.sin(t*(pothos?7:5)+phase)*(pothos?.10:.035)*spread*t;
    if(edge.inner){const rootSide=edge.nx?p.z:p.x,half=edge.nx?.95:1.4,sign=edge.nx||-edge.nz;side=(clamp(rootSide+sign*side,-half+.43,half-.43)-rootSide)/sign;}
    const drop=Math.min(pothos?2.55:2.76,over*over/(over+.16));
    points.push({x:edge.nx*outward-edge.nz*side,y:.13+Math.sin(Math.min(reach/(edge.distance+clearance),1)*Math.PI)*.08*age.height-drop,z:edge.nz*outward+edge.nx*side});
   }else{
    const radius=Math.min(length,1.8)*t,a=phase+Math.sin(t*3+phase)*.16;
    points.push({x:Math.cos(a)*radius,y:.09+.10*age.height*Math.sin(t*Math.PI)+.025*Math.sin(t*8+phase),z:Math.sin(a)*radius});
   }
  }
  paths.push(points);
 }
 return {paths,edge:trailing?edge:null,mode:trailing?'沿边垂落':'地面铺展',leafScale};
}
