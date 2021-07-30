import * as React from 'react';
import Props from '../props';
import ProgressCard from './progress-card';

import './stats.css';
import StatsCard from './stats-card';
import ContributionActivity from './contribution-activity';
import LeaderboardCard from './leaderboard-card';

const TopContributorsStatsPage = ({ allGoals, dashboardLocale }: Props) => (
  <div className="stats-page">
    <div className="cards">
      <LeaderboardCard currentLocale={dashboardLocale} />
    </div>
  </div>
);

export default TopContributorsStatsPage;
