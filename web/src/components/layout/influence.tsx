import * as React from 'react';
import './influence.css';

interface InfluenceProps {
  name: string;
  pitch: string;
  headshot: string;
}

export default ({ name, pitch, headshot }: InfluenceProps) => (
  <div className="influence-card">
    <div className="influence-img-contain">
      <img className="card-img" src={require(`../../../img/influencers/${headshot}.webp`)} />
    </div>
    <div className="influence-content">
      <h4>{name}</h4>
      <q>{pitch}</q>
    </div>
  </div>
);
