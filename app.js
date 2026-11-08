'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvasSizes=new Map($$('canvas').map(c=>[c,{width:c.width,height:c.height}]));
const viewWidth=c=>canvasSizes.get(c).width,viewHeight=c=>canvasSizes.get(c).height;
const modes=['observe','echo'];
let lab='observe',t=0,playing=false,last=0,marks={wave:[],time:[]};
const C={ink:'#183b37',muted:'#51645e',grid:'#e3eae3',teal:'#18665d',orange:'#ba4d29',gold:'#997000'};
function pars(){return {f:+$('#f').value,a:+$('#a').value,v:+$('#v').value,d:+$('#d').value,u:+$('#u').value,probe:+$('#probe').value};}
function stop(){playing=false;$('#play span').textContent='播放';$('#play svg').innerHTML='<path d="m7 4 13 8-13 8Z" fill="currentColor"/>';}
function clearMarks(){marks={wave:[],time:[]};$('#measure').textContent='';}
function zero(){stop();t=0;clearMarks();update();}
function boatModel(p){const c=340;return {c,outbound:p.d/c,total:2*p.d/(c+p.u)};}
function selectLab(next){lab=next==='echo'?'echo':'observe';$$('[data-lab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lab===lab)));$$('.wave-only').forEach(e=>e.hidden=lab==='echo');$$('.echo-only').forEach(e=>e.hidden=lab!=='echo');$('#track').closest('label').hidden=lab==='echo';$('#equilibrium').closest('label').hidden=lab==='echo';$('#timer-toggle').hidden=lab==='echo';$('#receipt').hidden=lab!=='echo';$('#timer-panel').hidden=lab!=='echo'&&!$('#timer').checked;$('#wave').setAttribute('aria-label',lab==='echo'?'船等速向岸邊前進，聲波向岸邊傳播後反射，被移動中的船接收。虛線標示發聲位置。':'繩波位置圖，橘色點標記固定位置，金色點標記一個波峰');$('#time').setAttribute('aria-label',lab==='echo'?'發聲、岸邊反射與船收到回聲的時間紀錄':'固定觀察點的位移與時間圖');zero();}
$$('[data-lab]').forEach(b=>b.onclick=()=>{if(lab!==b.dataset.lab)selectLab(b.dataset.lab);location.hash=lab;});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1)==='echo'?'echo':'observe';if(next!==lab)selectLab(next);});
['f','a','v','d','u','probe'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='d'||id==='u')$('#'+id+'-number').value=$('#'+id).value;zero();}));
['d','u'].forEach(id=>{const n=$('#'+id+'-number'),slider=$('#'+id);n.addEventListener('input',()=>{if(n.value&&n.validity.valid){slider.value=n.value;zero();}});n.addEventListener('change',()=>{const value=Number(n.value);if(!n.value||!Number.isFinite(value)){n.value=slider.value;return;}const low=+slider.min,high=+slider.max,step=+slider.step;slider.value=Math.max(low,Math.min(high,low+Math.round((value-low)/step)*step));n.value=slider.value;zero();});});
function advance(dt){const end=lab==='echo'?boatModel(pars()).total:Infinity;t=Math.min(t+dt,end);if(t>=end)stop();update();}
$('#play').onclick=()=>{if(playing){stop();return;}if(lab==='echo'&&t>=boatModel(pars()).total)zero();playing=true;$('#play span').textContent='暫停';$('#play svg').innerHTML='<path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor"/>';};
$('#step').onclick=()=>{stop();advance(.05);};$('#reset').onclick=zero;
$('#clear').onclick=()=>{clearMarks();draw();};
['ruler','timer','equilibrium','track','trace'].forEach(id=>$('#'+id).onchange=()=>{if(id==='ruler')clearMarks();$('#trace-panel').hidden=!$('#trace').checked;$('#timer-panel').hidden=lab!=='echo'&&!$('#timer').checked;$('#clear').hidden=!$('#ruler').checked;update();});
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else{await $('#lab').requestFullscreen();}}catch{}};
if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
function update(){const p=pars();$('#f-out').textContent=p.f.toFixed(2)+' Hz';$('#a-out').textContent=p.a.toFixed(2)+' cm';$('#v-out').textContent=p.v+' m/s';$('#probe-out').textContent=p.probe.toFixed(1)+' m';$('#clock').textContent=t.toFixed(lab==='echo'?3:2);if(lab==='echo'){const m=boatModel(p);$('#receipt').textContent=t>=m.total?'收到回聲：'+m.total.toFixed(3)+' s':t===0?'':t<m.outbound?'聲波去程':'聲波回程';$('#receipt').classList.toggle('received',t>=m.total);}draw();}
function base(c){
 const width=viewWidth(c),height=viewHeight(c),displayWidth=c.getBoundingClientRect().width;
 const scale=Math.min(4,Math.max(1,displayWidth*(window.devicePixelRatio||1)/width));
 const pixelWidth=Math.round(width*scale),pixelHeight=Math.round(height*scale);
 if(c.width!==pixelWidth||c.height!==pixelHeight){c.width=pixelWidth;c.height=pixelHeight;}
 const g=c.getContext('2d');
 g.setTransform(c.width/width,0,0,c.height/height,0,0);
 g.clearRect(0,0,width,height);g.fillStyle='#fff';g.fillRect(0,0,width,height);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.lineCap='round';g.lineJoin='round';
 g.font='22px "Noto Sans TC","Microsoft JhengHei",sans-serif';return g;
}
function text(g,s,x,y,col=C.muted,align='left'){g.fillStyle=col;g.textAlign=align;g.fillText(s,x,y);g.textAlign='left';}
function line(g,x,y,X,Y,col,w=1){g.beginPath();g.strokeStyle=col;g.lineWidth=w;g.moveTo(x,y);g.lineTo(X,Y);g.stroke();}
function dot(g,x,y,r,col){g.beginPath();g.fillStyle=col;g.arc(x,y,r,0,2*Math.PI);g.fill();}
function axes(g,W,H,xmax,ymax,xlabel,ylabel,xmin=0){const b={l:84,r:W-36,top:42,bottom:H-60};const px=x=>b.l+(x-xmin)/(xmax-xmin)*(b.r-b.l),py=y=>(b.top+b.bottom)/2-y/ymax*(b.bottom-b.top)/2;if($('#ruler').checked){for(let i=0;i<=8;i++){const x=xmin+(xmax-xmin)*i/8;line(g,px(x),b.top,px(x),b.bottom,C.grid);text(g,Number(x.toFixed(2)),px(x),H-30,C.muted,'center');}[-ymax,-ymax/2,0,ymax/2,ymax].forEach(y=>{line(g,b.l,py(y),b.r,py(y),C.grid);text(g,y.toFixed(1),b.l-14,py(y)+7,C.muted,'right');});text(g,ylabel,14,26,C.ink);text(g,xlabel,W-24,H-3,C.ink,'right');}if($('#equilibrium').checked&&lab!=='echo'){g.setLineDash([8,7]);line(g,b.l,py(0),b.r,py(0),'#9bb3a4');g.setLineDash([]);}return {px,py,...b};}
function waveY(x,time,p){return p.a*Math.sin(2*Math.PI*(x/(p.v/p.f)-p.f*time));}
function markLines(g,m,map,b,label){if(!$('#ruler').checked)return;m.forEach((x,i)=>{if(map(x)<b.l||map(x)>b.r)return;g.setLineDash([6,5]);line(g,map(x),b.top,map(x),b.bottom,C.orange,1.5);g.setLineDash([]);text(g,label(x),Math.min(Math.max(map(x)+8,b.l),b.r-115),b.top+25+i*29,C.orange);});}
function draw(){const p=pars(),w=$('#wave'),tc=$('#time'),g=base(w);if(lab==='echo'){drawEcho(g,$('#trace').checked?base(tc):null,p);return;}const b=axes(g,viewWidth(w),viewHeight(w),16,2,'位置 x（m）','位移 y（cm）');g.save();g.beginPath();g.rect(b.l,b.top,b.r-b.l,b.bottom-b.top);g.clip();g.beginPath();g.lineWidth=3.5;g.strokeStyle=C.teal;const samples=Math.max(1200,Math.ceil(w.width));for(let i=0;i<=samples;i++){const x=i*16/samples,y=waveY(x,t,p);i?g.lineTo(b.px(x),b.py(y)):g.moveTo(b.px(x),b.py(y));}g.stroke();for(let x=0;x<=16;x+=.2)dot(g,b.px(x),b.py(waveY(x,t,p)),5,C.teal);if($('#track').checked){dot(g,b.px(p.probe),b.py(waveY(p.probe,t,p)),10,C.orange);const peak=p.v/(4*p.f)+p.v*t;if(peak<=16)dot(g,b.px(peak),b.py(p.a),9,C.gold);}g.restore();markLines(g,marks.wave,b.px,b,x=>x.toFixed(2)+' m');if(!$('#trace').checked)return;const h=base(tc),start=Math.max(0,t-8),bt=axes(h,viewWidth(tc),viewHeight(tc),start+8,2,'時間 t（s）','位移 y（cm）',start);h.save();h.beginPath();h.rect(bt.l,bt.top,bt.r-bt.l,bt.bottom-bt.top);h.clip();h.beginPath();h.strokeStyle=C.orange;h.lineWidth=3;const n=Math.max(1,Math.ceil((t-start)*Math.max(160,tc.width/8)));for(let i=0;i<=n;i++){const u=start+(t-start)*i/n;i?h.lineTo(bt.px(u),bt.py(waveY(p.probe,u,p))):h.moveTo(bt.px(u),bt.py(waveY(p.probe,u,p)));}h.stroke();dot(h,bt.px(t),bt.py(waveY(p.probe,t,p)),6,C.orange);h.restore();markLines(h,marks.time,bt.px,bt,x=>x.toFixed(2)+' s');}
function ship(g,x,ghost=false){
 g.save();if(ghost)g.globalAlpha=.23;
 g.fillStyle=C.teal;g.beginPath();g.moveTo(x-55,255);g.lineTo(x+60,255);g.lineTo(x+40,284);g.lineTo(x-35,284);g.closePath();g.fill();
 g.fillStyle='#dceae4';g.fillRect(x-25,229,45,26);g.fillStyle=C.teal;g.fillRect(x-17,236,10,10);g.fillRect(x+1,236,10,10);
 line(g,x,229,x,214,C.teal,3);dot(g,x,214,5,C.orange);g.restore();
}
function drawEcho(g,h,p){
 const m=boatModel(p),time=Math.min(t,m.total),left=120,right=1070,scale=(right-left)/p.d,shipX=left+p.u*time*scale,arrived=t>=m.total;
 g.fillStyle='#f0f7f5';g.fillRect(55,287,1065,104);line(g,55,287,1120,287,'#c4dcd5',2);
 g.fillStyle='#cad2ca';g.fillRect(right,110,30,177);line(g,right,110,right,287,C.ink,3);text(g,'岸邊',right,86,C.ink,'center');
 g.setLineDash([5,6]);line(g,left,195,left,318,'#9bb3a4',1.5);g.setLineDash([]);
 ship(g,left,true);ship(g,shipX);text(g,'發聲位置',left,343,C.muted,'center');
 if(p.u>0)text(g,'船 →',shipX+80,276,C.teal);
 const outward=time<m.outbound,packet=outward?340*time:2*p.d-340*time,packetX=left+packet*scale;
 if(!arrived&&time>0){
  const dir=outward?1:-1;g.strokeStyle=C.orange;g.lineWidth=2.5;
  for(let i=0;i<3;i++){const cx=packetX-dir*i*10;g.beginPath();g.arc(cx,214,13+i*5,dir===1?-Math.PI/3:2*Math.PI/3,dir===1?Math.PI/3:4*Math.PI/3);g.stroke();}
  line(g,packetX-dir*13,214,packetX+dir*13,214,C.orange,2);g.fillStyle=C.orange;g.beginPath();g.moveTo(packetX+dir*18,214);g.lineTo(packetX+dir*8,208);g.lineTo(packetX+dir*8,220);g.closePath();g.fill();
  const labelX=Math.max(230,Math.min(packetX,980));text(g,outward?'去程 →':'← 反射回程',labelX,166,C.orange,'center');
 }
 if(arrived){g.beginPath();g.strokeStyle=C.orange;g.lineWidth=3;g.arc(shipX,214,15,0,Math.PI*2);g.stroke();text(g,'收到回聲',shipX,166,C.orange,'center');}
 if($('#ruler').checked){
  line(g,left,380,right,380,'#9bb3a4');line(g,left,372,left,388,'#9bb3a4');line(g,right,372,right,388,'#9bb3a4');text(g,'初始距離 '+p.d+' m',(left+right)/2,411,C.ink,'center');
  if(arrived){g.setLineDash([4,5]);line(g,shipX,290,shipX,357,C.orange);g.setLineDash([]);text(g,'接收時離岸 '+(p.d-p.u*time).toFixed(1)+' m',640,455,C.orange,'center');}
 }
 if(!h)return;
 const tc=$('#time'),end=echoAxisEnd(p),b={l:84,r:viewWidth(tc)-36,top:52,bottom:170},px=x=>b.l+x/end*(b.r-b.l),baseline=150;
 if($('#ruler').checked){for(let i=0;i<=6;i++){const x=end*i/6;line(h,px(x),b.top,px(x),baseline,C.grid);text(h,x.toFixed(2),px(x),193,C.muted,'center');}text(h,'時間 t（s）',viewWidth(tc)-24,226,C.ink,'right');}
 line(h,px(0),baseline,px(time),baseline,C.teal,3);
 const events=[{time:0,label:'發聲',color:C.teal}];if(time>=m.outbound)events.push({time:m.outbound,label:'岸邊反射',color:C.gold});if(arrived)events.push({time:m.total,label:'船收到回聲',color:C.orange});
 events.forEach(e=>{line(h,px(e.time),baseline,px(e.time),60,e.color,3);text(h,e.label,px(e.time)+8,36,e.color);});dot(h,px(time),baseline,6,C.orange);markLines(h,marks.time,px,b,x=>x.toFixed(3)+' s');
}
function echoAxisEnd(p){return Math.ceil(boatModel(p).total*1.15*10)/10;}
['wave','time'].forEach(id=>{const c=$('#'+id);c.tabIndex=0;c.addEventListener('click',e=>{if(!$('#ruler').checked||lab==='echo'&&id==='wave')return;stop();const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*viewWidth(c)/r.width,l=84,right=viewWidth(c)-36;if(x<l||x>right)return;const span=lab==='echo'?echoAxisEnd(pars()):id==='wave'?16:8,start=id==='time'&&lab!=='echo'?Math.max(0,t-8):0,value=start+(x-l)/(right-l)*span;if(marks[id].length===2)marks[id]=[];marks[id].push(value);const a=marks[id],unit=id==='wave'?'m':'s';$('#measure').textContent=a.length===1?value.toFixed(3)+' '+unit:'Δ'+(id==='wave'?'x':'t')+' = '+Math.abs(a[1]-a[0]).toFixed(3)+' '+unit;draw();});});
function frame(now){if(last&&playing&&!document.hidden)advance(Math.min((now-last)/1000,.08)*+$('#rate').value);last=now;requestAnimationFrame(frame);}document.addEventListener('visibilitychange',()=>last=0);requestAnimationFrame(frame);
selectLab(location.hash.slice(1));
const canvasResize=new ResizeObserver(()=>draw());
$$('canvas').forEach(c=>canvasResize.observe(c));
window.addEventListener('resize',()=>draw());
document.addEventListener('fullscreenchange',()=>draw());
function watchPixelRatio(){const query=matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);query.addEventListener('change',()=>{draw();watchPixelRatio();},{once:true});}
watchPixelRatio();
