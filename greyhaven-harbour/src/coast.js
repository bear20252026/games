import * as T from 'three';
import {v,Steelwork,M,random,paint} from './fabrication.js';

export const sunDirection=v(-.75,.49,.53).normalize();
const noiseGLSL=`
float hash(vec2 p){vec3 q=fract(p.xyx*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float cloud(vec2 p){float a=.5,total=0.;mat2 rot=mat2(.83,-.55,.55,.83);for(int i=0;i<5;i++){total+=a*noise2(p);p=rot*p*2.06+7.19;a*=.51;}return total;}
`;
export function atmosphere(scene) {
  const sky=new T.Mesh(new T.SphereGeometry(6300,48,24),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,fog:false,uniforms:{lightDir:{value:sunDirection},time:{value:0}},
    vertexShader:`varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 ray;uniform vec3 lightDir;uniform float time;`+noiseGLSL+`
    void main(){vec3 d=normalize(ray);float y=max(d.y,0.),sd=max(dot(d,lightDir),0.);
      vec3 air=mix(vec3(.72,.77,.75),vec3(.19,.39,.59),1.-exp(-3.4*y));
      air+=vec3(.36,.23,.10)*pow(sd,5.);
      vec2 p=d.xz/(y+.065)*1.36+vec2(time*.0017,0.);
      float broad=cloud(p*.56);float density=cloud(p+vec2(broad,cloud(p+.63))*1.6);
      float c=smoothstep(.49,.63,density)*smoothstep(.015,.15,y);
      float edge=clamp((density-cloud(p+lightDir.xz*.10+vec2(broad,cloud(p+.63))*1.6))*4.+.55,0.,1.);
      vec3 cl=mix(vec3(.59,.63,.65),vec3(1.18,1.13,1.01),edge);
      air=mix(air,cl,c*.89);air+=vec3(1.,.87,.61)*(pow(sd,430.)*.7+smoothstep(.99988,.99998,sd)*9.);
      gl_FragColor=vec4(air,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  }));sky.renderOrder=-100;scene.add(sky);
  return t=>{sky.material.uniforms.time.value=t;};
}
export function coast(scene){
  const r=random(619),b=new Steelwork(scene),stone=paint('#665f52'),rock=paint('#827b68');
  // An angular outer mole protects the basin, with a clear entrance at the east end.
  const toe=v(-580,0,-34),bend=v(-531,0,309),head=v(-295,0,365);
  for(const [a,c] of [[toe,bend],[bend,head]]){
    b.beam(stone,a,c,9,5);b.beam(M.cream,a.clone().add(v(0,2.71,0)),c.clone().add(v(0,2.71,0)),6.8,.47);
    const count=Math.ceil(a.distanceTo(c)/1.6);
    const normal=c.clone().sub(a).normalize().cross(v(0,1,0));
    for(let i=0;i<count;i++)for(const side of [-1,1]){
      const p=a.clone().lerp(c,i/count).addScaledVector(normal,side*(4+r()*1.7));
      b.box(i%4?stone:rock,p.x,r()*.9,p.z,2+r()*2,1.8+r()*1.1,2.8+r(),[r()*.6,r()*3,r()*.7]);
    }
  }
  const lx=head.x,lz=head.z;
  for(let k=0;k<5;k++)b.cyl(k%2?M.red:M.white,lx,3.4+2.25*(k+.5),lz,1.98-k*.18,2.26);
  b.cyl(M.dark,lx,14.8,lz,1.78,.45);b.cyl(M.glass,lx,15.86,lz,1.02,1.92);b.cyl(M.red,lx,17.02,lz,1.45,.45);
  b.finish();
  // Multiple ridgelines give the inland horizon depth through aerial perspective.
  for(let ridge=0;ridge<3;ridge++){
    const n=370,depth=28,pos=[],col=[],idx=[],z0=-605-ridge*380;
    const c=new T.Color();
    for(let j=0;j<=depth;j++)for(let i=0;i<=n;i++){
      const x=(i/n-.5)*5800,f=j/depth;
      const profile=52+ridge*40+31*Math.sin(x*.0035+ridge)+16*Math.sin(x*.0101+ridge*5)+7*Math.sin(x*.022)+3*Math.sin(x*.050);
      const folds=8*Math.sin(x*.025+f*13)+4*Math.cos(x*.057-f*29)+2.8*Math.sin(x*.11+f*33);
      const y=-5+(profile+folds)*Math.sin(f*Math.PI)**.85+(r()-.5)*2;
      pos.push(x,y,z0-f*460);c.set(ridge===0?'#515f50':ridge===1?'#64726a':'#75858a').multiplyScalar(.82+.20*r()+.07*f);
      col.push(c.r,c.g,c.b);if(i<n&&j<depth){const a=j*(n+1)+i;idx.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
    scene.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:false,side:T.DoubleSide})));
  }
  // Mixed stands of conifers soften the foot of the ridge behind the rail yards.
  const count=6400,tree=new T.InstancedMesh(new T.ConeGeometry(1,1,6),paint('#485748',1,0),count);
  const dummy=new T.Object3D(),tone=new T.Color();
  for(let i=0;i<count;i++){
    const x=(r()-.5)*2600,f=.035+r()*.72;
    const h=4+r()**1.8*12;
    const profile=52+31*Math.sin(x*.0035)+16*Math.sin(x*.0101)+7*Math.sin(x*.022)+3*Math.sin(x*.050);
    const folds=8*Math.sin(x*.025+f*13)+4*Math.cos(x*.057-f*29)+2.8*Math.sin(x*.11+f*33);
    const y=-5+(profile+folds)*Math.sin(f*Math.PI)**.85;
    dummy.position.set(x,y+h*.40,-605-f*460);dummy.scale.set(h*.20,h,h*.20);
    dummy.rotation.y=r()*6.28;dummy.updateMatrix();tree.setMatrixAt(i,dummy.matrix);
    tree.setColorAt(i,tone.setRGB(.76+r()*.24,.80+r()*.20,.78+r()*.22));
  }
  scene.add(tree);
  const updates=[];
  for(const [x,z,red] of [[160,163,false],[-100,203,true],[-270,278,true],[330,249,false]]){
    const g=new T.Group();scene.add(g);const s=new Steelwork(g),mat=red?M.red:M.green;
    s.cyl(mat,0,.37,0,1.25,1.05);s.cyl(M.dark,0,.02,0,1.37,.22);s.cyl(mat,0,1.05,0,.70,.48);
    for(let k=0;k<4;k++){const a=k*Math.PI/2;s.rod(mat,v(.60*Math.cos(a),1.2,.60*Math.sin(a)),v(.24*Math.cos(a),3.60,.24*Math.sin(a)),.075);}
    s.cyl(M.yellow,0,3.76,0,.19,.33);s.finish();
    updates.push(t=>{g.position.set(x,.11*Math.sin(t*1.07+x),z);g.rotation.z=.052*Math.sin(t*.87+z);});
  }
  const birds=new T.Group();scene.add(birds);
  const feather=paint('#a9a49a');feather.side=T.DoubleSide;
  for(let i=0;i<12;i++){
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute([-1.05,.10,-.15,-.46,.26,.1,0,0,0,-.46,.26,.1,-.24,.03,.27,0,0,0,0,0,0,.55,.29,.09,1.04,.09,-.17,0,0,0,.24,.03,.27,.55,.29,.09],3));geo.computeVertexNormals();
    const bird=new T.Mesh(geo,feather);birds.add(bird);const a=i*1.73,rx=35+r()*23,alt=19+r()*14;
    updates.push(t=>{const p=a+t*.076;bird.position.set(-105+rx*Math.cos(p),alt+Math.sin(p*2),42+rx*.63*Math.sin(p));bird.rotation.set(0,-p,-.13+.11*Math.sin(t*1.4+a));});
  }
  return updates;
}

export function water(scene,renderer,cam){
  const target=new T.WebGLRenderTarget(800,450,{type:T.HalfFloatType,depthBuffer:true});
  const mirror=new T.PerspectiveCamera(),matrix=new T.Matrix4(),u={
    time:{value:0},ref:{value:target.texture},projector:{value:matrix},sun:{value:sunDirection},tug:{value:new T.Vector3()}
  };
  const waves=`float swell(vec2 p,float t){return .10*sin(dot(p,vec2(.12,.055))+t*1.03)+.063*sin(dot(p,vec2(-.10,.23))+t*1.38)+.038*sin(dot(p,vec2(.37,.19))-t*1.83);}`;
  const mat=new T.ShaderMaterial({uniforms:u,
    vertexShader:`uniform mat4 projector;uniform float time;varying vec3 world;varying vec4 proj;`+waves+`
      void main(){world=(modelMatrix*vec4(position,1.)).xyz;world.y+=swell(world.xz,time);proj=projector*vec4(world,1.);
      gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
    fragmentShader:`uniform sampler2D ref;uniform vec3 sun,tug;uniform float time;varying vec3 world;varying vec4 proj;`+noiseGLSL+`
      void main(){vec2 p=world.xz;vec3 V=normalize(cameraPosition-world);float dist=distance(cameraPosition,world);float px=max(length(dFdx(p)),length(dFdy(p)));
        float gust=.42+1.05*noise2(p*.059+time*.027);vec2 slope=vec2(0.);float k=.42,amp=.088;
        vec2 chop=p+1.7*vec2(noise2(p*.21+time*.057),noise2(p*.18-time*.063));
        for(int i=0;i<12;i++){float fi=float(i),ang=fi*2.18+.4*sin(fi*2.7);vec2 dir=vec2(cos(ang),sin(ang)*.8);
          float phase=dot(chop,dir)*k+time*sqrt(9.81*k)+3.6*noise2(p*k*.24+fi);
          slope+=dir*cos(phase)*amp*gust*(1.-smoothstep(.55,2.8,px*k));k*=1.52;amp*=.95;
        }
        vec2 hd=vec2(cos(tug.z),sin(tug.z));vec2 rel=p-tug.xy;float aft=-dot(rel,hd),side=dot(rel,vec2(-hd.y,hd.x));
        float spread=max(0.,aft)*.25+2.5;float trail=smoothstep(-8.,8.,aft)*exp(-max(aft,0.)*.033);
        float arm=abs(side)-spread;float wr=exp(-abs(arm)*.52)*trail;
        slope+=vec2(-hd.y,hd.x)*sign(side)*wr*sin(arm*3.3-time*1.65)*.5;
        float churn=trail*exp(-side*side/(4.+.12*max(0.,aft)));float froth=clamp(churn+wr*.72,0.,1.);
        vec3 N=normalize(vec3(-slope.x,1.,-slope.y));float ndv=clamp(dot(N,V),0.,1.);
        vec2 uv=proj.xy/proj.w*.5+.5;uv+=vec2(N.x,N.z)*(.012+.076/(1.+dist*.006));
        vec3 reflection=texture2D(ref,clamp(uv,.002,.998)).rgb;
        float fres=.035+.965*pow(1.-ndv,4.7);
        vec3 base=mix(vec3(.010,.043,.050),vec3(.024,.110,.114),clamp(.48+dot(N,sun)*.37+gust*.16,0.,1.));
        vec3 color=mix(base,reflection,fres);float glint=max(dot(reflect(-sun,N),V),0.);
        color+=vec3(1.,.83,.57)*pow(glint,540.)*3.5;
        color=mix(color,vec3(.62,.71,.67),smoothstep(.18,.86,froth*(.7+noise2(p*1.74+time*.49)))*.86);
        gl_FragColor=vec4(mix(color,vec3(.68,.73,.74),1.-exp(-dist*dist*.00000034)),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const geo=new T.PlaneGeometry(6200,5200,290,230);geo.rotateX(-Math.PI/2);
  const mesh=new T.Mesh(geo,mat);mesh.frustumCulled=false;scene.add(mesh);
  const aim=v(0,0,0),normal=v(0,1,0),plane=new T.Plane(),clip=new T.Vector4(),q=new T.Vector4();
  return {
    resize(w,h){target.setSize(Math.max(2,Math.round(w*.58)),Math.max(2,Math.round(h*.58)));},
    draw(t,boat){
      u.time.value=t;u.tug.value.set(...boat);cam.updateMatrixWorld();
      cam.getWorldDirection(aim).add(cam.position);aim.y*=-1;
      mirror.position.copy(cam.position);mirror.position.y*=-1;
      mirror.up.set(0,1,0).applyQuaternion(cam.quaternion).reflect(normal);mirror.lookAt(aim);mirror.updateMatrixWorld();
      mirror.projectionMatrix.copy(cam.projectionMatrix);
      matrix.multiplyMatrices(mirror.projectionMatrix,mirror.matrixWorldInverse);
      // Clip submerged geometry from the offscreen view on the mean water plane.
      plane.set(normal,.16).applyMatrix4(mirror.matrixWorldInverse);clip.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);
      const e=mirror.projectionMatrix.elements;
      q.set((Math.sign(clip.x)+e[8])/e[0],(Math.sign(clip.y)+e[9])/e[5],-1,(1+e[10])/e[14]);clip.multiplyScalar(2/clip.dot(q));
      e[2]=clip.x;e[6]=clip.y;e[10]=clip.z+1;e[14]=clip.w;
      mesh.visible=false;renderer.setRenderTarget(target);renderer.render(scene,mirror);
      mesh.visible=true;renderer.setRenderTarget(null);
    }
  };
}
