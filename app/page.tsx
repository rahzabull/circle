'use client';

import type { CSSProperties, ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, ChevronRight, Heart, LockKeyhole, Plus, Send, SmilePlus, Upload, Users, X } from 'lucide-react';

type Friend = {
  name: string; color: string; x: number; y: number; size: number; image: string;
  fresh?: boolean; online?: boolean; time: string; caption: string; photo: string;
};

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

const notifications = [
  { friend:friends[2], text:'liked your photo', mark:'❤️', time:'2m' },
  { friend:friends[3], text:'dropped a meme on your photo', mark:'💀', time:'14m' },
  { friend:friends[4], text:'posted something', mark:'', time:'31m' },
  { friend:friends[1], text:'invited you to a circle', mark:'', time:'2h' },
];

function FloatingFriend({ friend, index, selected, onOpen }:{ friend:Friend; index:number; selected:boolean; onOpen:()=>void }) {
  return (
    <motion.button
      className={`friend ${friend.fresh || friend.online ? 'is-active' : 'is-inactive'}${selected ? ' is-selected' : ''}`}
      style={{ '--offset-x':`${friend.x}px`, '--offset-y':`${friend.y}px`, '--bubble-size':`${friend.size}px`, '--tone':friend.color, '--float-x':`${index % 2 ? -4 : 4}px`, '--float-y':`${index % 3 ? 4 : -3}px`, '--float-delay':`${index * -.83}s` } as CSSProperties}
      initial={{ opacity:0, scale:.82 }} animate={{ opacity:selected ? 0 : 1, scale:1 }}
      transition={{ opacity:{duration:.32,ease:'easeOut'}, scale:{delay:.035*index,type:'spring',stiffness:120,damping:20,mass:.8} }}
      whileHover={{ scale:1.055, zIndex:5, transition:{type:'spring',stiffness:260,damping:24} }} whileTap={{ scale:.97 }}
      onClick={onOpen} aria-label={`Open ${friend.name}'s latest moment`}
    >
      <span className="friend-float"><motion.span className="portrait" layoutId={`avatar-${friend.name}`}><img src={friend.image} alt="" /></motion.span></span>
    </motion.button>
  );
}

