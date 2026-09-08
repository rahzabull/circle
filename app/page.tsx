'use client';

import { useEffect, useRef, useState } from 'react';

type DuckState = 'idle' | 'surprised' | 'typing' | 'walking' | 'inspected' | 'celebrating';
type SceneType = 'home' | 'experiment' | 'photos' | 'bob' | 'office' | 'auth' | 'bigger' | 'locker' | 'open' | 'cooking';
type StoryBeat = { year: string; eyebrow: string; title: string; copy: string; beats?: string[]; state: DuckState; scene: SceneType };

const storyBeats: StoryBeat[] = [
  { year: 'Home', eyebrow: 'A much smaller desk', title: 'He came home.', copy: 'And started trying to build something better.', state: 'typing', scene: 'home' },
  { year: 'The first idea', eyebrow: 'Sketch. Encrypt. Repeat.', title: 'It wasn’t even a photo app.', copy: 'The first experiments were end-to-end encrypted and device-first.', beats: ['Device first sounded like a good idea.', 'Until it didn’t.', 'So we built an app instead.'], state: 'surprised', scene: 'experiment' },
  { year: '2022', eyebrow: 'The first big milestone', title: 'Ente Photos.', copy: 'A private home for photos—built without the part where strangers learn everything about you.', state: 'celebrating', scene: 'photos' },
  { year: 'Co-founder', eyebrow: 'An office chair approaches', title: 'Then Bob showed up.', copy: 'They stared at the same laptop for a while. It went surprisingly well.', state: 'idle', scene: 'bob' },
  { year: 'The team', eyebrow: 'Two desks. Nine chairs.', title: 'Then a few more people joined.', copy: 'The tiny office filled with computers, whiteboards, coffee, and absolutely no personal space.', state: 'walking', scene: 'office' },
  { year: 'Photos → Auth', eyebrow: 'One code escaped', title: 'We started with Photos.', copy: 'Then we built Auth.', beats: ['Private photos.', 'Private 2FA codes.'], state: 'surprised', scene: 'auth' },
  { year: 'More room', eyebrow: 'Structural optimism', title: 'We needed more room.', copy: 'The walls moved out. The desks stopped touching. The ceiling finally exhaled.', state: 'celebrating', scene: 'bigger' },
  { year: '2024', eyebrow: 'One very serious vault', title: 'Ente Locker.', copy: 'Photos were private. 2FA codes were private. So… why stop there?', beats: ['Passports. IDs. Documents.', 'Handle checked twice.'], state: 'inspected', scene: 'locker' },
  { year: 'Building in the open', eyebrow: 'No mysterious charts', title: 'Out in the open.', copy: 'We decided to build the company the same way we build the product.', beats: ['No secret growth charts.', 'No mysterious “trust us” numbers.', 'Just the numbers.'], state: 'idle', scene: 'open' },
  { year: 'Today', eyebrow: 'Around 20 people', title: 'Still cooking.', copy: 'Still independent. Still building. Still figuring things out.', beats: ['Photos. Auth. Locker.', 'Needs more encryption.'], state: 'celebrating', scene: 'cooking' },
];

const companyStats = [
  { label: 'Revenue', value: 'Connect', key: 'revenue' },
  { label: 'Active users', value: 'Connect', key: 'activeUsers' },
  { label: 'Team size', value: '≈ 20', key: 'teamSize' },
  { label: 'Countries', value: 'Connect', key: 'countries' },
];

function Ducky({ state = 'idle', label = 'Ducky' }: { state?: DuckState; label?: string }) {
  return (
    <div className={`ducky ducky--${state}`} role="img" aria-label={label}>
      <div className="duck-shadow" />
      <div className="duck-body">
        <div className="duck-wing duck-wing--left" /><div className="duck-wing duck-wing--right" />
        <div className="duck-head">
          <span className="duck-eye duck-eye--left" /><span className="duck-eye duck-eye--right" />
          <span className="duck-brow duck-brow--left" /><span className="duck-brow duck-brow--right" />
          <span className="duck-bill" /><span className="duck-cheek duck-cheek--left" /><span className="duck-cheek duck-cheek--right" />
        </div>
        <div className="duck-foot duck-foot--left" /><div className="duck-foot duck-foot--right" />
      </div>
      <div className="ceo-tie" />
    </div>
  );
}

function Laptop() {
  return <div className="laptop" aria-hidden="true"><div className="laptop-screen"><i /><i /><i /></div><div className="laptop-base" /></div>;
}

