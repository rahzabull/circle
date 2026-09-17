'use client';

import type { CSSProperties, ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, motionValue, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { MotionStyle, MotionValue } from 'framer-motion';
import { Bell, Camera, Check, ChevronRight, Heart, ImagePlus, LockKeyhole, MessageCircleQuestion, Mic, Play, Plus, Send, SmilePlus, Upload, UserRound, Users, X } from 'lucide-react';
import GalaxyBackground from './GalaxyBackground';
import FloatingAstronaut from './FloatingAstronaut';

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
type ReactionKind = 'meme'|'voice'|'selfie'|'photo';
type Reaction = { id:string; type:ReactionKind; label:string; emoji?:string; image?:string; duration?:string };
type SocialNotification = { id:string; friend:Friend; text:string; mark:string; time:string; action:'knock-response'|'reaction'|'ask'|'ask-response'; askId?:string; knockId?:string };
type PhotoPost = { id:string; authorId:string; photo:string; caption:string; createdAt:number; audience:string[]; promptText?:string; promptId?:string; parentPromptId?:string };
type PostDraft = { photo:string; caption:string; audience:string[]; promptText?:string; parentPromptId?:string };
type ActiveSurface = {kind:'post';friend:Friend;promptId?:string}|{kind:'profile';owner:'you'|Friend}|null;
type ActivityVisual = { activity:ActivityState; size:number; separation:number };

const HOUR=60*60*1000;const DAY=24*HOUR;const prototypeNow=Date.now();
const ACTIVITY_THRESHOLDS={active:HOUR,recentlyActive:DAY,quiet:4*DAY,knockCooldown:DAY} as const;
const ASK_LIFETIME=DAY;
const MAX_CIRCLE_FRIENDS=10;
const PLAYER_DIAMETER=110;const PLAYER_RADIUS=PLAYER_DIAMETER/2;const PLAYER_CROWN_OFFSET_Y=-59;const PLAYER_CROWN_RADIUS=30;const PLAYER_COLLISION_GAP=10;
const ADD_FRIEND_BUBBLE={x:-173,y:151,size:64} as const;
const currentUser={id:'you',name:'You',image:'https://i.pravatar.cc/240?img=68',color:'#ff5b63'} as const;
const getActivityState=(friend:Friend,override?:ActivityOverride):ActivityState=>{const latest=Math.max(override?.lastActiveAt??friend.lastActiveAt,override?.lastPostedAt??friend.lastPostedAt);const age=(override?Date.now():prototypeNow)-latest;if(age<=ACTIVITY_THRESHOLDS.active)return'active';if(age<=ACTIVITY_THRESHOLDS.recentlyActive)return'recentlyActive';if(age<=ACTIVITY_THRESHOLDS.quiet)return'quiet';return'inactive';};
const canReceiveKnock=(state:ActivityState)=>state==='quiet'||state==='inactive';
const getIceLevel=(friend:Friend,activity:ActivityState)=>{if(!canReceiveKnock(activity))return 0;const age=prototypeNow-Math.max(friend.lastActiveAt,friend.lastPostedAt);if(activity==='quiet')return Math.min(.58,.3+Math.max(0,age-DAY)/(3*DAY)*.28);return Math.min(.94,.64+Math.max(0,age-5*DAY)/(9*DAY)*.3);};
const ACTIVITY_VISUAL_RULES:Record<ActivityState,{scale:number;min:number;max:number;separation:number}>={active:{scale:1.04,min:112,max:138,separation:0},recentlyActive:{scale:.92,min:94,max:108,separation:8},quiet:{scale:.78,min:74,max:88,separation:18},inactive:{scale:.72,min:74,max:82,separation:28}};
const getTemperatureIcon=(iceLevel:number)=>{
  if(iceLevel<=0)return null;
  if(iceLevel<.43)return '/temperature-inactive.svg';
  if(iceLevel<.6)return '/temperature-quiet.svg';
  if(iceLevel<.8)return '/temperature-recent.svg';
  return '/temperature-active.svg';
};
const getActivityVisual=(friend:Friend,activity:ActivityState):ActivityVisual=>{const rule=ACTIVITY_VISUAL_RULES[activity];return{activity,size:Math.round(Math.min(rule.max,Math.max(rule.min,friend.size*rule.scale))),separation:rule.separation};};

const friends: Friend[] = [
  { name:'Maya', color:'#e7b6a3', x:-115, y:-66, size:130, image:'https://i.pravatar.cc/240?img=47', time:'18 min ago', caption:'We missed the sunset but found this tiny blue hour instead.', photo:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-20*60*1000,lastPostedAt:prototypeNow-18*60*1000 },
  { name:'Noah', color:'#a8c5bb', x:0, y:-109, size:82, image:'https://i.pravatar.cc/240?img=12', time:'Yesterday', caption:'Found a table for eight. You know what that means.', photo:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-30*HOUR,lastPostedAt:prototypeNow-36*HOUR },
  { name:'Ari', color:'#d8c4a0', x:71, y:-189, size:108, image:'https://i.pravatar.cc/240?img=49', time:'3 days ago', caption:'A very serious morning meeting.', photo:'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-54*HOUR,lastPostedAt:prototypeNow-60*HOUR },
  { name:'Sam', color:'#b6b8cc', x:-192, y:19, size:76, image:'https://i.pravatar.cc/240?img=5', time:'14 days ago', caption:'No plans. Perfect day.', photo:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-14*DAY,lastPostedAt:prototypeNow-15*DAY },
  { name:'Vina', color:'#edc3c7', x:111, y:-67, size:124, image:'https://i.pravatar.cc/240?img=32', time:'6 min ago', caption:'Proof we actually left the group chat.', photo:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-12*60*1000,lastPostedAt:prototypeNow-6*60*1000 },
  { name:'Leo', color:'#aabbd1', x:-101, y:63, size:102, image:'https://i.pravatar.cc/240?img=11', time:'4 hours ago', caption:'Borrowed the good camera. Refusing to return it.', photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-30*60*1000,lastPostedAt:prototypeNow-4*HOUR },
  { name:'Inez', color:'#d3b2c3', x:9, y:134, size:132, image:'https://i.pravatar.cc/240?img=44', time:'Saturday', caption:'Tiny dinner, enormous opinions.', photo:'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-35*60*1000,lastPostedAt:prototypeNow-2*DAY },
  { name:'Omar', color:'#a8c9a2', x:96, y:49, size:80, image:'https://i.pravatar.cc/240?img=8', time:'3 days ago', caption:'Took the long way home.', photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-3*DAY,lastPostedAt:prototypeNow-4*DAY },
  { name:'June', color:'#d7c68d', x:123, y:133, size:72, image:'https://i.pravatar.cc/240?img=45', time:'6 days ago', caption:'Soft launch of my new personality: outdoorsy.', photo:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=88',lastActiveAt:prototypeNow-6*DAY,lastPostedAt:prototypeNow-7*DAY },
];

const profilePhotoPool=[
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1100&q=86',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=86',
];
const profileCaptionPool=['Needed this little escape.','A very good day with no plan.','Proof I left the house.','Tiny things worth remembering.','From somewhere between here and home.','Keeping this one.'];
const initialProfilePosts:PhotoPost[]=[
  {id:'you-field',authorId:'you',photo:profilePhotoPool[0],caption:'Found a quiet place and stayed longer than planned.',createdAt:prototypeNow-3*HOUR,audience:friends.map(friend=>friend.name),promptText:'Show me your view right now?',promptId:'ask-you-view'},
  {id:'you-friends',authorId:'you',photo:profilePhotoPool[7],caption:'The people who make the blurry photos worth keeping.',createdAt:prototypeNow-2*DAY,audience:friends.map(friend=>friend.name)},
  {id:'you-desk',authorId:'you',photo:profilePhotoPool[2],caption:'Today’s little corner of the world.',createdAt:prototypeNow-5*DAY,audience:friends.slice(0,6).map(friend=>friend.name)},
  {id:'you-dinner',authorId:'you',photo:profilePhotoPool[4],caption:'Tiny dinner, very loud table.',createdAt:prototypeNow-9*DAY,audience:friends.map(friend=>friend.name)},
  {id:'you-hills',authorId:'you',photo:profilePhotoPool[6],caption:'Took the long way and kept the photo.',createdAt:prototypeNow-14*DAY,audience:friends.slice(1,8).map(friend=>friend.name)},
  ...friends.flatMap((friend,friendIndex)=>{const promptText=friend.name==='Vina'?"What's on your desk right now?":friend.name==='Leo'?'What are you snacking on?':undefined;const latestId=`${friend.name}-latest`;return [
    {id:latestId,authorId:friend.name,photo:friend.photo,caption:friend.caption,createdAt:friend.lastPostedAt,audience:['You'],...(promptText?{promptText,promptId:friend.name==='Vina'?'ask-vina-desk':'ask-leo-snack'}:{})},
    ...Array.from({length:3},(_,postIndex)=>({id:`${friend.name}-archive-${postIndex}`,authorId:friend.name,photo:profilePhotoPool[(friendIndex*2+postIndex+1)%profilePhotoPool.length],caption:profileCaptionPool[(friendIndex+postIndex)%profileCaptionPool.length],createdAt:friend.lastPostedAt-(postIndex+2)*3*DAY,audience:['You']})),
  ];}),
].sort((a,b)=>b.createdAt-a.createdAt);

const formatPostAge=(createdAt:number)=>{const age=Math.max(0,Date.now()-createdAt);if(age<60*1000)return'Just now';if(age<HOUR)return`${Math.max(1,Math.floor(age/(60*1000)))}m ago`;if(age<DAY)return`${Math.floor(age/HOUR)}h ago`;if(age<2*DAY)return'Yesterday';if(age<14*DAY)return`${Math.floor(age/DAY)}d ago`;return`${Math.floor(age/(7*DAY))}w ago`;};

const memes = [
  { label:'WTF', emoji:'😳', tone:'#f3c7bd' }, { label:'Crying', emoji:'😭', tone:'#bcd8e8' },
  { label:'Proud', emoji:'🥹', tone:'#dce7a2' }, { label:'Suspicious', emoji:'🤨', tone:'#dfcfed' },
  { label:'Dead', emoji:'💀', tone:'#ced0cc' }, { label:'Bro…', emoji:'🫠', tone:'#f3d5aa' },
  { label:'Absolute cinema', emoji:'🎬', tone:'#e7b9cf' }, { label:'LMAO', emoji:'😂', tone:'#f4dc72' },
];

const initialAsks:AskPrompt[]=[
  {id:'ask-you-view',sender:'You',text:'Show me your view right now?',recipients:friends.map(friend=>friend.name),audienceLabel:'Everyone',createdAt:Date.now()-1800000,responses:[
    {id:'response-maya',responder:'Maya',image:friends[0].photo,sentAt:'12m'},{id:'response-noah',responder:'Noah',image:friends[1].photo,sentAt:'8m'},{id:'response-inez',responder:'Inez',image:friends[6].photo,sentAt:'2m'},
  ]},
  {id:'ask-vina-desk',sender:'Vina',text:"What's on your desk right now?",recipients:['You','Maya','Noah','Leo'],audienceLabel:'Inner circle',createdAt:Date.now()-420000,responses:[]},
  {id:'ask-leo-snack',sender:'Leo',text:'What are you snacking on?',recipients:['You','Ari','Sam','Inez'],audienceLabel:'4 friends',createdAt:Date.now()-720000,responses:[]},
];
const initialKnocks:Knock[]=[{id:'knock-maya-you',from:'Maya',to:'You',createdAt:Date.now()-120000,status:'waiting'}];
const initialNotifications:SocialNotification[]=[
  {id:'n-ask-response',friend:friends[6],text:'answered your Ask',mark:'📷',time:'2m',action:'ask-response',askId:'ask-you-view'},
  {id:'n-ask',friend:friends[4],text:'asked “Desk photo, right now?”',mark:'↗',time:'7m',action:'ask',askId:'ask-vina-desk'},
  {id:'n-meme',friend:friends[1],text:'reacted with a meme',mark:'😂',time:'5m',action:'reaction'},
  {id:'n-voice',friend:friends[0],text:'sent you a voice reaction',mark:'🎤',time:'12m',action:'reaction'},
  {id:'n-selfie',friend:friends[5],text:'reacted with his face',mark:'🤳',time:'31m',action:'reaction'},
];

const getAskTimeRemaining=(ask:AskPrompt,now:number|null)=>now===null?ASK_LIFETIME:Math.max(0,ask.createdAt+ASK_LIFETIME-now);
const isPendingAskForYou=(ask:AskPrompt,now:number|null)=>ask.recipients.includes('You')&&!ask.responses.some(response=>response.responder==='You')&&getAskTimeRemaining(ask,now)>0;

type BubbleOffset = { x:MotionValue<number>; y:MotionValue<number>; size:MotionValue<string> };

function AskChip({ask,placement='right',now,onOpen}:{ask:AskPrompt;placement?:'left'|'right'|'above';now:number|null;onOpen:()=>void}){
  const remaining=getAskTimeRemaining(ask,now);const progress=Math.min(1,remaining/ASK_LIFETIME);const timeLeft=remaining>=HOUR?`${Math.ceil(remaining/HOUR)}h left`:`${Math.max(1,Math.ceil(remaining/(60*1000)))}m left`;
  return <motion.div className={`ask-prompt ask-${placement}`} onPointerDown={event=>event.stopPropagation()} initial={{opacity:0,scale:.72,y:5}} animate={{opacity:1,scale:1,y:0}}>
    <motion.button className="ask-prompt-icon" style={{'--ask-progress':`${progress*360}deg`} as CSSProperties} onClick={event=>{event.stopPropagation();onOpen();}} whileHover={{scale:1.08,y:-1}} whileTap={{scale:.94}} aria-label={`Open ${ask.sender}'s Ask; ${timeLeft}`} aria-haspopup="dialog" title={timeLeft}><span className="ask-timer-ring" aria-hidden="true"/><img src="/ask-icon.png?v=3" alt="" aria-hidden="true"/></motion.button>
  </motion.div>;
}

function KnockNudge({friend,activity,onSend,onDismiss,onImpact}:{friend:Friend;activity:ActivityState;onSend:()=>boolean;onDismiss:()=>void;onImpact:(active:boolean)=>void}){
  const reduceMotion=useReducedMotion();
  const send=()=>{const sent=onSend();onDismiss();if(sent)onImpact(true);};
  return <motion.div className="knock-nudge is-suggested" onPointerDown={event=>event.stopPropagation()} initial={{opacity:0,scale:.78,y:5}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.72,y:2}} role="group" aria-label={`Knock on ${friend.name}`}>
    <motion.button className="knock-fist" onClick={send} animate={reduceMotion?{}:{y:[0,0,4,0,0],rotate:[0,0,-10,4,0]}} transition={reduceMotion?{duration:0}:{duration:1.05,repeat:Infinity,repeatDelay:3.6}} aria-label={`Knock on ${friend.name}; ${activity}`}>👊</motion.button>
  </motion.div>;
}

function ProfileActions({friend,onKnock,onKick,onDismiss,onImpact}:{friend:Friend;onKnock:()=>boolean;onKick:()=>void;onDismiss:()=>void;onImpact:(active:boolean)=>void}){
  const knock=()=>{const sent=onKnock();onDismiss();if(sent)onImpact(true);};
  return <motion.div className="profile-actions" role="group" aria-label={`Actions for ${friend.name}`} onPointerDown={event=>event.stopPropagation()} initial={{opacity:0,scale:.72,rotate:-8}} animate={{opacity:1,scale:1,rotate:0}} exit={{opacity:0,scale:.72,rotate:6}} transition={{duration:.16,ease:'easeOut'}}>
    <motion.button className="profile-action profile-action-knock" onClick={knock} aria-label={`Knock on ${friend.name}`} title="Knock" whileTap={{scale:.86}}><span aria-hidden="true">👊</span></motion.button>
    <motion.button className="profile-action profile-action-remove" onClick={onKick} aria-label={`Remove ${friend.name} from your circle`} title="Remove from Circle" whileHover={{scale:1.08}} whileTap={{scale:.9}}><X size={28} strokeWidth={3.2}/></motion.button>
  </motion.div>;
}

function FloatingFriend({ friend, index, selected, offset, orbitCounterRotation, ask, askNow, activity, knockNudge, actionsOpen, onHover, onOpen, onAsk, onKnock, onRevealActions, onDismissKnock, onDismissActions, onKick }:{ friend:Friend; index:number; selected:boolean; offset:BubbleOffset; orbitCounterRotation:MotionValue<number>; ask:AskPrompt|null; askNow:number|null; activity:ActivityState; knockNudge:boolean; actionsOpen:boolean; onHover:(index:number|null)=>void; onOpen:()=>void; onAsk:(ask:AskPrompt)=>void; onKnock:(friend:Friend)=>boolean; onRevealActions:(friend:Friend)=>void; onDismissKnock:()=>void; onDismissActions:()=>void; onKick:(friend:Friend)=>void }) {
  const placement:'left'|'right'|'above'=friend.x>25?'right':friend.x<-25?'left':friend.y>100?'above':'left';
  const [knockImpact,setKnockImpact]=useState(false);const [iceDropped,setIceDropped]=useState(false);const [iceBurst,setIceBurst]=useState(0);const reduceMotion=useReducedMotion();const iceLevel=getIceLevel(friend,activity);const temperatureIcon=getTemperatureIcon(iceLevel);
  const impactTimer=useRef<number|undefined>(undefined);
  const handleImpact=useCallback((active:boolean)=>{if(!active){setKnockImpact(false);return;}if(impactTimer.current)window.clearTimeout(impactTimer.current);setIceDropped(true);setIceBurst(value=>value+1);setKnockImpact(true);impactTimer.current=window.setTimeout(()=>setKnockImpact(false),920);},[]);
  const holdTimer=useRef<number|undefined>(undefined);const holdState=useRef<{pointerId:number;startX:number;startY:number;triggered:boolean}|null>(null);const suppressOpenUntil=useRef(0);
  useEffect(()=>()=>{if(holdTimer.current)window.clearTimeout(holdTimer.current);if(impactTimer.current)window.clearTimeout(impactTimer.current);},[]);
  const clearHold=()=>{if(holdTimer.current)window.clearTimeout(holdTimer.current);holdTimer.current=undefined;holdState.current=null;};
  const beginHold=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    if(event.button!==0||!canReceiveKnock(activity))return;
    const pointerId=event.pointerId;clearHold();holdState.current={pointerId,startX:event.clientX,startY:event.clientY,triggered:false};
    holdTimer.current=window.setTimeout(()=>{const state=holdState.current;if(!state||state.pointerId!==pointerId)return;state.triggered=true;suppressOpenUntil.current=performance.now()+1000;onRevealActions(friend);},460);
  };
  const moveHold=(event:ReactPointerEvent<HTMLButtonElement>)=>{const state=holdState.current;if(!state||state.pointerId!==event.pointerId||state.triggered)return;const threshold=event.pointerType==='touch'?14:7;if(Math.hypot(event.clientX-state.startX,event.clientY-state.startY)>=threshold){suppressOpenUntil.current=performance.now()+300;clearHold();}};
  const endHold=(event:ReactPointerEvent<HTMLButtonElement>)=>{const state=holdState.current;if(!state||state.pointerId!==event.pointerId)return;if(state.triggered)suppressOpenUntil.current=performance.now()+500;clearHold();};
  const cancelHold=()=>{clearHold();};
  const openProfile=(event:ReactMouseEvent<HTMLButtonElement>)=>{if(actionsOpen||performance.now()<suppressOpenUntil.current){event.preventDefault();event.stopPropagation();return;}onOpen();};
  return (
    <motion.div
      className={`friend activity-${activity} ${activity==='active'||activity==='recentlyActive'?'is-active':'is-inactive'}${selected ? ' is-selected' : ''}${ask?' has-ask':''}${knockNudge?' has-knock':''}${actionsOpen?' has-profile-actions':''}${iceDropped?' ice-dropped':''}${knockImpact?' is-thawing':''}`}
      style={{ '--offset-x':`${friend.x}px`, '--offset-y':`${friend.y}px`, '--bubble-size':offset.size, '--tone':friend.color, '--ice-level':iceLevel, x:offset.x, y:offset.y, rotate:orbitCounterRotation } as MotionStyle}
      initial={{ opacity:0, scale:.82 }} animate={{ opacity:selected ? 0 : 1, scale:1 }}
      exit={{opacity:0,scale:.68,transition:{duration:.22,ease:'easeIn'}}}
      transition={{ opacity:{duration:.32,ease:'easeOut'}, scale:{delay:.035*index,type:'spring',stiffness:120,damping:20,mass:.8} }}
      onHoverStart={()=>onHover(index)} onHoverEnd={()=>onHover(null)}
    >
      <motion.button className="friend-profile" onClick={openProfile} onPointerDown={beginHold} onPointerMove={moveHold} onPointerUp={endHold} onPointerCancel={cancelHold} onPointerLeave={cancelHold} onContextMenu={event=>{if(canReceiveKnock(activity))event.preventDefault();}} aria-label={`Open ${friend.name}'s latest moment; ${activity} activity${canReceiveKnock(activity)?'; press and hold for actions':''}`} whileHover={{scale:1.075,y:-3.5}} whileTap={{scale:.97,y:0}} transition={{type:'spring',stiffness:270,damping:20}}><span className="friend-float"><motion.span className="portrait" layoutId={`avatar-${friend.name}`} animate={!reduceMotion&&knockImpact?{x:[0,9,-4,3,0],scaleX:[1,.86,1.07,.98,1],scaleY:[1,1.08,.94,1.02,1],rotate:[0,4,-3,1,0]}:{x:0,scaleX:1,scaleY:1,rotate:0}} transition={{duration:reduceMotion?0:.62,ease:'easeInOut',times:[0,.16,.42,.7,1]}}>{knockImpact&&<motion.span className="knock-impact-ring" initial={reduceMotion?{opacity:0}:{opacity:.92,scale:.72}} animate={reduceMotion?{opacity:.45}:{opacity:0,scale:1.42}} transition={{duration:reduceMotion ? .18 : .58,ease:'easeOut'}} aria-hidden="true"/>}<img src={friend.image} alt="" />{knockImpact&&canReceiveKnock(activity)&&<span className="ice-shards" key={iceBurst} aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></span>}</motion.span><b>{friend.name}</b></span></motion.button>
      {temperatureIcon&&<img className={`activity-temperature ${friend.x>0?'is-right':'is-left'}`} src={temperatureIcon} alt="" aria-hidden="true"/>}
      {ask&&<AskChip ask={ask} placement={placement} now={askNow} onOpen={()=>onAsk(ask)}/>}
      <AnimatePresence>{knockNudge&&<KnockNudge friend={friend} activity={activity} onSend={()=>onKnock(friend)} onDismiss={onDismissKnock} onImpact={handleImpact}/>}</AnimatePresence>
      <AnimatePresence>{actionsOpen&&<ProfileActions friend={friend} onKnock={()=>onKnock(friend)} onKick={()=>onKick(friend)} onDismiss={onDismissActions} onImpact={handleImpact}/>}</AnimatePresence>
    </motion.div>
  );
}

function FriendSpace({ selected, asks, activityOverrides, nudgeFriend, actionFriend, removedFriendNames, canAddFriend, onOpen, onUser, onAddFriend, onAsk, onKnock, onRevealActions, onDismissKnock, onDismissActions, onKick }:{ selected:Friend|null; asks:AskPrompt[]; activityOverrides:Record<string,ActivityOverride>; nudgeFriend:string|null; actionFriend:string|null; removedFriendNames:string[]; canAddFriend:boolean; onOpen:(friend:Friend)=>void; onUser:()=>void; onAddFriend:()=>void; onAsk:(ask:AskPrompt)=>void; onKnock:(friend:Friend)=>boolean; onRevealActions:(friend:Friend)=>void; onDismissKnock:()=>void; onDismissActions:()=>void; onKick:(friend:Friend)=>void }) {
  const worldX=useMotionValue(0); const worldY=useMotionValue(0);
  const smoothWorldX=useSpring(worldX,{stiffness:390,damping:40,mass:.92}); const smoothWorldY=useSpring(worldY,{stiffness:390,damping:40,mass:.92});
  const orbitRotation=useMotionValue(0);const orbitCounterRotation=useTransform(orbitRotation,value=>-value);const reduceMotion=useReducedMotion();
  const [isDragging,setIsDragging]=useState(false);
  const [askNow,setAskNow]=useState<number|null>(null);
  const spaceRef=useRef<HTMLElement>(null); const sceneScale=useRef(1.4);
  const drag=useRef({active:false,moved:false,pointerId:-1,startX:0,startY:0,startWorldX:0,startWorldY:0});
  const suppressClick=useRef(false); const hovered=useRef<number|null>(null);
  const momentum=useRef<{x?:ReturnType<typeof animate>;y?:ReturnType<typeof animate>}>({});
  const activityVisuals=useMemo(()=>friends.map(friend=>{const activity=getActivityState(friend,activityOverrides[friend.name]);return getActivityVisual(friend,activity);}),[activityOverrides]);
  const activityVisualsRef=useRef(activityVisuals);
  const bubbleOffsets=useMemo<BubbleOffset[]>(()=>friends.map((_,index)=>({x:motionValue(0),y:motionValue(0),size:motionValue(`${activityVisuals[index].size}px`)})),[]);
  const addBubbleOffset=useMemo<BubbleOffset>(()=>({x:motionValue(0),y:motionValue(0),size:motionValue(`${ADD_FRIEND_BUBBLE.size}px`)}),[]);
  const removedFriendSet=useMemo(()=>new Set(removedFriendNames),[removedFriendNames]);
  const visibleIndices=useRef<number[]>(friends.reduce<number[]>((indices,friend,index)=>{if(!removedFriendSet.has(friend.name))indices.push(index);return indices;},[]));
  const askOwnerIndices=useRef<number[]>(visibleIndices.current.filter(index=>asks.some(ask=>ask.sender===friends[index].name&&isPendingAskForYou(ask,askNow))));
  const askMetrics=useRef({size:34,inset:25,top:-8,outset:5});
  const viewportMetrics=useRef({width:0,height:0,mobile:false,padding:12});
  const attachedControls=useRef({nudgeFriend,actionFriend});

  useEffect(()=>{activityVisualsRef.current=activityVisuals;},[activityVisuals]);
  useEffect(()=>{attachedControls.current={nudgeFriend,actionFriend};},[nudgeFriend,actionFriend]);
  useEffect(()=>{if(reduceMotion){orbitRotation.set(0);return;}const orbit=animate(orbitRotation,360,{duration:240,ease:'linear',repeat:Infinity});return()=>orbit.stop();},[orbitRotation,reduceMotion]);
  useEffect(()=>{let expiryTimer:number|undefined;const update=()=>setAskNow(Date.now());const scheduleNextExpiry=()=>{if(expiryTimer)window.clearTimeout(expiryTimer);const now=Date.now();const nextExpiry=asks.filter(ask=>ask.recipients.includes('You')&&!ask.responses.some(response=>response.responder==='You')).map(ask=>ask.createdAt+ASK_LIFETIME).filter(expiresAt=>expiresAt>now).sort((a,b)=>a-b)[0];if(nextExpiry)expiryTimer=window.setTimeout(()=>{update();scheduleNextExpiry();},nextExpiry-now+25);};update();scheduleNextExpiry();const timer=window.setInterval(update,60*1000);document.addEventListener('visibilitychange',update);window.addEventListener('focus',update);return()=>{window.clearInterval(timer);if(expiryTimer)window.clearTimeout(expiryTimer);document.removeEventListener('visibilitychange',update);window.removeEventListener('focus',update);};},[asks]);
  useEffect(()=>{const visible=friends.reduce<number[]>((indices,friend,index)=>{if(!removedFriendSet.has(friend.name))indices.push(index);return indices;},[]);visibleIndices.current=visible;askOwnerIndices.current=visible.filter(index=>asks.some(ask=>ask.sender===friends[index].name&&isPendingAskForYou(ask,askNow)));},[asks,removedFriendSet,askNow]);

  useEffect(()=>{
    const updateScale=()=>{const element=spaceRef.current;const styles=element?getComputedStyle(element):null;const rect=element?.getBoundingClientRect();const scale=styles?parseFloat(styles.getPropertyValue('--scene-scale')):1.4;const size=styles?parseFloat(styles.getPropertyValue('--ask-icon-size')):34;const inset=styles?parseFloat(styles.getPropertyValue('--ask-icon-inset')):25;const top=styles?parseFloat(styles.getPropertyValue('--ask-icon-top')):-8;const outset=styles?parseFloat(styles.getPropertyValue('--ask-ring-outset')):5;sceneScale.current=Number.isFinite(scale)?scale:1.4;askMetrics.current={size:Number.isFinite(size)?size:34,inset:Number.isFinite(inset)?inset:25,top:Number.isFinite(top)?top:-8,outset:Number.isFinite(outset)?outset:5};viewportMetrics.current={width:rect?.width||window.innerWidth,height:rect?.height||window.innerHeight,mobile:window.matchMedia('(max-width: 700px)').matches,padding:12};};
    updateScale();window.addEventListener('resize',updateScale);window.visualViewport?.addEventListener('resize',updateScale);return()=>{window.removeEventListener('resize',updateScale);window.visualViewport?.removeEventListener('resize',updateScale);};
  },[]);

  useEffect(()=>{
    const bodies=friends.map((_,index)=>({x:0,y:0,vx:0,vy:0,size:activityVisualsRef.current[index].size}));const addBody={x:0,y:0,vx:0,vy:0,size:ADD_FRIEND_BUBBLE.size}; let frame=0; let last=performance.now();
    const tick=(now:number)=>{
      const step=Math.min((now-last)/16.667,2); last=now;
      const force=friends.map(()=>({x:0,y:0}));
      const visible=visibleIndices.current;
      visible.forEach(index=>{
        const friend=friends[index];const visual=activityVisualsRef.current[index];const seedDistance=Math.max(Math.hypot(friend.x,friend.y),1);
        const amplitude=hovered.current===index?0.8:3.5;
        const targetX=friend.x/seedDistance*visual.separation+Math.sin(now*.00034+index*1.71)*amplitude;
        const targetY=friend.y/seedDistance*visual.separation+Math.cos(now*.00029+index*2.03)*amplitude;
        force[index].x+=(targetX-bodies[index].x)*.018;
        force[index].y+=(targetY-bodies[index].y)*.018;
        bodies[index].size+=(visual.size-bodies[index].size)*Math.min(.07*step,1);
      });
      visible.forEach(index=>{const body=bodies[index];
        body.vx=(body.vx+force[index].x*step)*Math.pow(.87,step);body.vy=(body.vy+force[index].y*step)*Math.pow(.87,step);
        body.x+=body.vx*step;body.y+=body.vy*step;
      });
      if(canAddFriend){const targetX=Math.sin(now*.00027+2.4)*2.3;const targetY=Math.cos(now*.00031+1.2)*2.3;addBody.vx=(addBody.vx+(targetX-addBody.x)*.016*step)*Math.pow(.88,step);addBody.vy=(addBody.vy+(targetY-addBody.y)*.016*step)*Math.pow(.88,step);addBody.x+=addBody.vx*step;addBody.y+=addBody.vy*step;}
      const scale=Math.max(sceneScale.current,.01);const worldOffsetX=smoothWorldX.get();const worldOffsetY=smoothWorldY.get();const panX=-worldOffsetX/scale;const panY=-worldOffsetY/scale;const inverseOrbit=-orbitRotation.get()*Math.PI/180;const orbitCos=Math.cos(inverseOrbit);const orbitSin=Math.sin(inverseOrbit);const inverseRotate=(x:number,y:number)=>({x:x*orbitCos-y*orbitSin,y:x*orbitSin+y*orbitCos});const forwardRotate=(x:number,y:number)=>({x:x*orbitCos+y*orbitSin,y:-x*orbitSin+y*orbitCos});const playerPoint=inverseRotate(panX,panY);const crownPoint=inverseRotate(panX,panY+PLAYER_CROWN_OFFSET_Y);const playerX=playerPoint.x;const playerY=playerPoint.y;const crownX=crownPoint.x;const crownY=crownPoint.y;
      const attachmentPosition=(index:number,offsetX:number,offsetY:number)=>{const offset=inverseRotate(offsetX,offsetY);return{x:friendPositionX(index,bodies[index])+offset.x,y:friendPositionY(index,bodies[index])+offset.y};};
      const askPosition=(index:number)=>{const body=bodies[index];return attachmentPosition(index,body.size/2-askMetrics.current.inset+askMetrics.current.size/2,-body.size/2+askMetrics.current.top+askMetrics.current.size/2);};
      const stageToScreen=(x:number,y:number)=>{const rotated=forwardRotate(x,y);const viewport=viewportMetrics.current;return{x:viewport.width/2+worldOffsetX+rotated.x*scale,y:viewport.height/2+worldOffsetY+rotated.y*scale};};
      const keepInsideViewport=(body:{x:number;y:number;vx:number;vy:number},x:number,y:number,radius:number)=>{const viewport=viewportMetrics.current;if(!viewport.mobile||viewport.width<=0||viewport.height<=0)return;const center=stageToScreen(x,y);const screenRadius=radius*scale;const minX=viewport.padding+screenRadius;const maxX=viewport.width-viewport.padding-screenRadius;const minY=viewport.padding+screenRadius;const maxY=viewport.height-viewport.padding-screenRadius;const correctionX=minX>maxX?viewport.width/2-center.x:center.x<minX?minX-center.x:center.x>maxX?maxX-center.x:0;const correctionY=minY>maxY?viewport.height/2-center.y:center.y<minY?minY-center.y:center.y>maxY?maxY-center.y:0;if(correctionX||correctionY){const correction=inverseRotate(correctionX/scale,correctionY/scale);body.x+=correction.x;body.y+=correction.y;body.vx=body.vx*.48+correction.x*.035;body.vy=body.vy*.48+correction.y*.035;}};
      for(let pass=0;pass<7;pass++){
        for(let ai=0;ai<visible.length;ai++)for(let bi=ai+1;bi<visible.length;bi++){const a=visible[ai];const b=visible[bi];
          const dx=(friends[b].x+bodies[b].x)-(friends[a].x+bodies[a].x);const dy=(friends[b].y+bodies[b].y)-(friends[a].y+bodies[a].y);
          const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=(bodies[a].size+bodies[b].size)/2+10;
          if(distance<minimum){const nx=rawDistance<.001?Math.cos(a+b):dx/distance;const ny=rawDistance<.001?Math.sin(a+b):dy/distance;const correction=(minimum-distance)*.505;bodies[a].x-=nx*correction;bodies[a].y-=ny*correction;bodies[b].x+=nx*correction;bodies[b].y+=ny*correction;}
        }
        if(canAddFriend)visible.forEach(index=>{const dx=friendPositionX(index,bodies[index])-(ADD_FRIEND_BUBBLE.x+addBody.x);const dy=friendPositionY(index,bodies[index])-(ADD_FRIEND_BUBBLE.y+addBody.y);const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=(addBody.size+bodies[index].size)/2+10;if(distance<minimum){const nx=rawDistance<.001?Math.cos(index+4):dx/distance;const ny=rawDistance<.001?Math.sin(index+4):dy/distance;const correction=(minimum-distance)*.505;addBody.x-=nx*correction;addBody.y-=ny*correction;bodies[index].x+=nx*correction;bodies[index].y+=ny*correction;addBody.vx-=nx*correction*.016;addBody.vy-=ny*correction*.016;bodies[index].vx+=nx*correction*.016;bodies[index].vy+=ny*correction*.016;}});
        visible.forEach(index=>{const body=bodies[index];
          const dx=friendPositionX(index,body)-playerX;const dy=friendPositionY(index,body)-playerY;const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=(body.size+PLAYER_DIAMETER)/2+PLAYER_COLLISION_GAP;
          if(distance<minimum){const angle=index/friends.length*Math.PI*2;const nx=rawDistance<.001?Math.cos(angle):dx/distance;const ny=rawDistance<.001?Math.sin(angle):dy/distance;const correction=minimum-distance;body.x+=nx*correction;body.y+=ny*correction;body.vx+=nx*correction*.025;body.vy+=ny*correction*.025;}
          const crownDx=friendPositionX(index,body)-crownX;const crownDy=friendPositionY(index,body)-crownY;const rawCrownDistance=Math.hypot(crownDx,crownDy);const crownDistance=Math.max(rawCrownDistance,.001);const crownMinimum=body.size/2+PLAYER_CROWN_RADIUS+PLAYER_COLLISION_GAP;
          if(crownDistance<crownMinimum){const nx=rawCrownDistance<.001?0:crownDx/crownDistance;const ny=rawCrownDistance<.001?-1:crownDy/crownDistance;const correction=crownMinimum-crownDistance;body.x+=nx*correction;body.y+=ny*correction;body.vx+=nx*correction*.025;body.vy+=ny*correction*.025;}
        });
        if(canAddFriend){let addX=ADD_FRIEND_BUBBLE.x+addBody.x;let addY=ADD_FRIEND_BUBBLE.y+addBody.y;const playerDx=addX-playerX;const playerDy=addY-playerY;const rawPlayerDistance=Math.hypot(playerDx,playerDy);const playerDistance=Math.max(rawPlayerDistance,.001);const playerMinimum=(addBody.size+PLAYER_DIAMETER)/2+PLAYER_COLLISION_GAP;if(playerDistance<playerMinimum){const nx=rawPlayerDistance<.001?-Math.SQRT1_2:playerDx/playerDistance;const ny=rawPlayerDistance<.001?Math.SQRT1_2:playerDy/playerDistance;const correction=playerMinimum-playerDistance;addBody.x+=nx*correction;addBody.y+=ny*correction;addBody.vx+=nx*correction*.025;addBody.vy+=ny*correction*.025;addX+=nx*correction;addY+=ny*correction;}const crownDx=addX-crownX;const crownDy=addY-crownY;const rawCrownDistance=Math.hypot(crownDx,crownDy);const crownDistance=Math.max(rawCrownDistance,.001);const crownMinimum=addBody.size/2+PLAYER_CROWN_RADIUS+PLAYER_COLLISION_GAP;if(crownDistance<crownMinimum){const nx=rawCrownDistance<.001?0:crownDx/crownDistance;const ny=rawCrownDistance<.001?-1:crownDy/crownDistance;const correction=crownMinimum-crownDistance;addBody.x+=nx*correction;addBody.y+=ny*correction;addBody.vx+=nx*correction*.025;addBody.vy+=ny*correction*.025;}}
        const iconRadius=askMetrics.current.size/2+askMetrics.current.outset;
        askOwnerIndices.current.forEach(owner=>{
          let {x:iconX,y:iconY}=askPosition(owner);
          visible.forEach(index=>{
            if(index===owner)return;
            const dx=friendPositionX(index,bodies[index])-iconX;const dy=friendPositionY(index,bodies[index])-iconY;const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=iconRadius+bodies[index].size/2+8;
            if(distance<minimum){const nx=rawDistance<.001?Math.cos(owner+index):dx/distance;const ny=rawDistance<.001?Math.sin(owner+index):dy/distance;const correction=(minimum-distance)*.505;bodies[owner].x-=nx*correction;bodies[owner].y-=ny*correction;bodies[index].x+=nx*correction;bodies[index].y+=ny*correction;bodies[owner].vx-=nx*correction*.018;bodies[owner].vy-=ny*correction*.018;bodies[index].vx+=nx*correction*.018;bodies[index].vy+=ny*correction*.018;iconX-=nx*correction;iconY-=ny*correction;}
          });
          if(canAddFriend){const dx=ADD_FRIEND_BUBBLE.x+addBody.x-iconX;const dy=ADD_FRIEND_BUBBLE.y+addBody.y-iconY;const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=iconRadius+addBody.size/2+8;if(distance<minimum){const nx=rawDistance<.001?-Math.SQRT1_2:dx/distance;const ny=rawDistance<.001?Math.SQRT1_2:dy/distance;const correction=(minimum-distance)*.505;bodies[owner].x-=nx*correction;bodies[owner].y-=ny*correction;addBody.x+=nx*correction;addBody.y+=ny*correction;bodies[owner].vx-=nx*correction*.018;bodies[owner].vy-=ny*correction*.018;addBody.vx+=nx*correction*.018;addBody.vy+=ny*correction*.018;iconX-=nx*correction;iconY-=ny*correction;}}
          const playerDx=iconX-playerX;const playerDy=iconY-playerY;const rawPlayerDistance=Math.hypot(playerDx,playerDy);const playerDistance=Math.max(rawPlayerDistance,.001);const playerMinimum=iconRadius+PLAYER_RADIUS+8;
          if(playerDistance<playerMinimum){const nx=rawPlayerDistance<.001?Math.SQRT1_2:playerDx/playerDistance;const ny=rawPlayerDistance<.001?-Math.SQRT1_2:playerDy/playerDistance;const correction=playerMinimum-playerDistance;bodies[owner].x+=nx*correction;bodies[owner].y+=ny*correction;bodies[owner].vx+=nx*correction*.02;bodies[owner].vy+=ny*correction*.02;iconX+=nx*correction;iconY+=ny*correction;}
          const crownDx=iconX-crownX;const crownDy=iconY-crownY;const rawCrownDistance=Math.hypot(crownDx,crownDy);const crownDistance=Math.max(rawCrownDistance,.001);const crownMinimum=iconRadius+PLAYER_CROWN_RADIUS+8;
          if(crownDistance<crownMinimum){const nx=rawCrownDistance<.001?0:crownDx/crownDistance;const ny=rawCrownDistance<.001?-1:crownDy/crownDistance;const correction=crownMinimum-crownDistance;bodies[owner].x+=nx*correction;bodies[owner].y+=ny*correction;bodies[owner].vx+=nx*correction*.02;bodies[owner].vy+=ny*correction*.02;}
        });
        for(let a=0;a<askOwnerIndices.current.length;a++)for(let b=a+1;b<askOwnerIndices.current.length;b++){
          const ownerA=askOwnerIndices.current[a];const ownerB=askOwnerIndices.current[b];const iconA=askPosition(ownerA);const iconB=askPosition(ownerB);const dx=iconB.x-iconA.x;const dy=iconB.y-iconA.y;const rawDistance=Math.hypot(dx,dy);const distance=Math.max(rawDistance,.001);const minimum=iconRadius*2+8;
          if(distance<minimum){const nx=rawDistance<.001?Math.SQRT1_2:dx/distance;const ny=rawDistance<.001?Math.SQRT1_2:dy/distance;const correction=(minimum-distance)*.505;bodies[ownerA].x-=nx*correction;bodies[ownerA].y-=ny*correction;bodies[ownerB].x+=nx*correction;bodies[ownerB].y+=ny*correction;}
        }
        const viewport=viewportMetrics.current;
        if(viewport.mobile){
          visible.forEach(index=>{const body=bodies[index];keepInsideViewport(body,friendPositionX(index,body),friendPositionY(index,body),body.size/2+2);});
          askOwnerIndices.current.forEach(owner=>{const icon=askPosition(owner);keepInsideViewport(bodies[owner],icon.x,icon.y,iconRadius);});
          visible.forEach(index=>{const body=bodies[index];const friend=friends[index];if(attachedControls.current.nudgeFriend===friend.name){const nudge=attachmentPosition(index,0,-body.size/2+27);keepInsideViewport(body,nudge.x,nudge.y,22);}if(attachedControls.current.actionFriend===friend.name){const actionSize=Math.min(56,Math.max(42,body.size*.46));const knock=attachmentPosition(index,body.size/2-actionSize*.19,-body.size/2-actionSize*.08);const remove=attachmentPosition(index,body.size/2+actionSize*.17,body.size/2-actionSize*.11);keepInsideViewport(body,knock.x,knock.y,actionSize/2+4);keepInsideViewport(body,remove.x,remove.y,actionSize/2+4);}});
          if(canAddFriend)keepInsideViewport(addBody,ADD_FRIEND_BUBBLE.x+addBody.x,ADD_FRIEND_BUBBLE.y+addBody.y,addBody.size/2+2);
        }
      }
      bodies.forEach((body,index)=>{
        bubbleOffsets[index].x.set(body.x);bubbleOffsets[index].y.set(body.y);bubbleOffsets[index].size.set(`${body.size.toFixed(2)}px`);
      });
      if(canAddFriend){addBubbleOffset.x.set(addBody.x);addBubbleOffset.y.set(addBody.y);}
      frame=requestAnimationFrame(tick);
    };
    const friendPositionX=(index:number,body:{x:number})=>friends[index].x+body.x;
    const friendPositionY=(index:number,body:{y:number})=>friends[index].y+body.y;
    frame=requestAnimationFrame(tick); return()=>cancelAnimationFrame(frame);
  },[addBubbleOffset,bubbleOffsets,canAddFriend,smoothWorldX,smoothWorldY]);

  const returnWorldToCenter=()=>{
    momentum.current.x?.stop();momentum.current.y?.stop();
    const transition={type:'spring' as const,stiffness:72,damping:19,mass:1.15,restDelta:.25};
    momentum.current.x=animate(worldX,0,transition);momentum.current.y=animate(worldY,0,transition);
  };
  const pointerDown=(event:ReactPointerEvent<HTMLElement>)=>{
    const target=event.target as HTMLElement;if(!target.closest('.profile-actions'))onDismissActions();
    if(event.button!==0||selected||target.closest('.you,.friend-profile,.profile-actions,.add-person-bubble'))return;
    momentum.current.x?.stop(); momentum.current.y?.stop();
    worldX.set(smoothWorldX.get());worldY.set(smoothWorldY.get());
    drag.current={active:true,moved:false,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,startWorldX:worldX.get(),startWorldY:worldY.get()};
  };
  const pointerMove=(event:ReactPointerEvent<HTMLElement>)=>{
    const state=drag.current;if(!state.active||state.pointerId!==event.pointerId)return;
    const dx=event.clientX-state.startX;const dy=event.clientY-state.startY;
    if(!state.moved&&Math.hypot(dx,dy)<7)return;
    if(!state.moved){state.moved=true;suppressClick.current=true;setIsDragging(true);event.currentTarget.setPointerCapture(event.pointerId);}
    const nextWorldX=state.startWorldX-dx;const nextWorldY=state.startWorldY-dy;
    worldX.set(nextWorldX);worldY.set(nextWorldY);
  };
  const pointerEnd=(event:ReactPointerEvent<HTMLElement>)=>{
    const state=drag.current;if(!state.active||state.pointerId!==event.pointerId)return;
    state.active=false;
    if(state.moved){
      setIsDragging(false);
      window.setTimeout(()=>{suppressClick.current=false;},0);
    }
    returnWorldToCenter();
  };
  return (
    <section ref={spaceRef} className={`social-space orbital-field${selected ? ' is-muted' : ''}${isDragging?' is-dragging':''}`} aria-label="Your close friends" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();}}}>
      <motion.div className="world-layer" style={{x:smoothWorldX,y:smoothWorldY}}>
        <div className="world-stage">
          <motion.div className="world-orbit" style={{rotate:orbitRotation}}>
            <AnimatePresence>{friends.map((friend,index)=>removedFriendSet.has(friend.name)?null:<FloatingFriend friend={friend} index={index} selected={selected?.name===friend.name} offset={bubbleOffsets[index]} orbitCounterRotation={orbitCounterRotation} ask={asks.find(ask=>ask.sender===friend.name&&isPendingAskForYou(ask,askNow))||null} askNow={askNow} activity={activityVisuals[index].activity} knockNudge={nudgeFriend===friend.name} actionsOpen={actionFriend===friend.name} onHover={value=>{hovered.current=value;}} onOpen={()=>onOpen(friend)} onAsk={onAsk} onKnock={onKnock} onRevealActions={onRevealActions} onDismissKnock={onDismissKnock} onDismissActions={onDismissActions} onKick={onKick} key={friend.name} />)}</AnimatePresence>
            <AnimatePresence>{canAddFriend&&<motion.button className="add-person-bubble" style={{'--add-x':`${ADD_FRIEND_BUBBLE.x}px`,'--add-y':`${ADD_FRIEND_BUBBLE.y}px`,'--bubble-size':addBubbleOffset.size,x:addBubbleOffset.x,y:addBubbleOffset.y,rotate:orbitCounterRotation} as MotionStyle} onPointerDown={event=>event.stopPropagation()} onClick={onAddFriend} initial={{opacity:0,scale:.75}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.7}} whileHover={{scale:1.07,y:-3}} whileTap={{scale:.92,y:0}} aria-label="Add a person to your Circle"><Plus size={26} strokeWidth={2.1}/></motion.button>}</AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
      <div className="player-layer"><div className="player-anchor"><motion.button className="you" aria-label="Open your profile feed" onClick={onUser} whileHover={{scale:1.045}} whileTap={{scale:.97}}><img className="you-avatar" src={currentUser.image} alt=""/><img className="player-crown" src="/crown.png" alt="" aria-hidden="true" draggable={false}/></motion.button></div></div>
    </section>
  );
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
    {reaction.type==='photo'&&<img src={reaction.image} alt="Your photo response"/>}
  </motion.button>;
}

