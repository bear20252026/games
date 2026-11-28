import{f as D,N as c,c as he,T as d}from"./react-BbqnMepd.js";import{J as fe,u as J,$ as me,q as pe,j as de,_ as ge,e as ve,t as we,Z as X,Q as _}from"./postfx-CAFBPH32.js";import{Z as O,ak as be,o as V,al as Z,am as E,an as xe,ao as ye,a as Ce,ap as W,aq as Te}from"./main-CHq3HDKI.js";import{a8 as t,V as Se,aa as H,x as Me,M as je,l as Ae,C as De,e as w,o as Q,w as Fe,$ as Le}from"./three-DlAHX5Z_.js";import"./rapier-BcgqzzOj.js";import"./gsap-D1AWpUut.js";import"./home-C-bt6R1Y.js";import"./modulepreload-polyfill-B5Qt9EMX.js";const Pe="vec3(0.000303, 0.000607, 0.002125)",Be="vec3(0.000607, 0.001214, 0.003035)",Re="vec3(0.000607, 0.001518, 0.003677)",qe="vec3(0.000303, 0.000607, 0.002435)",Ve=`
uniform float uShutter;
uniform float uVeil;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Matches the CSS --letterbox-height so the caption still sits just clear
    // of the bar: max(7vh, 50vh - 21.275vw), and the 6vh the stylesheet drops
    // to below 4:3 — without that branch a portrait window would draw a 21%
    // bar straight over the caption positioned for a 6% one.
    float barHeight = aspect < 1.33333
        ? 0.06
        : max(0.07, 0.5 - 0.21275 * aspect);
    float bar = barHeight * uShutter;

    vec3 color = inputColor.rgb;

    // The blink as the eyes close.
    color = mix(color, ${qe}, uVeil);

    // Each bar cast a soft shadow into the frame (0 18px 42px rgba(2,5,12,.22)).
    //
    // No separate edge wash here, unlike the stylesheet. The overlay needed its
    // own gradients and inset shadow because it sat outside the render; in the
    // composer the vignette already deepens to 0.48 while sleeping, and adding
    // the wash on top of it darkened the band just inside the bar to roughly
    // half what the original showed. This shadow alone is what the bars owe the
    // frame.
    float shadow = max(
        smoothstep(1.0 - bar - 0.05, 1.0 - bar, uv.y),
        1.0 - smoothstep(bar, bar + 0.05, uv.y)
    );
    color = mix(color, ${Re}, shadow * 0.14 * uShutter);

    // The bars themselves, carrying the stylesheet's top-to-bottom gradient.
    float edge = 0.0016;
    float topBar = smoothstep(1.0 - bar - edge, 1.0 - bar, uv.y);
    float bottomBar = 1.0 - smoothstep(bar, bar + edge, uv.y);
    float bars = max(topBar, bottomBar);

    float safeBar = max(bar, 1e-5);
    float within = uv.y > 0.5
        ? clamp((1.0 - uv.y) / safeBar, 0.0, 1.0)
        : clamp((safeBar - uv.y) / safeBar, 0.0, 1.0);
    color = mix(color, mix(${Pe}, ${Be}, within), bars);

    outputColor = vec4(color, inputColor.a);
}
`;class Ee extends X{constructor(){super("CinematicShutterEffect",Ve,{uniforms:new Map([["uShutter",new w(0)],["uVeil",new w(0)]])})}get shutter(){return this.uniforms.get("uShutter").value}set shutter(r){this.uniforms.get("uShutter").value=r}get veil(){return this.uniforms.get("uVeil").value}set veil(r){this.uniforms.get("uVeil").value=r}}const $e=`
uniform mat4 uInverseViewProjection;
uniform vec3 uCamera;
uniform float uCloudLight;
uniform vec2 uDrift;
uniform float uFocusDistance;
uniform float uFocusAmount;

float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

float softNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

float distanceAt(vec2 at, float depthThere) {
    vec4 world = uInverseViewProjection * vec4(at * 2.0 - 1.0, depthThere * 2.0 - 1.0, 1.0);
    return length(world.xyz / world.w - uCamera);
}

// How soft a pixel is, 0..1: sharp around the character, softening past them
// and right up against the lens.
float softnessAt(float distanceTo) {
    float far = smoothstep(uFocusDistance + 7.0, uFocusDistance + 26.0, distanceTo);
    float near = 1.0 - smoothstep(uFocusDistance * 0.3, uFocusDistance * 0.62, distanceTo);
    return max(far, near * 0.8);
}

const vec2 DISC[8] = vec2[8](
    vec2(0.0, 1.0), vec2(0.707, 0.707), vec2(1.0, 0.0), vec2(0.707, -0.707),
    vec2(0.0, -1.0), vec2(-0.707, -0.707), vec2(-1.0, 0.0), vec2(-0.707, 0.707)
);

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    vec3 color = inputColor.rgb;
    bool sky = depth >= 0.99995;

    vec4 world = uInverseViewProjection * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    world /= world.w;
    float distanceTo = length(world.xyz - uCamera);

    float softness = uFocusAmount * softnessAt(distanceTo);
    if (softness > 0.01) {
        // A tap only counts if it is as far out of focus as this pixel, so the
        // sharp character cannot smear a halo into the soft trees behind them.
        vec3 sum = color;
        float weight = 1.0;
        for (int i = 0; i < 8; i++) {
            vec2 at = uv + DISC[i] * texelSize * softness * 3.2 * (i % 2 == 0 ? 1.0 : 0.62);
            float there = uFocusAmount * softnessAt(distanceAt(at, readDepth(at)));
            float count = smoothstep(0.0, 0.5, there);
            sum += texture2D(inputBuffer, at).rgb * count;
            weight += count;
        }
        color = sum / weight;
    }

    if (!sky) {
        // Two scales of slow patches: the mass of a passing cloud, and its edge.
        // Mostly open sun, so a visitor sees shade pass over the field rather
        // than a dimmer meadow.
        vec2 at = world.xz * 0.024 + uDrift;
        float mass = softNoise(at) * 0.68 + softNoise(at * 2.7 + 11.3) * 0.32;
        float lit = smoothstep(0.26, 0.5, mass);
        color *= mix(1.0 - uCloudLight * 0.2, 1.0 + uCloudLight * 0.05, lit);
    }

    outputColor = vec4(color, inputColor.a);
}
`,G=new Q;class ke extends X{constructor(r){super("MeadowLightEffect",$e,{blendFunction:J.NORMAL,attributes:_.DEPTH|_.CONVOLUTION,uniforms:new Map([["uInverseViewProjection",new w(new Q)],["uCamera",new w(new Fe)],["uCloudLight",new w(0)],["uDrift",new w(new Le)],["uFocusDistance",new w(14)],["uFocusAmount",new w(0)]])}),this.camera=r}setLight({cloudLight:r,driftX:n,driftZ:l,focusDistance:e,focusAmount:m}){const u=this.uniforms;u.get("uCloudLight").value=r,u.get("uDrift").value.set(n,l),u.get("uFocusDistance").value=e,u.get("uFocusAmount").value=m}update(){const r=this.camera,n=this.uniforms;G.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n.get("uInverseViewProjection").value.copy(G).invert(),n.get("uCamera").value.setFromMatrixPosition(r.matrixWorld)}}const ze=i=>i.isWebGLRenderer||i.isScene||i.isCamera||i.isTexture||i.isRenderTarget||i.isWebGLRenderTarget||i.isBufferGeometry||typeof i=="function";function Ie(i){const r=new Map,n=new Set,l=(e,m,u)=>{if(!e||typeof e!="object")return;if(e.isMaterial){(u||!r.has(e))&&r.set(e,u);return}if(m>4||n.has(e)||ze(e)||e.enabled===!1)return;if(n.add(e),e.mipmapBlurPass&&e.blurPass&&n.add(e.mipmapBlurPass.enabled?e.blurPass:e.mipmapBlurPass),e.isMesh){l(e.material,m+1,u);return}e.fullscreenMaterial&&l(e.fullscreenMaterial,m+1,!1);const y=e instanceof Map?e.values():Array.isArray(e)?e:Object.values(e);for(const C of y)l(C,m+1,u)};for(const e of i.passes)e.enabled&&(e.fullscreenMaterial&&l(e.fullscreenMaterial,0,e.renderToScreen),l(e,0,!1));return r}async function Ne(i,r,n){if(!r)return;const l=Ie(r),e=new Se;e.setAttribute("position",new H([-1,-1,0,3,-1,0,-1,3,0],3)),e.setAttribute("uv",new H([0,0,2,0,0,2],2));const m=new Me(-1,1,1,-1,0,1),u=new je(1,1);try{for(const[y,C]of l){for(;document.hidden;)await W(n,100);if(n.aborted)throw n.reason;const T=new Ae,M=new De(e,y);M.frustumCulled=!1,T.add(M);const j=i.getRenderTarget();let S;try{i.setRenderTarget(C?null:u),S=Te(i,T,m,null,{signal:n})}finally{i.setRenderTarget(j)}await S,await W(n)}}finally{e.dispose(),u.dispose()}}const _e=.17;function Ue(){const i=O(s=>s.quality),r=be(i),n=D(s=>s.gl),l=D(s=>s.camera),e=c.useRef(null),m=D(s=>s.viewport.dpr),u=D(s=>s.size);c.useEffect(()=>{var s;(s=e.current)==null||s.setSize(u.width,u.height)},[m,u.width,u.height]);const[y,C]=c.useState(!1),T=V(s=>s.phase!==Z.loading),M=V(s=>s.framesReleased),j=y&&M,S=c.useRef(!1);S.current=j,c.useEffect(()=>(E.composerMounted=!0,()=>{E.composerMounted=!1}),[]),c.useEffect(()=>{if(!T)return;const s=new AbortController;return Ne(n,e.current,s.signal).then(()=>{s.signal.aborted||C(!0)}).catch(L=>{s.abort(),xe(L)}),()=>s.abort()},[n,T]);const[$,U]=c.useState(!1),g=c.useRef(),F=c.useRef(0);c.useEffect(()=>(g.current&&(g.current.configuration.autoDetectTransparency=!1,g.current.configuration.transparencyAware=!1),window.__ao=g.current??null,()=>{window.__ao===g.current&&(window.__ao=null)}));const K=c.useRef({golden:0,morning:0,night:0,rainy:0,sleeping:0,shutter:0,focus:0,veilTime:999,wasSleeping:!1}),o=c.useMemo(()=>{const s=new fe({blendFunction:J.ADD,mipmapBlur:!0,intensity:.3,luminanceThreshold:.8,luminanceSmoothing:.26,radius:.64});return{smaa:new ge,bloom:s,brightnessContrast:new de({brightness:.016,contrast:.078}),hueSaturation:new pe({hue:0,saturation:.065}),vignette:new me({eskil:!1,offset:.22,darkness:.38}),shutter:new Ee,light:new ke(l)}},[l]),b=c.useMemo(()=>({cloudLight:0,driftX:0,driftZ:0,focusDistance:14,focusAmount:0}),[]);return c.useEffect(()=>()=>{Object.values(o).forEach(s=>s.dispose())},[o]),he((s,L)=>{S.current&&(E.framesDrawn+=1);const h=O.getState(),a=K.current,v=Math.min(L,.05);g.current&&(g.current.enabled=ye.cloud<.999);const P=h.qualityFactor??1;P>F.current&&(F.current=P),!$&&F.current-P>=_e&&U(!0),a.night=t.damp(a.night,t.clamp(h.nightAmount??0,0,1),4,v),a.rainy=t.damp(a.rainy,h.season!=="clear"?1:0,2.4,v),a.sleeping=t.damp(a.sleeping,h.sleeping?1:0,2.4,v),a.golden=t.damp(a.golden,t.clamp(h.goldenAmount??0,0,1),2.4,v),a.morning=t.damp(a.morning,t.clamp(h.morningAmount??0,0,1),2.4,v);const{golden:p,morning:x,night:f,rainy:B,sleeping:k}=a,Y=t.lerp(.3,.24,x),ee=t.lerp(Y,.4,p);let R=t.lerp(ee,.46,f);R=t.lerp(R,.2,B),o.bloom.intensity=t.lerp(R,.38,k);const te=t.lerp(.8,.86,x),se=t.lerp(te,.83,p);o.bloom.luminanceMaterial.threshold=t.lerp(se,.9,f),o.bloom.luminanceMaterial.smoothing=t.lerp(.26,.5,f);const oe=t.lerp(.64,.68,x),ae=t.lerp(oe,.74,p);if(o.bloom.mipmapBlurPass.radius=t.lerp(ae,.66,f),h.quality==="high"){const N=Ce;o.bloom.intensity+=.16*f,o.bloom.mipmapBlurPass.radius=t.lerp(o.bloom.mipmapBlurPass.radius,.82,1-B);const le=(1-f)*(1-B);b.cloudLight=le,b.driftX=N.windTime*.016,b.driftZ=N.windTime*.006;const A=h.ballPosition;b.focusDistance=A?Math.hypot(A.x-l.position.x,A.y-l.position.y,A.z-l.position.z):14;const ce=V.getState().phase===Z.start&&h.cameraMode!=="fpp";a.focus=t.damp(a.focus,ce?1:0,2,v),b.focusAmount=a.focus,o.light.setLight(b)}const re=t.lerp(t.lerp(t.lerp(.016,.01,x),.012,p),0,f);o.brightnessContrast.brightness=re;const ie=t.lerp(t.lerp(t.lerp(.078,.048,x),.052,p),.055,f);o.brightnessContrast.contrast=ie,o.hueSaturation.hue=-.003*p*(1-f);const ne=t.lerp(t.lerp(t.lerp(.065,.025,x),-.012,p),-.025,f);o.hueSaturation.saturation=ne,o.vignette.offset=t.lerp(t.lerp(.22,.28,p),.26,f);const ue=t.lerp(t.lerp(.38,.34,p),.32,f);o.vignette.darkness=t.lerp(ue,.48,k);const z=h.sleeping?1:0;a.shutter=t.damp(a.shutter,z,z>a.shutter?6.2:3.8,v);const I=t.smoothstep(a.shutter,0,1);o.shutter.shutter=I<.004?0:I,h.sleeping&&!a.wasSleeping&&(a.veilTime=0),a.wasSleeping=!!h.sleeping,a.veilTime<1.6&&(a.veilTime+=v);const q=a.veilTime/1.55;o.shutter.veil=q>=1?0:Math.min(t.smoothstep(q,0,.18),1-t.smoothstep(q,.43,1))*.98}),d.jsxs(ve,{ref:e,enabled:j,multisampling:0,enableNormalPass:!1,resolutionScale:1,children:[r.ambientOcclusion&&!$&&d.jsx(we,{ref:g,aoRadius:.5,distanceFalloff:.9,halfRes:!0,intensity:1.1,quality:"medium",depthAwareUpsampling:!0,color:"#2a2418"}),r.antialias&&d.jsx("primitive",{object:o.smaa}),r.meadowLight&&d.jsx("primitive",{object:o.light}),r.bloom&&d.jsx("primitive",{object:o.bloom}),d.jsx("primitive",{object:o.brightnessContrast}),d.jsx("primitive",{object:o.hueSaturation}),d.jsx("primitive",{object:o.vignette}),d.jsx("primitive",{object:o.shutter})]})}export{Ue as default};
