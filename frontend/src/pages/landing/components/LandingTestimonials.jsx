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
        <h2 className="dc-testimonials-heading">
          What developers are saying
          <span className="dc-heading-dots" aria-hidden="true">
            <span className="dc-dot dc-dot-1">.</span>
            <span className="dc-dot dc-dot-2">.</span>
            <span className="dc-dot dc-dot-3">.</span>
          </span>
        </h2>
        <div className="dc-gallery-wrap">
          <CircularGallery
            items={testimonialItems}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.08}
            scrollEase={0.05}
            font="bold 28px 'Segoe UI', sans-serif"
            autoScroll
            autoScrollSpeed={0.012}
          />
        </div>
      </div>
    </section>
  );
}

export default LandingTestimonials;