function VoiceReaction({onSend,onClose}:{onSend:()=>void;onClose:()=>void}){
  const [ready,setReady]=useState(false);const [recording,setRecording]=useState(false);const timer=useRef<number|undefined>(undefined);
  useEffect(()=>()=>{if(timer.current)window.clearTimeout(timer.current);},[]);
  const start=(event:ReactPointerEvent<HTMLButtonElement>)=>{event.currentTarget.setPointerCapture(event.pointerId);setRecording(true);timer.current=window.setTimeout(()=>{setRecording(false);setReady(true);},3000);};
  const stop=()=>{if(!recording)return;if(timer.current)window.clearTimeout(timer.current);setRecording(false);setReady(true);};
  return <motion.div className="reaction-tool voice-tool" initial={{opacity:0,y:10,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:7,scale:.96}}>
    <button className="tool-close" onClick={onClose} aria-label="Close voice note"><X size={14}/></button>
    {!ready?<button className={`hold-voice${recording?' recording':''}`} aria-label="Record a three-second voice note" onPointerDown={start} onPointerUp={stop} onPointerCancel={stop} onClick={()=>{if(!recording)setReady(true);}}><span><Mic size={23}/></span><b>{recording?'Recording…':'Hold to record'}</b><small>{recording?'Release when you’re done · 3 sec max':'A tiny private voice note'}</small></button>:<><div className="voice-preview"><button aria-label="Play voice note"><Play size={13} fill="currentColor"/></button><i className="mini-wave"><em/><em/><em/><em/><em/><em/></i><b>0:03</b></div><button className="tool-send" onClick={onSend}><Send size={14}/> Send note</button></>}
  </motion.div>;
}

