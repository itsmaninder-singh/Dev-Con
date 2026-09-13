export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skel-bar skel-badge" />
      <div className="skel-bar skel-title" />
      <div className="skel-bar skel-line" />
      <div className="skel-bar skel-line short" />
      <div className="skel-chips">
        <div className="skel-bar skel-chip" />
        <div className="skel-bar skel-chip" />
        <div className="skel-bar skel-chip" />
      </div>
      <div className="skel-footer">
        <div className="skel-bar skel-owner" />
        <div className="skel-bar skel-btn" />
      </div>
    </div>
  );
}