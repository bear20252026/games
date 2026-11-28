import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {v} from './fabrication.js';
import {Cargo} from './cargo.js';
import {freighter,harbourTug} from './vessels.js';
import {terminal} from './terminal.js';
import {atmosphere,coast,water,sunDirection} from './coast.js';

const el=id=>document.getElementById(id);
const canvas=el('scene');
const shots=[
  {title:'Harbour approach',duration:19,fov:37,eye:[150,26,219],end:[140,23,207],at:[-4,19,-12]},
  {title:'Alongside Cape Wren',duration:15,fov:46,eye:[153,8,83],end:[142,7.2,89],at:[-27,17,0]},
  {title:'The crane rail',duration:17,fov:44,eye:[-118,45,-89],end:[-106,45,-86],at:[7,23,-4]},
  {title:'Terminal overview',duration:18,fov:39,eye:[-220,139,222],end:[-201,129,211],at:[-4,10,-68]},
  {title:'Tug escort',duration:15,fov:39,follow:true}
];
const pad=n=>String(n).padStart(2,'0');
async function start(){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const scene=new T.Scene();scene.background=new T.Color('#c5ced0');scene.fog=new T.FogExp2('#bec9c9',.00080);
  const camera=new T.PerspectiveCamera(38,1,.5,8500);
  const hemi=new T.HemisphereLight(0xc7ddeb,0xa2977f,1.68);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffe1bb,3.13);sun.target.position.set(0,2,-36);sun.position.copy(sun.target.position).addScaledVector(sunDirection,380);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
  Object.assign(sun.shadow.camera,{left:-225,right:225,top:170,bottom:-170,near:10,far:730});
  sun.shadow.normalBias=.085;sun.shadow.bias=-.00016;
  const skyMotion=atmosphere(scene);
  const bake=new T.PMREMGenerator(renderer);
  scene.environment=bake.fromScene(scene,.025,1,8000).texture;
  scene.environmentIntensity=.32;
  bake.dispose();
  await new Promise(requestAnimationFrame);
  const cargo=new Cargo(),radar=freighter(scene,cargo),lifts=terminal(scene,cargo),tug=harbourTug(scene),shore=coast(scene);
  cargo.finish(scene);
  const sea=water(scene,renderer,camera);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;
  controls.minDistance=8;controls.maxDistance=790;controls.maxPolarAngle=Math.PI*.486;controls.enabled=false;
  let index=0,shotTime=0,time=0,touring=!matchMedia('(prefers-reduced-motion: reduce)').matches,orbit=false,last=performance.now(),boat;
  const focus=v(0,0,0),from=v(0,0,0),to=v(0,0,0),eye=v(0,0,0);
  function resize(){
    const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);sea.resize(w*renderer.getPixelRatio(),h*renderer.getPixelRatio());
  }
  resize();window.addEventListener('resize',resize);
  function sync(){
    el('view-name').textContent=orbit?'Free camera':shots[index].title;
    el('position').textContent=orbit?'ORBIT':pad(index+1)+' / '+pad(shots.length);
    el('play').dataset.playing=String(touring&&!orbit);
    const label=touring&&!orbit?'Pause camera tour':'Play camera tour';
    el('play').setAttribute('aria-label',label);el('play').title=label;
    el('orbit').setAttribute('aria-pressed',String(orbit));el('orbit').textContent=orbit?'Exit orbit':'Orbit';
    el('tip').hidden=!orbit;
  }
  function go(step){
    index=(index+step+shots.length)%shots.length;shotTime=0;orbit=false;controls.enabled=false;sync();
  }
  function toggleOrbit(){
    if(orbit){go(0);return;}
    controls.target.copy(focus);controls.enabled=true;orbit=true;controls.update();sync();
  }
  function togglePlay(){if(orbit){go(0);touring=true;}else touring=!touring;sync();}
  el('prev').onclick=()=>go(-1);el('next').onclick=()=>go(1);el('play').onclick=togglePlay;el('orbit').onclick=toggleOrbit;
  window.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='ArrowLeft')go(-1);else if(e.key==='ArrowRight')go(1);
    else if(e.key.toLowerCase()==='o')toggleOrbit();else if(e.key.toLowerCase()==='h')document.body.classList.toggle('clean');
    else if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();togglePlay();}
  });
  function frame(now){
    const dt=Math.min(Math.max((now-last)/1000,0),.12);last=now;time+=dt;
    boat=tug(time);radar(time);skyMotion(time);for(const update of lifts)update(time);for(const update of shore)update(time);
    if(orbit)controls.update();else{
      if(touring)shotTime+=dt;
      if(shotTime>=shots[index].duration)go(1);
      const s=shots[index],k=shotTime/s.duration;
      if(s.follow){eye.set(boat[0]+32,8,boat[1]+45);focus.set(boat[0]-6,6.5,boat[1]-9);}
      else{eye.lerpVectors(from.fromArray(s.eye),to.fromArray(s.end),k);focus.fromArray(s.at);}
      camera.position.copy(eye);camera.lookAt(focus);
      // Keep the ship and crane silhouettes in view on a narrow screen.
      if(camera.aspect<1.15)camera.position.sub(focus).multiplyScalar(Math.min(1.68,1.15/camera.aspect)).add(focus);
      camera.fov=s.fov;camera.updateProjectionMatrix();
    }
    renderer.shadowMap.needsUpdate=true;sea.draw(time,boat);renderer.render(scene,camera);
    el('loading').hidden=true;requestAnimationFrame(frame);
  }
  sync();requestAnimationFrame(frame);
}
start().catch(e=>{console.error(e);el('load-status').textContent='This harbour needs WebGL 2. Enable graphics acceleration and reload.';});
