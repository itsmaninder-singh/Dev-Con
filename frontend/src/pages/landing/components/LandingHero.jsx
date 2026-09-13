import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export function LandingHero({
  logoStageRef,
  subheadRef,
  ctaPrimaryRef,
  ctaSecondaryRef,
  scrollIndicatorRef,
}) {
  const { user } = useAuth() || {};
  const isLoggedIn = Boolean(user?._id);

  return (
    <section className="dc-hero">
      <div className="dc-logo-stage" ref={logoStageRef} />
      <p className="dc-subhead" ref={subheadRef}>
        Where ambitious builders assemble squads, collaborate, and ship real projects.
      </p>
      <div className="dc-cta-row">
        {isLoggedIn ? (
          <Link to="/workspace" className="dc-btn dc-btn-primary" ref={ctaPrimaryRef}>
            Start Building
          </Link>
        ) : (
          <Link to="/login" className="dc-btn dc-btn-primary" ref={ctaPrimaryRef}>
            Log In
          </Link>
        )}
        <Link to="/explore" className="dc-btn dc-btn-secondary" ref={ctaSecondaryRef}>
          Explore Squads
        </Link>
      </div>
      <div className="dc-scroll-indicator" ref={scrollIndicatorRef}>
        <div className="dc-mouse" />
        <span>Scroll to explore</span>
      </div>
    </section>
  );
}

export default LandingHero;
