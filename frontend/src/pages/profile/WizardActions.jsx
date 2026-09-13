export default function WizardActions({ currentStep, saveState, onBack, onNext }) {
  const isLastStep = currentStep === 3;

  let nextLabel = 'Continue';
  if (isLastStep) {
    if (saveState === 'saving') nextLabel = 'Saving…';
    else if (saveState === 'saved') nextLabel = '✓ Saved';
    else nextLabel = 'Save changes';
  }

  return (
    <div className="wizard-actions">
      <button
        type="button"
        className="cancel-link"
        style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
        onClick={onBack}
      >
        {currentStep === 1 ? 'Cancel' : 'Back'}
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