'use client';

import { useEffect, useRef, useState } from 'react';

type DuckState = 'idle' | 'surprised' | 'typing' | 'walking' | 'inspected' | 'celebrating';
type SceneType = 'home' | 'experiment' | 'photos' | 'bob' | 'auth' | 'bigger' | 'locker' | 'open' | 'cooking';
type StoryBeat = { year: string; eyebrow: string; title: string; copy: string; beats?: string[]; state: DuckState; scene: SceneType };

const storyBeats: StoryBeat[] = [
  { year: 'Home', eyebrow: 'Career plan: smaller desk', title: 'He came home.', copy: 'And started building something better. Same laptop. Fewer cafeterias. Significantly more relatives asking what the app does.', state: 'typing', scene: 'home' },
  { year: 'The first idea', eyebrow: 'Sketch. Encrypt. Add cable.', title: 'It wasn’t even a photo app.', copy: 'It was end-to-end encrypted, device-first, and extremely confident about cables.', beats: ['Device first sounded brilliant.', 'The devices disagreed.', 'So we built an app. Like practical adults.'], state: 'surprised', scene: 'experiment' },
  { year: '2022', eyebrow: 'Now containing actual photos', title: 'Ente Photos.', copy: 'Your memories go in. Advertising profiles do not come out. A surprisingly controversial business model.', state: 'celebrating', scene: 'photos' },
  { year: 'Co-founder', eyebrow: 'An office chair approaches', title: 'Then Bob rolled in.', copy: 'Co-founder. Chair operator. Second person willing to stare at the same bug until it apologised.', state: 'idle', scene: 'bob' },
  { year: 'Photos → Auth', eyebrow: 'One code escaped', title: 'We started with Photos.', copy: 'Then someone had a deeply personal relationship with a missing 2FA code.', beats: ['Ducky caught it.', 'We called that product research.', 'Then we built Auth.'], state: 'surprised', scene: 'auth' },
  { year: 'More room', eyebrow: 'A data-driven property decision', title: 'We needed more room.', copy: 'This insight arrived when nobody could open the door without moving three chairs and one engineer.', state: 'celebrating', scene: 'bigger' },
  { year: '2024', eyebrow: 'One unnecessarily serious vault', title: 'Ente Locker.', copy: 'Photos were private. Codes were private. Passports were still living dangerously in a drawer.', beats: ['Enter: the vault.', 'Ducky checked the handle twice.', 'Then once more for morale.'], state: 'inspected', scene: 'locker' },
  { year: 'Building in the open', eyebrow: 'No mysterious hockey sticks', title: 'Out in the open.', copy: 'We decided to build the company like the product: inspectable, accountable, and allergic to suspicious charts.', beats: ['No secret growth graphs.', 'No “trust us, it’s huge.”', 'Just the numbers. In daylight.'], state: 'idle', scene: 'open' },
  { year: 'Today', eyebrow: 'Around 20 people and several mugs', title: 'Still cooking.', copy: 'Still independent. Still building. Still asking who moved the good whiteboard marker.', beats: ['Photos. Auth. Locker.', 'Ducky tasted the roadmap.', 'Needs more encryption.'], state: 'celebrating', scene: 'cooking' },
];

const timelineStops = [
  { year: 'Google', label: 'Google', href: '#top', short: 'G' },
  ...storyBeats.map((item, index) => ({
    year: item.year,
    label: item.year,
    href: `#chapter-${item.scene}`,
    short: String(index + 1).padStart(2, '0'),
  })),
];

const companyStats = [
  { label: 'Revenue', value: 'Connect', key: 'revenue' },
  { label: 'Active users', value: 'Connect', key: 'activeUsers' },
  { label: 'Team size', value: '≈ 20', key: 'teamSize' },
  { label: 'Countries', value: 'Connect', key: 'countries' },
];

