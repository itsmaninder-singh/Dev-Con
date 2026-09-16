import Card from './Card.jsx';
import SkeletonCard from './SkeletonCard.jsx';

export default function CardGrid({ items, loading, activeTab, isFiltered, savedIds, onToggleSave, onJoin, onOpen }) {
  const getEmptyMessage = () => {
    if (isFiltered) {
      return {
        title: 'No matching results',
        desc: 'Try adjusting your search terms or clearing your category filters.',
      };
    }
    if (activeTab === 'projects') {
      return {
        title: 'No projects showcased yet',
        desc: 'Community projects and open-source repositories will appear here once published.',
      };
    }
    if (activeTab === 'teams') {
      return {
        title: 'No open teams yet',
        desc: 'Be the first to create a team and invite collaborators!',
      };
    }
    return {
      title: 'Nothing here yet',
      desc: 'Create a team or share a project to start collaborating with other builders.',
    };
  };

  const emptyMsg = getEmptyMessage();

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
          <div className="display">{emptyMsg.title}</div>
          <p>{emptyMsg.desc}</p>
        </div>
      )}
    </div>
  );
}