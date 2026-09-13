import '../Hackathons.css';

export default function Hackathons() {
  const text = "COMING SOON";

  return (
    <div className="hk-root">
      <div className="hk-glow" aria-hidden="true" />

      <main className="hk-hero">
        <h1 className="hk-heading">
          <span className="hk-letters">
            {text.split('').map((char, index) => (
              <span
                key={index}
                className="hk-letter"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </h1>
      </main>
    </div>
  );
}