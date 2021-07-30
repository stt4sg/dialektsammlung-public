import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DAILY_GOALS } from '../../../constants';
import { useAccount, useAPI } from '../../../hooks/store-hooks';
import URLS from '../../../urls';
import { LocaleLink, useLocale } from '../../locale-helpers';
import { CheckIcon } from '../../ui/icons';
import { Button, LinkButton } from '../../ui/ui';
import { SET_COUNT } from './contribution';
import { getTrackClass } from '../../../services/tracker';

import './success.css';

const COUNT_UP_MS = 500; // should be kept in sync with .contribution-success .done transition duration

const GoalPercentage = ({ current, final }: { current: number; final: number }) => (
  <span className="goal-percentage">
    <span className="final">{final}%</span>
    <span className="current">{current}%</span>
  </span>
);

function Success({
  getString,
  onReset,
  type,
}: {
  type: 'speak' | 'listen';
  onReset: () => any;
} & WithLocalizationProps) {
  const api = useAPI();
  const account = useAccount();

  const [locale] = useLocale();

  const hasAccount = Boolean(account);
  const customGoal = hasAccount && account.custom_goals?.find(g => g.locale == locale);
  const goalValue = DAILY_GOALS[type][0];

  const killAnimation = useRef(false);
  const startedAt = useRef(null);

  const [contributionCount, setContributionCount] = useState(null);
  const [currentCount, setCurrentCount] = useState(null);

  function countUp(time: number) {
    if (killAnimation.current) return;
    if (!startedAt.current) startedAt.current = time;
    const newCount = Math.min(
      Math.ceil((contributionCount * (time - startedAt.current)) / COUNT_UP_MS),
      contributionCount
    );
    setCurrentCount(newCount);

    if (newCount < contributionCount) {
      requestAnimationFrame(countUp);
    }
  }

  useEffect(() => {
    (type === 'speak' ? api.fetchDailyClipsCount() : api.fetchDailyVotesCount()).then(value => {
      setContributionCount(value + SET_COUNT);
    });
    return () => {
      killAnimation.current = true;
    };
  }, []);

  useEffect(() => {
    if (contributionCount != null) {
      countUp(performance.now());
    }
  }, [contributionCount]);

  const finalPercentage = Math.ceil((100 * (contributionCount || 0)) / goalValue);

  const ContributeMoreButton = (props: { children: React.ReactNode }) => {
    return hasAccount ? (
      <Button className="contribute-more-button" rounded onClick={onReset} {...props} />
    ) : (
      <Button className="contribute-more-button" rounded onClick={onReset} {...props} />
    );
  };

  const goalPercentage = (
    <GoalPercentage
      current={Math.ceil((100 * (currentCount === null ? 0 : currentCount)) / goalValue)}
      final={finalPercentage}
    />
  );

  const login = {
    color: 'black',
    background: 'none',
    border: 'none',
  };

  return (
    <div className="contribution-success">
      <div className="counter done">
        <CheckIcon />
        <Localized
          id="clips-with-count-pluralized"
          elems={{ bold: <b /> }}
          vars={{ count: SET_COUNT + '/' + SET_COUNT }}>
          <span className="text" />
        </Localized>
      </div>
      {hasAccount ? (
        !customGoal && (
          <div className="info-card">
            <div className="thanks">Herzlichen Dank!</div>
            <ContributeMoreButton>
              <Localized id="contribute-more" vars={{ count: SET_COUNT }}>
                <span />
              </Localized>
            </ContributeMoreButton>
            {/*<Localized id="get-started-goals">
              <LinkButton rounded href={URLS.GOALS} />
            </Localized>*/}
          </div>
        )
      ) : (
        <div className="info-card">
          <div className="thanks">Herzlichen Dank!</div>
          <ContributeMoreButton>
            <Localized id="contribute-more" vars={{ count: SET_COUNT }}>
              <span />
            </Localized>
          </ContributeMoreButton>
        </div>
      )}

      {!hasAccount && (
        <Localized id="login-signup">
          <LinkButton style={login} href="/login" className={getTrackClass('fs', `nudge-profile-on-succcess`)} />
        </Localized>
      )}

      {hasAccount && (
        <Localized id="edit-profile">
          <LocaleLink className="secondary" to={URLS.PROFILE_INFO} />
        </Localized>
      )}
    </div>
  );
}

export default withLocalization(Success);
