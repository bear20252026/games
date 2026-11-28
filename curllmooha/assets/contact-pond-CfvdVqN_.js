import{N as w,c as It,T as v}from"./react-BbqnMepd.js";import{W as Je,U as ee,u as te,w as _,D as oe,a as W,Z as Ut,X as Ee,E as Me,G as Bt,I as et,J as Lt,l as $t,K as We,L as Pt,Q as X,R as He,v as Pe,h as Zt,T as ne,a0 as Gt,a1 as re,a2 as fe,a3 as Ht}from"./main-CHq3HDKI.js";import{a1 as Ce,J as Ct,a3 as Yt,a6 as Ye,a8 as y,w as j,o as je,an as Ae,b as U,aw as Ot,ax as Vt,ap as Xt,ay as qt,j as _t,$ as tt,ar as Kt,az as Oe,aA as Qt,a7 as Jt,aq as ea,aB as ta,aC as aa,a5 as oa,aD as na,Y as ra,V as jt,aa as $e,ad as Ve,G as Xe,v as At,ah as at}from"./three-DlAHX5Z_.js";import"./rapier-BcgqzzOj.js";import"./gsap-D1AWpUut.js";import"./home-C-bt6R1Y.js";import"./modulepreload-polyfill-B5Qt9EMX.js";const sa="/games/curllmooha/assets/Fish-7rIe5fDV.glb",ia="/games/curllmooha/assets/pond_pack-mjsi-7jK.glb",la="#e0561c",ca=.55,ha=9.5,Tt=5.2,Re=1.62,ot=1.72,Dt=1.95,da=.5,xe=.12,Fe=.09,Et=.36,ua=.13,Ne=.6,pa=.3,ma=1.45,ve=[{name:"Ember",seed:20897,scale:1,body:[1,1,1],x:.6,z:1.3},{name:"Rust",seed:40503,scale:.92,body:[.78,.6,.62],x:-.9,z:.4},{name:"Marigold",seed:11291,scale:.84,body:[1.04,1.75,1.4],x:.2,z:-1.2},{name:"Coral",seed:32586,scale:.78,body:[1,1.3,2.2],x:-.5,z:-.4},{name:"Fry",seed:15765,scale:.66,body:[1.06,.82,.55],x:1,z:.1}],Ze={uPondWaterY:{value:0},uPondScatter:{value:new U("#0b2a2e")}};function fa(e){e.onBeforeCompile=a=>{Object.assign(a.uniforms,Ze),a.vertexShader=a.vertexShader.replace("#include <common>",`#include <common>
varying float vPondWorldY;`).replace("#include <project_vertex>",`#include <project_vertex>
vPondWorldY = (modelMatrix * vec4(transformed, 1.0)).y;`),a.fragmentShader=a.fragmentShader.replace("#include <common>",`#include <common>
varying float vPondWorldY;
uniform float uPondWaterY;
uniform vec3 uPondScatter;`).replace("#include <tonemapping_fragment>",`{
    float pondDepth = max(uPondWaterY - vPondWorldY, 0.0);
    vec3 pondPass = exp(-pondDepth * vec3(2.2, 1.05, 0.8));
    gl_FragColor.rgb = gl_FragColor.rgb * pondPass + uPondScatter * (1.0 - pondPass.g);
}
#include <tonemapping_fragment>`)},e.customProgramCacheKey=()=>"pond-fish-underwater-v1"}function ga(e,a,{phase:o=0,body:n=null}={}){const u=a.find(S=>/swim/i.test(S.name))??a.find(S=>S.name==="Animation")??a[0];if(!u)throw new Error("Pond fish requires its authored swim animation");const t=Qt(e),s=new Jt,i=new Set,l=new Set,r=new Map;t.traverse(S=>{if(!S.isMesh)return;const G=H=>{if(!r.has(H)){const $=H.clone();n&&$.name==="FishBody"&&$.color.setRGB(...n),fa($),r.set(H,$),i.add($)}return r.get(H)};S.material=Array.isArray(S.material)?S.material.map(G):G(S.material),S.castShadow=!1,S.receiveShadow=!1,S.isSkinnedMesh&&(l.add(S.skeleton),S.frustumCulled=!1)}),t.updateMatrixWorld(!0);const x=new ea().setFromObject(t),M=x.getSize(new j);t.position.sub(x.getCenter(new j)),s.add(t);const A=t.getObjectByName("Face"),B=t.getObjectByName("Tail");if(!A||!B)throw new Error("Pond fish is missing its Face/Tail rig");const L=A.getWorldPosition(new j).sub(B.getWorldPosition(new j));L.y=0,L.normalize(),s.quaternion.setFromUnitVectors(L,new j(1,0,0)),s.scale.setScalar(da/Math.max(M.x,M.z));const T=new ta(t),Y=T.clipAction(u).setLoop(aa,1/0).play();return Y.time=o%u.duration,T.update(0),{model:s,mixer:T,action:Y,dispose(){T.stopAllAction(),T.uncacheRoot(t),l.forEach(S=>S.dispose()),i.forEach(S=>S.dispose())}}}function va(e,a){return He-te(_(e,a))}const nt=e=>y.euclideanModulo(e+Math.PI,Math.PI*2)-Math.PI;function Wt(e,a){return Math.max(xe,Math.min(Et,va(e,a)-ua))}function rt(e,a,o){const n=ee(e()*Math.PI*2,a*Math.sqrt(e()));return o.x=n.x,o.z=n.z,o}function qe(e,a){const o=_(e.x,e.z);return o>a&&(e.x*=a/o,e.z*=a/o),e}function xa(e=ve){return e.map(a=>{const o=Pe(a.seed),n={config:a,rng:o,x:a.x,z:a.z,depth:.16+o()*.12,heading:o()*Math.PI*2,speed:.08,yawRate:0,pitch:0,roll:0,accel:0,animRate:1,intent:null,intentTime:0,duration:0,targetX:0,targetZ:0,targetDepth:.2,targetSpeed:.1,speedResponse:2,sipped:!1,meander:o()*100,jump:null};return _e(n,null,!1),n})}const Z={x:0,z:0};function st(e,a,o){Z.x=e.x+Math.cos(e.heading+a)*o,Z.z=e.z+Math.sin(e.heading+a)*o,qe(Z,Re),e.targetX=Z.x,e.targetZ=Z.z}function _e(e,a,o){const{rng:n}=e,u=e.intent,t=n();e.intentTime=0;const s=.14,i=s+(a?.18:.08),l=i+.08;if(u==="dart"){e.intent="glide",e.targetSpeed=.035,e.speedResponse=.7,e.duration=1.4+n()*1.6;return}if(t<s&&u!=="hover"){e.intent="hover",e.targetSpeed=.012,e.speedResponse=1.1,e.duration=2+n()*4;return}if(t<i){e.intent="sip",e.targetSpeed=.07+n()*.04,e.speedResponse=1.4,e.duration=9,e.sipped=!1,st(e,(n()-.5)*1.6,.35+n()*.6);return}if(t<l&&!o){e.intent="dart",e.targetSpeed=.42+n()*.16,e.speedResponse=9,e.duration=.45+n()*.45,st(e,(n()<.5?-1:1)*(.6+n()*1.1),1.2);return}if(e.intent="cruise",e.targetSpeed=o?.06+n()*.05:.08+n()*.12,e.speedResponse=1.6,e.duration=14,a&&n()<.6){const r=Math.atan2(a.z/X.z,a.x/X.x)+(n()-.5)*.9,x=ee(r,ma+(n()-.5)*.35);Z.x=x.x,Z.z=x.z}else rt(n,Re,Z),Math.hypot(Z.x-e.x,Z.z-e.z)<1&&rt(n,Re,Z);e.targetX=Z.x,e.targetZ=Z.z,e.targetDepth=xe+.03+n()*(Et-xe-.03)}const Se=.95,wa=.36,Ft=.85;function ya(e){let a=null,o=1/0;for(const n of e){if(n.jump||n.intent==="hover")continue;const u=Ft*Se+.4,t=n.x+Math.cos(n.heading)*u,s=n.z+Math.sin(n.heading)*u;if(_(t,s)>Re||!e.every(l=>l===n||Math.hypot(l.x+Math.cos(l.heading)*l.speed*Se-t,l.z+Math.sin(l.heading)*l.speed*Se-s)>.9))continue;const i=n.depth+Math.abs(n.speed-.2);i<o&&(o=i,a=n)}return a?(a.jump={time:0,fromDepth:a.depth,splashedOut:!1,splashedIn:!1},a):null}function ba(e,a,{visitor:o=null,calm:n=!1,events:u=null}={}){if(!(a<=0))for(const t of e){if(t.jump){za(t,a,u);continue}if(t.intentTime+=a,t.intent==="sip"&&!t.sipped&&t.depth<Fe+.012){t.sipped=!0;const D=.14*t.config.scale;u?.push({type:"sip",x:t.x+Math.cos(t.heading)*D,z:t.z+Math.sin(t.heading)*D})}const s=t.intent==="hover"||t.intent==="glide"||t.intent==="dart",i=Math.hypot(t.targetX-t.x,t.targetZ-t.z);(t.intent==="sip"?t.sipped||t.intentTime>t.duration:t.intentTime>t.duration||!s&&i<.22)&&_e(t,o,n);let l,r;if(t.intent==="hover"||t.intent==="glide"||t.intent==="sip"&&i<.22)l=Math.cos(t.heading),r=Math.sin(t.heading);else{const D=i||1;l=(t.targetX-t.x)/D,r=(t.targetZ-t.z)/D}const x=.45+t.speed*1.6,M=_(t.x+Math.cos(t.heading)*x,t.z+Math.sin(t.heading)*x);if(M>ot-.15){const D=y.clamp((M-(ot-.15))/.3,0,1)*3,O=Math.hypot(t.x,t.z)||1;l-=t.x/O*D,r-=t.z/O*D}let A=0;for(const D of e){if(D===t||D.jump)continue;const O=t.x-D.x,Q=t.z-D.z,N=Math.hypot(O,Q);if(N>Ne||N<1e-5)continue;const ue=(1-N/Ne)**2*2.4;l+=O/N*ue,r+=Q/N*ue,-(O*Math.cos(t.heading)+Q*Math.sin(t.heading))/N>.5&&(A=Math.max(A,1-N/Ne));const pe=pa*(t.config.scale+D.config.scale)*.5;if(N<pe){const me=Math.min((pe-N)*.5,a*.15);t.x+=O/N*me,t.z+=Q/N*me}}const B=(Math.sin(t.meander*.83)*.22+Math.sin(t.meander*2.3+1.7)*.08)*(t.intent==="hover"?.3:1);t.meander+=a*(.6+t.speed*2);const L=Math.atan2(r,l)+(t.intent==="dart"?0:B),T=nt(L-t.heading),Y=t.intent==="dart"?3.2:.75+.9*Math.exp(-t.speed*9),S=y.clamp(T*1.8,-Y,Y);t.yawRate=y.damp(t.yawRate,S,t.intent==="dart"?12:4,a),t.heading=nt(t.heading+t.yawRate*a);const G=1-.45*Math.min(Math.abs(T)/Math.PI,1),H=Math.max(.01,t.targetSpeed*G*(1-A*.7)),$=H<t.speed?Math.min(t.speedResponse,1.1):t.speedResponse,we=t.speed;t.speed=y.damp(t.speed,H,$,a),t.accel=y.damp(t.accel,(t.speed-we)/a,6,a),t.x+=Math.cos(t.heading)*t.speed*a,t.z+=Math.sin(t.heading)*t.speed*a,qe(t,Dt);const ae=Wt(t.x,t.z),le=t.intent==="sip"?Fe:xe,ce=t.intent==="sip"?Fe:y.clamp(t.targetDepth,xe,ae),he=t.depth;t.depth=y.damp(t.depth,ce,.25+t.speed*4,a),t.depth=y.clamp(t.depth,Math.min(le,t.depth),ae);const de=(he-t.depth)/a;t.pitch=y.damp(t.pitch,y.clamp(Math.atan2(de,Math.max(t.speed,.06)),-.45,.45),5,a),t.roll=y.damp(t.roll,y.clamp(-t.yawRate*(.08+t.speed*.6),-.4,.4),5,a);const K=ca+t.speed*ha+Math.max(t.accel,0)*5;t.animRate=y.damp(t.animRate,Math.min(K,Tt),6,a)}}function za(e,a,o){const n=e.jump;n.time+=a;const u=n.time/Se;if(e.speed=y.damp(e.speed,Ft,10,a),e.x+=Math.cos(e.heading)*e.speed*a,e.z+=Math.sin(e.heading)*e.speed*a,qe(e,Dt),e.animRate=Tt,e.yawRate=0,e.roll=y.damp(e.roll,0,6,a),u<1){const t=e.depth;e.depth=n.fromDepth-Math.sin(u*Math.PI)*(wa+n.fromDepth);const s=(t-e.depth)/a;e.pitch=y.clamp(Math.atan2(s,e.speed),-.9,.9),!n.splashedOut&&e.depth<0&&(n.splashedOut=!0,o?.push({type:"leap-out",x:e.x,z:e.z})),n.splashedOut&&!n.splashedIn&&u>.5&&e.depth>0&&(n.splashedIn=!0,o?.push({type:"leap-in",x:e.x,z:e.z}));return}e.depth=Math.min(e.depth+a*.4,Wt(e.x,e.z)),e.pitch=y.damp(e.pitch,0,4,a),u>1.4&&(e.jump=null,e.intent="dart",_e(e,null,!0),e.speedResponse=2.6)}function Ma(){return new _t({transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uDeep:{value:new U("#184d55")},uShallow:{value:new U("#51867b")},uBank:{value:new U("#1b2a1c")},uLampPos:{value:new j(0,1,0)},uLampColor:{value:new U("#ffb066")},uLampStrength:{value:0},uSkyHorizon:{value:new U("#4e8dc2")},uSkyZenith:{value:new U("#285f9f")},uSunColor:{value:new U("#fff0c2")},uSunDir:{value:new j(.5,.75,.35).normalize()},uWindDir:{value:new tt(1,0)},uWindSpeed:{value:.3},uRainAmount:{value:0},uNightAmount:{value:0},uStretch:{value:new tt(X.x,X.z)},uReveal:{value:1},uEdgeCenter:We.uniforms.uEdgeCenter,uEdgeRadius:We.uniforms.uEdgeRadius,uEdgeFade:We.uniforms.uEdgeFade},vertexShader:`
            varying vec2 vUv;
            varying vec3 vViewDir;
            varying vec3 vWorldPos;
            void main() {
                vUv = uv;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vViewDir = cameraPosition - worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,fragmentShader:`
            uniform float uTime;
            uniform vec3 uDeep;
            uniform vec3 uShallow;
            uniform vec3 uBank;
            uniform vec3 uSkyHorizon;
            uniform vec3 uSkyZenith;
            uniform vec3 uSunColor;
            uniform vec3 uSunDir;
            uniform vec2 uWindDir;
            uniform float uWindSpeed;
            uniform float uRainAmount;
            uniform float uNightAmount;
            uniform vec3 uLampPos;
            uniform vec3 uLampColor;
            uniform float uLampStrength;
            uniform vec2 uStretch;
            uniform float uReveal;
            uniform vec2 uEdgeCenter;
            uniform float uEdgeRadius;
            uniform float uEdgeFade;
            varying vec2 vUv;
            varying vec3 vViewDir;
            varying vec3 vWorldPos;

            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float vnoise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                    f.y
                );
            }

            vec3 rainRippleField(vec2 uv, float time) {
                vec2 gridUv = uv * 9.0;
                vec2 baseCell = floor(gridUv);
                vec3 rings = vec3(0.0);

                for (int y = -1; y <= 1; y++) {
                    for (int x = -1; x <= 1; x++) {
                        vec2 cell = baseCell + vec2(float(x), float(y));
                        float seed = hash(cell + vec2(13.7, 5.1));
                        vec2 point = cell + vec2(
                            hash(cell + vec2(3.2, 9.7)),
                            hash(cell + vec2(8.3, 2.4))
                        );
                        float age = fract(time * (0.48 + seed * 0.22) + seed);
                        float radius = age * 0.72;
                        vec2 offset = gridUv - point;
                        float distanceToPoint = length(offset);
                        float wave = (distanceToPoint - radius) / 0.075;
                        float envelope = exp(-wave * wave) * smoothstep(0.0, 0.09, age)
                            * pow(1.0 - age, 2.4);
                        rings.x += envelope;
                        rings.yz += (-2.0 * wave / 0.075) * envelope
                            * offset / max(distanceToPoint, 0.001);

                    }
                }

                return rings;
            }

            // Two drifting octaves plus a directional swell. Removing the
            // third octave saves three noise evaluations per water pixel
            // because the height is sampled for the centre and both slopes.
            float surfaceHeight(vec2 uv, vec2 flow) {
                float h = vnoise(uv * 7.0 + flow) * 0.56;
                h += vnoise(uv * 13.0 + flow * 1.6 + vec2(3.7, 9.2)) * 0.3;
                vec2 centered = (uv - 0.5) * 2.0;
                h += (sin(dot(centered, uWindDir) * 9.0 - uTime * 1.9) * 0.5 + 0.5) * 0.12;
                return h;
            }

            void main() {
                vec2 centered = (vUv - 0.5) * 2.0;
                float radial = length(centered);
                vec2 flow = uWindDir * uTime * uWindSpeed;
                // The same disc UV, stretched to the pond's real proportions.
                // Shape terms (radial, depth, shoreline) stay on vUv; texture
                // terms (ripples, sparkles, foam) read nUv so they keep one
                // size across the whole oval.
                vec2 nUv = 0.5 + (vUv - 0.5) * uStretch;

                // Analytic slope from offset height samples: stable, smooth
                // normals (screen-space derivatives crumble into pixel grit
                // at the gameplay camera's grazing angles).
                float slopeStep = 0.014;
                float h0 = surfaceHeight(nUv, flow);
                float hx = surfaceHeight(nUv + vec2(slopeStep, 0.0), flow);
                float hy = surfaceHeight(nUv + vec2(0.0, slopeStep), flow);
                vec2 slope = vec2(hx - h0, hy - h0) / slopeStep;

                float rainRings = 0.0;
                if (uRainAmount > 0.001) {
                    vec3 rainField = rainRippleField(nUv, uTime);
                    rainRings = min(rainField.x, 1.0);
                    slope += rainField.yz * 0.42 * uRainAmount;
                }

                // A sheltered pond is close to a mirror. At 0.075 the surface
                // tilted far enough that every ripple threw the reflection from
                // sky to bank and back, mottling the water into camouflage
                // rather than reading as a gentle chop. Calming the normals is
                // what makes it sit still.
                vec3 normal = normalize(vec3(-slope.x * 0.028, 1.0, -slope.y * 0.028));
                vec3 viewDir = normalize(vViewDir);
                // Clamped hard on both ends: float error can push the dot a
                // hair past 1.0, and pow() of a negative base is NaN — one
                // NaN pixel through the bloom mip chain wipes the whole
                // frame white/black (the "blinking" on the pond approach).
                float facing = clamp(dot(viewDir, normal), 0.0, 1.0);

                // Schlick fresnel, uncapped on purpose. Seen from the bank the
                // view is grazing, and grazing water is a mirror. The old 0.52
                // cap plus a 0.4 clamp on the weight below meant well over half
                // of every pixel was a fixed body colour, so the pond stayed the
                // same shade at noon, dusk and midnight while the meadow around
                // it changed with the hour. That was the whole problem.
                float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);

                // Approximate the bowl's physical depth beneath this water UV.
                // Absorption increases continuously toward the deeper centre.
                // Depth of the dig beneath this point — pondGroundHeight in
                // pondLayout.js, restated: a straight cut below the shoreline,
                // then the bed's bowl. Shallow right at the bank, so the soil
                // of the cut shows through the edge of the water.
                float pondD = radial * ${Ge.toFixed(3)};
                float cutSlope = ${ka.toFixed(4)};
                float waterDepth = max(${Pt.toFixed(3)} - pondD, 0.0) * cutSlope;
                float bowlT = min(pondD / ${lt.toFixed(3)}, 1.0);
                waterDepth += 0.32 * (1.0 - bowlT * bowlT) * step(pondD, ${lt.toFixed(3)});
                waterDepth = max(waterDepth, 0.0) + 0.02;
                // Absorption per channel rather than one grey fade: red goes
                // first, so the shallows stay clear and faintly green over the
                // sand while the middle deepens to teal instead of to grey.
                vec3 absorbed = exp(-waterDepth * vec3(3.1, 1.55, 1.2));
                float deepFactor = 1.0 - dot(absorbed, vec3(0.3333));
                vec3 base = mix(uShallow, uDeep, deepFactor);
                base *= mix(vec3(1.0), absorbed * 1.25 + 0.2, 0.35);

                // Fake refraction: the body colour wobbles with the surface
                // slope, as if the bed beneath were bending with the waves.
                base *= 1.0 + (normal.x + normal.z) * 0.18;

                // The body is lit, not self-luminous. Warming it toward the
                // sun's colour by day and dropping it to a cold, much darker
                // tone at night is what puts the water in the same hour as the
                // meadow around it.
                vec3 bodyLight = mix(vec3(1.0), uSunColor, 0.30);
                bodyLight = mix(bodyLight, vec3(0.17, 0.24, 0.36), uNightAmount);
                base *= bodyLight;

                // ---- what the surface mirrors ---------------------------
                // A ray leaving at a shallow angle hits the far bank and the
                // trees on it, not the sky. That detail is what makes water
                // read as water — and it is also what keeps a strongly
                // reflective surface from flattening into a pale disc, because
                // the grazing angles that reflect hardest are exactly the ones
                // aimed at the dark treeline.
                vec3 reflectedRay = reflect(-viewDir, normal);
                float up = clamp(reflectedRay.y, 0.0, 1.0);
                // Wide ramps on purpose. Narrow ones made every ripple swing
                // the reflection the whole way from dark bank to bright sky,
                // and the surface marbled into oily streaks at dawn and dusk.
                // Spreading the transition lets the ripples modulate the
                // reflection instead of switching it.
                vec3 mirrored = mix(mix(uBank, uSkyHorizon, 0.55), uSkyHorizon, smoothstep(0.0, 0.34, up));
                mirrored = mix(mirrored, uSkyZenith, smoothstep(0.30, 0.88, up));

                // ---- the far bank, mirrored ------------------------------
                // The single strongest "this is water" cue: a dark band along
                // the far shore where the grassy bank hangs upside down in it.
                // Worked out from the geometry rather than a second render.
                // March the view ray across the water to the far rim; a bank
                // of height H stands there, and similar triangles say its
                // reflection reaches L = H * D / h back toward the viewer,
                // where D is how far away that rim is and h the eye height.
                vec2 toFrag = vWorldPos.xz - cameraPosition.xz;
                float eyeDistance = length(toFrag);
                vec2 viewXZ = toFrag / max(eyeDistance, 0.0001);
                // Into the disc's unit space: world X is U, world Z is -V.
                vec2 perMetre = vec2(viewXZ.x, -viewXZ.y)
                    / (${Ge} * uStretch);
                float unitsPerMetre = max(length(perMetre), 0.0001);
                vec2 rayDir = perMetre / unitsPerMetre;
                float pd = dot(centered, rayDir);
                float farRim = -pd + sqrt(max(pd * pd - (dot(centered, centered) - 1.0), 0.0));
                float toRim = farRim / unitsPerMetre;
                float eyeHeight = max(cameraPosition.y - vWorldPos.y, 0.35);
                // The bank's skyline is ragged — tufts, stones, a gap — so its
                // height wanders along the rim instead of being one ruler line.
                // Noise on the rim point itself, not on its angle: atan()
                // jumps from π to -π on the far side, and that cut a hard
                // vertical seam through the reflected bank.
                vec2 rimPoint = centered + rayDir * farRim;
                float bankHeight = 0.62 + 0.5 * vnoise(rimPoint * 3.2 + vec2(1.7, 4.3));
                float bankReach = bankHeight * (eyeDistance + toRim) / eyeHeight;
                // Ripples shred the band's lower edge rather than blurring it.
                float bankEdge = toRim / max(bankReach, 0.001) + (h0 - 0.45) * 0.35;
                float bankMask = 1.0 - smoothstep(0.62, 1.0, bankEdge);
                // Beyond the rim is not this pond's business.
                bankMask *= step(radial, 1.0);
                // A touch of green-gold where the grass tips catch the light.
                vec3 bankColor = mix(uBank, uBank * 1.9 + vec3(0.03, 0.04, 0.0),
                    smoothstep(0.55, 1.0, bankEdge));
                mirrored = mix(mirrored, bankColor, bankMask);

                // Stylised on purpose: at the gameplay camera's ~25° the
                // physical fresnel is 6%, which reflects nothing you can read.
                float reflectivity = clamp(0.16 + fresnel * 0.84, 0.05, 0.94);
                reflectivity = max(reflectivity, bankMask * 0.74);
                vec3 color = mix(base, mirrored, reflectivity);

                // Sun sparkles on ripple crests by day, moon glints after
                // dark: a tight lobe broken by drifting noise so the light
                // twinkles instead of smearing.
                // A view ray can briefly become the exact opposite of the
                // sun ray while the camera crosses the shore. normalize(0)
                // is undefined on mobile GPUs and was the last path that
                // could feed NaNs into bloom, making the entire frame flash.
                vec3 halfVector = viewDir + normalize(uSunDir);
                float halfLengthSq = max(dot(halfVector, halfVector), 0.000001);
                vec3 halfDir = halfVector * inversesqrt(halfLengthSq);
                float lobe = clamp(dot(normal, halfDir), 0.0, 1.0);
                // Finer and gentler than before. Once the surface was calmed the
                // specular lobe stopped varying across the pond, so this mask
                // was no longer breaking a highlight into sparkles — it was the
                // only thing modulating an otherwise flat sheen, and painted its
                // own noise onto the water as pale blotches.
                float sparkleMask = 0.25 + 0.55 * vnoise(nUv * 72.0 + flow * 3.2);
                float glint = pow(lobe, 240.0) * sparkleMask;
                // Tight enough to be a highlight rather than a haze: at 32 this
                // lobe smeared a pale band across a third of the surface.
                // Softer than before: against the darker body the old 0.09
                // lobe read as a hard band lying across the ripples.
                float gloss = pow(lobe, 110.0) * 0.055;
                float clearSky = 1.0 - uRainAmount * 0.82;
                vec3 dayGlint = mix(vec3(1.0, 0.95, 0.8), uSunColor, 0.68);
                color += dayGlint * (glint * 0.55 + gloss)
                    * clearSky * (1.0 - uNightAmount);
                color += vec3(0.62, 0.75, 1.0) * (glint * 0.5 + gloss * 0.4)
                    * clearSky * uNightAmount;
                color += vec3(0.16, 0.32, 0.38) * rainRings * uRainAmount * 0.035;

                color = mix(color, color * vec3(0.36, 0.48, 0.62), uNightAmount);

                // The lantern's reflection. A real one is a long broken smear
                // running from under the lamp toward whoever is looking, and it
                // is the single thing that most makes a night pond read as
                // water rather than a dark hole. Built from that geometry
                // directly: distance along the lamp-to-viewer axis stretches
                // it, distance across the axis narrows it, and the surface
                // height breaks it into the flickering segments a still pond
                // gives back.
                if (uLampStrength > 0.001) {
                    vec2 lampXZ = uLampPos.xz;
                    vec2 toCam = cameraPosition.xz - lampXZ;
                    float toCamLen = max(length(toCam), 0.0001);
                    vec2 axis = toCam / toCamLen;
                    vec2 d = vWorldPos.xz - lampXZ;
                    float along = dot(d, axis);
                    float across = dot(d, vec2(-axis.y, axis.x));

                    // The wobble is what stops it being a painted stripe.
                    across += (h0 - 0.45) * 0.55;

                    // Widens as it runs away from the lamp, the way a real
                    // reflection spreads with the angle it is seen at.
                    float width = 0.055 + max(along, 0.0) * 0.075;
                    float lateral = exp(-(across * across) / (width * width));
                    float reach = clamp(uLampPos.y * 1.5, 0.6, 3.0);
                    float longitudinal = smoothstep(-0.22, 0.06, along)
                        * exp(-max(along, 0.0) / reach);

                    // Broken into segments by the ripple, so it glitters
                    // instead of lying flat on the surface.
                    float segments = 0.55 + 0.45 * vnoise(
                        vec2(along * 5.5 - uTime * 0.55, across * 7.0)
                    );
                    float streak = lateral * longitudinal * segments;
                    color += uLampColor * streak * uLampStrength;
                }

                // Foam where the water meets the stones. Two noise scales do the
                // work: a coarse one pushes the waterline in and out so the band
                // is never a constant width, and a finer one eats holes in it so
                // it breaks into scum and bubbles rather than reading as a
                // painted ring. The slow sine underneath is the lap — the whole
                // collar breathing against the rocks.
                float edgeNoise = vnoise(nUv * 20.0 + flow * 1.4);
                float edgeFine = vnoise(nUv * 46.0 - flow * 2.2);
                // The wobble has to stay small relative to the band or the foam
                // creeps into open water — at 0.13 it reached halfway across the
                // pond and the whole surface went scummy.
                float shore = radial + (edgeNoise - 0.5) * 0.055
                    + (edgeFine - 0.5) * 0.025;

                float lap = smoothstep(0.87, 1.0, shore)
                    * (0.62 + 0.38 * sin(uTime * 0.9 + edgeNoise * 11.0));
                // Bubbles thin out away from the rocks.
                float bubbles = smoothstep(0.55, 0.9, vnoise(nUv * 38.0 + flow * 2.6))
                    * smoothstep(0.9, 1.0, shore);
                float flecks = step(0.72, vnoise(nUv * 30.0 + flow * 2.6))
                    * smoothstep(0.92, 1.0, shore) * 0.55;
                float patches = smoothstep(0.38, 0.72, edgeNoise);
                float foam = clamp(lap * patches * 0.65 + bubbles * 0.45 + flecks, 0.0, 1.0);
                // Foam is wet white, and it keeps a little of itself at night —
                // it is the brightest thing on the water once the sun is gone.
                vec3 foamColor = mix(vec3(0.90, 0.95, 0.93), vec3(0.55, 0.66, 0.72), uNightAmount);
                color = mix(color, foamColor, foam * 0.12 * (1.0 - uNightAmount * 0.65));

                // Optical thickness reveals the sand shelf and retains colour in
                // the deeper bowl; grazing views still reflect the sky.
                float transmission = exp(-waterDepth * 1.35);
                float alpha = 1.0 - transmission * (1.0 - fresnel);
                alpha = max(alpha, foam * 0.48);
                // A wide, noise-broken fade. The old 0.91-1.0 ramp finished in a
                // tenth of the radius, which put a crisp arc exactly where the
                // water meets the stones.
                float organicEdge = radial + (edgeNoise - 0.5) * 0.07
                    + (edgeFine - 0.5) * 0.03;
                alpha *= 1.0 - smoothstep(0.87, 1.01, organicEdge);
                // Where the bank is mirrored the surface is a mirror, not a
                // window. The band lives in exactly the outer tenth the fade
                // above dissolves, so it gets a much later fade of its own —
                // otherwise the pale bed shows through and the band is lost.
                alpha = max(alpha, bankMask * 0.82
                    * (1.0 - smoothstep(0.95, 1.02, organicEdge)));

                // NaN scrub. One NaN pixel from this material walks through
                // the bloom mip chain and wipes the whole frame white (the
                // pond-approach flicker). NaN fails every self-comparison,
                // so each channel falls back to the calm deep colour, and
                // clamp() — which may pass NaN through — runs only after.
                color = vec3(
                    color.r == color.r ? color.r : 0.12,
                    color.g == color.g ? color.g : 0.3,
                    color.b == color.b ? color.b : 0.36
                );
                color = clamp(color, vec3(0.0), vec3(4.0));
                alpha = alpha == alpha ? clamp(alpha, 0.0, 1.0) : 0.8;
                float groundEdge = length(vWorldPos.xz - uEdgeCenter);
                alpha *= 1.0 - smoothstep(uEdgeRadius - 0.4, uEdgeRadius + uEdgeFade * 0.4, groundEdge);
                alpha *= uReveal;
                gl_FragColor = vec4(color, alpha);
                #include <colorspace_fragment>
            }
        `})}const Ge=2.5,V=.105,se=V-He,it=V+.018,ka=2*-He/(3.55-Pt),lt=1.9;function Sa(e,{segments:a=48,rings:o=4,heightAt:n=()=>0}={}){const u=[0,0,n(0)],t=[.5,.5],s=[];for(let l=1;l<=o;l+=1){const r=l/o,x=n(e*r);for(let M=0;M<a;M+=1){const A=M/a*Math.PI*2,B=Math.cos(A),L=Math.sin(A),T=ee(-A,e*r);u.push(T.x,-T.z,x),t.push(.5+B*r*.5,.5+L*r*.5)}}for(let l=0;l<a;l+=1)s.push(0,1+l,1+(l+1)%a);for(let l=2;l<=o;l+=1){const r=1+(l-2)*a,x=1+(l-1)*a;for(let M=0;M<a;M+=1){const A=(M+1)%a,B=r+M,L=r+A,T=x+M,Y=x+A;s.push(B,T,L,L,T,Y)}}const i=new jt;return i.setIndex(s),i.setAttribute("position",new $e(u,3)),i.setAttribute("uv",new $e(t,2)),i.computeVertexNormals(),i.computeBoundingSphere(),i}const Ra=Sa(Ge,{segments:128,rings:9});function Pa(e,a){return te(_(e,a))+se}const Ie=1.85,ct=[...Array.from({length:8},(e,a)=>Ie*a/8),...Array.from({length:31},(e,a)=>{const o=a/30,n=o*o*.35+o*.65;return Ie+(Ht-Ie)*n})];function Ca({segments:e=176}={}){const a=[],o=[],n=ct.length-1;for(let t=0;t<=n;t+=1){const s=ct[t],i=te(s);for(let l=0;l<e;l+=1){const r=l/e*Math.PI*2,x=ee(r,s);a.push(x.x,i,x.z)}}for(let t=0;t<n;t+=1){const s=t*e,i=(t+1)*e;for(let l=0;l<e;l+=1){const r=(l+1)%e;o.push(s+l,s+r,i+l),o.push(s+r,i+r,i+l)}}const u=new jt;return u.setIndex(o),u.setAttribute("position",new $e(a,3)),u.computeVertexNormals(),u.computeBoundingSphere(),u}const ja=Ca(),ht=["#857e70","#8f8676","#7a7466","#968d7c","#6f6a5d"];function Aa(){const e=Pe(10095905),a=[],o=(t,s,i,l)=>{const r=ee(t,s),x=te(s)+se,M=i*(.55+e()*.25);a.push({x:r.x,z:r.z,y:x+M*(.35-l*1.1),sx:i*(.95+e()*.35),sy:M,sz:i*(.95+e()*.35),rx:(e()-.5)*.6,ry:e()*Math.PI*2,rz:(e()-.5)*.6,color:ht[Math.floor(e()*ht.length)]})},n=-.16,u=t=>Math.abs(y.euclideanModulo(t-n+Math.PI,Math.PI*2)-Math.PI)<.55;for(const t of[.55,1.2,1.75,2.4,2.95,3.6,4.2,4.85,5.45]){const s=t+(e()-.5)*.18,i=2.55+e()*.3;o(s,i,.3+e()*.22,.5);const l=Math.floor(e()*3);for(let r=0;r<l;r+=1)o(s+(e()-.5)*.22,i+(e()-.5)*.25,.12+e()*.12,.4)}for(const t of[1,2.2,3.3,4.5,5.6])e()<.25||o(t+(e()-.5)*.2,2.34+e()*.14,.14+e()*.1,.35);for(let t=a.length-1;t>=0;t-=1){const s=a[t],i=Math.atan2(s.z/X.z,s.x/X.x);u(i)&&s.sx>.2&&a.splice(t,1)}return[3.4,3,2.62].forEach((t,s)=>{const i=ee(n+(s-1)*.035,t),l=.34-s*.03;a.push({x:i.x,z:i.z,y:te(t)+se+.005,sx:l*1.15,sy:l*.16,sz:l,rx:(e()-.5)*.08,ry:e()*Math.PI,rz:(e()-.5)*.08,color:"#9a917f"})}),a}const ie=Aa(),Ta=ie.map(e=>new Ae().setFromEuler(new Oe(e.rx,e.ry,e.rz))),dt=new je,ut=new j,Ue=new j;function Da(){const e=new na(1,1),a=e.attributes.position,o=new j,n=r=>{const x=Math.sin(r.x*12.9898+r.y*78.233+r.z*37.719)*43758.5453;return x-Math.floor(x)};for(let r=0;r<a.count;r+=1){o.fromBufferAttribute(a,r);const x=.8+n(o)*.34;o.multiplyScalar(x),o.y<-.35&&(o.y=-.35+(o.y+.35)*.4),a.setXYZ(r,o.x,o.y,o.z)}e.computeVertexNormals();const u=new Float32Array(a.count*3),t=new U("#aebf86"),s=new U("#ffffff"),i=new U,l=e.attributes.normal;for(let r=0;r<a.count;r+=1){const x=l.getY(r);o.fromBufferAttribute(a,r);const M=y.smoothstep(x,.45,.85)*(.55+n(o)*.45);i.copy(s).lerp(t,M),u[r*3]=i.r,u[r*3+1]=i.g,u[r*3+2]=i.b}return e.setAttribute("color",new ra(u,3)),e}function Ea(){const e=Da(),a=new Ce({roughness:1,flatShading:!0,vertexColors:!0}),o=new Kt(e,a,ie.length),n=new je,u=new Ae,t=new Oe,s=new j,i=new j,l=new U;return ie.forEach((r,x)=>{s.set(r.x,r.y,r.z),t.set(r.rx,r.ry,r.rz),u.setFromEuler(t),i.set(r.sx,r.sy,r.sz),n.compose(s,u,i),o.setMatrixAt(x,n),o.setColorAt(x,l.set(r.color))}),o.instanceMatrix.needsUpdate=!0,o.instanceColor&&(o.instanceColor.needsUpdate=!0),o.castShadow=!0,o.receiveShadow=!0,o}const pt=new j,mt=new j,Wa=new U("#184d55").multiplyScalar(.9),Be=48,Fa=new Vt(1,6,4),ft=new Ye({color:"#cfeef3",transparent:!0,opacity:0,depthWrite:!1}),Na=5.2,gt=new je,vt=new j,xt=new j,Ia=new Ae,ge=8,Ua=new Ot(.06,.12,32),Ba=new Ye({color:"#d8ebe5",transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1});function La(){const e=document.createElement("canvas");e.width=128,e.height=128;const a=e.getContext("2d"),o=a.createRadialGradient(64,64,0,64,64,64);o.addColorStop(0,"rgba(232, 242, 236, 0.0)"),o.addColorStop(.34,"rgba(232, 242, 236, 0.30)"),o.addColorStop(.52,"rgba(226, 238, 234, 0.20)"),o.addColorStop(.78,"rgba(220, 234, 232, 0.05)"),o.addColorStop(1,"rgba(220, 234, 232, 0.0)"),a.fillStyle=o,a.fillRect(0,0,128,128);const n=new Ve(e);return n.colorSpace=Xe,n.minFilter=At,n.generateMipmaps=!1,n.wrapS=at,n.wrapT=at,n}const $a=La();function Za(){const e=document.createElement("canvas");e.width=128,e.height=128;const a=e.getContext("2d"),o=a.createRadialGradient(64,64,0,64,64,64);o.addColorStop(0,"rgba(255, 246, 214, 0.95)"),o.addColorStop(.22,"rgba(255, 216, 150, 0.72)"),o.addColorStop(.52,"rgba(255, 176, 102, 0.30)"),o.addColorStop(.78,"rgba(255, 150, 80, 0.08)"),o.addColorStop(1,"rgba(255, 150, 80, 0.0)"),a.fillStyle=o,a.fillRect(0,0,128,128);const n=new Ve(e);return n.colorSpace=Xe,n.minFilter=At,n.generateMipmaps=!1,n}const Ga=Za(),Ha=new qt({map:Ga,transparent:!0,depthWrite:!1,blending:oa,opacity:.9}),Ya=new Xt(.86,.86),Oa=new Ye({map:$a,transparent:!0,opacity:.85,depthWrite:!1}),I=.11,Va=.24,wt=I*Math.SQRT2,Xa=[[-I,-I],[I,-I],[-I,I],[I,I]];function qa(){const e=document.createElement("canvas");e.width=512,e.height=128;const a=e.getContext("2d"),o=Pe(28832);for(let u=0;u<4;u+=1){const t=u*128;a.fillStyle="#f1e4c6",a.fillRect(t,0,128,128),a.globalAlpha=.18,a.strokeStyle="#c9b48c",a.lineWidth=1;for(let s=0;s<26;s+=1){const i=o()*128;a.beginPath(),a.moveTo(t+o()*40,i),a.quadraticCurveTo(t+64,i+(o()-.5)*10,t+88+o()*40,i+(o()-.5)*6),a.stroke()}if(a.globalAlpha=.22,a.strokeStyle="#8a6f4b",a.lineWidth=8,a.strokeRect(t+4,4,120,120),a.globalAlpha=.85,a.strokeStyle="#a8432c",a.fillStyle="#a8432c",a.lineCap="round",u%2===0){a.lineWidth=5;for(let s=0;s<3;s+=1){const i=48+s*15;a.beginPath(),a.moveTo(t+32,i),a.bezierCurveTo(t+48,i-10,t+56,i+10,t+64,i),a.bezierCurveTo(t+72,i-10,t+80,i+10,t+96,i),a.stroke()}}else a.beginPath(),a.arc(t+64,60,18,0,Math.PI*2),a.fill(),a.globalAlpha=.5,a.lineWidth=3,a.beginPath(),a.moveTo(t+38,92),a.lineTo(t+90,92),a.stroke();a.globalAlpha=1}const n=new Ve(e);return n.colorSpace=Xe,n.anisotropy=4,n}const yt=qa(),_a=new Ce({map:yt,emissiveMap:yt,emissive:new U(la),emissiveIntensity:.16,roughness:.9,side:Ct}),ke=new Ce({color:"#3f2e21",roughness:.8}),bt=1.75,zt=-.55,Le=[{x:.92,z:.58,scale:.075,tilt:.4,turn:1.2,color:"#7d7668"},{x:-.5,z:1.28,scale:.055,tilt:.9,turn:3.4,color:"#8a8172"},{x:1.55,z:-.35,scale:.09,tilt:.2,turn:5.1,color:"#6e6a5c"},{x:-1.35,z:-.85,scale:.06,tilt:1.3,turn:.7,color:"#93876f"},{x:.15,z:1.72,scale:.07,tilt:.6,turn:2.2,color:"#7a7263"},{x:-1.8,z:.55,scale:.08,tilt:.3,turn:4.3,color:"#857b6a"},{x:.55,z:-1.62,scale:.05,tilt:1.1,turn:1.8,color:"#8f8474"},{x:-.15,z:-.5,scale:.045,tilt:.8,turn:3.9,color:"#6f6b5e"},{x:1.05,z:1.35,scale:.06,tilt:.5,turn:.3,color:"#7b7365"}].map(e=>({...e,x:e.x*X.x,z:e.z*X.z}));function Mt(e){e.updateWorldMatrix(!0,!1);const a=e.geometry.clone();a.applyMatrix4(e.matrixWorld);for(const n of Object.keys(a.attributes))n!=="position"&&n!=="normal"&&n!=="uv"&&a.deleteAttribute(n);a.computeBoundingBox();const o=a.boundingBox;return a.translate(-(o.min.x+o.max.x)/2,-o.min.y,-(o.min.z+o.max.z)/2),a}function kt(e,a,o,n,u,t){const s=e.clone();return s.applyMatrix4(new je().compose(new j(a,o,n),new Ae().setFromEuler(new Oe(0,u,0)),new j(t,t,t))),s}const St=[{proto:0,x:-.55,z:-.7,rotationY:.6,scale:1.15},{proto:1,x:.4,z:-1.05,rotationY:2.3,scale:.9},{proto:2,x:-1.05,z:.35,rotationY:4.1,scale:1},{proto:0,x:.95,z:.55,rotationY:1.2,scale:.82},{proto:2,x:-.2,z:1.2,rotationY:5,scale:1.05},{proto:1,x:-.9,z:2.05,rotationY:3.2,scale:.95},{proto:0,x:-.45,z:2.55,rotationY:.9,scale:.78}].map(e=>({...e,x:e.x*X.x,z:e.z*X.z})),Rt=[{angle:1.15,radius:2.34,count:5},{angle:3.95,radius:2.4,count:4},{angle:.55,radius:2.42,count:3},{angle:5.2,radius:2.3,count:4},{angle:2.6,radius:2.36,count:4},{angle:4.6,radius:2.4,count:3}];function no({revealRef:e}){const a=w.useMemo(()=>Ma(),[]),o=w.useMemo(()=>Ea(),[]),{scene:n,animations:u}=Je(sa),{scene:t}=Je(ia),s=w.useMemo(()=>{const c=[],d=[];let g=null;t.traverse(h=>{if(!h.isMesh)return;g||(g=h.material);const p=h.name.toLowerCase();p.includes("lily")?c.push(Mt(h)):p.includes("cattail")&&d.push(Mt(h))});const R=g?g.clone():new Ce;R.side=Ct;const E=St.map(h=>({x:h.x,y:V+.006,z:h.z,geometry:kt(c[h.proto%c.length],0,0,0,h.rotationY,h.scale)})),F=Pe(212302353),m=Rt.map(h=>{const{x:p,z:b}=ee(h.angle,h.radius),k=te(_(p,b))+se,q=[];for(let J=0;J<h.count;J+=1){const f=d[Math.floor(F()*d.length)],C=p+(F()-.5)*.42,P=b+(F()-.5)*.42;q.push(kt(f,C-p,te(_(C,P))+se-.02-k,P-b,F()*Math.PI*2,.55+F()*.25))}const ze=Yt(q,!1);return q.forEach(J=>J.dispose()),{x:p,y:k,z:b,geometry:ze}});return c.forEach(h=>h.dispose()),d.forEach(h=>h.dispose()),{lilyPads:E,cattailClumps:m,material:R}},[t]),i=w.useMemo(()=>ve.map((c,d)=>ga(n,u,{phase:d*.37,body:c.body})),[n,u]),l=w.useMemo(()=>xa(),[]),r=w.useRef(),x=w.useRef(),M=w.useRef(),A=w.useRef(),B=w.useRef(),L=w.useRef([]),T=w.useRef([]),Y=w.useRef([]),S=w.useRef(),G=w.useMemo(()=>({rocks:ie.map(oe),cattails:Rt.map(oe),lilies:St.map(oe),pebbles:Le.map(oe),swimmers:ve.map(oe),lantern:oe()}),[]),H=w.useRef(),$=w.useRef(),we=et(),ae=w.useRef(),le=w.useRef(0),ce=w.useRef(e?0:1),he=w.useRef([]),de=w.useRef([]).current,K=w.useRef(-1),D=w.useRef(0),O=w.useRef(),Q=w.useRef(0),N=w.useRef(Array.from({length:Be},()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,span:1,size:1}))),ue=(c,d,g=1,R=14)=>{const E=N.current;for(let F=0;F<R;F+=1){const m=Q.current%Be;Q.current+=1;const h=E[m],p=Math.random()*Math.PI*2,b=(.35+Math.random()*.85)*g;h.x=c+Math.cos(p)*.03,h.z=d+Math.sin(p)*.03,h.y=V+.01,h.vx=Math.cos(p)*b,h.vz=Math.sin(p)*b,h.vy=(1.5+Math.random()*1.5)*g,h.span=.42+Math.random()*.34,h.life=h.span,h.size=(.012+Math.random()*.016)*Math.min(g,1.25)}},pe=w.useRef([]),me=w.useRef(0),ye=w.useMemo(()=>Array.from({length:ge},()=>Ba.clone()),[]),Ke=w.useRef(Array.from({length:ge},()=>({active:!1,x:0,z:0,startTime:0,duration:.65,maxScale:3}))),Te=(c,d,g=3,R=.65)=>{const E=Ke.current,F=me.current%ge;me.current+=1;const m=E[F];m.active=!0,m.x=c,m.z=d,m.startTime=D.current,m.duration=R,m.maxScale=g};w.useEffect(()=>()=>{a.dispose(),o.geometry.dispose(),o.material.dispose(),o.dispose(),s.lilyPads.forEach(c=>c.geometry.dispose()),s.cattailClumps.forEach(c=>c.geometry.dispose()),s.material.dispose(),i.forEach(c=>c.dispose()),ye.forEach(c=>c.dispose())},[a,o,s,i,ye]);const Qe=w.useRef(!1),Nt=(c,d)=>{const g=Zt(c),R=Me.x,E=Me.z;let F=!Qe.current;ie.forEach((m,h)=>{const p=G.rocks[h];ne(p,R+m.x,E+m.z,g),Gt(p)||(F=!0),re(p,d)}),F&&(Qe.current=!0,ie.forEach((m,h)=>{const p=fe(G.rocks[h],m.sy*1.6+.06);ut.set(m.x,m.y+p.offsetY,m.z),p.shown?Ue.set(m.sx*p.lateral,m.sy*p.grow,m.sz*p.lateral):Ue.setScalar(0),dt.compose(ut,Ta[h],Ue),o.setMatrixAt(h,dt)}),o.instanceMatrix.needsUpdate=!0),s.cattailClumps.forEach((m,h)=>{const p=G.cattails[h];ne(p,R+m.x,E+m.z,g),re(p,d);const b=L.current[h];if(!b)return;const k=fe(p,.6);b.visible=k.shown,b.scale.set(k.lateral,k.grow,k.lateral),b.position.y=m.y+k.offsetY}),s.lilyPads.forEach((m,h)=>{const p=G.lilies[h];ne(p,R+m.x,E+m.z,g),re(p,d);const b=T.current[h];if(!b)return;const k=fe(p,0);b.visible=k.shown,b.scale.set(k.lateral,1,k.lateral)}),Le.forEach((m,h)=>{const p=G.pebbles[h];ne(p,R+m.x,E+m.z,g),re(p,d);const b=Y.current[h];if(!b)return;const k=fe(p,0);b.visible=k.shown,b.scale.set(m.scale*k.lateral,m.scale*.55*k.grow,m.scale*k.lateral)}),ve.forEach((m,h)=>{const p=G.swimmers[h],b=l[h];ne(p,R+b.x,E+b.z,g),re(p,d);const k=he.current[h];if(!k)return;const q=y.clamp(p.value,0,1);k.visible=q>.05,k.scale.setScalar(m.scale*q)});{const m=G.lantern;ne(m,R+bt,E+zt,g),re(m,d);const h=S.current;if(h){const p=fe(m,.35);h.visible=p.shown,h.scale.set(p.lateral,p.grow,p.lateral),h.position.y=p.offsetY}}},be=w.useRef(null);return It((c,d)=>{const g=c.clock.elapsedTime;if(be.current===null&&(be.current=g),be.current+=Math.min(d,.05)*(1-W.sleepCalm*.75),$.current){const f=et();f&&$.current.material!==f&&($.current.material=f),$.current.visible=!!f}const R=Ut.getState(),E=R.windParameters,F=e?.current??1;ce.current=Ee?F:y.damp(ce.current,F,7,d),y.clamp(ce.current,0,1),H.current&&(H.current.visible=!0),a.uniforms.uReveal.value=1,Nt(R,d),le.current=y.damp(le.current,W.rainAmount,2.1,d),a.uniforms.uTime.value=be.current,a.uniforms.uWindDir.value.set(Math.cos(E.direction),Math.sin(E.direction)),a.uniforms.uWindSpeed.value=(.18+E.strength*.28)*Math.max(.2,E.speed),a.uniforms.uRainAmount.value=le.current,a.uniforms.uNightAmount.value=R.nightAmount??0,a.uniforms.uSunDir.value.set(W.sunDirX,W.sunDirY,W.sunDirZ),a.uniforms.uSkyHorizon.value.setRGB(W.skyHorizonR,W.skyHorizonG,W.skyHorizonB),a.uniforms.uSkyZenith.value.setRGB(W.skyZenithR,W.skyZenithG,W.skyZenithB),a.uniforms.uSunColor.value.setRGB(W.sunColorR,W.sunColorG,W.sunColorB),a.uniforms.uBank.value.setRGB(W.leavesColorR*.34,W.leavesColorG*.38,W.leavesColorB*.32),x.current?(x.current.getWorldPosition(pt),a.uniforms.uLampPos.value.copy(pt),a.uniforms.uLampStrength.value=y.clamp((R.nightAmount??0)*1.15,0,1)*.85):a.uniforms.uLampStrength.value=0,r.current&&(r.current.position.y=it+Math.sin(g*1.1)*.018,r.current.rotation.y=g*.15,r.current.rotation.x=Math.sin(g*.85)*.06,r.current.rotation.z=Math.sin(g*.7)*.06);{const f=y.smoothstep(R.nightAmount??0,.12,.78);x.current&&(x.current.intensity=f*1),A.current&&(A.current.material.opacity=.12+f*.78),M.current&&(M.current.material.emissiveIntensity=.13+f*.7)}B.current&&(B.current.rotation.y=Math.sin(g*.16)*.012,B.current.position.y=Math.sin(g*.55)*.003),D.current=g;const m=N.current,h=O.current;if(h){const f=Math.min(d,.05);let C=0;for(let P=0;P<m.length;P+=1){const z=m[P];z.life>0&&(z.life-=f,z.vy-=Na*f,z.x+=z.vx*f,z.y+=z.vy*f,z.z+=z.vz*f,z.y<=V&&(z.life=0));const De=Math.max(z.life,0)/z.span;De>C&&(C=De),vt.set(z.x,z.y,z.z),xt.setScalar(De>0?z.size:0),gt.compose(vt,Ia,xt),h.setMatrixAt(P,gt)}h.instanceMatrix.needsUpdate=!0,h.visible=C>0,ft.opacity=Math.min(1,C*1.5)*.9}const p=Ke.current;for(let f=0;f<ge;f++){const C=p[f],P=pe.current[f];if(!P)continue;if(!C.active){P.visible=!1;continue}const z=(g-C.startTime)/C.duration;z>=1?(C.active=!1,P.visible=!1):(P.visible=!0,P.position.set(C.x,V+.006,C.z),P.scale.setScalar(y.lerp(.5,C.maxScale,z)),ye[f].opacity=(1-z)*(1-z)*.55)}const b=R.ballPosition,k=b.x-Me.x,q=b.z-Me.z,ze=_(k,q)<Bt+.8;ze&&!Ee?(K.current<0&&(K.current=g+6+Math.random()*6),g>=K.current&&(ya(l),K.current=g+18+Math.random()*16)):K.current=-1;const J=Math.min(d,.05);de.length=0,ba(l,J,{visitor:ze?{x:k,z:q}:null,calm:Ee,events:de});for(const f of de)f.type==="sip"?Te(f.x,f.z,1.7,1.5):f.type==="leap-out"?(ue(f.x,f.z,.95,14),Te(f.x,f.z,2.7,.9)):(ue(f.x,f.z,1.3,18),Te(f.x,f.z,3.4,1.1));ae.current&&(ae.current.localToWorld(mt.set(0,V,0)),Ze.uPondWaterY.value=mt.y),Ze.uPondScatter.value.copy(Wa).multiplyScalar(1-.85*(R.nightAmount??0)),l.forEach((f,C)=>{const P=he.current[C];if(P&&(P.position.set(f.x,V-f.depth,f.z),P.rotation.set(f.roll,-f.heading,f.pitch,"YXZ"),P.visible)){const z=i[C];z.action.setEffectiveTimeScale(f.animRate),z.mixer.update(J)}})}),v.jsxs(v.Fragment,{children:[v.jsx("mesh",{ref:$,geometry:ja,material:we??void 0,visible:!!we,receiveShadow:!0,dispose:null}),v.jsxs("group",{position:[0,-se,0],children:[v.jsxs("group",{ref:H,visible:!e,children:[Le.map((c,d)=>v.jsxs("mesh",{ref:g=>{Y.current[d]=g},position:[c.x,Pa(c.x,c.z)+c.scale*.34,c.z],rotation:[c.tilt,c.turn,0],scale:[c.scale,c.scale*.55,c.scale],children:[v.jsx("dodecahedronGeometry",{args:[1,0]}),v.jsx("meshStandardMaterial",{color:c.color,roughness:.9,flatShading:!0})]},d)),v.jsx("mesh",{ref:Lt,name:"rain-pond",geometry:Ra,position:[0,V,0],rotation:[-Math.PI/2,0,0],renderOrder:1,dispose:null,children:v.jsx("primitive",{object:a,attach:"material"})})]}),v.jsxs("group",{ref:ae,children:[v.jsx("primitive",{object:o}),s.cattailClumps.map((c,d)=>v.jsx("mesh",{ref:g=>{L.current[d]=g},geometry:c.geometry,material:s.material,position:[c.x,c.y,c.z],visible:!1,castShadow:!0,receiveShadow:!0,dispose:null},`cattail-${d}`)),v.jsx("group",{ref:B,children:s.lilyPads.map((c,d)=>v.jsx("mesh",{ref:g=>{T.current[d]=g},geometry:c.geometry,material:s.material,position:[c.x,c.y,c.z],visible:!1,receiveShadow:!0,renderOrder:2,dispose:null},`lily-${d}`))}),ve.map((c,d)=>v.jsx("group",{ref:g=>{he.current[d]=g,g&&(g.rotation.order="YXZ")},scale:c.scale,dispose:null,children:v.jsx("primitive",{object:i[d].model,dispose:null})},`swimmer-${d}`)),Array.from({length:ge}).map((c,d)=>v.jsx("mesh",{ref:g=>{pe.current[d]=g},geometry:Ua,material:ye[d],rotation:[-Math.PI/2,0,0],visible:!1,dispose:null},`fish-ripple-${d}`)),v.jsx("instancedMesh",{ref:O,args:[Fa,ft,Be],frustumCulled:!1,visible:!1,dispose:null}),v.jsxs("group",{ref:S,position:[bt,0,zt],visible:!1,children:[v.jsx("mesh",{position:[0,V+.013,0],rotation:[-Math.PI/2,0,0],geometry:Ya,material:Oa,renderOrder:2,dispose:null}),v.jsxs("group",{ref:r,position:[0,it,0],children:[v.jsxs("group",{scale:1.2,children:[v.jsxs("mesh",{position:[0,-.004,0],castShadow:!0,receiveShadow:!0,children:[v.jsx("boxGeometry",{args:[.3,.03,.3]}),v.jsx("meshStandardMaterial",{color:"#6d4c31",roughness:.9})]}),[-.09,.09].map(c=>v.jsxs("mesh",{position:[c,-.026,0],children:[v.jsx("boxGeometry",{args:[.05,.018,.31]}),v.jsx("meshStandardMaterial",{color:"#553a26",roughness:.95})]},c)),v.jsx("mesh",{ref:M,position:[0,.137,0],rotation:[0,Math.PI/4,0],material:_a,castShadow:!0,children:v.jsx("cylinderGeometry",{args:[wt,wt,Va,4,1,!0]})}),Xa.map(([c,d])=>v.jsx("mesh",{position:[c,.137,d],material:ke,children:v.jsx("boxGeometry",{args:[.016,.262,.016]})},`post-${c}-${d}`)),[.022,.262].map(c=>[-1,1].map(d=>v.jsxs("group",{children:[v.jsx("mesh",{position:[0,c,d*I],material:ke,children:v.jsx("boxGeometry",{args:[I*2+.016,.014,.014]})}),v.jsx("mesh",{position:[d*I,c,0],material:ke,children:v.jsx("boxGeometry",{args:[.014,.014,I*2+.016]})})]},`rail-${c}-${d}`))),[Math.PI/4,-Math.PI/4].map(c=>v.jsx("mesh",{position:[0,.268,0],rotation:[0,c,0],material:ke,children:v.jsx("boxGeometry",{args:[I*2.8,.008,.008]})},c)),v.jsx("sprite",{ref:A,position:[0,.13,0],scale:[.28,.32,1],material:Ha})]}),v.jsx($t,{ref:x,position:[0,.16,0],color:"#ffb066",intensity:0,distance:3.2,decay:2})]})]})]})]})]})}export{no as default};
