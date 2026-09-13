import { useEffect, useState } from 'react';
import { LOGO_DATA_URI } from './logo.js';

/* Shows once per browser session (sessionStorage), then removes itself. */
export default function Preloader() {
  const [visited] = useState(() => sessionStorage.getItem('dc_visited'));
  const [stage, setStage] = useState('start'); // start -> mark-in -> bar-in -> mark-fading -> fading -> done

  useEffect(() => {
    if (visited) return;
    const timers = [];
    timers.push(setTimeout(() => setStage('mark-in'), 20));
    timers.push(setTimeout(() => setStage('bar-in'), 400));
    timers.push(setTimeout(() => setStage('mark-fading'), 950));
    timers.push(setTimeout(() => setStage('fading'), 1150));
    timers.push(setTimeout(() => {
      sessionStorage.setItem('dc_visited', '1');
      setStage('done');
    }, 1500));
    return () => timers.forEach(clearTimeout);
  }, [visited]);

  if (visited || stage === 'done') return null;

  const classes = ['mark-in', 'bar-in', 'mark-fading', 'fading']
    .filter(s => {
      const order = ['start', 'mark-in', 'bar-in', 'mark-fading', 'fading', 'done'];
      return order.indexOf(stage) >= order.indexOf(s);
    })
    .join(' ');

  return (
    <div id="preloader" className={classes}>
      <div className="mark">
        <img className="preloader-mark" src={LOGO_DATA_URI} alt="" />
        Dev<span>Connect</span>
      </div>
      <div className="bar" id="preloaderBar" />
    </div>
  );
}