function TinyPeople({ count = 8 }: { count?: number }) {
  return <div className="tiny-people" aria-hidden="true">{Array.from({ length: count }, (_, i) => <span key={i} style={{ '--n': i } as React.CSSProperties}><i /></span>)}</div>;
}

function BigTechOffice() {
  return (
    <div className="bigtech-world" aria-hidden="true">
      <div className="server-wall">{Array.from({ length: 18 }, (_, i) => <span key={i}><i /></span>)}</div>
      <div className="data-pipes"><i /><i /><i /><i /></div>
      <div className="profile-machine"><b>PROFILE</b><span>BUILDING…</span><i /></div>
      <div className="photo-belt">{['▧', '▥', '▧', '▤', '▧'].map((item, i) => <span key={i}>{item}</span>)}</div>
      <div className="google-badge">VISITOR<br /><b>VISHNU</b></div>
    </div>
  );
}

function Bob() {
  return <div className="bob-character" aria-label="Bob, co-founder"><div className="bob-head"><i /><i /></div><div className="bob-body" /><div className="office-chair"><i /><i /></div><span>BOB</span></div>;
}

function StoryVisual({ scene }: { scene: SceneType }) {
  if (scene === 'home') return <div className="prop-layer home-room" aria-hidden="true"><div className="tiny-room"><div className="window">⌂</div><div className="family-frame">♥</div><div className="tiny-desk"><Laptop /></div><div className="backpack">BACK<br />PACK</div></div></div>;
  if (scene === 'experiment') return <div className="prop-layer experiment-rig" aria-hidden="true"><div className="device device--phone">PHONE</div><div className="device device--laptop">LAPTOP</div><div className="device device--drive">DRIVE</div><div className="cable cable--one" /><div className="cable cable--two" /><div className="cable cable--three" /><div className="collapse-label">until it didn’t</div></div>;
  if (scene === 'photos') return <div className="prop-layer photos-reveal" aria-hidden="true"><div className="photo-wall">{Array.from({ length: 15 }, (_, i) => <span key={i} style={{ '--n': i } as React.CSSProperties}>◆</span>)}</div><div className="product-stamp">2022<br /><b>PHOTOS</b></div></div>;
  if (scene === 'bob') return <div className="prop-layer bob-arrives"><Bob /><div className="shared-laptop"><Laptop /></div><div className="awkward-pause">…</div></div>;
  if (scene === 'office') return <div className="prop-layer small-office" aria-hidden="true"><div className="office-walls" /><TinyPeople count={11} /><div className="desk-row">▰ ▰ ▰</div><div className="coffee-row">☕ ☕ ☕ ☕</div><div className="whiteboard">SHIP IT<br />FIX IT<br />SHIP IT</div></div>;
  if (scene === 'auth') return <div className="prop-layer auth-morph" aria-hidden="true"><div className="fading-photos">{Array.from({ length: 10 }, (_, i) => <i key={i}>◆</i>)}</div><div className="auth-blocks">{['2', '7', '4', '1', '9', '0'].map((x, i) => <b key={`${x}-${i}`} style={{ '--n': i } as React.CSSProperties}>{x}</b>)}</div><div className="caught-code">7</div></div>;
  if (scene === 'bigger') return <div className="prop-layer bigger-office" aria-hidden="true"><div className="expanding-wall expanding-wall--left" /><div className="expanding-wall expanding-wall--right" /><div className="rising-ceiling" /><TinyPeople count={13} /></div>;
  if (scene === 'locker') return <div className="prop-layer vault-scene" aria-hidden="true"><div className="falling-papers">{['ID', 'PASS', 'DOC', 'KEY'].map((x, i) => <i key={x} style={{ '--n': i } as React.CSSProperties}>{x}</i>)}</div><div className="vault"><div className="vault-door"><i /><b>×</b></div><span>VERY IMPORTANT<br />DUCKUMENTS</span></div><div className="double-check">click&nbsp;&nbsp; click</div></div>;
  if (scene === 'open') return <div className="prop-layer open-company"><div className="open-code" aria-hidden="true">{'{ privacy: true, ownership: yours }'}</div><div className="live-stats">{companyStats.map(stat => <div className="stat" data-stat={stat.key} key={stat.key}><span>{stat.label}</span><b>{stat.value}</b><i>LIVE</i></div>)}</div></div>;
  return <div className="prop-layer cooking-scene" aria-hidden="true"><TinyPeople count={20} /><div className="cooking-pot"><div className="pot-steam">{'{ }'} &nbsp; 🔒 &nbsp; ▧</div><span>PHOTOS</span><span>AUTH</span><span>LOCKER</span></div><div className="taste-note">needs more encryption</div></div>;
}

