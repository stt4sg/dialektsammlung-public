import * as React from 'react';
import './userrank-card.css';
import { GoldCoinIcon } from '../../../ui/icons';

interface Props {
  value: number;
  text: string;
  schoggitaler: boolean;
}

export default function UserRank({ value, text, schoggitaler }: Props) {
  return (
    <div className="rank-card">
      <div className="box personal">
        <div className="fraction md-right ">
          <div className="numerator">{value}</div>
        </div>
        <div className="description">
          {text} {schoggitaler ? <GoldCoinIcon /> : ''}
        </div>
      </div>
    </div>
  );
}