function Ducky({ state = 'idle', label = 'Ducky', asset = '/ducky.svg' }: { state?: DuckState; label?: string; asset?: string }) {
  return (
    <div className={`ducky ducky--${state}`} role="img" aria-label={label}>
      <img className="ducky-asset" src={asset} alt="" draggable="false" />
    </div>
  );
}

function TinyPeople({ count = 8 }: { count?: number }) {
  return <div className="tiny-people" aria-hidden="true">{Array.from({ length: count }, (_, i) => <span key={i} style={{ '--n': i } as React.CSSProperties}><i /></span>)}</div>;
}

function BigTechOffice() {
  return (
    <div className="bigtech-world" aria-hidden="true">
      <div className="server-wall">{Array.from({ length: 18 }, (_, i) => <span key={i}><i /></span>)}</div>
      <div className="data-pipes"><i /><i /><i /><i /></div>
      <div className="profile-machine"><b>PROFILE</b><span>BUILDING… FOR SOME REASON</span><i /></div>
      <div className="photo-belt">{['▧', '▥', '▧', '▤', '▧'].map((item, i) => <span key={i}>{item}</span>)}</div>
      <div className="google-badge">VISITOR<br /><b>VISHNU</b></div>
    </div>
  );
}

function StoryVisual({ scene }: { scene: SceneType }) {
  if (scene === 'home') return <div className="prop-layer home-room" aria-hidden="true"><img className="home-ducky-scene" src="/ducky-home.png" alt="" draggable="false" /></div>;
  if (scene === 'experiment') return <div className="prop-layer experiment-rig" aria-hidden="true"><img className="experiment-ducky-scene" src="/ducky-experiment.png" alt="" draggable="false" /></div>;
  if (scene === 'photos') return <div className="prop-layer photos-reveal" aria-hidden="true"><img className="photos-ducky-scene" src="/ducky-photos.png" alt="" draggable="false" /></div>;
  if (scene === 'bob') return <div className="prop-layer bob-arrives" aria-hidden="true"><img className="bob-ducky-scene" src="/ducky-bob.png" alt="" draggable="false" /></div>;
  if (scene === 'auth') return <div className="prop-layer auth-morph" aria-hidden="true"><img className="auth-ducky-scene" src="/ducky-auth.png" alt="" draggable="false" /></div>;
  if (scene === 'bigger') return <div className="prop-layer bigger-office" aria-hidden="true"><div className="expanding-wall expanding-wall--left" /><div className="expanding-wall expanding-wall--right" /><div className="rising-ceiling" /><TinyPeople count={13} /></div>;
  if (scene === 'locker') return <div className="prop-layer vault-scene" aria-hidden="true"><div className="falling-papers">{['ID', 'PASS', 'DOC', 'KEY'].map((x, i) => <i key={x} style={{ '--n': i } as React.CSSProperties}>{x}</i>)}</div><div className="vault"><div className="vault-door"><i /><b>×</b></div><span>VERY IMPORTANT<br />DUCKUMENTS</span></div><div className="double-check">click&nbsp;&nbsp; click</div></div>;
  if (scene === 'open') return <div className="prop-layer open-company"><div className="open-code" aria-hidden="true">{'{ privacy: true, ownership: yours }'}</div><div className="live-stats">{companyStats.map(stat => <div className="stat" data-stat={stat.key} key={stat.key}><span>{stat.label}</span><b>{stat.value}</b><i>LIVE</i></div>)}</div></div>;
  return <div className="prop-layer cooking-scene" aria-hidden="true"><TinyPeople count={20} /><div className="cooking-pot"><div className="pot-steam">{'{ }'} &nbsp; 🔒 &nbsp; ▧</div><span>PHOTOS</span><span>AUTH</span><span>LOCKER</span></div><div className="taste-note">hmm. needs more encryption.</div></div>;
}

