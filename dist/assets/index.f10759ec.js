var le=Object.defineProperty;var re=(d,e,i)=>e in d?le(d,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):d[e]=i;var h=(d,e,i)=>(re(d,typeof e!="symbol"?e+"":e,i),i),he=(d,e,i)=>{if(!e.has(d))throw TypeError("Cannot "+i)};var Z=(d,e,i)=>(he(d,e,"read from private field"),i?i.call(d):e.get(d)),K=(d,e,i)=>{if(e.has(d))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(d):e.set(d,i)};import{H as de,M as ce,V as M,S as T,D as J,P as _,T as F,C as ee,a as P,b as me,A as S,c as ue,B as Y,d as ge,E,R as fe,e as X,f as $,W as pe,g as ye,h as be,U as Ce,i as Me,j as xe}from"./vendor.10332a84.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&t(l)}).observe(document,{childList:!0,subtree:!0});function i(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerpolicy&&(s.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?s.credentials="include":n.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function t(n){if(n.ep)return;n.ep=!0;const s=i(n);fetch(n.href,s)}})();window.exports=window;class Ae{constructor(e,i,t,n=0){h(this,"complete",!1);h(this,"title");h(this,"description");h(this,"failed",!1);h(this,"onFail");h(this,"onSuccess");h(this,"onCompletion");h(this,"currentState");h(this,"tasks");h(this,"resetSOP",()=>{this.currentState=0,this.failed=!1,this.complete=!1});this.title=e,this.description=i,this.tasks=t,this.currentState=n}}const R="./",B=60,Se=50,te=3,I="cylinder",L="liquid",ve="placard",y=new Ae("","",[{next:"CtoA",label:"BtoC"},{next:"complete",label:"CtoA"}]);function C(d,e){return d.getChildMeshes().find(i=>i.name===e)||null}function z(d){d.rotation.x=0,d.rotation.y=0,d.rotation.z=0}function ie(d){d.position.x=0,d.position.y=0,d.position.z=0}class G{constructor(e,i,t,n){h(this,"name");h(this,"position");h(this,"mesh");h(this,"dragCollision");h(this,"highlightLayer");h(this,"scene");h(this,"particleSystem");h(this,"currentColor");h(this,"originalColor");h(this,"startOpacity");console.log(e),this.name=t,this.currentColor=n,this.originalColor=n,this.startOpacity=.7;const s=e.getScene();this.scene=s,this.highlightLayer=new de("highlight-layer",s),this.highlightLayer.innerGlow=!0,this.highlightLayer.outerGlow=!1;const l=s.getMeshByName("Table");let o=ce.CreateSphere(`pivot-Cylinder-${t}`,{segments:2,diameterX:.15,diameterY:.33,diameterZ:.2},e.getScene());if(o.visibility=0,e.name=t,e.parent=o,e.rotationQuaternion=null,e.getChildMeshes().forEach(b=>{switch(b.name){case"BeakerwOpacity":b.name=I,b.rotationQuaternion=null,b.rotation.z=2*Math.PI,b.isPickable=!1;break;case"BeakerLiquid":b.name=L,b.isPickable=!1;break}}),l){const b=l.getBoundingInfo().boundingBox,D=C(e,I).getBoundingInfo().boundingBox.maximum.y+1e-8;o.position.y=b.maximumWorld.y+D,o.position.x=(b.maximumWorld.x-b.minimumWorld.x)/te*i+b.minimumWorld.x-.3,o.position.z=(b.centerWorld.z+b.minimumWorld.z)/2,this.position={...o.position}}else o.position.x=-2+i,o.position.y=1.22,o.position.z=.5;o.checkCollisions=!0,o.ellipsoid=new M(.02,.16,.02),this.mesh=o;const r=C(e,L),m=new T("liquid-material");m.diffuseColor=n,r.material=m;const u=C(e,"Label"),c=C(e,"LabelBack");console.log("Label:",c);const g=new J("dynamic texture",256,s),f=new T("Mat",s);f.diffuseTexture=g,u.material=f,c.material=f;const p="bold 300px monospace";g.drawText(e.name.toUpperCase(),65,225,p,"black","white");let v=this.mesh.getChildMeshes().find(b=>b.name==="cylinder");this.mesh.animations=v.animations,console.log("Children: ",this.mesh.getChildMeshes());const A=new _("particles",500,this.scene);A.particleTexture=new F("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png",this.scene),A.minLifeTime=.5,A.maxLifeTime=.7,A.emitRate=100,A.gravity=new M(0,.5,0),A.minSize=.01,A.maxSize=.07,A.createPointEmitter(new M(0,0,0),new M(0,1,0)),A.addColorGradient(1,ee.FromColor3(r.material.diffuseColor,1)),A.blendMode=_.BLENDMODE_STANDARD,A.emitter=this.mesh.position,this.particleSystem=A,this.setOpacity(this.startOpacity),this.addDragCollision()}startParticles(){this.particleSystem.start()}highlight(e=!0){let i=C(this.mesh,I);e?(console.log("Adding mesh"),this.highlightLayer.hasMesh(i)||this.highlightLayer.addMesh(i,P.Green())):this.highlightLayer.hasMesh(i)&&this.highlightLayer.removeMesh(i)}addDragCollision(){let e=new me({dragPlaneNormal:new M(0,0,1)});e.useObjectOrientationForDragging=!1,e.moveAttached=!1,e.onDragStartObservable.add(()=>{}),e.onDragObservable.add(i=>{this.mesh.moveWithCollisions(i.delta)}),e.onDragEndObservable.add(()=>{this.fadeAndRespawn()}),this.mesh.addBehavior(e),this.dragCollision=e}removeDragCollision(){this.mesh.removeBehavior(this.dragCollision)}fadeAndRespawn(e=Se){setTimeout(()=>{this.mesh.isPickable=!1;let i=60;this.mesh.name.split("-")[0];let t=this.mesh.getScene(),n=this.mesh.getChildMeshes(),s=n.find(r=>r.name==="cylinder");n.find(r=>r.name==="liquid");const l=C(this.mesh,L);console.log("Visibility: ",l.visibility);let o=[{name:"Invisibility",startValue:l.visibility},{name:"Visibility",startValue:0}];o.forEach(r=>{r.init=new S(r.name,"visibility",120,S.ANIMATIONTYPE_FLOAT,S.ANIMATIONLOOPMODE_CONSTANT),r.init.setKeys([{frame:0,value:r.startValue},{frame:i,value:l.visibility-r.startValue}])});for(let r=0;r<n.length-1;++r){let m=n[r];t.beginDirectAnimation(m,[o[0].init],0,60,!1)}t.beginDirectAnimation(n[n.length-1],[o[0].init],0,60,!1,void 0,()=>{console.log(this.mesh,this.position),this.mesh.position.x=this.position._x,this.mesh.position.y=this.position._y,this.mesh.position.z=this.position._z,this.mesh.animations=s.animations;let r=C(this.mesh,I);z(this.mesh),z(r),ie(r);for(let m=0;m<n.length-1;++m){let u=n[m];t.beginDirectAnimation(u,[o[1].init],0,60,!1)}t.beginDirectAnimation(n[n.length-1],[o[1].init],0,60,!1,void 0,()=>{this.highlight(!1),this.mesh.isPickable=!0})})},e)}rotateAroundZ(){let e=this.mesh.getAnimationByName(`${this.name}-rotateAroundZ`);this.scene.beginDirectAnimation(C(this.mesh,I),[e],0,60,!1,void 0,()=>{})}resetAroundZ(){let e=this.mesh.getAnimationByName(`${this.name}-resetRotateAroundZ`);this.scene.beginDirectAnimation(C(this.mesh,I),[e],0,60,!1,void 0,()=>{})}setColor(e){const i=C(this.mesh,L),t=new T("liquid-material");t.diffuseColor=e,i.material=t,this.currentColor=e,console.log(this.currentColor)}setOpacity(e){const i=C(this.mesh,L);i.visibility=e}resetProperties(){this.setOpacity(this.startOpacity),this.setColor(this.originalColor)}}const Ie="Stony Brook University VR Laboratory",Pe="Victor Ruben",Ne="VR Chemical Mixture Synthesis",Oe="4/1/2022",we="General: Properly mixing VR chemicals",Be="42",Le="I",Te=[{text:"HAZARD IDENTIFICATION test from JSON",sublistType:"a",sublist:[{text:"Improper mixing of chemicals can lead to explosive results!"}]},{text:"CHEMICAL HANDLING PROCEDURES",sublistType:"a",sublist:[{text:"When mixing these chemicals - always follow the correct sequence"},{text:"Pour chemical B into chemical C"},{text:"Then pour chemical mixture B+C into chemical A"}]},{text:"EMERGENCY PROCEDURES",sublistType:"a",sublist:[{text:"In the event of an improper mixture - use the fire extinguisher to put out the flames"},{text:"Evacuate the lab"},{text:"Call for emergency services"}]}],j={facility:Ie,labDirector:Pe,scope:Ne,lastRevision:Oe,general:we,sopNum:Be,listType:Le,items:Te};function Ee(d){d.name="clipboard";const e=d.getScene(),i=e.getMeshByName("Table");if(i){const l=i.getBoundingInfo().boundingBox;d.position.y=l.maximumWorld.y+.003}d.rotationQuaternion=null,d.rotation=new M(0,Math.PI/4,0);const t=e.getMeshByName("pivot-Cylinder-A");t&&(d.position.x=t.position.x+.2,d.position.z=t.position.z+.5);function n(l){console.log("data: ",j);let o=document.createElement("template");o.innerHTML=l;var r=ue.compile(o.innerHTML),m=r(j);return o.innerHTML=m,o.content}function s(l){const r="data:image/svg+xml;utf8,"+encodeURIComponent(l),m=F.LoadFromDataString("tex",r,e,void 0,void 0,void 0,F.LINEAR_LINEAR_MIPNEAREST);let u=new T("mat",e);u.diffuseTexture=m,m.uScale=1,m.vScale=-1,u.emissiveColor=P.White(),u.useAlphaFromDiffuseTexture=!0,m.hasAlpha=!0;let c=C(d,"Plane");c.material=u,console.log("Material set")}fetch(`${R}images/sopTemplate.svg`).then(l=>l.text()).then(l=>{console.log("fetched!");let o=n(l),r=o.getElementById("procedure-list");console.log(r);const u=new XMLSerializer().serializeToString(o);s(u)}).catch(console.error.bind(console))}function De(d){var e=new Y(P.FromHexString("#0984e3"));e.ignoreChildren=!0;var i=d[0],t=Y.MakeNotPickableAndWrapInBoundingBox(i);e.attachedMesh=t,e.onScaleBoxDragObservable.add(()=>{console.log("scaleDrag")}),e.onScaleBoxDragEndObservable.add(()=>{const n=e.attachedMesh;if(n){const s=n.getHierarchyBoundingVectors(!0);console.log("size x:",s.max.x-s.min.x),console.log("size y:",s.max.y-s.min.y),console.log("size z:",s.max.z-s.min.z)}console.log("scaleEnd")}),e.onRotationSphereDragObservable.add(()=>{console.log("rotDrag")}),e.onRotationSphereDragEndObservable.add(()=>{console.log("rotEnd")})}function q(d,e,i){const t=d.find(c=>c.name==="__root__"),n=t.getScene();t.name=i;const s=d.find(c=>c.name==="Label"),l=d.find(c=>c.name==="Placard");l.name=ve;const o=new J("dynamic texture",256,n);o.wAng=-Math.PI/2,o.uAng=Math.PI;const r=new T("Mat",n);r.diffuseTexture=o,s.material=r;const m="bold 220px monospace";o.drawText(t.name.split("-")[1].toUpperCase(),65,185,m,"black","white"),l.addChild(s),l.rotationQuaternion=null,l.rotation=new M(0,Math.PI/2,0);const u=n.getMeshByName("Table");if(u){const c=u.getBoundingInfo().boundingBox;t.position.y=c.maximumWorld.y+.003,t.position.x=(c.maximumWorld.x-c.minimumWorld.x)/te*e+c.minimumWorld.x-.2,t.position.z=(c.centerWorld.z+c.minimumWorld.z)/2+.2}}function ke(d,e,i){let t;return new Promise(n=>{const s="./models/";let l="";var o={};let r=["left","right"];const m=new ge(d);r.forEach(c=>{m.addMeshTask(`load ${c} hand`,"",s,`${c}${l}.glb`)});let u=0;m.onTaskSuccess=c=>{o[r[u]]=c.loadedMeshes[1],c.loadedMeshes[1].name=r[u],t=c.loadedAnimationGroups;for(let g=0;g<t.length;g++)t[g].name=`${r[u]}_${t[g].name}`;u++},m.onTasksDoneObservable.add(()=>{for(let c=0;c<d.animationGroups.length;c++)d.animationGroups[c].pause();e.input.onControllerAddedObservable.add(c=>{let g=c.inputSource.handedness;console.log(o[g]);let f=o[g].parent.parent;o[g].isPickable=!1;for(let a of i)a.removeDragCollision();let p=(Object.keys(o).indexOf(g)-1)*2-1;o[g].rotation.y=Math.PI*p,o[g].rotation.z=0,o[g].rotation.x=-Math.PI/4,f.parent=c.grip||c.pointer})}),m.loadAsync().then(()=>{n(t)})})}class ne{constructor(e,i,t,n){h(this,"cylinderInstances");h(this,"clipboard");h(this,"scene");h(this,"labels");h(this,"guiManager");h(this,"soundManager");this.labels=["A","B","C"],this.scene=e,this.cylinderInstances=i,this.guiManager=t,this.soundManager=n}getCylinderInstanceFromMesh(e){let i=e.name.split("-")[2];for(let t of this.cylinderInstances)if(t.name==i)return t;return null}intersectHandCylinder(e){for(let i of this.labels){let t=this.scene.getMeshByName(`pivot-Cylinder-${i}`);if(e.intersectsMesh(t,!1))return t}return null}intersectCylinder(e){for(let i of this.labels){let t=this.scene.getMeshByName(`pivot-Cylinder-${i}`);if(t!=e&&e.intersectsMesh(t))return t}return null}highlightAndRotateCylinders(e,i,t){e.highlight(),i.highlight();let n=e.mesh.getAbsolutePosition()._x,s=i.mesh.getAbsolutePosition()._x;if(s<n?(e.mesh.rotation.y=Math.PI,i.mesh.rotation.y=e.mesh.rotation.y):(e.mesh.rotation.y=0,i.mesh.rotation.y=e.mesh.rotation.y),!t){t=!0;let l=e.mesh.getHierarchyBoundingVectors(),o=l.max.y-l.min.y,r=-.09,u=n-s,c=C(e.mesh,I);s<n?(c.position.x=u+r,c.position.y=o-.2):(c.position.x=u-r,c.position.y=o-.2),e.rotateAroundZ()}return t}moveWithCollisions(e,i){e.moveWithCollisions(i)}addColors(e,i){let t=e.currentColor,n=i.currentColor,s=new P((t.r+n.r)/2,(t.g+n.g)/2,(t.b+n.b)/2);i.setColor(s)}showFinishScreen(){this.guiManager.gameFinishPrompt.setVisible(!0)}playExplosion(){console.log(this.soundManager.loadedSounds.explosion);let e=this.soundManager.loadedSounds.explosion;e.stop(),e.play()}playDing(){let e=this.soundManager.loadedSounds.ding;e.stop(),e.play()}playSuccess(){let e=this.soundManager.loadedSounds.success;console.log("Success: ",e),e.stop(),e.play()}}class se extends ne{constructor(i,t,n,s){super(i,t,n,s);h(this,"particleSystem")}resetCylinders(){this.particleSystem&&this.particleSystem.stop();let i=["A","B","C"];for(let t=0;t<i.length;t++){const n=this.scene.getMeshByName(`pivot-Cylinder-${i[t]}`),s=this.scene.getMeshByName("Table");if(s&&n){const l=s.getBoundingInfo().boundingBox;n.position.z=(l.centerWorld.z+l.minimumWorld.z)/2}super.getCylinderInstanceFromMesh(n).setOpacity(.85),super.getCylinderInstanceFromMesh(n).setColor(super.getCylinderInstanceFromMesh(n).originalColor),t==0&&(super.getCylinderInstanceFromMesh(n).setColor(P.Red()),super.getCylinderInstanceFromMesh(n).currentColor=P.Red())}}postSceneCylinder(){let i=["A","B","C"],t=[];for(let l of i){const o=this.scene.getMeshByName(`pivot-Cylinder-${l}`);t.push(o);let r=new S(`${l}-rotateAroundZ`,"rotation.z",120,S.ANIMATIONTYPE_FLOAT,S.ANIMATIONLOOPMODE_CONSTANT),m=C(o,I);const u=[];u.push({frame:0,value:Math.PI*2}),u.push({frame:60,value:4.62}),m.animations.push(r),r.setKeys(u);let c=new S(`${l}-resetRotateAroundZ`,"rotation.z",120,S.ANIMATIONTYPE_FLOAT,S.ANIMATIONLOOPMODE_CONSTANT);const g=[];g.push({frame:0,value:4.62}),g.push({frame:60,value:Math.PI*2}),m.animations.push(c),c.setKeys(g)}let n=!1,s=!1;for(let l=0;l<i.length;l++){const o=this.scene.getMeshByName(`pivot-Cylinder-${i[l]}`);let r=super.getCylinderInstanceFromMesh(o);const m=o.getBehaviorByName("PointerDrag");console.log(m);let u=[];for(let f of t)f!=o&&u.push(f);let c=C(o,I),g=!1;m.onDragObservable.add(()=>{E.audioEngine.unlock(),E.audioEngine.audioContext.resume();let f=!1,p=!1;z(o);const a=super.intersectCylinder(o);if(a){let v=super.getCylinderInstanceFromMesh(a);p=!0;let A=a.name.split("-")[2],O=`${o.name.split("-")[2]}to${A}`;if(y.tasks[y.currentState].label===O)s=!0,y.tasks[y.currentState].next==="complete"?(f=!0,console.log(v),super.playSuccess(),r.fadeAndRespawn(),y.resetSOP(),this.resetCylinders()):(y.currentState=y.tasks.indexOf(y.tasks.find(x=>x.label==y.tasks[y.currentState].next)),super.playDing());else if(!n&&!s){n=!0;const x=new _("particles",500,this.scene);x.particleTexture=new F("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJStextures/master/FFV/smokeParticleTexture.png",this.scene),x.minLifeTime=.5,x.maxLifeTime=.7,x.emitRate=100,x.gravity=new M(0,.5,0),x.minSize=.01,x.maxSize=.07,x.createPointEmitter(new M(0,0,0),new M(0,1,0));const w=C(a,L);x.addColorGradient(1,ee.FromColor3(w.material.diffuseColor,1)),x.blendMode=_.BLENDMODE_STANDARD,x.emitter=a.position,this.particleSystem=x,this.particleSystem.start(),console.log("Playing explosion!"),super.playExplosion()}let N=o.getAbsolutePosition()._x;a.getAbsolutePosition()._x<N?(c.rotation.y=Math.PI,a.rotation.y=c.rotation.y):(c.rotation.y=0,a.rotation.y=c.rotation.y),g||(g=super.highlightAndRotateCylinders(r,v,g),a.name.split("-")[2],o.name.split("-")[2],f||super.addColors(r,v))}else r.highlight(!1),z(o);p==!1&&(r.highlight(!1),s=!1,g&&(c.position.x=0,c.position.y=0,g=!1,r.resetAroundZ()))}),m.onDragEndObservable.add(()=>{C(o,I).getBehaviorByName("Highlight");for(let f of u)f!=c&&(r.highlight(!1),super.getCylinderInstanceFromMesh(f).highlight(!1),c.intersectsMesh(f)&&(r.resetAroundZ(),c.position.x=0,c.position.y=0,g=!1))})}}}class Q extends ne{constructor(i,t,n,s,l){super(t,n,s,l);h(this,"handedness");h(this,"holdingInstance");h(this,"holdingMesh");h(this,"targetMesh");h(this,"targetMeshInstance");h(this,"motionController");h(this,"handMesh");h(this,"isVisible");this.handedness=i,this.handMesh=t.getMeshByName(this.handedness),this.isVisible=!0}getMotionController(){return this.motionController}setMotionController(i){this.motionController=i}dropped(i){this.motionController.lastPosition=null,clearInterval(i),this.motionController.grabbed=!1,this.motionController.meshGrabbed=void 0,console.log(this.holdingMesh),this.holdingMesh&&(this.holdingInstance.fadeAndRespawn(100),this.holdingMesh=null,this.holdingInstance=null,this.motionController.meshGrabbed=null)}updateSOPTask(i,t,n){console.log(this.scene);let s=`${i}to${t}`;if(y.tasks[y.currentState].label===s)if(y.tasks[y.currentState].next==="complete"){let l=new se(this.scene,this.cylinderInstances,this.guiManager,super.soundManager);for(let o of this.cylinderInstances)o.fadeAndRespawn(100);super.playSuccess(),y.resetSOP(),this.disappearAnimation(!1),this.dropped(n),l.resetCylinders();for(let o of super.cylinderInstances)o.resetProperties();return!0}else return super.playDing(),y.currentState=y.tasks.indexOf(y.tasks.find(l=>l.label==y.tasks[y.currentState].next)),!1;else super.playExplosion()}disappearAnimation(i=!0){console.log("DISAPPEAR: ",i);let t=60,n=[{name:"Invisibility",startValue:1},{name:"Visibility",startValue:0}];n.forEach(s=>{s.init=new S(s.name,"visibility",120,S.ANIMATIONTYPE_FLOAT,S.ANIMATIONLOOPMODE_CONSTANT),s.init.setKeys([{frame:0,value:s.startValue},{frame:t,value:1-s.startValue}])}),console.log(this.handMesh),i?(this.isVisible=!1,this.scene.beginDirectAnimation(this.handMesh,[n[0].init],0,60,!1)):(this.isVisible=!0,this.scene.beginDirectAnimation(this.handMesh,[n[1].init],0,60,!1))}}function Re(d,e,i,t,n,s){let l=new Q("right",d,t,n,s),o=new Q("left",d,t,n,s),r=!1,m={right:l,left:o},u=!1;function c(g){let f=g.name.split("-")[2];console.log("Name: ",f);for(let p of t)if(console.log("Instance name: ",p.name),p.name==f)return p;return null}e.input.onControllerAddedObservable.add(g=>{g.onMotionControllerInitObservable.add(f=>{let p=f;p.handID=f.handedness;let a=m[p.handedness];a.getMotionController()||a.setMotionController(p),console.log(a);let v=new fe(M.Zero(),M.Zero(),.25);const A=f.getComponentOfType("squeeze");f.getComponentOfType("trigger"),[A].forEach(b=>{console.log(d.getMeshByName("left")),b.onButtonStateChangedObservable.add(O=>{let N,D={left:"Fist",right:"Grip"},x=d.animationGroups.find((V,H)=>V.name===`${a.motionController.handID}_${D[a.motionController.handID]}`);x.goToFrame(O.value*(x._to-1)+1);let w=a.intersectHandCylinder(d.getMeshByName(p.handID));if(console.log("Grabbed Cylinder: ",w),O.value>.5&&!a.motionController.grabbed){if(w){E.audioEngine.unlock(),r=!1,a.holdingMesh=w,a.holdingInstance=c(a.holdingMesh),a.motionController.meshGrabbed=a.holdingMesh,a.motionController.grabbed=!0;let V=a.motionController.lastPosition,H=v.origin;H!=V&&(a.disappearAnimation(!0),N=setInterval(()=>{let U=a.motionController.lastPosition;if(g.getWorldPointerRayToRef(v),U&&a.holdingMesh&&a.moveWithCollisions(a.holdingMesh,H.subtract(U)),!a.intersectHandCylinder(d.getMeshByName(a.motionController.handID))&&a.holdingMesh&&(a.targetMeshInstance&&a.targetMeshInstance.highlight(!1),a.dropped(N),a.motionController.grabbed=!1,a.handMesh.visibility=1,r=!0),a.holdingMesh){let k=a.intersectCylinder(a.holdingMesh);if(k){a.targetMesh=k,a.targetMeshInstance=c(k);let oe=k.name.split("-")[2],ae=a.holdingMesh.name.split("-")[2];u||(a.addColors(a.holdingInstance,a.targetMeshInstance),r=a.updateSOPTask(ae,oe,N),u=a.highlightAndRotateCylinders(a.holdingInstance,a.targetMeshInstance,u))}else a.targetMeshInstance&&a.targetMeshInstance.highlight(!1),a.holdingInstance.highlight(!1),u&&(a.holdingInstance.resetAroundZ(),ie(C(a.holdingMesh,I)),u=!1)}r||(a.motionController.lastPosition=Object.assign({},v.origin),p.lastPosition=Object.assign({},v.origin))},10))}}else(!O.value||!w)&&a.holdingMesh&&(a.holdingInstance.highlight(!1),a.motionController.grabbed=!1,a.targetMeshInstance&&a.targetMeshInstance.highlight(!1),a.dropped(N),a.disappearAnimation(!1))})})})})}var W;class _e{constructor(e){h(this,"flying",!1);h(this,"active",!1);h(this,"camera");h(this,"mesh");h(this,"offset",.3);h(this,"animations");h(this,"returnPosition");h(this,"returnRotation");h(this,"onPointerDownObserver");h(this,"xrCamera");h(this,"attach",(e,i,t,n,s)=>{const l=e.getScene();if(this.mesh=e,!i&&(i=l.activeCamera,!i))throw new Error("The scene has no active camera, and no camera was provided.");this.camera=i,t||(t=this.mesh.position),n||(n=this.mesh.rotation),s&&(this.offset=s),this.returnPosition=t,this.returnRotation=n,this.onPointerDownObserver=l.onPointerObservable.add(this.clipboardClick)});h(this,"detach",()=>{this.mesh.getScene().onPointerObservable.remove(this.onPointerDownObserver)});h(this,"clipboardClick",(e={type:X.POINTERDOWN,pickInfo:{pickedMesh:this.mesh}})=>{var i;if(e.type===X.POINTERDOWN){console.log("Clipboard click");const t=(i=e.pickInfo)==null?void 0:i.pickedMesh;if(t&&(t===this.mesh||t.isDescendantOf(this.mesh))&&!this.flying||this.active){const n=this.active?B/2:0,s=this.active?0:B/2;Z(this,W).call(this),this.flying=!0,this.mesh.billboardMode==$.BILLBOARDMODE_ALL?this.mesh.billboardMode=$.BILLBOARDMODE_NONE:this.mesh.billboardMode=$.BILLBOARDMODE_ALL,this.mesh.getScene().beginDirectAnimation(this.mesh,this.animations,n,s,!1,void 0,()=>{this.flying=!1,this.active=!this.active})}}});h(this,"calculateTargetPositionWithOffset",e=>{if(this.xrCamera!==void 0&&this.xrCamera.state===pe.IN_XR){const l=this.xrCamera.camera._position.subtract(this.returnPosition).scale(1-e/M.Distance(this.returnPosition,this.xrCamera.camera._position));return this.returnPosition.add(l)}const t=this.camera._position.subtract(this.returnPosition).scale(1-e/M.Distance(this.returnPosition,this.camera._position));return this.returnPosition.add(t)});h(this,"setClipboardUp",()=>new M(3.1468286,4.6617744,1.680752));K(this,W,()=>{const e=this.animations.find(({name:s})=>s==="translate"),i=this.animations.find(({name:s})=>s==="rotate"),t=[{frame:0,value:this.returnPosition},{frame:B/2,value:this.calculateTargetPositionWithOffset(this.offset)}],n=[{frame:0,value:this.returnRotation},{frame:B/2,value:this.setClipboardUp()}];e.setKeys(t),i.setKeys(n)});const i=new S("translate","position",B,S.ANIMATIONTYPE_VECTOR3),t=new S("rotate","rotation",B,S.ANIMATIONTYPE_VECTOR3);this.animations=[i,t],this.xrCamera=e}get name(){return"FlyToCamera"}init(){}}W=new WeakMap;class Fe{constructor(e,i){h(this,"soundList");h(this,"soundPointer");h(this,"scene");h(this,"loadedSounds");this.scene=i,this.soundPointer=0,this.soundList=e,this.loadedSounds={}}async loadSounds(){let e=[];return new Promise(i=>{let t=0;this.soundList.forEach(n=>{if(e.push({soundName:n.soundName,sound:new ye(n.soundName,n.fileName,this.scene,()=>{E.audioEngine.unlock()},{})}),t++,t===this.soundList.length){for(let s of e)this.loadedSounds[s.soundName]=s.sound;i(e),console.log("Sounds loaded!!",this.loadedSounds)}})})}}console.log=()=>{};class ze{constructor(){h(this,"handAnimation");h(this,"sop");h(this,"models");h(this,"cylinders");h(this,"guiManager");h(this,"soundManager");h(this,"loadedSounds");this.cylinders=[];let e="TLLGraduatedCylinderNewLabel.glb";this.models=[{fileName:"NewLaboratoryUNFINISHED.glb",callback:t=>this.createRoom(t),label:"floor"},{fileName:"Placard_Label.glb",callback:t=>q(t,1,"Placard-A")},{fileName:"Placard_Label.glb",callback:t=>q(t,2,"Placard-B")},{fileName:"Placard_Label.glb",callback:t=>q(t,3,"Placard-C")},{fileName:e,callback:t=>this.cylinders.push(new G(t[0],1,"A",new P(1,0,0))),label:"Cylinder-A"},{fileName:e,callback:t=>this.cylinders.push(new G(t[0],2,"B",new P(0,1,0))),label:"Cylinder-B"},{fileName:e,callback:t=>this.cylinders.push(new G(t[0],3,"C",new P(0,0,1))),label:"Cylinder-C"},{fileName:"clipBoardWithPaperCompressedTextureNew.glb",callback:t=>Ee(t[0])}].map(function(t){return Object.assign({},{fileName:"LabBench.glb",root:"./models/",callback:De,label:"NoLabel"},t)});let i=[{soundName:"explosion",fileName:`${R}/sound/mi_explosion_03_hpx.mp3`},{soundName:"ding",fileName:`${R}/sound/ding-idea-40142.mp3`},{soundName:"success",fileName:`${R}/sound/success.mp3`}];this.loadedSounds=[],this.createScene().then(t=>{this.soundManager=new Fe(i,t),this.soundManager.loadSounds().then(n=>{this.loadedSounds=n;for(let s of["A","B","C"])Object.assign({},t.getMeshByName(`pivot-Cylinder-${s}`).position);console.log("Loaded sounds: ",this.loadedSounds);for(let s of this.loadedSounds)console.log(s.sound);this.processScene(t,this.cylinders,this.guiManager,this.soundManager)})})}async processScene(e,i,t,n){let s=e.getCameraByName("camera"),l=e.getLightByName("light1"),o;s.speed=.16;let r=setInterval(()=>{l.intensity>=1?clearInterval(r):l.intensity+=.1},60);const m=["WallsandFloor","WallsAndFloor.001"],u=[];for(let f of m){console.log(f);const p=e.getMeshByName(f);p&&u.push(p)}let c={floorMeshes:u,inputOptions:{doNotLoadControllerMeshes:!0}};o=await e.createDefaultXRExperienceAsync(c);let g=!1;o.pointerSelection.displayLaserPointer=!1,o.pointerSelection.displaySelectionMesh=!1,window.addEventListener("keydown",f=>{f.keyCode===73&&(g?g=!1:g=!0,o.pointerSelection.displayLaserPointer=g,o.pointerSelection.displaySelectionMesh=g)}),ke(e,o,i).then(f=>{if(console.log("add webxr"),o){const a=new _e(o.baseExperience);e.getMeshByName("clipboard").addBehavior(a)}new se(e,i,t,n).postSceneCylinder(),Re(e,o,f,i,t,n)})}createRoom(e){const i=["WallsandFloor","WallsAndFloor.001","Table","Roof","Countertop","Walls"];let t,n;for(let s of i){const l=e.find(o=>o.name===s);if(l&&(l.checkCollisions=!0,l.name==="Table")){const r=l.getBoundingInfo().boundingBox.center.x;t=l.getScene(),n=t.getCameraByName("camera"),n.position.x=r-.7}}}createScene(){return new Promise(e=>{const i=document.getElementById("canvas"),t=new E(i,!0,{stencil:!0}),n=new be(t);n.collisionsEnabled=!0,window.addEventListener("resize",function(){t.resize()});const s=new Ce("camera",new M(0,1.84,-1.134),n);s.ellipsoid=new M(.4,.7,.4),s.attachControl(i,!0),s.applyGravity=!0,s.minZ=0,s.speed=0,s.checkCollisions=!0,s.keysUp.push(87),s.keysDown.push(83),s.keysLeft.push(65),s.keysRight.push(68);var l=new Me("light1",new M(1,1,0),n);l.intensity=0,Promise.all(this.models.map(o=>new Promise(r=>xe.ImportMesh("",o.root,o.fileName,n,function(m){o.mesh=m,r(m)})))).then(()=>{let o=[];this.models.map(r=>{o.push(r.callback(r.mesh)),e(n)})}),window.addEventListener("keydown",o=>{o.shiftKey&&o.ctrlKey&&o.altKey&&o.keyCode===73&&(n.debugLayer.isVisible()?n.debugLayer.hide():n.debugLayer.show())}),t.runRenderLoop(()=>{n.render()})})}}new ze;