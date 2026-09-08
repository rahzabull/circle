'use client';

import { useEffect, useRef, useState } from 'react';

type DuckState = 'idle' | 'surprised' | 'typing' | 'walking' | 'inspected' | 'celebrating';
type SceneType = 'build' | 'users' | 'open' | 'security' | 'photos' | 'auth' | 'locker' | 'growth';

const milestones: Array<{ year: string; title: string; copy: string; state: DuckState; scene: SceneType }> = [
  { year: '2017', title: 'First build', copy: 'One duck, one laptop, and a very optimistic amount of storage.', state: 'typing', scene: 'build' },
  { year: '2018', title: 'First users', copy: 'A few curious humans arrived. Then they brought their friends.', state: 'idle', scene: 'users' },
  { year: '2019', title: 'Open source', copy: 'We opened the walls. The good kind of people looked inside.', state: 'celebrating', scene: 'open' },
  { year: '2021', title: 'Security, audited', copy: 'Serious scanners. Serious clipboards. One spotless duck.', state: 'inspected', scene: 'security' },
  { year: '2022', title: 'Photos', copy: 'Your camera roll got a private home that did not snoop around.', state: 'celebrating', scene: 'photos' },
  { year: '2023', title: 'Auth', copy: 'Keys, codes and passkeys. Only you get to be you.', state: 'surprised', scene: 'auth' },
  { year: '2024', title: 'Locker', copy: 'For the documents that deserve an absurdly secure little room.', state: 'walking', scene: 'locker' },
  { year: 'Today', title: 'Still growing', copy: 'More people. More privacy. Approximately the same duck.', state: 'celebrating', scene: 'growth' },
];

function Ducky({ state = 'idle', label = 'Ducky' }: { state?: DuckState; label?: string }) {
  return (
    <div className={`ducky ducky--${state}`} role="img" aria-label={label}>
      <div className="duck-shadow" />
      <div className="duck-body">
        <div className="duck-wing duck-wing--left" />
        <div className="duck-wing duck-wing--right" />
        <div className="duck-head">
          <span className="duck-eye duck-eye--left" />
          <span className="duck-eye duck-eye--right" />
          <span className="duck-brow duck-brow--left" />
          <span className="duck-brow duck-brow--right" />
          <span className="duck-bill" />
          <span className="duck-cheek duck-cheek--left" />
          <span className="duck-cheek duck-cheek--right" />
        </div>
        <div className="duck-foot duck-foot--left" />
        <div className="duck-foot duck-foot--right" />
      </div>
      <div className="ceo-tie" />
    </div>
  );
}

function Chaos() {
  const things = [
    ['chaos-photo', '▧', 'Your photo'], ['chaos-eye', '● ●', 'tracking eyes'],
    ['chaos-ad', 'BUY!', 'an advertisement'], ['chaos-cloud', '☁', 'a cloud'],
    ['chaos-bell', '12', 'notifications'], ['chaos-data', '0101', 'random data'],
    ['chaos-cookie', '🍪', 'a cookie'], ['chaos-pin', '⌖', 'a location pin'],
  ];
  return (
    <div className="chaos-field" aria-hidden="true">
      {things.map(([className, symbol, label], index) => (
        <span className={`chaos-thing ${className}`} data-label={label} key={className} style={{ '--i': index } as React.CSSProperties}>{symbol}</span>
      ))}
    </div>
  );
}

function Laptop() {
  return <div className="laptop" aria-hidden="true"><div className="laptop-screen"><i /><i /><i /></div><div className="laptop-base" /></div>;
}

function TinyPeople({ count = 8 }: { count?: number }) {
  return <div className="tiny-people" aria-hidden="true">{Array.from({ length: count }, (_, i) => <span key={i} style={{ '--n': i } as React.CSSProperties}><i /></span>)}</div>;
}

