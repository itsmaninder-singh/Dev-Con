export default function Switch({ on, onToggle }) {
  return (
    <button type="button" className={`switch ${on ? 'on' : ''}`} onClick={onToggle} aria-pressed={on} />
  );
}