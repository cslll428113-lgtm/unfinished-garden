import * as THREE from 'three';

// Juvenile Hedera helix: five pointed lobes, separated by deep sinuses.
export const IVY_OUTLINE=[[0,0],[-.23,-.015],[-.48,.12],[-.23,.29],[-.57,.57],[-.21,.46],[-.13,.72],[0,1],[.13,.72],[.21,.46],[.57,.57],[.23,.29],[.48,.12],[.23,-.015]];
// Juvenile Epipremnum aureum: rounded basal lobes and a long, entire tip.
export const POTHOS_OUTLINE=[[0,0],[-.15,-.13],[-.30,-.15],[-.44,-.07],[-.52,.10],[-.50,.29],[-.39,.49],[-.22,.72],[-.08,.93],[0,1.12],[.11,.92],[.29,.70],[.45,.46],[.54,.22],[.52,.04],[.42,-.10],[.27,-.17],[.13,-.12]];
const curve=(x,y)=>.085*Math.sin(Math.PI*Math.max(0,Math.min(1,y)))-Math.abs(x)*.07;
const vein=(a,b,width=.009)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),x=-dy/length*width,y=dx/length*width;return [[a[0]-x,a[1]-y],[b[0]-x*.25,b[1]-y*.25],[b[0]+x*.25,b[1]+y*.25],[a[0]+x,a[1]+y]];};

function leaf(outline,details){
 const positions=[],colors=[];
 const append=(points,multiplier,lift)=>{
  const contour=points.map(([x,y])=>new THREE.Vector2(x,y));
  for(const triangle of THREE.ShapeUtils.triangulateShape(contour,[]))for(const index of triangle){const [x,y]=points[index];positions.push(x,y,curve(x,y)+lift);colors.push(...multiplier);}
 };
 append(outline,[1,1,1],0);
 for(const detail of details)append(detail.points,detail.multiplier,.007);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 // The CPU renderer uses the same contour and markings, never its oval fallback.
 geometry.userData.leafOutline=outline.map(([x,y])=>[x,y,curve(x,y)]);
 geometry.userData.leafDetails=details.map(d=>({...d,points:d.points.map(([x,y])=>[x,y,curve(x,y)+.007])}));
 return geometry;
}
export function createVineLeaves(){
 const ivy=leaf(IVY_OUTLINE,[
  {points:vein([0,.03],[0,.88],.012),multiplier:[2.1,1.8,1.6]},
  {points:vein([0,.19],[-.45,.52]),multiplier:[1.8,1.65,1.45]},
  {points:vein([0,.19],[.45,.52]),multiplier:[1.8,1.65,1.45]},
 ]);
 const pothos=leaf(POTHOS_OUTLINE,[
  {points:[[-.10,.09],[-.24,.04],[-.34,.16],[-.23,.25],[-.30,.34],[-.16,.40],[-.10,.59],[-.035,.75],[-.04,.43],[.015,.26]],multiplier:[3.1,1.85,.7]},
  {points:[[.20,.04],[.35,.02],[.40,.18],[.31,.30],[.33,.40],[.20,.45],[.23,.24],[.16,.15]],multiplier:[2.5,1.7,.8]},
  {points:vein([0,.01],[0,.97],.012),multiplier:[1.5,1.35,.9]},
 ]);
 return {ivy,pothos};
}
