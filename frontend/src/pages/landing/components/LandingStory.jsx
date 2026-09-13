import React from 'react';

export function LandingStory({
  storyProgressRef,
  storyStageRef,
  storyCanvasHolderRef,
  storyTrackRef,
}) {
  return (
    <>
      <div className="dc-story-progress" ref={storyProgressRef} />

      <section className="dc-story-stage" ref={storyStageRef}>
        <div className="dc-story-sticky">
          <div id="dc-storyCanvasHolder" ref={storyCanvasHolderRef} />
        </div>
      </section>

      <div className="dc-story-track" ref={storyTrackRef}>
        <div className="dc-story-beat">
          <div className="dc-num">01</div>
          <h2>Find Your Counterpart</h2>
          <p>
            No more shouting into chaotic chat rooms. Match with developers based on verified tech stacks, active availability, and real project drive.
          </p>
        </div>
        <div className="dc-story-beat dc-right">
          <div className="dc-num">02</div>
          <h2>Architect The Squad</h2>
          <p>
            Bring complementary talents into one focused node. Assemble hackathon strike teams, open-source contributors, or early startup co-founders.
          </p>
        </div>
        <div className="dc-story-beat">
          <div className="dc-num">03</div>
          <h2>Build In Sync</h2>
          <p>
            Zero-friction formation. Align skills, set team seats, review portfolios, and build unstoppable momentum before writing the first commit.
          </p>
        </div>
        <div className="dc-story-beat dc-right">
          <div className="dc-num">04</div>
          <h2>Ship To Production</h2>
          <p>
            Turn late-night ideas into live demos. Ship to staging, launch to the community, and put what you built into the hands of real users.
          </p>
        </div>
      </div>
    </>
  );
}

export default LandingStory;