function StorySection({ item, index }: { item: StoryBeat; index: number }) {
  const layout = index % 2 === 0 ? 'left-copy' : 'right-copy';
  return (
    <section id={`chapter-${item.scene}`} className={`chapter milestone milestone--${item.scene}`} data-year={item.year} data-layout={layout} data-parallax-scene>
      <div className="scene milestone-stage">
        <div className="milestone-copy" data-parallax="-72" data-parallax-x={index % 2 ? '20' : '-20'}>
          <span className="chapter-number">{String(index + 1).padStart(2, '0')}</span>
          <p>{item.eyebrow}</p><h2>{item.title}</h2><div className="milestone-line" />
          <p className="milestone-desc">{item.copy}</p>
          {item.beats?.map((beat, beatIndex) => <p className={`story-beat story-beat--${beatIndex}`} key={beat}>{beat}</p>)}
        </div>
        <div className="milestone-props" data-parallax="-112" data-parallax-x="0"><StoryVisual scene={item.scene} /></div>
        {item.scene !== 'home' && item.scene !== 'experiment' && item.scene !== 'photos' && item.scene !== 'bob' && item.scene !== 'auth' && <div className="milestone-duck" data-parallax="54" data-parallax-x={index % 2 ? '16' : '-16'}><Ducky state={item.state} label={`Ducky during ${item.title}`} /></div>}
      </div>
    </section>
  );
}

export default function Home() {
  const shellRef = useRef<HTMLElement>(null);
  const [currentYear, setCurrentYear] = useState('Google');
  const [timelineVisible, setTimelineVisible] = useState(false);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const parallaxItems = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
    const parallaxScenes = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax-scene]'));
    const openingChapter = root.querySelector<HTMLElement>('.bigtech');
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty('--page-progress', String(max ? window.scrollY / max : 0));
      if (openingChapter) {
        const openingRect = openingChapter.getBoundingClientRect();
        const openingTravel = Math.max(1, openingRect.height - window.innerHeight);
        const openingProgress = Math.max(0, Math.min(1, -openingRect.top / openingTravel));
        setTimelineVisible(openingProgress >= .08);
      }
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
      <nav className={`journey-timeline${timelineVisible ? ' is-visible' : ''}`} aria-label="Jump to a chapter" aria-hidden={!timelineVisible}>
        <span className="journey-timeline-caption" aria-hidden="true">Jump</span>
        {timelineStops.map(stop => {
          const active = currentYear === stop.year;
          return (
            <a
              href={stop.href}
              className={`journey-timeline-link${active ? ' is-active' : ''}`}
              data-label={stop.label}
              aria-label={`Jump to ${stop.label}`}
              aria-current={active ? 'step' : undefined}
              tabIndex={timelineVisible ? 0 : -1}
              key={stop.href}
            >
              <span>{stop.short}</span>
            </a>
          );
        })}
      </nav>

      <section className="chapter bigtech" data-year="Google" data-parallax-scene>
        <div className="scene bigtech-scene">
          <BigTechOffice />
          <div className="bigtech-copy bigtech-copy--first" data-parallax="-82"><p className="eyebrow">One duck. Several thousand servers.</p><h1>Vishnu worked at Google.</h1></div>
          <div className="bigtech-copy bigtech-copy--second" data-parallax="-48"><p>The more he saw what happened to people’s photos, the harder it became to nod politely.</p><h2>So he left.</h2><small>Badge returned. Trust issues retained.</small></div>
          <div className="bigtech-duck" data-parallax="52" data-parallax-x="30"><Ducky state="inspected" asset="/ducky-big-tech.png" label="Ducky representing Vishnu wrapped in Big Tech" /></div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll to resign dramatically</span><i /></div>
        </div>
      </section>

      <div className="journey-intro" data-year="Home" data-parallax-scene><div data-parallax="-72"><p>Badge off. Backpack on. Free lunch status: complicated.</p><h2>From a huge office<br />to a desk with relatives nearby.</h2><span>↓</span></div></div>
      {storyBeats.map((item, index) => <StorySection item={item} index={index} key={item.scene} />)}

      <footer className="story-footer"><span>Made in the open.</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cook again? ↑</a></footer>
    </main>
  );
}
