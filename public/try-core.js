/* Flora try-core — shared scroll shell for the 4 morph-hero experiments.
   Usage: FloraHero({ layer:'canvas'|'svg'|'div', hideWord:false, init:function(stage){ return function(frame){...} } }); */
(function(){
  var SECTIONS = [
    {key:'brand', eyebrow:'Creative Studio · Rīga', word:'Flora',              sub:'Звук, видео и кадр под одной крышей. Листай вниз.', cta:null,               href:null,             ac:[255,198,75]},
    {key:'video', eyebrow:'01 · Видео',              word:'Видео',             sub:'Клипы, реклама, мероприятия, контент для соцсетей.', cta:'Посчитать цену',   href:'/ru/video/',     ac:[227,170,82]},
    {key:'audio', eyebrow:'02 · Аудио',              word:'Аудио',             sub:'Запись, сведение и мастеринг, уроки, аренда студии.', cta:'Посчитать цену',  href:'/ru/audio/',     ac:[94,139,255]},
    {key:'photo', eyebrow:'03 · Фото',               word:'Фото',              sub:'Свадьбы, мероприятия, реклама и предметка, портреты.', cta:'Посчитать цену', href:'/ru/photo/',     ac:[227,154,165]},
    {key:'corp',  eyebrow:'04 · Бизнесу',            word:'Бизнесу',           sub:'Фото + видео сопровождение мероприятий под ключ.',    cta:'Смотреть форматы',href:'/ru/corporate/', ac:[216,178,122]},
    {key:'dev',   eyebrow:'05 · Игры и приложения',  word:'Игры и приложения', sub:'HTML-игры и приложения для брендов. От 2000 €.',      cta:'Обсудить проект', href:'/ru/dev/',       ac:[167,139,250]}
  ];
  var N = SECTIONS.length;
  var MARK = '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="fgc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD65A"/><stop offset=".5" stop-color="#FB8C3C"/><stop offset="1" stop-color="#EC1E93"/></linearGradient></defs><g fill="url(#fgc)"><g transform="rotate(0 24 24)"><path d="M24 6 C27 15 27 18 24 22 C21 18 21 15 24 6Z"/></g><g transform="rotate(60 24 24)"><path d="M24 6 C27 15 27 18 24 22 C21 18 21 15 24 6Z"/></g><g transform="rotate(120 24 24)"><path d="M24 6 C27 15 27 18 24 22 C21 18 21 15 24 6Z"/></g><g transform="rotate(180 24 24)"><path d="M24 6 C27 15 27 18 24 22 C21 18 21 15 24 6Z"/></g><g transform="rotate(240 24 24)"><path d="M24 6 C27 15 27 18 24 22 C21 18 21 15 24 6Z"/></g><g transform="rotate(300 24 24)"><path d="M24 6 C27 15 27 18 24 22 C21 18 21 15 24 6Z"/></g></g><circle cx="24" cy="24" r="3.2" fill="#fff" opacity=".92"/><circle cx="24" cy="24" r="20.5" fill="none" stroke="url(#fgc)" stroke-width="1.5" opacity=".7"/></svg>';

  window.FLORA_SECTIONS = SECTIONS;

  // shared icon art, drawn around origin (0,0) in a ~[-80,80] box; mode 'fill'|'stroke'
  function rrp(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function P(c,m){ if(m==='stroke') c.stroke(); else c.fill(); }
  function iFlower(c,m){ for(var i=0;i<6;i++){ c.save(); c.rotate(i*Math.PI/3); c.beginPath(); c.ellipse(0,-46,19,38,0,0,7); P(c,m); c.restore(); } c.beginPath(); c.arc(0,0,17,0,7); P(c,m); }
  function iVideo(c,m){ rrp(c,-54,-54,108,108,22); P(c,m); c.beginPath(); c.moveTo(-16,-28); c.lineTo(32,0); c.lineTo(-16,28); c.closePath(); P(c,m); }
  function iAudio(c,m){ var hs=[24,46,72,40,86,52,30,60], n=hs.length; for(var k=0;k<n;k++){ var x=-(n-1)*9+k*18; rrp(c,x-4,-hs[k]/2,8,hs[k],4); P(c,m); } }
  function iPhoto(c,m){ rrp(c,-64,-40,128,80,14); P(c,m); rrp(c,-20,-56,40,16,5); P(c,m); c.beginPath(); c.arc(0,2,26,0,7); P(c,m); if(m==='stroke'){ c.beginPath(); c.arc(0,2,12,0,7); c.stroke(); } }
  function iBiz(c,m){ rrp(c,-62,-28,124,72,12); P(c,m); rrp(c,-22,-48,44,22,8); P(c,m); }
  function iDev(c,m){ rrp(c,-74,-26,148,58,26); P(c,m); if(m==='stroke'){ c.beginPath(); c.moveTo(-46,3); c.lineTo(-20,3); c.moveTo(-33,-10); c.lineTo(-33,16); c.stroke(); c.beginPath(); c.arc(36,-4,6,0,7); c.stroke(); c.beginPath(); c.arc(54,12,6,0,7); c.stroke(); } else { c.beginPath(); c.arc(36,-4,6,0,7); c.fill(); c.beginPath(); c.arc(54,12,6,0,7); c.fill(); } }
  window.FLORA_ICONS = [iFlower,iVideo,iAudio,iPhoto,iBiz,iDev];
  // offscreen canvas with icon i drawn white/filled, centered, for use as a GL texture
  window.FloraIconCanvas = function(i, size){ var cv=document.createElement('canvas'); cv.width=cv.height=size; var c=cv.getContext('2d');
    c.translate(size/2,size/2); var sc=size/210; c.scale(sc,sc); c.fillStyle='#fff'; c.strokeStyle='#fff'; c.lineJoin='round'; c.lineCap='round'; c.lineWidth=7;
    window.FLORA_ICONS[i](c,'fill'); return cv; };

  window.FloraHero = function(cfg){
    cfg = cfg || {};
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.style.setProperty('--ac', SECTIONS[0].ac.join(','));
    if(cfg.hideWord) document.body.classList.add('hide-word');

    // background layers
    var tint=document.createElement('div'); tint.className='tint'; document.body.appendChild(tint);

    // stage element
    var stage;
    if(cfg.layer==='svg'){ stage=document.createElementNS('http://www.w3.org/2000/svg','svg'); stage.setAttribute('id','stage'); stage.setAttribute('preserveAspectRatio','xMidYMid meet'); }
    else if(cfg.layer==='div'){ stage=document.createElement('div'); stage.id='stage'; }
    else { stage=document.createElement('canvas'); stage.id='stage'; }
    document.body.appendChild(stage);

    var grain=document.createElement('div'); grain.className='grain'; document.body.appendChild(grain);

    // header
    var bar=document.createElement('header'); bar.className='bar';
    var navLinks='';
    for(var i=1;i<N;i++){ navLinks+='<a href="#s'+i+'" data-i="'+i+'">'+(SECTIONS[i].key==='dev'?'Игры':SECTIONS[i].word)+'</a>'; }
    bar.innerHTML='<a class="brand" href="#s0">'+MARK+'<span class="wm">Flora</span></a>'
      +'<nav class="sec">'+navLinks+'</nav>'
      +'<div class="lang"><b class="on">LV</b><b>RU</b><b>EN</b></div>';
    document.body.appendChild(bar);

    // sections
    var main=document.createElement('main');
    for(var s=0;s<N;s++){ var S=SECTIONS[s];
      var cta = S.cta ? '<a class="cta'+(S.key==='dev'?' ghost':'')+'" href="'+S.href+'">'+S.cta+'</a>' : '';
      main.innerHTML += '<section class="st" id="s'+s+'"><p class="eyebrow">'+S.eyebrow+'</p><h1 class="word">'+S.word+'</h1><p class="sub">'+S.sub+'</p>'+cta+'</section>';
    }
    document.body.appendChild(main);

    var foot=document.createElement('footer'); foot.className='foot'; foot.innerHTML='+371 27 775 842 · <a href="mailto:info@florasoundrecords.lv">info@florasoundrecords.lv</a> · Rīga';
    document.body.appendChild(foot);

    var hint=document.createElement('div'); hint.className='scrollhint'; hint.textContent='листай вниз ↓'; document.body.appendChild(hint);

    // lang + nav wiring
    var navA=bar.querySelectorAll('nav.sec a');
    bar.querySelectorAll('.lang b').forEach(function(b){ b.addEventListener('click',function(){ bar.querySelectorAll('.lang b').forEach(function(x){ x.classList.toggle('on',x===b); }); }); });

    function ramp(f){ return f<0.5 ? 0.5*Math.pow(f*2,3) : 1 - 0.5*Math.pow((1-f)*2,3); } // slow→fast→slow
    function lerp(a,b,t){ return a+(b-a)*t; }

    var render = cfg.init ? cfg.init(stage, {reduce:reduce, SECTIONS:SECTIONS}) : function(){};
    var root=document.documentElement, lastAcc='', running=true, dpr=1;

    function frame(now){
      var vh=window.innerHeight||1, y=window.scrollY||window.pageYOffset||0;
      var s=Math.max(0, Math.min(N-1, y/vh));
      var a=Math.floor(s), b=Math.min(N-1,a+1), f=s-a;
      var mt = reduce ? (f<0.5?0:1) : ramp(f);
      var sc = reduce ? 0 : Math.sin(Math.PI*f);
      var ac=[ Math.round(lerp(SECTIONS[a].ac[0],SECTIONS[b].ac[0],mt)),
               Math.round(lerp(SECTIONS[a].ac[1],SECTIONS[b].ac[1],mt)),
               Math.round(lerp(SECTIONS[a].ac[2],SECTIONS[b].ac[2],mt)) ];
      var accS=ac.join(','); if(accS!==lastAcc){ root.style.setProperty('--ac',accS); lastAcc=accS; }
      var cur=Math.round(s); for(var k=0;k<navA.length;k++) navA[k].classList.toggle('on',(k+1)===cur);
      hint.style.opacity = s>0.4?'0':'';
      dpr=Math.min(window.devicePixelRatio||1,2);
      render({ s:s, a:a, b:b, f:f, mt:mt, sc:sc, ac:ac, time:(now||0)*0.001, reduce:reduce,
               w:window.innerWidth, h:window.innerHeight, dpr:dpr });
      if(running) requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange',function(){ running=!document.hidden; if(running) requestAnimationFrame(frame); });
    requestAnimationFrame(frame);
  };
})();
