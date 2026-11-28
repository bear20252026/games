import{N as h,T as x,c as $}from"./react-BbqnMepd.js";import{o as ce,ab as De,ac as _e,a as M,Z as F,ad as ke,l as ye,ae as Oe,af as Ie,X as Y,ag as $e,ah as N,ai as fe,t as W,a4 as Ue,E as ee,aj as be,e as Ee,aa as Ne,v as oe}from"./main-CHq3HDKI.js";import{V as J,Y as R,j as re,Q as Be,b as Se,aN as He,ap as ie,aO as de,a8 as D,a5 as ne,a6 as pe,J as Xe,w as j,az as Ge,an as qe,o as Ye,D as Ze,ad as Qe,G as Ve,v as me,$ as te}from"./three-DlAHX5Z_.js";import"./rapier-BcgqzzOj.js";import"./gsap-D1AWpUut.js";import"./home-C-bt6R1Y.js";import"./modulepreload-polyfill-B5Qt9EMX.js";const Z=_e,Q={uRainAmbient:{value:new Se},uRainLamps:{value:De},uRainLampOn:{value:0},uRainFire:{value:new Be},uRainFlash:{value:0}},Je=1.15,Ke=.3;let he=-1;function Me(e){if(e===he)return;he=e;const a=Q,d=F.getState().nightAmount??0;a.uRainAmbient.value.setRGB(M.hemiSkyR,M.hemiSkyG,M.hemiSkyB,Ze).multiplyScalar(M.hemiStrength*D.lerp(Je,Ke,d)),a.uRainLampOn.value=Ue.night,a.uRainFire.value.set(M.fireX,M.fireY,M.fireZ,M.fireStrength),a.uRainFlash.value=M.lightningFlash}const se=`
    uniform vec3 uRainAmbient;
    uniform vec4 uRainLamps[RAIN_LAMP_COUNT];
    uniform float uRainLampOn;
    uniform vec4 uRainFire;
    uniform float uRainFlash;

    // Lit from a point: inverse-square round the source, windowed off at
    // its reach, plus a backlit glint where the drop sits between the eye
    // and the light.
    float rainPointLight(vec3 p, vec3 viewDir, vec3 source, float reach) {
        vec3 toSource = source - p;
        float d2 = dot(toSource, toSource);
        float d = sqrt(d2);
        float window = 1.0 - smoothstep(reach * 0.55, reach, d);
        float direct = 1.0 / (1.0 + d2 * 0.7);
        float behind = pow(max(dot(viewDir, toSource / max(d, 0.001)), 0.0), 8.0);
        return (direct + behind * 1.2) * window;
    }

    vec3 rainLight(vec3 p, out float lit) {
        vec3 viewDir = normalize(p - cameraPosition);
        vec3 light = vec3(0.0);
        if (uRainLampOn > 0.001) {
            float lamps = 0.0;
            for (int i = 0; i < RAIN_LAMP_COUNT; i++) {
                vec4 lamp = uRainLamps[i];
                if (lamp.w <= 0.0) continue;
                lamps += rainPointLight(p, viewDir, lamp.xyz, 4.5) * lamp.w;
            }
            light += vec3(1.0, 0.66, 0.36) * lamps * 2.2 * uRainLampOn;
        }
        if (uRainFire.w > 0.001) {
            light += vec3(1.0, 0.5, 0.2) * rainPointLight(p, viewDir, uRainFire.xyz, 3.5) * uRainFire.w * 2.4;
        }
        lit = dot(light, vec3(0.3, 0.5, 0.2));
        return uRainAmbient + light + vec3(0.75, 0.82, 1.0) * uRainFlash;
    }
`,et=[{key:"far",count:W?380:820,radius:W?11:16,height:18,top:12,minSpeed:8,maxSpeed:13,minLength:.2,maxLength:.5,width:.01,opacity:W?.42:.5,wind:.085,order:7,seed:17},{key:"near",count:W?104:220,radius:W?6:8,height:13,top:8.5,minSpeed:14,maxSpeed:21,minLength:.58,maxLength:1.2,width:.014,opacity:W?.6:.72,wind:.145,order:8,seed:701}],tt={perLamp:W?16:30,radius:2.3,above:2.4,span:5.2,minSpeed:9,maxSpeed:14,minLength:.3,maxLength:.62,width:.011,opacity:.55,wind:.1,order:8,seed:1301};function k(e){const a=Math.sin(e*91.317+17.71)*43758.5453;return a-Math.floor(a)}const Ae=`
    uniform float uTime;
    uniform vec2 uSpeed;
    uniform vec2 uLength;
    uniform float uWind;
    uniform float uWidth;
    uniform float uOpacity;
    uniform vec2 uResolution;

    attribute vec4 aDrop;   // x, z in -1..1, phase, speed
    attribute vec3 aShape;  // length, brightness, sway phase
    attribute vec2 aCorner; // side -1..1, 0 tail .. 1 head

    varying vec3 vColor;
    varying float vAlpha;
    varying vec2 vCorner;
    varying float vSoft;

    ${se}

    vec3 streakHead(vec3 tail, float len) {
        return tail + vec3(-(uWind + 0.06), -1.0, 0.045) * len;
    }

    void hideStreak() {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        vColor = vec3(0.0);
        vAlpha = 0.0;
        vCorner = aCorner;
        vSoft = 0.0;
    }

    // Writes gl_Position; returns the streak's width on screen in pixels as
    // x and the width actually drawn (never under one pixel) as y.
    vec2 placeStreak(vec3 tail, vec3 head) {
        vec4 clipTail = projectionMatrix * viewMatrix * vec4(tail, 1.0);
        vec4 clipHead = projectionMatrix * viewMatrix * vec4(head, 1.0);
        vec4 clip = mix(clipTail, clipHead, aCorner.y);
        vec2 axis = (clipHead.xy / clipHead.w - clipTail.xy / clipTail.w) * uResolution;
        vec2 across = normalize(vec2(-axis.y, axis.x) + vec2(1e-5, 0.0));
        float pixels = uWidth * projectionMatrix[1][1] * 0.5 * uResolution.y / clip.w;
        float drawn = max(pixels, 1.0);
        clip.xy += across * aCorner.x * drawn / uResolution * clip.w;
        gl_Position = clip;
        vCorner = aCorner;
        vSoft = smoothstep(1.5, 4.0, drawn);
        return vec2(pixels, drawn);
    }

    bool behindCamera(vec3 tail, vec3 head) {
        return (projectionMatrix * viewMatrix * vec4(tail, 1.0)).w < 0.1
            || (projectionMatrix * viewMatrix * vec4(head, 1.0)).w < 0.1;
    }
`,at=`
    uniform vec3 uCenter;
    uniform float uRadius;
    uniform float uHeight;
    uniform float uTop;

    ${Ae}

    void main() {
        float speed = mix(uSpeed.x, uSpeed.y, aDrop.w);
        float len = mix(uLength.x, uLength.y, aShape.x);
        float fall = mod(aDrop.z * uHeight + uTime * speed, uHeight);

        // A fixed place in the world, wrapped into the box round the player.
        vec2 home = aDrop.xy * uRadius;
        vec2 rel = mod(home - uCenter.xz + uRadius, 2.0 * uRadius) - uRadius;

        float drift = fall * uWind;
        float sway = sin(uTime * 0.75 + aShape.z * 6.2831) * 0.055;
        vec3 tail = vec3(
            uCenter.x + rel.x - drift + sway,
            uCenter.y + uTop - fall,
            uCenter.z + rel.y + drift * 0.22
        );
        vec3 head = streakHead(tail, len);
        if (behindCamera(tail, head)) {
            hideStreak();
            return;
        }
        vec2 width = placeStreak(tail, head);

        float lit;
        vColor = rainLight(mix(tail, head, aCorner.y), lit);

        // Edge of the box, and drops so close to the lens they would smear
        // across half the frame.
        float edge = 1.0 - smoothstep(0.72, 1.0, length(rel) / uRadius);
        float nearLens = smoothstep(0.7, 2.2, gl_Position.w);
        float coverage = width.x / width.y;
        vAlpha = uOpacity * aShape.y * edge * nearLens * mix(coverage, 1.0, 0.35)
            * (1.0 + min(lit, 1.5) * 2.0);
    }
`,rt=`
    uniform float uRadius;
    uniform float uAbove;
    uniform float uSpan;

    attribute float aLamp;

    ${Ae}

    void main() {
        vec4 lamp = uRainLamps[int(aLamp)];
        if (lamp.w <= 0.0 || uOpacity <= 0.0) {
            hideStreak();
            return;
        }
        float speed = mix(uSpeed.x, uSpeed.y, aDrop.w);
        float len = mix(uLength.x, uLength.y, aShape.x);
        float fall = mod(aDrop.z * uSpan + uTime * speed, uSpan);
        float drift = fall * uWind;
        // Upwind by half the slant, so the cylinder of rain is centred on
        // the lamp halfway down rather than at the top.
        vec3 tail = vec3(
            lamp.x + aDrop.x * uRadius - drift + uSpan * uWind * 0.5,
            lamp.y + uAbove - fall,
            lamp.z + aDrop.y * uRadius + drift * 0.22
        );
        vec3 head = streakHead(tail, len);
        if (behindCamera(tail, head)) {
            hideStreak();
            return;
        }
        vec2 width = placeStreak(tail, head);

        float lit;
        vColor = rainLight(mix(tail, head, aCorner.y), lit);
        // In and out at the ends of the fall rather than popping.
        float ends = smoothstep(0.0, 0.7, fall) * (1.0 - smoothstep(uSpan - 0.9, uSpan, fall));
        float nearLens = smoothstep(0.7, 2.2, gl_Position.w);
        float coverage = width.x / width.y;
        vAlpha = uOpacity * aShape.y * ends * nearLens * mix(coverage, 1.0, 0.35)
            * min(lit * 3.0, 1.0) * lamp.w;
    }
`,it=`
    varying vec3 vColor;
    varying float vAlpha;
    varying vec2 vCorner;
    varying float vSoft;

    void main() {
        // Bright at the leading tip, trailing off behind it. Soft across only
        // where the streak is wide enough on screen to have an across; a
        // one-pixel line sampled off-centre would just flicker.
        float along = mix(0.2, 1.0, vCorner.y);
        float across = 1.0 - vCorner.x * vCorner.x * vSoft;
        float alpha = vAlpha * along * across;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(vColor, min(alpha, 0.95));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`;function Ce(e,a,d=0){const u=new Float32Array(e*4*4),n=new Float32Array(e*4*3),i=new Float32Array(e*4*2),t=d?new Float32Array(e*4):null,l=new Uint32Array(e*6),p=[[-1,0],[1,0],[-1,1],[1,1]];for(let c=0;c<e;c+=1){const s=c+a;let f=k(s+1)*2-1,g=k(s+41)*2-1;if(d){const m=f*Math.PI,y=Math.sqrt((g+1)/2);f=Math.cos(m)*y,g=Math.sin(m)*y}const w=[f,g,k(s+83),k(s+127)],v=[k(s+191),.72+k(s+311)*.28,k(s+239)];for(let m=0;m<4;m+=1){const y=c*4+m;u.set(w,y*4),n.set(v,y*3),i.set(p[m],y*2),t&&(t[y]=Math.floor(c/d))}l.set([c*4,c*4+2,c*4+1,c*4+1,c*4+2,c*4+3],c*6)}const r=new J;return r.setAttribute("position",new R(new Float32Array(e*4*3),3)),r.setAttribute("aDrop",new R(u,4)),r.setAttribute("aShape",new R(n,3)),r.setAttribute("aCorner",new R(i,2)),t&&r.setAttribute("aLamp",new R(t,1)),r.setIndex(new R(l,1)),r}function Re(e,a,d){return new re({defines:{RAIN_LAMP_COUNT:Z},uniforms:{...Q,...d,uTime:{value:0},uSpeed:{value:new te(e.minSpeed,e.maxSpeed)},uLength:{value:new te(e.minLength,e.maxLength)},uWind:{value:e.wind},uWidth:{value:e.width},uOpacity:{value:0},uResolution:{value:new te(1,1)}},vertexShader:a,fragmentShader:it,transparent:!0,depthWrite:!1})}function Pe(e,a,d,u,n,i,t=1){n.current=D.damp(n.current,M.rainAmount,2.25,a);const l=n.current*i.opacity*t;if(d.visible=l>.001,!d.visible)return!1;const p=e.clock.elapsedTime;Me(p);const r=u.uniforms;return r.uTime.value=p,r.uWind.value=i.wind+Math.sin(p*.28)*i.wind*.22,r.uOpacity.value=l,e.gl.getDrawingBufferSize(r.uResolution.value),!0}function nt({settings:e}){const a=h.useRef(),d=h.useRef(0),u=h.useMemo(()=>Ce(e.count,e.seed),[e]),n=h.useMemo(()=>Re(e,at,{uCenter:{value:new j},uRadius:{value:e.radius},uHeight:{value:e.height},uTop:{value:e.top}}),[e]);return h.useEffect(()=>()=>{u.dispose(),n.dispose()},[u,n]),$((i,t)=>{const l=a.current;!l||!Pe(i,t,l,n,d,e)||n.uniforms.uCenter.value.copy(F.getState().ballPosition)}),x.jsx("mesh",{ref:a,geometry:u,material:n,visible:!1,frustumCulled:!1,renderOrder:e.order})}function ot(){const e=tt,a=h.useRef(),d=h.useRef(0),u=h.useMemo(()=>Ce(Z*e.perLamp,e.seed,e.perLamp),[e]),n=h.useMemo(()=>Re(e,rt,{uRadius:{value:e.radius},uAbove:{value:e.above},uSpan:{value:e.span}}),[e]);return h.useEffect(()=>()=>{u.dispose(),n.dispose()},[u,n]),$((i,t)=>{const l=a.current;if(!l)return;const p=D.smoothstep(F.getState().nightAmount??0,.2,.7);Pe(i,t,l,n,d,e,p)}),x.jsx("mesh",{ref:a,geometry:u,material:n,visible:!1,frustumCulled:!1,renderOrder:e.order})}function st(){return x.jsxs(x.Fragment,{children:[et.map(e=>x.jsx(nt,{settings:e},e.key)),x.jsx(ot,{})]})}const O=W?44:96,ze=W?3:5,U=ze+1,Fe=.28,Le=.72,ve=9;function lt(e,a,d){e.surface=null;for(let u=0;u<6;u+=1){const n=Math.random()*Math.PI*2,i=Math.hypot(a.ballPosition.x-ee.x,a.ballPosition.z-ee.z)<7&&Math.random()<.55,t=i?ee:a.ballPosition,l=Math.sqrt(Math.random())*(i?2.05:8),p=t.x+Math.cos(n)*l,r=t.z+Math.sin(n)*l,c=be(p,r,a);if(c){e.x=p,e.z=r,e.y=c.point.y+.012,e.surface=c.object,e.water=c.object.name==="rain-pond";break}}e.start=d+Math.random()*.6,e.end=e.start+(e.water?Le:Fe)+.05}const ut=`
    uniform float uTime;
    uniform float uStrength;
    uniform float uPointScale;

    attribute vec4 aImpact;  // x, y, z, moment of impact
    attribute float aWater;  // 1 on the pond, -1 when there is no impact
    attribute vec4 aDrop;    // direction, speed out, speed up, size; size 0 is the incoming drop

    varying vec3 vColor;
    varying float vAlpha;

    ${se}

    void main() {
        float age = uTime - aImpact.w;
        vec3 p = aImpact.xyz;
        float life = 0.0;
        bool live = aWater > -0.5;

        if (aDrop.w <= 0.0) {
            // The drop coming in: the last tenth of a second before it hits.
            live = live && age > -0.09 && age < 0.0;
            p.y -= age * 7.0;
            life = 1.0 + age / 0.09;
        } else {
            // Thrown up and out, falling back under gravity. Water throws
            // them a little lower and wider than soil does.
            float up = aDrop.z * mix(1.0, 0.8, aWater);
            float land = up * 2.0 / 9.8;
            live = live && age >= 0.0 && age < land;
            life = age / land;
            vec2 out2 = vec2(cos(aDrop.x), sin(aDrop.x)) * aDrop.y * mix(1.0, 1.25, aWater) * age;
            p += vec3(out2.x, up * age - 4.9 * age * age, out2.y);
        }

        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float depth = max(-mvPosition.z, 0.2);
        float size = max(aDrop.w, 0.8);
        float pixels = uPointScale * size / depth;
        gl_PointSize = live && uStrength > 0.0 ? max(pixels, 1.5) : 0.0;

        float lit;
        vColor = rainLight(p, lit);
        float fade = aDrop.w <= 0.0 ? life : pow(1.0 - life, 0.6);
        vAlpha = live ? uStrength * fade * (0.55 + min(lit, 1.5) * 0.9) * min(pixels / 1.5, 1.0) : 0.0;
    }
`,ct=`
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = vAlpha * smoothstep(0.5, 0.15, d);
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(vColor, min(alpha, 0.95));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`,ft=`
    uniform float uTime;

    attribute vec4 aImpact;
    attribute float aWater;

    varying vec2 vUv;
    varying float vAge;
    varying float vWater;
    varying vec3 vColor;

    ${se}

    void main() {
        float life = aWater > 0.5 ? ${Le.toFixed(2)} : ${Fe.toFixed(2)};
        vAge = aWater < -0.5 ? -1.0 : (uTime - aImpact.w) / life;
        vWater = aWater;
        vUv = uv;
        // Wide and slow on water; a tight crown's worth on soil.
        float size = vAge < 0.0 || vAge > 1.0 ? 0.0 : (aWater > 0.5 ? 0.62 : 0.2);
        vec3 p = aImpact.xyz + vec3(position.x, 0.004, -position.y) * size;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        float lit;
        vColor = rainLight(aImpact.xyz + vec3(0.0, 0.05, 0.0), lit);
    }
`,dt=`
    uniform float uStrength;

    varying vec2 vUv;
    varying float vAge;
    varying float vWater;
    varying vec3 vColor;

    void main() {
        if (vAge < 0.0 || vAge > 1.0) discard;
        float r = length(vUv - 0.5);
        float radius = 0.03 + vAge * 0.4;
        float width = max(fwidth(r) * 1.3, 0.008);
        float crest = 1.0 - smoothstep(width, width * 2.0, abs(r - radius));
        float echo = 1.0 - smoothstep(width, width * 2.0, abs(r - radius * 0.66));
        float fade = smoothstep(0.0, 0.07, vAge) * pow(1.0 - vAge, 1.6);
        float ring = crest + echo * (vWater > 0.5 ? 0.3 : 0.0);
        // Soil takes a quick dark wet spot under the crown as well.
        float spot = vWater > 0.5 ? 0.0 : (1.0 - smoothstep(0.08, 0.22, r)) * (1.0 - vAge);
        float alpha = max(ring * 0.5, spot * 0.22) * fade * uStrength;
        if (alpha < 0.004) discard;
        vec3 color = mix(vColor * 0.2, vColor * 0.75, ring);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`;function pt(){const e=h.useRef(),a=h.useRef(),d=h.useRef(0),u=h.useMemo(()=>Array.from({length:O},()=>({start:0,end:-1,surface:null})),[]),n=h.useMemo(()=>{const t=O*U,l=new J,p=new Float32Array(t*4);for(let c=0;c<O;c+=1){const s=Math.random()*Math.PI*2;for(let f=0;f<U;f+=1){const g=(c*U+f)*4;f!==0&&(p[g]=s+f/ze*Math.PI*2+(Math.random()-.5)*.9,p[g+1]=.12+Math.random()*.34,p[g+2]=.6+Math.random()*.55,p[g+3]=.7+Math.random()*.6)}}l.setAttribute("position",new R(new Float32Array(t*3),3)),l.setAttribute("aImpact",new R(new Float32Array(t*4),4)),l.setAttribute("aWater",new R(new Float32Array(t).fill(-1),1)),l.setAttribute("aDrop",new R(p,4));const r=new re({defines:{RAIN_LAMP_COUNT:Z},uniforms:{...Q,uTime:{value:0},uStrength:{value:0},uPointScale:{value:ve}},vertexShader:ut,fragmentShader:ct,transparent:!0,depthWrite:!1});return{geometry:l,material:r}},[]),i=h.useMemo(()=>{const t=new He,l=new ie(1,1);t.index=l.index,t.setAttribute("position",l.attributes.position),t.setAttribute("uv",l.attributes.uv),t.setAttribute("aImpact",new de(new Float32Array(O*4),4)),t.setAttribute("aWater",new de(new Float32Array(O).fill(-1),1)),t.instanceCount=O;const p=new re({defines:{RAIN_LAMP_COUNT:Z},uniforms:{...Q,uTime:{value:0},uStrength:{value:0}},vertexShader:ft,fragmentShader:dt,transparent:!0,depthWrite:!1});return{geometry:t,material:p}},[]);return h.useEffect(()=>()=>{n.geometry.dispose(),n.material.dispose(),i.geometry.dispose(),i.material.dispose()},[n,i]),$((t,l)=>{const p=e.current,r=a.current;if(!p||!r)return;d.current=D.damp(d.current,M.rainAmount,2.1,l);const c=d.current,s=c>.003;if(p.visible=s,r.visible=s,!s)return;const f=t.clock.elapsedTime;Me(f),n.material.uniforms.uTime.value=f,n.material.uniforms.uStrength.value=c*.8,n.material.uniforms.uPointScale.value=ve*t.gl.getPixelRatio(),i.material.uniforms.uTime.value=f,i.material.uniforms.uStrength.value=c;const g=F.getState(),w=n.geometry.attributes.aImpact,v=n.geometry.attributes.aWater,m=i.geometry.attributes.aImpact,y=i.geometry.attributes.aWater;let A=!1;for(let S=0;S<O;S+=1){const b=u[S],o=b.surface&&ke(b.surface,b.x,b.z,g);if(f<b.end&&(o||!b.surface))continue;lt(b,g,f);const L=b.surface?b.water?1:0:-1;for(let P=0;P<U;P+=1){const z=S*U+P;w.setXYZW(z,b.x??0,b.y??0,b.z??0,b.start),v.setX(z,L)}m.setXYZW(S,b.x??0,b.y??0,b.z??0,b.start),y.setX(S,L),A=!0}A&&(w.needsUpdate=!0,v.needsUpdate=!0,m.needsUpdate=!0,y.needsUpdate=!0)}),x.jsxs(x.Fragment,{children:[x.jsx("points",{ref:e,geometry:n.geometry,material:n.material,visible:!1,frustumCulled:!1,renderOrder:10}),x.jsx("mesh",{ref:a,geometry:i.geometry,material:i.material,visible:!1,frustumCulled:!1,renderOrder:3})]})}const We=512,T=new j,ae=new j;function mt(e){let a=e>>>0;return()=>(a=a*1664525+1013904223>>>0,a/4294967296)}function V(e,a,d,u,n){if(d<=0)return[e.clone(),a.clone()];const i=e.clone().lerp(a,.44+n()*.12),t=e.distanceTo(a);i.x+=(n()-.5)*t*u,i.y+=(n()-.5)*t*u*.2,i.z+=(n()-.5)*t*u;const l=V(e,i,d-1,u*.82,n),p=V(i,a,d-1,u*.82,n);return[...l.slice(0,-1),...p]}function ge(e,a,d){let u=d;for(let n=0;n<a.length-1&&u+2<=We;n+=1){const i=a[n],t=a[n+1];e[u*3]=i.x,e[u*3+1]=i.y,e[u*3+2]=i.z,e[(u+1)*3]=t.x,e[(u+1)*3+1]=t.y,e[(u+1)*3+2]=t.z,u+=2}return u}function ht(){const e=h.useRef(),a=h.useRef(),d=h.useRef(),u=F(l=>l.season!=="clear"),n=h.useRef({active:!1,start:0,next:1.8,count:0}),i=h.useMemo(()=>{const l=new J;return l.setAttribute("position",new R(new Float32Array(We*3),3)),l.setDrawRange(0,0),l},[]);h.useEffect(()=>()=>{M.lightningFlash=0,i.dispose()},[i]);const t=(l,p)=>{var r;const c=F.getState(),s=n.current,f=mt(1741+s.count*977);p.getWorldDirection(T),T.y=0,T.lengthSq()<.001&&T.set(0,0,-1),T.normalize(),ae.set(-T.z,0,T.x);const g=5+f()*9,w=(f()-.5)*7,v=c.ballPosition.x+T.x*g+ae.x*w,m=c.ballPosition.z+T.z*g+ae.z*w,y=Ee(v,m,c.terrainParameters.scale,c.terrainParameters.amplitude),A=be(v,m,c),S=new j(v,A?A.point.y+.04:y+8,m),b=new j(v+(f()-.5)*4,y+15+f()*5,m+(f()-.5)*4),o=V(b,S,5,.24,f),L=i.attributes.position.array;let P=ge(L,o,0);for(let z=0;z<3;z+=1){const _=.2+z*.2+f()*.08,E=Math.min(o.length-2,Math.floor(_*o.length)),le=o[E],K=2.1+f()*3.2,ue=f()*Math.PI*2,Te=le.clone().add(new j(Math.cos(ue)*K,-K*(.5+f()*.35),Math.sin(ue)*K)),je=V(le,Te,3,.3,f);P=ge(L,je,P)}i.setDrawRange(0,P),i.attributes.position.needsUpdate=!0,i.computeBoundingSphere(),(r=d.current)==null||r.position.set(v,y+5.5,m),s.active=!0,s.start=l,s.count+=1,s.echoDelay=.11+f()*.12,s.echoStrength=.25+f()*.4,e.current&&(e.current.visible=!0),a.current&&(a.current.visible=!0),Ne.playThunder({delay:.35+g*.055,intensity:.65+f()*.22,pan:D.clamp(w/7,-1,1)})};return $((l,p)=>{var r,c;const s=n.current,f=l.clock.elapsedTime;if(!u||M.rainAmount<.15){s.active=!1,s.next=1.8,M.lightningFlash=0,e.current&&(e.current.visible=!1),a.current&&(a.current.visible=!1),d.current&&(d.current.intensity=0);return}if(!s.active){s.next-=p,s.next<=0&&t(f,l.camera);return}const g=f-s.start,w=Math.exp(-Math.pow((g-.05)/.052,2)),v=Math.exp(-Math.pow((g-s.echoDelay)/.035,2))*s.echoStrength,m=Math.min(1,w+v+Math.exp(-g*9)*.12);M.lightningFlash=m,(r=e.current)!=null&&r.material&&(e.current.material.opacity=m),(c=a.current)!=null&&c.material&&(a.current.material.opacity=m*.46),d.current&&(d.current.intensity=m*12),g>.52&&(s.active=!1,s.next=(10+s.count*3.71%8)*(1-M.stormBlend*.4),M.lightningFlash=0,e.current&&(e.current.visible=!1),a.current&&(a.current.visible=!1),d.current&&(d.current.intensity=0))}),u?x.jsxs(x.Fragment,{children:[x.jsx("lineSegments",{ref:a,geometry:i,visible:!1,renderOrder:11,children:x.jsx("lineBasicMaterial",{color:"#73a7ff",transparent:!0,opacity:0,blending:ne,depthTest:!0,depthWrite:!1,toneMapped:!1})}),x.jsx("lineSegments",{ref:e,geometry:i,visible:!1,renderOrder:12,children:x.jsx("lineBasicMaterial",{color:"#eff7ff",transparent:!0,opacity:0,blending:ne,depthTest:!0,depthWrite:!1,toneMapped:!1})}),x.jsx(ye,{ref:d,color:"#a8c8e8",intensity:0,distance:38,decay:1.8})]}):null}const C=15,xe=["#7a8f3c","#96803a","#a4562f","#5d7a33","#8f6b2e"],B=new Ye,H=new j,X=new qe,G=new Ge,q=new j,we=new Se;function vt(){const e=h.useSyncExternalStore(Oe,Ie),a=h.useRef(),d=h.useRef(),u=h.useRef(0),n=h.useMemo(()=>{const t=F.getState().qualityFactor>=.55;return{leafCount:t?110:60,dustCount:t?30:16}},[]),i=h.useMemo(()=>{const t=oe(356418),l=Array.from({length:n.leafCount},()=>({x:(t()-.5)*2*C,y:.15+t()*2.4,z:(t()-.5)*2*C,speed:.75+t()*.6,swirl:.6+t()*1.6,lift:.7+t()*1.4,tumbleX:2.2+t()*4.5,tumbleY:1.6+t()*3.6,tumbleZ:2.4+t()*4.2,phase:t()*Math.PI*2,size:.7+t()*.65})),p=Array.from({length:n.dustCount},()=>({x:(t()-.5)*2*C,z:(t()-.5)*2*C,y:.06+t()*.26,life:t(),lifeSpeed:.45+t()*.5,speed:1.35+t()*.5,size:.7+t()*.7})),r=new ie(.1,.066),c=new pe({side:Xe,transparent:!0,opacity:0,depthWrite:!1}),s=new ie(.72,.1),f=new pe({color:"#cbbd9e",transparent:!0,opacity:0,depthWrite:!1});return{dust:p,dustGeometry:s,dustMaterial:f,leafGeometry:r,leafMaterial:c,leaves:l}},[n]);return h.useEffect(()=>{const t=a.current;t&&(i.leaves.forEach((l,p)=>{we.set(xe[p%xe.length]),t.setColorAt(p,we)}),t.instanceColor&&(t.instanceColor.needsUpdate=!0))},[i]),h.useEffect(()=>()=>{i.leafGeometry.dispose(),i.leafMaterial.dispose(),i.dustGeometry.dispose(),i.dustMaterial.dispose()},[i]),$((t,l)=>{const p=F.getState(),r=Math.min(l,.05),c=p.season==="storm"&&!Y?1:0;u.current=D.damp(u.current,c,1.6,r);const s=u.current;M.stormBlend=s;const f=a.current,g=d.current,w=s>.012;if(f&&(f.visible=w),g&&(g.visible=w),!w)return;const v=t.clock.elapsedTime,m=p.smoothedCircleCenter,y=p.windParameters,A=Math.cos(y.direction??0),S=Math.sin(y.direction??0),b=y.direction??0;f&&(i.leafMaterial.opacity=Math.min(1,s*2.4)*.92,i.leaves.forEach((o,L)=>{const P=.65+.35*Math.sin(v*1.35+o.phase*2.1),z=o.speed*(3.4+P*3.2)*s*r,_=Math.sin(v*o.swirl+o.phase)*1.7*s*r;if(o.x+=A*z-S*_,o.z+=S*z+A*_,o.y+=Math.sin(v*o.lift+o.phase*3.3)*.9*s*r,o.y=D.clamp(o.y,.1,3),o.x*o.x+o.z*o.z>C*C){const E=(Math.sin(o.phase*12.9898+v)*.5+.5)*2-1;o.x=-A*C*.96-S*E*C*.85,o.z=-S*C*.96+A*E*C*.85,o.y=.15+(Math.sin(o.phase*78.233+v*.7)*.5+.5)*2.3}H.set(m.x+o.x,o.y,m.z+o.z),G.set(v*o.tumbleX+o.phase,v*o.tumbleY+o.phase*2,v*o.tumbleZ+o.phase*3),X.setFromEuler(G),q.setScalar(o.size*Math.min(1,s*2.6)),B.compose(H,X,q),f.setMatrixAt(L,B)}),f.instanceMatrix.needsUpdate=!0),g&&(i.dustMaterial.opacity=Math.min(1,s*2.2)*.16,G.set(-Math.PI/2,0,-b),X.setFromEuler(G),i.dust.forEach((o,L)=>{o.life+=o.lifeSpeed*r;const P=o.speed*6.4*s*r;if(o.x+=A*P,o.z+=S*P,o.life>=1||o.x*o.x+o.z*o.z>C*C){o.life=0;const _=(Math.sin((L+1)*12.9898+v*1.7)*.5+.5)*2-1;o.x=-A*C*.9-S*_*C*.8,o.z=-S*C*.9+A*_*C*.8}const z=Math.sin(Math.min(o.life,1)*Math.PI);H.set(m.x+o.x,o.y,m.z+o.z),q.set(o.size*(.5+z),1,o.size*z*.9),B.compose(H,X,q),g.setMatrixAt(L,B)}),g.instanceMatrix.needsUpdate=!0)}),e?null:x.jsxs("group",{children:[x.jsx("instancedMesh",{ref:a,args:[i.leafGeometry,i.leafMaterial,n.leafCount],frustumCulled:!1,visible:!1}),x.jsx("instancedMesh",{ref:d,args:[i.dustGeometry,i.dustMaterial,n.dustCount],frustumCulled:!1,visible:!1})]})}const I=W?16:28,gt=`
uniform float uTime;
uniform float uStrength;
uniform float uPixelRatio;

attribute float aPhase;
attribute float aSize;
attribute float aWarmth;
attribute float aForeground;

varying float vAlpha;
varying float vWarmth;
varying float vPhase;

void main() {
    vec3 transformed = position;
    float sway = 0.05 + aForeground * 0.045;
    transformed.x += sin(uTime * (0.18 + aPhase * 0.025) + aPhase * 6.2831) * sway;
    transformed.z += cos(uTime * (0.14 + aPhase * 0.02) + aPhase * 4.7) * sway * 0.72;
    transformed.y += sin(uTime * (0.32 + aPhase * 0.04) + aPhase * 8.3) * 0.055;

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float perspective = 44.0 / max(-viewPosition.z, 1.0);
    gl_PointSize = clamp(aSize * perspective * uPixelRatio, 1.4, 17.0);

    vAlpha = uStrength * mix(0.54, 0.82, aForeground);
    vWarmth = aWarmth;
    vPhase = aPhase;
}
`,xt=`
uniform float uTime;

varying float vAlpha;
varying float vWarmth;
varying float vPhase;

void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceFromCenter = length(point) * 2.0;
    float halo = smoothstep(1.0, 0.08, distanceFromCenter);
    float core = smoothstep(0.34, 0.0, distanceFromCenter);
    float twinkle = 0.78 + sin(uTime * 1.15 + vPhase * 18.0) * 0.22;
    float alpha = (halo * 0.2 + core * 0.8) * vAlpha * twinkle;
    if (alpha < 0.01) discard;

    vec3 cool = vec3(0.58, 0.74, 1.0);
    vec3 warm = vec3(1.0, 0.59, 0.24);
    vec3 color = mix(cool, warm, vWarmth);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
}
`;function wt(){const e=document.createElement("canvas");e.width=256,e.height=64;const a=e.getContext("2d"),d=oe(335593);a.clearRect(0,0,e.width,e.height),a.globalCompositeOperation="lighter";for(let n=0;n<18;n+=1){const i=d()*e.width,t=22+d()*27,l=18+d()*42,p=7+d()*14;a.save(),a.translate(i,t),a.scale(1,p/l);const r=a.createRadialGradient(0,0,0,0,0,l);r.addColorStop(0,`rgba(255,255,255,${.035+d()*.045})`),r.addColorStop(.48,"rgba(255,255,255,0.025)"),r.addColorStop(1,"rgba(255,255,255,0)"),a.fillStyle=r,a.fillRect(-l,-l,l*2,l*2),a.restore()}const u=new Qe(e);return u.colorSpace=Ve,u.minFilter=me,u.magFilter=me,u.needsUpdate=!0,u}function yt(){const e=h.useRef(),a=h.useRef(),d=h.useRef([]),u=h.useRef(0),n=F(r=>r.sleeping),i=F(r=>r.terrainParameters.scale),t=F(r=>r.terrainParameters.amplitude),l=h.useMemo(()=>$e(N.x,N.z,i,t),[t,i]),p=h.useMemo(()=>{const r=oe(335593),c=new Float32Array(I*3),s=new Float32Array(I),f=new Float32Array(I),g=new Float32Array(I),w=new Float32Array(I);for(let m=0;m<I;m+=1){const y=m<Math.min(6,Math.floor(I*.28)),A=y?-8.15+r()*3.45:-4.5+r()*7.2,S=y?-5.75+r()*3.7:-4.1+r()*6.1,b=y?.4+r()*2.2:.28+r()*1.75,o=Math.hypot(A-fe.x,S-fe.z);c[m*3]=A,c[m*3+1]=b,c[m*3+2]=S,s[m]=r(),f[m]=y?1.7+r()*1.15:.85+r()*.8,g[m]=o<2.25?.78+r()*.22:r()*.18,w[m]=y?1:0}const v=new J;return v.setAttribute("position",new R(c,3)),v.setAttribute("aPhase",new R(s,1)),v.setAttribute("aSize",new R(f,1)),v.setAttribute("aWarmth",new R(g,1)),v.setAttribute("aForeground",new R(w,1)),{geometry:v,mistTexture:wt(),uniforms:{uPixelRatio:{value:Math.min(window.devicePixelRatio||1,2)},uStrength:{value:0},uTime:{value:0}}}},[]);return h.useEffect(()=>()=>{p.geometry.dispose(),p.mistTexture.dispose()},[p]),$((r,c)=>{const s=n?1:0;u.current=Y?s:D.damp(u.current,s,n?1.25:3.2,c);const f=u.current,g=Y?0:r.clock.elapsedTime;e.current&&(e.current.uniforms.uStrength.value=f,e.current.uniforms.uTime.value=g),a.current&&(a.current.intensity=f*.78),d.current.forEach((w,v)=>{if(!w)return;const m=f*(.055-v*.008);w.visible=m>.002,w.material.opacity=m,Y||(w.position.x=w.userData.baseX+Math.sin(g*(.035+v*.008)+v)*.28,w.position.y=w.userData.baseY+Math.sin(g*.09+v*1.7)*.035)})}),x.jsxs("group",{position:[N.x,l,N.z],children:[x.jsx("points",{geometry:p.geometry,frustumCulled:!1,renderOrder:18,children:x.jsx("shaderMaterial",{ref:e,uniforms:p.uniforms,vertexShader:gt,fragmentShader:xt,blending:ne,depthWrite:!1,transparent:!0,toneMapped:!1})}),[{position:[-1.25,.42,-.25],scale:[5.4,.86,1]},{position:[1.55,.34,.35],scale:[4.25,.68,1]},{position:[-3.15,.3,-.95],scale:[3.7,.58,1]}].map((r,c)=>x.jsx("sprite",{ref:s=>{d.current[c]=s,s&&(s.userData.baseX=r.position[0],s.userData.baseY=r.position[1])},position:r.position,scale:r.scale,visible:!1,renderOrder:12+c,children:x.jsx("spriteMaterial",{map:p.mistTexture,color:c===2?"#d5b386":"#91a9d2",depthWrite:!1,opacity:0,transparent:!0})},c)),n&&x.jsx(ye,{ref:a,position:[1.8,2.85,1.15],color:"#7698dc",intensity:0,distance:9.25,decay:2})]})}function zt(){return h.useEffect(()=>(ce.setState({weatherBuilt:!0}),()=>ce.setState({weatherBuilt:!1,weatherWarm:!1})),[]),x.jsxs(x.Fragment,{children:[x.jsx(st,{}),x.jsx(pt,{}),x.jsx(ht,{}),x.jsx(vt,{}),x.jsx(yt,{})]})}export{zt as default};
