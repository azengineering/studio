import type { Leader } from '@/data/leaders';
import LeaderCard from './leader-card';
import { Gavel } from 'lucide-react';

interface LeaderListProps {
  leaders: Leader[];
}

export default function LeaderList({ leaders }: LeaderListProps) {
  if (leaders.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-lg bg-secondary">
        <Gavel className="w-12 h-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold font-headline">No Leaders Found</h3>
        <p className="mt-2 text-muted-foreground">
          Try adjusting your filters to find political leaders.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {leaders.map((leader) => (
        <LeaderCard key={leader.id} leader={leader} />
      ))}
    </div>
  );
}
