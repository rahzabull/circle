'use client';

import { useEffect, useRef, useState } from 'react';

type DuckState = 'idle' | 'surprised' | 'typing' | 'walking' | 'inspected' | 'celebrating';
type SceneType = 'home' | 'experiment' | 'photos' | 'bob' | 'auth' | 'bigger' | 'locker' | 'open' | 'cooking';
type StoryBeat = { year: string; eyebrow: string; title: string; copy: string; beats?: string[]; scene: SceneType };

const storyBeats: StoryBeat[] = [
  { year: 'Home', eyebrow: 'New office: one desk, many opinions', title: 'He came home.', copy: 'Same laptop. Smaller desk. Unlimited relatives asking, “So… what exactly are you building?”', scene: 'home' },
  { year: 'The first idea', eyebrow: 'Encrypt. Sync. Find cable.', title: 'It wasn’t even a photo app.', copy: 'Device-first. End-to-end encrypted. Extremely confident for something held together by cables.', beats: ['The idea was brilliant.', 'The devices filed a complaint.', 'So we built an app.'], scene: 'experiment' },
  { year: '2022', eyebrow: 'Now with actual photos', title: 'Ente Photos.', copy: 'Your memories go in. Ad profiles do not crawl out. Apparently this is rebellious.', scene: 'photos' },
  { year: 'Co-founder', eyebrow: 'Plot twist: another adult', title: 'Then Bob rolled in.', copy: 'Co-founder. Debugger. Second person willing to stare at one bug until it confessed.', scene: 'bob' },
  { year: 'Photos → Auth', eyebrow: 'A 2FA code escaped', title: 'Then came Auth.', copy: 'Then someone lost a 2FA code and experienced all five stages of grief before lunch.', beats: ['Ducky found it.', 'We called it user research.', 'Hello, Ente Auth.'], scene: 'auth' },
  { year: 'More room', eyebrow: 'Scientific finding: elbows need space', title: 'We needed more room.', copy: 'The breakthrough came when opening the door required moving three chairs and one engineer.', scene: 'bigger' },
  { year: '2024', eyebrow: 'For documents with commitment issues', title: 'Ente Locker.', copy: 'Photos were private. Codes were private. Passports were still freelancing in a drawer.', beats: ['So we built a vault.', 'Ducky checked the lock twice.', 'Then once for emotional support.'], scene: 'locker' },
  { year: 'Building in the open', eyebrow: 'No secret sauce. Recipe included.', title: 'Out in the open.', copy: 'We build the company like the product: inspectable, accountable, and suspicious of graphs that go up too neatly.', beats: ['No mystery metrics.', 'No “trust us, it’s huge.”', 'Just the work. In daylight.'], scene: 'open' },
  { year: 'Today', eyebrow: '≈20 people. Infinite mugs.', title: 'Still cooking.', copy: 'Still independent. Still building. Still blaming the missing whiteboard marker on “culture.”', beats: ['Photos. Auth. Locker.', 'Ducky reviewed the roadmap.', 'Requested more encryption.'], scene: 'cooking' },
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

function Ducky({ state = 'idle', label = 'Ducky', asset = '/ducky.svg' }: { state?: DuckState; label?: string; asset?: string }) {
  return (
    <div className={`ducky ducky--${state}`} role="img" aria-label={label}>
      <img className="ducky-asset" src={asset} alt="" draggable="false" />
    </div>
  );
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
  if (scene === 'bigger') return <div className="prop-layer bigger-office" aria-hidden="true"><img className="team-ducky-scene" src="/ducky-team.png" alt="" draggable="false" /></div>;
  if (scene === 'locker') return <div className="prop-layer vault-scene" aria-hidden="true"><img className="locker-ducky-scene" src="/ducky-locker.png" alt="" draggable="false" /></div>;
  if (scene === 'open') return <div className="prop-layer open-company" aria-hidden="true"><img className="open-ducky-scene" src="/ducky-open.png" alt="" draggable="false" /></div>;
  return <div className="prop-layer cooking-scene" aria-hidden="true"><img className="final-team-scene" src="/ducky-finale.png" alt="" draggable="false" /></div>;
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
        const firstScrollProgress = Math.min(1, openingProgress / .22);
        root.style.setProperty('--opening-duck-zoom', String(1.4 - firstScrollProgress * .4));
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
          <div className="bigtech-copy bigtech-copy--second" data-parallax="-48"><p>The more he learned about photo privacy, the less polite his nod became.</p><h2>So he left.</h2><small>Badge returned. Side-eye retained.</small></div>
          <div className="bigtech-duck" data-parallax="52" data-parallax-x="30"><Ducky state="inspected" asset="/ducky-big-tech.png" label="Ducky representing Vishnu wrapped in Big Tech" /></div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll to resign dramatically</span><i /></div>
        </div>
      </section>

      <div className="journey-intro" data-year="Home" data-parallax-scene><div data-parallax="-72"><p>Big office out. Family tech support in.</p><h2>One desk.<br />Unlimited feedback.</h2><span>↓</span></div></div>
      {storyBeats.map((item, index) => <StorySection item={item} index={index} key={item.scene} />)}

      <footer className="story-footer"><span>Made in the open.</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cook again? ↑</a></footer>
    </main>
  );
}
