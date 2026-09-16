'use client';

import type { CSSProperties, ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, motionValue, useMotionValue, useSpring } from 'framer-motion';
import type { MotionStyle, MotionValue } from 'framer-motion';
import { Bell, Camera, Check, ChevronRight, Heart, ImagePlus, LocateFixed, LockKeyhole, Mic, Pencil, Play, Plus, Send, SmilePlus, Trash2, Undo2, Upload, Users, X } from 'lucide-react';

type Friend = {
  name: string; color: string; x: number; y: number; size: number; image: string;
  fresh?: boolean; online?: boolean; time: string; caption: string; photo: string;
};

type Knock = { id:string; from:string; to:string; createdAt:number; expiresAt:number; status:'waiting'|'answered' };
type AskResponse = { id:string; responder:string; image:string; sentAt:string };
type AskPrompt = { id:string; sender:string; text:string; recipients:string[]; audienceLabel:string; createdAt:number; responses:AskResponse[] };
type AskAudience = 'everyone'|'group'|'friends';
type ReactionKind = 'meme'|'voice'|'doodle'|'selfie';
type Reaction = { id:string; type:ReactionKind; label:string; emoji?:string; image?:string; duration?:string };
type SocialNotification = { id:string; friend:Friend; text:string; mark:string; time:string; action:'knock'|'reaction'|'ask'|'ask-response'; askId?:string };

