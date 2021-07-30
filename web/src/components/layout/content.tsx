import * as React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import URLS from '../../urls';
import { isContributable, useLocale } from '../locale-helpers';
import DocumentPage from '../pages/document-page';
import { Spinner } from '../ui/ui';
import { LoginFailure, LoginSuccess } from '../pages/login';
import { VerificationPendingPage } from '../pages/verification-pending/verification-pending-page';
const HomePage = React.lazy(() => import('../pages/home/home'));
const DashboardPage = React.lazy(() => import('../pages/dashboard/dashboard'));
const KampfDerKantonePage = React.lazy(() => import('../pages/kampf-der-kantone/kampf-der-kantone'));
const ProfileLayoutPage = React.lazy(() => import('../pages/profile/layout'));
const AboutPage = React.lazy(() => import('../pages/about/about'));
const PRPage = React.lazy(() => import('../pages/public-relations/pr'));
const ErrorPage = React.lazy(() => import('../pages/error-page/error-page'));
const TopContributorsStatsPage = React.lazy(() => import('../pages/dashboard/stats/top-contributors-stats-page'));

export default function Content({ location }: { location: any }) {
  const [locale, toLocaleRoute] = useLocale();
  return (
    <div id="content">
      <React.Suspense fallback={<Spinner />}>
        <Switch>
          <Route exact path={toLocaleRoute(URLS.ROOT)} component={HomePage} />
          <Route exact path={toLocaleRoute('/new')} render={() => <Redirect to={toLocaleRoute(URLS.ROOT)} />} />
          <Route
            exact
            path={toLocaleRoute(URLS.RECORD)}
            render={() => <Redirect to={toLocaleRoute(isContributable(locale) ? URLS.SPEAK : URLS.ROOT)} />}
          />
          <Route exact path={toLocaleRoute('/kampf-der-kantone')} component={KampfDerKantonePage} />
          <Route exact path={toLocaleRoute('/login-failure')} component={LoginFailure} />
          <Route exact path={toLocaleRoute('/login-success')} component={LoginSuccess} />
          <Route exact path={toLocaleRoute('/verification-needed')} component={VerificationPendingPage} />
          <Route exact path={toLocaleRoute('/login-failure')} component={LoginFailure} />
          <Route exact path={toLocaleRoute('/login-success')} component={LoginSuccess} />
          <Route exact path={toLocaleRoute('/verification-needed')} component={VerificationPendingPage} />
          <Route
            exact
            path={toLocaleRoute(URLS.PROFILE)}
            render={() => <Redirect to={toLocaleRoute(URLS.PROFILE_INFO)} />}
          />
          <Route path={toLocaleRoute(URLS.PROFILE + '/')} component={ProfileLayoutPage} />
          <Route path={toLocaleRoute(URLS.DASHBOARD)} component={DashboardPage} />
          {[URLS.CHALLENGE, URLS.STATS, URLS.GOALS, URLS.AWARDS].map(path => (
            <Route
              key={path}
              exact
              path={toLocaleRoute(path)}
              render={() => <Redirect to={toLocaleRoute(URLS.DASHBOARD + path)} />}
            />
          ))}
          <Route
            exact
            path={toLocaleRoute(URLS.PROFILE_GOALS)}
            render={() => <Redirect to={toLocaleRoute(URLS.DASHBOARD + '/' + URLS.GOALS)} />}
          />
          <Route exact path={toLocaleRoute(URLS.ABOUT)} component={AboutPage} />
          <Route exact path={toLocaleRoute(URLS.PR)} component={PRPage} />
          <Route exact path={toLocaleRoute(URLS.TOP_CONTRIBUTORS)} component={TopContributorsStatsPage} />
          <Route exact path={toLocaleRoute(URLS.PRIVACY)} render={() => <DocumentPage key="p" name="privacy" />} />
          <Route exact path={toLocaleRoute(URLS.TERMS)} render={() => <DocumentPage key="t" name="terms" />} />
          <Route
            exact
            path={toLocaleRoute(URLS.CHALLENGE_TERMS)}
            render={() => <DocumentPage key="c" name="challenge-terms" />}
          />
          <Route
            exact
            path={toLocaleRoute(URLS.PR_COVERAGE)}
            render={() => <DocumentPage key="a" name="pr-coverage" />}
          />
          <Route
            path={toLocaleRoute('/404')}
            render={() => <ErrorPage errorCode="404" prevPath={location.state?.prevPath} />}
          />
          <Route
            path={toLocaleRoute('/503')}
            render={() => <ErrorPage errorCode="503" prevPath={location.state?.prevPath} />}
          />
          <Route
            exact
            path={toLocaleRoute(URLS.SPEAK)}
            render={() => {
              // note: this is redundant with routing in LocalizedPage in app.tsx, and hanldes
              // locale changing edge cases where toLocaleRoute is still using the old locale
              return <Redirect to={toLocaleRoute(URLS.SPEAK)} />;
            }}
          />
          <Route
            exact
            path={toLocaleRoute(URLS.LISTEN)}
            render={() => {
              // note: this is redundant with routing in LocalizedPage in app.tsx, and hanldes
              // locale changing edge cases where toLocaleRoute is still using the old locale
              return <Redirect to={toLocaleRoute(URLS.LISTEN)} />;
            }}
          />
          <Redirect
            push
            to={{
              pathname: toLocaleRoute('/404'),
              state: { prevPath: location.pathname },
            }}
          />
        </Switch>
      </React.Suspense>
    </div>
  );
}
