import * as React from 'react';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import ProgressCard from './progress-card';
import './stats.css';
import { useAPI } from '../../../../hooks/store-hooks';
import UserRank from './userrank-card';
import { Link } from 'react-router-dom';
import { Rank } from 'common';

export default function StatsPage() {
  const api = useAPI();
  const [ds, setDs] = useState({
    votesPerDay: 0,
    votesTotal: 0,
    clipPerDay: 0,
    clipTotal: 0,
    votesPerDayClient: 0,
    votesTotalClient: 0,
    clipPerDayClient: 0,
    clipTotalClient: 0,
  });
  const fetchAndSetOverallCount = async () => setDs(await api.getDashboardStats());

  const [rank, setRank]: [Rank, Dispatch<SetStateAction<Rank>>] = useState({
    myRank: 0,
    mySchoggitaler: 0,
  });
  const fetchAndSetRank = async () => setRank(await api.getRank());

  useEffect(() => {
    fetchAndSetOverallCount();
    fetchAndSetRank();
  }, []);

  return (
    <div className="stats-page">
      {rank.myRank > 0 ? (
        <div className="cards">
          <Link to={'/de/top-contributors'}>
            <UserRank value={rank.myRank} text={'Rang in der Rangliste'} schoggitaler={false} />
          </Link>
          <UserRank value={rank.mySchoggitaler} text={'Gesammelte Schoggitaler'} schoggitaler={true} />
        </div>
      ) : (
        ''
      )}

      <div className="cards">
        <ProgressCard global={false} isSpeak={true} current={ds.clipPerDayClient} total={ds.clipTotalClient} />
        <ProgressCard global={false} isSpeak={false} current={ds.votesPerDayClient} total={ds.votesTotalClient} />
      </div>
      <div className="cards">
        <ProgressCard global={true} isSpeak={true} current={ds.clipPerDay} total={ds.clipTotal} />
        <ProgressCard global={true} isSpeak={false} current={ds.votesPerDay} total={ds.votesTotal} />
      </div>
    </div>
  );
}
