'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const routes = [
  { start:4, end:78, tilt:-18, turn:14, spin:1 },
  { start:88, end:16, tilt:16, turn:-20, spin:-1 },
  { start:28, end:84, tilt:-9, turn:21, spin:1 },
  { start:74, end:8, tilt:20, turn:-14, spin:-1 },
  { start:12, end:66, tilt:-15, turn:11, spin:-1 },
  { start:92, end:30, tilt:12, turn:-24, spin:1 },
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
      initial={{left:`${route.start}vw`,top:'116vh',rotate:route.tilt,opacity:0,scale:.84}}
      animate={{
        left:`${route.end}vw`,
        top:'-36vh',
        rotate:route.turn,
        opacity:[0,.18,.62,.62,.18,0],
        scale:[.84,.9,.98,.98,.92,.86],
      }}
      transition={{
        left:{duration:9.5,ease:[.45,0,.55,1]},
        top:{duration:9.5,ease:[.45,0,.55,1]},
        rotate:{duration:9.5,ease:[.45,0,.55,1]},
        opacity:{duration:9.5,times:[0,.1,.24,.76,.9,1],ease:'easeInOut'},
        scale:{duration:9.5,times:[0,.14,.3,.7,.86,1],ease:'easeInOut'},
      }}
    >
      <motion.img
        src="/ducky-astro.svg"
        alt=""
        initial={{rotate:route.spin*-8,y:0}}
        animate={{rotate:route.spin*82,y:[0,-7,5,0]}}
        transition={{
          rotate:{duration:9.5,ease:[.45,0,.55,1]},
          y:{duration:4.2,repeat:Infinity,ease:'easeInOut'},
        }}
        draggable={false}
      />
    </motion.div>
  </div>;
}
