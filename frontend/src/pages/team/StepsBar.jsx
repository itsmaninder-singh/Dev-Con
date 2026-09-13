export default function StepsBar({ steps, currentStep, onGoStep }) {
  return (
    <div className="steps-bar">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        return (
          <div key={stepNum} style={{ display: 'contents' }}>
            <div
              className={[
                'step-dot',
                currentStep === stepNum ? 'active' : '',
                currentStep > stepNum ? 'done' : ''
              ].join(' ').trim()}
              onClick={() => onGoStep(stepNum)}
            >
              <span>{stepNum}</span>{label}
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}