import Sketchbook from './about/Sketchbook.jsx';
import FoldText from '../components/FoldText.jsx';
import '../About.css';

const PAGES = [
  {
    kicker: 'Chapter 01',
    title: 'Why we built this',
    body: "Every hackathon starts the same way — scrambling in a group chat the night before, hoping someone free actually has the skills you need. We got tired of that, so we built a place where you can search for the right teammate instead of hoping one finds you.",
  },
  {
    kicker: 'Chapter 02',
    title: 'How matching works',
    body: "Tell DevConnect what you're building and what skills you need. We surface teams and projects actively looking for someone like you — ranked by fit, not just by who posted most recently.",
  },
  {
    kicker: 'Chapter 03',
    title: 'Built by developers',
    body: 'No recruiters, no noise. Just developers, designers, and builders looking for their next project — a hackathon squad, a startup co-founder, or a study group for finals week.',
  },
  {
    kicker: 'Chapter 04',
    title: "Where we're headed",
    body: "Team formation is just the start. Next up: in-app project boards, a hackathon calendar, and a way to actually ship what you started together.",
  },
  {
    kicker: 'Chapter 05',
    title: 'Say hello',
    body: "Questions, feedback, or just want to say hi? Reach out — we read everything.",
  },
];

export default function About() {
  return (
    <div className="ab-root">
      <div className="ab-glow" aria-hidden="true" />
      <div className="ab-wrap">
        <h1 className="ab-heading">
          <FoldText
            text="DevConnect Notebook"
            splitBy="char"
            hinge="top"
            trigger="scroll"
            duration={0.65}
            stagger={0.035}
            ease="power3.out"
            perspective={700}
            creaseShading={0.55}
            fontSize="clamp(30px, 4.5vw, 44px)"
            fontWeight={800}
            color="#ffffff"
          />
        </h1>
        <p className="ab-sub">Flip through — it's a short read.</p>
        <Sketchbook pages={PAGES} />
      </div>
    </div>
  );
}