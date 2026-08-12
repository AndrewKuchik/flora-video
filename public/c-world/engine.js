import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const clamp=(v,a,b)=>v<a?a:v>b?b:v, mix=(a,b,t)=>a+(b-a)*t;
const smooth=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};

// ---- palette: warm gold on a warm charcoal atmosphere (NOT black) ----
const GOLD=0xE9B65A, CORE=0xFFF0C8, FOG=0x1c1710;
// ---- three camera journeys of the SAME world, for comparison ----
const CAM=window.FLORA_CAM||'fly';
const CAM_NAME={fly:'Пролёт', orbit:'Облёт', rise:'Восхождение'}[CAM]||'Пролёт';

const STZ=[0,-26,-52,-78,-104,-130,-152];  // z of each station (last = ending portal)
const SECT=[
  { tag:'00 / Flora',   head:'Войди в студию света.',        sub:'Творческая студия в Риге. Листай — камера летит сквозь мир Flora.', href:null },
  { tag:'01 / Фото',    head:'Свет, пойманный в кадр.',      sub:'Свадьбы, события, реклама и предметка, портреты.', href:'/ru/photo/' },
  { tag:'02 / Аудио',   head:'Звук, собранный в целое.',     sub:'Запись, сведение и мастеринг, уроки, аренда студии.', href:'/ru/audio/' },
  { tag:'03 / Видео',   head:'Каждый кадр — как в кино.',    sub:'Клипы, реклама, мероприятия, контент для соцсетей.', href:'/ru/video/' },
  { tag:'04 / Бизнесу', head:'Одна команда. Один счёт.',     sub:'Фото и видео сопровождение мероприятий под ключ.', href:'/ru/corporate/' },
  { tag:'05 / Игры',    head:'Игры и приложения для брендов.',sub:'HTML-игры и приложения. От 2000 €.', href:'/ru/dev/' },
  { tag:'→ / Начнём',   head:'Создадим что-то вместе?',      sub:'Выбери направление и посчитай цену за минуту.', href:'/ru/', end:true },
];

const trEl=document.getElementById('tr'); if(trEl) trEl.innerHTML='Creative Studio<br>Rīga · '+CAM_NAME;
document.title='Flora — мир · '+CAM_NAME;

