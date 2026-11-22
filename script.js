/* Stick figure drawn once, inserted in every scene */
const FIG=p=>`<g id="${p}-lL"><path d="M0 0 V78 H13"/></g><g id="${p}-lR"><path d="M0 0 V78 H13"/></g><g id="${p}-body"><g id="${p}-aL"><path d="M0 0 V42"/><g id="${p}-aL2"><path d="M0 0 V42"/></g></g><path d="M0 0 V-82"/><circle cx="0" cy="-106" r="24" fill="#fff"/><circle id="${p}-eA" cx="9" cy="-110" r="3.4" fill="#000" stroke="none"/><circle id="${p}-eB" cx="-7" cy="-110" r="3.4" fill="#000" stroke="none" opacity="0"/><path id="${p}-mouth" d="M0 -96 Q8 -94 16 -96" stroke-width="4"/><g id="${p}-aR"><path d="M0 0 V42"/><g id="${p}-aR2"><path d="M0 0 V42"/></g></g></g>`;
document.querySelectorAll('g.fig').forEach(g=>{g.innerHTML=FIG(g.id);});
let P='';
const $=id=>document.getElementById(P+id);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const eseg=(t,a,b)=>ease(seg(t,a,b));
const bell=(t,a,b)=>Math.sin(Math.PI*seg(t,a,b));
const mx=(a,b,w)=>[a[0]+(b[0]-a[0])*w,a[1]+(b[1]-a[1])*w];
const RAD=Math.PI/180;
const setT=(id,s)=>$(id).setAttribute('transform',s);
const setO=(id,o)=>$(id).setAttribute('opacity',o);
const L1=42,L2=42,SY=-66;
const fc=p=>{const f=p.face===undefined?1:p.face;return Math.abs(f)<.03?.03:f;};
function ik(sx,sy,tx,ty,l1,l2,bend){
  let dx=tx-sx,dy=ty-sy,D=Math.hypot(dx,dy);
  const m=l1+l2-0.5;
  if(D>m){dx*=m/D;dy*=m/D;D=m;}
  if(D<10){const k=10/(D||1);dx=(dx*k)||0;dy=(dy*k)||10;D=10;}
  const phi=Math.atan2(-dx,dy);
  const al=Math.acos(clamp((l1*l1+D*D-l2*l2)/(2*l1*D),-1,1));
  const a=phi+bend*al;
  const ex=sx-l1*Math.sin(a),ey=sy+l1*Math.cos(a);
  const b=Math.atan2(-(sx+dx-ex),sy+dy-ey);
  return [a/RAD,(b-a)/RAD];
}
function toLocal(p,wx,wy){
  const sg=(p.face===undefined||p.face>=0)?1:-1,a=-(p.lean||0)*RAD;
  const x=(wx-p.x)*sg,y=wy-p.y;
  return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
}
function handWorld(p,g){
  const a=g[0]*RAD,b=(g[0]+g[1])*RAD;
  const x=-L1*Math.sin(a)-L2*Math.sin(b),y=SY+L1*Math.cos(a)+L2*Math.cos(b);
  const l=(p.lean||0)*RAD;
  return [p.x+fc(p)*(x*Math.cos(l)-y*Math.sin(l)),p.y+x*Math.sin(l)+y*Math.cos(l)];
}
function pose(id,p){
  setT(id,`translate(${p.x} ${p.y}) scale(${fc(p)} 1)`);
  setT(id+'-body',`rotate(${p.lean||0})`);
  setT(id+'-lL',`rotate(${p.lL||0})`);
  setT(id+'-lR',`rotate(${p.lR||0})`);
  const out={};
  for(const s of ['L','R']){
    const h=p['h'+s];
    let g;
    if(h){const q=toLocal(p,h[0],h[1]);g=ik(0,SY,q[0],q[1],L1,L2,1);}
    else g=p['a'+s]||[0,0];
    setT(`${id}-a${s}`,`translate(0 ${SY}) rotate(${g[0]})`);
    setT(`${id}-a${s}2`,`translate(0 ${L1}) rotate(${g[1]})`);
    out['h'+s]=handWorld(p,g);
  }
  const fr=p.front||0,sm=p.smile===undefined?.2:p.smile,cx=8*(1-fr);
  $(id+'-mouth').setAttribute('d',`M${cx-8} -96 Q${cx} ${-96+16*sm} ${cx+8} -96`);
  $(id+'-eA').setAttribute('cx',9-2*fr);
  $(id+'-eB').setAttribute('opacity',fr);
  return out;
}
const setF=(id,c)=>{$(id).style.fill=c;};
const setK=(id,c)=>{$(id).style.stroke=c;};
const setX=(id,s)=>{$(id).textContent=s;};
const rgb=(a,b,w)=>'rgb('+a.map((v,i)=>Math.round(lerp(v,b[i],w))).join(',')+')';
const wk=(t,mov,k)=>{const ph=Math.sin(t*k);return{ph,lL:26*ph*mov,lR:-26*ph*mov,y:400-78*Math.cos(26*RAD*Math.abs(ph)*mov)};};
const fade=(t,L)=>clamp(t/.4)*(1-seg(t,L-.6,L));
const scenes=[];
scenes.push((()=>{
const LOOP=11,SX=[110,255,400,545,690],ST=[40,185,330,475,620,745];
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const u=seg(t,.3,10.2)*5,k=Math.min(4,Math.floor(u)),f=u-k;
  const w=clamp((f-.45)/.55);
  const x=lerp(ST[k],ST[k+1],ease(w));
  const mov=Math.sin(Math.PI*w);
  const g=wk(t,mov,12);
  const d=eseg(f,.05,.15)*(1-eseg(f,.35,.45))*(u<5?1:0);
  const hR=mx([x+8-g.ph*16*mov,g.y+12],[SX[k]-34,160],d);
  pose('f',{x,y:g.y,face:1,lL:g.lL,lR:g.lR,aL:[g.ph*18*mov,0],hR,smile:.7});
  for(let i=0;i<5;i++)setF('sgb'+i,u>=i+.05?'#bfdbfe':'#ffffff');
}
return {P:'s0-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=9;
function scene(T){
  const t=T;
  const p1=eseg(t,0,1.4),p2=eseg(t,1.5,5.0),r=eseg(t,7.2,9);
  const m3=(a,b,c)=>lerp(lerp(lerp(a,b,p1),c,p2),a,r);
  const hold=seg(t,5.0,5.6)*(1-r);
  const ax=m3(575,575,560),th=m3(0,-5,90),ay=m3(300,165,275)+3*Math.sin(t*4)*hold;
  setT('arrow',`translate(${ax} ${ay}) rotate(${th})`);
  const fl=clamp(p1*4)*(1-clamp(p2*1.6))*(1-r);
  setT('flame',`translate(0 82) scale(1 ${(.2+fl*(.8+.25*Math.sin(t*35))).toFixed(3)}) translate(0 -82)`);
  setO('flame',fl>.03?1:0);
  const ten=lerp(lerp(.35,1,clamp(p1*2)),.35,r);
  const brace=clamp(p1*2)*(1-r);
  const fx=m3(215,262,205),lean=m3(2,18,-16);
  const jig=bell(t,1.6,5.0)*Math.sin((t-1.5)*5)*9;
  const h=pose('f',{x:fx,y:322,face:1,lean,lL:22*brace,lR:-26*brace,hR:[fx+66+jig,262],hL:[fx+52+jig,270],smile:m3(.2,-.8,1)});
  const A=[ax-25*Math.sin(th*RAD),ay+25*Math.cos(th*RAD)],H=h.hR,sag=46*(1-ten);
  $('rope').setAttribute('d',`M${H[0]} ${H[1]} Q${(H[0]+A[0])/2} ${(H[1]+A[1])/2+sag} ${A[0]} ${A[1]}`);
}
return {P:'s1-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=11,N=16,PP=1.3;
function scene(T){
  const t=T;
  setO('art',clamp(t/.4)*(1-seg(t,10.5,11)));
  const hy=lerp(265,188,eseg(t,1.5,2.5));
  $('hA').setAttribute('cy',hy);
  const bA=lerp(38,-35,eseg(t,4.1,4.9));
  setT('lvB',`translate(340 295) rotate(${bA})`);
  const W=270*eseg(t,6.6,8.6);
  setT('wheel',`translate(650 215) rotate(${W})`);
  const flow=1-.97*eseg(t,6.6,8.6);
  setT('needle',`translate(415 150) rotate(${lerp(-62,62,flow)+1.5*Math.sin(t*9)})`);
  for(let i=0;i<N;i++){
    const u=(((t-i*PP/N)%PP)+PP)%PP/PP;
    const on=i<flow*N;
    const x=650+7*Math.sin(i*2.1+u*3),y=272+100*u*u;
    setT('c'+i,`translate(${x} ${y}) rotate(${u*220*(i%2?1:-1)})`);
    setO('c'+i,on?clamp((1-u)*8):0);
  }
  const wA=eseg(t,1.0,1.4)*(1-eseg(t,2.5,2.9));
  const wB=eseg(t,3.7,4.1)*(1-eseg(t,4.9,5.3));
  const wV=eseg(t,6.2,6.6)*(1-eseg(t,8.7,9.2));
  const mov=bell(t,2.9,3.7)+bell(t,5.3,6.2);
  const fx=150+150*eseg(t,2.9,3.7)+265*eseg(t,5.3,6.2);
  const ph=Math.sin(t*14),fy=400-78*Math.cos(26*RAD*Math.abs(ph)*mov),sw=22*ph*mov;
  const iR=[fx+8-sw,fy+12],iL=[fx-8+sw,fy+12];
  const HA=[215,hy],HB=[340+82*Math.sin(bA*RAD),295-82*Math.cos(bA*RAD)];
  const g=(180+(W%90))*RAD,HV=[650+30*Math.cos(g),215+30*Math.sin(g)];
  let hR=mx(iR,HA,wA);hR=mx(hR,HB,wB);hR=mx(hR,HV,wV);
  pose('f',{x:fx,y:fy,face:1,lean:12*(wA+wB)+4*wV,lL:26*ph*mov,lR:-26*ph*mov,hL:iL,hR,smile:lerp(.2,1,eseg(t,8.8,9.4))});
}
return {P:'s2-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=10.5;
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const pr=eseg(t,1.2,4.2),a=lerp(-32,36,pr);
  setT('lv',`translate(335 350) rotate(${a})`);
  const tip=[335+85*Math.sin(a*RAD),350-85*Math.cos(a*RAD)];
  const g=wk(t,(pr>.02&&pr<.98)?1:0,12);
  pose('f',{x:tip[0]-72,y:g.y,face:1,lean:6*pr,lL:g.lL,lR:g.lR,hR:tip,hL:[tip[0]-4,tip[1]+8],smile:lerp(.2,.9,seg(t,4.2,5))});
  const gh=252*lerp(.2,.9,pr);
  $('gf').setAttribute('y',356-gh);$('gf').setAttribute('height',gh);
  setX('rt','RATE '+Math.round(lerp(2,6,pr))+'%');
  for(let i=0;i<6;i++)setO('cn'+i,clamp((6*(1-.8*pr)-i)*3));
}
return {P:'s3-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=11;
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const fx=t<3.4?lerp(190,570,ease(seg(t,.3,3))):lerp(570,190,ease(seg(t,3.9,6.5)));
  const face=lerp(1,-1,eseg(t,3.4,3.9)),sg=face>=0?1:-1;
  const mov=((t>.3&&t<3)||(t>3.9&&t<6.5))?1:0,g=wk(t,mov,12);
  const ex=eseg(t,3,3.3)*(1-eseg(t,3.5,3.8));
  const dep=eseg(t,6.5,7.1)*(1-eseg(t,7.3,7.7));
  let hR=mx([fx+sg*32,g.y-40],[fx+sg*62,g.y-34],ex);
  hR=mx(hR,[fx+sg*60,g.y-30],dep);
  const h=pose('f',{x:fx,y:g.y,face,lL:g.lL,lR:g.lR,hR,hL:[hR[0]-sg*8,hR[1]+8],smile:.5});
  const dp=eseg(t,3,3.6),dxy=mx(h.hR,[655,345],dp);
  setT('doc',`translate(${dxy[0]} ${dxy[1]}) scale(${t<3.6?1:.001})`);
  let bxy=[655,350],bs=.001;
  if(t>=3.1&&t<3.8){bxy=mx([655,350],h.hR,eseg(t,3.1,3.8));bs=1;}
  else if(t>=3.8&&t<6.9){bxy=h.hR;bs=1;}
  else if(t>=6.9&&t<7.6){bxy=mx(h.hR,[90,350],eseg(t,6.9,7.6));bs=Math.max(.001,1-eseg(t,7.2,7.6));}
  setT('bag',`translate(${bxy[0]} ${bxy[1]}) scale(${bs})`);
  const hh=94*lerp(.9,.3,eseg(t,3.2,5.2));
  $('rs').setAttribute('y',194-hh);$('rs').setAttribute('height',hh);
}
return {P:'s4-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=11,N=8;
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const pr=eseg(t,1.2,4.2),ky=lerp(322,262,pr);
  setT('kn',`translate(300 ${ky})`);
  const g=wk(t,0,12);
  pose('f',{x:240,y:g.y,face:1,lean:5,hR:[300,ky],hL:[294,ky+10],smile:lerp(.2,.9,seg(t,4.2,5))});
  setX('pc','RATIO '+Math.round(lerp(5,15,pr))+'%');
  const h=190*lerp(.2,.75,pr);
  $('rv').setAttribute('y',380-h);$('rv').setAttribute('height',h);
  const flow=1-.8*pr,PP=1.2;
  for(let i=0;i<N;i++){
    const u=(((t-i*PP/N)%PP)+PP)%PP/PP;
    setT('c'+i,`translate(${596+120*u} ${332+50*u})`);
    setO('c'+i,i<flow*N?clamp((1-u)*6):0);
  }
}
return {P:'s5-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=11,PX=[340,430,520,610];
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const fx=lerp(200,245,eseg(t,.8,1.8))-8*eseg(t,3,4);
  const g=wk(t,(t>.8&&t<1.8)?1:0,12);
  for(let i=0;i<4;i++){
    const a=90*eseg(t,1.8+.75*i,2.8+.75*i)*(1-eseg(t,9,10));
    setT('d'+i,`translate(${PX[i]} 400) rotate(${a})`);
  }
  const push=eseg(t,1,1.8)*(1-eseg(t,2,2.6));
  const hR=mx([fx+8,g.y+12],[PX[0]-48,312],push);
  pose('f',{x:fx,y:g.y,face:1,lean:10*push,lL:g.lL,lR:g.lR,hR,smile:lerp(.2,.9,seg(t,4,5))});
}
return {P:'s6-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=9.5;
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const fx=t<3.9?lerp(330,520,ease(seg(t,.3,1.8))):lerp(520,300,ease(seg(t,4.1,6.2)));
  const face=lerp(1,-1,eseg(t,3.5,3.9)),sg=face>=0?1:-1;
  const g=wk(t,((t>.3&&t<1.8)||(t>4.1&&t<6.2))?1:0,12);
  const shr=eseg(t,2.6,3)*(1-eseg(t,3.8,4.2));
  const hR=mx([fx+sg*8,g.y+12],[fx+sg*34,g.y-100],shr);
  const hL=mx([fx-sg*8,g.y+12],[fx-sg*20,g.y-100],shr);
  pose('f',{x:fx,y:g.y,face,lL:g.lL,lR:g.lR,hR,hL,smile:lerp(.6,-.6,shr)*(1-seg(t,4.2,6))+.6*seg(t,4.2,6)});
  setX('rt',Math.round(lerp(3,9,eseg(t,1.8,3.6)))+'%');
  const q=eseg(t,3.8,6.2),bo=lerp(170,60,q),sa=lerp(60,170,q);
  $('bb').setAttribute('y',400-bo);$('bb').setAttribute('height',bo);
  $('bs').setAttribute('y',400-sa);$('bs').setAttribute('height',sa);
}
return {P:'s7-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=10.5,GY=400,HP=[76,303];
function scene(T){
  const t=T;
  const w1=eseg(t,0,2.2),w2=eseg(t,4.85,7.0);
  const fx=lerp(lerp(146,372,w1),146,w2);
  const face=lerp(lerp(1,-1,eseg(t,4.4,4.85)),1,eseg(t,9.2,9.7));
  const sg=face>=0?1:-1;
  const mov=bell(t,0,2.2)+bell(t,4.85,7.0);
  const ph=Math.sin(t*10);
  const fy=GY-78*Math.cos(26*RAD*Math.abs(ph)*mov),sw=22*ph*mov;
  const iR=[fx+sg*(8-sw),fy+12],iL=[fx+sg*(-8+sw),fy+12];
  const hw=eseg(t,2.2,2.6)*(1-eseg(t,4.2,4.6));
  const chest=[fx+sg*30,fy-48],shrug=[fx+sg*44,fy-74+7*Math.sin(t*6)];
  const wP=eseg(t,6.6,7.2)*(1-eseg(t,8.0,8.6));
  const hL=mx(iL,chest,hw);
  let hR=mx(iR,shrug,hw);hR=mx(hR,HP,wP);
  let sm=lerp(.2,-.6,hw);sm=lerp(sm,1,eseg(t,8.2,8.7)*(1-eseg(t,9.9,10.4)));
  const h=pose('f',{x:fx,y:fy,face,lL:26*ph*mov,lR:-26*ph*mov,hL,hR,smile:sm});
  const wv=eseg(t,2.0,2.4)*(1-eseg(t,4.4,4.8));
  setT('wal',`translate(${h.hL[0]} ${h.hL[1]-4}) scale(${Math.max(wv,.001)})`);
  setT('wf',`translate(-15 -10) rotate(${-72*eseg(t,2.7,3.0)*(1-eseg(t,3.8,4.1))})`);
  setO('wal',wv>.02?1:0);
  setT('sw',`translate(${fx+sg*34} ${fy-128+8*seg(t,2.5,4.3)})`);
  setO('sw',bell(t,2.5,4.3));
  let cp=h.hR;
  if(t>=7.5){const e=eseg(t,7.5,8.2);cp=[lerp(HP[0],68,e),lerp(HP[1],326,e)];}
  const cv=(t>4.5&&t<8.25)?eseg(t,4.5,4.8)*(1-eseg(t,8.0,8.25)):0;
  setT('coin',`translate(${cp[0]} ${cp[1]}) scale(${Math.max(cv,.001)})`);
  setO('coin',cv>.01?1:0);
  const pg=bell(t,8.1,8.7);
  setT('pig',`translate(72 398) scale(${1+.08*pg} ${1-.12*pg})`);
  setT('tag',`translate(700 112) rotate(${4*Math.sin(2*Math.PI*4*t/LOOP)+hw*4*Math.sin(t*7)})`);
  let ang=-45-15*seg(t,0,6.8);
  ang=lerp(ang,-5,eseg(t,7.0,8.8));
  ang=lerp(ang,-45,eseg(t,9.4,10.5));
  setT('pa',`translate(130 92) rotate(${ang})`);
}
return {P:'s8-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=10;
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  setT('coin',`translate(130 240) scale(${lerp(1,1.7,eseg(t,.6,3))})`);
  setO('up',eseg(t,.5,1)*(1-eseg(t,3.2,3.8)));
  const p=eseg(t,3.8,6),col=p>.5?'#1d4ed8':'#dc2626';
  setX('pr',Math.round(lerp(100,70,p)));
  setF('pr',col);setK('tg',col);
  setO('dn',eseg(t,4.2,4.8));
  const pt=eseg(t,3.4,4.2)*(1-eseg(t,6.5,7));
  pose('f',{x:350,y:322,face:1,lean:3,aL:[6,0],hR:mx([358,334],[500,262],pt),smile:lerp(.2,.9,p)});
}
return {P:'s9-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=10;
function scene(T){
  const t=T,w=k=>2*Math.PI*k*t/LOOP;
  const tau=t-3.2,shock=tau>0?Math.exp(-1.7*tau)*Math.sin(11*tau):0;
  const cy=258+28+30*shock;
  $('rope').setAttribute('d',`M150 258 Q400 ${cy} 650 258`);
  const fx=400+24*Math.sin(w(2))+14*shock;
  const lean=8*Math.sin(w(4)+.7)+30*shock;
  const lL=14*Math.sin(w(8)),lR=-lL;
  const tt=(fx-150)/500,ropeY=258+2*tt*(1-tt)*(cy-258);
  const fy=ropeY-78*Math.cos(Math.abs(lL)*RAD);
  const cx=fx+66*Math.sin(lean*RAD)+20,cyy=fy-66*Math.cos(lean*RAD)+38;
  const th=-1.5*lean+6*Math.sin(w(4));
  setT('pole',`translate(${cx} ${cyy}) rotate(${th})`);
  const sm=lerp(lerp(.2,-.9,eseg(t,2.9,3.3)),.2,eseg(t,5.0,6.2));
  pose('f',{x:fx,y:fy,face:1,lean,lL,lR,hL:[cx-5,cyy],hR:[cx+5,cyy],smile:sm});
  let by=-90;
  if(t>=1.8&&t<3.2){const u=seg(t,1.8,3.2);by=-60+330*u*u;}
  else if(t>=3.2){const q=t-3.2;by=270+471*q+300*q*q;}
  setT('barrel',`translate(560 ${by}) rotate(${(t-1.8)*90})`);
  setO('barrel',(by>-70&&by<490)?1:0);
}
return {P:'s10-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=11;
const B=s=>{const m=1-s;return[m*m*m*410+3*m*m*s*415+3*m*s*s*520+s*s*s*760,m*m*m*130+3*m*m*s*290+3*m*s*s*365+s*s*s*370];};
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const pr=eseg(t,1.2,5),a=lerp(-30,34,pr);
  setT('lv',`translate(250 350) rotate(${a})`);
  const tip=[250+85*Math.sin(a*RAD),350-85*Math.cos(a*RAD)];
  const g=wk(t,(pr>.02&&pr<.98)?1:0,12);
  pose('f',{x:tip[0]-66,y:g.y,face:1,lean:5*pr,lL:g.lL,lR:g.lR,hR:tip,hL:[tip[0]-4,tip[1]+8],smile:lerp(.2,-.5,seg(t,5,6))});
  const p=B(pr);
  setT('dot',`translate(${p[0]} ${p[1]})`);
  setF('dot',rgb([220,38,38],[29,78,216],pr));
  setO('rec',eseg(t,5,6));
}
return {P:'s11-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=12,FX=[270,460,650],ST=[60,210,400,590,745];
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const u=seg(t,.3,10.5)*4,k=Math.min(3,Math.floor(u)),f=u-k;
  const w=ease(clamp(f/.6));
  const x=lerp(ST[k],ST[k+1],w);
  const g=wk(t,(w>0&&w<1)?1:0,10);
  const d=eseg(f,.62,.72)*(1-eseg(f,.9,.99))*(k<3?1:0);
  const hR=mx([x+8,g.y+12],[FX[Math.min(k,2)]-26,250],d);
  pose('f',{x,y:g.y,face:1,lL:g.lL,lR:g.lR,aL:[g.ph*18*((w>0&&w<1)?1:0),0],hR,smile:.6});
  for(let j=0;j<3;j++)setF('fl'+j,u>=j+.62?'#1d4ed8':'#ffffff');
  setT('ck',`rotate(${t*60})`);
  setT('par',`translate(735 130) rotate(${lerp(-55,-10,eseg(t,9.4,11))})`);
}
return {P:'s12-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=11;
function scene(T){
  const t=T;
  setO('art',fade(t,LOOP));
  const pr=eseg(t,1,3.4),a=lerp(-30,34,pr);
  setT('lv',`translate(240 350) rotate(${a})`);
  const tip=[240+85*Math.sin(a*RAD),350-85*Math.cos(a*RAD)];
  const g=wk(t,(pr>.02&&pr<.98)?1:0,12);
  const fx=tip[0]-66,sh=eseg(t,4.2,4.8)*(1-eseg(t,9,9.8));
  const hR=mx(tip,[fx+40,g.y-95],sh),hL=mx([tip[0]-4,tip[1]+8],[fx-30,g.y-95],sh);
  pose('f',{x:fx,y:g.y,face:1,lean:5*pr*(1-sh),lL:g.lL,lR:g.lR,hR,hL,smile:lerp(.2,-.8,sh)});
  setT('par',`translate(690 ${lerp(300,170,eseg(t,.4,7))})`);
  setT('brl',`translate(480 400) rotate(${2.5*Math.sin(t*9)*seg(t,1,2)})`);
}
return {P:'s13-',loop:LOOP,fn:scene};})());
scenes.push((()=>{
const LOOP=8,CX=560,CY=190,HALF=150;
function scene(T){
  const t=T;
  const b=3*Math.sin(2*Math.PI*t/4);
  setT('beam',`translate(${CX} ${CY}) rotate(${b})`);
  setT('panL',`translate(${CX-HALF*Math.cos(b*RAD)} ${CY-HALF*Math.sin(b*RAD)})`);
  setT('panR',`translate(${CX+HALF*Math.cos(b*RAD)} ${CY+HALF*Math.sin(b*RAD)})`);
  const fr=eseg(t,2.0,2.6)*(1-eseg(t,6.8,7.4));
  const w=eseg(t,2.4,3.0)*(1-eseg(t,6.6,7.2));
  const fx=240,fy=322;
  const bob=4*Math.sin(2*Math.PI*t/2)*w;
  const hR=mx([fx+8,fy+12],[fx+34,fy-118+bob],w);
  const h=pose('f',{x:fx,y:fy,face:1,front:fr,aL:[lerp(6,20,fr),6],hR,smile:lerp(.2,1,fr)});
  setT('th',`translate(${h.hR[0]} ${h.hR[1]})`);
  setO('th',w>.25?1:0);
}
return {P:'s14-',loop:LOOP,fn:scene};})());
const slides=[...document.querySelectorAll('.slide')];
const counter=document.getElementById('count');
const turb=document.getElementById('turb');
let cur=0,T=0,last=0,paused=false,seed=0;
const aOf=i=>{const v=slides[i].dataset.anim;return v===undefined?-1:+v;};
function setP(v){
  paused=v;
  document.getElementById('ic-pause').setAttribute('display',v?'none':'inline');
  document.getElementById('ic-play').setAttribute('display',v?'inline':'none');
}
function go(n){
  n=clamp(n,0,slides.length-1);
  slides[cur].classList.remove('on');
  cur=n;slides[cur].classList.add('on');
  T=0;
  const a=aOf(cur);
  if(a>=0){P=scenes[a].P;scenes[a].fn(0);}
  counter.textContent=(cur+1)+' / '+slides.length;
  try{history.replaceState(null,'','#'+(cur+1));}catch(e){}
}
function fullscreen(){
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }catch(e){}
}
document.getElementById('prev').addEventListener('click',()=>go(cur-1));
document.getElementById('next').addEventListener('click',()=>go(cur+1));
document.getElementById('pp').addEventListener('click',e=>{setP(!paused);e.currentTarget.blur();});
document.getElementById('fs').addEventListener('click',e=>{fullscreen();e.currentTarget.blur();});
addEventListener('keydown',e=>{
  const k=e.key;
  if(k==='ArrowRight'||k==='PageDown'||k==='Enter'||k==='ArrowDown'){e.preventDefault();go(cur+1);}
  else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'||k==='ArrowUp'){e.preventDefault();go(cur-1);}
  else if(k==='Home'){go(0);}
  else if(k==='End'){go(slides.length-1);}
  else if(k===' '&&!(e.target&&e.target.tagName==='BUTTON')){e.preventDefault();setP(!paused);}
  else if(k==='f'||k==='F'){fullscreen();}
});
let tx=null;
addEventListener('touchstart',e=>{tx=e.changedTouches[0].clientX;},{passive:true});
addEventListener('touchend',e=>{
  if(tx===null)return;
  const d=e.changedTouches[0].clientX-tx;tx=null;
  if(Math.abs(d)>50)go(d<0?cur+1:cur-1);
},{passive:true});
setP(!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches));
const h0=parseInt(location.hash.slice(1),10);
go(isNaN(h0)?0:h0-1);
function frame(now){
  if(!last)last=now;
  const dt=Math.min(.05,(now-last)/1000);last=now;
  const a=aOf(cur);
  if(!paused&&a>=0){
    T=(T+dt)%scenes[a].loop;
    P=scenes[a].P;scenes[a].fn(T);
    const s=1+Math.floor(T*8)%3;
    if(s!==seed){seed=s;turb.setAttribute('seed',s);}
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
