/* Flora — стеклянная апертура (WebGL-шейдер). initAperture(canvas, {getOpen, pointer}) */
window.initAperture = function(canvas, opts){
  opts = opts || {};
  var getOpen = opts.getOpen || function(){ return 0.12; };
  var usePointer = opts.pointer !== false;
  var gl = canvas.getContext('webgl', {antialias:false, alpha:true, premultipliedAlpha:false});
  if(!gl){ return null; }

  var VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }';
  var FRAG = [
  '#ifdef GL_FRAGMENT_PRECISION_HIGH',
  'precision highp float;',
  '#else',
  'precision mediump float;',
  '#endif',
  'uniform vec2 uRes; uniform float uTime; uniform float uOpen; uniform vec2 uMouse;',
  '#define TAU 6.28318530718',
  'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
  'float sdBox(vec3 p, vec3 b){ vec3 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,max(d.y,d.z)),0.0); }',
  'float mIris(vec3 p, float open){',
  '  float d = 1e9;',
  '  float push = 0.30 + open*0.55;',
  '  for(int i=0;i<6;i++){',
  '    float a = float(i)/6.0*TAU;',
  '    vec3 q=p; q.xy = rot(a)*q.xy; q.y -= push; q.xy = rot(0.30)*q.xy;',
  '    d = min(d, sdBox(q, vec3(0.15,0.34,0.055)) - 0.02);',
  '  }',
  '  return d;',
  '}',
  'float map(vec3 p){',
  '  p.xy = rot(uTime*0.14)*p.xy;',
  '  p.yz = rot(0.10*sin(uTime*0.5))*p.yz;',
  '  return mIris(p, uOpen);',
  '}',
  'vec3 calcNormal(vec3 p){ vec2 e=vec2(0.0013,0.0); return normalize(vec3(',
  '  map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx))); }',
  'vec3 palette(float t){',
  '  vec3 gold=vec3(1.0,0.84,0.34); vec3 orange=vec3(0.98,0.53,0.22); vec3 fuchsia=vec3(0.93,0.11,0.57);',
  '  return t<0.5?mix(gold,orange,t*2.0):mix(orange,fuchsia,(t-0.5)*2.0);',
  '}',
  'vec3 env(vec3 d){',
  '  vec3 c = mix(vec3(0.01,0.01,0.02), vec3(0.06,0.06,0.08), clamp(d.y*0.5+0.5,0.0,1.0));',
  '  c += vec3(1.0,0.96,0.88)*pow(max(dot(d, normalize(vec3(0.55,0.7,0.45))),0.0),40.0)*1.3;',
  '  c += vec3(0.95,0.25,0.62)*pow(max(dot(d, normalize(vec3(-0.6,-0.1,0.55))),0.0),18.0)*0.5;',
  '  return c;',
  '}',
  'vec3 shade(vec3 p, vec3 n, vec3 rd){',
  '  float fres = pow(1.0 - max(dot(n,-rd),0.0), 4.0);',
  '  vec3 refl = env(reflect(rd,n));',
  '  vec3 refr = vec3(env(refract(rd,n,0.90)).r, env(refract(rd,n,0.925)).g, env(refract(rd,n,0.95)).b);',
  '  float t = clamp(0.5 + 0.5*sin(atan(p.y,p.x)*1.5 + uTime*0.2),0.0,1.0);',
  '  vec3 tint = palette(t);',
  '  vec3 col = mix(refr*tint, refl, clamp(fres,0.0,1.0));',
  '  vec3 h1 = normalize(normalize(vec3(0.55,0.85,0.5)) - rd);',
  '  col += vec3(1.0)*pow(max(dot(n,h1),0.0),140.0)*1.6;',
  '  vec3 h2 = normalize(normalize(vec3(-0.5,0.35,0.7)) - rd);',
  '  col += vec3(1.0,0.6,0.85)*pow(max(dot(n,h2),0.0),90.0)*0.9;',
  '  col += tint*fres*0.6;',
  '  return col;',
  '}',
  'void main(){',
  '  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;',
  '  float el = 0.16 + uMouse.y*0.14; float az = uMouse.x*0.28;',
  '  float R = 3.0;',
  '  vec3 ro = vec3(R*cos(el)*sin(az), R*sin(el), R*cos(el)*cos(az));',
  '  vec3 fwd = normalize(-ro); vec3 rgt = normalize(cross(vec3(0,1,0),fwd)); vec3 upv = cross(fwd,rgt);',
  '  vec3 rd = normalize(uv.x*rgt + uv.y*upv + 1.7*fwd);',
  '  float t=0.0, glow=0.0; bool hit=false; vec3 p;',
  '  for(int i=0;i<90;i++){ p=ro+rd*t; float d=map(p); glow += 0.08/(1.0+d*d*45.0);',
  '    if(d<0.0008){ hit=true; break; } t += d*0.9; if(t>9.0) break; }',
  '  vec3 col; float a;',
  '  if(hit){ vec3 n=calcNormal(p); col=shade(p,n,rd); a=1.0; }',
  '  else { col = palette(0.62)*glow; a = clamp(glow*0.5,0.0,1.0); }',
  '  col = col/(col+vec3(1.0)); col = pow(col, vec3(0.4545));',
  '  gl_FragColor = vec4(col, a);',
  '}'
  ].join('\n');

  function sh(type, src){ var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
  var prog=gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  var buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  var al=gl.getAttribLocation(prog,'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0,0,0,0);

  var U = { res:gl.getUniformLocation(prog,'uRes'), time:gl.getUniformLocation(prog,'uTime'),
            open:gl.getUniformLocation(prog,'uOpen'), mouse:gl.getUniformLocation(prog,'uMouse') };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mx=0,my=0,tmx=0,tmy=0;

  function resize(){ var dpr=Math.min(window.devicePixelRatio||1,1.6);
    var w=Math.floor(canvas.clientWidth*dpr), h=Math.floor(canvas.clientHeight*dpr);
    if(w>0 && h>0 && (canvas.width!==w||canvas.height!==h)){ canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); } }
  window.addEventListener('resize', resize);

  if(usePointer){
    window.addEventListener('pointermove', function(e){ tmx=(e.clientX/window.innerWidth*2-1); tmy=-(e.clientY/window.innerHeight*2-1); });
  }

  var running=true, lastT=0;
  document.addEventListener('visibilitychange', function(){ running=!document.hidden; if(running && !reduce) requestAnimationFrame(loop); });
  function draw(tSec){ resize(); mx+=(tmx-mx)*0.06; my+=(tmy-my)*0.06;
    var open = Math.max(0, Math.min(1, getOpen()));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, canvas.width, canvas.height); gl.uniform1f(U.time, reduce?0.0:tSec);
    gl.uniform1f(U.open, open); gl.uniform2f(U.mouse, mx, my);
    gl.drawArrays(gl.TRIANGLES,0,3); }
  function loop(now){ if(!running) return; lastT=now*0.001; draw(lastT); requestAnimationFrame(loop); }
  resize();
  if(reduce){ draw(0.0);
    // still react to open changes even without animation
    var last=-1; setInterval(function(){ var o=getOpen(); if(Math.abs(o-last)>0.01){ last=o; draw(0.0); } }, 120);
  } else { requestAnimationFrame(loop); }
  return { redraw:function(){ draw(lastT); } };
};
