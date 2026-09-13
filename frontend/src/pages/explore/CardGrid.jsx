import Card from './Card.jsx';
import SkeletonCard from './SkeletonCard.jsx';

export default function CardGrid({ items, loading, savedIds, onToggleSave, onJoin, onOpen }) {
  return (
    <div className="grid-wrap">
      <div className="card-grid">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)
          : items.map(item => (
            <Card
              key={item.id}
              item={item}
              saved={savedIds.has(item.id)}
              onToggleSave={onToggleSave}
              onJoin={onJoin}
              onOpen={onOpen}
            />
          ))}
      </div>
      {!loading && items.length === 0 && (
        <div className="empty-state show">
          <div className="display">No matches</div>
          <p>Try another search, or clear your filters.</p>
        </div>
      )}
    </div>
  );
}