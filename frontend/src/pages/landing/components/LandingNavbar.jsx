import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export function LandingNavbar({ navbarRef }) {
  const { user } = useAuth() || {};
  const isLoggedIn = Boolean(user?._id || user);

  return (
    <nav className="dc-nav" id="dc-navbar" ref={navbarRef}>
      <Link to="/" className="dc-brand" style={{ textDecoration: 'none', color: '#f2f1ed' }}>
        Dev<span>Connect</span>
      </Link>
      <ul className="dc-links">
        <li><Link to="/explore">Explore</Link></li>
        <li><Link to="/workspace">Teams</Link></li>
        <li><Link to="/hackathons">Hackathons</Link></li>
        <li><Link to="/about">About</Link></li>
      </ul>
      {isLoggedIn ? (
        <Link to="/workspace" className="dc-nav-cta">
          Start Building
        </Link>
      ) : (
        <Link to="/login" className="dc-nav-cta">
          Sign In
        </Link>
      )}
    </nav>
  );
}

export default LandingNavbar;