import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const clamp=(v,a,b)=>v<a?a:v>b?b:v, mix=(a,b,t)=>a+(b-a)*t;
const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const cssRGB=h=>`${(h>>16)&255},${(h>>8)&255},${h&255}`;
const hex=h=>'#'+h.toString(16).padStart(6,'0');

// ---- three moods of the same world, for comparison ----
const THEMES={
  a:{name:'Тёмное золото', bg:0x0A0907,fog:0x0A0907,fogD:0.026, accent:0xE9B65A,core:0xFFF0C8,
     gridA:0x4a3c1e,gridB:0x241d10, key:0xffe7c0,keyI:0.7, amb:0x2a2418,ambI:0.5, exposure:1.05,
     dust:0xE9B65A, camY:0.9,weave:2.2,bob:0.5,fov:52, reflect:0x0b0806, envI:0.4, ground:0x0b0a08},
  b:{name:'Строгий монохром', bg:0x070707,fog:0x090909,fogD:0.03, accent:0xEAE7DF,core:0xFFFFFF,
     gridA:0x3a3a3a,gridB:0x171717, key:0xe2e8ff,keyI:0.85, amb:0x191b1f,ambI:0.6, exposure:1.0,
     dust:0xcccccc, camY:1.0,weave:1.6,bob:0.4,fov:50, reflect:0x0a0a0a, envI:0.65, ground:0x0a0a0a},
  c:{name:'Тёплый рассвет', bg:0x140F09,fog:0x1b140c,fogD:0.033, accent:0xF2C14E,core:0xFFE6B0,
     gridA:0x5a4520,gridB:0x2a1e0e, key:0xffd39a,keyI:0.9, amb:0x342718,ambI:0.62, exposure:1.1,
     dust:0xF2C14E, camY:0.7,weave:2.9,bob:0.6,fov:56, reflect:0x130d06, envI:0.45, ground:0x120d07},
};
const TH=THEMES[window.FLORA_THEME]||THEMES.a;

const STZ=[0,-26,-52,-78,-104,-130];  // z of each installation
const SECT=[
  { tag:'00 / Flora',   head:'Войди в студию света.',        sub:'Творческая студия в Риге. Листай — камера летит сквозь мир Flora.', href:null },
  { tag:'01 / Фото',    head:'Свет, пойманный в кадр.',      sub:'Свадьбы, события, реклама и предметка, портреты.', href:'/ru/photo/' },
  { tag:'02 / Аудио',   head:'Звук, собранный в целое.',     sub:'Запись, сведение и мастеринг, уроки, аренда студии.', href:'/ru/audio/' },
  { tag:'03 / Видео',   head:'Каждый кадр — как в кино.',    sub:'Клипы, реклама, мероприятия, контент для соцсетей.', href:'/ru/video/' },
  { tag:'04 / Бизнесу', head:'Одна команда. Один счёт.',     sub:'Фото и видео сопровождение мероприятий под ключ.', href:'/ru/corporate/' },
  { tag:'05 / Игры',    head:'Игры и приложения для брендов.',sub:'HTML-игры и приложения. От 2000 €.', href:'/ru/dev/' },
];

// theme -> page chrome
document.documentElement.style.setProperty('--gold',cssRGB(TH.accent));
document.body.style.background=hex(TH.bg);
const trEl=document.getElementById('tr'); if(trEl) trEl.innerHTML='Creative Studio<br>Rīga · '+TH.name;
document.title='Flora — мир · '+TH.name;

