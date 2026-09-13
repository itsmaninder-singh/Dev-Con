import { useEffect, useState } from 'react';
import { ALL, TICKER_NAMES } from './data.js';

export default function ActivityTicker() {
  const [visible, setVisible] = useState(false);
  const [line, setLine] = useState(null);

  useEffect(() => {
    let hideTimer;
    function next() {
      const item = ALL[Math.floor(Math.random() * ALL.length)];
      const name = TICKER_NAMES[Math.floor(Math.random() * TICKER_NAMES.length)];
      setLine({ name, target: item.name });
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 4200);
    }
    const firstTimer = setTimeout(next, 2600);
    const interval = setInterval(next, 8500);
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div id="activityTicker" className={visible ? 'visible' : ''}>
      <div className="ticker-dot" />
      <div className="ticker-text">
        {line && <><b>{line.name}</b> just joined <b>{line.target}</b></>}
      </div>
    </div>
  );
}