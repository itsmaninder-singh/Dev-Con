import { useEffect, useState } from 'react';
import { useTeams } from '../../context/TeamsContext.jsx';

export default function ActivityTicker() {
  const { teams } = useTeams() || {};
  const [visible, setVisible] = useState(false);
  const [line, setLine] = useState(null);

  useEffect(() => {
    const activeTeams = (teams || []).filter((t) => t?.members && t.members.length > 0);
    if (activeTeams.length === 0) return;

    let hideTimer;
    function next() {
      const team = activeTeams[Math.floor(Math.random() * activeTeams.length)];
      if (!team) return;
      const recentMember = team.members[team.members.length - 1]?.user;
      const name = recentMember?.name || recentMember?.username || 'A builder';
      setLine({ name, target: team.name });
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 4200);
    }
    const firstTimer = setTimeout(next, 3500);
    const interval = setInterval(next, 12000);
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, [teams]);

  if (!line) return null;

  return (
    <div id="activityTicker" className={visible ? 'visible' : ''}>
      <div className="ticker-dot" />
      <div className="ticker-text">
        <b>{line.name}</b> joined <b>{line.target}</b>
      </div>
    </div>
  );
}