try {
  const mobile=window.matchMedia('(max-width:820px)').matches || ('ontouchstart' in window);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setClearColor(TH.fog,1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.5:2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=TH.exposure;
  document.getElementById('app').appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(TH.fog,TH.fogD);
  const camera=new THREE.PerspectiveCamera(TH.fov,1,0.1,400);

  // environment reflections (subtle, gives materials life)
  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;

  scene.add(new THREE.AmbientLight(TH.amb,TH.ambI));
  const key=new THREE.DirectionalLight(TH.key,TH.keyI); key.position.set(4,8,6); scene.add(key);
  // light that lives inside the flower core — flares up as we fly through it
  const coreLight=new THREE.PointLight(TH.core,0,10,2); coreLight.position.set(0,0.5,0); scene.add(coreLight);

  // ground grid receding into fog = depth/world
  const grid=new THREE.GridHelper(600,240,TH.gridA,TH.gridB); grid.position.y=-3.2; scene.add(grid);
  // reflective floor (desktop) / matte plane (mobile)
  if(!mobile){
    const refl=new Reflector(new THREE.PlaneGeometry(600,600),{clipBias:0.003,textureWidth:1024,textureHeight:1024,color:TH.reflect});
    refl.rotation.x=-Math.PI/2; refl.position.y=-3.24; scene.add(refl);
  } else {
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(600,600), new THREE.MeshStandardMaterial({color:TH.ground,roughness:0.45,metalness:0.75,envMapIntensity:TH.envI}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-3.25; scene.add(floor);
  }

  // helpers
  const glow=c=>{const m=new THREE.MeshBasicMaterial({color:c,fog:true});return m;};
  const solid=(c,e,ei)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:ei||1,roughness:0.42,metalness:0.35,envMapIntensity:TH.envI});
  function edges(geo,c){ return new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color:c,fog:true})); }
  const A=TH.accent, CORE=TH.core;

  const world=new THREE.Group(); scene.add(world);
  function place(g,z){ g.position.z=z; world.add(g); return g; }

  // 00 greeting: luminous flower gateway (we fly straight through its centre)
  (function(){ const g=new THREE.Group();
    for(let i=0;i<6;i++){ const m=new THREE.Mesh(new THREE.CircleGeometry(1.05,24), glow(A)); m.material.transparent=true; m.material.opacity=0.14;
      const a=i*Math.PI/3; m.position.set(Math.cos(a)*1.25,Math.sin(a)*1.25+0.5,0); m.scale.set(0.6,1,1); m.rotation.z=a; g.add(m);
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.0,1.06,32), glow(A)); ring.position.copy(m.position); ring.scale.set(0.6,1,1); ring.rotation.z=a; g.add(ring); }
    for(let r=0;r<2;r++){ const R=0.55+r*0.42; const halo=new THREE.Mesh(new THREE.RingGeometry(R,R+0.02,48), glow(A)); halo.material.transparent=true; halo.material.opacity=0.5-r*0.18; halo.position.y=0.5; g.add(halo); }
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.30,24,18), glow(CORE)); core.position.y=0.5; g.add(core);
    place(g,STZ[0]); })();

  // 01 Photo: giant aperture ring you fly through + iris blades
  (function(){ const g=new THREE.Group();
    const tor=new THREE.Mesh(new THREE.TorusGeometry(4.2,0.14,20,80), solid(0x1a150c,A,1.4)); g.add(tor); g.add(edges(new THREE.TorusGeometry(4.2,0.14,8,60),A));
    for(let i=0;i<10;i++){ const bl=new THREE.Mesh(new THREE.BoxGeometry(0.1,2.4,0.1), solid(0x14110a,A,0.8)); const a=i/10*Math.PI*2+0.2;
      bl.position.set(Math.cos(a)*3.0,Math.sin(a)*3.0+0.5,0); bl.rotation.z=a; g.add(bl); }
    g.position.y=0.5; place(g,STZ[1]); })();

  // 02 Audio: canyon of waveform bars on both sides, fly between
  (function(){ const g=new THREE.Group();
    for(let s=-1;s<=1;s+=2){ for(let i=0;i<22;i++){ const h=0.6+2.6*(0.5+0.5*Math.sin(i*0.7+s));
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,h,0.5), solid(0x120f09,A,0.7)); b.position.set(s*5.5, -3.2+h/2, -i*3+30); g.add(b); g.add((function(){const e=edges(new THREE.BoxGeometry(0.5,h,0.5),A); e.position.copy(b.position); return e;})()); } }
    place(g,STZ[2]); })();

  // 03 Video: corridor of floating film frames
  (function(){ const g=new THREE.Group();
    for(let i=0;i<8;i++){ const fr=new THREE.Group(); const w=3.4,h=2.1,t=0.12;
      [[0,h/2],[0,-h/2]].forEach(p=>{const bar=new THREE.Mesh(new THREE.BoxGeometry(w,t,t),solid(0x14110a,A,1.1));bar.position.set(p[0],p[1],0);fr.add(bar);});
      [[-w/2,0],[w/2,0]].forEach(p=>{const bar=new THREE.Mesh(new THREE.BoxGeometry(t,h,t),solid(0x14110a,A,1.1));bar.position.set(p[0],p[1],0);fr.add(bar);});
      fr.position.set((i%2?1:-1)*3.4, 0.6, -i*4+16); fr.rotation.y=(i%2?1:-1)*0.5; g.add(fr); }
    place(g,STZ[3]); })();

  // 04 Business: grid-city of light pillars
  (function(){ const g=new THREE.Group();
    for(let x=-4;x<=4;x++){ for(let z=0;z<7;z++){ const h=0.5+3.2*Math.abs(Math.sin(x*0.9+z*0.7));
      const p=new THREE.Mesh(new THREE.BoxGeometry(0.55,h,0.55), solid(0x120f09,A,0.6)); p.position.set(x*1.7,-3.2+h/2,-z*3.2+9); g.add(p); } }
    place(g,STZ[4]); })();

  // 05 Games: playful floating voxels
  (function(){ const g=new THREE.Group();
    for(let i=0;i<70;i++){ const s=0.4+((i*97)%100)/100*0.7; const c=new THREE.Mesh(new THREE.BoxGeometry(s,s,s), solid(0x14110a,A,0.9));
      c.position.set(((i*53)%100/100-0.5)*10,((i*71)%100/100-0.3)*6,((i*29)%100/100-0.5)*14); c.rotation.set(i*0.7,i*1.3,0); g.add(c); }
    place(g,STZ[5]); })();

  // atmosphere dust
  const dn=mobile?320:700, dgeo=new THREE.BufferGeometry(), dp=new Float32Array(dn*3);
  for(let i=0;i<dn;i++){ dp[i*3]=((i*37)%100/100-0.5)*40; dp[i*3+1]=((i*61)%100/100-0.2)*14; dp[i*3+2]=-((i*83)%100)/100*140+6; }
  dgeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
  const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({color:TH.dust,size:0.03,transparent:true,opacity:0.5,fog:true})); scene.add(dust);

  function resize(){ renderer.setSize(window.innerWidth,window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); }
  window.addEventListener('resize',resize); resize();

  const maxS=()=>Math.max(1,document.body.scrollHeight-window.innerHeight);
  let target=0,pr=0; window.addEventListener('scroll',()=>{ target=clamp((window.scrollY||0)/maxS(),0,1); },{passive:true});
  let tmx=0,tmy=0,mx=0,my=0; window.addEventListener('pointermove',e=>{ tmx=e.clientX/innerWidth*2-1; tmy=e.clientY/innerHeight*2-1; });
  const el={ tag:document.getElementById('tag'),head:document.getElementById('head'),sub:document.getElementById('sub'),go:document.getElementById('go'),cnum:document.getElementById('cnum'),prog:document.getElementById('progbar'),hint:document.getElementById('scrollhint') };
  let curSec=-1; function setSec(n){ if(n===curSec)return; curSec=n; const s=SECT[n]; el.tag.textContent=s.tag; el.head.textContent=s.head; el.sub.textContent=s.sub; el.cnum.textContent=String(n).padStart(2,'0'); if(s.href){el.go.style.display='inline-flex';el.go.href=s.href;} else el.go.style.display='none'; }

  const startZ=8, endZ=STZ[5]-6, flowerY=0.5, tmpTarget=new THREE.Vector3();
  const clock=new THREE.Clock(); const fmin=mobile?1/30:1/60; let acc=0,running=true,first=true;
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; if(running) loop(); });
  function frame(){
    const t=clock.elapsedTime; pr+=(target-pr)*(reduce?1:0.06);
    mx+=(tmx-mx)*0.04; my+=(tmy-my)*0.04;

    const camZ=mix(startZ,endZ,pr);
    // weave/height ramp in only AFTER we have flown through the flower (world "opens up")
    const w=smooth(0.04,0.22,pr);
    const bank=Math.sin(pr*Math.PI*3.2)*TH.weave*w;
    const bob =Math.sin(pr*Math.PI*2.0)*TH.bob*w;
    const camY=mix(flowerY,TH.camY,w)+bob;
    camera.position.set(bank + mx*0.6*w, camY - my*0.4, camZ);

    // look target: dead centre of the flower while approaching, corridor-ahead once past it
    const app=smooth(-2,4,camZ);                     // 1 = still approaching flower, 0 = flown past
    tmpTarget.set( mix(bank*0.4,0,app), mix(0.4,flowerY,app), mix(camZ-10,0,app) );
    camera.lookAt(tmpTarget);
    camera.rotation.z += mx*0.02*w;

    // flower core flares as the camera passes through its centre
    coreLight.intensity = 2.6*Math.exp(-Math.pow(camZ/6,2));
    dust.rotation.y=t*0.01;

    const focus=camZ-8; let best=0,bd=1e9; for(let i=0;i<STZ.length;i++){ const d=Math.abs(STZ[i]-focus); if(d<bd){bd=d;best=i;} }
    setSec(best); el.prog.style.width=(pr*100)+'%'; el.hint.style.opacity=String(1-smooth(0,0.05,pr));
    renderer.render(scene,camera); if(first){first=false;document.getElementById('fallback').style.display='none';}
  }
  function loop(){ if(!running)return; requestAnimationFrame(loop); acc+=clock.getDelta(); if(acc<fmin)return; acc=0; frame(); }
  clock.start(); frame(); loop();
} catch(err){ console.error(err); const fb=document.getElementById('fallback'); fb.style.display='grid'; fb.textContent='Не удалось запустить 3D.'; }
