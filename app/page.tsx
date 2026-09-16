'use client';

import type { CSSProperties, ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, motionValue, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import type { MotionStyle, MotionValue } from 'framer-motion';
import { Bell, Camera, Check, ChevronRight, Heart, ImagePlus, LocateFixed, LockKeyhole, MessageCircleQuestion, Mic, Pencil, Play, Plus, Send, SmilePlus, Trash2, Undo2, Upload, Users, X } from 'lucide-react';

type Friend = {
  name: string; color: string; x: number; y: number; size: number; image: string;
  time: string; caption: string; photo: string;
  lastActiveAt:number; lastPostedAt:number;
};

type ActivityState = 'active'|'recentlyActive'|'quiet'|'inactive';
type ActivityOverride = { lastActiveAt:number; lastPostedAt:number };
type KnockResponse = { image?:string; status?:string; sentAt:number };
type Knock = { id:string; from:string; to:string; createdAt:number; status:'waiting'|'sent'|'responded'; response?:KnockResponse };
type AskResponse = { id:string; responder:string; image:string; sentAt:string };
type AskPrompt = { id:string; sender:string; text:string; recipients:string[]; audienceLabel:string; createdAt:number; responses:AskResponse[] };
type AskAudience = 'everyone'|'group'|'friends';
type ReactionKind = 'meme'|'voice'|'doodle'|'selfie';
type Reaction = { id:string; type:ReactionKind; label:string; emoji?:string; image?:string; duration?:string };
type SocialNotification = { id:string; friend:Friend; text:string; mark:string; time:string; action:'knock'|'knock-response'|'reaction'|'ask'|'ask-response'; askId?:string; knockId?:string };

const HOUR=60*60*1000;const DAY=24*HOUR;const prototypeNow=Date.now();
const ACTIVITY_THRESHOLDS={active:HOUR,recentlyActive:DAY,quiet:4*DAY,knockCooldown:DAY} as const;
const getActivityState=(friend:Friend,override?:ActivityOverride):ActivityState=>{const latest=Math.max(override?.lastActiveAt??friend.lastActiveAt,override?.lastPostedAt??friend.lastPostedAt);const age=Date.now()-latest;if(age<=ACTIVITY_THRESHOLDS.active)return'active';if(age<=ACTIVITY_THRESHOLDS.recentlyActive)return'recentlyActive';if(age<=ACTIVITY_THRESHOLDS.quiet)return'quiet';return'inactive';};
const canReceiveKnock=(state:ActivityState)=>state==='quiet'||state==='inactive';

const friends: Friend[] = [
  { name:'Maya', color:'#e7b6a3', x:-115, y:-66, size:130, image:'https://i.pravatar.cc/240?img=47', time:'18 min ago', caption:'We missed the sunset but found this tiny blue hour instead.', photo:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-20*60*1000,lastPostedAt:prototypeNow-18*60*1000 },
  { name:'Noah', color:'#a8c5bb', x:0, y:-109, size:82, image:'https://i.pravatar.cc/240?img=12', time:'Yesterday', caption:'Found a table for eight. You know what that means.', photo:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-6*HOUR,lastPostedAt:prototypeNow-20*HOUR },
  { name:'Ari', color:'#d8c4a0', x:71, y:-189, size:108, image:'https://i.pravatar.cc/240?img=49', time:'3 days ago', caption:'A very serious morning meeting.', photo:'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-54*HOUR,lastPostedAt:prototypeNow-60*HOUR },
  { name:'Sam', color:'#b6b8cc', x:-192, y:19, size:76, image:'https://i.pravatar.cc/240?img=5', time:'8 days ago', caption:'No plans. Perfect day.', photo:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-8*DAY,lastPostedAt:prototypeNow-9*DAY },
  { name:'Vina', color:'#edc3c7', x:111, y:-67, size:124, image:'https://i.pravatar.cc/240?img=32', time:'6 min ago', caption:'Proof we actually left the group chat.', photo:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-12*60*1000,lastPostedAt:prototypeNow-6*60*1000 },
  { name:'Leo', color:'#aabbd1', x:-101, y:63, size:102, image:'https://i.pravatar.cc/240?img=11', time:'4 hours ago', caption:'Borrowed the good camera. Refusing to return it.', photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-12*HOUR,lastPostedAt:prototypeNow-4*HOUR },
  { name:'Inez', color:'#d3b2c3', x:9, y:134, size:132, image:'https://i.pravatar.cc/240?img=44', time:'Saturday', caption:'Tiny dinner, enormous opinions.', photo:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-35*60*1000,lastPostedAt:prototypeNow-2*DAY },
  { name:'Omar', color:'#a8c9a2', x:96, y:49, size:80, image:'https://i.pravatar.cc/240?img=8', time:'3 days ago', caption:'Took the long way home.', photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-3*DAY,lastPostedAt:prototypeNow-4*DAY },
  { name:'June', color:'#d7c68d', x:123, y:133, size:72, image:'https://i.pravatar.cc/240?img=45', time:'6 days ago', caption:'Soft launch of my new personality: outdoorsy.', photo:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-6*DAY,lastPostedAt:prototypeNow-7*DAY },
];

const memes = [
  { label:'WTF', emoji:'😳', tone:'#f3c7bd' }, { label:'Crying', emoji:'😭', tone:'#bcd8e8' },
  { label:'Proud', emoji:'🥹', tone:'#dce7a2' }, { label:'Suspicious', emoji:'🤨', tone:'#dfcfed' },
  { label:'Dead', emoji:'💀', tone:'#ced0cc' }, { label:'Bro…', emoji:'🫠', tone:'#f3d5aa' },
  { label:'Absolute cinema', emoji:'🎬', tone:'#e7b9cf' }, { label:'LMAO', emoji:'😂', tone:'#f4dc72' },
];

const askGroups=[
  {id:'inner',name:'Inner circle',members:['Maya','Noah','Vina','Leo','Inez']},
  {id:'weekend',name:'Weekend crew',members:['Ari','Sam','Omar','June']},
];
const initialAsks:AskPrompt[]=[
  {id:'ask-you-view',sender:'You',text:'Show me your view right now?',recipients:friends.map(friend=>friend.name),audienceLabel:'Everyone',createdAt:Date.now()-1800000,responses:[
    {id:'response-maya',responder:'Maya',image:friends[0].photo,sentAt:'12m'},{id:'response-noah',responder:'Noah',image:friends[1].photo,sentAt:'8m'},{id:'response-inez',responder:'Inez',image:friends[6].photo,sentAt:'2m'},
  ]},
  {id:'ask-vina-desk',sender:'Vina',text:'Desk photo, right now?',recipients:['You','Maya','Noah','Leo'],audienceLabel:'Inner circle',createdAt:Date.now()-420000,responses:[]},
  {id:'ask-leo-snack',sender:'Leo',text:'What are you snacking on?',recipients:['You','Ari','Sam','Inez'],audienceLabel:'4 friends',createdAt:Date.now()-720000,responses:[]},
];
const initialKnocks:Knock[]=[{id:'knock-maya-you',from:'Maya',to:'You',createdAt:Date.now()-120000,status:'waiting'}];
const initialNotifications:SocialNotification[]=[
  {id:'n-knock',friend:friends[0],text:'knocked — “Show us you’re alive.”',mark:'👊',time:'2m',action:'knock',knockId:'knock-maya-you'},
  {id:'n-ask-response',friend:friends[6],text:'answered your Ask',mark:'📷',time:'2m',action:'ask-response',askId:'ask-you-view'},
  {id:'n-ask',friend:friends[4],text:'asked “Desk photo, right now?”',mark:'↗',time:'7m',action:'ask',askId:'ask-vina-desk'},
  {id:'n-meme',friend:friends[1],text:'reacted with a meme',mark:'😂',time:'5m',action:'reaction'},
  {id:'n-voice',friend:friends[0],text:'sent you a voice reaction',mark:'🎤',time:'12m',action:'reaction'},
  {id:'n-selfie',friend:friends[5],text:'reacted with his face',mark:'🤳',time:'31m',action:'reaction'},
];

type BubbleOffset = { x:MotionValue<number>; y:MotionValue<number> };

function AskChip({ask,placement='right',onOpen}:{ask:AskPrompt;placement?:'left'|'right'|'above';onOpen:()=>void}){
  const [expanded,setExpanded]=useState(false);const popoverId=`ask-popover-${ask.id}`;const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(!expanded)return;const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setExpanded(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setExpanded(false);window.requestAnimationFrame(()=>trigger.current?.focus());}};document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape);};},[expanded]);
  return <motion.div ref={root} className={`ask-prompt ask-${placement}${expanded?' is-open':''}`} onPointerDown={event=>event.stopPropagation()} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setExpanded(false);}} initial={{opacity:0,scale:.72,y:5}} animate={{opacity:1,scale:1,y:0}}>
    <motion.button ref={trigger} className="ask-prompt-icon" onClick={event=>{event.stopPropagation();setExpanded(value=>!value);}} whileHover={{scale:1.08,y:-1}} whileTap={{scale:.94}} aria-label={`Open ${ask.sender}'s Ask`} aria-expanded={expanded} aria-controls={popoverId}/>
    <AnimatePresence>{expanded&&<motion.div id={popoverId} className="ask-prompt-popover" initial={{opacity:0,scale:.9,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.94,y:3}} transition={{duration:.16,ease:'easeOut'}}>
      <small>{ask.sender.toUpperCase()} ASKS</small><span>{ask.text}</span><button onClick={event=>{event.stopPropagation();setExpanded(false);onOpen();}}>Reply with a photo <ChevronRight size={11}/></button>
    </motion.div>}</AnimatePresence>
  </motion.div>;
}

