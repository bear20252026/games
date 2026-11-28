import * as T from 'three';

export const v = (x,y,z) => new T.Vector3(x,y,z);
export function random(seed) {
  return () => { seed = (Math.imul(1664525,seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function paint(color, roughness=.74, metalness=.12) {
  return new T.MeshStandardMaterial({color,roughness,metalness});
}
export function surface(w,h,draw) {
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  draw(c.getContext('2d'),w,h);
  const tex=new T.CanvasTexture(c); tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=8; return tex;
}
export function lettering(words, ink='#f5edda', ground='transparent') {
  const tex=surface(1024,128,(g,w,h)=>{
    if(ground!=='transparent'){g.fillStyle=ground;g.fillRect(0,0,w,h);}
    g.fillStyle=ink; g.font='bold 82px Arial'; g.textAlign='center';g.textBaseline='middle';g.fillText(words,w/2,h*.54,w*.94);
  });
  return new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:.83,polygonOffset:true,polygonOffsetFactor:-1});
}
export function plate(parent,mat,x,y,z,w,h,angle=0) {
  const o=new T.Mesh(new T.PlaneGeometry(w,h),mat);o.position.set(x,y,z);o.rotation.y=angle;parent.add(o);return o;
}
const block=new T.BoxGeometry(), drum=new T.CylinderGeometry(1,1,1,16), tire=new T.TorusGeometry(1,.27,8,20);
const up=v(0,1,0), axis=v(0,0,1), dummy=new T.Object3D();
export class Steelwork {
  constructor(parent){this.parent=parent;this.parts=new Map();}
  add(geo,mat,pos,scale,rot){
    if(!this.parts.has(geo)) this.parts.set(geo,new Map());
    const mats=this.parts.get(geo); if(!mats.has(mat))mats.set(mat,[]);
    dummy.position.copy(pos); dummy.scale.copy(scale);
    if(rot?.isQuaternion)dummy.quaternion.copy(rot);else dummy.rotation.set(...(rot||[0,0,0]));
    dummy.updateMatrix();mats.get(mat).push(dummy.matrix.clone());
  }
  box(m,x,y,z,w,h,d,rot){this.add(block,m,v(x,y,z),v(w,h,d),rot);}
  cyl(m,x,y,z,r,h,rot){this.add(drum,m,v(x,y,z),v(r,h,r),rot);}
  ring(m,x,y,z,r,rot){this.add(tire,m,v(x,y,z),v(r,r,r),rot);}
  beam(m,a,b,w,h=w){
    const d=b.clone().sub(a),n=d.length();
    this.add(block,m,a.clone().lerp(b,.5),v(w,h,n),new T.Quaternion().setFromUnitVectors(axis,d.normalize()));
  }
  rod(m,a,b,r){
    const d=b.clone().sub(a),n=d.length();
    this.add(drum,m,a.clone().lerp(b,.5),v(r,n,r),new T.Quaternion().setFromUnitVectors(up,d.normalize()));
  }
  finish(){for(const [geo,mats] of this.parts)for(const [mat,transforms] of mats){
    const mesh=new T.InstancedMesh(geo,mat,transforms.length);
    transforms.forEach((t,i)=>mesh.setMatrixAt(i,t)); mesh.castShadow=true;mesh.receiveShadow=true;this.parent.add(mesh);
  }this.parts.clear();}
}
export function cable(parent,material,a,b,sag,radius) {
  const mid=a.clone().lerp(b,.5);mid.y-=sag*2;
  const path=new T.QuadraticBezierCurve3(a,mid,b);
  const mesh=new T.Mesh(new T.TubeGeometry(path,18,radius,5,false),material);parent.add(mesh);
}
export function railing(b,m,a,end,height,spacing=2.4) {
  const rise=v(0,height,0),half=v(0,height*.47,0);
  b.rod(m,a.clone().add(rise),end.clone().add(rise),.046);
  b.rod(m,a.clone().add(half),end.clone().add(half),.035);
  const n=Math.ceil(a.distanceTo(end)/spacing);
  for(let i=0;i<=n;i++){const p=a.clone().lerp(end,i/n);b.rod(m,p,p.clone().add(rise),.05);}
}
export const M={
  white:paint('#d8d6c9'),cream:paint('#c7c7ba'),rubber:paint('#20262a',.97,0),
  steel:paint('#687578',.59,.42), wire:paint('#414b4e',.65,.4), dark:paint('#343a38'),
  glass:paint('#25434d',.16,.48), orange:paint('#c95726'), lifeboat:paint('#dd5b24'),
  rust:paint('#87452e'), crane:paint('#c97243'), pale:paint('#d9a57d'),
  yellow:paint('#d3a441'), green:paint('#41655c'), deck:paint('#715849'), red:paint('#963d32')
};

// Weathering uses world metres so a crane leg and a cabin panel have the same grain scale.
for(const [name,mat] of Object.entries(M)){
  if(['glass','wire','rubber'].includes(name))continue;
  mat.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 coatingPosition;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`
      vec4 coatingVertex=vec4(transformed,1.);
      #ifdef USE_INSTANCING
        coatingVertex=instanceMatrix*coatingVertex;
      #endif
      coatingPosition=coatingVertex.xyz;
      #include <project_vertex>`);
    s.fragmentShader=`varying vec3 coatingPosition;
      float paintHash(vec2 p){return fract(sin(dot(p,vec2(127.7,269.3)))*4375.27);}
      float paintNoise(vec2 p){vec2 i=floor(p),a=fract(p);a=a*a*(3.-2.*a);
        return mix(mix(paintHash(i),paintHash(i+vec2(1.,0.)),a.x),mix(paintHash(i+vec2(0.,1.)),paintHash(i+1.),a.x),a.y);}
`+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 panel=vec2(coatingPosition.x+coatingPosition.z,coatingPosition.y);
      float mottling=paintNoise(panel*.7)*.11+paintNoise(panel*4.3)*.043;
      float rain=smoothstep(.54,.86,paintNoise(panel*vec2(9.1,.87)))*paintNoise(panel*.4);
      diffuseColor.rgb*=.9+mottling-rain*.25;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.21,.081,.029),rain*rain*.38);
    `);
  };
}