function PostViewer({ friend, post, onClose, onNotify, onViewProfile, onAddYours }:{friend:Friend;post?:PhotoPost;onClose:()=>void;onNotify:(text:string)=>void;onViewProfile:(friend:Friend)=>void;onAddYours:(post:PhotoPost)=>void}) {
  const [liked,setLiked]=useState(false);const [picker,setPicker]=useState(false);const [tool,setTool]=useState<'voice'|null>(null);
  const [reactions,setReactions]=useState<Reaction[]>([{id:'voice-maya',type:'voice',label:'Maya',duration:'0:03'}]);
  const photo=post?.photo||friend.photo;const caption=post?.caption||friend.caption;
  const addReaction=(reaction:Reaction)=>{setReactions(current=>[...current,reaction]);setPicker(false);setTool(null);onNotify(reaction.type==='photo'?'Photo response sent privately':reaction.type==='voice'?'3-second note sent privately':'Reaction sent privately');};
  const pick=(meme:typeof memes[number])=>{addReaction({id:`meme-${Date.now()}`,type:'meme',label:'You',emoji:meme.emoji});setPicker(false);};
  return <motion.div className="viewer-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <motion.button className="viewer-backdrop" onClick={onClose} aria-label="Close moment" />
    <motion.article className="post-viewer" initial={{opacity:0,y:36,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:26,scale:.96}} transition={{type:'spring',stiffness:175,damping:23}}>
      <header className="post-head">
        <div className="post-person"><motion.span layoutId={`avatar-${friend.name}`} style={{background:friend.color}}><img src={friend.image} alt=""/></motion.span><p><b>{friend.name}</b><small>{friend.time}</small></p><button className="post-profile-link" onClick={()=>onViewProfile(friend)} aria-label={`View ${friend.name}'s profile feed`}><UserRound size={14}/><span>Profile</span></button></div>
        <div className="post-head-actions"><button className="post-close" onClick={onClose} aria-label="Close moment"><X size={20}/></button></div>
      </header>
      {post?.promptText&&<div className="post-prompt-intro"><small>{friend.name} asked</small><h2>“{post.promptText}”</h2></div>}
      <div className="post-photo-wrap">
        <motion.img className="post-photo" src={photo} alt={`${friend.name}'s latest moment`} initial={{scale:1.035}} animate={{scale:1}} transition={{duration:.65,ease:[.2,.8,.2,1]}}/>
        <div className="photo-wash" />
        <div className="reaction-objects">{reactions.map((reaction,index)=><ReactionObject reaction={reaction} index={index} key={reaction.id}/>)}</div>
      </div>
      <div className="post-copy"><p>{caption}</p>{post?.promptText&&<button className="post-add-yours" onClick={()=>onAddYours(post)}>Add yours <ChevronRight size={15}/></button>}</div>
      <div className="post-actions-row" role="group" aria-label="Private responses">
        <button className={liked?'liked':''} aria-pressed={liked} onClick={()=>{setPicker(false);setTool(null);setLiked(current=>{const next=!current;onNotify(next?'Loved privately':'Love removed');return next;});}}><Heart size={17} fill={liked?'currentColor':'none'}/><span>{liked?'Loved':'Love it'}</span></button>
        <button className={picker?'active':''} aria-expanded={picker} onClick={()=>{setPicker(value=>!value);setTool(null);}}><SmilePlus size={17}/><span>React</span></button>
        <button className={tool==='voice'?'active':''} aria-expanded={tool==='voice'} onClick={()=>{setTool(current=>current==='voice'?null:'voice');setPicker(false);}}><Mic size={17}/><span>3 sec note</span></button>
        <label className="post-action-upload"><ImagePlus size={17}/><span>Photo back</span><input type="file" accept="image/*" aria-label={`Send a photo back to ${friend.name}`} onChange={event=>{const file=event.target.files?.[0];if(file){addReaction({id:`photo-${Date.now()}`,type:'photo',label:'You',image:URL.createObjectURL(file)});event.currentTarget.value='';}}}/></label>
      </div>
      <AnimatePresence>{picker&&<MemePicker onPick={pick} onClose={()=>setPicker(false)}/>}</AnimatePresence>
      <AnimatePresence>{tool==='voice'&&<VoiceReaction onClose={()=>setTool(null)} onSend={()=>addReaction({id:`voice-${Date.now()}`,type:'voice',label:'You',duration:'0:03'})}/>}</AnimatePresence>
    </motion.article>
  </motion.div>;
}

