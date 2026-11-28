import * as T from 'three';
import {surface,random} from './fabrication.js';

const paints=['#974732','#9d5540','#623a35','#214d60','#376072','#64776b','#486755','#a19879','#c6c3ac','#9a7942','#754238','#435966','#5b6773','#955039','#386d6d','#8b4034'];
const lines=['KELSO','VEYR','GANNET','SABLE','ORISON','HALE','WINDWARD'];
// One atlas per box covers the long sides, locking doors, and the ribbed roof.
function boxSkin(index) {
  const rand=random(510+index*277);
  return surface(1024,512,(g,w,h)=>{
    g.fillStyle=paints[index];g.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=13){
      g.fillStyle='rgba(19,23,27,.18)';g.fillRect(x,0,3,255);
      g.fillStyle='rgba(255,242,211,.18)';g.fillRect(x+3,0,2,254);
    }
    g.fillStyle='#eee6cb';g.globalAlpha=.70+rand()*.24;
    g.font='bold 66px Arial';g.fillText(lines[index%lines.length],68,114);
    g.font='16px monospace';g.fillText('GHU  ' + Math.floor(rand()*799999+110000),710,40);
    g.fillRect(30,207,50,7);g.globalAlpha=1;
    for(let x=0;x<512;x+=16){
      g.fillStyle='rgba(0,0,0,.16)';g.fillRect(x,269,4,233);
      g.fillStyle='rgba(255,255,255,.10)';g.fillRect(x+4,269,2,233);
    }
    for(const x of [541,639,774,874,985]){
      g.fillStyle='#2e3331';g.fillRect(x,268,6,226);g.fillStyle='#a6a393';g.fillRect(x+2,268,3,226);
      for(const y of [290,416,465]){g.fillStyle='#464b41';g.fillRect(x-6,y,19,5);}
    }
    for(let k=0;k<2300;k++){
      const x=rand()*w,y=rand()*h;g.fillStyle=k%3?'rgba(58,33,24,.13)':'rgba(232,223,193,.15)';
      g.fillRect(x,y,1+rand()*3,1+rand()**5*40);
    }
    for(const y of [1,249,260,502]){g.fillStyle='rgba(34,34,30,.45)';g.fillRect(0,y,w,4);}
    for(let k=0;k<80;k++){let x=rand()*w;g.fillStyle='rgba(133,65,34,.42)';g.fillRect(x,0,1+rand()*5,rand()**2*52);}
  });
}
export const length=12.08,height=2.60,width=2.43;
export class Cargo {
  constructor(){
    this.geometry=new T.BoxGeometry(length,height,width);
    const uv=this.geometry.attributes.uv;
    for(let face=0;face<6;face++)for(let i=0;i<4;i++){
      const k=face*4+i,u=uv.getX(k),v=uv.getY(k);
      if(face<2)uv.setXY(k,.507+.487*u,.012+.471*v);
      else if(face<4)uv.setXY(k,.004+.49*u,.012+.469*v);
      else uv.setXY(k,.004+.992*u,.508+.485*v);
    }
    this.mats=paints.map((_,i)=>new T.MeshStandardMaterial({map:boxSkin(i),roughness:.82,metalness:.10}));
    this.groups=paints.map(()=>[]);this.count=0;
  }
  put(x,y,z,i,yaw=0){this.groups[i].push([x,y,z,yaw]);this.count++;}
  moving(i){const mesh=new T.Mesh(this.geometry,this.mats[i]);mesh.castShadow=mesh.receiveShadow=true;return mesh;}
  finish(scene){
    const helper=new T.Object3D(),r=random(178),color=new T.Color();
    this.groups.forEach((rows,i)=>{
      const mesh=new T.InstancedMesh(this.geometry,this.mats[i],rows.length);
      rows.forEach(([x,y,z,a],n)=>{helper.position.set(x,y,z);helper.rotation.y=a;helper.updateMatrix();mesh.setMatrixAt(n,helper.matrix);mesh.setColorAt(n,color.setScalar(.77+r()*.23));});
      mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
    });
  }
}