function KnockNudge({friend,activity,onSend,onDismiss,onImpact}:{friend:Friend;activity:ActivityState;onSend:()=>void;onDismiss:()=>void;onImpact:(active:boolean)=>void}){
  const [stage,setStage]=useState<'suggested'|'confirm'|'sending'|'sent'>('suggested');const placement=friend.x>0?'right':'left';const timers=useRef<number[]>([]);const reduceMotion=useReducedMotion();
  useEffect(()=>()=>{timers.current.forEach(timer=>window.clearTimeout(timer));onImpact(false);},[onImpact]);
  const send=()=>{setStage('sending');onImpact(true);onSend();timers.current.push(window.setTimeout(()=>{onImpact(false);setStage('sent');},850),window.setTimeout(onDismiss,3000));};
  return <motion.div className={`knock-nudge knock-${placement} is-${stage}`} onPointerDown={event=>event.stopPropagation()} initial={{opacity:0,scale:.78,y:5}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.85,y:4}} role="status" aria-live="polite">
    {stage==='suggested'&&<><motion.button className="knock-fist" onClick={()=>setStage('confirm')} animate={reduceMotion?{}:{x:placement==='right'?[0,0,-4,0,0]:[0,0,4,0,0],rotate:[0,0,-10,4,0]}} transition={reduceMotion?{duration:0}:{duration:1.05,repeat:Infinity,repeatDelay:3.6}} aria-label={`Knock on ${friend.name}; ${activity}`} aria-expanded="false">👊</motion.button><span><b>{friend.name}’s been {activity}.</b><small>Go bother {friend.name==='Sam'?'him':'them'}.</small></span></>}
    {stage==='confirm'&&<><span><b>Haven’t heard from {friend.name} in a bit.</b><small>One Knock per day.</small></span><button className="knock-send" onClick={send}>Knock 👊</button></>}
    {stage==='sending'&&<><motion.span className="knock-fist knocking" animate={reduceMotion?{}:{x:placement==='right'?[0,-13,1,-11,0]:[0,13,-1,11,0],rotate:[0,-12,4,-10,0]}} transition={reduceMotion?{duration:0}:{duration:.78,ease:'easeInOut'}}>👊</motion.span><span><b>Knock, knock…</b><small>Disturbing {friend.name} gently.</small></span></>}
    {stage==='sent'&&<span className="knock-done"><b>We’ve disturbed {friend.name}. 👊</b><small>Now we wait.</small></span>}
  </motion.div>;
}

function IncomingKnockChip({knock,onRespond}:{knock:Knock;onRespond:()=>void}){
  return <motion.button className="incoming-knock-chip" onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();onRespond();}} initial={{opacity:0,scale:.72,y:6}} animate={{opacity:1,scale:1,y:0}} whileHover={{scale:1.04,y:-2}} whileTap={{scale:.97}} aria-label={`Respond to ${knock.from}'s Knock`}><span>👊</span><b>{knock.from} knocked</b><small>Respond</small></motion.button>;
}

function FloatingFriend({ friend, index, selected, offset, ask, activity, knockNudge, incomingKnock, onHover, onOpen, onAsk, onKnock, onDismissKnock, onRespondKnock }:{ friend:Friend; index:number; selected:boolean; offset:BubbleOffset; ask:AskPrompt|null; activity:ActivityState; knockNudge:boolean; incomingKnock:Knock|null; onHover:(index:number|null)=>void; onOpen:()=>void; onAsk:(ask:AskPrompt)=>void; onKnock:(friend:Friend)=>void; onDismissKnock:()=>void; onRespondKnock:(knock:Knock)=>void }) {
  const placement:'left'|'right'|'above'=friend.x>25?'right':friend.x<-25?'left':friend.y>100?'above':'left';
  const [knockImpact,setKnockImpact]=useState(false);const reduceMotion=useReducedMotion();
  return (
    <motion.div
      className={`friend activity-${activity} ${activity==='active'||activity==='recentlyActive'?'is-active':'is-inactive'}${selected ? ' is-selected' : ''}${ask?' has-ask':''}${knockNudge||incomingKnock?' has-knock':''}`}
      style={{ '--offset-x':`${friend.x}px`, '--offset-y':`${friend.y}px`, '--bubble-size':`${friend.size}px`, '--tone':friend.color, x:offset.x, y:offset.y } as MotionStyle}
      initial={{ opacity:0, scale:.82 }} animate={{ opacity:selected ? 0 : 1, scale:1 }}
      transition={{ opacity:{duration:.32,ease:'easeOut'}, scale:{delay:.035*index,type:'spring',stiffness:120,damping:20,mass:.8} }}
      onHoverStart={()=>onHover(index)} onHoverEnd={()=>onHover(null)}
    >
      <motion.button className="friend-profile" onClick={onOpen} aria-label={`Open ${friend.name}'s latest moment`} whileHover={{scale:1.055}} whileTap={{scale:.97}}><span className="friend-float"><motion.span className="portrait" layoutId={`avatar-${friend.name}`} animate={!reduceMotion&&knockImpact?{x:[0,3,-2,2,0],rotate:[0,2,-2,1,0]}:{x:0,rotate:0}} transition={{duration:reduceMotion?0:.72,type:'spring',stiffness:260,damping:13}}><img src={friend.image} alt="" /></motion.span><b>{friend.name}</b></span></motion.button>
      {ask&&<AskChip ask={ask} placement={placement} onOpen={()=>onAsk(ask)}/>}
      <AnimatePresence>{knockNudge&&<KnockNudge friend={friend} activity={activity} onSend={()=>onKnock(friend)} onDismiss={onDismissKnock} onImpact={setKnockImpact}/>}</AnimatePresence>
      {incomingKnock&&<IncomingKnockChip knock={incomingKnock} onRespond={()=>onRespondKnock(incomingKnock)}/>}
    </motion.div>
  );
}

