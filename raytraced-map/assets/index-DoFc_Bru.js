var di=Object.defineProperty;var fi=(c,e,t)=>e in c?di(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var a=(c,e,t)=>fi(c,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();const we=1e-9;function ae(c,e,t){return(1-t)*c+t*e}function Et(c){return c<0?0:c>1?1:c}function pi(c){return!isNaN(parseFloat(c))&&isFinite(c)}function J(c,e,t){return Math.min(Math.max(c,e),t)}function Br(c,e){let t=0,r=1,n=c;for(;n>0;)r=r/e,t=t+r*(n%e),n=Math.floor(n/e);return t}function jt(c,e,t){c=Math.abs(c),e=Math.abs(e),t=Math.abs(t);let r=c>e?c:e;if(t>r&&(r=t),r===0)return 0;const n=c/r,i=e/r,s=t/r,o=n*n+i*i,l=o-n*n-i*i;return Math.sqrt(o+(s*s-l))*r}const Ir=-1,mi=0,Dr=1;class gi{constructor(){a(this,"progress",0);a(this,"requests",[]);a(this,"onComplete");a(this,"onProgress");a(this,"loading",!1)}add(e,t){const r={resource:e,progress:Ir,callbacks:[t]};return this.requests.push(r),this.loading&&this.loadResource(r),e}load(e,t){if(this.loading){console.error("preloader already started");return}this.onComplete=e,this.onProgress=t,this.loading=!0,this.requests.forEach(r=>{this.loadResource(r)}),this.requests.length===0&&this.onComplete&&(this.onComplete(),this.onComplete=void 0)}addOnCompleteForResource(e,t){var r;(r=this.requests.find(n=>n.resource===e))==null||r.callbacks.push(t)}destruct(){this.onComplete=void 0,this.requests=[]}loadResource(e){e.progress===Ir&&(e.progress=mi,e.resource.load(()=>{this.loadDoneCallback(e)},t=>{e.progress=t*.99,this.updateProgress()}))}loadDoneCallback(e){e.progress!==Dr&&(e.progress=Dr,e.callbacks.forEach(t=>{t&&t()}),this.updateProgress())}updateProgress(){const e=this.requests.reduce((t,r)=>t+Math.max(0,r.progress),0);this.progress=Et(e/this.requests.length),this.onProgress&&(this.requests.length?this.onProgress(Et(this.progress)):this.onProgress(1)),e>=this.requests.length&&this.onComplete&&(this.onComplete(),this.onComplete=void 0)}}const R=class R{static install(e){if(R.installed)return;R.installed=!0,R.enabled=e,R.nativeRequest=window.requestAnimationFrame.bind(window),R.nativeCancel=window.cancelAnimationFrame.bind(window);const t=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(r){const n=await t.call(this,r);return R.device=n,n},R.channel=new MessageChannel,R.channel.port1.onmessage=()=>R.runFrame(),window.requestAnimationFrame=r=>R.request(r),window.cancelAnimationFrame=r=>R.cancel(r)}static isInstalled(){return R.installed}static isEnabled(){return R.enabled}static setEnabled(e){if(!(!R.installed||e===R.enabled)){if(R.enabled=e,!e){for(const[t,r]of R.pending)R.movedToNative.set(t,R.nativeRequest(n=>{R.movedToNative.delete(t),r(n)}));R.pending.clear()}console.log(`UncappedFrames: requestAnimationFrame is ${e?"not ":""}tied to vsync`)}}static request(e){if(!R.enabled||!R.device)return R.nativeRequest(e);const t=R.nextId++;return R.pending.set(t,e),R.schedule(),-t}static cancel(e){if(e>=0){R.nativeCancel(e);return}R.pending.delete(-e);const t=R.movedToNative.get(-e);t!==void 0&&(R.nativeCancel(t),R.movedToNative.delete(-e))}static schedule(){if(R.scheduled)return;R.scheduled=!0;const e=()=>R.channel.port2.postMessage(0);R.previousFrameDone.then(e,e)}static runFrame(){R.scheduled=!1;const e=R.pending;R.pending=new Map;const t=R.previousFrameDone;R.scheduled=!0;const r=performance.now();for(const n of e.values())try{n(r)}catch(i){console.error(i)}if(R.previousFrameDone=R.device?R.device.queue.onSubmittedWorkDone():Promise.resolve(),R.scheduled=!1,R.pending.size>0){R.scheduled=!0;const n=()=>R.channel.port2.postMessage(0);t.then(n,n)}}};a(R,"installed",!1),a(R,"enabled",!1),a(R,"device",null),a(R,"nativeRequest"),a(R,"nativeCancel"),a(R,"nextId",1),a(R,"pending",new Map),a(R,"movedToNative",new Map),a(R,"scheduled",!1),a(R,"previousFrameDone",Promise.resolve()),a(R,"channel");let kt=R;class k{constructor(e=0,t=0){a(this,"x");a(this,"y");this.x=e,this.y=t}static get ZERO(){return new k(0,0)}static get ONE(){return new k(1,1)}static dot(e,t){return e.x*t.x+e.y*t.y}static distance(e,t){return Math.sqrt(k.distanceSquared(e,t))}static distanceSquared(e,t){const r=e.x-t.x,n=e.y-t.y;return r*r+n*n}static transformMat2(e,t){return e.clone().multiplyMatrix(t)}static transformMat3(e,t){const r=e.x,n=e.y,i=t.m;return new k(i[0]*r+i[3]*n+i[6],i[1]*r+i[4]*n+i[7])}static transformMat4(e,t){const r=e.x,n=e.y,i=t.m;return new k(i[0]*r+i[4]*n+i[12],i[1]*r+i[5]*n+i[13])}static multiplyScalar(e,t){return new k(e.x*t,e.y*t)}static add(e,t){return new k(e.x+t.x,e.y+t.y)}static subtract(e,t){return new k(e.x-t.x,e.y-t.y)}static lerp(e,t,r){return e.clone().lerp(t,r)}static fract(e){return new k(e.x-Math.floor(e.x),e.y-Math.floor(e.y))}static floor(e){return new k(Math.floor(e.x),Math.floor(e.y))}static normalize(e){return e.clone().normalize()}clone(){return new k(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}setValues(e,t){return this.x=e,this.y=t,this}length(){return Math.sqrt(k.dot(this,this))}equals(e){return e.x===this.x&&e.y===this.y}normalize(){let e=this.x*this.x+this.y*this.y;return e>0&&(e=1/Math.sqrt(e)),this.x*=e,this.y*=e,this}negate(){return this.x=-this.x,this.y=-this.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}addScalar(e){return this.x+=e,this.y+=e,this}multiplyMatrix(e){const t=e.m,r=t[0]*this.x+t[2]*this.y,n=t[1]*this.x+t[3]*this.y;return this.setValues(r,n)}multiply(e){return this.x*=e.x,this.y*=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}subtract(e){return this.x-=e.x,this.y-=e.y,this}subtractScalar(e){return this.x-=e,this.y-=e,this}rotate(e,t){const r=Math.sin(t),n=Math.cos(t);this.x-=e.x,this.y-=e.y;const i=this.x*n-this.y*r,s=this.x*r+this.y*n;return this.x=i+e.x,this.y=s+e.y,this}randomize(){return this.x=Math.random()*2-1,this.y=Math.random()*2-1,this}randomize01(){return this.x=Math.random(),this.y=Math.random(),this}randomizeDisc(){do this.randomize();while(k.dot(this,this)>1);return this}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}}const rt=0,Ht=1,Xt=2,bi=[1,4,2];class xi{constructor(e,t){a(this,"eventElement");a(this,"sizeElement");a(this,"listenerController",new AbortController);a(this,"wheelCallbacks",[]);a(this,"clickCallbacks",[]);a(this,"downCallbacks",[]);a(this,"upCallbacks",[]);a(this,"moveCallbacks",[]);a(this,"dragCallbacks",[]);a(this,"mousePos",new k);a(this,"mousePosPrev",new k);a(this,"mouseVelocity",new k);a(this,"buttonDown",[!1,!1,!1]);a(this,"pressedSinceUpdate",[!1,!1,!1]);a(this,"releasedSinceUpdate",[!1,!1,!1]);a(this,"pressedThisFrame",[!1,!1,!1]);a(this,"releasedThisFrame",[!1,!1,!1]);a(this,"clickCanceled",!1);a(this,"timeOfMouseDown",0);a(this,"onPointerDown",e=>{if(e.isPrimary){try{this.eventElement.setPointerCapture(e.pointerId)}catch{}this.setMousePosition(e),this.setButtons(e.buttons)}});a(this,"onPointerMove",e=>{if(e.isPrimary){this.setMousePosition(e),this.setButtons(e.buttons);for(const t of this.moveCallbacks)t(this.mousePos.clone())}});a(this,"onPointerUp",e=>{e.isPrimary&&(this.setMousePosition(e),this.setButtons(e.buttons))});a(this,"onPointerCancel",e=>{e.isPrimary&&this.setButtons(0)});a(this,"onClick",()=>{if(!this.clickCanceled)for(const e of this.clickCallbacks)e()});a(this,"onWheel",e=>{const t=Math.sign(-e.deltaY);for(const r of this.wheelCallbacks)r(t)});if(this.eventElement=e,this.sizeElement=t,!e)return;e.style.touchAction="none";const r={signal:this.listenerController.signal};e.addEventListener("pointerdown",this.onPointerDown,r),e.addEventListener("pointermove",this.onPointerMove,r),e.addEventListener("pointerup",this.onPointerUp,r),e.addEventListener("pointercancel",this.onPointerCancel,r),e.addEventListener("click",this.onClick,r),e.addEventListener("wheel",this.onWheel,r),e.addEventListener("contextmenu",n=>n.preventDefault(),r)}setMousePosition(e){const t=e.clientX||0,r=e.clientY||0;if(this.sizeElement&&this.sizeElement.getBoundingClientRect){const n=this.sizeElement.getBoundingClientRect();this.mousePos.x=(t-n.left)/n.width,this.mousePos.y=(r-n.top)/n.height}else this.mousePos.setValues(t,r)}setButtons(e){for(let t=0;t<3;t++){const r=(e&bi[t])!==0;if(r!==this.buttonDown[t]){if(this.buttonDown[t]=r,r){if(this.pressedSinceUpdate[t]=!0,this.clickCanceled=!1,this.timeOfMouseDown=performance.now(),this.mousePosPrev.copy(this.mousePos),t===rt)for(const n of this.downCallbacks)n(this.mousePos.clone())}else if(this.releasedSinceUpdate[t]=!0,t===rt)for(const n of this.upCallbacks)n()}}}get normalizedPosition(){return this.mousePos.clone()}get screenPosition(){return new k(this.mousePos.x*2-1,1-this.mousePos.y*2)}get normalizedVelocity(){return this.mouseVelocity.clone()}get mouseDown(){return this.buttonDown[rt]}get mouseDownThisFrame(){return this.pressedThisFrame[rt]}get mouseUpThisFrame(){return this.releasedThisFrame[rt]}get middleMouseDown(){return this.buttonDown[Ht]}get middleMouseDownThisFrame(){return this.pressedThisFrame[Ht]}get middleMouseUpThisFrame(){return this.releasedThisFrame[Ht]}get rightMouseDown(){return this.buttonDown[Xt]}get rightMouseDownThisFrame(){return this.pressedThisFrame[Xt]}get rightMouseUpThisFrame(){return this.releasedThisFrame[Xt]}addWheelEvent(e){this.wheelCallbacks.push(e)}addClickEvent(e){this.clickCallbacks.push(e)}addDownEvent(e){this.downCallbacks.push(e)}addMoveEvent(e){this.moveCallbacks.push(e)}addUpEvent(e){this.upCallbacks.push(e)}addDragEvent(e){this.dragCallbacks.push(e)}destruct(){this.listenerController.abort();for(const e of[this.wheelCallbacks,this.clickCallbacks,this.downCallbacks,this.upCallbacks,this.moveCallbacks,this.dragCallbacks])e.length=0}update(){if(this.mouseVelocity.copy(this.mousePos).subtract(this.mousePosPrev),this.mousePosPrev.copy(this.mousePos),this.mouseDown&&this.mouseVelocity.length()>0){this.mouseVelocity.length()>.001&&(this.clickCanceled=!0);for(const e of this.dragCallbacks)e(this.mouseVelocity)}performance.now()-this.timeOfMouseDown>500&&(this.clickCanceled=!0);for(let e=0;e<3;e++)this.pressedThisFrame[e]=this.pressedSinceUpdate[e],this.releasedThisFrame[e]=this.releasedSinceUpdate[e],this.pressedSinceUpdate[e]=!1,this.releasedSinceUpdate[e]=!1}}let nt;function vr(){if(typeof document<"u"&&!nt){nt=document.createElement("div");const c=nt.style;c.position="fixed",c.left="0",c.bottom="0",c.color="#fff",c.backgroundColor="#22222288",c.overflowX="hidden",c.overflowY="auto",c.display="block",c.boxSizing="border-box",c.width="100vw",c.height="30vh",c.padding="16px",c.margin="0",c.font="12px monospace",c.zIndex="998",document.body.appendChild(nt)}return nt}function yi(){const c=vr();c&&(c.innerHTML="")}function vi(c){const e=vr();e&&(e.insertAdjacentHTML("beforeend",c),e.scrollTop=e.scrollHeight)}function wi(c){let e=[];return JSON.stringify(c,function(t,r){if(typeof r=="object"&&r!==null){if(e.indexOf(r)!==-1)return;e.push(r)}return r})}function qt(c,...e){if(typeof document>"u"){console.log(...e);return}const t=e.length>1&&e[0]&&e[0].toString().indexOf("%c")>=0;e[0]=e[0].toString().replace(/\t/gi,"&nbsp;&nbsp;"),e[0]=e[0].toString().replace(/ /gi,"&nbsp;");let r=`<span ${c?`style="color: ${c}; font-weight: bold;"`:""}>`;if(t){let n=0;r+=e[0].replace(/%c/gi,()=>(n++,`</span><span style="${e[n]}">`))}else r+=`${e.map(n=>n&&n!==n.toString()?wi(n):n).join(" ")}`;vi((r+"</span><br />").replace(/\n/gi,"<br />"))}const z=class z{static get ENABLED(){return z._enabled}static set ENABLED(e){z._enabled=e,z.ENABLED?z.LOG_TO_SCREEN?(z.log=z.screenLog,z.warn=z.screenWarn,z.error=z.screenError):(z.log=console.log,z.warn=console.warn,z.error=z.screenError):(z.log=(...t)=>{},z.warn=(...t)=>{},z.error=z.LOG_TO_SCREEN?z.screenError:console.error)}static get LOG_TO_SCREEN(){return z._logToScreen}static set LOG_TO_SCREEN(e){z._logToScreen=e,z.ENABLED=z.ENABLED}static log(...e){}static error(...e){console.error(...e)}static warn(...e){}static screen(...e){z._screenClearFlag===!0&&(yi(),z._screenClearFlag=!1,setTimeout(()=>{z._screenClearFlag=!0},0)),z.screenLog("",...e);const t=vr();t&&(t.style.height="30px")}static screenLog(...e){qt("",...e)}static screenWarn(...e){qt("#fa4",...e)}static screenError(...e){console.error(...e),qt("#f44",...e),z.LOG_TO_SCREEN=!0}};a(z,"_enabled",!1),a(z,"_logToScreen",!1),a(z,"_screenClearFlag",!0);let _=z;var zn=(c=>(c.POSITION="position",c.TEXCOORD0="uv",c.TEXCOORD1="uv1",c.NORMAL="normal",c.TANGENT="tangent",c.COLOR="color",c.SKIN_INDEX="skinIndex",c.SKIN_WEIGHT="skinWeight",c.POSITION_LEGACY="aPos",c.TEXCOORD0_LEGACY="aUV0",c.TEXCOORD1_LEGACY="aUV1",c.NORMAL_LEGACY="aNormal",c.TANGENT_LEGACY="aTangent",c.COLOR_LEGACY="aColor",c.SKIN_INDEX_LEGACY="aSkinIndex",c.SKIN_WEIGHT_LEGACY="aSkinWeight",c))(zn||{});class Si{constructor(e,t,r){a(this,"data");a(this,"name");a(this,"stride");a(this,"bytesPerElement");this.name=e,this.stride=t,this.data=r,this.bytesPerElement=r.BYTES_PER_ELEMENT}}const qe=class qe{constructor(e,t=GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,r=GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST){a(this,"renderer");a(this,"_vertexBuffer",null);a(this,"indexBuffer",null);a(this,"indices",[]);a(this,"vertexCount",-1);a(this,"indexCount",-1);a(this,"vertexStride",0);a(this,"attributes",[]);a(this,"indexFormat","uint16");a(this,"interleaveDirty",!0);a(this,"name","unNamed");a(this,"id");a(this,"keepCPUData",!1);a(this,"attributeLayoutVersion",0);a(this,"vertexUsage");a(this,"indexUsage");this.id=e.instanceID++,this.renderer=e,this.vertexUsage=t,this.indexUsage=r}setAttribute(e,t,r){const n=this.getAttribute(e);n?((n.stride!=t||n.bytesPerElement!=r.BYTES_PER_ELEMENT)&&this.attributeLayoutVersion++,n.data=r,n.stride=t,n.bytesPerElement=r.BYTES_PER_ELEMENT):(this.attributes.push(new Si(e,t,r)),this.attributeLayoutVersion++),this.interleaveDirty=!0,this.vertexCount=r.length/t}getAttribute(e){for(const t of this.attributes)if(t.name==e)return t;return null}setIndices(e,t){this.indices=Array.isArray(e)?e:this.keepCPUData?Array.from(e):[],this.indexCount=e.length;let r=t=="uint32";if(!t&&!(e instanceof Uint16Array)){let s=0;for(let o=0;o<e.length;o++)e[o]>s&&(s=e[o]);r=s>65535}let n;r?n=e instanceof Uint32Array?e:new Uint32Array(e):e instanceof Uint16Array&&e.byteLength%4==0?n=e:(n=new Uint16Array(e.length+(e.length&1)),n.set(e));const i={size:n.byteLength,usage:this.indexUsage};this.indexBuffer&&this.renderer.destroyAfterSubmit(this.indexBuffer),this.indexBuffer=this.renderer.device.createBuffer(i),this.renderer.writeBuffer(this.indexBuffer,n),this.indexFormat=r?"uint32":"uint16"}getVertexLayout(){const e=[];let t=0;for(const r of this.attributes)e.push(t),t+=Math.ceil(r.stride*r.bytesPerElement/4)*4;return{offsets:e,arrayStride:t}}interleave(){for(const o of this.attributes)if(!o.data){_.warn("Mesh: the vertex buffer of",this.name,"is not updated: attribute",o.name,"has no data. Set keepCPUData = true before the first draw to change attributes afterwards, or set all of them again."),this.interleaveDirty=!1;return}const{offsets:e,arrayStride:t}=this.getVertexLayout(),r=this.attributes[0],n=r.data.length/r.stride;let i;if(this.attributes.length==1&&r.stride*r.bytesPerElement==t)i=r.data;else{const o=new ArrayBuffer(n*t);for(let l=0;l<this.attributes.length;l++){const h=this.attributes[l],u=h.data,d=new u.constructor(o),f=h.stride,m=t/h.bytesPerElement;let p=e[l]/h.bytesPerElement,x=0;for(let b=0;b<n;b++){for(let g=0;g<f;g++)d[p+g]=u[x+g];p+=m,x+=f}}i=new Uint8Array(o)}const s={size:i.byteLength,usage:this.vertexUsage};if(this._vertexBuffer&&this.renderer.destroyAfterSubmit(this._vertexBuffer),this._vertexBuffer=this.renderer.device.createBuffer(s),this.renderer.writeBuffer(this._vertexBuffer,i),this.vertexStride=t,this.vertexCount=n,this.interleaveDirty=!1,!this.keepCPUData){for(const o of this.attributes)o.data=null;this.indices=[]}}setVertexBuffer(e,t){this._vertexBuffer&&this._vertexBuffer!==e&&this.renderer.destroyAfterSubmit(this._vertexBuffer),this._vertexBuffer=e,this.vertexStride=this.getVertexLayout().arrayStride,this.vertexCount=t,this.interleaveDirty=!1}get vertexBuffer(){return(this.interleaveDirty||!this._vertexBuffer)&&this.interleave(),this._vertexBuffer}setJSONData(e){for(const t of e.attributes)this.setAttribute(t.name,t.stride,new Float32Array(t.data));e.indices&&e.indices.length>0&&this.setIndices(e.indices)}setPositions(e){this.setAttribute("position",3,e)}getPositions(){return this.getData("position")}setUV0(e){this.setAttribute("uv",2,e)}getUV0(){return this.getData("uv")}setNormals(e){this.setAttribute("normal",3,e)}getNormals(){return this.getData("normal")}getData(e){let t=this.getAttribute(e);return t||(t=this.getAttribute(qe.legacyNames.get(e))),t&&t.data?t.data:t&&!t.data?(console.warn("Mesh: getData - data was cleared after interleaving. Set keepCPUData=true before accessing vertexBuffer if you need to read back data."),null):(_.log("Mesh: getData",e,"no data"),null)}destruct(){this._vertexBuffer&&this.renderer.destroyAfterSubmit(this._vertexBuffer),this._vertexBuffer=null,this.indexBuffer&&this.renderer.destroyAfterSubmit(this.indexBuffer),this.indexBuffer=null}};a(qe,"legacyNames",new Map([["position","aPos"],["uv","aUV0"],["uv1","aUV1"],["normal","aNormal"],["tangent","aTangent"],["color","aColor"],["skinIndex","aSkinIndex"],["skinWeight","aSkinWeight"]])),a(qe,"legacyToNewNames",new Map(Array.from(qe.legacyNames,([e,t])=>[t,e])));let me=qe;const Mi={format:"rgba8unorm",useMips:!1,usage:typeof GPUTextureUsage<"u"?GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST:0,dimension:"2d",viewDimension:"2d",createTexture:!0};class ge{constructor(e,t=1,r=1,n=1,i={}){a(this,"renderer");a(this,"_gpuTexture");a(this,"view");a(this,"id",0);a(this,"_options");a(this,"mipViews",new Map);this.id=e.instanceID++,this.renderer=e,this._options={...Mi,...i},this._options.createTexture&&this.createTexture(t,r,n)}get options(){return this._options}setSize(e,t,r=1){this.width===e&&this.height===t&&this.depth===r||this.createTexture(e,t,r)}createTexture(e,t,r=1){this.clearMipViews(),this._gpuTexture&&this.renderer.destroyAfterSubmit(this._gpuTexture),this._gpuTexture=this.renderer.device.createTexture({size:[e,t,r],format:this.options.format,usage:this.options.usage,dimension:this.options.dimension,mipLevelCount:this.getMipCount(e,t,r)}),this.view=this.gpuTexture.createView({dimension:this.options.viewDimension,baseMipLevel:0,mipLevelCount:this.gpuTexture.mipLevelCount}),this.view.label="Texture_"+this.renderer.resourceID++}clearMipViews(){this.mipViews=new Map}getMipView(e,t=0){const r=t*32+e;let n=this.mipViews.get(r);return n||(n=this.gpuTexture.createView(ge.getMipViewDescriptor(this.gpuTexture,e,t)),this.mipViews.set(r,n)),n}static getMipViewDescriptor(e,t,r=0){return e.dimension=="3d"?{baseMipLevel:t,mipLevelCount:1,dimension:"3d"}:{baseMipLevel:t,mipLevelCount:1,dimension:"2d",baseArrayLayer:r,arrayLayerCount:1}}static canGenerateMipmaps(e,t){return/^(bc|etc2|eac|astc)/.test(t)||/^(depth|stencil)/.test(t)||/[us]int$/.test(t)||t=="rgb9e5ufloat"?!1:/(snorm|16unorm)$/.test(t)?e.features.has("texture-formats-tier1"):t=="rg11b10ufloat"?e.features.has("rg11b10ufloat-renderable"):t.includes("32float")?e.features.has("float32-filterable"):!0}getMipCount(e,t,r=-1){if(!this.options.useMips)return 1;let n=Math.max(e,t);return Math.floor(Math.log2(n))+1}get gpuTexture(){return this._gpuTexture}set gpuTexture(e){this._gpuTexture=e}get mipCount(){return this.gpuTexture.mipLevelCount}get width(){return this.gpuTexture?this.gpuTexture.width:0}get height(){return this.gpuTexture?this.gpuTexture.height:0}get depth(){return this.gpuTexture?this.gpuTexture.depthOrArrayLayers:0}get size(){return new k(this.width,this.height)}get aspectRatio(){return this.width/this.height}get format(){return this.gpuTexture.format}destruct(){this._gpuTexture&&this.renderer.destroyAfterSubmit(this._gpuTexture)}}const Ti={f:"f32",i:"i32",u:"u32"};class O{static maskComments(e){if(e===this.lastCode)return this.lastMasked;const t=e.split("");let r=0;for(;r<e.length;)if(e[r]==="/"&&e[r+1]==="/")for(;r<e.length&&e[r]!==`
`&&e[r]!=="\r";)t[r++]=" ";else if(e[r]==="/"&&e[r+1]==="*"){let n=0;for(;r<e.length;)if(e[r]==="/"&&e[r+1]==="*")n++,t[r]=t[r+1]=" ",r+=2;else if(e[r]==="*"&&e[r+1]==="/"){if(n--,t[r]=t[r+1]=" ",r+=2,n===0)break}else e[r]!==`
`&&e[r]!=="\r"&&(t[r]=" "),r++}else r++;return this.lastCode=e,this.lastMasked=t.join(""),this.lastMasked}static hoistDirectives(e){const t=this.maskComments(e),r=[],n=new Set,i=e.split(""),s=/^\s*(?:(?:enable|requires)\s+[A-Za-z_][\w\s,]*;|diagnostic\s*\([^()]*\)\s*;)/;let o=0,l=0;for(;l<t.length;){let h=t.indexOf(`
`,l);if(h<0&&(h=t.length),o===0){let u=l,d;for(;(d=s.exec(t.slice(u,h)))!==null;){const f=d[0].trim(),m=this.removeWhitespace(f);n.has(m)||(n.add(m),r.push(f));for(let p=u;p<u+d[0].length;p++)i[p]!==`
`&&i[p]!=="\r"&&(i[p]=" ");u+=d[0].length}}for(let u=l;u<h;u++)t[u]==="{"?o++:t[u]==="}"&&o--;l=h+1}return r.length===0?e:r.join(" ")+" "+i.join("")}static removeWhitespace(e){return e.replace(/\s+/g,"")}static parseScalarOrVector(e){const t=e.match(/^(f32|i32|u32)$/);if(t)return{scalar:t[1],components:1};const r=e.match(/^vec([234])(?:<(f32|i32|u32)>|([fiu]))$/);if(r)return{scalar:r[2]??Ti[r[3]],components:parseInt(r[1])}}static findClosing(e,t){const r=e[t],n=r==="("?")":r==="["?"]":"}";let i=0;for(let s=t;s<e.length;s++)if(e[s]===r)i++;else if(e[s]===n&&(i--,i===0))return s;return-1}static splitList(e){const t=[];let r=0,n=0;for(let i=0;i<=e.length;i++){const s=e[i];s==="("||s==="<"||s==="["?r++:s===")"||s===">"||s==="]"?r--:(s===","&&r===0||i===e.length)&&(e.slice(n,i).trim()&&t.push({text:e.slice(n,i),start:n}),n=i+1)}return t}static getFunctions(e){const t=[],r=/\bfn\s+([A-Za-z_]\w*)\s*\(/g;let n;for(;(n=r.exec(e))!==null;){const i=n.index+n[0].length-1,s=this.findClosing(e,i);if(s<0)continue;const o=e.indexOf("{",s),l=o<0?-1:this.findClosing(e,o);l<0||(t.push({name:n[1],params:e.slice(i+1,s),paramsStart:i+1,body:e.slice(o,l+1)}),r.lastIndex=l)}return t}static findFunction(e,t){return this.getFunctions(e).find(r=>r.name===t)}static findStruct(e,t){const r=new RegExp(`\\bstruct\\s+${t}\\s*\\{`).exec(e);if(!r)return;const n=r.index+r[0].length-1,i=this.findClosing(e,n);return i<0?void 0:{start:r.index,open:n,close:i}}static getAliases(e){const t=new Map,r=/\balias\s+([A-Za-z_]\w*)\s*=\s*([^;]+);/g;let n;for(;(n=r.exec(e))!==null;)t.set(n[1],this.removeWhitespace(n[2]));return t}static resolveAlias(e,t){for(let r=0;r<8&&t.has(e);r++)e=t.get(e);return e}static getIntegerConstants(e){const t=new Map,r=/\bconst\s+([A-Za-z_]\w*)\s*(?::\s*\w+\s*)?=\s*([^;]+);/g;let n;for(;(n=r.exec(e))!==null;){const i=this.parseInteger(n[2],t);i!==void 0&&t.set(n[1],i)}return t}static parseInteger(e,t){e=e.trim();const r=e.match(/^(0[xX][0-9a-fA-F]+|\d+)[iu]?$/);return r?parseInt(r[1]):t==null?void 0:t.get(e)}static getAttributeValue(e,t,r){const n=e.match(new RegExp(`@${t}\\s*\\(([^()]*)\\)`));if(!n)return;const i=n[1].replace(/,\s*$/,""),s=this.parseInteger(i,r);return s===void 0&&_.warn("WGSLUtils: can not evaluate",`@${t}(${i})`,"(supported: integer literals and integer consts)"),s}}a(O,"lastCode",""),a(O,"lastMasked","");class Yt{static replaceUniformsWithOrderedUniforms(e,t){const r=O.findStruct(O.maskComments(e),"Uniforms");return r?e.slice(0,r.start)+t+e.slice(r.close+1):e}static getUniformStructString(e){return`struct Uniforms {
${e.map(r=>`  ${r.name} : ${this.getTypeFromStride(r.stride,r.type)},
`).join("")}}
`}static getTypeFromStride(e,t="f32"){switch(e){case 16:return`mat4x4<${t}>`;case 4:return`vec4<${t}>`;case 3:return`vec3<${t}>`;case 2:return`vec2<${t}>`;default:return t}}static parseType(e){const t=O.parseScalarOrVector(e);if(t)return{type:t.scalar,stride:t.components};if(/^mat4x4(?:<f32>|f)$/.test(e))return{type:"f32",stride:16}}static getUniformsFromShader(e){e=O.maskComments(e);const t=O.findStruct(e,"Uniforms");if(!t)return[];const r=[];for(const n of O.splitList(e.slice(t.open+1,t.close))){const i=n.text.match(/([A-Za-z_]\w*)\s*:\s*([^]+)$/);if(!i)continue;const s=i[1],o=O.removeWhitespace(i[2]);let l=this.parseType(o);l||(_.warn("UniformUtils: unsupported uniform type, it is replaced by f32:",s,o,"(supported: f32, i32, u32, their vectors and mat4x4<f32>)"),l={type:"f32",stride:1}),r.push({name:s,type:l.type,stride:l.stride,startIndex:0})}return r}}class Ci{static createEntry(e,t,r,n){const i={binding:e,visibility:t};if(r.startsWith("sampler"))i.sampler={type:r==="sampler_comparison"?"comparison":"filtering"};else if(r==="texture_external")i.externalTexture={};else if(r.startsWith("texture_storage")){const s=r.match(/^texture_storage_(\w+)<(\w+),(\w+)>$/);if(!s)return _.warn("BindGroupUtils: can not parse storage texture type",r),i;const[,o,l,h]=s;i.storageTexture={access:h==="read_write"?"read-write":h==="read"?"read-only":"write-only",format:l,viewDimension:this.getViewDimension(o)},i.storageTexture.access!=="read-only"&&(i.visibility=t&~GPUShaderStage.VERTEX)}else if(r.startsWith("texture_depth"))i.texture={sampleType:"depth",viewDimension:this.getViewDimension(r.slice(14)),multisampled:r.includes("multisampled")};else if(r.startsWith("texture_")){const s=r.match(/^texture_(\w+)<(\w+)>$/);if(!s)return _.warn("BindGroupUtils: can not parse texture type",r),i;const[,o,l]=s,h=r.includes("multisampled");i.texture={sampleType:l==="f32"?h?"unfilterable-float":"float":l==="i32"?"sint":"uint",viewDimension:this.getViewDimension(o),multisampled:h}}else if(n.includes("uniform"))i.buffer={type:"uniform",hasDynamicOffset:r.includes("dynamic"),minBindingSize:0};else if(r.startsWith("array")||n.includes("storage")){const s=!n.includes("write");i.buffer={type:s?"read-only-storage":"storage",hasDynamicOffset:r.includes("dynamic"),minBindingSize:0},s||(i.visibility=t&~GPUShaderStage.VERTEX)}else _.warn("BindGroupUtils: unknown binding type",r,n);return i}static getViewDimension(e="2d"){const t=e.endsWith("_array"),r=e.replace("_array","").replace("multisampled_","");let n;switch(r){case"1d":n="1d";break;case"3d":n="3d";break;case"cube":n="cube";break;default:n="2d";break}return t?`${n}-array`:n}static getSamplingFunctions(e){const t=O.getFunctions(e),r=new Set;let n=!0;for(;n;){n=!1;for(const i of t)if(!r.has(i.name))for(const s of O.splitList(i.params)){const[,o,l]=s.text.match(/([A-Za-z_]\w*)\s*:\s*(\S+)/)||[];if(l!=null&&l.startsWith("texture")&&this.isTextureSampled(i.body,o,r)){r.add(i.name),n=!0;break}}}return r}static isTextureSampled(e,t,r){let n=`\\b(?:textureSample|textureGather)\\w*\\s*\\(\\s*(?:[^,()]*,\\s*)?${t}\\b`;return r.size>0&&(n+=`|\\b(?:${Array.from(r).join("|")})\\s*\\([^;{}]*\\b${t}\\b`),new RegExp(n).test(e)}static getBindGroupLayoutEntries(e){const t=[];e=O.maskComments(e);const r=O.getIntegerConstants(e),n=O.getAliases(e),i=this.getSamplingFunctions(e),s=(/@vertex/.test(e)?GPUShaderStage.VERTEX:0)|(/@fragment/.test(e)?GPUShaderStage.FRAGMENT:0)|(/@compute/.test(e)?GPUShaderStage.COMPUTE:0),o=/((?:@\w+(?:\s*\([^()]*\))?\s*)+)\bvar\b\s*(?:<([^>]*)>)?\s*([A-Za-z_]\w*)\s*:\s*([^;]+);/g;let l;for(;(l=o.exec(e))!==null;){const[,h,u,d,f]=l,m=O.getAttributeValue(h,"group",r),p=O.getAttributeValue(h,"binding",r);if(m===void 0||p===void 0)continue;const x=O.removeWhitespace(u??""),b=O.resolveAlias(O.removeWhitespace(f),n),g=this.createEntry(p,s,b,x);g.texture&&g.texture.sampleType==="float"&&!this.isTextureSampled(e,d,i)&&(g.texture.sampleType="unfilterable-float"),t.push(new Ei(g,d,m))}return t}}class Fr{static preprocess(e,t,r){var d;const n=r??new Map;for(const[f,m]of t)n.set(f,m);const i=e.split(`
`),s=O.maskComments(e).split(`
`),o=[],l=[],h=f=>{const m=n.get(f);return m!==!1&&m!==void 0},u=()=>{if(l.length===0)return!0;const f=l[l.length-1];return f.active&&f.parentActive};for(let f=0;f<i.length;f++){const m=i[f],p=s[f].trim();o[f]="";const x=p.match(/^#define\s+(\w+)(?:\s+(.+))?$/);if(x){if(u()){const g=x[1],y=(d=x[2])==null?void 0:d.trim();n.set(g,y!==void 0?y:!0)}continue}const b=p.match(/^#if(n?)def\s+(\w+)$/);if(b){const g=h(b[2]);l.push({active:b[1]?!g:g,parentActive:u(),elseAllowed:!0});continue}if(p==="#else"){if(l.length===0){_.warn("DefineUtils: #else without matching #ifdef/#ifndef");continue}const g=l[l.length-1];if(!g.elseAllowed){_.warn("DefineUtils: duplicate #else");continue}g.active=!g.active,g.elseAllowed=!1;continue}if(p==="#endif"){if(l.length===0){_.warn("DefineUtils: #endif without matching #ifdef/#ifndef");continue}l.pop();continue}p.startsWith("#")&&_.warn("DefineUtils: unsupported directive:",p,"(supported: #define NAME [value], #ifdef NAME, #ifndef NAME, #else, #endif)"),u()&&(o[f]=m)}return l.length>0&&_.warn(`DefineUtils: ${l.length} unclosed #ifdef/#ifndef block(s)`),this.substituteValues(o.join(`
`),n)}static substituteValues(e,t){const r=new Map;for(const[o,l]of t)(typeof l=="string"||typeof l=="number")&&r.set(o,String(l));if(r.size===0)return e;const n=new RegExp(`\\b(?:${Array.from(r.keys()).join("|")})\\b`,"g"),i=new Set,s=o=>o.replace(n,l=>{if(i.has(l))return l;i.add(l);const h=s(r.get(l));return i.delete(l),h});return s(e)}}class Ei{constructor(e,t,r){a(this,"bindGroupLayoutEntry");a(this,"name");a(this,"groupIndex");this.bindGroupLayoutEntry=e,this.name=t,this.groupIndex=r}}class ki{constructor(e,t,r){a(this,"dirty",!0);a(this,"entries",[]);a(this,"id",-1);a(this,"bindGroup");a(this,"bindGroupLayout");a(this,"index");a(this,"currentBindData",[]);a(this,"bindGroupEntries",[]);a(this,"dynamicOffsets",[0]);a(this,"indexOfUniformEntry",-1);a(this,"cached",null);a(this,"textureRefs",[]);this.entries=e,this.bindGroupLayout=t,this.index=r}}const zr=new WeakMap;let Ai=1;function Or(c){let e=zr.get(c);return e===void 0&&(e=Ai++,zr.set(c,e)),e}class Pi{constructor(e,t,r,n){a(this,"entries",[]);a(this,"bindGroup");a(this,"id",-1);a(this,"layout");a(this,"lastUse",0);this.entries=t,this.bindGroup=r,this.layout=n,this.id=e.instanceID++,this.lastUse=e.time.frameNumber}}class On{constructor(e,t,r,n={}){a(this,"renderer");a(this,"name");a(this,"shaderCode");a(this,"bindGroups",[]);a(this,"bindingsByName",new Map);a(this,"bindGroupCache",new Map);a(this,"lastCacheEviction",-1);a(this,"GPUBufferBindingByBuffer",new WeakMap);a(this,"_pipelineLayout",null);a(this,"constants");a(this,"uniforms",[]);a(this,"uniformsByName",new Map);a(this,"lengthMismatchWarned",new Set);a(this,"uniformData");a(this,"uniformDataInt");a(this,"uniformDataUint");a(this,"uniformsChanged",!0);a(this,"uniformOffset",0);a(this,"uniformEpoch",-1);a(this,"id",-1);a(this,"defines",new Map);if(this.renderer=e,this.name=t,e.shaderDefines)for(const[o,l]of e.shaderDefines)this.defines.set(o,l);if(n.defines)for(const[o,l]of Object.entries(n.defines))this.defines.set(o,l);this.id=e.instanceID++;const i=n.includes??[];let s=this.defines;i.length>0&&(s=new Map,Fr.preprocess(r,this.defines,s)),this.shaderCode=O.hoistDirectives(Fr.preprocess([...i,r].join(`
`),s)),this.initUniforms()}initBindGroups(){const e=Ci.getBindGroupLayoutEntries(this.shaderCode),t={},r={},n=[];for(const s of e)s.name=="uniforms"&&(s.bindGroupLayoutEntry.buffer.hasDynamicOffset=!0),n.indexOf(s.groupIndex)==-1&&(n.push(s.groupIndex),t[s.groupIndex]=[],r[s.groupIndex]=[]),t[s.groupIndex].push(s.bindGroupLayoutEntry),r[s.groupIndex].push(s);const i=n.length>0?Math.max(...n)+1:0;for(let s=0;s<i;s++)n.indexOf(s)==-1&&(n.push(s),t[s]=[],r[s]=[]);for(const s of n){const o={label:this.name+"_"+s,entries:t[s]},l=this.renderer.device.createBindGroupLayout(o);this.bindGroups[s]=new ki(r[s],l,s)}for(const s of this.bindGroups)for(const o of s.entries)this.bindingsByName.has(o.name)||this.bindingsByName.set(o.name,o)}setConstant(e,t){this.constants.has(e)?this.constants.set(e,t)&&this.constantsChanged():console.warn("constant not found",this.name,e,this.constants.names,this.shaderCode)}getConstant(e){return this.constants.has(e)||console.warn("constant not found",this.name,e,this.constants.names),this.constants.get(e)}constantsChanged(){}get bindGroupLayouts(){const e=[];for(const t of this.bindGroups)e.push(t.bindGroupLayout);return e}get pipelineLayout(){return this._pipelineLayout||(this._pipelineLayout=this.renderer.device.createPipelineLayout({label:this.name+"_pipeline_layout",bindGroupLayouts:this.bindGroupLayouts})),this._pipelineLayout}getBindGroupIds(e){e.length=this.bindGroups.length;for(let t=0;t<this.bindGroups.length;t++){const r=this.bindGroups[t];this.updateBindGroup(r),e[t]=r.id}return e}setBindGroups(e,t,r){for(const n of this.bindGroups){this.updateBindGroup(n);const i=n.indexOfUniformEntry>=0;r&&r.bindGroups[n.index]===n.bindGroup&&(!i||r.offsets[n.index]===t)||(i?(n.dynamicOffsets[0]=t,e.setBindGroup(n.index,n.bindGroup,n.dynamicOffsets)):e.setBindGroup(n.index,n.bindGroup),r&&(r.bindGroups[n.index]=n.bindGroup,r.offsets[n.index]=t))}}bindAtIndex(e,t,r){const n=this.bindGroups[r];if(!n){_.warn("bindGroup not found at group index",this.name,r,this.bindGroups);return}n.currentBindData[t]!=e&&(e instanceof GPUBuffer?n.bindGroupEntries[t]={binding:t,resource:this.getBufferBindingByBuffer(e)}:n.bindGroupEntries[t]={binding:t,resource:e},n.currentBindData[t]=e,n.dirty=!0)}getBindingByName(e){return this.bindingsByName.get(e)}setBinding(e,t){const r=this.getBindingByName(e);r?(this.setTextureRef(r,null),this.bindAtIndex(t,r.bindGroupLayoutEntry.binding,r.groupIndex)):_.warn("binding not found",this.name,e,t,this.bindGroups)}setTextureRef(e,t){const r=this.bindGroups[e.groupIndex];if(!r)return;const n=e.bindGroupLayoutEntry.binding,i=r.textureRefs;for(let s=0;s<i.length;s++)if(i[s].binding===n){t?i[s].texture=t:i.splice(s,1);return}t&&i.push({binding:n,texture:t})}bindUnboundBindings(e){for(const t of e.entries){const r=t.bindGroupLayoutEntry;if(t.name=="uniforms")this.bindAtIndex(this.renderer.uniformBuffer,r.binding,e.index),e.bindGroupEntries[r.binding].resource.size=this.uniformData.byteLength,e.indexOfUniformEntry=r.binding;else{if(e.currentBindData[r.binding])continue;r.sampler||_.warn(this.name,e.index,"dummy data bound: ",r),this.bindAtIndex(this.renderer.dummyBindings.getDummyBindData(r,this.name),r.binding,e.index)}}}setSampler(e,t){this.setBinding(e,t)}setBuffer(e,t){this.setBinding(e,t)}setTexture(e,t){if(!(t instanceof ge)){this.setBinding(e,t);return}const r=this.getBindingByName(e);if(!r){_.warn("binding not found",this.name,e,t,this.bindGroups);return}this.setTextureRef(r,t),t.view&&this.bindAtIndex(t.view,r.bindGroupLayoutEntry.binding,r.groupIndex)}setExternalTexture(e,t){this.setBinding(e,t)}getBufferBindingByBuffer(e){if(this.GPUBufferBindingByBuffer.has(e))return this.GPUBufferBindingByBuffer.get(e);{const t={buffer:e};return this.GPUBufferBindingByBuffer.set(e,t),t}}createBindGroup(e,t){return this.renderer.device.createBindGroup({label:this.name+"_"+e.index,layout:e.bindGroupLayout,entries:t})}updateBindGroup(e){e.indexOfUniformEntry>=0&&e.currentBindData[e.indexOfUniformEntry]!==this.renderer.uniformBuffer&&(e.dirty=!0);const t=e.textureRefs;for(let n=0;n<t.length;n++){const i=t[n].texture.view;i&&i!==e.currentBindData[t[n].binding]&&this.bindAtIndex(i,t[n].binding,e.index)}const r=this.renderer.time.frameNumber;if(e.dirty){this.bindUnboundBindings(e);const n=this.hashEntries(e);let i=this.getBindGroupByEntries(e,n);if(!i){const s=e.bindGroupEntries.filter(l=>l);i=new Pi(this.renderer,s,this.createBindGroup(e,s),e.bindGroupLayout),this.lastCacheEviction!==r&&(this.lastCacheEviction=r,this.evictBindGroups(r-10));let o=this.bindGroupCache.get(n);o||(o=[],this.bindGroupCache.set(n,o)),o.push(i)}e.cached=i,e.id=i.id,e.bindGroup=i.bindGroup,e.dirty=!1}e.cached&&(e.cached.lastUse=r)}evictBindGroups(e){for(const[t,r]of this.bindGroupCache){let n=0;for(const i of r)i.lastUse>e&&(r[n++]=i);r.length=n,n===0&&this.bindGroupCache.delete(t)}}hashEntries(e){let t=Or(e.bindGroupLayout);const r=e.bindGroupEntries;for(let n=0;n<r.length;n++){const i=r[n];i&&(t=Math.imul(t,31)+i.binding|0,t=Math.imul(t,31)+Or(i.resource)|0)}return t}getBindGroupByEntries(e,t){const r=this.bindGroupCache.get(t);if(!r)return null;const n=e.bindGroupEntries;for(const i of r){if(i.layout!==e.bindGroupLayout)continue;const s=i.entries;let o=0,l=!0;for(let h=0;h<n.length;h++){const u=n[h];if(!u)continue;const d=s[o++];if(!d||d.binding!==u.binding||d.resource!==u.resource){l=!1;break}}if(l&&o===s.length)return i}return null}destruct(){this.bindGroupCache.clear();for(const e of this.bindGroups)e.textureRefs=[],e.currentBindData=[],e.bindGroupEntries=[],e.cached=null,e.dirty=!0}initUniforms(){const e=Yt.getUniformsFromShader(this.shaderCode);if(e.length>0){this.uniforms=this.orderUniforms(e);for(const r of this.uniforms)this.uniformsByName.has(r.name)||this.uniformsByName.set(r.name,r);const t=Yt.getUniformStructString(this.uniforms);this.shaderCode=Yt.replaceUniformsWithOrderedUniforms(this.shaderCode,t)}}setBool(e,t){this.setUniformComponents(e,1,t?1:0)}setFloat(e,t){this.setUniformComponents(e,1,t)}setVector2(e,t){this.setUniformComponents(e,2,t.x,t.y)}setVector3(e,t){this.setUniformComponents(e,3,t.x,t.y,t.z)}setVector4(e,t){this.setUniformComponents(e,4,t.x,t.y,t.z,t.w)}setUniformComponents(e,t,r,n=0,i=0,s=0){const o=this.getUniform(e);if(!o)return;o.stride!=t&&(this.warnLengthMismatch(o,t),t=Math.min(t,o.stride));const l=this.getUniformDataView(o),h=o.startIndex;l[h]=r,t>1&&(l[h+1]=n),t>2&&(l[h+2]=i),t>3&&(l[h+3]=s),this.uniformsChanged=!0}setMatrix(e,t){this.setUniform(e,t.m)}setUniform(e,t,r=!0){const n=this.getUniform(e,r);n&&(n.stride!=t.length&&(this.warnLengthMismatch(n,t.length),t.length>n.stride&&(t=t.slice(0,n.stride))),this.getUniformDataView(n).set(t,n.startIndex),this.uniformsChanged=!0)}warnLengthMismatch(e,t){this.lengthMismatchWarned.has(e.name)||(this.lengthMismatchWarned.add(e.name),console.warn("setUniform: value length does not match uniform length",this.name,e.name,e.stride,t))}getUniformValue(e){const t=this.getUniform(e);if(t){const r=[],n=this.getUniformDataView(t);for(let i=0;i<t.stride;i++)r.push(n[t.startIndex+i]);return r}return[]}getUniformDataView(e){return e.type=="i32"?this.uniformDataInt:e.type=="u32"?this.uniformDataUint:this.uniformData}hasUniform(e){return this.uniformsByName.has(e)}getUniform(e,t=!0){const r=this.uniformsByName.get(e);return r||(t&&_.warn("uniform not found on shader",this.name,e,this.uniforms),null)}orderUniforms(e){const t=[];let r=0;e.sort((i,s)=>i.stride-s.stride);let n=0;do{const i=e.pop();i&&(t.push(i),i.startIndex=n,n+=i.stride);let s=(4-n%4)%4;for(let o=e.length-1;o>=0&&s>0;o--){const l=e[o];l.stride<=s&&(s-=l.stride,t.push(l),l.startIndex=n,n+=l.stride,e.splice(o,1))}for(let o=0;o<s;o++)t.push({name:`padding${r++}`,startIndex:n,stride:1,type:"f32"}),n++}while(e.length>0);return this.uniformData=new Float32Array(n),this.uniformDataInt=new Int32Array(this.uniformData.buffer),this.uniformDataUint=new Uint32Array(this.uniformData.buffer),t}}class _i{static getOverrides(e){const t=[];e=O.maskComments(e);const r=O.getIntegerConstants(e),n=/((?:@\w+(?:\s*\([^()]*\))?\s*)*)\boverride\s+([A-Za-z_]\w*)\s*(?::\s*(\w+)\s*)?(?:=\s*([^;]+))?;/g;let i;for(;(i=n.exec(e))!==null;){const[,s,o,l,h]=i,u=O.getAttributeValue(s,"id",r),d=h!==void 0?this.parseLiteral(h.trim()):void 0,f=l??(d==null?void 0:d.type),m=h===void 0?f==="bool"?!1:0:d==null?void 0:d.value;t.push({name:o,key:u!==void 0?String(u):o,type:f,value:m,hasDefault:h!==void 0})}return t}static parseLiteral(e){if(e==="true"||e==="false")return{value:e==="true",type:"bool"};const t=e.match(/^(-?)0[xX]([0-9a-fA-F]+)([iu]?)$/);if(t)return{value:parseInt(t[1]+t[2],16),type:t[3]==="u"?"u32":"i32"};const r=e.match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?([iufh]?)$/);if(r){const n=r[1],i=n==="f"||n==="h"||/[.eE]/.test(e),s=n==="u"?"u32":n==="h"?"f16":i?"f32":"i32";return{value:parseFloat(e),type:s}}}}class Nn{constructor(e,t){a(this,"overridesByName",new Map);a(this,"values",{});for(const r of _i.getOverrides(e))this.overridesByName.set(r.name,r),!r.hasDefault&&t&&(this.values[r.key]=Number(r.value))}has(e){return this.overridesByName.has(e)}get(e){const t=this.overridesByName.get(e);if(!t)return;if(!Object.hasOwn(this.values,t.key))return t.hasDefault?t.value:void 0;const r=this.values[t.key];return t.type==="bool"?r!==0:r}set(e,t){const r=this.overridesByName.get(e);return!r||Number(this.get(e))===Number(t)?!1:(r.hasDefault&&Number(r.value)===Number(t)?delete this.values[r.key]:this.values[r.key]=Number(t),!0)}get key(){return Object.keys(this.values).sort().map(e=>`${e}=${this.values[e]}`).join(",")}get names(){return Array.from(this.overridesByName.keys())}}const Nr=new WeakMap;let Ri=0;function Li(c){let e=Nr.get(c);return e===void 0&&(e=Ri++,Nr.set(c,e)),e}const dt=class dt extends On{constructor(t,r,n,i={}){super(t,r,n,i);a(this,"shaderModule");a(this,"_vertexBufferLayout",[]);a(this,"vertexBufferLayoutKey","");a(this,"_dirty",!0);a(this,"_version",0);a(this,"pipelines",new Map);a(this,"stateKey","");a(this,"warnedAboutEviction",!1);a(this,"asyncPipeline");a(this,"pendingPipelines",new Set);a(this,"lastPipelines",new Map);a(this,"_pipeline",null);a(this,"pipelineRenderTarget",null);a(this,"pipelineMipLevel",-1);a(this,"pipelineVertexBufferLayoutKey","");a(this,"_alphaToCoverageEnabled",!1);a(this,"_depthWriteEnabled",!0);a(this,"_topology","triangle-list");a(this,"_stripIndexFormat");a(this,"_cullMode","back");a(this,"_depthCompare","less");a(this,"blendStates",[]);a(this,"_depthBias",0);a(this,"_stencilCompare","always");a(this,"_stencilFailOp","keep");a(this,"_stencilDepthFailOp","keep");a(this,"_stencilPassOp","keep");a(this,"_stencilReadMask",255);a(this,"_stencilWriteMask",255);a(this,"_colorWriteFlags",GPUColorWrite.ALL);this.asyncPipeline=i.asyncPipeline??!1,this.constants=new Nn(this.shaderCode,!0),this.initBindGroups(),this.shaderModule=this.renderer.device.createShaderModule({code:this.shaderCode,label:this.name})}get dirty(){return this._dirty}get version(){return this._version}markDirty(){this._dirty=!0,this._version++}constantsChanged(){this.markDirty()}set vertexBufferLayout(t){let r=this._vertexBufferLayout.length!=t.length;for(let n=0;n<t.length&&!r;n++)r=t[n]!=this._vertexBufferLayout[n];r&&(this._vertexBufferLayout=t,this.vertexBufferLayoutKey=t.map(Li).join(","))}setVertexBufferLayout(t){this._vertexBufferLayout.length==1&&this._vertexBufferLayout[0]==t||(this.vertexBufferLayout=[t])}clearVertexBufferLayout(){this._vertexBufferLayout.length!=0&&(this.vertexBufferLayout=[])}set cullMode(t){this._cullMode!=t&&(this._cullMode=t,this.markDirty())}set topology(t){this._topology!=t&&(this._topology=t,this.markDirty())}set stripIndexFormat(t){this._stripIndexFormat!=t&&(this._stripIndexFormat=t,this.markDirty())}set alphaToCoverageEnabled(t){this._alphaToCoverageEnabled!=t&&(this._alphaToCoverageEnabled=t,this.markDirty())}set depthWriteEnabled(t){this._depthWriteEnabled!=t&&(this._depthWriteEnabled=t,this.markDirty())}set depthCompare(t){this._depthCompare!=t&&(this._depthCompare=t,this.markDirty())}set depthBias(t){this._depthBias!=t&&(this._depthBias=t,this.markDirty())}set stencilCompare(t){this._stencilCompare!=t&&(this._stencilCompare=t,this.markDirty())}set stencilFailOp(t){this._stencilFailOp!=t&&(this._stencilFailOp=t,this.markDirty())}set stencilDepthFailOp(t){this._stencilDepthFailOp!=t&&(this._stencilDepthFailOp=t,this.markDirty())}set stencilPassOp(t){this._stencilPassOp!=t&&(this._stencilPassOp=t,this.markDirty())}set stencilReadMask(t){this._stencilReadMask!=t&&(this._stencilReadMask=t,this.markDirty())}set stencilWriteMask(t){this._stencilWriteMask!=t&&(this._stencilWriteMask=t,this.markDirty())}setColorWriteMask(t){this._colorWriteFlags!=t&&(this._colorWriteFlags=t,this.markDirty())}setDefaultBlending(t=0){this.blendStates[t]&&(this.blendStates[t]=null,this.markDirty())}setPremultipliedAlphaBlending(t=0){this.setBlending(t,"one","one-minus-src-alpha","one","one-minus-src-alpha")}setAlphaBlending(t=0){this.setBlending(t,"src-alpha","one-minus-src-alpha","one","one-minus-src-alpha")}setAdditiveBlending(t=0){this.setBlending(t,"one","one","one","one")}setMultipliedBlending(t=0){this.setBlending(t,"zero","src","zero","src-alpha")}setBlendState(t,r=0){if(!t){this.setDefaultBlending(r);return}this.setBlending(r,t.color.srcFactor??"one",t.color.dstFactor??"zero",t.alpha.srcFactor??"one",t.alpha.dstFactor??"zero",t.color.operation??"add",t.alpha.operation??"add")}setBlending(t,r,n,i,s,o="add",l="add"){const h=this.blendStates[t];h&&h.color.srcFactor==r&&h.color.dstFactor==n&&h.color.operation==o&&h.alpha.srcFactor==i&&h.alpha.dstFactor==s&&h.alpha.operation==l||(this.blendStates[t]={color:{operation:o,srcFactor:r,dstFactor:n},alpha:{operation:l,srcFactor:i,dstFactor:s}},this.markDirty())}createPipelineDescriptor(t,r){const n={module:this.shaderModule,entryPoint:"vs_main",buffers:this._vertexBufferLayout,constants:this.constants.values},i={topology:this._topology,cullMode:this._cullMode};this._stripIndexFormat&&this._topology.endsWith("strip")&&(i.stripIndexFormat=this._stripIndexFormat);const s=[],o=t.formats;for(let d=0;d<o.length;d++){const f={format:o[d],writeMask:this._colorWriteFlags},m=this.blendStates[d];m&&(f.blend=m),s.push(f)}const l=t.getSampleCount(r),h={module:this.shaderModule,entryPoint:"fs_main",targets:s,constants:this.constants.values};let u={layout:this.pipelineLayout,vertex:n,fragment:h,primitive:i,multisample:{count:l,alphaToCoverageEnabled:this._alphaToCoverageEnabled&&l>1},label:this.name};if(t.depthStencilAttachment&&r==0){const d={format:t.depthStencilAttachment.format};if(t.depthEnabled&&(d.depthWriteEnabled=this._depthWriteEnabled,d.depthCompare=this._depthCompare,d.depthBias=this._depthBias),t.stencilEnabled){const f={compare:this._stencilCompare,failOp:this._stencilFailOp,depthFailOp:this._stencilDepthFailOp,passOp:this._stencilPassOp};d.stencilFront=f,d.stencilBack=f,d.stencilReadMask=this._stencilReadMask,d.stencilWriteMask=this._stencilWriteMask}u.depthStencil=d}return u}createPipeline(t,r){const n=this.createPipelineDescriptor(t,r),i=this.renderer.device.createRenderPipeline(n);return _.log("created pipeline",this.name,this.pipelines.size+1,n),i}createPipelineAsync(t,r,n){const i=this.createPipelineDescriptor(r,n);this.pendingPipelines.add(t);const s=this.pendingPipelines;this.renderer.device.createRenderPipelineAsync(i).then(o=>{s!==this.pendingPipelines||!s.delete(t)||(_.log("created pipeline async",this.name,this.pipelines.size+1,i),this.storePipeline(t,o))},o=>{s!==this.pendingPipelines||!s.delete(t)||(_.warn("VertexFragmentShader: createRenderPipelineAsync failed, creating it sync",this.name,o),this.storePipeline(t,this.renderer.device.createRenderPipeline(i)))})}storePipeline(t,r){this.pipelines.size>=dt.MAX_PIPELINES&&(this.pipelines.delete(this.pipelines.keys().next().value),this.warnedAboutEviction||(this.warnedAboutEviction=!0,_.warn("VertexFragmentShader: more than",dt.MAX_PIPELINES,"pipelines in use, the least recently used ones are created again when needed",this.name))),this.pipelines.set(t,r)}getStateKey(){return[this._topology,this._stripIndexFormat,this._cullMode,this._alphaToCoverageEnabled,this._depthWriteEnabled,this._depthCompare,this._depthBias,this._stencilCompare,this._stencilFailOp,this._stencilDepthFailOp,this._stencilPassOp,this._stencilReadMask,this._stencilWriteMask,this._colorWriteFlags,JSON.stringify(this.blendStates),this.constants.key].join("_")}getTargetKey(t,r){let n=t.getSampleCount(r)+"_"+t.formats.join("_");return t.depthStencilAttachment&&r==0&&(n+="_"+t.depthStencilAttachment.format+"_"+t.depthEnabled+"_"+t.stencilEnabled),n+"_"+this.vertexBufferLayoutKey}get pipeline(){const t=this.renderer.renderTarget,r=this.renderer.currentRenderTextureMipLevel;if(this._pipeline&&!this._dirty&&t===this.pipelineRenderTarget&&r===this.pipelineMipLevel&&this.vertexBufferLayoutKey===this.pipelineVertexBufferLayoutKey)return this._pipeline;this.pipelineRenderTarget=t,this.pipelineMipLevel=r,this.pipelineVertexBufferLayoutKey=this.vertexBufferLayoutKey,this._dirty&&(this.stateKey=this.getStateKey(),this._dirty=!1);const n=this.getTargetKey(t,r),i=n+"|"+this.stateKey;let s=this.pipelines.get(i);if(s)this.pipelines.delete(i),this.pipelines.set(i,s);else{if(this.asyncPipeline)return this.pendingPipelines.has(i)||this.createPipelineAsync(i,t,r),this._pipeline=null,this.lastPipelines.get(n)??null;s=this.createPipeline(t,r),this.storePipeline(i,s)}return this.asyncPipeline&&this.lastPipelines.set(n,s),this._pipeline=s,this._pipeline}destruct(){super.destruct(),this.pipelines.clear(),this.pendingPipelines=new Set,this.lastPipelines.clear(),this.pipelineRenderTarget=null,this._pipeline=null}};a(dt,"MAX_PIPELINES",64);let G=dt;const Bi={toScreen:!1,sampleCount:1,depth:!1,depthFormat:"depth24plus",stencil:!1,formats:["rgba8unorm"],scaleToCanvas:!1,sizeMultiplier:1,useMips:!1,depthOrArrayLength:1,colorTarget:null,discardMSAA:!1,discardDepth:!1,createTexture:!1};class H extends ge{constructor(t,r=1,n=1,i={}){super(t,r,n,i.depthOrArrayLength,{...Bi,...i});a(this,"attachments",[]);a(this,"views",[]);a(this,"depthStencilAttachment",null);a(this,"_depthSlice",0);a(this,"_depthStencilView",null);a(this,"_renderPassDescriptor");a(this,"resolveTextures",[]);a(this,"resolveViews",[]);a(this,"sampledViews",[]);a(this,"targetWidth",0);a(this,"targetHeight",0);a(this,"colorLoadOp","clear");a(this,"clearColor",[0,0,0,0]);a(this,"attachmentMipViews",new Map);a(this,"mipRenderPassDescriptors",[]);a(this,"canvasTexture",null);i.scaleToCanvas&&(r=t.canvas.width,n=t.canvas.height),this.setSize(r,n)}get options(){return super.options}get formats(){return this.options.formats}get sampleCount(){return this.options.sampleCount}getSampleCount(t){return t>0?1:this.sampleCount}get resizeToCanvas(){return this.options.scaleToCanvas}getRenderPassDescriptor(t=0){if(t==0){if(this.options.toScreen){this.updateCanvasView();const r=this._renderPassDescriptor.colorAttachments[0];this.options.sampleCount>1?r.resolveTarget=this.view:r.view=this.view}return this._renderPassDescriptor}else return this.getRenderPassDescriptorForMipLevel(t)}updateCanvasView(){const t=this.renderer.context.getCurrentTexture();t!==this.canvasTexture&&(this.canvasTexture=t,this.view=t.createView())}get sizeMultiplier(){return this.options.sizeMultiplier}set sizeMultiplier(t){this.options.sizeMultiplier=t}get gpuTexture(){return this.rendersToCanvasTexture?this.renderer.context.getCurrentTexture():this.getGPUTexture(0)}getGPUTexture(t){return this.resolveTextures[t]??this.attachments[t]}getView(t){return t==0?this.view:this.sampledViews[t]}get rendersToCanvasTexture(){return this.options.toScreen&&this.sampleCount==1}get width(){return this.options.colorTarget||this.rendersToCanvasTexture?this.targetWidth:super.width}get height(){return this.options.colorTarget||this.rendersToCanvasTexture?this.targetHeight:super.height}get msaaTextureView(){return this.sampleCount>1?this.views[0]:null}get depthStencilView(){return this._depthStencilView}clear(t,r,n,i,s=n,o=0){if(this.colorLoadOp=t?"clear":"load",this.clearColor=r,this._renderPassDescriptor){for(const h of this._renderPassDescriptor.colorAttachments)h&&(h.loadOp=this.colorLoadOp,h.clearValue=r);const l=this._renderPassDescriptor.depthStencilAttachment;l&&this.options.depth&&(l.depthLoadOp=n?"clear":"load",l.depthClearValue=i),l&&this.options.stencil&&(l.stencilLoadOp=s?"clear":"load",l.stencilClearValue=o)}}setSize(t,r){t=Math.ceil(t*this.options.sizeMultiplier),r=Math.ceil(r*this.options.sizeMultiplier),(this.width!=t||this.height!=r)&&(this.createAttachments(t,r,this.options.depthOrArrayLength),this.createRenderPassDescriptor(),_.log("RenderTexture: setSize",t,r))}setSlice(t){if(this.depth>1)if(t<this.depth){this._depthSlice=t;for(const r of this._renderPassDescriptor.colorAttachments)r&&(r.depthSlice=t)}else _.warn("RenderTexture: setSlice out of bounds",t,this.depth)}setColorTarget(t){var n,i;this.options.colorTarget=t,this.views[0]=t,this.view=t,this.mipRenderPassDescriptors=[];const r=(i=(n=this._renderPassDescriptor)==null?void 0:n.colorAttachments)==null?void 0:i[0];r?r.view=t:this.createRenderPassDescriptor()}destruct(){for(const t of this.attachments)this.renderer.destroyAfterSubmit(t);for(const t of this.resolveTextures)t&&this.renderer.destroyAfterSubmit(t);this.depthStencilAttachment&&this.renderer.destroyAfterSubmit(this.depthStencilAttachment)}createAttachments(t,r,n){for(const d of this.attachments)this.renderer.destroyAfterSubmit(d);for(const d of this.resolveTextures)d&&this.renderer.destroyAfterSubmit(d);this.depthStencilAttachment&&this.renderer.destroyAfterSubmit(this.depthStencilAttachment),this.depthStencilAttachment=null,this._depthStencilView=null,this.attachments=[],this.views=[],this.resolveTextures=[],this.resolveViews=[],this.sampledViews=[],this.clearMipViews(),this.attachmentMipViews=new Map,this.mipRenderPassDescriptors=[];const i=this.options.colorTarget,s=!i&&!this.rendersToCanvasTexture;s||(this.targetWidth=t,this.targetHeight=r),i&&(this.views.push(i),this.view=i),this.rendersToCanvasTexture&&(this.updateCanvasView(),this.views.push(this.view));const o=this.sampleCount>1,l=this.getMipCount(t,r),h=this.options.usage|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC,u=s?this.options.formats:[];for(let d=0;d<u.length;d++){const f=this.renderer.device.createTexture({size:[t,r,n],usage:h,dimension:n==1?"2d":"3d",format:u[d],sampleCount:this.sampleCount,mipLevelCount:o?1:l});if(this.attachments.push(f),this.views.push(f.createView({mipLevelCount:1})),o&&!(this.options.toScreen&&d==0)){const p=this.renderer.device.createTexture({size:[t,r],format:u[d],usage:h,sampleCount:1,mipLevelCount:l});this.resolveTextures[d]=p,this.resolveViews[d]=p.createView({mipLevelCount:1})}const m=this.getGPUTexture(d);this.sampledViews[d]=m.createView({mipLevelCount:m.mipLevelCount})}if(this.attachments.length>0&&(this.view=this.sampledViews[0]),this.options.depth||this.options.stencil){const d=this.options.stencil?this.options.depth?"depth24plus-stencil8":"stencil8":this.options.depthFormat;this.depthStencilAttachment=this.renderer.device.createTexture({size:[t,r],format:d,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|(d=="depth32float"?GPUTextureUsage.COPY_SRC:0),sampleCount:this.sampleCount}),this._depthStencilView=this.depthStencilAttachment.createView({mipLevelCount:1})}}getRenderPassDescriptorForMipLevel(t){let r=this.mipRenderPassDescriptors[t];if(!r){const i=[],s=Math.max(1,this.attachments.length);for(let o=0;o<s;o++)i.push({loadOp:this.colorLoadOp,storeOp:"store",view:o==0?this.getMipView(t):this.getAttachmentMipView(o,t)});r={colorAttachments:i},this.mipRenderPassDescriptors[t]=r}const n=this.options.depthOrArrayLength>1?Math.min(this._depthSlice,Math.max(1,this.options.depthOrArrayLength>>t)-1):void 0;for(const i of r.colorAttachments)i&&(i.loadOp=this.colorLoadOp,i.clearValue=this.clearColor,n!==void 0&&(i.depthSlice=n));return r}getAttachmentMipView(t,r){const n=t*32+r;let i=this.attachmentMipViews.get(n);if(!i){const s=this.getGPUTexture(t);i=s.createView(ge.getMipViewDescriptor(s,r)),this.attachmentMipViews.set(n,i)}return i}createRenderPassDescriptor(){const t=[];for(let r=0;r<this.views.length;r++){const n={loadOp:"clear",storeOp:"store",view:this.views[r]};this.options.depthOrArrayLength>1&&(n.depthSlice=this._depthSlice),this.resolveViews[r]&&(n.resolveTarget=this.resolveViews[r]),this.sampleCount>1&&this.options.discardMSAA&&(n.storeOp="discard"),t.push(n)}this._renderPassDescriptor={colorAttachments:t},this._depthStencilView&&(this._renderPassDescriptor.depthStencilAttachment={view:this._depthStencilView},this.options.depth&&(this._renderPassDescriptor.depthStencilAttachment.depthLoadOp="clear",this._renderPassDescriptor.depthStencilAttachment.depthStoreOp=this.options.discardDepth?"discard":"store"),this.options.stencil&&(this._renderPassDescriptor.depthStencilAttachment.stencilLoadOp="clear",this._renderPassDescriptor.depthStencilAttachment.stencilStoreOp="store"))}generateMipmaps(t=null){this.renderer.createMipsForRenderTexture(this,t)}get stencilEnabled(){return this.options.stencil}get depthEnabled(){return this.options.depth}}const Vn=`struct VertexInput {\r
	@location(0) position : vec3<f32>,\r
	@location(1) uv : vec2<f32>\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) uv : vec2<f32>,\r
}\r
\r
@group(0) @binding(0) var textureSampler: sampler;\r
@group(0) @binding(1) var texture: texture_2d<f32>;\r
\r
@vertex\r
fn vs_main(input: VertexInput) -> VertexOutput {\r
	var output : VertexOutput;\r
	output.position = vec4<f32>(input.position, 1.);\r
	output.uv = input.uv;\r
	return output;\r
}\r
\r
@fragment\r
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {\r
  return textureSample(texture, textureSampler, input.uv);\r
}\r
`;class Ii extends H{constructor(t,r){super(t,0,0,{formats:[r]});a(this,"texture");a(this,"arrayLayer",0)}getRenderPassDescriptor(t){return{colorAttachments:[{view:this.texture.getMipView(t,this.arrayLayer),loadOp:"clear",storeOp:"store"}]}}}class Di{constructor(e){a(this,"renderer");a(this,"material");a(this,"targetByFormat",new Map);this.renderer=e,this.material=new G(e,"mipmap",Vn),this.material.setSampler("textureSampler",e.device.createSampler({minFilter:"linear",magFilter:"linear"}))}generateMipmaps(e,t=this.material){if(e.gpuTexture.dimension!="2d")throw new Error("Generating mipmaps for non-2d textures is currently unsupported!");if(!(e.gpuTexture.usage&GPUTextureUsage.RENDER_ATTACHMENT)){_.warn("generateMipmaps: texture was not created with RENDER_ATTACHMENT usage",e);return}if(!ge.canGenerateMipmaps(this.renderer.device,e.format)){_.warn("generateMipmaps: the mips of this format can not be rendered",e.format);return}let r=this.targetByFormat.get(e.format);r||(r=new Ii(this.renderer,e.format),this.targetByFormat.set(e.format,r)),r.texture=e;for(let n=0;n<e.depth;n++){r.arrayLayer=n;for(let i=1;i<e.mipCount;i++)this.renderer.blit(e.getMipView(i-1,n),r,t,!0,i)}}}class Fi{static getVertexInputs(e){const t=[],r=O.maskComments(e),n=O.getIntegerConstants(r),i=[],s=l=>{const h=O.findStruct(r,l);h&&i.push({start:h.open+1,end:h.close})},o=O.findFunction(r,"vs_main");if(o){i.push({start:o.paramsStart,end:o.paramsStart+o.params.length});for(const l of O.splitList(o.params)){const[,h]=l.text.match(/^[^@]*?[A-Za-z_]\w*\s*:\s*([A-Za-z_]\w*)\s*$/)||[];h&&s(h)}}else s("VertexInput");for(const l of i)for(const h of O.splitList(r.slice(l.start,l.end))){const u=O.getAttributeValue(h.text,"location",n);if(u===void 0)continue;const d=h.text.match(/([A-Za-z_]\w*)\s*:\s*([^]+)$/);if(!d)continue;const f=l.start+h.start+h.text.length-d[2].length,m=e.slice(f,l.start+h.start+h.text.length),{format:p,components:x}=this.wgslTypeToVertexFormat(m);t.push({name:d[1],location:u,stride:x,format:p})}return t}static wgslTypeToVertexFormat(e){const t=e.match(/\/\*\s*(unorm|snorm|float|uint|sint)(8|16)?\s*\*\//),r=O.removeWhitespace(e.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,"")),n=O.parseScalarOrVector(r);if(!n)return _.warn("VertexInputUtils: unsupported vertex input type, using float32:",e),{format:"float32",components:1};const{scalar:i,components:s}=n;if(t){const l=t[1],h=t[2]??(l==="unorm"||l==="snorm"?"8":"");if(h&&!(l==="float"&&h!=="16")&&i===(l==="uint"?"u32":l==="sint"?"i32":"f32")&&(s===2||s===4))return{format:`${l}${h}x${s}`,components:s};_.warn("VertexInputUtils: unsupported annotation, ignored for",e,"(unorm, snorm, unorm16, snorm16 and float16 need a vec2 or vec4 of f32, uint8 and uint16 of u32, sint8 and sint16 of i32)")}const o=i==="f32"?"float32":i==="u32"?"uint32":"sint32";return{format:s===1?o:`${o}x${s}`,components:s}}}const Dt=class Dt{constructor(){a(this,"layouts",new WeakMap);a(this,"layoutsByHash",new Map);a(this,"vertexInputsByMaterial",new WeakMap)}getVertexBufferLayout(e,t){let r=this.layouts.get(e);r||(r=new WeakMap,this.layouts.set(e,r));let n=r.get(t);if(!n||n.attributeLayoutVersion!==e.attributeLayoutVersion){const i=this.createVertexBufferLayout(e,t),s=this.getLayoutHash(i);let o=this.layoutsByHash.get(s);o||(this.layoutsByHash.set(s,i),o=i),n={layout:o,attributeLayoutVersion:e.attributeLayoutVersion},r.set(t,n)}return n.layout}getLayoutHash(e){const t=Array.from(e.attributes);return JSON.stringify({arrayStride:e.arrayStride,stepMode:e.stepMode,attributes:t.map(r=>({shaderLocation:r.shaderLocation,offset:r.offset,format:r.format}))})}createVertexBufferLayout(e,t){const r=this.getVertexInputs(t),n=[],{offsets:i,arrayStride:s}=e.getVertexLayout(),o=new Set;for(let l=0;l<e.attributes.length;l++){const h=this.getAttributeName(e.attributes[l].name);r.some(u=>u.name==h)&&o.add(l)}for(const l of r){let h=e.attributes.findIndex(d=>this.getAttributeName(d.name)==l.name);if(h<0){const d=l.location;d<e.attributes.length&&!o.has(d)&&!Dt.knownNames.has(l.name)&&(h=d,_.log(t.name,"VertexBufferLayoutManager","attribute matched by index",h,l.name,"→",e.attributes[h].name))}if(h<0){_.warn(t.name,"VertexBufferLayoutManager","attribute not found: adding a dummy attribute",l,e.attributes),n.push({shaderLocation:l.location,offset:0,format:l.format});continue}const u=e.attributes[h];u.stride*u.bytesPerElement!=this.getFormatSize(l.format)&&_.warn("VertexBufferLayoutManager","stride mismatch",l,u),n.push({shaderLocation:l.location,offset:i[h],format:l.format})}return{arrayStride:s,attributes:n}}getVertexInputs(e){let t=this.vertexInputsByMaterial.get(e);return t||(t=Fi.getVertexInputs(e.shaderCode),this.vertexInputsByMaterial.set(e,t)),t}getFormatSize(e){switch(e){case"float32":case"uint32":case"sint32":return 4;case"float32x2":case"uint32x2":case"sint32x2":return 8;case"float32x3":case"uint32x3":case"sint32x3":return 12;case"float32x4":case"uint32x4":case"sint32x4":return 16;case"unorm8x2":case"snorm8x2":case"uint8x2":case"sint8x2":return 2;case"unorm8x4":case"snorm8x4":case"uint8x4":case"sint8x4":return 4;case"unorm16x2":case"snorm16x2":case"uint16x2":case"sint16x2":case"float16x2":return 4;case"unorm16x4":case"snorm16x4":case"uint16x4":case"sint16x4":case"float16x4":return 8;default:return 0}}getAttributeName(e){return me.legacyToNewNames.get(e)??e}};a(Dt,"knownNames",new Set(Object.values(zn)));let er=Dt;function Un(c,e){const t=document.createElement("canvas");return t.width=c,t.height=e,t}function zi(c){if(typeof HTMLVideoElement<"u"&&c instanceof HTMLVideoElement)return new k(c.videoWidth,c.videoHeight);if(typeof HTMLImageElement<"u"&&c instanceof HTMLImageElement)return new k(c.naturalWidth,c.naturalHeight);if(typeof VideoFrame<"u"&&c instanceof VideoFrame)return new k(c.displayWidth,c.displayHeight);const e=c;return new k(e.width,e.height)}async function Oi(c,e){if(e.format!="rgba8unorm")return console.warn("getFromTextureData: only supports rgba8unorm"),new Uint8Array(e.width*e.height*4);const t=Math.ceil(e.width*4/256)*256,r=t*e.height,n=c.createBuffer(r,GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC);c.endPasses(),c.commandEncoder.copyTextureToBuffer({texture:e},{buffer:n,bytesPerRow:t},{width:e.width,height:e.height});const i=c.readBuffer(n,Uint8Array);c.finish();const s=await i;n.destroy();const o=new Uint8Array(e.width*e.height*4);for(let l=0;l<e.height;l++){const h=l*t,u=l*e.width*4;o.set(s.subarray(h,h+e.width*4),u)}return o}function Ni(c,e="image",t="png",r=1){c.toBlob(n=>{if(n){let i=window.URL,s=document.createElement("a");s.href=i.createObjectURL(n),s.download=e,document.body.appendChild(s),s.click(),document.body.removeChild(s)}},"image/"+t,r)}class Vi{constructor(e,t=-1,r=-1){a(this,"canvas");a(this,"pixelRatio",1);a(this,"fixedSize",null);a(this,"container");a(this,"resizeObserver",null);a(this,"followDevicePixelRatio",!1);a(this,"pixelRatioMax");a(this,"observedWidth",-1);a(this,"observedHeight",-1);if(this.container=e,this.pixelRatioMax=r,e){t>0?this.pixelRatio=t:(this.followDevicePixelRatio=!0,this.pixelRatio=this.getDevicePixelRatio());const n=e.getBoundingClientRect();this.canvas=Un(n.width*this.pixelRatio|0,n.height*this.pixelRatio|0),Object.assign(this.canvas.style,{display:"block",width:"100%",height:"100%",inset:"0"}),n.width*n.height<1&&_.error("canvasParent has no area",e),e.appendChild(this.canvas),typeof ResizeObserver<"u"&&(this.resizeObserver=new ResizeObserver(i=>{var l;const s=i[i.length-1],o=(l=s.borderBoxSize)==null?void 0:l[0];this.observedWidth=o?o.inlineSize:s.contentRect.width,this.observedHeight=o?o.blockSize:s.contentRect.height}),this.resizeObserver.observe(e))}else _.error("canvasParent is null")}getDevicePixelRatio(){return this.pixelRatioMax>0?Math.min(window.devicePixelRatio,this.pixelRatioMax):window.devicePixelRatio}update(){if(this.fixedSize)return this.setPixelSize(this.fixedSize.width,this.fixedSize.height);if(this.followDevicePixelRatio&&(this.pixelRatio=this.getDevicePixelRatio()),this.container){let e=this.observedWidth,t=this.observedHeight;if(e<0){const r=this.container.getBoundingClientRect();e=r.width,t=r.height}if(e*t>0)return this.setSize(e,t);_.warn("canvasParent has no area",this.container)}return!1}setSize(e,t){return this.setPixelSize(e*this.pixelRatio|0,t*this.pixelRatio|0)}setPixelSize(e,t){return this.canvas.width!==e||this.canvas.height!==t?(this.canvas.width=e,this.canvas.height=t,this.canvas.dispatchEvent(new Event("resize")),!0):!1}destruct(){var e,t;(e=this.resizeObserver)==null||e.disconnect(),(t=this.container)==null||t.removeChild(this.canvas)}}class Ui{constructor(){a(this,"frameNumber",0);a(this,"time",0);a(this,"fps",60);a(this,"dt",1/this.fps);a(this,"avgFps",60);a(this,"minFps",1e10);a(this,"maxFps",0)}update(e){e*=.001,this.dt=J(e-this.time,1/1e3,1/30),this.time=e,this.fps=1/this.dt,this.minFps=Math.min(this.minFps,this.fps),this.maxFps=Math.max(this.maxFps,this.fps),this.avgFps=ae(this.fps,this.avgFps,.95),this.frameNumber++}}const Gi=4096;class Wi{constructor(e){a(this,"dummyTextureViews",new Map);a(this,"dummyStorageTextureViews",new Map);a(this,"dummyBuffers",new Map);a(this,"dummySampler");a(this,"dummyComparisonSampler");a(this,"renderer");this.renderer=e}getDummyBindData(e,t){return e.sampler?e.sampler.type==="comparison"?this.getDummyComparisonSampler():this.getDummySampler():e.texture?this.getDummyTextureView(e.texture):e.storageTexture?this.getDummyStorageTextureView(e.storageTexture):e.buffer?this.getDummyBuffer(e.buffer.type):e.externalTexture?(console.warn(t,"DummyBindings: an external texture can not be substituted, call setExternalTexture before drawing",e),this.getDummyBuffer()):(console.warn(t,"DummyBindings: unhandled: ",e),this.getDummyBuffer())}getDummyTextureView(e){const t=e.sampleType??"float",r=e.viewDimension??"2d",n=e.multisampled??!1,i=`${t}_${r}_${n}`;let s=this.dummyTextureViews.get(i);if(!s){const o=t==="depth"?"depth24plus":t==="uint"?"r8uint":t==="sint"?"r8sint":"r8unorm",l=r==="cube"||r==="cube-array"?6:1,h=r==="1d"?"1d":r==="3d"?"3d":"2d";s=this.renderer.device.createTexture({size:[1,1,l],format:o,usage:GPUTextureUsage.TEXTURE_BINDING|(n?GPUTextureUsage.RENDER_ATTACHMENT:0),dimension:h,sampleCount:n?4:1}).createView({dimension:r}),s.label=`dummyTextureView_${i}_${this.renderer.resourceID++}`,this.dummyTextureViews.set(i,s)}return s}getDummySampler(){return this.dummySampler||(this.dummySampler=this.renderer.device.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",addressModeU:"repeat",addressModeV:"repeat",addressModeW:"repeat"})),this.dummySampler}getDummyComparisonSampler(){return this.dummyComparisonSampler||(this.dummyComparisonSampler=this.renderer.device.createSampler({magFilter:"linear",minFilter:"linear",compare:"less"})),this.dummyComparisonSampler}getDummyStorageTextureView(e){const t=e.viewDimension??"2d",r=(e.access??"write-only")!=="read-only",n=`${e.format}_${t}_${r}`;let i=this.dummyStorageTextureViews.get(n);if(!i){const s=t==="1d"?"1d":t==="3d"?"3d":"2d";i=this.renderer.device.createTexture({size:[1,1,1],format:e.format,usage:GPUTextureUsage.STORAGE_BINDING,dimension:s}).createView({dimension:t}),i.label=`dummyStorageTextureView_${n}_${this.renderer.resourceID++}`,this.dummyStorageTextureViews.set(n,i)}return i}getDummyBuffer(e="storage"){let t=this.dummyBuffers.get(e);return t||(t=this.renderer.device.createBuffer({size:Gi,usage:(e==="uniform"?GPUBufferUsage.UNIFORM:GPUBufferUsage.STORAGE)|GPUBufferUsage.COPY_DST,label:`dummyBuffer_${e}_${this.renderer.resourceID++}`}),this.dummyBuffers.set(e,t)),t}}const ft=class ft{constructor(){a(this,"bundlesByMaterial",new Map);a(this,"frameNumber",0)}get(e,t,r,n,i,s){var l;const o=(l=this.bundlesByMaterial.get(e))==null?void 0:l.get(t);if(o){for(const h of o)if(h.attachmentKey===r&&h.version===n&&h.uniformOffset===s&&ft.equals(h.bindGroupIds,i))return h.lastUse=this.frameNumber,h.bundle}}set(e,t,r,n,i,s,o){let l=this.bundlesByMaterial.get(e);l||(l=new Map,this.bundlesByMaterial.set(e,l));let h=l.get(t);h||(h=[],l.set(t,h)),h.push({attachmentKey:r,version:n,bindGroupIds:i.slice(),uniformOffset:s,bundle:o,lastUse:this.frameNumber})}get size(){let e=0;for(const t of this.bundlesByMaterial.values())for(const r of t.values())e+=r.length;return e}update(){for(const[e,t]of this.bundlesByMaterial){for(const[r,n]of t){let i=0;for(const s of n)this.frameNumber-s.lastUse<=ft.MAX_UNUSED_FRAMES&&(n[i++]=s);n.length=i,i===0&&t.delete(r)}t.size===0&&this.bundlesByMaterial.delete(e)}this.frameNumber++}static equals(e,t){if(e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(e[r]!==t[r])return!1;return!0}};a(ft,"MAX_UNUSED_FRAMES",10);let tr=ft;const he=class he{constructor(){a(this,"enabled",!1);a(this,"querySet",null);a(this,"queryResolveBuffer",null);a(this,"currentQueryIndex",0);a(this,"queryLabels",[]);a(this,"MAX_QUERIES",256);a(this,"BUFFER_POOL_SIZE",3);a(this,"device");a(this,"debugDiv",null);a(this,"lastActiveTime",0);a(this,"readBufferPool",[]);a(this,"readBufferAvailable",[]);a(this,"resolveFrameCounter",0);a(this,"displayedFrameCounter",-1);a(this,"AVG_WINDOW",256);a(this,"avgSamples",new Float32Array(this.AVG_WINDOW));a(this,"avgSampleIndex",0);a(this,"avgSampleCount",0);a(this,"avgSum",0);a(this,"wasVisible",!1);a(this,"passSamples",new Map);a(this,"totalMsSum",0);a(this,"totalMsCount",0);a(this,"droppedPassCount",0);a(this,"frameCallbacks",[])}static setEnabled(e){he.enabledGlobal=e;for(const t of he.instances)t.enabled=e,e||(t.lastActiveTime=0)}static isEnabled(){return he.enabledGlobal}init(e,t){if(this.device=e,this.device.features.has("timestamp-query")){this.querySet=this.device.createQuerySet({type:"timestamp",count:this.MAX_QUERIES}),this.queryResolveBuffer=this.device.createBuffer({size:this.MAX_QUERIES*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC});for(let r=0;r<this.BUFFER_POOL_SIZE;r++)this.readBufferPool.push(this.device.createBuffer({size:this.MAX_QUERIES*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ,label:`profiler_read_buffer_${r}`})),this.readBufferAvailable.push(!0)}this.createDebugDiv(t),he.instances.push(this),this.enabled=he.enabledGlobal}createDebugDiv(e){this.debugDiv=document.createElement("div"),this.debugDiv.style.position="absolute",this.debugDiv.style.top="10px",this.debugDiv.style.left="10px",this.debugDiv.style.backgroundColor="rgba(0, 0, 0, 0.7)",this.debugDiv.style.color="#00ff00",this.debugDiv.style.padding="10px",this.debugDiv.style.fontFamily="monospace",this.debugDiv.style.fontSize="clamp(8px, 2.4vw, 12px)",this.debugDiv.style.whiteSpace="nowrap",this.debugDiv.style.pointerEvents="none",this.debugDiv.style.zIndex="1000",this.debugDiv.style.display="none",getComputedStyle(e).position==="static"&&(e.style.position="relative"),e.appendChild(this.debugDiv)}addFrameCallback(e){this.frameCallbacks.push(e)}removeFrameCallback(e){const t=this.frameCallbacks.indexOf(e);t>=0&&this.frameCallbacks.splice(t,1)}get recording(){return this.enabled&&this.querySet!==null}getTimestampWrites(e){if(!this.enabled||!this.querySet)return;if(this.currentQueryIndex+2>this.MAX_QUERIES){this.droppedPassCount++;return}const t=this.currentQueryIndex,r=this.currentQueryIndex+1;return this.currentQueryIndex+=2,this.queryLabels.push(e),{querySet:this.querySet,beginningOfPassWriteIndex:t,endOfPassWriteIndex:r}}getAvailableReadBuffer(){for(let e=0;e<this.BUFFER_POOL_SIZE;e++)if(this.readBufferAvailable[e])return this.readBufferAvailable[e]=!1,{buffer:this.readBufferPool[e],index:e};return null}resolve(e){if(!this.querySet){this.debugDiv&&(this.debugDiv.style.display="none");return}if(this.enabled&&(this.lastActiveTime=performance.now()),!(performance.now()-this.lastActiveTime<1e3)&&!this.enabled){this.debugDiv&&(this.debugDiv.style.display="none"),this.wasVisible=!1;return}if(this.wasVisible||(this.avgSamples.fill(0),this.avgSampleIndex=0,this.avgSampleCount=0,this.avgSum=0,this.passSamples.clear(),this.wasVisible=!0),this.debugDiv&&(this.debugDiv.style.display="block"),!this.enabled)return;let r=null,n=[],i=-1;if(this.querySet&&this.currentQueryIndex>0&&this.queryResolveBuffer){const o=this.getAvailableReadBuffer();if(!o){this.currentQueryIndex=0,this.queryLabels=[];return}const l=this.currentQueryIndex,h=this.queryResolveBuffer;e.resolveQuerySet(this.querySet,0,l,h,0),n=[...this.queryLabels],r=o.buffer,i=o.index,e.copyBufferToBuffer(h,0,r,0,l*8),this.currentQueryIndex=0,this.queryLabels=[]}const s=this.resolveFrameCounter++;return{queryReadBuffer:r,queryLabels:n,bufferIndex:i,frameCounter:s}}async read(e,t,r=-1,n=-1){if(e&&r>=0)try{if(await e.mapAsync(GPUMapMode.READ),n>=this.displayedFrameCounter){const i=new BigInt64Array(e.getMappedRange());let s="",o=0;const l=[];for(let d=0;d<t.length;d++){const f=i[d*2],m=i[d*2+1],x=Number(m-f)/1e6;o+=x,l.push(x)}const h=this.updatePassAverages(t,l);this.totalMsSum+=o,this.totalMsCount++,this.frameCallbacks.forEach(d=>d(o,t,l)),this.avgSum+=o-this.avgSamples[this.avgSampleIndex],this.avgSamples[this.avgSampleIndex]=o,this.avgSampleIndex=(this.avgSampleIndex+1)%this.AVG_WINDOW,this.avgSampleCount<this.AVG_WINDOW&&this.avgSampleCount++;const u=this.avgSum/this.avgSampleCount;for(let d=0;d<t.length;d++){const f=u>0?h[d]/u*100:0;s+=`${t[d]}: ${l[d].toFixed(3)}ms (avg ${h[d].toFixed(3)}, ${f.toFixed(1)}%)<br>`}s+=`<br><b>Total: ${o.toFixed(3)}ms (avg ${u.toFixed(3)}ms, ${this.AVG_WINDOW}-frame)</b>`,this.debugDiv&&(this.debugDiv.innerHTML=s),this.displayedFrameCounter=n}e.unmap()}catch(i){console.error("Profiler read error",i)}finally{this.readBufferAvailable[r]=!0}}updatePassAverages(e,t){const r=this.avgSampleIndex,n=new Map,i=new Set,s=[];for(let o=0;o<e.length;o++){const l=n.get(e[o])??0;n.set(e[o],l+1);const h=e[o]+"#"+l;i.add(h);let u=this.passSamples.get(h);u||(u={ms:new Float32Array(this.AVG_WINDOW),ran:new Uint8Array(this.AVG_WINDOW),sum:0,count:0},this.passSamples.set(h,u)),u.sum+=t[o]-u.ms[r],u.count+=1-u.ran[r],u.ms[r]=t[o],u.ran[r]=1,s.push(u.sum/u.count)}for(const[o,l]of this.passSamples)i.has(o)||(l.sum-=l.ms[r],l.count-=l.ran[r],l.ms[r]=0,l.ran[r]=0,l.count===0&&this.passSamples.delete(o));return s}destruct(){var t,r;const e=he.instances.indexOf(this);e>=0&&he.instances.splice(e,1);for(const n of this.readBufferPool)n.destroy();this.readBufferPool=[],this.readBufferAvailable=[],(t=this.querySet)==null||t.destroy(),(r=this.queryResolveBuffer)==null||r.destroy(),this.debugDiv&&this.debugDiv.parentNode&&this.debugDiv.parentNode.removeChild(this.debugDiv)}};a(he,"enabledGlobal",!1),a(he,"instances",[]);let et=he;class Y{constructor(e=0,t=0,r=0,n=1){a(this,"x");a(this,"y");a(this,"z");a(this,"w");this.x=e,this.y=t,this.z=r,this.w=n}static get ZERO(){return new Y(0,0,0,0)}static get ONE(){return new Y(1,1,1,1)}static dot(e,t){return e.x*t.x+e.y*t.y+e.z*t.z+e.w*t.w}static distance(e,t){const r=t.x-e.x,n=t.y-e.y,i=t.z-e.z,s=t.w-e.w;return Math.sqrt(r*r+n*n+i*i+s*s)}static add(e,t){return e.clone().add(t)}static subtract(e,t){return e.clone().subtract(t)}static multiply(e,t){return e.clone().multiply(t)}static divide(e,t){return e.clone().divide(t)}static multiplyScalar(e,t){return e.clone().multiplyScalar(t)}static powScalar(e,t){return e.clone().powScalar(t)}static normalize(e){return e.clone().normalize()}static max(e,t){return e.clone().max(t)}static min(e,t){return e.clone().min(t)}static lerp(e,t,r){return e.clone().lerp(t,r)}static cross(e,t,r){const n=t.x*r.y-t.y*r.x,i=t.x*r.z-t.z*r.x,s=t.x*r.w-t.w*r.x,o=t.y*r.z-t.z*r.y,l=t.y*r.w-t.w*r.y,h=t.z*r.w-t.w*r.z,u=e.x,d=e.y,f=e.z,m=e.w;return new Y(d*h-f*l+m*o,-(u*h)+f*s-m*i,u*l-d*s+m*n,-(u*o)+d*i-f*n)}static transform(e,t){return e.clone().transform(t)}clone(){return new Y(this.x,this.y,this.z,this.w)}copy(e){return this.setValues(e.x,e.y,e.z,e.w)}setValues(e,t,r,n){return this.x=e,this.y=t,this.z=r,this.w=n,this}length(){return Math.sqrt(Y.dot(this,this))}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}normalize(){let e=this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w;return e>0&&(e=1/Math.sqrt(e)),this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}subtract(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}powScalar(e){return this.x=Math.pow(this.x,e),this.y=Math.pow(this.y,e),this.z=Math.pow(this.z,e),this.w=Math.pow(this.w,e),this}lerp(e,t){return this.x=this.x+(e.x-this.x)*t,this.y=this.y+(e.y-this.y)*t,this.z=this.z+(e.z-this.z)*t,this.w=this.w+(e.w-this.w)*t,this}dot(e){return Y.dot(this,e)}transform(e){const t=this.x,r=this.y,n=this.z,i=this.w,s=e.m;return this.x=s[0]*t+s[4]*r+s[8]*n+s[12]*i,this.y=s[1]*t+s[5]*r+s[9]*n+s[13]*i,this.z=s[2]*t+s[6]*r+s[10]*n+s[14]*i,this.w=s[3]*t+s[7]*r+s[11]*n+s[15]*i,this}get array(){return[this.x,this.y,this.z,this.w]}}class S{constructor(e=0,t=0,r=0){a(this,"x");a(this,"y");a(this,"z");this.x=e,this.y=t,this.z=r}static get ZERO(){return new S(0,0,0)}static get RIGHT(){return new S(1,0,0)}static get UP(){return new S(0,1,0)}static get FORWARD(){return new S(0,0,1)}static get ONE(){return new S(1,1,1)}get xy(){return new k(this.x,this.y)}get yz(){return new k(this.y,this.z)}get xz(){return new k(this.x,this.z)}static dot(e,t){return e.x*t.x+e.y*t.y+e.z*t.z}static distance(e,t){const r=e.x-t.x,n=e.y-t.y,i=e.z-t.z;return Math.sqrt(r*r+n*n+i*i)}static distanceSquared(e,t){const r=e.x-t.x,n=e.y-t.y,i=e.z-t.z;return r*r+n*n+i*i}static add(e,t){return e.clone().add(t)}static subtract(e,t){return e.clone().subtract(t)}static multiply(e,t){return e.clone().multiply(t)}static divide(e,t){return e.clone().divide(t)}static multiplyScalar(e,t){return e.clone().multiplyScalar(t)}static powScalar(e,t){return e.clone().powScalar(t)}static normalize(e){return e.clone().normalize()}static max(e,t){return e.clone().max(t)}static min(e,t){return e.clone().min(t)}static lerp(e,t,r){return e.clone().lerp(t,r)}static cross(e,t){return new S().crossVectors(e,t)}static lookAtRight(e,t,r){r.setValues(e.y*t.z-e.z*t.y,e.z*t.x-e.x*t.z,e.x*t.y-e.y*t.x);let n=r.length();if(n<we){const i=Math.abs(t.x),s=Math.abs(t.y),o=Math.abs(t.z);i<=s&&i<=o?r.setValues(0,-t.z,t.y):s<=o?r.setValues(t.z,0,-t.x):r.setValues(-t.y,t.x,0),n=r.length()}return r.multiplyScalar(1/n)}static fract(e){return new S(e.x-Math.floor(e.x),e.y-Math.floor(e.y),e.z-Math.floor(e.z))}static floor(e){return new S(Math.floor(e.x),Math.floor(e.y),Math.floor(e.z))}static transform(e,t){return e.clone().transform(t)}static transformMat3(e,t){return e.clone().transformMat3(t)}static reflect(e,t){const r=2*S.dot(e,t);return new S(e.x-t.x*r,e.y-t.y*r,e.z-t.z*r)}clone(){return new S(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}setValues(e=0,t=0,r=0){return this.x=e,this.y=t,this.z=r,this}length(){return Math.sqrt(this.lengthSquared())}lengthSquared(){return S.dot(this,this)}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}normalize(){let e=this.x*this.x+this.y*this.y+this.z*this.z;return e>0&&(e=1/Math.sqrt(e)),this.x*=e,this.y*=e,this.z*=e,this}get normalized(){return this.clone().normalize()}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}subtract(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}crossVectors(e,t){const r=e.x,n=e.y,i=e.z,s=t.x,o=t.y,l=t.z;return this.setValues(n*l-i*o,i*s-r*l,r*o-n*s)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}powScalar(e){return this.x=Math.pow(this.x,e),this.y=Math.pow(this.y,e),this.z=Math.pow(this.z,e),this}lerp(e,t){return this.x=this.x+(e.x-this.x)*t,this.y=this.y+(e.y-this.y)*t,this.z=this.z+(e.z-this.z)*t,this}rotateX(e,t){const r=this.y-e.y,n=this.z-e.z;return this.y=r*Math.cos(t)-n*Math.sin(t)+e.y,this.z=r*Math.sin(t)+n*Math.cos(t)+e.z,this}rotateY(e,t){const r=this.x-e.x,n=this.z-e.z;return this.x=r*Math.cos(t)+n*Math.sin(t)+e.x,this.z=n*Math.cos(t)-r*Math.sin(t)+e.z,this}rotateZ(e,t){const r=this.x-e.x,n=this.y-e.y;return this.x=r*Math.cos(t)-n*Math.sin(t)+e.x,this.y=r*Math.sin(t)+n*Math.cos(t)+e.y,this}transform(e){const t=this.x,r=this.y,n=this.z,i=e.m;let s=i[3]*t+i[7]*r+i[11]*n+i[15];return s=s||1,this.x=(i[0]*t+i[4]*r+i[8]*n+i[12])/s,this.y=(i[1]*t+i[5]*r+i[9]*n+i[13])/s,this.z=(i[2]*t+i[6]*r+i[10]*n+i[14])/s,this}transformMat3(e){const t=this.x,r=this.y,n=this.z,i=e.m;return this.x=t*i[0]+r*i[3]+n*i[6],this.y=t*i[1]+r*i[4]+n*i[7],this.z=t*i[2]+r*i[5]+n*i[8],this}randomize(){return this.x=Math.random()*2-1,this.y=Math.random()*2-1,this.z=Math.random()*2-1,this}randomize01(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomizeSphere(){do this.randomize();while(this.lengthSquared()>1);return this}fract(){return this.x-=Math.floor(this.x),this.y-=Math.floor(this.y),this.z-=Math.floor(this.z),this}get array(){return[this.x,this.y,this.z]}}class N extends Y{static get ONE(){return new N(1,1,1,1)}static get ZERO(){return new N(0,0,0,0)}static random(){return new N(Math.random(),Math.random(),Math.random())}get r(){return this.x}set r(e){this.x=e}get g(){return this.y}set g(e){this.y=e}get b(){return this.z}set b(e){this.z=e}get a(){return this.w}set a(e){this.w=e}get vector3(){return new S(this.x,this.y,this.z)}get gammaToLinearSpace(){const e=t=>t*(t*(t*.305306011+.682171111)+.012522878);return new N(e(this.r),e(this.g),e(this.b),this.a)}get srgbToLinearSpace(){const e=t=>t<=.04045?t*.0773993808:Math.pow(t*.9478672986+.0521327014,2.4);return new N(e(this.r),e(this.g),e(this.b),this.a)}get linearToGammaSpace(){const e=t=>Math.max(1.055*Math.pow(Math.max(t,0),.416666667)-.055,0);return new N(e(this.r),e(this.g),e(this.b),this.a)}static fromHex(e){return new N().setHex(e)}static fromRGB255(e){return new N().setRGBA255([...e,255])}static fromHSV(e,t,r){return new N().setHSV(e,t,r)}clone(){return new N(this.x,this.y,this.z,this.w)}setRGBA255(e){return this.r=e[0]/255,this.g=e[1]/255,this.b=e[2]/255,this.a=e[3]/255,this}setHex(e){e=e.replace(/[^0-9A-F]/gi,""),(e.length===3||e.length===4)&&(e=e.replace(/./g,"$&$&"));const t=r=>parseInt(e.substring(r*2,r*2+2),16)/255;return this.r=t(0),this.g=t(1),this.b=t(2),this.a=e.length===8?t(3):1,this}getHex(){const e=t=>Math.round(Math.min(Math.max(t,0),1)*255).toString(16).padStart(2,"0");return`#${e(this.r)}${e(this.g)}${e(this.b)}`}setHSV(e,t,r){let n=0,i=0,s=0;const o=Math.floor(e*6),l=e*6-o,h=r*(1-t),u=r*(1-l*t),d=r*(1-(1-l)*t);switch(o%6){case 0:n=r,i=d,s=h;break;case 1:n=u,i=r,s=h;break;case 2:n=h,i=r,s=d;break;case 3:n=h,i=u,s=r;break;case 4:n=d,i=h,s=r;break;case 5:n=r,i=h,s=u;break}return this.r=n,this.g=i,this.b=s,this}}const Kt={format:typeof navigator<"u"&&navigator.gpu?navigator.gpu.getPreferredCanvasFormat():"bgra8unorm",sampleCount:1,depth:!0,stencil:!1,requiredLimits:{},requiredFeatures:[],uniformBufferSize:1024*256,pixelRatio:-1,pixelRatioMax:-1,discardMSAA:!1},ji=1;class Hi{constructor(){a(this,"pipeline",null);a(this,"vertexBuffer",null);a(this,"indexBuffer",null);a(this,"indexFormat",null);a(this,"bindGroups",{bindGroups:[],offsets:[]})}reset(){this.pipeline=null,this.vertexBuffer=null,this.indexBuffer=null,this.indexFormat=null,this.bindGroups.bindGroups.length=0,this.bindGroups.offsets.length=0}}class Xi{constructor(){a(this,"pipeline",null);a(this,"bindGroups",{bindGroups:[],offsets:[]})}reset(){this.pipeline=null,this.bindGroups.bindGroups.length=0,this.bindGroups.offsets.length=0}}class qi{constructor(){a(this,"canvasManager");a(this,"time",new Ui);a(this,"canvas");a(this,"clearColor",new N(0,0,0,1));a(this,"device");a(this,"context");a(this,"_commandEncoder",null);a(this,"_renderPassEncoder",null);a(this,"_computePassEncoder",null);a(this,"vertexBufferLayoutManager");a(this,"_mouseListener");a(this,"options");a(this,"blitMesh");a(this,"copyTextureMaterial");a(this,"renderTexture");a(this,"currentRenderTexture");a(this,"currentRenderTextureMipLevel",0);a(this,"mipmapGenerator");a(this,"resourceID",0);a(this,"instanceID",0);a(this,"uniformBuffer");a(this,"uniformData");a(this,"uniformDataOffset",0);a(this,"uniformUploadSize",0);a(this,"uniformEpoch",0);a(this,"minUniformBufferOffsetAlignment",-1);a(this,"renderPassState",new Hi);a(this,"computePassState",new Xi);a(this,"warnedAboutResumedPass",!1);a(this,"dummyBindings");a(this,"renderBundleCacheManager",new tr);a(this,"attachmentKeyCache",{rt:null,mipLevel:0,depthStencilFormat:void 0,sampleCount:0,key:""});a(this,"bindGroupIds",[]);a(this,"afterSubmitCallbacks",[]);a(this,"profiler",new et);a(this,"shaderDefines",new Map);a(this,"init",async(e,t={})=>{let r=null;if(typeof navigator<"u"&&navigator.gpu&&(r=await navigator.gpu.requestAdapter()),r==null){this.showWebgpuNotSupportedMessage(e);return}this.canvasManager=new Vi(e,t.pixelRatio,t.pixelRatioMax),this.canvas=this.canvasManager.canvas,_.log("Renderer: adapter.features",Array.from(r.features)),_.log("Renderer: adapter.limits",r.limits),this.options={...Kt,...t,requiredFeatures:[...t.requiredFeatures??Kt.requiredFeatures],requiredLimits:{...t.requiredLimits??Kt.requiredLimits}},this.options.requiredFeatures.push("rg11b10ufloat-renderable"),this.options.requiredFeatures.push("shader-f16"),this.options.requiredFeatures.push("texture-formats-tier1"),this.options.requiredFeatures.push("texture-formats-tier2"),this.options.requiredFeatures.push("float32-filterable"),this.options.requiredFeatures.push("float32-blendable"),this.options.requiredFeatures.push("timestamp-query"),this.options.requiredFeatures.push("subgroups"),this.options.requiredFeatures=this.checkRequiredFeaturesAgainstAdapterFeatures(r,this.options.requiredFeatures),this.options.requiredLimits.maxBufferSize=r.limits.maxBufferSize,this.options.requiredLimits=this.checkRequiredLimitsAgainstAdapterLimits(r,this.options.requiredLimits),this.device=await r.requestDevice({requiredFeatures:this.options.requiredFeatures,requiredLimits:this.options.requiredLimits}),_.log("Renderer: requiredFeatures",this.options.requiredFeatures),_.log("Renderer: device.features",Array.from(this.device.features)),_.log("Renderer: device.limits",this.device.limits);const n=this.device.features.has("subgroups");this.shaderDefines.set("HAS_SUBGROUPS",n),this.shaderDefines.set("HAS_SUBGROUP_ID",n&&navigator.gpu.wgslLanguageFeatures.has("subgroup_id")),_.log("Renderer: shaderDefines",Object.fromEntries(this.shaderDefines)),this.context=this.canvas.getContext("webgpu"),this.context.configure({device:this.device,format:this.options.format}),this.profiler.init(this.device,e),this.dummyBindings=new Wi(this),this.minUniformBufferOffsetAlignment=this.device.limits.minUniformBufferOffsetAlignment,this.uniformData=new Float32Array(this.options.uniformBufferSize/4),this.uniformBuffer=this.createBuffer(this.options.uniformBufferSize,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,!1),this.vertexBufferLayoutManager=new er,this.blitMesh=this.createBlitTriangle(),this.copyTextureMaterial=new G(this,"blit",Vn),this.copyTextureMaterial.depthWriteEnabled=!1,this.copyTextureMaterial.depthCompare="always",this.renderTexture=new H(this,this.canvas.width,this.canvas.height,{formats:[this.options.format],depth:this.options.depth,stencil:this.options.stencil,sampleCount:this.options.sampleCount,toScreen:!0,scaleToCanvas:!0,discardMSAA:this.options.discardMSAA}),this.currentRenderTexture=this.renderTexture})}showWebgpuNotSupportedMessage(e){console.warn("WebGPU not supported");const t=document.createElement("div");t.style.position="absolute",t.style.top="0",t.style.left="0",t.style.width="100%",t.style.height="100%",t.style.display="flex",t.style.flexDirection="column",t.style.justifyContent="center",t.style.alignItems="center",t.style.backgroundColor="#1a1a1a",t.style.color="#ffffff",t.style.zIndex="1000",t.style.fontFamily="Inter, system-ui, sans-serif",t.innerHTML=`
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">WebGPU Not Supported</h1>
        <p style="font-size: 1rem; color: #888;">Your browser does not appear to support WebGPU.</p>
      `,getComputedStyle(e).position==="static"&&(e.style.position="relative"),e.appendChild(t)}get renderTarget(){return this.currentRenderTexture}get size(){return this.currentRenderTexture.size}get aspectRatio(){return this.width/this.height}get width(){return this.currentRenderTexture.width}get height(){return this.currentRenderTexture.height}get sampleCount(){return this.currentRenderTexture.getSampleCount(this.currentRenderTextureMipLevel)}get mouseListener(){return this._mouseListener||(this._mouseListener=new xi(this.canvas,this.canvas)),this._mouseListener}update(e){var r;this.time.update(e),this.endPasses(),this.currentRenderTexture=this.renderTexture,this.currentRenderTextureMipLevel=0;const t=this.canvasManager.update();return this.renderTexture.setSize(this.canvas.width,this.canvas.height),this.renderBundleCacheManager.update(),(r=this._mouseListener)==null||r.update(),this.start(),t}setUniformData(e){const t=e.uniformData;if(!t)return 0;if(!e.uniformsChanged&&e.uniformEpoch===this.uniformEpoch)return e.uniformOffset;const r=this.uniformDataOffset,n=r+t.byteLength,i=this.minUniformBufferOffsetAlignment;return this.uniformDataOffset=Math.ceil(n/i)*i,n>this.uniformData.byteLength?(r<=this.uniformData.byteLength&&console.error("Renderer: the uniform buffer is full, it grows after this submit. size:",this.uniformData.byteLength,"shader:",e.name),0):(this.uniformData.set(t,r/4),this.uniformUploadSize=n,e.uniformOffset=r,e.uniformEpoch=this.uniformEpoch,e.uniformsChanged=!1,r)}growUniformBuffer(e){let t=this.uniformData.byteLength;for(;t<e;)t*=2;_.log("Renderer: growing the uniform buffer to",t),this.uniformBuffer.destroy(),this.uniformBuffer=this.createBuffer(t,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,!1),this.uniformData=new Float32Array(t/4),this.uniformDataOffset=0,this.uniformUploadSize=0,this.uniformEpoch++}start(){return this._commandEncoder?this._commandEncoder:(this._commandEncoder=this.device.createCommandEncoder(),this._commandEncoder)}finish(){if(!this._commandEncoder)return;this.endPasses(),this.uniformUploadSize>0&&this.device.queue.writeBuffer(this.uniformBuffer,0,this.uniformData.buffer,this.uniformData.byteOffset,this.uniformUploadSize),this.uniformUploadSize=0,this.uniformEpoch++;const e=this.profiler.resolve(this._commandEncoder);this.device.queue.submit([this._commandEncoder.finish()]),this.uniformDataOffset>this.uniformData.byteLength&&this.growUniformBuffer(this.uniformDataOffset),this.uniformDataOffset=0,e&&this.profiler.read(e.queryReadBuffer,e.queryLabels,e.bufferIndex,e.frameCounter),this._commandEncoder=null,this.currentRenderTexture=this.renderTexture,this.currentRenderTextureMipLevel=0;const t=this.afterSubmitCallbacks;this.afterSubmitCallbacks=[];for(const r of t)r()}destroyAfterSubmit(e){this._commandEncoder?this.afterSubmitCallbacks.push(()=>e.destroy()):e.destroy()}get commandEncoder(){return this._commandEncoder?this._commandEncoder:this.start()}get renderPassEncoder(){return this._renderPassEncoder?this._renderPassEncoder:(this.warnedAboutResumedPass||(this.warnedAboutResumedPass=!0,console.warn("Renderer: draw outside a render pass, continuing in the last render target without clearing. Call startRenderPass before drawing to silence this")),this.startRenderPass(this.currentRenderTexture,{colorClear:!1,depthClear:!1},this.currentRenderTextureMipLevel,"resumed pass"))}clear(e={}){this.startRenderPass(this.currentRenderTexture,e,this.currentRenderTextureMipLevel,"clear")}startRenderPass(e=null,t={},r=0,n="Render Pass"){const i=t.colorClear??!0,s=t.clearColor??this.clearColor,o=t.depthClear??!0,l=t.depthClearValue??ji,h=t.stencilClear??o,u=t.stencilClearValue??0;if(this._renderPassEncoder&&!i&&!o&&!h&&this.currentRenderTexture==(e||this.renderTexture)&&r==this.currentRenderTextureMipLevel)return this._renderPassEncoder;this.endPasses(),this.start(),this.currentRenderTexture=e||this.renderTexture,this.currentRenderTexture.resizeToCanvas&&this.currentRenderTexture.setSize(this.canvas.width,this.canvas.height),this.currentRenderTexture.clear(i,s,o,l,h,u),this.currentRenderTextureMipLevel=r;const d=this.currentRenderTexture.getRenderPassDescriptor(r);return d.timestampWrites=this.profiler.getTimestampWrites(n),this._renderPassEncoder=this.commandEncoder.beginRenderPass(d),this.renderPassState.reset(),this.currentRenderTexture.stencilEnabled&&this._renderPassEncoder.setStencilReference(1),this._renderPassEncoder}endRenderPass(){this._renderPassEncoder&&(this._renderPassEncoder.end(),this._renderPassEncoder=null)}startComputePass(e="Compute Pass"){this.endComputePass(),this.endRenderPass(),this.start();const t={},r=this.profiler.getTimestampWrites(e);return r&&(t.timestampWrites=r),this._computePassEncoder=this.commandEncoder.beginComputePass(t),this.computePassState.reset(),this._computePassEncoder}endComputePass(){this._computePassEncoder&&(this._computePassEncoder.end(),this._computePassEncoder=null)}drawBundle(e){this.renderPassEncoder.executeBundles([e]),this.renderPassState.reset()}endPasses(){this.endRenderPass(),this.endComputePass()}getAttachmentKey(e,t,r){const n=this.attachmentKeyCache,i=this.currentRenderTextureMipLevel;return(n.rt!==e||n.mipLevel!==i||n.depthStencilFormat!==t||n.sampleCount!==r)&&(n.rt=e,n.mipLevel=i,n.depthStencilFormat=t,n.sampleCount=r,n.key=`${e.formats.join("_")}_${r}_${t}_${i}`),n.key}prepareDraw(e,t,r,n){const i=this.setUniformData(e),s=this.renderPassEncoder,o=this.renderPassState;t?(e.setVertexBufferLayout(this.vertexBufferLayoutManager.getVertexBufferLayout(t,e)),o.vertexBuffer!==t.vertexBuffer&&(s.setVertexBuffer(0,t.vertexBuffer),o.vertexBuffer=t.vertexBuffer)):e.clearVertexBufferLayout(),r&&(o.indexBuffer!==r||o.indexFormat!==n)&&(s.setIndexBuffer(r,n),o.indexBuffer=r,o.indexFormat=n);const l=e.pipeline;return l?(o.pipeline!==l&&(s.setPipeline(l),o.pipeline=l),e.setBindGroups(s,i,o.bindGroups),s):null}drawCachedBundle(e,t,r){var f;const n=this.setUniformData(t),i=this.renderPassEncoder,s=this.currentRenderTexture,o=this.currentRenderTextureMipLevel==0?(f=s.depthStencilAttachment)==null?void 0:f.format:void 0,l=s.getSampleCount(this.currentRenderTextureMipLevel),h=this.getAttachmentKey(s,o,l),u=t.getBindGroupIds(this.bindGroupIds);let d=this.renderBundleCacheManager.get(t.id,e,h,t.version,u,n);if(!d){const m=this.device.createRenderBundleEncoder({colorFormats:s.formats,depthStencilFormat:o,sampleCount:l});t.setBindGroups(m,n),r(m),d=m.finish(),d.label="bundle_"+t.name+"_"+e,this.renderBundleCacheManager.set(t.id,e,h,t.version,u,n,d)}i.executeBundles([d]),this.renderPassState.reset()}draw(e,t,r={}){const n=r.instanceCount||1,i=this.prepareDraw(t,e,e.indexBuffer,e.indexFormat);i&&(e.indexBuffer?i.drawIndexed(e.indexCount,n):i.draw(e.vertexCount,n,0,0))}drawIndirect(e,t,r,n=0){const i=this.prepareDraw(t,e,e.indexBuffer,e.indexFormat);i&&(e.indexBuffer?i.drawIndexedIndirect(r,n):i.drawIndirect(r,n))}drawVertices(e,t,r=null,n={}){const i=n.instanceCount||1,s=n.firstVertex||0,o=n.firstInstance||0,l=n.firstIndex||0,h=this.prepareDraw(t,null,r,n.indexFormat??"uint32");h&&(r?h.drawIndexed(e,i,l,s,o):h.draw(e,i,s,o))}drawVerticesIndirect(e,t=null,r,n=0,i="uint32"){const s=this.prepareDraw(e,null,t,i);s&&(t?s.drawIndexedIndirect(r,n):s.drawIndirect(r,n))}blit(e=null,t=null,r=null,n=!0,i=0){r=r||this.copyTextureMaterial,e&&r.setTexture("texture",e),this.startRenderPass(t,{colorClear:n,depthClear:n},i,"blit "+r.name),this.draw(this.blitMesh,r)}blitRows(e,t,r,n,i=!0){r=r||this.copyTextureMaterial,e&&r.setTexture("texture",e);const s=this.startRenderPass(t,{colorClear:i,depthClear:i},0,"blit "+r.name),o=this.currentRenderTexture;for(const[l,h]of n){const u=Math.max(0,Math.floor(l)),d=Math.min(o.height,Math.ceil(h));d<=u||(s.setScissorRect(0,u,o.width,d-u),this.draw(this.blitMesh,r))}s.setScissorRect(0,0,o.width,o.height)}blitMipToMip(e,t,r,n,i=null){i=i||this.copyTextureMaterial,i.setBinding("texture",e.getMipView(t)),this.startRenderPass(r,{colorClear:!0,depthClear:!0},n,"blitMipToMip"),this.draw(this.blitMesh,i)}createMipsForRenderTexture(e,t=null){for(let r=1;r<e.mipCount;r++)this.blitMipToMip(e,r-1,e,r,t)}prepareDispatch(e){const t=this.setUniformData(e),r=this._computePassEncoder&&!this.profiler.recording?this._computePassEncoder:this.startComputePass(e.name),n=this.computePassState,i=e.pipeline;return n.pipeline!==i&&(r.setPipeline(i),n.pipeline=i),e.setBindGroups(r,t,n.bindGroups),r}dispatchCompute(e,t=1,r=1,n=1){this.prepareDispatch(e).dispatchWorkgroups(t,r,n)}dispatchComputeIndirect(e,t){this.prepareDispatch(e).dispatchWorkgroupsIndirect(t,0)}copyTextureToTexture(e,t,r=0,n=0){this.endPasses();const i={texture:e,mipLevel:r},s={texture:t,mipLevel:n},o=Math.max(1,e.width>>r),l=Math.max(1,e.height>>r),h=e.dimension=="3d"?Math.max(1,e.depthOrArrayLayers>>r):e.depthOrArrayLayers;this.commandEncoder.copyTextureToTexture(i,s,[o,l,h])}copyTextureLayer(e,t,r,n){this.endPasses(),this.commandEncoder.copyTextureToTexture({texture:e,origin:[0,0,t]},{texture:r,origin:[0,0,n]},[e.width,e.height,1])}setClearColor(e,t,r,n){this.clearColor.setValues(e,t,r,n)}createBuffer(e,t,r=!1,n=null){return this.device.createBuffer({size:e,usage:t,mappedAtCreation:r,label:n||"buffer_"+this.resourceID++})}writeBuffer(e,t){if(t instanceof ArrayBuffer){this.device.queue.writeBuffer(e,0,t);return}const r=t.buffer;if(!(r instanceof ArrayBuffer))throw new Error("Renderer.writeBuffer: SharedArrayBuffer-backed views are not supported");this.device.queue.writeBuffer(e,0,r,t.byteOffset,t.byteLength)}copyBufferToBuffer(e,t,r=0,n=0,i=e.size){this.endPasses(),this.commandEncoder.copyBufferToBuffer(e,r,t,n,i)}clearBuffer(e,t=0,r=e.size-t){this.endPasses(),this.commandEncoder.clearBuffer(e,t,r)}generateMipmaps(e,t){this.mipmapGenerator||(this.mipmapGenerator=new Di(this));const r=this.currentRenderTexture,n=this.currentRenderTextureMipLevel,i=this._renderPassEncoder!==null;this.mipmapGenerator.generateMipmaps(e,t),i?this.startRenderPass(r,{colorClear:!1,depthClear:!1},n,"resumed pass"):(this.endPasses(),this.currentRenderTexture=r,this.currentRenderTextureMipLevel=n)}checkRequiredLimitsAgainstAdapterLimits(e,t){const r=e.limits;for(const[n,i]of Object.entries(t))if(n in r){const s=r[n];s<i&&(console.warn("Renderer: checkRequiredLimitsAgainstAdapterLimits: limit exceeded",n,i,s),t[n]=s)}else console.warn("Renderer: checkRequiredLimitsAgainstAdapterLimits: key does not exist",n,i),delete t[n];return t}checkRequiredFeaturesAgainstAdapterFeatures(e,t){const r=e.features;return t.filter(n=>r.has(n)?!0:(console.warn("Renderer: checkRequiredFeaturesAgainstAdapterFeatures: feature not supported",n),!1))}createBlitTriangle(){const e=new me(this);return e.setPositions(new Float32Array([-1,-1,0,-1,3,0,3,-1,0])),e.setUV0(new Float32Array([0,1,0,-1,2,1])),e.setIndices([0,2,1]),e}async readBuffer(e,t,r=null){const n=this.createBuffer(e.size,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST);if(this._commandEncoder)this.endPasses(),this._commandEncoder.copyBufferToBuffer(e,0,n,0,e.size),await new Promise(o=>this.afterSubmitCallbacks.push(o));else{const o=this.device.createCommandEncoder();o.copyBufferToBuffer(e,0,n,0,e.size),this.device.queue.submit([o.finish()])}await n.mapAsync(GPUMapMode.READ,0,n.size);const i=n.getMappedRange(0,n.size),s=new t(i.slice(0));return n.unmap(),n.destroy(),r!==null&&console.log(r,"read buffer",s),s}destruct(){var e;this.renderTexture.destruct(),this.blitMesh.destruct(),(e=this._mouseListener)==null||e.destruct(),this.profiler.destruct(),this.canvasManager.destruct(),this.device.destroy()}}const wr=0,tt=1,Sr=2,Vt=3,Gn=4,Wn=5,jn=6,Hn=7,Mr=8,Ie=class Ie{constructor(e,t,r,n={}){a(this,"name");a(this,"options");a(this,"id");a(this,"parent");a(this,"materials");a(this,"callbacks",[]);a(this,"_value");this.id=Ie._id++;const{callback:i=null,materials:s=[],...o}=n;this.options={min:0,max:1,...o},this.name=t,this.parent=e,this.materials=s.filter(l=>l.hasUniform(this.name)),i!==null&&this.addCallback(i),this.setValue(r,!1)}get type(){return wr}get value(){return this._value}addCallback(e){this.callbacks.push(e)}triggerCallbacks(){Ie.changeCount++,this.callbacks.forEach(e=>e(this.value))}setValue(e,t=!0){e!==this._value&&(this._value=e,Ie.changeCount++,this.setShaderUniform(e),t&&this.triggerCallbacks())}setFromUI(e){this.setValue(e,!0)}setShaderUniform(e){}};a(Ie,"_id",0),a(Ie,"changeCount",0);let ee=Ie;class Yi extends ee{get type(){return Wn}}class Ki extends ee{get type(){return wr}setShaderUniform(e){this.materials.forEach(t=>t.setFloat(this.name,e===!0?1:0))}}class $i extends ee{get type(){return Vt}setValue(e,t=!0){super.setValue(e.clone(),t)}setShaderUniform(e){this.materials.forEach(t=>t.setVector3(this.name,e))}}function Zi(c){return c=Math.abs(c),c>0?J(Math.ceil(-Math.log10(c))+2,1,5):0}class Qi extends ee{constructor(e,t,r,n=0,i=1,s={}){super(e,t,r,{min:n>r?n-1:n,max:i<r?r*2:i,precision:Zi(i),...s})}get type(){return Sr}setShaderUniform(e){this.materials.forEach(t=>t.setFloat(this.name,e))}}class Ji extends ee{constructor(e,t,r,n=0,i=1,s={}){super(e,t,r,{min:n>r?n-1:n,max:i<r?r*2:i,step:1,...s})}get type(){return tt}setValue(e,t=!0){super.setValue(Math.round(e),t)}setShaderUniform(e){this.materials.forEach(t=>t.setFloat(this.name,e))}}class es extends ee{get type(){return Gn}}class ts extends ee{constructor(e,t,r,n,i={}){super(e,t,r,{selectOptions:n,...i})}get type(){return jn}setOptions(e){this.options.selectOptions=e}setShaderUniform(e){this.materials.forEach(t=>t.setFloat(this.name,e))}}class rs extends ee{constructor(e,t){super(e,"log",t)}setValue(e,t=!0){const r=ee.changeCount;super.setValue(e,t),ee.changeCount=r}get type(){return Hn}}class ns extends ee{get type(){return Mr}setValue(e,t=!0){super.setValue(e.clone(),t)}setShaderUniform(e){this.materials.forEach(t=>t.setVector3(this.name,e))}}const Ye=class Ye{constructor(e=""){a(this,"params",[]);a(this,"name","");a(this,"children",[]);a(this,"_collapsed",!1);a(this,"id",0);a(this,"collapsedCallbacks",[]);this.id=Ye._id++,this.name=e}addCollapsedCallback(e){this.collapsedCallbacks.push(e)}set collapsed(e){e!==this._collapsed&&(this._collapsed=e,this.collapsedCallbacks.forEach(t=>t(e)))}get collapsed(){return this._collapsed}collapseChildrenRecursive(){this.children.forEach(e=>{e.collapsed=!0,e.collapseChildrenRecursive()})}addGroup(e){const t=new Ye(e);return this.children.push(t),t}addParamFloat(e,t,r=0,n=1,i={}){return this.add(new Qi(this,e,t,r,n,i))}addParamSelect(e,t,r,n={}){return this.add(new ts(this,e,t,Ye.toSelectObject(r),n))}addParamInt(e,t,r=0,n=1,i={}){return this.add(new Ji(this,e,t,r,n,i))}addParamBool(e,t,r={}){return this.add(new Ki(this,e,t,r))}addParamColor(e,t,r={}){return this.add(new $i(this,e,t,r))}addParamVector3(e,t,r={}){return this.add(new ns(this,e,t,r))}addParamText(e,t,r={}){return this.add(new es(this,e,t,r))}addButton(e,t={}){return this.add(new Yi(this,e,!0,t))}addLog(e){return this.add(new rs(this,e))}add(e){return this.params.push(e),e}static toSelectObject(e){if(!Array.isArray(e))return e;const t={};return e.forEach((r,n)=>t[r]=n),t}getParameters(){return[...this.params,...this.children.flatMap(e=>e.getParameters())]}};a(Ye,"_id",0);let At=Ye;const Ut=["input","change"],is=`
.gui {
  position: fixed;
  right: 0;
  top: 0;
  z-index: 999;
  display: flex;
  flex-direction: row;
  color: white;
  font: 12px sans-serif;
  user-select: none;
  align-items: flex-start;
}
.gui-group {
  overflow: hidden;
}
.gui-group::-webkit-scrollbar {
  display: none;
}
.gui-group[open] {
  margin-bottom: 6px;
}
.gui > .gui-group {
  max-height: calc(100vh - 8px);
  overflow-y: auto;
  margin-right: 8px;
  background-color: rgba(51, 51, 51, 0.7);
  border-radius: 0 0 8px 8px;
  min-width: 280px;
  position:relative;
}
.gui-group-header {
  padding: 9px 8px;
  cursor: pointer;
  background-color: #000;
  font-weight: bold;
}
.gui-group-header:hover {
  opacity: 0.8;
}
.gui-group .gui-group .gui-group .gui-group-header {
  margin-left: 8px;
  background: #222;
}
.gui-mover {
  position: absolute;
  bottom: 0;
  top: 0;
  width: 7px;
  background: #555;
  opacity: 0;
}
.gui-mover:hover {
  cursor: ew-resize;
  opacity: 0.5;
}
.gui-form-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 32px;
  margin: 0 8px;
}
.gui-stats-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin: 4px 8px 0;
}
.gui-canvas {
  flex: 1 1 0;
  min-width: 0;
  height: 26px !important;
}
.gui-stats-row input[type="checkbox"] {
  flex: 0 0 auto;
}
.gui-stats-toggle {
  flex: 0 0 auto;
  margin-right: -6px;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
}
.gui label {
  width: 40%;
  min-width: 120px;
  flex-shrink: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  color: lightgray;
  white-space: nowrap;
}
.gui output {
  min-width: 50px;
  max-width: 50px;
  text-align: right;
  color: lightgray;
  cursor: pointer;
}
.gui pre {
  padding: 4px;
  padding-left: 16px;
  background-color: #6662;
  margin: 8px;
}
.gui input {
  flex-grow: 1;
  height: 24px;
}
.gui input[type="checkbox"] {
  height: 16px;
}
.gui button, .gui select {
  background-color: #666;
  border: none;
  border-radius: 4px;
  color: white;
  text-align: center;
  width: 100%;
  padding: 6px 16px;
  cursor: pointer;
}
.gui button:hover {
  background-color: #555;
}
.gui input:not([type='text']) {
  cursor: pointer;
}
/* Hide number input spinners */
.gui-vector3-input::-webkit-outer-spin-button,
.gui-vector3-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.gui-vector3-input[type=number] {
  -moz-appearance: textfield;
}
/* Compact row: small label and field on one line */
.gui-form-field.gui-form-field-compact {
  min-height: 26px;
  gap: 6px;
}
.gui .gui-form-field-compact label {
  width: auto;
  min-width: 26px;
  text-align: center;
}
.gui .gui-form-field-compact input {
  min-width: 0;
}
/* Label doubling as a button */
.gui .gui-label-action {
  cursor: pointer;
  color: white;
  background-color: #666;
  border-radius: 4px;
  padding: 5px 6px;
  line-height: 1;
}
.gui .gui-label-action:hover {
  background-color: #555;
}
.gui .gui-form-field-active .gui-label-action {
  background-color: #0af;
}
.gui .gui-form-field-active input[type='text'] {
  box-shadow: inset 0 0 0 2px #0af;
}
.gui label.draggable, .gui .gui-vector3-label.draggable {
  cursor: ew-resize;
  color: #fff;
}
.gui label.draggable:active, .gui .gui-vector3-label.draggable:active {
  color: #0af;
}
`;function Tr(c){console.log(c),navigator.clipboard.writeText(c)}function ke(c,e,t=void 0){const r=document.createElement("div");if(r.className="gui-form-field",c){const n=document.createElement("label");n.innerText=c.name,n.title=c.name,n.setAttribute("for",`input-${c.id}`),r.appendChild(n)}return r.appendChild(e),t&&r.appendChild(t),{container:r,label:r.querySelector("label")}}function Mt(c,e,t){c.classList.add("draggable");let r=0,n=!1;const i=o=>{if(!n)return;const l=o.clientX-r;r=o.clientX,t(l)},s=()=>{n=!1,document.removeEventListener("mousemove",i),document.removeEventListener("mouseup",s),document.body.style.cursor=""};c.addEventListener("mousedown",o=>{r=o.clientX,n=!0,document.addEventListener("mousemove",i),document.addEventListener("mouseup",s),document.body.style.cursor="ew-resize",o.preventDefault()})}function rr(c,e){const t=document.createElement("button");t.innerText=e.name,t.addEventListener("click",()=>e.triggerCallbacks()),c.appendChild(ke(void 0,t).container)}function ss(c,e){const t=document.createElement("input"),r=e.options;t.id=`input-${e.id}`,t.type="range",t.min=r.min.toString(),t.max=r.max.toString(),t.step=r.step!==void 0?`${r.step}`:"any";const n=document.createElement("output"),i=s=>{t.value=`${s}`,t.title=`${s.toFixed(r.precision||0)}`,n.innerText=`${s.toFixed(r.precision||0)}`};i(e.value),n.addEventListener("click",()=>Tr(n.innerText)),n.addEventListener("dblclick",()=>{let s=prompt(`Enter value [${r.min}-${r.max}]`,t.value);if(s!==null&&s!==""){const o=parseFloat(s);pi(s)&&e.setValue(e.type===tt?Math.round(o):o,!0)}}),Ut.forEach(s=>{t.addEventListener(s,o=>{const l=parseFloat(o.target.value);isNaN(l)||e.setValue(e.type===tt?Math.round(l):l,!0)})}),e.addCallback(i),c.appendChild(ke(e,t,n).container)}function as(c,e){const t=document.createElement("input"),r=e.options;t.id=`input-${e.id}`,t.type="number",t.step=r.step!==void 0?`${r.step}`:"any",t.classList.add("gui-vector3-input"),t.style.flex="1";const n=o=>{t.value=`${o}`};n(e.value),t.addEventListener("change",o=>{const l=parseFloat(o.target.value);isNaN(l)||e.setValue(e.type===tt?Math.round(l):l,!0)}),e.addCallback(n);const{container:i,label:s}=ke(e,t);s&&Mt(s,e,o=>{const l=r.step!==void 0?r.step:e.type===Sr?.01:1,h=e.value+o*l;e.setFromUI(e.type===tt?Math.round(h):h)}),c.appendChild(i)}function os(c,e){const t=document.createElement("input");t.id=`input-${e.id}`,t.type="color",t.value=new N(e.value.x,e.value.y,e.value.z,1).getHex();const r=document.createElement("output");r.addEventListener("click",()=>Tr(r.innerText)),r.addEventListener("dblclick",()=>{const i=prompt("Enter value",r.innerText);i&&e.setValue(new N().setHex(i).vector3,!0)});const n=i=>{const s=t.value=new N(i.x,i.y,i.z,1).getHex();t.value=`${s}`,r.innerText=`${s}`};n(e.value),Ut.forEach(i=>{t.addEventListener(i,s=>{e.setValue(new N().setHex(t.value).vector3,!0)})}),e.addCallback(n),c.appendChild(ke(e,t,r).container)}function ls(c,e){const t=document.createElement("input");t.id=`input-${e.id}`,t.type="checkbox",t.checked=e.value,t.addEventListener("change",r=>{e.setValue(r.target.checked,!0)}),e.addCallback(r=>t.checked=r),c.appendChild(ke(e,t).container)}function hs(c,e){const t=document.createElement("select"),r=e.options;t.id=`input-${e.id}`;for(const[s,o]of Object.entries(r.selectOptions||{})){const l=document.createElement("option");l.value=`${o}`,l.text=s,t.appendChild(l)}const n=document.createElement("output"),i=s=>{t.value=`${s}`;const o=r.precision!==void 0?s.toFixed(r.precision):`${s}`;t.title=o,n.innerText=o};i(e.value),n.addEventListener("click",()=>Tr(n.innerText)),Ut.forEach(s=>{t.addEventListener(s,o=>{e.setValue(parseFloat(o.target.value),!0)})}),e.addCallback(i),c.appendChild(ke(e,t,n).container)}function cs(c,e){const t=document.createElement("input");t.id=`input-${e.id}`,t.type="text",t.value=e.value,Ut.forEach(s=>{t.addEventListener(s,o=>{e.setValue(o.target.value,!0)})}),e.addCallback(s=>t.value=s);const{container:r,label:n}=ke(e,t);e.options.compact&&r.classList.add("gui-form-field-compact");const i=e.options.action;i&&n&&(n.removeAttribute("for"),n.classList.add("gui-label-action"),n.title=i.title||e.name,n.addEventListener("click",()=>i.onClick())),c.appendChild(r)}function us(c,e){const t=document.createElement("pre");t.innerText=e.value.toString(),e.addCallback(r=>t.innerText=r.toString()),c.appendChild(t)}function ds(c,e){const t=document.createElement("div");t.style.display="flex",t.style.gap="2px",t.style.flexGrow="1";const r=(b,g,y)=>{const v=document.createElement("div");v.style.display="flex",v.style.alignItems="center",v.style.gap="2px",v.style.flex="1",v.style.minWidth="0";const w=document.createElement("span");w.innerText=b,w.style.color="#999",w.style.fontSize="10px",w.style.flexShrink="0";const M=document.createElement("input");return M.type="number",M.step="any",M.value=`${y}`,M.id=`input-${e.id}-${g}`,M.style.flex="1",M.style.minWidth="0",M.style.width="0",M.style.padding="2px",M.style.fontSize="11px",M.classList.add("gui-vector3-input"),v.appendChild(w),v.appendChild(M),{wrapper:v,input:M,label:w}},{wrapper:n,input:i,label:s}=r("x","x",e.value.x),{wrapper:o,input:l,label:h}=r("y","y",e.value.y),{wrapper:u,input:d,label:f}=r("z","z",e.value.z);Mt(s,e,b=>{const g=e.options.step!==void 0?e.options.step:.01,y=e.value.clone();y.x+=b*g,e.setFromUI(y)}),s.classList.add("gui-vector3-label"),Mt(h,e,b=>{const g=e.options.step!==void 0?e.options.step:.01,y=e.value.clone();y.y+=b*g,e.setFromUI(y)}),h.classList.add("gui-vector3-label"),Mt(f,e,b=>{const g=e.options.step!==void 0?e.options.step:.01,y=e.value.clone();y.z+=b*g,e.setFromUI(y)}),f.classList.add("gui-vector3-label");const m=e.options.precision!==void 0?e.options.precision:4,p=b=>{i.value=`${parseFloat(b.x.toFixed(m))}`,l.value=`${parseFloat(b.y.toFixed(m))}`,d.value=`${parseFloat(b.z.toFixed(m))}`},x=()=>{const b=parseFloat(i.value),g=parseFloat(l.value),y=parseFloat(d.value);!isNaN(b)&&!isNaN(g)&&!isNaN(y)&&e.setFromUI(new S(b,g,y))};i.addEventListener("change",x),l.addEventListener("change",x),d.addEventListener("change",x),e.addCallback(b=>p(b)),t.appendChild(n),t.appendChild(o),t.appendChild(u),c.appendChild(ke(e,t).container)}const Pt=280;function fs(c,e,t=Pt){const r=document.createElement("details");r.className="gui-group",r.open=!e.collapsed,c.appendChild(r);const n=document.createElement("summary");n.className="gui-group-header",r.appendChild(n),n.innerText=e.name;const i=document.createElement("div");if(i.className="gui-group-body",r.appendChild(i),r.addEventListener("toggle",()=>{e.collapsed=!r.open}),e.addCollapsedCallback(s=>{r.open=!s}),c!=null&&c.classList.contains("gui")){t!==Pt&&(r.style.minWidth=`${t}px`,r.style.width=`${t}px`);const s=document.createElement("div");s.className="gui-mover",r.appendChild(s);let o=0,l=0;const h=d=>{if(r){const f=o-d.x;r.style.width=Math.max(l+f,t)+"px"}},u=()=>{document.removeEventListener("mousemove",h,!1),document.removeEventListener("mouseup",u,!1)};s.addEventListener("mousedown",d=>{o=d.x,l=r.getBoundingClientRect().width,document.addEventListener("mousemove",h,!1),document.addEventListener("mouseup",u,!1)},!1)}return i}let We=null;function ps(){if(We)return We;const c=document.createElement("style");return c.innerHTML=is,document.head.appendChild(c),We=document.createElement("div"),We.className="gui",document.body.appendChild(We),We}function ms(c,e="FPS"){let t=1/0,r=0,n=Math.round;const i=n(window.devicePixelRatio||1),s=26*i,o=0,l=0,h=0,u=12*i,d=14*i,f=i*2;let m=260*i,p=m;const x=Un(m,s);x.className="gui-canvas";const b=x.getContext("2d"),g=()=>{b.font=`bold ${11*i}px sans-serif`,b.textBaseline="top"};g();const y=async(T,L)=>{if(t=Math.min(t,T),r=Math.max(r,T),b.clearRect(0,0,m,u),"memory"in window.performance){b.fillStyle="lightgray",b.textAlign="right";let D=window.performance.memory,B=1048576;b.fillText(`${D.usedJSHeapSize/B|0}/${D.jsHeapSizeLimit/B|0} MB`,m,l),b.textAlign="left"}b.fillStyle=T<58?"pink":"lightgreen",b.fillText(`${n(T)} ${e} (${n(t)}-${n(r)})`,o,l),createImageBitmap(x).then(D=>{b.clearRect(h,u,p,d),b.drawImage(D,h+f,u,p-f,d,h,u,p-f,d),D.close();const B=n(Et(T/Math.max(L,r))*d);b.fillRect(h+p-f,u+d-B,f,B)})};y(0,100);let v=(performance||Date).now(),w=v,M=0;function C(){M++;let T=(performance||Date).now();return T>=w+1e3&&(y(M*1e3/(T-w),100),w=T,M=0),T}const E=document.createElement("div");E.className="gui-stats-row",E.appendChild(x),c.appendChild(E);const A=()=>{const T=n(x.clientWidth*i);T<=0||T===m||(m=p=T,x.width=m,g())};new ResizeObserver(A).observe(x);function P(){x.isConnected&&(v=C(),requestAnimationFrame(P))}return requestAnimationFrame(P),E}function gs(c,e="profile: gpu pass timings, frames not tied to vsync"){const t=document.createElement("span");t.className="gui-stats-toggle",t.title=e,t.textContent="profile";const r=document.createElement("input");r.id="input-profile",r.type="checkbox",r.title=e,r.checked=et.isEnabled(),r.addEventListener("change",()=>{et.setEnabled(r.checked),kt.setEnabled(r.checked)}),t.addEventListener("click",()=>r.click()),c.appendChild(t),c.appendChild(r)}function bs(c){return new N(c.x,c.y,c.z,1).getHex()}function xs(c){return new N().setHex(c).vector3}function ys(c){return{name:c.name,type:c.type,value:c.type===Vt?bs(c.value):c.value,options:c.options}}function Xn(c){return{name:c.name,collapsed:c.collapsed,params:c.params.map(e=>ys(e)),children:c.children.map(e=>Xn(e))}}function vs(c,e){if(!e)return;const t=document.createElement("div"),r=new At,n=r.addButton("Save JSON",{callback:()=>ws(c)}),i=r.addButton("Load JSON",{callback:()=>Ss(c)});rr(t,n),rr(t,i),e.appendChild(t)}function ws(c){const e=Xn(c),t=JSON.stringify(e,null,2),r=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(r),i=document.createElement("a");i.href=n,i.download="params.json",document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}function qn(c,e){!c||!e||(Array.isArray(c.children)&&c.children.forEach(t=>{const r=e.children.find(n=>n.name===t.name);r&&qn(t,r)}),Array.isArray(c.params)&&c.params.forEach(t=>{const r=e.params.find(i=>i.name===t.name);if(!r)return;const n=t.type===Vt?typeof t.value=="string"?xs(t.value):t.value instanceof S?t.value:new S(t.value.x,t.value.y,t.value.z):t.type===Mr?t.value instanceof S?t.value:new S(t.value.x,t.value.y,t.value.z):t.value;r.setValue(n)}))}function Ss(c){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=t=>{var i;const r=(i=t.target.files)==null?void 0:i[0];if(!r)return;const n=new FileReader;n.onload=s=>{var o,l;try{const h=(o=s.target)==null?void 0:o.result;if(!h){console.error("No file content read");return}const u=JSON.parse(h);qn(u,c)}catch(h){console.error("Error details:",h),console.error("File content that failed to parse:",(l=s.target)==null?void 0:l.result)}},n.onerror=s=>{console.error("FileReader error:",s)},n.readAsText(r)},e.click()}class Ms{constructor(e,t=!1,r=!1,n=!0,i=Pt){a(this,"div");a(this,"gui");a(this,"rootGroup");a(this,"addStats",!0);a(this,"minWidth",Pt);typeof window>"u"||(this.rootGroup=e,this.addStats=n,this.minWidth=i,this.div=this.readGroup(void 0,e,ps(),t),r&&vs(this.rootGroup,this.gui||null))}destruct(){this.gui&&this.gui.parentElement&&this.gui.parentElement.removeChild(this.gui),this.gui=void 0}readGroup(e,t,r,n){if(!t.name)throw new Error("group name not initialized");const i=fs(r,t,this.minWidth),s={div:i,children:new Array};if(!e&&(this.gui=i.parentElement,this.addStats&&!document.querySelector(".gui-stats-row"))){const o=ms(i);gs(o)}for(let o of t.params)switch(o.type){case Sr:case tt:o.options.typeIn?as(i,o):ss(i,o);break;case Vt:os(i,o);break;case wr:ls(i,o);break;case Wn:rr(i,o);break;case Gn:cs(i,o);break;case jn:hs(i,o);break;case Hn:us(i,o);break;case Mr:ds(i,o);break}for(let o of t.children)o.collapsed=o.collapsed||n,s.children.push(this.readGroup(t,o,i,n));return s}}class j{constructor(...e){a(this,"m",[1,0,0,0,1,0,0,0,1]);e.length===9&&(this.m=[...e])}static clone(e){return j.copy(e,new j)}static copy(e,t){const r=t.m,n=e.m;for(let i=0;i<9;i++)r[i]=n[i];return t}static setValues(e,t,r,n,i,s,o,l,h,u){const d=e.m;return d[0]=t,d[1]=r,d[2]=n,d[3]=i,d[4]=s,d[5]=o,d[6]=l,d[7]=h,d[8]=u,e}static identity(e=void 0){return e=e||new j,j.setValues(e,1,0,0,0,1,0,0,0,1)}static transpose(e,t=void 0){t=t||new j;const r=t.m,n=e.m;if(r===n){const i=n[1],s=n[2],o=n[5];r[1]=n[3],r[2]=n[6],r[3]=i,r[5]=n[7],r[6]=s,r[7]=o}else r[0]=n[0],r[1]=n[3],r[2]=n[6],r[3]=n[1],r[4]=n[4],r[5]=n[7],r[6]=n[2],r[7]=n[5],r[8]=n[8];return t}static invert(e,t=void 0){t=t||new j;const r=t.m,n=e.m,i=n[0],s=n[1],o=n[2],l=n[3],h=n[4],u=n[5],d=n[6],f=n[7],m=n[8],p=m*h-u*f,x=-m*l+u*d,b=f*l-h*d;let g=i*p+s*x+o*b;return g?(g=1/g,r[0]=p*g,r[1]=(-m*s+o*f)*g,r[2]=(u*s-o*h)*g,r[3]=x*g,r[4]=(m*i-o*d)*g,r[5]=(-u*i+o*l)*g,r[6]=b*g,r[7]=(-f*i+s*d)*g,r[8]=(h*i-s*l)*g,t):j.identity(t)}static determinant(e){const t=e.m,r=t[0],n=t[1],i=t[2],s=t[3],o=t[4],l=t[5],h=t[6],u=t[7],d=t[8];return r*(d*o-l*u)+n*(-d*s+l*h)+i*(u*s-o*h)}static multiply(e,t,r=void 0){r=r||new j;const n=r.m,i=e.m,s=t.m,o=i[0],l=i[1],h=i[2],u=i[3],d=i[4],f=i[5],m=i[6],p=i[7],x=i[8],b=s[0],g=s[1],y=s[2],v=s[3],w=s[4],M=s[5],C=s[6],E=s[7],A=s[8];return n[0]=b*o+g*u+y*m,n[1]=b*l+g*d+y*p,n[2]=b*h+g*f+y*x,n[3]=v*o+w*u+M*m,n[4]=v*l+w*d+M*p,n[5]=v*h+w*f+M*x,n[6]=C*o+E*u+A*m,n[7]=C*l+E*d+A*p,n[8]=C*h+E*f+A*x,r}static fromQuat(e,t=void 0){t=t||new j;const r=t.m,n=e.x,i=e.y,s=e.z,o=e.w,l=n+n,h=i+i,u=s+s,d=n*l,f=i*l,m=i*h,p=s*l,x=s*h,b=s*u,g=o*l,y=o*h,v=o*u;return r[0]=1-m-b,r[3]=f-v,r[6]=p+y,r[1]=f+v,r[4]=1-d-b,r[7]=x-g,r[2]=p-y,r[5]=x+g,r[8]=1-d-m,t}static add(e,t,r=void 0){r=r||new j;const n=r.m,i=e.m,s=t.m;for(let o=0;o<9;o++)n[o]=i[o]+s[o];return r}static subtract(e,t,r=void 0){r=r||new j;const n=r.m,i=e.m,s=t.m;for(let o=0;o<9;o++)n[o]=i[o]-s[o];return r}static multiplyScalar(e,t,r=void 0){r=r||new j;const n=r.m,i=e.m;for(let s=0;s<9;s++)n[s]=i[s]*t;return r}static normalFromMat4(e,t=void 0){return t=j.fromMat4(e,t),j.transpose(j.invert(t,t),t)}static fromMat4(e,t=void 0){t=t||new j;const r=t.m,n=e.m;return r[0]=n[0],r[1]=n[1],r[2]=n[2],r[3]=n[4],r[4]=n[5],r[5]=n[6],r[6]=n[8],r[7]=n[9],r[8]=n[10],t}clone(){return j.clone(this)}}const Ts=new S,Cs=new S,Es=new S,Vr=new j;class V{constructor(e=0,t=0,r=0,n=1){a(this,"x");a(this,"y");a(this,"z");a(this,"w");this.x=e,this.y=t,this.z=r,this.w=n}static get IDENTITY(){return new V(0,0,0,1)}static get ZERO(){return new V(0,0,0,0)}static dot(e,t){return e.x*t.x+e.y*t.y+e.z*t.z+e.w*t.w}static lerp(e,t,r){const n=V.dot(e,t)<0?-1:1;return new V(e.x+r*(n*t.x-e.x),e.y+r*(n*t.y-e.y),e.z+r*(n*t.z-e.z),e.w+r*(n*t.w-e.w)).normalize()}static lookAt(e,t,r){return new V().lookAt(e,t,r)}static createFromAxisAngle(e,t){return new V().setAxisAngle(e,t)}static getAxisAngle(e){const t=Math.acos(Math.min(1,Math.max(-1,e.w)))*2,r=Math.sin(t/2),n=new S;return r>we?(n.x=e.x/r,n.y=e.y/r,n.z=e.z/r):(n.x=1,n.y=0,n.z=0),{axis:n,angle:t}}static getAngle(e,t){const r=V.dot(e,t);return Math.acos(Math.min(1,Math.max(-1,2*r*r-1)))}static multiply(e,t){return e.clone().multiply(t)}static calculateW(e){const t=e.x,r=e.y,n=e.z;return new V(t,r,n,Math.sqrt(Math.abs(1-t*t-r*r-n*n)))}static exp(e){const t=e.x,r=e.y,n=e.z,i=e.w,s=Math.sqrt(t*t+r*r+n*n),o=Math.exp(i),l=s>0?o*Math.sin(s)/s:0;return new V(t*l,r*l,n*l,o*Math.cos(s))}static ln(e){const t=e.x,r=e.y,n=e.z,i=e.w,s=Math.sqrt(t*t+r*r+n*n),o=s>0?Math.atan2(s,i)/s:0;return new V(t*o,r*o,n*o,.5*Math.log(t*t+r*r+n*n+i*i))}static scale(e,t){return new V(e.x*t,e.y*t,e.z*t,e.w*t)}static pow(e,t){return V.exp(V.scale(V.ln(e),t))}static slerp(e,t,r){const n=e.x,i=e.y,s=e.z,o=e.w;let l=t.x,h=t.y,u=t.z,d=t.w,f,m,p=n*l+i*h+s*u+o*d;if(p<0&&(p=-p,l=-l,h=-h,u=-u,d=-d),1-p>we){const x=Math.acos(p),b=Math.sin(x);f=Math.sin((1-r)*x)/b,m=Math.sin(r*x)/b}else f=1-r,m=r;return new V(f*n+m*l,f*i+m*h,f*s+m*u,f*o+m*d)}static random(){const e=Math.random(),t=Math.random(),r=Math.random(),n=Math.sqrt(1-e),i=Math.sqrt(e);return new V(n*Math.sin(2*Math.PI*t),n*Math.cos(2*Math.PI*t),i*Math.sin(2*Math.PI*r),i*Math.cos(2*Math.PI*r))}static invert(e){return e.clone().invert()}static conjugate(e){return e.clone().conjugate()}static fromMat3(e){return new V().fromMat3(e)}static fromEuler(e,t,r){return new V().rotateEulerValues(e,t,r)}static rotationBetween(e,t){const r=Math.max(-1,Math.min(1,S.dot(e,t)));if(r>.999999)return new V(0,0,0,1);if(r<-.999999){let i=S.cross(e,new S(1,0,0));return i.length()<1e-6&&(i=S.cross(e,new S(0,1,0))),V.createFromAxisAngle(i.normalize(),Math.PI)}const n=S.cross(e,t).normalize();return V.createFromAxisAngle(n,Math.acos(r))}static rotateVector3(e,t,r=new S){const n=2*(e.y*t.z-e.z*t.y),i=2*(e.z*t.x-e.x*t.z),s=2*(e.x*t.y-e.y*t.x);return r.setValues(t.x+e.w*n+(e.y*s-e.z*i),t.y+e.w*i+(e.z*n-e.x*s),t.z+e.w*s+(e.x*i-e.y*n))}clone(){return new V(this.x,this.y,this.z,this.w)}copy(e){return this.setValues(e.x,e.y,e.z,e.w)}setValues(e,t,r,n){return this.x=e,this.y=t,this.z=r,this.w=n,this}dot(e){return V.dot(this,e)}identity(){return this.setValues(0,0,0,1)}multiply(e){const t=this.x,r=this.y,n=this.z,i=this.w,s=e.x,o=e.y,l=e.z,h=e.w;return this.x=t*h+i*s+r*l-n*o,this.y=r*h+i*o+n*s-t*l,this.z=n*h+i*l+t*o-r*s,this.w=i*h-t*s-r*o-n*l,this}conjugate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}invert(){const e=V.dot(this,this),t=e?1/e:0;return this.setValues(-this.x*t,-this.y*t,-this.z*t,this.w*t)}rotateEulerValues(e,t,r){return this.rotateY(t),this.rotateX(e),this.rotateZ(r),this}rotateX(e){e*=.5;const t=this.x,r=this.y,n=this.z,i=this.w,s=Math.sin(e),o=Math.cos(e);return this.x=t*o+i*s,this.y=r*o+n*s,this.z=n*o-r*s,this.w=i*o-t*s,this}rotateY(e){e*=.5;const t=this.x,r=this.y,n=this.z,i=this.w,s=Math.sin(e),o=Math.cos(e);return this.x=t*o-n*s,this.y=r*o+i*s,this.z=n*o+t*s,this.w=i*o-r*s,this}rotateZ(e){e*=.5;const t=this.x,r=this.y,n=this.z,i=this.w,s=Math.sin(e),o=Math.cos(e);return this.x=t*o+r*s,this.y=r*o-t*s,this.z=n*o+i*s,this.w=i*o-n*s,this}setAxisAngle(e,t){t=t*.5;const r=Math.sin(t);return this.x=r*e.x,this.y=r*e.y,this.z=r*e.z,this.w=Math.cos(t),this}rotateAxisAngle(e,t){return this.copy(V.createFromAxisAngle(e,t).multiply(this))}lookAt(e,t,r){const n=Ts.copy(e).subtract(t),i=n.length();if(i<we)return this.identity();n.multiplyScalar(1/i);const s=S.lookAtRight(r,n,Cs),o=Es.crossVectors(n,s);return j.setValues(Vr,s.x,s.y,s.z,o.x,o.y,o.z,n.x,n.y,n.z),this.fromMat3(Vr)}fromMat3(e){const t=e.m,r=t[0]+t[4]+t[8];if(r>0){const n=Math.sqrt(r+1);this.w=.5*n;const i=.5/n;this.x=(t[5]-t[7])*i,this.y=(t[6]-t[2])*i,this.z=(t[1]-t[3])*i}else{let n=0;t[4]>t[0]&&(n=1),t[8]>t[n*3+n]&&(n=2);const i=(n+1)%3,s=(n+2)%3,o=Math.sqrt(t[n*3+n]-t[i*3+i]-t[s*3+s]+1),l=.5*o,h=.5/o;this.w=(t[i*3+s]-t[s*3+i])*h;const u=(t[i*3+n]+t[n*3+i])*h,d=(t[s*3+n]+t[n*3+s])*h;this.x=n===0?l:i===0?u:d,this.y=n===1?l:i===1?u:d,this.z=n===2?l:i===2?u:d}return this}normalize(){const e=this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w;if(e===0)return this.identity();const t=1/Math.sqrt(e);return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}get array(){return[this.x,this.y,this.z,this.w]}}const ks=new S(1,0,0),As=new S(0,1,0),Ps=new S(0,0,1),_s=new S(0,0,0),Rs=new S(1,1,1),Ls=new S,Bs=new S,I=class I{constructor(...e){a(this,"m",[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);e.length===16&&(this.m=[...e])}static clone(e){return I.copy(e,new I)}static copy(e,t){const r=t.m,n=e.m;for(let i=0;i<16;i++)r[i]=n[i];return t}static identity(e=void 0){return e=e||new I,e.setValues(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)}static transpose(e,t=void 0){t=t||new I;const r=t.m,n=e.m;if(r===n){const i=n[1],s=n[2],o=n[3],l=n[6],h=n[7],u=n[11];r[1]=n[4],r[2]=n[8],r[3]=n[12],r[4]=i,r[6]=n[9],r[7]=n[13],r[8]=s,r[9]=l,r[11]=n[14],r[12]=o,r[13]=h,r[14]=u}else r[0]=n[0],r[1]=n[4],r[2]=n[8],r[3]=n[12],r[4]=n[1],r[5]=n[5],r[6]=n[9],r[7]=n[13],r[8]=n[2],r[9]=n[6],r[10]=n[10],r[11]=n[14],r[12]=n[3],r[13]=n[7],r[14]=n[11],r[15]=n[15];return t}static invert(e,t=void 0){t=t||new I;const r=t.m,n=e.m,i=n[0],s=n[1],o=n[2],l=n[3],h=n[4],u=n[5],d=n[6],f=n[7],m=n[8],p=n[9],x=n[10],b=n[11],g=n[12],y=n[13],v=n[14],w=n[15],M=i*u-s*h,C=i*d-o*h,E=i*f-l*h,A=s*d-o*u,P=s*f-l*u,T=o*f-l*d,L=m*y-p*g,D=m*v-x*g,B=m*w-b*g,K=p*v-x*y,te=p*w-b*y,$=x*w-b*v;let U=M*$-C*te+E*K+A*B-P*D+T*L;return U?(U=1/U,r[0]=(u*$-d*te+f*K)*U,r[1]=(o*te-s*$-l*K)*U,r[2]=(y*T-v*P+w*A)*U,r[3]=(x*P-p*T-b*A)*U,r[4]=(d*B-h*$-f*D)*U,r[5]=(i*$-o*B+l*D)*U,r[6]=(v*E-g*T-w*C)*U,r[7]=(m*T-x*E+b*C)*U,r[8]=(h*te-u*B+f*L)*U,r[9]=(s*B-i*te-l*L)*U,r[10]=(g*P-y*E+w*M)*U,r[11]=(p*E-m*P-b*M)*U,r[12]=(u*D-h*K-d*L)*U,r[13]=(i*K-s*D+o*L)*U,r[14]=(y*C-g*A-v*M)*U,r[15]=(m*A-p*C+x*M)*U,t):I.identity(t)}static determinant(e){const t=e.m,r=t[0],n=t[1],i=t[2],s=t[3],o=t[4],l=t[5],h=t[6],u=t[7],d=t[8],f=t[9],m=t[10],p=t[11],x=t[12],b=t[13],g=t[14],y=t[15],v=r*l-n*o,w=r*h-i*o,M=n*h-i*l,C=d*b-f*x,E=d*g-m*x,A=f*g-m*b,P=r*A-n*E+i*C,T=o*A-l*E+h*C,L=d*M-f*w+m*v,D=x*M-b*w+g*v;return u*P-s*T+y*L-p*D}static multiply(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=t.m,o=i[0],l=i[1],h=i[2],u=i[3],d=i[4],f=i[5],m=i[6],p=i[7],x=i[8],b=i[9],g=i[10],y=i[11],v=i[12],w=i[13],M=i[14],C=i[15];for(let E=0;E<16;E+=4){const A=s[E],P=s[E+1],T=s[E+2],L=s[E+3];n[E]=A*o+P*d+T*x+L*v,n[E+1]=A*l+P*f+T*b+L*w,n[E+2]=A*h+P*m+T*g+L*M,n[E+3]=A*u+P*p+T*y+L*C}return r}static translate(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=t.x,o=t.y,l=t.z;if(i!==n)for(let h=0;h<12;h++)n[h]=i[h];for(let h=0;h<4;h++)n[12+h]=i[h]*s+i[4+h]*o+i[8+h]*l+i[12+h];return r}static scale(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=t.x,o=t.y,l=t.z;for(let h=0;h<4;h++)n[h]=i[h]*s,n[4+h]=i[4+h]*o,n[8+h]=i[8+h]*l,n[12+h]=i[12+h];return r}static rotate(e,t,r,n=void 0){return I.multiply(e,I.fromRotation(t,r,I.tempRotation),n)}static rotateX(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=Math.sin(t),o=Math.cos(t),l=i[4],h=i[5],u=i[6],d=i[7],f=i[8],m=i[9],p=i[10],x=i[11];return i!==n&&(n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15]),n[4]=l*o+f*s,n[5]=h*o+m*s,n[6]=u*o+p*s,n[7]=d*o+x*s,n[8]=f*o-l*s,n[9]=m*o-h*s,n[10]=p*o-u*s,n[11]=x*o-d*s,r}static rotateY(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=Math.sin(t),o=Math.cos(t),l=i[0],h=i[1],u=i[2],d=i[3],f=i[8],m=i[9],p=i[10],x=i[11];return i!==n&&(n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15]),n[0]=l*o-f*s,n[1]=h*o-m*s,n[2]=u*o-p*s,n[3]=d*o-x*s,n[8]=l*s+f*o,n[9]=h*s+m*o,n[10]=u*s+p*o,n[11]=d*s+x*o,r}static rotateZ(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=Math.sin(t),o=Math.cos(t),l=i[0],h=i[1],u=i[2],d=i[3],f=i[4],m=i[5],p=i[6],x=i[7];return i!==n&&(n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15]),n[0]=l*o+f*s,n[1]=h*o+m*s,n[2]=u*o+p*s,n[3]=d*o+x*s,n[4]=f*o-l*s,n[5]=m*o-h*s,n[6]=p*o-u*s,n[7]=x*o-d*s,r}static fromTranslation(e,t=void 0){return t=t||new I,t.setValues(1,0,0,0,0,1,0,0,0,0,1,0,e.x,e.y,e.z,1)}static fromRotation(e,t,r=void 0){r=r||new I;let n=t.length();if(n<we)return I.identity(r);n=1/n;const i=t.x*n,s=t.y*n,o=t.z*n,l=Math.sin(e),h=Math.cos(e),u=1-h;return r.setValues(i*i*u+h,s*i*u+o*l,o*i*u-s*l,0,i*s*u-o*l,s*s*u+h,o*s*u+i*l,0,i*o*u+s*l,s*o*u-i*l,o*o*u+h,0,0,0,0,1)}static fromXRotation(e,t=void 0){return I.fromRotation(e,ks,t)}static fromYRotation(e,t=void 0){return I.fromRotation(e,As,t)}static fromZRotation(e,t=void 0){return I.fromRotation(e,Ps,t)}static fromRotationTranslationScale(e,t,r,n=void 0){n=n||new I;const i=e.x,s=e.y,o=e.z,l=e.w,h=i+i,u=s+s,d=o+o,f=i*h,m=i*u,p=i*d,x=s*u,b=s*d,g=o*d,y=l*h,v=l*u,w=l*d,M=r.x,C=r.y,E=r.z;return n.setValues((1-(x+g))*M,(m+w)*M,(p-v)*M,0,(m-w)*C,(1-(f+g))*C,(b+y)*C,0,(p+v)*E,(b-y)*E,(1-(f+x))*E,0,t.x,t.y,t.z,1)}static toTranslationRotationScale(e,t=void 0,r=void 0,n=void 0){t=t||new V,r=r||new S,n=n||new S;const i=e.m;r.x=i[12],r.y=i[13],r.z=i[14];const s=Math.sqrt(i[0]*i[0]+i[1]*i[1]+i[2]*i[2]),o=Math.sqrt(i[4]*i[4]+i[5]*i[5]+i[6]*i[6]),l=Math.sqrt(i[8]*i[8]+i[9]*i[9]+i[10]*i[10]),h=i[0]*(i[5]*i[10]-i[6]*i[9])-i[1]*(i[4]*i[10]-i[6]*i[8])+i[2]*(i[4]*i[9]-i[5]*i[8]);n.x=h<0?-s:s,n.y=o,n.z=l;const u=I.tempMat3,d=u.m;let f=0,m=-1;for(let p=0;p<3;p++){const x=p===0?n.x:p===1?o:l;x===0&&(f++,m=p);const b=x===0?0:1/x;d[p*3]=i[p*4]*b,d[p*3+1]=i[p*4+1]*b,d[p*3+2]=i[p*4+2]*b}if(f>1)t.identity();else{if(f===1){const p=m*3,x=(m+1)%3*3,b=(m+2)%3*3;d[p]=d[x+1]*d[b+2]-d[x+2]*d[b+1],d[p+1]=d[x+2]*d[b]-d[x]*d[b+2],d[p+2]=d[x]*d[b+1]-d[x+1]*d[b]}t.fromMat3(u)}return{position:r,rotation:t,scale:n}}static fromQuat(e,t=void 0){return I.fromRotationTranslationScale(e,_s,Rs,t)}static perspective(e,t,r,n,i=void 0){const s=r*Math.tan(e/2),o=s*t;return I.frustum(-o,o,-s,s,r,n,i)}static frustum(e,t,r,n,i,s,o=void 0){o=o||new I;const l=1/(t-e),h=1/(n-r);let u=-1,d=-i;if(s!=null&&s!==1/0){const f=1/(i-s);u=s*f,d=s*i*f}return o.setValues(2*i*l,0,0,0,0,2*i*h,0,0,(t+e)*l,(n+r)*h,u,-1,0,0,d,0)}static ortho(e,t,r,n,i,s,o=void 0){o=o||new I;const l=1/(e-t),h=1/(r-n),u=1/(i-s);return o.setValues(-2*l,0,0,0,0,-2*h,0,0,0,0,u,0,(e+t)*l,(n+r)*h,i*u,1)}static lookAt(e,t,r,n=void 0){n=n||new I;const i=e.x,s=e.y,o=e.z,l=t.x,h=t.y,u=t.z;if(Math.abs(i-l)<we&&Math.abs(s-h)<we&&Math.abs(o-u)<we)return I.identity(n);const d=(E,A,P)=>{const T=Math.hypot(E,A,P);return T?1/T:0};let f=i-l,m=s-h,p=o-u,x=d(f,m,p);f*=x,m*=x,p*=x;const b=S.lookAtRight(r,Bs.setValues(f,m,p),Ls),g=b.x,y=b.y,v=b.z;let w=m*v-p*y,M=p*g-f*v,C=f*y-m*g;return x=d(w,M,C),w*=x,M*=x,C*=x,n.setValues(g,w,f,0,y,M,m,0,v,C,p,0,-(g*i+y*s+v*o),-(w*i+M*s+C*o),-(f*i+m*s+p*o),1)}static add(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=t.m;for(let o=0;o<16;o++)n[o]=i[o]+s[o];return r}static subtract(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m,s=t.m;for(let o=0;o<16;o++)n[o]=i[o]-s[o];return r}static multiplyScalar(e,t,r=void 0){r=r||new I;const n=r.m,i=e.m;for(let s=0;s<16;s++)n[s]=i[s]*t;return r}setValues(e,t,r,n,i,s,o,l,h,u,d,f,m,p,x,b){const g=this.m;return g[0]=e,g[1]=t,g[2]=r,g[3]=n,g[4]=i,g[5]=s,g[6]=o,g[7]=l,g[8]=h,g[9]=u,g[10]=d,g[11]=f,g[12]=m,g[13]=p,g[14]=x,g[15]=b,this}clone(){return I.clone(this)}copy(e){return I.copy(e,this)}get inverse(){return I.invert(this)}};a(I,"tempRotation",new I),a(I,"tempMat3",new j);let F=I;class Yn{constructor(e=1,t=.01,r=10){a(this,"frustumHeight",1);a(this,"projectionMatrix",new F);a(this,"fov");a(this,"_near");a(this,"_far");a(this,"_aspectRatio");a(this,"_frustumOffset",new k);a(this,"_jitter",new k);a(this,"_dirty",!0);a(this,"_version",0);a(this,"jitterFrame",0);this.fov=e,this.frustumHeight=Math.tan(this.fov*.5)*2,this._near=t,this._far=r,this._aspectRatio=1,this.dirty=!0}copy(e){this.FOV=e.fov,this._near=e.near,this._far=e.far,this._aspectRatio=e.aspectRatio,this.dirty=!0}get near(){return this._near}set near(e){e!==this._near&&(this._near=e,this.dirty=!0)}get far(){return this._far}set far(e){e!==this._far&&(this._far=e,this.dirty=!0)}get aspectRatio(){return this._aspectRatio}set aspectRatio(e){e!==this._aspectRatio&&(this._aspectRatio=e,this.dirty=!0)}get dirty(){return this._dirty}set dirty(e){this._dirty=e,e&&this._version++}get version(){return this._version}get frustumCorner(){this.dirty&&this.updateMatrix();const e=this.frustumHeight*.5,t=e*this._aspectRatio;return new S(t,e,1)}get matrix(){return this.updateMatrix(),this.projectionMatrix}get FOV(){return this.fov}set FOV(e){e!==this.fov&&(this.fov=e,this.frustumHeight=Math.tan(this.fov*.5)*2,this.dirty=!0)}setMatrix(e){F.copy(e,this.projectionMatrix),this._dirty=!1,this._version++}updateMatrix(){if(!this.dirty)return;const e=this._near*Math.tan(this.fov/2),t=e*this._aspectRatio,r=(this._frustumOffset.x+this._jitter.x)*2*t,n=(this._frustumOffset.y+this._jitter.y)*2*e;F.frustum(-t+r,t+r,-e+n,e+n,this._near,this._far,this.projectionMatrix),this.dirty=!1}setFrustumOffsetX(e){this._frustumOffset.x=e,this.dirty=!0}setFrustumOffsetY(e){this._frustumOffset.y=e,this.dirty=!0}jitter(e,t=64){const r=this.jitterFrame%t+1;this._jitter.x=(Br(r,2)-.5)/e.x,this._jitter.y=(Br(r,3)-.5)/e.y,this.jitterFrame++,this.dirty=!0}resetJitter(){this._jitter.setValues(0,0),this.dirty=!0}get jitterOffset(){return this._jitter}}const Ur=1e-4,Ke=class Ke{constructor(){a(this,"name","");a(this,"id",-1);a(this,"_rotation",new V);a(this,"_position",new S);a(this,"_scale",new S(1,1,1));a(this,"_matrix",new F);a(this,"_localMatrix",new F);a(this,"_parent",null);a(this,"_children",[]);a(this,"_signalDirtyDown",!0);a(this,"_dirty",!0);this.id=Ke.id++}get dirty(){return this._dirty}get rotation(){return this._rotation.clone()}set rotation(e){this._rotation.copy(e),this.setDirty()}get position(){return this._position.clone()}set position(e){this._position.copy(e),this.setDirty()}get scale(){return this._scale.clone()}set scale(e){this._scale.copy(e),this.setDirty()}get localMatrix(){return this.updateMatrix(),this._localMatrix}get parent(){return this._parent}set parent(e){if(this._parent!==e){for(let t=e;t;t=t._parent)if(t===this){_.warn("Transform: a transform can not be its own ancestor",this.name,e.name);return}if(this._parent){const t=this._parent._children,r=t.indexOf(this);r>=0&&t.splice(r,1)}this._parent=e,e&&e._children.push(this),this.setDirty()}}get children(){return this._children}getChild(e){for(const t of this._children)if(t.name===e)return t;return null}get flipped(){let e=Math.sign(this.scale.x)*Math.sign(this.scale.y)*Math.sign(this.scale.z);return this.parent?this.parent.flipped*e:e}get worldMatrix(){return this.updateMatrix(),this._matrix}set localMatrix(e){const t=F.toTranslationRotationScale(e);this.setPositionRotationScale(t.position,t.rotation,t.scale)}get worldPosition(){return this.updateMatrix(),new S().transform(this._matrix)}set worldPosition(e){this.parent?this.position=e.clone().transform(F.invert(this.parent.worldMatrix)):this.position=e}set scaleScalar(e){this._scale.setValues(e,e,e),this.setDirty()}get worldScaleScalar(){const e=this.worldMatrix.m;return Math.sqrt(e[0]*e[0]+e[1]*e[1]+e[2]*e[2])}get worldRotation(){return this._parent?V.multiply(this._parent.worldRotation,this._rotation):this._rotation.clone()}set worldRotation(e){this.parent?this.rotation=V.invert(this.parent.worldRotation).multiply(e.clone()):this.rotation=e}get rotationMatrixMat4(){return F.fromQuat(this._rotation)}get worldRotationMatrixMat4(){return F.fromQuat(this.worldRotation)}get rotationMatrixMat3(){return j.fromQuat(this._rotation)}set rotationMatrixMat3(e){this._rotation.fromMat3(e),this.setDirty()}get worldRotationMatrixMat3(){return j.fromQuat(this.worldRotation)}set eulerX(e){this._rotation.identity(),this.rotateX(e)}set eulerY(e){this._rotation.identity(),this.rotateY(e)}set eulerZ(e){this._rotation.identity(),this.rotateZ(e)}set eulerXY(e){this.setEulerValues(e.x,e.y,0)}get euler(){return Ke.getEulerYXZ(j.fromQuat(this._rotation))}set euler(e){this._rotation.identity(),this.rotateEulerValues(e.x,e.y,e.z)}get forward(){const e=this.rotationMatrixMat3.m;return new S(e[6],e[7],e[8])}get worldForward(){const e=this.worldRotationMatrixMat3.m;return new S(e[6],e[7],e[8])}get right(){const e=this.rotationMatrixMat3.m;return new S(e[0],e[1],e[2])}get worldRight(){const e=this.worldRotationMatrixMat3.m;return new S(e[0],e[1],e[2])}get up(){const e=this.rotationMatrixMat3.m;return new S(e[3],e[4],e[5])}get worldUp(){const e=this.worldRotationMatrixMat3.m;return new S(e[3],e[4],e[5])}get direction(){return this.worldForward}static getEulerYXZ(e){const t=e.m;let r,n,i;return t[7]<-1+Ur?(r=Math.PI/2,n=Math.atan2(t[3],t[0]),i=0):t[7]>1-Ur?(r=-Math.PI/2,n=-Math.atan2(t[3],t[0]),i=0):(r=Math.asin(-t[7]),n=Math.atan2(t[6],t[8]),i=Math.atan2(t[1],t[4])),new S(r,n,i)}identity(){this._position.setValues(0,0,0),this._rotation.identity(),this._scale.setValues(1,1,1),this.setDirty()}addChild(e){e.parent=this}removeChild(e){e._parent===this&&(e.parent=null)}getChildrenRecursive(){const e=[...this._children];for(let t=0;t<this._children.length;t++)e.push(...this._children[t].getChildrenRecursive());return e}setDirty(){this._dirty||(this._dirty=!0,this.signalDirtyDown())}clone(){return new Ke().copy(this)}copy(e){return this.name=e.name,this._scale.copy(e._scale),this._rotation.copy(e._rotation),this._position.copy(e._position),this.setDirty(),this}lookAt(e,t,r=S.UP){this.position=e,this.lookAtFromCurrentPos(t,r)}lookAtFromCurrentPos(e,t=S.UP){this._rotation=V.lookAt(this._position,e,t),this.setDirty()}setPositionRotationScale(e,t,r){this._position.copy(e),this._rotation.copy(t),this._scale.copy(r),this.setDirty()}setPositionValues(e,t,r){this._position.setValues(e,t,r),this.setDirty()}setScaleValues(e,t,r){this._scale.setValues(e,t,r),this.setDirty()}translateX(e){this._position.x+=e,this.setDirty()}translateY(e){this._position.y+=e,this.setDirty()}translateZ(e){this._position.z+=e,this.setDirty()}translate(e){this._position.add(e),this.setDirty()}translateValues(e,t,r){this._position.x+=e,this._position.y+=t,this._position.z+=r,this.setDirty()}rotateEulerValues(e,t,r){return this._rotation.rotateEulerValues(e,t,r),this.setDirty(),this._rotation}rotateEuler(e){return this.rotateEulerValues(e.x,e.y,e.z)}setEulerValues(e,t,r){return this._rotation.identity(),this.rotateEulerValues(e,t,r)}rotateAxisAngle(e,t){return this._rotation.rotateAxisAngle(e,t),this.setDirty(),this._rotation}rotateX(e){this._rotation.rotateX(e),this.setDirty()}rotateY(e){this._rotation.rotateY(e),this.setDirty()}rotateZ(e){this._rotation.rotateZ(e),this.setDirty()}setDirection(e,t){const r=S.cross(t,e);r.normalize();const n=S.cross(e,r);n.normalize(),this.rotationMatrixMat3=new j(r.x,r.y,r.z,n.x,n.y,n.z,e.x,e.y,e.z)}updateMatrix(){return!this._dirty&&!this._signalDirtyDown?!1:(this._dirty&&F.fromRotationTranslationScale(this._rotation,this._position,this._scale,this._localMatrix),this._parent?F.multiply(this._parent.worldMatrix,this._localMatrix,this._matrix):this._dirty&&F.copy(this._localMatrix,this._matrix),this._dirty=!1,this._signalDirtyDown=!1,!0)}signalDirtyDown(){if(!this._signalDirtyDown){this._signalDirtyDown=!0;for(const e of this._children)e.signalDirtyDown()}}};a(Ke,"id",0);let Ce=Ke;class Gr extends Yn{constructor(t,r,n=.01,i=10){super(1,n,i);a(this,"bottomLeft",new k);a(this,"topRight",new k);this.bottomLeft.copy(t),this.topRight.copy(r)}setSize(t,r){this.bottomLeft=new k(-t,-r),this.topRight=new k(t,r),this.dirty=!0}updateMatrix(){if(!this.dirty)return;const t=this.jitterOffset,r=this.topRight.x-this.bottomLeft.x,n=this.topRight.y-this.bottomLeft.y,i=t.x*r,s=t.y*n;F.ortho(this.bottomLeft.x+i,this.topRight.x+i,this.bottomLeft.y+s,this.topRight.y+s,this._near,this._far,this.projectionMatrix),this.dirty=!1}}class Kn{constructor(e=null,t=null,r=1){a(this,"origin",new S);a(this,"direction",new S);a(this,"scaleFactor",1);this.scaleFactor=r,e&&this.origin.copy(e),t&&this.direction.copy(t)}setVectors(e,t){this.origin.copy(e),this.direction.copy(t)}}const Is={fov:1,nearPlane:.01,farPlane:10,orthographic:!1};class Cr extends Ce{constructor(t={}){const r={...Is,...t};super();a(this,"projection");a(this,"_viewProjection",new F);a(this,"_viewMatrix",new F);a(this,"viewProjectionOld",new F);a(this,"_changed",!0);a(this,"projectionVersion",-1);a(this,"listenerController",new AbortController);r.orthographic?this.projection=new Gr(new k(-1,-1),new k(1,1),r.nearPlane,r.farPlane):this.projection=new Yn(r.fov,r.nearPlane,r.farPlane)}checkChanged(){const t=this.viewProjection,r=t.m,n=this.viewProjectionOld.m;this._changed=!1;for(let i=0;i<16;i++)if(r[i]!==n[i]){this._changed=!0,this.viewProjectionOld.copy(t);break}}get changed(){return this._changed}get view(){return this}get viewProjection(){return this.updateMatrix(),this._viewProjection}get projectionMatrix(){return this.projection.matrix}get viewMatrix(){return this.updateMatrix(),this._viewMatrix}get matrix(){return this.viewMatrix}get worldRotationMatrix(){return F.invert(this.worldRotationMatrixMat4)}worldToScreenNormalized(t){const r=new Y(t.x,t.y,t.z,1);return r.transform(this.viewProjection),r.x/=r.w,r.y/=r.w,r.x=r.x*.5+.5,r.y=r.y*-.5+.5,r}worldToScreen(t){const r=new Y(t.x,t.y,t.z,1);return r.transform(this.viewProjection),r.x/=r.w,r.y/=r.w,r}screenToWorldPoint(t){const r=2*t.x-1,n=-2*t.y+1;return new S(r,n,1).transform(F.invert(this.viewProjection))}getDepth(t){return new Y(t.x,t.y,t.z,1).transform(this.viewProjection).z}getRay(t,r=new Kn){if(this.projection instanceof Gr){const n=F.invert(this.viewProjection),i=new Y(t.x,t.y,0,1).transform(n);i.x/=i.w,i.y/=i.w,i.z/=i.w;const s=new Y(t.x,t.y,1,1).transform(n);s.x/=s.w,s.y/=s.w,s.z/=s.w,r.origin.setValues(i.x,i.y,i.z),r.direction.setValues(s.x-i.x,s.y-i.y,s.z-i.z).normalize()}else{r.origin.copy(this.worldPosition);const n=new Y(t.x,t.y,1,1).transform(F.invert(this.projectionMatrix));n.z=-1,n.w=0,n.transform(this.worldMatrix),r.direction.setValues(n.x,n.y,n.z).normalize()}return r}destruct(){this.listenerController.abort()}updateMatrix(){const t=super.updateMatrix(),r=this.projection.matrix;return t||this.projection.version!==this.projectionVersion?(this.projectionVersion=this.projection.version,F.invert(this.worldMatrix,this._viewMatrix),F.multiply(r,this._viewMatrix,this._viewProjection),!0):!1}}class Ds{constructor(e){a(this,"_eulerXY",new k);a(this,"_transform",new Ce);a(this,"_mouseInverseValue",1);this._mouseInverseValue=e?-1:1}get eulerXY(){return this._eulerXY}set eulerXY(e){this._eulerXY.copy(e),this._transform.eulerXY=e}get rotation(){return this._transform.rotation}set rotation(e){this._transform.rotation=e;const t=this._transform.euler;this._eulerXY.setValues(t.x,t.y)}getTransform(){return this._transform}update(e){}setEulerValues(e,t){this._eulerXY.setValues(e,t),this._transform.eulerXY=this._eulerXY}setMouseInverted(e){this._mouseInverseValue=e?-1:1}getMouseInverted(){return this._mouseInverseValue<0}}const De=class De extends Ds{constructor(t,r,n=!0){super(r);a(this,"mouseListener");a(this,"renderer");a(this,"mouseDown",!1);a(this,"_eulerSpeed",new k);a(this,"_rotating",!1);a(this,"_rotatingLerp",0);a(this,"_rotatingLerpPrev",0);a(this,"_rotationLimitX",new k(-1.4,1.4));a(this,"_rotationLimitY",new k(-Math.PI,Math.PI));a(this,"_clampEuler");a(this,"easing",1);a(this,"_rotationSpeedMultiplier",3);this.renderer=t,this.mouseListener=t.mouseListener,this._clampEuler=n}set rotationSpeedMultiplier(t){this._rotationSpeedMultiplier=t}get rotationSpeed(){return this._eulerSpeed}set rotationLimit(t){this.rotationLimitX=new k(t.x,t.y),this.rotationLimitY=new k(t.z,t.w)}set rotationLimitX(t){this._rotationLimitX.copy(t)}set rotationLimitY(t){this._rotationLimitY.copy(t)}get rotating(){return this._rotating}get mouseSpeed(){return this.mouseListener.mouseDown?this.mouseListener.normalizedVelocity:new k}update(t){const r=this.mouseDown;this.mouseDown=this.mouseListener.mouseDown;const n=t.projection.FOV,i=.5/Math.tan(n*.5),s=Math.atan2(this.renderer.aspectRatio*.5,i)*2,o=this.mouseSpeed;if(o.length()>De.MOUSE_MOVEMENT_CANCEL_TRIGGER,this.mouseDown&&r){const l=this._rotationSpeedMultiplier;this._eulerSpeed.setValues(l*o.y*n*this._mouseInverseValue,l*o.x*s*this._mouseInverseValue),this._rotating=this._eulerSpeed.length()>0,this._rotatingLerp=this._rotating?.5:0,this._rotatingLerpPrev=this._rotatingLerp,this.rotateBy(this._eulerSpeed),this._eulerSpeed.setValues(Math.min(De.MAX_ROTATE_SPEED,Math.abs(this._eulerSpeed.x))*Math.sign(this._eulerSpeed.x),Math.min(De.MAX_ROTATE_SPEED,Math.abs(this._eulerSpeed.y))*Math.sign(this._eulerSpeed.y))}else this.easing>0?this._rotatingLerp=Et(this._rotatingLerp-this.renderer.time.dt/this.easing):this._rotatingLerp=0,this._rotating=this._rotatingLerp>0,this._rotating&&(this._eulerSpeed.multiplyScalar(1-(this._rotatingLerpPrev-this._rotatingLerp)/this._rotatingLerpPrev),this.rotateBy(this._eulerSpeed)),this._rotatingLerpPrev=this._rotatingLerp}resetSpeed(){this.mouseDown=!1,this._eulerSpeed.setValues(0,0)}rotateBy(t){this._eulerXY.add(t),this._clampEuler&&(this._rotationLimitX.y-this._rotationLimitX.x<Math.PI&&(this._eulerXY.x=Math.max(this._rotationLimitX.x,this._eulerXY.x),this._eulerXY.x=Math.min(this._rotationLimitX.y,this._eulerXY.x)),this._rotationLimitY.y-this._rotationLimitY.x<Math.PI*2&&(this._eulerXY.y=Math.max(this._rotationLimitY.x,this._eulerXY.y),this._eulerXY.y=Math.min(this._rotationLimitY.y,this._eulerXY.y))),this._transform.eulerXY=this._eulerXY}};a(De,"MOUSE_MOVEMENT_CANCEL_TRIGGER",.0025),a(De,"MAX_ROTATE_SPEED",.175);let nr=De;class Fs extends Cr{constructor(t,r){super(r);a(this,"pivot",new Ce);a(this,"_rotationController");a(this,"renderer");a(this,"mouseListener");a(this,"_euler",new S);a(this,"_zoomTargetDistance",0);a(this,"distanceLimit",new k(0,1e20));a(this,"pinching",!1);a(this,"pinchStart0",new k);a(this,"pinchStart1",new k);a(this,"pinch0",new k);a(this,"pinch1",new k);a(this,"zoomTargetDistanceStart",1);this.renderer=t,this.pivot.setPositionValues(0,0,0),this.view.parent=this.pivot,this.distance=r.zPosition,this.mouseListener=t.mouseListener,r.scrollZoom&&this.mouseListener.addWheelEvent(n=>this.scrollZoom(n)),this._rotationController=new nr(this.renderer,r.mouseInverse,r.clampEuler)}get zooming(){return this.distance!=this._zoomTargetDistance}get rotationController(){return this._rotationController}get eulerX(){return this._euler.x}set eulerX(t){this._euler.x=t,this._rotationController.setEulerValues(this._euler.x,this._euler.y),this.pivot.euler=this._euler}get eulerY(){return this._euler.y}set eulerY(t){this._euler.y=t,this._rotationController.setEulerValues(this._euler.x,this._euler.y),this.pivot.euler=this._euler}get euler(){return this._euler.clone()}set rotation(t){this._rotationController.rotation=t,this.pivot.euler=this._euler}get distance(){return this.view.position.z}set distance(t){this._zoomTargetDistance=t,this.view.setPositionValues(0,0,t)}set zoomTargetDistance(t){this._zoomTargetDistance=t}get zoomTargetDistance(){return this._zoomTargetDistance}lookAt(t,r,n=S.UP){this.pivot.lookAt(t,r,n),this.pivot.position=r,this.view.setPositionValues(0,0,S.distance(t,r)),this._zoomTargetDistance=this.distance}scrollZoom(t){let r=this._zoomTargetDistance;t>0?r/=1.05:r*=1.05,r=J(r,this.distanceLimit.x,this.distanceLimit.y),this._zoomTargetDistance=r}setDistanceLimit(t,r){this.distanceLimit.setValues(t,r)}updateZoom(){if(this.distance!=this._zoomTargetDistance){const t=Math.min(this.renderer.time.dt*6,1);let r=ae(this.distance,this._zoomTargetDistance,t);const n=this.distance/this._zoomTargetDistance;n>.999&&n<1.001&&(r=this._zoomTargetDistance),this.view.setPositionValues(0,0,r)}}applyControllerRotation(){const t=this._rotationController.eulerXY;this._euler.x=t.x,this._euler.y=t.y,this.pivot.euler=this._euler}enablePinch(){const t=this.renderer.canvas,r=this.listenerController.signal;t.addEventListener("touchstart",n=>{n.touches.length===2&&(n.preventDefault(),this.pinching=!0,this.pinchStart0.setValues(n.touches[0].pageX,n.touches[0].pageY),this.pinchStart1.setValues(n.touches[1].pageX,n.touches[1].pageY),this.zoomTargetDistanceStart=this._zoomTargetDistance,this.onPinchStart())},{passive:!1,signal:r}),t.addEventListener("touchmove",n=>{if(this.pinching){n.preventDefault(),this.pinch0.setValues(n.touches[0].pageX,n.touches[0].pageY),this.pinch1.setValues(n.touches[1].pageX,n.touches[1].pageY);const i=k.distance(this.pinchStart0,this.pinchStart1),s=k.distance(this.pinch0,this.pinch1);this._zoomTargetDistance=this.zoomTargetDistanceStart*(i/s),this.onPinchMove()}},{passive:!1,signal:r}),t.addEventListener("touchend",()=>{this.pinching=!1},{passive:!1,signal:r})}onPinchStart(){}onPinchMove(){}}const zs={fov:1,nearPlane:.01,farPlane:100,zPosition:1,mouseInverse:!0,clampEuler:!0,scrollZoom:!0};class Os extends Fs{constructor(t,r={}){const n={...zs,...r};super(t,n);a(this,"panning",!1);a(this,"panAnchor",new S);a(this,"panAnchorValid",!1);a(this,"panPlaneY",0);a(this,"panRay",new Kn);a(this,"panStartPosition",new k);a(this,"panThresholdPassed",!1);a(this,"panDeadZone",.002);a(this,"ctrlDown",!1);a(this,"wasRotating",!1);a(this,"pinchPrev0",new k);a(this,"pinchPrev1",new k);const i=this.listenerController.signal;window.addEventListener("keydown",s=>{s.key==="Control"&&(this.ctrlDown=!0)},{signal:i}),window.addEventListener("keyup",s=>{s.key==="Control"&&(this.ctrlDown=!1)},{signal:i}),window.addEventListener("blur",()=>{this.ctrlDown=!1},{signal:i}),this.enablePinch(),this.preventBrowserZoom()}groundPoint(t){const r=this.getRay(t,this.panRay),n=r.direction.y;if(Math.abs(n)<1e-6)return null;const i=(this.panPlaneY-r.origin.y)/n;return i<=0||i>this.distance*50?null:new S(r.origin.x+r.direction.x*i,this.panPlaneY,r.origin.z+r.direction.z*i)}startPan(t){this.panPlaneY=this.pivot.position.y;const r=this.groundPoint(t);this.panAnchorValid=r!==null,r&&this.panAnchor.copy(r)}pan(t){if(!this.panAnchorValid){this.startPan(t);return}const r=this.groundPoint(t);r&&this.pivot.translate(new S(this.panAnchor.x-r.x,0,this.panAnchor.z-r.z))}update(){this.projection.aspectRatio=this.renderer.aspectRatio,this._zoomTargetDistance===0&&(this._zoomTargetDistance=this.distance);const t=this.ctrlDown&&this.mouseListener.mouseDown,r=!this.ctrlDown&&this.mouseListener.mouseDown&&!this.pinching;if(t)this.wasRotating=!0,this._rotationController.update(this);else if(this.wasRotating&&(this._rotationController.resetSpeed(),this.wasRotating=!1),r){const n=this.mouseListener.screenPosition;this.panning?this.panThresholdPassed?this.pan(n):k.distance(n,this.panStartPosition)>this.panDeadZone&&(this.panThresholdPassed=!0,this.startPan(n)):(this.panStartPosition=n.clone(),this.panThresholdPassed=!1,this.panning=!0)}else this.panning=!1,this.panThresholdPassed=!1,this.pinching||this._rotationController.update(this);this.updateZoom(),this.applyControllerRotation(),this.checkChanged()}enablePinch(){this.renderer.canvas.style.touchAction="none",super.enablePinch()}onPinchStart(){this.pinchPrev0.copy(this.pinchStart0),this.pinchPrev1.copy(this.pinchStart1)}onPinchMove(){const t=Math.atan2(this.pinchPrev1.y-this.pinchPrev0.y,this.pinchPrev1.x-this.pinchPrev0.x);let n=Math.atan2(this.pinch1.y-this.pinch0.y,this.pinch1.x-this.pinch0.x)-t;n>Math.PI?n-=Math.PI*2:n<-Math.PI&&(n+=Math.PI*2),this._rotationController.rotateBy(new k(0,n)),this.pinchPrev0.copy(this.pinch0),this.pinchPrev1.copy(this.pinch1)}preventBrowserZoom(){const t=this.renderer.canvas;t.style.touchAction="none",t.addEventListener("wheel",r=>{r.ctrlKey&&r.preventDefault()},{passive:!1,signal:this.listenerController.signal})}}function Ns(){return typeof window<"u"&&("ontouchstart"in window||navigator.maxTouchPoints>1||navigator.msMaxTouchPoints>1)}function Se(){return Ns()||/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}const it={south:52.36627,west:4.87739,north:52.38255,east:4.92361},Wr=111320;class Vs{constructor(){a(this,"latMid",0);a(this,"lngMid",0);a(this,"cosLat",1);a(this,"scale",1);a(this,"metersPerUnit",1);a(this,"mapAspectRatio",1);a(this,"bounds",{south:0,west:0,north:0,east:0})}setBounds(e){this.bounds=e,this.latMid=(e.south+e.north)*.5,this.lngMid=(e.west+e.east)*.5,this.cosLat=Math.cos(this.latMid*Math.PI/180);const t=Math.max(e.north-e.south,1e-9),r=Math.max(e.east-e.west,1e-9);this.scale=2/t,this.metersPerUnit=Wr*t/2,this.mapAspectRatio=r*this.cosLat/t}get metersToNorm(){return this.scale/Wr}project(e,t){const r=(e-this.lngMid)*this.cosLat*this.scale,n=(t-this.latMid)*this.scale;return[r,n]}worldToLatLng(e,t){const r=e/(this.cosLat*this.scale)+this.lngMid;return{lat:-t/this.scale+this.latMid,lng:r}}latLngToWorld(e,t){const r=(t-this.lngMid)*this.cosLat*this.scale,n=-(e-this.latMid)*this.scale;return{x:r,z:n}}latLngToWorldInto(e,t,r){r.x=(t-this.lngMid)*this.cosLat*this.scale,r.z=-(e-this.latMid)*this.scale}tileSizeMeters(e){const t=Math.pow(2,e),r=this.latMid*Math.PI/180;return 40075e3*Math.cos(r)/t}}class $n extends ge{constructor(e,t=1,r=1,n={}){super(e,t,r,1,n)}setData(e,t,r,n=this.options.format){const i=this.options.useMips&&ge.canGenerateMipmaps(this.renderer.device,n),s=i?GPUTextureUsage.RENDER_ATTACHMENT:0;(t!=this.width||r!=this.height||n!=this.format||(this.gpuTexture.usage&s)!=s)&&(this.options.format=n,this.options.usage|=s,this.createTexture(t,r));const o=this.getFormatBlockInfo(n);this.renderer.device.queue.writeTexture({texture:this.gpuTexture},e,{bytesPerRow:Math.ceil(t/o.blockWidth)*o.bytesPerBlock},{width:t,height:r}),i?this.renderer.generateMipmaps(this):this.options.useMips&&_.warn("Texture2D.setData: the mips of",n,"can not be generated, only mip 0 is set")}getFormatBlockInfo(e){const t=e.match(/^astc-(\d+)x\d+/);if(t)return{bytesPerBlock:16,blockWidth:parseInt(t[1])};if(/^(bc|etc2|eac)/.test(e))return{bytesPerBlock:/^(bc[14]-|etc2-rgb8|eac-r11)/.test(e)?8:16,blockWidth:4};const r={stencil8:1,depth16unorm:2,depth24plus:4,depth32float:4,"depth24plus-stencil8":4,"depth32float-stencil8":8};if(e in r)return{bytesPerBlock:r[e],blockWidth:1};if(/^(rgb9e5|rgb10a2|rg11b10)/.test(e))return{bytesPerBlock:4,blockWidth:1};const n=e.match(/^(r|rg|rgba|bgra)(\d+)/);return n?{bytesPerBlock:{r:1,rg:2,rgba:4,bgra:4}[n[1]]*(parseInt(n[2])/8),blockWidth:1}:(console.warn("Unsupported format",e),{bytesPerBlock:4,blockWidth:1})}getData(){return Oi(this.renderer,this.gpuTexture)}setImage(e,t=!1){const{x:r,y:n}=zi(e);if(r==0||n==0)return;const i=GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT;(!this.gpuTexture||this.gpuTexture.width!=r||this.gpuTexture.height!=n||(this.gpuTexture.usage&i)!=i)&&(this.options.usage|=i,this.createTexture(r,n)),this.renderer.device.queue.copyExternalImageToTexture({source:e,flipY:t},{texture:this.gpuTexture},[r,n]),this.options.useMips&&this.renderer.generateMipmaps(this)}}const Zn=`//The R2 sequence, a 2d low discrepancy sequence: x(i) = fract(x(0) + i * alpha), alpha = (1 / g, 1 / g^2), g the plastic\r
//number (the real root of x^3 = x + 1). Martin Roberts 2018, "The Unreasonable Effectiveness of Quasirandom Sequences".\r
//Progressive: any prefix of the sequence covers the square evenly. It is a lattice though, the points lie on a few families\r
//of parallel lines, which shows as bands after a polar mapping (see blueNoiseHemisphere)\r
\r
//alpha in 0.32 fixed point: round(alpha * 2^32)\r
const R2_FIXED = vec2<u32>(3242174889u, 2447445414u);\r
\r
//Why integers: i * R2_FIXED wraps around at 2^32, which is exactly the fract, so every index gets the full 32 bits of\r
//fraction, up to i = 2^32 (the period). With floats, i * alpha has to fit the integer part and the fraction in the 24 bits\r
//of an f32 mantissa: at i = 2^20 (a million samples: almost 5 hours of frames at 60 fps) only 4 bits of fraction are left and\r
//the points snap to a 16 x 16 grid, from i = 2^24 on the fraction is gone and every index returns the same point.\r
//It is also cheaper: no fract.\r
//The top 24 bits only, as an f32 has 24 bits of mantissa: f32 of the full u32 rounds values close to 2^32 up to 2^32,\r
//which would return 1, outside of [0, 1)\r
fn getR2(i: u32) -> vec2<f32> {\r
	return vec2<f32>((i * R2_FIXED) >> vec2(8u)) * (1. / 16777216.);\r
}\r
\r
//the float version, for comparison: loses its precision as i grows, see above\r
const R2_ALPHA = vec2<f32>(0.7548776662466927, 0.5698402909980532);\r
fn getR2Float(i: f32) -> vec2<f32> {\r
	return fract(i * R2_ALPHA);\r
}\r
`,pt=`//the gBuffer of MapWorld (see MapGBuffer.ts): 2 targets of 12 bytes per pixel together, and the hardware depth (4 bytes)\r
//for the camera distance. A reader loads the targets into a vec3<u32> g (see MapGBuffer.readIncludes):\r
// x (target 0 .x): the lightmap surface id (see cityLightmapSurface.wgsl), SURFACE_NONE (0) on the sky\r
// y (target 0 .y): the normal facing the camera, octahedral 2 x 10 bits | the low 4 bits of the material << 20 (5 bits,\r
//    its albedo is in the palette of MapGBuffer) | selected << 24 | the high bits of the wall atlas position: u << 25,\r
//    v << 28 (3 bits each) | the high bit of the material << 31\r
// z (target 1): the low 16 bits of the wall atlas position: u | v << 16\r
//The surface position is only stored on a wall: on the ground and a roof it is world xz, which the distance gives (see\r
//getGBufferSurface). The wall atlas position is in steps of atlasStep (see MapGBuffer.atlasStep), 19 bits each.\r
//The depth is reversed and depth32float (see MapGBuffer.ts), cleared to 0, the sky: getGBufferDistance makes that a\r
//distance of 0\r
\r
const GBUFFER_ATLAS_MAX = 0x7FFFFu;\r
\r
fn octWrap(v: vec2<f32>) -> vec2<f32> {\r
	return (1. - abs(v.yx)) * select(vec2(-1.), vec2(1.), v >= vec2(0.));\r
}\r
\r
//n: normalized\r
fn packGBufferNormal(n: vec3<f32>) -> u32 {\r
	var e = n.xz / (abs(n.x) + abs(n.y) + abs(n.z));\r
	if(n.y < 0.){\r
		e = octWrap(e);\r
	}\r
	let q = vec2<u32>(round(clamp(e * .5 + .5, vec2(0.), vec2(1.)) * 1023.));\r
	return q.x | (q.y << 10u);\r
}\r
\r
fn unpackGBufferNormal(bits: u32) -> vec3<f32> {\r
	let e = vec2<f32>(vec2(bits, bits >> 10u) & vec2(1023u)) / 1023. * 2. - 1.;\r
	var n = vec3(e.x, 1. - abs(e.x) - abs(e.y), e.y);\r
	if(n.y < 0.){\r
		let w = octWrap(n.xz);\r
		n = vec3(w.x, n.y, w.y);\r
	}\r
	return normalize(n);\r
}\r
\r
//the 3 words: target 0 is xy, target 1 is z. atlas: the wall atlas position in atlasSteps, 0 off a wall\r
fn packGBuffer(surfaceId: u32, n: vec3<f32>, material: u32, selected: bool, atlas: vec2<u32>) -> vec3<u32> {\r
	let a = min(atlas, vec2(GBUFFER_ATLAS_MAX));\r
	let y = packGBufferNormal(n) | ((material & 15u) << 20u) | (select(0u, 1u, selected) << 24u) |\r
		((a.x >> 16u) << 25u) | ((a.y >> 16u) << 28u) | (((material >> 4u) & 1u) << 31u);\r
	return vec3(surfaceId, y, (a.x & 0xFFFFu) | ((a.y & 0xFFFFu) << 16u));\r
}\r
\r
//the camera distance of a pixel from its reversed depth, 0 on the sky. uv: 0 to 1, y down like the texture coordinates.\r
//inverseProjection: of the (jittered) camera the gBuffer was drawn with, not reversed. depthParams: see\r
//MapGBuffer.depthParams, 1 / the view depth is depth * x + y: no cancellation, unlike the inverse projection of the depth\r
fn getGBufferDistance(depth: f32, uv: vec2<f32>, inverseProjection: mat4x4<f32>, depthParams: vec2<f32>) -> f32 {\r
	if(depth <= 0.){\r
		return 0.;\r
	}\r
	let viewDepth = 1. / (depth * depthParams.x + depthParams.y);\r
	//the eye ray of the pixel, at view depth 1\r
	let ray = inverseProjection * vec4(uv.x * 2. - 1., 1. - uv.y * 2., 1., 1.);\r
	return viewDepth * length(ray.xyz) / abs(ray.z);\r
}\r
\r
fn getGBufferNormal(g: vec3<u32>) -> vec3<f32> {\r
	return unpackGBufferNormal(g.y);\r
}\r
\r
fn getGBufferMaterial(g: vec3<u32>) -> u32 {\r
	return ((g.y >> 20u) & 15u) | ((g.y >> 27u) & 16u);\r
}\r
\r
fn isGBufferSelected(g: vec3<u32>) -> bool {\r
	return ((g.y >> 24u) & 1u) != 0u;\r
}\r
\r
//the wall atlas position in atlasSteps\r
fn getGBufferAtlas(g: vec3<u32>) -> vec2<u32> {\r
	return vec2(g.z & 0xFFFFu, g.z >> 16u) | (vec2((g.y >> 25u) & 7u, (g.y >> 28u) & 7u) << vec2(16u));\r
}\r
`,_t=`//the charts of the city lightmap, see cityLayout.ts. No uniforms, so the gBuffer pass can include it too\r
\r
//no surface: the sky, or a pixel nothing was drawn in\r
const SURFACE_NONE = 0u;\r
//the ground: world xz\r
const SURFACE_GROUND = 1u;\r
//the bit of the roofs of a height (world xz), with the height bucket in the bits below it. See getRoofChart in\r
//cityLayout.ts. Not the chart of the ground: a texel on the outline of a roof would average the open roof and the\r
//shaded ground next to its walls, and light the ground there\r
const SURFACE_ROOF = 0x20000000u;\r
//the bit of the wall atlas of a map tile, with the tile coordinates in the bits below it. See getWallSurfaceId in cityLayout.ts\r
const SURFACE_WALL = 0x40000000u;\r
\r
//a point on a chart: the chart and where the point is on it, in world units\r
struct Surface {\r
	id : u32,\r
	position : vec2<f32>,\r
}\r
\r
fn getGroundSurface(p: vec3<f32>) -> Surface {\r
	return Surface(SURFACE_GROUND, p.xz);\r
}\r
\r
//chart: the height bucket of the roof, see getRoofChart in cityLayout.ts\r
fn getRoofSurface(chart: u32, p: vec3<f32>) -> Surface {\r
	return Surface(SURFACE_ROOF | (chart & 0x1FFFFFFFu), p.xz);\r
}\r
\r
//tile: the map tile coordinates, as the floats of the lightmap attribute\r
fn getWallSurfaceId(tile: vec2<f32>) -> u32 {\r
	let t = vec2<u32>(max(tile, vec2(0.)) + .5) & vec2(0x7FFFu);\r
	return SURFACE_WALL | (t.x << 15u) | t.y;\r
}\r
\r
//the surface of a point of a building, from the interpolated lightmap attribute of its vertices: the atlas position (xy)\r
//and the map tile (zw) on a wall, the roof chart (x) and zw -1 on a roof. The 3 vertices of a roof triangle have the\r
//same chart, so the rounding undoes the error of the interpolation\r
fn getAttributeSurface(lightmap: vec4<f32>, p: vec3<f32>) -> Surface {\r
	if(lightmap.z < 0.){\r
		return getRoofSurface(u32(max(round(lightmap.x), 0.)), p);\r
	}\r
	return Surface(getWallSurfaceId(lightmap.zw), lightmap.xy);\r
}\r
\r
//the surface of a pixel of the gBuffer (see mapGBufferPacking.wgsl, which this needs then): the wall atlas position\r
//stored on a wall, else world xz. world: the position the camera distance of the pixel gives. atlasStep: see\r
//MapGBuffer.atlasStep\r
fn getGBufferSurface(g: vec3<u32>, world: vec3<f32>, atlasStep: f32) -> Surface {\r
	if((g.x & SURFACE_WALL) != 0u){\r
		return Surface(g.x, vec2<f32>(getGBufferAtlas(g)) * atlasStep);\r
	}\r
	return Surface(g.x, world.xz);\r
}\r
`,ir=`// The smooth normal of the ground in the .w of a vertex of the terrain (encodeTerrainNormal in terrainGrid.ts): x and z\r
// in 11 bits each, w = qx * 2048 + qz, y from them (the ground faces up). Negative (NO_NORMAL, NO_FEATURE_ID): up, the\r
// flat ground quad, the flat layers and the water.\r
fn decodeTerrainNormal(w : f32) -> vec3<f32> {\r
  if (w < 0.0) {\r
    return vec3<f32>(0.0, 1.0, 0.0);\r
  }\r
  let q = u32(w + 0.5);\r
  let xz = vec2<f32>(f32(q >> 11u), f32(q & 2047u)) / 2047.0 * 2.0 - 1.0;\r
  return vec3<f32>(xz.x, sqrt(max(1.0 - dot(xz, xz), 0.0)), xz.y);\r
}\r
`,Us=`// The gBuffer of MapWorld, see MapGBuffer.ts and the packing in mapGBufferPacking.wgsl. The targets are cleared to 0\r
// and the depth to 1, which is the sky. The camera distance is the depth.\r
// WALLS: the buildings and the trees, with the lightmap attribute (see city/cityLayout.ts) and in .w the feature id for\r
// the selection highlight, or on a tree its palette entry (see map/worldTrees.ts), with the flat normal of the triangle.\r
// Without it the ground layers and the ground quad, on the ground chart of the lightmap, with the smooth normal of the\r
// terrain in .w (see terrainNormal.wgsl).\r
\r
struct VertexInput {\r
#ifdef WALLS\r
  // unorm16: position * positionScale + positionOffset, see quantizeVertices in worldGeometryCore.ts\r
  @location(0) position : vec4<f32> /* unorm16 */,\r
  // a wall: its atlas position (u, v); a roof: (roof chart, -1). See buildBuildings in worldGeometryCore.ts\r
  @location(1) lightmap : vec2<f32>,\r
#else\r
  @location(0) position : vec4<f32>,\r
#endif\r
};\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  // the position relative to the camera: the difference of 2 close f32 positions is exact, the world position far from\r
  // the projection center is not (the atlas position along a wall below)\r
  @location(0) relative : vec3<f32>,\r
#ifdef WALLS\r
  // flat: the attribute of the first vertex of the triangle, on a wall the start of it (its bottom corner, in corner),\r
  // see buildBuildings in worldGeometryCore.ts\r
  @location(1) @interpolate(flat) lightmap : vec2<f32>,\r
  @location(2) @interpolate(flat) selected : u32,\r
  @location(3) @interpolate(flat) material : u32,\r
  // relative to the camera, like relative\r
  @location(4) @interpolate(flat) corner : vec3<f32>,\r
#else\r
  // the smooth normal of the ground, see terrainNormal.wgsl\r
  @location(1) normal : vec3<f32>,\r
#endif\r
};\r
\r
struct Uniforms {\r
  viewProjection : mat4x4<f32>,\r
  cameraPosition : vec3<f32>,\r
  // the index of the albedo in the palette of MapGBuffer\r
  material : u32,\r
  // the step of the wall atlas positions, see MapGBuffer.atlasStep\r
  atlasStep : f32,\r
  // the global id of the selected building (slot * 65536 + feature id), -1 for none. tileID: the slot of the mesh\r
  selectedID : i32,\r
  tileID : u32,\r
  // the map tile of the mesh (x, y), whose wall atlas the walls are on, see getWallSurfaceId\r
  wallTile : vec2<f32>,\r
  // the palette index of the first tree color (the trunk), see MapGeometry\r
  treeMaterial : u32,\r
  // WALLS: the decoding of the unorm16 vertices of the mesh, see quantizeVertices in worldGeometryCore.ts\r
  positionScale : vec4<f32>,\r
  positionOffset : vec4<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
\r
// the .w of a tree vertex with palette entry k is TREE_MATERIAL_BASE_ID - k, see map/worldTrees.ts\r
const TREE_MATERIAL_BASE_ID = -2.0;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
#ifdef WALLS\r
  let q = input.position * uniforms.positionScale;\r
  // the offset minus the camera first: the 2 are close, so that is exact\r
  output.relative = q.xyz + (uniforms.positionOffset.xyz - uniforms.cameraPosition);\r
  output.position = uniforms.viewProjection * vec4<f32>(q.xyz + uniforms.positionOffset.xyz, 1.0);\r
  output.lightmap = input.lightmap;\r
  output.corner = output.relative;\r
  // like shading.wgsl with FEATURE_IDS\r
  let featureId = round(q.w + uniforms.positionOffset.w);\r
  output.selected = 0u;\r
  if (featureId >= 0.0 && uniforms.selectedID >= 0) {\r
    let globalId = uniforms.tileID * 65536u + u32(featureId + 0.5);\r
    output.selected = select(0u, 1u, globalId == u32(uniforms.selectedID));\r
  }\r
  output.material = uniforms.material;\r
  if (featureId < TREE_MATERIAL_BASE_ID + 0.5) {\r
    output.material = uniforms.treeMaterial + u32(TREE_MATERIAL_BASE_ID - featureId + 0.5);\r
  }\r
#else\r
  output.position = uniforms.viewProjection * vec4<f32>(input.position.xyz, 1.0);\r
  output.relative = input.position.xyz - uniforms.cameraPosition;\r
  output.normal = decodeTerrainNormal(input.position.w);\r
#endif\r
  return output;\r
}\r
\r
struct FragmentOutput {\r
  @location(0) surface : vec2<u32>,\r
  @location(1) atlas : u32,\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> FragmentOutput {\r
#ifdef WALLS\r
  // the flat normal facing the camera\r
  var n = normalize(cross(dpdx(input.relative), dpdy(input.relative)));\r
  if (dot(n, input.relative) > 0.0) {\r
    n = -n;\r
  }\r
#else\r
  let n = normalize(input.normal);\r
#endif\r
  var id = SURFACE_GROUND;\r
  var atlas = vec2<u32>(0u);\r
  var selected = false;\r
  var material = uniforms.material;\r
#ifdef WALLS\r
  // on a wall the atlas position of its start corner plus the distance along the wall and the height over the corner\r
  var lightmap = vec4<f32>(input.lightmap.x, 0.0, -1.0, -1.0);\r
  if (input.lightmap.y >= 0.0) {\r
    lightmap = vec4<f32>(input.lightmap + vec2<f32>(length(input.relative.xz - input.corner.xz), input.relative.y - input.corner.y), uniforms.wallTile);\r
  }\r
  let surface = getAttributeSurface(lightmap, input.relative + uniforms.cameraPosition);\r
  id = surface.id;\r
  // a roof is on world xz, like the ground: only a wall stores its position\r
  if ((id & SURFACE_WALL) != 0u) {\r
    atlas = vec2<u32>(clamp(round(surface.position / uniforms.atlasStep), vec2(0.), vec2(f32(GBUFFER_ATLAS_MAX))));\r
  }\r
  selected = input.selected != 0u;\r
  material = input.material;\r
#endif\r
  let g = packGBuffer(id, n, material, selected, atlas);\r
  return FragmentOutput(g.xy, g.z);\r
}\r
`,re=class re{constructor(e,t,r=1/0){a(this,"order",[]);a(this,"depth",0);a(this,"nodeCount",0);a(this,"nodeFloats");a(this,"nodeUints");a(this,"parents");a(this,"leafParents");a(this,"boxMin");a(this,"boxMax");a(this,"maxDepth");a(this,"boxes");a(this,"sorted");a(this,"rightArea");a(this,"isLeft");a(this,"partitioned");this.maxDepth=r,this.boxMin=e,this.boxMax=t;const n=e.length,i=new ArrayBuffer(Math.max(n-1,1)*re.bytesPerNode);if(this.nodeFloats=new Float32Array(i),this.nodeUints=new Uint32Array(i),this.parents=new Int32Array(Math.max(n-1,1)).fill(-1),this.leafParents=new Int32Array(n),n==1)this.nodeCount=1,this.nodeUints[3]=this.nodeUints[7]=re.leafFlag,this.order.push(0),this.depth=1,this.refit(0);else if(n>1){this.boxes=new Float64Array(n*6);const s=new Float64Array(n*3);for(let o=0;o<n;o++){const l=e[o],h=t[o];this.boxes.set([l.x,l.y,l.z,h.x,h.y,h.z],o*6),s.set([(l.x+h.x)*.5,(l.y+h.y)*.5,(l.z+h.z)*.5],o*3)}this.sorted=[0,1,2].map(o=>{const l=new Uint32Array(n);for(let h=0;h<n;h++)l[h]=h;return l.sort((h,u)=>s[h*3+o]-s[u*3+o]||h-u)}),this.rightArea=new Float64Array(n),this.isLeft=new Uint8Array(n),this.partitioned=new Uint32Array(n),this.split(0,n,1)}}setNodeData(e){new Uint32Array(e).set(this.nodeUints.subarray(0,this.nodeCount*re.wordsPerNode))}refit(e){const t=this.nodeFloats,r=this.nodeUints,n=this.boxMin[e],i=this.boxMax[e];let s=n.x,o=n.y,l=n.z,h=i.x,u=i.y,d=i.z,f=(e|re.leafFlag)>>>0,m=this.leafParents[e];for(;m>=0;){const p=m*re.wordsPerNode;for(let x=0;x<2;x++){if(r[p+3+x*4]!=f)continue;const b=p+x*8;t[b]=s,t[b+1]=o,t[b+2]=l,t[b+4]=h,t[b+5]=u,t[b+6]=d}s=Math.min(t[p],t[p+8]),o=Math.min(t[p+1],t[p+9]),l=Math.min(t[p+2],t[p+10]),h=Math.max(t[p+4],t[p+12]),u=Math.max(t[p+5],t[p+13]),d=Math.max(t[p+6],t[p+14]),f=m,m=this.parents[m]}}writeBounds(e,t,r,n){const i=this.boxes;let s=1/0,o=1/0,l=1/0,h=-1/0,u=-1/0,d=-1/0;for(let m=e;m<e+t;m++){const p=r[m]*6;s=Math.min(s,i[p]),o=Math.min(o,i[p+1]),l=Math.min(l,i[p+2]),h=Math.max(h,i[p+3]),u=Math.max(u,i[p+4]),d=Math.max(d,i[p+5])}const f=this.nodeFloats;f[n]=s,f[n+1]=o,f[n+2]=l,f[n+4]=h,f[n+5]=u,f[n+6]=d}getChild(e,t,r,n){if(t==1){const s=this.sorted[0][e];return this.depth=Math.max(this.depth,r),this.order.push(s),this.leafParents[s]=n,(s|re.leafFlag)>>>0}const i=this.split(e,t,r);return this.parents[i]=n,i}split(e,t,r){const n=this.nodeCount++,i=this.boxes,s=this.rightArea;let o=1/0,l=0,h=1,u=Math.pow(2,this.maxDepth-r-1);2*u<t&&(u=1/0);for(let b=0;b<3;b++){const g=this.sorted[b];let y=1/0,v=1/0,w=1/0,M=-1/0,C=-1/0,E=-1/0;for(let A=t-1;A>0;A--){const P=g[e+A]*6;y=Math.min(y,i[P]),v=Math.min(v,i[P+1]),w=Math.min(w,i[P+2]),M=Math.max(M,i[P+3]),C=Math.max(C,i[P+4]),E=Math.max(E,i[P+5]);const T=M-y,L=C-v,D=E-w;s[A]=T*L+L*D+D*T}y=v=w=1/0,M=C=E=-1/0;for(let A=1;A<t;A++){const P=g[e+A-1]*6;y=Math.min(y,i[P]),v=Math.min(v,i[P+1]),w=Math.min(w,i[P+2]),M=Math.max(M,i[P+3]),C=Math.max(C,i[P+4]),E=Math.max(E,i[P+5]);const T=M-y,L=C-v,D=E-w,B=(T*L+L*D+D*T)*A+s[A]*(t-A);B<o&&A<=u&&t-A<=u&&(o=B,l=b,h=A)}}const d=this.sorted[l],f=this.isLeft,m=e+t;for(let b=e;b<m;b++)f[d[b]]=b<e+h?1:0;const p=this.partitioned;for(let b=0;b<3;b++){if(b==l)continue;const g=this.sorted[b];let y=e,v=e+h;for(let w=e;w<m;w++){const M=g[w];f[M]?p[y++]=M:p[v++]=M}g.set(p.subarray(e,m),e)}const x=n*re.wordsPerNode;return this.writeBounds(e,h,d,x),this.writeBounds(e+h,t-h,d,x+8),this.nodeUints[x+3]=this.getChild(e,h,r+1,n),this.nodeUints[x+7]=this.getChild(e+h,t-h,r+1,n),n}};a(re,"bytesPerNode",64),a(re,"leafFlag",2147483648),a(re,"wordsPerNode",16);let ht=re;const Qn=.01,Gs=524287,ct=2147483648,Ws=2147483648,js=10,$t=32,Ft=class Ft{constructor(e){a(this,"renderer");a(this,"target");a(this,"materials",[]);a(this,"materialIndices",new Map);a(this,"paletteCount",0);a(this,"clearColor",new N(0,0,0,0));a(this,"reverseDepth",new F(1,0,0,0,0,1,0,0,0,0,-1,0,0,0,1,1));a(this,"viewProjection",new F);a(this,"paletteBuffer");a(this,"palette",new Float32Array($t*4));this.renderer=e,this.target=new H(e,1,1,{formats:["rg32uint","r32uint"],depth:!0,depthFormat:"depth32float",sampleCount:1,scaleToCanvas:!0,toScreen:!1}),this.paletteBuffer=e.createBuffer(this.palette.byteLength,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,!1,"mapGBufferPalette")}get view(){return this.target.views[0]}get atlasView(){return this.target.views[1]}get depthView(){return this.target.depthStencilView}static depthParams(e,t=new k){const r=e.projection.near,n=e.projection.far;return t.setValues((n-r)/(r*n),1/n)}static atlasStep(e){return Qn*e}createMaterial(e,t,r="back"){const n=this.addPaletteColors([[e.x,e.y,e.z]]),i=new G(this.renderer,"mapGBuffer",Us,{includes:[_t,pt,ir],defines:t?{WALLS:!0}:{},asyncPipeline:!0});return i.cullMode=r,i.depthCompare="greater",i.setFloat("material",n),i.setFloat("selectedID",-1),i.setFloat("tileID",0),i.setVector2("wallTile",new k(0,0)),i.setFloat("treeMaterial",0),this.materials.push(i),this.materialIndices.set(i,n),i}addPaletteColors(e){const t=this.paletteCount;if(t+e.length>$t)throw new Error(`MapGBuffer: more than ${$t} materials`);return e.forEach((r,n)=>this.palette.set([r[0],r[1],r[2],1],(t+n)*4)),this.paletteCount+=e.length,this.renderer.writeBuffer(this.paletteBuffer,this.palette),t}setPaletteColor(e,t){this.palette.set([t[0],t[1],t[2],1],e*4),this.renderer.writeBuffer(this.paletteBuffer,this.palette)}materialIndex(e){return this.materialIndices.get(e)??-1}render(e,t,r){const n=Ft.atlasStep(t);F.multiply(this.reverseDepth,e.viewProjection,this.viewProjection);for(const i of this.materials)i.setMatrix("viewProjection",this.viewProjection),i.setVector3("cameraPosition",e.worldPosition),i.setFloat("atlasStep",n);this.renderer.startRenderPass(this.target,{clearColor:this.clearColor,colorClear:!0,depthClear:!0,depthClearValue:0},0,"mapGBuffer"),r()}destruct(){this.target.destruct(),this.paletteBuffer.destroy()}};a(Ft,"readIncludes",[pt]);let oe=Ft;const Hs=`//temporal anti aliasing of the map, after irradianceCache/taa/taa.wgsl. The camera is jittered with the halton sequence\r
//and the map is static, so the history is reprojected with the camera alone: the jittered matrices reconstruct the\r
//position of the depth sample exactly, the ones without jitter give the camera motion. The depth is the camera\r
//distance from the depth of the gBuffer of MapWorld (see getGBufferDistance in mapGBufferPacking.wgsl), 0 on the sky.\r
//moving: the history is sampled with catmull-rom and clipped to the variance of the 3x3 neighbourhood in YCoCg against\r
//ghosting, then blended by feedback. Static (staticWeight > 0): the history is a running average of the jittered\r
//frames, no clipping, which converges to a supersampled image. In between (CAMERA_STILL): the image changes under a\r
//camera that doesn't move (the lightmap converges after a drag), blended and clipped like motion but without the\r
//reprojection, which was .13 of the .31 ms of this pass at 4K\r
\r
struct Uniforms {\r
	inverseProjection : mat4x4<f32>,\r
	inverseView : mat4x4<f32>,\r
	cameraPosition : vec3<f32>,\r
	viewProjectionNoJitter : mat4x4<f32>,\r
	viewProjectionOldNoJitter : mat4x4<f32>,\r
	resolution : vec2<f32>,\r
	historyValid : u32,\r
	staticWeight : f32,\r
	feedback : f32,\r
	clipGamma : f32,\r
	//see getGBufferDistance\r
	depthParams : vec2<f32>,\r
}\r
\r
//the camera is where it was the frame before (both matrices without jitter are the same): nothing reprojects. A\r
//constant, not a uniform: as a branch it made the pass of a moving camera 5% slower\r
override CAMERA_STILL : bool = false;\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var depthTexture : texture_depth_2d;\r
@group(0) @binding(2) var source : texture_2d<f32>;\r
@group(0) @binding(3) var history : texture_2d<f32>;\r
@group(0) @binding(4) var linearSampler : sampler;\r
\r
struct VertexInput {\r
	@location(0) position : vec3<f32>,\r
	@location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
	@builtin(position) position : vec4<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
	var output : VertexOutput;\r
	output.position = vec4(input.position, 1.);\r
	return output;\r
}\r
\r
//the uv of a world position, 0 to 1, y down\r
fn projectToUV(viewProjection : mat4x4<f32>, p : vec3<f32>) -> vec2<f32> {\r
	let clip = viewProjection * vec4(p, 1.);\r
	let ndc = clip.xy / clip.w;\r
	return vec2(ndc.x * .5 + .5, .5 - ndc.y * .5);\r
}\r
\r
//the world ray of a uv, like getRay in reprojectedSSAO.wgsl: the camera distance of the gBuffer is along it\r
fn getRay(uv : vec2<f32>) -> vec3<f32> {\r
	let ndc = uv * 2. - 1.;\r
	var dirEye = uniforms.inverseProjection * vec4(ndc.x, -ndc.y, 1., 1.);\r
	dirEye.w = 0.;\r
	return normalize((uniforms.inverseView * dirEye).xyz);\r
}\r
\r
fn rgbToYCoCg(c : vec3<f32>) -> vec3<f32> {\r
	return vec3(dot(c, vec3(.25, .5, .25)), dot(c, vec3(.5, 0., -.5)), dot(c, vec3(-.25, .5, -.25)));\r
}\r
\r
fn yCoCgToRgb(c : vec3<f32>) -> vec3<f32> {\r
	return vec3(c.x + c.y - c.z, c.x + c.z, c.x - c.y - c.z);\r
}\r
\r
//catmull-rom in 5 bilinear taps (the corners are dropped), https://gist.github.com/TheRealMJP/c83b8c0f46b63f3a88a5986f4fa982b5\r
fn sampleHistory(uv : vec2<f32>) -> vec3<f32> {\r
	let samplePosition = uv * uniforms.resolution;\r
	let texPos1 = floor(samplePosition - .5) + .5;\r
	let f = samplePosition - texPos1;\r
	let w0 = f * (-.5 + f * (1. - .5 * f));\r
	let w1 = 1. + f * f * (-2.5 + 1.5 * f);\r
	let w2 = f * (.5 + f * (2. - 1.5 * f));\r
	let w3 = f * f * (-.5 + .5 * f);\r
	let w12 = w1 + w2;\r
	let offset12 = w2 / w12;\r
	let texPos0 = (texPos1 - 1.) / uniforms.resolution;\r
	let texPos3 = (texPos1 + 2.) / uniforms.resolution;\r
	let texPos12 = (texPos1 + offset12) / uniforms.resolution;\r
	var result = vec3(0.);\r
	result += textureSampleLevel(history, linearSampler, vec2(texPos12.x, texPos0.y), 0.).rgb * w12.x * w0.y;\r
	result += textureSampleLevel(history, linearSampler, vec2(texPos0.x, texPos12.y), 0.).rgb * w0.x * w12.y;\r
	result += textureSampleLevel(history, linearSampler, vec2(texPos12.x, texPos12.y), 0.).rgb * w12.x * w12.y;\r
	result += textureSampleLevel(history, linearSampler, vec2(texPos3.x, texPos12.y), 0.).rgb * w3.x * w12.y;\r
	result += textureSampleLevel(history, linearSampler, vec2(texPos12.x, texPos3.y), 0.).rgb * w12.x * w3.y;\r
	let weightSum = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;\r
	return max(result / weightSum, vec3(0.));\r
}\r
\r
fn luma(c : vec3<f32>) -> f32 {\r
	return dot(c, vec3(.2126, .7152, .0722));\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
	let coord = vec2<i32>(input.position.xy);\r
	let current = textureLoad(source, coord, 0).rgb;\r
	if(uniforms.historyValid == 0u){\r
		return vec4(current, 1.);\r
	}\r
\r
	//static: the same pixel, the jitter offsets of the frames average in it\r
	if(uniforms.staticWeight > 0.){\r
		let previous = textureLoad(history, coord, 0).rgb;\r
		return vec4(mix(previous, current, uniforms.staticWeight), 1.);\r
	}\r
\r
	var historyColor : vec3<f32>;\r
	if(CAMERA_STILL){\r
		//the image changes but the camera didn't move: the reprojected uv would be the pixel's own, where the catmull-rom\r
		//filter is the texel itself. 1 load instead of the depth, the reprojection and the 5 taps\r
		historyColor = max(textureLoad(history, coord, 0).rgb, vec3(0.));\r
	}else{\r
		let uv = (vec2<f32>(coord) + .5) / uniforms.resolution;\r
		var d = getGBufferDistance(textureLoad(depthTexture, coord, 0), uv, uniforms.inverseProjection, uniforms.depthParams);\r
		//the sky: far away, only the rotation of the camera moves it\r
		if(d <= 0.){\r
			d = 1000.;\r
		}\r
		let p = uniforms.cameraPosition + getRay(uv) * d;\r
		let uvOld = uv + projectToUV(uniforms.viewProjectionOldNoJitter, p) - projectToUV(uniforms.viewProjectionNoJitter, p);\r
		if(any(uvOld < vec2(0.)) || any(uvOld >= vec2(1.))){\r
			return vec4(current, 1.);\r
		}\r
		historyColor = sampleHistory(uvOld);\r
	}\r
\r
	let maxCoord = vec2<i32>(uniforms.resolution) - 1;\r
	var m1 = vec3(0.);\r
	var m2 = vec3(0.);\r
	for(var i = 0; i < 9; i++){\r
		let c = clamp(coord + vec2(i % 3 - 1, i / 3 - 1), vec2(0), maxCoord);\r
		let s = rgbToYCoCg(textureLoad(source, c, 0).rgb);\r
		m1 += s;\r
		m2 += s * s;\r
	}\r
	m1 /= 9.;\r
	let sigma = sqrt(max(m2 / 9. - m1 * m1, vec3(0.)));\r
	let historyYCoCg = clamp(rgbToYCoCg(historyColor), m1 - sigma * uniforms.clipGamma, m1 + sigma * uniforms.clipGamma);\r
	let previous = max(yCoCgToRgb(historyYCoCg), vec3(0.));\r
\r
	let wCurrent = (1. - uniforms.feedback) / (1. + luma(current));\r
	let wPrevious = uniforms.feedback / (1. + luma(previous));\r
	return vec4((current * wCurrent + previous * wPrevious) / (wCurrent + wPrevious), 1.);\r
}\r
`,Xs=32,qs=16;class Ys{constructor(e){a(this,"enabled");a(this,"renderer");a(this,"material");a(this,"histories");a(this,"historyIndex",0);a(this,"historyValid",!1);a(this,"staticFrames",0);a(this,"resolution",new k);a(this,"canvasSize",new k);a(this,"viewProjectionNoJitter",new F);a(this,"viewProjectionOldNoJitter",new F);a(this,"cameraPosition",new S);a(this,"cameraPositionOld",new S);a(this,"inverseView",new F);a(this,"inverseProjection",new F);this.renderer=e,this.material=new G(e,"mapTAA",Hs,{includes:[pt]}),this.material.depthWriteEnabled=!1,this.material.depthCompare="always",this.material.setSampler("linearSampler",e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"linear",minFilter:"linear"})),this.histories=[0,1].map(()=>new H(e,1,1,{scaleToCanvas:!0,depth:!1,toScreen:!1,formats:["rgba16float"]}))}init(e){const t={materials:[this.material],callback:()=>this.restart()},r=e.addGroup("TAA");this.enabled=r.addParamBool("enabled",!0,{callback:()=>this.invalidate()}),r.addParamFloat("feedback",.9,0,.99,t),r.addParamFloat("clipGamma",1,.5,3,t),r.collapsed=!0}setCamera(e,t){this.viewProjectionOldNoJitter.copy(this.viewProjectionNoJitter),this.viewProjectionNoJitter.copy(e.viewProjection),this.cameraPositionOld.copy(this.cameraPosition),this.cameraPosition.copy(e.worldPosition),t&&this.enabled.value&&e.projection.jitter(this.getCanvasSize(),qs)}get converged(){return this.historyValid&&this.staticFrames>=(this.enabled.value?Xs:1)&&this.sizeValid}restart(){this.staticFrames=0}invalidate(){this.historyValid=!1,this.staticFrames=0}get output(){return this.histories[this.historyIndex]}getCanvasSize(){return this.canvasSize.setValues(this.renderer.canvas.width,this.renderer.canvas.height)}get cameraStill(){const e=this.viewProjectionNoJitter.m,t=this.viewProjectionOldNoJitter.m;for(let r=0;r<16;r++)if(e[r]!==t[r])return!1;return!0}get sizeValid(){const e=this.getCanvasSize();return e.x===this.resolution.x&&e.y===this.resolution.y}resolve(e,t,r,n){this.sizeValid||(this.resolution.copy(this.getCanvasSize()),this.invalidate()),n||(this.staticFrames=0);const i=n?1/(this.staticFrames+2):0;this.historyIndex=1-this.historyIndex;const s=this.histories[this.historyIndex];F.invert(e.viewMatrix,this.inverseView),F.invert(e.projectionMatrix,this.inverseProjection),this.material.setMatrix("inverseView",this.inverseView),this.material.setMatrix("inverseProjection",this.inverseProjection),this.material.setVector3("cameraPosition",e.worldPosition),this.material.setMatrix("viewProjectionNoJitter",this.viewProjectionNoJitter),this.material.setMatrix("viewProjectionOldNoJitter",this.viewProjectionOldNoJitter),this.material.setVector2("resolution",this.resolution),this.material.setBool("historyValid",this.historyValid&&this.enabled.value),this.material.setConstant("CAMERA_STILL",this.cameraStill),this.material.setFloat("staticWeight",i),this.material.setBinding("depthTexture",r),this.material.setVector2("depthParams",oe.depthParams(e)),this.material.setTexture("source",t),this.material.setTexture("history",this.histories[1-this.historyIndex]),this.renderer.blit(null,s,this.material),this.historyValid=!0,n&&this.staticFrames++}destruct(){for(const e of this.histories)e.destruct();this.material.destruct()}}const Ks=4;var Tt=(c=>(c[c.Moving=0]="Moving",c[c.Loading=1]="Loading",c[c.Converging=2]="Converging",c))(Tt||{});const Gt=`//the camera ray and the world position of a gBuffer pixel. Needs uniforms.inverseProjection, inverseView and cameraPosition.\r
//uv: -1 to 1, y down like the texture coordinates\r
fn getRay(uv: vec2<f32>)->vec3<f32>\r
{\r
    var dirEye = uniforms.inverseProjection * vec4(uv.x, -uv.y, 1., 1.0);\r
    dirEye.w = 0.;\r
    return normalize((uniforms.inverseView * dirEye).xyz);\r
}\r
\r
//d: the distance along the camera ray, see packNormalDepth in gBuffer.wgsl\r
fn depthToPosition(d: f32, uv: vec2<f32>) -> vec3<f32>{\r
	return uniforms.cameraPosition + getRay(uv) * d;\r
}\r
`,$s=`//https://www.shadertoy.com/view/XsGfWV\r
fn acesTonemap(color: vec3<f32>)->vec3<f32>{\r
	let m1 = mat3x3(\r
        0.59719, 0.07600, 0.02840,\r
        0.35458, 0.90834, 0.13383,\r
        0.04823, 0.01566, 0.83777\r
	);\r
	let m2 = mat3x3(\r
        1.60475, -0.10208, -0.00327,\r
        -0.53108,  1.10813, -0.07276,\r
        -0.07367, -0.00605,  1.07602\r
	);\r
	let v = m1 * color;\r
	let a = v * (v + 0.0245786) - 0.000090537;\r
	let b = v * (0.983729 * v + 0.4329510) + 0.238081;\r
	return saturate(m2 * (a / b));\r
}\r
\r
//curve fitted approximation. Over saturates bright colors\r
//https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/\r
fn acesTonemapFitted(color: vec3<f32>) -> vec3<f32> {\r
	let a = 2.51;\r
	let b = 0.03;\r
	let c = 2.43;\r
	let d = 0.59;\r
	let e = 0.14;\r
	return saturate((color * (a * color + b)) / (color * (c * color + d) + e));\r
}\r
\r
//unity gamma to linear\r
fn gammaToLinear (sRGB: vec3<f32>)->vec3<f32> {\r
	// Approximate version from http://chilliant.blogspot.com.au/2012/08/srgb-approximations-for-hlsl.html?m=1\r
	return sRGB * (sRGB * (sRGB * 0.305306011 + 0.682171111) + 0.012522878);\r
}\r
\r
fn linearToGamma (linRGB: vec3<f32>)->vec3<f32> {\r
	// An almost-perfect approximation from http://chilliant.blogspot.com.au/2012/08/srgb-approximations-for-hlsl.html?m=1\r
	return max(1.055 * pow(linRGB, vec3(0.416666667)) - 0.055, vec3(0));\r
}\r
\r
fn toneMap(color: vec3<f32>)->vec3<f32>{\r
	let c = acesTonemap(color);\r
	//color = mix(c, smoothstep(0., 1., c), _Contrast);\r
	return linearToGamma(c);\r
}\r
`,zt=class zt extends On{constructor(t,r,n,i={}){super(t,r,n,i);a(this,"dirty",!0);a(this,"kernel");a(this,"_pipeline",null);a(this,"shaderModule",null);a(this,"pipelines",new Map);a(this,"asyncPipeline");a(this,"pendingPipelines",new Set);this.kernel=i.kernel??"compute_main",this.asyncPipeline=i.asyncPipeline??!1,this.constants=new Nn(this.shaderCode,!1),_.log("overrides",r,this.constants.names),this.initBindGroups()}constantsChanged(){this.dirty=!0}getDescriptor(){return this.shaderModule||(this.shaderModule=this.renderer.device.createShaderModule({code:this.shaderCode,label:this.name+"Module"})),{label:this.name+"Pipeline",layout:this.pipelineLayout,compute:{module:this.shaderModule,entryPoint:this.kernel,constants:this.constants.values}}}storePipeline(t,r){this.pipelines.size>=zt.MAX_PIPELINES&&this.pipelines.delete(this.pipelines.keys().next().value),this.pipelines.set(t,r)}get ready(){if(!this.asyncPipeline)return!0;const t=this.constants.key;if(this.pipelines.has(t))return!0;if(this.pendingPipelines.has(t))return!1;const r=this.getDescriptor();this.pendingPipelines.add(t);const n=this.pendingPipelines;return this.renderer.device.createComputePipelineAsync(r).then(i=>{n!==this.pendingPipelines||!n.delete(t)||this.pipelines.has(t)||this.storePipeline(t,i)},i=>{n!==this.pendingPipelines||!n.delete(t)||this.pipelines.has(t)||(_.warn("ComputeShader: createComputePipelineAsync failed, creating it sync",this.name,i),this.storePipeline(t,this.renderer.device.createComputePipeline(r)))}),!1}get pipeline(){if(this.dirty||!this._pipeline){const t=this.constants.key;let r=this.pipelines.get(t);r?(this.pipelines.delete(t),this.pipelines.set(t,r)):(r=this.renderer.device.createComputePipeline(this.getDescriptor()),this.storePipeline(t,r)),this._pipeline=r,this.dirty=!1}return this._pipeline}destruct(){super.destruct(),this.pipelines.clear(),this.pendingPipelines=new Set,this._pipeline=null,this.dirty=!0}};a(zt,"MAX_PIPELINES",16);let Me=zt;async function Zs(c){const e=new Uint8Array(c),t=new DataView(c);if([137,80,78,71,13,10,26,10].some((p,x)=>e[x]!=p))throw new Error("decodePngRgba8: not a png");let n=0,i=0,s=0;const o=[];for(let p=8;p<e.length;){const x=t.getUint32(p),b=String.fromCharCode(...e.subarray(p+4,p+8)),g=p+8;if(b=="IHDR"){n=t.getUint32(g),i=t.getUint32(g+4);const y=e[g+8];s=e[g+9];const v=e[g+12];if(y!=8||s!=2&&s!=6||v!=0)throw new Error(`decodePngRgba8: only 8 bits RGB or RGBA without interlace, not depth ${y} type ${s} interlace ${v}`)}else if(b=="IDAT")o.push(e.subarray(g,g+x));else if(b=="IEND")break;p=g+x+4}const l=new Blob(o).stream().pipeThrough(new DecompressionStream("deflate")),h=new Uint8Array(await new Response(l).arrayBuffer()),u=s==6?4:3,d=n*u,f=new Uint8Array(d*i);for(let p=0;p<i;p++){const x=h[p*(d+1)],b=p*(d+1)+1,g=p*d,y=g-d;for(let v=0;v<d;v++){const w=v>=u?f[g+v-u]:0,M=p>0?f[y+v]:0,C=v>=u&&p>0?f[y+v-u]:0;let E=0;switch(x){case 0:E=0;break;case 1:E=w;break;case 2:E=M;break;case 3:E=w+M>>1;break;case 4:{const A=w+M-C,P=Math.abs(A-w),T=Math.abs(A-M),L=Math.abs(A-C);E=P<=T&&P<=L?w:T<=L?M:C;break}default:throw new Error(`decodePngRgba8: unknown filter ${x}`)}f[g+v]=h[b+v]+E&255}}if(u==4)return{width:n,height:i,data:f};const m=new Uint8Array(n*i*4);for(let p=0;p<n*i;p++)m[p*4]=f[p*3],m[p*4+1]=f[p*3+1],m[p*4+2]=f[p*3+2],m[p*4+3]=255;return{width:n,height:i,data:m}}const Qs=""+new URL("blueNoise2D16Bits-BvgCQQW-.png",import.meta.url).href;class Js extends $n{constructor(e,t){super(e,256,256),t.add(this)}load(e){this.loadPng().then(e)}async loadPng(){const e=await fetch(Qs),{width:t,height:r,data:n}=await Zs(await e.arrayBuffer()),i=t*r,s=new Uint16Array(i*2);for(let o=0;o<i;o++){const l=o*4;s[o*2]=n[l]<<8|n[l+1],s[o*2+1]=n[l+2]<<8|n[l+3]}this.setData(s,t,r,"rg16unorm")}}const le=`// Integer hashes -> uniform f32 in [0, 1).\r
//\r
// Naming: hash<inputs><outputs><it> where <it> is the input type,\r
//   'uf' = u32 seed -> f32 output, 'ff' = f32 seed -> f32 output.\r
//\r
// Everything is built from one primitive, pcgHash, a bijective 32-bit finalizer:\r
//   * N inputs are folded into one word (foldN),\r
//   * M outputs are produced by chaining pcgHash M times.\r
// Cost is (N - 1) + 2 * M integer multiplies, which is cheaper than the previous\r
// implementation for 9 of the 16 combinations and at most 2 multiplies more for\r
// the rest (those were cheap only because they fabricated the 2nd/3rd/4th\r
// component as \`n * <constant>\`, which added no entropy at all).\r
\r
// ---------------------------------------------------------------------------\r
// u32 -> f32 in [0, 1)\r
//\r
// Splices the top 23 bits into the mantissa of an exponent-127 float, giving a\r
// value in [1, 2), then subtracts 1. No integer->float conversion and no divide,\r
// and it keeps the well-mixed high bits rather than masking off the sign bit.\r
// ---------------------------------------------------------------------------\r
fn uf1(v: u32) -> f32 {\r
    return bitcast<f32>((v >> 9u) | 0x3f800000u) - 1.0;\r
}\r
\r
fn uf2(v: vec2<u32>) -> vec2<f32> {\r
    return bitcast<vec2<f32>>((v >> vec2<u32>(9u)) | vec2<u32>(0x3f800000u)) - 1.0;\r
}\r
\r
fn uf3(v: vec3<u32>) -> vec3<f32> {\r
    return bitcast<vec3<f32>>((v >> vec3<u32>(9u)) | vec3<u32>(0x3f800000u)) - 1.0;\r
}\r
\r
fn uf4(v: vec4<u32>) -> vec4<f32> {\r
    return bitcast<vec4<f32>>((v >> vec4<u32>(9u)) | vec4<u32>(0x3f800000u)) - 1.0;\r
}\r
\r
// ---------------------------------------------------------------------------\r
// PCG RXS-M-XS 32-bit finalizer (Melissa O'Neill, pcg-random.org).\r
// A bijection, so distinct seeds never collide and chaining it cannot shorten\r
// the output range.\r
// ---------------------------------------------------------------------------\r
fn pcgHash(seed: u32) -> u32 {\r
    let state = seed * 747796405u + 2891336453u;\r
    let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;\r
    return (word >> 22u) ^ word;\r
}\r
\r
fn pcgChain2(seed: u32) -> vec2<u32> {\r
    let n0 = pcgHash(seed);\r
    return vec2<u32>(n0, pcgHash(n0));\r
}\r
\r
fn pcgChain3(seed: u32) -> vec3<u32> {\r
    let n0 = pcgHash(seed);\r
    let n1 = pcgHash(n0);\r
    return vec3<u32>(n0, n1, pcgHash(n1));\r
}\r
\r
fn pcgChain4(seed: u32) -> vec4<u32> {\r
    let n0 = pcgHash(seed);\r
    let n1 = pcgHash(n0);\r
    let n2 = pcgHash(n1);\r
    return vec4<u32>(n0, n1, n2, pcgHash(n2));\r
}\r
\r
// ---------------------------------------------------------------------------\r
// Fold N seed words into one.\r
//\r
// The \`v ^ (v >> 16u)\` premix is what makes the ff (float seed) entry points\r
// safe. A float like 0.5 or 3.0/1024.0 bitcasts to a word whose low bits are all\r
// zero, so multiplying it during the fold pushes every informative bit off the\r
// top of the register and the seeds collapse onto each other. Folding the high\r
// bits down first costs no multiplies and is a no-op for small integer seeds.\r
//\r
// The multipliers are odd and large (2^32 / golden ratio and friends) so that\r
// neighbouring lattice coordinates stay far apart after folding.\r
// ---------------------------------------------------------------------------\r
fn fold2(p: vec2<u32>) -> u32 {\r
    let m = p ^ (p >> vec2<u32>(16u));\r
    return m.x + m.y * 0x9e3779b9u;\r
}\r
\r
fn fold3(p: vec3<u32>) -> u32 {\r
    let m = p ^ (p >> vec3<u32>(16u));\r
    return m.x + m.y * 0x9e3779b9u + m.z * 0x85ebca6bu;\r
}\r
\r
fn fold4(p: vec4<u32>) -> u32 {\r
    let m = p ^ (p >> vec4<u32>(16u));\r
    return m.x + m.y * 0x9e3779b9u + m.z * 0x85ebca6bu + m.w * 0xc2b2ae35u;\r
}\r
\r
// ---------------------------------------------------------------------------\r
// 1 input\r
// ---------------------------------------------------------------------------\r
fn hash11ff(seed: f32) -> f32 {\r
	return hash11uf(bitcast<u32>(seed));\r
}\r
\r
fn hash11uf(seed: u32) -> f32 {\r
    return uf1(pcgHash(seed));\r
}\r
\r
fn hash12ff(seed: f32) -> vec2<f32> {\r
	return hash12uf(bitcast<u32>(seed));\r
}\r
\r
fn hash12uf(seed: u32) -> vec2<f32> {\r
    return uf2(pcgChain2(seed));\r
}\r
\r
fn hash13ff(seed: f32) -> vec3<f32> {\r
	return hash13uf(bitcast<u32>(seed));\r
}\r
\r
fn hash13uf(seed: u32) -> vec3<f32> {\r
    return uf3(pcgChain3(seed));\r
}\r
\r
fn hash14ff(seed: f32) -> vec4<f32> {\r
	return hash14uf(bitcast<u32>(seed));\r
}\r
\r
fn hash14uf(seed: u32) -> vec4<f32> {\r
    return uf4(pcgChain4(seed));\r
}\r
\r
// ---------------------------------------------------------------------------\r
// 2 inputs\r
// ---------------------------------------------------------------------------\r
fn hash21ff(seed: vec2<f32>) -> f32 {\r
	return hash21uf((bitcast<vec2<u32>>(seed)));\r
}\r
\r
fn hash21uf(seed: vec2<u32>) -> f32 {\r
    return uf1(pcgHash(fold2(seed)));\r
}\r
\r
fn hash22ff(seed: vec2<f32>) -> vec2<f32> {\r
	return hash22uf((bitcast<vec2<u32>>(seed)));\r
}\r
\r
fn hash22uf(seed: vec2<u32>) -> vec2<f32> {\r
    return uf2(pcgChain2(fold2(seed)));\r
}\r
\r
fn hash23ff(seed: vec2<f32>) -> vec3<f32> {\r
	return hash23uf((bitcast<vec2<u32>>(seed)));\r
}\r
\r
fn hash23uf(seed: vec2<u32>) -> vec3<f32> {\r
    return uf3(pcgChain3(fold2(seed)));\r
}\r
\r
fn hash24ff(seed: vec2<f32>) -> vec4<f32> {\r
	return hash24uf((bitcast<vec2<u32>>(seed)));\r
}\r
\r
fn hash24uf(seed: vec2<u32>) -> vec4<f32> {\r
    return uf4(pcgChain4(fold2(seed)));\r
}\r
\r
// ---------------------------------------------------------------------------\r
// 3 inputs\r
// ---------------------------------------------------------------------------\r
fn hash31ff(seed: vec3<f32>) -> f32 {\r
	return hash31uf((bitcast<vec3<u32>>(seed)));\r
}\r
\r
fn hash31uf(seed: vec3<u32>) -> f32 {\r
    return uf1(pcgHash(fold3(seed)));\r
}\r
\r
fn hash32ff(seed: vec3<f32>) -> vec2<f32> {\r
	return hash32uf((bitcast<vec3<u32>>(seed)));\r
}\r
\r
fn hash32uf(seed: vec3<u32>) -> vec2<f32> {\r
    return uf2(pcgChain2(fold3(seed)));\r
}\r
\r
fn hash33ff(seed: vec3<f32>) -> vec3<f32> {\r
	return hash33uf((bitcast<vec3<u32>>(seed)));\r
}\r
\r
fn hash33uf(seed: vec3<u32>) -> vec3<f32> {\r
    return uf3(pcgChain3(fold3(seed)));\r
}\r
\r
fn hash34ff(seed: vec3<f32>) -> vec4<f32> {\r
	return hash34uf((bitcast<vec3<u32>>(seed)));\r
}\r
\r
fn hash34uf(seed: vec3<u32>) -> vec4<f32> {\r
    return uf4(pcgChain4(fold3(seed)));\r
}\r
\r
// ---------------------------------------------------------------------------\r
// 4 inputs\r
// ---------------------------------------------------------------------------\r
fn hash41ff(seed: vec4<f32>) -> f32 {\r
	return hash41uf((bitcast<vec4<u32>>(seed)));\r
}\r
\r
fn hash41uf(seed: vec4<u32>) -> f32 {\r
    return uf1(pcgHash(fold4(seed)));\r
}\r
\r
fn hash42ff(seed: vec4<f32>) -> vec2<f32> {\r
	return hash42uf((bitcast<vec4<u32>>(seed)));\r
}\r
\r
fn hash42uf(seed: vec4<u32>) -> vec2<f32> {\r
    return uf2(pcgChain2(fold4(seed)));\r
}\r
\r
fn hash43ff(seed: vec4<f32>) -> vec3<f32> {\r
	return hash43uf((bitcast<vec4<u32>>(seed)));\r
}\r
\r
fn hash43uf(seed: vec4<u32>) -> vec3<f32> {\r
    return uf3(pcgChain3(fold4(seed)));\r
}\r
\r
fn hash44ff(seed: vec4<f32>) -> vec4<f32> {\r
	return hash44uf((bitcast<vec4<u32>>(seed)));\r
}\r
\r
fn hash44uf(seed: vec4<u32>) -> vec4<f32> {\r
    return uf4(pcgChain4(fold4(seed)));\r
}\r
`,jr=`//the levels, texels and tiles of the city lightmap, see SkyVisibilityLightmap.ts. Like virtualLightmap.wgsl of the irradiance\r
//cache, with the charts of cityLightmapSurface.wgsl. Needs uniforms.cameraPosition, viewProjection, pixelSize,\r
//pixelScale, texelsPerPixel, texelSizeMin, levelAngle, blurSlope, blurMax and blurTexelScale\r
\r
//texels along the side of the lightmap, which is square. The defaults are for the materials that are not set yet\r
override LIGHTMAP_SIZE: u32 = 2048u;\r
//the tiles the lightmap has room for\r
override TILE_COUNT: u32 = 65536u;\r
//texels along the side of a tile\r
override TILE_SIZE: u32 = 8u;\r
\r
//no tile: not found, or the probe sequence is full of tiles that are in use\r
const TILE_NONE = 0xFFFFFFFFu;\r
//the texel size doubles per level. Keeps 1 << level in range\r
const LEVEL_MAX = 20u;\r
//added to the texel coordinates, so the ones left of or below 0 are u32 too. The top chart is the whole map, so it has\r
//no size and no clamp: a texel is any integer coordinate\r
const TEXEL_OFFSET = 0x40000000;\r
\r
fn tileHash(x: u32) -> u32 {\r
	var a = x;\r
	a = (a ^ 61u) ^ (a >> 16u);\r
	a = a + (a << 3u);\r
	a = a ^ (a >> 4u);\r
	a = a * 0x27d4eb2du;\r
	a = a ^ (a >> 15u);\r
	return a;\r
}\r
\r
//independent of tileHash, for the slot of getTileKey\r
fn tilePcg(x: u32) -> u32 {\r
	let state = x * 747796405u + 2891336453u;\r
	let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;\r
	return (word >> 22u) ^ word;\r
}\r
\r
//the most levels a grazing view angle adds, see getLevel\r
const LEVEL_ANGLE_MAX = 2.;\r
\r
//the sigma of the tilt shift blur at p in reference pixels (see SkyVisibilityLightmap.getPixelScale), like tiltShift.wgsl: it grows with\r
//the distance to the horizontal center line of the screen. Behind the camera the most, a ray hit can be there\r
fn getBlurPixels(p: vec3<f32>) -> f32 {\r
	if(uniforms.blurSlope <= 0.){\r
		return 0.;\r
	}\r
	let clip = uniforms.viewProjection * vec4(p, 1.);\r
	var ndcY = 1e6;\r
	if(clip.w > 1e-6){\r
		ndcY = abs(clip.y / clip.w);\r
	}\r
	return min(uniforms.blurSlope * ndcY, uniforms.blurMax) / uniforms.pixelScale;\r
}\r
\r
//the level of the texels at p with normal n, so there are texelsPerPixel texels per screen pixel, or a texel per\r
//blurTexelScale times the sigma of the tilt shift blur where that is more: it would blur the finer lighting away.\r
//Level 0 texels are texelSizeMin, each level doubles the size. Fractional, so the resolve can blend between 2 levels.\r
//levelAngle: see getLevel in virtualLightmap.wgsl\r
fn getLevel(p: vec3<f32>, n: vec3<f32>) -> f32 {\r
	let toCamera = uniforms.cameraPosition - p;\r
	let d = length(toCamera);\r
	let cosAngle = abs(dot(n, toCamera)) / max(d, 1e-9);\r
	let angleLevels = min(-log2(max(cosAngle, 1e-6)) * uniforms.levelAngle, LEVEL_ANGLE_MAX);\r
	let texelPixels = max(1. / uniforms.texelsPerPixel, getBlurPixels(p) * uniforms.blurTexelScale);\r
	let size = uniforms.pixelSize * d * texelPixels;\r
	return clamp(log2(size / uniforms.texelSizeMin) + angleLevels, 0., f32(LEVEL_MAX));\r
}\r
\r
fn getTexelSize(level: u32) -> f32 {\r
	return uniforms.texelSizeMin * f32(1u << level);\r
}\r
\r
//the texel of a chart position at a level, offset by TEXEL_OFFSET. A texel of a level is 2 x 2 texels of the level below it\r
fn getTexelAt(position: vec2<f32>, level: u32) -> vec2<i32> {\r
	return vec2<i32>(floor(position / getTexelSize(level))) + vec2(TEXEL_OFFSET);\r
}\r
\r
fn getTexel(surface: Surface, level: u32) -> vec2<u32> {\r
	return vec2<u32>(getTexelAt(surface.position, level));\r
}\r
\r
//the checksum and the first slot of a tile of a chart at a level. The checksum is never 0, which is an empty slot\r
fn getTileKey(surface: u32, level: u32, tile: vec2<u32>) -> vec2<u32> {\r
	let key = max(tileHash(tile.x ^ tileHash(tile.y ^ tileHash(surface ^ tileHash(level)))), 1u);\r
	let slot = tilePcg(tile.x + tilePcg(tile.y + tilePcg(surface + tilePcg(level))));\r
	return vec2(key, slot % TILE_COUNT);\r
}\r
\r
//the index in lightingBuffer of a texel, in the tile at tileIndex\r
fn getTexelIndex(tileIndex: u32, texel: vec2<u32>) -> u32 {\r
	let t = texel % TILE_SIZE;\r
	return (tileIndex * TILE_SIZE + t.y) * TILE_SIZE + t.x;\r
}\r
\r
//the sun visibility of a texel is this far after its sky visibility in lightingBuffer, when the lightmap has the sun\r
//(SkyVisibilityLightmap.setSun): the buffer is twice the size then, the second half the sun texels in the same layout\r
fn getSunTexelOffset() -> u32 {\r
	return LIGHTMAP_SIZE * LIGHTMAP_SIZE;\r
}\r
\r
//the running average of the lighting (rgb) and the sample count it holds (a), as 4 x f16\r
fn unpackLighting(v: vec2<u32>) -> vec4<f32> {\r
	return vec4(unpack2x16float(v.x), unpack2x16float(v.y));\r
}\r
\r
fn packLighting(l: vec4<f32>) -> vec2<u32> {\r
	return vec2(pack2x16float(l.rg), pack2x16float(l.ba));\r
}\r
`,ea=`//the sky visibility of the sky visibility lightmap at a point, for the deferred shading (deferredShading.wgsl).\r
//Texels of 1 word, the visibility and the paths it holds as 2 x f16, see\r
//updateSkyVisibilityLightmap.wgsl. The functions return the visibility in rgb, and the shading\r
//multiplies it by the sky color. With the sun in the lightmap (SkyVisibilityLightmap.setSun) the sun half of the texels\r
//holds the sun visibility: getLightmapChannels looks up both with the same tile probes. Needs cityLightmap.wgsl, the\r
//bindings tileBuffer (array<u32>) and lightingBuffer (array<u32>), and uniforms.searchCount, accumulationMax,\r
//ancestorWeight and levelBlend\r
\r
//the slot of a tile, TILE_NONE when it doesn't exist\r
fn findTile(surface: u32, level: u32, tile: vec2<u32>) -> u32 {\r
	let keySlot = getTileKey(surface, level, tile);\r
	let key = keySlot.x;\r
	var index = keySlot.y;\r
	for(var i = 0u; i < uniforms.searchCount; i++){\r
		let existing = tileBuffer[index];\r
		if(existing == key){\r
			return index;\r
		}\r
		if(existing == 0u){\r
			break;\r
		}\r
		index = (index + 1u) % TILE_COUNT;\r
	}\r
	return TILE_NONE;\r
}\r
\r
//above this part of accumulationMax the texels of gather count the same, see resolveVirtualLightmap.wgsl\r
const GATHER_COUNT_MAX = .25;\r
\r
//level + 2 is the prior of level + 1 while that has few paths (see getLightmapChannels). false: only where level + 1\r
//has no paths at all, so it doesn't show as a hole. The half resolution pass (SkyVisibilityHalfRes), where the gather\r
//of level + 2 cost 1.3x while flying and changed next to nothing once the texels converge\r
override LEVEL2_PRIOR: bool = true;\r
//gather reads the texel the point is in instead of the 4 around it, bilinearly: 1 hash table lookup and 1 load instead\r
//of up to 4 and 4. Blocky, a texel is a few pixels. See SkyVisibilityLightmap.halfResNearest\r
override NEAREST_TEXEL: bool = false;\r
\r
//the visibility and the paths of a texel: of the sky (xy), and of the sun (zw, see getSunTexelOffset) when sun, else 0\r
fn loadTexel(tileIndex: u32, tileTexel: vec2<u32>, sun: bool) -> vec4<f32> {\r
	if(tileIndex == TILE_NONE){\r
		return vec4(0.);\r
	}\r
	let index = (tileIndex * TILE_SIZE + tileTexel.y) * TILE_SIZE + tileTexel.x;\r
	if(PACKED_TEXELS){\r
		//both channels in 1 word, see skyVisibilityTexel.wgsl\r
		let t = decodePackedTexel(lightingBuffer[index]);\r
		return select(vec4(t.xy, 0., 0.), t, sun);\r
	}\r
	var sunTexel = vec2(0.);\r
	if(sun){\r
		sunTexel = unpack2x16float(lightingBuffer[index + getSunTexelOffset()]);\r
	}\r
	return vec4(unpack2x16float(lightingBuffer[index]), sunTexel);\r
}\r
\r
//1 channel of gather: the 4 texels (visibility, paths) bilinearly and weighted by their path counts\r
fn gatherChannel(bilinear: vec4<f32>, l00: vec2<f32>, l10: vec2<f32>, l01: vec2<f32>, l11: vec2<f32>) -> vec2<f32> {\r
	let counts = vec4(l00.y, l10.y, l01.y, l11.y);\r
	let weights = bilinear * min(counts, vec4(uniforms.accumulationMax * GATHER_COUNT_MAX));\r
	let weight = weights.x + weights.y + weights.z + weights.w;\r
	if(weight == 0.){\r
		return vec2(0.);\r
	}\r
	let count = dot(bilinear, counts);\r
	let visibility = dot(vec4(l00.x, l10.x, l01.x, l11.x), weights) / weight;\r
	return vec2(visibility * count, count);\r
}\r
\r
//the 4 texels of a level nearest to the surface point, bilinearly and weighted by their path counts. The visibility\r
//times the path count, and the path count: of the sky (xy), and with sun of the sun texels (zw, else 0). The hash table\r
//lookups (up to 4) are the same for both. NEAREST_TEXEL: the texel of the point only\r
fn gather(surface: Surface, level: u32, sun: bool) -> vec4<f32> {\r
	if(NEAREST_TEXEL){\r
		let texel = getTexel(surface, level);\r
		let l = loadTexel(findTile(surface.id, level, texel / TILE_SIZE), texel % TILE_SIZE, sun);\r
		return vec4(l.x * l.y, l.y, l.z * l.w, l.w);\r
	}\r
	let q = surface.position / getTexelSize(level) - .5;\r
	let f = fract(q);\r
	let texel0 = vec2<u32>(vec2<i32>(floor(q)) + vec2(TEXEL_OFFSET));\r
	let texel1 = texel0 + 1u;\r
\r
	let t0 = texel0 / TILE_SIZE;\r
	let t1 = texel1 / TILE_SIZE;\r
	let i00 = findTile(surface.id, level, t0);\r
	var i10 = i00;\r
	var i01 = i00;\r
	var i11 = i00;\r
	if(t1.x != t0.x){\r
		i10 = findTile(surface.id, level, vec2(t1.x, t0.y));\r
		i11 = i10;\r
	}\r
	if(t1.y != t0.y){\r
		i01 = findTile(surface.id, level, vec2(t0.x, t1.y));\r
		i11 = i01;\r
		if(t1.x != t0.x){\r
			i11 = findTile(surface.id, level, t1);\r
		}\r
	}\r
\r
	let p0 = texel0 % TILE_SIZE;\r
	let p1 = texel1 % TILE_SIZE;\r
	let l00 = loadTexel(i00, p0, sun);\r
	let l10 = loadTexel(i10, vec2(p1.x, p0.y), sun);\r
	let l01 = loadTexel(i01, vec2(p0.x, p1.y), sun);\r
	let l11 = loadTexel(i11, p1, sun);\r
\r
	let bilinear = vec4((1. - f.x) * (1. - f.y), f.x * (1. - f.y), (1. - f.x) * f.y, f.x * f.y);\r
	let sky = gatherChannel(bilinear, l00.xy, l10.xy, l01.xy, l11.xy);\r
	var sunGather = vec2(0.);\r
	if(sun){\r
		sunGather = gatherChannel(bilinear, l00.zw, l10.zw, l01.zw, l11.zw);\r
	}\r
	return vec4(sky, sunGather);\r
}\r
\r
const PRIOR_FADE = 8.;\r
//below convergedPaths (SkyVisibilityLightmap, 256 of the 508 of packedTexels), so a texel that counts as converged needs\r
//no gather of its coarser level. At .75 most converged texels still gathered it, for a weight of a few percent: the half\r
//resolution pass was 1.2x slower for a difference of 1e-5\r
const PRIOR_FADE_ACCUMULATION = .5;\r
\r
//the paths from which a level is shown as it is, without the coarser level\r
fn getPriorEnd() -> f32 {\r
	return min(uniforms.ancestorWeight * PRIOR_FADE, uniforms.accumulationMax * PRIOR_FADE_ACCUMULATION);\r
}\r
\r
//a level, leaning on the coarser level while it has few paths. y 0 when neither has visibility\r
fn combine(fine: vec2<f32>, coarse: vec2<f32>) -> vec2<f32> {\r
	let priorEnd = getPriorEnd();\r
	if(fine.y >= priorEnd || coarse.y == 0.){\r
		return fine;\r
	}\r
	let priorWeight = min(coarse.y, uniforms.ancestorWeight) * (1. - fine.y / priorEnd);\r
	return vec2(fine.x + coarse.x / coarse.y * priorWeight, fine.y + priorWeight);\r
}\r
\r
//combine of both channels of gather. A channel with priorEnd paths or more stays as it is, so a gather that only the\r
//other channel needed changes nothing\r
fn combine2(fine: vec4<f32>, coarse: vec4<f32>) -> vec4<f32> {\r
	return vec4(combine(fine.xy, coarse.xy), combine(fine.zw, coarse.zw));\r
}\r
\r
//a channel of l (gather) has fewer paths than priorEnd: the sky, or with sun the sun\r
fn needsPrior(l: vec4<f32>, sun: bool, priorEnd: f32) -> bool {\r
	return l.y < priorEnd || (sun && l.w < priorEnd);\r
}\r
\r
//a channel of c (gather) has no paths, see needsPrior\r
fn hasEmpty(c: vec4<f32>, sun: bool) -> bool {\r
	return c.y == 0. || (sun && c.w == 0.);\r
}\r
\r
//per component of c (gather): its channel has no paths\r
fn emptyMask(c: vec4<f32>) -> vec4<bool> {\r
	return vec4(c.y == 0., c.y == 0., c.w == 0., c.w == 0.);\r
}\r
\r
//the weight of the coarser of the 2 levels around levelF: it goes from 0 to 1 in the middle uniforms.levelBlend part of\r
//a level only. A pixel outside it reads 1 level (and its prior while that has few paths) instead of 2. levelBlend 1:\r
//fract(levelF), blended over the whole level\r
fn getLevelBlend(levelF: f32) -> f32 {\r
	return saturate((fract(levelF) - .5) / max(uniforms.levelBlend, 1e-3) + .5);\r
}\r
\r
//the sky visibility between the 2 levels around levelF (rgb) and the paths it holds (a, 0 when there is none). Gathers\r
//a level only when the blend or a prior needs it: each gather is up to 4 hash table lookups and 4 texel loads\r
fn getLightmapLighting(surface: Surface, levelF: f32) -> vec4<f32> {\r
	let c = getLightmapChannels(surface, levelF, false);\r
	return vec4(vec3(c.x), c.y);\r
}\r
\r
//1 channel of getLightmapChannels: the 2 levels (each combined with its prior) blended by t, the visibility and the paths\r
fn blendLevels(c0: vec2<f32>, c1: vec2<f32>, t: f32) -> vec2<f32> {\r
	let visibility0 = select(0., c0.x / c0.y, c0.y > 0.);\r
	let visibility1 = select(0., c1.x / c1.y, c1.y > 0.);\r
	let w0 = select(0., 1. - t, c0.y > 0.);\r
	let w1 = select(0., t, c1.y > 0.);\r
	let count = max(c0.y, c1.y);\r
	if(w0 + w1 == 0.){\r
		return vec2(select(visibility1, visibility0, c0.y > 0.), count);\r
	}\r
	return vec2((visibility0 * w0 + visibility1 * w1) / (w0 + w1), count);\r
}\r
\r
//the sky visibility (x) and the paths it holds (y, 0 when there is none), and with sun the same of the sun visibility\r
//(zw, else 0; see SkyVisibilityLightmap.setSun), in 1 lookup: the gathers of both share their tile probes. A level is\r
//gathered when the blend or the prior of either channel needs it. The visibilities are those of separate lookups, a path\r
//count can be higher (it is only compared with 0)\r
fn getLightmapChannels(surface: Surface, levelF: f32, sun: bool) -> vec4<f32> {\r
	let level = u32(levelF);\r
	let t = getLevelBlend(levelF);\r
	let priorEnd = getPriorEnd();\r
	var l0 = vec4(0.);\r
	if(t < 1.){\r
		l0 = gather(surface, level, sun);\r
	}\r
	//the coarser level of the blend, or the prior of the finer one\r
	var l1 = vec4(0.);\r
	if(t > 0. || needsPrior(l0, sun, priorEnd)){\r
		l1 = gather(surface, level + 1u, sun);\r
	}\r
	var c0 = combine2(l0, l1);\r
	//also when the finer level has no visibility, so it doesn't show as a hole\r
	var c1 = vec4(0.);\r
	if(t > 0. || hasEmpty(c0, sun)){\r
		c1 = l1;\r
		//its prior, without LEVEL2_PRIOR only where it has no visibility\r
		if(select(hasEmpty(l1, sun), needsPrior(l1, sun, priorEnd), LEVEL2_PRIOR)){\r
			c1 = combine2(l1, gather(surface, level + 2u, sun));\r
		}\r
	}\r
	//the coarser level has no visibility: the finer one, when the blend skipped it (of those channels only)\r
	if(t == 1. && hasEmpty(c1, sun)){\r
		c0 = select(c0, combine2(gather(surface, level, sun), l1), emptyMask(c1));\r
	}\r
	return vec4(blendLevels(c0.xy, c1.xy, t), blendLevels(c0.zw, c1.zw, t));\r
}\r
\r
//1 of the 2 levels around levelF instead of both, see getLightmapLightingStochastic in cityLightmapResolve.wgsl.\r
//noise: 0 to 1, different per pixel and per frame\r
fn getLightmapLightingStochastic(surface: Surface, levelF: f32, noise: f32) -> vec4<f32> {\r
	let c = getLightmapChannelsStochastic(surface, levelF, noise, false);\r
	return vec4(vec3(c.x), c.y);\r
}\r
\r
//getLightmapChannels with 1 level picked by noise, the same for both channels\r
fn getLightmapChannelsStochastic(surface: Surface, levelF: f32, noise: f32, sun: bool) -> vec4<f32> {\r
	let levelBase = u32(levelF);\r
	let coarser = noise < getLevelBlend(levelF);\r
	let level = levelBase + select(0u, 1u, coarser);\r
	var c = gather(surface, level, sun);\r
	//the level above it is only its prior\r
	if(needsPrior(c, sun, getPriorEnd())){\r
		c = combine2(c, gather(surface, level + 1u, sun));\r
	}\r
	//a level without visibility doesn't show as a hole when the other one has it (of those channels only)\r
	if(hasEmpty(c, sun)){\r
		//the finer level, or the one above the prior: where the lightmap had no room for the tiles of 2 levels, the\r
		//cells sample the third (claim_main in updateSkyVisibilityLightmap.wgsl)\r
		c = select(c, gather(surface, select(levelBase + 2u, levelBase, coarser), sun), emptyMask(c));\r
	}\r
	return vec4(select(0., c.x / c.y, c.y > 0.), c.y, select(0., c.z / c.w, c.w > 0.), c.w);\r
}\r
\r
//the path count of the texel of the point at its level, for the converging view\r
fn getLightmapTexelCount(surface: Surface, level: u32) -> f32 {\r
	let texel = getTexel(surface, level);\r
	let tileIndex = findTile(surface.id, level, texel / TILE_SIZE);\r
	return loadTexel(tileIndex, texel % TILE_SIZE, false).y;\r
}\r
\r
//the half resolution resolve (see SkyVisibilityHalfRes.ts): a sample per 2 x 2 pixels holds the lighting and a key of the\r
//surface point it was looked up at. A full resolution pixel uses the samples around it whose key matches its own surface\r
//point: the same surface (a hash of the id) and within HALF_RES_MATCH_TEXELS texels. The position matters: the walls of\r
//the buildings of a map tile share a surface id, and so does all of the ground\r
\r
//along each axis, at the level of the sample. Neighbouring pixels on a surface are less than a texel apart (texelsPerPixel\r
//is below 1), more at a grazing angle. The ground in front of a building and behind it are many texels apart\r
const HALF_RES_MATCH_TEXELS = 2u;\r
//the position in the key: in 1 / 4 texel steps, modulo 64 texels (8 bits)\r
const HALF_RES_STEPS_PER_TEXEL = 4.;\r
const HALF_RES_WRAP_TEXELS = 64.;\r
\r
//the position of a surface point in the key, at a level\r
fn getHalfResPosition(position: vec2<f32>, level: u32) -> vec2<u32> {\r
	let q = fract(position / (getTexelSize(level) * HALF_RES_WRAP_TEXELS)) * (HALF_RES_WRAP_TEXELS * HALF_RES_STEPS_PER_TEXEL);\r
	return vec2<u32>(q) & vec2(255u);\r
}\r
\r
//the hash of a surface id in the key, 1 to 2047: 0 is no surface\r
fn getHalfResSurfaceHash(id: u32) -> u32 {\r
	return tileHash(id) % 2047u + 1u;\r
}\r
\r
//the key of the surface point a sample was looked up at: the hash of the surface id (11 bits), its level (5 bits) and\r
//its position at that level (2 x 8 bits). 0: no surface (the sky)\r
fn packHalfResKey(surface: Surface, level: u32) -> u32 {\r
	let p = getHalfResPosition(surface.position, level);\r
	return getHalfResSurfaceHash(surface.id) | (min(level, 31u) << 11u) | (p.x << 16u) | (p.y << 24u);\r
}\r
\r
//per key of 4 samples: whether it is of the surface point of a pixel, see packHalfResKey. The position compares at the\r
//level of the sample, wrapped (getHalfResPosition, the same arithmetic per component). All 4 at once, without branches:\r
//the loop of 1 test per sample (with an early out on the hash) made the deferred shading 1.27x slower\r
fn matchesHalfResKeys(keys: vec4<u32>, surface: Surface) -> vec4<bool> {\r
	let levels = (keys >> vec4(11u)) & vec4(31u);\r
	let wrap = uniforms.texelSizeMin * vec4<f32>(vec4(1u) << levels) * HALF_RES_WRAP_TEXELS;\r
	let steps = HALF_RES_WRAP_TEXELS * HALF_RES_STEPS_PER_TEXEL;\r
	let px = vec4<i32>(vec4<u32>(fract(surface.position.x / wrap) * steps) & vec4(255u));\r
	let py = vec4<i32>(vec4<u32>(fract(surface.position.y / wrap) * steps) & vec4(255u));\r
	let dx = ((px - vec4<i32>((keys >> vec4(16u)) & vec4(255u)) + 128) & vec4(255)) - 128;\r
	let dy = ((py - vec4<i32>(keys >> vec4(24u)) + 128) & vec4(255)) - 128;\r
	let reach = vec4(i32(HALF_RES_MATCH_TEXELS * u32(HALF_RES_STEPS_PER_TEXEL)));\r
	return ((keys & vec4(0x7FFu)) == vec4(getHalfResSurfaceHash(surface.id))) & (abs(dx) <= reach) & (abs(dy) <= reach);\r
}\r
`,Hr=`//PACKED_TEXELS (SkyVisibilityLightmap.packedTexels): a texel of the sky visibility lightmap is 1 word that counts rays,\r
//also with the sun: the sky rays that reached the sky (bits 0-8), the sky rays (9-17), the sun rays that reached the sun\r
//(18-24) and the sun rays (25-31). The visibility is hits / rays, exact (or of before, see STALE_COUNT), and trace_main adds the batch of a cell with 1\r
//compare exchange per texel (addPackedBatch in updateSkyVisibilityLightmap.wgsl). Without it a texel is the running average and\r
//the paths as 2 x f16, and the sun is a second word in the second half of lightingBuffer (getSunTexelOffset).\r
//Included by the update and by the resolve (SkyVisibilityLightmap.resolveIncludes)\r
override PACKED_TEXELS : bool = false;\r
\r
const PACKED_SKY_RAYS_SHIFT = 9u;\r
const PACKED_SUN_HITS_SHIFT = 18u;\r
const PACKED_SUN_RAYS_SHIFT = 25u;\r
//the most a field holds. The rays of a texel stop at their cap, which is at most this (getPackedCaps in\r
//updateSkyVisibilityLightmap.wgsl), and the hits are never more than the rays\r
const PACKED_SKY_MAX = 511u;\r
const PACKED_SUN_MAX = 127u;\r
//the bits of the sky fields, which the clear of the sun keeps\r
const PACKED_SKY_MASK = 0x3FFFFu;\r
//the paths a sun ray counts as: the sun count compares with the same thresholds as the sky's (accumulationMax, the\r
//prior, convergedPaths). The sun takes accumulationMax / PACKED_SUN_SCALE rays at most\r
const PACKED_SUN_SCALE = 4u;\r
\r
/*\r
A stale texel: a tile came or went near it since its rays (resetStaleTexel in updateSkyVisibilityLightmap.wgsl), so its\r
visibility is of the buildings of before. It is kept to show until the texel is sampled again, but as STALE_COUNT\r
paths: next to nothing, so the first rays replace it, and where a texel next to it or coarser has rays, the lookup\r
shows those. A texel that is never sampled again (under a building that came) so adds nothing to the pixels around it.\r
Packed, a stale channel has no rays and its visibility in the hits: 1 for 0 up to the most the field holds for 1 (a\r
channel has no hits without rays otherwise). Kept as rays, the old rays stayed in the count for good: 2 of the 127 sun\r
rays lit in a shadow that came with a tile, a dark gray. The f16 texels hold STALE_COUNT as their paths\r
 */\r
const STALE_COUNT = .0625;\r
\r
//the fields of a word: sky hits, sky rays, sun hits, sun rays\r
fn unpackTexelRays(word: u32) -> vec4<u32> {\r
	return vec4(word & PACKED_SKY_MAX, (word >> PACKED_SKY_RAYS_SHIFT) & PACKED_SKY_MAX, (word >> PACKED_SUN_HITS_SHIFT) & PACKED_SUN_MAX, word >> PACKED_SUN_RAYS_SHIFT);\r
}\r
\r
fn packTexelRays(r: vec4<u32>) -> u32 {\r
	return r.x | (r.y << PACKED_SKY_RAYS_SHIFT) | (r.z << PACKED_SUN_HITS_SHIFT) | (r.w << PACKED_SUN_RAYS_SHIFT);\r
}\r
\r
//the visibility and the paths of a channel (its hits and rays, and the most its hits field holds): of its rays, or of\r
//before when it is stale\r
fn decodePackedChannel(hits: f32, rays: f32, hitsMax: f32) -> vec2<f32> {\r
	let stale = vec2(max(hits - 1., 0.) / (hitsMax - 1.), select(0., STALE_COUNT, hits > 0.));\r
	return select(stale, vec2(hits / rays, rays), rays > 0.);\r
}\r
\r
//the visibility and the paths of the sky (xy) and of the sun (zw, its rays times PACKED_SUN_SCALE), as the f16 texels\r
//hold them\r
fn decodePackedTexel(word: u32) -> vec4<f32> {\r
	let r = vec4<f32>(unpackTexelRays(word));\r
	let sun = decodePackedChannel(r.z, r.w, f32(PACKED_SUN_MAX));\r
	return vec4(decodePackedChannel(r.x, r.y, f32(PACKED_SKY_MAX)), sun.x, sun.y * f32(PACKED_SUN_SCALE));\r
}\r
`,mt=`//any hit rays against the buildings of the map for the sky visibility lightmap: whether a ray reaches the sky. The city\r
//buffer of CityScene.ts (see CityTraceBlock in cityLayout.ts), without the ground plane (the rays go up, see\r
//getPathVisibility in updateSkyVisibilityLightmap.wgsl), the hit point, its normal and its surface: the first building\r
//the ray hits ends it. Needs uniforms.cityTileCount and cityRoot, and cityBuffer. Distances in world units\r
\r
//the offset of a ray from the surface it starts on, about 2 cm (a world unit is about 900 m, see MapProjection)\r
const MIN_DIST: f32 = 2e-5;\r
//a child of a node that is a record, and the count of a tree record, see CityTraceBlock in cityLayout.ts\r
const CITY_LEAF = 0x80000000u;\r
const CITY_TREE = 0x80000000u;\r
//the top level BVH (the tiles) and the BVH of a tile (a dense one is about 16 deep) on 1 stack. Only 32 is safe (the\r
//most depth, see BLOCK_DEPTH_MAX and TOP_DEPTH_MAX in cityLayout.ts): a push past the end drops the far child, which\r
//misses its buildings. On real rays of Amsterdam and New York 8 missed 2-3 hits in a million, 16 none, and on an S23\r
//(Adreno) 8 instead of 32 took the frame rate from 47 to 60 fps. A define, not an override (a function scope array\r
//can't have an override size): CityScene.traceDefines, 8 on mobile and 16 elsewhere, fixed when the shaders are made\r
#ifndef CITY_STACK_SIZE\r
#define CITY_STACK_SIZE 16\r
#endif\r
//the changes of CityScene: after the top level BVH (TLAS_NODES_MAX nodes of 4 vec4s), 2 vec4s each\r
const CITY_CHANGE_START = 4096u;\r
\r
//the nodes, records, edges and tree shapes (see CityTraceBlock) are in cityBuffer: array<vec4<f32>>, which the including shader\r
//declares at a binding of its own (updateSkyVisibilityLightmap.wgsl, deferredShading.wgsl)\r
\r
//large instead of infinite for axis aligned rays, so a ray in the plane of a box side gives no NaN\r
fn getInverseDirection(rd: vec3<f32>) -> vec3<f32> {\r
	return select(vec3(-1.), vec3(1.), rd >= vec3(0.)) / max(abs(rd), vec3(1e-8));\r
}\r
\r
//the distances to where the ray enters (x) and leaves (y) the box, x > y when it misses. roInvRd: ro * invRd\r
fn intersectAABB(roInvRd: vec3<f32>, invRd: vec3<f32>, boxMin: vec3<f32>, boxMax: vec3<f32>) -> vec2<f32> {\r
	let t0 = fma(boxMin, invRd, -roInvRd);\r
	let t1 = fma(boxMax, invRd, -roInvRd);\r
	let tNear = min(t0, t1);\r
	let tFar = max(t0, t1);\r
	return vec2(max(max(tNear.x, tNear.y), tNear.z), min(min(tFar.x, tFar.y), tFar.z));\r
}\r
\r
fn cross2(a: vec2<f32>, b: vec2<f32>) -> f32 {\r
	return a.x * b.y - a.y * b.x;\r
}\r
\r
/*\r
whether the ray hits a building: its footprint (with its holes) extruded from its base to its flat roof, see\r
intersectBuilding in cityTrace.wgsl. A wall the ray crosses between the base and the roof ends it in the loop over the\r
edges. Else the point where the ray crosses the plane of the roof (from above) or of the floor (from below) is inside the\r
footprint, even-odd, which takes all edges.\r
r0: the building record (base, top, edgeStart, edgeCount)\r
 */\r
fn hitsBuilding(ro: vec3<f32>, rd: vec3<f32>, r0: vec4<f32>) -> bool {\r
	let base = r0.x;\r
	let top = r0.y;\r
	let edgeStart = bitcast<u32>(r0.z);\r
	let edgeCount = bitcast<u32>(r0.w);\r
\r
	var tCap = -1.;\r
	if(rd.y < 0. && ro.y >= top){\r
		tCap = (top - ro.y) / rd.y;\r
	}else if(rd.y > 0. && ro.y <= base){\r
		tCap = (base - ro.y) / rd.y;\r
	}\r
	let testCap = tCap > MIN_DIST;\r
	let capPoint = ro.xz + rd.xz * tCap;\r
	var inside = false;\r
	for(var i = 0u; i < edgeCount; i++){\r
		let e = cityBuffer[edgeStart + i];\r
		let a = e.xy;\r
		let b = e.zw;\r
		let d = b - a;\r
		let denom = cross2(rd.xz, d);\r
		if(abs(denom) > 1e-20){\r
			let w = a - ro.xz;\r
			let t = cross2(w, d) / denom;\r
			let s = cross2(w, rd.xz) / denom;\r
			if(t > MIN_DIST && s >= 0. && s <= 1.){\r
				let y = ro.y + rd.y * t;\r
				if(y >= base && y <= top){\r
					return true;\r
				}\r
			}\r
		}\r
		if(testCap && (a.y > capPoint.y) != (b.y > capPoint.y)){\r
			let x = a.x + (capPoint.y - a.y) / (b.y - a.y) * d.x;\r
			if(capPoint.x < x){\r
				inside = !inside;\r
			}\r
		}\r
	}\r
	return inside;\r
}\r
\r
/*\r
whether the ray hits a tree: its trunk or its crown, 2 square boxes around the same vertical axis, turned by the same\r
angle (see TraceTree in cityLayout.ts). In the frame of the crown, where it is [-1, 1] in x and z (the trunk [-k, k]) and\r
y stays: the distances along the ray are the same as in the world. Like hitsBuilding a ray that leaves a box from its\r
side or top, or misses it, doesn't hit it: the distance where it leaves has to be over MIN_DIST.\r
r0: the tree record (base, top, shapeStart, CITY_TREE)\r
 */\r
fn hitsTree(ro: vec3<f32>, rd: vec3<f32>, r0: vec4<f32>) -> bool {\r
	let shape = bitcast<u32>(r0.z);\r
	let s0 = cityBuffer[shape];\r
	let s1 = cityBuffer[shape + 1u];\r
	let u = s0.zw;\r
	let v = vec2(-u.y, u.x);\r
	let w = ro.xz - s0.xy;\r
	let p = vec3(dot(w, u), ro.y, dot(w, v));\r
	let d = vec3(dot(rd.xz, u), rd.y, dot(rd.xz, v));\r
	let invD = getInverseDirection(d);\r
	let pInvD = p * invD;\r
	let crownBase = s1.x;\r
	let k = s1.y;\r
	let crown = intersectAABB(pInvD, invD, vec3(-1., crownBase, -1.), vec3(1., r0.y, 1.));\r
	let trunk = intersectAABB(pInvD, invD, vec3(-k, r0.x, -k), vec3(k, crownBase, k));\r
	return (crown.y > MIN_DIST && crown.x <= crown.y) || (trunk.y > MIN_DIST && trunk.x <= trunk.y);\r
}\r
\r
//whether the ray hits the building or tree of a record\r
fn hitsRecord(ro: vec3<f32>, rd: vec3<f32>, record: u32) -> bool {\r
	let r0 = cityBuffer[record];\r
	if(bitcast<u32>(r0.w) == CITY_TREE){\r
		return hitsTree(ro, rd, r0);\r
	}\r
	return hitsBuilding(ro, rd, r0);\r
}\r
\r
//whether the ray hits a building or tree, through the BVH of the tiles and of the buildings in a tile (see CityScene). Any hit\r
//ends it, so there is no closest distance to cull the boxes with. The near child is still visited first: the buildings\r
//nearby hide the most sky\r
fn isOccluded(ro: vec3<f32>, rd: vec3<f32>) -> bool {\r
	if(uniforms.cityTileCount == 0u){\r
		return false;\r
	}\r
	let invRd = getInverseDirection(rd);\r
	let roInvRd = ro * invRd;\r
	var stack: array<u32, CITY_STACK_SIZE>;\r
	var stackSize = 0u;\r
	var node = uniforms.cityRoot;\r
	loop {\r
		let n0 = cityBuffer[node];\r
		let n1 = cityBuffer[node + 1u];\r
		let n2 = cityBuffer[node + 2u];\r
		let n3 = cityBuffer[node + 3u];\r
		let a = bitcast<u32>(n0.w);\r
		let b = bitcast<u32>(n1.w);\r
		let tA = intersectAABB(roInvRd, invRd, n0.xyz, n1.xyz);\r
		let tB = intersectAABB(roInvRd, invRd, n2.xyz, n3.xyz);\r
		var visitA = tA.y >= max(tA.x, 0.);\r
		var visitB = tB.y >= max(tB.x, 0.);\r
		if(visitA && a >= CITY_LEAF){\r
			if(hitsRecord(ro, rd, a & ~CITY_LEAF)){\r
				return true;\r
			}\r
			visitA = false;\r
		}\r
		if(visitB && b >= CITY_LEAF){\r
			if(hitsRecord(ro, rd, b & ~CITY_LEAF)){\r
				return true;\r
			}\r
			visitB = false;\r
		}\r
		if(visitA && visitB){\r
			let aIsNear = tA.x <= tB.x;\r
			node = select(b, a, aIsNear);\r
			if(stackSize < CITY_STACK_SIZE){\r
				stack[stackSize] = select(a, b, aIsNear);\r
				stackSize++;\r
			}\r
			continue;\r
		}\r
		if(visitA || visitB){\r
			node = select(b, a, visitA);\r
			continue;\r
		}\r
		if(stackSize == 0u){\r
			break;\r
		}\r
		stackSize--;\r
		node = stack[stackSize];\r
	}\r
	return false;\r
}\r
`,ta=`//the update of the sky visibility lightmap: claim_main, select_main and trace_main, see SkyVisibilityLightmap.ts.\r
//updateCityLightmap.wgsl with albedo 0: a ray that hits a surface adds nothing, so a texel holds the part of the sky its\r
//point sees, cosine weighted (1 on an open roof, .5 on an open wall). The shading multiplies it by the sky color. So\r
//there is no light that changes, no cached lighting at a ray hit, no sun ray, and 1 any hit ray per path at most.\r
//LIGHTMAP_SUN: the texels hold the sun visibility too, in the second half of lightingBuffer (getSunTexelOffset): of the\r
//sampleCount rays of a cell that traces, sunSampleCount go to points on the disc of the sun instead of the sky (see\r
//trace_main). It depends on the sun, so the host clears that half when the sun moves (SkyVisibilityLightmap.setSun). The\r
//claims go by the fewer paths of the 2\r
//PACKED_TEXELS: a texel is 1 word of ray counts instead, with the sun in it too, see skyVisibilityTexel.wgsl and\r
//addPackedBatch\r
//Charts of cityLightmapSurface.wgsl, rays of skyVisibilityTrace.wgsl\r
\r
override WORK_GROUP_SIZE_X: u32;\r
override WORK_GROUP_SIZE_Y: u32;\r
override CELL_SIZE: u32;\r
//the threads of a workgroup of trace_main\r
override TRACE_GROUP_SIZE: u32;\r
//the texels hold the sun visibility too, see the top\r
override LIGHTMAP_SUN: bool = false;\r
\r
struct Uniforms {\r
	resolution : vec2<f32>,\r
	inverseProjection : mat4x4<f32>,\r
	inverseView : mat4x4<f32>,\r
	viewProjection : mat4x4<f32>,\r
	cameraPosition : vec3<f32>,\r
	frame : u32,\r
	//the world size of a reference pixel at distance 1 (1920 x 1080 pixel count, see SkyVisibilityLightmap.getPixelScale)\r
	pixelSize : f32,\r
	//screen pixels per reference pixel along a side\r
	pixelScale : f32,\r
	//lightmap texels per screen pixel, along a side\r
	texelsPerPixel : f32,\r
	//the size of the level 0 texels, in world units\r
	texelSizeMin : f32,\r
	//how much the texels grow at a grazing view angle, see getLevel\r
	levelAngle : f32,\r
	//the tilt shift blur: its sigma in pixels at |ndc y| = 1 and at most, 0 without blur. See getBlurPixels\r
	blurSlope : f32,\r
	blurMax : f32,\r
	//texels per blur sigma, see getLevel\r
	blurTexelScale : f32,\r
	//the tiles of the top level BVH and its root, see CityScene.update\r
	cityTileCount : u32,\r
	cityRoot : u32,\r
	sampleCount : u32,\r
	//the paths the running average of a texel holds, see addTexelSample\r
	accumulationMax : f32,\r
	//coarser levels that accumulate the samples too, at most ANCESTOR_LEVELS_MAX\r
	ancestorLevels : u32,\r
	//the paths of the coarser visibility a new texel starts with\r
	seedCount : f32,\r
	//the frames a tile has to be unused before another one can take its place, when there is no empty slot\r
	evictFrames : u32,\r
	searchCount : u32,\r
	//the threads of trace_main per cell, a divisor of TRACE_GROUP_SIZE\r
	traceLanes : u32,\r
	//the most cells that trace in a frame, see select_main\r
	traceCellsMax : u32,\r
	//the boxes where tiles came or went (in cityBuffer), and the latest frame of them, 0 when none. See getChangeFrames\r
	changeCount : u32,\r
	changeEnd : u32,\r
	//the paths from which a texel no longer counts in traceArgs[6], see select_main\r
	convergedPaths : f32,\r
	//the step of the wall atlas positions in the gBuffer, see MapGBuffer.atlasStep\r
	atlasStep : f32,\r
	//see getGBufferDistance\r
	depthParams : vec2<f32>,\r
	//LIGHTMAP_SUN: toward the sun, the angular radius of its disc (radians), and how many of the sampleCount rays of a cell\r
	//go to the sun while the sky takes samples too, see trace_main\r
	sunDirection : vec3<f32>,\r
	sunRadius : f32,\r
	sunSampleCount : u32,\r
	//and for a texel in a penumbra (its sun visibility between 0 and 1 so far), see trace_main\r
	sunSampleCountPenumbra : u32,\r
}\r
\r
const ANCESTOR_LEVELS_MAX = 4u;\r
//the offset of the origin of a sun ray from its surface along the normal, times the camera distance, as the ray traced\r
//shadows of deferredShading.wgsl\r
const SUN_RAY_BIAS = 1e-4;\r
const TAU : f32 = 6.28318530718;\r
//a path that goes down is mirrored up, see getPathRay. false: it is 0 without a ray. With PACKED_TEXELS, which counts\r
//whole hits, only on a wall: a folded path weighs .5 there, so its ray counts as 2 paths (see trace_main)\r
override FOLD_DOWN_PATHS: bool = true;\r
//PACKED_TEXELS: the most rays of a cell to the sun while only the sun takes samples (after it moved). They are all from\r
//1 pixel, and what varies in a texel is where the pixel is: not the up to tailSampleCountMax rays a cell has in the\r
//tail of the convergence\r
const PACKED_SUN_RAYS_MAX = 16u;\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
//per tile slot: the checksum of the tile, 0 when empty\r
@group(0) @binding(1) var<storage, read_write> tileBuffer : array<atomic<u32>>;\r
//the frame a tile was last used in\r
@group(0) @binding(2) var<storage, read_write> tileTimeBuffer : array<atomic<u32>>;\r
//per tile slot TILE_SIZE x TILE_SIZE texels: the visibility and the paths it holds, as 2 x f16 in 1 word. See\r
//addTexelSample\r
@group(0) @binding(3) var<storage, read_write> lightingBuffer : array<atomic<u32>>;\r
//the slots in use, for the log\r
@group(0) @binding(4) var<storage, read_write> tileCount : atomic<u32>;\r
//the gBuffer of MapWorld (see MapGBuffer.ts): its 2 targets and its depth, see mapGBufferPacking.wgsl\r
@group(0) @binding(6) var gBufferTexture: texture_2d<u32>;\r
@group(0) @binding(5) var gBufferAtlasTexture: texture_2d<u32>;\r
@group(0) @binding(9) var gBufferDepth: texture_depth_2d;\r
//a tiling 2 channel blue noise texture, see getBlueNoise\r
@group(0) @binding(8) var blueNoiseTexture: texture_2d<f32>;\r
//the buildings the rays hit, see CityScene and skyVisibilityTrace.wgsl\r
@group(0) @binding(7) var<storage, read> cityBuffer : array<vec4<f32>>;\r
//per texel: the highest bid of the cells that sample it this frame, see claim_main\r
@group(0) @binding(11) var<storage, read_write> claimBuffer : array<atomic<u32>>;\r
//first the cells that won the bid of their texel (x | y << 16), then per cell the texel it bids on, see getCellTexelSlot\r
@group(0) @binding(12) var<storage, read_write> traceCells : array<u32>;\r
//the workgroups of trace_main (x, y, z), the count of traceCells, in 4 and 5 the cells that won a bid in the even\r
//and the odd frames, and in 6 the ones of them whose texel has less than convergedPaths paths. 7 is unused\r
@group(0) @binding(13) var<storage, read_write> traceArgs : array<atomic<u32>, 8>;\r
\r
//whether a ray from p to a point on the disc of the sun can pass through a box: the buildings in it can be in front of\r
//the sun there. The box as wide as the disc at the farthest such a ray can enter it, under its top\r
fn sunPassesBox(p: vec3<f32>, boxMin: vec3<f32>, boxMax: vec3<f32>) -> bool {\r
	let l = uniforms.sunDirection;\r
	if(l.y <= 0.){\r
		return false;\r
	}\r
	let margin = uniforms.sunRadius * max(boxMax.y - p.y, 0.) / l.y;\r
	let inverse = 1. / select(l, vec3(1e-6), abs(l) < vec3(1e-6));\r
	let t0 = (boxMin - margin - p) * inverse;\r
	let t1 = (boxMax + margin - p) * inverse;\r
	let near = min(t0, t1);\r
	let far = max(t0, t1);\r
	return max(max(near.x, near.y), max(near.z, 0.)) <= min(far.x, min(far.y, far.z));\r
}\r
\r
/*\r
the latest frame a tile came or went in that changed the sky visibility at p (x) and its sun visibility (y, with\r
LIGHTMAP_SUN), 0 when none did: the visibility sampled before that frame has the buildings of before. See CityScene: a\r
change is the box of the buildings of the tile and its reach. The sky changes within the reach around the box. The sun\r
changes where a ray to it passes the box, however far: at a sunset the shadows are 10x as long as the buildings are\r
high. With the reach for both, the ground a tile away kept the sun it got before the tile with the tower came.\r
after: only the changes later than this frame, the others are not tested (the texels at p were sampled since)\r
 */\r
fn getChangeFrames(p: vec3<f32>, after: u32) -> vec2<u32> {\r
	var frames = vec2(0u);\r
	for(var i = 0u; i < uniforms.changeCount; i++){\r
		let a = cityBuffer[CITY_CHANGE_START + i * 2u];\r
		let frame = bitcast<u32>(a.w);\r
		if(frame <= after){\r
			continue;\r
		}\r
		let b = cityBuffer[CITY_CHANGE_START + i * 2u + 1u];\r
		if(all(p >= a.xyz - vec3(b.w, 0., b.w)) && all(p <= b.xyz + b.w)){\r
			frames.x = max(frames.x, frame);\r
		}\r
		if(LIGHTMAP_SUN && sunPassesBox(p, a.xyz, b.xyz)){\r
			frames.y = max(frames.y, frame);\r
		}\r
	}\r
	return frames;\r
}\r
\r
//the tile is used this frame. No light that changes, so no ageing of a tile that comes back in view, see\r
//updateCityLightmap.wgsl\r
fn markUsed(index: u32, frame: u32) {\r
	atomicMax(&tileTimeBuffer[index], frame);\r
}\r
\r
//the slots from its first one a new tile can take the place of an unused tile in, while there still is an empty slot\r
//further on. See findOrInsert in updateVirtualLightmap.wgsl\r
const EVICT_NEAR = 4u;\r
\r
//the slot of a tile, inserted when it is not there: see findOrInsert in updateVirtualLightmap.wgsl\r
fn findOrInsert(surface: u32, level: u32, tile: vec2<u32>, stamp: u32) -> u32 {\r
	let keySlot = getTileKey(surface, level, tile);\r
	let key = keySlot.x;\r
	let frame = uniforms.frame;\r
	var index = keySlot.y;\r
	var i = 0u;\r
	for(; i < uniforms.searchCount; i++){\r
		let existing = atomicLoad(&tileBuffer[index]);\r
		if(existing == key){\r
			markUsed(index, stamp);\r
			return index;\r
		}\r
		if(existing == 0u){\r
			break;\r
		}\r
		index = (index + 1u) % TILE_COUNT;\r
	}\r
\r
	let near = min(EVICT_NEAR, uniforms.searchCount);\r
	var evictIndex = TILE_NONE;\r
	var evictKey = 0u;\r
	if(i >= near){\r
		var evictAge = uniforms.evictFrames;\r
		let scanCount = select(near, uniforms.searchCount, i >= uniforms.searchCount);\r
		var scanIndex = keySlot.y;\r
		for(var s = 0u; s < scanCount; s++){\r
			if(evictIndex != TILE_NONE && s == near){\r
				break;\r
			}\r
			let existing = atomicLoad(&tileBuffer[scanIndex]);\r
			if(existing == key){\r
				markUsed(scanIndex, stamp);\r
				return scanIndex;\r
			}\r
			if(existing != 0u){\r
				let age = frame - min(atomicLoad(&tileTimeBuffer[scanIndex]), frame);\r
				if(age > evictAge){\r
					evictAge = age;\r
					evictIndex = scanIndex;\r
					evictKey = existing;\r
				}\r
			}\r
			scanIndex = (scanIndex + 1u) % TILE_COUNT;\r
		}\r
	}\r
\r
	if(evictIndex != TILE_NONE){\r
		for(var j = 0u; j < 4u; j++){\r
			let cmp = atomicCompareExchangeWeak(&tileBuffer[evictIndex], evictKey, key);\r
			if(cmp.exchanged){\r
				markUsed(evictIndex, stamp);\r
				let start = evictIndex * TILE_SIZE * TILE_SIZE;\r
				for(var t = 0u; t < TILE_SIZE * TILE_SIZE; t++){\r
					atomicStore(&lightingBuffer[start + t], 0u);\r
					if(LIGHTMAP_SUN && !PACKED_TEXELS){\r
						atomicStore(&lightingBuffer[start + t + getSunTexelOffset()], 0u);\r
					}\r
				}\r
				return evictIndex;\r
			}\r
			if(cmp.old_value == key){\r
				markUsed(evictIndex, stamp);\r
				return evictIndex;\r
			}\r
			if(cmp.old_value != evictKey){\r
				break;\r
			}\r
		}\r
	}\r
\r
	for(; i < uniforms.searchCount; i++){\r
		let cmp = atomicCompareExchangeWeak(&tileBuffer[index], 0u, key);\r
		if(cmp.exchanged){\r
			atomicAdd(&tileCount, 1u);\r
		}\r
		if(cmp.exchanged || cmp.old_value == key){\r
			markUsed(index, stamp);\r
			return index;\r
		}\r
		if(cmp.old_value != 0u){\r
			index = (index + 1u) % TILE_COUNT;\r
		}\r
	}\r
	return TILE_NONE;\r
}\r
\r
fn find(surface: u32, level: u32, tile: vec2<u32>) -> u32 {\r
	let keySlot = getTileKey(surface, level, tile);\r
	let key = keySlot.x;\r
	var index = keySlot.y;\r
	for(var i = 0u; i < uniforms.searchCount; i++){\r
		let existing = atomicLoad(&tileBuffer[index]);\r
		if(existing == key){\r
			return index;\r
		}\r
		if(existing == 0u){\r
			return TILE_NONE;\r
		}\r
		index = (index + 1u) % TILE_COUNT;\r
	}\r
	return TILE_NONE;\r
}\r
\r
//the pixel a cell samples this frame and the surface point it shows. valid is false for the sky and outside the screen\r
struct CellPoint {\r
	valid : bool,\r
	coord : vec2<u32>,\r
	worldPosition : vec3<f32>,\r
	n : vec3<f32>,\r
	surface : Surface,\r
}\r
\r
//the visibility (x) and the paths it holds (y) of a texel\r
fn loadTexel(index: u32) -> vec2<f32> {\r
	if(PACKED_TEXELS){\r
		return decodePackedTexel(atomicLoad(&lightingBuffer[index])).xy;\r
	}\r
	return unpack2x16float(atomicLoad(&lightingBuffer[index]));\r
}\r
\r
//the sun visibility (x) and the paths it holds (y) of a texel, LIGHTMAP_SUN\r
fn loadSunTexel(index: u32) -> vec2<f32> {\r
	if(PACKED_TEXELS){\r
		return decodePackedTexel(atomicLoad(&lightingBuffer[index])).zw;\r
	}\r
	return unpack2x16float(atomicLoad(&lightingBuffer[index + getSunTexelOffset()]));\r
}\r
\r
//the paths of a texel the claims go by: with the sun the fewer of the sky's and the sun's\r
fn getTexelCount(index: u32) -> f32 {\r
	if(PACKED_TEXELS){\r
		//1 load for both\r
		let t = decodePackedTexel(atomicLoad(&lightingBuffer[index]));\r
		return select(t.y, min(t.y, t.w), LIGHTMAP_SUN);\r
	}\r
	let count = loadTexel(index).y;\r
	if(LIGHTMAP_SUN){\r
		return min(count, loadSunTexel(index).y);\r
	}\r
	return count;\r
}\r
\r
//the tries of addTexelSample, against the other cells that add to the texel (the coarser texels are shared)\r
const TEXEL_CAS_TRIES = 64u;\r
\r
//adds a sample to a texel and returns the texel. index: of the sky texel, or + getSunTexelOffset() of the sun one. The texel is 1 word, so a compare exchange replaces the lock of\r
//updateCityLightmap.wgsl. A new texel starts from prior, the texel of the level above, as at most seedCount paths.\r
//weight: the paths the sample is the average of. The count is capped at countMax\r
fn addTexelSample(index: u32, visibility: f32, weight: f32, prior: vec2<f32>, countMax: f32) -> vec2<f32> {\r
	let texelWord = &lightingBuffer[index];\r
	var old = atomicLoad(texelWord);\r
	var result = prior;\r
	for(var i = 0u; i < TEXEL_CAS_TRIES; i++){\r
		var texel = unpack2x16float(old);\r
		if(texel.y == 0. && prior.y > 0.){\r
			texel = vec2(prior.x, min(prior.y, uniforms.seedCount));\r
		}\r
		texel = vec2(mix(texel.x, visibility, weight / (texel.y + weight)), min(texel.y + weight, countMax));\r
		let cmp = atomicCompareExchangeWeak(texelWord, old, pack2x16float(texel));\r
		if(cmp.exchanged){\r
			result = texel;\r
			break;\r
		}\r
		old = cmp.old_value;\r
	}\r
	return result;\r
}\r
\r
//2 uniform random numbers for sample index of the seed, see getBlueNoise in pathTrace.wgsl of the irradiance cache\r
fn getBlueNoise(coord: vec2<u32>, index: u32, dimension: u32) -> vec2<f32> {\r
	let size = textureDimensions(blueNoiseTexture);\r
	let offset = vec2<u32>(getR2(dimension + 1u) * vec2<f32>(size));\r
	let start = textureLoad(blueNoiseTexture, (coord + offset) % size, 0).xy;\r
	return fract(start + getR2(index));\r
}\r
\r
//the paths the texel took, see getTexelPathIndex. -1: none, the paths are numbered by the frame\r
var<private> pathIndex: i32 = -1;\r
\r
fn cosWeightedRandomHemisphereDirection(n: vec3<f32>, r: vec2<f32>) -> vec3<f32> {\r
	let uu = normalize(cross(n, select(vec3(0., 1., 0.), vec3(1., 0., 0.), abs(n.y) > .5)));\r
	let vv = cross(uu, n);\r
	let ra = sqrt(r.y);\r
	let rx = ra * cos(TAU * r.x);\r
	let ry = ra * sin(TAU * r.x);\r
	let rz = sqrt(1. - r.y);\r
	return normalize(rx * uu + ry * vv + rz * n);\r
}\r
\r
/*\r
the visibility of path i of the sampleCount paths of a texel: 0 or the weight of a ray in a cosine weighted direction\r
around n that reaches the sky. A ray down from a point above the ground ends on the ground or on a building, which add\r
nothing, so it needs no ray. With FOLD_DOWN_PATHS it is mirrored up (y = -y) instead: the pdf of a direction d that\r
goes up is then p(d) + p(m(d)), with p the cosine pdf and m the mirror, so the path weighs p(d) / (p(d) + p(m(d))).\r
That is .5 on a wall (its lobe is symmetric in y) and 1 on a roof, exact for any normal. A wall then traces twice the\r
rays for a visibility of 0 or .5 instead of 0 or 1 per path: less noise per path, a lot less on a wall that sees much sky\r
 */\r
//the direction (xyz) and the weight (w) of path i: the ray reaches the sky or it is 0. weight 0: no ray needed.\r
//PACKED_TEXELS: only a wall folds (n: its normal without y), with weight 1: a hit in the 2 paths the ray counts as\r
fn getPathRay(n: vec3<f32>, seed: vec2<u32>, i: u32, sampleCount: u32, wall: bool) -> vec4<f32> {\r
	//the paths of the texel so far: its sequence without gaps, also when sampleCount changes between frames\r
	let index = select(uniforms.frame * sampleCount, u32(pathIndex), pathIndex >= 0) + i;\r
	let fold = FOLD_DOWN_PATHS && (wall || !PACKED_TEXELS);\r
	var r = getBlueNoise(seed, index, 0u);\r
	if(fold && PACKED_TEXELS){\r
		//the half of the lobe that goes up (its angle is TAU * r.x, from the horizontal tangent of a wall), so the rays\r
		//are spread as their numbers are. Mirrored (abs below), the rays of the 2 halves fell next to each other\r
		r.x *= .5;\r
	}\r
	var rd = cosWeightedRandomHemisphereDirection(n, r);\r
	var weight = 1.;\r
	if(fold){\r
		rd.y = abs(rd.y);\r
		if(!PACKED_TEXELS){\r
			let cosine = max(dot(n, rd), 0.);\r
			let mirrored = max(dot(n, vec3(rd.x, -rd.y, rd.z)), 0.);\r
			weight = cosine / max(cosine + mirrored, 1e-20);\r
		}\r
	}else if(rd.y < 0.){\r
		weight = 0.;\r
	}\r
	return vec4(rd, weight);\r
}\r
\r
//the direction of sun ray index of a texel (the sun rays it took before, see sunIndex of trace_main): toward a point on\r
//the disc of the sun, sunRadius around sunDirection, from the blue noise of the texel moved along the R2 sequence\r
//(another dimension than the sky paths). It reaches the sun or it is 0\r
fn getSunRay(seed: vec2<u32>, index: u32) -> vec3<f32> {\r
	let l = uniforms.sunDirection;\r
	let r = getBlueNoise(seed, index, 1u);\r
	let t = normalize(cross(l, select(vec3(0., 1., 0.), vec3(1., 0., 0.), abs(l.y) > .5)));\r
	let b = cross(l, t);\r
	//uniform on the disc. Small angles: the tangent offset is the angle\r
	let radius = uniforms.sunRadius * sqrt(r.x);\r
	let phi = TAU * r.y;\r
	return normalize(l + (t * cos(phi) + b * sin(phi)) * radius);\r
}\r
\r
fn getCellPoint(cellID: vec2<u32>) -> CellPoint {\r
	var point: CellPoint;\r
	point.valid = false;\r
	let rand = hash34uf(vec3<u32>(cellID, uniforms.frame)).zw;\r
	//a random pixel in the cell, the same one in every pass of the frame\r
	point.coord = cellID * CELL_SIZE + vec2<u32>(rand * f32(CELL_SIZE));\r
	if(point.coord.x >= u32(uniforms.resolution.x) || point.coord.y >= u32(uniforms.resolution.y)){\r
		return point;\r
	}\r
	let g0 = textureLoad(gBufferTexture, point.coord, 0).xy;\r
	point.surface = Surface(g0.x, vec2(0.));\r
	if(g0.x == SURFACE_NONE){\r
		return point;\r
	}\r
	let g = vec3(g0, textureLoad(gBufferAtlasTexture, point.coord, 0).x);\r
	point.n = getGBufferNormal(g);\r
	let uv = (vec2<f32>(point.coord) + .5) / uniforms.resolution;\r
	let d = getGBufferDistance(textureLoad(gBufferDepth, point.coord, 0), uv, uniforms.inverseProjection, uniforms.depthParams);\r
	point.worldPosition = depthToPosition(d, uv * 2. - 1.);\r
	point.surface = getGBufferSurface(g, point.worldPosition, uniforms.atlasStep);\r
	point.valid = true;\r
	return point;\r
}\r
\r
//the texels of the point of a cell at its level and the coarser ones, TILE_NONE where the lightmap is full.\r
//insert: claim_main adds the tiles that don't exist yet and marks them used, trace_main only finds them\r
fn getCellTexels(point: CellPoint, insert: bool) -> array<u32, ANCESTOR_LEVELS_MAX + 1u> {\r
	let level = u32(getLevel(point.worldPosition, point.n));\r
	var indices: array<u32, ANCESTOR_LEVELS_MAX + 1u>;\r
	for(var i = 0u; i <= ANCESTOR_LEVELS_MAX; i++){\r
		indices[i] = TILE_NONE;\r
	}\r
	for(var i = 0u; i <= min(uniforms.ancestorLevels, ANCESTOR_LEVELS_MAX); i++){\r
		let texel = getTexel(point.surface, level + i);\r
		var tileIndex: u32;\r
		if(insert){\r
			tileIndex = findOrInsert(point.surface.id, level + i, texel / TILE_SIZE, uniforms.frame);\r
		}else{\r
			tileIndex = find(point.surface.id, level + i, texel / TILE_SIZE);\r
		}\r
		indices[i] = select(getTexelIndex(tileIndex, texel), TILE_NONE, tileIndex == TILE_NONE);\r
	}\r
	return indices;\r
}\r
\r
//the seed of the random numbers of the paths of a texel: its place in the lightmap, see updateVirtualLightmap.wgsl\r
fn getTexelSeed(texelIndex: u32) -> vec2<u32> {\r
	let t = vec2(texelIndex % TILE_SIZE, (texelIndex / TILE_SIZE) % TILE_SIZE);\r
	let tile = texelIndex / (TILE_SIZE * TILE_SIZE);\r
	return t + vec2(tile % 32u, tile / 32u) * TILE_SIZE;\r
}\r
\r
//the paths a texel took, so it walks its R2 sequence without gaps. -1 when its count is at its cap\r
fn getTexelPathIndex(texelIndex: u32) -> i32 {\r
	let count = loadTexel(texelIndex).y;\r
	if(count + f32(uniforms.sampleCount) > uniforms.accumulationMax){\r
		return -1;\r
	}\r
	return i32(count);\r
}\r
\r
//the slot in traceCells of the texel a cell bids on: after the slots of the cells that trace\r
fn getCellTexelSlot(cellID: vec2<u32>) -> u32 {\r
	let groupSize = vec2(WORK_GROUP_SIZE_X, WORK_GROUP_SIZE_Y) * CELL_SIZE;\r
	let cellCount = (vec2<u32>(uniforms.resolution) + groupSize - 1u) / groupSize * vec2(WORK_GROUP_SIZE_X, WORK_GROUP_SIZE_Y);\r
	return cellCount.x * cellCount.y + cellID.y * cellCount.x + cellID.x;\r
}\r
\r
//the bits of a claim below the frame, and the mask of the frame: 20 bits, so it wraps after 4.8 hours at 60 fps\r
const CLAIM_FRAME_SHIFT = 12u;\r
const CLAIM_FRAME_MASK = 0xFFFFFu;\r
\r
//the frame in the high bits, so a claim of an earlier frame never wins, random below it\r
fn getClaimKey(cellID: vec2<u32>) -> u32 {\r
	let frame = uniforms.frame;\r
	return (frame << CLAIM_FRAME_SHIFT) | (tileHash(cellID.x ^ tileHash(cellID.y ^ tileHash(frame))) & ((1u << CLAIM_FRAME_SHIFT) - 1u));\r
}\r
\r
//the frame a texel was last sampled in, 0 when never: the frame part of its claim, see claim_main\r
fn getLastSampled(index: u32) -> u32 {\r
	let frame = uniforms.frame;\r
	let claim = atomicLoad(&claimBuffer[index]);\r
	if(claim == 0u){\r
		return 0u;\r
	}\r
	return frame - ((frame - (claim >> CLAIM_FRAME_SHIFT)) & CLAIM_FRAME_MASK);\r
}\r
\r
/*\r
a tile came or went since the texel was last sampled that changed its sky visibility or its sun visibility\r
(changeFrames, see getChangeFrames): that visibility is of the buildings of before. It turns stale (STALE_COUNT in\r
skyVisibilityTexel.wgsl): kept to show, without paths, so the texel is no longer resolved, the cell bids on it and its\r
next rays replace it.\r
The frame part of claimBuffer is when the texel was last sampled, see resetStaleTexel in updateCityLightmap.wgsl.\r
Called for the texels of a cell, by claim_main. Returns whether this call made the texel stale: 1 of the cells that\r
share it\r
 */\r
fn resetStaleTexel(index: u32, changeFrames: vec2<u32>) -> bool {\r
	let lastSampled = getLastSampled(index);\r
	let sky = lastSampled < changeFrames.x;\r
	let sun = LIGHTMAP_SUN && lastSampled < changeFrames.y;\r
	if(!sky && !sun){\r
		return false;\r
	}\r
	if(PACKED_TEXELS){\r
		return setPackedTexelStale(index, sky, sun);\r
	}\r
	var changed = false;\r
	if(sky){\r
		changed = setTexelStale(index);\r
	}\r
	if(sun){\r
		changed = setTexelStale(index + getSunTexelOffset()) || changed;\r
	}\r
	return changed;\r
}\r
\r
/*\r
The texels around the one of a surface point at a level that are stale too, when that one was (resetStaleTexel). The\r
lookup of a pixel blends the 4 texels around its point, and 1 of them can be under a building that came: no pixel shows\r
it, so no cell ever resets it, and it kept the sky and the sun of the open ground with all its paths. That lit the\r
pixels along the foot of the building\r
 */\r
fn resetStaleNeighbours(surface: Surface, level: u32, changeFrames: vec2<u32>) {\r
	let texel = vec2<i32>(getTexel(surface, level));\r
	let centerTile = vec2<u32>(texel) / TILE_SIZE;\r
	let centerIndex = find(surface.id, level, centerTile);\r
	for(var y = -1; y <= 1; y++){\r
		for(var x = -1; x <= 1; x++){\r
			if(x == 0 && y == 0){\r
				continue;\r
			}\r
			let neighbour = vec2<u32>(texel + vec2(x, y));\r
			let tile = neighbour / TILE_SIZE;\r
			var tileIndex = centerIndex;\r
			if(any(tile != centerTile)){\r
				tileIndex = find(surface.id, level, tile);\r
			}\r
			if(tileIndex != TILE_NONE){\r
				resetStaleTexel(getTexelIndex(tileIndex, neighbour), changeFrames);\r
			}\r
		}\r
	}\r
}\r
\r
//the texel word at index (a sky or a sun texel of 2 x f16) stale: its visibility kept as STALE_COUNT paths. Returns\r
//whether it had more\r
fn setTexelStale(index: u32) -> bool {\r
	let texelWord = &lightingBuffer[index];\r
	var old = atomicLoad(texelWord);\r
	for(var i = 0u; i < TEXEL_CAS_TRIES; i++){\r
		let v = unpack2x16float(old);\r
		if(v.y <= STALE_COUNT){\r
			return false;\r
		}\r
		let cmp = atomicCompareExchangeWeak(texelWord, old, pack2x16float(vec2(v.x, STALE_COUNT)));\r
		if(cmp.exchanged){\r
			return true;\r
		}\r
		old = cmp.old_value;\r
	}\r
	return false;\r
}\r
\r
//the fields of a packed count (rays, hits) scaled down to rays rayMax at most, the visibility kept (rounded)\r
fn capPackedChannel(hitsRays: vec2<u32>, rayMax: u32) -> vec2<u32> {\r
	if(hitsRays.y <= rayMax){\r
		return hitsRays;\r
	}\r
	let hits = u32(round(f32(hitsRays.x) * f32(rayMax) / f32(hitsRays.y)));\r
	return vec2(min(hits, rayMax), rayMax);\r
}\r
\r
//a packed channel (hits, rays) as stale: no rays, its visibility in the hits, 1 to hitsMax (see STALE_COUNT in\r
//skyVisibilityTexel.wgsl). One without rays stays as it is: empty, or stale already\r
fn getStaleChannel(hitsRays: vec2<u32>, hitsMax: u32) -> vec2<u32> {\r
	if(hitsRays.y == 0u){\r
		return hitsRays;\r
	}\r
	return vec2(1u + u32(round(f32(hitsRays.x) * f32(hitsMax - 1u) / f32(hitsRays.y))), 0u);\r
}\r
\r
//the rays of a packed channel (hits, rays) to add to: none when it is stale or empty, the visibility of a stale one\r
//goes with its first rays\r
fn getPackedRays(hitsRays: vec2<u32>) -> vec2<u32> {\r
	return select(vec2(0u), hitsRays, hitsRays.y > 0u);\r
}\r
\r
//setTexelStale of a packed texel (PACKED_TEXELS): its sky and its sun channel, each when asked. Returns whether it\r
//had rays there. Rare, so a compare exchange\r
fn setPackedTexelStale(index: u32, sky: bool, sun: bool) -> bool {\r
	let texelWord = &lightingBuffer[index];\r
	var old = atomicLoad(texelWord);\r
	for(var i = 0u; i < TEXEL_CAS_TRIES; i++){\r
		var r = unpackTexelRays(old);\r
		if(sky){\r
			r = vec4(getStaleChannel(r.xy, PACKED_SKY_MAX), r.zw);\r
		}\r
		if(sun){\r
			r = vec4(r.xy, getStaleChannel(r.zw, PACKED_SUN_MAX));\r
		}\r
		let stale = packTexelRays(r);\r
		if(stale == old){\r
			return false;\r
		}\r
		let cmp = atomicCompareExchangeWeak(texelWord, old, stale);\r
		if(cmp.exchanged){\r
			return true;\r
		}\r
		old = cmp.old_value;\r
	}\r
	return false;\r
}\r
\r
//PACKED_TEXELS: the sky rays (x) and the sun rays (y) a texel takes at most. accumulationMax (the host keeps it at most\r
//PACKED_ACCUMULATION_MAX and a multiple of PACKED_SUN_SCALE, see SkyVisibilityLightmap.getAccumulationMax), so both fit\r
//their field\r
fn getPackedCaps() -> vec2<u32> {\r
	let skyCap = u32(uniforms.accumulationMax);\r
	return vec2(skyCap, skyCap / PACKED_SUN_SCALE);\r
}\r
\r
//a channel of a texel (hits, rays) after a batch: as it was when it is full (its rays at the cap), else with the batch,\r
//scaled down to the room under the cap. A channel without rays starts from the coarser texel (prior) as at most\r
//seedMax rays, as addTexelSample, and a stale one loses its visibility of before (getPackedRays)\r
fn addPackedSky(texel: vec2<u32>, batch: vec2<u32>, prior: vec2<u32>, cap: u32, seedMax: u32) -> vec2<u32> {\r
	if(batch.y == 0u || texel.y >= cap){\r
		return texel;\r
	}\r
	var add = batch;\r
	if(texel.y == 0u){\r
		add += capPackedChannel(getPackedRays(prior), seedMax);\r
	}\r
	return getPackedRays(texel) + capPackedChannel(add, cap - texel.y);\r
}\r
\r
//a texel with sun rays that reached the sun and ones that didn't: in a penumbra, or on the edge of a shadow\r
fn isPenumbra(sun: vec2<u32>) -> bool {\r
	return sun.x > 0u && sun.x < sun.y;\r
}\r
\r
/*\r
The sun fields (hits, rays) of a texel after the sun rays of a batch (its hits and rays as they were traced), see\r
trace_main for why. While all the sun rays of a texel agree it is most likely fully lit or fully in shadow, and a ray\r
counts as weight rays: the count goes up as the one of the sky does, and stops at the cap after a quarter or an eighth\r
of the rays. The first batch that disagrees shows it is in a penumbra: its count goes back to the rays that were traced\r
(/ weight: they all agreed, so the visibility is kept exactly), also when it was full, and from then on a ray counts\r
once, up to the cap in rays that were traced.\r
A texel without rays starts from the coarser one (prior) as at most seedMax rays, as addPackedSky: under a coarser\r
texel in a penumbra it mostly starts as one. Tried and not kept: a ray that also counts once while the coarser texel\r
is in a penumbra (it gets the rays of all the cells in it, so it knows first). The same noise, 1 more frame of 240\r
 */\r
fn addPackedSun(texel: vec2<u32>, batch: vec2<u32>, weight: u32, prior: vec2<u32>, cap: u32, seedMax: u32) -> vec2<u32> {\r
	if(batch.y == 0u){\r
		return texel;\r
	}\r
	var t = texel;\r
	if(t.y == 0u){\r
		//a stale one loses its visibility of before\r
		t = capPackedChannel(getPackedRays(prior), seedMax);\r
	}\r
	var add = batch;\r
	if(!isPenumbra(t)){\r
		//an empty texel agrees with a batch that agrees with itself\r
		let agrees = (batch.x == 0u && t.x == 0u) || (batch.x == batch.y && t.x == t.y);\r
		if(agrees){\r
			add = batch * weight;\r
		}else if(!agrees && t.y > 0u){\r
			let rays = max((t.y + weight / 2u) / weight, 1u);\r
			t = vec2(select(0u, rays, t.x > 0u), rays);\r
		}\r
	}\r
	if(t.y >= cap){\r
		return t;\r
	}\r
	return t + capPackedChannel(add, cap - t.y);\r
}\r
\r
/*\r
PACKED_TEXELS: adds the batch of a cell (its sky hits and paths, its sun hits and rays, and the rays a sun ray counts\r
as, see addPackedSun) to its texel and the coarser ones above it, 1\r
compare exchange per texel (more when another cell added in between). A texel with both channels full gets no atomic at\r
all, only the load. The rays of a channel never go over its cap (addPackedSky, addPackedSun), and the exchange only goes in on the\r
word the add was made for, so a field never overflows into the next one, whatever the size of the batch.\r
Not an atomicAdd that subtracts itself again when it went over: the coarser texels get the batches of many cells in the\r
same frame, and an add that read the word while another one had wrapped a field (before that one's subtract) saw a\r
small count and kept its batch. The sum stayed over the field, carried into the next one: hits above rays, a texel too\r
bright or too dark for good (the spots on the walls). dawn.node, RTX 3080, 4K Very High, Amsterdam: 433 such reads in\r
the first 50 frames (most with fresh coarse texels), 100 texels with hits > rays after converging, and\r
the rest wrong without showing it. The compare exchange made the trace pass no slower\r
 */\r
fn addPackedBatch(indices: array<u32, ANCESTOR_LEVELS_MAX + 1u>, levels: u32, batch: vec4<u32>, sunWeight: u32) {\r
	let caps = getPackedCaps();\r
	let seedMax = vec2(u32(uniforms.seedCount), max(u32(uniforms.seedCount) / PACKED_SUN_SCALE, 1u));\r
	//the coarser texel after the batch, for the seed\r
	var prior = vec4(0u);\r
	for(var i = i32(levels); i >= 0; i--){\r
		let index = indices[i];\r
		if(index == TILE_NONE){\r
			continue;\r
		}\r
		let texelWord = &lightingBuffer[index];\r
		var old = atomicLoad(texelWord);\r
		var texel = unpackTexelRays(old);\r
		for(var t = 0u; t < TEXEL_CAS_TRIES; t++){\r
			texel = unpackTexelRays(old);\r
			let next = vec4(\r
				addPackedSky(texel.xy, batch.xy, prior.xy, caps.x, seedMax.x),\r
				addPackedSun(texel.zw, batch.zw, sunWeight, prior.zw, caps.y, seedMax.y));\r
			if(all(next == texel)){\r
				break;\r
			}\r
			let cmp = atomicCompareExchangeWeak(texelWord, old, packTexelRays(next));\r
			if(cmp.exchanged){\r
				texel = next;\r
				break;\r
			}\r
			old = cmp.old_value;\r
		}\r
		prior = texel;\r
	}\r
}\r
\r
/*\r
1 claim_main: every cell inserts its tiles and bids on its texel, unless the texel is resolved\r
2 select_main: the cell with the highest bid of a texel goes in traceCells, at most traceCellsMax of them\r
3 trace_main: only those cells trace\r
See updateVirtualLightmap.wgsl\r
 */\r
@compute @workgroup_size(WORK_GROUP_SIZE_X, WORK_GROUP_SIZE_Y, 1)\r
fn claim_main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r
	let cellID = GlobalInvocationID.xy;\r
	let texelSlot = getCellTexelSlot(cellID);\r
	traceCells[texelSlot] = TILE_NONE;\r
	let point = getCellPoint(cellID);\r
	if(!point.valid){\r
		return;\r
	}\r
	let indices = getCellTexels(point, true);\r
	let levels = min(uniforms.ancestorLevels, ANCESTOR_LEVELS_MAX);\r
	//before the count of the texel is read below: a texel that is reset is not resolved\r
	if(uniforms.changeCount > 0u){\r
		//the changes since the finest texel of the cell was last sampled only, none while it takes samples: its coarser\r
		//texels were sampled with it (their claims get its frame below). So most cells load 1 claim and test no box\r
		var finest = 0u;\r
		while(finest < levels && indices[finest] == TILE_NONE){\r
			finest++;\r
		}\r
		var changeFrames = vec2(0u);\r
		if(indices[finest] != TILE_NONE){\r
			let lastSampled = getLastSampled(indices[finest]);\r
			if(lastSampled < uniforms.changeEnd){\r
				changeFrames = getChangeFrames(point.worldPosition, lastSampled);\r
			}\r
		}\r
		if(any(changeFrames != vec2(0u))){\r
			for(var i = 0u; i <= levels; i++){\r
				if(indices[i] != TILE_NONE && resetStaleTexel(indices[i], changeFrames)){\r
					//the level as getCellTexels has it\r
					let level = u32(getLevel(point.worldPosition, point.n));\r
					resetStaleNeighbours(point.surface, level + i, changeFrames);\r
				}\r
			}\r
		}\r
	}\r
	//the texel the cell bids on: the one of its level, or the finest coarser one where the lightmap has no room for the\r
	//tile of that (all the slots findOrInsert looks in hold tiles in use, 4% of the tiles at 70% full). Without a bid\r
	//the coarser texels there, which are inside that 1 tile, got no samples either: nothing for the resolve to show\r
	//but an open sky, white blocks on the ground. With it the resolve finds the coarser texel\r
	var own = 0u;\r
	while(own < levels && indices[own] == TILE_NONE){\r
		own++;\r
	}\r
	let texelIndex = indices[own];\r
	if(texelIndex == TILE_NONE){\r
		return;\r
	}\r
	if(getTexelCount(texelIndex) >= uniforms.accumulationMax){\r
		return;\r
	}\r
	traceCells[texelSlot] = texelIndex;\r
\r
	//the texel gets a sample this frame, from this cell or the one that wins the bid, and so do the coarser texels\r
	//above it: the frame of their claim is when they were last sampled, see resetStaleTexel. Not over a claim of this\r
	//frame, which can be the bid of a cell that has the texel as its own\r
	let stamp = (uniforms.frame & CLAIM_FRAME_MASK) << CLAIM_FRAME_SHIFT;\r
	for(var i = own + 1u; i <= levels; i++){\r
		if(indices[i] != TILE_NONE){\r
			let ancestorClaim = &claimBuffer[indices[i]];\r
			let ancestorOld = atomicLoad(ancestorClaim);\r
			if((ancestorOld >> CLAIM_FRAME_SHIFT) != (stamp >> CLAIM_FRAME_SHIFT)){\r
				atomicCompareExchangeWeak(ancestorClaim, ancestorOld, stamp);\r
			}\r
		}\r
	}\r
\r
	let key = getClaimKey(cellID);\r
	let claim = &claimBuffer[texelIndex];\r
	var old = atomicLoad(claim);\r
	for(var i = 0u; i < 16u; i++){\r
		if((old >> CLAIM_FRAME_SHIFT) == (key >> CLAIM_FRAME_SHIFT) && old >= key){\r
			return;\r
		}\r
		let cmp = atomicCompareExchangeWeak(claim, old, key);\r
		if(cmp.exchanged){\r
			return;\r
		}\r
		old = cmp.old_value;\r
	}\r
}\r
\r
/*\r
The counters of select_main are summed per workgroup first, then added to traceArgs with 1 atomic per counter and\r
workgroup, and traceArgs[5 - parity] is read once per workgroup. Per cell, all the cells of the screen did their atomics\r
on the same few words, and those run one after the other: on D3D12 even an atomicLoad is an atomic read-modify-write.\r
That took select_main from .25 to .07 ms (dawn.node, RTX 3080, 1080p High). The winners of a workgroup get consecutive\r
places in traceCells: the order was the one of the atomics before, so it was not fixed either\r
 */\r
var<workgroup> selectWins: atomic<u32>;\r
var<workgroup> selectNoisy: atomic<u32>;\r
var<workgroup> selectSurvivors: atomic<u32>;\r
var<workgroup> selectPrevious: u32;\r
var<workgroup> selectBase: u32;\r
\r
@compute @workgroup_size(WORK_GROUP_SIZE_X, WORK_GROUP_SIZE_Y, 1)\r
fn select_main(\r
	@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,\r
	@builtin(local_invocation_index) localIndex : u32\r
) {\r
	let cellID = GlobalInvocationID.xy;\r
	let parity = uniforms.frame & 1u;\r
	if(localIndex == 0u){\r
		atomicStore(&selectWins, 0u);\r
		atomicStore(&selectNoisy, 0u);\r
		atomicStore(&selectSurvivors, 0u);\r
		selectPrevious = atomicLoad(&traceArgs[5u - parity]);\r
	}\r
	workgroupBarrier();\r
	let texelIndex = traceCells[getCellTexelSlot(cellID)];\r
	let key = getClaimKey(cellID);\r
	var won = texelIndex != TILE_NONE && atomicLoad(&claimBuffer[texelIndex]) == key;\r
	//the place of the cell among the ones of its workgroup that trace\r
	var local = 0u;\r
	if(won){\r
		//over traceCellsMax in the previous frame: a random part of the winners is left out first, see updateVirtualLightmap.wgsl\r
		atomicAdd(&selectWins, 1u);\r
		//the ones that still look noisy: the host keeps drawing while there are many, see SkyVisibilityLightmap.readBack\r
		if(getTexelCount(texelIndex) < uniforms.convergedPaths){\r
			atomicAdd(&selectNoisy, 1u);\r
		}\r
		let previous = selectPrevious;\r
		if(previous > uniforms.traceCellsMax){\r
			let random = f32(tileHash(key ^ 0x9E3779B9u) >> 8u) / 16777216.;\r
			if(random * f32(previous) >= f32(uniforms.traceCellsMax)){\r
				won = false;\r
			}\r
		}\r
		if(won){\r
			local = atomicAdd(&selectSurvivors, 1u);\r
		}\r
	}\r
	workgroupBarrier();\r
	if(localIndex == 0u){\r
		let wins = atomicLoad(&selectWins);\r
		if(wins > 0u){\r
			atomicAdd(&traceArgs[4u + parity], wins);\r
		}\r
		let noisy = atomicLoad(&selectNoisy);\r
		if(noisy > 0u){\r
			atomicAdd(&traceArgs[6], noisy);\r
		}\r
		let survivors = atomicLoad(&selectSurvivors);\r
		if(survivors > 0u){\r
			selectBase = atomicAdd(&traceArgs[3], survivors);\r
		}\r
	}\r
	workgroupBarrier();\r
	if(!won){\r
		return;\r
	}\r
	let index = selectBase + local;\r
	if(index >= uniforms.traceCellsMax){\r
		return;\r
	}\r
	traceCells[index] = cellID.x | (cellID.y << 16u);\r
	if(index % (TRACE_GROUP_SIZE / uniforms.traceLanes) == 0u){\r
		atomicAdd(&traceArgs[0], 1u);\r
	}\r
	if(index == 0u){\r
		atomicStore(&traceArgs[1], 1u);\r
		atomicStore(&traceArgs[2], 1u);\r
	}\r
}\r
\r
//the paths of a cell summed per thread, see trace_main, and its sun rays (LIGHTMAP_SUN)\r
var<workgroup> pathSums: array<f32, TRACE_GROUP_SIZE>;\r
var<workgroup> sunSums: array<f32, TRACE_GROUP_SIZE>;\r
//the cells that trace, read from traceArgs once per workgroup instead of by every thread: on D3D12 an atomicLoad is an\r
//atomic read-modify-write, and all the threads of the pass on 1 word ran one after the other. That took trace_main from\r
//1.27 to .85 ms (dawn.node, RTX 3080, 1080p High, Amsterdam), more where the rays are short (a forest 1.17 to .45 ms)\r
var<workgroup> groupTraceCells: u32;\r
\r
/*\r
traceLanes threads per cell, which each trace every traceLanes-th of its sampleCount rays. Lane 0 adds the sums to the\r
texel and to the coarser ones above it.\r
LIGHTMAP_SUN: the first rays of the cell go to the sun, the others to the sky. sunSampleCount of them while both take\r
samples (1 per 8 paths), all of them while only the sun does (after the sun moved), none while only the sky does. So the\r
threads of a cell always have the same rays to trace, and the rays of a cell stay sampleCount (the budget of\r
traceCellsMax). 1 call of isOccluded for both: with 2, the threads of a subgroup with a sun ray and the ones with a sky\r
ray would run the 2 traversals one after the other.\r
A texel in a penumbra (some of its sun rays so far reached the sun, some didn't) takes more of them (without\r
PACKED_TEXELS sunSampleCountPenumbra, 1 per 4 paths), and the sun rays of a texel walk its sequence of points on the\r
sun without gaps (sunIndex), as its sky paths do. With a low sun the penumbras are wide (a sunset: 20 m per 100 m of\r
shadow along it, the shadows 10x the height of what casts them), so many texels are in one, and there the noise is\r
which points on the sun the rays went to.\r
A sun sample weighs sampleCount, as much as the sky paths of the cell, so the counts of the 2 go up alike: the variance\r
of the sun visibility of a texel is mostly where in it the cell's pixel is, not the point on the sun.\r
PACKED_TEXELS: a texel counts rays, so a sample weighs its rays. A sky ray of a wall is folded up (getPathRay) and\r
counts as 2 paths: the one that went up and its mirror image down, which is 0. And next to sky rays a sun ray counts as\r
the paths of those sky rays / PACKED_SUN_SCALE (rounded up, sunRayCount), so the 2 counts of a texel go up alike here\r
too. But only while all the sun rays of the texel agree. From the first one that doesn't, the texel is in a penumbra:\r
its count goes back to the rays that were traced and a ray counts once (addPackedSun), so it ends with the 127 rays\r
the field holds. The rays of its cell then split as the rays the sun and the sky still take (a fifth to the sun on the\r
ground and a roof, a third on a wall, whose sky paths count twice), so both are full together.\r
Every sun ray counted once, the sun is at half of its rays when the sky is full (a quarter on a wall), and the cells\r
after that have all their rays to the sun, for every texel, also the 92% whose rays all agree: 316 frames to\r
converge instead of 241, for the same noise. Counted as the sky paths in every texel, a texel has 32 sun rays on a\r
wall and 64 on the ground (16 and 32 with 1 sun ray per 16 paths, and numbered by the frame, so as good as random).\r
The noise on the shadow edges (New York, sunset, 1080p, High, converged, frames to converge): 1 per 16 paths by the\r
frame .057 (223), in sequence .040 (223), 1 per 8 paths .027 (236), and a quarter of the rays in a penumbra .023\r
(238), a penumbra counted once .018 (241), every texel counted once .0175 (316).\r
Tried and not kept: the sun rays counted for the part of the room of the sun that the sky rays\r
are of the room of the sky, so both are full together also when the sun was cleared with the sky half full. 1.25x fewer\r
frames after such a sun move, 1.13x the noise on the shadow edges.\r
A sun ray into the surface (a face away from the sun, or the part of the disc below its horizon) is a miss without a\r
trace, still counted. Traced, 13% of them reached the sun: it starts SUN_RAY_BIAS in front of the wall and only gets\r
back to its plane after bias / |n.rd|, metres at a grazing angle, by then over the roof or past the corner. The shading\r
reads no sun there, but the coarser texels and the gather across a corner brought it to the lit faces\r
 */\r
@compute @workgroup_size(TRACE_GROUP_SIZE, 1, 1)\r
fn trace_main(\r
	@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,\r
	@builtin(local_invocation_index) localIndex : u32\r
) {\r
	let lanes = uniforms.traceLanes;\r
	let cell = GlobalInvocationID.x / lanes;\r
	let lane = GlobalInvocationID.x % lanes;\r
	if(localIndex == 0u){\r
		groupTraceCells = min(atomicLoad(&traceArgs[3]), uniforms.traceCellsMax);\r
	}\r
	workgroupBarrier();\r
	var hasCell = cell < groupTraceCells;\r
	var cellID = vec2(0u);\r
	var point: CellPoint;\r
	if(hasCell){\r
		let packed = traceCells[cell];\r
		cellID = vec2(packed & 0xFFFFu, packed >> 16u);\r
		point = getCellPoint(cellID);\r
		hasCell = point.valid;\r
	}\r
	var sum = 0.;\r
	var sunSum = 0.;\r
	var skyNeeded = false;\r
	var sunNeeded = false;\r
	//how the sampleCount rays of the cell split, see above. Every lane of the cell gets the same, lane 0 divides by them\r
	var sunRays = 0u;\r
	var skyRays = 0u;\r
	//PACKED_TEXELS: the paths a sky ray counts as and the sun rays a sun ray counts as, see above\r
	var skyRayCount = 1u;\r
	var sunRayCount = 1u;\r
	var wall = false;\r
	var skyNormal = vec3(0.);\r
	//the sun rays the texel took (about: it counts them weighted), so they walk its sequence without gaps, see above\r
	var sunIndex = 0u;\r
	if(hasCell){\r
		let texelIndex = traceCells[getCellTexelSlot(cellID)];\r
		wall = (point.surface.id & SURFACE_WALL) != 0u;\r
		skyNormal = point.n;\r
		if(PACKED_TEXELS){\r
			//1 load\r
			let r = unpackTexelRays(atomicLoad(&lightingBuffer[texelIndex]));\r
			let caps = getPackedCaps();\r
			skyNeeded = r.y < caps.x;\r
			sunNeeded = LIGHTMAP_SUN && r.w < caps.y;\r
			if(FOLD_DOWN_PATHS && wall){\r
				skyRayCount = 2u;\r
				//the weight of a folded path is .5 for a normal without y only, and the one of the gBuffer is rounded\r
				skyNormal = normalize(point.n * vec3(1., 0., 1.));\r
			}\r
			//no more rays than the texel still takes\r
			let sunRoom = caps.y - min(r.w, caps.y);\r
			let skyRoom = (caps.x - min(r.y, caps.x) + skyRayCount - 1u) / skyRayCount;\r
			let sunAlone = min(uniforms.sampleCount, PACKED_SUN_RAYS_MAX);\r
			//in a penumbra so far: its sun rays count once (addPackedSun), so the rays of the cell split as the rays the\r
			//sun and the sky still take, and both are full together\r
			let penumbra = isPenumbra(r.zw);\r
			var sunJoint = uniforms.sunSampleCount;\r
			if(penumbra){\r
				let split = u32(round(f32(uniforms.sampleCount * sunRoom) / f32(max(sunRoom + skyRoom, 1u))));\r
				sunJoint = clamp(split, uniforms.sunSampleCount, max(uniforms.sampleCount, uniforms.sunSampleCount + 1u) - 1u);\r
			}\r
			sunRays = select(0u, min(select(sunAlone, sunJoint, skyNeeded), sunRoom), sunNeeded);\r
			skyRays = select(0u, min(uniforms.sampleCount - sunRays, skyRoom), skyNeeded);\r
			if(sunRays > 0u && skyRays > 0u){\r
				//the sun count goes up as the sky count does (rounded up)\r
				let sunPaths = PACKED_SUN_SCALE * sunRays;\r
				sunRayCount = (skyRays * skyRayCount + sunPaths - 1u) / sunPaths;\r
			}\r
			//the rays it took, so its sequence has no gaps (getTexelPathIndex)\r
			pathIndex = i32(r.y / skyRayCount);\r
			sunIndex = select(r.w / sunRayCount, r.w, penumbra);\r
		}else{\r
			skyNeeded = loadTexel(texelIndex).y < uniforms.accumulationMax;\r
			var sunTexel = vec2(0.);\r
			if(LIGHTMAP_SUN){\r
				sunTexel = loadSunTexel(texelIndex);\r
			}\r
			sunNeeded = LIGHTMAP_SUN && sunTexel.y < uniforms.accumulationMax;\r
			pathIndex = getTexelPathIndex(texelIndex);\r
			//a running average: not exactly 0 or 1 where all the rays agreed (pack2x16float)\r
			let penumbra = sunTexel.y > 0. && sunTexel.x > .01 && sunTexel.x < .99;\r
			let sunJoint = select(uniforms.sunSampleCount, uniforms.sunSampleCountPenumbra, penumbra);\r
			sunRays = select(0u, select(sunJoint, uniforms.sampleCount, !skyNeeded), sunNeeded);\r
			skyRays = select(0u, uniforms.sampleCount - sunRays, skyNeeded);\r
			//a visit weighs sampleCount\r
			sunIndex = u32(sunTexel.y / f32(uniforms.sampleCount)) * sunRays;\r
		}\r
		let seed = getTexelSeed(texelIndex);\r
		let skyRo = point.worldPosition + point.n * MIN_DIST;\r
		let d = distance(point.worldPosition, uniforms.cameraPosition);\r
		let sunRo = point.worldPosition + point.n * max(MIN_DIST, d * SUN_RAY_BIAS);\r
		for(var i = lane; i < sunRays + skyRays; i += lanes){\r
			let sun = i < sunRays;\r
			var ro = skyRo;\r
			var ray: vec4<f32>;\r
			if(sun){\r
				ro = sunRo;\r
				ray = vec4(getSunRay(seed, sunIndex + i), 1.);\r
				//into the surface: a miss without a trace, see above\r
				ray.w = select(0., 1., dot(point.n, ray.xyz) > 0.);\r
			}else{\r
				ray = getPathRay(skyNormal, seed, i - sunRays, skyRays, wall);\r
			}\r
			if(ray.w > 0. && !isOccluded(ro, ray.xyz)){\r
				if(sun){\r
					sunSum += ray.w;\r
				}else{\r
					sum += ray.w;\r
				}\r
			}\r
		}\r
	}\r
	pathSums[localIndex] = sum;\r
	sunSums[localIndex] = sunSum;\r
	workgroupBarrier();\r
	if(!hasCell || lane != 0u){\r
		return;\r
	}\r
	var total = 0.;\r
	var sunTotal = 0.;\r
	for(var i = 0u; i < lanes; i++){\r
		total += pathSums[localIndex + i];\r
		sunTotal += sunSums[localIndex + i];\r
	}\r
	if(PACKED_TEXELS){\r
		//the rays weigh 0 or 1, so the sums are the hits\r
		let batch = vec4(u32(round(total)), skyRays * skyRayCount, u32(round(sunTotal)), sunRays);\r
		addPackedBatch(getCellTexels(point, false), min(uniforms.ancestorLevels, ANCESTOR_LEVELS_MAX), batch, sunRayCount);\r
		return;\r
	}\r
	let visibility = total / f32(max(skyRays, 1u));\r
	let sunVisibility = sunTotal / f32(max(sunRays, 1u));\r
	//the sky as the paths it took, the sun as the cell's sampleCount (see above)\r
	let skyWeight = f32(skyRays);\r
	let sunWeight = f32(uniforms.sampleCount);\r
	let indices = getCellTexels(point, false);\r
\r
	//from coarse to fine, a new texel starts from the coarser one\r
	let ancestorLevels = min(uniforms.ancestorLevels, ANCESTOR_LEVELS_MAX);\r
	var prior = vec2(0.);\r
	var sunPrior = vec2(0.);\r
	for(var i = i32(ancestorLevels); i >= 0; i--){\r
		let index = indices[i];\r
		if(index == TILE_NONE){\r
			continue;\r
		}\r
		if(skyNeeded){\r
			prior = addTexelSample(index, visibility, skyWeight, prior, uniforms.accumulationMax);\r
		}\r
		if(sunNeeded){\r
			sunPrior = addTexelSample(index + getSunTexelOffset(), sunVisibility, sunWeight, sunPrior, uniforms.accumulationMax);\r
		}\r
	}\r
}\r
\r
//PACKED_TEXELS: the sun moved, the sun fields of every texel are cleared (SkyVisibilityLightmap.setSun). Without it the\r
//host clears the sun half of lightingBuffer. 1 thread per texel, the texels as a LIGHTMAP_SIZE x LIGHTMAP_SIZE grid\r
@compute @workgroup_size(WORK_GROUP_SIZE_X, WORK_GROUP_SIZE_Y, 1)\r
fn clear_sun_main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r
	let p = GlobalInvocationID.xy;\r
	if(p.x >= LIGHTMAP_SIZE || p.y >= LIGHTMAP_SIZE){\r
		return;\r
	}\r
	atomicAnd(&lightingBuffer[p.y * LIGHTMAP_SIZE + p.x], PACKED_SKY_MASK);\r
}\r
`,se={near:0,far:0};function sr(c,e,t,r,n,i,s,o,l,h,u,d){const f=(s-c)*r,m=(h-c)*r,p=(o-e)*n,x=(u-e)*n,b=(l-t)*i,g=(d-t)*i;se.near=Math.max(Math.min(f,m),Math.min(p,x),Math.min(b,g)),se.far=Math.min(Math.max(f,m),Math.max(p,x),Math.max(b,g))}function $e(c){return(c>=0?1:-1)/Math.max(Math.abs(c),1e-12)}function ra(c,e,t,r,n){const i=c[t*4],s=c[t*4+1],o=e[t*4+2],l=e[t*4+3];let h=-1;n[1]<0&&r[1]>=s?h=(s-r[1])/n[1]:n[1]>0&&r[1]<=i&&(h=(i-r[1])/n[1]);const u=r[0]+n[0]*h,d=r[2]+n[2]*h;let f=!1,m=1/0;for(let p=0;p<l;p++){const x=(o+p)*4,b=c[x],g=c[x+1],y=c[x+2],v=c[x+3],w=y-b,M=v-g,C=n[0]*M-n[2]*w;if(Math.abs(C)>1e-20){const E=b-r[0],A=g-r[2],P=(E*M-A*w)/C,T=(E*n[2]-A*n[0])/C;if(P>0&&P<m&&T>=0&&T<=1){const L=r[1]+n[1]*P;L>=i&&L<=s&&(m=P)}}if(h>0&&g>d!=v>d){const E=b+(d-g)/(v-g)*w;u<E&&(f=!f)}}return f?Math.min(m,h):m}function na(c,e,t,r,n){const i=e[t*4+2]*4,s=c[i],o=c[i+1],l=c[i+2],h=c[i+3],u=c[i+4],d=c[i+5],f=-h,m=l,p=r[0]-s,x=r[2]-o,b=p*l+x*h,g=p*f+x*m,y=$e(n[0]*l+n[2]*h),v=$e(n[1]),w=$e(n[0]*f+n[2]*m);let M=1/0;return sr(b,r[1],g,y,v,w,-1,u,-1,1,c[t*4+1],1),se.far>0&&se.near<=se.far&&(M=Math.max(se.near,0)),sr(b,r[1],g,y,v,w,-d,c[t*4],-d,d,u,d),se.far>0&&se.near<=se.far&&(M=Math.min(M,Math.max(se.near,0))),M}function ia(c,e,t,r){const n=c.words,i=new Float32Array(n.buffer,n.byteOffset,n.length),s=c.nodeCount*4,o=$e(t[0]),l=$e(t[1]),h=$e(t[2]);let u=r,d=-1;const f=[0];for(;f.length>0;){const m=f.pop()*4;let p=-1,x=-1,b=0;for(let g=0;g<2;g++){const y=m+g*8,v=n[m+3+g*4];sr(e[0],e[1],e[2],o,l,h,i[y],i[y+1],i[y+2],i[y+4],i[y+5],i[y+6]);const w=Math.max(se.near,0);if(!(se.far<w||w>=u))if(v>=ct){const M=(v&~ct)>>>0,C=n[M*4+3]===Ws?na(i,n,M,e,t):ra(i,n,M,e,t);C<u&&(u=C,d=M-s)}else p<0?(p=v,b=w):w<b?(x=p,p=v):x=v}x>=0&&f.push(x),p>=0&&f.push(p)}return d<0?null:{t:u,record:d}}const Q=class Q{constructor(e,t){a(this,"renderer");a(this,"capacity");a(this,"buffer",null);a(this,"tiles",new Map);a(this,"free",[]);a(this,"tlasDirty",!0);a(this,"shaders",[]);a(this,"changeShaders",[]);a(this,"tileCount",0);a(this,"root",0);a(this,"usedVec4s",0);a(this,"version",0);a(this,"changes",[]);a(this,"pendingChanges",[]);this.renderer=e;const r=e.device.limits.maxStorageBufferBindingSize;this.capacity=Math.floor(Math.min(t,r)/16)}static get traceDefines(){return{CITY_STACK_SIZE:Se()?8:16}}get changeStart(){return Q.TLAS_NODES_MAX*Q.NODE_VEC4S}get heapStart(){return this.changeStart+Q.CHANGES_MAX*2}enable(){if(!this.buffer){this.buffer=this.renderer.createBuffer(this.capacity*16,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,!1,"cityBuffer"),this.free=[{start:this.heapStart,size:this.capacity-this.heapStart}];for(const[e,t]of this.tiles)this.place(e,t);for(const e of this.shaders)e.setBuffer("cityBuffer",this.buffer);this.tlasDirty=!0,_.log(`[CityScene] city buffer ${(this.capacity*16/1048576).toFixed(0)} MB`)}}bind(e,t=!0){this.shaders.push(e),this.buffer&&e.setBuffer("cityBuffer",this.buffer),e.setFloat("cityTileCount",this.tileCount),e.setFloat("cityRoot",this.root),t&&(this.changeShaders.push(e),e.setFloat("changeCount",this.changes.length),e.setFloat("changeEnd",this.changes.reduce((r,n)=>Math.max(r,n.frame),0)))}addTile(e,t){if(this.removeTile(e),!t)return;const r={block:t,offset:-1};this.tiles.set(e,r),this.buffer&&this.place(e,r)}removeTile(e){const t=this.tiles.get(e);t&&(this.tiles.delete(e),t.offset>=0&&(this.release(t.offset,t.block.words.length/4),this.tlasDirty=!0,this.addChange(t.block)))}clear(){for(const e of[...this.tiles.keys()])this.removeTile(e)}place(e,t){const r=t.block.words.length/4,n=this.allocate(r);if(n<0){_.warn(`[CityScene] no room for tile ${e} (${(r*16/1048576).toFixed(2)} MB, ${(this.usedVec4s*16/1048576).toFixed(0)} of ${(this.capacity*16/1048576).toFixed(0)} MB used): its buildings are not traced`);return}t.offset=n;const i=t.block,s=new Uint32Array(i.words);for(let l=0;l<i.nodeCount;l++)for(const h of[l*16+3,l*16+7]){const u=s[h];s[h]=u>=ct?((u&~ct)+n|ct)>>>0:u+n}const o=i.nodeCount*4;for(let l=0;l<i.buildingCount+i.treeCount;l++)s[(o+l)*4+2]+=n;this.renderer.device.queue.writeBuffer(this.buffer,n*16,s.buffer,s.byteOffset,s.byteLength),this.tlasDirty=!0,this.addChange(i),_.ENABLED&&_.log(`[CityScene] tile ${e}: ${i.buildingCount} buildings, ${i.treeCount} trees, ${i.edgeCount} edges, BVH depth ${i.depth}, ${(r*16/1048576).toFixed(2)} MB, ${(this.usedVec4s*16/1048576).toFixed(1)} MB used`)}addChange(e){const t=(e.max[1]-e.min[1])*Q.CHANGE_REACH;this.pendingChanges.push({min:[...e.min],max:[...e.max],reach:t})}clearChanges(){this.changes.length=0,this.pendingChanges.length=0;for(const e of this.changeShaders)e.setFloat("changeCount",0),e.setFloat("changeEnd",0)}mergeChanges(){const e=l=>(l.max[0]-l.min[0])*(l.max[2]-l.min[2]),t=(l,h)=>({min:l.min.map((u,d)=>Math.min(u,h.min[d])),max:l.max.map((u,d)=>Math.max(u,h.max[d])),reach:Math.max(l.reach,h.reach)});let r=1/0,n=0,i=1;for(let l=0;l<this.changes.length;l++)for(let h=l+1;h<this.changes.length;h++){const u=e(t(this.changes[l],this.changes[h]))-e(this.changes[l])-e(this.changes[h]);u<r&&(r=u,n=l,i=h)}const s=this.changes[n],o=this.changes[i];this.changes[n]={...t(s,o),frame:Math.max(s.frame,o.frame)},this.changes.splice(i,1)}writeChanges(e){for(const s of this.pendingChanges)this.changes.push({...s,frame:e});for(this.pendingChanges.length=0;this.changes.length>Q.CHANGES_MAX;)this.mergeChanges();const t=new ArrayBuffer(this.changes.length*32),r=new Float32Array(t),n=new Uint32Array(t);let i=0;this.changes.forEach((s,o)=>{r.set(s.min,o*8),n[o*8+3]=s.frame,r.set(s.max,o*8+4),r[o*8+7]=s.reach,i=Math.max(i,s.frame)}),t.byteLength>0&&this.renderer.device.queue.writeBuffer(this.buffer,this.changeStart*16,t);for(const s of this.changeShaders)s.setFloat("changeCount",this.changes.length),s.setFloat("changeEnd",i)}allocate(e){for(let t=0;t<this.free.length;t++){const r=this.free[t];if(r.size<e)continue;const n=r.start;return r.start+=e,r.size-=e,r.size===0&&this.free.splice(t,1),this.usedVec4s+=e,n}return-1}release(e,t){this.usedVec4s-=t;let r=0;for(;r<this.free.length&&this.free[r].start<e;)r++;this.free.splice(r,0,{start:e,size:t}),r+1<this.free.length&&this.free[r].start+this.free[r].size===this.free[r+1].start&&(this.free[r].size+=this.free[r+1].size,this.free.splice(r+1,1)),r>0&&this.free[r-1].start+this.free[r-1].size===this.free[r].start&&(this.free[r-1].size+=this.free[r].size,this.free.splice(r,1))}update(e){if(!this.buffer||(this.pendingChanges.length>0&&this.writeChanges(e),!this.tlasDirty))return;this.tlasDirty=!1,this.version++;const t=[...this.tiles.values()].filter(r=>r.offset>=0).slice(0,Q.TLAS_NODES_MAX);if(this.tileCount=t.length,this.root=t.length===1?t[0].offset:0,t.length>1){const r=new ht(t.map(s=>new S(...s.block.min)),t.map(s=>new S(...s.block.max)),js),n=new ArrayBuffer(r.nodeCount*ht.bytesPerNode);r.setNodeData(n);const i=new Uint32Array(n);for(let s=0;s<r.nodeCount;s++)for(const o of[s*16+3,s*16+7]){const l=i[o];i[o]=l>=ht.leafFlag?t[l&2147483647].offset:l*Q.NODE_VEC4S}this.renderer.device.queue.writeBuffer(this.buffer,0,n)}for(const r of this.shaders)r.setFloat("cityTileCount",this.tileCount),r.setFloat("cityRoot",this.root)}pick(e,t){const r=[e.x,e.y,e.z],n=[t.x,t.y,t.z],i=n.map(h=>(h>=0?1:-1)/Math.max(Math.abs(h),1e-12)),s=[];for(const[h,u]of this.tiles){const{min:d,max:f}=u.block;let m=0,p=1/0;for(let x=0;x<3;x++){const b=(d[x]-r[x])*i[x],g=(f[x]-r[x])*i[x];m=Math.max(m,Math.min(b,g)),p=Math.min(p,Math.max(b,g))}m<=p&&s.push({key:h,tile:u,near:m})}s.sort((h,u)=>h.near-u.near);let o=1/0,l=null;for(const{key:h,tile:u,near:d}of s){if(d>=o)break;const f=ia(u.block,r,n,o);if(!f)continue;o=f.t;const m=u.block;l={key:h,featureId:f.record<m.buildingCount?m.ids[f.record]:-1}}return l}destruct(){var e;(e=this.buffer)==null||e.destroy(),this.buffer=null,this.tiles.clear()}};a(Q,"TLAS_NODES_MAX",1024),a(Q,"NODE_VEC4S",4),a(Q,"CHANGES_MAX",16),a(Q,"CHANGE_REACH",2);let Ee=Q;const sa=`// The sky visibility lightmap at half resolution, see SkyVisibilityHalfRes.ts: 1 sample per 2 x 2 pixels of the gBuffer,\r
// at the top left pixel of the block. The lookup (getLightmapLighting: hash table probes and texel loads, for 1 to 3\r
// levels) is the most expensive part of the deferred shading; the shading blends these samples instead\r
// (getHalfResLighting in deferredShading.wgsl). With LIGHTMAP_SUN also the sun visibility of the texels (the shadows of\r
// SUN_SHADOWS 2), in the same lookup (getLightmapChannels shares the tile probes), where the surface faces the sun.\r
// Out, rg32uint:\r
// x: the sky visibility and the sun visibility (2 x f16), -1 where the texels have no paths (no sun: always -1)\r
// y: the key of the surface point of the sample, see packHalfResKey in skyVisibilityResolve.wgsl. 0 on the sky\r
// With HALF_RES_BILINEAR, rg16float, which the shading samples bilinearly (getHalfResLightingBilinear): the sky\r
// visibility, that of an open sky (n.y * .5 + .5, as the shading's) while the texels have no paths yet, 1 on the sky,\r
// and the sun visibility, 1 without paths (also where it faces away: it would darken the edges of the lit faces)\r
// Needs the includes of the lightmap resolve (SkyVisibilityLightmap.resolveIncludes), its uniforms are set with the\r
// deferred shading's (SkyVisibilityLightmap.setResolveUniforms)\r
\r
// the texels hold the sun visibility too, see SkyVisibilityLightmap.setSun\r
override LIGHTMAP_SUN : bool = false;\r
\r
struct Uniforms {\r
  inverseProjection : mat4x4<f32>,\r
  inverseView : mat4x4<f32>,\r
  viewProjection : mat4x4<f32>,\r
  cameraPosition : vec3<f32>,\r
  // of the gBuffer, the full resolution\r
  resolution : vec2<f32>,\r
  // for the noise of stochasticLevel\r
  frame : f32,\r
  // set with the other resolve materials, see SkyVisibilityLightmap.setResolveUniforms. Not all are used here\r
  lightmapEnabled : u32,\r
  stochasticLevel : u32,\r
  pixelSize : f32,\r
  pixelScale : f32,\r
  texelsPerPixel : f32,\r
  texelSizeMin : f32,\r
  levelAngle : f32,\r
  blurSlope : f32,\r
  blurMax : f32,\r
  blurTexelScale : f32,\r
  searchCount : u32,\r
  accumulationMax : f32,\r
  ancestorWeight : f32,\r
  levelBlend : f32,\r
  atlasStep : f32,\r
  lightmapHalfRes : u32,\r
  // see getGBufferDistance\r
  depthParams : vec2<f32>,\r
  // toward the sun, with LIGHTMAP_SUN: a surface facing away gets no sun lookup\r
  lightDirection : vec3<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var<storage, read> tileBuffer : array<u32>;\r
// the sky visibility lightmap: 1 word per texel, see SkyVisibilityLightmap\r
@group(0) @binding(2) var<storage, read> lightingBuffer : array<u32>;\r
// the gBuffer: its 2 targets and its depth, see mapGBufferPacking.wgsl\r
@group(0) @binding(3) var gBufferTexture : texture_2d<u32>;\r
@group(0) @binding(4) var gBufferAtlasTexture : texture_2d<u32>;\r
@group(0) @binding(5) var gBufferDepth : texture_depth_2d;\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  return output;\r
}\r
\r
// as getNoise in deferredShading.wgsl, of the full resolution pixel\r
fn getNoise(coord : vec2<u32>) -> f32 {\r
  let p = vec2<f32>(coord) + 5.588238 * (uniforms.frame % 64.);\r
  return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715))));\r
}\r
\r
@fragment\r
#ifdef HALF_RES_BILINEAR\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
#else\r
fn fs_main(input : VertexOutput) -> @location(0) vec2<u32> {\r
#endif\r
  // the top left pixel of the 2 x 2 block. The half resolution rounds up, so it is always in the gBuffer\r
  let coord = vec2<u32>(input.position.xy) * 2u;\r
  let g0 = textureLoad(gBufferTexture, coord, 0).xy;\r
  if (g0.x == SURFACE_NONE) {\r
#ifdef HALF_RES_BILINEAR\r
    return vec4<f32>(1.0);\r
#else\r
    // no paths, no surface\r
    return vec2<u32>(pack2x16float(vec2(-1.)), 0u);\r
#endif\r
  }\r
  let g = vec3(g0, textureLoad(gBufferAtlasTexture, coord, 0).x);\r
  let uv = (vec2<f32>(coord) + .5) / uniforms.resolution;\r
  let d = getGBufferDistance(textureLoad(gBufferDepth, coord, 0), uv, uniforms.inverseProjection, uniforms.depthParams);\r
  let world = depthToPosition(d, uv * 2. - 1.);\r
  let n = getGBufferNormal(g);\r
  let surface = getGBufferSurface(g, world, uniforms.atlasStep);\r
  let levelF = getLevel(world, n);\r
#ifdef HALF_RES_BILINEAR\r
  let sun = LIGHTMAP_SUN;\r
#else\r
  // the shading takes no sun where the surface faces away\r
  let sun = LIGHTMAP_SUN && dot(n, uniforms.lightDirection) > 0.;\r
#endif\r
  // the sky (xy) and the sun (zw): the visibility and the paths\r
  var c : vec4<f32>;\r
  if (uniforms.stochasticLevel != 0u) {\r
    c = getLightmapChannelsStochastic(surface, levelF, getNoise(coord), sun);\r
  } else {\r
    c = getLightmapChannels(surface, levelF, sun);\r
  }\r
#ifdef HALF_RES_BILINEAR\r
  return vec4<f32>(select(n.y * .5 + .5, c.x, c.y > 0.0), select(1., c.z, c.w > 0.0), 0., 1.);\r
#else\r
  return vec2(pack2x16float(select(vec2(-1.), c.xz, c.yw > vec2(0.))), packHalfResKey(surface, u32(levelF)));\r
#endif\r
}\r
`;class aa{constructor(e,t){a(this,"renderer");a(this,"material");a(this,"target");a(this,"bilinearMaterial");a(this,"filteredTarget");a(this,"sampler");a(this,"bilinear",!1);a(this,"frame",0);a(this,"depthParams",new k);a(this,"sunDirection",new S(0,1,0));this.renderer=e;const r=(n,i)=>{const s=new G(e,n,sa,{includes:[Gt,...t],defines:i?{HALF_RES_BILINEAR:!0}:{}});return s.depthWriteEnabled=!1,s.depthCompare="always",s.setConstant("LEVEL2_PRIOR",!1),s};this.material=r("skyVisibilityHalfRes",!1),this.bilinearMaterial=r("skyVisibilityHalfResBilinear",!0),this.target=new H(e,1,1,{formats:["rg32uint"],sampleCount:1,sizeMultiplier:.5}),this.filteredTarget=new H(e,1,1,{formats:["rg16float"],sampleCount:1,sizeMultiplier:.5}),this.sampler=e.device.createSampler({magFilter:"linear",minFilter:"linear",label:"skyVisibilityHalfRes"})}get materials(){return[this.material,this.bilinearMaterial]}set nearest(e){for(const t of this.materials)t.setConstant("NEAREST_TEXEL",e)}get view(){return this.target.views[0]}draw(e,t){const r=t.target.size,n=this.bilinear?this.filteredTarget:this.target;n.setSize(r.x,r.y);const i=this.bilinear?this.bilinearMaterial:this.material;i.setMatrix("inverseProjection",e.projectionMatrix.inverse),i.setMatrix("inverseView",e.viewMatrix.inverse),i.setMatrix("viewProjection",e.viewProjection),i.setVector3("cameraPosition",e.worldPosition),i.setVector2("resolution",r),i.setFloat("frame",this.frame++),i.setTexture("gBufferTexture",t.view),i.setTexture("gBufferAtlasTexture",t.atlasView),i.setTexture("gBufferDepth",t.depthView),i.setVector2("depthParams",oe.depthParams(e,this.depthParams)),i.setVector3("lightDirection",this.sunDirection),this.renderer.blit(null,n,i)}bindShading(e){e.setTexture("halfResTexture",this.view),e.setTexture("halfResFiltered",this.filteredTarget.views[0]),e.setSampler("halfResSampler",this.sampler)}destruct(){this.target.destruct(),this.filteredTarget.destruct()}}const oa=`//the rays the lightmap asked for and traced this frame into the history of the ray count graph, see RayCountGraph.ts.\r
//1 thread. Asked for: the cells that won a bid on their texel (counted by select_main of\r
//updateSkyVisibilityLightmap.wgsl, before the cap), traced: the ones of them that got a slot in traceCells, at most\r
//traceCellsMax. Both times the paths per cell\r
\r
struct Uniforms {\r
	//the slot of this frame in history\r
	head : u32,\r
	//the slot of traceArgs with the cells that won a bid this frame: 4 + the parity of the frame\r
	wantedIndex : u32,\r
	//the paths per cell of this frame, 0 when the lightmap didn't update: the bar is 0\r
	sampleCount : u32,\r
	//the most cells that trace in a frame, see select_main\r
	traceCellsMax : u32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
//traceArgs of updateSkyVisibilityLightmap.wgsl, read only here\r
@group(0) @binding(1) var<storage, read> traceArgs : array<u32, 8>;\r
//the requested (x) and the traced (y) rays per frame, a ring of the frames of the graph\r
@group(0) @binding(2) var<storage, read_write> history : array<vec2<u32>>;\r
\r
@compute @workgroup_size(1, 1, 1)\r
fn compute_main() {\r
	let requested = traceArgs[uniforms.wantedIndex];\r
	//traceArgs[3] counts every winner that tried to get a slot, also the ones past the cap\r
	let traced = min(traceArgs[3], uniforms.traceCellsMax);\r
	history[uniforms.head] = vec2(requested, traced) * uniforms.sampleCount;\r
}\r
`,la=`//the ray count graph of the sky visibility lightmap, see RayCountGraph.ts: a bar per frame for the last frames of\r
//history, the newest on the right, from 0 at the bottom to raysMax at the top (clamped there). Green: the rays the\r
//lightmap asked for, dark green: the part of them it traced (the rest fell over the cap). Red: the cap of the rays per\r
//frame (traceSamplesMax), when it is below raysMax\r
\r
struct VertexOutput {\r
	@builtin(position) position : vec4<f32>,\r
}\r
\r
struct Uniforms {\r
	//the graph in canvas pixels: left, top, width, height, y down\r
	rect : vec4<f32>,\r
	canvasSize : vec2<f32>,\r
	//the slot of the newest bar in history\r
	head : u32,\r
	//the rays at the top of the graph\r
	raysMax : f32,\r
	//the cap of the rays, 0: no line\r
	raysLimit : f32,\r
	//of the line, in pixels\r
	lineWidth : f32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
//the requested (x) and the traced (y) rays per frame, see recordRayCount.wgsl\r
@group(0) @binding(1) var<storage, read> history : array<vec2<u32>>;\r
\r
//the 2 triangles of the rect\r
@vertex\r
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {\r
	var corners = array<vec2<f32>, 6>(vec2(0., 0.), vec2(1., 0.), vec2(0., 1.), vec2(0., 1.), vec2(1., 0.), vec2(1., 1.));\r
	let pixel = uniforms.rect.xy + corners[vertexIndex] * uniforms.rect.zw;\r
	var output : VertexOutput;\r
	output.position = vec4(pixel.x / uniforms.canvasSize.x * 2. - 1., 1. - pixel.y / uniforms.canvasSize.y * 2., 0., 1.);\r
	return output;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
	let frameCount = arrayLength(&history);\r
	let p = input.position.xy - uniforms.rect.xy;\r
	let column = min(u32(p.x / uniforms.rect.z * f32(frameCount)), frameCount - 1u);\r
	//the last column is the newest\r
	let index = (uniforms.head + 1u + column) % frameCount;\r
	//the rays at this pixel, from the bottom\r
	let pixelRays = (uniforms.rect.w - p.y) / uniforms.rect.w * uniforms.raysMax;\r
	let pixelSize = uniforms.raysMax / uniforms.rect.w;\r
\r
	if(uniforms.raysLimit > 0. && abs(pixelRays - uniforms.raysLimit) < uniforms.lineWidth * .5 * pixelSize){\r
		return vec4(1., .15, .1, 1.);\r
	}\r
	let rays = vec2<f32>(history[index]);\r
	if(pixelRays < rays.y){\r
		return vec4(.05, .4, .12, 1.);\r
	}\r
	if(pixelRays < rays.x){\r
		return vec4(.2, .9, .3, 1.);\r
	}\r
	return vec4(0., 0., 0., .55);\r
}\r
`,Xr=512,ha=512,ca=128,ua=8,da=Se()?100:32;class fa{constructor(e,t){a(this,"renderer");a(this,"historyBuffer");a(this,"recordShader");a(this,"material");a(this,"canvasSize",new k);a(this,"head",0);a(this,"frame",-2);a(this,"recorded",!1);this.renderer=e,this.historyBuffer=e.createBuffer(Xr*8,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.recordShader=new Me(e,"recordRayCount",oa),this.recordShader.setBuffer("traceArgs",t),this.recordShader.setBuffer("history",this.historyBuffer),this.material=new G(e,"rayCountGraph",la),this.material.depthWriteEnabled=!1,this.material.depthCompare="always",this.material.cullMode="none",this.material.setAlphaBlending(),this.material.setBuffer("history",this.historyBuffer)}startFrame(){const e=this.renderer.time.frameNumber;e!==this.frame&&(e===this.frame+1?this.head=(this.head+1)%Xr:(this.renderer.clearBuffer(this.historyBuffer),this.head=0),this.frame=e,this.recorded=!1)}dispatchRecord(e,t,r){this.recordShader.setFloat("head",this.head),this.recordShader.setFloat("wantedIndex",e),this.recordShader.setFloat("sampleCount",t),this.recordShader.setFloat("traceCellsMax",r),this.renderer.dispatchCompute(this.recordShader)}record(e,t,r){this.startFrame(),this.dispatchRecord(e,t,r),this.recorded=!0}draw(e,t){this.startFrame(),this.recorded||this.dispatchRecord(4,0,0);const r=this.renderer.canvas,n=this.renderer.canvasManager.pixelRatio,i=ua*n,s=Math.max(1,Math.min(ha*n,r.width-2*i)),o=Math.max(1,Math.min(ca*n,r.height/3)),l=Math.max(0,r.height-da*n-o);this.material.setUniform("rect",[i,l,s,o]),this.material.setVector2("canvasSize",this.canvasSize.setValues(r.width,r.height)),this.material.setFloat("head",this.head),this.material.setFloat("raysMax",Math.max(e,1)),this.material.setFloat("raysLimit",t<e?t:0),this.material.setFloat("lineWidth",Math.max(1,Math.round(n))),this.renderer.startRenderPass(null,{colorClear:!1,depthClear:!1},0,"rayCountGraph"),this.renderer.drawVertices(6,this.material)}destruct(){this.historyBuffer.destroy()}}const je=[1024,2048,3072,4096,6144],pa=8,ma=4,ga=128*1024*1024,ba=508,qr=4;var Le=(c=>(c[c.Shaded=0]="Shaded",c[c.Light=1]="Light",c[c.Levels=2]="Levels",c[c.Converging=3]="Converging",c[c.Lightmap=4]="Lightmap",c[c.Tiles=5]="Tiles",c))(Le||{}),_e=(c=>(c[c.Full=0]="Full",c[c.Half=1]="Half",c[c.HalfBilinear=2]="HalfBilinear",c))(_e||{});const xa=["fullRes","halfRes","halfResBilinear"],Ot=class Ot{constructor(e,t){a(this,"renderer");a(this,"cityScene");a(this,"claimShader");a(this,"selectShader");a(this,"traceShader");a(this,"clearSunShader");a(this,"updateShaders");a(this,"resolveMaterials",[]);a(this,"viewMaterials",new Set);a(this,"gBufferWidth",0);a(this,"gBufferHeight",0);a(this,"blueNoise");a(this,"tileBuffer",null);a(this,"tileTimeBuffer",null);a(this,"lightingBuffer",null);a(this,"claimBuffer",null);a(this,"tileCountBuffer");a(this,"traceArgsBuffer");a(this,"traceIndirectBuffer");a(this,"traceCellsBuffer",null);a(this,"dummyBuffer");a(this,"boundResolveBuffers",null);a(this,"size",0);a(this,"tileSize",8);a(this,"tileCount",0);a(this,"cellSize",4);a(this,"referenceHeight",1080);a(this,"workGroupSizeX",8);a(this,"workGroupSizeY",8);a(this,"traceLanesMax",8);a(this,"evictFramesMin",2);a(this,"resetPending",!0);a(this,"sunEnabled",!1);a(this,"sunDirection",new S);a(this,"sunRadius",0);a(this,"sunClearPending",!1);a(this,"cameraHistory",[]);a(this,"changeVersion",0);a(this,"_converging",!0);a(this,"_settling",!1);a(this,"reading",!1);a(this,"cityVersion",-1);a(this,"frameCount",0);a(this,"wantedCells",0);a(this,"unconvergedCells",0);a(this,"cellCount",0);a(this,"onChange",null);a(this,"enabled");a(this,"sizeParam");a(this,"_view",0);a(this,"texelsPerPixel");a(this,"texelSizeMin");a(this,"levelAngle");a(this,"blurTexelScale");a(this,"searchCount");a(this,"sampleCount");a(this,"tailSampleCountMax");a(this,"referenceCellSize");a(this,"traceSamplesMax");a(this,"accumulationMax");a(this,"packedTexels");a(this,"ancestorLevels");a(this,"seedCount");a(this,"ancestorWeight");a(this,"evictFrames");a(this,"evictDistance");a(this,"convergedFraction");a(this,"convergedPaths");a(this,"settleFraction");a(this,"stochasticLevels");a(this,"levelBlend");a(this,"resolution");a(this,"halfResNearest");a(this,"halfResPass");a(this,"log");a(this,"rayGraph");a(this,"rayCountGraph");a(this,"screenCells",0);this.renderer=e,this.cityScene=new Ee(e,ga);const r=[le,Zn,Gt,_t,pt,jr,Hr,mt],n=ta,i={includes:r,defines:Ee.traceDefines,asyncPipeline:!0};this.claimShader=new Me(e,"claimSkyVisibilityLightmap",n,{...i,kernel:"claim_main"}),this.selectShader=new Me(e,"selectSkyVisibilityLightmap",n,{...i,kernel:"select_main"}),this.traceShader=new Me(e,"traceSkyVisibilityLightmap",n,{...i,kernel:"trace_main"}),this.clearSunShader=new Me(e,"clearSunSkyVisibilityLightmap",n,{...i,kernel:"clear_sun_main"}),this.updateShaders=[this.claimShader,this.selectShader,this.traceShader,this.clearSunShader];for(const s of this.updateShaders)s.setConstant("WORK_GROUP_SIZE_X",this.workGroupSizeX),s.setConstant("WORK_GROUP_SIZE_Y",this.workGroupSizeY),s.setConstant("TRACE_GROUP_SIZE",this.workGroupSizeX*this.workGroupSizeY),s.setConstant("CELL_SIZE",this.cellSize),s.setConstant("TILE_SIZE",this.tileSize),this.cityScene.bind(s);this.blueNoise=new Js(e,t);for(const s of this.updateShaders)s.setTexture("blueNoiseTexture",this.blueNoise);this.tileCountBuffer=e.createBuffer(4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC),this.traceArgsBuffer=e.createBuffer(32,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC),this.traceIndirectBuffer=e.createBuffer(16,GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST),this.dummyBuffer=e.createBuffer(16,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);for(const s of this.updateShaders)s.setBuffer("tileCount",this.tileCountBuffer),s.setBuffer("traceArgs",this.traceArgsBuffer);this.rayCountGraph=new fa(e,this.traceArgsBuffer)}init(e){const t=()=>this.paramChanged(),r=e.addGroup("virtual lightmap");this.enabled=r.addParamBool("enabled",!0,{callback:t}),r.addButton("reset",{callback:()=>this.reset()}),this.rayGraph=r.addParamBool("rayGraph",!1),this.sizeParam=r.addParamSelect("lightmapSize",je.indexOf(2048),je.map(String),{callback:t}),this.stochasticLevels=r.addParamBool("stochasticLevels",!0,{callback:t}),this.levelBlend=r.addParamFloat("levelBlend",.5,.05,1,{callback:t}),this.resolution=r.addParamSelect("resolution",1,xa,{callback:t}),this.halfResNearest=r.addParamBool("halfResNearest",!1,{callback:t}),this.log=r.addLog("tiles: 0"),this.halfResPass=new aa(this.renderer,Ot.resolveIncludes);for(const s of this.halfResPass.materials)this.addResolveMaterial(s);const n=r.addGroup("texels");this.texelsPerPixel=n.addParamFloat("texelsPerPixel",.25,.05,1,{callback:t}),this.blurTexelScale=n.addParamFloat("blurTexelScale",1,0,4,{callback:t}),this.texelSizeMin=n.addParamFloat("texelSizeMin",.2,.01,1,{callback:t}),this.levelAngle=n.addParamFloat("levelAngle",.5,0,1,{callback:t}),this.searchCount=n.addParamInt("searchCount",8,1,32,{callback:t}),n.collapsed=!0;const i=r.addGroup("update");this.sampleCount=i.addParamInt("sampleCount",8,8,64,{step:8,callback:t}),this.tailSampleCountMax=i.addParamInt("tailSampleCountMax",128,8,256,{step:8,callback:t}),this.referenceCellSize=i.addParamFloat("referenceCellSize",4,1,16,{callback:t}),this.traceSamplesMax=i.addParamInt("traceSamplesMax",512,64,8192,{step:64,callback:t}),this.accumulationMax=i.addParamInt("accumulationMax",1024,8,2048,{step:8,callback:t}),this.packedTexels=i.addParamBool("packedTexels",!0,{callback:()=>this.setPackedTexels()});for(const s of[...this.updateShaders,...this.resolveMaterials])s.setConstant("PACKED_TEXELS",this.packed);this.ancestorLevels=i.addParamInt("ancestorLevels",2,0,4,{callback:t}),this.seedCount=i.addParamFloat("seedCount",32,0,512,{callback:t}),this.ancestorWeight=i.addParamFloat("ancestorWeight",64,0,512,{callback:t}),this.evictFrames=i.addParamFloat("evictFrames",30,1,1e3),this.evictDistance=i.addParamFloat("evictDistance",50,1,1e3),this.convergedFraction=i.addParamFloat("convergedFraction",.005,0,.05,{callback:t}),this.convergedPaths=i.addParamInt("convergedPaths",256,0,2048,{step:16,callback:t}),this.settleFraction=i.addParamFloat("settleFraction",.02,0,.2,{callback:t}),i.collapsed=!0,r.collapsed=!0}setQuality(e,t,r,n,i,s,o){const l=je.indexOf(e);if(l<0)throw new Error(`[SkyVisibilityLightmap] no lightmap size ${e}`);this.sizeParam.setValue(l),this.texelsPerPixel.setValue(t),this.traceSamplesMax.setValue(r),this.sampleCount.setValue(n),this.referenceCellSize.setValue(i),this.resolution.setValue(s),this.searchCount.setValue(o)}get halfResBilinear(){return this.resolution.value===2}get halfResActive(){return this.enabled.value&&this.lightingBuffer!=null&&this.resolution.value!==0&&this._view!==4}get active(){return this.enabled.value}get view(){return this._view}set view(e){e!==this._view&&(this._view=e,this.paramChanged())}get showsLightmap(){return this.enabled.value&&this._view===4}get converging(){return this.enabled.value&&this._converging}get settling(){return this.converging&&this._settling}markChanged(){this.changeVersion++,this._converging=!0,this._settling=!1}paramChanged(){var e;this.markChanged(),(e=this.onChange)==null||e.call(this)}setSun(e,t,r){if(e!==this.sunEnabled){this.sunEnabled=e;for(const n of[...this.updateShaders,...this.halfResPass.materials])n.setConstant("LIGHTMAP_SUN",e);this.size=0,this.markChanged()}e&&(!t.equals(this.sunDirection)||r!==this.sunRadius)&&(this.sunDirection.copy(t),this.halfResPass.sunDirection.copy(t),this.sunRadius=r,this.sunClearPending=!0,this.markChanged())}reset(){this.resetPending=!0,this.paramChanged()}addResolveMaterial(e,t=!1){this.resolveMaterials.push(e),t&&(this.viewMaterials.add(e),e.setConstant("LIGHTMAP_VIEW",this._view)),e.setConstant("TILE_SIZE",this.tileSize),e.setConstant("PACKED_TEXELS",this.packed),this.size>0&&(e.setConstant("LIGHTMAP_SIZE",this.size),e.setConstant("TILE_COUNT",this.tileCount)),this.bindResolveBuffers(e)}bindResolveBuffers(e){var r;const t=((r=this.enabled)==null?void 0:r.value)&&this.tileBuffer!=null;e.setBuffer("tileBuffer",t?this.tileBuffer:this.dummyBuffer),e.setBuffer("lightingBuffer",t?this.lightingBuffer:this.dummyBuffer)}getLightingBytes(e){return e*e*4*(this.sunEnabled&&!this.packed?2:1)}getFittingSize(e){const t=this.renderer.device.limits,r=Math.min(t.maxStorageBufferBindingSize,t.maxBufferSize);if(this.getLightingBytes(e)<=r)return e;const n=je.filter(s=>s<e&&this.getLightingBytes(s)<=r),i=n.length>0?n[n.length-1]:je[0];return i!==this.size&&console.warn(`[SkyVisibilityLightmap] lightmap ${e} needs ${this.getLightingBytes(e)} bytes, over the storage binding limit ${r}: ${i} instead`),i}createLightmapBuffers(e){var t,r,n,i;(t=this.tileBuffer)==null||t.destroy(),(r=this.tileTimeBuffer)==null||r.destroy(),(n=this.lightingBuffer)==null||n.destroy(),(i=this.claimBuffer)==null||i.destroy(),this.size=e,this.tileCount=Math.pow(e/this.tileSize,2),this.tileBuffer=this.renderer.createBuffer(this.tileCount*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.tileTimeBuffer=this.renderer.createBuffer(this.tileCount*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.lightingBuffer=this.renderer.createBuffer(this.getLightingBytes(e),GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.claimBuffer=this.renderer.createBuffer(e*e*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);for(const s of[...this.updateShaders,...this.resolveMaterials])s.setConstant("LIGHTMAP_SIZE",e),s.setConstant("TILE_COUNT",this.tileCount);for(const s of this.updateShaders)s.setBuffer("tileBuffer",this.tileBuffer),s.setBuffer("tileTimeBuffer",this.tileTimeBuffer),s.setBuffer("lightingBuffer",this.lightingBuffer),s.setBuffer("claimBuffer",this.claimBuffer);this.boundResolveBuffers=null,this.resetPending=!0,_.log(`[SkyVisibilityLightmap] lightmap ${e} x ${e}, ${this.tileCount} tiles`)}setAll(e,t){for(const r of this.updateShaders)r.setFloat(e,t)}setResolveUniforms(e,t,r,n){const i=this.enabled.value&&this.lightingBuffer!=null?this.lightingBuffer:null,s=i!==this.boundResolveBuffers;this.boundResolveBuffers=i;for(const o of this.resolveMaterials){s&&this.bindResolveBuffers(o);const l=n&&this.stochasticLevels.value;this.viewMaterials.has(o)?(o.setConstant("LIGHTMAP_ENABLED",i!=null),o.setConstant("LIGHTMAP_HALF_RES",this.halfResActive),o.setConstant("STOCHASTIC_LEVEL",l),o.setConstant("LIGHTMAP_VIEW",this._view),o.setConstant("HALF_RES_BILINEAR",this.halfResBilinear)):(o.setBool("lightmapEnabled",i!=null),o.setBool("lightmapHalfRes",this.halfResActive),o.setBool("stochasticLevel",l));const h=this.gBufferWidth||this.renderer.canvas.width,u=this.gBufferHeight||this.renderer.canvas.height;o.setFloat("pixelSize",this.getPixelSize(e,h,u)),o.setFloat("pixelScale",this.getPixelScale(h,u)),o.setFloat("texelsPerPixel",this.texelsPerPixel.value),o.setFloat("texelSizeMin",this.texelSizeMin.value*r),o.setFloat("levelAngle",this.levelAngle.value),o.setFloat("blurSlope",t.slope),o.setFloat("blurMax",t.max),o.setFloat("blurTexelScale",this.blurTexelScale.value),o.setFloat("searchCount",this.searchCount.value),o.setFloat("accumulationMax",this.getAccumulationMax()),o.setFloat("ancestorWeight",this.ancestorWeight.value),o.setFloat("levelBlend",this.levelBlend.value),o.setFloat("atlasStep",oe.atlasStep(r))}this.halfResPass.bilinear=this.halfResBilinear,this.halfResPass.nearest=this.halfResNearest.value}update(e){var g;if(!this.enabled.value)return;const{camera:t,metersToNorm:r}=e;e.changed&&this.markChanged();const n=this.getFittingSize(je[this.sizeParam.value]);n!==this.size&&this.createLightmapBuffers(n),this.cityScene.enable();const i=e.gBuffer.target,s=Math.max(1,Math.round(this.referenceCellSize.value*this.getPixelScale(i.width,i.height)));if(s!==this.cellSize){this.cellSize=s;for(const y of this.updateShaders)y.setConstant("CELL_SIZE",s)}let o=!0;for(const y of this.updateShaders)o=y.ready&&o;if(!o)return;this.resetPending?(this.renderer.clearBuffer(this.tileBuffer),this.renderer.clearBuffer(this.tileTimeBuffer),this.renderer.clearBuffer(this.lightingBuffer),this.renderer.clearBuffer(this.claimBuffer),this.renderer.clearBuffer(this.tileCountBuffer),this.renderer.clearBuffer(this.traceArgsBuffer),this.cameraHistory.length=0,this.cityScene.clearChanges(),this.resetPending=!1,this.sunClearPending=!1):this.sunClearPending&&(this.packed?this.renderer.dispatchCompute(this.clearSunShader,Math.ceil(n/this.workGroupSizeX),Math.ceil(n/this.workGroupSizeY),1):this.renderer.clearBuffer(this.lightingBuffer,n*n*4,n*n*4),this.sunClearPending=!1);const l=this.renderer.time.frameNumber;this.cityScene.update(l),this.cityScene.version!==this.cityVersion&&(this.cityVersion=this.cityScene.version,this.markChanged()),this.gBufferWidth=i.width,this.gBufferHeight=i.height;const h=Math.ceil(i.width/(this.workGroupSizeX*this.cellSize)),u=Math.ceil(i.height/(this.workGroupSizeY*this.cellSize)),d=h*this.workGroupSizeX*u*this.workGroupSizeY;if(this.screenCells=Math.ceil(i.width/this.cellSize)*Math.ceil(i.height/this.cellSize),!this.traceCellsBuffer||this.traceCellsBuffer.size<d*8){(g=this.traceCellsBuffer)==null||g.destroy(),this.traceCellsBuffer=this.renderer.createBuffer(d*8,GPUBufferUsage.STORAGE);for(const y of this.updateShaders)y.setBuffer("traceCells",this.traceCellsBuffer)}const f=this.getSampleCount(e.changed),m=this.getTraceLanes(f),p=Math.max(1,Math.floor(this.traceSamplesMax.value*1e3/f));for(const y of this.updateShaders)y.setVector2("resolution",i.size),y.setMatrix("inverseProjection",t.projectionMatrix.inverse),y.setMatrix("inverseView",t.viewMatrix.inverse),y.setMatrix("viewProjection",t.viewProjection),y.setVector3("cameraPosition",t.worldPosition),y.setTexture("gBufferTexture",e.gBuffer.view),y.setTexture("gBufferAtlasTexture",e.gBuffer.atlasView),y.setTexture("gBufferDepth",e.gBuffer.depthView),y.setVector2("depthParams",oe.depthParams(t)),y.setFloat("atlasStep",oe.atlasStep(r));this.setAll("frame",l),this.setAll("pixelSize",this.getPixelSize(t,i.width,i.height)),this.setAll("pixelScale",this.getPixelScale(i.width,i.height)),this.setAll("texelsPerPixel",this.texelsPerPixel.value),this.setAll("texelSizeMin",this.texelSizeMin.value*r),this.setAll("levelAngle",this.levelAngle.value),this.setAll("blurSlope",e.blur.slope),this.setAll("blurMax",e.blur.max),this.setAll("blurTexelScale",this.blurTexelScale.value),this.setAll("sampleCount",f),this.setAll("accumulationMax",this.getAccumulationMax()),this.setAll("ancestorLevels",this.ancestorLevels.value),this.setAll("seedCount",this.seedCount.value),this.setAll("evictFrames",this.getEvictFrames(t,l,r)),this.setAll("searchCount",this.searchCount.value),this.setAll("traceLanes",m),this.setAll("traceCellsMax",p),this.setAll("convergedPaths",this.convergedPaths.value);for(const y of this.updateShaders)y.setVector3("sunDirection",this.sunDirection);this.setAll("sunRadius",this.sunRadius);const x=Math.max(1,Math.round(f/pa));this.setAll("sunSampleCount",x),this.setAll("sunSampleCountPenumbra",Math.max(x,Math.round(f/ma)));const b=4+(l&1);this.renderer.clearBuffer(this.traceArgsBuffer,0,16),this.renderer.clearBuffer(this.traceArgsBuffer,24,4),this.renderer.clearBuffer(this.traceArgsBuffer,b*4,4),this.renderer.dispatchCompute(this.claimShader,h,u,1),this.renderer.dispatchCompute(this.selectShader,h,u,1),this.rayGraph.value&&this.rayCountGraph.record(b,f,p),this.renderer.copyBufferToBuffer(this.traceArgsBuffer,this.traceIndirectBuffer,0,0,16),this.renderer.dispatchComputeIndirect(this.traceShader,this.traceIndirectBuffer),this.readBack(b,p,d,f),this.frameCount++}drawRayGraph(){!this.rayGraph.value||!this.enabled.value||this.screenCells===0||this.rayCountGraph.draw(this.screenCells*this.sampleCount.value,this.traceSamplesMax.value*1e3)}readBack(e,t,r,n){if(this.reading)return;this.reading=!0;const i=this.changeVersion,s=this.frameCount%30===0,o=[this.renderer.readBuffer(this.traceArgsBuffer,Uint32Array)];s&&o.push(this.renderer.readBuffer(this.tileCountBuffer,Uint32Array)),Promise.all(o).then(([l,h])=>{this.reading=!1;const u=l[e];if(this.wantedCells=u,this.unconvergedCells=l[6],this.cellCount=r,h){const f=this.cityScene,m=Math.min(l[3],t),p=`${n} paths per cell, ${(m*n/1e3).toFixed(0)}k of ${this.traceSamplesMax.value}k max`;this.log.setValue(`tiles: ${h[0]} / ${this.tileCount} (${(h[0]/this.tileCount*100).toFixed(1)}%)
tracing ${m} of ${u} / ${r} cells
${p}
city: ${f.tileCount} tiles, ${(f.usedVec4s*16/1048576).toFixed(1)} MB`)}if(i!==this.changeVersion)return;const d=l[6]>this.convergedFraction.value*r;this._settling=l[6]<=this.settleFraction.value*r,d!==this._converging&&_.ENABLED&&_.log(`[SkyVisibilityLightmap] ${d?"converging":"converged"}`),this._converging=d}).catch(()=>{this.reading=!1})}getSampleCount(e){const t=this.sampleCount.value;if(e||this.wantedCells===0)return t;const r=Math.floor(this.traceSamplesMax.value*1e3/this.wantedCells/8)*8,n=Math.floor(Math.min(this.tailSampleCountMax.value,this.getAccumulationMax())/8)*8;return Math.max(t,Math.min(r,n))}getEvictFrames(e,t,r){const n=e.worldPosition.clone(),i=this.cameraHistory,s=Math.ceil(this.evictFrames.value);for(;i.length>0&&t-i[0].frame>s;)i.shift();let o=s;const l=this.evictDistance.value*r;for(let h=i.length-1;h>=0;h--)if(S.distance(i[h].position,n)>l){o=t-i[h].frame;break}return i.push({frame:t,position:n}),Math.min(Math.max(o,this.evictFramesMin),s)}getTraceLanes(e){const t=i=>e/(i*Math.ceil(e/i)),r=[];for(let i=this.traceLanesMax;i>=1;i/=2)r.push(i);const n=Math.max(...r.map(t));return r.find(i=>t(i)>=n-1/8)}get packed(){var e;return((e=this.packedTexels)==null?void 0:e.value)??!1}getAccumulationMax(){const e=this.accumulationMax.value;return this.packed?Math.floor(Math.min(e,ba)/qr)*qr:e}setPackedTexels(){for(const e of[...this.updateShaders,...this.resolveMaterials])e.setConstant("PACKED_TEXELS",this.packed);this.size=0,this.paramChanged()}getPixelScale(e,t){return Math.sqrt(e*t/(this.referenceHeight*this.referenceHeight*16/9))}getPixelSize(e,t,r){return Math.tan(e.projection.FOV*.5)*2/r*this.getPixelScale(t,r)}destruct(){var e,t,r,n,i,s;(e=this.tileBuffer)==null||e.destroy(),(t=this.tileTimeBuffer)==null||t.destroy(),(r=this.lightingBuffer)==null||r.destroy(),(n=this.claimBuffer)==null||n.destroy(),(i=this.traceCellsBuffer)==null||i.destroy(),this.tileCountBuffer.destroy(),this.traceArgsBuffer.destroy(),this.traceIndirectBuffer.destroy(),this.dummyBuffer.destroy(),(s=this.halfResPass)==null||s.destruct(),this.rayCountGraph.destruct(),this.cityScene.destruct()}};a(Ot,"resolveIncludes",[le,_t,pt,jr,Hr,ea]);let Ve=Ot;const ya=`// The shading of MapWorld from its gBuffer (see MapGBuffer.ts), once per pixel: the forward shading of\r
// osm/shading.wgsl (sun with the VSM cascades, sky times the albedo, fog, dither, selection highlight) with the\r
// sky visibility lightmap in place of the sky term when it is enabled. The forward pass did the lightmap\r
// gather for every fragment of the overdraw, which made it the most expensive pass.\r
// The water reflects the buildings: a ray from a water pixel, mirrored on its normal, traced against the city\r
// (isOccluded of skyVisibilityTrace.wgsl) darkens the pixel when it hits a building. The ray is mirrored on the animated\r
// micro normal of the ripples (rippleTexture, see WaterRippleTexture.ts), which makes the reflections wobble. A ray\r
// that misses the buildings reflects the sun where it points at it: the glints on the ripples. The rays are traced here, a\r
// ray per water pixel, or by the half resolution pass before it (REFLECTIONS_HALF_RES, see WaterReflectionHalfRes.ts).\r
// The sun shadows (SUN_SHADOWS) are the VSM cascades, a ray to the sun traced against the same city (getRayTracedShadow),\r
// or the sun visibility the lightmap texels hold (the zw of getLightmapLookup: from the half resolution samples, or in\r
// the lookup of the sky visibility).\r
// The ground above the snow line is snow covered: its albedo goes to the snow color (snow.wgsl, see setSnow).\r
// Needs snow.wgsl, hash.wgsl, r2.wgsl, toneMap.wgsl, cameraRay.wgsl, waterReflection.wgsl, skyVisibilityTrace.wgsl and the includes of the lightmap resolve (see SkyVisibilityLightmap.resolveIncludes):\r
// the lightmap holds the part of the sky a point sees, times the sky color here\r
\r
struct Uniforms {\r
  inverseProjection : mat4x4<f32>,\r
  inverseView : mat4x4<f32>,\r
  viewProjection : mat4x4<f32>,\r
  // the sun's view of the ground for the ray traced shadows (SUN_SHADOWS 2 and 3), see terrainSun.wgsl\r
  terrainSunViewProjection : mat4x4<f32>,\r
  cameraPosition : vec3<f32>,\r
  resolution : vec2<f32>,\r
  lightDirection : vec3<f32>,\r
  skyColor : vec3<f32>,\r
  sunColor : vec3<f32>,\r
  backgroundColor : vec3<f32>,\r
  distanceFog : f32,\r
  // where the fog is 1, see getFog\r
  viewDistanceMax : f32,\r
  contrast : f32,\r
  // scales the linear color before the tone map (TONE_MAP)\r
  exposure : f32,\r
  shadowStrength : f32,\r
  VSMBleedThreshold : f32,\r
  varianceMin : f32,\r
  // for the noise of stochasticLevel\r
  frame : f32,\r
  // the sky visibility lightmap (LIGHTMAP_ENABLED), see SkyVisibilityLightmap.setResolveUniforms\r
  pixelSize : f32,\r
  pixelScale : f32,\r
  texelsPerPixel : f32,\r
  texelSizeMin : f32,\r
  levelAngle : f32,\r
  blurSlope : f32,\r
  blurMax : f32,\r
  blurTexelScale : f32,\r
  searchCount : u32,\r
  accumulationMax : f32,\r
  ancestorWeight : f32,\r
  // the part of a level in which the 2 levels around it blend, see getLevelBlend\r
  levelBlend : f32,\r
  // the step of the wall atlas positions in the gBuffer, see MapGBuffer.atlasStep\r
  atlasStep : f32,\r
  // see getGBufferDistance\r
  depthParams : vec2<f32>,\r
  // the water reflections (WATER_REFLECTIONS): the gBuffer materials of the water, a bit each\r
  waterMaterials : u32,\r
  // how much darker the water is where its reflection hits a building\r
  reflectionDarkening : f32,\r
  // the city the reflections trace, see CityScene.bind\r
  cityTileCount : u32,\r
  cityRoot : u32,\r
  // the size of the tile of rippleTexture in world units (WATER_RIPPLES), see getRippleNormal\r
  rippleTile : f32,\r
  // the brightness of the sun reflected in the water, times the sun color\r
  sunReflection : f32,\r
  // the phong exponent of the reflection of the sun: higher is a smaller, sharper glint per ripple\r
  sunReflectionPower : f32,\r
  // the sun in the sky: the angular radius of its disc in radians, and the brightness of the glow around it\r
  sunSize : f32,\r
  sunGlow : f32,\r
  // the angular radius of the sun the soft ray traced shadows sample (SOFT_SHADOWS), in radians\r
  shadowSunRadius : f32,\r
  // the SSAO on the sky term (SSAO_SKY), see getSSAO: its amount, and the samples over which it fades in\r
  ssaoAmount : f32,\r
  ssaoFadeCount : f32,\r
  // which pixel of its 2 x 2 blocks the half resolution reflection pass traced (REFLECTIONS_HALF_RES), see\r
  // getReflectionSampleOffset\r
  reflectionPhase : u32,\r
  // the sky the water mirrors (WATER_REFLECTIONS), weighted by the fresnel term of the water (Schlick, WATER_F0): scales\r
  // the fresnel weight, 0 no sky in the water\r
  skyReflection : f32,\r
  // how much brighter the glints of the sun get at grazing angles, by the same fresnel term: 0 the same at every angle\r
  sunFresnel : f32,\r
  // how far a point goes off its surface before it is compared with terrainSunMap, see getTerrainSunShadow\r
  terrainSunOffset : f32,\r
  // the snow on the ground (snow.wgsl): the gBuffer materials it lies on, a bit each (0 no snow), the snow line in world\r
  // y, how far (m) the noise moves it, the meters per world unit, and its albedo (as the param, not squared)\r
  snowMaterials : u32,\r
  snowLine : f32,\r
  snowNoise : f32,\r
  snowMetersPerUnit : f32,\r
  snowColor : vec3<f32>,\r
};\r
\r
// the reflectance of water seen straight down (index of refraction 1.33)\r
const WATER_F0 = .02;\r
\r
// the debug view of the lightmap, see LightmapView in SkyVisibilityLightmap.ts: 0 shaded, 1 the indirect light only, 2\r
// the levels, 3 the texels still converging, 4 the lightmap itself (see getLightmapViewColor), 5 the tiles and texels.\r
// A constant, so the shaded view has none of the branches of the others\r
override LIGHTMAP_VIEW : u32 = 0u;\r
// the half resolution lightmap from halfResFiltered, bilinearly across the surfaces (getHalfResLightingBilinear), instead\r
// of the samples of halfResTexture on the surface of the pixel (getHalfResLighting)\r
override HALF_RES_BILINEAR : bool = false;\r
// The feature switches: constants (set by the host, a pipeline per combination), so the shader of a setting has none of\r
// the code of the others.\r
// the sky visibility lightmap in place of the sky term, see SkyVisibilityLightmap.setResolveUniforms\r
override LIGHTMAP_ENABLED : bool = false;\r
// the lightmap from the half resolution samples of halfResTexture, see getHalfResLighting\r
override LIGHTMAP_HALF_RES : bool = false;\r
// a pixel reads 1 of the 2 levels around its level, picked by noise: the TAA averages it, see getLightmapLightingStochastic\r
override STOCHASTIC_LEVEL : bool = false;\r
// the water reflections, of the materials in waterMaterials, see DeferredShading.setWaterReflections\r
override WATER_REFLECTIONS : bool = false;\r
// the reflection rays are traced against the buildings, else only the sun is reflected\r
override REFLECT_BUILDINGS : bool = false;\r
// the reflections are mirrored on the ripples of rippleTexture, else on the flat water\r
override WATER_RIPPLES : bool = false;\r
// REFLECT_BUILDINGS from the samples of reflectionTexture, 1 traced ray per 2 x 2 pixels (see getHalfResReflection),\r
// instead of a ray per water pixel here\r
override REFLECTIONS_HALF_RES : bool = false;\r
// the debug views of the sun shadows (MapWorld's drawMode): 0 off, 1 the shadow lookup (getSunShadow) alone, black on the\r
// faces away from the sun, 2 the\r
// cascade of each pixel in a color (cascadeDebugColor)\r
override SHADOW_VIEW : u32 = 0u;\r
// the linear color, times the exposure, goes through acesTonemap (toneMap.wgsl) before the gamma: the sun, the sky and the glints add up\r
// to more than 1, which the output would clip. Else it is only clamped by the contrast's smoothstep\r
override TONE_MAP : bool = true;\r
// where the sun shadows come from, ShadowMode of MapWorldSettings.ts: 0 none, 1 the VSM cascades (getShadowMap), 2 the sun\r
// visibility of the lightmap texels (getLightmapLookup, the rays while the lightmap has no buffers: LIGHTMAP_ENABLED\r
// false), 3 a ray per pixel against the city (getRayTracedShadow)\r
override SUN_SHADOWS : u32 = 1u;\r
// the rays sample the disc of the sun, a point per pixel and frame, which the TAA averages into a penumbra. Else they go\r
// to its center: hard shadows without noise, for the image without the TAA\r
override SOFT_SHADOWS : bool = false;\r
// the SSAO (ssaoTexture) darkens only the sky term, see getSSAO. Else it is multiplied over the whole image after the TAA\r
// (reprojectedSSAOComposite.wgsl), the sun too\r
override SSAO_SKY : bool = false;\r
\r
struct ShadowMapData {\r
  shadowMapViewProjection : mat4x4<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var shadowMapSampler : sampler;\r
// the 4 cascades, one layer each (ShadowMap.cascadeTexture)\r
@group(0) @binding(2) var shadowMaps : texture_2d_array<f32>;\r
@group(0) @binding(6) var<storage, read> shadowMapData : array<ShadowMapData>;\r
@group(0) @binding(7) var<storage, read> tileBuffer : array<u32>;\r
// the sky visibility lightmap: 1 word per texel, see SkyVisibilityLightmap\r
@group(0) @binding(8) var<storage, read> lightingBuffer : array<u32>;\r
// the gBuffer: its 2 targets and its depth, see mapGBufferPacking.wgsl\r
@group(0) @binding(10) var gBufferTexture : texture_2d<u32>;\r
@group(0) @binding(12) var gBufferAtlasTexture : texture_2d<u32>;\r
@group(0) @binding(13) var gBufferDepth : texture_depth_2d;\r
// the albedo of each material of the gBuffer, see MapGBuffer.paletteBuffer\r
@group(0) @binding(11) var<storage, read> materialPalette : array<vec4<f32>>;\r
// the sky visibility lightmap at half resolution, see skyVisibilityHalfRes.wgsl\r
@group(0) @binding(14) var halfResTexture : texture_2d<u32>;\r
// the sky and the sun visibility alone (rg16float), for HALF_RES_BILINEAR. Bilinear, clamped to the edge\r
@group(0) @binding(18) var halfResFiltered : texture_2d<f32>;\r
@group(0) @binding(19) var halfResSampler : sampler;\r
// the buildings the water reflections trace, see CityScene and skyVisibilityTrace.wgsl\r
@group(0) @binding(17) var<storage, read> cityBuffer : array<vec4<f32>>;\r
// the ripples of the water, the tiling gradient of their height (dh/dx, dh/dz), see WaterRippleTexture.ts\r
@group(0) @binding(20) var rippleTexture : texture_2d<f32>;\r
@group(0) @binding(21) var rippleSampler : sampler;\r
// 2d blue noise for the points on the sun of the soft ray traced shadows (rg16unorm), see BlueNoiseTexture2D16Bits\r
@group(0) @binding(22) var blueNoiseTexture : texture_2d<f32>;\r
// the SSAO of this frame (SSAO_SKY): (visibility, sample count, camera distance, 0), see reprojectedSSAO.wgsl\r
@group(0) @binding(23) var ssaoTexture : texture_2d<f32>;\r
// the reflection rays of the water at half resolution (REFLECTIONS_HALF_RES): x 0 no water, .5 the ray reaches the sky, 1\r
// it hits a building, yzw the ray, see waterReflectionHalfRes.wgsl\r
@group(0) @binding(24) var reflectionTexture : texture_2d<f32>;\r
// the ground as the sun sees it (TerrainSunMap.ts): the hills for the ray traced sun shadows, see terrainSun.wgsl\r
@group(0) @binding(25) var terrainSunMap : texture_2d<f32>;\r
\r
// SSAO_SKY: the part of the sky the SSAO sees around the pixel, relative to an open point (1), like the composite\r
// (reprojectedSSAOComposite.wgsl) applies it: faded in over its first samples, times its amount. No fog fade: the fog\r
// is mixed in after the shading. 1 without SSAO_SKY\r
fn getSSAO(coord : vec2<u32>) -> f32 {\r
  if (!SSAO_SKY) {\r
    return 1.0;\r
  }\r
  let s = textureLoad(ssaoTexture, coord, 0);\r
  let strength = clamp(s.y / uniforms.ssaoFadeCount, 0.0, 1.0) * uniforms.ssaoAmount;\r
  return mix(1.0, clamp(s.x, 0.0, 1.0), strength);\r
}\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  return output;\r
}\r
\r
// --- Variance shadow map sampling, as in shading.wgsl -------------------------\r
\r
fn shadowUVDepthStrength(p : vec3<f32>, i : u32) -> vec4<f32> {\r
  let screen = shadowMapData[i].shadowMapViewProjection * vec4<f32>(p, 1.0);\r
  let uv = screen.xy / screen.w;\r
  let depth = -p.y;\r
  let s2 = vec2<f32>(1.) - smoothstep(vec2<f32>(0.4), vec2<f32>(1.0), abs(uv));\r
  return vec4<f32>(uv, depth, min(s2.x, s2.y));\r
}\r
\r
fn sampleShadowMoments(i : u32, uv : vec2<f32>) -> vec2<f32> {\r
  return textureSampleLevel(shadowMaps, shadowMapSampler, uv, i, 0.0).xy;\r
}\r
\r
fn shadowCascade(uv : vec2<f32>, i : u32, dist : f32) -> f32 {\r
  var shadowMapUV = uv * 0.5 + 0.5;\r
  shadowMapUV.y = 1.0 - shadowMapUV.y;\r
  let moments = sampleShadowMoments(i, shadowMapUV);\r
  let lit = step(dist, moments.x);\r
  var variance = moments.y - moments.x * moments.x;\r
  variance = max(variance, uniforms.varianceMin * uniforms.varianceMin);\r
  let d = dist - moments.x;\r
  let s = variance / (variance + d * d);\r
  return smoothstep(uniforms.VSMBleedThreshold, 1.0, max(lit, s));\r
}\r
\r
// how many texels of a cascade a point goes off its surface along its normal before the lookup: the ground at a low sun\r
// spans many texels along the sun (tens of meters each in the far cascades), its own heights in them would shadow it\r
const SHADOW_NORMAL_OFFSET = 1.5;\r
\r
// the size of a texel of cascade i in world units: its half-extent is 1 over the length of the first row of its matrix\r
fn shadowTexelSize(i : u32) -> f32 {\r
  let m = shadowMapData[i].shadowMapViewProjection;\r
  return 2.0 / (f32(textureDimensions(shadowMaps).x) * length(vec3<f32>(m[0].x, m[1].x, m[2].x)));\r
}\r
\r
// The cascades front to back, each taking its weight (1 inside, fading out over its edge) of what the ones before it\r
// left. Each cascade is re-rendered around a center of its own, so the next one need not cover the edge of the one\r
// before it: that point goes on to the first one that does. What no cascade covers is lit, so past the last cascade the\r
// shadows fade out instead of ending at a hard edge.\r
fn getShadowMap(p : vec3<f32>, n : vec3<f32>) -> f32 {\r
  var shadow = 0.0;\r
  var remaining = 1.0;\r
  for (var i = 0u; i < 4u; i++) {\r
    let u = shadowUVDepthStrength(p + n * (SHADOW_NORMAL_OFFSET * shadowTexelSize(i)), i);\r
    if (u.w > 0.0) {\r
      shadow += remaining * u.w * shadowCascade(u.xy, i, u.z);\r
      remaining *= 1.0 - u.w;\r
      if (remaining <= 0.0) {\r
        break;\r
      }\r
    }\r
  }\r
  return shadow + remaining;\r
}\r
\r
// the offset of the origin of a shadow ray from its surface along the normal, times the camera distance: the position from\r
// the depth is exact to about 1e-7 of the distance, the normal of the gBuffer to about 1e-4\r
const SHADOW_RAY_BIAS = 1e-4;\r
\r
// SUN_SHADOWS 3: 1 where the sun reaches the point world (with normal n, d from the camera), 0 where a building\r
// or a tree is in the way: a ray traced against the city (isOccluded of skyVisibilityTrace.wgsl), the buildings and the\r
// trees the shadow map draws. SOFT_SHADOWS: to a point on the disc of the sun, shadowSunRadius around lightDirection,\r
// from 2d blue noise per pixel moved along the R2 sequence every frame. Each pixel takes 1 ray per frame, the TAA\r
// averages them: blended like motion while the view changes, its static average converges the penumbra (STATIC_FRAMES\r
// of TAA.ts). Else to the center of the sun: the hard shadow, the same every frame\r
fn getRayTracedShadow(world : vec3<f32>, n : vec3<f32>, d : f32, coord : vec2<u32>) -> f32 {\r
  let l = uniforms.lightDirection;\r
  var rd = l;\r
  if (SOFT_SHADOWS) {\r
    let size = textureDimensions(blueNoiseTexture);\r
    let r = fract(textureLoad(blueNoiseTexture, coord % size, 0).xy + getR2(u32(uniforms.frame)));\r
    let t = normalize(cross(l, select(vec3<f32>(0., 1., 0.), vec3<f32>(1., 0., 0.), abs(l.y) > .5)));\r
    let b = cross(l, t);\r
    // uniform on the disc. Small angles: the tangent offset is the angle\r
    let radius = uniforms.shadowSunRadius * sqrt(r.x);\r
    let phi = 6.28318531 * r.y;\r
    rd = normalize(l + (t * cos(phi) + b * sin(phi)) * radius);\r
  }\r
  let ro = world + n * (d * SHADOW_RAY_BIAS);\r
  return select(1., 0., isOccluded(ro, rd));\r
}\r
\r
// the sun the point gets, 0 to 1, see SUN_SHADOWS. lightmapSun: with SUN_SHADOWS 2 and LIGHTMAP_ENABLED, the sun\r
// visibility of the lightmap texels of the surface point and the paths it holds (zw of getLightmapLookup), lit where it\r
// has none yet. The rays trace only the buildings and the trees: the hills come from the sun's view of the ground\r
// (getTerrainSunShadow). The cascades have the ground in them\r
fn getSunShadow(world : vec3<f32>, n : vec3<f32>, d : f32, coord : vec2<u32>, lightmapSun : vec2<f32>) -> f32 {\r
  if (SUN_SHADOWS == 0u) {\r
    return 1.;\r
  }\r
  if (SUN_SHADOWS == 2u && LIGHTMAP_ENABLED) {\r
    return select(1., lightmapSun.x, lightmapSun.y > 0.) * getTerrainSunShadow(world, n);\r
  }\r
  if (SUN_SHADOWS >= 2u) {\r
    return getRayTracedShadow(world, n, d, coord) * getTerrainSunShadow(world, n);\r
  }\r
  return getShadowMap(world, n);\r
}\r
\r
fn cascadeDebugColor(p : vec3<f32>) -> vec3<f32> {\r
  for (var i = 0u; i < 4u; i++) {\r
    let u = shadowUVDepthStrength(p, i);\r
    if (u.w > 0.0) {\r
      var col = vec3<f32>(0.4);\r
      if (i == 0u) { col = vec3<f32>(1.0, 0.3, 0.3); }\r
      else if (i == 1u) { col = vec3<f32>(0.3, 1.0, 0.3); }\r
      else if (i == 2u) { col = vec3<f32>(0.3, 0.5, 1.0); }\r
      else { col = vec3<f32>(1.0, 1.0, 0.3); }\r
      return col * (0.4 + 0.6 * u.w);\r
    }\r
  }\r
  return vec3<f32>(0.25);\r
}\r
\r
// interleaved gradient noise, moved every frame: a repeat of 64 frames\r
fn getNoise(coord : vec2<u32>) -> f32 {\r
  let p = vec2<f32>(coord) + 5.588238 * (uniforms.frame % 64.);\r
  return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715))));\r
}\r
\r
// the sky and the sun as getLightmapChannels returns them (the paths only as more than 0 or not), from the samples of the\r
// half resolution pass around the pixel (skyVisibilityHalfRes.wgsl), bilinearly: the pixel of the sample of a 2 x 2\r
// block reads only that one, the others 2 or 4 at 1 pixel from them. Only the samples of the surface point of the pixel\r
// (matchesHalfResKeys) count, and per channel only the ones with paths, like the texels of gather. When none of the\r
// samples is on the surface point, the ones with paths count, whatever their surface: the lighting bleeds across\r
// the edge. Straight-line: the 4 loads first (a sample of weight 0 is loaded too, and doesn't count), then the tests and\r
// the sums on all 4 at once. The loop with a branch per sample was 1.27x slower for the same result\r
fn getHalfResLighting(coord : vec2<u32>, surface : Surface) -> vec4<f32> {\r
  let last = textureDimensions(halfResTexture) - 1u;\r
  let h0 = min(coord / 2u, last);\r
  let odd = coord & vec2(1u);\r
  let h1 = min(h0 + odd, last);\r
  let f = vec2<f32>(odd) * .5;\r
  let s00 = textureLoad(halfResTexture, h0, 0).xy;\r
  let s10 = textureLoad(halfResTexture, vec2(h1.x, h0.y), 0).xy;\r
  let s01 = textureLoad(halfResTexture, vec2(h0.x, h1.y), 0).xy;\r
  let s11 = textureLoad(halfResTexture, h1, 0).xy;\r
  let w = vec4((1. - f.x) * (1. - f.y), f.x * (1. - f.y), (1. - f.x) * f.y, f.x * f.y);\r
  let onSurface = matchesHalfResKeys(vec4(s00.y, s10.y, s01.y, s11.y), surface) & (w > vec4(0.));\r
  // the sky and the sun visibility per sample, -1 without paths\r
  let v0 = unpack2x16float(s00.x);\r
  let v1 = unpack2x16float(s10.x);\r
  let v2 = unpack2x16float(s01.x);\r
  let v3 = unpack2x16float(s11.x);\r
  let skyV = vec4(v0.x, v1.x, v2.x, v3.x);\r
  let sunV = vec4(v0.y, v1.y, v2.y, v3.y);\r
  let matched = any(onSurface);\r
  // the weights of the samples on the surface, or of all of them on a miss, per channel of the ones with paths\r
  let wm = select(w, select(vec4(0.), w, onSurface), matched);\r
  let wSky = select(vec4(0.), wm, skyV >= vec4(0.));\r
  let wSun = select(vec4(0.), wm, sunV >= vec4(0.));\r
  let skyW = dot(wSky, vec4(1.));\r
  let sunW = dot(wSun, vec4(1.));\r
  return vec4(select(0., dot(skyV, wSky) / skyW, skyW > 0.), skyW, select(0., dot(sunV, wSun) / sunW, sunW > 0.), sunW);\r
}\r
\r
// HALF_RES_BILINEAR: the sky (x) and the sun visibility (y) of the half resolution samples (skyVisibilityHalfRes.wgsl),\r
// bilinearly, whatever their surface. Of an open sky and lit where the texels have no paths yet. A sample is of the top\r
// left pixel of its 2 x 2 block: the pixel at full resolution position x is at (x - .5) / 2 + .5 in the half resolution\r
// texels\r
fn getHalfResLightingBilinear(coord : vec2<u32>) -> vec2<f32> {\r
  let uv = (vec2<f32>(coord) * .5 + .5) / vec2<f32>(textureDimensions(halfResFiltered));\r
  return textureSampleLevel(halfResFiltered, halfResSampler, uv, 0.0).xy;\r
}\r
\r
// The lightmap at the pixel: the sky visibility (x) and the paths it holds (y, 0 without), and with SUN_SHADOWS 2 the same\r
// of the sun (zw): from the half resolution samples, or looked up here, both channels in 1 lookup (getLightmapChannels:\r
// the same tile probes). sun: the sun is needed (the surface faces it)\r
fn getLightmapLookup(coord : vec2<u32>, surface : Surface, levelF : f32, sun : bool) -> vec4<f32> {\r
  if (LIGHTMAP_HALF_RES) {\r
    if (HALF_RES_BILINEAR) {\r
      let s = getHalfResLightingBilinear(coord);\r
      return vec4<f32>(s.x, 1., s.y, 1.);\r
    }\r
    return getHalfResLighting(coord, surface);\r
  }\r
  let lookupSun = SUN_SHADOWS == 2u && sun;\r
  if (STOCHASTIC_LEVEL) {\r
    return getLightmapChannelsStochastic(surface, levelF, getNoise(coord), lookupSun);\r
  }\r
  return getLightmapChannels(surface, levelF, lookupSun);\r
}\r
\r
// LIGHTMAP_VIEW 4: the lightmap itself instead of the scene, as a square with black borders next to it. The tile slots\r
// laid out in a grid, an empty slot dark red. As in resolveVirtualLightmap.wgsl of the irradiance cache\r
fn getLightmapViewColor(pixel : vec2<f32>) -> vec3<f32> {\r
  let side = min(uniforms.resolution.x, uniforms.resolution.y);\r
  let p = (pixel - (uniforms.resolution - side) * .5) / side;\r
  if (any(p < vec2(0.)) || any(p >= vec2(1.))) {\r
    return vec3(0.);\r
  }\r
  let tilesPerSide = LIGHTMAP_SIZE / TILE_SIZE;\r
  let texel = vec2<u32>(p * f32(LIGHTMAP_SIZE));\r
  let tile = texel / TILE_SIZE;\r
  let tileIndex = tile.y * tilesPerSide + tile.x;\r
  if (tileIndex >= TILE_COUNT || tileBuffer[tileIndex] == 0u) {\r
    return vec3(.5, 0., 0.);\r
  }\r
  let t = texel % TILE_SIZE;\r
  let v = lightingBuffer[(tileIndex * TILE_SIZE + t.y) * TILE_SIZE + t.x];\r
  let c = vec3(select(unpack2x16float(v).x, decodePackedTexel(v).x, PACKED_TEXELS));\r
  // gamma like the shading, clamped like its output\r
  return clamp(sqrt(max(c, vec3(0.))), vec3(0.), vec3(1.));\r
}\r
\r
// how fast the weight of a half resolution reflection sample falls with the difference between its ray and the ray of the\r
// pixel: exp(-REFLECTION_RAY_MATCH * |difference|^2), at 256 half at a difference of 3 degrees\r
const REFLECTION_RAY_MATCH = 256.;\r
\r
// the weight of a sample of reflectionTexture for a pixel with the reflection ray rd, before its bilinear weight: 0 off the\r
// water (no sample), else by how alike the 2 rays are. Never 0 on the water, so samples that all differ still count\r
fn getReflectionSampleWeight(s : vec4<f32>, rd : vec3<f32>) -> f32 {\r
  let difference = s.yzw * 2. - 1. - rd;\r
  return step(.25, s.x) * (exp(-REFLECTION_RAY_MATCH * dot(difference, difference)) + 1e-6);\r
}\r
\r
// REFLECTIONS_HALF_RES: the part of the reflection of the water pixel (its ray rd) that hits a building, 0 to 1, from the\r
// rays the reduced pass traced around it (waterReflectionHalfRes.wgsl): its samples are at the pixel\r
// getReflectionSampleOffset of each block, so a pixel is on a sample or between 2 or 4 of them. Bilinearly, times\r
// how alike the ray of the sample and rd are: the ripples turn the rays of neighbouring pixels degrees apart, and what a\r
// ray hits follows its direction more than its pixel. Without it the reflections are a pixel softer. Only the samples on\r
// the water count, none: no building\r
fn getHalfResReflection(coord : vec2<u32>, rd : vec3<f32>) -> f32 {\r
  let last = vec2<i32>(textureDimensions(reflectionTexture)) - 1;\r
  let block = vec2<i32>(vec2(REFLECTION_BLOCK_X, REFLECTION_BLOCK_Y));\r
  // from the sample of the first block, which the first pixels are before: + block keeps the division rounding down\r
  let p = vec2<i32>(coord) - vec2<i32>(getReflectionSampleOffset(uniforms.reflectionPhase)) + block;\r
  let h = p / block - 1;\r
  let between = p % block;\r
  let h0 = clamp(h, vec2(0), last);\r
  let h1 = clamp(h + min(between, vec2(1)), vec2(0), last);\r
  let f = vec2<f32>(between) / vec2<f32>(block);\r
  let s00 = textureLoad(reflectionTexture, h0, 0);\r
  let s10 = textureLoad(reflectionTexture, vec2(h1.x, h0.y), 0);\r
  let s01 = textureLoad(reflectionTexture, vec2(h0.x, h1.y), 0);\r
  let s11 = textureLoad(reflectionTexture, h1, 0);\r
  let w = vec4((1. - f.x) * (1. - f.y), f.x * (1. - f.y), (1. - f.x) * f.y, f.x * f.y) * vec4(\r
    getReflectionSampleWeight(s00, rd), getReflectionSampleWeight(s10, rd), getReflectionSampleWeight(s01, rd), getReflectionSampleWeight(s11, rd));\r
  let sum = w.x + w.y + w.z + w.w;\r
  return select(0., dot(w, step(vec4(.75), vec4(s00.x, s10.x, s01.x, s11.x))) / sum, sum > 0.);\r
}\r
\r
// The pixel coord + offset on the surface of world, for the snow field: the point on the plane of world and n, with the\r
// normal of that pixel where it is of the same material (the smooth normal of the ground changes across the slope edge),\r
// else n. As the differences to world and n. d: the camera distance of world. A ray (almost) along the plane takes the\r
// point 4 d away\r
struct SnowNeighbour {\r
  dWorld : vec3<f32>,\r
  dNormal : vec3<f32>,\r
};\r
\r
fn getSnowNeighbour(coord : vec2<u32>, offset : vec2<u32>, world : vec3<f32>, n : vec3<f32>, d : f32, material : u32) -> SnowNeighbour {\r
  let c = min(coord + offset, vec2<u32>(uniforms.resolution) - 1u);\r
  let uv = (vec2<f32>(c) + .5) / uniforms.resolution;\r
  let rd = getRay(uv * 2. - 1.);\r
  let denom = dot(rd, n);\r
  let t = select(4. * d, clamp(dot(world - uniforms.cameraPosition, n) / denom, 0., 4. * d), denom < -1e-4);\r
  let g = vec3<u32>(0u, textureLoad(gBufferTexture, c, 0).y, 0u);\r
  let nc = select(n, getGBufferNormal(g), getGBufferMaterial(g) == material);\r
  return SnowNeighbour(uniforms.cameraPosition + rd * t - world, nc - n);\r
}\r
\r
// The part of the pixel in the snow, with its edge antialiased over SNOW_EDGE_PIXELS (getSnowCoverAt of snow.wgsl). The\r
// change of the field per pixel is that of fwidth, from the pixels right of and below this one on its surface (see\r
// getSnowNeighbour): fwidth itself needs uniform control flow (the sky returns before), and the neighbours in its\r
// 2 x 2 quads are often a tree or a building, whose field is nothing like the ground's: a fringe around each one\r
fn getSnowCoverDeferred(coord : vec2<u32>, world : vec3<f32>, n : vec3<f32>, d : f32, material : u32) -> f32 {\r
  // out of reach of the snow: no noise, no neighbours\r
  if (!isSnowPossible(world.y, uniforms.snowLine, uniforms.snowNoise, uniforms.snowMetersPerUnit)) {\r
    return 0.;\r
  }\r
  let x = getSnowNeighbour(coord, vec2(1u, 0u), world, n, d, material);\r
  let y = getSnowNeighbour(coord, vec2(0u, 1u), world, n, d, material);\r
  return getSnowCoverAt(world, n, x.dWorld, x.dNormal, y.dWorld, y.dNormal, uniforms.snowLine, uniforms.snowNoise,\r
    uniforms.snowMetersPerUnit);\r
}\r
\r
// The distance fog: exponential (distanceFog per world unit), with a smoothstep from .7 of viewDistanceMax that takes\r
// it to 1 at viewDistanceMax, where the loaded map ends (see MapWorld.viewDistanceMax). 0 (not set): only the exp.\r
// d is the horizontal (xz) distance to the camera, not the 3d one: the map is loaded in a radius around the camera in\r
// xz, and a camera that goes up and looks down gets no more fog (the far plane reaches past it, see\r
// MapWorld.applyViewDistanceMax).\r
// The same in deferredShading.wgsl, cars.wgsl, reprojectedSSAOComposite.wgsl and osm/shading.wgsl.\r
fn getFog(d : f32) -> f32 {\r
  let end = select(1., 1. - smoothstep(.7 * uniforms.viewDistanceMax, uniforms.viewDistanceMax, d), uniforms.viewDistanceMax > 0.);\r
  return 1. - exp(-d * uniforms.distanceFog) * end;\r
}\r
\r
// The background color with the sun disc and a glow around it, in the sun color brightened to its strongest channel.\r
// The edge of the disc is soft over a fixed angle (no fwidth: the sky branch is not uniform control flow), the TAA\r
// smooths it further.\r
fn getSky(coord : vec2<u32>) -> vec3<f32> {\r
  let uv = (vec2<f32>(coord) + .5) / uniforms.resolution;\r
  return getSkyColor(getRay(uv * 2. - 1.), true);\r
}\r
\r
// the sky along rd, as getSky draws it (gamma space): with the disc of the sun, or only its glow (the water: the glints\r
// are its disc)\r
fn getSkyColor(rd : vec3<f32>, withDisc : bool) -> vec3<f32> {\r
  let angle = acos(clamp(dot(rd, uniforms.lightDirection), -1., 1.));\r
//  let sunTint = uniforms.sunColor / max(max(max(uniforms.sunColor.r, uniforms.sunColor.g), uniforms.sunColor.b), 1e-4);\r
  let sunTint = uniforms.sunColor * 4.;\r
  let disc = select(0., 1. - smoothstep(uniforms.sunSize * .85, uniforms.sunSize, angle), withDisc);\r
  let glow = uniforms.sunGlow * exp(-angle / max(uniforms.sunSize * 4., 1e-4));\r
  let c = uniforms.backgroundColor + sunTint * glow;\r
  return min(mix(c, sunTint, disc), vec3<f32>(1.));\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  if (LIGHTMAP_VIEW == 4u && LIGHTMAP_ENABLED) {\r
    return vec4<f32>(getLightmapViewColor(input.position.xy), 1.0);\r
  }\r
  let coord = vec2<u32>(input.position.xy);\r
  let g0 = textureLoad(gBufferTexture, coord, 0).xy;\r
  // the sky: the background color, like the clear color of the forward pass, with the sun in it\r
  if (g0.x == SURFACE_NONE) {\r
    return vec4<f32>(getSky(coord), 1.0);\r
  }\r
  let g = vec3(g0, textureLoad(gBufferAtlasTexture, coord, 0).x);\r
  let materialIndex = getGBufferMaterial(g);\r
  let albedoSample = materialPalette[materialIndex].rgb;\r
  let uv = (vec2<f32>(coord) + .5) / uniforms.resolution;\r
  let d = getGBufferDistance(textureLoad(gBufferDepth, coord, 0), uv, uniforms.inverseProjection, uniforms.depthParams);\r
  let world = depthToPosition(d, uv * 2. - 1.);\r
  // the fog is of the horizontal distance, see getFog\r
  let fog = getFog(distance(world.xz, uniforms.cameraPosition.xz));\r
  // all fog (beyond viewDistanceMax): the background color, which the full shading ends on too (the contrast is before\r
  // the fog). Skips the lightmap lookup, the shadows and the reflections. Not in the debug views\r
  if (SHADOW_VIEW == 0u && LIGHTMAP_VIEW == 0u && fog >= 1.) {\r
    let fogged = uniforms.backgroundColor;\r
    return vec4<f32>(select(fogged, mix(fogged, vec3<f32>(0.9, 0.1, 0.1), 0.6), isGBufferSelected(g)), 1.0);\r
  }\r
  let n = getGBufferNormal(g);\r
  let l = uniforms.lightDirection.xyz;\r
  let nDotL = max(dot(n, l), 0.0);\r
  // the lightmap: the sky visibility (xy) and with SUN_SHADOWS 2 the sun's (zw), see getLightmapLookup. A surface that\r
  // faces away from the sun gets none of it: no sun lookup\r
  var surface = Surface(0u, vec2<f32>(0.));\r
  var lightmap = vec4<f32>(0.);\r
  if (LIGHTMAP_ENABLED) {\r
    surface = getGBufferSurface(g, world, uniforms.atlasStep);\r
    lightmap = getLightmapLookup(coord, surface, getLevel(world, n), nDotL > 0.0);\r
  }\r
\r
  if (SHADOW_VIEW == 1u) {\r
    // a face away from the sun is unlit: black, the same at full and at half resolution (the half resolution pass has no\r
    // sun there, see skyVisibilityHalfRes.wgsl)\r
    return vec4<f32>(vec3<f32>(select(0.0, getSunShadow(world, n, d, coord, lightmap.zw), nDotL > 0.0)), 1.0);\r
  } else if (SHADOW_VIEW == 2u) {\r
    return vec4<f32>(cascadeDebugColor(world), 1.0);\r
  }\r
\r
  let skyColor = uniforms.skyColor * uniforms.skyColor;\r
  let sunColor = uniforms.sunColor * uniforms.sunColor;\r
  var albedoSnow = albedoSample;\r
  if (materialIndex < 32u && ((uniforms.snowMaterials >> materialIndex) & 1u) != 0u) {\r
    albedoSnow = mix(albedoSample, uniforms.snowColor, getSnowCoverDeferred(coord, world, n, d, materialIndex));\r
  }\r
  let albedo = albedoSnow * albedoSnow;\r
  var shadow = 1.0;\r
  if (nDotL > 0.0) {\r
    shadow = mix(1.0, getSunShadow(world, n, d, coord, lightmap.zw), uniforms.shadowStrength);\r
  }\r
\r
  var c = albedo * sunColor * (nDotL * shadow);\r
  if (LIGHTMAP_ENABLED) {\r
    // the part of the sky the point sees, cosine weighted. No texel yet: that of an open sky, as in the sky term\r
    let openSky = n.y * .5 + .5;\r
    var sky = select(openSky, lightmap.x, lightmap.y > 0.0);\r
    if (SSAO_SKY) {\r
      // the SSAO is relative to the open sky. The smaller of the 2, not their product: where the texels are fine enough\r
      // they hold the occlusion the SSAO sees too, the SSAO only adds the contact occlusion they are too coarse for\r
      sky = min(sky, openSky * getSSAO(coord));\r
    }\r
    let indirect = skyColor * sky;\r
    c += albedo * indirect;\r
    // the debug views, see LightmapView in SkyVisibilityLightmap.ts. A constant: the shaded view (0) has none of this\r
    if (LIGHTMAP_VIEW != 0u) {\r
      let view = LIGHTMAP_VIEW;\r
      if (view == 1u) {\r
//        c = indirect;\r
        c = vec3(lightmap.x);\r
      } else if (view == 2u) {\r
        c = mix(c, fract(vec3<f32>(f32(u32(getLevel(world, n)))) * vec3<f32>(.31, .57, .73)), .5);\r
      } else if (view == 3u && getLightmapTexelCount(surface, u32(getLevel(world, n))) < uniforms.accumulationMax) {\r
        c = mix(c, vec3<f32>(1.0, 1.0, 0.0), .5);\r
      } else if (view == 5u) {\r
        // the tiles of the level of the pixel in a color each, and its texels as a checkerboard\r
        let texel = getTexel(surface, u32(getLevel(world, n)));\r
        let tile = texel / TILE_SIZE;\r
        let tileColor = vec3<f32>((vec3(tileHash(tile.x ^ tileHash(tile.y ^ tileHash(surface.id)))) >> vec3(0u, 8u, 16u)) & vec3(255u)) / 255.;\r
        c = mix(c, tileColor * select(.7, 1., (texel.x + texel.y) % 2u == 0u), .5);\r
      }\r
    }\r
  } else {\r
    // the sky term, with the albedo like the lightmap's indirect light. shading.wgsl adds it without: a light sky then\r
    // washes out the sun, the shadows and the colors of the layers\r
    c += albedo * ((n.y * .5 + .5) * getSSAO(coord)) * skyColor;\r
  }\r
\r
  // the water reflects a building: darker. The ray mirrored on the normal of the water goes up, it can only hit a building\r
  if (WATER_REFLECTIONS && ((uniforms.waterMaterials >> materialIndex) & 1u) != 0u) {\r
    let rd = getWaterReflectionRay(n, world, d);\r
    // the part of the reflection that hits a building: the ray of the pixel (0 or 1), or the rays of the half resolution\r
    // pass around it\r
    var occluded = 0.;\r
    if (REFLECT_BUILDINGS) {\r
      if (REFLECTIONS_HALF_RES) {\r
        occluded = getHalfResReflection(coord, rd);\r
      } else {\r
        occluded = select(0., 1., isOccluded(world, rd));\r
      }\r
    }\r
    c *= 1. - uniforms.reflectionDarkening * occluded;\r
    // the fresnel term (Schlick) of the facet that mirrors the view into rd: its normal is halfway between rd and the\r
    // direction to the eye, the micro normal of the ripples with WATER_RIPPLES, which makes it vary per ripple\r
    let toEye = normalize(uniforms.cameraPosition - world);\r
    let cosTheta = clamp(dot(rd, normalize(rd + toEye)), 0., 1.);\r
    let schlick = pow(1. - cosTheta, 5.);\r
    let fresnel = WATER_F0 + (1. - WATER_F0) * schlick;\r
    // the sky in the mirror where it misses the buildings: the water goes to the sky color at grazing angles. Linear,\r
    // like the shading (getSkyColor is gamma space)\r
    let sky = getSkyColor(rd, false);\r
    c = mix(c, sky * sky, min(fresnel * uniforms.skyReflection, 1.) * (1. - occluded));\r
    if (uniforms.sunReflection > 0. && occluded < 1.) {\r
      // the sun in the mirror where it sees the sky, in the shadows of the buildings like the sun light of the water.\r
      // Brighter at grazing angles: 1 straight down, 1 + sunFresnel at the horizon\r
      let glint = pow(max(dot(rd, l), 0.), uniforms.sunReflectionPower) * (1. + uniforms.sunFresnel * schlick);\r
      c += sunColor * (glint * shadow * uniforms.sunReflection * (1. - occluded));\r
    }\r
  }\r
\r
  c *= uniforms.exposure;\r
  if (TONE_MAP) {\r
//    c = acesTonemapFitted(c);\r
    c = acesTonemap(c);\r
  }\r
  c = sqrt(c);\r
  // the contrast before the fog: the fog ends on the background color of the sky (getSky), without a seam\r
  c = mix(c, smoothstep(vec3<f32>(0.), vec3<f32>(1.), c), uniforms.contrast);\r
  c = mix(c, uniforms.backgroundColor, fog);\r
\r
/*  let h = hash22ff(input.position.xy);\r
  c += (h.y + h.z - 1.) / 255.;\r
  c = clamp(c, vec3(0.), vec3(1.));*/\r
\r
  //red highlight for selected building\r
  if (isGBufferSelected(g)) {\r
    c = mix(c, vec3<f32>(0.9, 0.1, 0.1), 0.6);\r
  }\r
  return vec4<f32>(c, 1.0);\r
}\r
`,Jn=`// The mirror ray of the water of MapWorld, for the deferred shading (deferredShading.wgsl) and the half resolution pass\r
// of its reflections (waterReflectionHalfRes.wgsl): both trace the same ray for a pixel.\r
// Needs uniforms.inverseProjection, resolution (of the gBuffer), cameraPosition and rippleTile, the bindings\r
// rippleTexture and rippleSampler, and the override WATER_RIPPLES\r
\r
// the normal n of the water tilted by the ripples at world, d from the eye along view. Sampled at an explicit mip (the\r
// branch of the water isn't uniform control flow): the footprint of the pixel on the water, the geometric mean of its\r
// sides, the one along the view stretched by 1 / cos. The ripples smaller than a pixel average out to the flat water\r
fn getRippleNormal(n : vec3<f32>, world : vec3<f32>, view : vec3<f32>, d : f32) -> vec3<f32> {\r
  let pixelAngle = 2. * uniforms.inverseProjection[1][1] / uniforms.resolution.y;\r
  let footprint = d * pixelAngle * inverseSqrt(max(abs(view.y), .02));\r
  let texel = uniforms.rippleTile / f32(textureDimensions(rippleTexture).x);\r
  let lod = log2(max(footprint / texel, 1.));\r
  let g = textureSampleLevel(rippleTexture, rippleSampler, world.xz / uniforms.rippleTile, lod).xy;\r
  //the normal of the height field y = h(x, z) is (-dh/dx, 1, -dh/dz)\r
  return normalize(n + vec3(-g.x, 0., -g.y));\r
}\r
\r
// the ray the water at world (normal n, d from the eye) mirrors the view along: on the micro normal of the ripples\r
// (WATER_RIPPLES), else on the flat water. It goes up, so it can only hit a building\r
fn getWaterReflectionRay(n : vec3<f32>, world : vec3<f32>, d : f32) -> vec3<f32> {\r
  let view = normalize(world - uniforms.cameraPosition);\r
  var rd = reflect(view, n);\r
  if (WATER_RIPPLES) {\r
    rd = reflect(view, getRippleNormal(n, world, view, d));\r
    // a ripple facing away at a grazing angle mirrors the ray into the water: back up, as the next wave would\r
    rd.y = abs(rd.y);\r
  }\r
  return rd;\r
}\r
\r
// the block of pixels the reduced pass traces 1 ray for (WaterReflectionHalfRes.ts), along x and y\r
override REFLECTION_BLOCK_X : u32 = 2u;\r
override REFLECTION_BLOCK_Y : u32 = 2u;\r
\r
// the pixel of each block the reduced pass traces, from its phase (0 to the pixels of a block - 1)\r
fn getReflectionSampleOffset(phase : u32) -> vec2<u32> {\r
  return vec2(phase % REFLECTION_BLOCK_X, phase / REFLECTION_BLOCK_X);\r
}\r
`,ar=`// The terrain in the way of the sun, from TerrainSunMap.ts: the ray traced sun shadows trace only the buildings and the\r
// trees (skyVisibilityTrace.wgsl), this adds the hills. The including shader declares\r
//   terrainSunMap : texture_2d<f32> (a map of the ground top down, per texel r: the height a point there has to be at to\r
//   see the sun, g: the half width of the penumbra there, world units, see terrainSunHeight.wgsl)\r
// and the uniforms terrainSunViewProjection (mat4x4<f32>, world to the map), terrainSunOffset (f32), see\r
// TerrainSunMap.bind.\r
\r
// 1 where no ground is between the point p (with normal n) and the sun, 0 behind a hill, soft over the penumbra: the\r
// height of p against the height the map has there, interpolated bilinearly. That height is continuous, so the edge is\r
// a smooth curve and not the texel grid. p goes off the surface along n by terrainSunOffset first (a part of a texel):\r
// the map has the ground interpolated between its texels, the triangles of the ground are a little off that. A wall goes\r
// up by it too: off a wall along its normal is sideways. Lit outside the map\r
fn getTerrainSunShadow(p : vec3<f32>, n : vec3<f32>) -> f32 {\r
  let q = p + (n + vec3<f32>(0.0, 1.0 - abs(n.y), 0.0)) * uniforms.terrainSunOffset;\r
  let clip = uniforms.terrainSunViewProjection * vec4<f32>(q, 1.0);\r
  // texture v runs down, ndc y up (as in the cascades)\r
  let uv = vec2<f32>(clip.x * 0.5 + 0.5, 0.5 - clip.y * 0.5);\r
  if (any(uv <= vec2<f32>(0.0)) || any(uv >= vec2<f32>(1.0))) {\r
    return 1.0;\r
  }\r
  let size = vec2<f32>(textureDimensions(terrainSunMap));\r
  let texel = uv * size - 0.5;\r
  let i = vec2<i32>(floor(texel));\r
  let f = texel - floor(texel);\r
  let last = vec2<i32>(size) - 1;\r
  let m00 = textureLoad(terrainSunMap, clamp(i, vec2<i32>(0), last), 0).xy;\r
  let m10 = textureLoad(terrainSunMap, clamp(i + vec2<i32>(1, 0), vec2<i32>(0), last), 0).xy;\r
  let m01 = textureLoad(terrainSunMap, clamp(i + vec2<i32>(0, 1), vec2<i32>(0), last), 0).xy;\r
  let m11 = textureLoad(terrainSunMap, clamp(i + vec2<i32>(1, 1), vec2<i32>(0), last), 0).xy;\r
  let m = mix(mix(m00, m10, f.x), mix(m01, m11, f.x), f.y);\r
  // smoothstep(m.x - m.y, m.x + m.y, q.y), but without the edges falling together where m.x is +-1e30 (no ground, the\r
  // sun below the horizon): a width of 0 there would be a division by 0\r
  let t = clamp((q.y - m.x) / max(2.0 * m.y, 1e-9) + 0.5, 0.0, 1.0);\r
  return t * t * (3.0 - 2.0 * t);\r
}\r
`,ei=`// The snow on the ground above the snow line (see map/snowLine.ts), with a hard edge: getSnowField is signed, the snow\r
// is where it is above 0, getSnowCover antialiases that edge over SNOW_EDGE_PIXELS. Included by deferredShading.wgsl\r
// and osm/shading.wgsl (SNOW).\r
// world: the point, n: its normal. line: the snow line in world y (relative to the ground at the projection center, like\r
// the heights). noise: how far (m) value noise (a few hundred meters wide patches, a smaller octave on top) moves the\r
// line up and down, so it isn't a contour line. metersPerUnit: the noise is in meters, the same at every map scale.\r
// Steep slopes hold no snow (the rock shows), less steep ones higher up.\r
\r
// the width of the antialiased edge, in pixels\r
const SNOW_EDGE_PIXELS = 1.5;\r
// how far (m) below the snow line at the top of its noise a point is when isSnowPossible skips it: the field is at most\r
// that height, the margin leaves room for the antialiased edge (the field changing that much per pixel). The same as\r
// SNOW_SKIP_MARGIN_M of map/snowLine.ts, which skips the whole view\r
const SNOW_SKIP_MARGIN = 50.;\r
// the steepest slope (its n.y) with snow at the snow line: 45 degrees. SNOW_SLOPE_HEIGHT above the line SNOW_SLOPE_BOOST\r
// less (64 degrees)\r
const SNOW_SLOPE = .7;\r
const SNOW_SLOPE_BOOST = .26;\r
const SNOW_SLOPE_HEIGHT = 1000.;\r
// meters of the field per unit of n.y: how the slope edge and the height edge compare where they meet (the min)\r
const SNOW_SLOPE_SCALE = 500.;\r
// the noise of the snow line: two octaves of value noise, the size (m) of their cells and the weight of the first\r
const SNOW_NOISE_SIZE0 = 400.;\r
const SNOW_NOISE_SIZE1 = 90.;\r
const SNOW_NOISE_WEIGHT0 = .65;\r
// the most snowValueNoise changes per unit along an axis: the slope of its smoothstep\r
const SNOW_NOISE_MAX_SLOPE = 1.5;\r
\r
fn snowHash(p : vec2<i32>) -> f32 {\r
  var h = (u32(p.x) * 0x8da6b343u) ^ (u32(p.y) * 0xd8163841u);\r
  h = (h ^ (h >> 16u)) * 0x7feb352du;\r
  h = (h ^ (h >> 15u)) * 0x846ca68bu;\r
  h = h ^ (h >> 16u);\r
  return f32(h) * (1. / 4294967295.);\r
}\r
\r
// value noise, 0 to 1, smooth between the integer points\r
fn snowValueNoise(p : vec2<f32>) -> f32 {\r
  let i = vec2<i32>(floor(p));\r
  let f = fract(p);\r
  let u = f * f * (3. - 2. * f);\r
  let a = snowHash(i);\r
  let b = snowHash(i + vec2(1, 0));\r
  let c = snowHash(i + vec2(0, 1));\r
  let d = snowHash(i + vec2(1, 1));\r
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);\r
}\r
\r
// > 0 in the snow, < 0 outside, in meters (about): the height above the noisy snow line, or how much flatter the slope\r
// is than the steepest that holds snow there, whichever is less\r
fn getSnowField(world : vec3<f32>, n : vec3<f32>, line : f32, noise : f32, metersPerUnit : f32) -> f32 {\r
  let p = world.xz * metersPerUnit;\r
  let v = snowValueNoise(p * (1. / SNOW_NOISE_SIZE0)) * SNOW_NOISE_WEIGHT0\r
    + snowValueNoise(p * (1. / SNOW_NOISE_SIZE1) + 17.) * (1. - SNOW_NOISE_WEIGHT0);\r
  let h = (world.y - line) * metersPerUnit + (v * 2. - 1.) * noise;\r
//  let h = (world.y - line) * metersPerUnit;\r
  let slope = n.y - SNOW_SLOPE + SNOW_SLOPE_BOOST * clamp(h / SNOW_SLOPE_HEIGHT, 0., 1.);\r
  return min(h, slope * SNOW_SLOPE_SCALE);\r
}\r
\r
// false: no snow at a point at world y, whatever its noise and slope (getSnowField is below -SNOW_SKIP_MARGIN). The cheap\r
// test before the field: one multiply-add\r
fn isSnowPossible(worldY : f32, line : f32, noise : f32, metersPerUnit : f32) -> bool {\r
  return (worldY - line) * metersPerUnit + noise > -SNOW_SKIP_MARGIN;\r
}\r
\r
// the part of the pixel in the snow, 0 to 1: field over its change per pixel (the sum of its differences to the pixels\r
// right of and below it, as fwidth) is the distance to the edge in pixels\r
fn getSnowCover(field : f32, perPixel : f32) -> f32 {\r
  return clamp(field / max(perPixel * SNOW_EDGE_PIXELS, 1e-6) + .5, 0., 1.);\r
}\r
\r
// An upper bound of how much getSnowField changes from a point to one dWorld away with a normal dNormal different,\r
// without its noise: the height part changes with the y and at most SNOW_NOISE_MAX_SLOPE per noise cell along x and z,\r
// the slope part with the normal and the clamped height\r
fn getSnowFieldChangeBound(dWorld : vec3<f32>, dNormal : vec3<f32>, noise : f32, metersPerUnit : f32) -> f32 {\r
  let dxz = (abs(dWorld.x) + abs(dWorld.z)) * metersPerUnit;\r
  let noisePerMeter = SNOW_NOISE_MAX_SLOPE * (SNOW_NOISE_WEIGHT0 / SNOW_NOISE_SIZE0 + (1. - SNOW_NOISE_WEIGHT0) / SNOW_NOISE_SIZE1);\r
  let dh = abs(dWorld.y) * metersPerUnit + 2. * abs(noise) * noisePerMeter * dxz;\r
  return max(dh, SNOW_SLOPE_SCALE * (abs(dNormal.y) + SNOW_SLOPE_BOOST / SNOW_SLOPE_HEIGHT * dh));\r
}\r
\r
// The part of the pixel at world, normal n, in the snow (getSnowCover), with the pixels right of and below it at world +\r
// dWorldX, n + dNormalX and world + dWorldY, n + dNormalY. Away from the edge, where the field is more than the half edge\r
// width from 0 at the most it can change per pixel (getSnowFieldChangeBound), the cover is 0 or 1 without the field of\r
// the neighbours: only the pixels near the edge evaluate it 3 times\r
fn getSnowCoverAt(world : vec3<f32>, n : vec3<f32>, dWorldX : vec3<f32>, dNormalX : vec3<f32>, dWorldY : vec3<f32>,\r
  dNormalY : vec3<f32>, line : f32, noise : f32, metersPerUnit : f32) -> f32 {\r
  let f = getSnowField(world, n, line, noise, metersPerUnit);\r
  let bound = getSnowFieldChangeBound(dWorldX, dNormalX, noise, metersPerUnit)\r
    + getSnowFieldChangeBound(dWorldY, dNormalY, noise, metersPerUnit);\r
  if (abs(f) > bound * SNOW_EDGE_PIXELS * .5) {\r
    return select(0., 1., f > 0.);\r
  }\r
  let fx = getSnowField(world + dWorldX, n + dNormalX, line, noise, metersPerUnit);\r
  let fy = getSnowField(world + dWorldY, n + dNormalY, line, noise, metersPerUnit);\r
  return getSnowCover(f, abs(fx - f) + abs(fy - f));\r
}\r
`;class va{constructor(e){a(this,"renderer");a(this,"material");a(this,"frame",0);a(this,"depthParams",new k);a(this,"dummyCityBuffer");a(this,"dummySSAOTexture");this.renderer=e,this.material=new G(e,"mapDeferredShading",ya,{includes:[$s,Zn,Gt,...Ve.resolveIncludes,Jn,mt,ar,ei],defines:Ee.traceDefines,asyncPipeline:!0}),this.material.depthWriteEnabled=!1,this.material.depthCompare="always",this.dummyCityBuffer=e.createBuffer(16,GPUBufferUsage.STORAGE,!1,"dummyCityBuffer"),this.dummySSAOTexture=new $n(e,1,1);for(const t of this.materials)t.setBuffer("cityBuffer",this.dummyCityBuffer),t.setTexture("ssaoTexture",this.dummySSAOTexture)}get materials(){return[this.material]}bindCity(e){for(const t of this.materials)e.bind(t,!1)}bindWaterRipples(e){for(const t of this.materials)t.setTexture("rippleTexture",e.texture),t.setSampler("rippleSampler",e.sampler)}bindBlueNoise(e){for(const t of this.materials)t.setTexture("blueNoiseTexture",e)}setSunShadows(e,t){for(const r of this.materials)r.setConstant("SUN_SHADOWS",e),r.setConstant("SOFT_SHADOWS",t)}setSSAO(e,t){for(const r of this.materials)r.setConstant("SSAO_SKY",t&&e!=null),r.setTexture("ssaoTexture",e?e.result:this.dummySSAOTexture),e&&r.setFloat("ssaoAmount",e.amount.value),r.setFloat("ssaoFadeCount",Ks)}set shadowView(e){for(const t of this.materials)t.setConstant("SHADOW_VIEW",e)}set toneMap(e){for(const t of this.materials)t.setConstant("TONE_MAP",e)}setWaterReflections(e,t,r,n,i,s,o=null){for(const l of this.materials)l.setConstant("REFLECTIONS_HALF_RES",o!=null),o&&(l.setTexture("reflectionTexture",o.view),l.setFloat("reflectionPhase",o.phase),l.setConstant("REFLECTION_BLOCK_X",o.blockX),l.setConstant("REFLECTION_BLOCK_Y",o.blockY)),l.setConstant("WATER_REFLECTIONS",e!==0),l.setConstant("REFLECT_BUILDINGS",t),l.setConstant("WATER_RIPPLES",n>0),l.setFloat("sunReflection",i),l.setFloat("sunReflectionPower",s),l.setFloat("waterMaterials",e),l.setFloat("reflectionDarkening",r),l.setFloat("rippleTile",n)}setSnow(e,t){for(const r of this.materials)r.setFloat("snowMaterials",t.enabled?e:0),r.setFloat("snowLine",t.line),r.setFloat("snowNoise",t.noise),r.setFloat("snowMetersPerUnit",t.metersPerUnit),r.setVector3("snowColor",t.color)}draw(e,t,r,n){const i=this.material;n.bindShading(i),i.setMatrix("inverseProjection",e.projectionMatrix.inverse),i.setMatrix("inverseView",e.viewMatrix.inverse),i.setMatrix("viewProjection",e.viewProjection),i.setVector3("cameraPosition",e.worldPosition),i.setVector2("resolution",t.target.size),i.setFloat("frame",this.frame++),i.setTexture("gBufferTexture",t.view),i.setTexture("gBufferAtlasTexture",t.atlasView),i.setTexture("gBufferDepth",t.depthView),i.setVector2("depthParams",oe.depthParams(e,this.depthParams)),i.setBuffer("materialPalette",t.paletteBuffer),this.renderer.blit(null,r,i)}destruct(){this.dummyCityBuffer.destroy(),this.dummySSAOTexture.destruct()}}const wa=`// The buildings the water of MapWorld reflects, with fewer rays, see WaterReflectionHalfRes.ts: the ray of the\r
// deferred shading (getWaterReflectionRay of waterReflection.wgsl, traced with isOccluded of skyVisibilityTrace.wgsl)\r
// for 1 pixel per block of the gBuffer (REFLECTION_BLOCK_X x Y pixels), the one at getReflectionSampleOffset(phase). The\r
// shading blends the samples around a pixel (getHalfResReflection in deferredShading.wgsl) instead of tracing a ray per\r
// water pixel, which was more than half of its time at 4K.\r
// Out, rgba8unorm. x: 0 no water (no sample), .5 the ray reaches the sky, 1 it hits a building. yzw: the ray (* .5 + .5),\r
// the shading weighs a sample by how alike its ray and the ray of the pixel are\r
// Needs cameraRay.wgsl, cityLightmapSurface.wgsl, mapGBufferPacking.wgsl, waterReflection.wgsl and skyVisibilityTrace.wgsl\r
\r
struct Uniforms {\r
  inverseProjection : mat4x4<f32>,\r
  inverseView : mat4x4<f32>,\r
  cameraPosition : vec3<f32>,\r
  // of the gBuffer, the full resolution\r
  resolution : vec2<f32>,\r
  // see getGBufferDistance\r
  depthParams : vec2<f32>,\r
  // the gBuffer materials of the water, a bit each\r
  waterMaterials : u32,\r
  // which pixel of a block is traced, see getReflectionSampleOffset\r
  phase : u32,\r
  // the size of the tile of rippleTexture in world units (WATER_RIPPLES)\r
  rippleTile : f32,\r
  // the city the rays trace, see CityScene.bind\r
  cityTileCount : u32,\r
  cityRoot : u32,\r
};\r
\r
// the rays are mirrored on the ripples of rippleTexture, else on the flat water: as the shading's\r
override WATER_RIPPLES : bool = false;\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
// the surface id, the normal and the material of the gBuffer, and its depth, see mapGBufferPacking.wgsl\r
@group(0) @binding(1) var gBufferTexture : texture_2d<u32>;\r
@group(0) @binding(2) var gBufferDepth : texture_depth_2d;\r
// the buildings, see CityScene and skyVisibilityTrace.wgsl\r
@group(0) @binding(3) var<storage, read> cityBuffer : array<vec4<f32>>;\r
// the ripples of the water, see WaterRippleTexture.ts\r
@group(0) @binding(4) var rippleTexture : texture_2d<f32>;\r
@group(0) @binding(5) var rippleSampler : sampler;\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  return output;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  // the size of the target rounds up: a block that is cut off by the edge has its sample at the last pixel\r
  let block = vec2(REFLECTION_BLOCK_X, REFLECTION_BLOCK_Y);\r
  let coord = min(vec2<u32>(input.position.xy) * block + getReflectionSampleOffset(uniforms.phase), vec2<u32>(uniforms.resolution) - 1u);\r
  let g = vec3(textureLoad(gBufferTexture, coord, 0).xy, 0u);\r
  if (g.x == SURFACE_NONE || ((uniforms.waterMaterials >> getGBufferMaterial(g)) & 1u) == 0u) {\r
    return vec4<f32>(0.);\r
  }\r
  let uv = (vec2<f32>(coord) + .5) / uniforms.resolution;\r
  let d = getGBufferDistance(textureLoad(gBufferDepth, coord, 0), uv, uniforms.inverseProjection, uniforms.depthParams);\r
  let world = depthToPosition(d, uv * 2. - 1.);\r
  let rd = getWaterReflectionRay(getGBufferNormal(g), world, d);\r
  return vec4<f32>(select(.5, 1., isOccluded(world, rd)), rd * .5 + .5);\r
}\r
`;class Sa{constructor(e){a(this,"renderer");a(this,"material");a(this,"target");a(this,"_blockX",2);a(this,"_blockY",2);a(this,"frame",0);a(this,"_phase",0);a(this,"depthParams",new k);a(this,"dummyCityBuffer");this.renderer=e,this.material=new G(e,"waterReflectionHalfRes",wa,{includes:[Gt,_t,...oe.readIncludes,Jn,mt],defines:Ee.traceDefines}),this.material.depthWriteEnabled=!1,this.material.depthCompare="always",this.dummyCityBuffer=e.createBuffer(16,GPUBufferUsage.STORAGE,!1,"dummyCityBuffer"),this.material.setBuffer("cityBuffer",this.dummyCityBuffer),this.target=new H(e,1,1,{formats:["rgba8unorm"],sampleCount:1})}bindCity(e){e.bind(this.material,!1)}bindWaterRipples(e){this.material.setTexture("rippleTexture",e.texture),this.material.setSampler("rippleSampler",e.sampler)}get view(){return this.target.views[0]}setBlock(e,t){this._blockX=e,this._blockY=t}get blockX(){return this._blockX}get blockY(){return this._blockY}get phase(){return this._phase}getPhase(e){const t=this._blockX*this._blockY,r=e%t;if(this._blockX===2&&this._blockY===2)return[0,3,1,2][r];const n=Math.ceil(Math.log2(t));let i=0;for(let s=0;s<n;s++)i|=(r>>s&1)<<n-1-s;return i<t?i:r}draw(e,t,r,n,i){const s=t.target.size;this.target.setSize(Math.ceil(s.x/this._blockX),Math.ceil(s.y/this._blockY)),this._phase=i?this.getPhase(this.frame++):0;const o=this.material;o.setConstant("WATER_RIPPLES",n>0),o.setConstant("REFLECTION_BLOCK_X",this._blockX),o.setConstant("REFLECTION_BLOCK_Y",this._blockY),o.setMatrix("inverseProjection",e.projectionMatrix.inverse),o.setMatrix("inverseView",e.viewMatrix.inverse),o.setVector3("cameraPosition",e.worldPosition),o.setVector2("resolution",s),o.setVector2("depthParams",oe.depthParams(e,this.depthParams)),o.setFloat("waterMaterials",r),o.setFloat("phase",this._phase),o.setFloat("rippleTile",n),o.setTexture("gBufferTexture",t.view),o.setTexture("gBufferDepth",t.depthView),this.renderer.blit(null,this.target,o)}destruct(){this.target.destruct(),this.dummyCityBuffer.destroy()}}const Ma="modulepreload",Ta=function(c,e){return new URL(c,e).href},Yr={},Ca=function(e,t,r){let n=Promise.resolve();if(t&&t.length>0){let s=function(u){return Promise.all(u.map(d=>Promise.resolve(d).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const o=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),h=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));n=s(t.map(u=>{if(u=Ta(u,r),u in Yr)return;Yr[u]=!0;const d=u.endsWith(".css"),f=d?'[rel="stylesheet"]':"";if(!!r)for(let x=o.length-1;x>=0;x--){const b=o[x];if(b.href===u&&(!d||b.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${u}"]${f}`))return;const p=document.createElement("link");if(p.rel=d?"stylesheet":Ma,d||(p.as="script"),p.crossOrigin="",p.href=u,h&&p.setAttribute("nonce",h),document.head.appendChild(p),d)return new Promise((x,b)=>{p.addEventListener("load",x),p.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${u}`)))})}))}function i(s){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=s,window.dispatchEvent(o),!o.defaultPrevented)throw s}return n.then(s=>{for(const o of s||[])o.status==="rejected"&&i(o.reason);return e().catch(i)})};let Kr=null;function Er(){return Kr??(Kr=Ca(async()=>{const{default:c}=await import("./worldCitiesData-DdtR8_Dd.js");return{default:c}},[],import.meta.url).then(({default:c})=>{const e=c.map(([n,i,s,o,l])=>({name:n,landmark:i,lat:s,lng:o,population:l})),t=new Float64Array(e.length);let r=0;return e.forEach((n,i)=>t[i]=r+=Math.sqrt(n.population)),{cities:e,cumulative:t}})),Kr}async function Ea(c){const{cities:e,cumulative:t}=await Er(),r=()=>{const i=Math.random()*t[t.length-1];let s=0,o=t.length-1;for(;s<o;){const l=s+o>>1;t[l]<i?s=l+1:o=l}return e[s]};let n=r();for(let i=0;i<8&&(c!=null&&c(n));i++)n=r();return n}const $r=[{name:"London",landmark:"Trafalgar Square",lat:51.50806,lng:-.12806,population:8961989},{name:"Paris",landmark:"Notre-Dame de Paris",lat:48.853,lng:2.3498,population:2138551},{name:"Amsterdam",landmark:"Royal Palace of Amsterdam",lat:52.37317,lng:4.89136,population:741636},{name:"New York City",landmark:"World Trade Center",lat:40.71139,lng:-74.0125,population:8804190},{name:"Tokyo",landmark:"Mode Gakuen Cocoon Tower",lat:35.69167,lng:139.69694,population:9733276},{name:"Hong Kong",landmark:"Central Plaza",lat:22.28,lng:114.17361,population:7396076},{name:"Moscow",landmark:"Kremlin",lat:55.75167,lng:37.61778,population:10381222},{name:"Berlin",landmark:"Fernsehturm Berlin",lat:52.52083,lng:13.40944,population:3426354},{name:"Kuala Lumpur",landmark:"National Mosque of Malaysia",lat:3.14194,lng:101.69167,population:1453975},{name:"Venice",landmark:"St Mark's Basilica",lat:45.4345,lng:12.3397,population:258685},{name:"Shanghai",landmark:"Shimao International Plaza",lat:31.23444,lng:121.47167,population:24874500},{name:"Taipei",landmark:"Legislative Yuan",lat:25.04417,lng:121.51972,population:7871900}];function ka(){return $r[Math.floor(Math.random()*$r.length)]}async function Aa(c){const{cities:e}=await Er(),t=c.toLowerCase();return e.find(r=>r.name.toLowerCase()===t)}function Zr(c){return c.landmark?`${c.landmark}, ${c.name}`:c.name}function Rt(c){return c.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’`]/g,"'").toLowerCase().trim()}let Qr=null;async function Pa(c,e=8){const t=Rt(c);if(!t)return[];Qr??(Qr=Er().then(({cities:l})=>({cities:l,names:l.map(h=>Rt(h.name))})));const{cities:r,names:n}=await Qr,i=[],s=[],o=[];for(let l=0;l<r.length&&i.length<e;l++){const h=n[l].indexOf(t);h<0||(h===0?i.push(r[l]):/[\s\-'(]/.test(n[l][h-1])?s.push(r[l]):o.push(r[l]))}return[...i,...s,...o].slice(0,e)}const Be=[{name:"Eiffel Tower",city:"Paris",country:"France",lat:48.85826,lng:2.2945},{name:"Notre-Dame de Paris",city:"Paris",country:"France",lat:48.85297,lng:2.34989},{name:"Sacré-Cœur",city:"Paris",country:"France",lat:48.88671,lng:2.3431},{name:"Mont-Saint-Michel",city:"Mont-Saint-Michel",country:"France",lat:48.636,lng:-1.5114},{name:"Strasbourg Cathedral",city:"Strasbourg",country:"France",lat:48.5818,lng:7.7507},{name:"Château de Chambord",city:"Chambord",country:"France",lat:47.6161,lng:1.517},{name:"Palace of Westminster",city:"London",country:"United Kingdom",lat:51.49947,lng:-.1247},{name:"St Paul's Cathedral",city:"London",country:"United Kingdom",lat:51.51381,lng:-.0984},{name:"Tower Bridge",city:"London",country:"United Kingdom",lat:51.50546,lng:-.07537},{name:"Edinburgh Castle",city:"Edinburgh",country:"United Kingdom",lat:55.9486,lng:-3.1999},{name:"Cologne Cathedral",city:"Cologne",country:"Germany",lat:50.9413,lng:6.9583},{name:"Reichstag",city:"Berlin",country:"Germany",lat:52.51862,lng:13.37618},{name:"Ulm Minster",city:"Ulm",country:"Germany",lat:48.3985,lng:9.9916},{name:"Neuschwanstein Castle",city:"Schwangau",country:"Germany",lat:47.5576,lng:10.7498},{name:"Rijksmuseum",city:"Amsterdam",country:"Netherlands",lat:52.35999,lng:4.8852},{name:"Atomium",city:"Brussels",country:"Belgium",lat:50.8949,lng:4.3415},{name:"Sagrada Família",city:"Barcelona",country:"Spain",lat:41.40363,lng:2.17436},{name:"Seville Cathedral",city:"Seville",country:"Spain",lat:37.3859,lng:-5.9931},{name:"Mezquita of Córdoba",city:"Córdoba",country:"Spain",lat:37.8789,lng:-4.7794},{name:"Guggenheim Museum",city:"Bilbao",country:"Spain",lat:43.2687,lng:-2.934},{name:"St. Peter's Basilica",city:"Vatican City",country:"Vatican City",lat:41.9022,lng:12.4539},{name:"Colosseum",city:"Rome",country:"Italy",lat:41.89021,lng:12.49223},{name:"Milan Cathedral",city:"Milan",country:"Italy",lat:45.4642,lng:9.1919},{name:"Florence Cathedral",city:"Florence",country:"Italy",lat:43.7731,lng:11.256},{name:"St Mark's Basilica",city:"Venice",country:"Italy",lat:45.4345,lng:12.3397},{name:"Leaning Tower of Pisa",city:"Pisa",country:"Italy",lat:43.723,lng:10.3966},{name:"Prague Castle",city:"Prague",country:"Czechia",lat:50.0904,lng:14.4005},{name:"Hungarian Parliament",city:"Budapest",country:"Hungary",lat:47.5071,lng:19.0457},{name:"St. Basil's Cathedral",city:"Moscow",country:"Russia",lat:55.7525,lng:37.6231},{name:"Hagia Sophia",city:"Istanbul",country:"Türkiye",lat:41.0086,lng:28.9802},{name:"Parthenon",city:"Athens",country:"Greece",lat:37.9715,lng:23.7267},{name:"Siena Cathedral",city:"Siena",country:"Italy",lat:43.31779,lng:11.32909},{name:"Burgos Cathedral",city:"Burgos",country:"Spain",lat:42.34073,lng:-3.70456},{name:"Frauenkirche",city:"Dresden",country:"Germany",lat:51.05196,lng:13.74162},{name:"Berlin Cathedral",city:"Berlin",country:"Germany",lat:52.51908,lng:13.40109},{name:"Blackpool Tower",city:"Blackpool",country:"United Kingdom",lat:53.81589,lng:-3.05524},{name:"Hallgrímskirkja",city:"Reykjavík",country:"Iceland",lat:64.1418,lng:-21.92671},{name:"Helsinki Cathedral",city:"Helsinki",country:"Finland",lat:60.17042,lng:24.95218},{name:"Palace of Culture and Science",city:"Warsaw",country:"Poland",lat:52.23177,lng:21.0058},{name:"St Andrew's Church",city:"Kyiv",country:"Ukraine",lat:50.459,lng:30.51799},{name:"Alexander Nevsky Cathedral",city:"Sofia",country:"Bulgaria",lat:42.69581,lng:23.33279},{name:"Blue Mosque",city:"Istanbul",country:"Türkiye",lat:41.00538,lng:28.97685},{name:"Cathedral of Christ the Saviour",city:"Moscow",country:"Russia",lat:55.74452,lng:37.60551},{name:"Ostankino Tower",city:"Moscow",country:"Russia",lat:55.81973,lng:37.61166},{name:"Moscow State University",city:"Moscow",country:"Russia",lat:55.70291,lng:37.53076},{name:"Heart of Chechnya Mosque",city:"Grozny",country:"Russia",lat:43.31792,lng:45.69391},{name:"Empire State Building",city:"New York",country:"United States",lat:40.7484,lng:-73.9857},{name:"One World Trade Center",city:"New York",country:"United States",lat:40.7127,lng:-74.0134},{name:"Chrysler Building",city:"New York",country:"United States",lat:40.7516,lng:-73.9755},{name:"United States Capitol",city:"Washington, D.C.",country:"United States",lat:38.8899,lng:-77.0091},{name:"Lincoln Memorial",city:"Washington, D.C.",country:"United States",lat:38.88926,lng:-77.05021},{name:"Willis Tower",city:"Chicago",country:"United States",lat:41.8789,lng:-87.6359},{name:"Space Needle",city:"Seattle",country:"United States",lat:47.6205,lng:-122.3493},{name:"CN Tower",city:"Toronto",country:"Canada",lat:43.6426,lng:-79.3871},{name:"Parliament Hill",city:"Ottawa",country:"Canada",lat:45.42506,lng:-75.69992},{name:"Palacio de Bellas Artes",city:"Mexico City",country:"Mexico",lat:19.4352,lng:-99.1412},{name:"Hassan II Mosque",city:"Casablanca",country:"Morocco",lat:33.6083,lng:-7.6328},{name:"Dome of the Rock",city:"Jerusalem",country:"Israel",lat:31.778,lng:35.2354},{name:"Burj Khalifa",city:"Dubai",country:"UAE",lat:25.1972,lng:55.2744},{name:"Sheikh Zayed Grand Mosque",city:"Abu Dhabi",country:"UAE",lat:24.4128,lng:54.4749},{name:"Azadi Tower",city:"Tehran",country:"Iran",lat:35.69974,lng:51.33806},{name:"Milad Tower",city:"Tehran",country:"Iran",lat:35.7447,lng:51.37527},{name:"Taj Mahal",city:"Agra",country:"India",lat:27.1751,lng:78.0421},{name:"Forbidden City",city:"Beijing",country:"China",lat:39.9169,lng:116.3907},{name:"Shanghai Tower",city:"Shanghai",country:"China",lat:31.23565,lng:121.50125},{name:"Oriental Pearl Tower",city:"Shanghai",country:"China",lat:31.24195,lng:121.49526},{name:"International Finance Centre",city:"Hong Kong",country:"China",lat:22.2853,lng:114.1588},{name:"Taipei 101",city:"Taipei",country:"Taiwan",lat:25.0336,lng:121.5645},{name:"Shwedagon Pagoda",city:"Yangon",country:"Myanmar",lat:16.7983,lng:96.1495},{name:"Angkor Wat",city:"Siem Reap",country:"Cambodia",lat:13.4125,lng:103.867},{name:"Petronas Towers",city:"Kuala Lumpur",country:"Malaysia",lat:3.1579,lng:101.7116},{name:"Marina Bay Sands",city:"Singapore",country:"Singapore",lat:1.2826,lng:103.8608},{name:"Gardens by the Bay",city:"Singapore",country:"Singapore",lat:1.282,lng:103.86394},{name:"Borobudur",city:"Magelang",country:"Indonesia",lat:-7.6079,lng:110.2038},{name:"Gyeongbokgung Palace",city:"Seoul",country:"South Korea",lat:37.5796,lng:126.977},{name:"Lotte World Tower",city:"Seoul",country:"South Korea",lat:37.5125,lng:127.1025},{name:"Tokyo Tower",city:"Tokyo",country:"Japan",lat:35.6586,lng:139.7454}];let Jr;function _a(c,e=3){const t=Rt(c);if(!t)return[];Jr??(Jr=Be.map(s=>Rt(s.name)));const r=[],n=[],i=[];for(let s=0;s<Be.length;s++){const o=Jr[s],l=o.indexOf(t);l<0||(l===0?r.push(Be[s]):/[\s\-'(.]/.test(o[l-1])?n.push(Be[s]):i.push(Be[s]))}return[...r,...n,...i].slice(0,e)}const Ra="https://tiles.openfreemap.org/planet",La="https://tiles.openfreemap.org/planet/20261004_113936_pt/{z}/{x}/{y}.pbf",Ba="© OpenFreeMap © OpenMapTiles, data © OpenStreetMap contributors";class Ia{constructor(){a(this,"template",La);a(this,"maxZoom",14)}async init(){try{const e=await fetch(Ra);if(!e.ok)throw new Error(`${e.status} ${e.statusText}`);const t=await e.json();Array.isArray(t.tiles)&&typeof t.tiles[0]=="string"&&(this.template=t.tiles[0]),typeof t.maxzoom=="number"&&(this.maxZoom=t.maxzoom),_.log(`[MapWorld] OpenFreeMap tiles: ${this.template} (max z${this.maxZoom})`)}catch(e){_.warn("[MapWorld] could not read OpenFreeMap TileJSON, using fallback URL:",e)}}tileUrl(e){const t=Math.pow(2,e.z),r=(e.x%t+t)%t;return this.template.replace("{z}",String(e.z)).replace("{x}",String(r)).replace("{y}",String(e.y))}isValid(e){return e.y>=0&&e.y<Math.pow(2,e.z)}latLngToTile(e,t,r){const n=Math.pow(2,r),i=Math.floor((t+180)/360*n),s=e*Math.PI/180,o=Math.floor((1-Math.log(Math.tan(s)+1/Math.cos(s))/Math.PI)/2*n);return{z:r,x:i,y:o}}tileBounds(e){const t=Math.pow(2,e.z),r=e.x/t*360-180,n=(e.x+1)/t*360-180,i=Math.atan(Math.sinh(Math.PI*(1-2*e.y/t)))*180/Math.PI;return{south:Math.atan(Math.sinh(Math.PI*(1-2*(e.y+1)/t)))*180/Math.PI,west:r,north:i,east:n}}tileKey(e){return`${e.z}/${e.x}/${e.y}`}}const pe=class pe{constructor(e,t){a(this,"workers",[]);a(this,"pending",new Map);a(this,"nextId",1);a(this,"jobs");a(this,"limit",1/0);a(this,"stats",{busyMs:0,jobs:0,queueMs:0,fetchMs:0});this.jobs=t.createPort("jobs"),this.jobs.onmessage=n=>{n.data.error?this.settle(n.data.id,new Error(n.data.error),null):this.settle(n.data.id,null,{result:null,heights:null})};const r=Math.max(1,e??pe.defaultWorkerCount);for(let n=0;n<r;n++){const i=new Worker(new URL(""+new URL("worldMapWorker-CXr3ewwH.js",import.meta.url).href,import.meta.url),{type:"module"});i.onmessage=o=>this.onBuilt(o.data),i.onerror=o=>_.warn("[MapWorld] worker error:",o.message);const s=t.createPort("builder");i.postMessage({port:s},[s]),this.workers.push(i)}}static get defaultWorkerCount(){const e=typeof navigator<"u"&&navigator.hardwareConcurrency||4;return Math.min(Math.max(e-2,1),12)}get size(){return this.workers.length}get capacity(){return Math.max(pe.JOBS_MIN,this.workers.length*pe.JOBS_PER_WORKER)}get activeJobs(){return this.pending.size}get idle(){return new Array(Math.max(this.workers.length-this.pending.size,0))}get queue(){return new Array(Math.max(this.pending.size-this.workers.length,0))}get activeLimit(){return Math.min(this.limit,this.workers.length)}set activeLimit(e){this.limit=Math.max(0,e),this.send({limit:this.limit})}start(e){const t=this.nextId++,r=new Promise((n,i)=>this.pending.set(t,{resolve:n,reject:i}));return this.send({start:{id:t,...e}}),{id:t,done:r}}cancel(e){this.pending.has(e)&&(this.settle(e,pe.CANCELLED,null),this.send({cancel:e}))}onBuilt(e){this.stats.busyMs+=e.buildMs,this.stats.queueMs+=e.waitMs,this.stats.fetchMs+=e.fetchMs,this.stats.jobs++,e.error?this.settle(e.id,new Error(e.error),null):this.settle(e.id,null,{result:e.result??null,heights:e.heights??null})}settle(e,t,r){const n=this.pending.get(e);n&&(this.pending.delete(e),t?n.reject(t):n.resolve(r))}send(e){this.jobs.postMessage(e)}destroy(){for(const e of this.workers)e.terminate();for(const e of this.pending.values())e.reject(new Error("worker pool destroyed"));this.workers=[],this.pending.clear()}};a(pe,"CANCELLED",new Error("cancelled")),a(pe,"JOBS_PER_WORKER",2),a(pe,"JOBS_MIN",8);let or=pe;class Lt{constructor(e=new S(1e38,1e38,1e38),t=new S(-1e38,-1e38,-1e38)){a(this,"min");a(this,"max");this.min=e,this.max=t}get area(){const e=S.subtract(this.max,this.min);return 2*(e.x*e.y+e.y*e.z+e.z*e.x)}get center(){return S.add(this.max,this.min).multiplyScalar(.5)}get extents(){return S.subtract(this.max,this.min).multiplyScalar(.5)}static merge(e){const t=new Lt;for(const r of e)t.expandWithAABox(r);return t}setCenterExtents(e,t){this.min.copy(e).subtract(t),this.max.copy(e).add(t)}expandWithPoint(e){this.max.max(e),this.min.min(e)}expandWithAABox(e){this.max.max(e.max),this.min.min(e.min)}copy(e){this.min.copy(e.min),this.max.copy(e.max)}transform(e){const t=this.min.clone(),r=this.max.clone();this.min.setValues(1/0,1/0,1/0),this.max.setValues(-1/0,-1/0,-1/0);const n=new S;for(let i=0;i<8;i++)n.setValues(i&1?r.x:t.x,i&2?r.y:t.y,i&4?r.z:t.z).transform(e),this.expandWithPoint(n);return this}clone(){return new Lt(this.min.clone(),this.max.clone())}}class ti{constructor(){a(this,"points");a(this,"planes");this.planes=Array.from({length:6},()=>new Y),this.points=Array.from({length:8},()=>new S)}setFromCamera(e){this.setFromViewProjectionMatrix(e.viewProjection);const t=e.projection.frustumCorner,r=e.view.worldMatrix;let n=0;for(let i=0;i<=1;i++)for(let s=0;s<=1;s++)for(let o=0;o<=1;o++){const l=t.clone();l.multiplyScalar(ae(e.projection.near,e.projection.far,i)),l.x*=o*2-1,l.y*=s*2-1,l.z*=-1,this.points[n++]=S.transform(l,r)}return this}setFromViewProjectionMatrix(e){const t=e.m;return this.planes[0].setValues(t[3]-t[0],t[7]-t[4],t[11]-t[8],t[15]-t[12]),this.planes[1].setValues(t[3]+t[0],t[7]+t[4],t[11]+t[8],t[15]+t[12]),this.planes[2].setValues(t[3]+t[1],t[7]+t[5],t[11]+t[9],t[15]+t[13]),this.planes[3].setValues(t[3]-t[1],t[7]-t[5],t[11]-t[9],t[15]-t[13]),this.planes[4].setValues(t[3]-t[2],t[7]-t[6],t[11]-t[10],t[15]-t[14]),this.planes[5].setValues(t[2],t[6],t[10],t[14]),this.planes.forEach(r=>{r.multiplyScalar(1/Math.sqrt(r.x**2+r.y**2+r.z**2))}),this}frustumInFrustum(e){return this.planes.every(t=>e.points.some(r=>this.dot3(t,r)>0))&&e.planes.every(t=>this.points.some(r=>this.dot3(t,r)>0))}pointInFrustum(e){return this.sphereInFrustum(e,0)}sphereInFrustum(e,t){return!this.planes.some(r=>this.dot(r,e.x,e.y,e.z)<-t)}boxInFrustum(e,t){for(let r=0;r<6;r++){const n=this.planes[r],i=n.x>=0?t.x:e.x,s=n.y>=0?t.y:e.y,o=n.z>=0?t.z:e.z;if(this.dot(n,i,s,o)<0)return!1}return!0}transformedBoxInFrustum(e,t,r){const n=[new S(e.x,e.y,e.z),new S(t.x,e.y,e.z),new S(e.x,t.y,e.z),new S(t.x,t.y,e.z),new S(e.x,e.y,t.z),new S(t.x,e.y,t.z),new S(e.x,t.y,t.z),new S(t.x,t.y,t.z)].map(i=>S.transform(i,r));return this.planes.every(i=>n.some(s=>this.dot3(i,s)>=0))}aaBoxInFrustum(e){return this.boxInFrustum(e.min,e.max)}quadInFrustum(e){for(let t=-1;t<=1;t+=2)for(let r=-1;r<=1;r+=2){const n=S.transform(new S(t,r,0),e);if(this.pointInFrustum(n))return!0}return!1}dot(e,t,r,n){return e.x*t+e.y*r+e.z*n+e.w}dot3(e,t){return e.x*t.x+e.y*t.y+e.z*t.z+e.w}}class Da extends Cr{constructor(t,r,n,i,s,o,l){super({fov:t,nearPlane:r,farPlane:n});a(this,"pivot",new Ce);this.distance=i,this.parent=this.pivot,this.setPositionValues(0,0,i),this.pivot.euler=new S(s,o,0),this.projection.aspectRatio=l}}const W=class W{constructor(e){a(this,"renderer");a(this,"camera");a(this,"layers",[]);a(this,"meshBounds",new Map);a(this,"projection");a(this,"pool");a(this,"tiles");a(this,"onTileError");a(this,"cityScene");a(this,"roads");a(this,"ground");a(this,"heightField");a(this,"elevation",null);a(this,"loadedTerrainTiles",new Set);a(this,"loadedCityTiles",new Map);a(this,"inFlight",new Map);a(this,"fetchQueue",[]);a(this,"failedTiles",new Map);a(this,"cityReadyQueue",[]);a(this,"resultQueue",new Map);a(this,"generation",0);a(this,"terrainDesired",new Set);a(this,"cityDesired",new Set);a(this,"needsRestream",!1);a(this,"filling",!0);a(this,"slotBuildings",[]);a(this,"freeSlots",[]);a(this,"nextSlot",0);a(this,"cityMeshes",[]);a(this,"cityMeshSlots",[]);a(this,"cityMeshTiles",[]);a(this,"cityMeshQuantization",[]);a(this,"lastCityTile",null);a(this,"cityTilesChanged",!1);a(this,"groundChanged",!1);a(this,"frustum",new ti);a(this,"minScratch",new S);a(this,"maxScratch",new S);a(this,"swScratch",new S);a(this,"neScratch",new S);a(this,"lastStreamPos",new S(1/0,0,1/0));a(this,"lastStreamDist",0);a(this,"lastStreamEuler",new S(1/0,1/0,1/0));a(this,"terrainStreamingEnabled",!1);a(this,"cityStreamingEnabled",!1);a(this,"treesEnabled",!0);a(this,"batchStart",0);a(this,"batchTiles",0);a(this,"sunDirection",null);a(this,"radiusScaleParam");a(this,"loadOnlyInFrustum");a(this,"viewDistanceMax",8);this.projection=e.projection,this.pool=e.workerPool,this.tiles=e.tileService,this.onTileError=e.onTileError,this.heightField=e.heightField}attach(e){this.renderer=e.renderer,this.camera=e.camera,this.layers=e.layers,this.meshBounds=e.meshBounds,this.cityScene=e.cityScene,this.roads=e.roads,this.ground=e.ground}prefetch(e){this.streamTiles(e),this.pumpFetchQueue()}init(e){const t=e.addGroup("TileStreamer"),r={callback:()=>this.resetStreamingPosition()};this.radiusScaleParam=t.addParamFloat("load distance",W.LOAD_DISTANCE,.1,8,r),this.loadOnlyInFrustum=t.addParamBool("loadOnlyInFrustum",!0,r)}setTerrainStreamingEnabled(e){this.terrainStreamingEnabled=e}setCityStreamingEnabled(e){this.cityStreamingEnabled=e}setElevation(e){this.elevation=e}setSunDirection(e){const t=this.sunDirection;t&&Math.abs(t.x-e.x)+Math.abs(t.y-e.y)+Math.abs(t.z-e.z)<.01||(this.sunDirection=e.clone(),this.needsRestream=!0)}setViewDistanceMax(e){this.viewDistanceMax!==e&&(this.viewDistanceMax=e,this.resetStreamingPosition())}resetStreamingPosition(){this.lastStreamPos=new S(1/0,0,1/0)}setTreesEnabled(e){this.treesEnabled!==e&&(this.treesEnabled=e,this.clearAllCityTiles())}consumeCityTilesChanged(){const e=this.cityTilesChanged;return this.cityTilesChanged=!1,e}consumeGroundChanged(){const e=this.groundChanged;return this.groundChanged=!1,e}get activeWorkers(){return this.pool.activeJobs}isIdle(){return this.inFlight.size===0&&this.fetchQueue.length===0&&this.resultQueue.size===0&&this.cityReadyQueue.length===0}clearAllTerrainTiles(){var e,t,r;for(const n of this.layers)n.buffer.clear();(e=this.ground)==null||e.clear(),this.groundChanged=!0,(t=this.heightField)==null||t.clear(),(r=this.roads)==null||r.clear(),this.loadedTerrainTiles.clear(),this.dropStale()}clearAllCityTiles(){var e;for(const t of this.loadedCityTiles.values())t.mesh&&(this.meshBounds.delete(t.mesh),t.mesh.destruct());this.loadedCityTiles.clear(),this.lastCityTile=null,this.cityReadyQueue=[],this.cityMeshes.length=0,this.cityMeshSlots.length=0,this.cityMeshTiles.length=0,this.cityMeshQuantization.length=0,this.slotBuildings.length=0,this.freeSlots.length=0,this.nextSlot=0,this.cityTilesChanged=!0,(e=this.cityScene)==null||e.clear(),this.dropStale()}dropStale(){this.generation++;for(const e of this.inFlight.values())this.pool.cancel(e.job);this.inFlight.clear(),this.resultQueue.clear(),this.fetchQueue=[],this.failedTiles.clear(),this.needsRestream=!0,this.filling=!0}pickBuilding(e,t){var i;const r=(i=this.cityScene)==null?void 0:i.pick(e,t);if(!r||r.featureId<0)return-1;const n=this.loadedCityTiles.get(r.key);return n?n.slot*W.FEATURE_STRIDE+r.featureId:-1}lookupBuilding(e){if(e<0)return null;const t=Math.floor(e/W.FEATURE_STRIDE),r=e-t*W.FEATURE_STRIDE,n=this.slotBuildings[t];return n?n[r]??null:null}update(e){const t=this.camera.pivot.position,r=this.camera.euler,n=S.distance(t,this.lastStreamPos),i=Math.abs(this.camera.distance-this.lastStreamDist)>.01,s=Math.abs(r.x-this.lastStreamEuler.x)>.01||Math.abs(r.y-this.lastStreamEuler.y)>.01;(n>.01||i||s||this.needsRestream)&&(this.lastStreamPos=t.clone(),this.lastStreamDist=this.camera.distance,this.lastStreamEuler=r,this.needsRestream=!1,this.streamTiles()),this.pumpFetchQueue(),this.applyTileResults(),this.finalizeCityMeshes(),this.isIdle()&&(this.filling=!1)}applyTileResults(){const e=performance.now(),t=this.filling?W.FILL_BUDGET_SCALE:1,r=W.RESULT_BYTES_PER_FRAME*t,n=W.RESULT_MS_PER_FRAME*t;let i=0;for(const[s,{entry:o,result:l,heights:h}]of this.resultQueue){if(i>0&&(i>=r||performance.now()-e>=n))break;this.resultQueue.delete(s),i+=this.onTileResult(s,o,l,h)||1,this.maybeLogBatch()}}streamRadiusTiles(e,t){const r=e.distance,n=e.projection.FOV,i=e.projection.aspectRatio,s=r*Math.tan(n*.5)*i,o=r*Math.tan(n*.5),l=Math.max(s,o)*this.projection.metersPerUnit,h=this.radiusScaleParam?this.radiusScaleParam.value:W.LOAD_DISTANCE;return Math.ceil(h*l/this.projection.tileSizeMeters(t))+1}tileDistance(e,t){const r=this.swScratch,n=this.neScratch;this.projection.latLngToWorldInto(e.south,e.west,r),this.projection.latLngToWorldInto(e.north,e.east,n);const i=Math.max(Math.min(r.x,n.x)-t.x,0,t.x-Math.max(r.x,n.x)),s=Math.max(Math.min(r.z,n.z)-t.z,0,t.z-Math.max(r.z,n.z));return Math.sqrt(i*i+s*s)}tileVisible(e,t,r){const n=this.swScratch,i=this.neScratch;this.projection.latLngToWorldInto(t.south,t.west,n),this.projection.latLngToWorldInto(t.north,t.east,i);const s=r/this.projection.metersPerUnit;let o=[0,0];this.elevation&&(o=this.elevation.tileRange(e)??W.UNKNOWN_GROUND_M);const l=o[0]/this.projection.metersPerUnit,h=o[1]/this.projection.metersPerUnit,u=this.minScratch.setValues(Math.min(n.x,i.x),l,Math.min(n.z,i.z)),d=this.maxScratch.setValues(Math.max(n.x,i.x),h+s,Math.max(n.z,i.z)),f=this.sunDirection;if(f&&f.y>0){const m=s/Math.max(f.y,.25),p=-f.x*m,x=-f.z*m;p<0?u.x+=p:d.x+=p,x<0?u.z+=x:d.z+=x}return this.frustum.boxInFrustum(u,d)}streamTiles(e=this.camera){var C,E,A,P;const t=this.terrainStreamingEnabled,r=this.cityStreamingEnabled;if(!t&&!r)return;this.frustum.setFromCamera(e);const n=e.pivot.position,{lat:i,lng:s}=this.projection.worldToLatLng(n.x,n.z),o=this.tiles.maxZoom,l=this.streamRadiusTiles(e,o),h=e.worldPosition,u=this.projection.tileSizeMeters(o)/this.projection.metersPerUnit,d=this.viewDistanceMax,f=Math.hypot(h.x-n.x,h.z-n.z),m=Math.ceil((d+f)/u)+1,p=W.KEEP_MARGIN_TILES,x=d+p*u,b=Math.max(t?m:0,r?l:0)+p,g=this.tiles.latLngToTile(i,s,o),y=performance.now(),v=((C=this.loadOnlyInFrustum)==null?void 0:C.value)??!0;this.terrainDesired.clear(),this.cityDesired.clear();const w=[];for(let T=-b;T<=b;T++)for(let L=-b;L<=b;L++){const D={z:o,x:g.x+T,y:g.y+L};if(!this.tiles.isValid(D))continue;const B=this.tiles.tileKey(D),K=Math.max(Math.abs(T),Math.abs(L)),te=this.tiles.tileBounds(D),$=this.tileDistance(te,h),U=$<=d,be=$<=x;t&&be&&this.terrainDesired.add(B),r&&K<=l+p&&be&&this.cityDesired.add(B);const xe=t&&U&&!this.loadedTerrainTiles.has(B),Ue=r&&K<=l&&U&&!this.loadedCityTiles.has(B)&&!this.cityReadyQueued(B);if(!xe&&!Ue||this.inFlight.has(B)||this.resultQueue.has(B))continue;const ye=this.failedTiles.get(B);if(ye&&y-ye<W.RETRY_COOLDOWN_MS)continue;const Ge=this.tileVisible(D,te,Ue?W.MAX_BUILDING_HEIGHT_M:1)?0:1;v&&Ge===1||w.push({tile:D,key:B,terrain:xe,city:Ue,visible:Ge,distSq:T*T+L*L})}const M=[];for(const T of this.loadedTerrainTiles)this.terrainDesired.has(T)||M.push(T);if(M.length){for(const T of this.layers)T.buffer.removeTiles(M);(E=this.ground)==null||E.removeTiles(M),this.groundChanged=!0;for(const T of M)(A=this.heightField)==null||A.removeTile(T),this.loadedTerrainTiles.delete(T),(P=this.roads)==null||P.removeTile(T)}for(const T of[...this.loadedCityTiles.keys()])this.cityDesired.has(T)||this.removeCityTile(T);this.cityReadyQueue=this.cityReadyQueue.filter(T=>this.cityDesired.has(T.key));for(const[T,L]of this.inFlight)L.terrain&&this.terrainDesired.has(T)||L.city&&this.cityDesired.has(T)||(this.pool.cancel(L.job),this.inFlight.delete(T));w.sort((T,L)=>T.visible!==L.visible?T.visible-L.visible:T.distSq-L.distSq),this.fetchQueue=w.map(({tile:T,key:L,terrain:D,city:B})=>({tile:T,key:L,terrain:D,city:B})),this.fetchQueue.length&&this.batchTiles===0&&(this.batchStart=performance.now())}cityReadyQueued(e){for(const t of this.cityReadyQueue)if(t.key===e)return!0;return!1}pumpFetchQueue(){const e=this.pool.capacity;for(;this.fetchQueue.length>0&&this.inFlight.size<e;){const t=this.fetchQueue.shift();this.inFlight.has(t.key)||this.resultQueue.has(t.key)||this.loadTile(t)}}loadTile(e){const{tile:t,key:r}=e,n=this.generation,i=this.tiles.tileUrl(t),s=this.pool.start({url:i,tile:t,bounds:this.projection.bounds,wantTerrain:e.terrain,wantBuildings:e.city,wantTrees:this.treesEnabled,elevation:this.elevation!==null});this.inFlight.set(r,{terrain:e.terrain,city:e.city,job:s.id});const o=()=>{var l;return n===this.generation&&((l=this.inFlight.get(r))==null?void 0:l.job)===s.id};s.done.then(({result:l,heights:h})=>{o()&&(this.inFlight.delete(r),this.failedTiles.delete(r),this.batchTiles++,this.resultQueue.set(r,{entry:e,result:l,heights:h}),this.pumpFetchQueue())}).catch(l=>{var h;o()&&(this.inFlight.delete(r),this.failedTiles.set(r,performance.now()),_.warn(`[MapWorld] failed tile ${r}:`,l),(h=this.onTileError)==null||h.call(this,`Tile service error: GET ${i} - ${(l==null?void 0:l.message)??l}`),this.maybeLogBatch(),this.pumpFetchQueue())})}onTileResult(e,t,r,n){var s,o,l;let i=0;if(t.terrain&&this.terrainStreamingEnabled&&this.terrainDesired.has(e)&&!this.loadedTerrainTiles.has(e)){const h=r==null?void 0:r.terrain;if(h)for(const u of this.layers){const d=h[u.def.key];!d||!d.indices.length||(u.buffer.addTile(e,d.vertices,d.indices,d.floats),i+=d.vertices.byteLength+d.indices.byteLength)}r!=null&&r.ground&&this.ground&&(this.ground.addTile(e,r.ground.vertices,r.ground.indices,r.ground.floats),this.groundChanged=!0,i+=r.ground.vertices.byteLength+r.ground.indices.byteLength),n&&((s=this.heightField)==null||s.addTile(t.tile,n)),h&&_.ENABLED&&this.logGroundMemory(e),(o=r==null?void 0:r.roads)!=null&&o.length&&((l=this.roads)==null||l.addTile(e,r.roads)),this.loadedTerrainTiles.add(e)}if(t.city&&this.cityStreamingEnabled&&this.cityDesired.has(e)&&!this.loadedCityTiles.has(e)){const h=(r==null?void 0:r.buildings)??{vertices:new Uint16Array(0),lightmap:new Float32Array(0),interleaved:new ArrayBuffer(0),indices:new Uint16Array(0),trace:null,buildings:[],min:[0,0,0],max:[0,0,0]};this.cityReadyQueue.push({key:e,result:h})}return(this.terrainStreamingEnabled&&this.terrainDesired.has(e)&&!this.loadedTerrainTiles.has(e)||this.cityStreamingEnabled&&this.cityDesired.has(e)&&!this.loadedCityTiles.has(e)&&!this.cityReadyQueued(e))&&(this.needsRestream=!0),i}logGroundMemory(e){var l;const t=this.layers.map(h=>h.buffer);this.ground&&t.push(this.ground);let r=0,n=0,i=0;for(const h of t)r+=h.tileBytes(e),n+=h.usedBytes,i+=h.capacityBytes;const s=((l=this.ground)==null?void 0:l.tileBytes(e))??0,o=h=>(h/1048576).toFixed(2);_.log(`[MapWorld] ground tile ${e}: ${o(r)} MB (layers ${o(r-s)}, ground mesh ${o(s)}), all ${this.loadedTerrainTiles.size+1} ground tiles ${o(n)} MB in ${o(i)} MB of buffers`)}maybeLogBatch(){this.batchTiles>0&&this.isIdleExceptFinalize()&&(_.log(`[MapWorld] batch: ${this.batchTiles} tiles in ${(performance.now()-this.batchStart).toFixed()}ms`),this.batchTiles=0)}isIdleExceptFinalize(){return this.inFlight.size===0&&this.fetchQueue.length===0}finalizeCityMeshes(){var t;let e=W.MAX_CITY_FINALIZE_PER_FRAME*(this.filling?W.FILL_BUDGET_SCALE:1);for(;e-- >0&&this.cityReadyQueue.length>0;){const{key:r,result:n}=this.cityReadyQueue.shift();if(this.loadedCityTiles.has(r))continue;let i=null;if(n.vertices.length>0){i=new me(this.renderer),i.setAttribute("position",4,new Uint16Array(0)),i.setAttribute("lightmap",2,new Float32Array(0));const o=this.renderer.device.createBuffer({size:n.interleaved.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,label:`cityTile ${r}`});this.renderer.device.queue.writeBuffer(o,0,n.interleaved),i.setVertexBuffer(o,n.vertices.length/4),i.setIndices(n.indices,n.indices instanceof Uint16Array?"uint16":"uint32");const{vertices:l,lightmap:h,indices:u,atlasSize:d}=n;d&&(this.lastCityTile={key:r,result:{vertices:l,quantization:n.quantization,lightmap:h,indices:u,atlasSize:d}}),this.meshBounds.set(i,new Lt(new S(n.min[0],n.min[1],n.min[2]),new S(n.max[0],n.max[1],n.max[2])))}const s=this.freeSlots.length>0?this.freeSlots.pop():this.nextSlot++;this.slotBuildings[s]=n.buildings,this.loadedCityTiles.set(r,{mesh:i,slot:s,wallTile:n.wallTile,quantization:n.quantization}),(t=this.cityScene)==null||t.addTile(r,n.trace),this.cityTilesChanged=!0,this.rebuildCityMeshes()}}removeCityTile(e){var r,n;const t=this.loadedCityTiles.get(e);t&&(t.mesh&&(this.meshBounds.delete(t.mesh),t.mesh.destruct()),((r=this.lastCityTile)==null?void 0:r.key)===e&&(this.lastCityTile=null),this.slotBuildings[t.slot]=null,this.freeSlots.push(t.slot),this.loadedCityTiles.delete(e),(n=this.cityScene)==null||n.removeTile(e),this.cityTilesChanged=!0,this.rebuildCityMeshes())}rebuildCityMeshes(){this.cityMeshes.length=0,this.cityMeshSlots.length=0,this.cityMeshTiles.length=0,this.cityMeshQuantization.length=0;for(const e of this.loadedCityTiles.values())e.mesh&&(this.cityMeshes.push(e.mesh),this.cityMeshSlots.push(e.slot),this.cityMeshTiles.push(e.wallTile[0],e.wallTile[1]),this.cityMeshQuantization.push(...e.quantization))}destruct(){this.clearAllTerrainTiles(),this.clearAllCityTiles()}};a(W,"FEATURE_STRIDE",65536),a(W,"KEEP_MARGIN_TILES",1),a(W,"RETRY_COOLDOWN_MS",1e4),a(W,"MAX_CITY_FINALIZE_PER_FRAME",1),a(W,"RESULT_BYTES_PER_FRAME",4*1048576),a(W,"RESULT_MS_PER_FRAME",3),a(W,"FILL_BUDGET_SCALE",4),a(W,"LOAD_DISTANCE",Se()?1.5:2),a(W,"MAX_BUILDING_HEIGHT_M",400),a(W,"UNKNOWN_GROUND_M",[-1e3,1e3]);let lr=W;function Oe(c,e){this.x=c,this.y=e}Oe.prototype={clone(){return new Oe(this.x,this.y)},add(c){return this.clone()._add(c)},sub(c){return this.clone()._sub(c)},multByPoint(c){return this.clone()._multByPoint(c)},divByPoint(c){return this.clone()._divByPoint(c)},mult(c){return this.clone()._mult(c)},div(c){return this.clone()._div(c)},rotate(c){return this.clone()._rotate(c)},rotateAround(c,e){return this.clone()._rotateAround(c,e)},matMult(c){return this.clone()._matMult(c)},unit(){return this.clone()._unit()},perp(){return this.clone()._perp()},round(){return this.clone()._round()},mag(){return Math.sqrt(this.x*this.x+this.y*this.y)},equals(c){return this.x===c.x&&this.y===c.y},dist(c){return Math.sqrt(this.distSqr(c))},distSqr(c){const e=c.x-this.x,t=c.y-this.y;return e*e+t*t},angle(){return Math.atan2(this.y,this.x)},angleTo(c){return Math.atan2(this.y-c.y,this.x-c.x)},angleWith(c){return this.angleWithSep(c.x,c.y)},angleWithSep(c,e){return Math.atan2(this.x*e-this.y*c,this.x*c+this.y*e)},_matMult(c){const e=c[0]*this.x+c[1]*this.y,t=c[2]*this.x+c[3]*this.y;return this.x=e,this.y=t,this},_add(c){return this.x+=c.x,this.y+=c.y,this},_sub(c){return this.x-=c.x,this.y-=c.y,this},_mult(c){return this.x*=c,this.y*=c,this},_div(c){return this.x/=c,this.y/=c,this},_multByPoint(c){return this.x*=c.x,this.y*=c.y,this},_divByPoint(c){return this.x/=c.x,this.y/=c.y,this},_unit(){return this._div(this.mag()),this},_perp(){const c=this.y;return this.y=this.x,this.x=-c,this},_rotate(c){const e=Math.cos(c),t=Math.sin(c),r=e*this.x-t*this.y,n=t*this.x+e*this.y;return this.x=r,this.y=n,this},_rotateAround(c,e){const t=Math.cos(c),r=Math.sin(c),n=e.x+t*(this.x-e.x)-r*(this.y-e.y),i=e.y+r*(this.x-e.x)+t*(this.y-e.y);return this.x=n,this.y=i,this},_round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},constructor:Oe};Oe.convert=function(c){if(c instanceof Oe)return c;if(Array.isArray(c))return new Oe(+c[0],+c[1]);if(c.x!==void 0&&c.y!==void 0)return new Oe(+c.x,+c.y);throw new Error("Expected [x, y] or {x, y} point format")};function en(c,e,t,r){const n=Math.pow(2,r.z),i=r.x+c/t,s=r.y+e/t,o=i/n*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*s/n)))*180/Math.PI,lon:o}}const Fa="Terrain Tiles © Mapzen",za=12,Nt=class Nt{constructor(){a(this,"worker");a(this,"ranges",new Map);a(this,"originLat",NaN);a(this,"originLng",NaN);a(this,"originM",0);this.worker=new Worker(new URL(""+new URL("tileFetchWorker-D4ys7oPM.js",import.meta.url).href,import.meta.url),{type:"module"}),this.worker.onmessage=e=>{const t=e.data;t.type==="range"?(this.ranges.set(`${t.x}/${t.y}`,[t.min,t.max]),this.ranges.size>Nt.RANGES_MAX&&this.ranges.delete(this.ranges.keys().next().value)):t.lat===this.originLat&&t.lng===this.originLng&&(this.originM=t.height)}}get originHeight(){return this.originM}setOrigin(e,t){this.originLat=e,this.originLng=t,this.post({type:"origin",lat:e,lng:t})}preload(e,t){this.post({type:"preload",lat:e,lng:t})}tileRange(e){const t=e.z-za,r=t>=0?e.x>>t:e.x<<-t,n=t>=0?e.y>>t:e.y<<-t,i=this.ranges.get(`${r}/${n}`);return i?[i[0]-this.originM,i[1]-this.originM]:null}createPort(e){const t=new MessageChannel;return this.worker.postMessage({type:e,port:t.port1},[t.port1]),t.port2}destroy(){this.worker.terminate()}post(e){this.worker.postMessage(e)}};a(Nt,"RANGES_MAX",4096);let hr=Nt;const Oa=[[0,4800],[18,4900],[28,4100],[36,3500],[42,3e3],[46,2600],[52,1900],[57,1400],[61,1e3],[64,700],[67,450],[72,150],[76,0]],Na=1.1,Va=50;function Ua(c){const e=c<0?-c*Na:c,t=Oa;if(e<=t[0][0])return t[0][1];for(let r=1;r<t.length;r++){const[n,i]=t[r];if(e<=n){const[s,o]=t[r-1];return o+(i-o)*(e-s)/(n-s)}}return t[t.length-1][1]}const ri=[.36,.28,.21],Ze=[[.28,.45,.22],[.31,.48,.24],[.25,.41,.21],[.33,.5,.25],[.3,.44,.2],[.27,.47,.26],[.34,.47,.22],[.26,.43,.24]],Ga=[ri,...Ze],Zt=4,cr=2047,Wa=-1;function tn(c,e){const t=r=>Math.round((Math.min(Math.max(r,-1),1)*.5+.5)*cr);return t(c)*2048+t(e)}class ja{constructor(e,t,r,n,i){a(this,"cells");a(this,"heights");a(this,"normals");a(this,"dx");a(this,"dy");this.x0=e,this.y0=t,this.x1=r,this.y1=n;const s=Math.round(Math.sqrt(i.length)),o=this.cells=s-3;this.dx=(r-e)/o,this.dy=(n-t)/o;const l=o+1;this.heights=new Float32Array(l*l),this.normals=new Float32Array(l*l*3);const h=(u,d)=>i[(d+1)*s+u+1];for(let u=0;u<l;u++)for(let d=0;d<l;d++){this.heights[u*l+d]=h(d,u);const f=(h(d+1,u)-h(d-1,u))/(2*this.dx),m=(h(d,u+1)-h(d,u-1))/(2*this.dy),p=jt(f,1,m),x=(u*l+d)*3;this.normals[x]=-f/p,this.normals[x+1]=1/p,this.normals[x+2]=m/p}}gridX(e){return e>=this.cells?this.x1:this.x0+(this.x1-this.x0)*e/this.cells}gridY(e){return e>=this.cells?this.y1:this.y0+(this.y1-this.y0)*e/this.cells}cellX(e){return Math.min(Math.max(Math.floor((e-this.x0)/this.dx),0),this.cells-1)}cellY(e){return Math.min(Math.max(Math.floor((e-this.y0)/this.dy),0),this.cells-1)}heightAt(e,t){const r=this.cellX(e),n=this.cellY(t),i=(e-this.gridX(r))/this.dx,s=(t-this.gridY(n))/this.dy,o=this.cells+1,l=this.heights,h=l[n*o+r],u=l[(n+1)*o+r+1];if(i>=s){const f=l[n*o+r+1];return h+i*(f-h)+s*(u-f)}const d=l[(n+1)*o+r];return h+s*(d-h)+i*(u-d)}normalAt(e,t){const r=this.cellX(e),n=this.cellY(t),i=(e-this.gridX(r))/this.dx,s=(t-this.gridY(n))/this.dy,o=this.cells+1,l=n*o+r,h=l+1,u=l+o,d=u+1;let f,m,p,x;const b=i>=s?1-i:1-s;i>=s?(f=h,m=i-s,p=d,x=s):(f=u,m=s-i,p=d,x=i);const g=this.normals,y=g[l*3]*b+g[f*3]*m+g[p*3]*x,v=g[l*3+1]*b+g[f*3+1]*m+g[p*3+1]*x,w=g[l*3+2]*b+g[f*3+2]*m+g[p*3+2]*x,M=jt(y,v,w)||1;return tn(y/M,w/M)}minHeight(e,t,r){let n=1/0,i=1/0,s=1/0,o=-1/0,l=-1/0;for(let p=t;p<r;p++){const x=e[p*2],b=e[p*2+1];n=Math.min(n,this.heightAt(x,b)),i=Math.min(i,x),o=Math.max(o,x),s=Math.min(s,b),l=Math.max(l,b)}const h=this.cells+1,u=Math.max(Math.ceil((i-this.x0)/this.dx),0),d=Math.min(Math.floor((o-this.x0)/this.dx),this.cells),f=Math.max(Math.ceil((s-this.y0)/this.dy),0),m=Math.min(Math.floor((l-this.y0)/this.dy),this.cells);for(let p=f;p<=m;p++){const x=this.gridY(p);for(let b=u;b<=d;b++){const g=this.heights[p*h+b];g<n&&Ha(e,t,r,this.gridX(b),x)&&(n=g)}}return n}buildMesh(){const e=this.cells,t=e+1,r=new Float32Array(t*t*Zt);for(let s=0;s<t;s++){const o=this.gridY(s);for(let l=0;l<t;l++){const h=s*t+l,u=h*Zt;r[u]=this.gridX(l),r[u+1]=this.heights[h],r[u+2]=-o,r[u+3]=tn(this.normals[h*3],this.normals[h*3+2])}}const n=new Uint32Array(e*e*6);let i=0;for(let s=0;s<e;s++)for(let o=0;o<e;o++){const l=s*t+o,h=l+1,u=l+t,d=u+1;n[i++]=l,n[i++]=h,n[i++]=d,n[i++]=l,n[i++]=d,n[i++]=u}return{vertices:r,indices:n}}drapeTriangles(e,t,r,n,i,s){const o=qa??(qa=new Xa);o.cut.clear();const l={out:s,lift:r,tolerance:n,normals:i,points:o.pointsFor(e.length/2),cut:o.cut,scratch:o},h=o.pieceAt(0);for(let u=0;u+2<t.length;u+=3){const d=t[u],f=t[u+1],m=t[u+2],p=e[d*2],x=e[d*2+1],b=e[f*2],g=e[f*2+1],y=e[m*2],v=e[m*2+1];if((b-p)*(v-x)-(y-p)*(g-x)===0)continue;const w=this.cellX(Math.min(p,b,y)),M=this.cellX(Math.max(p,b,y)),C=this.cellY(Math.min(x,g,v)),E=this.cellY(Math.max(x,g,v));if(this.planarUnder(w,M,C,E,n)){const A=this.pointVertex(l,e,d),P=this.pointVertex(l,e,f);s.pushTriangle(A,P,this.pointVertex(l,e,m));continue}h[0]=p,h[1]=x,h[2]=b,h[3]=g,h[4]=y,h[5]=v,this.drapePolygon(l,h,3,w,M,C,E,1)}}pointVertex(e,t,r){return e.points[r]<0&&(e.points[r]=this.pushVertex(e,t,r)),e.points[r]}pushVertex(e,t,r){const n=t[r*2],i=t[r*2+1],s=this.cells,o=Math.min(Math.max(Math.floor((n-this.x0)/this.dx),0),s-1),l=Math.min(Math.max(Math.floor((i-this.y0)/this.dy),0),s-1),h=(n-(o>=s?this.x1:this.x0+(this.x1-this.x0)*o/s))/this.dx,u=(i-(l>=s?this.y1:this.y0+(this.y1-this.y0)*l/s))/this.dy,d=s+1,f=this.heights,m=l*d+o,p=m+1,x=m+d,b=x+1,g=f[m],y=f[b];let v;if(h>=u){const A=f[p];v=g+h*(A-g)+u*(y-A)}else{const A=f[x];v=g+u*(A-g)+h*(y-A)}let w=Wa;if(e.normals){let A,P,T,L;const D=h>=u?1-h:1-u;h>=u?(A=p,P=h-u,T=b,L=u):(A=x,P=u-h,T=b,L=h);const B=this.normals,K=B[m*3]*D+B[A*3]*P+B[T*3]*L,te=B[m*3+1]*D+B[A*3+1]*P+B[T*3+1]*L,$=B[m*3+2]*D+B[A*3+2]*P+B[T*3+2]*L,U=jt(K,te,$)||1,be=Math.round((Math.min(Math.max(K/U,-1),1)*.5+.5)*cr),xe=Math.round((Math.min(Math.max($/U,-1),1)*.5+.5)*cr);w=be*2048+xe}const M=e.out,C=M.allocVertex(),E=M.vertexData;return E[C]=n,E[C+1]=v+e.lift,E[C+2]=-i,E[C+3]=w,C/Zt}planarUnder(e,t,r,n,i){t++,n++;const s=this.cells+1,o=this.heights,l=o[r*s+e],h=(o[r*s+t]-l)/(t-e),u=(o[n*s+e]-l)/(n-r);for(let d=r;d<=n;d++)for(let f=e;f<=t;f++)if(Math.abs(o[d*s+f]-(l+(f-e)*h+(d-r)*u))>i)return!1;return!0}drapePolygon(e,t,r,n,i,s,o,l){if(r<3)return;let h=1/0,u=-1/0,d=1/0,f=-1/0;for(let p=0;p<r*2;p+=2)h=Math.min(h,t[p]),u=Math.max(u,t[p]),d=Math.min(d,t[p+1]),f=Math.max(f,t[p+1]);if(n=Math.min(Math.max(this.cellX(h),n),i),i=Math.max(Math.min(this.cellX(u),i),n),s=Math.min(Math.max(this.cellY(d),s),o),o=Math.max(Math.min(this.cellY(f),o),s),this.planarUnder(n,i,s,o,e.tolerance)){this.emitPolygon(e,t,r);return}const m=e.scratch.pieceAt(l);if(n===i&&s===o){const p=1/this.dx,x=1/this.dy,b=this.gridX(n),g=this.gridY(s),y=p,v=-x,w=-b*p+g*x;X[0]=y,X[1]=v,X[2]=w;let M=He(t,r,m);M===Re?this.emitPolygon(e,t,r):this.emitPolygon(e,m,M),X[0]=-y,X[1]=-v,X[2]=-w,M=He(t,r,m),M===Re?this.emitPolygon(e,t,r):this.emitPolygon(e,m,M);return}if(i-n>=o-s){const p=n+i+1>>1,x=this.gridX(p);X[0]=-1,X[1]=0,X[2]=x;let b=He(t,r,m);b===Re?this.drapePolygon(e,t,r,n,p-1,s,o,l+1):this.drapePolygon(e,m,b,n,p-1,s,o,l+1),X[0]=1,X[1]=0,X[2]=-x,b=He(t,r,m),b===Re?this.drapePolygon(e,t,r,p,i,s,o,l+1):this.drapePolygon(e,m,b,p,i,s,o,l+1)}else{const p=s+o+1>>1,x=this.gridY(p);X[0]=0,X[1]=-1,X[2]=x;let b=He(t,r,m);b===Re?this.drapePolygon(e,t,r,n,i,s,p-1,l+1):this.drapePolygon(e,m,b,n,i,s,p-1,l+1),X[0]=0,X[1]=1,X[2]=-x,b=He(t,r,m),b===Re?this.drapePolygon(e,t,r,n,i,p,o,l+1):this.drapePolygon(e,m,b,n,i,p,o,l+1)}}emitPolygon(e,t,r){if(r<3)return;let n=0;for(let l=0;l<r;l++){const h=l+1===r?0:l+1;n+=t[l*2]*t[h*2+1]-t[h*2]*t[l*2+1]}if(Math.abs(n)<1e-18)return;const{out:i,cut:s}=e,o=e.scratch.fan;for(let l=0;l<r;l++){let h=s.get(t,l);h<0&&(h=this.pushVertex(e,t,l),s.set(t,l,h)),o[l]=h}for(let l=1;l+1<r;l++)i.pushTriangle(o[0],o[l],o[l+1])}}function Ha(c,e,t,r,n){let i=!1;for(let s=e,o=t-1;s<t;o=s++){const l=c[s*2],h=c[s*2+1],u=c[o*2],d=c[o*2+1];h>n!=d>n&&r<(u-l)*(n-h)/(d-h)+l&&(i=!i)}return i}class Xa{constructor(){a(this,"cut",new ur);a(this,"fan",new Int32Array(rn));a(this,"pieces",[]);a(this,"points",new Int32Array(8192))}pieceAt(e){var t;return(t=this.pieces)[e]??(t[e]=new Float64Array(rn*2))}pointsFor(e){return this.points.length<e&&(this.points=new Int32Array(Math.max(e,this.points.length*2))),this.points.fill(-1,0,e)}}let qa=null;const de=class de{constructor(){a(this,"slots",new Int32Array(8192).fill(-1));a(this,"keys",new Float64Array(8192));a(this,"values",new Int32Array(4096));a(this,"count",0)}static hash(e,t){de.bits[0]=e[t*2]+0,de.bits[1]=e[t*2+1]+0;const r=de.words;let n=Math.imul(r[0]^Math.imul(r[1],2654435761),2246822507);return n=Math.imul(n^r[2]^Math.imul(r[3],3266489909),668265263),(n^n>>>15)>>>0}clear(){this.count>0&&this.slots.fill(-1),this.count=0}get(e,t){const r=e[t*2],n=e[t*2+1],i=this.slots,s=i.length-1,o=this.keys;for(let l=de.hash(e,t)&s;;l=l+1&s){const h=i[l];if(h<0)return-1;if(o[h*2]===r&&o[h*2+1]===n)return this.values[h]}}set(e,t,r){this.count===this.values.length&&this.grow();const n=this.count++;this.keys[n*2]=e[t*2],this.keys[n*2+1]=e[t*2+1],this.values[n]=r,this.insert(n)}insert(e){const t=this.slots,r=t.length-1;let n=de.hash(this.keys,e)&r;for(;t[n]>=0;)n=n+1&r;t[n]=e}grow(){const e=this.values.length*2,t=new Float64Array(e*2),r=new Int32Array(e);t.set(this.keys),r.set(this.values),this.keys=t,this.values=r,this.slots=new Int32Array(e*2).fill(-1);for(let n=0;n<this.count;n++)this.insert(n)}};a(de,"bits",new Float64Array(2)),a(de,"words",new Uint32Array(de.bits.buffer));let ur=de;const rn=32,Re=-1,X=new Float64Array(3);function He(c,e,t){const r=X[0],n=X[1],i=X[2];let s=0;for(let l=0;l<e;l++)r*c[l*2]+n*c[l*2+1]+i>=0&&s++;if(s===e)return Re;if(s===0)return 0;let o=0;for(let l=0;l<e;l++){const h=c[l*2],u=c[l*2+1],d=l+1===e?0:l+1,f=c[d*2],m=c[d*2+1],p=r*h+n*u+i,x=r*f+n*m+i;if(p>=0&&(t[o]=h,t[o+1]=u,o+=2),p>=0!=x>=0){const b=p/(p-x);t[o]=n===0?-i/r:h+b*(f-h),t[o+1]=r===0?-i/n:u+b*(m-u),o+=2}}return o/2}const gt=[{key:"urban",label:"urban areas",color:"#9e9994",defaultOn:!1},{key:"farmland",label:"farmland",color:"#b3b885",defaultOn:!0},{key:"sand",label:"sand",color:"#dbcc9e",defaultOn:!0},{key:"green",label:"parks & grass",color:"#70965e",defaultOn:!0},{key:"forest",label:"forest",color:"#547a4d",defaultOn:!0},{key:"glacier",label:"glaciers",color:"#eef2f7",defaultOn:!0},{key:"water",label:"water",color:"#546579",defaultOn:!0},{key:"waterways",label:"waterways",color:"#546579",defaultOn:!0},{key:"roads",label:"roads",color:"#d1d1d6",defaultOn:!0},{key:"railways",label:"railways",color:"#595961",defaultOn:!0},{key:"paths",label:"paths",color:"#b3a68c",defaultOn:!0}];gt.map(c=>c.key);const kr=1e-4;Object.fromEntries(gt.map((c,e)=>[c.key,(e+1)*kr]));const ni=gt.length*kr,nn=4;function Ya(c,e,t){const r=en(0,1,1,c),n=en(1,0,1,c),[i,s]=e.project(r.lon,r.lat),[o,l]=e.project(n.lon,n.lat),h=new Float32Array(t.length);for(let u=0;u<h.length;u++)h[u]=t[u]*e.metersToNorm;return new ja(i,s,o,l,h)}class Ka{constructor(e){a(this,"grids",new Map);a(this,"zoom",14);a(this,"last",null);a(this,"maxHeights",new Map);a(this,"maxHeight",-1/0);a(this,"maxDirty",!1);this.projection=e}addTile(e,t){e.z!==this.zoom&&this.clear(),this.zoom=e.z;const r=this.key(e.x,e.y);this.grids.set(r,Ya(e,this.projection,t));let n=-1/0;for(let i=0;i<t.length;i++)t[i]>n&&(n=t[i]);this.maxHeights.set(r,n),this.maxDirty=!0}get maxHeightM(){if(this.maxDirty){this.maxDirty=!1,this.maxHeight=-1/0;for(const e of this.maxHeights.values())e>this.maxHeight&&(this.maxHeight=e)}return this.maxHeight}removeTile(e){const[t,r,n]=e.split("/").map(Number);if(t!==this.zoom)return;const i=this.key(r,n);this.grids.get(i)===this.last&&(this.last=null),this.grids.delete(i),this.maxHeights.delete(i),this.maxDirty=!0}clear(){this.grids.clear(),this.maxHeights.clear(),this.maxDirty=!0,this.last=null}heightAt(e,t){const r=-t,n=this.last;if(n&&e>=n.x0&&e<n.x1&&r>=n.y0&&r<n.y1)return n.heightAt(e,r);const i=this.projection,s=e/(i.cosLat*i.scale)+i.lngMid,o=r/i.scale+i.latMid,l=2**this.zoom,h=Math.floor((s+180)/360*l),u=Math.max(Math.min(o,85.05),-85.05)*Math.PI/180,d=Math.floor((1-Math.asinh(Math.tan(u))/Math.PI)/2*l),f=this.grids.get(this.key((h%l+l)%l,d));return f?(this.last=f,f.heightAt(e,r)):null}key(e,t){return e*2**this.zoom+t}}const ii=`//0 downscale, 1 separable gaussian, 2 cubic B-spline upscale, see SmolGaussianBlur\r
override PASS: u32 = 0;\r
\r
struct Uniforms {\r
	//downscale: one texel of the source. gaussian: one texel of the source along the blur direction, 0 across it\r
	texelStep: vec2<f32>,\r
	//maps this pass onto an exact rectangle of the source, see vs_main\r
	uvScale: vec2<f32>,\r
	//gaussian: the standard deviation in texels of the level it runs on\r
	sigma: f32,\r
	//gaussian: the texels per side the kernel reaches, 4 sigma rounded up\r
	taps: u32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var textureSampler: sampler;\r
@group(0) @binding(2) var texture: texture_2d<f32>;\r
\r
struct VertexInput {\r
	@location(0) position : vec3<f32>,\r
	@location(1) uv : vec2<f32>\r
}\r
\r
struct VertexOutput {\r
	@builtin(position) position : vec4<f32>,\r
	@location(0) uv : vec2<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input: VertexInput) -> VertexOutput {\r
	var output : VertexOutput;\r
	output.position = vec4(input.position, 1.);\r
	//The levels are exact 2:1 rectangles of their parent from the top left (the leftover row/column of an odd size\r
	//falls off), so the downscale reads 2x its own size and the upscale reads a level as covering 2^k of its texels\r
	//per source pixel. uvScale keeps every pixel on the same spot of the texel grid it reads, without it the grid\r
	//drifts across the image and the kernel degenerates in bands.\r
	output.uv = input.uv * uniforms.uvScale;\r
	return output;\r
}\r
\r
fn ts(uv: vec2<f32>) -> vec4<f32> {\r
	return textureSampleLevel(texture, textureSampler, uv, 0.);\r
}\r
\r
//The tent of blur.wgsl: the destination pixel sits on a texel corner of the source, the 4 corner taps a texel out\r
//each average 2x2 texels on their own corner and the center tap (x4) the 2x2 around the pixel. Per axis that weighs\r
//the 4 texels .125/.375/.375/.125, a variance of .75 texels. A plain 2x2 box (.25) would be one tap, but passes\r
//most of what lies above the nyquist frequency of the level, and moving highlights then pump in brightness.\r
fn downscale(uv: vec2<f32>) -> vec4<f32> {\r
	let d = uniforms.texelStep;\r
	let c = ts(uv + d * vec2(-1., -1.)) + ts(uv + d * vec2(1., -1.)) + ts(uv + d * vec2(-1., 1.)) + ts(uv + d * vec2(1., 1.));\r
	return (c + ts(uv) * 4.) * .125;\r
}\r
\r
//One axis of a gaussian, its texels paired so one bilinear fetch reads two of them. The weights come from the\r
//incremental gaussian (GPU Gems 3, ch. 40): g(x + 1) / g(x) = exp(-(2x + 1) / 2s^2), so stepping that ratio by\r
//exp(-1 / s^2) per texel needs no exp in the loop. Between 3 and 4 sigma the weights taper to 0, so a kernel that\r
//reaches one more texel when sigma grows does not pop.\r
fn gaussian(uv: vec2<f32>) -> vec4<f32> {\r
	let s = max(uniforms.sigma, 1e-3);\r
	let r = exp(-.5 / (s * s));\r
	let rr = r * r;\r
	var g = 1.;\r
	var ratio = r;\r
	var sum = ts(uv);\r
	var weightSum = 1.;\r
	let n = uniforms.taps;\r
	for (var x = 1u; x <= n; x += 2u) {\r
		//texel x\r
		g *= ratio;\r
		ratio *= rr;\r
		let ga = g * clamp(4. - f32(x) / s, 0., 1.);\r
		//texel x + 1, which is past the end of the kernel when n is odd: the taper has it at 0 there\r
		g *= ratio;\r
		ratio *= rr;\r
		let gb = g * clamp(4. - f32(x + 1u) / s, 0., 1.);\r
		let w = ga + gb;\r
		if (w > 0.) {\r
			let o = uniforms.texelStep * (f32(x) + gb / w);\r
			sum += (ts(uv + o) + ts(uv - o)) * w;\r
			weightSum += 2. * w;\r
		}\r
	}\r
	return sum / weightSum;\r
}\r
\r
//Cubic B-spline in 4 bilinear fetches (Sigg & Hadwiger, GPU Gems 2, ch. 20). The kernel is positive, so unlike\r
//bilinear it shows no slope steps on bright HDR content when it enlarges a lot, and unlike Catmull-Rom it does not\r
//ring. It blurs by a variance of 1/3 texel per axis at every phase, which SmolGaussianBlur takes off the gaussian.\r
fn upscale(uv: vec2<f32>) -> vec4<f32> {\r
	let size = vec2<f32>(textureDimensions(texture));\r
	let st = uv * size - .5;\r
	let i = floor(st);\r
	let f = st - i;\r
	let f2 = f * f;\r
	let f3 = f2 * f;\r
	let w0 = (1. - f) * (1. - f) * (1. - f) / 6.;\r
	let w1 = (4. - 6. * f2 + 3. * f3) / 6.;\r
	let w2 = (1. + 3. * f + 3. * f2 - 3. * f3) / 6.;\r
	let w3 = f3 / 6.;\r
	let g0 = w0 + w1;\r
	let g1 = w2 + w3;\r
	//texel centers on i + .5, the pairs (i - 1, i) and (i + 1, i + 2) each read with one bilinear fetch\r
	let p0 = (i + .5 - 1. + w1 / g0) / size;\r
	let p1 = (i + .5 + 1. + w3 / g1) / size;\r
	return (ts(vec2(p0.x, p0.y)) * g0.x + ts(vec2(p1.x, p0.y)) * g1.x) * g0.y +\r
	       (ts(vec2(p0.x, p1.y)) * g0.x + ts(vec2(p1.x, p1.y)) * g1.x) * g1.y;\r
}\r
\r
@fragment\r
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {\r
	if (PASS == 0u) {\r
		return downscale(input.uv);\r
	}\r
	if (PASS == 1u) {\r
		return gaussian(input.uv);\r
	}\r
	return upscale(input.uv);\r
}\r
`,$a={format:"rgba8unorm",maxLevels:8,radius:20,maxRadius:256},ne=class ne{constructor(e,t={}){a(this,"levels",[]);a(this,"temp",[]);a(this,"renderer");a(this,"downMaterial");a(this,"gaussianMaterial");a(this,"upMaterial");a(this,"options");a(this,"radiusParam",null);a(this,"texelStep",new k);a(this,"uvScale",new k);a(this,"_radius",0);a(this,"_levelCount",0);a(this,"_levelSigma",0);this.options={...$a,...t},this.renderer=e;const r=this.renderer.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",magFilter:"linear",minFilter:"linear"});this.downMaterial=this.createMaterial(r,0),this.gaussianMaterial=this.createMaterial(r,1),this.upMaterial=this.createMaterial(r,2);for(let n=0;n<=this.options.maxLevels;n++)this.levels.push(this.createBuffer()),this.temp.push(this.createBuffer())}init(e,t="smolGaussianBlur"){const r=e.addGroup(t);this.radiusParam=r.addParamFloat("blurRadius",this.options.radius,0,this.options.maxRadius)}get radius(){return this.radiusParam?this.radiusParam.value:this.options.radius}set radius(e){this.radiusParam?this.radiusParam.setValue(e,!1):this.options.radius=e}get drawnRadius(){return this._radius}get levelCount(){return this._levelCount}get levelSigma(){return this._levelSigma}draw(e,t,r=null){const n=this.maxUsefulLevels(e),i=Math.min(Math.max(this.radius,0),ne.LEVEL_SIGMA*Math.pow(2,n+1));let s=0;for(;s<n&&i/Math.pow(2,s)>=ne.LEVEL_SIGMA;)s++;const o=Math.pow(2,s);let l=i*i;for(let b=1;b<=s;b++)l-=Math.pow(4,b-1)*ne.DOWN_VARIANCE;s>0&&(l-=o*o*ne.UP_VARIANCE);const h=Math.sqrt(Math.max(l,0))/o;this._radius=i,this._levelCount=s,this._levelSigma=h;const u=h>.01?Math.ceil(4*h):0,d=[];let f=null,m=null;if(r){const b=[e.height];for(let g=1;g<=s;g++)b.push(Math.max(1,Math.floor(b[g-1]*.5)));f=s>0?ne.mapRows(r,1/o,3,b[s]):r,m=ne.mapRows(f,1,u+1,b[s]),d[s]=m;for(let g=s;g>1;g--)d[g-1]=ne.mapRows(d[g],2,2,b[g-1])}let p=e;for(let b=1;b<=s;b++){const g=this.levels[b];g.setSize(Math.max(1,Math.floor(p.width*.5)),Math.max(1,Math.floor(p.height*.5))),this.texelStep.setValues(1/p.width,1/p.height),this.downMaterial.setVector2("texelStep",this.texelStep),this.uvScale.setValues(2*g.width/p.width,2*g.height/p.height),this.downMaterial.setVector2("uvScale",this.uvScale),this.blit(p,g,this.downMaterial,d[b]??null),p=g}const x=this.temp[s];if(x.setSize(p.width,p.height),this.gaussianMaterial.setFloat("sigma",h),this.gaussianMaterial.setFloat("taps",u),this.texelStep.setValues(1/p.width,0),this.gaussianMaterial.setVector2("texelStep",this.texelStep),this.blit(p,x,this.gaussianMaterial,m),this.texelStep.setValues(0,1/p.height),this.gaussianMaterial.setVector2("texelStep",this.texelStep),s===0){this.blit(x,t,this.gaussianMaterial,f);return}this.blit(x,this.levels[s],this.gaussianMaterial,f),this.uvScale.setValues(e.width/(o*p.width),e.height/(o*p.height)),this.upMaterial.setVector2("uvScale",this.uvScale),this.blit(this.levels[s],t,this.upMaterial,r)}blit(e,t,r,n){n?this.renderer.blitRows(e,t,r,n):this.renderer.blit(e,t,r)}static mapRows(e,t,r,n){const i=[];for(const[o,l]of e){const h=Math.max(0,Math.floor(o*t)-r),u=Math.min(n,Math.ceil(l*t)+r);u>h&&i.push([h,u])}i.sort((o,l)=>o[0]-l[0]);const s=[];for(const o of i){const l=s[s.length-1];l&&o[0]<=l[1]?l[1]=Math.max(l[1],o[1]):s.push([o[0],o[1]])}return s}destruct(){for(const e of this.levels)e.destruct();for(const e of this.temp)e.destruct();this.downMaterial.destruct(),this.gaussianMaterial.destruct(),this.upMaterial.destruct()}createMaterial(e,t){const r=new G(this.renderer,"smolGaussianBlur",ii);return r.setConstant("PASS",t),r.depthWriteEnabled=!1,r.depthCompare="always",r.setSampler("textureSampler",e),this.uvScale.setValues(1,1),r.setVector2("uvScale",this.uvScale),r}maxUsefulLevels(e){const t=Math.floor(Math.log2(Math.min(e.width,e.height)))-1;return Math.max(0,Math.min(this.options.maxLevels,t))}createBuffer(){return new H(this.renderer,1,1,{formats:[this.options.format],depth:!1})}};a(ne,"DOWN_VARIANCE",.75),a(ne,"UP_VARIANCE",1/3),a(ne,"LEVEL_SIGMA",6);let dr=ne;const sn=`// Tilt-shift composite: mixes the sharp image with five blurred copies of it by a circle of confusion that grows\r
// linearly with the distance to the horizontal center line, see TiltShift.ts.\r
// Needs hash.wgsl.\r
\r
// 1: the blurs are at half the resolution (the halfRes param of TiltShift), read bilinearly\r
override HALF_RES: u32 = 0;\r
\r
struct Uniforms {\r
  // the gaussian sigmas of blur0..3 in pixels, ascending. 0 for a level that was skipped, its texture is the source\r
  sigmas : vec4<f32>,\r
  // the sigma of blur4, the largest\r
  sigma4 : f32,\r
  // the sigma in pixels at the top and bottom edge of the screen (|ndc y| = 1)\r
  slope : f32,\r
  // HALF_RES: a pixel position times this is the uv of the blurs, 1 / (2 * their size). They are an exact 2:1\r
  // rectangle of the image from the top left (an odd last row/column falls off), see TiltShift.draw\r
  blurTexel : vec2<f32>,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var texture : texture_2d<f32>;\r
@group(0) @binding(2) var blur0 : texture_2d<f32>;\r
@group(0) @binding(3) var blur1 : texture_2d<f32>;\r
@group(0) @binding(4) var blur2 : texture_2d<f32>;\r
@group(0) @binding(5) var blur3 : texture_2d<f32>;\r
@group(0) @binding(6) var blur4 : texture_2d<f32>;\r
@group(0) @binding(7) var blurSampler : sampler;\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) uv : vec2<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  output.uv = input.uv;\r
  return output;\r
}\r
\r
//level 0 is the sharp image, level i the blur i - 1\r
fn level(i : u32, coord : vec2<i32>, uv : vec2<f32>) -> vec4<f32> {\r
  if (HALF_RES != 0u) {\r
    // a skipped level (sigma 0) is not read, fs_main reads the sharp image for it\r
    switch (i) {\r
      case 0u: { return textureLoad(texture, coord, 0); }\r
      case 1u: { return textureSampleLevel(blur0, blurSampler, uv, 0.0); }\r
      case 2u: { return textureSampleLevel(blur1, blurSampler, uv, 0.0); }\r
      case 3u: { return textureSampleLevel(blur2, blurSampler, uv, 0.0); }\r
      case 4u: { return textureSampleLevel(blur3, blurSampler, uv, 0.0); }\r
      default: { return textureSampleLevel(blur4, blurSampler, uv, 0.0); }\r
    }\r
  }\r
  switch (i) {\r
    case 0u: { return textureLoad(texture, coord, 0); }\r
    case 1u: { return textureLoad(blur0, coord, 0); }\r
    case 2u: { return textureLoad(blur1, coord, 0); }\r
    case 3u: { return textureLoad(blur2, coord, 0); }\r
    case 4u: { return textureLoad(blur3, coord, 0); }\r
    default: { return textureLoad(blur4, coord, 0); }\r
  }\r
}\r
\r
//this is the last pass onto the 8 bit canvas: triangle noise of 1 step of 255 each way (the sum of 2 uniforms) breaks\r
//up the banding of the smooth gradients (the sky, the fog, the blurs), and its error doesn't depend on the color\r
fn dither(c : vec4<f32>, coord : vec2<i32>) -> vec4<f32> {\r
  let r = hash22uf(vec2<u32>(coord));\r
  return vec4<f32>(saturate(c.rgb + (r.x + r.y - 1.0) / 255.0), c.a);\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  let coord = vec2<i32>(input.position.xy);\r
  return dither(composite(input, coord), coord);\r
}\r
\r
fn composite(input : VertexOutput, coord : vec2<i32>) -> vec4<f32> {\r
  // no blur (see TiltShift.draw): only the dither\r
  if (uniforms.slope == 0.0) { return textureLoad(texture, coord, 0); }\r
  let ndcY = 1.0 - 2.0 * input.uv.y;\r
  let s = min(uniforms.slope * abs(ndcY), uniforms.sigma4);\r
  let v = s * s;\r
\r
  // The first level i that blurs at least as much as this pixel needs, with the variances of the levels on either\r
  // side of it: a of level i - 1, b of level i. Not a loop over an array of the sigmas: the array, indexed by a per\r
  // pixel i, went to local memory on D3D12 and took half the time of this pass at 4K.\r
  let sv = uniforms.sigmas * uniforms.sigmas;\r
  var i = 5u;\r
  var a = sv.w;\r
  var b = uniforms.sigma4 * uniforms.sigma4;\r
  if (v <= sv.x) { i = 1u; a = 0.0; b = sv.x; }\r
  else if (v <= sv.y) { i = 2u; a = sv.x; b = sv.y; }\r
  else if (v <= sv.z) { i = 3u; a = sv.y; b = sv.z; }\r
  else if (v <= sv.w) { i = 4u; a = sv.z; b = sv.w; }\r
\r
  // A mix of two zero mean kernels has the weighted mean of their variances, so lerping by variance keeps the\r
  // variance of the mix at s^2 between the radii that were blurred.\r
  let t = clamp((v - a) / max(b - a, 1e-6), 0.0, 1.0);\r
  if (HALF_RES == 0u) {\r
    return mix(level(i - 1u, coord, vec2<f32>()), level(i, coord, vec2<f32>()), t);\r
  }\r
  // A skipped level holds the full resolution image, which the half resolution uv would misplace: read the sharp\r
  // image itself for it.\r
  let uv = input.position.xy * uniforms.blurTexel;\r
  let lo = select(i - 1u, 0u, a == 0.0);\r
  let hi = select(i, 0u, b == 0.0);\r
  return mix(level(lo, coord, uv), level(hi, coord, uv), t);\r
}\r
`,Ae=5,Za=1,Qa=.75+4*.1875,Ja=1.5,eo=3;class Ar{constructor(e){a(this,"renderer");a(this,"blur");a(this,"blurred",[]);a(this,"material");a(this,"materialHalf");a(this,"downMaterial");a(this,"half");a(this,"texelStep",new k);a(this,"uvScale",new k);a(this,"blurTexel",new k);a(this,"sigmas",new Y);a(this,"targetDrawn",!1);a(this,"blursValid",!1);a(this,"blurAge",0);a(this,"blursStale",!1);a(this,"presentMaterial",null);a(this,"target");a(this,"onChange",null);a(this,"enabled");a(this,"aperture");a(this,"maxRadius");a(this,"halfRes");this.renderer=e;const t="rgb10a2unorm";this.target=new H(e,1,1,{formats:[t],depth:!1,scaleToCanvas:!0,toScreen:!1});for(let n=0;n<Ae;n++)this.blurred.push(new H(e,1,1,{formats:[t],depth:!1,toScreen:!1}));this.half=new H(e,1,1,{formats:[t],depth:!1,toScreen:!1}),this.blur=new dr(e,{format:t});const r=e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"linear",minFilter:"linear"});this.material=this.createMaterial("tiltShift",sn,[le]),this.material.setSampler("blurSampler",r),this.materialHalf=this.createMaterial("tiltShiftHalf",sn,[le]),this.materialHalf.setSampler("blurSampler",r),this.materialHalf.setConstant("HALF_RES",1),this.downMaterial=this.createMaterial("tiltShiftDown",ii),this.downMaterial.setSampler("textureSampler",r),this.downMaterial.setConstant("PASS",0)}createMaterial(e,t,r=[]){const n=new G(this.renderer,e,t,{includes:r});return n.depthWriteEnabled=!1,n.depthCompare="always",n}init(e){const t=e.addGroup("Tilt-shift"),r={callback:()=>{var n;this.blursValid=!1,(n=this.onChange)==null||n.call(this)}};this.enabled=t.addParamBool("enabled",!0,r),this.aperture=t.addParamFloat("aperture",.03,0,.1,r),this.maxRadius=t.addParamFloat("maxRadius",64,0,128,r),this.halfRes=t.addParamBool("halfRes",!1,r)}get active(){return this.enabled.value&&this.aperture.value>0}get holdsTarget(){return this.targetDrawn&&this.target.width===this.renderer.width&&this.target.height===this.renderer.height}getBlur(e){if(!this.active)return{slope:0,max:0};const t=this.getSlope(e,this.target.height),r=Math.min(t,this.maxRadius.value);return r<.25?{slope:0,max:0}:{slope:t,max:r}}getSlope(e,t){const r=Math.max(e.distance,1e-6),n=Math.min(Math.max((e.worldPosition.y-e.pivot.worldPosition.y)/r,.02),1),i=Math.sqrt(1-n*n)/n;return t*this.aperture.value*i/8}invalidate(){this.targetDrawn=!1,this.blursValid=!1,this.blursStale=!1}draw(e,t,r=null,n=!1){const i=this.target;if(t&&(this.targetDrawn=!0),(t?n&&this.blurAge<eo:!this.blursStale)&&this.blursValid){t&&(this.blurAge++,this.blursStale=!0),this.renderer.blit(i,r,this.presentMaterial);return}this.blursValid=!0,this.blurAge=0,this.blursStale=!1;const o=this.getSlope(e,i.height),l=Math.min(o,this.maxRadius.value);if(!this.active||l<.25){const y=this.material;for(let v=0;v<Ae;v++)y.setTexture("blur"+v,i);y.setFloat("slope",0),this.presentMaterial=y,this.renderer.blit(i,r,y);return}const h=this.halfRes.value,u=h?this.materialHalf:this.material;this.presentMaterial=u;let d=i,f=1,m=0,p=1;h&&(d=this.drawHalf(i),f=.5,m=Qa,p=2,this.blurTexel.setValues(.5/d.width,.5/d.height),u.setVector2("blurTexel",this.blurTexel));const x=h?Ja:Za,b=[];for(let y=0;y<Ae;y++){const v=l/Math.pow(2,Ae-1-y);b.push(v<x&&y<Ae-1?0:v)}const g=[];for(let y=0;y<Ae;y++){const v=b[y];if(v===0){g.push(0),u.setTexture("blur"+y,i);continue}const w=y>0?b[y-1]:0,M=y<Ae-1?b[y+1]:1/0,C=this.blurred[y];C.setSize(d.width,d.height),this.blur.radius=Math.sqrt(Math.max(v*v-m,0))*f,this.blur.draw(d,C,Ar.getRows(w/o,M/o,d.height,p));const E=this.blur.drawnRadius/f;g.push(Math.sqrt(E*E+m)),u.setTexture("blur"+y,C)}this.sigmas.setValues(g[0],g[1],g[2],g[3]),u.setVector4("sigmas",this.sigmas),u.setFloat("sigma4",g[4]),u.setFloat("slope",o),this.renderer.blit(i,r,u)}drawHalf(e){const t=this.half;return t.setSize(Math.max(1,Math.floor(e.width/2)),Math.max(1,Math.floor(e.height/2))),this.texelStep.setValues(1/e.width,1/e.height),this.downMaterial.setVector2("texelStep",this.texelStep),this.uvScale.setValues(2*t.width/e.width,2*t.height/e.height),this.downMaterial.setVector2("uvScale",this.uvScale),this.renderer.blit(e,t,this.downMaterial),t}static getRows(e,t,r,n){e=Math.min(e,1),t=Math.min(t,1);const i=Math.max(0,Math.floor(r*(1-t)/2)-n),s=Math.ceil(r*(1-e)/2)+n,o=r-s,l=Math.min(r,r-i);return s>=o?[[i,l]]:[[i,s],[o,l]]}destruct(){this.target.destruct();for(const e of this.blurred)e.destruct();this.half.destruct(),this.blur.destruct(),this.material.destruct(),this.materialHalf.destruct(),this.downMaterial.destruct()}}class Bt{constructor(e,t){a(this,"renderer");a(this,"frame",0);a(this,"phase","load");a(this,"phaseFrames",0);a(this,"idleFrames",0);a(this,"round",0);a(this,"rounds");a(this,"dragFrames");a(this,"dragSpeed");a(this,"sameDirection");a(this,"bucket",Bt.createBucket());a(this,"results",[]);a(this,"startTime",performance.now());a(this,"params");this.renderer=e,this.params=t,this.rounds=parseInt(t.get("bench")||"4")||4,this.dragFrames=parseInt(t.get("dragFrames")||"30"),this.dragSpeed=parseFloat(t.get("dragSpeed")||".01"),this.sameDirection=t.get("dragDir")==="same",et.setEnabled(!0),e.profiler.addFrameCallback((r,n,i)=>{const s=this.bucket;s.samples++,s.gpuMs+=r;const o=new Set;for(let l=0;l<n.length;l++)s.passMs[n[l]]=(s.passMs[n[l]]||0)+i[l],o.has(n[l])||(s.passN[n[l]]=(s.passN[n[l]]||0)+1),o.add(n[l])}),window.__mapWorldBench={status:"load",results:this.results}}applyParams(e){const t=this.params.get("set");if(t)for(const r of t.split(",")){const[n,i]=r.split(":"),s=n.split(".");let o=e;for(const l of s)o=o==null?void 0:o[l];if(!(o!=null&&o.setValue)){console.warn(`[MapWorldBench] no param ${n}`);continue}o.setValue(i==="true"?!0:i==="false"?!1:parseFloat(i))}}static createBucket(){return{frames:0,flags:{},last:{},samples:0,gpuMs:0,passMs:{},passN:{},wanted:[]}}nextTime(){return++this.frame*1e3/60}moveCamera(e){if(this.phase!=="drag")return;const t=e.pivot.worldRight,r=new S(t.x,0,t.z).normalize(),n=this.sameDirection||this.round%2===0?1:-1;e.pivot.translate(r.multiplyScalar(n*this.dragSpeed*e.distance))}afterFrame(e,t,r){const n=this.bucket;n.frames%16===0&&n.wanted.push(Math.round(r*1e4)),n.frames++;for(const[s,o]of Object.entries(e))o&&(n.flags[s]=(n.flags[s]||0)+1,n.last[s]=n.frames);this.phaseFrames++;const i=!e.newJitter&&!e.lightmapUpdating&&!e.renderMap;switch(this.phase){case"load":this.idleFrames=i&&t?this.idleFrames+1:0,(this.idleFrames>=30||this.phaseFrames>6e3)&&this.next("drag");break;case"drag":this.phaseFrames>=this.dragFrames&&this.next("settle");break;case"settle":(i||this.phaseFrames>3e3)&&(this.round++,this.next(this.round<this.rounds?"drag":"done"));break}}next(e){this.results.push({phase:this.phase==="load"?"load":`${this.phase}${this.round-(this.phase==="settle"?1:0)}`,bucket:this.bucket}),this.bucket=Bt.createBucket(),this.phase=e,this.phaseFrames=0,e==="done"&&this.finish()}finish(){const e=this.renderer.canvas,t=this.summarize(),r={canvas:`${e.width}x${e.height}`,seconds:(performance.now()-this.startTime)/1e3,...t};window.__mapWorldBench={status:"done",summary:r,results:this.results},console.log("[MapWorldBench] "+JSON.stringify(r))}summarize(){const e=this.results.filter(o=>o.phase.startsWith("settle")),t=this.results.filter(o=>o.phase.startsWith("drag")),r=e.map(o=>o.bucket.frames),n=o=>{const l=o.reduce((f,m)=>f+m.samples,0)||1,h={},u={};for(const f of o)for(const[m,p]of Object.entries(f.passMs))h[m]=(h[m]||0)+p;for(const f of o)for(const[m,p]of Object.entries(f.passN))u[m]=(u[m]||0)+p;const d=Object.entries(h).map(([f,m])=>[f,+(m/u[f]).toFixed(3)]).sort((f,m)=>m[1]-f[1]);return{gpuMs:+(o.reduce((f,m)=>f+m.gpuMs,0)/l).toFixed(3),passes:Object.fromEntries(d)}},i={};for(const o of e)for(const[l,h]of Object.entries(o.bucket.flags))i[l]=(i[l]||0)+h/e.length;const s={};for(const o of e)for(const l of Object.keys(o.bucket.flags))(s[l]||(s[l]=[])).push(o.bucket.last[l]);return{settleFrames:r,settleGpuMs:e.map(o=>+(o.bucket.gpuMs/Math.max(o.bucket.samples,1)*o.bucket.frames).toFixed(1)),settleFlags:i,settleLast:s,settle:n(e.map(o=>o.bucket)),drag:n(t.map(o=>o.bucket))}}}class to{constructor(e,t){a(this,"frameNumber",0);a(this,"fps",60);a(this,"shotFrame",0);a(this,"stickKeys",[]);a(this,"stick",{x:0,y:0});a(this,"insideFrames",0);a(this,"ready",!1);this.renderer=e,this.host=t,window.__mapWorldVideo=this}nextTime(){return++this.frameNumber*1e3/this.fps}setup(e,t,r,n={}){this.renderer.canvasManager.fixedSize={width:e,height:t},this.fps=r,this.setParams(n),this.host.step()}setParams(e){for(const[t,r]of Object.entries(e)){let n=this.host.example;for(const i of t.split("."))n=n==null?void 0:n[i];if(!(n!=null&&n.setValue))throw new Error(`[MapWorldVideo] no param ${t}`);n.setValue(r)}}async loadShot(e,t=.5,r=3600){e.params&&this.setParams(e.params),await this.host.load(e.lat,e.lng);const n=e.speed??140,i=Math.round(t*this.fps),s=e.heading*Math.PI/180,o=i/this.fps*n*this.host.metersToNorm();this.host.place(-Math.sin(s)*o,-Math.cos(s)*o,e.height,-s,0,e.pitch??-.45),this.stickKeys=[],this.stick={x:0,y:0};let l=0,h=0;for(;h<30&&l<r;)this.host.step(),l++,h=l>30&&this.host.settled()?h+1:0,await this.renderer.device.queue.onSubmittedWorkDone();const u=h>=30;this.host.place(-Math.sin(s)*o,-Math.cos(s)*o,e.height,-s,n,e.pitch??-.45),this.stickKeys=e.stick??[],this.shotFrame=-i;for(let d=0;d<i;d++)this.advance();return this.insideFrames=0,u?l:-1}frame(e="image/png",t){return this.advance(),new Promise((r,n)=>{this.renderer.canvas.toBlob(i=>i?r(i):n(new Error("no image of the canvas")),e,t)})}async framePixels(){this.advance();const e=new VideoFrame(this.renderer.canvas,{timestamp:0}),t={format:"RGBA"},r=new Uint8Array(e.allocationSize(t));return await e.copyTo(r,t),e.close(),r.buffer}async skip(e){for(let t=0;t<e;t++)this.advance(),t%8===7&&await this.renderer.device.queue.onSubmittedWorkDone()}advance(){const e=this.shotFrame++/this.fps,t=this.stickKeys;let r=0,n=0;if(t.length>0&&e>=0){let i=0;for(;i<t.length-1&&t[i+1][0]<=e;)i++;const s=t[i],o=t[Math.min(i+1,t.length-1)],l=o[0]>s[0]?Math.min(Math.max((e-s[0])/(o[0]-s[0]),0),1):0;r=s[1]+(o[1]-s[1])*l,n=s[2]+(o[2]-s[2])*l}this.stick.x=r,this.stick.y=n,this.host.step(),this.host.inside()&&this.insideFrames++}}var fr=(c=>(c[c.VeryHigh=0]="VeryHigh",c[c.High=1]="High",c[c.Medium=2]="Medium",c[c.Low=3]="Low",c[c.VeryLow=4]="VeryLow",c[c.Forward=5]="Forward",c))(fr||{});const ro=["very high","high","medium","low","very low","forward"];var Z=(c=>(c[c.None=0]="None",c[c.ShadowMap=1]="ShadowMap",c[c.LightmapRaytrace=2]="LightmapRaytrace",c[c.Raytrace=3]="Raytrace",c))(Z||{});const no=["none","shadowMap","lightmapRaytrace","raytrace"];var si=(c=>(c[c.PerPixel=0]="PerPixel",c[c.Half=1]="Half",c[c.Quarter=2]="Quarter",c))(si||{});const io=["per pixel","1 per 2 pixels","1 per 4 pixels"],so=[[1,1],[2,1],[2,2]],an={0:{viewDistanceMax:8,forward:!1,skyVisibility:!0,TAAEnabled:!0,tiltShiftEnabled:!0,tiltShiftHalfRes:!0,lightMapSize:6144,texelsPerPixel:1,traceSamplesMax:4096,sampleCount:32,referenceCellSize:1.5,searchCount:16,lightmapResolution:_e.Full,waterReflections:!0,reflectionRays:0,waterRipples:!0,animateWater:!1,pixelRatioMax:-1,carsMSAA:!0,carsPerPixelLighting:!0,shadowMode:2},1:{viewDistanceMax:8,forward:!1,skyVisibility:!0,TAAEnabled:!0,tiltShiftEnabled:!0,tiltShiftHalfRes:!0,lightMapSize:4096,texelsPerPixel:.6,traceSamplesMax:1536,sampleCount:16,referenceCellSize:2,searchCount:8,lightmapResolution:_e.Full,waterReflections:!0,reflectionRays:0,waterRipples:!0,animateWater:!1,pixelRatioMax:-1,carsMSAA:!0,carsPerPixelLighting:!0,shadowMode:2},2:{viewDistanceMax:6,forward:!1,skyVisibility:!0,TAAEnabled:!0,tiltShiftEnabled:!0,tiltShiftHalfRes:!0,lightMapSize:3072,texelsPerPixel:.3,traceSamplesMax:256,sampleCount:8,referenceCellSize:4,searchCount:8,lightmapResolution:_e.Half,waterReflections:!1,reflectionRays:2,waterRipples:!0,animateWater:!1,pixelRatioMax:2,carsMSAA:!1,carsPerPixelLighting:!1,shadowMode:2},3:{viewDistanceMax:4,forward:!1,skyVisibility:!0,TAAEnabled:!0,tiltShiftEnabled:!0,tiltShiftHalfRes:!0,lightMapSize:2048,texelsPerPixel:.15,traceSamplesMax:256,sampleCount:8,referenceCellSize:4,searchCount:8,lightmapResolution:_e.HalfBilinear,waterReflections:!1,reflectionRays:2,waterRipples:!1,animateWater:!1,pixelRatioMax:1,carsMSAA:!1,carsPerPixelLighting:!1,shadowMode:1},4:{viewDistanceMax:4,forward:!1,skyVisibility:!1,TAAEnabled:!1,tiltShiftEnabled:!0,tiltShiftHalfRes:!0,lightMapSize:1024,texelsPerPixel:.1,traceSamplesMax:256,sampleCount:8,referenceCellSize:4,searchCount:8,lightmapResolution:_e.HalfBilinear,waterReflections:!1,reflectionRays:2,waterRipples:!1,animateWater:!1,pixelRatioMax:1,carsMSAA:!1,carsPerPixelLighting:!1,shadowMode:1},5:{viewDistanceMax:4,forward:!0,skyVisibility:!1,TAAEnabled:!1,tiltShiftEnabled:!1,tiltShiftHalfRes:!1,lightMapSize:1024,texelsPerPixel:.1,traceSamplesMax:256,sampleCount:8,referenceCellSize:4,searchCount:8,lightmapResolution:_e.HalfBilinear,waterReflections:!1,reflectionRays:2,waterRipples:!1,animateWater:!1,pixelRatioMax:1,carsMSAA:!1,carsPerPixelLighting:!1,shadowMode:1}};var ue=(c=>(c[c.Full=0]="Full",c[c.Overdraw=1]="Overdraw",c[c.BoundingBoxes=2]="BoundingBoxes",c[c.SkyLight=3]="SkyLight",c[c.VirtualLightmap=4]="VirtualLightmap",c[c.LightmapTiles=5]="LightmapTiles",c[c.LightmapLevels=6]="LightmapLevels",c[c.LightmapConverging=7]="LightmapConverging",c[c.ShadowMap=8]="ShadowMap",c[c.Shadows=9]="Shadows",c[c.ShadowMapCascades=10]="ShadowMapCascades",c[c.WallAtlas=11]="WallAtlas",c))(ue||{});const ao={full:0,overdraw:1,"bounding boxes":2,"sky light":3,"virtual lightmap":4,"lightmap tiles":5,"lightmap levels":6,"lightmap converging":7,shadows:9,"wall atlas":11},on={9:1,10:2},ln={3:Le.Light,4:Le.Lightmap,5:Le.Tiles,6:Le.Levels,7:Le.Converging};var ai=(c=>(c[c.Sunrise=0]="Sunrise",c[c.Morning=1]="Morning",c[c.Noon=2]="Noon",c[c.Afternoon=3]="Afternoon",c[c.Sunset=4]="Sunset",c))(ai||{});const Ct=["sunrise","morning","noon","afternoon","sunset"],hn={0:{sunElevation:.12,sunSide:-1,skyColor:"#4f5663",sunColor:"#ff9466",backgroundColor:"#c9b8b0"},1:{sunElevation:.55,sunSide:-1,skyColor:"#657995",sunColor:"#d8b794",backgroundColor:"#bcd4ec"},2:{sunElevation:1,sunSide:0,skyColor:"#b2c1d2",sunColor:"#60503d",backgroundColor:"#a9bbcc"},3:{sunElevation:.3,sunSide:1,skyColor:"#596b80",sunColor:"#dfba9f",backgroundColor:"#b8dbff"},4:{sunElevation:.1,sunSide:1,skyColor:"#697398",sunColor:"#ff7e33",backgroundColor:"#d4a088"}},oo={0:1,1:1,2:1,3:1,4:2};function Qt(){const c=Ct.map((t,r)=>oo[r]);let e=Math.random()*c.reduce((t,r)=>t+r,0);for(let t=0;t<c.length;t++)if(e-=c[t],e<0)return t;return c.length-1}const cn=23.44*Math.PI/180;function lo(c,e){const t=e*Math.PI/180,r=e<0?-cn:cn,n=Math.sin(t),i=Math.cos(t),s=Math.sin(r),o=Math.cos(r);let l=0;if(c.sunSide!==0){const m=(Math.sin(c.sunElevation)-n*s)/(i*o);l=c.sunSide*Math.acos(Math.min(1,Math.max(-1,m)))}const h=Math.cos(l),u=-o*Math.sin(l),d=i*s-n*o*h,f=n*s+i*o*h;return{angleX:Math.asin(Math.min(1,Math.max(-1,f))),angleY:Math.atan2(u,-d)}}const un=`// Unified map vertex: xyz position + \`.w\` building id (unused here).\r
struct VertexInput {\r
#ifdef QUANTIZED\r
  // the building meshes of mapWorld, see shading.wgsl\r
  @location(0) position : vec4<f32> /* unorm16 */,\r
#else\r
  @location(0) position : vec4<f32>,\r
#endif\r
};\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) world : vec3<f32>,\r
};\r
\r
struct Uniforms {\r
  viewProjection : mat4x4<f32>,\r
  // QUANTIZED: the decoding of the vertices\r
  positionScale : vec4<f32>,\r
  positionOffset : vec4<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
#ifdef QUANTIZED\r
  let world = input.position.xyz * uniforms.positionScale.xyz + uniforms.positionOffset.xyz;\r
#else\r
  let world = input.position.xyz;\r
#endif\r
\r
  output.position = uniforms.viewProjection * vec4<f32>(world, 1.0);\r
  output.world = world;\r
  return output;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  return vec4<f32>(.1);\r
}\r
`,ut=`override DRAW_DEPTH: bool = false;\r
\r
// Unified map vertex: xyz position + \`.w\` tile-local building id (or a negative\r
// sentinel for geometry with no id). One stride-4 layout shared by terrain,\r
// ground and buildings so they all draw through one pipeline.\r
struct VertexInput {\r
#ifdef QUANTIZED\r
  // the building meshes of mapWorld: unorm16, position * positionScale + positionOffset (see quantizeVertices in\r
  // mapWorld/map/worldGeometryCore.ts)\r
  @location(0) position : vec4<f32> /* unorm16 */,\r
#else\r
  @location(0) position : vec4<f32>,\r
#endif\r
};\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) world : vec3<f32>,\r
#ifdef FEATURE_IDS\r
  @location(1) @interpolate(flat) globalId : u32,\r
#endif\r
#ifdef TREE_COLORS\r
  // the palette index of a tree vertex, 0xFFFFFFFF for baseColor\r
  @location(2) @interpolate(flat) treeMaterial : u32,\r
#endif\r
#ifdef TERRAIN_NORMALS\r
  // mapWorld's ground: the smooth normal in .w, see mapWorld/map/terrainNormal.wgsl (included with the define)\r
  @location(3) normal : vec3<f32>,\r
#endif\r
};\r
\r
struct Uniforms {\r
  viewProjection : mat4x4<f32>,\r
  lightDirection : vec3<f32>,\r
  baseColor : vec3<f32>,\r
  cameraPosition : vec3<f32>,\r
  skyColor : vec3<f32>,\r
  sunColor : vec3<f32>,\r
  ambient : f32,\r
  distanceFog : f32,\r
  // where the fog is 1 (mapWorld), 0 only the exp, see getFog\r
  viewDistanceMax : f32,\r
  shadowStrength : f32,\r
  VSMBleedThreshold : f32,\r
  varianceMin : f32,\r
  shadowDebug : u32,\r
  contrast : f32,\r
  drawIndex : u32,\r
  selectedID : i32,\r
  tileID : u32,\r
  backgroundColor : vec3<f32>,\r
  // TREE_COLORS: the palette index of the first tree color, see mapWorld/map/worldTrees.ts\r
  treeMaterial : u32,\r
  // QUANTIZED: the decoding of the vertices\r
  positionScale : vec4<f32>,\r
  positionOffset : vec4<f32>,\r
  // SNOW: the snow on the ground of mapWorld, see mapWorld/snow.wgsl (included with the define) and setSnow of its\r
  // DeferredShading\r
  snowLine : f32,\r
  snowNoise : f32,\r
  snowMetersPerUnit : f32,\r
  snowColor : vec3<f32>,\r
};\r
\r
struct ShadowMapData {\r
  shadowMapViewProjection : mat4x4<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var shadowMapSampler : sampler;\r
// the 4 cascades, one layer each (ShadowMap.cascadeTexture)\r
@group(0) @binding(2) var shadowMaps : texture_2d_array<f32>;\r
@group(0) @binding(6) var<storage, read> shadowMapData : array<ShadowMapData>;\r
#ifdef TREE_COLORS\r
// the albedos of the gBuffer of mapWorld (MapGBuffer.paletteBuffer): a vertex with a .w of -2 - k (a tree, see\r
// mapWorld/map/worldTrees.ts) has the one at treeMaterial + k\r
@group(0) @binding(7) var<storage, read> materialPalette : array<vec4<f32>>;\r
#endif\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
#ifdef QUANTIZED\r
  let vertex = input.position * uniforms.positionScale + uniforms.positionOffset;\r
  let featureId = round(vertex.w);\r
#else\r
  let vertex = input.position;\r
  let featureId = input.position.w;\r
#endif\r
  let world = vertex.xyz;\r
\r
  output.position = uniforms.viewProjection * vec4<f32>(world, 1.0);\r
#ifdef DEPTH_CLAMP\r
  // the sun's orthographic views (SunShadows, TerrainSunMap): a caster in front of the near plane is put on it instead of\r
  // clipped ("pancaking"), so a hill far toward a low sun still shadows. What they store is the world height, which this\r
  // doesn't change\r
  output.position.z = max(output.position.z, 0.0);\r
#endif\r
  output.world = world;\r
#ifdef TERRAIN_NORMALS\r
  output.normal = decodeTerrainNormal(vertex.w);\r
#endif\r
#ifdef FEATURE_IDS\r
  // \`.w\` is the tile-local feature id, or negative (NO_FEATURE_ID) for untagged\r
  // geometry. Map "no id" to 0xFFFFFFFF so the index map writes 0 (empty) and it\r
  // can never be picked; otherwise pack (tileID, featureId) into the global id.\r
  if (featureId < 0.0) {\r
    output.globalId = 0xFFFFFFFFu;\r
  } else {\r
    output.globalId = uniforms.tileID * 65536u + u32(featureId + 0.5);\r
  }\r
#endif\r
#ifdef TREE_COLORS\r
  output.treeMaterial = 0xFFFFFFFFu;\r
  if (featureId < -1.5) {\r
    output.treeMaterial = uniforms.treeMaterial + u32(-2.0 - featureId + 0.5);\r
  }\r
#endif\r
  return output;\r
}\r
\r
// --- Variance shadow map sampling ------------------------------------------\r
\r
fn shadowUVDepthStrength(p : vec3<f32>, i : u32) -> vec4<f32> {\r
	let screen = shadowMapData[i].shadowMapViewProjection * vec4<f32>(p, 1.0);\r
	let uv = screen.xy / screen.w;\r
	// Compare in world height (-y), not view-space depth. The cascade matrix is\r
	// only used for the UV lookup; the occluder selection (nearest to the sun) is\r
	// done by the depth test when rendering the shadow map. Height is a correct\r
	// occlusion order along a sun ray and keeps the moments at a small, well-\r
	// conditioned scale (NDC depth squashed everything near 0.5 / 1.0, which broke\r
	// the VSM variance on part of the view -> the hard lit/shadow seam).\r
	let depth = -p.y * 1.;\r
	// Fade out over the outer 60% of the cascade, so the transition to the next one is gradual instead of a seam where\r
	// the shadows change thickness. The next one is twice as large: this is its inner 30%, where it has its full weight.\r
	let s2 = vec2<f32>(1.) - smoothstep(vec2<f32>(0.4), vec2<f32>(1.0), abs(uv));\r
	return vec4<f32>(uv, depth, min(s2.x, s2.y));\r
}\r
\r
fn sampleShadowMoments(i : u32, uv : vec2<f32>) -> vec2<f32> {\r
	return textureSampleLevel(shadowMaps, shadowMapSampler, uv, i, 0.0).xy;\r
}\r
\r
fn shadowCascade(uv : vec2<f32>, i : u32, dist : f32) -> f32 {\r
	var shadowMapUV = uv * 0.5 + 0.5;\r
	shadowMapUV.y = 1.0 - shadowMapUV.y;\r
	let moments = sampleShadowMoments(i, shadowMapUV);\r
	let lit = step(dist, moments.x);\r
	var variance = moments.y - moments.x * moments.x;\r
	variance = max(variance, uniforms.varianceMin * uniforms.varianceMin);\r
	let d = dist - moments.x;\r
	let s = variance / (variance + d * d);\r
	// The smoothstep clamps the upper variance tail, removing most VSM light\r
	// bleeding on the blurred depth.\r
	return smoothstep(uniforms.VSMBleedThreshold, 1.0, max(lit, s));\r
}\r
\r
// how many texels of a cascade a point goes off its surface along its normal before the lookup: the ground at a low sun\r
// spans many texels along the sun (tens of meters each in the far cascades), its own heights in them would shadow it\r
const SHADOW_NORMAL_OFFSET = 1.5;\r
\r
// the size of a texel of cascade i in world units: its half-extent is 1 over the length of the first row of its matrix\r
fn shadowTexelSize(i : u32) -> f32 {\r
	let m = shadowMapData[i].shadowMapViewProjection;\r
	return 2.0 / (f32(textureDimensions(shadowMaps).x) * length(vec3<f32>(m[0].x, m[1].x, m[2].x)));\r
}\r
\r
// The cascades front to back, each taking its weight (1 inside, fading out over its edge) of what the ones before it\r
// left. Each cascade is re-rendered around a center of its own, so the next one need not cover the edge of the one\r
// before it: that point goes on to the first one that does. What no cascade covers is lit, so past the last cascade the\r
// shadows fade out instead of ending at a hard edge.\r
fn getShadowMap(p : vec3<f32>, n : vec3<f32>) -> f32 {\r
	var shadow = 0.0;\r
	var remaining = 1.0;\r
	for (var i = 0u; i < 4u; i++) {\r
		let u = shadowUVDepthStrength(p + n * (SHADOW_NORMAL_OFFSET * shadowTexelSize(i)), i);\r
		if (u.w > 0.0) {\r
			shadow += remaining * u.w * shadowCascade(u.xy, i, u.z);\r
			remaining *= 1.0 - u.w;\r
			if (remaining <= 0.0) {\r
				break;\r
			}\r
		}\r
	}\r
	return shadow + remaining;\r
}\r
\r
// Debug: tint each cascade's coverage region a distinct colour so it's obvious\r
// which part of the view each cascade covers (and where coverage runs out).\r
fn cascadeDebugColor(p : vec3<f32>) -> vec3<f32> {\r
	for (var i = 0u; i < 4u; i++) {\r
		let u = shadowUVDepthStrength(p, i);\r
		if (u.w > 0.0) {\r
			var col = vec3<f32>(0.4);\r
			if (i == 0u) { col = vec3<f32>(1.0, 0.3, 0.3); }\r
			else if (i == 1u) { col = vec3<f32>(0.3, 1.0, 0.3); }\r
			else if (i == 2u) { col = vec3<f32>(0.3, 0.5, 1.0); }\r
			else { col = vec3<f32>(1.0, 1.0, 0.3); }\r
			return col * (0.4 + 0.6 * u.w);\r
		}\r
	}\r
	return vec3<f32>(0.25);\r
}\r
\r
// The distance fog: exponential (distanceFog per world unit), with a smoothstep from .7 of viewDistanceMax that takes\r
// it to 1 at viewDistanceMax, where the loaded map ends (see MapWorld.viewDistanceMax). 0 (not set): only the exp.\r
// d is the horizontal (xz) distance to the camera, not the 3d one: the map is loaded in a radius around the camera in\r
// xz, and a camera that goes up and looks down gets no more fog (the far plane reaches past it, see\r
// MapWorld.applyViewDistanceMax).\r
// The same in deferredShading.wgsl, cars.wgsl, reprojectedSSAOComposite.wgsl and osm/shading.wgsl.\r
fn getFog(d : f32) -> f32 {\r
	let end = select(1., 1. - smoothstep(.7 * uniforms.viewDistanceMax, uniforms.viewDistanceMax, d), uniforms.viewDistanceMax > 0.);\r
	return 1. - exp(-d * uniforms.distanceFog) * end;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
#ifdef FEATURE_IDS\r
  if (uniforms.drawIndex != 0u) {\r
    let v = input.globalId + 1u;\r
    return vec4<f32>(\r
      f32(v & 0xFFu) / 255.0,\r
      f32((v >> 8u) & 0xFFu) / 255.0,\r
      f32((v >> 16u) & 0xFFu) / 255.0,\r
      f32((v >> 24u) & 0xFFu) / 255.0,\r
    );\r
  }\r
#endif\r
 var n = normalize(cross(dpdy(input.world), dpdx(input.world)));\r
#ifdef TERRAIN_NORMALS\r
  n = normalize(input.normal);\r
#endif\r
\r
  if (DRAW_DEPTH) {\r
#ifdef SUN_DEPTH\r
    // TerrainSunMap: how far toward the sun (lightDirection) the surface is. Unlike the height it doesn't change across\r
    // the sun: a point compared with the texels next to its own isn't a texel higher or lower than them, which at a low\r
    // sun is many texels along it (the stripes of a slope shadowing itself)\r
    let d = dot(input.world, uniforms.lightDirection);\r
#else\r
    let d = -input.world.y * 1.;\r
#endif\r
    return vec4<f32>(d, d * d, 0.0, 1.0);\r
  }\r
\r
  if (uniforms.shadowDebug > 0u) {\r
    return vec4<f32>(cascadeDebugColor(input.world), 1.0);\r
  }\r
\r
	let l = uniforms.lightDirection.xyz;\r
	let nDotL = max(dot(n, l), 0.0);\r
\r
	let skyColor = uniforms.skyColor * uniforms.skyColor;\r
	var sunColor = uniforms.sunColor * uniforms.sunColor;\r
\r
	var baseColor = uniforms.baseColor;\r
#ifdef TREE_COLORS\r
	if (input.treeMaterial != 0xFFFFFFFFu) {\r
		baseColor = materialPalette[input.treeMaterial].rgb;\r
	}\r
#endif\r
#ifdef SNOW\r
	// The hard edge of the snow, antialiased over the change of its field to the next pixels: the field at the point and\r
	// normal one pixel over, from their derivatives. Those are taken here, in uniform control flow, so the field is only\r
	// evaluated where the snow can reach (isSnowPossible), which fwidth of the field couldn't be in, and at the neighbours\r
	// only near the edge (getSnowCoverAt)\r
	let dWorldX = dpdx(input.world);\r
	let dWorldY = dpdy(input.world);\r
	let dNormalX = dpdx(n);\r
	let dNormalY = dpdy(n);\r
	if (isSnowPossible(input.world.y, uniforms.snowLine, uniforms.snowNoise, uniforms.snowMetersPerUnit)) {\r
		let cover = getSnowCoverAt(input.world, n, dWorldX, dNormalX, dWorldY, dNormalY, uniforms.snowLine, uniforms.snowNoise,\r
			uniforms.snowMetersPerUnit);\r
		baseColor = mix(baseColor, uniforms.snowColor, cover);\r
	}\r
#endif\r
	let albedo = baseColor * baseColor;\r
\r
	let shadow = mix(1.0, getShadowMap(input.world, n), uniforms.shadowStrength);\r
\r
//	var c = albedo * mix(nDotL * shadow, 1., uniforms.ambient) * (vec3(1.) - skyColor);\r
	var c = albedo * sunColor * (nDotL * shadow);\r
#ifdef SKY_ALBEDO\r
	// with the albedo, like the deferred shading of mapWorld: without it a light sky washes out the sun, the shadows\r
	// and the colors of the layers\r
	c += albedo * (n.y * .5 + .5) * skyColor;\r
#else\r
	c += (n.y * .5 + .5) * skyColor;\r
#endif\r
\r
	c = sqrt(c);\r
	//contrast\r
//	c = mix(c, smoothstep(vec3(0.), vec3(1.), c), uniforms.contrast);\r
\r
	c = mix(c,uniforms.backgroundColor, getFog(distance(input.world.xz, uniforms.cameraPosition.xz)));\r
\r
 	var h = hash23ff(input.position.xy);\r
    c += (h.y + h.z - 1.) / 255.;\r
    c = clamp(c, vec3(0.), vec3(1.));\r
#ifdef FEATURE_IDS\r
  if (uniforms.selectedID >= 0 && input.globalId == u32(uniforms.selectedID)) {\r
    c = mix(c, vec3<f32>(0.9, 0.1, 0.1), 0.6);\r
  }\r
#endif\r
\r
	return vec4<f32>(c, 1.0);\r
}\r
`;(function(){var c="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:q;iekr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq;d8Yqdbk:yzeHu8Jjjjjbcj;eb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Radz1jjjbhwcj;abad9UhlaicefhodnadTmbalc;WFbGglcjdalcjd6EhDcbhqinaqae9pmeaDaeaq9RaqaDfae6Egkcsfglcl4cifcd4hxdndndndnalc9WGgmTmbcbhPcehsawcjdfhzaohHinaraH9Rax6midnaraHaxfgo9RcK6mbczhlcbhOinalgic9WfgAawcj;cbffhldndndndndnaHaAco4fRbbaOcoG4ciGPlbedibkal9cb83ibalcwf9cb83ibxikalaoRblaoRbbgAco4gCaCciSgCE86bbawcj;cbfaifglcGfaoclfaCfgCRbbaAcl4ciGgXaXciSgXE86bbalcVfaCaXfgCRbbaAcd4ciGgXaXciSgXE86bbalc7faCaXfgCRbbaAciGgAaAciSgAE86bbalctfaCaAfgCRbbaoRbegAco4gXaXciSgXE86bbalc91faCaXfgCRbbaAcl4ciGgXaXciSgXE86bbalc4faCaXfgCRbbaAcd4ciGgXaXciSgXE86bbalc93faCaXfgCRbbaAciGgAaAciSgAE86bbalc94faCaAfgCRbbaoRbdgAco4gXaXciSgXE86bbalc95faCaXfgCRbbaAcl4ciGgXaXciSgXE86bbalc96faCaXfgCRbbaAcd4ciGgXaXciSgXE86bbalc97faCaXfgCRbbaAciGgAaAciSgAE86bbalc98faCaAfgARbbaoRbigoco4gCaCciSgCE86bbalc99faAaCfgARbbaocl4ciGgCaCciSgCE86bbalc9:faAaCfgARbbaocd4ciGgCaCciSgCE86bbalcufaAaCfglRbbaociGgoaociSgoE86bbalaofhoxdkalaoRbwaoRbbgAcl4gCaCcsSgCE86bbawcj;cbfaifglcGfaocwfaCfgCRbbaAcsGgAaAcsSgAE86bbalcVfaCaAfgARbbaoRbegCcl4gXaXcsSgXE86bbalc7faAaXfgARbbaCcsGgCaCcsSgCE86bbalctfaAaCfgARbbaoRbdgCcl4gXaXcsSgXE86bbalc91faAaXfgARbbaCcsGgCaCcsSgCE86bbalc4faAaCfgARbbaoRbigCcl4gXaXcsSgXE86bbalc93faAaXfgARbbaCcsGgCaCcsSgCE86bbalc94faAaCfgARbbaoRblgCcl4gXaXcsSgXE86bbalc95faAaXfgARbbaCcsGgCaCcsSgCE86bbalc96faAaCfgARbbaoRbvgCcl4gXaXcsSgXE86bbalc97faAaXfgARbbaCcsGgCaCcsSgCE86bbalc98faAaCfgARbbaoRbogCcl4gXaXcsSgXE86bbalc99faAaXfgARbbaCcsGgCaCcsSgCE86bbalc9:faAaCfgARbbaoRbrgocl4gCaCcsSgCE86bbalcufaAaCfglRbbaocsGgoaocsSgoE86bbalaofhoxekalao8Pbb83bbalcwfaocwf8Pbb83bbaoczfhokdnaiam9pmbaOcdfhOaiczfhlarao9RcL0mekkaiam6miaoTmidnakTmbawaPfRbbhOawcj;cbfhlazhiakhAinaialRbbgHce4cbaHceG9R7aOfgO86bbaiadfhialcefhlaAcufgAmbkkazcefhzaPcefgPad6hsaohHaPad9hmexvkkcbhoasceGmdxikaoaxad2fhXdnakTmbcbhmcehsawcjdfhCinarao9Rax6miaoTmdaoaxfhoawamfRbbhOawcj;cbfhlaChiakhAinaialRbbgHce4cbaHceG9R7aOfgO86bbaiadfhialcefhlaAcufgAmbkaCcefhCamcefgmad6hsamad9hmbkaXhoxikcbhlcehsinarao9Rax6mdaoTmeaoaxfhoalcefglad6hsadal9hmbkaXhoxdkcbhoasceGTmekc9:hoxikabaqad2fawcjdfakad2z1jjjb8Aawawcjdfakcufad2fadz1jjjb8Aakaqfhqaombkc9:hoxekcbc99arao9Radcaadca0ESEhokavcj;ebf8Kjjjjbaok;xzeHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhodnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhlindnaoaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfalaDcu7gPcl4fcsGcitfgsydlhzasydbhHdnaDcsGgDak9pmbavaiaPfcsGcdtfydbaxaDEhsaDThDdndnadcd9hmbabarcetfgPaH87ebaPcdfaz87ebaPclfas87ebxekabarcdtfgPaHBdbaPclfazBdbaPcwfasBdbkaxaDfhxavc;abfalcitfgPasBdbaPazBdlavaicdtfasBdbavc;abfalcefcsGglcitfgPaHBdbaPasBdlaiaDfhialcefhlxdkdndnaDcsSmbamaDfaDc987fcefhmxekaocefhDao8SbbgscFeGhPdndnascu9mmbaDhoxekaocvfhoaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhokaPce4cbaPceG9R7amfhmkdndnadcd9hmbabarcetfgDaH87ebaDcdfaz87ebaDclfam87ebxekabarcdtfgDaHBdbaDclfazBdbaDcwfamBdbkavc;abfalcitfgDamBdbaDazBdlavaicdtfamBdbavc;abfalcefcsGglcitfgDaHBdbaDamBdlaicefhialcefhlxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHcdfaD87ebaHclfas87ebxekabarcdtfgHaxBdbaHclfaDBdbaHcwfasBdbkavaicdtfaxBdbavc;abfalcitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfalcefcsGcitfgHasBdbaHaDBdlavaiaPfcsGgicdtfasBdbavc;abfalcdfcsGglcitfgDaxBdbaDasBdlalcefhlaiaOfhiazaOfhxxekaxcbaoRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbaocefhDxekaocdfhDao8SbegPcFeGhsdnaPcu9kmbaocofhAascFbGhscrhodninaD8SbbgPcFbGaotasVhsaPcu9kmeaDcefhDaocrfgoc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbgocFeGhPdnaocu9kmbaDcvfhzaPcFbGhPcrhodninas8SbbgDcFbGaotaPVhPaDcu9kmeascefhsaocrfgoc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashoxekascefhoas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninao8SbbgscFbGaDtaPVhPascu9kmeaocefhoaDcrfgDc8J9hmbkaOhoxekaocefhokaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDcdfaz87ebaDclfaO87ebxekabarcdtfgDaABdbaDclfazBdbaDcwfaOBdbkavc;abfalcitfgDazBdbaDaABdlavaicdtfaABdbavc;abfalcefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfalcdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhialcifhlkawcefhwalcsGhlaicsGhiarcifgrae6mbkkcbc99aoaqSEhokavc;aef8Kjjjjbaok:flevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;siliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:Ohkxekcjjjj94hkkabaiavcdfciGfcetfak87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:Ohqxekcjjjj94hqkabaiavcufciGfcetfaq87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohqxekcjjjj94hqkabaiavciGfcetfaq87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkkkebcjwklz9Kbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q;Aekr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;b9tqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk;e8JlHud97euo978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnadcefal0mbcuhoaiRbbc:Ge9hmbavaialfgrad9Rad;8qbbcj;abad9UhoaicefhldnadTmbaoc;WFbGgocjdaocjd6EhwcbhDinaDae9pmeawaeaD9RaDawfae6Egqcsfgoc9WGgkci2hxakcethmaocl4cifcd4hPabaDad2fhscbhzdnincbhHalhOcbhAdninaraO9RaP6miavcj;cbfaAak2fhCaOaPfhlcbhidnakc;ab6mbaral9Rc;Gb6mbcbhoinaCaofhidndndndndnaOaoco4fRbbgXciGPlbedibkaipxbbbbbbbbbbbbbbbbpklbxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaialpbbbpklbalczfhlkdndndndndnaXcd4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklzxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklzalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaialpbbbpklzalczfhlkdndndndndnaXcl4ciGPlbedibkaipxbbbbbbbbbbbbbbbbpklaxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklaalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaialpbbbpklaalczfhlkdndndndndnaXco4Plbedibkaipxbbbbbbbbbbbbbbbbpkl8WxikaialpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WalclfaYpQbfaXc:q:yjjbfRbbfhlxdkaialpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibaXc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgXcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spkl8WalcwfaYpQbfaXc:q:yjjbfRbbfhlxekaialpbbbpkl8Walczfhlkaoc;abfhiaocjefak0meaihoaral9Rc;Fb0mbkkdndnaiak9pmbaici4hoinaral9RcK6mdaCaifhXdndndndndnaOaico4fRbbaocoG4ciGPlbedibkaXpxbbbbbbbbbbbbbbbbpklbxikaXalpbblalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLgQcdp:meaQpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9ogLpxiiiiiiiiiiiiiiiip8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalclfaYpQbfaKc:q:yjjbfRbbfhlxdkaXalpbbwalpbbbgQclp:meaQpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9ogLpxssssssssssssssssp8JgQp5b9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibaKc:q:yjjbfpbbbgYaYpmbbbbbbbbbbbbbbbbaQp5e9cjF;8;4;W;G;ab9:9cU1:NgKcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPaLaQp9spklbalcwfaYpQbfaKc:q:yjjbfRbbfhlxekaXalpbbbpklbalczfhlkaocdfhoaiczfgiak6mbkkalTmbaAcd0hHalhOaAcefgAclSmdxekkcbhlaHceGTmdkdnakTmbavcjdfazfhiavazfpbdbhYcbhXinaiavcj;cbfaXfgopblbgLcep9TaLpxeeeeeeeeeeeeeeeegQp9op9Hp9rgLaoakfpblbg8Acep9Ta8AaQp9op9Hp9rg8ApmbzeHdOiAlCvXoQrLgEaoamfpblbg3cep9Ta3aQp9op9Hp9rg3aoaxfpblbg5cep9Ta5aQp9op9Hp9rg5pmbzeHdOiAlCvXoQrLg8EpmbezHdiOAlvCXorQLgQaQpmbedibedibedibediaYp9UgYp9AdbbaiadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfgoaYaEa8EpmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaoadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfgoaYaLa8ApmwKDYq8AkEx3m5P8Es8FgLa3a5pmwKDYq8AkEx3m5P8Es8Fg8ApmbezHdiOAlvCXorQLgQaQpmbedibedibedibedip9UgYp9AdbbaoadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfgoaYaLa8ApmwDKYqk8AExm35Ps8E8FgQaQpmbedibedibedibedip9UgYp9AdbbaoadfgoaYaQaQpmlvorlvorlvorlvorp9UgYp9AdbbaoadfgoaYaQaQpmwDqkwDqkwDqkwDqkp9UgYp9AdbbaoadfgoaYaQaQpmxmPsxmPsxmPsxmPsp9UgYp9AdbbaoadfhiaXczfgXak6mbkkazclfgzad6mbkasavcjdfaqad2;8qbbavavcjdfaqcufad2fad;8qbbaqaDfhDc9:hoalmexikkc9:hoxekcbc99aral9Radcaadca0ESEhokavcj;kbf8Kjjjjbaokwbz:bjjjbk;tzeHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhodnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhlindnaoaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfalaDcu7gPcl4fcsGcitfgsydlhzasydbhHdnaDcsGgDak9pmbavaiaPfcsGcdtfydbaxaDEhsaDThDdndnadcd9hmbabarcetfgPaH87ebaPcdfaz87ebaPclfas87ebxekabarcdtfgPaHBdbaPclfazBdbaPcwfasBdbkaxaDfhxavc;abfalcitfgPasBdbaPazBdlavaicdtfasBdbavc;abfalcefcsGglcitfgPaHBdbaPasBdlaiaDfhialcefhlxdkdndnaDcsSmbamaDfaDc987fcefhmxekaocefhDao8SbbgscFeGhPdndnascu9mmbaDhoxekaocvfhoaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhokaPce4cbaPceG9R7amfhmkdndnadcd9hmbabarcetfgDaH87ebaDcdfaz87ebaDclfam87ebxekabarcdtfgDaHBdbaDclfazBdbaDcwfamBdbkavc;abfalcitfgDamBdbaDazBdlavaicdtfamBdbavc;abfalcefcsGglcitfgDaHBdbaDamBdlaicefhialcefhlxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHcdfaD87ebaHclfas87ebxekabarcdtfgHaxBdbaHclfaDBdbaHcwfasBdbkavaicdtfaxBdbavc;abfalcitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfalcefcsGcitfgHasBdbaHaDBdlavaiaPfcsGgicdtfasBdbavc;abfalcdfcsGglcitfgDaxBdbaDasBdlalcefhlaiaOfhiazaOfhxxekaxcbaoRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbaocefhDxekaocdfhDao8SbegPcFeGhsdnaPcu9kmbaocofhAascFbGhscrhodninaD8SbbgPcFbGaotasVhsaPcu9kmeaDcefhDaocrfgoc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbgocFeGhPdnaocu9kmbaDcvfhzaPcFbGhPcrhodninas8SbbgDcFbGaotaPVhPaDcu9kmeascefhsaocrfgoc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashoxekascefhoas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninao8SbbgscFbGaDtaPVhPascu9kmeaocefhoaDcrfgDc8J9hmbkaOhoxekaocefhokaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDcdfaz87ebaDclfaO87ebxekabarcdtfgDaABdbaDclfazBdbaDcwfaOBdbkavc;abfalcitfgDazBdbaDaABdlavaicdtfaABdbavc;abfalcefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfalcdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhialcifhlkawcefhwalcsGhlaicsGhiarcifgrae6mbkkcbc99aoaqSEhokavc;aef8Kjjjjbaok:flevu8Jjjjjbcz9Rhvc9:hodnaecvfal0mbcuhoaiRbbc;:eGc;qe9hmbav9cb83iwaicefhraialfc98fhwdnaeTmbdnadcdSmbcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcdtfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfglBdbaoalBdbaDcefgDae9hmbxdkkcbhDindnaraw6mbc9:skarcefhoar8SbbglcFeGhidndnalcu9mmbaohrxekarcvfhraicFbGhicrhldninao8SbbgdcFbGaltaiVhiadcu9kmeaocefhoalcrfglc8J9hmbxdkkaocefhrkabaDcetfaic8Etc8F91aicd47avcwfaiceGcdtVgoydbfgl87ebaoalBdbaDcefgDae9hmbkkcbc99arawSEhokaok:wPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalae9pmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eaDaopmbediwDqkzHOAKY8AEgoczp:Sep;6egrp;Geaoczp:Reczp:Sep;6egwp;Gep;Kep;Legopxb;:FSb;:FSb;:FSb;:FSawaopxbbbbbbbbbbbbbbbbp:2egqawpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegwawp;Meaoaop;Mearaqaramp9op9rp;Kegoaop;Mep;Kep;Kep;Jep;Negrp;Mepxbbn0bbn0bbn0bbn0gqp;Keczp:Reawarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9op9qgwaoarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogopmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oawaopmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalae9pmbaiaeciGgvcitgdfcbcaad9R;8kbaiabalcitfglad;8qbbdnavTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eaDaopmbediwDqkzHOAKY8AEgoczp:Sep;6egrp;Geaoczp:Reczp:Sep;6egwp;Gep;Kep;Legopxb;:FSb;:FSb;:FSb;:FSawaopxbbbbbbbbbbbbbbbbp:2egqawpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegwawp;Meaoaop;Mearaqaramp9op9rp;Kegoaop;Mep;Kep;Kep;Jep;Negrp;Mepxbbn0bbn0bbn0bbn0gqp;Keczp:Reawarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9op9qgwaoarp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogopmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oawaopmbezHdiOAlvCXorQLp9qpklbkalaiad;8qbbkk;4wllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaqakp;Mearp;Keczp:ReaDakp;Mearp;Keamp9op9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalae9pmbaiaeciGgvcitgofcbcaao9R;8kbaiabalcitfgwao;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaqakp;Mearp;Keczp:ReaDakp;Mearp;Keamp9op9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkawaiao;8qbbkk:Pddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnaval9pmbaialciGgecdtgdVcbc;abad9R;8kbaiabavcdtfgvad;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkavaiad;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz9Tbb",t=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),r=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var n=WebAssembly.validate(t)?e:c,i,s=WebAssembly.instantiate(o(n),{}).then(function(g){i=g.instance,i.exports.__wasm_call_ctors()});function o(g){for(var y=new Uint8Array(g.length),v=0;v<g.length;++v){var w=g.charCodeAt(v);y[v]=w>96?w-97:w>64?w-39:w+4}for(var M=0,v=0;v<g.length;++v)y[M++]=y[v]<60?r[y[v]]:(y[v]-60)*64+y[++v];return y.buffer.slice(0,M)}function l(g,y,v,w,M,C,E){var A=g.exports.sbrk,P=w+3&-4,T=A(P*M),L=A(C.length),D=new Uint8Array(g.exports.memory.buffer);D.set(C,L);var B=y(T,w,M,L,C.length);if(B==0&&E&&E(T,P,M),v.set(D.subarray(T,T+w*M)),A(T-A(0)),B!=0)throw new Error("Malformed buffer data: "+B)}var h={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},u={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},d=[],f=0;function m(g){var y={object:new Worker(g),pending:0,requests:{}};return y.object.onmessage=function(v){var w=v.data;y.pending-=w.count,y.requests[w.id][w.action](w.value),delete y.requests[w.id]},y}function p(g){for(var y="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(o(n))+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+b.name+";"+l.toString()+b.toString(),v=new Blob([y],{type:"text/javascript"}),w=URL.createObjectURL(v),M=d.length;M<g;++M)d[M]=m(w);for(var M=g;M<d.length;++M)d[M].object.postMessage({});d.length=g,URL.revokeObjectURL(w)}function x(g,y,v,w,M){for(var C=d[0],E=1;E<d.length;++E)d[E].pending<C.pending&&(C=d[E]);return new Promise(function(A,P){var T=new Uint8Array(v),L=++f;C.pending+=g,C.requests[L]={resolve:A,reject:P},C.object.postMessage({id:L,count:g,size:y,source:T,mode:w,filter:M},[T.buffer])})}function b(g){var y=g.data;if(!y.id)return self.close();self.ready.then(function(v){try{var w=new Uint8Array(y.count*y.size);l(v,v.exports[y.mode],w,y.count,y.size,y.source,v.exports[y.filter]),self.postMessage({id:y.id,count:y.count,action:"resolve",value:w},[w.buffer])}catch(M){self.postMessage({id:y.id,count:y.count,action:"reject",value:M})}})}return{ready:s,supported:!0,useWorkers:function(g){p(g)},decodeVertexBuffer:function(g,y,v,w,M){l(i,i.exports.meshopt_decodeVertexBuffer,g,y,v,w,i.exports[h[M]])},decodeIndexBuffer:function(g,y,v,w){l(i,i.exports.meshopt_decodeIndexBuffer,g,y,v,w)},decodeIndexSequence:function(g,y,v,w){l(i,i.exports.meshopt_decodeIndexSequence,g,y,v,w)},decodeGltfBuffer:function(g,y,v,w,M,C){l(i,i.exports[u[M]],g,y,v,w,i.exports[h[C]])},decodeGltfBufferAsync:function(g,y,v,w,M){return d.length>0?x(g,y,v,u[w],h[M]):s.then(function(){var C=new Uint8Array(g*y);return l(i,i.exports[u[w]],C,g,y,v,i.exports[h[M]]),C})}}})();const oi=-1,ot=4,ho=3,lt=ot,Pe=lt*Float32Array.BYTES_PER_ELEMENT,fe=Uint32Array.BYTES_PER_ELEMENT,co=65536,uo=1<<17;class yt{constructor(e){a(this,"free");this.capacity=e,this.free=e>0?[{start:0,size:e}]:[]}allocate(e){for(let t=0;t<this.free.length;t++){const r=this.free[t];if(r.size<e)continue;const n=r.start;return r.start+=e,r.size-=e,r.size===0&&this.free.splice(t,1),n}return-1}release(e,t){let r=0;for(;r<this.free.length&&this.free[r].start<e;)r++;this.free.splice(r,0,{start:e,size:t}),r+1<this.free.length&&e+t===this.free[r+1].start&&(this.free[r].size+=this.free[r+1].size,this.free.splice(r+1,1)),r>0&&this.free[r-1].start+this.free[r-1].size===e&&(this.free[r-1].size+=this.free[r].size,this.free.splice(r,1))}reset(){this.free=this.capacity>0?[{start:0,size:this.capacity}]:[]}grow(e){const t=this.free[this.free.length-1];t&&t.start+t.size===this.capacity?t.size+=e-this.capacity:this.free.push({start:this.capacity,size:e-this.capacity}),this.capacity=e}get end(){const e=this.free[this.free.length-1];return e&&e.start+e.size===this.capacity?e.start:this.capacity}}class Qe{constructor(e,t=co,r=uo){a(this,"renderer");a(this,"mesh",null);a(this,"vertexBuffer",null);a(this,"indexBuffer",null);a(this,"indirectBuffer",null);a(this,"indirectArgs",new Uint32Array([0,1,0,0,0]));a(this,"vertices",new yt(0));a(this,"indices",new yt(0));a(this,"usedVerts",0);a(this,"usedIndices",0);a(this,"ranges",new Map);a(this,"vertexScratch",new Float32Array(0));a(this,"indexScratch",new Uint32Array(0));a(this,"zeros",new Uint32Array(0));this.initialVerts=t,this.initialIndices=r,this.renderer=e}has(e){return this.ranges.has(e)}get vertexCount(){return this.usedVerts}get indexCount(){return this.usedIndices}get usedBytes(){return this.usedVerts*Pe+this.usedIndices*fe}get capacityBytes(){return this.vertices.capacity*Pe+this.indices.capacity*fe}tileBytes(e){const t=this.ranges.get(e);return t?t.count*Pe+t.indexCount*fe:0}addTile(e,t,r,n=ho){if(t.length===0||this.ranges.has(e))return;const i=t.length/n,s=r?r.length:i;if(s===0)return;let o=this.vertices.allocate(i),l=this.indices.allocate(s);(o<0||l<0)&&(o>=0&&this.vertices.release(o,i),l>=0&&this.indices.release(l,s),this.grow(i,s),o=this.vertices.allocate(i),l=this.indices.allocate(s));const h=this.renderer.device.queue;let u=t;if(n!==lt){u=this.vertexScratch=Qe.atLeast(this.vertexScratch,i*lt);for(let f=0;f<i;f++){const m=f*n,p=f*lt;u[p]=t[m],u[p+1]=t[m+1],u[p+2]=t[m+2],u[p+3]=oi}}h.writeBuffer(this.vertexBuffer,o*Pe,u.buffer,u.byteOffset,i*Pe);const d=this.indexScratch=Qe.atLeast(this.indexScratch,s);if(r)for(let f=0;f<s;f++)d[f]=o+r[f];else for(let f=0;f<s;f++)d[f]=o+f;h.writeBuffer(this.indexBuffer,l*fe,d.buffer,0,s*fe),this.ranges.set(e,{start:o,count:i,indexStart:l,indexCount:s}),this.usedVerts+=i,this.usedIndices+=s,this.updateIndirect()}removeTile(e){this.removeTiles([e])}removeTiles(e){let t=!1;for(const r of e){const n=this.ranges.get(r);if(!n)continue;this.ranges.delete(r);const i=this.zeros=Qe.atLeast(this.zeros,n.indexCount);this.renderer.device.queue.writeBuffer(this.indexBuffer,n.indexStart*fe,i.buffer,0,n.indexCount*fe),this.vertices.release(n.start,n.count),this.indices.release(n.indexStart,n.indexCount),this.usedVerts-=n.count,this.usedIndices-=n.indexCount,t=!0}t&&this.updateIndirect()}clear(){this.ranges.clear(),this.vertices.reset(),this.indices.reset(),this.usedVerts=0,this.usedIndices=0,this.updateIndirect()}draw(e){this.usedIndices===0||!this.mesh||!this.indirectBuffer||this.renderer.drawIndirect(this.mesh,e,this.indirectBuffer)}destruct(){var e;(e=this.mesh)==null||e.destruct(),this.indirectBuffer&&this.renderer.destroyAfterSubmit(this.indirectBuffer),this.mesh=null,this.vertexBuffer=null,this.indexBuffer=null,this.indirectBuffer=null,this.ranges.clear(),this.vertices=new yt(0),this.indices=new yt(0),this.usedVerts=0,this.usedIndices=0}updateIndirect(){this.indirectBuffer&&(this.indirectArgs[0]=this.indices.end,this.renderer.device.queue.writeBuffer(this.indirectBuffer,0,this.indirectArgs))}static atLeast(e,t){return e.length>=t?e:new e.constructor(Math.max(t,e.length*2))}grow(e,t){var d;const r=this.renderer.device,n=this.vertices.end,i=this.indices.end;let s=this.vertices.capacity||this.initialVerts;for(;s-n<e;)s*=2;let o=this.indices.capacity||this.initialIndices;for(;o-i<t;)o*=2;const l=r.createBuffer({size:s*Pe,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,label:"terrainLayerVertices"}),h=r.createBuffer({size:o*fe,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,label:"terrainLayerIndices"});if(this.vertexBuffer&&this.indexBuffer&&(n>0||i>0)){const f=r.createCommandEncoder();n>0&&f.copyBufferToBuffer(this.vertexBuffer,0,l,0,n*Pe),i>0&&f.copyBufferToBuffer(this.indexBuffer,0,h,0,i*fe),r.queue.submit([f.finish()])}const u=new me(this.renderer);u.setAttribute("position",lt,new Float32Array(0)),u.setVertexBuffer(l,s),u.indexBuffer=h,u.indexFormat="uint32",u.indexCount=o,(d=this.mesh)==null||d.destruct(),this.mesh=u,this.vertexBuffer=l,this.indexBuffer=h,s>this.vertices.capacity&&this.vertices.grow(s),o>this.indices.capacity&&this.indices.grow(o),this.indirectBuffer??(this.indirectBuffer=this.renderer.createBuffer(20,GPUBufferUsage.INDIRECT|GPUBufferUsage.COPY_DST,!1,"terrainLayerIndirect")),this.updateIndirect()}}const fo=`struct VertexInput {\r
	@location(0) position : vec3<f32>,\r
	@location(1) uv : vec2<f32>,\r
	@location(2) normal : vec3<f32>,\r
}\r
\r
struct VertexOutput {\r
    @builtin(position) position: vec4f,\r
	@location(0) side : f32,\r
	@location(1) color : vec3<f32>,\r
}\r
\r
struct Uniforms {\r
	resolution: vec2<f32>,\r
	viewProjection : mat4x4<f32>,\r
}\r
\r
struct BoundingBox {\r
	bbMin: vec4<f32>,   // .xyz = min, .w = unused\r
	bbMax: vec4<f32>,   // .xyz = max, .w = unused\r
	color: vec4<f32>,   // .xyz = color, .w = unused\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var<storage, read> boundingBoxes: array<BoundingBox>;\r
\r
@vertex\r
fn vs_main(\r
	input: VertexInput,\r
	@builtin(instance_index) instanceIndex : u32\r
) -> VertexOutput {\r
    var output: VertexOutput;\r
\r
	let box = boundingBoxes[instanceIndex];\r
\r
	let bbMin = box.bbMin.xyz;\r
	let bbMax = box.bbMax.xyz;\r
\r
	if(bbMin.x > bbMax.x){\r
		output.position = vec4(0.0);\r
	}else{\r
		let p0 = mix(bbMin, bbMax, input.position * .5 + .5);\r
		let clipPos = uniforms.viewProjection * vec4(p0, 1.0);\r
\r
		let edgeDir = input.normal;\r
		let clipPos2 = uniforms.viewProjection * vec4(p0 + edgeDir * 0.1, 1.0);\r
\r
		let screenPos1 = clipPos.xy / clipPos.w;\r
		let screenPos2 = clipPos2.xy / clipPos2.w;\r
\r
		var screenDir = normalize(screenPos2 - screenPos1);\r
		if (length(screenPos2 - screenPos1) < 0.0001) {\r
			screenDir = vec2<f32>(1.0, 0.0);\r
		}\r
\r
		let sideDir = vec2<f32>(-screenDir.y, screenDir.x);\r
		let side = input.uv.x * 2. - 1.0;\r
\r
		let thickness = (2. * clipPos.w) / uniforms.resolution.y;\r
\r
		output.position = vec4<f32>(clipPos.xy + sideDir * side * thickness, clipPos.z, clipPos.w);\r
		output.side = side;\r
	}\r
\r
//	output.color = box.color.xyz;\r
	output.color = hash13uf(instanceIndex);\r
    return output;\r
}\r
\r
@fragment\r
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {\r
	let a = smoothstep(1., 0., abs(input.side));\r
	return vec4<f32>(input.color, a * .5);\r
}\r
`,po=48,dn=1e4;class mo{constructor(e){a(this,"renderer");a(this,"material");a(this,"mesh");a(this,"bboxBuffer");this.renderer=e,this.material=new G(this.renderer,"boundingBox",fo,{includes:[le]}),this.material.setAlphaBlending(),this.material.cullMode="none",this.material.depthCompare="always",this.material.depthWriteEnabled=!1,this.bboxBuffer=e.createBuffer(po*dn,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.material.setBuffer("boundingBoxes",this.bboxBuffer),this.mesh=this.createAABBEdges()}createAABBEdges(){const e=new me(this.renderer),t=12,r=t*4,n=t*6,i=new Float32Array(r*3),s=new Float32Array(r*3),o=new Float32Array(r*2),l=new Array(n);let h=0,u=0,d=0;for(let f=0;f<3;f++)for(let m=0;m<4;m++){const p=m&1?1:-1,x=m&2?1:-1,b=[0,0,0],g=[0,0,0],y=[0,0,0];b[f]=-1,b[(f+1)%3]=p,b[(f+2)%3]=x,g[f]=1,g[(f+1)%3]=p,g[(f+2)%3]=x,y[f]=1;const v=h/3;i[h]=b[0],i[h+1]=b[1],i[h+2]=b[2],s[h]=y[0],s[h+1]=y[1],s[h+2]=y[2],o[u]=0,o[u+1]=0,h+=3,u+=2,i[h]=g[0],i[h+1]=g[1],i[h+2]=g[2],s[h]=y[0],s[h+1]=y[1],s[h+2]=y[2],o[u]=0,o[u+1]=1,h+=3,u+=2,i[h]=g[0],i[h+1]=g[1],i[h+2]=g[2],s[h]=y[0],s[h+1]=y[1],s[h+2]=y[2],o[u]=1,o[u+1]=1,h+=3,u+=2,i[h]=b[0],i[h+1]=b[1],i[h+2]=b[2],s[h]=y[0],s[h+1]=y[1],s[h+2]=y[2],o[u]=1,o[u+1]=0,h+=3,u+=2,l[d++]=v,l[d++]=v+1,l[d++]=v+2,l[d++]=v,l[d++]=v+2,l[d++]=v+3}return e.setPositions(i),e.setNormals(s),e.setUV0(o),e.setIndices(l),e}draw(e,t){if(t.length===0)return;const r=Math.min(t.length,dn),n=new Float32Array(r*12);for(let i=0;i<r;i++){const s=t[i];n[i*12+0]=s.min[0],n[i*12+1]=s.min[1],n[i*12+2]=s.min[2],n[i*12+3]=0,n[i*12+4]=s.max[0],n[i*12+5]=s.max[1],n[i*12+6]=s.max[2],n[i*12+7]=0,n[i*12+8]=s.color[0],n[i*12+9]=s.color[1],n[i*12+10]=s.color[2],n[i*12+11]=0}this.renderer.writeBuffer(this.bboxBuffer,n),this.material.setVector2("resolution",this.renderer.size),this.material.setMatrix("viewProjection",e),this.renderer.draw(this.mesh,this.material,{instanceCount:r})}destruct(){this.mesh.destruct(),this.bboxBuffer.destroy()}}const Fe=class Fe{constructor(e,t,r=-1){a(this,"renderer");a(this,"mesh");a(this,"material");a(this,"projection");a(this,"vertexData");a(this,"vertCount");a(this,"groundPosition",new S(NaN,NaN,NaN));a(this,"bakedScale",NaN);a(this,"size",Fe.SCALE);a(this,"centerOnCamera",!1);a(this,"heightM");this.renderer=e,this.projection=t,this.heightM=r,this.vertCount=Fe.BASE.length/3,this.vertexData=new Float32Array(this.vertCount*ot);for(let n=0;n<this.vertCount;n++)this.vertexData[n*ot+3]=oi;this.mesh=new me(e),this.mesh.setAttribute("position",ot,this.vertexData),this.mesh.keepCPUData=!0,this.material=new G(e,"osm",ut,{includes:[le]}),this.material.setVector3("lightDirection",new S(.5,.5,.5).normalize()),this.material.setVector3("baseColor",new S(.5,.5,.5))}updateGroundPosition(e){const t=this.heightM*this.projection.metersToNorm,r=this.centerOnCamera?e.worldPosition:e.pivot.worldPosition,n=this.size;if(this.groundPosition.x===r.x&&this.groundPosition.y===t&&this.groundPosition.z===r.z&&this.bakedScale===n)return;this.groundPosition.setValues(r.x,t,r.z),this.bakedScale=n;const i=Fe.BASE;for(let s=0;s<this.vertCount;s++){const o=s*ot,l=s*3;this.vertexData[o]=i[l]*n+r.x,this.vertexData[o+1]=i[l+1]*n+t,this.vertexData[o+2]=i[l+2]*n+r.z}this.renderer.writeBuffer(this.mesh.vertexBuffer,this.vertexData)}draw(e,t){this.updateGroundPosition(e),t||(this.material.setMatrix("viewProjection",e.viewProjection),this.material.setVector3("cameraPosition",e.worldPosition)),this.renderer.draw(this.mesh,t??this.material)}drawGBuffer(e,t){this.updateGroundPosition(e),this.renderer.draw(this.mesh,t)}get vertexCount(){return this.vertCount}destruct(){this.mesh.destruct()}};a(Fe,"SCALE",10),a(Fe,"BASE",new Float32Array([-.5,0,-.5,.5,0,.5,.5,0,-.5,-.5,0,-.5,-.5,0,.5,.5,0,.5]));let pr=Fe;const go=new Y,bo=new Y;function mr(c,e,t=0){const r=t*8;c.setVector4("positionScale",go.setValues(e[r],e[r+1],e[r+2],e[r+3])),c.setVector4("positionOffset",bo.setValues(e[r+4],e[r+5],e[r+6],e[r+7]))}const fn=new Set(["farmland","sand","green","forest","paths"]);class xo{constructor(e,t,r){a(this,"layers",[]);a(this,"groundBuffer");a(this,"elevation",!1);a(this,"meshBounds",new Map);a(this,"stats",{meshCount:0,vertexCount:0,culledCount:0});a(this,"frustum",new ti);a(this,"groundQuad");a(this,"groundGBufferMaterial");a(this,"cityGBufferMaterial");a(this,"wallTile",new k);a(this,"forwardLayerMaterials",[]);a(this,"forwardGroundMaterial");a(this,"forwardCityMaterial");a(this,"overdrawMaterial");a(this,"overdrawCityMaterial");a(this,"boundingBoxViewer");a(this,"treeMaterial");this.renderer=e,this.gBuffer=r,this.groundQuad=new pr(e,t,0),this.groundQuad.centerOnCamera=!0,this.groundBuffer=new Qe(e),this.groundGBufferMaterial=r.createMaterial(new S(.5,.5,.5),!1,"none"),this.cityGBufferMaterial=r.createMaterial(new S(1,1,1),!0);for(const s of gt){const o=N.fromHex(s.color),l=r.createMaterial(o.vector3,!1);this.layers.push({def:{key:s.key,label:s.label,color:[o.r,o.g,o.b],defaultOn:s.defaultOn},material:l,buffer:new Qe(e),enabled:null})}const n=this.treeMaterial=r.addPaletteColors(Ga);this.cityGBufferMaterial.setFloat("treeMaterial",n);const i=(s,o,l=!1,h=!1)=>{const u=new G(e,"osm",ut,{includes:l?[le]:h?[le,ir,ei]:[le,ir],defines:l?{FEATURE_IDS:!0,SKY_ALBEDO:!0,TREE_COLORS:!0,QUANTIZED:!0}:h?{SKY_ALBEDO:!0,TERRAIN_NORMALS:!0,SNOW:!0}:{SKY_ALBEDO:!0,TERRAIN_NORMALS:!0}});return l&&(u.setBuffer("materialPalette",r.paletteBuffer),u.setFloat("treeMaterial",n)),u.cullMode=o,u.setVector3("baseColor",s),u};for(const s of gt)this.forwardLayerMaterials.push(i(N.fromHex(s.color).vector3,"back",!1,fn.has(s.key)));this.forwardGroundMaterial=i(new S(.5,.5,.5),"none",!1,!0),this.forwardCityMaterial=i(new S(1,1,1),"back",!0),this.forwardCityMaterial.setFloat("selectedID",-1),this.forwardCityMaterial.setFloat("tileID",0),this.forwardCityMaterial.setFloat("drawIndex",0),this.overdrawMaterial=new G(e,"overdraw",un),this.overdrawCityMaterial=new G(e,"overdraw",un,{defines:{QUANTIZED:!0}});for(const s of[this.overdrawMaterial,this.overdrawCityMaterial])s.setAdditiveBlending(),s.depthWriteEnabled=!1,s.depthCompare="always";this.boundingBoxViewer=new mo(e)}setLayerColor(e,t){this.setMaterialColor(this.layers[e].material,this.forwardLayerMaterials[e],t)}setViewDistanceMax(e){this.groundQuad.size=e*2}setGroundColor(e){this.setMaterialColor(this.groundGBufferMaterial,this.forwardGroundMaterial,e)}setBuildingColor(e){this.setMaterialColor(this.cityGBufferMaterial,this.forwardCityMaterial,e)}setTreeTrunkColor(e){this.gBuffer.setPaletteColor(this.treeMaterial,[e.x,e.y,e.z])}setTreeCrownColor(e){const t=[0,0,0];for(const n of Ze)for(let i=0;i<3;i++)t[i]+=n[i]/Ze.length;const r=[e.x,e.y,e.z];Ze.forEach((n,i)=>{this.gBuffer.setPaletteColor(this.treeMaterial+1+i,[0,1,2].map(s=>n[s]*r[s]/t[s]))})}setMaterialColor(e,t,r){this.gBuffer.setPaletteColor(this.gBuffer.materialIndex(e),[r.x,r.y,r.z]),t.setVector3("baseColor",r)}get snowMaterials(){let e=1<<this.gBuffer.materialIndex(this.groundGBufferMaterial);for(const t of this.layers)fn.has(t.def.key)&&(e|=1<<this.gBuffer.materialIndex(t.material));return e}setSnow(e){const t=e.enabled?e.line:1e9;for(const r of this.forwardMaterials)r.setFloat("snowLine",t),r.setFloat("snowNoise",e.noise),r.setFloat("snowMetersPerUnit",e.metersPerUnit),r.setVector3("snowColor",e.color)}get forwardMaterials(){return[...this.forwardLayerMaterials,this.forwardGroundMaterial,this.forwardCityMaterial]}updateFrustum(e){this.frustum.setFromCamera(e)}resetStats(){this.stats={meshCount:0,vertexCount:0,culledCount:0}}drawGBuffer(e,t,r){t&&this.drawBuildings(e,t,r,this.cityGBufferMaterial,!0),this.drawGround(e,this.layers.map(n=>n.material),this.groundGBufferMaterial)}drawForward(e,t,r){for(const n of this.forwardMaterials)n.setMatrix("viewProjection",e.viewProjection),n.setVector3("cameraPosition",e.worldPosition);t&&this.drawBuildings(e,t,r,this.forwardCityMaterial),this.drawGround(e,this.forwardLayerMaterials,this.forwardGroundMaterial)}drawGround(e,t,r){const n=this.stats;for(let i=this.layers.length-1;i>=0;i--){const s=this.layers[i];!s.enabled.value||s.buffer.vertexCount===0||(s.buffer.draw(t[i]),n.meshCount++,n.vertexCount+=s.buffer.vertexCount)}if(this.elevation){if(this.groundBuffer.vertexCount===0)return;this.groundBuffer.draw(r),n.meshCount++,n.vertexCount+=this.groundBuffer.vertexCount;return}this.groundQuad.drawGBuffer(e,r),n.meshCount++,n.vertexCount+=this.groundQuad.vertexCount}drawBuildings(e,t,r,n,i=!1){const s=this.stats;n.setFloat("selectedID",r);const o=r>=0,{meshes:l,slots:h,tiles:u}=t,d=[],f=e.worldPosition;for(let m=0;m<l.length;m++){const p=this.meshBounds.get(l[m]);if(p&&!this.frustum.aaBoxInFrustum(p)){s.culledCount++;continue}let x=0;if(p){const b=Math.max(p.min.x-f.x,0,f.x-p.max.x),g=Math.max(p.min.y-f.y,0,f.y-p.max.y),y=Math.max(p.min.z-f.z,0,f.z-p.max.z);x=b*b+g*g+y*y}d.push({index:m,distance:x})}d.sort((m,p)=>m.distance-p.distance);for(const{index:m}of d){const p=l[m];o&&n.setFloat("tileID",h[m]),i&&n.setVector2("wallTile",this.wallTile.setValues(u[m*2],u[m*2+1])),mr(n,t.quantization,m),s.meshCount++,s.vertexCount+=p.vertexCount,this.renderer.draw(p,n)}}drawOverdraw(e,t){this.overdrawMaterial.setMatrix("viewProjection",e.viewProjection),this.overdrawCityMaterial.setMatrix("viewProjection",e.viewProjection),this.renderer.startRenderPass(),this.elevation?this.groundBuffer.draw(this.overdrawMaterial):this.groundQuad.draw(e,this.overdrawMaterial);for(const r of this.layers)!r.enabled.value||r.buffer.vertexCount===0||r.buffer.draw(this.overdrawMaterial);t&&t.meshes.forEach((r,n)=>{const i=this.meshBounds.get(r);i&&!this.frustum.aaBoxInFrustum(i)||(mr(this.overdrawCityMaterial,t.quantization,n),this.renderer.draw(r,this.overdrawCityMaterial))})}drawBoundingBoxes(e,t){const r=[],n=[.5,0,0];if(t)for(const i of t.meshes){const s=this.meshBounds.get(i);s&&r.push({min:[s.min.x,s.min.y,s.min.z],max:[s.max.x,s.max.y,s.max.z],color:n})}this.boundingBoxViewer.draw(e,r)}destruct(){this.groundQuad.destruct(),this.groundBuffer.destruct();for(const e of this.layers)e.buffer.destruct();this.boundingBoxViewer.destruct()}}const yo=`//for now, only use overrides in the @vertex and @fragment functions. Not in custom functions\r
override HALF_FILTER_WIDTH: u32 = 4;\r
\r
struct Uniforms {\r
	blurDir : vec2<f32>,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var<storage, read> weights : array<f32>;\r
@group(0) @binding(2) var<storage, read> offsets : array<f32>;\r
@group(0) @binding(3) var textureSampler: sampler;\r
@group(0) @binding(4) var texture: texture_2d<f32>;\r
\r
struct VertexInput {\r
	@location(0) position : vec3<f32>,\r
	@location(1) uv : vec2<f32>\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) uv : vec2<f32>,\r
}\r
\r
@vertex\r
fn vs_main(input:VertexInput) -> VertexOutput {\r
	var output : VertexOutput;\r
	output.position = vec4(input.position, 1.);\r
	output.uv = input.uv;\r
  return output;\r
}\r
\r
fn ts(uv: vec2<f32>) -> vec2<f32>\r
{\r
  return textureSample(texture, textureSampler, uv).xy;\r
}\r
\r
//https://software.intel.com/en-us/blogs/2014/07/15/an-investigation-of-fast-real-time-gpu-based-image-blur-algorithms\r
@fragment\r
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {\r
\r
	var sum = vec2(0.);\r
	for( var i = 0u; i < HALF_FILTER_WIDTH; i++ )\r
	{\r
		let o = offsets[i] * uniforms.blurDir;\r
		sum += weights[i] * (ts(input.uv + o ) + ts(input.uv - o ));\r
	}\r
	return vec4(sum, 0., 0.);\r
}\r
`,vo={format:"rgba8unorm",filterWidth:8};class wo{constructor(e,t={}){a(this,"renderer");a(this,"renderTexture");a(this,"materialX");a(this,"materialY");a(this,"weightsBuffer");a(this,"offsetsBuffer");a(this,"options");this.options={...vo,...t},this.renderer=e;const r=this.generateGaussShaderKernelWeightsAndOffsets(this.options.filterWidth*4-1);this.weightsBuffer=this.renderer.createBuffer(r[0].length*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.renderer.writeBuffer(this.weightsBuffer,r[0]),this.offsetsBuffer=this.renderer.createBuffer(r[1].length*4,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),this.renderer.writeBuffer(this.offsetsBuffer,r[1]);const n=this.renderer.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",magFilter:"linear",minFilter:"linear"});this.materialX=this.createMaterial(n),this.materialY=this.createMaterial(n),this.renderTexture=new H(this.renderer,1,1,{formats:[this.options.format],depth:!1})}createMaterial(e){const t=new G(this.renderer,"twoPassBlur",yo);return t.setConstant("HALF_FILTER_WIDTH",this.options.filterWidth),t.depthWriteEnabled=!1,t.setBuffer("weights",this.weightsBuffer),t.setBuffer("offsets",this.offsetsBuffer),t.setSampler("textureSampler",e),t}draw(e,t){this.renderTexture.setSize(e.width,e.height),this.materialX.setUniform("blurDir",[1/e.width,0]),this.renderer.blit(e,this.renderTexture,this.materialX),this.materialY.setUniform("blurDir",[0,1/e.height]),this.renderer.blit(this.renderTexture,t,this.materialY)}destruct(){this.renderTexture.destruct(),this.materialX.destruct(),this.materialY.destruct(),this.weightsBuffer.destroy(),this.offsetsBuffer.destroy()}generateSeparableGaussKernel(e,t){const r=Math.floor(t/2),n=[],i=r;let s=0;for(let o=0;o<t;++o)n[o]=Math.sqrt(Math.exp(-.5*(Math.pow((o-i)/e,2)+Math.pow(i/e,2)))),s+=n[o];for(let o=0;o<t;++o)n[o]/=s;return n}getAppropriateSeparableGauss(e){const t=.02/e;let r=1,n=1;for(;;){const i=this.generateSeparableGaussKernel(n,e);if(i[0]>t){if(r>.02){n-=r,r*=.1,n+=r;continue}const s=[];for(let o=0;o<e;o++)s.push(i[o]);return s}if(n+=r,n>1e3)break}throw new Error("getAppropriateSeparableGauss: did not find a value")}generateGaussShaderKernelWeightsAndOffsets(e){if((e+1)%4==0){const t=this.getAppropriateSeparableGauss(e),r=[],n=Math.floor(e/2);for(let l=n;l>=0;l--)l==n?r.push(t[l]*.5):r.push(t[l]);const i=r.length/2,s=new Float32Array(i),o=new Float32Array(i);for(let l=0;l<i;l++){const h=r[l*2+0]+r[l*2+1];s[l]=h,o[l]=l*2+r[l*2+1]/h}return[s,o]}throw new Error("incorrect kernel size")}}const So=`// One step of the fade of a shadow cascade to its latest render (ShadowMap): the moments it shows, reprojected to the\r
// latest center and size, blended towards the latest render. The VSM moments are linear, so a blend of them is a\r
// partial caster: a building that is new in the cascade fades in instead of popping in.\r
// Drawn over the full cascade: uv is the texel of the latest render.\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) uv : vec2<f32>,\r
}\r
\r
struct Uniforms {\r
  // ndc in the shown cascade = ndc in the latest render * scale + offset (the same sun direction, so no rotation)\r
  offset : vec2<f32>,\r
  scale : f32,\r
  // towards the latest render, 1 is all of it\r
  alpha : f32,\r
  // 1: the ground the shown cascade didn't cover fades in from lit (the last cascade: nothing covered it)\r
  fadeUncovered : f32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var fadeSampler : sampler;\r
// a copy of the cascade as it was shown\r
@group(0) @binding(2) var shownMoments : texture_2d<f32>;\r
// the latest render, blurred\r
@group(0) @binding(3) var latestMoments : texture_2d<f32>;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  output.uv = input.uv;\r
  return output;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  let size = vec2<f32>(textureDimensions(latestMoments));\r
  let latest = textureLoad(latestMoments, vec2<i32>(min(input.uv * size, size - 1.0)), 0);\r
  if (uniforms.alpha >= 1.0) {\r
    return latest;\r
  }\r
  // texture v runs down, ndc y up (as in the shadow lookup of shading.wgsl)\r
  let ndc = vec2<f32>(input.uv.x * 2.0 - 1.0, 1.0 - input.uv.y * 2.0);\r
  let shownNdc = ndc * uniforms.scale + uniforms.offset;\r
  // Ground the shown cascade didn't cover yet. A cascade behind it covered it until now, it has the latest render at\r
  // once: lit while it fades in would be a pop too. Past the last one the shadows fade in from lit (moments 0).\r
  if (any(abs(shownNdc) > vec2<f32>(1.0))) {\r
    return latest * mix(1.0, uniforms.alpha, uniforms.fadeUncovered);\r
  }\r
  let shownUV = vec2<f32>(shownNdc.x * 0.5 + 0.5, 0.5 - shownNdc.y * 0.5);\r
  let shown = textureSampleLevel(shownMoments, fadeSampler, shownUV, 0.0);\r
  return mix(shown, latest, uniforms.alpha);\r
}\r
`;class Mo{constructor(e,t,r,n,i,s){a(this,"camera");a(this,"pivot",new Ce);a(this,"renderTexture");a(this,"layer");a(this,"latest");a(this,"baseSize");a(this,"size");a(this,"center",new S(1e9,1e9,1e9));a(this,"dirty",!0);a(this,"instant",!0);a(this,"fadeTime",1/0);a(this,"shownMatrix",new Float32Array(16));a(this,"shownSize",0);this.baseSize=r,this.size=r,this.layer=s,this.renderTexture=new H(e,t,t,{formats:[n],depth:!1,colorTarget:i.getMipView(0,s)}),this.latest=new H(e,t,t,{formats:[n],depth:!1}),this.camera=new Cr({nearPlane:-1,farPlane:1,orthographic:!0,fov:.5}),this.camera.parent=this.pivot,this.applySize(r)}applySize(e){this.size=e,this.camera.projection.setSize(e,e)}destruct(){this.latest.destruct()}}const ie=class ie{constructor(e){a(this,"renderer");a(this,"shadowMapResolution",512);a(this,"cascades",[]);a(this,"cascadeTexture");a(this,"lightDirection",new S(0,-1,0));a(this,"cascadeCount",4);a(this,"stride",16);a(this,"shadowMapData",new Float32Array(this.cascadeCount*this.stride));a(this,"shadowMapDataBuffer");a(this,"renderTexture");a(this,"twoPassBlur");a(this,"textureFormat","rg16float");a(this,"shadowMapClearColor",new N(0,0,0,0));a(this,"updateIndex",0);a(this,"prevLightKey","");a(this,"userScale",2);a(this,"appliedScale",0);a(this,"fadeMaterial");a(this,"shownCopy");a(this,"fadeDuration");this.renderer=e;const t=this.shadowMapResolution;this.cascadeTexture=new ge(e,t,t,this.cascadeCount,{format:this.textureFormat,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST|GPUTextureUsage.COPY_SRC,dimension:"2d",viewDimension:"2d-array"});for(let r=0;r<this.cascadeCount;r++)this.cascades.push(new Mo(e,t,ie.BASE_SIZES[r],this.textureFormat,this.cascadeTexture,r));this.shadowMapDataBuffer=e.createBuffer(this.shadowMapData.byteLength,GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE),this.renderTexture=new H(e,this.shadowMapResolution,this.shadowMapResolution,{formats:[this.textureFormat],depth:!0}),this.twoPassBlur=new wo(e,{filterWidth:3,format:this.textureFormat}),this.shownCopy=new H(e,this.shadowMapResolution,this.shadowMapResolution,{formats:[this.textureFormat],depth:!1,usage:GPUTextureUsage.COPY_DST}),this.fadeMaterial=new G(e,"shadowMapFade",So),this.fadeMaterial.depthWriteEnabled=!1,this.fadeMaterial.depthCompare="always",this.fadeMaterial.setSampler("fadeSampler",e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"linear",minFilter:"linear"})),this.fadeMaterial.setTexture("shownMoments",this.shownCopy)}init(e){const t=e.addGroup("ShadowMap");t.addParamFloat("shadowSize",this.userScale,.25,4,{callback:r=>{this.userScale=r}}),this.fadeDuration=t.addParamFloat("fadeDuration",.6,0,2)}setDirty(e=!1){for(const t of this.cascades)t.dirty=!0,e&&(t.instant=!0)}reset(){this.setDirty(!0)}applyScale(e){const t=this.userScale*Math.max(e,.001);if(Math.abs(t-this.appliedScale)<=this.appliedScale*.05)return!1;this.appliedScale=t;for(const r of this.cascades)r.applySize(r.baseSize*t),r.dirty=!0;return!0}update(e,t,r,n,i,s=null){this.lightDirection=e,this.applyScale(r);const o=`${e.x.toFixed(4)},${e.y.toFixed(4)},${e.z.toFixed(4)}`;o!==this.prevLightKey&&(this.prevLightKey=o,this.setDirty(!0)),n&&this.setDirty();const l=s?ie.REDRAW_DRIFT_AHEAD:ie.REDRAW_DRIFT;for(const d of this.cascades)S.distance(this.cascadeCenter(d,t,s),d.center)>d.size*l&&(d.dirty=!0);let h=-1;for(let d=0;d<this.cascades.length;d++){const f=(this.updateIndex+d)%this.cascades.length;if(this.cascades[f].dirty){this.renderCascade(f,this.cascadeCenter(this.cascades[f],t,s),i),this.updateIndex=(f+1)%this.cascades.length,h=f;break}}const u=this.renderer.time.dt;for(let d=0;d<this.cascades.length;d++)d!==h&&this.cascades[d].fadeTime!==1/0&&this.stepFade(d,u);return!this.cascades.some(d=>d.dirty||d.fadeTime!==1/0)}cascadeCenter(e,t,r){if(!r)return t;const n=Math.max(r.focus,e.size*ie.AHEAD_OFFSET);return S.add(r.origin,r.forward.clone().multiplyScalar(n))}stepFade(e,t,r=new k(0,0),n=1){var h;const i=this.cascades[e],s=((h=this.fadeDuration)==null?void 0:h.value)??0;i.fadeTime+=t;let o=1;i.fadeTime<s&&(o=1-Math.exp(-t*5/s)),o>=1&&(i.fadeTime=1/0),o<1&&this.renderer.copyTextureLayer(this.cascadeTexture.gpuTexture,i.layer,this.shownCopy.gpuTexture,0);const l=this.fadeMaterial;l.setTexture("latestMoments",i.latest),l.setVector2("offset",r),l.setFloat("scale",n),l.setFloat("alpha",o),l.setFloat("fadeUncovered",e===this.cascades.length-1?1:0),this.renderer.blit(null,i.renderTexture,l,!0)}renderCascade(e,t,r){var y;const n=this.cascades[e];n.dirty=!1,n.center=t.clone();const i=this.lightDirection;n.pivot.lookAt(t,S.subtract(t,i));const s=n.pivot.right,o=n.pivot.up,l=2*n.size/this.shadowMapResolution,h=t.clone();for(const v of[s,o]){const w=S.dot(t,v);h.add(v.multiplyScalar(Math.round(w/l)*l-w))}n.pivot.lookAt(h,S.subtract(h,i));const u=Math.max(Math.abs(i.y),.1),d=n.size*Math.sqrt(2)*Math.sqrt(1-u*u)/u+ie.DEPTH_MARGIN,f=n.camera.projection;f.near=-d,f.far=d,this.renderer.startRenderPass(this.renderTexture,{clearColor:this.shadowMapClearColor}),r(n.camera),this.twoPassBlur.draw(this.renderTexture,n.latest);const m=n.shownMatrix,p=new k(m[0]*h.x+m[4]*h.y+m[8]*h.z+m[12],m[1]*h.x+m[5]*h.y+m[9]*h.z+m[13]),x=n.size/Math.max(n.shownSize,1e-9),b=!n.instant&&(((y=this.fadeDuration)==null?void 0:y.value)??0)>0;n.instant=!1;const g=n.camera.viewProjection.m;n.shownMatrix.set(g),n.shownSize=n.size,this.shadowMapData.set(g,e*this.stride),this.renderer.writeBuffer(this.shadowMapDataBuffer,this.shadowMapData),b?(n.fadeTime=0,this.stepFade(e,this.renderer.time.dt,p,x)):(n.fadeTime=1/0,this.renderer.copyTextureLayer(n.latest.gpuTexture,0,this.cascadeTexture.gpuTexture,n.layer))}destruct(){for(const e of this.cascades)e.destruct();this.cascadeTexture.destruct(),this.renderTexture.destruct(),this.shownCopy.destruct()}};a(ie,"BASE_SIZES",[.25,.5,1,2]),a(ie,"AHEAD_OFFSET",.8),a(ie,"REDRAW_DRIFT",.5),a(ie,"REDRAW_DRIFT_AHEAD",.25),a(ie,"DEPTH_MARGIN",1);let gr=ie;const To=`// The shadowMap drawMode: the 4 cascades of the sun shadow map (SunShadows) as a 2 x 2 grid, cascade 0 top left,\r
// 1 top right, 2 bottom left, 3 bottom right. The grid is a square in the middle of the screen with black borders\r
// beside it. A texel shows the height of its caster (the first moment of the VSM is -height), the ground is black.\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) uv : vec2<f32>,\r
}\r
\r
struct Uniforms {\r
  // width / height of the screen\r
  aspectRatio : f32,\r
  metersToNorm : f32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
// the 4 cascades, one layer each (ShadowMap.cascadeTexture)\r
@group(0) @binding(1) var shadowMaps : texture_2d_array<f32>;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  output.uv = input.uv;\r
  return output;\r
}\r
\r
fn loadMoments(i : u32, uv : vec2<f32>) -> vec2<f32> {\r
  let size = vec2<f32>(textureDimensions(shadowMaps));\r
  let coord = vec2<i32>(min(uv * size, size - 1.0));\r
  return textureLoad(shadowMaps, coord, i, 0).xy;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  // -1..1 across the square of the grid\r
  var p = input.uv * 2.0 - 1.0;\r
  if (uniforms.aspectRatio > 1.0) {\r
    p.x *= uniforms.aspectRatio;\r
  } else {\r
    p.y /= uniforms.aspectRatio;\r
  }\r
  if (any(abs(p) > vec2<f32>(1.0))) {\r
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);\r
  }\r
  let grid = (p * 0.5 + 0.5) * 2.0;\r
  let i = min(u32(grid.x), 1u) + min(u32(grid.y), 1u) * 2u;\r
  let uv = fract(grid);\r
\r
  // the color of the cascade in shadowDebug 1, on the lines between the cells\r
  var col = vec3<f32>(1.0, 0.3, 0.3);\r
  if (i == 1u) { col = vec3<f32>(0.3, 1.0, 0.3); }\r
  else if (i == 2u) { col = vec3<f32>(0.3, 0.5, 1.0); }\r
  else if (i == 3u) { col = vec3<f32>(1.0, 1.0, 0.3); }\r
  let edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));\r
  if (edge < 0.004) {\r
    return vec4<f32>(col, 1.0);\r
  }\r
\r
  let moments = loadMoments(i, uv);\r
  let meters = max(-moments.x, 0.0) / uniforms.metersToNorm;\r
  // 50 m is about .5, 200 m nearly white\r
  let h = 1.0 - exp(-meters / 70.0);\r
  // the spread of the blurred moments (the penumbra of the VSM) tinted with the cascade color\r
  let sigma = sqrt(max(moments.y - moments.x * moments.x, 0.0)) / uniforms.metersToNorm;\r
  let spread = 1.0 - exp(-sigma / 20.0);\r
  return vec4<f32>(mix(vec3<f32>(h), col, spread * 0.5), 1.0);\r
}\r
`,pn=`// The passes of TerrainSunMap.ts over the height map of the ground (rendered top down, per texel -height: the depth\r
// material of the cascades, -1e9 where no ground). Two kernels, one per material (the entry points are picked by the\r
// defines):\r
//   MAX_HEIGHTS: per cell of COARSE x COARSE texels the highest ground in it and a texel around it (a bilinear sample in\r
//     the cell reads one texel past it), so the march skips the cells it passes over\r
//   SHADOW_HEIGHT: per texel the height a point there has to be at to see the sun, see fs_main\r
\r
// texels of the height map per cell of maxHeights, mirrors COARSE of TerrainSunMap.ts\r
const COARSE = 16;\r
// the march takes steps of a texel near the texel, longer ones further away: by this part of the distance. A hill far\r
// away shadows with a wide penumbra, its exact place matters less\r
const STEP_GROWTH = 0.02;\r
const MAX_STEPS = 1024;\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
}\r
\r
struct Uniforms {\r
  // the direction toward the sun across the map, in texels (x along +x, y along +z), normalized. 0: the sun is overhead\r
  sunDirection : vec2<f32>,\r
  // how much a ray toward the sun rises per texel it goes across, world units. Negative: the sun is below the horizon\r
  risePerTexel : f32,\r
  // the half width of the penumbra per texel of distance to the hill that casts the shadow (the angular radius of the\r
  // sun), and at the least, world units of height\r
  penumbraPerTexel : f32,\r
  penumbraMin : f32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var heights : texture_2d<f32>;\r
#ifdef SHADOW_HEIGHT\r
@group(0) @binding(2) var maxHeights : texture_2d<f32>;\r
#endif\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  return output;\r
}\r
\r
#ifdef MAX_HEIGHTS\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  let size = vec2<i32>(textureDimensions(heights));\r
  let c = vec2<i32>(input.position.xy) * COARSE;\r
  var m = -1e30;\r
  for (var y = c.y - 1; y <= c.y + COARSE; y++) {\r
    for (var x = c.x - 1; x <= c.x + COARSE; x++) {\r
      let t = clamp(vec2<i32>(x, y), vec2<i32>(0), size - 1);\r
      m = max(m, -textureLoad(heights, t, 0).x);\r
    }\r
  }\r
  return vec4<f32>(m, 0.0, 0.0, 1.0);\r
}\r
#endif\r
\r
#ifdef SHADOW_HEIGHT\r
// the ground height at p (texel coordinates, the centers at .5), bilinear\r
fn heightAt(p : vec2<f32>, size : vec2<i32>) -> f32 {\r
  let t = p - 0.5;\r
  let i = vec2<i32>(floor(t));\r
  let f = t - floor(t);\r
  let last = size - 1;\r
  let h00 = textureLoad(heights, clamp(i, vec2<i32>(0), last), 0).x;\r
  let h10 = textureLoad(heights, clamp(i + vec2<i32>(1, 0), vec2<i32>(0), last), 0).x;\r
  let h01 = textureLoad(heights, clamp(i + vec2<i32>(0, 1), vec2<i32>(0), last), 0).x;\r
  let h11 = textureLoad(heights, clamp(i + vec2<i32>(1, 1), vec2<i32>(0), last), 0).x;\r
  return -mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y);\r
}\r
\r
// r: the height H a point at this texel has to be at to see the sun over the ground toward it,\r
//   H = max over s of (ground(x + s * sunDirection) - s * risePerTexel), s > 0 in texels.\r
//   A max of continuous functions of x, so H is continuous: interpolated bilinearly, the edge of a shadow (where a point\r
//   is at H) is a smooth curve, not the texel grid as with a map rendered from the sun. And the texels lie on the\r
//   ground, they don't stretch at a low sun.\r
// g: the half width of the penumbra there, of the distance to the ground that sets H\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  let size = vec2<i32>(textureDimensions(heights));\r
  let sizeF = vec2<f32>(size);\r
  let d = uniforms.sunDirection;\r
  let rise = uniforms.risePerTexel;\r
  if (rise < 0.0) {\r
    // the sun is below the horizon: all in shadow\r
    return vec4<f32>(1e30, uniforms.penumbraMin, 0.0, 1.0);\r
  }\r
  if (dot(d, d) < 0.25) {\r
    // the sun is overhead: no ground in the way\r
    return vec4<f32>(-1e30, uniforms.penumbraMin, 0.0, 1.0);\r
  }\r
  let p0 = input.position.xy;\r
  let coarseLast = vec2<i32>(textureDimensions(maxHeights)) - 1;\r
  var best = -1e30;\r
  var bestS = 0.0;\r
  var s = 1.0;\r
  for (var i = 0; i < MAX_STEPS; i++) {\r
    let p = p0 + d * s;\r
    if (any(p < vec2<f32>(0.0)) || any(p >= sizeF)) {\r
      break;\r
    }\r
    // the ground further along raises H only where it is above best + s * rise, which only grows with s: skip to where\r
    // the ray leaves a cell whose ground is all below that\r
    let c = clamp(vec2<i32>(floor(p / f32(COARSE))), vec2<i32>(0), coarseLast);\r
    if (textureLoad(maxHeights, c, 0).x <= best + s * rise) {\r
      let lo = vec2<f32>(c * COARSE);\r
      let edge = select(lo, lo + f32(COARSE), d > vec2<f32>(0.0));\r
      let t = select(vec2<f32>(1e9), (edge - p) / d, abs(d) > vec2<f32>(1e-6));\r
      s += max(min(t.x, t.y), 0.0) + 0.01;\r
      continue;\r
    }\r
    let h = heightAt(p, size) - s * rise;\r
    if (h > best) {\r
      best = h;\r
      bestS = s;\r
    }\r
    s += max(1.0, s * STEP_GROWTH);\r
  }\r
  return vec4<f32>(best, uniforms.penumbraMin + bestS * uniforms.penumbraPerTexel, 0.0, 1.0);\r
}\r
#endif\r
`,q=class q{constructor(e,t){a(this,"heights");a(this,"maxHeights");a(this,"target");a(this,"maxHeightsMaterial");a(this,"shadowHeightMaterial");a(this,"viewProjection",new F);a(this,"materials",[]);a(this,"center",new S(1e9,1e9,1e9));a(this,"size",0);a(this,"lightKey","");a(this,"dirty",!0);this.renderer=e,this.heightMaterial=t;const r=q.RESOLUTION,n=r/q.COARSE;this.heights=new H(e,r,r,{formats:["r32float"],depth:!0,depthFormat:"depth32float"}),this.maxHeights=new H(e,n,n,{formats:["r32float"]}),this.target=new H(e,r,r,{formats:["rg32float"]}),this.maxHeightsMaterial=new G(e,"terrainSunMaxHeights",pn,{defines:{MAX_HEIGHTS:!0}}),this.maxHeightsMaterial.depthWriteEnabled=!1,this.maxHeightsMaterial.setTexture("heights",this.heights),this.shadowHeightMaterial=new G(e,"terrainSunShadowHeight",pn,{defines:{SHADOW_HEIGHT:!0}}),this.shadowHeightMaterial.depthWriteEnabled=!1,this.shadowHeightMaterial.setTexture("heights",this.heights),this.shadowHeightMaterial.setTexture("maxHeights",this.maxHeights)}bind(e){e.setTexture("terrainSunMap",this.target),this.materials.push(e),this.setUniforms(e)}setDirty(){this.dirty=!0}update(e,t,r,n,i){const s=`${e.x.toFixed(4)},${e.y.toFixed(4)},${e.z.toFixed(4)},${n}`;s!==this.lightKey&&(this.lightKey=s,this.dirty=!0);const o=r*q.SIZE_SCALE;o!==this.size&&(this.dirty=!0);const l=t.x-this.center.x,h=t.z-this.center.z;Math.sqrt(l*l+h*h)>r*q.REDRAW_DRIFT&&(this.dirty=!0),this.dirty&&(this.dirty=!1,this.size=o,this.center=t.clone(),this.render(e,n,i))}render(e,t,r){const n=this.size,i=2*n/q.RESOLUTION,s=Math.round(this.center.x/i)*i,o=Math.round(this.center.z/i)*i,l=this.center.y+100*n,h=200*n;this.viewProjection.setValues(1/n,0,0,0,0,0,-1/h,0,0,-1/n,0,0,-s/n,o/n,l/h,1),this.renderer.startRenderPass(this.heights,{clearColor:q.CLEAR}),r&&(this.heightMaterial.setMatrix("viewProjection",this.viewProjection),r.draw(this.heightMaterial)),this.renderer.blit(null,this.maxHeights,this.maxHeightsMaterial);const u=Math.hypot(e.x,e.z),d=this.shadowHeightMaterial;d.setVector2("sunDirection",u<1e-5?new k(0,0):new k(e.x/u,e.z/u));const f=u<1e-5?0:e.y/u*i;d.setFloat("risePerTexel",f);const m=Math.max(u/e.length(),.05);d.setFloat("penumbraPerTexel",i*t/(m*m)),d.setFloat("penumbraMin",Math.max(f,0)*q.PENUMBRA_MIN_TEXELS+i*.001),this.renderer.blit(null,this.target,d);for(const p of this.materials)this.setUniforms(p)}setUniforms(e){e.setMatrix("terrainSunViewProjection",this.viewProjection),e.setFloat("terrainSunOffset",q.NORMAL_OFFSET_TEXELS*(2*this.size)/q.RESOLUTION)}destruct(){this.heights.destruct(),this.maxHeights.destruct(),this.target.destruct(),this.maxHeightsMaterial.destruct(),this.shadowHeightMaterial.destruct()}};a(q,"RESOLUTION",1024),a(q,"COARSE",16),a(q,"SIZE_SCALE",1.25),a(q,"REDRAW_DRIFT",.2),a(q,"NORMAL_OFFSET_TEXELS",.25),a(q,"PENUMBRA_MIN_TEXELS",.5),a(q,"CLEAR",new N(1e9,0,0,0));let br=q;class Co{constructor(e){a(this,"shadowMap");a(this,"lightDir",new S(0,-1,0));a(this,"depthMaterial");a(this,"terrainDepthMaterial");a(this,"terrainSun");a(this,"sampler");a(this,"sunAngleX");a(this,"sunAngleY");a(this,"mode");a(this,"shadowStrength");a(this,"sunRadius");a(this,"materials",[]);a(this,"viewMaterial");a(this,"onChange",()=>{});this.renderer=e,this.shadowMap=new gr(e),this.depthMaterial=new G(e,"osm",ut,{includes:[le],defines:{QUANTIZED:!0,DEPTH_CLAMP:!0}}),this.depthMaterial.setConstant("DRAW_DEPTH",!0),this.terrainDepthMaterial=new G(e,"osm",ut,{includes:[le],defines:{DEPTH_CLAMP:!0}}),this.terrainDepthMaterial.setConstant("DRAW_DEPTH",!0),this.terrainDepthMaterial.cullMode="none",this.sampler=e.device.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",magFilter:"linear",minFilter:"linear"}),this.bindResources(this.depthMaterial),this.bindResources(this.terrainDepthMaterial);const t=new G(e,"osm",ut,{includes:[le],defines:{DEPTH_CLAMP:!0}});t.setConstant("DRAW_DEPTH",!0),t.cullMode="none",this.bindResources(t),this.terrainSun=new br(e,t),this.viewMaterial=new G(e,"shadowMapView",To),this.viewMaterial.depthWriteEnabled=!1,this.viewMaterial.depthCompare="always",this.viewMaterial.setTexture("shadowMaps",this.shadowMap.cascadeTexture)}bindResources(e){e.setSampler("shadowMapSampler",this.sampler),e.setTexture("shadowMaps",this.shadowMap.cascadeTexture),e.setBuffer("shadowMapData",this.shadowMap.shadowMapDataBuffer)}initParams(e,t,r){this.materials=t,this.onChange=r;const n={materials:t,callback:r},i={callback:()=>this.updateLightDirection()};this.sunAngleX=e.addParamFloat("sunAngleX",1,-.05,Math.PI*.5,i),this.sunAngleY=e.addParamFloat("sunAngleY",.5,-Math.PI,Math.PI,i),this.updateLightDirection(),this.mode=e.addParamSelect("shadowMode",Z.ShadowMap,no,{callback:r}),this.shadowStrength=e.addParamFloat("shadowStrength",1,0,1,n),e.addParamFloat("VSMBleedThreshold",.65,0,1,n),e.addParamFloat("varianceMin",.01,0,.05,n),this.sunRadius=e.addParamFloat("shadowSunRadius",.01,0,.05,n)}setSunAngles(e,t){this.sunAngleX.setValue(e),this.sunAngleY.setValue(t)}init(e){this.shadowMap.init(e)}updateLightDirection(){const e=new Ce;e.rotateY(this.sunAngleY.value),e.rotateX(-this.sunAngleX.value);const t=e.forward;this.lightDir=t.clone();for(const r of this.materials)r.setVector3("lightDirection",t);this.onChange()}update(e,t,r,n,i=null){return this.shadowMap.update(this.lightDir,e.pivot.worldPosition,e.distance,t,s=>{this.depthMaterial.setMatrix("viewProjection",s.viewProjection),r.meshes.forEach((o,l)=>{mr(this.depthMaterial,r.quantization,l),this.renderer.draw(o,this.depthMaterial)}),n&&(this.terrainDepthMaterial.setMatrix("viewProjection",s.viewProjection),n.draw(this.terrainDepthMaterial))},i)}updateTerrainSun(e,t,r){const n=e.worldPosition,i=new S(n.x,e.pivot.worldPosition.y,n.z);this.terrainSun.update(this.lightDir,i,t,this.sunRadius.value,r)}drawView(e){const t=this.renderer.canvas;this.viewMaterial.setFloat("aspectRatio",t.width/t.height),this.viewMaterial.setFloat("metersToNorm",e),this.renderer.blit(null,null,this.viewMaterial,!0)}destruct(){this.shadowMap.destruct(),this.terrainSun.destruct()}}const Eo=`// The wallAtlas drawMode: the walls of a tile's building mesh at their wall atlas position (see layoutWalls in\r
// cityLayout.ts) instead of in the world, the whole atlas fitted to the screen, v down: the mesh WallAtlasView makes of\r
// them, without the roofs (they're on the roof charts). A building gets a color of its feature id, the trees are green.\r
// A grid line every 100 m, the part past what the gBuffer stores (GBUFFER_ATLAS_MAX steps) is striped red.\r
\r
struct VertexInput {\r
  // xy: the atlas position, w: the feature id\r
  @location(0) position : vec4<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) atlas : vec2<f32>,\r
  @location(1) @interpolate(flat) featureId : f32,\r
}\r
\r
struct Uniforms {\r
  // clip = atlas * scale + offset, see WallAtlasView.draw\r
  scale : vec2<f32>,\r
  offset : vec2<f32>,\r
  // the most atlas position the gBuffer stores, in world units\r
  limit : f32,\r
  // 100 m in world units\r
  gridStep : f32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
\r
// the .w of a tree vertex is TREE_MATERIAL_BASE_ID - k, see map/worldTrees.ts\r
const TREE_MATERIAL_BASE_ID = -2.0;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.atlas = input.position.xy;\r
  output.featureId = input.position.w;\r
  output.position = vec4<f32>(input.position.xy * uniforms.scale + uniforms.offset, 0.5, 1.0);\r
  return output;\r
}\r
\r
fn hashU(x : u32) -> u32 {\r
  var h = x * 747796405u + 2891336453u;\r
  h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;\r
  return (h >> 22u) ^ h;\r
}\r
\r
fn hue(h : f32) -> vec3<f32> {\r
  return clamp(abs(fract(h + vec3<f32>(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, vec3<f32>(0.0), vec3<f32>(1.0));\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  var col = vec3<f32>(0.6);\r
  if (input.featureId < TREE_MATERIAL_BASE_ID + 0.5) {\r
    col = mix(vec3<f32>(0.1, 0.45, 0.1), vec3<f32>(0.4, 0.75, 0.2), f32(hashU(u32(TREE_MATERIAL_BASE_ID - input.featureId + 0.5)) & 255u) / 255.0);\r
  } else if (input.featureId >= 0.0) {\r
    let h = hashU(u32(input.featureId + 0.5));\r
    col = mix(vec3<f32>(0.35), hue(f32(h & 1023u) / 1024.0), 0.75) * (0.7 + 0.3 * f32((h >> 10u) & 255u) / 255.0);\r
  }\r
\r
  // the grid, about 1 pixel wide\r
  let cell = input.atlas / uniforms.gridStep;\r
  let line = abs(fract(cell + 0.5) - 0.5) / max(fwidth(cell), vec2<f32>(1e-6));\r
  col = mix(col, vec3<f32>(1.0), 0.5 * (1.0 - clamp(min(line.x, line.y), 0.0, 1.0)));\r
\r
  if (any(input.atlas > vec2<f32>(uniforms.limit))) {\r
    let stripe = fract((input.position.x + input.position.y) / 16.0) < 0.5;\r
    col = mix(col, vec3<f32>(1.0, 0.0, 0.0), select(0.3, 0.7, stripe));\r
  }\r
  return vec4<f32>(col, 1.0);\r
}\r
`,ko=.03,Ao=100;class Po{constructor(e){a(this,"material");a(this,"clearColor",new N(.08,.08,.1,1));a(this,"loggedKey","");a(this,"scale",new k);a(this,"offset",new k);a(this,"mesh",null);a(this,"meshKey","");this.renderer=e,this.material=new G(e,"wallAtlasView",Eo),this.material.depthWriteEnabled=!1,this.material.depthCompare="always",this.material.cullMode="none"}draw(e,t){var l;if(this.renderer.startRenderPass(null,{clearColor:this.clearColor,colorClear:!0,depthClear:!0},0,"wallAtlasView"),!(e!=null&&e.result.atlasSize)||(e.key!==this.meshKey&&((l=this.mesh)==null||l.destruct(),this.mesh=this.createMesh(e.result),this.meshKey=e.key),!this.mesh))return;const[r,n]=e.result.atlasSize;e.key!==this.loggedKey&&(this.loggedKey=e.key,_.log(`[MapWorld] wall atlas of tile ${e.key}: ${(r/t).toFixed()} x ${(n/t).toFixed()} m`));const i=this.renderer.canvas.width,s=this.renderer.canvas.height,o=Math.min(i/r,s/n)*(1-2*ko);this.scale.setValues(2*o/i,-2*o/s),this.offset.setValues(-r*o/i,n*o/s),this.material.setVector2("scale",this.scale),this.material.setVector2("offset",this.offset),this.material.setFloat("limit",Gs*Qn*t),this.material.setFloat("gridStep",Ao*t),this.renderer.draw(this.mesh,this.material)}createMesh(e){const{vertices:t,quantization:r,lightmap:n,indices:i}=e,s=new Float32Array(t.length);for(let h=0;h<t.length;h++)s[h]=t[h]/65535*r[h&3]+r[4+(h&3)];const o=[];for(let h=0;h+2<i.length;h+=3){const u=i[h];if(!(n[u*2+1]<0))for(let d=0;d<3;d++){const f=i[h+d]*4,m=Math.hypot(s[f]-s[u*4],s[f+2]-s[u*4+2]);o.push(n[u*2]+m,n[u*2+1]+s[f+1]-s[u*4+1],0,s[f+3])}}if(o.length===0)return null;const l=new me(this.renderer);return l.setAttribute("position",4,new Float32Array(o)),l}destruct(){var e;(e=this.mesh)==null||e.destruct(),this.material.destruct()}}class _o{constructor(e,t){a(this,"renderer");a(this,"indexRT",null);a(this,"panel");a(this,"addressEl");a(this,"bodyEl");a(this,"sizeMultiplier",.3);a(this,"selectedID",-1);a(this,"addressResolver",null);a(this,"resolveToken",0);a(this,"readbackBuffer",null);this.renderer=e;const{panel:r,addressEl:n,bodyEl:i}=this.buildPanel();this.panel=r,this.addressEl=n,this.bodyEl=i,t.appendChild(r)}get indexRenderTexture(){return this.indexRT||(this.indexRT=new H(this.renderer,1,1,{formats:["rgba8unorm"],depth:!0,sampleCount:1,scaleToCanvas:!0,sizeMultiplier:this.sizeMultiplier,toScreen:!1})),this.indexRT}select(e,t){this.selectedID=t?e:-1,this.showInfo(t)}setAddressResolver(e){this.addressResolver=e}async pick(e){var i;const t=e.material;t.setMatrix("viewProjection",e.viewProjection),t.setVector3("cameraPosition",e.cameraPosition),t.setFloat("drawIndex",1),this.renderer.startRenderPass(this.indexRenderTexture,{clearColor:new N(0,0,0,0)});for(let s=0;s<e.meshes.length;s++)t.setFloat("tileID",e.slots[s]),(i=e.beforeDraw)==null||i.call(e,s),this.renderer.draw(e.meshes[s],t);t.setFloat("drawIndex",0),this.renderer.endPasses();const r=await this.readPixel(e.x,e.y);this.selectedID=r;const n=r>=0?e.lookup(r):null;console.log("[pick] globalId",r,"building",n),this.showInfo(n)}clearSelection(){this.selectedID=-1,this.showInfo(null)}async readPixel(e,t){const r=this.indexRenderTexture,n=r.gpuTexture,i=r.sizeMultiplier;this.readbackBuffer??(this.readbackBuffer=this.renderer.device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}));const s=this.readbackBuffer,o=Math.max(0,Math.min(n.width-1,Math.round(e*i))),l=Math.max(0,Math.min(n.height-1,Math.round(t*i)));this.renderer.commandEncoder.copyTextureToBuffer({texture:n,origin:{x:o,y:l,z:0}},{buffer:s,bytesPerRow:256},{width:1,height:1}),this.renderer.finish(),await s.mapAsync(GPUMapMode.READ);const h=new Uint8Array(s.getMappedRange()),u=(h[0]|h[1]<<8|h[2]<<16|h[3]<<24)>>>0;return s.unmap(),u===0?-1:u-1}showInfo(e){if(this.resolveToken++,!e){this.panel.style.display="none";return}this.panel.style.display="block";const t=e.year>0?String(e.year):"unknown",r=e.groundArea>0?`${e.groundArea.toFixed(1)} m²`:"unknown";if(this.bodyEl.innerHTML="",e.year>=0&&this.bodyEl.appendChild(this.row("Year of construction",t)),e.height!==void 0&&e.height>0&&this.bodyEl.appendChild(this.row("Height",`${e.height.toFixed(1)} m`)),this.bodyEl.appendChild(this.row("Footprint area",r)),this.addressEl.textContent=e.id||"unknown",e.id&&this.addressResolver){const n=this.resolveToken;this.addressResolver(e.id).then(i=>{n===this.resolveToken&&i&&(this.addressEl.textContent=i)}).catch(()=>{})}}row(e,t){const r=document.createElement("div");Object.assign(r.style,{display:"flex",justifyContent:"space-between",gap:"16px"});const n=document.createElement("span");n.textContent=e,n.style.opacity="0.7";const i=document.createElement("span");return i.textContent=t,i.style.textAlign="right",r.appendChild(n),r.appendChild(i),r}buildPanel(){const e=document.createElement("div");Object.assign(e.style,{position:"absolute",top:"20px",left:"20px",zIndex:"600",minWidth:"240px",maxWidth:"320px",background:"rgba(20, 24, 30, 0.92)",color:"#fff",fontFamily:"system-ui, sans-serif",fontSize:"13px",lineHeight:"1.5",padding:"14px 16px",borderRadius:"8px",boxShadow:"0 4px 20px rgba(0,0,0,0.45)",display:"none"});const t=document.createElement("div");t.textContent="×",Object.assign(t.style,{position:"absolute",top:"8px",right:"12px",cursor:"pointer",fontSize:"18px",opacity:"0.7"}),t.addEventListener("click",()=>this.clearSelection()),e.appendChild(t);const r=document.createElement("div");r.textContent="Address",Object.assign(r.style,{fontWeight:"600",opacity:"0.7",marginBottom:"2px"}),e.appendChild(r);const n=document.createElement("div");Object.assign(n.style,{fontWeight:"600",marginBottom:"10px",wordBreak:"break-word"}),e.appendChild(n);const i=document.createElement("div");return Object.assign(i.style,{display:"flex",flexDirection:"column",gap:"4px"}),e.appendChild(i),{panel:e,addressEl:n,bodyEl:i}}destruct(){var e,t;(e=this.indexRT)==null||e.destruct(),(t=this.readbackBuffer)==null||t.destroy(),this.panel.remove()}}const Ro="https://nominatim.openstreetmap.org/reverse",Lo=1100;let mn=0;const vt=new Map;function Bo(c,e){const t=c.road??c.pedestrian??c.footway??c.square??c.neighbourhood,r=c.house_number,n=c.city??c.town??c.village??c.municipality??c.state,i=[c.building??c.amenity??c.tourism,t?[t,r].filter(Boolean).join(" "):""].filter(Boolean).join(", "),s=[c.postcode,n].filter(Boolean).join(" ");return[i,s,c.country].filter(Boolean).join(", ")||e}async function Io(c){const e=c.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);if(!e)return null;const t=`${e[1]},${e[2]}`;if(vt.has(t))return vt.get(t);const r=mn+Lo-performance.now();r>0&&await new Promise(s=>setTimeout(s,r)),mn=performance.now();const n=typeof navigator<"u"&&navigator.language||"en",i=`${Ro}?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(e[1])}&lon=${encodeURIComponent(e[2])}&accept-language=${encodeURIComponent(n)}`;try{const s=await fetch(i);if(!s.ok)return null;const o=await s.json();if(!o||o.error)return vt.set(t,null),null;const l=Bo(o.address??{},o.display_name??"");return vt.set(t,l||null),l||null}catch{return null}}class Do{constructor(e,t,r){a(this,"overlay");a(this,"pendingPick",null);a(this,"inverseViewProjection",new F);this.renderer=e,this.onPicked=r,this.overlay=new _o(e,t),this.overlay.setAddressResolver(Io),this.listen()}get selectedID(){return this.overlay.selectedID}clearSelection(){this.overlay.clearSelection()}listen(){const e=this.renderer.canvas;let t=0,r=0,n=0;e.addEventListener("pointerdown",i=>{t=i.clientX,r=i.clientY,n=performance.now()}),e.addEventListener("pointerup",i=>{const s=Math.hypot(i.clientX-t,i.clientY-r),o=performance.now()-n;if(s>6||o>500)return;const l=e.getBoundingClientRect();this.pendingPick={x:(i.clientX-l.left)/l.width,y:(i.clientY-l.top)/l.height}})}update(e,t,r){if(!this.pendingPick)return;const{x:n,y:i}=this.pendingPick;this.pendingPick=null;const s=F.invert(e,this.inverseViewProjection).m,o=n*2-1,l=1-i*2,h=.5,u=s[3]*o+s[7]*l+s[11]*h+s[15],d=new S((s[0]*o+s[4]*l+s[8]*h+s[12])/u,(s[1]*o+s[5]*l+s[9]*h+s[13])/u,(s[2]*o+s[6]*l+s[10]*h+s[14])/u),f=S.subtract(d,t),m=r.pickBuilding(t,f);this.overlay.select(m,r.lookupBuilding(m)),this.onPicked()}destruct(){this.overlay.destruct()}}const gn=2,Fo=.05,zo=1.5,bn=100,xn=1<<20,Oo=1<<21;function st(c,e){return(c+xn)*Oo+(e+xn)}class No{constructor(){a(this,"metersToNorm",1);a(this,"snapCell",gn);a(this,"spawnCell",bn);a(this,"snapGrid",new Map);a(this,"spawnGrid",new Map);a(this,"tileEdges",new Map);a(this,"maxCellLength",0);a(this,"version",0)}setMetersToNorm(e){e!==this.metersToNorm&&(this.clear(),this.metersToNorm=e,this.snapCell=gn*e,this.spawnCell=bn*e)}clear(){for(const e of this.tileEdges.values())for(const t of e)t.alive=!1;this.snapGrid.clear(),this.spawnGrid.clear(),this.tileEdges.clear(),this.maxCellLength=0,this.version++}addTile(e,t){this.tileEdges.has(e)&&this.removeTile(e);const r=[],n=this.metersToNorm;let i=0;for(;i+nn<=t.length;){const s=t[i],o=t[i+1]*n,l=t[i+2]*n,h=t[i+3]!==0,u=i+nn;i=u+s*2;let d=null;for(let f=0;f<s;f++){const m=f===0||f===s-1,p=this.getNode(t[u+f*2],-t[u+f*2+1],(m?zo:Fo)*n);if(d&&p!==d){const x=this.addEdge(d,p,o,l,h);x&&r.push(x)}d=p}}this.tileEdges.set(e,r),this.version++}removeTile(e){const t=this.tileEdges.get(e);if(!t)return;this.tileEdges.delete(e);const r=new Set,n=new Set;for(const i of t){i.alive=!1,n.add(i.a),n.add(i.b);const s=this.spawnGrid.get(i.cellKey);s&&(s.length-=i.length,r.add(i.cellKey))}for(const i of n){if(i.edges=i.edges.filter(l=>l.alive),i.edges.length>0)continue;const s=this.snapGrid.get(i.snapKey);if(!s)continue;const o=s.indexOf(i);o>=0&&s.splice(o,1),s.length===0&&this.snapGrid.delete(i.snapKey)}for(const i of r){const s=this.spawnGrid.get(i);s.edges=s.edges.filter(o=>o.alive),s.edges.length===0&&this.spawnGrid.delete(i)}this.version++}lengthWithin(e,t,r){const n=this.spawnCell,i=Math.floor((e-r)/n),s=Math.floor((e+r)/n),o=Math.floor((t-r)/n),l=Math.floor((t+r)/n),h=r*r;let u=0;for(let d=i;d<=s;d++)for(let f=o;f<=l;f++){const m=this.spawnGrid.get(st(d,f));if(!m)continue;const p=(d+.5)*n-e,x=(f+.5)*n-t;p*p+x*x<=h&&(u+=m.length)}return u}sampleEdge(e,t,r,n=24){if(this.maxCellLength<=0)return null;const i=this.spawnCell;for(let s=0;s<n;s++){const o=r*Math.sqrt(Math.random()),l=Math.random()*Math.PI*2,h=this.spawnGrid.get(st(Math.floor((e+Math.cos(l)*o)/i),Math.floor((t+Math.sin(l)*o)/i)));if(!h||h.length<=0||Math.random()*this.maxCellLength>h.length)continue;let u=Math.random()*h.length;for(const d of h.edges)if(u-=d.length,u<=0)return d;return h.edges[h.edges.length-1]??null}return null}getNode(e,t,r){const n=this.snapCell,i=Math.floor(e/n),s=Math.floor(t/n);let o=null,l=r*r;const h=Math.floor((e-r)/n),u=Math.floor((e+r)/n),d=Math.floor((t-r)/n),f=Math.floor((t+r)/n);for(let b=h;b<=u;b++)for(let g=d;g<=f;g++){const y=this.snapGrid.get(st(b,g));if(y)for(const v of y){const w=(v.x-e)*(v.x-e)+(v.z-t)*(v.z-t);w<=l&&(l=w,o=v)}}if(o)return o;const m=st(i,s),p={x:e,z:t,edges:[],snapKey:m};let x=this.snapGrid.get(m);return x||this.snapGrid.set(m,x=[]),x.push(p),p}addEdge(e,t,r,n,i){const s=t.x-e.x,o=t.z-e.z,l=Math.hypot(s,o);if(l<1e-9)return null;const h=this.spawnCell,u=st(Math.floor((e.x+t.x)*.5/h),Math.floor((e.z+t.z)*.5/h)),d={a:e,b:t,length:l,dx:s/l,dz:o/l,width:r,speed:n,oneway:i,alive:!0,cellKey:u};e.edges.push(d),t.edges.push(d);let f=this.spawnGrid.get(u);return f||this.spawnGrid.set(u,f={edges:[],length:0}),f.edges.push(d),f.length+=l,this.maxCellLength=Math.max(this.maxCellLength,f.length),d}}const Vo=`// The cars of CarTraffic, drawn over the finished image of MapWorld (after the TAA and the SSAO, before the\r
// tilt-shift) into a layer of their own, which carLayerComposite.wgsl blends over it. Nothing else of the frame\r
// sees them: not the gBuffer, the lightmap, the shadow map, the SSAO or the TAA, which all keep converging.\r
//\r
// Without SHADOW: the cars as boxes (a body and a cabin), shaded like deferredShading.wgsl: the sun with the VSM\r
// cascades (the buildings shadow the cars), the sky visibility of the ground under them (the lightmap) in place of\r
// their own, the fog and the contrast. With SHADOW: a quad on the ground under each car, drawn first, that darkens what\r
// is under it: the shadow the car casts in the sun (a ray to the sun through the box) and a contact occlusion around\r
// it. Its alpha is how much darker, the color the fog's light it keeps, so the layer blends over the image as\r
// premultiplied alpha.\r
// The buildings shadow the cars (SUN_SHADOWS) through the VSM cascades, or rays to the center of the sun through the\r
// city: hard, as no TAA averages the cars. The rays and the sky visibility of the ground are per car (carLight, see\r
// carLighting.wgsl), interpolated over the vertices. With PER_PIXEL (the high quality) they are per fragment instead: a\r
// ray to the sun and a lookup of the lightmap at the ground under each pixel of a car and of a shadow quad, without the\r
// carLighting.wgsl pass. Needs skyVisibilityTrace.wgsl then.\r
//\r
// The buildings in front: the cars are not in the depth of the gBuffer, so each fragment compares its camera distance\r
// with the one of the gBuffer at its pixel and is dropped behind it (a depth test per pixel, not per sample: the\r
// edge of a building over a car is not anti aliased, the edges of the cars themselves are, by the MSAA of the layer).\r
// The depth of the layer orders the cars among themselves.\r
\r
struct Uniforms {\r
  // without the jitter of the TAA, the image the cars go over is the resolved one\r
  viewProjection : mat4x4<f32>,\r
  // of the camera the gBuffer was drawn with, for getGBufferDistance\r
  inverseProjection : mat4x4<f32>,\r
  // the sun's view of the ground for the rays (SUN_SHADOWS 2), see terrainSun.wgsl\r
  terrainSunViewProjection : mat4x4<f32>,\r
  cameraPosition : vec3<f32>,\r
  resolution : vec2<f32>,\r
  depthParams : vec2<f32>,\r
  // the height of the bottom of the cars and of the shadow quads over the ground under them (Car.ground)\r
  groundY : f32,\r
  shadowY : f32,\r
  // the margin of the contact occlusion around a car, and how dark it is\r
  aoMargin : f32,\r
  aoStrength : f32,\r
  // how dark the shadow of a car is, times the sun it takes away\r
  carShadowStrength : f32,\r
  // the shading params of MapWorld, by name\r
  lightDirection : vec3<f32>,\r
  skyColor : vec3<f32>,\r
  sunColor : vec3<f32>,\r
  backgroundColor : vec3<f32>,\r
  distanceFog : f32,\r
  // where the fog is 1, see getFog\r
  viewDistanceMax : f32,\r
  contrast : f32,\r
  shadowStrength : f32,\r
  VSMBleedThreshold : f32,\r
  varianceMin : f32,\r
  shadowDebug : u32,\r
  // the sky visibility lightmap, see SkyVisibilityLightmap.setResolveUniforms\r
  lightmapEnabled : u32,\r
  stochasticLevel : u32,\r
  pixelSize : f32,\r
  pixelScale : f32,\r
  texelsPerPixel : f32,\r
  texelSizeMin : f32,\r
  levelAngle : f32,\r
  blurSlope : f32,\r
  blurMax : f32,\r
  blurTexelScale : f32,\r
  searchCount : u32,\r
  accumulationMax : f32,\r
  ancestorWeight : f32,\r
  levelBlend : f32,\r
  atlasStep : f32,\r
  lightmapHalfRes : u32,\r
  // how far a point goes off its surface before it is compared with terrainSunMap, see getTerrainSunShadow\r
  terrainSunOffset : f32,\r
#ifdef PER_PIXEL\r
  // the city of the rays, see CityScene.bind\r
  cityTileCount : u32,\r
  cityRoot : u32,\r
#endif\r
};\r
\r
// where the sun shadows of the buildings on the cars come from: 0 none, 1 the VSM cascades, 2 rays, see getSunShadow\r
override SUN_SHADOWS : u32 = 1u;\r
\r
struct ShadowMapData {\r
  shadowMapViewProjection : mat4x4<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var shadowMapSampler : sampler;\r
// the 4 cascades, one layer each (ShadowMap.cascadeTexture)\r
@group(0) @binding(2) var shadowMaps : texture_2d_array<f32>;\r
@group(0) @binding(6) var<storage, read> shadowMapData : array<ShadowMapData>;\r
@group(0) @binding(7) var<storage, read> tileBuffer : array<u32>;\r
@group(0) @binding(8) var<storage, read> lightingBuffer : array<u32>;\r
@group(0) @binding(9) var gBufferDepth : texture_depth_2d;\r
// 3 per car: (x, z, heading x, heading z), (half length, half width, height, type), (ground, slope, 0, 0), see CarTraffic\r
@group(0) @binding(10) var<storage, read> cars : array<vec4<f32>>;\r
// the ground as the sun sees it (TerrainSunMap.ts): the hills, which the rays don't trace, see terrainSun.wgsl\r
@group(0) @binding(13) var terrainSunMap : texture_2d<f32>;\r
#ifdef PER_PIXEL\r
// the buildings and trees of the rays, see CityScene and skyVisibilityTrace.wgsl\r
@group(0) @binding(11) var<storage, read> cityBuffer : array<vec4<f32>>;\r
#else\r
// the light of each car: the sun at the corners of its roof and the sky of the ground under it, see carLighting.wgsl\r
@group(0) @binding(12) var<storage, read> carLight : array<vec2<u32>>;\r
#endif\r
\r
// the car types, see CarTraffic: a car has a body and a cabin, a van or a bus is one box\r
const TYPE_CAR = 0u;\r
\r
// the paint of all cars and the windows, before they are squared like the palette of the gBuffer\r
const PAINT = vec3(.78, .78, .79);\r
const GLASS = vec3(.10, .12, .14);\r
\r
struct Car {\r
  center : vec2<f32>,\r
  // the unit heading (along the length) and the right side (along the width), in xz\r
  u : vec2<f32>,\r
  v : vec2<f32>,\r
  halfLength : f32,\r
  halfWidth : f32,\r
  height : f32,\r
  kind : u32,\r
  // the height of the ground under the center (world units) and its rise per world unit along u: the car is sheared\r
  // along it, its bottom on the line of the road\r
  ground : f32,\r
  slope : f32,\r
};\r
\r
fn loadCar(i : u32) -> Car {\r
  let a = cars[i * 3u];\r
  let b = cars[i * 3u + 1u];\r
  let c = cars[i * 3u + 2u];\r
  return Car(a.xy, a.zw, vec2(-a.w, a.z), b.x, b.y, b.z, u32(b.w), c.x, c.y);\r
}\r
\r
// --- Variance shadow map sampling, as in deferredShading.wgsl -----------------\r
\r
fn shadowUVDepthStrength(p : vec3<f32>, i : u32) -> vec4<f32> {\r
  let screen = shadowMapData[i].shadowMapViewProjection * vec4<f32>(p, 1.0);\r
  let uv = screen.xy / screen.w;\r
  let depth = -p.y;\r
  let s2 = vec2<f32>(1.) - smoothstep(vec2<f32>(0.4), vec2<f32>(1.0), abs(uv));\r
  return vec4<f32>(uv, depth, min(s2.x, s2.y));\r
}\r
\r
fn sampleShadowMoments(i : u32, uv : vec2<f32>) -> vec2<f32> {\r
  return textureSampleLevel(shadowMaps, shadowMapSampler, uv, i, 0.0).xy;\r
}\r
\r
fn shadowCascade(uv : vec2<f32>, i : u32, dist : f32) -> f32 {\r
  var shadowMapUV = uv * 0.5 + 0.5;\r
  shadowMapUV.y = 1.0 - shadowMapUV.y;\r
  let moments = sampleShadowMoments(i, shadowMapUV);\r
  let lit = step(dist, moments.x);\r
  var variance = moments.y - moments.x * moments.x;\r
  variance = max(variance, uniforms.varianceMin * uniforms.varianceMin);\r
  let d = dist - moments.x;\r
  let s = variance / (variance + d * d);\r
  return smoothstep(uniforms.VSMBleedThreshold, 1.0, max(lit, s));\r
}\r
\r
// how many texels of a cascade a point goes off its surface along its normal before the lookup: the ground at a low sun\r
// spans many texels along the sun (tens of meters each in the far cascades), its own heights in them would shadow it\r
const SHADOW_NORMAL_OFFSET = 1.5;\r
\r
// the size of a texel of cascade i in world units: its half-extent is 1 over the length of the first row of its matrix\r
fn shadowTexelSize(i : u32) -> f32 {\r
  let m = shadowMapData[i].shadowMapViewProjection;\r
  return 2.0 / (f32(textureDimensions(shadowMaps).x) * length(vec3<f32>(m[0].x, m[1].x, m[2].x)));\r
}\r
\r
// The cascades front to back, each taking its weight (1 inside, fading out over its edge) of what the ones before it\r
// left. Each cascade is re-rendered around a center of its own, so the next one need not cover the edge of the one\r
// before it: that point goes on to the first one that does. What no cascade covers is lit, so past the last cascade the\r
// shadows fade out instead of ending at a hard edge.\r
fn getShadowMap(p : vec3<f32>, n : vec3<f32>) -> f32 {\r
  var shadow = 0.0;\r
  var remaining = 1.0;\r
  for (var i = 0u; i < 4u; i++) {\r
    let u = shadowUVDepthStrength(p + n * (SHADOW_NORMAL_OFFSET * shadowTexelSize(i)), i);\r
    if (u.w > 0.0) {\r
      shadow += remaining * u.w * shadowCascade(u.xy, i, u.z);\r
      remaining *= 1.0 - u.w;\r
      if (remaining <= 0.0) {\r
        break;\r
      }\r
    }\r
  }\r
  return shadow + remaining;\r
}\r
\r
// --- shared --------------------------------------------------------------------\r
\r
// the sun the point p gets, 0 to 1, see SUN_SHADOWS. raySun: the rays of carLighting.wgsl at p, interpolated (not\r
// used with PER_PIXEL: a ray from p, off the surface along its normal n by a part of its camera distance d, as the rays\r
// of the deferred shading)\r
fn getSunShadow(p : vec3<f32>, n : vec3<f32>, d : f32, raySun : f32) -> f32 {\r
  if (SUN_SHADOWS == 0u) {\r
    return 1.;\r
  }\r
  if (SUN_SHADOWS == 2u) {\r
#ifdef PER_PIXEL\r
    return select(1., 0., isOccluded(p + n * (d * 1e-4), uniforms.lightDirection)) * getTerrainSunShadow(p, n);\r
#else\r
    return raySun * getTerrainSunShadow(p, n);\r
#endif\r
  }\r
  return getShadowMap(p, n);\r
}\r
\r
#ifdef PER_PIXEL\r
\r
// The sky visibility of the ground at p (its xz) at the height groundY, as the deferred shading lights the ground there.\r
// Without the lightmap or a texel there: an open sky, as the sky term of the shading\r
fn getGroundSky(p : vec3<f32>, groundY : f32) -> f32 {\r
  if (uniforms.lightmapEnabled == 0u) {\r
    return 1.;\r
  }\r
  let g = vec3(p.x, groundY, p.z);\r
  let l = getLightmapLighting(getGroundSurface(g), getLevel(g, vec3(0., 1., 0.)));\r
  return select(1., l.x, l.w > 0.);\r
}\r
\r
#else\r
\r
// The light of a car (carLighting.wgsl): the sun at the 4 corners of its roof and the sky visibility of the ground under\r
// it, as the deferred shading lights the ground there\r
fn loadCarLight(i : u32) -> vec2<u32> {\r
  return carLight[i];\r
}\r
\r
fn getCarSky(light : vec2<u32>) -> f32 {\r
  return bitcast<f32>(light.y);\r
}\r
\r
// the sun of the corners at car space x (along the length, -1 to 1) and z (along the width)\r
fn getCarSun(light : vec2<u32>, x : f32, z : f32) -> f32 {\r
  let corners = unpack4x8unorm(light.x);\r
  let along = saturate(x * .5 + .5);\r
  return mix(mix(corners.x, corners.y, along), mix(corners.z, corners.w, along), saturate(z * .5 + .5));\r
}\r
\r
#endif\r
\r
// The pixel is behind the gBuffer surface there (a building in front): the cars aren't in its depth. d: the camera\r
// distance of the fragment\r
fn isHidden(position : vec4<f32>, d : f32) -> bool {\r
  let coord = vec2<u32>(position.xy);\r
  let uv = (vec2<f32>(coord) + .5) / uniforms.resolution;\r
  let gd = getGBufferDistance(textureLoad(gBufferDepth, coord, 0), uv, uniforms.inverseProjection, uniforms.depthParams);\r
  // the sky is 0: nothing in front\r
  return gd > 0.0 && gd < d * (1.0 - 2e-4);\r
}\r
\r
// The distance fog: exponential (distanceFog per world unit), with a smoothstep from .7 of viewDistanceMax that takes\r
// it to 1 at viewDistanceMax, where the loaded map ends (see MapWorld.viewDistanceMax). 0 (not set): only the exp.\r
// d is the horizontal (xz) distance to the camera, not the 3d one: the map is loaded in a radius around the camera in\r
// xz, and a camera that goes up and looks down gets no more fog (the far plane reaches past it, see\r
// MapWorld.applyViewDistanceMax).\r
// The same in deferredShading.wgsl, cars.wgsl, reprojectedSSAOComposite.wgsl and osm/shading.wgsl.\r
fn getFog(d : f32) -> f32 {\r
  let end = select(1., 1. - smoothstep(.7 * uniforms.viewDistanceMax, uniforms.viewDistanceMax, d), uniforms.viewDistanceMax > 0.);\r
  return 1. - exp(-d * uniforms.distanceFog) * end;\r
}\r
\r
fn finish(linear : vec3<f32>, d : f32) -> vec3<f32> {\r
  var c = sqrt(max(linear, vec3(0.)));\r
  // the contrast before the fog, like deferredShading.wgsl\r
  c = mix(c, smoothstep(vec3<f32>(0.), vec3<f32>(1.), c), uniforms.contrast);\r
  return mix(c, uniforms.backgroundColor, getFog(d));\r
}\r
\r
fn luminance(c : vec3<f32>) -> f32 {\r
  return dot(c, vec3(.2126, .7152, .0722));\r
}\r
\r
// the corner of the 6 of a quad, 0 to 1\r
fn quadCorner(i : u32) -> vec2<f32> {\r
  var corners = array<vec2<f32>, 6>(vec2(0., 0.), vec2(1., 0.), vec2(1., 1.), vec2(0., 0.), vec2(1., 1.), vec2(0., 1.));\r
  return corners[i];\r
}\r
\r
#ifdef SHADOW\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) world : vec3<f32>,\r
  @location(1) @interpolate(flat) car : u32,\r
#ifndef PER_PIXEL\r
  // the sun on the car (the average of its corners) and the sky of the ground under it, see loadCarLight\r
  @location(2) @interpolate(flat) sun : f32,\r
  @location(3) @interpolate(flat) sky : f32,\r
#endif\r
};\r
\r
// The sun direction for the shadow of a car: toward the sun, raised to at least this, so a low sun doesn't throw a\r
// shadow longer than about 5 times the height\r
const SUN_Y_MIN = .2;\r
\r
fn getSun() -> vec3<f32> {\r
  let l = uniforms.lightDirection;\r
  return normalize(vec3(l.x, max(l.y, SUN_Y_MIN), l.z));\r
}\r
\r
@vertex\r
fn vs_main(@builtin(vertex_index) vertexIndex : u32, @builtin(instance_index) instance : u32) -> VertexOutput {\r
  let car = loadCar(instance);\r
  let l = getSun();\r
  // where the shadow of the top falls, in car space (along the length, along the width)\r
  let offset = -l.xz * (car.height / l.y);\r
  let o = vec2(dot(offset, car.u), dot(offset, car.v));\r
  let halfSize = vec2(car.halfLength, car.halfWidth);\r
  let lo = min(-halfSize, o - halfSize) - uniforms.aoMargin;\r
  let hi = max(halfSize, o + halfSize) + uniforms.aoMargin;\r
  let q = mix(lo, hi, quadCorner(vertexIndex));\r
  let xz = car.center + car.u * q.x + car.v * q.y;\r
  var output : VertexOutput;\r
  output.world = vec3(xz.x, car.ground + q.x * car.slope + uniforms.shadowY, xz.y);\r
  output.position = uniforms.viewProjection * vec4(output.world, 1.);\r
  output.car = instance;\r
#ifndef PER_PIXEL\r
  let light = loadCarLight(instance);\r
  output.sun = dot(unpack4x8unorm(light.x), vec4(.25));\r
  output.sky = getCarSky(light);\r
#endif\r
  return output;\r
}\r
\r
// The part of the ray from the ground point q (car space: x along the length, y up from the bottom, z along the\r
// width) to the sun l that is in the box of the car, in world units: 0 when it misses\r
fn getSunOcclusion(q : vec3<f32>, l : vec3<f32>, car : Car) -> f32 {\r
  let boxMin = vec3(-car.halfLength, 0., -car.halfWidth);\r
  let boxMax = vec3(car.halfLength, car.height, car.halfWidth);\r
  let inv = 1. / select(l, vec3(1e-6), abs(l) < vec3(1e-6));\r
  let t0 = (boxMin - q) * inv;\r
  let t1 = (boxMax - q) * inv;\r
  let tNear = max(max(max(min(t0.x, t1.x), min(t0.y, t1.y)), min(t0.z, t1.z)), 0.);\r
  let tFar = min(min(max(t0.x, t1.x), max(t0.y, t1.y)), max(t0.z, t1.z));\r
  return max(tFar - tNear, 0.);\r
}\r
\r
// the distance from q to the footprint of the car, 0 inside it\r
fn getFootprintDistance(q : vec2<f32>, car : Car) -> f32 {\r
  let d = abs(q) - vec2(car.halfLength, car.halfWidth);\r
  return length(max(d, vec2(0.)));\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  let d = distance(input.world, uniforms.cameraPosition);\r
  if (isHidden(input.position, d)) {\r
    discard;\r
  }\r
  let car = loadCar(input.car);\r
  let p = input.world;\r
  let rel = p.xz - car.center;\r
  let q = vec2(dot(rel, car.u), dot(rel, car.v));\r
\r
  let l = getSun();\r
  let sunLocal = vec3(dot(l.xz, car.u), l.y, dot(l.xz, car.v));\r
  // soft at the edge, where the ray only grazes the box\r
  let sunShadow = saturate(getSunOcclusion(vec3(q.x, uniforms.groundY - uniforms.shadowY, q.y), sunLocal, car) / (car.halfWidth * .5));\r
  let ao = 1. - smoothstep(0., uniforms.aoMargin, getFootprintDistance(q, car));\r
#ifdef PER_PIXEL\r
  // nothing to darken (most of the quad under a low sun): no ray or lookup\r
  if (sunShadow == 0. && ao == 0.) {\r
    return vec4(0.);\r
  }\r
#endif\r
\r
  // the ground lit as the deferred shading lights it (its albedo cancels): the sun the car takes away and the sky\r
  // the occlusion takes away, as a part of the light there\r
#ifdef PER_PIXEL\r
  let raySun = 1.;\r
  let sky = getGroundSky(p, p.y - (uniforms.shadowY - uniforms.groundY));\r
#else\r
  let raySun = input.sun;\r
  let sky = input.sky;\r
#endif\r
  var sunLight = 0.;\r
  if (uniforms.lightDirection.y > 0.) {\r
    sunLight = luminance(uniforms.sunColor * uniforms.sunColor) * uniforms.lightDirection.y *\r
      mix(1., getSunShadow(p, vec3(0., 1., 0.), d, raySun), uniforms.shadowStrength);\r
  }\r
  let skyLight = luminance(uniforms.skyColor * uniforms.skyColor) * sky;\r
  let lit = sunLight + skyLight;\r
  let left = sunLight * (1. - sunShadow * uniforms.carShadowStrength) + skyLight * (1. - ao * uniforms.aoStrength);\r
  // after the sqrt of the shading. The image there is mix(ground, backgroundColor, fog): only the ground part darkens,\r
  // the fog keeps its light. ground * keep mixed with the fog = image * keep + fog * backgroundColor * (1 - keep), the\r
  // premultiplied blend of this color and alpha\r
  let keep = sqrt(select(1., left / lit, lit > 0.));\r
  let fog = getFog(distance(input.world.xz, uniforms.cameraPosition.xz));\r
  return vec4(fog * uniforms.backgroundColor * (1. - keep), 1. - keep);\r
}\r
\r
#else\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
  @location(0) world : vec3<f32>,\r
  @location(1) @interpolate(flat) normal : vec3<f32>,\r
  @location(2) @interpolate(flat) albedo : vec3<f32>,\r
  // the height above the bottom of the car, as a part of its height\r
  @location(3) height : f32,\r
  // 1 on the windows\r
  @location(4) @interpolate(flat) glass : f32,\r
  // the height of the ground under the vertex\r
  @location(7) ground : f32,\r
#ifndef PER_PIXEL\r
  // the sun of the corners of the roof at the vertex and the sky of the ground under the car, see loadCarLight\r
  @location(5) sun : f32,\r
  @location(6) @interpolate(flat) sky : f32,\r
#endif\r
};\r
\r
// the outward normal of the 5 faces of a box (no bottom), and the 2 axes along the face, cross(a, b) = normal so its\r
// triangles wind counter clockwise seen from outside\r
fn faceNormal(face : u32) -> vec3<f32> {\r
  var n = array<vec3<f32>, 5>(vec3(1., 0., 0.), vec3(-1., 0., 0.), vec3(0., 0., 1.), vec3(0., 0., -1.), vec3(0., 1., 0.));\r
  return n[face];\r
}\r
\r
fn faceAxisA(face : u32) -> vec3<f32> {\r
  var a = array<vec3<f32>, 5>(vec3(0., 1., 0.), vec3(0., 0., 1.), vec3(1., 0., 0.), vec3(0., 1., 0.), vec3(0., 0., 1.));\r
  return a[face];\r
}\r
\r
fn faceAxisB(face : u32) -> vec3<f32> {\r
  var b = array<vec3<f32>, 5>(vec3(0., 0., 1.), vec3(0., 1., 0.), vec3(0., 1., 0.), vec3(1., 0., 0.), vec3(1., 0., 0.));\r
  return b[face];\r
}\r
\r
// 30 vertices per box, 2 boxes per car: the body and the cabin (empty for a van or a bus)\r
@vertex\r
fn vs_main(@builtin(vertex_index) vertexIndex : u32, @builtin(instance_index) instance : u32) -> VertexOutput {\r
  let car = loadCar(instance);\r
  let boxIndex = vertexIndex / 30u;\r
  let face = (vertexIndex % 30u) / 6u;\r
  let corner = quadCorner(vertexIndex % 6u) * 2. - 1.;\r
  let n = faceNormal(face);\r
  // the corner in a box of -1 to 1, y 0 to 1\r
  let c = n + faceAxisA(face) * corner.x + faceAxisB(face) * corner.y;\r
  let unitPos = vec3(c.x, c.y * .5 + .5, c.z);\r
\r
  // the box in car space: its center along the length, its half length, the bottom and top (parts of the height) and\r
  // its half width (part of the half width)\r
  var boxCenter = 0.;\r
  var halfLength = 1.;\r
  var bottom = 0.;\r
  var top = 1.;\r
  var halfWidth = 1.;\r
  let isCar = car.kind == TYPE_CAR;\r
  if (boxIndex == 0u) {\r
    top = select(1., .55, isCar);\r
  } else {\r
    boxCenter = -.12;\r
    halfLength = select(0., .52, isCar);\r
    bottom = .55;\r
    halfWidth = .88;\r
  }\r
  let carPos = vec3(\r
    (boxCenter + unitPos.x * halfLength) * car.halfLength,\r
    mix(bottom, top, unitPos.y) * car.height,\r
    unitPos.z * halfWidth * car.halfWidth,\r
  );\r
  let xz = car.center + car.u * carPos.x + car.v * carPos.z;\r
\r
  var output : VertexOutput;\r
  // sheared along the slope: the vertical faces stay vertical, the normal of the shear is (n.x - slope * n.y, n.y, n.z)\r
  output.ground = car.ground + carPos.x * car.slope + uniforms.groundY;\r
  output.world = vec3(xz.x, output.ground + carPos.y, xz.y);\r
  output.position = uniforms.viewProjection * vec4(output.world, 1.);\r
  let ns = normalize(vec3(n.x - car.slope * n.y, n.y, n.z));\r
  let nxz = car.u * ns.x + car.v * ns.z;\r
  output.normal = vec3(nxz.x, ns.y, nxz.y);\r
  // the sides of the cabin are the windows\r
  let glass = boxIndex == 1u && face < 4u;\r
  output.albedo = select(PAINT, GLASS, glass);\r
  output.glass = select(0., 1., glass);\r
  output.height = carPos.y / max(car.height, 1e-9);\r
#ifndef PER_PIXEL\r
  let light = loadCarLight(instance);\r
  output.sun = getCarSun(light, carPos.x / max(car.halfLength, 1e-9), carPos.z / max(car.halfWidth, 1e-9));\r
  output.sky = getCarSky(light);\r
#endif\r
  return output;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  let d = distance(input.world, uniforms.cameraPosition);\r
  if (isHidden(input.position, d)) {\r
    discard;\r
  }\r
  let p = input.world;\r
  let n = input.normal;\r
  let l = uniforms.lightDirection;\r
  let nDotL = max(dot(n, l), 0.0);\r
  let skyColor = uniforms.skyColor * uniforms.skyColor;\r
  let sunColor = uniforms.sunColor * uniforms.sunColor;\r
  let albedo = input.albedo * input.albedo;\r
#ifdef PER_PIXEL\r
  let raySun = 1.;\r
  let groundSky = getGroundSky(p, input.ground);\r
#else\r
  let raySun = input.sun;\r
  let groundSky = input.sky;\r
#endif\r
  var shadow = 1.0;\r
  if (nDotL > 0.0) {\r
    shadow = mix(1.0, getSunShadow(p, n, d, raySun), uniforms.shadowStrength);\r
  }\r
  // the sides get less of the sky lower down: the ground and the cars around them\r
  let occlusion = mix(.55, 1., saturate(input.height * 1.6));\r
  let sky = groundSky * (n.y * .5 + .5) * occlusion;\r
  var c = albedo * (sunColor * (nDotL * shadow) + skyColor * sky);\r
  // the windows reflect the sky a little\r
  c += input.glass * .12 * skyColor * sky;\r
  return vec4(finish(c, distance(input.world.xz, uniforms.cameraPosition.xz)), 1.0);\r
}\r
\r
#endif\r
`,Uo=`// The light of each car of CarTraffic, every frame before they're drawn: cars.wgsl reads it per vertex instead of tracing\r
// a ray and looking up the lightmap per fragment (per pixel of every car and shadow quad). 4 threads per car, a ray each,\r
// so the long rays of a low sun run side by side instead of one after the other. A car out of view (most of them: they\r
// live in a radius around the pivot) gets no ray or lookup.\r
// Out per car, carLight (2 words):\r
// x: the sun at the 4 corners of its roof (pack4x8unorm; back left, front left, back right, front right: along the\r
//    length, then the width), which the vertices of the car interpolate. With SUN_SHADOWS 2 a ray each to the center of\r
//    the sun through the city (isOccluded of skyVisibilityTrace.wgsl), hard; else 1 (cars.wgsl takes the shadow map or\r
//    nothing)\r
// y: the sky visibility of the ground under its center (f32 bits), as the deferred shading lights\r
//    the ground there: the lightmap, or an open sky (1) without it or a texel there\r
// Needs the includes of the lightmap resolve (SkyVisibilityLightmap.resolveIncludes) and skyVisibilityTrace.wgsl\r
\r
struct Uniforms {\r
  // see getLevel of cityLightmap.wgsl\r
  viewProjection : mat4x4<f32>,\r
  cameraPosition : vec3<f32>,\r
  // toward the sun\r
  lightDirection : vec3<f32>,\r
  // the height of the bottom of the cars over the ground under them\r
  groundY : f32,\r
  carCount : u32,\r
  // the sky visibility lightmap, see SkyVisibilityLightmap.setResolveUniforms. Not all are used here\r
  lightmapEnabled : u32,\r
  stochasticLevel : u32,\r
  pixelSize : f32,\r
  pixelScale : f32,\r
  texelsPerPixel : f32,\r
  texelSizeMin : f32,\r
  levelAngle : f32,\r
  blurSlope : f32,\r
  blurMax : f32,\r
  blurTexelScale : f32,\r
  searchCount : u32,\r
  accumulationMax : f32,\r
  ancestorWeight : f32,\r
  levelBlend : f32,\r
  atlasStep : f32,\r
  lightmapHalfRes : u32,\r
  // the city of the rays, see CityScene.bind\r
  cityTileCount : u32,\r
  cityRoot : u32,\r
};\r
\r
// where the sun shadows of the buildings on the cars come from, see cars.wgsl: only 2 (rays) is done here\r
override SUN_SHADOWS : u32 = 1u;\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
@group(0) @binding(1) var<storage, read> tileBuffer : array<u32>;\r
@group(0) @binding(2) var<storage, read> lightingBuffer : array<u32>;\r
// 3 per car, see loadCar in cars.wgsl\r
@group(0) @binding(3) var<storage, read> cars : array<vec4<f32>>;\r
// the buildings and trees of the rays, see CityScene and skyVisibilityTrace.wgsl\r
@group(0) @binding(4) var<storage, read> cityBuffer : array<vec4<f32>>;\r
@group(0) @binding(5) var<storage, read_write> carLight : array<vec2<u32>>;\r
\r
// the threads of a workgroup, 4 per car\r
const GROUP_SIZE = 64u;\r
// a car whose center is this far outside the screen (in parts of its half size) still counts as in view: its body and\r
// its shadow reach in\r
const VIEW_MARGIN = 1.25;\r
\r
// the sun of the corner of each thread, which the first thread of its car packs\r
var<workgroup> cornerSun : array<f32, GROUP_SIZE>;\r
\r
@compute @workgroup_size(GROUP_SIZE, 1, 1)\r
fn main(@builtin(global_invocation_id) id : vec3<u32>, @builtin(local_invocation_index) local : u32) {\r
  let i = id.x / 4u;\r
  // the corner of the thread: bit 0 along the length, bit 1 along the width\r
  let corner = id.x % 4u;\r
  var lit = false;\r
  var sun = 1.;\r
  var center = vec2<f32>(0.);\r
  // the bottom of the car at its center\r
  var bottom = 0.;\r
  if (i < uniforms.carCount) {\r
    let a = cars[i * 3u];\r
    let b = cars[i * 3u + 1u];\r
    let c = cars[i * 3u + 2u];\r
    center = a.xy;\r
    bottom = c.x + uniforms.groundY;\r
    let height = b.z;\r
    let clip = uniforms.viewProjection * vec4(center.x, bottom + height, center.y, 1.);\r
    lit = clip.w > 0. && all(abs(clip.xy) <= vec2(clip.w * VIEW_MARGIN));\r
    if (lit && SUN_SHADOWS == 2u) {\r
      // along the length and along the width\r
      let u = a.zw;\r
      let v = vec2(-a.w, a.z);\r
      let along = select(-1., 1., (corner & 1u) != 0u) * b.x;\r
      let across = select(-1., 1., (corner & 2u) != 0u) * b.y;\r
      let xz = center + u * along + v * across;\r
      // sheared along the slope (c.y), see cars.wgsl\r
      let p = vec3(xz.x, bottom + along * c.y + height, xz.y);\r
      // off the roof by a part of the distance, as the rays of the deferred shading\r
      let d = distance(p, uniforms.cameraPosition);\r
      sun = select(1., 0., isOccluded(p + vec3(0., 1., 0.) * (d * 1e-4), uniforms.lightDirection));\r
    }\r
  }\r
  cornerSun[local] = sun;\r
  workgroupBarrier();\r
  if (i >= uniforms.carCount || corner != 0u) {\r
    return;\r
  }\r
  var sky = 1.;\r
  if (lit && uniforms.lightmapEnabled != 0u) {\r
    let g = vec3(center.x, bottom, center.y);\r
    let l = getLightmapLighting(getGroundSurface(g), getLevel(g, vec3(0., 1., 0.)));\r
    sky = select(1., l.x, l.w > 0.);\r
  }\r
  let corners = vec4(cornerSun[local], cornerSun[local + 1u], cornerSun[local + 2u], cornerSun[local + 3u]);\r
  carLight[i] = vec2(pack4x8unorm(corners), bitcast<u32>(sky));\r
}\r
`,Go=`// The layer of the cars (see cars.wgsl) over the image, with premultiplied alpha blending: the cars over it, their\r
// shadows (black with the darkening as the alpha) darken it.\r
\r
struct VertexInput {\r
  @location(0) position : vec3<f32>,\r
  @location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
  @builtin(position) position : vec4<f32>,\r
}\r
\r
@group(0) @binding(0) var texture : texture_2d<f32>;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
  var output : VertexOutput;\r
  output.position = vec4<f32>(input.position, 1.0);\r
  return output;\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
  return textureLoad(texture, vec2<i32>(input.position.xy), 0);\r
}\r
`,yn=0,vn=1,wn=2,at=12,Wo=8,jo=64,Ho=4,Xo=60,qo=6,Sn=.6,Yo=10,Ko=8,$o=1.5,Zo=.25,Qo=64,Jo=1.3,Mn=3.3,Tn=ni,el=ni+kr,tl=.8,rl=4.5;class nl{constructor(e,t){a(this,"renderer");a(this,"projection");a(this,"graph",new No);a(this,"heightField",null);a(this,"cars",[]);a(this,"instanceData",new Float32Array(0));a(this,"instanceBuffer",null);a(this,"carLightBuffer",null);a(this,"lightingShader");a(this,"layer",null);a(this,"layerSampleCount",0);a(this,"perCar");a(this,"perPixel");a(this,"compositeMaterial");a(this,"dummyCityBuffer");a(this,"clearColor",new N(0,0,0,0));a(this,"depthParams",new k);a(this,"resolution",new k);a(this,"desired",0);a(this,"countAge",1/0);a(this,"countVersion",-1);a(this,"countX",0);a(this,"countZ",0);a(this,"countRadius",0);a(this,"candidates",[]);a(this,"weights",[]);a(this,"_active",!1);a(this,"lightDirection",new S(0,1,0));a(this,"enabled");a(this,"density");a(this,"maxCars");a(this,"radiusScale");a(this,"speedScale");a(this,"driveOnLeft");a(this,"msaa");a(this,"perPixelLighting");a(this,"minPixels");a(this,"aoStrength");a(this,"shadowStrength");this.renderer=e,this.projection=t,this.dummyCityBuffer=e.createBuffer(16,GPUBufferUsage.STORAGE,!1,"carsDummyCityBuffer"),this.perCar=this.createMaterials("",!1),this.perPixel=this.createMaterials("PerPixel",!0),this.lightingShader=new Me(e,"carLighting",Uo,{includes:[...Ve.resolveIncludes,mt],defines:Ee.traceDefines,kernel:"main"}),this.lightingShader.setBuffer("cityBuffer",this.dummyCityBuffer),this.compositeMaterial=new G(e,"carLayerComposite",Go,{asyncPipeline:!0}),this.compositeMaterial.setPremultipliedAlphaBlending(),this.compositeMaterial.depthWriteEnabled=!1,this.compositeMaterial.depthCompare="always"}createMaterials(e,t){const r=(s,o)=>new G(this.renderer,s+e,Vo,{includes:t?[...Ve.resolveIncludes,mt,ar]:[...Ve.resolveIncludes,ar],defines:{SHADOW:o,PER_PIXEL:t,...t?Ee.traceDefines:{}},asyncPipeline:!0}),n=r("cars",!1);n.cullMode="back";const i=r("carShadows",!0);return i.cullMode="none",i.depthWriteEnabled=!1,i.depthCompare="always",i.setBlendState({color:{operation:"max",srcFactor:"one",dstFactor:"one"},alpha:{operation:"max",srcFactor:"one",dstFactor:"one"}}),t&&(n.setBuffer("cityBuffer",this.dummyCityBuffer),i.setBuffer("cityBuffer",this.dummyCityBuffer)),{car:n,shadow:i}}get materials(){return[this.perCar.car,this.perCar.shadow,this.perPixel.car,this.perPixel.shadow]}get resolveShaders(){return[...this.materials,this.lightingShader]}bindCity(e){e.bind(this.lightingShader,!1),e.bind(this.perPixel.car,!1),e.bind(this.perPixel.shadow,!1)}set sunShadows(e){for(const t of[...this.materials,this.lightingShader])t.setConstant("SUN_SHADOWS",e)}init(e){const t=e.addGroup("Cars"),r={callback:()=>this.clearCars()};this.enabled=t.addParamBool("enabled",!0,r),this.density=t.addParamFloat("density",12.5,1,100),this.maxCars=t.addParamFloat("maxCars",Se()?750:2e3,100,2e4,{step:100}),this.radiusScale=t.addParamFloat("radius",2.5,.5,6),this.speedScale=t.addParamFloat("speed",1,0,4),this.driveOnLeft=t.addParamBool("driveOnLeft",!1),this.msaa=t.addParamBool("msaa",!0),this.perPixelLighting=t.addParamBool("perPixelLighting",!0),this.minPixels=t.addParamFloat("minPixels",2,0,10),this.aoStrength=t.addParamFloat("aoStrength",.45,0,1),this.shadowStrength=t.addParamFloat("shadowStrength",.85,0,1),t.collapsed=!0}addTile(e,t){this.graph.setMetersToNorm(this.projection.metersToNorm),this.graph.addTile(e,t)}removeTile(e){this.graph.removeTile(e)}clear(){this.graph.clear(),this.clearCars()}get active(){return this._active}clearCars(){this.cars.length=0,this.countAge=1/0}update(e,t,r){var m;if(this._active=!1,!((m=this.enabled)!=null&&m.value))return;const n=this.projection.metersToNorm;if(r/(2*Math.tan(t.projection.FOV*.5)*t.distance/n)*rl<this.minPixels.value)return;this._active=!0;const s=t.pivot.worldPosition,o=s.x,l=s.z,h=this.radiusScale.value*t.distance;this.updateDesired(e,o,l,h);const u=(h*Jo)**2;let d=0;for(let p=this.cars.length-1;p>=0;p--){const x=this.cars[p];!x.edge.alive||(x.x-o)**2+(x.z-l)**2>u?this.removeCar(p):x.dying||d++}if(d>this.desired*1.1+2){let p=d-this.desired;for(let x=0;x<this.cars.length&&p>0;x++){const b=this.cars[x];b.dying||Math.random()<.5||(b.dying=!0,p--)}}const f=Math.min(Qo,Math.floor(this.desired)-d);for(let p=0;p<f;p++){const x=this.graph.sampleEdge(o,l,h);if(!x)break;this.cars.push(this.createCar(x,n))}for(let p=this.cars.length-1;p>=0;p--)this.moveCar(this.cars[p],e,n)||this.removeCar(p)}updateDesired(e,t,r,n){this.countAge+=e;const i=Math.hypot(t-this.countX,r-this.countZ)>n*.1||Math.abs(n/this.countRadius-1)>.1;if(this.countAge<Zo||!i&&this.countVersion===this.graph.version)return;this.countAge=0,this.countVersion=this.graph.version,this.countX=t,this.countZ=r,this.countRadius=n;const s=this.graph.lengthWithin(t,r,n)/this.projection.metersToNorm;this.desired=Math.min(this.maxCars.value,this.density.value*s/1e3)}removeCar(e){const t=this.cars.pop();e<this.cars.length&&(this.cars[e]=t)}createCar(e,t){const r=Math.random(),n=r<.04?wn:r<.14?vn:yn,i=(u,d)=>(u+Math.random()*(d-u))*t;let s,o,l;n===wn?(s=i(10,12),o=2.5*t,l=i(3,3.3)):n===vn?(s=i(5,5.6),o=2*t,l=i(2.1,2.5)):(s=i(4,4.8),o=i(1.75,1.85),l=i(1.4,1.55));const h=(n===yn?.85:.75)+Math.random()*.3;return{edge:e,forward:e.oneway||Math.random()<.5,s:Math.random()*e.length,speed:e.speed*h,speedFactor:h,lane:Math.floor(Math.random()*8),halfLength:s*.5,halfWidth:o*.5,height:l,type:n,x:0,z:0,hx:1,hz:0,ground:0,slope:0,placed:!1,grow:0,dying:!1}}moveCar(e,t,r){if(e.dying){if(e.grow-=t/Sn,e.grow<=0)return!1}else e.grow=Math.min(1,e.grow+t/Sn);const n=e.edge.speed*e.speedFactor*this.speedScale.value;e.speed+=(n-e.speed)*Math.min(1,t*$o),e.s+=e.speed*t;for(let g=0;g<16&&e.s>e.edge.length;g++)if(e.s-=e.edge.length,!this.turn(e))return!1;e.s=Math.min(e.s,e.edge.length);const i=e.edge,s=e.forward?i.dx:-i.dx,o=e.forward?i.dz:-i.dz,l=e.forward?i.a:i.b,h=this.getLaneOffset(e,i,r)*(this.driveOnLeft.value?-1:1),u=l.x+s*e.s-o*h,d=l.z+o*e.s+s*h;if(!e.placed)return e.placed=!0,e.x=u,e.z=d,e.hx=s,e.hz=o,this.placeOnGround(e),!0;const f=1-Math.exp(-t*Yo);e.x+=(u-e.x)*f,e.z+=(d-e.z)*f;const m=1-Math.exp(-t*Ko);let p=e.hx+(s-e.hx)*m,x=e.hz+(o-e.hz)*m;const b=Math.hypot(p,x);return b<.001?(p=s,x=o):(p/=b,x/=b),e.hx=p,e.hz=x,this.placeOnGround(e),!0}placeOnGround(e){const t=this.heightField;if(!t){e.ground=e.slope=0;return}const r=e.hx*e.halfLength,n=e.hz*e.halfLength,i=t.heightAt(e.x,e.z)??0,s=t.heightAt(e.x+r,e.z+n)??i,o=t.heightAt(e.x-r,e.z-n)??i;e.slope=e.halfLength>0?(s-o)/(2*e.halfLength):0,e.ground=Math.max(i,(s+o)*.5)}setHeightField(e){this.heightField=e}getLaneOffset(e,t,r){const n=t.width/r;if(t.oneway){const s=Math.max(1,Math.round(n/Mn));return(e.lane%s+.5)*(t.width/s)-t.width*.5}const i=Math.max(1,Math.round(n*.5/Mn));return(e.lane%i+.5)*(t.width*.5/i)}turn(e){const t=e.edge,r=e.forward?t.b:t.a,n=e.forward?t.dx:-t.dx,i=e.forward?t.dz:-t.dz,s=this.candidates,o=this.weights;s.length=0,o.length=0;let l=0;for(const f of r.edges){if(f===t||!f.alive)continue;const m=f.a===r;if(!m&&f.oneway)continue;const p=m?n*f.dx+i*f.dz:-(n*f.dx+i*f.dz),x=Math.max(0,p+.35),b=(.08+x*x)*(f.speed>=t.speed*.6?1:.4);s.push(f),o.push(b),l+=b}if(s.length===0)return t.oneway?!1:(e.forward=!e.forward,!0);let h=Math.random()*l,u=0;for(;u<s.length-1&&(h-=o[u])>0;)u++;const d=s[u];return e.edge=d,e.forward=d.a===r,!0}draw(e,t,r,n){const i=this.writeInstances();if(i===0)return;const s=this.getLayer(),o=this.projection.metersToNorm;oe.depthParams(e,this.depthParams),this.resolution.setValues(r.target.width,r.target.height);const l=this.perPixelLighting.value,h=l?this.perPixel:this.perCar;for(const u of[h.car,h.shadow])u.setMatrix("viewProjection",t),u.setMatrix("inverseProjection",e.projectionMatrix.inverse),u.setVector3("cameraPosition",e.worldPosition),u.setVector2("resolution",this.resolution),u.setVector2("depthParams",this.depthParams),u.setFloat("groundY",Tn),u.setFloat("shadowY",el),u.setFloat("aoMargin",tl*o),u.setFloat("aoStrength",this.aoStrength.value),u.setFloat("carShadowStrength",this.shadowStrength.value),u.setTexture("gBufferDepth",r.depthView),u.setBuffer("cars",this.instanceBuffer),l||u.setBuffer("carLight",this.carLightBuffer);if(!l){const u=this.lightingShader;u.setMatrix("viewProjection",t),u.setVector3("cameraPosition",e.worldPosition),u.setVector3("lightDirection",this.lightDirection),u.setFloat("groundY",Tn),u.setFloat("carCount",i),u.setBuffer("cars",this.instanceBuffer),u.setBuffer("carLight",this.carLightBuffer),this.renderer.dispatchCompute(u,Math.ceil(i*Ho/jo))}this.renderer.startRenderPass(s,{clearColor:this.clearColor,colorClear:!0,depthClear:!0},0,"cars"),this.renderer.drawVertices(qo,h.shadow,null,{instanceCount:i}),this.renderer.drawVertices(Xo,h.car,null,{instanceCount:i}),this.renderer.blit(s,n,this.compositeMaterial,!1)}writeInstances(){var r,n;const e=this.cars;if(e.length===0)return 0;if(this.instanceData.length<e.length*at){const i=Math.max(e.length,Math.ceil(this.instanceData.length/at*1.5),256);this.instanceData=new Float32Array(i*at),(r=this.instanceBuffer)==null||r.destroy(),this.instanceBuffer=this.renderer.createBuffer(this.instanceData.byteLength,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,!1,"cars"),(n=this.carLightBuffer)==null||n.destroy(),this.carLightBuffer=this.renderer.createBuffer(i*Wo,GPUBufferUsage.STORAGE,!1,"carLight")}const t=this.instanceData;for(let i=0;i<e.length;i++){const s=e[i],o=s.grow*s.grow*(3-2*s.grow),l=i*at;t[l]=s.x,t[l+1]=s.z,t[l+2]=s.hx,t[l+3]=s.hz,t[l+4]=s.halfLength*o,t[l+5]=s.halfWidth*o,t[l+6]=s.height*o,t[l+7]=s.type,t[l+8]=s.ground,t[l+9]=s.slope}return this.renderer.writeBuffer(this.instanceBuffer,t.subarray(0,e.length*at)),e.length}getLayer(){var t;const e=this.msaa.value?4:1;return(!this.layer||this.layerSampleCount!==e)&&((t=this.layer)==null||t.destruct(),this.layerSampleCount=e,this.layer=new H(this.renderer,1,1,{formats:["rgba8unorm"],depth:!0,sampleCount:e,scaleToCanvas:!0,toScreen:!1,discardMSAA:!0,discardDepth:!0})),this.layer}destruct(){var e,t,r;(e=this.layer)==null||e.destruct(),(t=this.instanceBuffer)==null||t.destroy(),(r=this.carLightBuffer)==null||r.destroy(),this.dummyCityBuffer.destroy(),this.graph.clear()}}const li="1.9.4",il=`https://unpkg.com/leaflet@${li}/dist/leaflet.js`,sl=`https://unpkg.com/leaflet@${li}/dist/leaflet.css`,al={south:50.75,west:3.36,north:53.56,east:7.23};function Xe(c,e,t){return Math.min(Math.max(c,e),t)}let wt=null;function ol(){const c=window;return c.L?Promise.resolve(c.L):wt||(wt=new Promise((e,t)=>{if(!document.querySelector("link[data-leaflet]")){const n=document.createElement("link");n.rel="stylesheet",n.href=sl,n.setAttribute("data-leaflet",""),document.head.appendChild(n)}const r=document.createElement("script");r.src=il,r.async=!0,r.onload=()=>e(window.L),r.onerror=()=>t(new Error("[MapOSM] failed to load Leaflet from CDN")),document.head.appendChild(r)}),wt)}class ll{constructor(e,t,r,n,i,s=al){a(this,"parent");a(this,"bounds");a(this,"initialZoom");a(this,"onCreate");a(this,"onCancel");a(this,"clampBounds");a(this,"halfLatSpan");a(this,"halfLngSpan");a(this,"overlay");a(this,"mapEl");a(this,"L");a(this,"map");a(this,"clamping",!1);this.parent=e,this.clampBounds=s,this.bounds={...t},this.initialZoom=r,this.onCreate=n,this.onCancel=i,this.halfLatSpan=Math.max(t.north-t.south,1e-4)*.5,this.halfLngSpan=Math.max(t.east-t.west,1e-4)*.5}async show(){this.L=await ol(),this.buildDom(),this.initMap()}hide(){this.map&&(this.map.remove(),this.map=null),this.overlay&&this.overlay.parentElement&&this.overlay.parentElement.removeChild(this.overlay)}buildDom(){this.overlay=document.createElement("div"),Object.assign(this.overlay.style,{position:"absolute",inset:"0",zIndex:"1000",background:"#fff"}),this.mapEl=document.createElement("div"),Object.assign(this.mapEl.style,{position:"absolute",inset:"0"}),this.overlay.appendChild(this.mapEl),this.overlay.appendChild(this.makeIndicator());const e=document.createElement("div");Object.assign(e.style,{position:"absolute",bottom:"60px",left:"50%",transform:"translateX(-50%)",zIndex:"1001",display:"flex",gap:"12px"});const t=this.makeButton("go","#2d7ef7","#1b6ae0");t.addEventListener("click",()=>this.onCreate(this.boundsFromMapCenter())),e.appendChild(t);const r=this.makeButton("cancel","#6b7280","#4b5563");r.addEventListener("click",()=>{var n;return(n=this.onCancel)==null?void 0:n.call(this)}),e.appendChild(r),this.overlay.appendChild(e),this.parent.appendChild(this.overlay)}makeIndicator(){const e=document.createElement("div");return Object.assign(e.style,{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",zIndex:"1001",pointerEvents:"none"}),e.innerHTML=`
      <div style="position:absolute;top:50%;left:50%;width:40px;height:2px;background:#2d7ef7;transform:translate(-50%,-50%);box-shadow:0 0 2px rgba(255,255,255,0.9);"></div>
      <div style="position:absolute;top:50%;left:50%;width:2px;height:40px;background:#2d7ef7;transform:translate(-50%,-50%);box-shadow:0 0 2px rgba(255,255,255,0.9);"></div>
      <div style="position:absolute;top:50%;left:50%;width:18px;height:18px;border-radius:50%;background:#2d7ef7;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);transform:translate(-50%,-50%);"></div>
    `,e}makeButton(e,t,r){const n=document.createElement("button");return n.textContent=e,Object.assign(n.style,{padding:"12px 24px",fontSize:"15px",fontWeight:"600",color:"#fff",background:t,border:"none",borderRadius:"6px",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}),n.addEventListener("mouseenter",()=>n.style.background=r),n.addEventListener("mouseleave",()=>n.style.background=t),n}initMap(){const e=this.L,t=this.bounds,r=this.clampBounds;if(this.map=e.map(this.mapEl,{zoomControl:!0,worldCopyJump:!r}),r){const n=e.latLngBounds([r.south,r.west],[r.north,r.east]);this.map.on("move",()=>this.clampCenterToArea());const i=Math.ceil(this.map.getBoundsZoom(n));this.map.setMinZoom(i);const s=[Xe((t.south+t.north)/2,r.south,r.north),Xe((t.west+t.east)/2,r.west,r.east)];this.map.setView(s,Math.max(this.initialZoom,i))}else this.map.setMinZoom(2),this.map.setView([(t.south+t.north)/2,(t.west+t.east)/2],this.initialZoom);e.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(this.map)}getZoom(){return this.map?this.map.getZoom():this.initialZoom}clampCenterToArea(){const e=this.clampBounds;if(this.clamping||!e)return;const t=this.map.getCenter(),r=Xe(t.lat,e.south,e.north),n=Xe(t.lng,e.west,e.east);r===t.lat&&n===t.lng||(this.clamping=!0,this.map.stop(),this.map.setView([r,n],this.map.getZoom(),{animate:!1}),this.clamping=!1)}boundsFromMapCenter(){const e=this.map.getCenter().wrap(),t=this.clampBounds,r=t?Xe(e.lat,t.south,t.north):e.lat,n=t?Xe(e.lng,t.west,t.east):e.lng;return{south:r-this.halfLatSpan,north:r+this.halfLatSpan,west:n-this.halfLngSpan,east:n+this.halfLngSpan}}}const hl="https://nominatim.openstreetmap.org/search",cl=1100;let Cn=0;const En=new Map;async function ul(c,e=6){const t=c.trim();if(!t)return[];const r=t.toLowerCase(),n=En.get(r);if(n)return n;const i=Cn+cl-performance.now();i>0&&await new Promise(d=>setTimeout(d,i)),Cn=performance.now();const s=typeof navigator<"u"&&navigator.language||"en",o=`${hl}?format=jsonv2&limit=${e}&q=${encodeURIComponent(t)}&accept-language=${encodeURIComponent(s)}`,l=await fetch(o);if(!l.ok)throw new Error(`Nominatim ${l.status}`);const u=(await l.json()).map(d=>{const f=(d.display_name??"").split(",").map(p=>p.trim()),m=d.name||f[0]||t;return{name:m,context:f.filter((p,x)=>!(x===0&&p===m)).join(", "),lat:parseFloat(d.lat),lng:parseFloat(d.lon)}}).filter(d=>Number.isFinite(d.lat)&&Number.isFinite(d.lng));return En.set(r,u),u}class Jt{constructor(e=document.body,t){a(this,"value",{x:0,y:0});a(this,"base");a(this,"knob");a(this,"radius",60);a(this,"pointerId",null);a(this,"centerX",0);a(this,"centerY",0);a(this,"onDown",e=>{if(this.pointerId!==null)return;e.preventDefault(),e.stopPropagation(),this.pointerId=e.pointerId,this.base.setPointerCapture(e.pointerId);const t=this.base.getBoundingClientRect();this.centerX=t.left+t.width/2,this.centerY=t.top+t.height/2,this.setFromPointer(e)});a(this,"onMove",e=>{e.pointerId===this.pointerId&&(e.preventDefault(),e.stopPropagation(),this.setFromPointer(e))});a(this,"onUp",e=>{e.pointerId===this.pointerId&&(e.stopPropagation(),this.pointerId=null,this.value.x=0,this.value.y=0,this.knob.style.transform="")});const r=this.radius*2;this.base=document.createElement("div"),t?this.base.className=t:Object.assign(this.base.style,{position:"fixed",left:"24px",bottom:"24px",zIndex:"10"}),Object.assign(this.base.style,{width:`${r}px`,height:`${r}px`,borderRadius:"50%",background:"rgba(0, 0, 0, .2)",border:"2px solid rgba(255, 255, 255, .5)",boxSizing:"border-box",touchAction:"none",userSelect:"none",webkitUserSelect:"none"}),this.knob=document.createElement("div");const n=r*.45;Object.assign(this.knob.style,{position:"absolute",left:`${(r-n)/2-2}px`,top:`${(r-n)/2-2}px`,width:`${n}px`,height:`${n}px`,borderRadius:"50%",background:"rgba(255, 255, 255, .7)",pointerEvents:"none"}),this.base.appendChild(this.knob),e.appendChild(this.base),this.base.addEventListener("pointerdown",this.onDown),this.base.addEventListener("pointermove",this.onMove),this.base.addEventListener("pointerup",this.onUp),this.base.addEventListener("pointercancel",this.onUp),this.base.addEventListener("contextmenu",i=>i.preventDefault())}get element(){return this.base}static get wanted(){return window.matchMedia("(pointer: coarse)").matches||navigator.maxTouchPoints>0}setFromPointer(e){let t=(e.clientX-this.centerX)/this.radius,r=(e.clientY-this.centerY)/this.radius;const n=Math.hypot(t,r);n>1&&(t/=n,r/=n),this.value.x=t,this.value.y=-r,this.knob.style.transform=`translate(${t*this.radius}px, ${r*this.radius}px)`}destruct(){this.base.remove()}}const ce=class ce{constructor(e,t){a(this,"selector");a(this,"selectorZoom",15);a(this,"buttonBar");a(this,"attributionEl");a(this,"tileErrorContainer");a(this,"searchInput");a(this,"suggestionList");a(this,"suggestions",[]);a(this,"highlighted",0);a(this,"searchSeq",0);a(this,"locationTitleEl");a(this,"locationTitleTimer");a(this,"joystick");a(this,"controlsHintEl");this.parent=e,this.callbacks=t,this.buttonBar=this.createButtonBar(),this.attributionEl=this.createAttribution(),Jt.wanted&&(this.joystick=new Jt(this.parent,"mwui-joystick"))}static injectStyles(){const e="map-world-ui-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e,t.textContent=`
      .mwui-bar { position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%); z-index: 500; display: flex; gap: 8px; }
      .mwui-button { padding: 12px 24px; font-size: 15px; white-space: nowrap; flex: none; }
      .mwui-search { position: relative; display: flex; }
      .mwui-input { width: 220px; padding: 12px 14px; font-size: 15px; }
      .mwui-list { width: max-content; max-width: min(420px, calc(100vw - 32px)); }
      .mwui-joystick { position: absolute; left: 50%; margin-left: -60px; bottom: 120px; z-index: 499; }
      .mwui-hint { bottom: 120px; }
      .mwui-attribution { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: calc(100% - 16px); }
      @media (max-width: 600px) {
        .mwui-bar { left: 8px; right: 8px; bottom: calc(28px + env(safe-area-inset-bottom, 0px)); transform: none; gap: 6px; }
        .mwui-button { padding: 9px 10px; font-size: 13px; }
        .mwui-search { position: static; flex: 1 1 auto; min-width: 0; }
        .mwui-input { width: 100%; min-width: 0; padding: 9px 10px; font-size: 16px; }
        .mwui-list { width: auto; max-width: none; right: 0; }
        .mwui-joystick { bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }
        .mwui-hint { bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }
        .mwui-attribution { font-size: 9px; }
      }
    `,document.head.appendChild(t)}createButtonBar(){ce.injectStyles();const e=document.createElement("div");e.className="mwui-bar",this.parent.appendChild(e),this.createButton(e,"Map",()=>void this.openSelector()),this.createSearchBox(e),this.createButton(e,"Random",()=>this.callbacks.onRandomCity());const t=this.createButton(e,"Fly",()=>{const r=this.callbacks.onToggleAirplane();t.textContent=r?"Orbit":"Fly",t.blur()});return e}createButton(e,t,r){const n=document.createElement("button");return n.textContent=t,n.className="mwui-button",Object.assign(n.style,{fontWeight:"600",color:"#fff",background:"#2d7ef7",border:"none",borderRadius:"6px",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}),n.addEventListener("mouseenter",()=>n.style.background="#1b6ae0"),n.addEventListener("mouseleave",()=>n.style.background="#2d7ef7"),n.addEventListener("click",r),e.appendChild(n),n}createSearchBox(e){const t=document.createElement("div");t.className="mwui-search",e.appendChild(t);const r=document.createElement("input");r.type="search",r.placeholder="Search",r.autocomplete="off",r.spellcheck=!1,r.className="mwui-input",Object.assign(r.style,{fontFamily:"system-ui, sans-serif",color:"#222",background:"rgba(255,255,255,0.95)",border:"none",borderRadius:"6px",outline:"none",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}),t.appendChild(r),this.searchInput=r;const n=document.createElement("div");n.className="mwui-list",Object.assign(n.style,{position:"absolute",bottom:"calc(100% + 6px)",left:"0",minWidth:"100%",display:"none",flexDirection:"column",background:"rgba(255,255,255,0.97)",borderRadius:"6px",boxShadow:"0 2px 12px rgba(0,0,0,0.35)",overflow:"hidden",fontFamily:"system-ui, sans-serif"}),t.appendChild(n),this.suggestionList=n,r.addEventListener("input",()=>void this.updateLocalSuggestions()),r.addEventListener("focus",()=>void this.updateLocalSuggestions()),r.addEventListener("blur",()=>this.closeSuggestions()),r.addEventListener("keydown",i=>{var o;i.stopPropagation();const s=this.suggestions.length;i.key==="ArrowDown"&&s?(this.setHighlighted((this.highlighted+1)%s),i.preventDefault()):i.key==="ArrowUp"&&s?(this.setHighlighted((this.highlighted-1+s)%s),i.preventDefault()):i.key==="Enter"?((o=this.suggestions[this.highlighted])==null||o.pick(),i.preventDefault()):i.key==="Escape"&&(r.value="",r.blur())}),r.addEventListener("keyup",i=>i.stopPropagation())}async updateLocalSuggestions(){const e=this.searchInput.value.trim(),t=++this.searchSeq;if(!e){this.showSuggestions([]);return}const r=await Pa(e,8);if(t!==this.searchSeq)return;const n=_a(e,3).map(i=>({label:i.name,detail:`${i.city}, ${i.country}`,pick:()=>this.goTo({lat:i.lat,lng:i.lng,title:`${i.city}, ${i.country}`,subtitle:i.name},i.name)}));n.push(...r.map(i=>({label:i.name,detail:i.landmark||void 0,pick:()=>this.goTo({lat:i.lat,lng:i.lng,title:i.name,subtitle:i.landmark||void 0})}))),n.push({label:`Search worldwide for “${e}”`,pick:()=>void this.searchWorldwide(e)}),this.showSuggestions(n)}async searchWorldwide(e){const t=++this.searchSeq;this.showSuggestions([],"Searching…");try{const r=await ul(e);if(t!==this.searchSeq)return;if(r.length===1){const n=r[0];this.goTo({lat:n.lat,lng:n.lng,title:n.name,subtitle:n.context||void 0});return}this.showSuggestions(r.map(n=>({label:n.name,detail:n.context,pick:()=>this.goTo({lat:n.lat,lng:n.lng,title:n.name,subtitle:n.context||void 0})})),r.length?void 0:`No places found for “${e}”`)}catch(r){t===this.searchSeq&&this.showSuggestions([],`Search failed: ${r.message}`)}}goTo(e,t=e.title){this.searchInput.value=t,this.searchInput.blur(),this.closeSuggestions(),this.callbacks.onGoToPlace(e)}showSuggestions(e,t){this.suggestions=e;const r=this.suggestionList;if(r.replaceChildren(),e.forEach((n,i)=>{const s=document.createElement("div");Object.assign(s.style,{padding:"8px 14px",cursor:"pointer",color:"#222",fontSize:"14px",borderTop:i?"1px solid rgba(0,0,0,0.08)":"none"});const o=document.createElement("div");if(o.textContent=n.label,o.style.fontWeight="600",s.appendChild(o),n.detail){const l=document.createElement("div");l.textContent=n.detail,Object.assign(l.style,{fontSize:"12px",opacity:"0.65",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}),s.appendChild(l)}s.addEventListener("mousedown",l=>{l.preventDefault(),n.pick()}),s.addEventListener("mouseenter",()=>this.setHighlighted(i)),r.appendChild(s)}),t){const n=document.createElement("div");n.textContent=t,Object.assign(n.style,{padding:"8px 14px",color:"#666",fontSize:"14px"}),r.appendChild(n)}r.style.display=e.length||t?"flex":"none",this.setHighlighted(0)}setHighlighted(e){this.highlighted=e,Array.from(this.suggestionList.children).forEach((t,r)=>{t.style.background=r===e&&r<this.suggestions.length?"rgba(45,126,247,0.15)":"transparent"})}closeSuggestions(){this.searchSeq++,this.suggestions=[],this.suggestionList.replaceChildren(),this.suggestionList.style.display="none"}setButtonsVisible(e){this.buttonBar.style.display=e?"flex":"none",this.joystick&&(this.joystick.element.style.display=e?"":"none")}get joystickValue(){var e;return(e=this.joystick)==null?void 0:e.value}async openSelector(){if(this.selector)return;this.setButtonsVisible(!1);const e=()=>{var t,r;this.selectorZoom=((t=this.selector)==null?void 0:t.getZoom())??this.selectorZoom,(r=this.selector)==null||r.hide(),this.selector=void 0,this.setButtonsVisible(!0)};this.selector=new ll(this.parent,this.callbacks.getViewBounds(),this.selectorZoom,t=>{e(),this.callbacks.onSelectBounds(t)},e,null),await this.selector.show()}createAttribution(){const e=document.createElement("div");return e.textContent=`${Ba} · ${Fa}`,e.className="mwui-attribution",Object.assign(e.style,{position:"absolute",left:"8px",bottom:"6px",zIndex:"500",fontFamily:"system-ui, sans-serif",color:"rgba(0,0,0,0.75)",background:"rgba(255,255,255,0.6)",padding:"2px 6px",borderRadius:"3px",pointerEvents:"none"}),this.parent.appendChild(e),e}ensureTileErrorContainer(){if(this.tileErrorContainer)return this.tileErrorContainer;const e=document.createElement("div");return Object.assign(e.style,{position:"absolute",bottom:"20px",right:"20px",zIndex:"500",display:"flex",flexDirection:"column",gap:"8px",maxWidth:"420px",pointerEvents:"none"}),this.parent.appendChild(e),this.tileErrorContainer=e,e}showTileError(e){var n;const t=this.ensureTileErrorContainer();for(;t.childElementCount>=ce.MAX_TILE_ERROR_TOASTS;)(n=t.firstChild)==null||n.remove();const r=document.createElement("div");r.textContent=e,Object.assign(r.style,{background:"rgba(180, 40, 40, 0.92)",color:"#fff",fontSize:"12px",fontFamily:"monospace",padding:"10px 14px",borderRadius:"6px",boxShadow:"0 2px 12px rgba(0,0,0,0.4)",wordBreak:"break-all",lineHeight:"1.4",opacity:"0",transition:"opacity 0.3s ease"}),t.appendChild(r),requestAnimationFrame(()=>{r.style.opacity="1"}),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),300)},ce.TILE_ERROR_TIMEOUT_MS)}showLocationTitle(e,t){this.hideLocationTitle();const r=document.createElement("div");Object.assign(r.style,{position:"absolute",top:"24px",left:"50%",transform:"translateX(-50%)",zIndex:"500",maxWidth:"calc(100% - 32px)",textAlign:"center",fontFamily:"system-ui, sans-serif",color:"#fff",background:"rgba(0,0,0,0.45)",padding:"10px 22px",borderRadius:"8px",textShadow:"0 1px 3px rgba(0,0,0,0.6)",pointerEvents:"none",opacity:"0",transition:"opacity 0.4s ease"});const n=document.createElement("div");if(n.textContent=e,Object.assign(n.style,{fontSize:"26px",fontWeight:"700"}),r.appendChild(n),t){const i=document.createElement("div");i.textContent=t,Object.assign(i.style,{fontSize:"16px",fontWeight:"500",marginTop:"2px",opacity:"0.9"}),r.appendChild(i)}this.parent.appendChild(r),this.locationTitleEl=r,requestAnimationFrame(()=>{r.style.opacity="1"}),this.locationTitleTimer=window.setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),400),this.locationTitleEl===r&&(this.locationTitleEl=void 0)},ce.LOCATION_TITLE_MS)}showControlsHint(){if(Jt.wanted||this.controlsHintEl)return;const e=document.createElement("div");e.className="mwui-hint",e.textContent="Ctrl + drag or WASD to rotate",Object.assign(e.style,{position:"absolute",left:"50%",transform:"translateX(-50%)",zIndex:"500",maxWidth:"calc(100% - 32px)",textAlign:"center",fontFamily:"system-ui, sans-serif",fontSize:"15px",fontWeight:"500",color:"#fff",background:"rgba(0,0,0,0.45)",padding:"8px 18px",borderRadius:"8px",textShadow:"0 1px 3px rgba(0,0,0,0.6)",pointerEvents:"none",opacity:"0",transition:"opacity 0.4s ease"}),this.parent.appendChild(e),this.controlsHintEl=e,requestAnimationFrame(()=>{e.style.opacity="1"}),window.setTimeout(()=>{e.style.opacity="0",setTimeout(()=>e.remove(),400),this.controlsHintEl===e&&(this.controlsHintEl=void 0)},ce.CONTROLS_HINT_MS)}hideLocationTitle(){var e;clearTimeout(this.locationTitleTimer),(e=this.locationTitleEl)==null||e.remove(),this.locationTitleEl=void 0}destruct(){var e,t,r,n;this.hideLocationTitle(),(e=this.controlsHintEl)==null||e.remove(),(t=this.joystick)==null||t.destruct(),(r=this.selector)==null||r.hide(),(n=this.tileErrorContainer)==null||n.remove(),this.attributionEl.remove(),this.buttonBar.remove()}};a(ce,"MAX_TILE_ERROR_TOASTS",5),a(ce,"TILE_ERROR_TIMEOUT_MS",8e3),a(ce,"LOCATION_TITLE_MS",4e3),a(ce,"CONTROLS_HINT_MS",8e3);let xr=ce;const ve={up:["KeyW","ArrowUp"],down:["KeyS","ArrowDown"],left:["KeyA","ArrowLeft"],right:["KeyD","ArrowRight"]};class dl{constructor(e,t){a(this,"minHeight",120);a(this,"maxHeight",800);a(this,"speed",140);a(this,"climbSpeed",120);a(this,"limitEaseBand",150);a(this,"turnSpeed",.7);a(this,"maxRoll",.45);a(this,"cruisePitch",-.45);a(this,"pitchRange",.12);a(this,"accelerationTime",1.5);a(this,"heightSettleRate",.8);a(this,"ground",()=>null);a(this,"groundRate",1.5);a(this,"pivotGroundRate",4);a(this,"pivotClearance",20);a(this,"_active",!1);a(this,"x",0);a(this,"z",0);a(this,"height",0);a(this,"planeGround",0);a(this,"pivotGround",0);a(this,"yaw",0);a(this,"pitch",this.cruisePitch);a(this,"roll",0);a(this,"throttle",0);a(this,"exitRoll",0);a(this,"climb",0);a(this,"turn",0);a(this,"keys",new Set);a(this,"lookPitch",0);a(this,"pitchMin",-1.4);a(this,"pitchMax",-.1);a(this,"listeners");this.renderer=e,this.camera=t}get active(){return this._active}enter(e){if(this._active)return;this._active=!0;const t=this.camera.pivot.position,r=this.camera.rotationController.eulerXY,n=this.camera.distance;this.yaw=r.y;const i=n*Math.cos(r.x);this.x=t.x+Math.sin(this.yaw)*i,this.z=t.z+Math.cos(this.yaw)*i,this.pitch=Math.min(r.x,-.05),this.planeGround=this.ground(this.x,this.z)??t.y,this.pivotGround=t.y,this.height=t.y-n*Math.sin(this.pitch)-this.planeGround,this.roll=this.exitRoll,this.exitRoll=0,this.throttle=0,this.climb=0,this.turn=0,this.lookPitch=0,this.listeners=new AbortController;const s=this.listeners.signal;window.addEventListener("keydown",o=>{!this.isFlightKey(o.code)||this.isTyping(o)||(this.keys.add(o.code),o.preventDefault())},{signal:s}),window.addEventListener("keyup",o=>this.keys.delete(o.code),{signal:s}),window.addEventListener("blur",()=>this.keys.clear(),{signal:s})}place(e,t,r,n){this.x=e,this.z=t,this.height=r,this.planeGround=this.ground(e,t)??0,this.pivotGround=this.planeGround,this.yaw=n,this.pitch=this.cruisePitch,this.roll=0,this.throttle=1,this.climb=0,this.turn=0,this.lookPitch=0}exit(){var r;if(!this._active)return;this._active=!1,(r=this.listeners)==null||r.abort(),this.listeners=void 0,this.keys.clear();const e=Math.atan2(Math.sin(this.yaw),Math.cos(this.yaw));this.camera.rotationController.resetSpeed(),this.camera.rotationController.eulerXY=new k(this.pitch,e);const t=this.camera.distance;this.camera.distance=t,this.camera.zoomTargetDistance=J(t,.1,2),this.exitRoll=this.roll,this.roll=0}settle(){if(this.exitRoll===0)return;const e=Math.min(this.renderer.time.dt,.1);this.exitRoll=ae(this.exitRoll,0,Math.min(e*3,1)),Math.abs(this.exitRoll)<1e-4&&(this.exitRoll=0);const t=this.camera.rotationController.eulerXY;this.camera.pivot.euler=new S(t.x,t.y,this.exitRoll),this.camera.checkChanged()}recenter(){const e=this.camera.pivot.position;this.x-=e.x,this.z-=e.z}update(e,t){const r=Math.min(this.renderer.time.dt,.1),n=P=>P.some(T=>this.keys.has(T))?1:0,i=Math.min(r*3,1);this.climb=ae(this.climb,J(n(ve.up)-n(ve.down)+((t==null?void 0:t.y)??0),-1,1),i),this.turn=ae(this.turn,J(n(ve.right)-n(ve.left)+((t==null?void 0:t.x)??0),-1,1),i);const s=this.minHeight*e,o=this.maxHeight*e,l=this.climb>0?o-this.height:this.height-s,h=Math.sin(Math.PI*.5*J(l/(this.limitEaseBand*e),0,1)),u=this.climb*h;let d=this.height+u*this.climbSpeed*e*r;const f=1-Math.exp(-this.heightSettleRate*r);d>o?d=Math.max(o,ae(d,o,f)):d<s&&(d=Math.min(s,ae(d,s,f))),this.height=d,this.roll=ae(this.roll,-this.turn*this.maxRoll,i),this.yaw+=this.roll/this.maxRoll*this.turnSpeed*r,this.dragLook(),this.pitch=J(ae(this.pitch,this.cruisePitch+this.lookPitch+u*this.pitchRange,i),this.pitchMin,this.pitchMax),this.throttle=Math.min(this.throttle+r/this.accelerationTime,1);const m=this.throttle*this.throttle*(3-2*this.throttle),p=this.speed*m*e*r;this.x-=Math.sin(this.yaw)*p,this.z-=Math.cos(this.yaw)*p;const x=this.ground(this.x,this.z);x!==null&&(this.planeGround+=(x-this.planeGround)*(1-Math.exp(-this.groundRate*r)));const b=this.planeGround+this.height,g=Math.sin(-this.pitch),y=Math.cos(this.pitch),v=P=>{const T=(b-P)/g*y;return[this.x-Math.sin(this.yaw)*T,this.z-Math.cos(this.yaw)*T]};let w=this.pivotGround;for(let P=0;P<3;P++){const[T,L]=v(w);w=this.ground(T,L)??w}this.pivotGround+=(w-this.pivotGround)*(1-Math.exp(-this.pivotGroundRate*r)),this.pivotGround=Math.min(this.pivotGround,b-this.pivotClearance*e);const M=(b-this.pivotGround)/g,[C,E]=v(this.pivotGround),A=this.camera.pivot;A.setPositionValues(C,this.pivotGround,E),A.euler=new S(this.pitch,this.yaw,this.roll),this.camera.distance=M,this.camera.projection.aspectRatio=this.renderer.aspectRatio,this.camera.checkChanged()}dragLook(){const e=this.renderer.mouseListener;if(!e.mouseDown)return;const t=e.normalizedVelocity,r=this.camera.projection.FOV,n=Math.atan2(this.renderer.aspectRatio*.5,.5/Math.tan(r*.5))*2,i=-3*t.x*n,s=-3*t.y*r;this.yaw+=i;const o=J(this.lookPitch+s,this.pitchMin-this.cruisePitch+this.pitchRange,this.pitchMax-this.cruisePitch-this.pitchRange);this.pitch+=o-this.lookPitch,this.lookPitch=o}isFlightKey(e){return ve.up.includes(e)||ve.down.includes(e)||ve.left.includes(e)||ve.right.includes(e)}isTyping(e){const t=e.target;return!!t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)}}const Te={up:["KeyW","ArrowUp"],down:["KeyS","ArrowDown"],left:["KeyA","ArrowLeft"],right:["KeyD","ArrowRight"]},fl=[...Te.up,...Te.down,...Te.left,...Te.right];class pl{constructor(e,t){a(this,"yawSpeed",1.2);a(this,"pitchSpeed",.8);a(this,"keys",new Set);a(this,"listeners",new AbortController);a(this,"yaw",0);a(this,"pitch",0);this.renderer=e,this.camera=t;const r=this.listeners.signal;window.addEventListener("keydown",n=>{!fl.includes(n.code)||n.ctrlKey||n.metaKey||n.altKey||this.isTyping(n)||(this.keys.add(n.code),n.preventDefault())},{signal:r}),window.addEventListener("keyup",n=>this.keys.delete(n.code),{signal:r}),window.addEventListener("blur",()=>this.keys.clear(),{signal:r})}update(e){const t=Math.min(this.renderer.time.dt,.1),r=i=>i.some(s=>this.keys.has(s))?1:0,n=Math.min(t*8,1);if(this.yaw=ae(this.yaw,J(r(Te.right)-r(Te.left)+((e==null?void 0:e.x)??0),-1,1),n),this.pitch=ae(this.pitch,J(r(Te.up)-r(Te.down)+((e==null?void 0:e.y)??0),-1,1),n),Math.abs(this.yaw)<.001&&Math.abs(this.pitch)<.001){this.yaw=this.pitch=0;return}this.camera.rotationController.rotateBy(new k(this.pitch*this.pitchSpeed*t,-this.yaw*this.yawSpeed*t))}reset(){this.keys.clear(),this.yaw=this.pitch=0}isTyping(e){const t=e.target;return!!t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)}destruct(){this.listeners.abort()}}const ml=`//the micro normal of the water (see WaterRippleTexture.ts): three octaves of gradient noise summed into one tiling\r
//gradient, redrawn every frame. The water reads it with a single tap instead of summing the noise per pixel.\r
//rg the gradient of the height, (dh/dx, dh/dz) per world unit, scaled by rippleStrength. The gBuffer shader turns it into\r
//a normal. A gradient rather than a normal, so the mips average the slopes right\r
//\r
//It tiles because the hash is wrapped to TILE_CELLS lattice cells and every octave is sampled in a frame that is an\r
//integer matrix: that maps the lattice onto itself, so a step of the tile is a whole number of cells in every octave.\r
//It is redrawn rather than baked once because the octaves drift at their own speeds in their own directions (the\r
//dispersion of water waves, sqrt(g * lambda / 2pi)), so the sum depends on time and isn't a rigid pattern sliding by\r
\r
const TAU = 6.283185307179586;\r
const GRAVITY = 9.81;\r
//octave 0 lattice cells across the tile, the period of the hash. Mirrors TILE_CELLS of WaterRippleTexture.ts\r
const TILE_CELLS = 12.;\r
//the frame of octave i is this matrix applied i times: a rotation of about 27 degrees and a scale of sqrt(5). Different\r
//frames so the lattices of the octaves don't line up into a visible grid, integer entries so they still tile\r
const OCTAVE = mat2x2<f32>(2., -1., 1., 2.);\r
\r
struct VertexInput {\r
	@location(0) position : vec3<f32>,\r
	@location(1) uv : vec2<f32>,\r
}\r
\r
struct VertexOutput {\r
	@builtin(position) position : vec4<f32>,\r
	@location(0) uv : vec2<f32>,\r
}\r
\r
struct Uniforms {\r
	//seconds\r
	time : f32,\r
	//the wavelength of the coarsest octave in world units, the tile is TILE_CELLS of them\r
	wavelength : f32,\r
	//multiplies the drift of the dispersion relation\r
	speed : f32,\r
	//the height of the ripples, scales their gradient\r
	rippleStrength : f32,\r
}\r
\r
@group(0) @binding(0) var<uniform> uniforms : Uniforms;\r
\r
@vertex\r
fn vs_main(input : VertexInput) -> VertexOutput {\r
	var output : VertexOutput;\r
	output.position = vec4(input.position, 1.);\r
	output.uv = input.uv;\r
	return output;\r
}\r
\r
//x mod y with the sign of y, like glsl mod (the % of wgsl truncates)\r
fn modFloor(x : vec2<f32>, y : f32) -> vec2<f32> {\r
	return x - floor(x / y) * y;\r
}\r
\r
//a lattice corner gradient, uniform on the circle. Wrapped to the tile before hashing, which makes the field periodic\r
fn gradientHash(cell : vec2<f32>) -> vec2<f32> {\r
	let p = modFloor(cell, TILE_CELLS);\r
	var p3 = fract(p.xyx * vec3(.1031, .1030, .0973));\r
	p3 += dot(p3, p3.yzx + 33.33);\r
	let a = fract((p3.x + p3.y) * p3.z) * TAU;\r
	return vec2(cos(a), sin(a));\r
}\r
\r
//the derivatives of gradient noise, https://iquilezles.org/articles/gradientnoise/\r
fn noiseGradient(x : vec2<f32>) -> vec2<f32> {\r
	let i = floor(x);\r
	let f = fract(x);\r
\r
	let u = f * f * f * (f * (f * 6. - 15.) + 10.);\r
	let du = 30. * f * f * (f * (f - 2.) + 1.);\r
\r
	let ga = gradientHash(i);\r
	let gb = gradientHash(i + vec2(1., 0.));\r
	let gc = gradientHash(i + vec2(0., 1.));\r
	let gd = gradientHash(i + vec2(1., 1.));\r
\r
	let va = dot(ga, f);\r
	let vb = dot(gb, f - vec2(1., 0.));\r
	let vc = dot(gc, f - vec2(0., 1.));\r
	let vd = dot(gd, f - vec2(1., 1.));\r
\r
	let k1 = vb - va;\r
	let k2 = vc - va;\r
	let k3 = va - vb - vc + vd;\r
\r
	return ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k3 + vec2(k1, k2));\r
}\r
\r
@fragment\r
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {\r
	let wavelength = uniforms.wavelength;\r
	let tile = TILE_CELLS * wavelength;\r
	//world x, z inside one tile\r
	let p = input.uv * tile;\r
\r
	var dirs = array<vec2<f32>, 3>(vec2(.80, .60), vec2(-.57, .82), vec2(.95, -.31));\r
\r
	var g = vec2(0.);\r
	var frame = mat2x2<f32>(1., 0., 0., 1.);\r
	//the wavelength of this octave, for the dispersion relation, the frame applies the scale\r
	var lambda = wavelength;\r
	var amp = 1.;\r
	for (var i = 0; i < 3; i++) {\r
		let speed = sqrt(GRAVITY * lambda / TAU) * uniforms.speed;\r
		//a translation by a whole tile changes nothing, so the drift is wrapped to keep the precision as time grows\r
		let drift = modFloor(dirs[i] * (speed * uniforms.time), tile);\r
		let n = noiseGradient(frame * (p - drift) / wavelength);\r
		//the chain rule back out of the frame: the transpose of the frame times the gradient. Divided by the base\r
		//wavelength, the frame carries the scale of the octave\r
		g += (n * frame) * (amp / wavelength);\r
\r
		frame = OCTAVE * frame;\r
		lambda /= sqrt(5.);\r
		amp *= .62;\r
	}\r
	//no fade of the octaves that get smaller than a pixel, the mips average them away\r
	return vec4(g * (.7 * uniforms.rippleStrength), 0., 1.);\r
}\r
`,ze=class ze{constructor(e){a(this,"texture");a(this,"sampler");a(this,"renderer");a(this,"material");a(this,"_wavelength",1);this.renderer=e,this.material=new G(e,"waterRippleBake",ml),this.material.depthWriteEnabled=!1,this.texture=new H(e,ze.SIZE,ze.SIZE,{formats:["rg16float"],useMips:!0}),this.sampler=e.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"linear",mipmapFilter:"linear",maxAnisotropy:8}),this.wavelength=this._wavelength}get wavelength(){return this._wavelength}set wavelength(e){this._wavelength=e,this.material.setFloat("wavelength",e)}get tileSize(){return ze.TILE_CELLS*this._wavelength}update(e){this.material.setFloat("time",e),this.renderer.blit(null,this.texture,this.material),this.renderer.generateMipmaps(this.texture)}};a(ze,"SIZE",512),a(ze,"TILE_CELLS",12);let yr=ze;const gl="ArrowLeft",bl="ArrowUp",xl="ArrowRight",yl="ArrowDown",vl="a",wl="d",Sl="p",Ml="s",Tl="w",bt={},Je={};let It=!0,Ne=null;function hi(c=window){if(Ne)return;Ne=new AbortController;const e=Ne.signal;c.addEventListener("keydown",t=>{var n;if(!It)return;const r=t.key.toLowerCase();bt[r]=!0,(n=Je[r])==null||n.forEach(i=>i())},{signal:e}),c.addEventListener("keyup",t=>{if(!It)return;const r=t.key.toLowerCase();bt[r]=!1},{signal:e}),c.addEventListener("blur",()=>ui.cancel(),{signal:e})}function Cl(){Ne==null||Ne.abort(),Ne=null,Pr(),Object.keys(Je).forEach(c=>delete Je[c])}function El(c){It!==c&&(It=c,c||Pr())}function Pr(){Object.keys(bt).forEach(c=>bt[c]=!1)}function ci(c){return hi(),!!bt[c.toLowerCase()]}function kl(c=new k){const e=t=>ci(t)?1:0;return c.x=e(xl)+e(wl)-e(gl)-e(vl),c.y=e(bl)+e(Tl)-e(yl)-e(Ml),c}function Al(c,e){var r;hi();const t=c.toLowerCase();Je[t]=Je[t]||[],(r=Je[t])==null||r.push(e)}const ui={active:El,cancel:Pr,getKeyCodeDown:ci,getMoveDirection:kl,addKeyHitEvent:Al,destruct:Cl},Pl=.01,kn=-1.4,An=-.2,Pn=.1,_n=2,Rn=-.7,Ln=1,Bn=1,In=.01,_l=4,Rl=500,Ll=2e3;function Bl(c){const e=n=>{const i=c.get(n);return i===null||i.trim()===""?NaN:Number(i)},t=e("lat"),r=e("lng");return!(Math.abs(t)<=85)||!(Math.abs(r)<=180)?null:{lat:t,lng:r,dist:e("dist"),pitch:e("pitch"),yaw:e("yaw")}}function Il(){let c=0;const e=()=>{const t=window.eruda;if(t)try{t.destroy()}catch{c++,c<100&&setTimeout(e,100)}else++c<100&&setTimeout(e,100)};e()}class Dl{constructor(){a(this,"renderer");a(this,"camera");a(this,"airplane");a(this,"orbitKeys");a(this,"bounds",it);a(this,"workerPool");a(this,"startFrames",_l);a(this,"tileService",new Ia);a(this,"elevation",new hr);a(this,"elevationParam");a(this,"heightField");a(this,"drawMode");a(this,"quality");a(this,"timeOfDay");a(this,"backgroundColor");a(this,"skyColor");a(this,"sunColor");a(this,"cap60");a(this,"lastFrameTime",-1/0);a(this,"urlPending",!1);a(this,"cameraStillSince",0);a(this,"lastInputTime",-1/0);a(this,"urlTimeOfDay");a(this,"forward",!1);a(this,"drawBuildings");a(this,"clearColor",N.fromHex("#b8dbff"));a(this,"logDrawInfo");a(this,"distanceFog");a(this,"viewDistanceMax");a(this,"waterReflections");a(this,"reflectionRays");a(this,"waterReflection");a(this,"reflectionDarkening");a(this,"waterRipples");a(this,"ripples");a(this,"rippleSlope");a(this,"rippleSpeed");a(this,"animateWater");a(this,"rippleTime",0);a(this,"ripplesDirty",!0);a(this,"sunReflection");a(this,"sunReflectionPower");a(this,"waterMaterials",0);a(this,"snow");a(this,"snowLineOffset");a(this,"snowLineNoise");a(this,"snowColor");a(this,"snowParams",{enabled:!1,line:0,noise:0,metersPerUnit:1,color:new S(1,1,1)});a(this,"projection",new Vs);a(this,"geometry");a(this,"sun");a(this,"wallAtlasView");a(this,"picker");a(this,"ui");a(this,"tileStreamer");a(this,"ssao",null);a(this,"traffic");a(this,"taa");a(this,"gBuffer");a(this,"deferred");a(this,"tiltShift");a(this,"skyLightmap");a(this,"postSSAOVersion",-1);a(this,"shadedSSAORestart",-1);a(this,"sceneColorRT");a(this,"forwardRT");a(this,"dirty",!0);a(this,"screenshotRequested",!1);a(this,"forwardStale",!0);a(this,"shadowMapSkipped",!1);a(this,"loadingCooldown",0);a(this,"bench");a(this,"video");a(this,"frameState",{newJitter:!1,lightmapUpdating:!1,ssaoAccumulating:!1,renderMap:!1,tilesLoading:!1,cameraMoving:!1})}async start(e,t,r){_.ENABLED=!0;const n=new URLSearchParams(window.location.search||window.__initialSearch||""),i=this.startTiles(n,e);this.renderer=new qi;const s=Se()?{}:{maxStorageBufferBindingSize:2**32};if(await this.renderer.init(e,{sampleCount:1,pixelRatio:-1,requiredLimits:s}),!this.renderer.device)return this.workerPool.destroy(),!1;n.has("bench")&&(this.bench=new Bt(this.renderer,n),window.__mapWorld=this),n.has("video")&&(this.video=this.createVideo()),this.renderer.setClearColor(0,0,0,1),this.camera=new Os(this.renderer,{fov:Bn,nearPlane:In,farPlane:10,zPosition:Ln}),this.camera.rotationController.eulerXY=new k(Rn,0),this.camera.rotationController.rotationLimitX=new k(kn,An),this.camera.setDistanceLimit(Pn,_n),this.camera.pivot.position=new S(0,0,0),this.airplane=new dl(this.renderer,this.camera),this.orbitKeys=new pl(this.renderer,this.camera),this.taa=new Ys(this.renderer),this.tiltShift=new Ar(this.renderer),this.tiltShift.onChange=()=>{var f;(f=this.ssao)==null||f.reset(),this.dirty=!0},this.gBuffer=new oe(this.renderer),this.deferred=new va(this.renderer),this.sceneColorRT=new H(this.renderer,1,1,{formats:["rgb10a2unorm"],sampleCount:1,scaleToCanvas:!0}),this.skyLightmap=new Ve(this.renderer,t),this.skyLightmap.onChange=()=>this.dirty=!0;for(const f of this.deferred.materials)this.skyLightmap.addResolveMaterial(f,!0);this.deferred.bindBlueNoise(this.skyLightmap.blueNoise),this.traffic=new nl(this.renderer,this.projection);for(const f of this.traffic.resolveShaders)this.skyLightmap.addResolveMaterial(f);this.traffic.bindCity(this.skyLightmap.cityScene),this.geometry=new xo(this.renderer,this.projection,this.gBuffer),this.deferred.bindCity(this.skyLightmap.cityScene),this.ripples=new yr(this.renderer),this.ripples.wavelength=10,this.deferred.bindWaterRipples(this.ripples),this.waterReflection=new Sa(this.renderer),this.waterReflection.bindCity(this.skyLightmap.cityScene),this.waterReflection.bindWaterRipples(this.ripples);for(const f of this.geometry.layers)(f.def.key==="water"||f.def.key==="waterways")&&(this.waterMaterials|=1<<this.gBuffer.materialIndex(f.material));this.picker=new Do(this.renderer,e,()=>this.dirty=!0),ui.addKeyHitEvent(Sl,()=>this.screenshotRequested=!0),this.sun=new Co(this.renderer),this.wallAtlasView=new Po(this.renderer);for(const f of this.materials)this.sun.bindResources(f);for(const f of[...this.deferred.materials,...this.traffic.materials])this.sun.terrainSun.bind(f);this.ui=new xr(e,{getViewBounds:()=>this.currentViewBounds(),onSelectBounds:f=>void this.loadFromBounds(f),onRandomCity:()=>void this.goToRandomCity(),onToggleAirplane:()=>this.toggleAirplane(),onGoToPlace:f=>{_.log(`[MapWorld] search: ${f.title} (${f.lat.toFixed(5)}, ${f.lng.toFixed(5)})`),this.ui.showLocationTitle(f.title,f.subtitle),this.loadFromBounds(this.boundsAround(f.lat,f.lng))}}),this.traffic.setHeightField(this.heightField),this.airplane.ground=(f,m)=>this.heightField.heightAt(f,m),this.tileStreamer.attach({renderer:this.renderer,camera:this.camera,layers:this.geometry.layers,meshBounds:this.geometry.meshBounds,cityScene:this.skyLightmap.cityScene,roads:this.traffic,ground:this.geometry.groundBuffer}),this.geometry.elevation=!0;const{urlCamera:o,city:l}=await i,h=Ct.indexOf(n.get("time")??"");!this.bench&&h>=0&&(this.urlTimeOfDay=h);const u=()=>this.lastInputTime=performance.now(),d={capture:!0,passive:!0};return window.addEventListener("pointerdown",u,d),window.addEventListener("pointermove",f=>{f.buttons&&u()},d),window.addEventListener("wheel",u,d),window.addEventListener("keydown",u,d),l&&this.ui.showLocationTitle(l.name,l.landmark||void 0),!this.video&&!this.bench&&this.ui.showControlsHint(),this.resetView(),o&&this.applyUrlCamera(o),!0}async startTiles(e,t){this.workerPool=new or(parseInt(e.get("workers")??"")||void 0,this.elevation);const r=parseInt(e.get("earlyWorkers")??"");this.workerPool.activeLimit=Number.isFinite(r)?r:1;const n=this.tileService.init();this.heightField=new Ka(this.projection),this.tileStreamer=new lr({projection:this.projection,workerPool:this.workerPool,tileService:this.tileService,onTileError:f=>{var m;return(m=this.ui)==null?void 0:m.showTileError(f)},heightField:this.heightField}),this.tileStreamer.setElevation(this.elevation);const i=e.has("bench")||e.has("video")?null:Bl(e);let s;if(i)this.setPlace(this.boundsAround(i.lat,i.lng)),_.log(`[MapWorld] centering on the URL camera (${i.lat}, ${i.lng})`);else{const f=e.get("city");s=(f?await Aa(f):void 0)??ka(),this.setPlace(this.boundsAround(s.lat,s.lng)),_.log(`[MapWorld] centering on ${Zr(s)}`)}await n;const o=this.startView(i),l=an[this.startQuality].viewDistanceMax,h=Math.max(o.distance*Math.sin(-o.pitch),0),u=t.getBoundingClientRect(),d=new Da(Bn,In,Math.hypot(l,h),o.distance,o.pitch,o.yaw,u.width/Math.max(u.height,1)||1);return this.tileStreamer.setViewDistanceMax(l),this.tileStreamer.setTerrainStreamingEnabled(!0),this.tileStreamer.setCityStreamingEnabled(!0),this.tileStreamer.prefetch(d),{urlCamera:i,city:s}}get startQuality(){return Se()?fr.Medium:fr.High}startView(e){const t=Math.PI/180,r=e&&Number.isFinite(e.pitch)?J(e.pitch*t,kn,An):Rn,n=e&&Number.isFinite(e.yaw)?e.yaw*t:0,i=e&&Number.isFinite(e.dist)?J(e.dist*this.projection.metersToNorm,Pn,_n):Ln;return{pitch:r,yaw:n,distance:i}}applyUrlCamera(e){const t=this.startView(e);this.camera.rotationController.eulerXY=new k(t.pitch,t.yaw),this.camera.distance=t.distance}updateUrl(e){if(this.bench||this.video||this.airplane.active)return;const t=performance.now();if(e){t-this.lastInputTime<Ll&&(this.urlPending=!0),this.cameraStillSince=t;return}if(!this.urlPending||t-this.cameraStillSince<Rl)return;this.urlPending=!1;const r=this.camera.pivot.position,{lat:n,lng:i}=this.projection.worldToLatLng(r.x,r.z),s=this.camera.rotationController.eulerXY,o=s.y-Math.PI*2*Math.round(s.y/(Math.PI*2)),l=180/Math.PI,h=new URLSearchParams(window.location.search);h.delete("city"),h.set("lat",n.toFixed(6)),h.set("lng",i.toFixed(6)),h.set("dist",(this.camera.distance/this.projection.metersToNorm).toFixed(0)),h.set("pitch",(s.x*l).toFixed(2)),h.set("yaw",(o*l).toFixed(2)),h.set("time",Ct[this.timeOfDay.value]);const u=`${window.location.pathname}?${h}${window.location.hash}`;u!==window.location.pathname+window.location.search+window.location.hash&&window.history.replaceState(window.history.state,"",u)}currentViewBounds(){const e=this.camera.pivot.position,{lat:t,lng:r}=this.projection.worldToLatLng(e.x,e.z),n=(this.bounds.north-this.bounds.south)*.5,i=(this.bounds.east-this.bounds.west)*.5;return{south:t-n,north:t+n,west:r-i,east:r+i}}boundsAround(e,t){const r=(it.north-it.south)*.5,n=(it.east-it.west)*.5;return{south:e-r,north:e+r,west:t-n,east:t+n}}async goToRandomCity(){const e=this.camera.pivot.position,t=this.projection.worldToLatLng(e.x,e.z),r=h=>Math.abs(h.lat-t.lat)+Math.abs(h.lng-t.lng)<.5;let n,i,s,o;if(Math.random()<.5){const h=()=>Be[Math.floor(Math.random()*Be.length)];let u=h();for(let d=0;d<8&&r(u);d++)u=h();n=u,i=`${u.name}, ${u.city}, ${u.country}`,s=`${u.city}, ${u.country}`,o=u.name}else{const h=await Ea(r);n=h,i=Zr(h),s=h.name,o=h.landmark||void 0}_.log(`[MapWorld] random location: ${i}`),this.ui.showLocationTitle(s,o);let l=Qt();for(let h=0;h<8&&l===this.timeOfDay.value;h++)l=Qt();this.timeOfDay.setValue(l),await this.loadFromBounds(this.boundsAround(n.lat,n.lng))}createVideo(){const e={minHeight:0,maxHeight:0};return new to(this.renderer,{example:this,step:()=>this.update(),load:(t,r)=>this.loadFromBounds(this.boundsAround(t,r)),place:(t,r,n,i,s,o)=>{const l=this.airplane;l.active||(l.enter(this.projection.metersToNorm),e.minHeight=l.minHeight,e.maxHeight=l.maxHeight),l.minHeight=Math.min(e.minHeight,n),l.maxHeight=Math.max(e.maxHeight,n),l.speed=s,l.cruisePitch=o,l.place(t,-r,n*this.projection.metersToNorm,i)},metersToNorm:()=>this.projection.metersToNorm,settled:()=>this.tileStreamer.isIdle()&&!this.skyLightmap.converging,inside:()=>this.skyLightmap.cityScene.pick(this.camera.worldPosition,S.UP)!=null})}toggleAirplane(){return this.airplane.active?this.airplane.exit():this.airplane.enter(this.projection.metersToNorm),this.orbitKeys.reset(),this.airplane.active}async loadFromBounds(e){this.tileStreamer.setTerrainStreamingEnabled(!1),this.tileStreamer.setCityStreamingEnabled(!1),this.tileStreamer.clearAllTerrainTiles(),this.tileStreamer.clearAllCityTiles(),this.picker.clearSelection(),this.setPlace(e),this.resetView()}setPlace(e){var t;this.projection.setBounds(e),this.bounds=e,this.elevation.setOrigin(this.projection.latMid,this.projection.lngMid),((t=this.elevationParam)==null?void 0:t.value)!==!1&&this.elevation.preload(this.projection.latMid,this.projection.lngMid)}resetView(){var e,t;this.timeOfDay&&this.applySunAngles(),this.skyLightmap.reset(),(e=this.sun)==null||e.shadowMap.reset(),this.airplane.active&&this.airplane.recenter(),this.camera.pivot.position=new S(0,0,0),this.tileStreamer.resetStreamingPosition(),this.taa.invalidate(),(t=this.ssao)==null||t.reset(),this.tileStreamer.setTerrainStreamingEnabled(!0),(!this.drawBuildings||this.drawBuildings.value)&&this.tileStreamer.setCityStreamingEnabled(!0),this.dirty=!0}init(){var b,g;const e=new At("controls");this.drawMode=e.addParamSelect("drawMode",ue.Full,ao,{callback:()=>this.applyDrawMode()}),this.quality=e.addParamSelect("quality",this.startQuality,ro,{callback:()=>this.applyQuality()});const t=this.bench?ai.Afternoon:this.urlTimeOfDay??Qt();this.timeOfDay=e.addParamSelect("timeOfDay",t,Ct,{callback:()=>{this.applyTimeOfDay(),this.urlPending=!0}}),this.cap60=e.addParamBool("cap60fps",Se()),this.logDrawInfo=e.addParamBool("logDrawInfo",!1);const r=()=>this.dirty=!0,n=e.addGroup("Layers");for(const y of this.geometry.layers)y.enabled=n.addParamBool(y.def.label,y.def.defaultOn,{callback:r});this.drawBuildings=n.addParamBool("buildings",!0,{callback:()=>{var y;this.dirty=!0,(y=this.ssao)==null||y.reset(),this.drawBuildings.value?(this.tileStreamer.setCityStreamingEnabled(!0),this.tileStreamer.resetStreamingPosition()):(this.tileStreamer.setCityStreamingEnabled(!1),this.tileStreamer.clearAllCityTiles(),this.picker.clearSelection())}});const i=n.addParamBool("trees",!0,{callback:()=>{var y;this.dirty=!0,(y=this.ssao)==null||y.reset(),this.picker.clearSelection(),this.tileStreamer.setTreesEnabled(i.value)}});this.tileStreamer.setTreesEnabled(i.value),this.elevationParam=n.addParamBool("elevation",!0,{callback:()=>this.applyElevation()}),this.elevationParam.value!==this.geometry.elevation&&this.applyElevation();const s=e.addGroup("Map colors"),o=y=>new S(y[0],y[1],y[2]),l=(y,v,w)=>{s.addParamColor(y,v,{callback:M=>{w(M),this.dirty=!0}})};l("buildings",new S(1,1,1),y=>this.geometry.setBuildingColor(y)),l("ground",new S(.5,.5,.5),y=>this.geometry.setGroundColor(y)),this.geometry.layers.forEach((y,v)=>{y.def.key!=="glacier"&&l(y.def.label,o(y.def.color),w=>this.geometry.setLayerColor(v,w))}),l("treeTrunks",o(ri),y=>this.geometry.setTreeTrunkColor(y));const h=Ze.reduce((y,v)=>y.add(o(v)),new S(0,0,0));l("treeCrowns",h.multiplyScalar(1/Ze.length),y=>this.geometry.setTreeCrownColor(y));const u=e.addGroup("Snow");this.snow=u.addParamBool("snow",!0,{callback:r}),this.snowLineOffset=u.addParamFloat("snowLineOffset",0,-2e3,2e3,{callback:r}),this.snowLineNoise=u.addParamFloat("snowLineNoise",150,0,500,{callback:r});const d=this.geometry.layers.findIndex(y=>y.def.key==="glacier");this.snowColor=u.addParamColor("snowColor",N.fromHex("#eef2f7").vector3,{callback:y=>{this.geometry.setLayerColor(d,y),this.dirty=!0}}),this.geometry.setLayerColor(d,this.snowColor.value);const f=e.addGroup("Shading"),m={materials:this.materials,callback:r};this.backgroundColor=f.addParamColor("backgroundColor",this.clearColor.vector3,{...m,callback:y=>{this.clearColor.setValues(y.x,y.y,y.z,1),this.dirty=!0}}),this.skyColor=f.addParamColor("skyColor",N.fromHex("#96a3b0").vector3,m),this.sunColor=f.addParamColor("sunColor",N.fromHex("#b0a7a0").vector3,m),this.distanceFog=f.addParamFloat("distanceFog",.25,0,1,m),this.viewDistanceMax=f.addParamFloat("viewDistanceMax",8,3,12,{...m,callback:()=>{this.applyViewDistanceMax(),this.dirty=!0}}),this.applyViewDistanceMax(),f.addParamFloat("contrast",.2,0,1,m);const p=f.addParamBool("toneMap",!0,{callback:y=>{this.deferred.toneMap=y,this.dirty=!0}});this.deferred.toneMap=p.value,f.addParamFloat("exposure",1.5,0,4,m),this.waterReflections=f.addParamBool("waterReflections",!1,{callback:r}),this.reflectionRays=f.addParamSelect("reflectionRays",si.PerPixel,io,{callback:r}),this.reflectionDarkening=f.addParamFloat("reflectionDarkening",.35,0,1,{callback:r}),this.waterRipples=f.addParamBool("waterRipples",!0,{callback:r});const x=()=>{this.ripples.material.setFloat("rippleStrength",this.rippleSlope.value*this.ripples.wavelength),this.ripples.material.setFloat("speed",this.rippleSpeed.value),this.ripplesDirty=!0,this.dirty=!0};this.rippleSlope=f.addParamFloat("rippleSlope",.05,0,.5,{callback:x}),f.addParamFloat("rippleWavelength",this.ripples.wavelength,1,50,{callback:y=>{this.ripples.wavelength=y,x()}}),this.rippleSpeed=f.addParamFloat("rippleSpeed",.5,0,2,{callback:x}),this.animateWater=f.addParamBool("animateWater",!0,{callback:r}),x(),this.sunReflection=f.addParamFloat("sunReflection",8,0,16,{callback:r}),this.sunReflectionPower=f.addParamFloat("sunReflectionPower",200,10,1e3,{callback:r}),f.addParamFloat("skyReflection",1,0,4,m),f.addParamFloat("sunFresnel",4,0,16,m),f.addParamFloat("sunSize",.02,0,.1,m),f.addParamFloat("sunGlow",.4,0,1,m),this.sun.initParams(f,this.materials,r),this.applyTimeOfDay(),this.applyDrawMode(),this.sun.init(e),(b=this.ssao)==null||b.init(e),this.skyLightmap.init(e),this.taa.init(e),this.tiltShift.init(e),this.traffic.init(e),this.tileStreamer.init(e),this.applyQuality(),Se()&&(e.collapsed=!0,Il()),e.collapseChildrenRecursive(),new Ms(e),(g=this.bench)==null||g.applyParams(this),this.update(),this.video&&(this.video.ready=!0)}applyDrawMode(){const e=this.drawMode.value;this.skyLightmap.view=ln[e]??Le.Shaded;const t=on[e]??0;this.deferred.shadowView=t;for(const r of this.geometry.forwardMaterials)r.setFloat("shadowDebug",e===ue.ShadowMapCascades?1:0);this.dirty=!0}applyQuality(){const e=an[this.quality.value];this.skyLightmap.enabled.setValue(e.skyVisibility),this.taa.enabled.setValue(e.TAAEnabled),this.tiltShift.enabled.setValue(e.tiltShiftEnabled),this.tiltShift.halfRes.setValue(e.tiltShiftHalfRes),this.traffic.msaa.setValue(e.carsMSAA),this.traffic.perPixelLighting.setValue(e.carsPerPixelLighting),this.sun.mode.setValue(e.shadowMode),this.waterReflections.setValue(e.waterReflections),this.reflectionRays.setValue(e.reflectionRays),this.waterRipples.setValue(e.waterRipples),this.animateWater.setValue(e.animateWater),this.forward=e.forward,this.viewDistanceMax.setValue(e.viewDistanceMax),this.renderer.canvasManager.pixelRatioMax=e.pixelRatioMax,this.skyLightmap.setQuality(e.lightMapSize,e.texelsPerPixel,e.traceSamplesMax,e.sampleCount,e.referenceCellSize,e.lightmapResolution,e.searchCount),this.dirty=!0}applyTimeOfDay(){const e=hn[this.timeOfDay.value];this.applySunAngles(),this.skyColor.setValue(N.fromHex(e.skyColor).vector3),this.sunColor.setValue(N.fromHex(e.sunColor).vector3),this.backgroundColor.setValue(N.fromHex(e.backgroundColor).vector3),this.dirty=!0}followGround(){var n;const e=this.camera.pivot.position,t=this.heightField.heightAt(e.x,e.z)??(((n=this.elevationParam)==null?void 0:n.value)===!1?0:null);if(t===null||t===e.y)return;let r=e.y+(t-e.y)*(1-Math.exp(-6*Math.min(this.renderer.time.dt,.1)));Math.abs(t-r)<Pl*this.projection.metersToNorm&&(r=t),this.camera.pivot.setPositionValues(e.x,r,e.z)}applyElevation(){var t,r;const e=this.elevationParam.value;this.geometry.elevation=e,this.tileStreamer.setElevation(e?this.elevation:null),this.tileStreamer.clearAllTerrainTiles(),this.tileStreamer.clearAllCityTiles(),this.picker.clearSelection(),this.skyLightmap.reset(),(t=this.sun)==null||t.shadowMap.reset(),this.taa.invalidate(),(r=this.ssao)==null||r.reset(),this.tileStreamer.resetStreamingPosition(),this.dirty=!0}applyViewDistanceMax(){const e=this.viewDistanceMax.value;this.updateFarPlane(),this.geometry.setViewDistanceMax(e),this.tileStreamer.setViewDistanceMax(e)}updateFarPlane(){const e=this.viewDistanceMax.value,t=Math.max(this.camera.worldPosition.y,0);this.camera.projection.far=Math.sqrt(e*e+t*t)}applySunAngles(){const e=hn[this.timeOfDay.value],{angleX:t,angleY:r}=lo(e,this.projection.latMid);this.sun.setSunAngles(t,r)}get shadowMode(){const e=this.sun.mode.value;return this.forward?e===Z.None?Z.None:Z.ShadowMap:e===Z.LightmapRaytrace&&!this.skyLightmap.active?Z.Raytrace:e}get showOverdraw(){return this.drawMode.value===ue.Overdraw}get materials(){return[...this.deferred.materials,...this.geometry.forwardMaterials,...this.traffic.materials]}get visibleCity(){if(!this.drawBuildings.value)return null;const e=this.tileStreamer;return{meshes:e.cityMeshes,slots:e.cityMeshSlots,tiles:e.cityMeshTiles,quantization:e.cityMeshQuantization}}update(e=0){var i,s,o,l;if(this.cap60.value&&!this.bench&&!this.video&&!this.renderer.profiler.recording&&e-this.lastFrameTime<1e3/60-4){window.requestAnimationFrame(h=>this.update(h));return}this.lastFrameTime=e,this.renderer.update(this.bench?this.bench.nextTime():this.video?this.video.nextTime():e),this.camera.projection.resetJitter(),(i=this.bench)==null||i.moveCamera(this.camera),this.airplane.active?this.airplane.update(this.projection.metersToNorm,((s=this.video)==null?void 0:s.stick)??((o=this.ui)==null?void 0:o.joystickValue)):(!this.video&&!this.bench&&this.orbitKeys.update((l=this.ui)==null?void 0:l.joystickValue),this.followGround(),this.camera.update(),this.airplane.settle()),this.updateFarPlane(),this.tileStreamer.setSunDirection(this.sun.lightDir),this.tileStreamer.update(this.renderer.time.dt),this.geometry.updateFrustum(this.camera);const t=this.camera.changed;this.updateUrl(t),this.tileStreamer.isIdle()?this.loadingCooldown=Math.max(0,this.loadingCooldown-this.renderer.time.dt):this.loadingCooldown=.5;const r=this.loadingCooldown>0,n=this.tileStreamer.consumeCityTilesChanged();if(!this.forward&&!this.showOverdraw&&this.traffic.update(this.renderer.time.dt,this.camera,this.renderer.canvas.height),this.updateSnow(),this.draw(this.dirty,t,r,n),this.dirty=!1,this.startFrames>0&&--this.startFrames===0&&(this.workerPool.activeLimit=this.workerPool.size),this.screenshotRequested){this.screenshotRequested=!1;const h=new Date().toISOString().slice(0,19).replace(/[T:]/g,"-");Ni(this.renderer.canvas,`raytracedmap-${h}.png`)}if(this.bench){const h=this.skyLightmap;this.bench.afterFrame(this.frameState,this.tileStreamer.isIdle(),h.unconvergedCells/Math.max(h.cellCount,1))}this.camera.projection.resetJitter(),this.drawBuildings.value&&this.picker.update(this.camera.viewProjection,this.camera.worldPosition,this.tileStreamer),this.video||window.requestAnimationFrame(h=>this.update(h))}updateSnow(){const e=this.snowParams,t=this.projection.metersToNorm,{lat:r}=this.projection.worldToLatLng(this.camera.pivot.position.x,this.camera.pivot.position.z),n=Ua(r)+this.snowLineOffset.value-this.elevation.originHeight,i=this.heightField.maxHeightM+this.snowLineNoise.value>n-Va,s=this.snow.value&&this.geometry.elevation&&i,o=n*t;(s!==e.enabled||Math.abs(o-e.line)>.5*t)&&(this.dirty=!0),e.enabled=s,e.line=o,e.noise=this.snowLineNoise.value,e.metersPerUnit=1/t,e.color=this.snowColor.value,this.deferred.setSnow(this.geometry.snowMaterials,e),this.geometry.setSnow(e)}shadowsAhead(){if(!this.airplane.active)return null;const e=this.camera.worldPosition.clone();e.y=this.camera.pivot.worldPosition.y;const t=S.subtract(this.camera.pivot.worldPosition,e);t.y=0;const r=t.length();return r<1e-6?null:(t.normalize(),{origin:e,forward:t,focus:r})}draw(e,t,r,n){let i=!0;const s=this.geometry.elevation?this.geometry.groundBuffer:null,o=this.tileStreamer.consumeGroundChanged();o&&this.sun.terrainSun.setDirty();const l=this.drawMode.value,h=this.shadowMode===Z.ShadowMap||l===ue.ShadowMap||l===ue.ShadowMapCascades;!this.showOverdraw&&h?(this.shadowMapSkipped&&this.sun.shadowMap.reset(),this.shadowMapSkipped=!1,i=this.sun.update(this.camera,n||o,{meshes:this.tileStreamer.cityMeshes,quantization:this.tileStreamer.cityMeshQuantization},s,this.shadowsAhead())):this.shadowMapSkipped=!0;const u=this.shadowMode===Z.LightmapRaytrace||this.shadowMode===Z.Raytrace;if(!this.showOverdraw&&u&&this.sun.updateTerrainSun(this.camera,this.viewDistanceMax.value,s),this.drawMode.value===ue.ShadowMap?this.sun.drawView(this.projection.metersToNorm):this.drawMode.value===ue.WallAtlas?this.wallAtlasView.draw(this.tileStreamer.lastCityTile,this.projection.metersToNorm):this.forward&&!this.showOverdraw&&this.sceneColorRT?this.drawForward(this.getForwardRT(),t,r,e||t||r||n||!i):this.drawDeferred(e,t,r,n,i),this.renderer.finish(),this.logDrawInfo.value){const d=this.geometry.stats;console.log("meshCount",d.meshCount,"vertexCount",d.vertexCount,"culledCount",d.culledCount,"workers",this.tileStreamer.activeWorkers)}}getForwardRT(){return this.forwardRT??(this.forwardRT=new H(this.renderer,1,1,{formats:["rgb10a2unorm"],depth:!0,discardDepth:!0,sampleCount:1,scaleToCanvas:!0,toScreen:!1})),this.forwardRT}drawForward(e,t,r,n){var s;const i=n||this.forwardStale;if(this.forwardStale=!1,this.frameState={newJitter:!1,lightmapUpdating:!1,ssaoAccumulating:!1,renderMap:i,tilesLoading:r,cameraMoving:t},this.taa.invalidate(),(s=this.ssao)==null||s.reset(),this.tiltShift.invalidate(),this.postSSAOVersion=-1,this.geometry.resetStats(),i){const o=this.shadowMode===Z.None?0:this.sun.shadowStrength.value;for(const h of this.geometry.forwardMaterials)h.setFloat("shadowStrength",o);const l=this.visibleCity;this.renderer.startRenderPass(e,{clearColor:this.clearColor,colorClear:!0,depthClear:!0},0,"mapForward"),this.geometry.drawForward(this.camera,l,this.picker.selectedID),this.drawMode.value===ue.BoundingBoxes&&(this.renderer.startRenderPass(e,{colorClear:!1,depthClear:!1}),this.geometry.drawBoundingBoxes(this.camera.viewProjection,l))}this.renderer.blit(e,null,null,!0)}drawDeferred(e,t,r,n,i){this.forwardStale=!0;const s=on[this.drawMode.value]!=null,o=this.sceneColorRT!=null&&!this.showOverdraw,l=this.skyLightmap,h=this.shadowMode;l.setSun(h===Z.LightmapRaytrace,this.sun.lightDir,this.sun.sunRadius.value);const u=l.active&&o,d=o&&l.showsLightmap,f=t||r||e||n,m=u&&(f||l.converging),p=this.waterReflections.value&&l.active,x=o&&(p||this.waterRipples.value),b=x&&this.waterRipples.value&&this.rippleSlope.value>0,g=b&&this.animateWater.value&&this.rippleSpeed.value>0,y=ln[this.drawMode.value]!=null,v=this.ssao,w=v!=null&&o&&!d&&!y&&v.active&&!s,M=t?Tt.Moving:r?Tt.Loading:Tt.Converging,C=w&&v.shadesSky,E=C?v.restartVersion:-1,A=E!==this.shadedSSAORestart;this.shadedSSAORestart=E;const P=w&&v.accumulating(M),T=!C||!P||v.settling,L=m&&!f&&l.settling,D=!t&&!r&&i&&!e&&!g&&(!m||L)&&!A&&T;o?D||this.taa.restart():this.taa.invalidate();const B=!o||!this.taa.converged||d||m||g||C&&P,K=o&&(B||P);this.frameState={newJitter:K,lightmapUpdating:m,ssaoAccumulating:P,renderMap:B,tilesLoading:r,cameraMoving:t},this.taa.setCamera(this.camera,K);const te=this.camera.viewProjection,$=this.tiltShift.active&&!s?this.tiltShift.getBlur(this.camera):{slope:0,max:0},U=this.projection.metersToNorm,be=this.visibleCity;g&&(this.rippleTime+=this.renderer.time.dt),B&&b&&(g||this.ripplesDirty)&&(this.ripples.update(this.rippleTime),this.ripplesDirty=!1),this.geometry.resetStats(),K&&this.gBuffer.render(this.camera,U,()=>this.geometry.drawGBuffer(this.camera,be,this.picker.selectedID)),m&&K&&l.update({camera:this.camera,blur:$,metersToNorm:U,changed:f,gBuffer:this.gBuffer}),w?v.update(this.camera,this.taa,M,this.gBuffer,$):v==null||v.reset();const xe=h===Z.LightmapRaytrace||h===Z.Raytrace;if(this.deferred.setSunShadows(h,xe&&this.taa.enabled.value),this.traffic.sunShadows=h===Z.None?0:xe?2:1,this.traffic.lightDirection.copy(this.sun.lightDir),xe&&o&&(l.cityScene.enable(),l.cityScene.update(this.renderer.time.frameNumber)),this.showOverdraw)this.geometry.drawOverdraw(this.camera,be);else if(B&&this.sceneColorRT){l.setResolveUniforms(this.camera,$,U,this.taa.enabled.value);const Wt=b?this.ripples.tileSize*U:0,[Rr,Lr]=so[this.reflectionRays.value],xt=x&&p&&Rr*Lr>1?this.waterReflection:null;xt&&(xt.setBlock(Rr,Lr),xt.draw(this.camera,this.gBuffer,this.waterMaterials,Wt,this.taa.enabled.value)),this.deferred.setWaterReflections(x?this.waterMaterials:0,p,this.reflectionDarkening.value,Wt,this.sunReflection.value,this.sunReflectionPower.value,xt),l.halfResActive&&l.halfResPass.draw(this.camera,this.gBuffer),this.deferred.setSSAO(v,C),this.deferred.draw(this.camera,this.gBuffer,this.sceneColorRT,l.halfResPass),this.drawMode.value===ue.BoundingBoxes&&(this.renderer.startRenderPass(this.sceneColorRT,{colorClear:!1,depthClear:!1}),this.geometry.drawBoundingBoxes(te,be)),d||this.taa.resolve(this.camera,this.sceneColorRT,this.gBuffer.depthView,D)}const Ue=w&&!C?v.version:-1,ye=o&&!d&&!s?this.tiltShift.target:null,Ge=o&&!d&&!s&&!(w&&v.showOnly)&&this.traffic.active,_r=ye!=null&&!B&&!Ge&&Ue===this.postSSAOVersion&&this.tiltShift.holdsTarget;this.postSSAOVersion=Ue,_r||(!(w&&!C&&v.composite(this.distanceFog.value,this.viewDistanceMax.value,this.taa.output,ye))&&o&&!(w&&v.showOnly)&&this.renderer.blit(d?this.sceneColorRT:this.taa.output,ye,null,!0),Ge&&this.traffic.draw(this.camera,this.taa.viewProjectionNoJitter,this.gBuffer,ye)),ye?this.tiltShift.draw(this.camera,!_r,null,!f&&!Ge):this.tiltShift.invalidate(),l.drawRayGraph()}destruct(){var e,t,r,n,i,s,o,l,h,u,d,f,m,p,x,b,g,y;(e=this.ui)==null||e.destruct(),(t=this.orbitKeys)==null||t.destruct(),(r=this.picker)==null||r.destruct(),this.tileStreamer.destruct(),(n=this.workerPool)==null||n.destroy(),this.elevation.destroy(),(i=this.geometry)==null||i.destruct(),(s=this.ssao)==null||s.destruct(),(o=this.traffic)==null||o.destruct(),(l=this.taa)==null||l.destruct(),(h=this.gBuffer)==null||h.destruct(),(u=this.deferred)==null||u.destruct(),(d=this.ripples)==null||d.texture.destruct(),(f=this.waterReflection)==null||f.destruct(),(m=this.skyLightmap)==null||m.destruct(),(p=this.tiltShift)==null||p.destruct(),(x=this.sun)==null||x.destruct(),(b=this.wallAtlasView)==null||b.destruct(),(g=this.sceneColorRT)==null||g.destruct(),(y=this.forwardRT)==null||y.destruct()}}kt.install(new URLSearchParams(window.location.search).has("uncapped"));const Dn=document.getElementById("webgl-preloader-container"),Fn=document.getElementById("webgl-preloader-progress");function St(c){if(!Dn||!Fn)throw new ReferenceError("Unable to find container divs in html");Dn.style.display=c<1?"block":"none",Fn.style.width=(276*c|0)+"px"}async function Fl(){St(0);const c=new gi,e=document.createElement("div");e.classList.add("webgpu-container"),document.body.appendChild(e);const t=new Dl;if(!await t.start(e,c,!0)){St(1);return}c.load(()=>{St(1),t.init()},r=>St(r))}Fl();
