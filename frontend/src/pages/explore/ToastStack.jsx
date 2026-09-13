export default function ToastStack({ toasts }) {
  return (
    <div id="toastStack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.leaving ? 'leaving' : ''}`}>
          <span className="toast-dot" />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}