import * as React from 'react';
import { MicIcon, OldPlayIcon } from '../../../ui/icons';
import './progress-card.css';

interface Props {
  isSpeak: boolean;
  global: boolean;
  current?: number;
  total?: number;
}

export default function ProgressCard({ current, global, isSpeak, total }: Props) {
  const a = [
    'Ihre überprüften Aufzeichnungen',
    'Ihre aufgenommenen Aufzeichnungen',
    'Global überprüfte Aufzeichnungen',
    'Global aufgenommene Aufzeichnungen',
  ];
  const title = a[+isSpeak + +global * 2];
  const todayTitle = `${title} (heute)`;
  const totalTitle = `${title} (total)`;
  return (
    <div className={'progress-card ' + (isSpeak ? 'speak' : 'listen')}>
      <div className="personal">
        <div className="fraction md-right ">
          <div className="numerator">{current}</div>
        </div>
        <div className="description">{todayTitle}</div>
      </div>
      <div className="progress-wrap">
        <div className="progress">
          <div className="icon-wrap">
            {isSpeak ? <MicIcon /> : <OldPlayIcon style={{ position: 'relative', left: 3 }} />}
          </div>
        </div>
      </div>
      <div className="overall">
        <div className="fraction md-right ">
          <div className="numerator">{total}</div>
        </div>
        <div className="description">{totalTitle}</div>
      </div>
    </div>
  );
}