function FriendSpace({ selected, asks, activityOverrides, nudgeFriend, incomingKnocks, onOpen, onUser, onAsk, onCreateAsk, onKnock, onDismissKnock, onRespondKnock }:{ selected:Friend|null; asks:AskPrompt[]; activityOverrides:Record<string,ActivityOverride>; nudgeFriend:string|null; incomingKnocks:Knock[]; onOpen:(friend:Friend)=>void; onUser:()=>void; onAsk:(ask:AskPrompt)=>void; onCreateAsk:()=>void; onKnock:(friend:Friend)=>void; onDismissKnock:()=>void; onRespondKnock:(knock:Knock)=>void }) {
  const worldX=useMotionValue(0); const worldY=useMotionValue(0);
  const smoothWorldX=useSpring(worldX,{stiffness:390,damping:40,mass:.92}); const smoothWorldY=useSpring(worldY,{stiffness:390,damping:40,mass:.92});
  const [isDragging,setIsDragging]=useState(false); const [hasMoved,setHasMoved]=useState(false);
  const spaceRef=useRef<HTMLElement>(null); const sceneScale=useRef(1.4);
  const drag=useRef({active:false,moved:false,pointerId:-1,startX:0,startY:0,startWorldX:0,startWorldY:0,lastX:0,lastY:0,lastTime:0,velocityX:0,velocityY:0});
  const suppressClick=useRef(false); const hovered=useRef<number|null>(null);
  const momentum=useRef<{x?:ReturnType<typeof animate>;y?:ReturnType<typeof animate>}>({});
  const bubbleOffsets=useMemo<BubbleOffset[]>(()=>friends.map(()=>({x:motionValue(0),y:motionValue(0)})),[]);

  useEffect(()=>{
    const updateScale=()=>{const value=spaceRef.current?parseFloat(getComputedStyle(spaceRef.current).getPropertyValue('--scene-scale')):1.4;sceneScale.current=Number.isFinite(value)?value:1.4;};
    updateScale();window.addEventListener('resize',updateScale);return()=>window.removeEventListener('resize',updateScale);
  },[]);

  useEffect(()=>{
    const bodies=friends.map(()=>({x:0,y:0,vx:0,vy:0})); let frame=0; let last=performance.now();
    const tick=(now:number)=>{
      const step=Math.min((now-last)/16.667,2); last=now;
      const force=friends.map(()=>({x:0,y:0}));
      friends.forEach((_,index)=>{
        const amplitude=hovered.current===index?0.8:3.5;
        const targetX=Math.sin(now*.00034+index*1.71)*amplitude;
        const targetY=Math.cos(now*.00029+index*2.03)*amplitude;
        force[index].x+=(targetX-bodies[index].x)*.018;
        force[index].y+=(targetY-bodies[index].y)*.018;
      });
      bodies.forEach((body,index)=>{
        body.vx=(body.vx+force[index].x*step)*Math.pow(.87,step);body.vy=(body.vy+force[index].y*step)*Math.pow(.87,step);
        body.x+=body.vx*step;body.y+=body.vy*step;
      });
      const scale=Math.max(sceneScale.current,.01);const playerX=-smoothWorldX.get()/scale;const playerY=-smoothWorldY.get()/scale;
      for(let pass=0;pass<5;pass++){
        for(let a=0;a<friends.length;a++)for(let b=a+1;b<friends.length;b++){
          const dx=(friends[b].x+bodies[b].x)-(friends[a].x+bodies[a].x);const dy=(friends[b].y+bodies[b].y)-(friends[a].y+bodies[a].y);
          const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=(friends[a].size+friends[b].size)/2+8;
          if(distance<minimum){const nx=rawDistance<.001?Math.cos(a+b):dx/distance;const ny=rawDistance<.001?Math.sin(a+b):dy/distance;const correction=(minimum-distance)*.505;bodies[a].x-=nx*correction;bodies[a].y-=ny*correction;bodies[b].x+=nx*correction;bodies[b].y+=ny*correction;}
        }
        bodies.forEach((body,index)=>{
          const dx=friendPositionX(index,body)-playerX;const dy=friendPositionY(index,body)-playerY;const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=(friends[index].size+110)/2+10;
          if(distance<minimum){const angle=index/friends.length*Math.PI*2;const nx=rawDistance<.001?Math.cos(angle):dx/distance;const ny=rawDistance<.001?Math.sin(angle):dy/distance;const correction=minimum-distance;body.x+=nx*correction;body.y+=ny*correction;body.vx+=nx*correction*.025;body.vy+=ny*correction*.025;}
        });
      }
      bodies.forEach((body,index)=>{
        bubbleOffsets[index].x.set(body.x); bubbleOffsets[index].y.set(body.y);
      });
      frame=requestAnimationFrame(tick);
    };
    const friendPositionX=(index:number,body:{x:number})=>friends[index].x+body.x;
    const friendPositionY=(index:number,body:{y:number})=>friends[index].y+body.y;
    frame=requestAnimationFrame(tick); return()=>cancelAnimationFrame(frame);
  },[bubbleOffsets,smoothWorldX,smoothWorldY]);

  const pointerDown=(event:ReactPointerEvent<HTMLElement>)=>{
    if(event.button!==0||selected||(event.target as HTMLElement).closest('.you,.reset-world'))return;
    momentum.current.x?.stop(); momentum.current.y?.stop();
    worldX.set(smoothWorldX.get());worldY.set(smoothWorldY.get());
    drag.current={active:true,moved:false,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startWorldX:worldX.get(),startWorldY:worldY.get(),lastX:event.clientX,lastY:event.clientY,lastTime:event.timeStamp,velocityX:0,velocityY:0};
  };
  const pointerMove=(event:ReactPointerEvent<HTMLElement>)=>{
    const state=drag.current;if(!state.active||state.pointerId!==event.pointerId)return;
    const dx=event.clientX-state.startX;const dy=event.clientY-state.startY;
    if(!state.moved&&Math.hypot(dx,dy)<7)return;
    if(!state.moved){state.moved=true;suppressClick.current=true;setIsDragging(true);setHasMoved(true);event.currentTarget.setPointerCapture(event.pointerId);}
    const elapsed=Math.max(event.timeStamp-state.lastTime,8);
    state.velocityX=-(event.clientX-state.lastX)/elapsed*1000;state.velocityY=-(event.clientY-state.lastY)/elapsed*1000;
    state.lastX=event.clientX;state.lastY=event.clientY;state.lastTime=event.timeStamp;
    worldX.set(state.startWorldX-dx);worldY.set(state.startWorldY-dy);
  };
  const pointerEnd=(event:ReactPointerEvent<HTMLElement>)=>{
    const state=drag.current;if(!state.active||state.pointerId!==event.pointerId)return;
    state.active=false;
    if(state.moved){
      setIsDragging(false);
      momentum.current.x=animate(worldX,worldX.get(),{type:'inertia',velocity:state.velocityX,power:.22,timeConstant:620,restDelta:.4});
      momentum.current.y=animate(worldY,worldY.get(),{type:'inertia',velocity:state.velocityY,power:.22,timeConstant:620,restDelta:.4});
      window.setTimeout(()=>{suppressClick.current=false;},0);
    }
  };
  const resetWorld=()=>{
    momentum.current.x?.stop();momentum.current.y?.stop();
    const transition={type:'spring' as const,stiffness:72,damping:19,mass:1.15,restDelta:.25};
    momentum.current.x=animate(worldX,0,transition);momentum.current.y=animate(worldY,0,transition);
    setHasMoved(false);
  };
  return (
    <section ref={spaceRef} className={`social-space orbital-field${selected ? ' is-muted' : ''}${isDragging?' is-dragging':''}`} aria-label="Your close friends" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();}}}>
      <motion.div className="world-layer" style={{x:smoothWorldX,y:smoothWorldY}}>
        <div className="world-stage">
          {friends.map((friend,index)=><FloatingFriend friend={friend} index={index} selected={selected?.name===friend.name} offset={bubbleOffsets[index]} ask={asks.find(ask=>ask.sender===friend.name&&ask.recipients.includes('You'))||null} activity={getActivityState(friend,activityOverrides[friend.name])} knockNudge={nudgeFriend===friend.name} incomingKnock={incomingKnocks.find(knock=>knock.from===friend.name)||null} onHover={value=>{hovered.current=value;}} onOpen={()=>onOpen(friend)} onAsk={onAsk} onKnock={onKnock} onDismissKnock={onDismissKnock} onRespondKnock={onRespondKnock} key={friend.name} />)}
        </div>
      </motion.div>
      <div className="player-layer"><div className="player-anchor"><motion.button className="you" aria-label="Create a post" onClick={onUser} whileHover={{scale:1.045}} whileTap={{scale:.97}}><img src="https://i.pravatar.cc/240?img=68" alt=""/></motion.button></div></div>
      <div className="reset-anchor"><AnimatePresence mode="wait" initial={false}>{hasMoved?<motion.button key="reset" className="reset-world" aria-label="Return to center" title="Return to center" onPointerDown={event=>event.stopPropagation()} onClick={resetWorld} initial={{opacity:0,y:6,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:.9,transition:{duration:.12,ease:'easeOut'}}} transition={{duration:.16,ease:'easeOut'}} whileHover={{scale:1.06}} whileTap={{scale:.94}}><LocateFixed size={17}/></motion.button>:<motion.button key="ask" className="ask-create-trigger" aria-label="Create an Ask" title="Create an Ask" onPointerDown={event=>event.stopPropagation()} onClick={onCreateAsk} initial={{opacity:0,y:6,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:.9,transition:{duration:.12,ease:'easeOut'}}} transition={{duration:.16,ease:'easeOut'}} whileHover={{scale:1.06}} whileTap={{scale:.94}}/>}</AnimatePresence></div>
    </section>
  );
}

