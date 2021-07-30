import { Localized } from '@fluent/react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { ALL_LOCALES } from '../../../language-select/language-select';

import './stats-card.css';
import { connect, useSelector } from 'react-redux';

function StatsCard({
  className,
  title,
  iconButtons,
  overlay,
  tabs,
  challenge,
  currentLocale,
  style,
  rank,
  numRanks,
}: {
  className?: string;
  title: string;
  iconButtons?: React.ReactNode;
  overlay?: React.ReactNode;
  tabs?: { [label: string]: (props: { locale?: string }) => any };
  challenge?: boolean;
  currentLocale?: string;
  style?: { width: string };
  rank: any;
  numRanks: any;
}) {
  const [locale, setLocale] = useState(ALL_LOCALES);
  const [selectedTab, setSelectedTab] = useState(Object.keys(tabs)[0]);
  useEffect(() => setLocale(currentLocale ? currentLocale : ALL_LOCALES), [currentLocale]);

  const user = useSelector((state: any) => state.user);

  return (
    <div className={'stats-card ' + (className || '')} style={style}>
      {overlay}
      <div className="stats-card__inner">
        <div className="title-and-icon">
          {challenge ? (
            <h2 className="challenge-title">{title}</h2>
          ) : (
            <Localized id={title}>
              <h2 />
            </Localized>
          )}
          {iconButtons}
        </div>
        <div className="filters">
          <div className="tabs">
            {Object.keys(tabs).map(label => {
              return challenge ? (
                <button
                  key={label}
                  type="button"
                  className={label == selectedTab ? 'selected' : ''}
                  onClick={() => setSelectedTab(label)}>
                  {label}
                </button>
              ) : (
                <Localized key={label} id={label}>
                  <button
                    type="button"
                    className={label == selectedTab ? 'selected' : ''}
                    onClick={() => setSelectedTab(label)}
                  />
                </Localized>
              );
            })}
          </div>
          {rank > 0 && user != null && user.account != null && (
            <div style={{ display: 'flex' }}>
              <h3 style={{ padding: '0px', fontWeight: 'unset' }}>Ihr Rang</h3>
              <h3 style={{ padding: '0px', fontWeight: 'unset' }}>
                : {rank} von {numRanks}
              </h3>
            </div>
          )}
        </div>
        <div className="content">{tabs[selectedTab]({ locale: locale == ALL_LOCALES ? null : locale })}</div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  return {
    rank: state.rank.myRank,
    numRanks: state.rank.numberOfRanks,
  };
};
export default connect(mapStateToProps)(StatsCard);