const friends: Friend[] = [
  { name:'Maya', color:'#e7b6a3', x:-115, y:-66, size:130, image:'https://i.pravatar.cc/240?img=47', fresh:true, time:'18 min ago', caption:'We missed the sunset but found this tiny blue hour instead.', photo:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88' },
  { name:'Noah', color:'#a8c5bb', x:0, y:-109, size:82, image:'https://i.pravatar.cc/240?img=12', online:true, time:'Yesterday', caption:'Found a table for eight. You know what that means.', photo:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=88' },
  { name:'Ari', color:'#d8c4a0', x:71, y:-189, size:108, image:'https://i.pravatar.cc/240?img=49', time:'42 min ago', caption:'A very serious morning meeting.', photo:'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1400&q=88' },
  { name:'Sam', color:'#b6b8cc', x:-192, y:19, size:76, image:'https://i.pravatar.cc/240?img=5', time:'2 days ago', caption:'No plans. Perfect day.', photo:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=88' },
  { name:'Vina', color:'#edc3c7', x:111, y:-67, size:124, image:'https://i.pravatar.cc/240?img=32', fresh:true, time:'6 min ago', caption:'Proof we actually left the group chat.', photo:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=88' },
  { name:'Leo', color:'#aabbd1', x:-101, y:63, size:102, image:'https://i.pravatar.cc/240?img=11', fresh:true, time:'4 hours ago', caption:'Borrowed the good camera. Refusing to return it.', photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88' },
  { name:'Inez', color:'#d3b2c3', x:9, y:134, size:132, image:'https://i.pravatar.cc/240?img=44', online:true, time:'Saturday', caption:'Tiny dinner, enormous opinions.', photo:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=88' },
  { name:'Omar', color:'#a8c9a2', x:96, y:49, size:80, image:'https://i.pravatar.cc/240?img=8', time:'Monday', caption:'Took the long way home.', photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88' },
  { name:'June', color:'#d7c68d', x:123, y:133, size:72, image:'https://i.pravatar.cc/240?img=45', time:'Sunday', caption:'Soft launch of my new personality: outdoorsy.', photo:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=88' },
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
const initialKnocks:Knock[]=[{id:'knock-vina',from:'Vina',to:'You',createdAt:Date.now()-28000,expiresAt:Date.now()+272000,status:'waiting'}];
const initialNotifications:SocialNotification[]=[
  {id:'n-knock',friend:friends[4],text:'knocked',mark:'👊',time:'2m',action:'knock'},
  {id:'n-ask-response',friend:friends[6],text:'answered your Ask',mark:'📷',time:'2m',action:'ask-response',askId:'ask-you-view'},
  {id:'n-ask',friend:friends[4],text:'asked “Desk photo, right now?”',mark:'↗',time:'7m',action:'ask',askId:'ask-vina-desk'},
  {id:'n-meme',friend:friends[1],text:'reacted with a meme',mark:'😂',time:'5m',action:'reaction'},
  {id:'n-voice',friend:friends[0],text:'sent you a voice reaction',mark:'🎤',time:'12m',action:'reaction'},
  {id:'n-selfie',friend:friends[5],text:'reacted with his face',mark:'🤳',time:'31m',action:'reaction'},
];

type BubbleOffset = { x:MotionValue<number>; y:MotionValue<number> };

function AskChip({ask,placement='right',own=false,onOpen}:{ask:AskPrompt;placement?:'left'|'right'|'above';own?:boolean;onOpen:()=>void}){
  return <motion.button className={`bubble-ask ask-${placement}${own?' player-ask':''}`} onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();onOpen();}} initial={{opacity:0,scale:.72,y:5}} animate={{opacity:1,scale:1,y:0}} whileHover={{scale:1.045,y:-2}} whileTap={{scale:.98}} aria-label={own?`View responses to your Ask: ${ask.text}`:`Reply to ${ask.sender}'s Ask: ${ask.text}`}>
    <small>{own?'YOUR ASK':`${ask.sender.toUpperCase()} ASKS`}</small><span>{ask.text}</span><b>{own?`${ask.responses.length} ${ask.responses.length===1?'reply':'replies'}`:'Reply with a photo'}</b>
  </motion.button>;
}

function FloatingFriend({ friend, index, selected, offset, ask, knocking, onHover, onOpen, onAsk }:{ friend:Friend; index:number; selected:boolean; offset:BubbleOffset; ask:AskPrompt|null; knocking:boolean; onHover:(index:number|null)=>void; onOpen:()=>void; onAsk:(ask:AskPrompt)=>void }) {
  const placement:'left'|'right'|'above'=friend.y>100?'above':friend.x>25?'right':'left';
  return (
    <motion.div
      className={`friend ${friend.fresh || friend.online ? 'is-active' : 'is-inactive'}${selected ? ' is-selected' : ''}${ask?' has-ask':''}${knocking?' is-knocking':''}`}
      style={{ '--offset-x':`${friend.x}px`, '--offset-y':`${friend.y}px`, '--bubble-size':`${friend.size}px`, '--tone':friend.color, x:offset.x, y:offset.y } as MotionStyle}
      initial={{ opacity:0, scale:.82 }} animate={{ opacity:selected ? 0 : 1, scale:1 }}
      transition={{ opacity:{duration:.32,ease:'easeOut'}, scale:{delay:.035*index,type:'spring',stiffness:120,damping:20,mass:.8} }}
      onHoverStart={()=>onHover(index)} onHoverEnd={()=>onHover(null)}
    >
      <motion.button className="friend-profile" onClick={onOpen} aria-label={`Open ${friend.name}'s latest moment`} whileHover={{scale:1.055}} whileTap={{scale:.97}}><span className="friend-float"><motion.span className="portrait" layoutId={`avatar-${friend.name}`}><img src={friend.image} alt="" /></motion.span><b>{friend.name}</b></span></motion.button>
      {ask&&<AskChip ask={ask} placement={placement} onOpen={()=>onAsk(ask)}/>}
    </motion.div>
  );
}

function FriendSpace({ selected, asks, incomingKnock, onOpen, onUser, onAsk, onOwnAsk, onCreateAsk }:{ selected:Friend|null; asks:AskPrompt[]; incomingKnock:boolean; onOpen:(friend:Friend)=>void; onUser:()=>void; onAsk:(ask:AskPrompt)=>void; onOwnAsk:(ask:AskPrompt)=>void; onCreateAsk:()=>void }) {
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
          {friends.map((friend,index)=><FloatingFriend friend={friend} index={index} selected={selected?.name===friend.name} offset={bubbleOffsets[index]} ask={asks.find(ask=>ask.sender===friend.name&&ask.recipients.includes('You'))||null} knocking={incomingKnock&&friend.name==='Vina'} onHover={value=>{hovered.current=value;}} onOpen={()=>onOpen(friend)} onAsk={onAsk} key={friend.name} />)}
        </div>
      </motion.div>
      <div className="player-layer"><div className="player-anchor"><motion.button className="you" aria-label="Create a post" onClick={onUser} whileHover={{scale:1.045}} whileTap={{scale:.97}}><img src="https://i.pravatar.cc/240?img=68" alt=""/></motion.button>{asks.find(ask=>ask.sender==='You')&&<AskChip ask={asks.find(ask=>ask.sender==='You')!} placement="left" own onOpen={()=>onOwnAsk(asks.find(ask=>ask.sender==='You')!)}/>}<motion.button className="ask-create-trigger" onPointerDown={event=>event.stopPropagation()} onClick={onCreateAsk} whileHover={{scale:1.06}} whileTap={{scale:.95}} aria-label="Create an Ask"><Plus size={14}/> Ask</motion.button></div></div>
      <div className="reset-anchor"><AnimatePresence>{hasMoved&&<motion.button className="reset-world" aria-label="Return to center" title="Return to center" onPointerDown={event=>event.stopPropagation()} onClick={resetWorld} initial={{opacity:0,y:6,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:.9,transition:{duration:.12,ease:'easeOut'}}} transition={{duration:.16,ease:'easeOut'}} whileHover={{scale:1.06}} whileTap={{scale:.94}}><LocateFixed size={17}/></motion.button>}</AnimatePresence></div>
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

function PostViewer({ friend, onClose, onKnock, onNotify }:{friend:Friend;onClose:()=>void;onKnock:(friend:Friend)=>void;onNotify:(text:string)=>void}) {
  const [liked,setLiked]=useState(false);const [reactionMenu,setReactionMenu]=useState(false);const [picker,setPicker]=useState(false);const [tool,setTool]=useState<'voice'|'doodle'|null>(null);const [knock,setKnock]=useState<'idle'|'confirm'|'sent'>('idle');
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
      <div className="post-actions-row"><button className="knock-action" onClick={()=>setKnock('confirm')}>Knock Knock 👊</button><button className="react-action" onClick={()=>setReactionMenu(v=>!v)}><SmilePlus size={17}/> React</button></div>
      <AnimatePresence>{reactionMenu&&<motion.div className="reaction-tray" initial={{opacity:0,y:7,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:5,scale:.97}}>
        <button className={liked?'liked':''} onClick={()=>{setLiked(v=>!v);setReactionMenu(false);}}><Heart size={16} fill={liked?'currentColor':'none'}/><span>Like</span></button><button onClick={()=>{setPicker(true);setReactionMenu(false);}}><span>😂</span><b>Meme</b></button><button onClick={()=>{setTool('voice');setReactionMenu(false);}}><Mic size={16}/><span>Voice</span></button><button onClick={()=>{setTool('doodle');setReactionMenu(false);}}><Pencil size={16}/><span>Doodle</span></button><label className="reaction-upload"><Camera size={16}/><span>Selfie</span><input type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)addReaction({id:`selfie-${Date.now()}`,type:'selfie',label:'You',image:URL.createObjectURL(file)});}}/></label>
      </motion.div>}</AnimatePresence>
      <AnimatePresence>{knock==='confirm'&&<motion.div className="knock-confirm" initial={{opacity:0,y:8,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:5}}><b>Knock on {friend.name}?</b><p>They’ve got 5 minutes to show you what they’re doing.</p><button onClick={()=>{setKnock('sent');onKnock(friend);}}>Knock 👊</button></motion.div>}</AnimatePresence>
      {knock==='sent'&&<motion.p className="knock-sent" initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>Knocked. Now we wait.</motion.p>}
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
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose}/><motion.section className="ask-responses" initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close responses"><X size={17}/></button><small>YOUR ASK · {ask.audienceLabel.toUpperCase()}</small><h2>{ask.text}</h2><div className="response-summary"><span>{ask.responses.length} {ask.responses.length===1?'response':'responses'}</span><i>{ask.recipients.length} asked</i></div>{ask.responses.length?<div className="ask-response-grid">{ask.responses.map(response=>{const responder=friends.find(friend=>friend.name===response.responder);return <article key={response.id}><img src={response.image} alt={`${response.responder}'s response`}/><footer>{responder&&<img src={responder.image} alt=""/>}<span><b>{response.responder}</b><small>{response.sentAt} ago</small></span></footer></article>;})}</div>:<div className="ask-empty"><Camera size={25}/><b>No replies yet</b><span>Your Ask is floating beside you. Replies will land here.</span></div>}<p><LockKeyhole size={13}/> Responses are private to you.</p></motion.section></motion.div>;
}

function KnockReplyModal({knock,onClose,onSent}:{knock:Knock;onClose:()=>void;onSent:()=>void}){
  const [remaining,setRemaining]=useState(()=>Math.max(0,Math.ceil((knock.expiresAt-Date.now())/1000)));const [preview,setPreview]=useState<string|null>(null);
  useEffect(()=>{const timer=window.setInterval(()=>setRemaining(Math.max(0,Math.ceil((knock.expiresAt-Date.now())/1000))),1000);return()=>window.clearInterval(timer);},[knock.expiresAt]);
  const clock=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose}/><motion.section className="ritual-modal knock-reply" initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose}><X size={17}/></button><small>YOU GOT KNOCKED 👊</small><h2>{knock.from} wants proof of life.</h2><strong>{remaining>0?`${clock} remaining`:'Knock expired'}</strong><div className={`knock-preview${preview?' has-preview':''}`}>{preview?<img src={preview} alt="Your Knock response"/>:<Camera size={27}/>}</div><div className="knock-choices"><label><Upload size={16}/> Upload photo<input type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)setPreview(URL.createObjectURL(file));}}/></label><button onClick={()=>setPreview('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=85')}><Camera size={16}/> Take photo <small>mock</small></button></div><button className="ritual-send" disabled={!preview||remaining===0} onClick={onSent}><Send size={15}/> Send to {knock.from}</button></motion.section></motion.div>;
}