function PrivacyIndicator() {
  const [open,setOpen]=useState(false);
  return <div className="privacy-wrap">
    <button className="privacy" onClick={()=>setOpen(v=>!v)} aria-expanded={open}><Users size={15}/><span>Visible to 8 friends</span></button>
    <AnimatePresence>{open && <motion.div className="privacy-pop" initial={{opacity:0,y:8,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:5,scale:.97}}>
      <div><LockKeyhole size={16}/><span><b>Your circle only</b><small>No sharing outside this group.</small></span></div>
      <div className="privacy-faces">{friends.slice(0,8).map(friend=><img src={friend.image} alt={friend.name} title={friend.name} key={friend.name}/>)}</div>
    </motion.div>}</AnimatePresence>
  </div>;
}

function MemePicker({ onPick, onClose }:{onPick:(meme:typeof memes[number])=>void;onClose:()=>void}) {
  return <motion.div className="meme-picker" initial={{opacity:0,y:14,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.96}}>
    <div className="picker-head"><span><b>Drop a feeling</b><small>Say it without saying it.</small></span><button onClick={onClose} aria-label="Close meme picker"><X size={17}/></button></div>
    <div className="meme-grid">{memes.map(meme=><button style={{'--meme-tone':meme.tone} as CSSProperties} onClick={()=>onPick(meme)} key={meme.label}><span>{meme.emoji}</span><b>{meme.label}</b></button>)}</div>
  </motion.div>;
}

function ReactionObject({reaction,index}:{reaction:Reaction;index:number}){
  const [expanded,setExpanded]=useState(false);const [playing,setPlaying]=useState(false);
  return <motion.button className={`reaction-object reaction-${reaction.type} reaction-pos-${index%5}${expanded?' expanded':''}${playing?' playing':''}`} initial={{opacity:0,scale:.45,y:-18}} animate={{opacity:1,scale:expanded?1.45:1,y:0}} transition={{type:'spring',stiffness:260,damping:17}} onClick={()=>{setExpanded(v=>!v);if(reaction.type==='voice')setPlaying(v=>!v);}}>
    {reaction.type==='meme'&&<><span>{reaction.emoji}</span><b>{reaction.label}</b></>}
    {reaction.type==='voice'&&<><Play size={10} fill="currentColor"/><i className="mini-wave"><em/><em/><em/><em/></i><b>{reaction.duration}</b></>}
    {reaction.type==='selfie'&&<img src={reaction.image} alt="Your selfie reaction"/>}
    {reaction.type==='doodle'&&<img src={reaction.image} alt="Your doodle reaction"/>}
  </motion.button>;
}

function VoiceReaction({onSend,onClose}:{onSend:()=>void;onClose:()=>void}){
  const [ready,setReady]=useState(false);
  return <motion.div className="reaction-tool voice-tool" initial={{opacity:0,y:10,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:7,scale:.96}}>
    <button className="tool-close" onClick={onClose} aria-label="Close voice reaction"><X size={14}/></button><small>VOICE REACTION</small>
    {!ready?<button className="hold-voice" onPointerDown={()=>setReady(true)}><span><Mic size={23}/></span><b>Hold to react</b><small>Release creates a private 0:04 clip</small></button>:<><div className="voice-preview"><button aria-label="Play voice reaction"><Play size={13} fill="currentColor"/></button><i className="mini-wave"><em/><em/><em/><em/><em/><em/></i><b>0:04</b></div><button className="tool-send" onClick={onSend}><Send size={14}/> Send</button></>}
  </motion.div>;
}