function StorySection({ item, index }: { item: StoryBeat; index: number }) {
  return (
    <section className={`chapter milestone milestone--${item.scene}`} data-year={item.year} data-parallax-scene>
      <div className="scene milestone-stage">
        <div className="milestone-copy" data-parallax="-72" data-parallax-x={index % 2 ? '20' : '-20'}>
          <span className="chapter-number">{String(index + 1).padStart(2, '0')}</span>
          <p>{item.eyebrow}</p><h2>{item.title}</h2><div className="milestone-line" />
          <p className="milestone-desc">{item.copy}</p>
          {item.beats?.map((beat, beatIndex) => <p className={`story-beat story-beat--${beatIndex}`} key={beat}>{beat}</p>)}
        </div>
        <div className="milestone-props" data-parallax="-138" data-parallax-x={index % 2 ? '-34' : '34'}><StoryVisual scene={item.scene} /></div>
        <div className="milestone-duck" data-parallax="54" data-parallax-x={index % 2 ? '16' : '-16'}><Ducky state={item.state} label={`Ducky during ${item.title}`} /></div>
      </div>
    </section>
  );
}

export default function Home() {
  const shellRef = useRef<HTMLElement>(null);
  const [currentYear, setCurrentYear] = useState('Google');

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const parallaxItems = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
    const parallaxScenes = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax-scene]'));
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty('--page-progress', String(max ? window.scrollY / max : 0));
      const viewportMiddle = window.innerHeight / 2;
      parallaxScenes.forEach(scene => {
        const rect = scene.getBoundingClientRect();
        const shift = Math.max(-1, Math.min(1, (viewportMiddle - (rect.top + rect.height / 2)) / ((rect.height + window.innerHeight) / 2)));
        const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
        scene.style.setProperty('--scene-progress', String(progress));
        scene.style.setProperty('--scene-bg-y', `${reducedMotion.matches ? 0 : shift * -44}px`);
      });
      if (!reducedMotion.matches) parallaxItems.forEach(item => {
        const scene = item.closest<HTMLElement>('[data-parallax-scene]') || item;
        const rect = scene.getBoundingClientRect();
        const shift = Math.max(-1, Math.min(1, (viewportMiddle - (rect.top + rect.height / 2)) / ((rect.height + window.innerHeight) / 2)));
        item.style.setProperty('--parallax-y', `${shift * Number(item.dataset.parallax || 0)}px`);
        item.style.setProperty('--parallax-x', `${shift * Number(item.dataset.parallaxX || 0)}px`);
      });
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onPointer = (event: PointerEvent) => {
      root.style.setProperty('--mx', String((event.clientX / window.innerWidth - .5) * 2));
      root.style.setProperty('--my', String((event.clientY / window.innerHeight - .5) * 2));
    };
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrentYear((visible.target as HTMLElement).dataset.year || 'Today');
    }, { threshold: [.25, .45, .7] });
    root.querySelectorAll<HTMLElement>('[data-year]').forEach(el => observer.observe(el));
    update(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('pointermove', onPointer, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onPointer); observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return (
    <main className="story-shell" ref={shellRef} id="top">
      <nav className="wordmark" aria-label="Ente"><span className="wordmark-dot" />ente</nav>
      <aside className="progress-ui" aria-label={`Ente journey, currently ${currentYear}`}><span>Google</span><div className="progress-track"><i /></div><b>{currentYear}</b><span>Today</span></aside>

      <section className="chapter bigtech" data-year="Google" data-parallax-scene>
        <div className="scene bigtech-scene">
          <BigTechOffice />
          <div className="bigtech-copy bigtech-copy--first" data-parallax="-82"><p className="eyebrow">The story starts somewhere enormous</p><h1>Vishnu worked at Google.</h1></div>
          <div className="bigtech-copy bigtech-copy--second" data-parallax="-48"><p>The more he saw what happened to people’s photos, the less okay it felt.</p><h2>So he left.</h2></div>
          <div className="bigtech-duck" data-parallax="52" data-parallax-x="30"><Ducky state="inspected" label="Ducky representing Vishnu inside a huge Big Tech office" /></div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll into the machine</span><i /></div>
        </div>
      </section>

      <div className="journey-intro" data-year="Home" data-parallax-scene><div data-parallax="-72"><p>Badge off. Backpack on.</p><h2>From a huge office<br />to a very tiny desk.</h2><span>↓</span></div></div>
      {storyBeats.map((item, index) => <StorySection item={item} index={index} key={item.scene} />)}

      <footer className="story-footer"><span>Made in the open.</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cook again? ↑</a></footer>
    </main>
  );
}
