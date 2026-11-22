import React from 'react';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/portal/ui/Card';
import type { EventItem } from '@/types/portal';

/** The podium for a finished event, on the event's own page. */
export const ResultsPanel: React.FC<{ event: Pick<EventItem, 'winner' | 'runnerUp1' | 'runnerUp2' | 'honourableMentions'> }> = ({ event }) => {
  if (!event.winner) return null;
  const podium = [
    { place: 'Winner', name: event.winner, tone: 'bg-[#f6b51e] text-[#1c130c]' },
    { place: 'First runner-up', name: event.runnerUp1, tone: 'bg-surface-sunken text-ink' },
    { place: 'Second runner-up', name: event.runnerUp2, tone: 'bg-surface-sunken text-ink' },
  ].filter((p) => p.name);
  const mentions = (event.honourableMentions || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <Card elevation={1} className="p-5 sm:p-6 space-y-4">
      <h2 className="ed-subhead">
        <Trophy className="w-4 h-4 text-[#c8102e]" aria-hidden /> Results
      </h2>
      <ol className="grid gap-2.5 sm:grid-cols-3">
        {podium.map((p) => (
          <li key={p.place} className={`rounded-xl px-4 py-3 ${p.tone}`}>
            <p className="text-[0.75rem] font-medium opacity-75">{p.place}</p>
            <p className="text-[0.9375rem] font-bold break-words">{p.name}</p>
          </li>
        ))}
      </ol>
      {mentions.length > 0 && (
        <p className="text-[0.8125rem] text-ink-muted">
          <span className="font-semibold text-ink">Honourable mentions: </span>
          {mentions.join(', ')}
        </p>
      )}
    </Card>
  );
};