function DoodlePad({onSend,onClose}:{onSend:(image:string)=>void;onClose:()=>void}){
  const canvas=useRef<HTMLCanvasElement>(null);const drawing=useRef(false);const history=useRef<string[]>([]);
  useEffect(()=>{const element=canvas.current;if(!element)return;const context=element.getContext('2d');if(!context)return;context.lineCap='round';context.lineJoin='round';context.lineWidth=4;context.strokeStyle='#ff5964';},[]);
  const point=(event:ReactPointerEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-rect.left)*event.currentTarget.width/rect.width,y:(event.clientY-rect.top)*event.currentTarget.height/rect.height};};
  const down=(event:ReactPointerEvent<HTMLCanvasElement>)=>{const context=event.currentTarget.getContext('2d');if(!context)return;history.current.push(event.currentTarget.toDataURL());drawing.current=true;event.currentTarget.setPointerCapture(event.pointerId);const p=point(event);context.beginPath();context.moveTo(p.x,p.y);};
  const move=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(!drawing.current)return;const context=event.currentTarget.getContext('2d');if(!context)return;const p=point(event);context.lineTo(p.x,p.y);context.stroke();};
  const restore=(source?:string)=>{const element=canvas.current;const context=element?.getContext('2d');if(!element||!context)return;context.clearRect(0,0,element.width,element.height);if(source){const image=new Image();image.onload=()=>context.drawImage(image,0,0);image.src=source;}};
  return <motion.div className="reaction-tool doodle-tool" initial={{opacity:0,y:10,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:7,scale:.96}}>
    <div className="doodle-head"><small>DOODLE REACTION</small><button onClick={onClose} aria-label="Close doodle"><X size={14}/></button></div><canvas ref={canvas} width={300} height={170} onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drawing.current=false;}} onPointerCancel={()=>{drawing.current=false;}}/>
    <div className="doodle-actions"><button onClick={()=>restore(history.current.pop())}><Undo2 size={14}/> Undo</button><button onClick={()=>{history.current=[];restore();}}><Trash2 size={14}/> Clear</button><button className="tool-send" onClick={()=>canvas.current&&onSend(canvas.current.toDataURL())}><Send size={14}/> Send</button></div>
  </motion.div>;
}

function PostViewer({ friend, onClose, onNotify }:{friend:Friend;onClose:()=>void;onNotify:(text:string)=>void}) {
  const [liked,setLiked]=useState(false);const [reactionMenu,setReactionMenu]=useState(false);const [picker,setPicker]=useState(false);const [tool,setTool]=useState<'voice'|'doodle'|null>(null);
  const [reactions,setReactions]=useState<Reaction[]>([{id:'voice-maya',type:'voice',label:'Maya',duration:'0:03'},{id:'selfie-leo',type:'selfie',label:'Leo',image:friends[5].image}]);
  const addReaction=(reaction:Reaction)=>{setReactions(current=>[...current,reaction]);setReactionMenu(false);setTool(null);onNotify(`${reaction.type} reaction sent privately`);};
  const pick=(meme:typeof memes[number])=>{addReaction({id:`meme-${Date.now()}`,type:'meme',label:'You',emoji:meme.emoji});setPicker(false);};
  return <motion.div className="viewer-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <motion.button className="viewer-backdrop" onClick={onClose} aria-label="Close moment" />
    <motion.article className="post-viewer" initial={{opacity:0,y:36,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:26,scale:.96}} transition={{type:'spring',stiffness:175,damping:23}}>
      <header className="post-head">
        <div className="post-person"><motion.span layoutId={`avatar-${friend.name}`} style={{background:friend.color}}><img src={friend.image} alt=""/></motion.span><p><b>{friend.name}</b><small>{friend.time}</small></p></div>
        <button onClick={onClose} aria-label="Close moment"><X size={20}/></button>
      </header>
      <div className="post-photo-wrap">
        <motion.img className="post-photo" src={friend.photo} alt={`${friend.name}'s latest moment`} initial={{scale:1.035}} animate={{scale:1}} transition={{duration:.65,ease:[.2,.8,.2,1]}}/>
        <div className="photo-wash" />
        <div className="reaction-objects">{reactions.map((reaction,index)=><ReactionObject reaction={reaction} index={index} key={reaction.id}/>)}</div>
      </div>
      <div className="post-copy"><p>{friend.caption}</p><PrivacyIndicator/></div>
      <div className="post-actions-row"><button className="react-action" onClick={()=>setReactionMenu(v=>!v)}><SmilePlus size={17}/> React privately</button></div>
      <AnimatePresence>{reactionMenu&&<motion.div className="reaction-tray" initial={{opacity:0,y:7,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:5,scale:.97}}>
        <button className={liked?'liked':''} onClick={()=>{setLiked(v=>!v);setReactionMenu(false);}}><Heart size={16} fill={liked?'currentColor':'none'}/><span>Like</span></button><button onClick={()=>{setPicker(true);setReactionMenu(false);}}><span>😂</span><b>Meme</b></button><button onClick={()=>{setTool('voice');setReactionMenu(false);}}><Mic size={16}/><span>Voice</span></button><button onClick={()=>{setTool('doodle');setReactionMenu(false);}}><Pencil size={16}/><span>Doodle</span></button><label className="reaction-upload"><Camera size={16}/><span>Selfie</span><input type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)addReaction({id:`selfie-${Date.now()}`,type:'selfie',label:'You',image:URL.createObjectURL(file)});}}/></label>
      </motion.div>}</AnimatePresence>
      <AnimatePresence>{picker&&<MemePicker onPick={pick} onClose={()=>setPicker(false)}/>}</AnimatePresence>
      <AnimatePresence>{tool==='voice'&&<VoiceReaction onClose={()=>setTool(null)} onSend={()=>addReaction({id:`voice-${Date.now()}`,type:'voice',label:'You',duration:'0:04'})}/>}</AnimatePresence>
      <AnimatePresence>{tool==='doodle'&&<DoodlePad onClose={()=>setTool(null)} onSend={image=>addReaction({id:`doodle-${Date.now()}`,type:'doodle',label:'You',image})}/>}</AnimatePresence>
    </motion.article>
  </motion.div>;
}

function AskComposer({onClose,onSend}:{onClose:()=>void;onSend:(text:string,recipients:string[],audienceLabel:string)=>void}){
  const [text,setText]=useState('');const [audience,setAudience]=useState<AskAudience>('everyone');const [selectedGroups,setSelectedGroups]=useState<string[]>(['inner']);const [selectedFriends,setSelectedFriends]=useState<string[]>(['Maya','Vina']);
  const recipients=useMemo(()=>{if(audience==='everyone')return friends.map(friend=>friend.name);if(audience==='group')return Array.from(new Set(askGroups.filter(group=>selectedGroups.includes(group.id)).flatMap(group=>group.members)));return selectedFriends;},[audience,selectedGroups,selectedFriends]);
  const audienceLabel=audience==='everyone'?'Everyone':audience==='group'?(selectedGroups.length===1?askGroups.find(group=>group.id===selectedGroups[0])?.name||'Group':`${selectedGroups.length} groups`):`${selectedFriends.length} friends`;
  const toggleGroup=(id:string)=>setSelectedGroups(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);const toggleFriend=(name:string)=>setSelectedFriends(current=>current.includes(name)?current.filter(item=>item!==name):[...current,name]);
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose}/><motion.section className="ask-composer" initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close Ask composer"><X size={17}/></button><small>CREATE AN ASK</small><h2>Ask your people something.</h2><label className="ask-question"><span>Your prompt</span><textarea autoFocus value={text} onChange={event=>setText(event.target.value)} maxLength={90} placeholder="Desk photo, right now?"/><b>{text.length}/90</b></label><div className="ask-audience"><span><Users size={14}/> Send to</span><div className="ask-audience-tabs">{(['everyone','group','friends'] as AskAudience[]).map(option=><button className={audience===option?'active':''} onClick={()=>setAudience(option)} key={option}>{option==='group'?'Groups':option[0].toUpperCase()+option.slice(1)}</button>)}</div>{audience==='group'&&<div className="ask-group-options">{askGroups.map(group=><button className={selectedGroups.includes(group.id)?'active':''} onClick={()=>toggleGroup(group.id)} key={group.id}><i>{selectedGroups.includes(group.id)&&<Check size={10}/>}</i><span><b>{group.name}</b><small>{group.members.length} people</small></span></button>)}</div>}{audience==='friends'&&<div className="ask-friend-options">{friends.map(friend=><button className={selectedFriends.includes(friend.name)?'active':''} onClick={()=>toggleFriend(friend.name)} key={friend.name}><img src={friend.image} alt=""/><i><Check size={9}/></i><small>{friend.name}</small></button>)}</div>}</div><div className="ask-send-summary"><LockKeyhole size={13}/><span>Only these {recipients.length} people can see and answer this Ask.</span></div><button className="ask-send" disabled={!text.trim()||recipients.length===0} onClick={()=>onSend(text.trim(),recipients,audienceLabel)}><Send size={15}/> Send Ask</button></motion.section></motion.div>;
}