function MilestoneVisual({ scene }: { scene: SceneType }) {
  if (scene === 'build') return <div className="prop-layer code-swarm" aria-hidden="true"><Laptop />{['{ }', '</>', '01', '•••'].map((x, i) => <b key={x} style={{ '--n': i } as React.CSSProperties}>{x}</b>)}</div>;
  if (scene === 'users') return <div className="prop-layer people-scene"><TinyPeople count={9} /></div>;
  if (scene === 'open') return <div className="prop-layer open-source" aria-hidden="true"><div className="wall wall--left">CLOSED</div><div className="wall wall--right">ISH</div><div className="source-lines">const privacy = yours;<br />share(byChoice);<br />track(nothing);</div></div>;
  if (scene === 'security') return <div className="prop-layer scanners" aria-hidden="true"><div className="scanner scanner--left">SECURITY<br /><b>VERY ON</b></div><div className="scan-beam" /><div className="scanner scanner--right">AUDIT<br /><b>PASS</b></div></div>;
  if (scene === 'photos') return <div className="prop-layer phone-drop" aria-hidden="true"><div className="phone"><div className="phone-sky" /><span>◆</span><i /></div><em>4,832 photos<br />not for sale</em></div>;
  if (scene === 'auth') return <div className="prop-layer auth-blocks" aria-hidden="true">{['2', '7', '4', '1', '9', '0'].map((x, i) => <b key={`${x}-${i}`} style={{ '--n': i } as React.CSSProperties}>{x}</b>)}</div>;
  if (scene === 'locker') return <div className="prop-layer vault-scene" aria-hidden="true"><div className="vault"><div className="vault-door"><i /><b>×</b></div><span>VERY IMPORTANT<br />DUCKUMENTS</span></div><div className="paper">TOP<br />SECRET</div></div>;
  return <div className="prop-layer growth-scene"><TinyPeople count={18} /><strong aria-hidden="true">+ + +</strong></div>;
}

function Milestone({ item, index }: { item: (typeof milestones)[number]; index: number }) {
  return (
    <section className={`chapter milestone milestone--${item.scene}`} data-year={item.year} data-parallax-scene>
      <div className="scene milestone-stage">
        <div className="milestone-copy" data-parallax="-72" data-parallax-x={index % 2 ? '20' : '-20'}>
          <span className="chapter-number">{String(index + 1).padStart(2, '0')}</span>
          <p>{item.year}</p>
          <h2>{item.title}</h2>
          <div className="milestone-line" />
          <p className="milestone-desc">{item.copy}</p>
        </div>
        <div className="milestone-props" data-parallax="-138" data-parallax-x={index % 2 ? '-34' : '34'}><MilestoneVisual scene={item.scene} /></div>
        <div className="milestone-duck" data-parallax="54" data-parallax-x={index % 2 ? '16' : '-16'}><Ducky state={item.state} label={`Ducky during ${item.title}`} /></div>
      </div>
    </section>
  );
}