function AskResponsesModal({ask,onClose}:{ask:AskPrompt;onClose:()=>void}){
  const dialog=useRef<HTMLElement>(null);
  useEffect(()=>{const element=dialog.current;if(!element)return;element.focus();const trap=(event:KeyboardEvent)=>{if(event.key!=='Tab')return;const controls=Array.from(element.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(control=>!control.hasAttribute('disabled'));if(!controls.length){event.preventDefault();element.focus();return;}const first=controls[0];const last=controls[controls.length-1];if(document.activeElement===element){event.preventDefault();(event.shiftKey?last:first).focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};element.addEventListener('keydown',trap);return()=>element.removeEventListener('keydown',trap);},[]);
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose} aria-label="Close Ask responses" tabIndex={-1}/><motion.section ref={dialog} className="ask-responses" role="dialog" aria-modal="true" aria-labelledby="ask-responses-heading" tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}} initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close responses"><X size={17}/></button><h2 id="ask-responses-heading">{ask.text}</h2><div className="response-summary"><span>{ask.responses.length} {ask.responses.length===1?'response':'responses'}</span><i>{ask.recipients.length} asked</i></div>{ask.responses.length?<div className="ask-response-grid">{ask.responses.map(response=>{const responder=friends.find(friend=>friend.name===response.responder);return <article key={response.id}><img src={response.image} alt={`${response.responder}'s response`}/><footer>{responder&&<img src={responder.image} alt=""/>}<span><b>{response.responder}</b><small>{response.sentAt} ago</small></span></footer></article>;})}</div>:<div className="ask-empty"><Camera size={25}/><b>No replies yet</b><span>Your Ask lives in Notifications. Replies will land here.</span></div>}<p><LockKeyhole size={13}/> Responses are private to you.</p></motion.section></motion.div>;
}

