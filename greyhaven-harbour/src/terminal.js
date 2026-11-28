import * as T from 'three';
import {v,M,Steelwork,paint,random,surface,railing,plate,lettering} from './fabrication.js';
import {height as ch} from './cargo.js';

function pavement() {
  const map=surface(1024,1024,(g,w,h)=>{
    const r=random(88);g.fillStyle='#776e60';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=256){
      g.fillStyle='rgba(221,213,189,'+r()*.11+')';g.fillRect(x,y,254,127);
      g.fillStyle='#574f45';g.fillRect(x+254,y,1,128);g.fillRect(x,y+127,256,1);
    }
    for(let i=0;i<40000;i++){g.fillStyle=i%2?'rgba(38,36,33,.10)':'rgba(210,206,186,.10)';g.fillRect(r()*w,r()*h,1+r()*4,1+r()*3);}
    for(let i=0;i<95;i++){const x=r()*w,y=r()*h;g.strokeStyle='rgba(46,43,40,.11)';g.lineWidth=1+r()*3;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+23,y-9,x+78,y+14,x+89,y+44);g.stroke();}
  });
  map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(20,10);return new T.MeshStandardMaterial({map,roughness:.94});
}
function portalCrane(scene,steel,x,serial,raised=false){
  const tops=48,front=-40,back=-67,crown=75;
  for(const s of [-1,1]){
    const foot=x+s*8,shoulder=x+s*5.9;
    for(const z of [front,back]){
      steel.box(M.dark,foot,4.7,z,7.8,1.15,1.58);
      for(const dx of [-2.92,-1.75,1.75,2.92])steel.cyl(M.rubber,foot+dx,4.14,z,.68,1.10,[Math.PI/2,0,0]);
      steel.box(M.yellow,foot,5.70,z,6.75,1.1,2.4);
      steel.beam(M.crane,v(foot,6.1,z),v(shoulder,25,z),2.05,2.20);
      steel.beam(M.crane,v(shoulder,25,z),v(shoulder,tops,z===front?-39:-58),1.85,1.93);
    }
    steel.beam(M.crane,v(shoulder,24,front),v(shoulder,24,back),2.2,2.8);
    steel.beam(M.crane,v(foot,6.5,back),v(shoulder,23.1,front),.85);
    steel.beam(M.crane,v(foot,6.5,front),v(shoulder,23.1,back),.85);
    steel.beam(M.pale,v(shoulder,tops,-58),v(shoulder,crown,-42),1.15);
    steel.beam(M.pale,v(shoulder,tops,front),v(shoulder,crown,-42),1.1);
    steel.beam(M.crane,v(shoulder,tops,-88),v(shoulder,tops,-38),1.45,2.05);
    steel.rod(M.wire,v(shoulder,crown,-42),v(shoulder,tops+1,-85),.16);
    const boom=z=>v(shoulder,tops+(raised?(z+38)*1.27:0),z);
    const tip=raised?5:32;
    steel.beam(M.crane,boom(-38),boom(tip),1.4,1.5);
    const upper=z=>boom(z).add(v(0,2.3,0));
    steel.beam(M.pale,upper(-38),upper(tip),.44,.4);
    const panels=10;
    for(let k=0;k<panels;k++){
      const z=-38+k*(tip+38)/panels,z2=z+(tip+38)/panels;
      steel.beam(M.pale,k%2?upper(z):boom(z),k%2?boom(z2):upper(z2),.29,.28);
    }
    for(const z of [tip,raised?-15:3])steel.rod(M.wire,v(shoulder,crown,-42),upper(z),.14);
    steel.beam(M.yellow,boom(tip),v(x-s*5.9,boom(tip).y,tip),.64,.72);
  }
  for(const y of [24,48,75]){
    const z=y===75?-42:-40;steel.box(y===75?M.pale:M.crane,x,y,z,14,1.7,2.3);
  }
  steel.box(M.crane,x,tops,-70,14,1.72,33);
  steel.box(M.cream,x,tops+3.7,-72,11.7,5.6,15);
  steel.box(M.crane,x,tops+6.65,-72,12.5,.38,16);
  for(const s of [-1,1])for(let j=0;j<9;j++)steel.box(M.steel,x+s*5.9,tops+3.5,-77.5+j*1.3,.13,2.1,.24);
  // Festoon rail and reeving machinery above the rear machinery house.
  for(const side of [-1,1]){
    const xx=x+side*6.78;
    steel.beam(M.steel,v(xx,49,-85),v(xx,49,-39),.68,.17);
    railing(steel,M.yellow,v(xx,49.1,-85),v(xx,49.1,-39),.94,2.65);
    steel.beam(M.steel,v(x+side*6.5,24.98,-67),v(x+side*6.5,24.98,-40),.82,.22);
    railing(steel,M.yellow,v(x+side*6.78,25.1,-67),v(x+side*6.78,25.1,-40),1.0,2.7);
    for(let j=0;j<4;j++){
      steel.cyl(M.dark,x+side*(4.9+j*.28),crown+.24,-42,.73,.19,[0,0,Math.PI/2]);
      steel.cyl(M.steel,x+side*(4.9+j*.28),crown+.24,-42,.37,.21,[0,0,Math.PI/2]);
    }
    // The lower stair tower is fixed to the portal with short cantilevers.
    for(let j=0;j<8;j++){
      const y=6+j*5;
      steel.beam(M.crane,v(x+side*5.9,y,-65),v(x+side*8.5,y,-65),.29,.36);
    }
    if(!raised){
      for(let j=0;j<=10;j++){
        const zz=-38+j*6.9;
        if(side===1)steel.beam(M.crane,v(x-5.85,tops+.05,zz),v(x+5.85,tops+.05,zz),.32,.44);
        if(j<10)steel.rod(M.steel,v(x+side*5.6,tops+.20,zz),v(x-side*5.6,tops+.20,zz+6.9),.081);
      }
    }
  }
  for(const z of [-76,-70]){
    steel.cyl(M.dark,x,55.37,z,1.25,4.8,[0,0,Math.PI/2]);
    for(const dx of [-2.3,-1.3,-.3,.7,1.7,2.3])steel.cyl(M.rust,x+dx,55.37,z,1.38,.14,[0,0,Math.PI/2]);
  }
  for(let z=-83;z<-42;z+=3.4){
    steel.rod(M.wire,v(x-6.48,49.8,z),v(x-6.48,48.78,z+1.7),.055);
    steel.rod(M.wire,v(x-6.48,48.78,z+1.7),v(x-6.48,49.8,z+3.4),.055);
  }
  // Switchback stair flights on the landside leg.
  for(let flight=0;flight<8;flight++){
    const y=6+flight*5,z=flight%2?-64:-70,z2=flight%2?-70:-64,xx=x+8.5;
    steel.box(M.steel,xx,y,z,2.65,.17,2.1);
    steel.beam(M.steel,v(xx,y,z),v(xx,y+5,z2),1.0,.23);
    for(let j=0;j<12;j++)steel.box(M.cream,xx,y+5*j/12,z+(z2-z)*j/12,1.3,.12,.54);
    steel.rod(M.yellow,v(xx+.70,y+.85,z),v(xx+.70,y+5.85,z2),.05);
  }
  plate(scene,lettering('GH  /  '+serial,'#f2dfc8','#99543b'),x,24,-38.54,10.5,1.55);
  if(raised)return;
}
function lift(scene,cargo,x,index){
  const carriage=new T.Group(),hook=new T.Group();scene.add(carriage,hook);
  const a=new Steelwork(carriage);a.box(M.yellow,0,0,0,12.3,1.15,5.2);
  a.box(M.cream,7,-.7,0,2.3,2.53,2.4);a.box(M.glass,7,-.6,1.24,1.99,1.3,.10);a.finish();
  const h=new Steelwork(hook);h.box(M.yellow,0,0,0,11.7,.64,2.24);h.box(M.dark,0,.51,0,5.5,.49,1.85);h.finish();
  const box=cargo.moving(index);scene.add(box);
  const ropes=new T.InstancedMesh(new T.CylinderGeometry(.053,.053,1,6),M.wire,4);scene.add(ropes);
  const dummy=new T.Object3D();
  const truck=new T.Group();scene.add(truck);const b=new Steelwork(truck);
  b.box(M.dark,0,1.02,0,13.4,.48,2.42);b.box(M.yellow,0,1.33,0,12.25,.19,2.48);
  b.box(M.red,8,2,0,2.5,2.2,2.3);b.box(M.glass,8.75,2.45,0,1.08,.73,2.35);
  for(const side of [-1,1])for(const ax of [-5.5,-4.25,5.4,8.3])b.cyl(M.rubber,ax,.6,side*1.02,.59,.35,[Math.PI/2,0,0]);
  b.finish();
  const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
  return time=>{
    // One continuous round trip. The same physical box rides the chassis out to
    // the inspection stop, returns to the crane and is reloaded in the ship.
    const phase=(time+index*3.1)%114;
    const t=Math.min(55,phase<57?phase:114-phase);
    const deck=12.78+ch*4+ch+.35,high=40.5,land=3.6+1.43+ch+.34;
    let z=0,y=deck;
    if(t<8)y=T.MathUtils.lerp(deck,high,ease(t/8));
    else if(t<19){z=-54*ease((t-8)/11);y=high;}
    else if(t<26){z=-54;y=T.MathUtils.lerp(high,land,ease((t-19)/7));}
    else{z=-54;y=T.MathUtils.lerp(land,high,ease((t-26)/8));}
    const loaded=t>=26;
    const tx=x+61*ease((t-31)/19);
    truck.position.set(tx,3.6,-54);carriage.position.set(x,46.35,z);hook.position.set(x,y,z);
    box.position.set(loaded?tx:x,loaded?land-.34-ch*.5:y-.34-ch*.5,loaded?-54:z);
    const drop=45.7-y;
    for(let n=0;n<4;n++){dummy.position.set(x+(n%2?4.8:-4.8),y+drop*.5,z+(n<2?-.84:.84));dummy.scale.set(1,drop,1);dummy.updateMatrix();ropes.setMatrixAt(n,dummy.matrix);}
    ropes.instanceMatrix.needsUpdate=true;ropes.frustumCulled=false;
  };
}
function storageShed(b,x,z,w,d){
  b.box(M.steel,x,9.1,z,w,11,d);b.box(M.cream,x,15,z,w+1.6,.80,d+1.4);
  for(let i=0;i<w;i+=6.4)b.box(M.cream,x-w/2+i,9.25,z+d/2+.02,.22,11,.16);
  for(let i=0;i<w-10;i+=19){b.box(M.dark,x-w/2+i+9,7.5,z+d/2+.19,7.5,7.8,.2);b.box(M.yellow,x-w/2+i+9,11.5,z+d/2+.25,8,.3,.22);}
  for(let i=-w*.35;i<w*.41;i+=16)b.box(M.dark,x+i,15.9,z-1.5,5.5,1.0,2.4);
}
export function terminal(scene,cargo) {
  const b=new Steelwork(scene),r=random(583),updates=[];
  const quay=3.60;
  const apron=new T.Mesh(new T.PlaneGeometry(1280,570),pavement());apron.rotation.x=-Math.PI/2;apron.position.set(0,quay,-319);apron.receiveShadow=true;scene.add(apron);
  const wallTex=surface(1024,256,(g,w,h)=>{
    g.fillStyle='#938e83';g.fillRect(0,0,w,h);const r=random(187);
    for(let i=0;i<900;i++){const x=r()*w,y=r()*h;g.fillStyle='rgba(47,45,37,'+(r()*.20)+')';g.fillRect(x,y,1+r()*5,2+r()*45);}
    g.fillStyle='#5c665b';g.fillRect(0,185,w,71);
    for(let x=0;x<w;x+=128){g.fillStyle='#515655';g.fillRect(x,0,2,h);}
  });
  wallTex.wrapS=T.RepeatWrapping;wallTex.repeat.x=38;
  const wall=new T.Mesh(new T.PlaneGeometry(1280,9),new T.MeshStandardMaterial({map:wallTex}));wall.position.set(0,-.91,-34);scene.add(wall);
  b.box(M.cream,0,3.55,-34.3,1280,.4,.63);
  for(let x=-620;x<630;x+=12){
    b.box(M.rubber,x,1.25,-33.45,1.4,3.4,1.08);
    b.box(M.steel,x,.98,-32.85,1.7,2.42,.21);
    b.box(M.yellow,x,3.82,-35.6,2.5,.29,1.0);
    b.cyl(M.dark,x,4.15,-35.6,.47,.55);
  }
  for(const z of [-40,-67])b.box(M.steel,0,3.74,z,1210,.16,.23);
  for(let x=-600;x<615;x+=15){b.box(M.cream,x,3.625,-51,6,.026,.18);b.box(M.cream,x,3.625,-57,6,.026,.18);}
  for(const [i,x] of [-169,-69+12.48*3,-69+12.48*9,187].entries()){
    portalCrane(scene,b,x,String(i+1).padStart(2,'0'),i===0);
    if(i===1||i===2)updates.push(lift(scene,cargo,x,i===1?1:6));
  }
  for(let block=0;block<14;block++)for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const x=-539+block*78+col*12.4,z=-99-row*3;
    for(let lane=0;lane<4;lane++){
      const stack=1+Math.floor(r()*4.8),line=Math.floor(r()*16);
      for(let tier=0;tier<stack;tier++)cargo.put(x,quay+(tier+.5)*ch,z-lane*29,r()<.51?line:Math.floor(r()*16));
    }
  }
  for(let i=0;i<6;i++){
    const x=-418+i*164;
    for(const dx of [-4.9,4.9]){
      for(const z of [-106,-131]){b.box(M.yellow,x+dx,11.9,z,1.3,15.5,1.1);b.box(M.dark,x+dx,4.35,z,4.6,1.42,1.36);}
      b.box(M.yellow,x+dx,20.1,-118.5,1.45,1.8,34);
    }
    for(const z of [-106,-131])b.box(M.yellow,x,19.5,z,11.5,1.02,1.2);
  }
  for(let x=-520;x<580;x+=97){
    b.cyl(M.steel,x,19.3,-85,.30,31.4);b.box(M.dark,x,35,-85,7.6,.28,.7);
    for(const dx of [-3,-1,1,3])b.box(M.cream,x+dx,34.6,-84.7,.97,.51,.8);
  }
  // Paint each numbered block entrance onto the apron with a worn stencil.
  for(let block=0;block<14;block++){
    const x=-539+block*78;
    for(let lane=0;lane<4;lane++){
      const zz=-99-lane*29;
      b.box(M.yellow,x+24,3.624,zz+2.7,62,.026,.16);
      b.box(M.yellow,x-6.7,3.624,zz-5,.16,.026,15.5);
      b.box(M.yellow,x+54.7,3.624,zz-5,.16,.026,15.5);
    }
    const marker=plate(scene,lettering('B '+String(block+1).padStart(2,'0'),'#d1c28e'),x+24,3.64,-93.6,8.4,3.0);
    marker.rotation.x=-Math.PI/2;
  }
  for(const side of [-1,1]){
    b.box(M.dark,side*639.8,-.62,-319,.6,8.5,570);
    b.box(M.cream,side*639.8,3.58,-319,.8,.22,570);
  }
  for(let i=0;i<8;i++)storageShed(b,-540+i*148,-257-i%2*20,96+i%3*9,48);
  for(let i=0;i<18;i++){
    const x=210+(i%6)*33,z=-340-Math.floor(i/6)*38,rad=12+r()*3,h=13+r()*7;
    b.cyl(M.cream,x,quay+h/2,z,rad,h);b.cyl(M.white,x,quay+h,z,rad+0.15,.52);
    for(let j=1;j<4;j++)b.cyl(M.steel,x,quay+h*j/4,z,rad+.035,.08);
    b.cyl(M.white,x,quay+h+.8,z,1.4,1.6);
    b.rod(M.rust,v(x-rad*.65,quay+1,z+rad*.82),v(x-rad*.65,quay+h+1,z+rad*.82),.17);
  }
  b.box(M.steel,300,9.0,-311,260,1.25,2.5);
  for(let x=176;x<440;x+=18)b.box(M.rust,x,6.2,-311,.62,5.9,2.2);
  for(let i=0;i<24;i++){const x=-635+r()*1220,z=-350-r()*230,w=16+r()*38,h=7+r()*21;b.box(i%3?M.steel:M.cream,x,quay+h*.5,z,w,h,25+r()*28);}
  for(const [x,z,h] of [[-252,-423,57],[-219,-432,62],[435,-454,52]]){
    for(let k=0;k<8;k++)b.cyl(k>4&&k%2?M.white:M.rust,x,quay+h*(k+.5)/8,z,2.4-k*.13,h/8+.05);
  }
  b.finish();return updates;
}