export default function Home() {
  const shellRef = useRef<HTMLElement>(null);
  const [currentYear, setCurrentYear] = useState('2017');

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
      if (!reducedMotion.matches) {
        const viewportMiddle = window.innerHeight / 2;
        parallaxScenes.forEach(scene => {
          const rect = scene.getBoundingClientRect();
          const shift = Math.max(-1, Math.min(1, (viewportMiddle - (rect.top + rect.height / 2)) / ((rect.height + window.innerHeight) / 2)));
          scene.style.setProperty('--scene-bg-y', `${shift * -44}px`);
        });
        parallaxItems.forEach(item => {
          const scene = item.closest<HTMLElement>('[data-parallax-scene]') || item;
          const rect = scene.getBoundingClientRect();
          const shift = Math.max(-1, Math.min(1, (viewportMiddle - (rect.top + rect.height / 2)) / ((rect.height + window.innerHeight) / 2)));
          const speedY = Number(item.dataset.parallax || 0);
          const speedX = Number(item.dataset.parallaxX || 0);
          item.style.setProperty('--parallax-y', `${shift * speedY}px`);
          item.style.setProperty('--parallax-x', `${shift * speedX}px`);
        });
      }
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onPointer = (event: PointerEvent) => {
      root.style.setProperty('--mx', String((event.clientX / window.innerWidth - .5) * 2));
      root.style.setProperty('--my', String((event.clientY / window.innerHeight - .5) * 2));
    };
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrentYear((visible.target as HTMLElement).dataset.year || '2017');
    }, { threshold: [.25, .45, .7] });
    document.querySelectorAll<HTMLElement>('[data-year]').forEach(el => observer.observe(el));
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onPointer); observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return (
    <main className="story-shell" ref={shellRef} id="top">
      <nav className="wordmark" aria-label="Company"><span className="wordmark-dot" />ente</nav>
      <aside className="progress-ui" aria-label={`Company journey, currently ${currentYear}`}>
        <span>2017</span><div className="progress-track"><i /></div><b>{currentYear}</b><span>Today</span>
      </aside>

      <section className="chapter intro" aria-labelledby="intro-title" data-parallax-scene>
        <div className="scene intro-scene">
          <div className="intro-copy" data-parallax="-95" data-parallax-x="-18">
            <p className="eyebrow">A very serious company story</p>
            <h1 id="intro-title">Meet our CEO.</h1>
            <p className="intro-sub">He had a problem with the internet.</p>
          </div>
          <div className="intro-stage" data-parallax="56" data-parallax-x="25"><span className="stage-scribble">CEO*</span><div className="ducky-wrap ducky-arrival"><Ducky label="Ducky, our CEO" /></div></div>
          <div className="scroll-cue" aria-hidden="true"><span>Scroll to begin</span><i /></div>
        </div>
      </section>

      <section className="chapter problem" data-year="The problem" data-parallax-scene>
        <div className="scene problem-scene">
          <div className="problem-copy" data-parallax="-88" data-parallax-x="-20"><p className="eyebrow">The problem</p><h2>Everything wanted his photos.</h2><p>Including things that absolutely did not need his photos.</p></div>
          <div className="chaos-parallax" data-parallax="-170" data-parallax-x="52"><Chaos /></div>
          <div className="problem-duck" data-parallax="58" data-parallax-x="-18"><Ducky state="surprised" label="Ducky surrounded by a messy internet" /></div>
        </div>
      </section>

      <section className="chapter idea" data-year="The idea" data-parallax-scene>
        <div className="scene idea-scene">
          <div className="quiet-ring" data-parallax="-45" data-parallax-x="24" aria-hidden="true" />
          <div className="idea-copy" data-parallax="-82" data-parallax-x="-22"><p className="eyebrow">Then it got quiet</p><h2>So he built somewhere they could just… <em>exist.</em></h2></div>
          <div className="idea-duck" data-parallax="64" data-parallax-x="26"><Ducky state="typing" label="Ducky quietly building at a laptop" /><Laptop /></div>
        </div>
      </section>

      <div className="journey-intro" data-year="2017" data-parallax-scene><div data-parallax="-72"><p>The long version</p><h2>One small idea.<br />A surprisingly long walk.</h2><span>↓</span></div></div>
      {milestones.map((item, index) => <Milestone item={item} index={index} key={item.title} />)}

      <section className="chapter ending" data-year="Today" data-parallax-scene>
        <div className="scene ending-scene">
          <div className="orbit orbit--one" data-parallax="-92" data-parallax-x="45" aria-hidden="true"><span>PHOTOS</span></div>
          <div className="orbit orbit--two" data-parallax="-145" data-parallax-x="-26" aria-hidden="true"><span>AUTH</span></div>
          <div className="orbit orbit--three" data-parallax="-205" data-parallax-x="34" aria-hidden="true"><span>LOCKER</span></div>
          <div className="ending-copy" data-parallax="-74" data-parallax-x="-18"><p className="eyebrow">Today, tomorrow, etc.</p><h2>Still<br />building.</h2><p>Photos. Auth. Locker.</p><strong>Private by default.<br />Open by choice.</strong></div>
          <div className="ending-duck"><Ducky state="walking" label="Ducky walking off, then awkwardly returning" /></div>
          <div className="forgot-note" aria-hidden="true">forgot his keys</div>
          <footer><span>Made with unreasonable care.</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Again? ↑</a></footer>
        </div>
      </section>
    </main>
  );
}
