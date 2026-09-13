export default function WizardActions({ currentStep, totalSteps, saveState, finalLabel, onBack, onNext }) {
  const isLastStep = currentStep === totalSteps;

  let nextLabel = 'Continue';
  if (isLastStep) {
    if (saveState === 'saving') nextLabel = 'Creating…';
    else if (saveState === 'saved') nextLabel = `✓ ${finalLabel} created`;
    else nextLabel = `Create ${finalLabel}`;
  }

  return (
    <div className="wizard-actions">
      <button
        type="button"
        className="cancel-link"
        style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
        onClick={onBack}
      >
        Back
      </button>
      <button
        type="button"
        className={`save-btn ${isLastStep ? 'ready' : ''}`}
        onClick={onNext}
        disabled={saveState === 'saving'}
      >
        {nextLabel}
      </button>
    </div>
  );
}