function NotificationPanel({ items,onSelect,onClose }:{items:SocialNotification[];onSelect:(item:SocialNotification)=>void;onClose:()=>void}) {
  return <motion.aside className="notification-panel" initial={{opacity:0,y:-14,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.97}} transition={{type:'spring',stiffness:250,damping:22}}>
    <div className="panel-head"><div><small>UPDATES</small><h2>While you were away</h2></div><button onClick={onClose} aria-label="Close notifications"><X size={17}/></button></div>
    <div className="notification-list">{items.map((item,index)=><button className={index<2?'unread':''} onClick={()=>onSelect(item)} key={item.id}><img src={item.friend.image} alt=""/><p><b>{item.friend.name}</b> {item.text} {item.mark}<small>{item.time} ago</small></p>{item.action==='knock'&&<em>Reply</em>}{item.action==='ask'&&<em>Answer</em>}{item.action==='ask-response'&&<em>View</em>}</button>)}</div>
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
  const [knocks,setKnocks]=useState<Knock[]>(initialKnocks);const [knockReplyOpen,setKnockReplyOpen]=useState(false);const [asks,setAsks]=useState<AskPrompt[]>(initialAsks);const [askComposerOpen,setAskComposerOpen]=useState(false);const [replyAsk,setReplyAsk]=useState<AskPrompt|null>(null);const [responsesAsk,setResponsesAsk]=useState<AskPrompt|null>(null);const [socialNotifications,setSocialNotifications]=useState(initialNotifications);
  const toastTimer=useRef<number|undefined>(undefined);const incomingKnock=knocks.find(knock=>knock.to==='You'&&knock.status==='waiting')||null;
  const showToast=(message:string)=>{setToast(message);if(toastTimer.current)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(null),2600);};
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setSelected(null);setNotificationsOpen(false);setComposerOpen(false);setInviteOpen(false);setKnockReplyOpen(false);setAskComposerOpen(false);setReplyAsk(null);setResponsesAsk(null);}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(toastTimer.current)window.clearTimeout(toastTimer.current);};},[]);
  const backgroundLabel=useMemo(()=>selected?`${selected.name}'s moment is open`:'Your inner circle', [selected]);
  const posted=()=>{setComposerOpen(false);showToast('Shared with your circle');};
  const openFriend=(friend:Friend)=>{setSelected(friend);setNotificationsOpen(false);};
  const openAsk=(ask:AskPrompt)=>{setNotificationsOpen(false);if(ask.sender==='You')setResponsesAsk(ask);else setReplyAsk(ask);};
  const selectNotification=(item:SocialNotification)=>{setNotificationsOpen(false);if(item.action==='knock')setKnockReplyOpen(true);else if(item.action==='ask'||item.action==='ask-response'){const ask=asks.find(candidate=>candidate.id===item.askId);if(ask)openAsk(ask);}else openFriend(item.friend);};
  const sendKnock=(friend:Friend)=>{setSocialNotifications(current=>[{id:`sent-${Date.now()}`,friend,text:'you knocked',mark:'👊',time:'now',action:'knock'},...current]);showToast(`Knocked on ${friend.name}`);};
  const sendAsk=(text:string,recipients:string[],audienceLabel:string)=>{const ask:AskPrompt={id:`ask-you-${Date.now()}`,sender:'You',text,recipients,audienceLabel,createdAt:Date.now(),responses:[]};setAsks(current=>[ask,...current.filter(item=>item.sender!=='You')]);setAskComposerOpen(false);showToast(`Ask sent to ${recipients.length} ${recipients.length===1?'friend':'friends'}`);};
  const replyToAsk=(ask:AskPrompt,image:string)=>{setAsks(current=>current.map(item=>item.id===ask.id?{...item,responses:[...item.responses.filter(response=>response.responder!=='You'),{id:`response-you-${Date.now()}`,responder:'You',image,sentAt:'now'}]}:item));setReplyAsk(null);showToast(`Photo sent privately to ${ask.sender}`);};
  return <main className="friend-space" aria-label={backgroundLabel}>
    <header className="circle-header"><div><h1>Circle</h1><p>Your people. Closer.</p></div><nav><button className="bell" onClick={()=>setNotificationsOpen(v=>!v)} aria-label="Open notifications" aria-expanded={notificationsOpen}><Bell size={21} strokeWidth={1.8}/><span/></button><button className="header-invite" onClick={()=>setInviteOpen(v=>!v)}><Plus size={17}/> Invite</button></nav></header>
    <FriendSpace selected={selected} asks={asks} incomingKnock={Boolean(incomingKnock)} onOpen={openFriend} onUser={()=>setComposerOpen(true)} onAsk={openAsk} onOwnAsk={setResponsesAsk} onCreateAsk={()=>setAskComposerOpen(true)}/>
    <button className="circle-count"><Users size={19}/><span>9 close friends</span><ChevronRight size={16}/></button>
    <button className="post-action" onClick={()=>setComposerOpen(true)}><span><Plus size={30}/></span><b>Post</b></button>
    <AnimatePresence>{inviteOpen&&<motion.aside className="quick-invite" initial={{opacity:0,y:-10,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:.97}}><button onClick={()=>setInviteOpen(false)} aria-label="Close invite"><X size={16}/></button><small>INVITE TO YOUR CIRCLE</small><h2>Someone missing?</h2><div><input type="email" aria-label="Email address" placeholder="friend@email.com"/><button onClick={()=>setInviteOpen(false)}><Send size={16}/></button></div></motion.aside>}</AnimatePresence>
    <AnimatePresence>{notificationsOpen&&<NotificationPanel items={socialNotifications} onSelect={selectNotification} onClose={()=>setNotificationsOpen(false)}/>}</AnimatePresence>
    <AnimatePresence>{selected&&<PostViewer friend={selected} onClose={()=>setSelected(null)} onKnock={sendKnock} onNotify={showToast}/>}</AnimatePresence>
    <AnimatePresence>{composerOpen&&<PostComposer onClose={()=>setComposerOpen(false)} onPosted={posted}/>}</AnimatePresence>
    <AnimatePresence>{askComposerOpen&&<AskComposer onClose={()=>setAskComposerOpen(false)} onSend={sendAsk}/>}</AnimatePresence>
    <AnimatePresence>{replyAsk&&<AskReplyModal ask={asks.find(ask=>ask.id===replyAsk.id)||replyAsk} onClose={()=>setReplyAsk(null)} onSend={image=>replyToAsk(replyAsk,image)}/>}</AnimatePresence>
    <AnimatePresence>{responsesAsk&&<AskResponsesModal ask={asks.find(ask=>ask.id===responsesAsk.id)||responsesAsk} onClose={()=>setResponsesAsk(null)}/>}</AnimatePresence>
    <AnimatePresence>{knockReplyOpen&&incomingKnock&&<KnockReplyModal knock={incomingKnock} onClose={()=>setKnockReplyOpen(false)} onSent={()=>{setKnocks(current=>current.map(knock=>knock.id===incomingKnock.id?{...knock,status:'answered'}:knock));setKnockReplyOpen(false);showToast(`Sent to ${incomingKnock.from}`);}}/>}</AnimatePresence>
    <AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:20,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12}}><Check size={16}/>{toast}</motion.div>}</AnimatePresence>
    <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
  </main>;
}