function AskReplyModal({ask,onClose,onSend}:{ask:AskPrompt;onClose:()=>void;onSend:(image:string)=>void}){
  const existing=ask.responses.find(response=>response.responder==='You');const [preview,setPreview]=useState<string|null>(existing?.image||null);const sender=friends.find(friend=>friend.name===ask.sender);
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose}/><motion.section className="ritual-modal ask-reply" initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close Ask"><X size={17}/></button><div className="ask-sender">{sender&&<img src={sender.image} alt=""/>}<span><small>{ask.sender.toUpperCase()} ASKS</small><b>{ask.text}</b></span></div><label className={`ritual-upload${preview?' has-preview':''}`}>{preview?<img src={preview} alt="Your Ask response"/>:<><ImagePlus size={24}/><b>Reply with a photo</b><small>Fresh from your camera or library</small></>}<input type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)setPreview(URL.createObjectURL(file));}}/></label><button className="ask-camera-mock" onClick={()=>setPreview('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=88')}><Camera size={15}/> Take photo <small>mock</small></button><p className="ritual-lock"><LockKeyhole size={13}/> Only {ask.sender} will see your reply.</p><button className="ritual-send" disabled={!preview} onClick={()=>preview&&onSend(preview)}><Send size={15}/> {existing?'Update reply':'Send photo'}</button></motion.section></motion.div>;
}

function AskResponsesModal({ask,onClose}:{ask:AskPrompt;onClose:()=>void}){
  const dialog=useRef<HTMLElement>(null);
  useEffect(()=>{const element=dialog.current;if(!element)return;element.focus();const trap=(event:KeyboardEvent)=>{if(event.key!=='Tab')return;const controls=Array.from(element.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(control=>!control.hasAttribute('disabled'));if(!controls.length){event.preventDefault();element.focus();return;}const first=controls[0];const last=controls[controls.length-1];if(document.activeElement===element){event.preventDefault();(event.shiftKey?last:first).focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};element.addEventListener('keydown',trap);return()=>element.removeEventListener('keydown',trap);},[]);
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose} aria-label="Close Ask responses" tabIndex={-1}/><motion.section ref={dialog} className="ask-responses" role="dialog" aria-modal="true" aria-labelledby="ask-responses-heading" tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}} initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close responses"><X size={17}/></button><small>YOUR ASK · {ask.audienceLabel.toUpperCase()}</small><h2 id="ask-responses-heading">{ask.text}</h2><div className="response-summary"><span>{ask.responses.length} {ask.responses.length===1?'response':'responses'}</span><i>{ask.recipients.length} asked</i></div>{ask.responses.length?<div className="ask-response-grid">{ask.responses.map(response=>{const responder=friends.find(friend=>friend.name===response.responder);return <article key={response.id}><img src={response.image} alt={`${response.responder}'s response`}/><footer>{responder&&<img src={responder.image} alt=""/>}<span><b>{response.responder}</b><small>{response.sentAt} ago</small></span></footer></article>;})}</div>:<div className="ask-empty"><Camera size={25}/><b>No replies yet</b><span>Your Ask lives in Notifications. Replies will land here.</span></div>}<p><LockKeyhole size={13}/> Responses are private to you.</p></motion.section></motion.div>;
}

