/* MOCK DATA — shaped exactly like the /teams, /projects and /matchup API
   responses so swapping in real fetch() calls later is a drop-in
   replacement. See notes near the top-level data hook in App.jsx. */

export const TEAMS = [
  { id: 't1', kind: 'team', type: 'hackathon', name: 'Nightwatch', description: 'Building a real-time incident dashboard for our college hackathon — need someone strong on WebSockets.', skillsNeeded: ['React', 'Node.js', 'Socket.io'], maxMembers: 4, membersCount: 2, creator: { name: 'Aditi Rao', initials: 'AR' }, matchScore: 92, postedAgo: '3h ago' },
  { id: 't2', kind: 'team', type: 'startup', name: 'Ledger Loop', description: 'Early-stage fintech idea for splitting group expenses across UPI. Looking for a backend-leaning generalist.', skillsNeeded: ['Express', 'MongoDB', 'Razorpay API'], maxMembers: 3, membersCount: 1, creator: { name: 'Kabir Mehta', initials: 'KM' }, matchScore: 81, postedAgo: '1d ago' },
  { id: 't3', kind: 'team', type: 'open-source', name: 'Formless', description: 'A headless form-builder library. We ship weekly and review every PR same day.', skillsNeeded: ['TypeScript', 'Vite', 'Testing'], maxMembers: 6, membersCount: 5, creator: { name: 'Priya Nair', initials: 'PN' }, matchScore: 74, postedAgo: '2d ago' },
  { id: 't4', kind: 'team', type: 'college-project', name: 'CampusMap', description: 'Indoor navigation for our campus buildings using QR waypoints. Final-year major project.', skillsNeeded: ['React Native', 'Firebase'], maxMembers: 4, membersCount: 4, creator: { name: 'Rohan Iyer', initials: 'RI' }, matchScore: 65, postedAgo: '5h ago' },
  { id: 't5', kind: 'team', type: 'hackathon', name: 'EcoTrack', description: 'Carbon footprint tracker with a gamified leaderboard for Smart India Hackathon.', skillsNeeded: ['Next.js', 'Chart.js'], maxMembers: 5, membersCount: 3, creator: { name: 'Simran Kaur', initials: 'SK' }, matchScore: 58, postedAgo: '6d ago' },
  { id: 't6', kind: 'team', type: 'freelance', name: 'PixelForge Studio', description: 'Small freelance collective taking on client landing pages. Need one more designer-developer.', skillsNeeded: ['Figma', 'Tailwind'], maxMembers: 3, membersCount: 2, creator: { name: 'Dev Malhotra', initials: 'DM' }, matchScore: 44, postedAgo: '1w ago' }
];

export const PROJECTS = [
  { id: 'p1', kind: 'project', type: 'startup', name: 'Fable', description: 'AI-assisted screenwriting tool. Seed-funded, moving fast — need a founding frontend engineer.', skillsNeeded: ['React', 'WebSockets', 'LLM APIs'], maxMembers: 5, membersCount: 3, creator: { name: 'Ananya Ghosh', initials: 'AG' }, matchScore: 88, postedAgo: '2h ago' },
  { id: 'p2', kind: 'project', type: 'open-source', name: 'Queuely', description: 'Lightweight job queue for Node, built for readability over cleverness.', skillsNeeded: ['Node.js', 'Redis'], maxMembers: 4, membersCount: 2, creator: { name: 'Yusuf Sheikh', initials: 'YS' }, matchScore: 70, postedAgo: '4d ago' },
  { id: 'p3', kind: 'project', type: 'hackathon', name: 'Signal', description: 'Offline-first mesh messaging for disaster relief zones. Building for a 36-hour hack.', skillsNeeded: ['Bluetooth LE', 'React Native'], maxMembers: 4, membersCount: 4, creator: { name: 'Meera Pillai', initials: 'MP' }, matchScore: 52, postedAgo: '8h ago' }
];

export const ALL = [...TEAMS, ...PROJECTS];

export const TICKER_NAMES = ['Yusuf Sheikh', 'Meera Pillai', 'Kabir Mehta', 'Priya Nair', 'Rohan Iyer', 'Simran Kaur', 'Dev Malhotra', 'Ananya Ghosh'];