function KnockResponseComposer({knock,onClose,onSend}:{knock:Knock;onClose:()=>void;onSend:(response:KnockResponse)=>void}){
  const [preview,setPreview]=useState<string|null>(null);const [status,setStatus]=useState('');const sender=friends.find(friend=>friend.name===knock.from);const quickStatuses=['Alive.','At work 😭','Gym.','Rotting.'];
  const upload=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setPreview(typeof reader.result==='string'?reader.result:null);reader.readAsDataURL(file);};
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose} aria-label="Close Knock response"/><motion.section className="ritual-modal knock-response-composer" role="dialog" aria-modal="true" aria-label={`${knock.from} knocked. Show us you're alive.`} initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close"><X size={17}/></button><div className="knock-response-head">{sender&&<img src={sender.image} alt=""/>}<span><h2>Show us you’re alive.</h2></span></div><label className={`knock-photo${preview?' has-preview':''}`}>{preview?<img src={preview} alt="Your Knock response"/>:<><Camera size={24}/><b>Photo proof</b><small>Upload something from right now</small></>}<input type="file" accept="image/*" onChange={upload}/></label><div className="knock-capture-actions"><button onClick={()=>setPreview('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=88')}><Camera size={15}/> Camera <small>mock</small></button><button onClick={()=>setPreview('https://i.pravatar.cc/600?img=68')}><span>🤳</span> Quick selfie</button></div><label className="knock-status"><span>Or send a tiny status</span><input value={status} onChange={event=>setStatus(event.target.value)} maxLength={36} placeholder="Alive."/><small>{status.length}/36</small></label><div className="knock-status-chips">{quickStatuses.map(item=><button className={status===item?'active':''} onClick={()=>setStatus(item)} key={item}>{item}</button>)}</div><p className="ritual-lock"><LockKeyhole size={13}/> This goes only to {knock.from}.</p><button className="ritual-send" disabled={!preview&&!status.trim()} onClick={()=>onSend({image:preview||undefined,status:status.trim()||undefined,sentAt:Date.now()})}><Send size={15}/> Send proof of life</button></motion.section></motion.div>;
}

function KnockResponseViewer({knock,onClose}:{knock:Knock;onClose:()=>void}){
  const friend=friends.find(item=>item.name===knock.to);return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><button className="modal-backdrop" onClick={onClose} aria-label="Close Knock response"/><motion.section className="ritual-modal knock-response-viewer" role="dialog" aria-modal="true" aria-label={`${knock.to} responded. Proof of life.`} initial={{opacity:0,y:28,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:18,scale:.97}}><button className="ritual-close" onClick={onClose} aria-label="Close"><X size={17}/></button><div className="knock-response-head">{friend&&<img src={friend.image} alt=""/>}<span><h2>Proof of life. 👊</h2></span></div>{knock.response?.image&&<img className="knock-response-photo" src={knock.response.image} alt={`${knock.to}'s Knock response`}/>}<blockquote>{knock.response?.status||'Alive. You can stop worrying now.'}</blockquote><p className="ritual-lock"><Check size={13}/> {knock.to} is active again. Knock cooldown: 24 hours.</p></motion.section></motion.div>;
}

function NotificationPanel({ items,ownAsk,onSelect,onOpenOwnAsk,onClose }:{items:SocialNotification[];ownAsk:AskPrompt|null;onSelect:(item:SocialNotification)=>void;onOpenOwnAsk:(ask:AskPrompt)=>void;onClose:()=>void}) {
  const initialFocus=useRef<HTMLButtonElement>(null);
  useEffect(()=>{initialFocus.current?.focus();},[]);
  return <motion.aside className="notification-panel" role="dialog" aria-labelledby="notifications-heading" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}} initial={{opacity:0,y:-14,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.97}} transition={{type:'spring',stiffness:250,damping:22}}>
    <div className="panel-head"><div><h2 id="notifications-heading">While you were away</h2></div><button ref={ownAsk?undefined:initialFocus} onClick={onClose} aria-label="Close notifications"><X size={17}/></button></div>
    {ownAsk&&<button ref={initialFocus} className="notification-my-ask" onClick={()=>onOpenOwnAsk(ownAsk)} aria-label={`Your Ask: ${ownAsk.text}`}><span><MessageCircleQuestion size={18}/></span><p><b>{ownAsk.text}</b><em>{ownAsk.responses.length?`${ownAsk.responses.length} ${ownAsk.responses.length===1?'reply':'replies'} · View all`:'Waiting for replies'}</em></p><ChevronRight size={16}/></button>}
    <div className="notification-list">{items.map((item,index)=><button className={index<2?'unread':''} onClick={()=>onSelect(item)} key={item.id}><img src={item.friend.image} alt=""/><p><b>{item.friend.name}</b> {item.text} {item.mark}<small>{item.time} ago</small></p>{item.action==='knock-response'&&<em>View</em>}{item.action==='ask'&&<em>Answer</em>}{item.action==='ask-response'&&<em>View</em>}</button>)}</div>
    <p className="panel-foot"><LockKeyhole size={13}/> Only activity from your circle lives here.</p>
  </motion.aside>;
}

function KnockPanel({items,onSelect,onClose}:{items:Knock[];onSelect:(knock:Knock)=>void;onClose:()=>void}){
  const closeButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{closeButton.current?.focus();},[]);
  return <motion.aside id="knock-inbox" className="notification-panel knock-panel" role="dialog" aria-labelledby="knock-inbox-heading" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}} initial={{opacity:0,y:-14,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.97}} transition={{type:'spring',stiffness:250,damping:22}}>
    <div className="panel-head"><div><h2 id="knock-inbox-heading">Who’s checking in</h2></div><button ref={closeButton} onClick={onClose} aria-label="Close Knocks"><X size={17}/></button></div>
    {items.length?<div className="notification-list knock-list">{items.map(knock=>{const sender=friends.find(friend=>friend.name===knock.from);const waiting=knock.status==='waiting';return <button className={waiting?'unread':''} disabled={!waiting} onClick={()=>waiting&&onSelect(knock)} key={knock.id}>{sender?<img src={sender.image} alt=""/>:<span className="knock-avatar-fallback">👊</span>}<p><b>{knock.from}</b> knocked 👊<small>{waiting?'Show them you’re alive.':'You responded.'}</small></p><em>{waiting?'Respond':'Done'}</em></button>;})}</div>:<div className="knock-empty"><span>👊</span><b>No Knocks yet</b><small>When someone checks on you, it’ll appear here.</small></div>}
    <p className="panel-foot"><LockKeyhole size={13}/> Knocks stay separate from your other updates.</p>
  </motion.aside>;
}

function ProfileFeed({owner,posts,onClose,onCreatePost,onAddYours}:{owner:'you'|Friend;posts:PhotoPost[];onClose:()=>void;onCreatePost:()=>void;onAddYours:(post:PhotoPost)=>void}){
  const isSelf=owner==='you';const person=isSelf?currentUser:owner;const closeButton=useRef<HTMLButtonElement>(null);const headingId=`profile-feed-${person.name.toLowerCase().replaceAll(' ','-')}`;
  useEffect(()=>{closeButton.current?.focus();},[]);
  return <motion.div className="profile-feed-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button className="profile-feed-backdrop" onClick={onClose} aria-label="Close profile feed" tabIndex={-1}/>
    <motion.section className="profile-feed" role="dialog" aria-modal="true" aria-labelledby={headingId} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}} initial={{opacity:0,y:34,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:22,scale:.98}} transition={{type:'spring',stiffness:205,damping:24}}>
      <header className="profile-feed-head"><span className="profile-feed-avatar" style={{background:person.color}}><img src={person.image} alt=""/></span><div className="profile-feed-identity"><h2 id={headingId}>{isSelf?'Your moments':`${person.name}'s moments`}</h2><p>{posts.length} {posts.length===1?'photo':'photos'} · Visible inside the circle</p></div><div className="profile-feed-actions">{isSelf&&<button className="profile-feed-create" onClick={onCreatePost}><Plus size={15}/> Post</button>}<button ref={closeButton} className="profile-feed-close" onClick={onClose} aria-label="Back to Circle"><X size={19}/></button></div></header>
      <div className="profile-feed-title"><small><LockKeyhole size={12}/> Circle only</small></div>
      <div className="profile-feed-scroll">{posts.length?<div className="profile-feed-grid">{posts.map(post=><figure className={`profile-feed-card${post.promptText?' is-prompt':''}${post.parentPromptId?' is-response':''}`} key={post.id}>{post.promptText&&<div className="profile-prompt-copy"><small>{isSelf?'You':person.name} asked</small><b>“{post.promptText}”</b></div>}<img src={post.photo} alt={post.caption||`${person.name}'s photo`}/><figcaption>{post.parentPromptId&&<span className="profile-response-label">Added yours</span>}<b>{post.caption||'A moment without a caption.'}</b><small>{formatPostAge(post.createdAt)}</small>{post.promptText&&(isSelf?<span className="profile-prompt-status"><MessageCircleQuestion size={13}/> Friends can add theirs</span>:<button className="profile-add-yours" onClick={()=>onAddYours(post)}>Add yours <ChevronRight size={14}/></button>)}</figcaption></figure>)}</div>:<div className="profile-feed-empty"><ImagePlus size={26}/><b>No moments yet</b><small>{isSelf?'Your next post will appear here.':`${person.name} hasn’t shared anything yet.`}</small></div>}</div>
    </motion.section>
  </motion.div>;
}

function PostComposer({ circleFriends, respondingTo, onClose, onPosted }:{circleFriends:Friend[];respondingTo:PhotoPost|null;onClose:()=>void;onPosted:(draft:PostDraft)=>void}) {
  const [preview,setPreview]=useState<string|null>(null); const [caption,setCaption]=useState('');const [asking,setAsking]=useState(false);const [promptText,setPromptText]=useState('');const fileInput=useRef<HTMLInputElement>(null);const pickerOpened=useRef(false);
  const promptAuthor=circleFriends.find(friend=>friend.name===respondingTo?.authorId);const parentPromptId=respondingTo?.promptId||respondingTo?.id;
  const [selected,setSelected]=useState(()=>respondingTo&&promptAuthor?[promptAuthor.name]:circleFriends.slice(0,8).map(friend=>friend.name));
  useEffect(()=>{if(respondingTo&&!pickerOpened.current){pickerOpened.current=true;window.requestAnimationFrame(()=>fileInput.current?.click());}},[respondingTo]);
  const change=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setPreview(typeof reader.result==='string'?reader.result:null);reader.readAsDataURL(file);};
  const toggle=(name:string)=>setSelected(v=>v.includes(name)?v.filter(item=>item!==name):[...v,name]);
  const removePrompt=()=>{setAsking(false);setPromptText('');};const canPost=Boolean(preview&&selected.length>0&&(!asking||promptText.trim()));
  return <motion.div className="modal-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button className="modal-backdrop" onClick={onClose} aria-label="Close composer"/>
    <motion.section className="composer" initial={{opacity:0,y:40,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:.97}} transition={{type:'spring',stiffness:190,damping:23}}>
      <div className="composer-head"><span><h2>{respondingTo?'Add yours':'Share with your people'}</h2></span><button onClick={onClose} aria-label="Close"><X size={19}/></button></div>
      {respondingTo?.promptText&&<div className="composer-response-context"><small>Responding to {promptAuthor?.name||respondingTo.authorId}</small><strong>“{respondingTo.promptText}”</strong></div>}
      <label className={`upload-zone${preview?' has-preview':''}`}>{preview?<img src={preview} alt="Your selected upload"/>:<><span><Upload size={22}/></span><b>{respondingTo?'Choose your response':'Choose a photo'}</b><small>{respondingTo?'Fresh from your camera or library':'Something your people would want to see'}</small></>}<input ref={fileInput} type="file" accept="image/*" onChange={change}/></label>
      {!respondingTo&&preview&&<div className={`composer-prompt${asking?' is-active':''}`}><motion.button className="composer-prompt-toggle" type="button" aria-expanded={asking} onClick={()=>asking?removePrompt():setAsking(true)} whileHover={{y:-1}} whileTap={{scale:.96}}><MessageCircleQuestion size={16}/><span>{asking?'Asking friends':'Ask friends'} ✦</span></motion.button><AnimatePresence initial={false}>{asking&&<motion.div className="composer-prompt-fields" initial={{height:0,opacity:0,y:-4}} animate={{height:'auto',opacity:1,y:0}} exit={{height:0,opacity:0,y:-4}} transition={{duration:.24,ease:[.2,.8,.2,1]}}><label><span>What should everyone share?</span><input autoFocus value={promptText} onChange={event=>setPromptText(event.target.value)} maxLength={90} placeholder="What's on your desk right now?"/><small>{promptText.length}/90</small></label><button type="button" onClick={removePrompt}><X size={13}/> Remove</button></motion.div>}</AnimatePresence></div>}
      <label className="caption-field"><span>Caption <small>optional</small></span><textarea value={caption} onChange={e=>setCaption(e.target.value)} maxLength={120} placeholder="What’s the story?"/><small>{caption.length}/120</small></label>
      <div className="audience"><div><span><Users size={15}/> Who can see this?</span><small>{selected.length} friends</small></div><div className="audience-faces">{circleFriends.map(friend=><button className={selected.includes(friend.name)?'active':''} onClick={()=>toggle(friend.name)} aria-label={`${selected.includes(friend.name)?'Remove':'Add'} ${friend.name}`} key={friend.name}><img src={friend.image} alt=""/><i><Check size={9}/></i><small>{friend.name}</small></button>)}</div></div>
      <button className="share-button" onClick={()=>preview&&onPosted({photo:preview,caption:caption.trim(),audience:selected,promptText:asking?promptText.trim()||undefined:undefined,parentPromptId:respondingTo?parentPromptId:undefined})} disabled={!canPost}><Send size={17}/> {respondingTo?'Post response':asking?'Post & ask friends':'Post'}</button>
      <p className="composer-privacy"><LockKeyhole size={13}/> Encrypted in transit. Never public.</p>
    </motion.section>
  </motion.div>;
}

export default function Home() {
  const [activeSurface,setActiveSurface]=useState<ActiveSurface>(null); const [notificationsOpen,setNotificationsOpen]=useState(false);const [knocksOpen,setKnocksOpen]=useState(false);
  const [composerOpen,setComposerOpen]=useState(false);const [respondingToPost,setRespondingToPost]=useState<PhotoPost|null>(null); const [toast,setToast]=useState<string|null>(null); const [inviteOpen,setInviteOpen]=useState(false);const [inviteEmail,setInviteEmail]=useState('');const [pendingInvites,setPendingInvites]=useState<string[]>([]);const [profilePosts,setProfilePosts]=useState<PhotoPost[]>(initialProfilePosts);
  const [knocks,setKnocks]=useState<Knock[]>(initialKnocks);const [knockComposerId,setKnockComposerId]=useState<string|null>(null);const [knockResponseId,setKnockResponseId]=useState<string|null>(null);const [nudgeFriend,setNudgeFriend]=useState<string|null>(null);const [actionFriend,setActionFriend]=useState<string|null>(null);const [removedFriendNames,setRemovedFriendNames]=useState<string[]>([]);const [knockCooldowns,setKnockCooldowns]=useState<Record<string,number>>({});const [activityOverrides,setActivityOverrides]=useState<Record<string,ActivityOverride>>({});const [asks,setAsks]=useState<AskPrompt[]>(initialAsks);const [responsesAsk,setResponsesAsk]=useState<AskPrompt|null>(null);const [socialNotifications,setSocialNotifications]=useState(initialNotifications);
  const circleFriends=useMemo(()=>friends.filter(friend=>!removedFriendNames.includes(friend.name)),[removedFriendNames]);
  const circleSeatsUsed=Math.min(MAX_CIRCLE_FRIENDS,circleFriends.length+pendingInvites.length);const circleSpotsLeft=Math.max(0,MAX_CIRCLE_FRIENDS-circleSeatsUsed);const circleAtCapacity=circleSpotsLeft===0;
  const toastTimer=useRef<number|undefined>(undefined);const responseTimers=useRef<number[]>([]);const removedFriendNamesRef=useRef<Set<string>>(new Set());const pendingInvitesRef=useRef<string[]>([]);const bellRef=useRef<HTMLButtonElement>(null);const knockInboxRef=useRef<HTMLButtonElement>(null);const inviteTriggerRef=useRef<HTMLButtonElement>(null);const inviteCloseRef=useRef<HTMLButtonElement>(null);const inviteWasOpen=useRef(false);const incomingKnocks=knocks.filter(knock=>knock.to==='You'&&knock.status==='waiting');const receivedKnocks=knocks.filter(knock=>knock.to==='You').sort((a,b)=>b.createdAt-a.createdAt);const knockComposer=knocks.find(knock=>knock.id===knockComposerId)||null;const knockResponse=knocks.find(knock=>knock.id===knockResponseId&&knock.status==='responded')||null;
  const showToast=(message:string)=>{setToast(message);if(toastTimer.current)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(null),2600);};
  useEffect(()=>{const timer=window.setTimeout(()=>{let stored:Record<string,number>={};try{stored=JSON.parse(window.localStorage.getItem('circle-knock-cooldowns')||'{}') as Record<string,number>;}catch{stored={};}setKnockCooldowns(stored);const visit=Number(window.sessionStorage.getItem('circle-knock-visit')||'0')+1;window.sessionStorage.setItem('circle-knock-visit',String(visit));if(visit%3!==0){const eligible=friends.filter(friend=>canReceiveKnock(getActivityState(friend))&&Date.now()-(stored[friend.name]||0)>=ACTIVITY_THRESHOLDS.knockCooldown);if(eligible.length)setNudgeFriend(eligible[visit%eligible.length].name);}},0);return()=>window.clearTimeout(timer);},[]);
  useEffect(()=>{removedFriendNamesRef.current=new Set(removedFriendNames);},[removedFriendNames]);
  useEffect(()=>{pendingInvitesRef.current=pendingInvites;},[pendingInvites]);
  useEffect(()=>{if(inviteOpen){inviteWasOpen.current=true;window.requestAnimationFrame(()=>inviteCloseRef.current?.focus());}else if(inviteWasOpen.current){inviteWasOpen.current=false;window.requestAnimationFrame(()=>inviteTriggerRef.current?.focus());}},[inviteOpen]);
  useEffect(()=>{const timers=responseTimers.current;const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setActiveSurface(null);setNotificationsOpen(false);setKnocksOpen(false);setComposerOpen(false);setRespondingToPost(null);setInviteOpen(false);setKnockComposerId(null);setKnockResponseId(null);setResponsesAsk(null);setActionFriend(null);}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(toastTimer.current)window.clearTimeout(toastTimer.current);timers.forEach(timer=>window.clearTimeout(timer));};},[]);
  const selected=activeSurface?.kind==='post'?activeSurface.friend:null;
  const backgroundLabel=useMemo(()=>activeSurface?.kind==='post'?`${activeSurface.friend.name}'s moment is open`:activeSurface?.kind==='profile'?`${activeSurface.owner==='you'?'Your':`${activeSurface.owner.name}'s`} profile feed is open`:'Your inner circle', [activeSurface]);
  const posted=(draft:PostDraft)=>{const id=`you-${Date.now()}`;const post:PhotoPost={id,authorId:'you',photo:draft.photo,caption:draft.caption,createdAt:Date.now(),audience:draft.audience,promptText:draft.promptText,promptId:draft.promptText?`prompt-${id}`:undefined,parentPromptId:draft.parentPromptId};const wasResponse=Boolean(draft.parentPromptId);const wasPrompt=Boolean(draft.promptText);setProfilePosts(current=>[post,...current]);if(wasResponse&&respondingToPost?.promptId)setAsks(current=>current.map(ask=>ask.id===respondingToPost.promptId?{...ask,responses:[...ask.responses.filter(response=>response.responder!=='You'),{id:`response-you-${Date.now()}`,responder:'You',image:draft.photo,sentAt:'now'}]}:ask));setComposerOpen(false);setRespondingToPost(null);setActiveSurface({kind:'profile',owner:'you'});showToast(wasResponse?'Added yours to the prompt':wasPrompt?'Posted · friends can add theirs':'Shared with your circle');};
  const startPost=()=>{setRespondingToPost(null);setActionFriend(null);setComposerOpen(true);};
  const addYours=(post:PhotoPost)=>{setActiveSurface(null);setRespondingToPost(post);setNotificationsOpen(false);setKnocksOpen(false);setComposerOpen(true);};
  const openFriend=(friend:Friend)=>{setActiveSurface({kind:'post',friend});setNotificationsOpen(false);setKnocksOpen(false);setActionFriend(null);};
  const openProfile=(owner:'you'|Friend)=>{setActiveSurface({kind:'profile',owner});setNotificationsOpen(false);setKnocksOpen(false);setActionFriend(null);};
  const openAsk=(ask:AskPrompt)=>{setNotificationsOpen(false);setKnocksOpen(false);setActionFriend(null);if(ask.sender==='You'){setResponsesAsk(ask);return;}const friend=friends.find(item=>item.name===ask.sender);if(friend)setActiveSurface({kind:'post',friend,promptId:ask.id});};
  const closeNotifications=()=>{setNotificationsOpen(false);window.requestAnimationFrame(()=>bellRef.current?.focus());};
  const closeKnocks=()=>{setKnocksOpen(false);window.requestAnimationFrame(()=>knockInboxRef.current?.focus());};
  const closeResponses=()=>{setResponsesAsk(null);window.requestAnimationFrame(()=>bellRef.current?.focus());};
  const sendCircleInvite=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const email=inviteEmail.trim().toLowerCase();const current=pendingInvitesRef.current;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast('Enter a valid email address');return;}if(current.includes(email)){showToast('That invite is already pending');return;}if(circleFriends.length+current.length>=MAX_CIRCLE_FRIENDS){showToast('Your Circle is limited to 10 friends');return;}const next=[...current,email];pendingInvitesRef.current=next;setPendingInvites(next);setInviteEmail('');setInviteOpen(false);const spotsLeft=Math.max(0,MAX_CIRCLE_FRIENDS-circleFriends.length-next.length);showToast(spotsLeft===0?'Invite sent · your final spot is reserved':`Invite sent · ${spotsLeft} ${spotsLeft===1?'spot':'spots'} left`);};
  const selectNotification=(item:SocialNotification)=>{setNotificationsOpen(false);if(item.action==='knock-response'){setKnockResponseId(item.knockId||null);}else if(item.action==='ask'||item.action==='ask-response'){const ask=asks.find(candidate=>candidate.id===item.askId);if(ask)openAsk(ask);}else openFriend(item.friend);};
  const selectKnock=(knock:Knock)=>{setKnocksOpen(false);if(knock.status==='waiting')setKnockComposerId(knock.id);};
  const revealActions=(friend:Friend)=>{if(!canReceiveKnock(getActivityState(friend,activityOverrides[friend.name])))return;setNudgeFriend(null);setActionFriend(friend.name);};
  const sendKnock=(friend:Friend)=>{const now=Date.now();if(now-(knockCooldowns[friend.name]||0)<ACTIVITY_THRESHOLDS.knockCooldown){showToast(`${friend.name} is on Knock cooldown`);return false;}const knock:Knock={id:`knock-you-${friend.name}-${now}`,from:'You',to:friend.name,createdAt:now,status:'sent'};setKnocks(current=>[knock,...current]);setKnockCooldowns(current=>{const next={...current,[friend.name]:now};window.localStorage.setItem('circle-knock-cooldowns',JSON.stringify(next));return next;});const timer=window.setTimeout(()=>{if(removedFriendNamesRef.current.has(friend.name))return;const response:KnockResponse={image:friend.photo,status:['Alive.','At work 😭','Gym.','Rotting.'][friends.indexOf(friend)%4],sentAt:Date.now()};setKnocks(current=>current.map(item=>item.id===knock.id?{...item,status:'responded',response}:item));setActivityOverrides(current=>({...current,[friend.name]:{lastActiveAt:Date.now(),lastPostedAt:Date.now()}}));setSocialNotifications(current=>[{id:`response-${knock.id}`,friend,text:'sent proof of life',mark:'📷',time:'now',action:'knock-response',knockId:knock.id},...current]);showToast(`${friend.name} sent proof of life`);},6500);responseTimers.current.push(timer);return true;};
  const kickOut=(friend:Friend)=>{if(!canReceiveKnock(getActivityState(friend,activityOverrides[friend.name])))return;removedFriendNamesRef.current=new Set([...removedFriendNamesRef.current,friend.name]);setRemovedFriendNames(current=>current.includes(friend.name)?current:[...current,friend.name]);setActionFriend(null);setNudgeFriend(current=>current===friend.name?null:current);setKnocks(current=>current.filter(knock=>knock.from!==friend.name&&knock.to!==friend.name));setAsks(current=>current.filter(ask=>ask.sender!==friend.name).map(ask=>({...ask,recipients:ask.recipients.filter(name=>name!==friend.name),responses:ask.responses.filter(response=>response.responder!==friend.name)})));setSocialNotifications(current=>current.filter(item=>item.friend.name!==friend.name));setActiveSurface(current=>current&&((current.kind==='post'&&current.friend.name===friend.name)||(current.kind==='profile'&&current.owner!=='you'&&current.owner.name===friend.name))?null:current);showToast(`${friend.name} removed from your circle`);};
  const respondToKnock=(knock:Knock,response:KnockResponse)=>{setKnocks(current=>current.map(item=>item.id===knock.id?{...item,status:'responded',response}:item));setKnockComposerId(null);showToast(`Proof of life sent to ${knock.from}`);};
  return <main className="friend-space" aria-label={backgroundLabel}>
    <GalaxyBackground/>
    <FloatingAstronaut/>
    <header className="circle-header"><div><h1>Circle</h1><p>Your people. Closer.</p></div><nav><button ref={knockInboxRef} className="knock-inbox-trigger" onClick={()=>{setKnocksOpen(value=>!value);setNotificationsOpen(false);}} aria-label={knocksOpen?'Close Knocks':'Open Knocks'} aria-expanded={knocksOpen} aria-controls="knock-inbox"><span>👊</span><b>Knock</b>{incomingKnocks.length>0&&<i>{incomingKnocks.length}</i>}</button><button ref={bellRef} className="bell" onClick={()=>{setNotificationsOpen(value=>!value);setKnocksOpen(false);}} aria-label={notificationsOpen?'Close notifications':'Open notifications'} aria-expanded={notificationsOpen}><Bell size={21} strokeWidth={1.8}/><span/></button></nav></header>
    <FriendSpace selected={selected} asks={asks} activityOverrides={activityOverrides} nudgeFriend={nudgeFriend} actionFriend={actionFriend} removedFriendNames={removedFriendNames} canAddFriend={!circleAtCapacity} onOpen={openFriend} onUser={()=>openProfile('you')} onAddFriend={()=>{setActionFriend(null);setNotificationsOpen(false);setKnocksOpen(false);setInviteOpen(true);}} onAsk={openAsk} onKnock={sendKnock} onRevealActions={revealActions} onDismissKnock={()=>setNudgeFriend(null)} onDismissActions={()=>setActionFriend(null)} onKick={kickOut}/>
    <button ref={inviteTriggerRef} className={`circle-count${circleAtCapacity?' is-full':''}`} onClick={()=>setInviteOpen(v=>!v)} aria-label={circleAtCapacity?'Circle at capacity, maximum 10 close friends':`Add people to your circle, ${circleSpotsLeft} ${circleSpotsLeft===1?'spot':'spots'} remaining`} aria-expanded={inviteOpen} aria-controls="quick-invite"><Users size={19}/><span>{circleFriends.length} close friends{pendingInvites.length>0?` · ${pendingInvites.length} pending`:''}</span><i>{circleSeatsUsed}/{MAX_CIRCLE_FRIENDS}</i><Plus size={17}/></button>
    <AnimatePresence>{inviteOpen&&<motion.aside id="quick-invite" className={`quick-invite${circleAtCapacity?' is-full':''}`} role="dialog" aria-modal="false" aria-labelledby="quick-invite-title" initial={{opacity:0,y:10,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:6,scale:.97}}><button ref={inviteCloseRef} onClick={()=>setInviteOpen(false)} aria-label="Close invite"><X size={16}/></button><h2 id="quick-invite-title">{circleAtCapacity?'Your Circle is full':'Someone missing?'}</h2><p className="invite-capacity">{circleAtCapacity?`Maximum ${MAX_CIRCLE_FRIENDS} friends${pendingInvites.length>0?` · ${pendingInvites.length} invite pending`:''}.`:`${circleSpotsLeft} ${circleSpotsLeft===1?'spot':'spots'} left in your Circle.`}</p><form onSubmit={sendCircleInvite}><input type="email" aria-label="Email address" placeholder={circleAtCapacity?'Maximum reached':'friend@email.com'} value={inviteEmail} onChange={event=>setInviteEmail(event.target.value)} disabled={circleAtCapacity} required/><button type="submit" aria-label="Send invite" disabled={circleAtCapacity||inviteEmail.trim().length===0}><Send size={16}/></button></form></motion.aside>}</AnimatePresence>
    <button className="post-action" onClick={startPost}><span><Plus size={30}/></span><b>Post</b></button>
    <AnimatePresence>{knocksOpen&&<KnockPanel items={receivedKnocks} onSelect={selectKnock} onClose={closeKnocks}/>}</AnimatePresence>
    <AnimatePresence>{notificationsOpen&&<NotificationPanel items={socialNotifications} ownAsk={asks.find(ask=>ask.sender==='You')||null} onSelect={selectNotification} onOpenOwnAsk={openAsk} onClose={closeNotifications}/>}</AnimatePresence>
    <AnimatePresence mode="wait">{activeSurface?.kind==='post'?<PostViewer key={`post-${activeSurface.friend.name}-${activeSurface.promptId||'latest'}`} friend={activeSurface.friend} post={profilePosts.find(post=>activeSurface.promptId?post.promptId===activeSurface.promptId:post.authorId===activeSurface.friend.name)} onClose={()=>setActiveSurface(null)} onNotify={showToast} onViewProfile={friend=>openProfile(friend)} onAddYours={addYours}/>:activeSurface?.kind==='profile'?<ProfileFeed key={`profile-${activeSurface.owner==='you'?'you':activeSurface.owner.name}`} owner={activeSurface.owner} posts={profilePosts.filter(post=>post.authorId===(activeSurface.owner==='you'?'you':activeSurface.owner.name))} onClose={()=>setActiveSurface(null)} onCreatePost={()=>{setActiveSurface(null);startPost();}} onAddYours={addYours}/>:null}</AnimatePresence>
    <AnimatePresence>{composerOpen&&<PostComposer key={respondingToPost?.id||'new-post'} circleFriends={circleFriends} respondingTo={respondingToPost} onClose={()=>{setComposerOpen(false);setRespondingToPost(null);}} onPosted={posted}/>}</AnimatePresence>
    <AnimatePresence>{responsesAsk&&<AskResponsesModal ask={asks.find(ask=>ask.id===responsesAsk.id)||responsesAsk} onClose={closeResponses}/>}</AnimatePresence>
    <AnimatePresence>{knockComposer&&<KnockResponseComposer knock={knockComposer} onClose={()=>setKnockComposerId(null)} onSend={response=>respondToKnock(knockComposer,response)}/>}</AnimatePresence>
    <AnimatePresence>{knockResponse&&<KnockResponseViewer knock={knockResponse} onClose={()=>setKnockResponseId(null)}/>}</AnimatePresence>
    <AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:20,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12}}><Check size={16}/>{toast}</motion.div>}</AnimatePresence>
    <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
  </main>;
}
