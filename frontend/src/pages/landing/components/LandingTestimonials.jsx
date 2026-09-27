import React from 'react';
import CircularGallery from '../../../components/effects/CircularGallery';

export function LandingTestimonials({
  nextSectionRef,
  testimonialItems,
}) {
  return (
    <section className="dc-next-section" ref={nextSectionRef}>
      <div className="dc-end-glow" aria-hidden="true" />
      <div className="dc-testimonials">
        <h2>What developers are saying</h2>
        <div className="dc-gallery-wrap">
          <CircularGallery
            items={testimonialItems}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.08}
            scrollEase={0.05}
            font="bold 24px 'Segoe UI', sans-serif"
            autoScroll
            autoScrollSpeed={0.012}
          />
        </div>
      </div>
    </section>
  );
}

export default LandingTestimonials;
