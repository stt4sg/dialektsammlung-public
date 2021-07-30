import { Localized } from '@fluent/react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { useAccount, useAction, useAPI } from '../../../hooks/store-hooks';
import { useRouter } from '../../../hooks/use-router';
import URLS from '../../../urls';
import { isContributable, LocaleNavLink, useLocale } from '../../locale-helpers';
import { Notifications } from '../../../stores/notifications';
import StatsPage from './stats/stats';
import ChallengePage from './challenge/challenge';
import InviteModal from '../../invite-modal/invite-modal';
import { isChallengeLive, isEnrolled, pilotDates } from './challenge/constants';
import './dashboard.css';

const TITLE_BAR_LOCALE_COUNT = 3;

const TopBar = ({
  dashboardLocale,
  setShowInviteModal,
}: {
  dashboardLocale: string;
  setShowInviteModal(arg: any): void;
}) => {
  const { history, location } = useRouter();
  const [, toLocaleRoute] = useLocale();
  const account = useAccount();
  const [isAboveMdWidth, setIsAboveMdWidth] = useState(true);
  const isChallengeEnrolled = isEnrolled(account);
  const isChallengeTabSelected = location.pathname.endsWith('/challenge') && isChallengeEnrolled;

  function setLocale(value: string) {
    const pathParts = location.pathname.split('/');
    history.push([toLocaleRoute(URLS.DASHBOARD), value, pathParts[pathParts.length - 1]].filter(Boolean).join('/'));
  }

  const locales = [''].concat(
    (account ? account.locales : []).map(({ locale }) => locale).filter(l => isContributable(l))
  );
  const titleBarLocales = isAboveMdWidth ? locales.slice(0, TITLE_BAR_LOCALE_COUNT) : [];
  const dropdownLocales = isAboveMdWidth ? locales.slice(TITLE_BAR_LOCALE_COUNT) : locales;

  useEffect(() => {
    const checkSize = () => {
      const { innerWidth } = window;
      setIsAboveMdWidth(innerWidth >= 768);
    };
    checkSize();
    window.addEventListener('resize', checkSize);

    return () => {
      window.removeEventListener('resize', checkSize);
    };
  }, [isChallengeTabSelected]);

  return (
    <div className={`top-bar${isChallengeEnrolled ? ' with-challenge' : ''}`}>
      <div className="underlined">
        <nav>
          {isChallengeEnrolled && (
            <LocaleNavLink
              key={URLS.CHALLENGE}
              to={URLS.DASHBOARD + (dashboardLocale ? '/' + dashboardLocale : '') + URLS.CHALLENGE}>
              <h2>Challenge</h2>
            </LocaleNavLink>
          )}
          {[['stats', URLS.STATS]].map(([label, path]) => (
            <LocaleNavLink key={path} to={URLS.DASHBOARD + (dashboardLocale ? '/' + dashboardLocale : '') + path}>
              <Localized id={label}>
                <h2 />
              </Localized>
            </LocaleNavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

function DashboardContent({
  Page,
  dashboardLocale,
}: {
  Page: typeof ChallengePage | typeof StatsPage;
  dashboardLocale: string;
}) {
  const api = useAPI();
  const [allGoals, setAllGoals] = useState(null);

  useEffect(() => {
    api.fetchGoals(dashboardLocale || null).then(setAllGoals);
  }, [dashboardLocale]);

  return <Page {...{ allGoals, dashboardLocale }} />;
}

export default function Dashboard() {
  const { match } = useRouter();
  const account = useAccount();
  const api = useAPI();
  const [, toLocaleRoute] = useLocale();
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const addAchievement = useAction(Notifications.actions.addAchievement);
  const isChallengeEnrolled = isEnrolled(account);
  const pages = [{ subPath: URLS.STATS, Page: StatsPage }];
  let defaultPage = URLS.STATS;
  if (isChallengeEnrolled) {
    // @ts-ignore
    pages.unshift({ subPath: URLS.CHALLENGE, Page: ChallengePage });
    if (isChallengeLive(pilotDates)) {
      defaultPage = URLS.CHALLENGE;
    }
  }

  useEffect(() => {
    if (!account) {
      sessionStorage.setItem('redirectURL', location.pathname);
      window.location.href = '/login';
    }
  }, []);

  return (
    <div
      className={
        'dashboard' + isChallengeEnrolled
          ? ' ' + isChallengeLive(pilotDates)
            ? 'challenge-online'
            : 'challenge-offline'
          : ''
      }>
      {showInviteModal && (
        <InviteModal
          enrollment={account.enrollment}
          onRequestClose={() => {
            setShowInviteModal(false);
            if (JSON.parse(sessionStorage.getItem('showInviteSendToast'))) {
              addAchievement(50, 'You sent your first invite!');
              sessionStorage.removeItem('showInviteSendToast');
            }
            if (
              !JSON.parse(sessionStorage.getItem('challengeEnded')) &&
              !JSON.parse(sessionStorage.getItem('hasEarnedSessionToast')) &&
              JSON.parse(sessionStorage.getItem('hasContributed'))
            ) {
              addAchievement(50, "You're on a roll! You sent an invite and contributed in the same session.");
              sessionStorage.removeItem('hasEarnedSessionToast');
              sessionStorage.removeItem('hasContributed');
              // Tell back-end user get unexpected achievement: invite + contribute in the same session
              // Each user can only get once.
              api.setInviteContributeAchievement();
            }
          }}
        />
      )}
      <div className="inner">
        <Switch>
          {pages.map(({ subPath, Page }) => (
            <Route
              key={subPath}
              exact
              path={match.path + subPath}
              render={() => (
                <>
                  <TopBar dashboardLocale="" setShowInviteModal={setShowInviteModal} />
                  <DashboardContent dashboardLocale="" {...{ Page }} />
                </>
              )}
            />
          ))}
          <Route
            path={match.path + '/:dashboardLocale'}
            render={({
              match: {
                params: { dashboardLocale },
              },
            }) => (
              <>
                <TopBar {...{ dashboardLocale }} setShowInviteModal={setShowInviteModal} />
                <Switch>
                  {pages.map(({ subPath, Page }) => (
                    <Route
                      key={subPath}
                      exact
                      path={match.path + '/' + dashboardLocale + subPath}
                      render={() => <DashboardContent {...{ dashboardLocale, Page }} />}
                    />
                  ))}
                  <Route render={() => <Redirect to={toLocaleRoute(URLS.DASHBOARD + defaultPage)} />} />
                </Switch>
              </>
            )}
          />
          <Route render={() => <Redirect to={toLocaleRoute(URLS.DASHBOARD + defaultPage)} />} />
        </Switch>
      </div>
    </div>
  );
}