function KnockResponseComposer({knock,onClose,onSend}:{knock:Knock;onClose:()=>void;onSend:(response:KnockResponse)=>void}){
  const [preview,setPreview]=useState<string|null>(null);const [status,setStatus]=useState('');const sender=friends.find(friend=>friend.name===knock.from);const quickStatuses=['Alive.','At work 😭','Gym.','Rotting.'];
  const upload=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setPreview(typeof reader.result==='string'?reader.result:null);reader.readAsDataURL(file);};
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose} aria-label="Close Knock response"/><motion.section className="ritual-modal knock-response-composer" initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close"><X size={17}/></button><div className="knock-response-head">{sender&&<img src={sender.image} alt=""/>}<span><small>{knock.from.toUpperCase()} KNOCKED 👊</small><h2>Show us you’re alive.</h2></span></div><label className={`knock-photo${preview?' has-preview':''}`}>{preview?<img src={preview} alt="Your Knock response"/>:<><Camera size={24}/><b>Photo proof</b><small>Upload something from right now</small></>}<input type="file" accept="image/*" onChange={upload}/></label><div className="knock-capture-actions"><button onClick={()=>setPreview('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=88')}><Camera size={15}/> Camera <small>mock</small></button><button onClick={()=>setPreview('https://i.pravatar.cc/600?img=68')}><span>🤳</span> Quick selfie</button></div><label className="knock-status"><span>Or send a tiny status</span><input value={status} onChange={event=>setStatus(event.target.value)} maxLength={36} placeholder="Alive."/><small>{status.length}/36</small></label><div className="knock-status-chips">{quickStatuses.map(item=><button className={status===item?'active':''} onClick={()=>setStatus(item)} key={item}>{item}</button>)}</div><p className="ritual-lock"><LockKeyhole size={13}/> This goes only to {knock.from}.</p><button className="ritual-send" disabled={!preview&&!status.trim()} onClick={()=>onSend({image:preview||undefined,status:status.trim()||undefined,sentAt:Date.now()})}><Send size={15}/> Send proof of life</button></motion.section></motion.div>;
}

function KnockResponseViewer({knock,onClose}:{knock:Knock;onClose:()=>void}){
  const friend=friends.find(item=>item.name===knock.to);return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose} aria-label="Close Knock response"/><motion.section className="ritual-modal knock-response-viewer" initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close"><X size={17}/></button><div className="knock-response-head">{friend&&<img src={friend.image} alt=""/>}<span><small>{knock.to.toUpperCase()} RESPONDED</small><h2>Proof of life. 👊</h2></span></div>{knock.response?.image&&<img className="knock-response-photo" src={knock.response.image} alt={`${knock.to}'s Knock response`}/>}<blockquote>{knock.response?.status||'Alive. You can stop worrying now.'}</blockquote><p className="ritual-lock"><Check size={13}/> {knock.to} is active again. Knock cooldown: 24 hours.</p></motion.section></motion.div>;
}

function NotificationPanel({ items,ownAsk,onSelect,onOpenOwnAsk,onClose }:{items:SocialNotification[];ownAsk:AskPrompt|null;onSelect:(item:SocialNotification)=>void;onOpenOwnAsk:(ask:AskPrompt)=>void;onClose:()=>void}) {
  const initialFocus=useRef<HTMLButtonElement>(null);
  useEffect(()=>{initialFocus.current?.focus();},[]);
  return <motion.aside className="notification-panel" role="dialog" aria-labelledby="notifications-heading" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}} initial={{opacity:0,y:-14,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.97}} transition={{type:'spring',stiffness:250,damping:22}}>
    <div className="panel-head"><div><small>UPDATES</small><h2 id="notifications-heading">While you were away</h2></div><button ref={ownAsk?undefined:initialFocus} onClick={onClose} aria-label="Close notifications"><X size={17}/></button></div>
    {ownAsk&&<button ref={initialFocus} className="notification-my-ask" onClick={()=>onOpenOwnAsk(ownAsk)}><span><MessageCircleQuestion size={18}/></span><p><small>MY ASK</small><b>{ownAsk.text}</b><em>{ownAsk.responses.length?`${ownAsk.responses.length} ${ownAsk.responses.length===1?'reply':'replies'} · View all`:'Waiting for replies'}</em></p><ChevronRight size={16}/></button>}
    <div className="notification-list">{items.map((item,index)=><button className={index<2?'unread':''} onClick={()=>onSelect(item)} key={item.id}><img src={item.friend.image} alt=""/><p><b>{item.friend.name}</b> {item.text} {item.mark}<small>{item.time} ago</small></p>{item.action==='knock'&&<em>Respond</em>}{item.action==='knock-response'&&<em>View</em>}{item.action==='ask'&&<em>Answer</em>}{item.action==='ask-response'&&<em>View</em>}</button>)}</div>
    <p className="panel-foot"><LockKeyhole size={13}/> Only activity from your circle lives here.</p>
  </motion.aside>;
}

function PostComposer({ onClose, onPosted }:{onClose:()=>void;onPosted:()=>void}) {
  const [preview,setPreview]=useState<string|null>(null); const [caption,setCaption]=useState('');
  const [selected,setSelected]=useState(()=>friends.slice(0,8).map(friend=>friend.name));
  const change=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(file)setPreview(URL.createObjectURL(file));};
  const toggle=(name:string)=>setSelected(v=>v.includes(name)?v.filter(item=>item!==name):[...v,name]);
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button className="modal-backdrop" onClick={onClose} aria-label="Close composer"/>
    <motion.section className="composer" initial={{opacity:0,y:40,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:.97}} transition={{type:'spring',stiffness:190,damping:23}}>
      <div className="composer-head"><span><small>A NEW MOMENT</small><h2>Share with your people</h2></span><button onClick={onClose} aria-label="Close"><X size={19}/></button></div>
      <label className={`upload-zone${preview?' has-preview':''}`}>{preview?<img src={preview} alt="Your selected upload"/>:<><span><Upload size={22}/></span><b>Choose a photo</b><small>Something your people would want to see</small></>}<input type="file" accept="image/*" onChange={change}/></label>
      <label className="caption-field"><span>Caption <small>optional</small></span><textarea value={caption} onChange={e=>setCaption(e.target.value)} maxLength={120} placeholder="What’s the story?"/><small>{caption.length}/120</small></label>
      <div className="audience"><div><span><Users size={15}/> Who can see this?</span><small>{selected.length} friends</small></div><div className="audience-faces">{friends.map(friend=><button className={selected.includes(friend.name)?'active':''} onClick={()=>toggle(friend.name)} aria-label={`${selected.includes(friend.name)?'Remove':'Add'} ${friend.name}`} key={friend.name}><img src={friend.image} alt=""/><i><Check size={9}/></i><small>{friend.name}</small></button>)}</div></div>
      <button className="share-button" onClick={onPosted} disabled={!preview||selected.length===0}><Send size={17}/> Share this moment</button>
      <p className="composer-privacy"><LockKeyhole size={13}/> Encrypted in transit. Never public.</p>
    </motion.section>
  </motion.div>;
}

export default function Home() {
  const [selected,setSelected]=useState<Friend|null>(null); const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [composerOpen,setComposerOpen]=useState(false); const [toast,setToast]=useState<string|null>(null); const [inviteOpen,setInviteOpen]=useState(false);
  const [knocks,setKnocks]=useState<Knock[]>(initialKnocks);const [knockComposerId,setKnockComposerId]=useState<string|null>(null);const [knockResponseId,setKnockResponseId]=useState<string|null>(null);const [nudgeFriend,setNudgeFriend]=useState<string|null>(null);const [knockCooldowns,setKnockCooldowns]=useState<Record<string,number>>({});const [activityOverrides,setActivityOverrides]=useState<Record<string,ActivityOverride>>({});const [asks,setAsks]=useState<AskPrompt[]>(initialAsks);const [askComposerOpen,setAskComposerOpen]=useState(false);const [replyAsk,setReplyAsk]=useState<AskPrompt|null>(null);const [responsesAsk,setResponsesAsk]=useState<AskPrompt|null>(null);const [socialNotifications,setSocialNotifications]=useState(initialNotifications);
  const toastTimer=useRef<number|undefined>(undefined);const responseTimers=useRef<number[]>([]);const bellRef=useRef<HTMLButtonElement>(null);const incomingKnocks=knocks.filter(knock=>knock.to==='You'&&knock.status==='waiting');const knockComposer=knocks.find(knock=>knock.id===knockComposerId)||null;const knockResponse=knocks.find(knock=>knock.id===knockResponseId&&knock.status==='responded')||null;
  const showToast=(message:string)=>{setToast(message);if(toastTimer.current)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(null),2600);};
  useEffect(()=>{const timer=window.setTimeout(()=>{let stored:Record<string,number>={};try{stored=JSON.parse(window.localStorage.getItem('circle-knock-cooldowns')||'{}') as Record<string,number>;}catch{stored={};}setKnockCooldowns(stored);const visit=Number(window.sessionStorage.getItem('circle-knock-visit')||'0')+1;window.sessionStorage.setItem('circle-knock-visit',String(visit));if(visit%3!==0){const eligible=friends.filter(friend=>canReceiveKnock(getActivityState(friend))&&Date.now()-(stored[friend.name]||0)>=ACTIVITY_THRESHOLDS.knockCooldown);if(eligible.length)setNudgeFriend(eligible[visit%eligible.length].name);}},0);return()=>window.clearTimeout(timer);},[]);
  useEffect(()=>{const timers=responseTimers.current;const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setSelected(null);setNotificationsOpen(false);setComposerOpen(false);setInviteOpen(false);setKnockComposerId(null);setKnockResponseId(null);setAskComposerOpen(false);setReplyAsk(null);setResponsesAsk(null);}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(toastTimer.current)window.clearTimeout(toastTimer.current);timers.forEach(timer=>window.clearTimeout(timer));};},[]);
  const backgroundLabel=useMemo(()=>selected?`${selected.name}'s moment is open`:'Your inner circle', [selected]);
  const posted=()=>{setComposerOpen(false);showToast('Shared with your circle');};
  const openFriend=(friend:Friend)=>{setSelected(friend);setNotificationsOpen(false);};
  const openAsk=(ask:AskPrompt)=>{setNotificationsOpen(false);if(ask.sender==='You')setResponsesAsk(ask);else setReplyAsk(ask);};
  const closeNotifications=()=>{setNotificationsOpen(false);window.requestAnimationFrame(()=>bellRef.current?.focus());};
  const closeResponses=()=>{setResponsesAsk(null);window.requestAnimationFrame(()=>bellRef.current?.focus());};
  const selectNotification=(item:SocialNotification)=>{setNotificationsOpen(false);if(item.action==='knock'){const knock=knocks.find(candidate=>candidate.id===item.knockId&&candidate.status==='waiting');if(knock)setKnockComposerId(knock.id);}else if(item.action==='knock-response'){setKnockResponseId(item.knockId||null);}else if(item.action==='ask'||item.action==='ask-response'){const ask=asks.find(candidate=>candidate.id===item.askId);if(ask)openAsk(ask);}else openFriend(item.friend);};
  const sendKnock=(friend:Friend)=>{const now=Date.now();if(now-(knockCooldowns[friend.name]||0)<ACTIVITY_THRESHOLDS.knockCooldown){showToast(`${friend.name} is on Knock cooldown`);return;}const knock:Knock={id:`knock-you-${friend.name}-${now}`,from:'You',to:friend.name,createdAt:now,status:'sent'};setKnocks(current=>[knock,...current]);setKnockCooldowns(current=>{const next={...current,[friend.name]:now};window.localStorage.setItem('circle-knock-cooldowns',JSON.stringify(next));return next;});const timer=window.setTimeout(()=>{const response:KnockResponse={image:friend.photo,status:['Alive.','At work 😭','Gym.','Rotting.'][friends.indexOf(friend)%4],sentAt:Date.now()};setKnocks(current=>current.map(item=>item.id===knock.id?{...item,status:'responded',response}:item));setActivityOverrides(current=>({...current,[friend.name]:{lastActiveAt:Date.now(),lastPostedAt:Date.now()}}));setSocialNotifications(current=>[{id:`response-${knock.id}`,friend,text:'sent proof of life',mark:'📷',time:'now',action:'knock-response',knockId:knock.id},...current]);showToast(`${friend.name} sent proof of life`);},6500);responseTimers.current.push(timer);};
  const respondToKnock=(knock:Knock,response:KnockResponse)=>{setKnocks(current=>current.map(item=>item.id===knock.id?{...item,status:'responded',response}:item));setKnockComposerId(null);showToast(`Proof of life sent to ${knock.from}`);};
  const sendAsk=(text:string,recipients:string[],audienceLabel:string)=>{const ask:AskPrompt={id:`ask-you-${Date.now()}`,sender:'You',text,recipients,audienceLabel,createdAt:Date.now(),responses:[]};const previousOwnAskIds=new Set(asks.filter(item=>item.sender==='You').map(item=>item.id));setAsks(current=>[ask,...current.filter(item=>item.sender!=='You')]);setSocialNotifications(current=>current.filter(item=>!(item.action==='ask-response'&&item.askId&&previousOwnAskIds.has(item.askId))));setAskComposerOpen(false);showToast(`Ask sent to ${recipients.length} ${recipients.length===1?'friend':'friends'}`);};
  const replyToAsk=(ask:AskPrompt,image:string)=>{setAsks(current=>current.map(item=>item.id===ask.id?{...item,responses:[...item.responses.filter(response=>response.responder!=='You'),{id:`response-you-${Date.now()}`,responder:'You',image,sentAt:'now'}]}:item));setReplyAsk(null);showToast(`Photo sent privately to ${ask.sender}`);};
  return <main className="friend-space" aria-label={backgroundLabel}>
    <header className="circle-header"><div><h1>Circle</h1><p>Your people. Closer.</p></div><nav><button ref={bellRef} className="bell" onClick={()=>setNotificationsOpen(v=>!v)} aria-label={notificationsOpen?'Close notifications':'Open notifications'} aria-expanded={notificationsOpen}><Bell size={21} strokeWidth={1.8}/><span/></button><button className="header-invite" onClick={()=>setInviteOpen(v=>!v)}><Plus size={17}/> Invite</button></nav></header>
    <FriendSpace selected={selected} asks={asks} activityOverrides={activityOverrides} nudgeFriend={nudgeFriend} incomingKnocks={incomingKnocks} onOpen={openFriend} onUser={()=>setComposerOpen(true)} onAsk={openAsk} onCreateAsk={()=>setAskComposerOpen(true)} onKnock={sendKnock} onDismissKnock={()=>setNudgeFriend(null)} onRespondKnock={knock=>setKnockComposerId(knock.id)}/>
    <button className="circle-count"><Users size={19}/><span>9 close friends</span><ChevronRight size={16}/></button>
    <button className="post-action" onClick={()=>setComposerOpen(true)}><span><Plus size={30}/></span><b>Post</b></button>
    <AnimatePresence>{inviteOpen&&<motion.aside className="quick-invite" initial={{opacity:0,y:-10,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:.97}}><button onClick={()=>setInviteOpen(false)} aria-label="Close invite"><X size={16}/></button><small>INVITE TO YOUR CIRCLE</small><h2>Someone missing?</h2><div><input type="email" aria-label="Email address" placeholder="friend@email.com"/><button onClick={()=>setInviteOpen(false)}><Send size={16}/></button></div></motion.aside>}</AnimatePresence>
    <AnimatePresence>{notificationsOpen&&<NotificationPanel items={socialNotifications} ownAsk={asks.find(ask=>ask.sender==='You')||null} onSelect={selectNotification} onOpenOwnAsk={openAsk} onClose={closeNotifications}/>}</AnimatePresence>
    <AnimatePresence>{selected&&<PostViewer friend={selected} onClose={()=>setSelected(null)} onNotify={showToast}/>}</AnimatePresence>
    <AnimatePresence>{composerOpen&&<PostComposer onClose={()=>setComposerOpen(false)} onPosted={posted}/>}</AnimatePresence>
    <AnimatePresence>{askComposerOpen&&<AskComposer onClose={()=>setAskComposerOpen(false)} onSend={sendAsk}/>}</AnimatePresence>
    <AnimatePresence>{replyAsk&&<AskReplyModal ask={asks.find(ask=>ask.id===replyAsk.id)||replyAsk} onClose={()=>setReplyAsk(null)} onSend={image=>replyToAsk(replyAsk,image)}/>}</AnimatePresence>
    <AnimatePresence>{responsesAsk&&<AskResponsesModal ask={asks.find(ask=>ask.id===responsesAsk.id)||responsesAsk} onClose={closeResponses}/>}</AnimatePresence>
    <AnimatePresence>{knockComposer&&<KnockResponseComposer knock={knockComposer} onClose={()=>setKnockComposerId(null)} onSend={response=>respondToKnock(knockComposer,response)}/>}</AnimatePresence>
    <AnimatePresence>{knockResponse&&<KnockResponseViewer knock={knockResponse} onClose={()=>setKnockResponseId(null)}/>}</AnimatePresence>
    <AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:20,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12}}><Check size={16}/>{toast}</motion.div>}</AnimatePresence>
    <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
  </main>;
}
