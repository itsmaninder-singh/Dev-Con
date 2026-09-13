const STEPS = [
  { id: 1, label: 'Photos & basics' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Availability' }
];

export default function StepsBar({ currentStep, onGoStep }) {
  return (
    <div className="steps-bar">
      {STEPS.map((step, i) => (
        <div key={step.id} style={{ display: 'contents' }}>
          <div
            className={[
              'step-dot',
              currentStep === step.id ? 'active' : '',
              currentStep > step.id ? 'done' : ''
            ].join(' ').trim()}
            onClick={() => onGoStep(step.id)}
          >
            <span>{step.id}</span>{step.label}
          </div>
          {i < STEPS.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}