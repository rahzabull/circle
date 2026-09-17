'use client';

import { useEffect, useRef } from 'react';

type Star = {
  x:number;
  y:number;
  radius:number;
  alpha:number;
  twinkleDepth:number;
  twinkleSpeed:number;
  phase:number;
  vx:number;
  vy:number;
  color:string;
  depth:number;
  shimmer:boolean;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

function seededRandom(seed:number){
  let value=seed>>>0;
  return ()=>{
    value+=0x6d2b79f5;
    let next=value;
    next=Math.imul(next^(next>>>15),next|1);
    next^=next+Math.imul(next^(next>>>7),next|61);
    return ((next^(next>>>14))>>>0)/4294967296;
  };
}

function GalaxyBackground(){
  const canvasRef=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas=canvasRef.current;const host=canvas?.parentElement;if(!canvas||!host)return;
    const context=canvas.getContext('2d',{alpha:true});if(!context)return;
    const haze=document.createElement('canvas');const hazeContext=haze.getContext('2d');if(!hazeContext)return;
    const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
    const device=navigator as Navigator&{deviceMemory?:number};
    const lowPower=(navigator.hardwareConcurrency||8)<=4||(device.deviceMemory||8)<=4;
    let width=1;let height=1;let pixelRatio=1;let stars:Star[]=[];let frame=0;let lastTime=0;let elapsed=0;let reducedMotion=motionQuery.matches;
    const pointer={x:0,y:0,targetX:0,targetY:0};

    const buildHaze=()=>{
      const scale=.32;haze.width=Math.max(1,Math.ceil(width*scale));haze.height=Math.max(1,Math.ceil(height*scale));
      const hazeWidth=haze.width;const hazeHeight=haze.height;hazeContext.clearRect(0,0,hazeWidth,hazeHeight);
      const blue=hazeContext.createRadialGradient(hazeWidth*.07,hazeHeight*.3,0,hazeWidth*.07,hazeHeight*.3,hazeWidth*.48);
      blue.addColorStop(0,'rgba(42,65,116,.22)');blue.addColorStop(.42,'rgba(28,45,88,.1)');blue.addColorStop(1,'rgba(10,15,28,0)');hazeContext.fillStyle=blue;hazeContext.fillRect(0,0,hazeWidth,hazeHeight);
      const violet=hazeContext.createRadialGradient(hazeWidth*.93,hazeHeight*.78,0,hazeWidth*.93,hazeHeight*.78,hazeWidth*.43);
      violet.addColorStop(0,'rgba(73,52,105,.15)');violet.addColorStop(.48,'rgba(42,35,75,.075)');violet.addColorStop(1,'rgba(15,12,26,0)');hazeContext.fillStyle=violet;hazeContext.fillRect(0,0,hazeWidth,hazeHeight);
      const warm=hazeContext.createRadialGradient(hazeWidth*.84,hazeHeight*.12,0,hazeWidth*.84,hazeHeight*.12,hazeWidth*.22);
      warm.addColorStop(0,'rgba(114,82,48,.09)');warm.addColorStop(1,'rgba(25,18,12,0)');hazeContext.fillStyle=warm;hazeContext.fillRect(0,0,hazeWidth,hazeHeight);
    };

    const buildStars=()=>{
      const random=seededRandom(0x51a7cafe^Math.round(width)^Math.round(height));const area=width*height;const power=lowPower ? .85 : 1;
      const count=(density:number,minimum:number,maximum:number)=>Math.round(clamp(area/density,minimum,maximum)*power);
      const layers=[
        {count:count(3600,145,500),radius:[.24,.58],alpha:[.22,.58],twinkle:[.1,.28],speed:[.00012,.0003],drift:5e-8,depth:.22,shimmer:.006},
        {count:count(22000,26,88),radius:[.42,.92],alpha:[.36,.72],twinkle:[.16,.38],speed:[.00016,.00044],drift:9e-8,depth:.55,shimmer:.045},
        {count:count(80000,7,24),radius:[.72,1.3],alpha:[.55,.88],twinkle:[.18,.4],speed:[.00012,.00036],drift:1.5e-7,depth:1,shimmer:.18},
      ] as const;
      const colors=['#f5f5ec','#dce8ff','#b9d1ff','#ffe7bd'];const next:Star[]=[];
      layers.forEach((layer,layerIndex)=>{
        for(let index=0;index<layer.count;index++){
          const x=random();const y=random();const centerDistance=Math.hypot((x-.5)/.34,(y-.5)/.3);const centerCalm=clamp(1-centerDistance,0,1);const centerReduction=layerIndex===0?.28:layerIndex===1?.48:.62;
          const direction=random()*Math.PI*2;const velocity=layer.drift*(.35+random()*.65);
          next.push({
            x,y,
            radius:layer.radius[0]+random()*(layer.radius[1]-layer.radius[0]),
            alpha:(layer.alpha[0]+random()*(layer.alpha[1]-layer.alpha[0]))*(1-centerCalm*centerReduction),
            twinkleDepth:layer.twinkle[0]+random()*(layer.twinkle[1]-layer.twinkle[0]),
            twinkleSpeed:layer.speed[0]+random()*(layer.speed[1]-layer.speed[0]),
            phase:random()*Math.PI*2,
            vx:Math.cos(direction)*velocity,
            vy:Math.sin(direction)*velocity*.58,
            color:colors[Math.floor(random()*colors.length)],
            depth:layer.depth,
            shimmer:random()<layer.shimmer,
          });
        }
      });
      stars=next;
    };

    const draw=(time:number,delta:number)=>{
      if(delta>0){
        stars.forEach(star=>{star.x=(star.x+star.vx*delta+1)%1;star.y=(star.y+star.vy*delta+1)%1;});
        elapsed+=delta;
      }
      pointer.x+=(pointer.targetX-pointer.x)*.018;pointer.y+=(pointer.targetY-pointer.y)*.018;
      context.clearRect(0,0,width,height);
      const hazeX=Math.sin(elapsed*.0000041)*1.6;const hazeY=Math.cos(elapsed*.0000034)*1.2;
      context.globalAlpha=.9;context.drawImage(haze,-3+hazeX,-3+hazeY,width+6,height+6);context.globalAlpha=1;
      stars.forEach(star=>{
        const wave=.5+.5*Math.sin(time*star.twinkleSpeed+star.phase);const shimmer=star.shimmer?Math.pow(Math.max(0,Math.sin(time*star.twinkleSpeed*.29+star.phase*1.73)),18)*.22:0;
        const alpha=Math.min(.94,star.alpha*(1-star.twinkleDepth+wave*star.twinkleDepth)+shimmer);
        const x=star.x*width+pointer.x*star.depth;const y=star.y*height+pointer.y*star.depth;
        if(star.depth>.5&&star.radius>.7){context.globalAlpha=alpha*.16;context.fillStyle=star.color;context.beginPath();context.arc(x,y,star.radius*3.3,0,Math.PI*2);context.fill();}
        context.globalAlpha=alpha;context.fillStyle=star.color;context.beginPath();context.arc(x,y,star.radius,0,Math.PI*2);context.fill();
      });
      context.globalAlpha=1;
    };

    const resize=()=>{
      const bounds=host.getBoundingClientRect();width=Math.max(1,Math.round(bounds.width));height=Math.max(1,Math.round(bounds.height));pixelRatio=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(5_000_000/(width*height)));
      canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);context.setTransform(pixelRatio,0,0,pixelRatio,0,0);buildHaze();buildStars();draw(performance.now(),0);
    };

    const tick=(time:number)=>{const delta=Math.min(time-lastTime,40);lastTime=time;draw(time,delta);frame=window.requestAnimationFrame(tick);};
    const stop=()=>{if(frame){window.cancelAnimationFrame(frame);frame=0;}};
    const start=()=>{stop();if(document.hidden||reducedMotion){draw(performance.now(),0);return;}lastTime=performance.now();frame=window.requestAnimationFrame(tick);};
    const visibility=()=>{if(document.hidden)stop();else start();};
    const motionChange=(event:MediaQueryListEvent)=>{reducedMotion=event.matches;start();};
    const pointerMove=(event:PointerEvent)=>{if(event.pointerType==='touch')return;pointer.targetX=(event.clientX/window.innerWidth-.5)*4;pointer.targetY=(event.clientY/window.innerHeight-.5)*3;};
    const pointerLeave=()=>{pointer.targetX=0;pointer.targetY=0;};
    const observer=new ResizeObserver(resize);observer.observe(host);motionQuery.addEventListener('change',motionChange);document.addEventListener('visibilitychange',visibility);window.addEventListener('pointermove',pointerMove,{passive:true});window.addEventListener('pointerleave',pointerLeave);resize();start();
    return()=>{stop();observer.disconnect();motionQuery.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerleave',pointerLeave);};
  },[]);

  return <div className="galaxy-background" aria-hidden="true"><canvas ref={canvasRef}/></div>;
}

export default GalaxyBackground;
