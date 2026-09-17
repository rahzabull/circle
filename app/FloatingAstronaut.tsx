'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

type FlightPhase='vertical'|'waiting'|'horizontal'|'done';

export default function FloatingAstronaut(){
  const reduceMotion=useReducedMotion();
  const [phase,setPhase]=useState<FlightPhase>('vertical');
  const [horizontalDirection,setHorizontalDirection]=useState<1|-1>(1);

  useEffect(()=>{
    if(reduceMotion)return;
    const finishFirst=window.setTimeout(()=>setPhase('waiting'),7_600);
    const startSecond=window.setTimeout(()=>{
      setHorizontalDirection(Math.random()<.5?1:-1);
      setPhase('horizontal');
    },17_600);
    const finishSecond=window.setTimeout(()=>setPhase('done'),25_000);
    return()=>{
      window.clearTimeout(finishFirst);
      window.clearTimeout(startSecond);
      window.clearTimeout(finishSecond);
    };
  },[reduceMotion]);

  if(reduceMotion||phase==='waiting'||phase==='done')return null;
  const horizontal=phase==='horizontal';
  const duration=horizontal?7.2:7.4;
  const movingRight=horizontalDirection===1;
  const startLeft=horizontal?(movingRight?'-28vw':'112vw'):'20vw';
  const endLeft=horizontal?(movingRight?'112vw':'-28vw'):'68vw';
  const startTop=horizontal?'66vh':'114vh';
  const endTop=horizontal?'24vh':'-34vh';
  const startTurn=horizontal?(movingRight?-14:14):-18;
  const endTurn=horizontal?(movingRight?20:-20):18;
  const spin=horizontalDirection;

  return <div className="astronaut-flight" aria-hidden="true">
    <motion.div
      className="astronaut-route"
      key={phase}
      initial={{left:startLeft,top:startTop,rotate:startTurn,opacity:0,scale:.84}}
      animate={{
        left:endLeft,
        top:endTop,
        rotate:endTurn,
        opacity:[0,.2,.62,.62,.2,0],
        scale:[.84,.9,.98,.98,.92,.86],
      }}
      transition={{
        left:{duration,ease:[.45,0,.55,1]},
        top:{duration,ease:[.45,0,.55,1]},
        rotate:{duration,ease:[.45,0,.55,1]},
        opacity:{duration,times:[0,.1,.24,.76,.9,1],ease:'easeInOut'},
        scale:{duration,times:[0,.14,.3,.7,.86,1],ease:'easeInOut'},
      }}
    >
      <motion.img
        src="/ducky-astro.svg"
        alt=""
        initial={{rotate:spin*-7,y:0}}
        animate={{rotate:spin*(horizontal?76:48),y:[0,-7,5,0]}}
        transition={{
          rotate:{duration,ease:[.45,0,.55,1]},
          y:{duration:Math.min(4.2,duration),repeat:Infinity,ease:'easeInOut'},
        }}
        draggable={false}
      />
    </motion.div>
  </div>;
}