try {
  const mobile=window.matchMedia('(max-width:820px)').matches || ('ontouchstart' in window);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.5:2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.02;
  document.getElementById('app').appendChild(renderer.domElement);
  const scene=new THREE.Scene();

  // warm atmospheric backdrop (gradient sky with a soft gold horizon) — no black void
  (function(){ const c=document.createElement('canvas'); c.width=16; c.height=256; const g=c.getContext('2d');
    const grd=g.createLinearGradient(0,0,0,256);
    grd.addColorStop(0.00,'#1d1710'); grd.addColorStop(0.40,'#2b2013'); grd.addColorStop(0.60,'#5c4219');
    grd.addColorStop(0.71,'#2e2213'); grd.addColorStop(1.00,'#161009');
    g.fillStyle=grd; g.fillRect(0,0,16,256);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; scene.background=t; })();
  scene.fog=new THREE.FogExp2(FOG,0.025);

  const camera=new THREE.PerspectiveCamera(53,1,0.1,400);

  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;

  scene.add(new THREE.AmbientLight(0x2a2418,0.5));
  const key=new THREE.DirectionalLight(0xffe7c0,0.7); key.position.set(4,8,6); scene.add(key);
  const coreLight=new THREE.PointLight(CORE,0,12,2); coreLight.position.set(0,0.5,0); scene.add(coreLight);
  const endLight=new THREE.PointLight(CORE,0,14,2); endLight.position.set(0,0.6,STZ[6]); scene.add(endLight);

  const grid=new THREE.GridHelper(700,280,0x5a4a22,0x241d10); grid.position.y=-3.2; scene.add(grid);
  if(!mobile){
    const refl=new Reflector(new THREE.PlaneGeometry(700,700),{clipBias:0.003,textureWidth:1024,textureHeight:1024,color:0x141210});
    refl.rotation.x=-Math.PI/2; refl.position.y=-3.23; scene.add(refl);
  } else {
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(700,700), new THREE.MeshStandardMaterial({color:0x141008,roughness:0.4,metalness:0.8,envMapIntensity:0.5}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-3.25; scene.add(floor);
  }

  const glow=c=>new THREE.MeshBasicMaterial({color:c,fog:true});
  const solid=(c,e,ei)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:ei||1,roughness:0.42,metalness:0.35,envMapIntensity:0.45});
  const edges=(geo,c)=>new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({color:c,fog:true}));
  const A=GOLD;

  const world=new THREE.Group(); scene.add(world);
  function place(g,z){ g.position.z=z; world.add(g); return g; }

  // 00 flower gateway — CLOSED bud far away, BLOOMS OPEN into an arch as you approach, fly through its centre
  let petals=[], burst=null, fcore=null;
  (function(){ const g=new THREE.Group();
    for(let i=0;i<6;i++){ const a=i*Math.PI/3;
      const petal=new THREE.Mesh(new THREE.CircleGeometry(1.0,24), glow(A)); petal.material.transparent=true; petal.material.opacity=0.14;
      const ring=new THREE.Mesh(new THREE.RingGeometry(0.95,1.02,40), glow(A)); ring.material.transparent=true; ring.material.opacity=0.5;
      g.add(petal); g.add(ring); petals.push({petal,ring,a}); }
    fcore=new THREE.Mesh(new THREE.SphereGeometry(0.15,24,18), glow(CORE)); g.add(fcore);
    burst=new THREE.Mesh(new THREE.RingGeometry(0.9,1.15,64), glow(CORE)); burst.material.transparent=true; burst.material.opacity=0; g.add(burst);
    g.position.set(0,0.5,0); world.add(g); })();

  // 01 Photo — giant camera aperture you fly through (iris blades)
  (function(){ const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(4.2,0.14,20,80), solid(0x1a150c,A,1.4)));
    g.add(edges(new THREE.TorusGeometry(4.2,0.14,8,60),A));
    for(let i=0;i<10;i++){ const bl=new THREE.Mesh(new THREE.BoxGeometry(0.1,2.4,0.1), solid(0x14110a,A,0.8)); const a=i/10*Math.PI*2+0.2;
      bl.position.set(Math.cos(a)*3.0,Math.sin(a)*3.0,0); bl.rotation.z=a; g.add(bl); }
    g.position.y=0.5; place(g,STZ[1]); })();

  // 02 Audio — equalizer / waveform walls, heights follow a clean sine (reads as sound)
  (function(){ const g=new THREE.Group();
    for(let s=-1;s<=1;s+=2){ for(let i=0;i<32;i++){ const h=0.5+2.5*(0.5+0.5*Math.sin(i*0.5));
      const geo=new THREE.BoxGeometry(0.4,h,0.4); const b=new THREE.Mesh(geo, solid(0x120f09,A,0.75)); b.position.set(s*5.0,-3.2+h/2,-i*1.4+22); g.add(b);
      const e=edges(geo,A); e.position.copy(b.position); g.add(e); } }
    place(g,STZ[2]); })();

  // 03 Video — filmstrips unspooling along both sides: band + sprocket holes + frame dividers
  (function(){ const g=new THREE.Group(); const len=42, z0=14;
    for(let s=-1;s<=1;s+=2){ const strip=new THREE.Group();
      strip.add(new THREE.Mesh(new THREE.BoxGeometry(0.14,2.4,len), solid(0x14110a,A,0.65)));
      for(let k=0;k<len/1.3;k++){ [0.95,-0.95].forEach(hy=>{ const hole=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.26,0.26), glow(A));
        hole.position.set(0,hy,-k*1.3+len/2-0.6); strip.add(hole); }); }
      for(let k=0;k<len/4;k++){ const dv=new THREE.Mesh(new THREE.BoxGeometry(0.18,2.4,0.08), solid(0x14110a,A,1.15)); dv.position.set(0,0,-k*4+len/2-0.6); strip.add(dv); }
      strip.position.set(s*4.2,0.7,z0-len/2); g.add(strip); }
    place(g,STZ[3]); })();

  // 04 Business — skyline / grid-city of light pillars (events, scale)
  (function(){ const g=new THREE.Group();
    for(let x=-4;x<=4;x++){ for(let z=0;z<7;z++){ const h=0.5+3.2*Math.abs(Math.sin(x*0.9+z*0.7));
      const p=new THREE.Mesh(new THREE.BoxGeometry(0.55,h,0.55), solid(0x120f09,A,0.6)); p.position.set(x*1.7,-3.2+h/2,-z*3.2+9); g.add(p); } }
    place(g,STZ[4]); })();

  // 05 Games — a big PLAY triangle (▶) + scattered voxels (interactive / play)
  (function(){ const g=new THREE.Group();
    const R=2.2, pts=[[-0.7,R],[-0.7,-R],[R*1.05,0]];
    for(let i=0;i<3;i++){ const a=pts[i], b=pts[(i+1)%3]; const dx=b[0]-a[0],dy=b[1]-a[1]; const L=Math.hypot(dx,dy);
      const bar=new THREE.Mesh(new THREE.BoxGeometry(0.2,L,0.2), solid(0x14110a,A,1.2)); bar.position.set((a[0]+b[0])/2,(a[1]+b[1])/2+0.3,0); bar.rotation.z=Math.atan2(dy,dx)-Math.PI/2; g.add(bar); }
    for(let i=0;i<46;i++){ const s=0.35+((i*97)%100)/100*0.55; const c=new THREE.Mesh(new THREE.BoxGeometry(s,s,s), solid(0x14110a,A,0.9));
      c.position.set(((i*53)%100/100-0.5)*11,((i*71)%100/100-0.3)*6,((i*29)%100/100-0.5)*13); c.rotation.set(i*0.7,i*1.3,0); g.add(c); }
    place(g,STZ[5]); })();

  // 06 Ending — luminous portal you arrive at (bookends the opening flower)
  (function(){ const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(2.7,0.09,18,64), solid(0x1a150c,A,1.6)));
    g.add(edges(new THREE.TorusGeometry(2.7,0.09,8,48),A));
    for(let r=0;r<3;r++){ const rad=1.0+r*0.7; const halo=new THREE.Mesh(new THREE.RingGeometry(rad,rad+0.03,64), glow(A)); halo.material.transparent=true; halo.material.opacity=0.4-r*0.1; g.add(halo); }
    const core=new THREE.Mesh(new THREE.SphereGeometry(0.42,24,18), glow(CORE)); g.add(core);
    g.position.y=0.6; place(g,STZ[6]); })();

  // atmosphere dust
  const dn=mobile?320:720, dgeo=new THREE.BufferGeometry(), dp=new Float32Array(dn*3);
  for(let i=0;i<dn;i++){ dp[i*3]=((i*37)%100/100-0.5)*44; dp[i*3+1]=((i*61)%100/100-0.2)*14; dp[i*3+2]=-((i*83)%100)/100*160+8; }
  dgeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
  const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({color:A,size:0.03,transparent:true,opacity:0.5,fog:true})); scene.add(dust);

  function resize(){ renderer.setSize(window.innerWidth,window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); }
  window.addEventListener('resize',resize); resize();

  const maxS=()=>Math.max(1,document.body.scrollHeight-window.innerHeight);
  let target=0,pr=0; window.addEventListener('scroll',()=>{ target=clamp((window.scrollY||0)/maxS(),0,1); },{passive:true});
  let tmx=0,tmy=0,mx=0,my=0; window.addEventListener('pointermove',e=>{ tmx=e.clientX/innerWidth*2-1; tmy=e.clientY/innerHeight*2-1; });
  const el={ tag:document.getElementById('tag'),head:document.getElementById('head'),sub:document.getElementById('sub'),go:document.getElementById('go'),cnum:document.getElementById('cnum'),prog:document.getElementById('progbar'),hint:document.getElementById('scrollhint') };
  let curSec=-1; function setSec(n){ if(n===curSec)return; curSec=n; const s=SECT[n]; el.tag.textContent=s.tag; el.head.textContent=s.head; el.sub.textContent=s.sub; el.cnum.textContent=s.end?'→':String(n).padStart(2,'0'); if(s.href){el.go.style.display='inline-flex';el.go.href=s.href;el.go.textContent=(s.end?'Посчитать цену →':'Посчитать цену →');} else el.go.style.display='none'; }

  const startZ=8, endZ=STZ[6]+7, flowerY=0.5, tmp=new THREE.Vector3();
  const clock=new THREE.Clock(); const fmin=mobile?1/30:1/60; let acc=0,running=true,first=true;
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; if(running) loop(); });

  function frame(){
    const t=clock.elapsedTime; pr+=(target-pr)*(reduce?1:0.06);
    mx+=(tmx-mx)*0.04; my+=(tmy-my)*0.04;
    const camZ=mix(startZ,endZ,pr);
    const w=smooth(0.045,0.24,pr);          // weave/height opens up only AFTER the flower
    const app=smooth(-2,4,camZ);            // 1 = approaching flower, 0 = flown past

    // nearest station ahead (for orbit gaze)
    let nz=STZ[0],nd=1e9; for(const z of STZ){ const d=Math.abs(z-(camZ-9)); if(d<nd){nd=d;nz=z;} }

    let cx,cy,lx,ly,lz,roll;
    if(CAM==='orbit'){
      cx=Math.sin(pr*Math.PI*4.6)*4.2*w + mx*0.6*w;
      cy=mix(flowerY,1.15,w)+Math.sin(pr*Math.PI*2.6)*0.7*w - my*0.3;
      lx=0; ly=mix(0.5,flowerY,app); lz=Math.min(mix(nz,0,app),camZ-1.5);
      roll=mx*0.02*w + Math.sin(pr*Math.PI*4.6)*0.03*w;
    } else if(CAM==='rise'){
      cx=Math.sin(pr*Math.PI*2.2)*1.6*w + mx*0.5*w;
      cy=mix(flowerY,1.0,w)+Math.sin(pr*Math.PI*1.7)*2.4*w - my*0.3;
      lx=mix(cx*0.3,0,app); ly=mix(0.3,flowerY,app); lz=mix(camZ-9,0,app);
      roll=mx*0.02*w;
    } else {
      cx=Math.sin(pr*Math.PI*3.2)*2.0*w + mx*0.6*w;
      cy=mix(flowerY,0.9,w)+Math.sin(pr*Math.PI*2.0)*0.5*w - my*0.4;
      lx=mix(cx*0.4,0,app); ly=mix(0.4,flowerY,app); lz=mix(camZ-10,0,app);
      roll=mx*0.02*w;
    }
    camera.position.set(cx,cy,camZ);
    tmp.set(lx,ly,lz); camera.lookAt(tmp); camera.rotation.z += roll;

    // flower blooms open into an arch as we near it, flash as we pass through the centre
    const bloom=smooth(13,1.2,camZ);
    for(const p of petals){ const R=mix(0.12,1.25,bloom), sc=mix(0.24,0.62,bloom);
      p.petal.position.set(Math.cos(p.a)*R,Math.sin(p.a)*R,0); p.petal.rotation.z=p.a+(1-bloom)*0.9; p.petal.scale.set(sc*0.62,sc,1); p.petal.material.opacity=mix(0.04,0.15,bloom);
      p.ring.position.copy(p.petal.position); p.ring.rotation.z=p.petal.rotation.z; p.ring.scale.copy(p.petal.scale); p.ring.material.opacity=mix(0.1,0.5,bloom); }
    const flash=Math.exp(-Math.pow(camZ/3.2,2));
    burst.scale.setScalar(mix(0.6,3.4,flash)); burst.material.opacity=0.55*flash;
    coreLight.intensity=3.0*flash;
    endLight.intensity=2.4*Math.exp(-Math.pow((camZ-STZ[6])/8,2));
    dust.rotation.y=t*0.01;

    const focus=camZ-8; let best=0,bd=1e9; for(let i=0;i<STZ.length;i++){ const d=Math.abs(STZ[i]-focus); if(d<bd){bd=d;best=i;} }
    setSec(best); el.prog.style.width=(pr*100)+'%'; el.hint.style.opacity=String(1-smooth(0,0.05,pr));
    renderer.render(scene,camera); if(first){first=false;document.getElementById('fallback').style.display='none';}
  }
  function loop(){ if(!running)return; requestAnimationFrame(loop); acc+=clock.getDelta(); if(acc<fmin)return; acc=0; frame(); }
  clock.start(); frame(); loop();
} catch(err){ console.error(err); const fb=document.getElementById('fallback'); fb.style.display='grid'; fb.textContent='Не удалось запустить 3D.'; }
