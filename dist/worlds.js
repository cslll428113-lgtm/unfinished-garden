import * as THREE from 'three';

export const WORLDS={
 white:{name:'纯白',note:'留白与树影，让建筑成为主角。',sky:'#ffffff',ground:'#fafafa',sound:'轻风'},
 snow:{name:'雪地',note:'积雪包围花园，冷空气里留一点生机。',sky:'#dce8ee',ground:'#f1f5f6',sound:'雪原风声'},
 coast:{name:'海边',note:'沙洲、潮线与海浪，围绕一座未完成的建筑。',sky:'#dfedf0',ground:'#e9dfc7',sound:'海浪与海风'},
 mountain:{name:'山里',note:'远山层叠，听风穿过山谷与枝叶。',sky:'#e5ece5',ground:'#b9c7ac',sound:'山风与鸟鸣'}
};
export const BUILDINGS={frame:'未完框架',arcade:'回廊花园',ruin:'断墙遗址'};
export const normalizeWorld=value=>Object.hasOwn(WORLDS,value)?value:'white';
export const normalizeBuilding=value=>Object.hasOwn(BUILDINGS,value)?value:'frame';

export function createWorld(scene){
 const root=new THREE.Group();root.name='surrounding-landscape';scene.add(root);
 function mesh(geometry,color,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.95,side:THREE.DoubleSide}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.receiveShadow=true;m.renderOrder=-1000+root.children.length;root.add(m);return m;}
 function disk(radius,color,y,sx=1,sz=1){const m=mesh(new THREE.CircleGeometry(radius,64),color,0,y,0,sx,sz,1);m.rotation.x=-Math.PI/2;return m;}
 function hill(x,z,height,width,color){return mesh(new THREE.SphereGeometry(1,14,8),color,x,-.9,z,width,height,width*.65);}
 return {root,set(value){
  root.children.slice().forEach(o=>{root.remove(o);o.geometry.dispose();o.material.dispose();});
  if(value==='white')return;
  if(value!=='coast'){const land=mesh(new THREE.PlaneGeometry(110,110,18,18),value==='snow'?0xe9f0f3:0xd6dfce,0,-.5,0);land.rotation.x=-Math.PI/2;}

  if(value==='coast'){
   const water=mesh(new THREE.PlaneGeometry(110,110,18,18),0x86b7bc,0,-.48,0);water.rotation.x=-Math.PI/2;
   disk(9.7,0xc0d9d4,-.42,1.15,.78);disk(9.2,0xe7e5d0,-.37,1.15,.78);disk(8.7,0xe9dfc7,-.29,1.15,.78);
   for(let i=0;i<6;i++){const r=11+i*2.6,m=mesh(new THREE.RingGeometry(r,r+.06,72),0xc8e4df,0,-.46+i*.001,0,1,.8,1);m.rotation.x=-Math.PI/2;}
   for(let i=0;i<5;i++)hill(-11+i*5,-18-(i%2)*4,.8+(i%3)*.6,1.5,0x9ba99f);
  }else if(value==='snow'){
   disk(9,0xf1f5f6,-.25,1.25,.85);
   for(let i=0;i<9;i++){const a=i/9*Math.PI*2;hill(Math.cos(a)*17,Math.sin(a)*17,1.2+(i%3)*.6,5, i%2?0xe5eef1:0xf2f6f7);}
   for(let i=0;i<7;i++)hill(-28+i*9,-32-(i%2)*4,3+i%3,8,0xd9e5ea);
  }else{
   disk(9,0xc8d1b8,-.25,1.25,.9);
   for(let i=0;i<11;i++){const a=i/11*Math.PI*2;hill(Math.cos(a)*30,Math.sin(a)*30,1.6+(i%4)*.4,7,i%2?0xb6c5b9:0xc2cdbf);}
   for(let i=0;i<7;i++)hill(-30+i*10,-38-(i%2)*4,4+i%3,10,0xbac9c0);
   for(let i=0;i<11;i++){const a=i*2.399,x=Math.cos(a)*12,z=Math.sin(a)*11;mesh(new THREE.CylinderGeometry(.08,.12,1.4,5),0x807e67,x,.35,z);mesh(new THREE.ConeGeometry(.65,2.2,7),i%2?0x718c77:0x849b7e,x,1.5,z);}
  }
 }};
}