function FriendSpace({ selected, onOpen, onUser }:{ selected:Friend|null; onOpen:(friend:Friend)=>void; onUser:()=>void }) {
  return (
    <section className={`bubble-cluster orbital-field${selected ? ' is-muted' : ''}`} aria-label="Your close friends">
      {friends.map((friend,index)=><FloatingFriend friend={friend} index={index} selected={selected?.name===friend.name} onOpen={()=>onOpen(friend)} key={friend.name} />)}
      <motion.button className="you" aria-label="Create a post" onClick={onUser} whileHover={{scale:1.045}} whileTap={{scale:.97}}><img src="https://i.pravatar.cc/240?img=68" alt=""/></motion.button>
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

function MemeReaction({ emoji,label,rotation=0,delay=0 }:{emoji:string;label:string;rotation?:number;delay?:number}) {
  const [expanded,setExpanded]=useState(false);
  return <motion.button className={`meme-reaction${expanded?' expanded':''}`} style={{'--rotate':`${rotation}deg`} as CSSProperties} initial={{opacity:0,y:-28,scale:.5,rotate:rotation-12}} animate={{opacity:1,y:0,scale:expanded?1.55:1,rotate:rotation}} transition={{delay,type:'spring',stiffness:260,damping:16}} onClick={()=>setExpanded(v=>!v)} aria-label={`${label} reaction${expanded?', collapse':', expand'}`}><span>{emoji}</span><b>{label}</b></motion.button>;
}

function MemePicker({ onPick, onClose }:{onPick:(meme:typeof memes[number])=>void;onClose:()=>void}) {
  return <motion.div className="meme-picker" initial={{opacity:0,y:14,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:.96}}>
    <div className="picker-head"><span><b>Drop a feeling</b><small>Say it without saying it.</small></span><button onClick={onClose} aria-label="Close meme picker"><X size={17}/></button></div>
    <div className="meme-grid">{memes.map(meme=><button style={{'--meme-tone':meme.tone} as CSSProperties} onClick={()=>onPick(meme)} key={meme.label}><span>{meme.emoji}</span><b>{meme.label}</b></button>)}</div>
  </motion.div>;
}

function ReactionBar({ liked, setLiked, picker, setPicker, count }:{liked:boolean;setLiked:(v:boolean)=>void;picker:boolean;setPicker:(v:boolean)=>void;count:number}) {
  return <div className="reaction-wrap">
    <div className="reaction-bar">
      <motion.button className={liked?'liked':''} onClick={()=>setLiked(!liked)} whileTap={{scale:.82}} aria-label={liked?'Unlike this moment':'Like this moment'}><Heart size={20} fill={liked?'currentColor':'none'}/><span>{liked?'Liked':'Like'}</span><small>{count}</small></motion.button>
      <i />
      <button onClick={()=>setPicker(!picker)} aria-expanded={picker}><SmilePlus size={20}/><span>Drop a meme</span></button>
    </div>
  </div>;
}

function PostViewer({ friend, onClose }:{friend:Friend;onClose:()=>void}) {
  const [liked,setLiked]=useState(false); const [picker,setPicker]=useState(false);
  const [dropped,setDropped]=useState<(typeof memes[number])[]>([]);
  const pick=(meme:typeof memes[number])=>{ setDropped(current=>[...current,meme]); setPicker(false); };
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
        <div className="sticker-zone">
          <MemeReaction emoji="💀" label="Sam" rotation={-7}/><MemeReaction emoji="🥹" label="Maya" rotation={5} delay={.08}/><MemeReaction emoji="🎬" label="Noah" rotation={-2} delay={.16}/>
          {dropped.map((meme,index)=><MemeReaction emoji={meme.emoji} label="You" rotation={index%2?7:-5} delay={0} key={`${meme.label}-${index}`}/>) }
        </div>
      </div>
      <div className="post-copy"><p>{friend.caption}</p><PrivacyIndicator/></div>
      <ReactionBar liked={liked} setLiked={setLiked} picker={picker} setPicker={setPicker} count={23+(liked?1:0)}/>
      <AnimatePresence>{picker&&<MemePicker onPick={pick} onClose={()=>setPicker(false)}/>}</AnimatePresence>
    </motion.article>
  </motion.div>;
}

function NotificationPanel({ onClose }:{onClose:()=>void}) {
  return <motion.aside className="notification-panel" initial={{opacity:0,y:-14,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.97}} transition={{type:'spring',stiffness:250,damping:22}}>
    <div className="panel-head"><div><small>UPDATES</small><h2>While you were away</h2></div><button onClick={onClose} aria-label="Close notifications"><X size={17}/></button></div>
    <div className="notification-list">{notifications.map((item,index)=><div className={index<2?'unread':''} key={item.friend.name}><img src={item.friend.image} alt=""/><p><b>{item.friend.name}</b> {item.text} {item.mark}<small>{item.time} ago</small></p></div>)}</div>
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
  const [composerOpen,setComposerOpen]=useState(false); const [toast,setToast]=useState(false); const [inviteOpen,setInviteOpen]=useState(false);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setSelected(null);setNotificationsOpen(false);setComposerOpen(false);setInviteOpen(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  const backgroundLabel=useMemo(()=>selected?`${selected.name}'s moment is open`:'Your inner circle', [selected]);
  const posted=()=>{setComposerOpen(false);setToast(true);window.setTimeout(()=>setToast(false),2600);};
  return <main className="friend-space" aria-label={backgroundLabel}>
    <header className="circle-header"><div><h1>Circle</h1><p>Your people. Closer.</p></div><nav><button className="bell" onClick={()=>setNotificationsOpen(v=>!v)} aria-label="Open notifications" aria-expanded={notificationsOpen}><Bell size={21} strokeWidth={1.8}/><span/></button><button className="header-invite" onClick={()=>setInviteOpen(v=>!v)}><Plus size={17}/> Invite</button></nav></header>
    <FriendSpace selected={selected} onOpen={friend=>{setSelected(friend);setNotificationsOpen(false);}} onUser={()=>setComposerOpen(true)}/>
    <button className="circle-count"><Users size={19}/><span>9 close friends</span><ChevronRight size={16}/></button>
    <button className="post-action" onClick={()=>setComposerOpen(true)}><span><Plus size={30}/></span><b>Post</b></button>
    <AnimatePresence>{inviteOpen&&<motion.aside className="quick-invite" initial={{opacity:0,y:-10,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-6,scale:.97}}><button onClick={()=>setInviteOpen(false)} aria-label="Close invite"><X size={16}/></button><small>INVITE TO YOUR CIRCLE</small><h2>Someone missing?</h2><div><input type="email" aria-label="Email address" placeholder="friend@email.com"/><button onClick={()=>setInviteOpen(false)}><Send size={16}/></button></div></motion.aside>}</AnimatePresence>
    <AnimatePresence>{notificationsOpen&&<NotificationPanel onClose={()=>setNotificationsOpen(false)}/>}</AnimatePresence>
    <AnimatePresence>{selected&&<PostViewer friend={selected} onClose={()=>setSelected(null)}/>}</AnimatePresence>
    <AnimatePresence>{composerOpen&&<PostComposer onClose={()=>setComposerOpen(false)} onPosted={posted}/>}</AnimatePresence>
    <AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:20,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12}}><Check size={16}/> Shared with your circle</motion.div>}</AnimatePresence>
    <div className="ambient ambient-a"/><div className="ambient ambient-b"/>
  </main>;
}
