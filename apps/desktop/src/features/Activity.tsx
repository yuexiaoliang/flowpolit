import { useState } from 'react';
import {
  Brain,
  CaretRight,
  ChatCircleText,
  CircleNotch,
  Globe,
  PuzzlePiece,
  TerminalWindow,
} from '@phosphor-icons/react';
import type { ActivityEvent } from '../demo/types';

const eventIcons = {
  user: ChatCircleText,
  execution: Globe,
  thought: Brain,
  tool: TerminalWindow,
  skill: PuzzlePiece,
};
export function Activity({ events }: { events: ActivityEvent[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return events.map((event) => {
    const Icon = eventIcons[event.type] || CircleNotch;
    return (
      <div className={'activity-event ' + event.type} key={event.id}>
        <button
          className="activity-row"
          aria-expanded={open === event.id}
          onClick={() => setOpen(open === event.id ? null : event.id)}
        >
          <span className={'activity-icon ' + event.type}>
            <Icon size={16} />
          </span>
          <span className="activity-text">
            <strong>{event.label}</strong>
            <small>{event.summary}</small>
          </span>
          <span className="activity-status">{event.status}</span>
          <CaretRight size={13} className={open === event.id ? 'open' : ''} />
        </button>
        {open === event.id && <p className="activity-detail">{event.detail || event.summary}</p>}
      </div>
    );
  });
}
