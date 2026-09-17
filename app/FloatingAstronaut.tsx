'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const routes = [
  { start:4, middle:34, end:78, tilt:-18, turn:14 },
  { start:88, middle:64, end:16, tilt:16, turn:-20 },
  { start:28, middle:57, end:84, tilt:-9, turn:21 },
  { start:74, middle:38, end:8, tilt:20, turn:-14 },
  { start:12, middle:48, end:66, tilt:-15, turn:11 },
  { start:92, middle:54, end:30, tilt:12, turn:-24 },
] as const;

export default function FloatingAstronaut(){
  const reduceMotion=useReducedMotion();
  const [routeIndex,setRouteIndex]=useState(0);

  useEffect(()=>{
    if(reduceMotion)return;
    const timer=window.setInterval(()=>setRouteIndex(current=>(current+1)%routes.length),10_000);
    return()=>window.clearInterval(timer);
  },[reduceMotion]);

  if(reduceMotion)return null;
  const route=routes[routeIndex];

  return <div className="astronaut-flight" aria-hidden="true">
    <motion.div
      className="astronaut-route"
      key={routeIndex}
      initial={{left:`${route.start}vw`,top:'112vh',rotate:route.tilt,opacity:0,scale:.82}}
      animate={{
        left:[`${route.start}vw`,`${route.middle}vw`,`${route.middle+4}vw`,`${route.end}vw`],
        top:['112vh','72vh','27vh','-34vh'],
        rotate:[route.tilt,route.tilt+5,route.turn-4,route.turn],
        opacity:[0,.62,.62,0],
        scale:[.82,.94,1,.88],
      }}
      transition={{duration:8.8,times:[0,.28,.68,1],ease:[.42,0,.24,1]}}
    >
      <motion.img
        src="/ducky-astro.svg"
        alt=""
        animate={{y:[-5,6,-5],rotate:[-2,2,-2]}}
        transition={{duration:3.2,repeat:Infinity,ease:'easeInOut'}}
        draggable={false}
      />
    </motion.div>
  </div>;
}
