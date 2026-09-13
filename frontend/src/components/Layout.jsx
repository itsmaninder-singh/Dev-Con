import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteNav from './SiteNav';
import ChatWidget from './ChatWidget';
import ScrollSound from './effects/ScrollSound';
import ClickSpark from './effects/ClickSpark';

export default function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <ClickSpark
      sparkColor="#ff98a2"
      sparkSize={8}
      sparkRadius={16}
      sparkCount={7}
      duration={350}
      easing="ease-out"
      extraScale={1}
    >
      <SiteNav />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      {!isLanding && <ChatWidget />}
      <ScrollSound />
    </ClickSpark>
  );
}