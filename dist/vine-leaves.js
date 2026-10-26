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

function smoothPothos(){
 const controls=POTHOS_OUTLINE.map(([x,y])=>new THREE.Vector3(x,y,0));
 const contour=new THREE.CatmullRomCurve3(controls,true,'centripetal').getPoints(40).slice(0,-1);
 const positions=[],colors=[],indices=[],rings=5,n=contour.length;
 const surface=(x,y)=>.065*Math.sin(Math.PI*Math.max(0,y))-.045*x*x-.055*Math.max(0,y)**3;
 const add=(x,y)=>{
  positions.push(x,y,surface(x,y));
  // Colour belongs to the surface itself: no overlapping faces or raised patches.
  const warp=x+.035*Math.sin(y*17),patch=Math.exp(-(((warp+.17)/.10)**2)-((y-.42)/.34)**2)*.8+Math.exp(-(((warp-.28)/.08)**2)-((y-.18)/.19)**2)*.35;
  const vein=Math.exp(-((x/.016)**2))*.055,shade=.91+.065*Math.sin(Math.PI*Math.max(0,y));
  colors.push(shade+patch*.29+vein,shade+patch*.19+vein,shade+patch*.10+vein);
 };
 const center={x:0,y:.38};add(center.x,center.y);
 for(let r=1;r<=rings;r++)for(const p of contour){const t=r/rings;add(center.x+(p.x-center.x)*t,center.y+(p.y-center.y)*t);}
 for(let j=0;j<n;j++)indices.push(0,1+j,1+(j+1)%n);
 for(let r=1;r<rings;r++)for(let j=0;j<n;j++){
  const a=1+(r-1)*n+j,b=1+(r-1)*n+(j+1)%n,c=1+r*n+j,d=1+r*n+(j+1)%n;
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.userData.leafOutline=contour.map(p=>[p.x,p.y,surface(p.x,p.y)]);
 geometry.userData.leafDetails=[{points:[[-.17,.09],[-.22,.16],[-.19,.31],[-.14,.49],[-.08,.66],[-.085,.43],[-.10,.24]].map(([x,y])=>[x,y,surface(x,y)]),multiplier:[1.20,1.13,1.06]}];
 return geometry;
}
export function createVineLeaves(){
 const ivy=leaf(IVY_OUTLINE,[
  {points:vein([0,.03],[0,.88],.012),multiplier:[2.1,1.8,1.6]},
  {points:vein([0,.19],[-.45,.52]),multiplier:[1.8,1.65,1.45]},
  {points:vein([0,.19],[.45,.52]),multiplier:[1.8,1.65,1.45]},
 ]);
 const pothos=smoothPothos();
 return {ivy,pothos};
}
