import * as T from 'three';
import {v,Steelwork,M,paint,surface,random,railing,cable,plate,lettering} from './fabrication.js';
import {height as ch} from './cargo.js';

function hullSkin(length,depth,deck,base,title,operator,reverse,seed) {
  const r=random(seed),lo=-depth,hi=deck*1.45;
  return surface(4096,512,(g,w,h)=>{
    const Y=y=>(hi-y)/(hi-lo)*h;
    g.fillStyle=base;g.fillRect(0,0,w,h);
    g.fillStyle='#834639';g.fillRect(0,Y(.6),w,h);g.fillStyle='#323b38';g.fillRect(0,Y(1.12),w,Y(.6)-Y(1.12));
    for(let row=0;row<12;row++){
      const y=row*48;
      for(let x=(row%2)*-80;x<w;x+=170){
        g.fillStyle='rgba(255,237,205,'+(r()*.048)+')';g.fillRect(x,y,169,47);
        g.fillStyle='rgba(13,23,24,.24)';g.fillRect(x,y,1,47);g.fillRect(x,y,170,1);
      }
    }
    for(let k=0;k<540;k++){
      const x=r()*w,y=Y(deck*(.56+.7*r())),l=4+r()**3*91;
      const stain=g.createLinearGradient(x,y,x+1,y+l);
      stain.addColorStop(0,'rgba(154,85,46,'+(.09+r()*.42)+')');stain.addColorStop(1,'rgba(115,65,42,0)');
      g.fillStyle=stain;g.fillRect(x,y,1+r()**3*9,l);
    }
    g.textAlign='center';g.fillStyle='#e6e2d3';
    const text=(s,u,y,size)=>{g.font='bold '+size+'px Arial';g.fillText(s,(reverse?1-u:u)*w,Y(y));};
    text(operator,.53,deck*.44,108);text(title,.873,deck*.66,29);
    for(const u of [.09,.90])for(let i=0;i<6;i++){
      g.font='10px monospace';const x=(reverse?1-u:u)*w;
      g.fillText(String(2+i*2),x,Y(.3+i*.61));g.fillRect(x+11,Y(.3+i*.61)-2,9,2);
    }
    for(let i=0;i<8500;i++){g.fillStyle=i%2?'rgba(240,220,180,.048)':'rgba(30,24,20,.06)';g.fillRect(r()*w,r()*h,2+r()*3,1+r()*4);}
  });
}
function buildHull(parent,{L,B,D,Td,base,name,line}) {
  // Stations give independent widths at deck and waterline and the sheer at each end.
  const stations=[[0,.75,.60,1.02],[.045,.95,.87,1.0],[.15,1,.99,1],[.68,1,1,1],[.78,.96,.90,1.015],[.86,.81,.62,1.055],[.93,.51,.27,1.14],[.978,.205,.065,1.23],[1,.014,.008,1.28]];
  const ring=(u,s)=>{
    let k=1;while(k<stations.length-1&&u>stations[k][0])k++;
    const a=stations[k-1],b=stations[k],t=(u-a[0])/(b[0]-a[0]);
    const lerp=i=>a[i]+(b[i]-a[i])*t;
    const xd=(u-.5)*L,wb=lerp(1)*B*.5,ww=lerp(2)*B*.5,dy=D*lerp(3),rake=Math.max(0,(u-.80)/.2)**2*L*.016;
    return [v(xd-rake,-Td,.47*ww*s),v(xd-rake*.8,-Td*.74,.83*ww*s),v(xd-rake*.60,-Td*.3,.98*ww*s),v(xd-rake*.3,.2,ww*s),v(xd+rake*.5,dy*.66,(ww*.35+wb*.65)*s),v(xd+rake,dy,wb*s)];
  };
  const mesh=(pos,uv,idx,mat)=>{
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
    const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;parent.add(m);
  };
  const n=80;
  for(const s of [-1,1]){
    const pos=[],uv=[],idx=[];
    for(let i=0;i<=n;i++)ring(i/n,s).forEach((p,j)=>{
      pos.push(...p.toArray());uv.push(s===1?i/n:1-i/n,(p.y+Td)/(D*1.45+Td));
      if(i<n&&j<5){const a=i*6+j,b=a+6;if(s>0)idx.push(a,b,b+1,a,b+1,a+1);else idx.push(a,b+1,b,a,a+1,b+1);}
    });
    const mat=new T.MeshStandardMaterial({map:hullSkin(L,Td,D,base,name,line,s<0,s+33),roughness:.68,metalness:.16,side:T.DoubleSide});mesh(pos,uv,idx,mat);
  }
  const pos=[],uv=[],idx=[];
  for(let i=0;i<=n;i++){
    for(const s of [-1,1]){const p=ring(i/n,s)[5];pos.push(...p.toArray());uv.push(i/n,(s+1)/2);}
    if(i<n){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  mesh(pos,uv,idx,M.deck);
  for(const u of [0,1]){
    const a=ring(u,-1),b=ring(u,1),p=[],uv=[],ix=[];
    for(let i=0;i<6;i++){p.push(...a[i].toArray(),...b[i].toArray());uv.push(0,i/5,1,i/5);if(i<5){const j=i*2;ix.push(j,j+2,j+1,j+1,j+2,j+3);}}
    const m=paint(base);m.side=T.DoubleSide;mesh(p,uv,ix,m);
  }
  return ring;
}

export function freighter(scene,cargo){
  const g=new T.Group();scene.add(g);
  const ring=buildHull(g,{L:246,B:35,D:12.3,Td:8,base:'#253e48',line:'MERIDIAN',name:'CAPE WREN'});
  const b=new Steelwork(g),r=random(404);
  for(const s of [-1,1]){
    for(let i=0;i<36;i++){const a=ring(i/36,s)[5],c=ring((i+1)/36,s)[5];railing(b,M.cream,a,c,1.03,2.8);}
    for(const x of [-112,-76,-38,2,38,80]){b.cyl(M.dark,x,12.85,s*15.2,.45,1.1);b.cyl(M.dark,x,13.42,s*15.2,.64,.12);}
  }
  // Accommodation terraces step inward above the engine casing.
  b.box(M.cream,-91,14.4,0,21,4.2,26);
  for(let d=0;d<7;d++){
    const y=16.5+d*2.83,x=-91+d*.26,w=18.8-d*.4,z=24-d*.18;
    b.box(M.white,x,y+1.35,0,w,2.7,z);
    b.box(M.cream,x-.46,y+2.73,0,w+1.75,.20,z+1.5);
    for(const s of [-1,1]){
      for(let j=0;j<6;j++)b.box(M.glass,x-w*.39+j*w*.151,y+1.59,s*(z/2+.04),1.18,.96,.10);
      for(let j=0;j<9;j++)b.box(M.glass,x+w/2+.04,y+1.56,(j-4)*2.36,.10,.95,1.25);
      railing(b,M.white,v(x-w/2-.75,y+2.84,s*(z/2+.54)),v(x+w/2+.22,y+2.84,s*(z/2+.54)),.8);
    }
  }
  // Vent trunks, rescue davits and the bridge roof's communications equipment.
  for(const side of [-1,1]){
    for(let j=0;j<9;j++)b.box(M.steel,-106.4+j*.44,26.5,side*4.03,.18,3.0,.12);
    for(const x of [-97,-93])b.cyl(M.cream,x,24.7,side*14.45,.49,1.42,[0,0,Math.PI/2]);
    for(const y of [18,21,24,27,30]) {
      b.box(M.dark,-99.5,y+.6,side*12.85,.75,1.44,.14);
      b.box(M.orange,-99.02,y+.74,side*12.95,.17,.27,.12);
    }
    for(const x of [-94,-84])b.rod(M.wire,v(x,39.2,side*8),v(-89,48,0),.035);
    const dome=new T.Mesh(new T.SphereGeometry(.84,14,10),M.white);
    dome.position.set(-93,40.3,side*9.4);g.add(dome);
    b.cyl(M.steel,-93,39.63,side*9.4,.62,.74);
    plate(g,lettering('M','#f5edda'),-108,31.2,side*4.08,5.3,2.8,side<0?Math.PI:0);
  }
  for(let j=0;j<3;j++)b.rod(M.white,v(-91+j*2,38.7,3.2+j*2),v(-91+j*2,42.8+j*.5,3.2+j*2),.043);
  const by=36.35;
  b.box(M.white,-89,by+.42,0,16,.9,34);
  b.box(M.glass,-88.7,by+1.85,0,15.3,2.0,29);
  b.box(M.white,-89,by+3.05,0,17.3,.46,31.4);
  for(let z=-14;z<=14;z+=1.85)b.box(M.cream,-80.99,by+1.86,z,.16,2,.12);
  for(const s of [-1,1])for(let x=-96;x<-81;x+=2.55)b.box(M.cream,x,by+1.86,s*14.53,.15,2,.12);
  b.box(M.dark,-108,24,0,8,21,8);b.box(M.orange,-108,31.2,0,8.12,4,8.12);
  for(const z of [-2,2])b.cyl(M.dark,-108,35.4,z,1.43,3.4);
  b.cyl(M.cream,-89,44.8,0,.23,10.5);b.box(M.white,-89,46.1,0,.2,.22,5);
  const radar=new T.Group();radar.position.set(-89,48,0);g.add(radar);
  const rb=new Steelwork(radar);rb.box(M.cream,0,0,0,4.8,.28,.36);rb.finish();
  for(const z of [-15,15]){
    const boat=new T.Mesh(new T.SphereGeometry(1,20,10),M.lifeboat);boat.scale.set(4.1,1.25,1.24);boat.position.set(-97,23,z);g.add(boat);
    for(const x of [-100,-94])b.beam(M.white,v(x,22,z*.88),v(x,25,z),.23);
  }
  for(let i=0;i<13;i++){
    const x=-69+i*12.48;
    b.box(M.dark,x,12.53,0,12.35,.47,30.8);
    const band=Math.floor(r()*16);
    for(let j=0;j<11;j++){
      const tiers=(i===3||i===9)&&j===5?4:Math.min(6,3+Math.floor(r()*4)+(Math.abs(j-5)<3?1:0))-(i===12?1:0);
      for(let k=0;k<tiers;k++){
        const variant=r()<.43?band:Math.floor(r()*16);
        cargo.put(x,12.78+ch*(k+.5),(j-5)*2.49,variant);
      }
    }
    if(i%2===0&&i<12)for(const z of [-14.2,14.2]){b.box(M.cream,x+6.22,16.4,z,.14,7.3,.13);b.box(M.yellow,x+6.22,19.95,0,.23,.20,28.5);}
  }
  for(const s of [-1,1]){
    b.cyl(M.dark,103,14.5,s*5.8,1.6,1.8,[Math.PI/2,0,0]);
    for(let j=0;j<5;j++)b.ring(M.wire,103,14.5,s*5.8+(j-2)*.32,1.25);
    b.rod(M.white,v(109,15.3,s*2.2),v(108,29,0),.14);
  }
  // Two hawse pipes and the anchors are mounted against the sloping bow plating.
  for(const side of [-1,1]){
    const p=ring(.902,side)[4],a=side*.50;
    b.ring(M.dark,p.x,p.y,p.z+side*.14,.62,[0,a,0]);
    const top=v(p.x,p.y-.22,p.z+side*.47),bottom=v(p.x-.54,p.y-2.14,p.z+side*.50);
    b.rod(M.dark,top,bottom,.17);
    for(const d of [-1,1])b.beam(M.dark,bottom,v(bottom.x+d*.76,bottom.y+.51,bottom.z),.28,.38);
  }
  // Steel grate gangway from the aft accommodation to the apron.
  const gangA=v(-80,13,-16.9),gangB=v(-103,3.83,-34.7);
  b.beam(M.steel,gangA,gangB,1.16,.25);
  for(const offset of [-.56,.56])railing(b,M.yellow,gangA.clone().add(v(offset,0,0)),gangB.clone().add(v(offset,0,0)),1.0,2.0);
  for(const [x,ex] of [[109,139],[97,128],[-111,-139],[-102,-133]]){
    cable(scene,M.wire,v(x,x>0?14:12.8,-(x>0?8:13)),v(ex,4.2,-34),2.3,.14);
  }
  b.finish();return t=>{radar.rotation.y=t*.55;};
}

export function harbourTug(scene) {
  const g=new T.Group();scene.add(g);
  const ring=buildHull(g,{L:25.5,B:8.1,D:2.32,Td:2.4,base:'#26302f',line:'',name:'SKUA'});
  const b=new Steelwork(g);
  for(const s of [-1,1]){
    for(let k=0;k<28;k++){const a=ring(k/28,s)[5],c=ring((k+1)/28,s)[5];b.rod(M.rubber,a,c,.24);}
    for(let i=0;i<10;i++){const u=.06+i*.094,p=ring(u,s)[5];b.ring(M.rubber,p.x,p.y-.60,p.z+s*.13,.61,[0,s*(u>.72?(u-.72)*2.7:0),0]);}
  }
  b.box(M.yellow,1.7,3.56,0,9.7,2.52,5.34);b.box(M.cream,1.65,4.89,0,10.3,.22,5.95);
  b.box(M.white,2.65,5.51,0,5.6,1.18,4.9);b.box(M.glass,2.65,6.67,0,5.45,1.38,4.84);b.box(M.white,2.65,7.43,0,6.18,.23,5.52);
  for(const s of [-1,1]){
    for(let x=.04;x<5.6;x+=1.32)b.box(M.white,x,6.67,s*2.44,.11,1.37,.12);
    for(let z=-2.3;z<2.4;z+=1.14)b.box(M.white,2.65+s*2.75,6.67,z,.10,1.39,.11);
    for(let x=-1.5;x<5;x+=2.2)b.box(M.glass,x,3.93,s*2.68,.85,.62,.07);
    b.cyl(M.orange,-2.2,6.15,s*1.65,.42,2.5);b.cyl(M.dark,-2.2,7.57,s*1.65,.39,.65);
    railing(b,M.white,v(-3.2,5.0,s*2.78),v(6.3,5,s*2.78),.83,1.5);
    b.ring(M.lifeboat,.15,3.72,s*2.76,.4);
  }
  b.cyl(M.white,2.0,9.05,0,.09,3.2);b.box(M.cream,2,10.2,0,.12,.10,2.1);
  b.cyl(M.dark,-6.3,3.25,0,1.05,2.4,[Math.PI/2,0,0]);
  for(let i=0;i<9;i++)b.ring(M.rust,-6.3,3.25,(i-4)*.23,.84);
  b.finish();
  return t=>{
    const a=.48+t*.026,x=105*Math.sin(a),z=82+20*Math.cos(a);
    const dx=105*Math.cos(a),dz=-20*Math.sin(a);g.position.set(x,.09*Math.sin(t*1.4),z);
    g.rotation.set(.014*Math.sin(t*.9),Math.atan2(-dz,dx),.006*Math.cos(t*1.4),'YXZ');
    return [x,z,Math.atan2(dz,dx)];
  };
}
