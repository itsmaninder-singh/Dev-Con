import React from 'react';

export function LandingPreloader({
  preloaderRef,
  preRing2Ref,
  preRing1Ref,
  preLogoRef,
  preCountRef,
  preBarFillRef,
}) {
  return (
    <div id="dc-preloader" ref={preloaderRef}>
      <div className="dc-pre-ring dc-ring2" ref={preRing2Ref} />
      <div className="dc-pre-ring" ref={preRing1Ref} />
      <div className="dc-pre-inner">
        <div className="dc-pre-logo" ref={preLogoRef} />
        <div className="dc-pre-count" ref={preCountRef}>
          0%
        </div>
        <div className="dc-pre-bar">
          <div className="dc-pre-bar-fill" ref={preBarFillRef} />
        </div>
      </div>
    </div>
  );
}

export default LandingPreloader;
