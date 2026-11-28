import{N as v,g as Vt,f as $t,c as bt,T as k}from"./react-BbqnMepd.js";import{G as Ue,al as xt,v as xe,j as me,w,b as Fe,$ as ie,am as It,an as qe,a5 as Pe,J as He,a8 as L,ao as Gt,ap as St,aq as je,V as Ye,Y as pe,a0 as Lt,R as Mt,aa as Tt,a3 as kt,a1 as At,o as nt,ar as Nt,a6 as qt,a4 as Dt,ad as zt,as as Ht,ae as Ct,af as Rt}from"./three-DlAHX5Z_.js";import{W as Ft,d as De,e as Xe,C as Yt,n as ze,M as Xt,t as Zt,A as Jt,x as Kt,S as Qt,H as ea,g as Ge,z as ot,Z as jt,q as ta,h as aa,m as it,N as na,X as oe,i as X,P as rt,a as st,k as oa,_ as ia,r as ra,F as sa,l as la,p as ua,o as lt,v as Be,$ as ca}from"./main-CHq3HDKI.js";import{h as ha,S as da,y as fa,v as ma}from"./ivy-leaf-DYDTTeso.js";import{b as pa,w as ga}from"./decoded-images-BOz4p8TQ.js";import"./rapier-BcgqzzOj.js";import"./gsap-D1AWpUut.js";import"./home-C-bt6R1Y.js";import"./modulepreload-polyfill-B5Qt9EMX.js";function va({anchor:n,terrainScale:e,terrainAmplitude:o}){const t=v.useMemo(()=>{const s=[],d=Math.cos(X),l=Math.sin(X),u=(i,p)=>Xe(n.x+i*d+p*l,n.z-i*l+p*d,e,o)-n.y;for(let i=0;i<8;i++){const p=1.1+i/7*4,y=Math.sin(p)*2.25,x=Math.cos(p)*2,T=u(y,x);for(let g=0;g<6;g++){const a=g*Math.PI/3+i*.8,r=.28+g%3*.06;for(let h=1;h<=5;h++){const f=h/6,S=r*f,C=T+Math.sin(f*Math.PI*.75)*r*.7,I=new w(y+Math.cos(a)*S,C,x+Math.sin(a)*S);for(const F of[-1,1]){const V=I.clone().add(new w(Math.cos(a+F*.95),.012,Math.sin(a+F*.95)).multiplyScalar(.09*(1-f*.7))),_=I.clone().add(new w(Math.cos(a),0,Math.sin(a)).multiplyScalar(-.028)),B=new Ye;B.setAttribute("position",new Tt([..._,...I,...V],3)),B.computeVertexNormals(),s.push(B)}}}}return[s].map(i=>{const p=i.map(x=>x.index?x.toNonIndexed():x),y=kt(p);return new Set([...i,...p]).forEach(x=>x.dispose()),y})},[n,e,o]),m=v.useMemo(()=>[new At({color:"#527746",roughness:.95,side:He})],[]);return v.useEffect(()=>()=>t.forEach(s=>s.dispose()),[t]),v.useEffect(()=>()=>m.forEach(s=>s.dispose()),[m]),k.jsx("group",{children:t.map((s,d)=>k.jsx("mesh",{geometry:s,material:m[d],receiveShadow:!0},d))})}const wa=/s?creen|sreen/i,ya=/antenna/i,ba="screens-lamp",ut=.375,ct=.1;function Ce(n,e){const o=Math.sin(n*127.1+e*311.7)*43758.5453;return o-Math.floor(o)}function xa(n,e){const o=Math.floor(n),t=Math.floor(e),m=n-o,s=e-t,d=m*m*(3-2*m),l=s*s*(3-2*s),u=Ce(o,t),i=Ce(o+1,t),p=Ce(o,t+1),y=Ce(o+1,t+1);return u+(i-u)*d+(p-u)*l+(u-i-p+y)*d*l}function Sa(n,e){const o=Math.cos(X),t=Math.sin(X),m=n-De.x,s=e-De.z;return{x:m*o-s*t,z:m*t+s*o}}function Ma(n,e,o){const t=new Ct(n),m=Math.max(4,n.length*3),s=5,d=new Rt(t,m,1,s,!1),l=d.attributes.position,u=new w,i=new w;for(let p=0;p<=m;p+=1){const y=p/m;t.getPointAt(y,u);const x=L.lerp(e,o,Math.pow(y,.7));for(let T=0;T<=s;T+=1){const g=p*(s+1)+T;i.fromBufferAttribute(l,g).sub(u).multiplyScalar(x).add(u),l.setXYZ(g,i.x,i.y,i.z)}}return d.computeVertexNormals(),d}function ht(){const n=document.createElement("canvas");n.width=128,n.height=128;const e=n.getContext("2d"),o=e.createRadialGradient(64,64,0,64,64,64);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(.35,"rgba(255,255,255,0.55)"),o.addColorStop(.7,"rgba(255,255,255,0.14)"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.fillRect(0,0,128,128);const t=new zt(n);return t.colorSpace=Ue,t}function*Ta(n,e,o){const t=Be(6045415),m=n.clone(!0);m.updateMatrixWorld(!0);const s=[];m.traverse(h=>{h.isMesh&&s.push(h)});const d=new Mt,l=new w,u=h=>wa.test(h.name)||ya.test(h.name),i=(h,f)=>{d.set(h,f),d.far=10;const S=d.intersectObjects(s,!1)[0];return!S||!S.face?null:(l.copy(S.face.normal).transformDirection(S.object.matrixWorld),l.dot(f)>0&&l.negate(),{point:S.point.clone(),normal:l.clone(),screen:u(S.object)})},p=new w(0,1,0),y=[],x=[],T=function*(h,f,S,C,I,F,V){const _=[];let B=f,R=t()<.5?1:-1;for(let U=0;U<S;U+=1){h+=I+(xa(h*4.1,B*3.3)-.5)*.12;const A=new w(Math.sin(h),0,Math.cos(h)),$=i(A.clone().multiplyScalar(4).setY(B),A.clone().negate());if(yield,!$||$.screen)break;if($.normal.dot(A)<.35){B+=C;continue}const K=$.point.addScaledVector($.normal,.01);_.push(K);const re=new w().crossVectors($.normal,p).normalize(),se=1-U/S,le=t()<.35?2:1;for(let Q=0;Q<le;Q+=1){R=-R;const ue=new w().addScaledVector(p,-.75-t()*.3).addScaledVector(re,R*(.55+t()*.4));y.push({point:K.clone().addScaledVector(re,R*.012).addScaledVector($.normal,.012+t()*.02),normal:$.normal.clone(),hang:ue,lift:.35+t()*.45,size:(.07+t()*.045)*(.7+se*.3)*(V?.85:1),tint:ma(t,1-se)})}V===0&&U>3&&t()<.12&&(yield*T(h,B,5+Math.floor(t()*6),C*.45,(t()<.5?-1:1)*.06,!1,1)),B+=C}if(_.length>=3){if(F){const U=_[0].clone(),A=new w(U.x,0,U.z).normalize();U.addScaledVector(A,.05),U.y=o(U.x,U.z)-.03,_.unshift(U)}x.push({points:_,root:V===0?.014:.008})}},g=[84,102,120,136,150,162,172,182,192,204,218,234,250,268];for(const h of g){const f=L.degToRad(h+(t()-.5)*8),S=.8+t()*(e.y-1);yield*T(f,.04,Math.round(S/.065),.065,(t()-.5)*.02,!0,0)}const a={x:e.x*.5},r=i(new w(-4,.16,-.25),new w(1,0,0));return{leaves:y,stems:x,cableStart:r?.point??new w(-a.x,.16,-.25)}}function*ka(n,e,o){const t=yield*Ta(n,e,o),m=[];for(const d of t.stems)m.push(Ma(d.points,d.root,.003)),yield;const s=Aa(t.cableStart,o);return{...t,stemParts:m,cable:s}}function Ut(n,e){const o=globalThis.requestIdleCallback??(l=>window.setTimeout(()=>{const u=performance.now();l({didTimeout:!1,timeRemaining:()=>Math.max(0,6-(performance.now()-u))})},16)),t=globalThis.cancelIdleCallback??window.clearTimeout;let m=0,s=!1;const d=l=>{if(s)return;let u;do u=n.next();while(!u.done&&!l.didTimeout&&l.timeRemaining()>3);u.done?e(u.value):m=o(d,{timeout:250})};return m=o(d,{timeout:250}),()=>{s=!0,t(m)}}function Aa(n,e){const o=ca.find(g=>g.id===ba);if(!o)return null;const t=o.x-Math.sin(o.rotation)*ut,m=o.z-Math.cos(o.rotation)*ut,s=Sa(t,m),d=new ie(-s.x,-s.z).normalize(),l=s.x+d.x*(ct+.02),u=s.z+d.y*(ct+.02),i=Be(828958),p=[n.clone(),new w(n.x-.12,e(n.x-.12,n.z)+.02,n.z)],y=9;for(let g=1;g<y;g+=1){const a=g/y,r=Math.sin(a*Math.PI)*.55+Math.sin(a*Math.PI*2.3)*.12,h=L.lerp(n.x-.12,l,a)+d.y*r,f=L.lerp(n.z,u,a)-d.x*r+(i()-.5)*.08;p.push(new w(h,e(h,f)+.02,f))}const x=e(l,u);p.push(new w(l,x+.03,u)),p.push(new w(l,x+.5,u)),p.push(new w(l,x+.86,u));const T=new Ct(p,!1,"centripetal");return{tube:new Rt(T,96,.017,6,!1),box:{x:l+d.x*.02,y:x+.95,z:u+d.y*.02,yaw:Math.atan2(d.x,d.y)}}}const dt=12;function za({model:n,footprint:e,anchor:o,terrainScale:t,terrainAmplitude:m,lightRef:s}){const d=v.useMemo(()=>{const a=Math.cos(X),r=Math.sin(X);return(h,f)=>Xe(o.x+h*a+f*r,o.z-h*r+f*a,t,m)-o.y},[o,t,m]),[l,u]=v.useState(null);v.useEffect(()=>{let a=!1,r=0,h=null;const f=()=>{r=window.setTimeout(()=>{a||(h=Ut(ka(n,e,d),C=>{a||u(C)}))},4400)};let S=null;return lt.getState().hudReady?f():S=lt.subscribe(C=>{C.hudReady&&(S?.(),S=null,f())}),()=>{a=!0,S?.(),window.clearTimeout(r),h?.()}},[n,e,d]);const i=v.useMemo(()=>{if(!l)return null;const a=new nt,r=new qe,h=new w,f=new Nt(ha(),new At({vertexColors:!0,roughness:da,side:He}),Math.max(1,l.leaves.length));f.count=l.leaves.length;const S=new w,C=new w,I=new nt,F=new qe,V=new w(1,0,0);l.leaves.forEach((R,U)=>{C.copy(R.hang).addScaledVector(R.normal,-R.hang.dot(R.normal)).normalize(),S.crossVectors(C,R.normal).normalize(),I.makeBasis(S,C,R.normal),r.setFromRotationMatrix(I),F.setFromAxisAngle(V,-R.lift),r.multiply(F),h.setScalar(R.size),a.compose(R.point,r,h),f.setMatrixAt(U,a),f.setColorAt(U,R.tint)});const _=l.stemParts.length?kt(l.stemParts):null;l.stemParts.forEach(R=>R.dispose());const B=l.cable;return f.castShadow=!1,f.receiveShadow=!0,f.instanceMatrix.needsUpdate=!0,f.instanceColor&&(f.instanceColor.needsUpdate=!0),f.computeBoundingSphere(),{ivy:f,stemGeometry:_,cable:B}},[l,d]);v.useEffect(()=>()=>{var a,r;i&&(i.ivy.geometry.dispose(),i.ivy.material.dispose(),i.ivy.dispose(),(a=i.stemGeometry)==null||a.dispose(),(r=i.cable)==null||r.tube.dispose())},[i]);const p=v.useMemo(()=>{const a=new St(4.2,2.6,16,10).rotateX(-Math.PI/2),r=a.attributes.position;for(let f=0;f<r.count;f+=1){const S=r.getX(f),C=r.getZ(f)+1.05;r.setXYZ(f,S,d(S,C)+.035,C)}a.computeBoundingSphere();const h=new qt({map:ht(),transparent:!0,opacity:0,blending:Pe,depthWrite:!1,toneMapped:!1});return{geometry:a,material:h}},[d]);v.useEffect(()=>()=>{p.geometry.dispose(),p.material.map.dispose(),p.material.dispose()},[p]);const y=v.useMemo(()=>{const a=Be(198629),r=Array.from({length:dt},()=>({x:(a()-.5)*1.8,y:.8+a()*1.9,z:.55+a()*.45,radius:.14+a()*.22,speed:(1.6+a()*2.2)*(a()<.5?-1:1),phase:a()*Math.PI*2})),h=new Ye;h.setAttribute("position",new Tt(new Float32Array(dt*3),3));const f=new Dt({size:.075,map:ht(),color:"#ffe7b8",transparent:!0,opacity:0,depthWrite:!1,blending:Pe});return{flight:r,geometry:h,material:f}},[]);v.useEffect(()=>()=>{y.geometry.dispose(),y.material.map.dispose(),y.material.dispose()},[y]);const x=v.useRef(),T=v.useMemo(()=>({h:0,s:0,l:0}),[]),g=v.useRef();return bt(a=>{const r=jt.getState(),h=L.smoothstep(r.nightAmount??0,.12,.78),f=s.current;f&&(f.color.getHSL(T),p.material.color.setHSL(T.h,Math.min(1,T.s*1.8+.25),T.l*.62),p.material.opacity=L.clamp(f.intensity/3,0,1)*.3*h),x.current&&(x.current.visible=p.material.opacity>.004);const S=g.current;if(!S||(y.material.opacity=h*.95,S.visible=h>.05&&!oe,!S.visible))return;const C=a.clock.elapsedTime,I=y.geometry.attributes.position;y.flight.forEach((F,V)=>{const _=C*F.speed+Math.sin(C*3.1+F.phase)*1.3;I.setXYZ(V,F.x+Math.cos(_)*F.radius,F.y+Math.sin(_*1.7)*F.radius*.6+Math.sin(C*17+F.phase)*.02,F.z+Math.sin(_)*F.radius*.5)}),I.needsUpdate=!0}),k.jsxs("group",{children:[i&&k.jsxs(k.Fragment,{children:[k.jsx("primitive",{object:i.ivy,dispose:null}),i.stemGeometry&&k.jsx("mesh",{geometry:i.stemGeometry,receiveShadow:!0,dispose:null,children:k.jsx("meshStandardMaterial",{color:fa,roughness:.95})}),i.cable&&k.jsxs(k.Fragment,{children:[k.jsx("mesh",{geometry:i.cable.tube,castShadow:!0,receiveShadow:!0,dispose:null,children:k.jsx("meshStandardMaterial",{color:"#26282a",roughness:.7})}),k.jsxs("mesh",{position:[i.cable.box.x,i.cable.box.y,i.cable.box.z],rotation:[0,i.cable.box.yaw,0],castShadow:!0,children:[k.jsx("boxGeometry",{args:[.13,.17,.07]}),k.jsx("meshStandardMaterial",{color:"#4a4f4c",roughness:.6,metalness:.3})]})]})]}),k.jsx("mesh",{ref:x,geometry:p.geometry,material:p.material,renderOrder:3,visible:!1}),k.jsx("points",{ref:g,geometry:y.geometry,material:y.material,frustumCulled:!1,visible:!1})]})}const Pt="/games/curllmooha/assets/tv-BIHPSDVB.glb",te=new w,ae=new w,ge=new w,Ca=new w,Re=new w,ft=new w(0,1,0),Ra=6e3;function*Fa(n,{skip:e=()=>!1,cell:o=.18,minArea:t=.01,clearance:m=.3,spacing:s=.45,limit:d=6,avoid:l=[],avoidRadius:u=.4}={}){n.updateMatrixWorld(!0);const i=new Map,p=[];n.traverse(a=>{a.isMesh&&!e(a)&&p.push(a)});let y=0;for(const a of p){const r=a.geometry.attributes.position,h=a.geometry.index,f=h?h.count:r.count;for(let S=0;S<f;S+=3){y>=Ra&&(y=0,yield),y+=1;const C=h?h.getX(S):S,I=h?h.getX(S+1):S+1,F=h?h.getX(S+2):S+2;te.fromBufferAttribute(r,C).applyMatrix4(a.matrixWorld),ae.fromBufferAttribute(r,I).applyMatrix4(a.matrixWorld),ge.fromBufferAttribute(r,F).applyMatrix4(a.matrixWorld),Re.subVectors(ge,ae).cross(Ca.subVectors(ae,te));const V=Re.length();if(V<1e-9||(Re.divideScalar(V),Math.abs(Re.y)<.92))continue;const _=(te.x+ae.x+ge.x)/3,B=(te.y+ae.y+ge.y)/3,R=(te.z+ae.z+ge.z)/3,U=`${Math.floor(_/o)}:${Math.floor(R/o)}`;let A=i.get(U);if(A||i.set(U,A={x:0,z:0,y:-1/0,area:0,weight:0}),B>A.y+.03&&(A.y=B,A.area=0,A.x=0,A.z=0,A.weight=0),B>A.y-.03){const $=V/2;A.area+=$,A.x+=_*$,A.z+=R*$,A.weight+=$}}}const x=[];for(const a of i.values())a.area<t||x.push(new w(a.x/a.weight,a.y,a.z/a.weight));x.sort((a,r)=>r.y-a.y);const T=new Mt;T.far=m;const g=[];for(const a of x){if(g.length>=d)break;g.some(r=>Math.hypot(r.x-a.x,r.z-a.z)<s)||l.some(r=>Math.hypot(r.x-a.x,r.z-a.z)<u)||(T.set(te.copy(a).addScaledVector(ft,.02),ft),!T.intersectObjects(p,!1).length&&g.push(a))}return g}const be=3.4,ja=5.2,Ua=.1,mt=oe?0:.62,pt=/s?creen|sreen/i,gt=/antenna/i,Pa=4;function _a(n){const e=n.geometry.getAttribute("position"),o=new w,t=new je().setFromBufferAttribute(e),m=t.getSize(new w),s=t.getCenter(new w),d=m.x>=m.z,l=[null,null];for(let u=0;u<e.count;u+=1){o.fromBufferAttribute(e,u);const i=(d?o.x-s.x:o.z-s.z)>=0?1:0;(!l[i]||o.y>l[i].y)&&(l[i]=o.clone())}return!l[0]||!l[1]?null:(n.updateWorldMatrix(!0,!1),l.map(u=>u.applyMatrix4(n.matrixWorld)))}function Ba(n){const e=n.clone();e.metalness=.24,e.roughness=.62;const o={uTime:{value:0},uCharge:{value:1},uArc:{value:0},uTipY:{value:0},uTipSpan:{value:1}};return e.userData.chargeUniforms=o,e.onBeforeCompile=t=>{t.uniforms.uTime=o.uTime,t.uniforms.uCharge=o.uCharge,t.uniforms.uArc=o.uArc,t.uniforms.uTipY=o.uTipY,t.uniforms.uTipSpan=o.uTipSpan,t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vRod;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vRod = position;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
                uniform float uTime;
                uniform float uCharge;
                uniform float uArc;
                uniform float uTipY;
                uniform float uTipSpan;
                varying vec3 vRod;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
                // Nothing runs up the rods any more.
                //
                // There were two charges travelling the length of the aerial,
                // and at any distance they read as bands sliding over the
                // metal — a ring of light crawling up a stick, which is not
                // what electricity looks like on anything. The rods are just
                // rods; the only thing that happens here is that their ends
                // light when the gap between them fires.
                // A point, not a band. The cap is a sixth of the rod and the
                // curve is steep inside it, so the part that actually goes
                // past white is the last few percent of the metal — which is
                // where a discharge is anchored and the only place it is that
                // bright in any photograph of one.
                float tip = pow(smoothstep(uTipY - uTipSpan, uTipY, vRod.y), 3.5);
                // Mains hum. The rod ends never sit still while the gap is
                // live: metal carrying a current buzzes, and a perfectly
                // steady glow on the tips reads as a painted highlight.
                float hum = 0.86 + 0.14 * sin(uTime * 47.0) + 0.06 * sin(uTime * 113.0);
                totalEmissiveRadiance +=
                    vec3(0.5, 0.95, 1.9) * tip * uArc * hum * 2.2 * uCharge;`)},e.customProgramCacheKey=()=>"meadow-antenna-charge",e}const Oa="'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace",Wa={ident:22},Ea=6,vt=[0,4,5],_t="TV_02_screen_10_0",Va=Object.freeze({[_t]:"project-aera",TV_03_sreen_03_0:"project-brickblaster",TV_Sreen_01_0:"project-hologram",TV_05_screen_05_0:"project-paper-boat",TV_07_screen_07_0:"project-golden-hour",TV_08_screen_08_0:"project-cosmic-bloom",PC_01_Sreen_02_0:"project-polify"}),ne=[{tint:[1,.62,.14],name:"amber"},{tint:[.38,1,.48],name:"green"},{tint:[.58,.79,1],name:"cold white"},{tint:[1,.91,.7],name:"warm white"},{tint:[.34,.92,1],name:"cyan"},{tint:[1,.46,.36],name:"salmon"}];function $a(n){const e=Be(24301^Math.imul(n+1,2654435761));return{grain:.012+e()*.038,faultOdds:.05+e()*.11,faultRate:.15+e()*.3,rollSpeed:.015+e()*.075,rollAmount:.05+e()*.12}}function Ia(n){const e=new zt(n);return e.colorSpace=Ue,e.minFilter=xe,e.magFilter=xe,e.generateMipmaps=!1,e}const Ga=new Fe("#9dc0ff"),ve=256,we=192;let _e=null;const wt=()=>{_e??(_e=Bt())};typeof window<"u"&&(window.requestIdleCallback?window.requestIdleCallback(wt,{timeout:2e3}):window.setTimeout(wt,300));function La(){const n=_e??Bt();return _e=null,n}function Bt(){const n=document.createElement("canvas");n.width=ve,n.height=we;const e=n.getContext("2d");e.fillStyle="#000000",e.fillRect(0,0,ve,we),e.fillStyle="#ffffff",e.font=`700 ${Wa.ident}px ${Oa}`,e.letterSpacing="6px",e.textBaseline="middle";const o="CURLLMOOHA",t=e.measureText(o).width;return e.fillText(o,(ve-t)/2,we*.5),e.fillStyle="rgba(255, 255, 255, 0.5)",e.fillRect((ve-t)/2,we*.5-26,t,1),e.fillRect((ve-t)/2,we*.5+25,t,1),e.letterSpacing="0px",e.textBaseline="alphabetic",Ia(n)}const Le=`
    uniform vec2 uUvMin;
    uniform vec2 uUvScale;
    varying vec2 vUv;
    void main() {
        vUv = (uv - uUvMin) / uUvScale;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,Ze=`
    float hash11(float p) {
        return fract(sin(p * 127.1) * 43758.5453);
    }

    float hash21(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // 0 almost always; a short decaying spike when this set's number comes up.
    //
    // Rate and odds are per set rather than baked in here, and that is the
    // whole point of the rewrite: with one schedule for all ten, the pile
    // twitched in chorus every couple of seconds and read as a screen effect
    // applied to a model. Every set now runs its own clock at its own rate
    // with its own chance of anything happening, so most of them are simply
    // *working*, one of them faults, and you cannot predict which.
    float crtFault(float time, float seed, float rate, float odds) {
        float clock = time * rate + seed * 23.0;
        float slot = floor(clock);
        float local = fract(clock);
        float roll = hash11(slot + seed * 31.0);
        float span = 0.03 + roll * 0.05;
        if (roll > odds || local > span) return 0.0;
        return 1.0 - local / span;
    }

    // The band crawling up the picture, at this set's own pace.
    float crtRoll(vec2 uv, float time, float seed, float speed) {
        float band = fract(uv.y - time * speed + seed);
        return smoothstep(0.0, 0.05, band) * (1.0 - smoothstep(0.05, 0.17, band));
    }
`,Na=`
    uniform sampler2D uCard;
    uniform vec3 uAccent;
    uniform vec3 uTint;
    uniform float uStyle;
    // 1 when uCard is a photograph rather than the ident: it is cropped to
    // the tube's shape and keeps its own colour, with the phosphor only
    // warming it rather than replacing it.
    uniform float uPhoto;
    uniform vec2 uCrop;
    // The switch-on. 0 is a dark tube, 1 is the whole picture; in between,
    // the picture is a bright line across the middle opening vertically.
    uniform float uOn;
    uniform float uTime;
    uniform float uSignal;
    uniform float uTune;
    uniform float uSeed;
    uniform float uNight;
    uniform float uStorm;
    uniform float uFlash;
    uniform float uFaultRate;
    uniform float uFaultOdds;
    uniform float uGrain;
    uniform float uRollSpeed;
    uniform float uRollAmount;
    varying vec2 vUv;

    ${Ze}

    void main() {
        vec2 uv = vUv;

        // The roll. A real set drifts; a locked one drifts less.
        float drift = (1.0 - uSignal) * 0.06 + uTune * 0.5;
        uv.y = fract(uv.y + sin(uTime * 0.32 + uSeed * 6.0) * 0.004 + drift * uTune);

        // The fault, and the tear it drags across the picture: the frame is
        // cut into slices and a few of them are thrown sideways, which is what
        // a lost horizontal lock actually looks like.
        // Weather is on the aerial, not on the glass.
        //
        // These are analogue sets in a field with rabbit-ear antennas, and rain
        // is what analogue reception loses to — so as the storm comes in the
        // picture does not dim or streak, it *breaks up*: the faults come four
        // times as often, and the signal gives way to snow. By the height of
        // the rain there is no picture on the pile at all, which is a truer
        // thing for the meadow to say about its own weather than any amount of
        // water drawn on the front of a tube.
        float fault = max(
            crtFault(uTime, uSeed, uFaultRate * (1.0 + uStorm * 5.0), uFaultOdds + uStorm * 0.55),
            uTune * 0.7
        );
        fault = max(fault, uStorm * 0.45);
        float slice = floor(uv.y * 26.0);
        float tear = (hash11(slice + floor(uTime * 22.0)) - 0.5) * fault * 0.34;
        tear *= step(0.45, hash11(slice * 1.7 + floor(uTime * 22.0)));
        uv.x = fract(uv.x + tear);

        // The mark, treated differently on every set.
        //
        // One card, six treatments. Ten televisions showing the identical
        // still is a wallpaper; ten showing the same word doing six different
        // things is a pile of televisions, and the word is what they have in
        // common rather than what makes them the same.
        vec2 identUv = uv;
        float reveal = 1.0;
        float echo = 0.0;

        if (uStyle < 0.5) {
            // Locked. The mark sits dead still and only its colour comes
            // apart, which is what a good set with a tired cable looks like.
            echo = 0.35;
        } else if (uStyle < 1.5) {
            // The caption crawl every shop-window set has ever run.
            identUv.x = fract(identUv.x + uTime * 0.045);
        } else if (uStyle < 2.5) {
            // Vertical hold, gently given up on.
            identUv.y = fract(identUv.y + uTime * 0.028);
        } else if (uStyle < 3.5) {
            // Lit only where a bright band sweeps down it.
            float band = fract(uv.y + uTime * 0.16);
            reveal = 0.24 + 1.6
                * smoothstep(0.0, 0.1, band)
                * (1.0 - smoothstep(0.1, 0.32, band));
        } else if (uStyle < 4.5) {
            // Breathing, as though the tube were still settling.
            identUv = (identUv - 0.5) * (1.0 - 0.05 * sin(uTime * 0.55)) + 0.5;
            echo = 0.5;
        } else {
            // The weave of a tired timebase.
            identUv.x += sin(identUv.y * 9.0 + uTime * 0.9) * 0.012;
        }

        // A broadcast sits still on its tube. The footage is the motion; the
        // set adds only what a set adds — a hair of horizontal jitter per
        // scanline, changing every frame, which is the analogue wobble no
        // flat panel has, and the raster creeping under it (see lines, below).
        identUv.x += (hash11(floor(uv.y * 160.0) + floor(uTime * 24.0)) - 0.5) * 0.0022 * uPhoto;

        // Colour coming apart. Mostly while the set is failing — a permanent        // Colour coming apart. Mostly while the set is failing — a permanent
        // chromatic split is a photo filter, not a fault — with a hair of it
        // held on the styles that are otherwise perfectly still.
        float split = fault * 0.014 + echo * 0.0045;
        // A 16:9 still on a 4:3 tube: the middle of it, not a squashed
        // whole. The ident is drawn at the tube's own shape and needs no crop.
        identUv.x = identUv.x * uCrop.x + uCrop.y;
        vec3 picture = vec3(
            texture2D(uCard, identUv + vec2(split, 0.0)).r,
            texture2D(uCard, identUv).g,
            texture2D(uCard, identUv - vec2(split, 0.0)).b
        ) * mix(uTint, mix(vec3(1.0), uTint, 0.22), uPhoto) * reveal;

        // The band crawling up the tube, and faster once the lock is going.
        picture *= 1.0
            + crtRoll(uv, uTime, uSeed, uRollSpeed) * (uRollAmount + uStorm * 0.5) * (1.0 - uPhoto);

        // The snow the signal is lost to.
        float snow = hash21(floor(uv * vec2(154.0, 112.0)) + floor(uTime * 30.0));
        picture = mix(picture, vec3(snow * 0.92), smoothstep(0.05, 0.85, uStorm));

        // Scanlines and the shadow mask under them.
        // A photograph keeps a hint of the tube and no more. The line depth,
        // the mask, the corner falloff, the grain and the standby dimming
        // below were all set for a white word on black, where they read as
        // character; on a picture they read as a bad signal, and the point
        // of the picture is to be seen.
        float lines = mix(0.86 + 0.14 * sin(uv.y * 210.0), 0.955 + 0.045 * sin(uv.y * 210.0 + uTime * 2.4), uPhoto);
        float mask = mix(0.94 + 0.06 * sin(uv.x * 320.0), 1.0, uPhoto);
        picture *= lines * mask;

        // Grain, and much more of it when the signal is weak.
        // Barely anything.
        //
        // A working television is not grainy — it has a texture you notice
        // when you put your face near the glass and not before. This ran at
        // ten times the depth and every card read as noise with a colour
        // behind it, which is a broken set, not a set. The fault and the storm
        // are the only two things allowed to bring the snow up.
        float grain = hash21(floor(uv * vec2(120.0, 90.0)) + floor(uTime * 24.0));
        picture = mix(
            picture,
            vec3(grain),
            (uGrain * (0.55 + (1.0 - uSignal) * 0.45) + uTune * 0.4 + fault * 0.5) * mix(1.0, 0.4, uPhoto)
        );

        // The tube: bright in the middle, dark in the corners, curved off at
        // the edge so the glass has a shape.
        vec2 centred = uv - 0.5;
        float vignette = 1.0 - smoothstep(0.32, 0.72, length(centred * vec2(1.0, 1.18)));
        picture *= mix(mix(0.35, 1.0, vignette), mix(0.74, 1.0, vignette), uPhoto);

        // Breath: the whole picture pulses very slightly, and flares as it
        // tunes in.
        float breath = 0.97 + 0.03 * sin(uTime * (1.7 + uSeed * 2.0));
        float gain = mix(mix(0.34, 1.0, uSignal), mix(0.66, 1.0, uSignal), uPhoto) * breath + uTune * 0.85;

        // After dark a television stops being a picture and becomes a lamp.
        //
        // Everything above is tuned for a tube seen in daylight and the
        // numbers are right for that, but they left ten switched-on sets
        // dimmer at midnight than one lantern on the path — which is the exact
        // thing this heap exists not to be. It was also arithmetically
        // incapable of glowing: the composer's bloom only takes pixels above
        // 0.8 (luminanceThreshold, FilmPostProcessing.jsx), and a white ident
        // at the old gain landed near 0.45 once the vignette and the scanlines
        // had taken their cut. No amount of bloom tuning downstream could find
        // light that was never emitted.
        //
        // The lift is strongest on the sets nobody is standing in front of.
        // That is the inverse of the daylight curve and it is deliberate twice
        // over: a lit window is at its most legible from across a field, and a
        // set already at full signal would blow out if it were lifted as hard.
        //
        // The set actually being watched barely takes it at all. At 0.75 on
        // top of full signal, the glow card in front and no tone mapping, the
        // picture you walked up to read was blown out to white.
        gain *= 1.0 + uNight * mix(1.75, 0.18, uSignal);
        picture *= gain;

        // The switch-on, the way a tube does it: the beam collapses to a
        // bright line across the middle of a dark glass, the line opens
        // upward and downward until it is the picture, and the edge of the
        // opening glows white while it travels. Off is a dark tube with a
        // spark in the centre, which is what an old set looks like a moment
        // after the switch.
        float on = mix(1.0, uOn, uPhoto);
        float halfOpen = on * 0.5;
        float dy = abs(uv.y - 0.5);
        float inside = 1.0 - smoothstep(halfOpen, halfOpen + 0.004, dy);
        float rim = exp(-pow((dy - halfOpen) / 0.014, 2.0)) * (1.0 - on);
        // In the first breath the line itself is still growing out from the
        // centre, so the set starts as a dot.
        float lineW = smoothstep(0.0, 0.18, on) * 0.5 + 0.012;
        float across = 1.0 - smoothstep(lineW, lineW + 0.02, abs(uv.x - 0.5));
        picture = picture * inside * across + vec3(1.0, 0.97, 0.88) * rim * across * 1.6;

        // Standby: an unwatched set still owns its own colour rather than
        // going black, which is what keeps the pile alive from a distance.
        // Kept light — at the first depth this washed the listing's dark
        // ground orange and the five rows stopped reading as rows.
        picture += uAccent * (0.04 + 0.09 * uSignal) * vignette;

        // Lightning reaches the set before it reaches the meadow: a strike
        // blows the picture out for a frame, the way it does to anything on a
        // long wire.
        picture += vec3(0.85, 0.88, 1.0) * uFlash * 0.7;

        // A soft shoulder instead of a hard clip, after dark. These are not
        // tone mapped, so anything over 1.0 used to flatten to pure white and
        // take the picture with it; above 0.78 the light now rolls off, keeping
        // the detail in a white page while still leaving enough over the
        // bloom threshold for the pile to glow from across the meadow.
        vec3 over = max(picture - 0.78, 0.0);
        vec3 shouldered = min(picture, vec3(0.78)) + over / (1.0 + over * 2.2);
        picture = mix(picture, shouldered, uNight);

        gl_FragColor = vec4(picture, 1.0);
        #include <colorspace_fragment>
    }
`,qa=`
    uniform float uTime;
    uniform float uSignal;
    uniform float uSeed;
    uniform float uNight;
    uniform float uStorm;
    uniform float uFlash;
    uniform float uFaultRate;
    uniform float uFaultOdds;
    uniform float uGrain;
    uniform float uRollSpeed;
    uniform float uRollAmount;
    varying vec2 vUv;

    ${Ze}

    vec3 barColour(vec2 uv) {
        float column = floor(clamp(uv.x, 0.0, 0.999) * 7.0);
        if (uv.y > 0.3) {
            if (column < 0.5) return vec3(0.76);
            if (column < 1.5) return vec3(0.76, 0.76, 0.06);
            if (column < 2.5) return vec3(0.06, 0.7, 0.76);
            if (column < 3.5) return vec3(0.08, 0.72, 0.16);
            if (column < 4.5) return vec3(0.76, 0.1, 0.7);
            if (column < 5.5) return vec3(0.74, 0.09, 0.09);
            return vec3(0.1, 0.12, 0.74);
        }
        // The strip under them, which on a real card is the blacker-than-black
        // and colour-burst reference and reads simply as "engineering".
        if (column < 0.5) return vec3(0.08, 0.1, 0.42);
        if (column < 1.5) return vec3(0.03);
        if (column < 2.5) return vec3(0.5, 0.06, 0.3);
        if (column < 3.5) return vec3(0.03);
        if (column < 4.5) return vec3(0.28, 0.42, 0.44);
        if (column < 5.5) return vec3(0.03);
        return vec3(0.36);
    }

    void main() {
        vec2 uv = vUv;
        float fault = max(
            crtFault(uTime, uSeed + 0.6, uFaultRate * (1.0 + uStorm * 5.0), uFaultOdds + uStorm * 0.5),
            uStorm * 0.4
        );

        // The wobble: a slow standing wave down the whole card, with the
        // sideways throw of a fault on top of it.
        uv.x += sin(uv.y * 22.0 + uTime * 1.6 + uSeed * 6.0) * 0.006;
        float slice = floor(uv.y * 28.0);
        uv.x = fract(uv.x + (hash11(slice + floor(uTime * 24.0)) - 0.5) * fault * 0.42);

        vec3 picture = barColour(uv);
        picture *= 1.0 + crtRoll(uv, uTime, uSeed, uRollSpeed) * uRollAmount;

        float grain = hash21(floor(uv * vec2(120.0, 90.0)) + floor(uTime * 24.0));
        picture = mix(picture, vec3(grain), uGrain + fault * 0.5 + smoothstep(0.05, 0.85, uStorm) * 0.85);
        picture *= 0.86 + 0.14 * sin(uv.y * 200.0);

        vec2 centred = uv - 0.5;
        float vignette = 1.0 - smoothstep(0.32, 0.72, length(centred * vec2(1.0, 1.18)));
        picture *= mix(0.4, 1.0, vignette) * mix(0.55, 1.0, uSignal);
        // The same night lift the ident sets take, and the reasoning is there.
        // The bars get the full share: seven saturated columns are the first
        // thing on the pile that reads from a distance, and the one image that
        // says "broadcast" without needing to be read.
        picture *= 1.0 + uNight * mix(1.6, 0.3, uSignal);
        picture += vec3(0.85, 0.88, 1.0) * uFlash * 0.7;

        gl_FragColor = vec4(picture, 1.0);
        #include <colorspace_fragment>
    }
`,Da=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,Ha=`
    uniform vec3 uColor;
    uniform float uGlow;
    varying vec2 vUv;

    void main() {
        vec2 centred = vUv - 0.5;
        // Squashed a little vertically, because a tube spills sideways more
        // than it spills up.
        float distance = length(centred * vec2(1.0, 1.24)) * 2.0;
        // Squared, on a quad wide enough to hold it.
        //
        // This was cubed, and for a real reason: the first pass still had
        // brightness left when it reached the edge of its geometry, which put
        // a visible boundary in mid-air and turned a wash of light into a pane
        // of orange glass wedged between two cabinets. But cubing solved that
        // by extinguishing the glow two thirds of the way in, and what was
        // left was invisible — at night, from the path, ten lit screens threw
        // no halo at all. The edge was the wrong thing to fix. A glow has to
        // arrive at nothing before its geometry runs out, so the geometry is
        // now large enough that it can do that gently (see the scale these are
        // built at), and the curve is free to stay soft.
        float falloff = 1.0 - smoothstep(0.0, 1.0, distance);
        falloff *= falloff;
        // Hollow in the middle, which is the whole difference between light
        // and fog.
        //
        // Centred on the glass and brightest at its centre, this card was
        // adding a wash on top of the one part of the scene that is already
        // the brightest thing in it — so the ident sat behind a milky oval and
        // every tube looked like it had condensation on the inside. What a lit
        // screen actually does to a dark room happens *outside* the glass: the
        // bezel, the cabinet next to it, the air. Fading the card in from
        // nothing at the centre to full by roughly the edge of the screen puts
        // the energy where the picture is not, and the tube reads as bright
        // rather than smeared.
        //
        // Dimmed at the centre rather than emptied. Taken all the way to zero
        // this stopped being a hollow and became a shape: six bright smoke
        // rings hanging in the clearing, each one obviously the edge of a
        // quad. The wash still has to cross the middle — it is light, it has
        // nowhere else to be — it just must not compete with the picture it is
        // supposed to be coming from.
        falloff *= mix(0.3, 1.0, smoothstep(0.0, 0.52, distance));
        float energy = falloff * uGlow;
        if (energy < 0.002) discard;
        gl_FragColor = vec4(uColor * energy, energy);
        #include <colorspace_fragment>
    }
`,ye=32,Ot=3,Ya=3,Ne=Ot+Ya,Xa=`
    uniform vec3 uFrom;
    uniform vec3 uTo;
    uniform vec3 uCameraLocal;
    uniform float uTime;
    uniform float uSeed;
    uniform float uJag;
    uniform float uThickness;
    uniform float uLife;
    attribute float aAlong;
    attribute float aSide;
    attribute float aStrand;
    varying float vSide;
    varying float vGap;
    varying float vBright;

    float arcHash(float n) {
        return fract(sin(n * 127.1) * 43758.5453123);
    }

    // A kink every whole number of x, joined by straight runs. Linear on
    // purpose: smoothing this is what turns a discharge back into a rope.
    float arcKink(float x) {
        float cell = floor(x);
        return mix(arcHash(cell) * 2.0 - 1.0, arcHash(cell + 1.0) * 2.0 - 1.0, x - cell);
    }

    // Where the channel sits across the gap at t, in metres. Pinned to nothing
    // at both ends, so it stays welded to the rod tips.
    float channel(float t, float phase) {
        float taper = sin(t * 3.14159265);
        float wander =
            arcKink(t * 7.0 + uTime * 2.5 + phase * 13.0) * 0.62 +
            arcKink(t * 17.0 - uTime * 4.0 + phase * 29.0) * 0.26 +
            sin(t * 9.0 + phase * 31.0 + uTime * 7.0) * 0.3 +
            sin(t * 21.0 + phase * 17.0 - uTime * 11.0) * 0.14;
        return wander * taper * uJag;
    }

    void main() {
        vec3 axis = uTo - uFrom;
        vec3 direction = normalize(axis);

        float branch = step(${Ot-.5}, aStrand);
        float satellite = step(0.5, aStrand) * (1.0 - branch);
        float phase = uSeed + aStrand * 0.317;

        // A branch forks off the channel at attach, runs span of the gap and
        // veers off it. Drawn from the strike seed rather than from time, so a
        // fork holds still for the length of a strike instead of scribbling
        // every frame.
        float attach = 0.16 + arcHash(aStrand * 13.7 + uSeed * 91.0) * 0.62;
        float span = 0.09 + arcHash(aStrand * 5.3 + uSeed * 37.0) * 0.15;
        float veer = arcHash(aStrand * 9.1 + uSeed * 53.0) * 2.0 - 1.0;

        float t = mix(aAlong, attach + aAlong * span, branch);
        float offset = channel(t, phase);
        // The satellites braid around the core instead of tracing it.
        offset += sin(t * 33.0 + phase * 61.0 + uTime * 13.0) * uJag * 0.3 * satellite;
        // The fork leaves the channel, accelerating as it goes.
        offset += veer * aAlong * aAlong * uJag * 1.1 * branch;

        // Cores are fattest in the middle; a fork narrows to a point, squared
        // so it actually arrives at one rather than stopping at a stub.
        float taper = mix(0.3 + 0.7 * sin(t * 3.14159265), (1.0 - aAlong) * (1.0 - aAlong), branch);
        float weight = mix(mix(1.0, 0.5, satellite), 0.3, branch);
        // A weak discharge is thin and a hard one is fat: the gap gets visibly
        // fatter as it goes over, rather than only brighter.
        float width = uThickness * taper * weight * (0.4 + 0.6 * uLife);

        vec3 base = uFrom + axis * t;

        // The one axis anything is visible in.
        //
        // side is perpendicular to the gap and to the view, which makes it the
        // ribbon's width on screen and the only direction a bend shows up in.
        // Both the wander and the thickness live here; putting the wander on
        // the other perpendicular pushes it towards the camera, where it
        // projects to nothing and draws a straight line.
        vec3 toCamera = normalize(uCameraLocal - base);
        vec3 raw = cross(direction, toCamera);
        float grazing = length(raw);
        // Standing so the aerial points at you collapses that axis and folds
        // the whole ribbon into a point. Any stable perpendicular will do
        // there — from head on, which way the jag goes is unknowable anyway.
        vec3 fallback = abs(direction.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 side = grazing > 0.04 ? raw / grazing : normalize(cross(direction, fallback));

        vec3 local = base + side * (offset + aSide * width);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(local, 1.0);
        vSide = aSide;
        vGap = t;
        vBright = mix(mix(1.0, 0.62, satellite), (1.0 - aAlong) * 0.7, branch);
    }
`,Za=`
    uniform float uLife;
    uniform float uTime;
    uniform float uSeed;
    varying float vSide;
    varying float vGap;
    varying float vBright;

    float arcHash(float n) {
        return fract(sin(n * 127.1) * 43758.5453123);
    }

    void main() {
        float across = abs(vSide);
        // A white filament inside a blue one, which is the whole colour story
        // of a small air discharge.
        float core = 1.0 - smoothstep(0.0, 0.36, across);
        float halo = 1.0 - smoothstep(0.0, 1.0, across);
        halo *= halo;

        // Charge, actually going somewhere.
        //
        // The difference between a lamp and a current is that a current has a
        // direction: two packets run the gap at different speeds and in
        // opposite directions, so something is always crossing it for as long
        // as it is lit. Under them the channel sizzles per cell and per frame,
        // because a conducting gap is not a smooth object and smoothing it is
        // what made this read as a drawn stroke.
        float packet =
            pow(max(0.0, sin((vGap * 3.0 - uTime * 6.0) * 3.14159265)), 12.0) +
            pow(max(0.0, sin((vGap * 5.0 + uTime * 9.0) * 3.14159265)), 16.0) * 0.7;
        float sizzle = 0.72 + 0.28 * arcHash(floor(vGap * 44.0) + floor(uTime * 70.0) + uSeed);

        // Bright along its whole length rather than fattest in the middle: the
        // ends are where it meets the metal and they are not the dim part.
        float body = 0.55 + 0.45 * sin(vGap * 3.14159265);
        float energy = uLife * vBright * sizzle * (body + packet * 1.6);

        // Well past one, on purpose.
        //
        // This is added light, and added light against a sunlit meadow is a
        // fight it loses at any sane value — an early version was invisible
        // before dusk. Driving the heart past three is what makes it survive a
        // lit sky, and it is also physically the right shape: the channel of an
        // arc genuinely is far brighter than anything around it, which is why
        // it hurts to look at.
        //
        // Blue rather than violet. Violet is the colour of a spark
        // photographed close up, and at the size this actually occupies it
        // muddied into the night sky and vanished into anything warm behind
        // it. Electric blue holds against both, and is what anybody means when
        // they picture current.
        vec3 colour = mix(vec3(0.28, 0.95, 2.8), vec3(1.7, 2.6, 3.3), core);
        // Hotter at the two roots. An arc is anchored in white-hot metal and
        // only the middle of the channel is blue.
        float root = pow(abs(vGap * 2.0 - 1.0), 3.0);
        colour = mix(colour, vec3(2.6, 3.0, 3.4), root * 0.7);
        // A packet passing takes the channel to blue-white where it is.
        colour = mix(colour, vec3(2.2, 3.0, 3.5), min(1.0, packet * core));

        float alpha = (core * 1.5 + halo * 0.85) * energy;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(colour * alpha, alpha);
        #include <colorspace_fragment>
    }
`;function Ja(){const n=new Ye,e=ye+1,o=e*Ne,t=new Float32Array(o*2*3),m=new Float32Array(o*2),s=new Float32Array(o*2),d=new Float32Array(o*2),l=new Uint16Array(ye*Ne*6);for(let u=0;u<Ne;u+=1)for(let i=0;i<e;i+=1){const p=i/ye,y=(u*e+i)*2;if(m[y]=p,m[y+1]=p,s[y]=-1,s[y+1]=1,d[y]=u,d[y+1]=u,i<ye){const x=(u*ye+i)*6;l[x]=y,l[x+1]=y+1,l[x+2]=y+2,l[x+3]=y+1,l[x+4]=y+3,l[x+5]=y+2}}return n.setAttribute("position",new pe(t,3)),n.setAttribute("aAlong",new pe(m,1)),n.setAttribute("aSide",new pe(s,1)),n.setAttribute("aStrand",new pe(d,1)),n.setIndex(new pe(l,1)),n.boundingSphere=new Lt(new w,100),n}const Ka=new St(1,1),Qa=new w(0,0,1),en=`
    uniform float uTime;
    uniform float uSignal;
    uniform float uSeed;
    uniform float uNight;
    uniform float uStorm;
    uniform float uFlash;
    uniform float uFaultRate;
    uniform float uFaultOdds;
    uniform float uGrain;
    uniform float uRollSpeed;
    uniform float uRollAmount;
    varying vec2 vUv;

    ${Ze}

    void main() {
        vec2 uv = vUv;
        // These sets have no signal at all, so the fault has nothing to
        // interrupt — it throws the snow sideways instead, which is the other
        // half of what an untuned television does.
        float fault = max(
            crtFault(uTime, uSeed + 0.37, uFaultRate * 2.4 * (1.0 + uStorm * 4.0), uFaultOdds + 0.2),
            uStorm * 0.5
        );
        float slice = floor(uv.y * 30.0);
        uv.x = fract(uv.x + (hash11(slice + floor(uTime * 26.0)) - 0.5) * fault * 0.5);

        float grain = hash21(floor(uv * vec2(96.0, 72.0)) + floor(uTime * 18.0 + uSeed * 40.0));
        // A slow band rolling through, which is what makes it read as a set
        // that is on rather than a noise texture.
        float band = smoothstep(0.42, 0.5, fract(uv.y * 0.6 - uTime * 0.11 + uSeed));
        vec3 picture = vec3(0.32 + grain * 0.5) * (0.5 + band * 0.5);
        picture *= 1.0 + crtRoll(uv, uTime, uSeed, uRollSpeed) * (uRollAmount + 0.14);
        picture *= 1.0 + fault * 0.5;
        picture *= 0.86 + 0.14 * sin(uv.y * 190.0);
        vec2 centred = uv - 0.5;
        float vignette = 1.0 - smoothstep(0.3, 0.7, length(centred * vec2(1.0, 1.18)));
        picture *= mix(0.3, 1.0, vignette);
        picture *= 1.0 + uStorm * 0.5;
        // A smaller share of the night lift than the sets with something to
        // say. These are the quiet ones on the heap and they stay quiet — lit
        // enough to read as switched on after dark, not enough to compete with
        // the idents for an eye crossing the meadow.
        picture *= 1.0 + uNight * 0.85;
        picture += vec3(0.85, 0.88, 1.0) * uFlash * 0.7;
        gl_FragColor = vec4(picture * mix(0.4, 0.72, uSignal), 1.0);
        #include <colorspace_fragment>
    }
`;function tn(n){n.updateWorldMatrix(!0,!1);const e=n.geometry;e.boundingBox||e.computeBoundingBox();const o=e.boundingBox.getCenter(new w);n.localToWorld(o);const t=e.getAttribute("normal"),m=new w,s=new w;for(let a=0;a<t.count;a+=1)s.fromBufferAttribute(t,a),m.add(s);const d=new Ht().getNormalMatrix(n.matrixWorld);m.applyMatrix3(d).normalize();const l=e.getAttribute("uv"),u=new ie(1/0,1/0),i=new ie(-1/0,-1/0);if(l)for(let a=0;a<l.count;a+=1)u.x=Math.min(u.x,l.getX(a)),u.y=Math.min(u.y,l.getY(a)),i.x=Math.max(i.x,l.getX(a)),i.y=Math.max(i.y,l.getY(a));else u.set(0,0),i.set(1,1);const p=new ie(Math.max(1e-4,i.x-u.x),Math.max(1e-4,i.y-u.y)),y=e.boundingBox.getSize(new w),x=n.getWorldScale(new w),T=y.multiply(x),g=[T.x,T.y,T.z].sort((a,r)=>r-a);return{mesh:n,centre:o,normal:m,width:g[0],height:g[1],area:g[0]*g[1],uvMin:u,uvScale:p}}const yt=n=>n.map(tn);function an(n){const e=n.clone(!0),o=[],t=new Map,m=[],s=[];e.traverse(g=>{if(!g.isMesh)return;if(g.castShadow=!0,g.receiveShadow=!0,pt.test(g.name)){o.push(g);return}if(gt.test(g.name)){const r=Ba(g.material),h=g.geometry.boundingBox??(g.geometry.computeBoundingBox(),g.geometry.boundingBox);r.userData.chargeUniforms.uTipY.value=h.max.y,r.userData.chargeUniforms.uTipSpan.value=Math.max(.001,(h.max.y-h.min.y)*.16),m.push(r),s.push(g),g.material=r;return}const a=g.material;if(!t.has(a)){const r=a.clone();r.metalness=0,r.roughness=.86,r.envMapIntensity=.4,r.emissive.set("#20160f"),r.emissiveIntensity=.02;const h=r.map?ua(r.map,Pa):null;h?r.map=h:r.map&&(r.map.anisotropy=8,r.map.generateMipmaps=!0,r.map.minFilter=xt,r.map.needsUpdate=!0),r.normalMap=null,r.roughnessMap=null,r.metalnessMap=null,t.set(a,r)}g.material=t.get(a)}),e.updateMatrixWorld(!0);const d=new je().setFromObject(e).getSize(new w);e.scale.multiplyScalar(d.y>0?be/d.y:1),e.updateMatrixWorld(!0);const l=new je().setFromObject(e),u=l.getCenter(new w);e.position.set(-u.x,-l.min.y,-u.z),e.updateMatrixWorld(!0);const i=new w;yt(o).forEach(g=>{i.addScaledVector(g.normal,g.area)}),i.lengthSq()>1e-6&&(e.rotation.y=-Math.atan2(i.x,i.z),e.updateMatrixWorld(!0));const p=yt(o),y=new je().setFromObject(e).getSize(new w),x=s.length?_a(s[0]):null,T=x?[...x,x[0].clone().lerp(x[1],.5)]:[];return{model:e,perchSearch:{skip:g=>pt.test(g.name)||gt.test(g.name),avoid:T},screens:p,materials:[...t.values(),...m],antennaMaterials:m,antennaTips:x,footprint:y}}function fn({terrainScale:n,terrainAmplitude:e}){const{scene:o}=Ft(Pt),t=v.useMemo(()=>an(o),[o]),m=v.useMemo(()=>{const{x:c,z:M}=De;return{x:c,z:M,y:Xe(c,M,n,e)}},[e,n]),s=v.useMemo(()=>t.screens.map(c=>{const M=c.mesh.name,j=Yt[Va[M]]??null;return{screen:c,listing:M===_t,bars:!j,project:j,identIndex:j?ze.indexOf(j):-1}}),[t]),d=v.useMemo(()=>La(),[]),l=v.useMemo(()=>ze.map(c=>Xt[c.section]),[]),u=Vt(pa,l),i=$t(c=>c.gl);v.useEffect(()=>{const c=i.capabilities.getMaxAnisotropy();return u.forEach(M=>{M.colorSpace=Ue,M.minFilter=xt,M.magFilter=xe,M.generateMipmaps=!0,M.anisotropy=c,M.needsUpdate=!0}),ga(i,u)},[i,u]);const p=v.useMemo(()=>s.map(({screen:c,project:M,listing:j,bars:D,identIndex:z},W)=>{const G=W*37%19/19,P=$a(W),Z={uUvMin:{value:c.uvMin.clone()},uUvScale:{value:c.uvScale.clone()},uTime:{value:0},uSignal:{value:0},uSeed:{value:G},uStorm:{value:0},uNight:{value:0},uFlash:{value:0},uFaultRate:{value:P.faultRate},uFaultOdds:{value:P.faultOdds},uGrain:{value:P.grain},uRollSpeed:{value:P.rollSpeed},uRollAmount:{value:P.rollAmount}};if(D)return new me({uniforms:Z,vertexShader:Le,fragmentShader:qa,toneMapped:!1});if(!M)return new me({uniforms:Z,vertexShader:Le,fragmentShader:en,toneMapped:!1});const ce=j?ne[3]:ne[z%ne.length],O=u[ze.indexOf(M)]??null,Me=j?0:O?vt[z%vt.length]:1+z%(Ea-1);return new me({uniforms:{...Z,uCard:{value:O??d},uPhoto:{value:O?1:0},uOn:{value:1},uCrop:{value:O?new ie(.75,.125):new ie(1,0)},uAccent:{value:new Fe(...ce.tint)},uTint:{value:new w(...ce.tint)},uStyle:{value:Me},uTune:{value:0}},vertexShader:Le,fragmentShader:Na,toneMapped:!1})}),[s,d,u]);v.useEffect(()=>{s.forEach(({screen:c},M)=>{c.mesh.material=p[M]})},[s,p]);const y=v.useRef(new Float32Array(s.length).fill(-1/0)),x=v.useRef([]);v.useEffect(()=>{if(Zt)return;const c=[];return s.forEach(({project:M},j)=>{const D=M&&Jt[M.section];if(!D)return;const z=document.createElement("video");z.muted=!0,z.loop=!0,z.playsInline=!0,z.setAttribute("playsinline",""),z.setAttribute("muted",""),z.preload="none",z.src=D,z.setAttribute("aria-hidden","true"),z.tabIndex=-1,z.style.cssText="position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none;",document.body.appendChild(z);const W=new It(z);W.colorSpace=Ue,W.minFilter=xe,W.magFilter=xe,W.generateMipmaps=!1;const G=()=>{p[j].uniforms.uCard.value=W};z.addEventListener("playing",G),c.push({video:z,texture:W,onPlaying:G,index:j})}),x.current=c.map(M=>M.video),()=>{x.current=[],c.forEach(({video:M,texture:j,onPlaying:D,index:z})=>{var W;M.removeEventListener("playing",D),M.pause(),M.removeAttribute("src"),M.load(),M.remove(),j.dispose();const G=p[z];(W=G?.uniforms)!=null&&W.uCard&&(G.uniforms.uCard.value=u[ze.indexOf(s[z].project)]??d)})}},[s,d,p,u]);const T=v.useMemo(()=>s.map(({screen:c,project:M,listing:j,bars:D,identIndex:z})=>{if(!M&&!j&&!D)return null;const W=new qe().setFromUnitVectors(Qa,c.normal),G=c.centre.clone().addScaledVector(c.normal,.035),P=j?ne[3]:M?ne[z%ne.length]:{tint:[.81,.89,1]},Z=new Fe(...P.tint);return{position:G,quaternion:W,scale:[c.width*2.2,c.height*1.9,1],normal:c.normal.clone(),material:new me({uniforms:{uColor:{value:Z},uGlow:{value:0}},vertexShader:Da,fragmentShader:Ha,transparent:!0,depthWrite:!1,blending:Pe,toneMapped:!1})}}),[s]),g=v.useRef(),a=v.useMemo(()=>new w,[]),r=v.useRef({next:1.2,until:0,seed:0,flicker:0}),h=v.useMemo(()=>Ja(),[]),f=v.useMemo(()=>new me({uniforms:{uFrom:{value:new w},uTo:{value:new w},uCameraLocal:{value:new w},uTime:{value:0},uSeed:{value:0},uJag:{value:.06},uThickness:{value:.012},uLife:{value:0}},vertexShader:Xa,fragmentShader:Za,transparent:!0,depthWrite:!1,side:He,blending:Pe,toneMapped:!1}),[]);v.useEffect(()=>{const c=t.antennaTips;if(!c)return;f.uniforms.uFrom.value.copy(c[0]),f.uniforms.uTo.value.copy(c[1]);const M=c[0].distanceTo(c[1]);f.uniforms.uJag.value=M*.22,f.uniforms.uThickness.value=Math.max(.007,M*.055)},[f,t]),v.useEffect(()=>()=>{Kt(),T.forEach(c=>c?.material.dispose()),d.dispose(),h.dispose(),f.dispose(),p.forEach(c=>c.dispose()),t.materials.forEach(c=>c.dispose())},[h,f,T,d,p,t]);const S=v.useRef(),[C,I]=v.useState([]);v.useEffect(()=>{const c=t.model.clone(!0);return c.updateMatrixWorld(!0),Ut(Fa(c,t.perchSearch),M=>{I(M.filter(j=>j.y>be*.5))})},[t]);const F=v.useMemo(()=>C.map((c,M)=>({point:c,perch:Qt(`screens:${M}`,"screens")})),[C]);v.useEffect(()=>()=>ea("screens"),[F]);const V=v.useRef([]),_=v.useRef(),B=v.useRef(),R=v.useRef(0),U=v.useRef(!0),A=v.useRef(new Float32Array(s.length)),$=v.useRef({section:null,elapsed:0}),K=v.useMemo(()=>new w,[]),re=v.useMemo(()=>new Fe,[]),se=v.useMemo(()=>new w,[]),le=v.useMemo(()=>new w,[]),Q=Ge(c=>c.openingProject),ue=Ge(c=>c.finishProjectReveal);v.useEffect(()=>{const c=Q===ot.work?Q:null;$.current={section:c,elapsed:0},c&&mt===0&&ue(c)},[ue,Q]),bt((c,M)=>{var j,D,z;const W=jt.getState(),G=Math.min(M,.05),P=c.clock.elapsedTime,Z=ta(m.x,m.z,aa(W),Math.max(t.footprint.x,t.footprint.z)*.25),ce=1-L.smoothstep(Z,it,na);R.current=oe?ce:L.damp(R.current,ce,6.5,G);const O=L.smoothstep(R.current,.04,.9),Me=O>.008&&!document.hidden;for(const b of x.current)Me&&b.paused?b.play().catch(()=>{}):!Me&&!b.paused&&b.pause();const ee=S.current;ee&&(ee.visible=O>.008,ee.position.y=L.lerp(-1.4,0,O),ee.scale.setScalar(Math.max(.001,O)));const Je=!!ee&&O>.985&&Z<it;for(let b=0;b<F.length;b+=1){const{point:E,perch:N}=F[b];N.present=Je,Je&&(ee.localToWorld(N.position.copy(E)),N.yaw=X,N.turn=Math.PI,N.height=E.y)}const Oe=O>.62;U.current!==Oe&&(U.current=Oe,(D=(j=_.current)==null?void 0:j.setEnabled)==null||D.call(j,Oe));const Ke=W.ballPosition;let Te=-1,We=1/0;if(O>.6)for(let b=0;b<s.length;b+=1){const{screen:E,listing:N}=s[b];if(!N)continue;K.set(Ke.x-m.x,0,Ke.z-m.z),K.applyAxisAngle(Gt.DEFAULT_UP,-X);const q=K.sub(E.centre).setY(0),fe=q.length();fe>ja||fe>We||q.normalize().dot(E.normal)<Ua||(Te=b,We=fe)}rt.section=Te>=0?ot.work:null,rt.distance=Te>=0?We:1/0;const he=$.current;let Qe=0;if(he.section){he.elapsed+=G;const b=L.clamp(he.elapsed/mt,0,1);if(Qe=Math.sin(b*Math.PI),b>=1){const E=he.section;he.section=null,Ge.getState().openingProject===E&&ue(E)}}const de=L.clamp(st.rainAmount??0,0,1),et=L.clamp(st.lightningFlash??0,0,1),J=L.smoothstep(W.nightAmount??0,.12,.78),H=r.current;let ke=0;if(O>.5&&(P>H.until&&P>H.next&&(H.seed=Math.random(),H.until=P+.16+Math.random()*.3,H.next=H.until+(.7+Math.random()*2.4)*(1-de*.6)),P<H.until)){const b=(H.until-P)/.4;H.flicker=.6+.4*Math.abs(Math.sin(P*71)),ke=Math.min(1,b)*H.flicker}const Ee=g.current;Ee&&t.antennaTips&&(Ee.visible=ke>.01,f.uniforms.uLife.value=ke*(1+J*.25),f.uniforms.uTime.value=P,f.uniforms.uSeed.value=H.seed,a.copy(c.camera.position),Ee.worldToLocal(a),f.uniforms.uCameraLocal.value.copy(a));for(let b=0;b<t.antennaMaterials.length;b+=1){const E=t.antennaMaterials[b].userData.chargeUniforms;E.uTime.value=P,E.uCharge.value=O*(.5+J*.9+de*.6),E.uArc.value=ke}let Ve=0,$e=null;for(let b=0;b<s.length;b+=1){const{project:E,listing:N}=s[b],q=p[b],fe=b===Te?1:0,Wt=O*(E||N?.38:.22),tt=Math.min(1,Wt+fe*.62);if(A.current[b]=oe?tt:L.damp(A.current[b],tt,5.5,G),q.uniforms.uTime.value=P,q.uniforms.uOn){const Y=y.current;O>.12?(Y[b]===-1/0&&(Y[b]=-b*.11),Y[b]+=G):O<.02&&(Y[b]=-1/0);const Et=Math.max(0,Math.min(1,Y[b]/.62));q.uniforms.uOn.value=Y[b]<0?0:1-Math.pow(1-Et,3)}q.uniforms.uSignal.value=A.current[b],q.uniforms.uNight.value=J,q.uniforms.uStorm.value=de,q.uniforms.uFlash.value=et;const at=T[b],Ie=V.current[b];if(at&&Ie){Ie.getWorldDirection(se),le.copy(c.camera.position).sub(Ie.getWorldPosition(le.clone())).normalize();const Y=Math.max(0,se.dot(le));at.material.uniforms.uGlow.value=A.current[b]*O*(.14+J*1.55*(1-A.current[b]*.6))*(1-de*.45)*(.9+et*.6)*(Y*Y)}q.uniforms.uTune&&(q.uniforms.uTune.value=N?Qe:0),(E||N)&&A.current[b]>Ve&&(Ve=A.current[b],$e=((z=T[b])==null?void 0:z.material.uniforms.uColor.value)??null)}const Ae=B.current;if(Ae){const b=oe?0:1+J*.5,E=oe?1:.86+(Math.sin(P*11.7)*.06+Math.sin(P*4.3)*.045+Math.sin(P*23.1)*.015)*b,N=.62+Ve*.38;Ae.intensity=N*O*(.18+J*2.9)*E*(1-de*.35),Ae.distance=8+J*8,$e&&(re.copy($e).lerp(Ga,J*.75),Ae.color.copy(re))}});const Se=t.footprint;return k.jsxs(oa,{type:"fixed",colliders:!1,position:[m.x,m.y,m.z],rotation:[0,X,0],children:[k.jsx(ia,{ref:_,args:[Se.x*.42,be*.5,Se.z*.42],position:[0,be*.5,0]}),k.jsxs("group",{ref:S,visible:!1,dispose:null,children:[k.jsx(ra,{blobs:[{x:0,z:0,radius:Math.max(Se.x,Se.z)*.52,strength:.68}]}),k.jsx("primitive",{object:t.model,dispose:null}),k.jsx(va,{anchor:m,terrainScale:n,terrainAmplitude:e}),k.jsx(sa,{children:k.jsx(za,{model:t.model,footprint:t.footprint,anchor:m,terrainScale:n,terrainAmplitude:e,lightRef:B})}),t.antennaTips&&k.jsx("mesh",{ref:g,geometry:h,material:f,frustumCulled:!1,visible:!1,renderOrder:6,dispose:null}),T.map((c,M)=>c&&k.jsx("mesh",{ref:j=>{V.current[M]=j},geometry:Ka,material:c.material,position:c.position,quaternion:c.quaternion,scale:c.scale,renderOrder:5,dispose:null},M)),k.jsx(la,{ref:B,intensity:0,distance:6.5,decay:2,position:[0,be*.55,.95]})]})]})}Ft.preload(Pt);export{fn as default};
