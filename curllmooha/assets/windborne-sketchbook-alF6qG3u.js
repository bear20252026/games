import{f as Wa,g as Na,N as d,c as Va,T as l}from"./react-BbqnMepd.js";import{a1 as Ee,a2 as fe,a3 as ua,a4 as _a,a5 as de,a6 as Lt,J as Pe,b as Ae,a7 as La,a8 as y,w as qe,a9 as Ba,aa as Xa,ab as Za,ac as Ya,ad as ke,G as et,r as Bt,V as da,Y as Ce,j as pa,ae as Ja,af as Ka,ag as qa,ah as Xt,ai as Qa,aj as e0,ak as t0}from"./three-DlAHX5Z_.js";import{V as a0,O as bt,t as Z,B as Re,a as le,Z as o0,X as v,f as ce,b as n0,r as r0,l as Je,c as i0,j as s0,y as ha}from"./main-CHq3HDKI.js";import{I as l0,w as c0}from"./decoded-images-BOz4p8TQ.js";import"./rapier-BcgqzzOj.js";import"./gsap-D1AWpUut.js";import"./home-C-bt6R1Y.js";import"./modulepreload-polyfill-B5Qt9EMX.js";function u0(e,t,a,o=e){const s=a?Math.max(0,Math.cos(e)):0,r=a?.009*Math.min(1,Math.abs(o-e)/.12):0;return{depth:.008-Math.min(t,3)*.009+s*.012+r,bend:-Math.sin(e)*(.055+s*s*.32)}}function d0(e,t,a){return e===0?0:a*(Math.sin(Math.PI*e/(t-1))-Math.sin(Math.PI*(e-1)/(t-1)))}const E=.56,H=.72,p0=.0055,Zt=1.23,h0=1.65,Qe=1.22,Yt=-.24,fa="#f8f6ee",pe="#ffd47b",f0="#fff4cf",Jt="#63372c",m0="#39251e",g0=[pe,"#dcc69c"],wt=Math.ceil(Re.length/2),ma=ha.filter(Boolean),ga=ha.map(e=>e?ma.indexOf(e):-1),he=30,va=E/he,St=.4,Kt=1.15,v0=6,I={hidden:"hidden",turning:"turning",left:"left",right:"right",destination:"destination",underlay:"underlay"},y0={[I.hidden]:0,[I.underlay]:1,[I.destination]:2,[I.left]:3,[I.right]:3,[I.turning]:4},ue={height:.3,radius:.0042,y:-.012},x0=[{y:.112,side:1,length:.052,tilt:.62},{y:.086,side:-1,length:.06,tilt:.58},{y:.05,side:1,length:.072,tilt:.52},{y:.014,side:-1,length:.079,tilt:.48},{y:-.024,side:1,length:.079,tilt:.46},{y:-.062,side:-1,length:.07,tilt:.44},{y:-.098,side:1,length:.056,tilt:.42}],qt=4.15,Qt=8.5,M0=5.4,b0=.52,w0=.022,S0=.03,P0=.028,j0=11,E0=13,Pt=3.15,ea=.54,A0=.92,te=Z?40:72,Ke=Z?14:26,jt=Z?1:2,Et=[{position:[-.9,.18,.32],rotation:[.5,.1,.25],scale:.84},{position:[-.58,-.34,-.42],rotation:[1.2,.7,-.4],scale:.62},{position:[-.18,.45,.5],rotation:[.2,1.1,.7],scale:.68},{position:[.34,-.42,.45],rotation:[.7,-.5,.2],scale:.76},{position:[.7,.32,-.38],rotation:[1.1,.4,-.8],scale:.58},{position:[.96,-.04,.2],rotation:[.3,.9,.45],scale:.72}],ya=Array.from({length:7},(e,t)=>({z:-.015+t*.0044,x:(t*7%5-2)*.0012,y:(t*11%7-3)*8e-4,width:E-.02+(t%3-1)*.003,height:H-.02+((t+1)%3-1)*.003,color:["#e7dcc3","#f1e7d2","#ddd0b6"][t%3]}));function C0(e){const t=[],a=new Ae,o=(r,u,p,f,M)=>{r.translate(p,f,M);const w=r.attributes.position.count,x=new Float32Array(w).fill(u),P=new Float32Array(w*3);for(let T=0;T<w;T+=1)a.toArray(P,T*3);r.setAttribute("aDeckleLayer",new Ce(x,1)),r.setAttribute("color",new Ce(P,3)),t.push(r)};ya.forEach((r,u)=>{a.set(r.color),o(new fe(.0035,r.height,.0022),u,e*(E+r.x),r.y,r.z);for(const p of[-1,1])o(new fe(r.width,.0035,.0022),u,e*E*.5+r.x,p*(H*.5+r.y),r.z)});const s=ua(t);return t.forEach(r=>r.dispose()),s}function R0(){const e={uCreepHead:{value:.5},uEmberHeat:{value:0}},t=new Ee({vertexColors:!0,emissive:"#ff7a24",emissiveIntensity:1,roughness:1});return t.userData.deckleUniforms=e,t.onBeforeCompile=a=>{a.uniforms.uCreepHead=e.uCreepHead,a.uniforms.uEmberHeat=e.uEmberHeat,a.vertexShader=a.vertexShader.replace("#include <common>",`#include <common>
                attribute float aDeckleLayer;
                varying float vDeckleLayer;`).replace("#include <begin_vertex>",`#include <begin_vertex>
                vDeckleLayer = aDeckleLayer;`),a.fragmentShader=a.fragmentShader.replace("#include <common>",`#include <common>
                varying float vDeckleLayer;
                uniform float uCreepHead;
                uniform float uEmberHeat;`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
                float deckleAlong =
                    vDeckleLayer / ${(ya.length-1).toFixed(1)};
                float deckleCreep = exp(
                    -pow((deckleAlong - uCreepHead) / 0.26, 2.0)
                );
                totalEmissiveRadiance *=
                    uEmberHeat * (0.06 + deckleCreep * 0.62);`)},t.customProgramCacheKey=()=>"windborne-deckle-creep-v1",t}function F(e,t,a){const o=y.clamp((e-t)/Math.max(1e-4,a-t),0,1);return o*o*(3-2*o)}function k0(e){const t=y.clamp(e,0,1),a=y.smoothstep(t,0,.38)*.34,o=Math.pow(y.smoothstep(t,.26,1),1.55)*.66,s=Math.sin(t*Math.PI*1.5)*Math.pow(1-t,3.4)*.028;return a+o+s}function z0(){const e=new fe(E,H,p0,he,2);e.translate(E*.5,0,0);const t=e.attributes.position,a=new qe,o=[],s=[];for(let r=0;r<t.count;r+=1){a.fromBufferAttribute(t,r);const u=y.clamp(a.x/va,0,he),p=Math.min(he-1,Math.floor(u)),f=u>=he?1:u-p;o.push(p,p+1,0,0),s.push(1-f,f,0,0)}return e.setAttribute("skinIndex",new Ba(o,4)),e.setAttribute("skinWeight",new Xa(s,4)),e}function I0(e){const t=E+.06,a=H+.06,o=new fe(t,a,.018,10,12,1),s=o.attributes.position;for(let r=0;r<s.count;r+=1){const u=s.getX(r),p=s.getY(r),f=u/(t*.5),M=p/(a*.5),w=Math.pow(Math.abs(f*M),2.3),x=Math.pow(Math.max(0,e*f),4),P=Math.sin(f*4.8+e*.7)*Math.cos(M*4.1)*.0014;s.setZ(r,s.getZ(r)+w*.014+x*.006+P)}return o.computeVertexNormals(),o}function ta(e){const t={uPaperNight:{value:0},uPaperMotion:{value:0},uMagicEnergy:{value:0},uMagicHead:{value:0}},a=new Ee({map:e,color:"#ffffff",roughness:.96,metalness:0});return a.userData.paperUniforms=t,a.onBeforeCompile=o=>{o.uniforms.uPaperNight=t.uPaperNight,o.uniforms.uPaperMotion=t.uPaperMotion,o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
                varying vec2 vPaperUv;
                varying float vPaperAcross;`).replace("#include <uv_vertex>",`#include <uv_vertex>
                vPaperUv = uv;
                vPaperAcross = clamp(position.x / ${E.toFixed(3)}, 0.0, 1.0);`),o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
                varying vec2 vPaperUv;
                varying float vPaperAcross;
                uniform float uPaperNight;
                uniform float uPaperMotion;
                uniform float uMagicEnergy;
                uniform float uMagicHead;`).replace("#include <aomap_fragment>",`#include <aomap_fragment>

                float paperHorizontalEdge = 1.0 - smoothstep(
                    0.015,
                    0.15,
                    min(vPaperUv.y, 1.0 - vPaperUv.y)
                );
                float paperOuterEdge = smoothstep(0.76, 0.985, vPaperAcross);
                float paperEdge = max(paperHorizontalEdge, paperOuterEdge);
                float paperGrazing = pow(
                    1.0 - saturate(dot(normal, geometryViewDir)),
                    2.15
                );
                vec2 paperFibreCell = floor(vPaperUv * vec2(190.0, 245.0));
                float paperFibreNoise = fract(
                    sin(dot(paperFibreCell, vec2(12.9898, 78.233))) *
                    43758.5453
                );
                float paperFibres = 0.95 + paperFibreNoise * 0.05;

                float paperTransmission =
                    uPaperNight *
                    (0.032 + paperEdge * 0.06 + paperGrazing * 0.03) +
                    uPaperMotion *
                    (0.008 + paperEdge * 0.035 + paperGrazing * 0.02);
                vec3 paperWarmth = mix(
                    diffuseColor.rgb,
                    vec3(1.0, 0.68, 0.34),
                    0.18 + paperEdge * 0.24
                );
                totalEmissiveRadiance +=
                    paperWarmth * paperTransmission * paperFibres;

                // A narrow enchanted chase stays attached to the skinned
                // outer page edge, so the light bends with the paper instead
                // of floating through it as a separate effect mesh.
                float magicOuterEdge = smoothstep(
                    0.82,
                    0.995,
                    vPaperAcross
                );
                float magicChase = exp(
                    -pow((vPaperUv.y - uMagicHead) / 0.075, 2.0)
                );
                float magicFibre = 0.7 + paperFibreNoise * 0.3;
                vec3 magicEdgeColor = mix(
                    vec3(1.0, 0.54, 0.15),
                    vec3(0.26, 0.88, 1.0),
                    0.22 + magicChase * 0.72
                );
                totalEmissiveRadiance +=
                    magicEdgeColor *
                    uMagicEnergy *
                    magicOuterEdge *
                    (0.12 + magicChase * 1.75) *
                    magicFibre;`)},a.customProgramCacheKey=()=>"windborne-paper-lighting-v3",a}function T0(e,t,a){const o=[];for(let p=0;p<=he;p+=1){const f=new Qa;f.position.x=p===0?0:va,p>0&&o[p-1].add(f),o.push(f)}const s=new Ee({color:"#e0d4b8",emissive:"#ff8a34",emissiveIntensity:0,roughness:.98,metalness:0}),r=[s,s,s,s,ta(t),ta(a)],u=new e0(e,r);return u.castShadow=!0,u.receiveShadow=!0,u.frustumCulled=!1,u.add(o[0]),u.bind(new t0(o)),u}const At=.085,aa=.075,xa=.135;function U0(e,t,a,o){const s=a*At,r=o*aa,u=a-s*2,p=o*(1-aa-xa),f=Math.min(u/t.width,p/t.height),M=t.width*f,w=t.height*f,x=s+(u-M)*.5,P=r+(p-w)*.5;e.save(),e.shadowColor="rgba(74, 58, 32, 0.28)",e.shadowBlur=a*.028,e.shadowOffsetY=o*.008,e.fillStyle="#ffffff",e.fillRect(x,P,M,w),e.restore(),e.drawImage(t,x,P,M,w),e.strokeStyle="rgba(78, 62, 38, 0.22)",e.lineWidth=Math.max(1,a*.002),e.strokeRect(x,P,M,w)}const q='Nunito, "Avenir Next", system-ui, sans-serif';function D0(e,t,a,o){if(!t)return;const s=a*At,r=a-s*2,u=o*(1-xa)+o*.028,p=Math.round(o*.034);e.save(),e.textBaseline="top",e.font=`800 ${p}px ${q}`,e.fillStyle="rgba(146, 108, 62, 0.9)";const f=`${t.number}`;e.fillText(f,s,u);const M=e.measureText(`${f}  `).width;e.font=`700 ${p}px ${q}`,e.fillStyle="rgba(66, 52, 36, 0.92)";const w=t.title.toLowerCase().split(" "),x=[""];for(const P of w){const T=x[x.length-1]?`${x[x.length-1]} ${P}`:P;e.measureText(T).width>r-M&&x[x.length-1]?x.push(P):x[x.length-1]=T}x.slice(0,2).forEach((P,T)=>{e.fillText(P,s+M,u+T*p*1.22)}),e.restore()}function oa(e,t,a){const o=[""];for(const s of t.split(" ")){const r=o[o.length-1]?`${o[o.length-1]} ${s}`:s;e.measureText(r).width>a&&o[o.length-1]?o.push(s):o[o.length-1]=r}return o}function $0(e,t,a,o){if(!t)return;const s=a*At*1.4,r=a-s*2;let u=o*.2;e.save(),e.textBaseline="top";const p=Math.round(o*.16);e.font=`800 ${p}px ${q}`,e.fillStyle="rgba(146, 108, 62, 0.5)",e.fillText(t.number,s-p*.04,u),u+=p*1.08,e.fillStyle="rgba(146, 108, 62, 0.55)",e.fillRect(s,u,a*.12,Math.max(2,o*.004)),u+=o*.045;const f=Math.round(o*.052);e.font=`800 ${f}px ${q}`,e.fillStyle="rgba(66, 52, 36, 0.94)";for(const P of oa(e,t.title.toLowerCase(),r).slice(0,3))e.fillText(P,s,u),u+=f*1.18;u+=o*.03;const M=Math.round(o*.034);e.font=`600 ${M}px ${q}`,e.fillStyle="rgba(92, 74, 52, 0.82)";const w=oa(e,t.line,r),x=Math.floor((o*.9-u)/(M*1.42));w.slice(0,x).forEach((P,T)=>{const me=T===x-1&&w.length>x;e.fillText(me?`${P.replace(/\s+\S*$/,"")}…`:P,s,u),u+=M*1.42}),e.restore()}function na(e,t,a){const o=e.getContext("2d",{willReadFrequently:!0});o.fillStyle=fa,o.fillRect(0,0,e.width,e.height),t?(U0(o,t,e.width,e.height),D0(o,a,e.width,e.height)):$0(o,a,e.width,e.height)}function Ma(e,t){const a=document.createElement("canvas");a.width=448,a.height=576,na(a,e,t);const o=new ke(a);return o.userData.repaint=()=>na(a,e,t),o.colorSpace=et,o.wrapS=Xt,o.wrapT=Xt,o.needsUpdate=!0,o}const ra=new WeakMap,G0=()=>new Promise(e=>setTimeout(e,0));function O0(e){let t=ra.get(e);if(t||(t={status:"pending",faces:null,endpaper:null,promise:null},t.promise=(async()=>{const a=[];for(let o=0;o<Re.length;o+=1)a.push(Ma(e[ga[o]]??null,Re[o])),o%2===1&&await G0();t.endpaper=ba(),t.faces=a,t.status="ready"})().catch(()=>{t.status="failed"}),ra.set(e,t)),t.status==="pending")throw t.promise;return t.status==="ready"?t:null}function ba(){const e=document.createElement("canvas");e.width=448,e.height=576;const t=e.getContext("2d"),a=t.createLinearGradient(0,0,e.width,e.height);a.addColorStop(0,"#f9f2de"),a.addColorStop(.52,"#eee2c6"),a.addColorStop(1,"#dbcaa8"),t.fillStyle=a,t.fillRect(0,0,e.width,e.height);const o=new ke(e);return o.colorSpace=et,o.needsUpdate=!0,o}const wa=E-.07,Sa=H-.07,ia=1024;function sa(e){const t=e.getContext("2d"),a=e.width,o=e.height;t.fillStyle="#000",t.fillRect(0,0,a,o),t.fillStyle="#fff",t.strokeStyle="#fff",t.lineJoin="round",t.textAlign="center",t.textBaseline="alphabetic";const s=(r,u,p,f)=>{t.lineWidth=a*f,t.strokeText(r,u,p),t.fillText(r,u,p)};t.font=`800 ${Math.round(a*.158)}px ${q}`,"letterSpacing"in t&&(t.letterSpacing=`${-a*.002}px`),s("sketches",a/2,o*.178,.003),t.font=`800 ${Math.round(a*.062)}px ${q}`,"letterSpacing"in t&&(t.letterSpacing=`${a*.006}px`),s("curllmooha",a/2,o*.855,.0025),t.font=`700 ${Math.round(a*.032)}px ${q}`,"letterSpacing"in t&&(t.letterSpacing=`${a*.005}px`),s(`webgl studies · ${Re.length}`,a/2,o*.915,.003)}function F0(){const e=document.createElement("canvas");e.width=ia,e.height=Math.round(ia*(Sa/wa)),sa(e);const t=new ke(e);return t.userData.repaint=()=>sa(e),t.needsUpdate=!0,t}function H0(){const e=document.createElement("canvas");e.width=64,e.height=64;const t=e.getContext("2d"),a=t.createRadialGradient(32,32,0,32,32,31);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.2,"rgba(255,249,214,0.95)"),a.addColorStop(.55,"rgba(255,218,126,0.34)"),a.addColorStop(1,"rgba(255,205,96,0)"),t.fillStyle=a,t.fillRect(0,0,64,64);const o=new ke(e);return o.colorSpace=et,o.needsUpdate=!0,o}const je=512;function W0(){const e=document.createElement("canvas"),t=je;e.width=t,e.height=t;const a=e.getContext("2d"),o=a.createLinearGradient(0,0,t,t);o.addColorStop(0,"#efe6d2"),o.addColorStop(.5,"#dcd0b6"),o.addColorStop(1,"#c4b493"),a.fillStyle=o,a.fillRect(0,0,t,t);for(let r=0;r<26;r+=1){const u=r*137%t,p=r*211%t,f=t*(.09+r%4*.035),M=a.createRadialGradient(u,p,0,u,p,f),w=r%2===0;M.addColorStop(0,w?"rgba(96,72,44,0.09)":"rgba(255,248,226,0.10)"),M.addColorStop(1,"rgba(0,0,0,0)"),a.fillStyle=M,a.beginPath(),a.arc(u,p,f,0,Math.PI*2),a.fill()}a.lineWidth=1.1;for(let r=0;r<1400;r+=1){const u=r*47%je,p=r*73%je,f=6+r*11%22,M=(r%5-2)*.16;a.strokeStyle=r%3===0?"rgba(255,250,229,0.16)":"rgba(88,73,48,0.09)",a.beginPath(),a.moveTo(u,p),a.lineTo(u+f,p+M*f),a.stroke()}for(let r=0;r<900;r+=1){const u=r*31%je,p=r*59%je,f=.6+r%3*.7;a.fillStyle="rgba(77,63,42,0.08)",a.beginPath(),a.arc(u,p,f,0,Math.PI*2),a.fill()}const s=new ke(e);return s.colorSpace=et,s.wrapS=Bt,s.wrapT=Bt,s.repeat.set(1.4,1.8),s.needsUpdate=!0,s}function N0(){const e=new Float32Array(te*3),t=new Float32Array(te);for(let o=0;o<te;o+=1){const s=o*13%te/te;e[o*3]=y.lerp(-1.16,1.08,s),e[o*3+1]=-.4+Math.sin(s*Math.PI)*.72+Math.sin(o*2.7)*.09,e[o*3+2]=Math.sin(s*Math.PI*2+o*.31)*.42,t[o]=o*37%te/te}const a=new da;return a.setAttribute("position",new Ce(e,3)),a.setAttribute("aSeed",new Ce(t,1)),a}function V0(){const e={uTime:{value:0},uOpacity:{value:0},uGather:{value:0},uImpact:{value:0},uEnergy:{value:0},uColor:{value:new Ae(pe).multiplyScalar(.82)},uPointSize:{value:Z?.058:.05}},t=new pa({uniforms:e,vertexShader:`
            attribute float aSeed;
            uniform float uTime;
            uniform float uGather;
            uniform float uImpact;
            uniform float uEnergy;
            uniform float uPointSize;
            varying float vMoteAlpha;
            varying float vViewDepth;
            varying float vSeed;

            void main() {
                float phase = aSeed * 6.2831853;
                vec3 idle = position;
                float orbitAngle =
                    uTime * (0.16 + aSeed * 0.13) +
                    phase;
                mat2 orbit = mat2(
                    cos(orbitAngle),
                    -sin(orbitAngle),
                    sin(orbitAngle),
                    cos(orbitAngle)
                );
                idle.xz = mix(idle.xz, orbit * idle.xz, 0.48);
                idle.x +=
                    sin(uTime * (0.48 + aSeed * 0.18) + phase) *
                    (0.045 + uEnergy * 0.025);
                idle.y +=
                    cos(uTime * (0.56 + aSeed * 0.12) + phase) *
                    0.038 +
                    sin(uTime * 0.24 + phase) * 0.03;
                idle.z +=
                    sin(uTime * 0.39 + phase * 1.7) *
                    (0.04 + uEnergy * 0.02);

                vec3 gathered = vec3(
                    idle.x * 0.24,
                    idle.y * 0.76,
                    idle.z * 0.25
                );
                vec3 transformed = mix(idle, gathered, uGather);
                vec3 burstDirection = normalize(
                    vec3(position.x, position.y * 0.55, position.z) +
                    vec3(0.001)
                );
                transformed += burstDirection * uImpact * (0.08 + aSeed * 0.12);

                vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                vViewDepth = -mvPosition.z;
                gl_PointSize =
                    uPointSize *
                    (285.0 / max(1.0, -mvPosition.z)) *
                    (0.76 + aSeed * 0.72 + uImpact * 0.75 + uEnergy * 0.2);
                vMoteAlpha = 0.54 + aSeed * 0.46;
                vSeed = aSeed;
            }
        `,fragmentShader:`
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vMoteAlpha;
            varying float vViewDepth;
            varying float vSeed;

            void main() {
                vec2 point = gl_PointCoord - 0.5;
                float radius = length(point);
                float core = 1.0 - smoothstep(0.02, 0.23, radius);
                float halo = 1.0 - smoothstep(0.06, 0.5, radius);
                float distanceFade =
                    1.0 - smoothstep(15.0, 30.0, vViewDepth);
                float alpha = (core * 0.76 + halo * 0.34) *
                    uOpacity * vMoteAlpha * distanceFade;
                if (alpha < 0.004) discard;
                // Most motes are embers drifting toward paper white; only the
                // last sliver of the seed range carries the cool accent, so
                // the swarm stays one temperature instead of two.
                vec3 ember = vec3(2.0, 1.05, 0.34);
                vec3 paper = vec3(1.9, 1.72, 1.25);
                vec3 color = mix(ember, paper, smoothstep(0.25, 0.85, vSeed));
                color = mix(
                    color,
                    vec3(0.5, 1.5, 2.0),
                    smoothstep(0.88, 1.0, vSeed) * 0.7
                );
                color = mix(color, uColor * 1.7, core * 0.5);
                gl_FragColor = vec4(color, alpha);
                #include <colorspace_fragment>
            }
        `,transparent:!0,depthWrite:!1,blending:de,toneMapped:!1});return t.userData.windUniforms=e,t}function _0(){const e=new Float32Array(Ke*3);for(let a=0;a<Ke;a+=1){const o=a*7%Ke/Ke;e[a*3]=Math.sin(a*2.399963)*.12,e[a*3+1]=-.33+o*.7,e[a*3+2]=.1+Math.cos(a*1.73)*.045}const t=new da;return t.setAttribute("position",new Ce(e,3)),t}function L0(e,t){const a=e.attributes.position,o=e.attributes.uv,s=new qe,r=new qe;for(let u=0;u<a.count;u+=1){const p=o.getX(u);t.getPointAt(p,s),r.fromBufferAttribute(a,u).sub(s);const f=Math.pow(Math.max(0,Math.sin(p*Math.PI)),.55);r.multiplyScalar(.14+f*.86).add(s),a.setXYZ(u,r.x,r.y,r.z)}return a.needsUpdate=!0,e.computeVertexNormals(),e.computeBoundingSphere(),e}function la(e,t=1){const a=-.22+e*.13,o=e===0?.31:-.3,s=e*1.7,r=Array.from({length:36},(f,M)=>{const w=M/35,x=Math.sin(w*Math.PI);return new qe(y.lerp(-.74,.76,w),a+x*(.16+e*.025)+Math.sin(w*Math.PI*2+s)*.022*x,o+Math.sin(w*Math.PI+s)*.055)}),u=new Ja(r),p=new Ka(u,Z?24:36,(e===0?.008:.0068)*t,Z?4:6,!1);return L0(p,u)}function ca(e,t=0,a=!1){const o={uTime:{value:0},uOpacity:{value:0},uGather:{value:0},uImpact:{value:0},uEnergy:{value:0},uDraw:{value:1},uPhase:{value:t},uHdr:{value:a?2.85:1.45},uColor:{value:new Ae(e)}},s=new pa({uniforms:o,vertexShader:`
            uniform float uTime;
            uniform float uGather;
            uniform float uImpact;
            uniform float uEnergy;
            uniform float uPhase;
            varying vec2 vRibbonUv;
            varying float vViewDepth;

            void main() {
                vRibbonUv = uv;
                vec3 transformed = position;
                transformed.xz *= mix(1.0, 0.76, uGather);
                transformed.xz *= 1.0 + uImpact * 0.13;
                transformed += normal *
                    sin(uv.x * 17.0 + uTime * 1.55 + uPhase) *
                    (0.004 + uEnergy * 0.003) *
                    (1.0 - uGather * 0.45);
                vec4 mvPosition =
                    modelViewMatrix *
                    vec4(transformed, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                vViewDepth = -mvPosition.z;
            }
        `,fragmentShader:`
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uTime;
            uniform float uPhase;
            uniform float uEnergy;
            uniform float uDraw;
            uniform float uHdr;
            varying vec2 vRibbonUv;
            varying float vViewDepth;

            void main() {
                float head = smoothstep(0.0, 0.12, vRibbonUv.x);
                float tail = 1.0 - smoothstep(0.78, 1.0, vRibbonUv.x);
                // The tube is already tapered in geometry, so this only takes
                // the last of the edge off instead of doing all the shaping.
                float taper = pow(max(0.0, sin(vRibbonUv.x * 3.1415926)), 0.4);
                float drawMask =
                    1.0 - smoothstep(uDraw, uDraw + 0.08, vRibbonUv.x);
                float travel = fract(uTime * 0.19 + uPhase * 0.11);
                float travelDistance = abs(vRibbonUv.x - travel);
                float brightHead = exp(
                    -pow(travelDistance / 0.065, 2.0)
                );
                // Long, soft streaks. The old high-frequency packets beaded
                // each stream into a dotted line at any real viewing distance.
                float packets =
                    pow(
                        0.5 +
                            0.5 *
                                sin(
                                    vRibbonUv.x * 13.0 -
                                    uTime * 2.6 +
                                    uPhase
                                ),
                        2.2
                    );
                float flow =
                    0.6 +
                    brightHead * (0.72 + uEnergy * 0.36) +
                    packets * 0.3;
                float distanceFade =
                    1.0 - smoothstep(15.0, 30.0, vViewDepth);
                float alpha =
                    uOpacity *
                    head *
                    tail *
                    taper *
                    drawMask *
                    flow *
                    distanceFade;
                if (alpha < 0.003) discard;
                vec3 color =
                    uColor *
                    uHdr *
                    (0.82 + brightHead * 0.55 + packets * 0.18);
                gl_FragColor = vec4(color, alpha);
                #include <colorspace_fragment>
            }
        `,transparent:!0,depthWrite:!1,depthTest:!0,blending:a?qa:de,toneMapped:!1});return s.userData.windUniforms=o,s}const B0=Z?14:30;function X0(){return()=>({x:(Math.random()-.5)*E*Qe*1.9,y:H*Qe*.42+Math.random()*.1,z:(Math.random()-.5)*.14-.04,vx:(Math.random()-.5)*.1,vy:.16+Math.random()*.2,vz:(Math.random()-.5)*.08,life:1.15+Math.random()*.95})}function Z0(){return(e,t,a)=>{e.vy+=(.19-e.vy*.62)*t,e.vx+=(Math.sin(a*1.7+e.id*21.3)*.13-e.vx*.55)*t,e.vz+=(Math.cos(a*1.35+e.id*17.1)*.09-e.vz*.55)*t,e.x+=e.vx*t,e.y+=e.vy*t,e.z+=e.vz*t}}function Y0(){const e=new Za;return e.moveTo(-.03*.5,0),e.lineTo(.03*.5,0),e.lineTo(.03*.5,-.22),e.lineTo(0,-.22+.035),e.lineTo(-.03*.5,-.22),e.closePath(),new Ya(e)}function no({revealRef:e,readyRef:t}){const a=Wa(i=>i.gl),o=Na(l0,ma),s=O0(o),r=d.useRef(),u=d.useRef(),p=d.useRef(),f=d.useRef(),M=d.useRef(),w=d.useRef(),x=d.useRef(),P=d.useRef(),T=d.useRef(0),me=d.useRef(1),ge=d.useRef(),ve=d.useRef(),tt=d.useRef(),ze=d.useRef(),Ie=d.useRef(),Ct=d.useRef([]),Rt=d.useRef([]),at=d.useRef(),ot=d.useRef(),nt=d.useRef(),rt=d.useRef(),kt=d.useRef([]),it=d.useRef(e?0:1),zt=d.useRef({page:0,direction:1,cooldown:0,lastGust:0,turningUntil:0,activeSheetIndex:-1,turnDirection:1,arrivalPhase:"closed",openingStartedAt:0,settledAt:-100,openingProgress:0,openingPageStarted:!1,sheets:[]}),Te=d.useMemo(z0,[]),st=d.useMemo(Y0,[]),Ue=d.useMemo(R0,[]),lt=d.useMemo(()=>[-1,1].map(i=>C0(i)),[]),ct=d.useMemo(a0,[]),Pa=d.useMemo(X0,[]),ja=d.useMemo(Z0,[]),ut=d.useMemo(()=>bt([{t:0,c:[1,.88,.6,0]},{t:.12,c:[1,.78,.38,.62]},{t:.45,c:[1,.46,.13,.46]},{t:.78,c:[.82,.2,.04,.22]},{t:1,c:[.36,.05,0,0]}]),[]),dt=d.useMemo(()=>bt([{t:0,c:[.35,0,0,1]},{t:.22,c:[1,0,0,1]},{t:1,c:[.18,0,0,1]}]),[]),pt=d.useMemo(()=>bt([{t:0,c:[.2,0,0,1]},{t:.55,c:[.85,0,0,1]},{t:1,c:[1,0,0,1]}]),[]),It=d.useRef(0),W=d.useMemo(H0,[]),N=d.useMemo(W0,[]),Q=d.useMemo(()=>new Ee({color:"#d9ab5c",emissive:"#ffca6a",emissiveIntensity:.12,roughness:.58,metalness:.08,toneMapped:!1}),[]),Y=d.useMemo(F0,[]),De=d.useMemo(()=>new Ee({color:"#d9ab5c",emissive:"#ffca6a",emissiveIntensity:.08,alphaMap:Y,alphaTest:.46,roughness:.42,metalness:.62,toneMapped:!1,polygonOffset:!0,polygonOffsetFactor:-2}),[Y]);d.useEffect(()=>()=>{Y.dispose(),De.dispose()},[Y,De]);const ht=d.useMemo(()=>{const i=[];for(const m of[0,.014]){const j=E-.038-m*2,G=H-.03-m*2;for(const _ of[-1,1])i.push(new fe(j,.0022,.0015).translate(0,_*G/2,0)),i.push(new fe(.0022,G,.0015).translate(_*j/2,0,0))}const h=ua(i);return i.forEach(m=>m.dispose()),h},[]);d.useEffect(()=>()=>ht.dispose(),[ht]);const $e=d.useMemo(()=>[-1,1].map(i=>I0(i)),[]),ft=d.useMemo(N0,[]),mt=d.useMemo(_0,[]),Ge=d.useMemo(V0,[]),Oe=d.useMemo(()=>new _a({color:pe,map:W,size:Z?.02:.017,sizeAttenuation:!0,transparent:!0,opacity:0,depthWrite:!1,blending:de,toneMapped:!1}),[W]),gt=d.useMemo(()=>Array.from({length:jt},(i,h)=>({halo:la(h,1),core:la(h,.42)})),[]),Fe=d.useMemo(()=>g0,[]),ye=d.useMemo(()=>Fe.slice(0,jt).map((i,h)=>ca(i,h*1.71)),[Fe]),xe=d.useMemo(()=>Fe.slice(0,jt).map((i,h)=>ca(i,h*1.71,!0)),[Fe]),Me=d.useMemo(()=>new Lt({color:new Ae("#ffe6ac").multiplyScalar(.88),map:W,transparent:!0,opacity:0,depthWrite:!1,side:Pe,blending:de,toneMapped:!1}),[W]),He=d.useMemo(()=>new Lt({color:new Ae(pe).multiplyScalar(.9),map:W,transparent:!0,opacity:0,depthWrite:!1,side:Pe,blending:de,toneMapped:!1}),[W]),V=d.useMemo(()=>{const i=s?.faces??Re.map((m,j)=>Ma(o[ga[j]]??null,m)),h=s?.endpaper??ba();return Array.from({length:wt},(m,j)=>{const G=i[j*2],_=i[j*2+1]??h,z=T0(Te,G,_),J=new La;return J.add(z),{mesh:z,hinge:J,front:G,back:_,opened:!1,turnAngle:Math.PI/2,turnedAt:-St}})},[Te,o,s]);return d.useLayoutEffect(()=>{const i=Math.min(8,a.capabilities.getMaxAnisotropy()),h=[N,W,Y],m=new Set;return V.forEach(j=>{m.add(j.front),m.add(j.back)}),h.forEach(j=>{var G;j.anisotropy=i,j.needsUpdate=!0,(G=a.initTexture)==null||G.call(a,j)}),m.forEach(j=>{j.anisotropy=i,j.needsUpdate=!0}),a.initTexture?c0(a,[...m]):void 0},[N,Y,a,W,V]),d.useEffect(()=>{let i=!0;return Promise.all([document.fonts.load("800 40px Nunito","sketches 01"),document.fonts.load("700 40px Nunito","curllmooha")]).catch(()=>{}).then(()=>{if(!i)return;const h=new Set([Y]);V.forEach(m=>{h.add(m.front),h.add(m.back)}),h.forEach(m=>{m.userData.repaint&&(m.userData.repaint(),m.needsUpdate=!0)})}),()=>{i=!1}},[Y,V]),d.useEffect(()=>(zt.current.sheets=V,t&&(t.current=!1),()=>{t&&(t.current=!1),le.bookWindStrength=0}),[t,V]),d.useEffect(()=>()=>{V.forEach(i=>{i.mesh.material.forEach(h=>h.dispose()),i.mesh.skeleton.dispose(),i.front.dispose(),i.back.dispose()}),Te.dispose(),st.dispose(),W.dispose(),N.dispose(),Q.dispose(),$e.forEach(i=>i.dispose()),ft.dispose(),mt.dispose(),Ge.dispose(),Oe.dispose(),gt.forEach(({halo:i,core:h})=>{i.dispose(),h.dispose()}),ye.forEach(i=>i.dispose()),xe.forEach(i=>i.dispose()),Me.dispose(),He.dispose(),Ue.dispose(),lt.forEach(i=>i.dispose()),ct.dispose(),ut.dispose(),dt.dispose(),pt.dispose()},[st,N,Q,$e,lt,Ue,ut,ct,dt,pt,W,mt,Oe,Te,V,Me,He,ft,Ge,gt,xe,ye]),Va((i,h)=>{const m=o0.getState(),j=e?.current??1;it.current=v?j:y.damp(it.current,j,7,h);const G=m.sleeping?0:1;me.current=v?G:y.damp(me.current,G,m.sleeping?7:1.6,h);const _=y.clamp(me.current,0,1),z=y.clamp(it.current,0,1)*_;if(r.current){r.current.visible=z>.008;const c=y.lerp(.82,1,z);r.current.scale.set(c,z,c),r.current.position.y=y.lerp(-.24,0,z)-(1-_)*h0}const J=m.windParameters,C=i.clock.elapsedTime,b=v?0:C,n=zt.current;n.cooldown=Math.max(0,n.cooldown-h);const vt=Math.hypot(m.ballPosition.x-ce.x,m.ballPosition.z-ce.z);n.arrivalPhase==="closed"&&z>.82&&vt<qt&&(n.page=v?1:0,n.direction=1,n.turnDirection=1,n.activeSheetIndex=0,n.openingStartedAt=C,n.openingProgress=v?1:0,n.openingPageStarted=v,n.arrivalPhase=v?"open":"opening",v&&n.sheets[0]&&(n.sheets[0].opened=!0,n.sheets[0].turnedAt=C-St),n.turningUntil=v?C:C+Pt,n.cooldown=Pt+1.4),n.arrivalPhase==="opening"&&(n.openingProgress=y.clamp((C-n.openingStartedAt)/Pt,0,1),!n.openingPageStarted&&n.openingProgress>=ea&&(n.openingPageStarted=!0),n.openingProgress>=1&&(n.page=1,n.sheets[0]&&(n.sheets[0].opened=!0,n.sheets[0].turnedAt=C-St),n.arrivalPhase="open",n.activeSheetIndex=-1,n.turningUntil=C,n.settledAt=C,n.cooldown=1.8));const L=n.arrivalPhase==="open"?1:n.openingProgress,U=n.arrivalPhase==="opening",ae=F(L,.14,.5),oe=F(L,ea,A0),Ea=F(L,0,.18),Aa=F(L,.34,.58),be=U?Ea*(1-Aa):0,R=U?F(L,.11,.28)*(1-F(L,.6,.82)):0,We=F(oe,.24,.86),K=U?Math.exp(-Math.pow((oe-.52)/.28,2)):0,Ne=U?Math.exp(-Math.pow((oe-.91)/.09,2)):0,Ca=1-y.smoothstep(vt,qt,Qt),we=n.arrivalPhase==="open"?Math.exp(-Math.max(0,C-n.settledAt)*.72):0,Tt=1-y.smoothstep(vt,M0,Qt);T.current=v?m.sleeping?0:Tt:y.damp(T.current,m.sleeping?0:Tt,3.2,h);const O=z*T.current,yt=O>.004;le.bookWindX=ce.x,le.bookWindZ=ce.z,t&&(t.current=n.arrivalPhase==="open");const Ut=Math.cos(J.direction??0),Dt=Math.sin(J.direction??0),$t=m.smoothedCircleCenter,Gt=((ce.x-$t.x)*Ut+(ce.z-$t.z)*Dt-le.gustOffset)/n0,Ve=Math.exp(-Gt*Gt)*le.gustStrength;let ee=U||C<n.turningUntil;const Ra=!U&&C<n.turningUntil?y.clamp(1-(n.turningUntil-C)/Kt,0,1):0,_e=Math.sin(Ra*Math.PI),ka=v?.5:.5+Math.sin(b*.68)*.5,k=y.clamp(n.arrivalPhase==="closed"?.24+Ca*.36:U?.4+be*.55+R*.52+K*.58+Ne*.72:.42+ka*.1+we*.48+_e*.45,0,1.55),A=Math.max(K*.76,Ne,_e*.42);if(le.bookWindStrength=v?0:Math.max(K*.42,Ne,_e*.36)*.96*_,!v&&n.arrivalPhase==="open"&&z>.9&&!ee&&n.cooldown<=0&&Ve>.55&&n.lastGust<=.55){n.page>=wt?n.direction=-1:n.page<=0&&(n.direction=1);const c=y.clamp(n.page+n.direction,0,wt);n.turnDirection=Math.sign(c-n.page),n.activeSheetIndex=n.turnDirection>0?n.page:n.page-1,n.page=c,n.cooldown=3,n.turningUntil=C+Kt,ee=!0}n.lastGust=Ve;const D=y.clamp((J.strength??.5)*.6+Ve*.72,0,1.5),B=y.smoothstep(m.nightAmount??0,.18,.82),ne=be,Le=b*b0,za=Math.sin(Le),Ia=Math.cos(Le),Ot=Math.sin(Le*.5),Ta=Math.cos(Le*.5),Ua=v?0:za*y.lerp(.032,.055,ae),xt=v?Zt:Zt+Ua-(1-ae)*.065+K*.075+ne*.045+Ve*.025;if(u.current){u.current.position.set(v?0:Ot*y.lerp(.012,.025,ae),xt,.06),v?u.current.rotation.set(Yt,0,0):u.current.rotation.set(y.lerp(-.08,Yt,ae)+Ia*w0-K*.025,Ot*P0+Dt*D*.018+Math.sin((C-n.openingStartedAt)*j0)*ne*.035,-Ta*S0-Ut*D*.016+ne*Math.sin((C-n.openingStartedAt)*E0)*.022);const c=Qe*(1+K*.026);u.current.scale.setScalar(c)}if(p.current){const c=F(L,.22,.62);p.current.position.x=y.lerp(-E*.5,0,c)}if(f.current){const c=k0(ae);f.current.visible=!0,f.current.rotation.y=-Math.PI*c,f.current.rotation.z=-Math.sin(c*Math.PI)*.035,f.current.position.z=Math.sin(c*Math.PI)*.052}if(M.current){const c=n.arrivalPhase==="open"?1:U&&n.openingPageStarted?F(oe,.36,.58):0;M.current.visible=c>.002,M.current.scale.x=Math.max(.001,c)}if(w.current){const c=1+ne*.08+R*.14;w.current.visible=ae<.94,w.current.scale.setScalar(c)}if(Q.emissiveIntensity=.1+B*.22+ne*.55+R*.78,De.emissiveIntensity=Q.emissiveIntensity*.6,P.current&&(P.current.visible=yt,P.current.position.y=xt),x.current){x.current.visible=yt,x.current.position.y=xt,x.current.rotation.y=(J.direction??0)*.12+(v?0:Math.sin(b*.16)*.08);const c=y.lerp(.88,1.08,k)+D*.1+A*.16-ne*.035;x.current.scale.set(c,1,c)}const Se=Ge.userData.windUniforms;if(Se.uTime.value=b,Se.uGather.value=be,Se.uImpact.value=A,Se.uEnergy.value=k,ze.current&&(ze.current.rotation.y=v?0:b*(.1+(J.speed??.8)*.08),ze.current.rotation.z=v?0:Math.sin(b*.37)*.12),ge.current&&(ge.current.visible=yt,ge.current.position.y=v?0:Math.sin(b*.78)*.012,ge.current.rotation.z=v?0:Math.sin(b*.42)*.022),Ie.current&&(Ie.current.position.y=v?0:b*.045%.12,Ie.current.rotation.y=v?0:Math.sin(b*.38)*.11),ve.current){const c=.48+R*.42+A*1.38+we*.12;ve.current.visible=R>.02||A>.015||we>.16,ve.current.scale.setScalar(c),ve.current.rotation.z=Math.sin(b*1.8)*.05}tt.current&&(tt.current.scale.y=.08+F(L,.14,.48)*.92),Me.opacity=O*(A*.78+R*.32+we*.08),He.opacity=O*(.08+k*.19+R*.36+A*.28),Ct.current.forEach((c,g)=>{if(c){for(const S of[ye[g],xe[g]]){const $=S.userData.windUniforms;$.uTime.value=b,$.uGather.value=be,$.uImpact.value=A,$.uEnergy.value=k,$.uDraw.value=U?y.clamp(F(L,.08,.55)+A*.22,.08,1):1}if(!v){const S=Math.sin(b*.42);c.position.x=S*(.025+g*.008),c.position.y=Math.sin(b*.37+g*.9)*.014,c.rotation.z=S*(g===0?.018:-.014)}}}),Rt.current.forEach((c,g)=>{if(!c)return;const S=Et[g],$=v?(g+1)/(Et.length+1):(b*(.055+g*.003)+g*.17)%1,re=U&&n.openingPageStarted?We:$,Be=Math.sin(re*Math.PI);if(U){const ie=1-be*.74;c.position.set(S.position[0]*ie*(.22+We*1.08),S.position[1]*.48+We*(.16+g%3*.045)+Math.sin(b*2.1+g)*.025,S.position[2]*ie*(.28+We*.94)),c.material.opacity=O*(R*.22+A*.84)*(g<4||!Z?1:0)}else c.position.set(y.lerp(-1.18,1.18,re),S.position[1]+(v?0:Math.sin(b*1.1+g)*.07),S.position[2]+Math.sin(re*Math.PI*2+g)*.12),c.material.opacity=O*Be*(.16+D*.14)*(.32+k*.72);const Xe=1+K*.28;c.scale.set(S.scale*1.1*Xe,S.scale*.48*Xe,1),v||(c.rotation.x=S.rotation[0]+b*(.72+g*.05),c.rotation.y=S.rotation[1]+b*(.36+g*.04))}),kt.current.forEach((c,g)=>{!c||v||(c.rotation.z=Math.sin(b*.91+g*1.6)*(.045+D*.035),c.rotation.x=Math.cos(b*.73+g)*.025)});const Ft=O*(.032+k*.055+D*.038*k+A*.13+R*.065);if(Se.uOpacity.value=O*(.14+k*.24+D*.12*k+A*.5+R*.24),Oe.opacity=O*(.12+k*.3+D*.14*k+A*.5+R*.26),ye.forEach((c,g)=>{const S=v?1:.82+Math.sin(b*1.1+g*1.6)*.18;c.userData.windUniforms.uOpacity.value=Ft*S*(g===0?1.18:.72)}),xe.forEach((c,g)=>{const S=v?1:.88+Math.sin(b*1.24+g*1.3)*.12;c.userData.windUniforms.uOpacity.value=Ft*S*(g===0?.92:.62)}),at.current&&(at.current.intensity=z*(.055+k*.07+B*(.2+D*.035)+R*.16+A*.4)),ot.current){const c=v?1:.93+Math.sin(b*2.9)*.042+Math.sin(b*6.7+1.1)*.026+Math.sin(b*1.3+.4)*.032;ot.current.intensity=z*(.11+k*.16+B*(.38+D*.05)+R*.34+A*1.18)*c}nt.current&&(nt.current.intensity=O*(.055+k*.11+B*.18+R*.2+A*.72)),rt.current&&(rt.current.intensity=z*(.045+B*.13+R*.1+A*.26));const Da=.025+B*(.065+D*.025)+(ee?.05+B*.04:0)+A*.18,Ht=y.clamp(O*(.34+B*.4+D*.22+k*.2+R*.5+A*.7),0,1.6);It.current=Ht;const $a=v?.5:b*.16%1.5-.25,Wt=Ue.userData.deckleUniforms;Wt.uCreepHead.value=$a,Wt.uEmberHeat.value=Ht;const Ga=z*B,Oa=z*((ee?.72:.05)+D*(ee?.18:.035)+A*.3);for(let c=0;c<n.sheets.length;c+=1){const g=n.sheets[c],S=g.mesh,$=c<n.page,re=n.page-1,Be=n.page,Xe=n.turnDirection>0?re-1:Be+1,ie=U&&n.openingPageStarted&&c===0;let X=I.hidden;U?c===0?X=I.turning:n.openingPageStarted&&c===1&&(X=I.destination):c===n.activeSheetIndex&&ee?X=I.turning:c===re?X=I.left:c===Be?X=I.right:ee&&c===Xe&&(X=I.underlay),S.visible=X!==I.hidden,S.renderOrder=y0[X],g.opened!==$&&(g.opened=$,g.turnedAt=C);const Nt=n.arrivalPhase!=="open"&&!n.openingPageStarted,Fa=$?Math.max(0,n.page-1-c):Math.max(0,c-n.page);let Ze=$?-Math.PI/2:Math.PI/2;ie&&(Ze=y.lerp(Math.PI/2,-Math.PI/2,oe)),g.turnAngle=v?Ze:y.damp(g.turnAngle,Ze,U?13:v0,h);const Vt=X===I.turning,_t=u0(g.turnAngle,Fa,Vt,Ze);g.hinge.rotation.set(0,g.turnAngle,0),g.hinge.position.set(_t.depth,0,0),S.position.z=0;const Mt=S.skeleton.bones;for(let se=0;se<Mt.length;se+=1)Mt[se].rotation.set(0,d0(se,Mt.length,Nt?0:_t.bend),0);for(const se of[4,5]){const Ye=S.material[se].userData.paperUniforms;Ye.uPaperNight.value=Ga,Ye.uPaperMotion.value=Oa;const Ha=!Nt&&(c===n.page||c===n.page-1);Ye.uMagicEnergy.value=O*(ie?R*.28+K*.72+Ne*.94:Ha?k*.045+we*.12+_e*.26:0),Ye.uMagicHead.value=ie?y.lerp(-.12,1.12,oe):Vt?.5-g.turnAngle/Math.PI:.5+Math.sin(b*.52)*.34}S.material[0].emissiveIntensity=Da}}),l.jsxs("group",{ref:r,visible:!e,children:[l.jsx(r0,{blobs:[{x:0,z:0,radius:.95,strength:.36}]}),l.jsx(Je,{ref:at,color:"#efc77c",position:[0,.88,.08],intensity:0,distance:2.7,decay:2}),l.jsxs("group",{ref:x,children:[gt.map(({halo:i,core:h},m)=>l.jsxs("group",{ref:j=>{Ct.current[m]=j},children:[l.jsx("mesh",{geometry:i,material:ye[m],renderOrder:2}),l.jsx("mesh",{geometry:h,material:xe[m],renderOrder:3})]},m)),l.jsx("points",{ref:ze,geometry:ft,material:Ge,renderOrder:3}),Et.map((i,h)=>l.jsxs("mesh",{ref:m=>{Rt.current[h]=m},position:i.position,rotation:i.rotation,scale:[i.scale*1.1,i.scale*.48,1],renderOrder:2,children:[l.jsx("circleGeometry",{args:[.048,4]}),l.jsx("meshBasicMaterial",{color:h%3===0?pe:h%3===1?f0:"#c9b487",transparent:!0,opacity:.62,side:Pe,depthWrite:!1,toneMapped:!1})]},h))]}),l.jsx("group",{ref:P,children:l.jsx(i0,{count:B0,particleTexture:ct,colorTexture:ut,sizeTexture:dt,twinkleTexture:pt,sizeScale:54,maxPointSize:14,nearFadeStart:.2,nearFadeEnd:.7,blending:de,strengthRef:It,spawn:Pa,integrate:ja,spawnGate:i=>i>.12&&Math.random()<.4})}),l.jsx("group",{ref:u,scale:Qe,children:l.jsxs("group",{ref:p,children:[l.jsxs("group",{ref:f,children:[l.jsx("mesh",{geometry:$e[0],castShadow:!0,receiveShadow:!0,position:[E*.5+.003,0,.038],children:l.jsx("meshStandardMaterial",{map:N,bumpMap:N,bumpScale:.012,color:Jt,roughness:.57,metalness:.05})}),l.jsx("mesh",{position:[E*.5+.003,0,.052],geometry:ht,children:l.jsx("meshStandardMaterial",{color:"#c49b58",metalness:.72,roughness:.38})}),l.jsx("mesh",{position:[E*.5+.003,0,.0548],material:De,children:l.jsx("planeGeometry",{args:[wa,Sa]})}),l.jsxs("group",{ref:w,position:[E*.5,0,.052],children:[l.jsx("mesh",{material:Q,position:[0,ue.y,0],children:l.jsx("cylinderGeometry",{args:[ue.radius,ue.radius,ue.height,6]})}),x0.map((i,h)=>l.jsx("mesh",{material:Q,position:[i.side*i.length*.42,i.y,0],rotation:[0,0,-i.side*i.tilt],children:l.jsx("capsuleGeometry",{args:[.0055,i.length,3,6]})},`cover-sprig-${h}`)),l.jsx("mesh",{material:Q,position:[0,ue.y+ue.height*.5+.016,.002],rotation:[0,0,Math.PI/4],scale:[.85,1.25,.28],children:l.jsx("octahedronGeometry",{args:[.024,0]})})]})]}),l.jsxs("group",{children:[l.jsx("mesh",{geometry:$e[1],castShadow:!0,receiveShadow:!0,position:[E*.5+.003,0,-.038],children:l.jsx("meshStandardMaterial",{map:N,bumpMap:N,bumpScale:.012,color:Jt,roughness:.57,metalness:.05})}),l.jsx(s0,{args:[.058,H+.048,.024],radius:.006,smoothness:2,castShadow:!0,receiveShadow:!0,position:[0,0,-.026],children:l.jsx("meshStandardMaterial",{color:m0,bumpMap:N,bumpScale:.026,roughness:.7,metalness:.05})}),[-1,1].map(i=>l.jsxs("group",{ref:i===-1?M:void 0,visible:i===1,children:[l.jsxs("group",{children:[l.jsxs("mesh",{castShadow:!0,position:[i*(E-.005),0,-.004],children:[l.jsx("boxGeometry",{args:[.014,H-.018,.03]}),l.jsx("meshStandardMaterial",{color:"#e7dcc4",roughness:.98})]}),[-1,1].map(h=>l.jsxs("mesh",{castShadow:!0,position:[i*E*.5,h*(H*.5-.004),-.004],children:[l.jsx("boxGeometry",{args:[E-.018,.012,.03]}),l.jsx("meshStandardMaterial",{color:"#eee5d2",roughness:.98})]},h))]}),l.jsx("mesh",{geometry:lt[i===-1?0:1],material:Ue}),l.jsxs("mesh",{castShadow:!0,receiveShadow:!0,position:[i*E*.5,0,-.012],children:[l.jsx("planeGeometry",{args:[E,H]}),l.jsx("meshStandardMaterial",{color:fa,roughness:.98,side:Pe,polygonOffset:!0,polygonOffsetFactor:2,polygonOffsetUnits:2})]})]},`page-stack-${i}`)),l.jsx("group",{position:[0,0,.014],rotation:[0,-Math.PI/2,0],children:V.map((i,h)=>l.jsx("primitive",{object:i.hinge},h))}),[-.27,-.135,0,.135,.27].map(i=>l.jsxs("mesh",{castShadow:!0,position:[0,i,.043],rotation:[0,0,Math.PI/2],children:[l.jsx("cylinderGeometry",{args:[.0022,.0022,.045,5]}),l.jsx("meshStandardMaterial",{color:"#b7aa84",roughness:1})]},`thread-${i}`)),[-.018,.018].map((i,h)=>l.jsx("group",{ref:m=>{kt.current[h]=m},position:[i,-.35,.036-h*.004],children:l.jsx("mesh",{geometry:st,castShadow:!0,children:l.jsx("meshStandardMaterial",{color:h===0?"#d8612c":"#91a95f",roughness:.82,side:Pe})})},i)),l.jsxs("group",{ref:ge,children:[l.jsx("mesh",{ref:tt,position:[0,0,.105],material:He,renderOrder:5,children:l.jsx("planeGeometry",{args:[.052,.7]})}),l.jsxs("group",{ref:ve,position:[0,.01,.118],visible:!1,children:[l.jsx("mesh",{material:Me,scale:[.5,3.8,1],renderOrder:6,children:l.jsx("planeGeometry",{args:[.22,.22]})}),l.jsx("mesh",{material:Me,scale:[2.8,.34,1],renderOrder:6,children:l.jsx("planeGeometry",{args:[.22,.22]})})]}),l.jsx("points",{ref:Ie,geometry:mt,material:Oe,renderOrder:4})]}),l.jsx(Je,{ref:ot,color:pe,position:[0,.1,-.32],intensity:0,distance:1.8,decay:2}),l.jsx(Je,{ref:nt,color:"#c9b487",position:[.42,.18,.28],intensity:0,distance:1.45,decay:2.2}),l.jsx(Je,{ref:rt,color:"#ffe4ad",position:[0,.12,.46],intensity:0,distance:1.35,decay:2})]})]})})]})}export{no as default};
