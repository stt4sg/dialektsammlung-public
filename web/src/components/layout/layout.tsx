import { Localized } from '@fluent/react';
import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LOCALES, NATIVE_NAMES } from '../../services/localization';
import { getTrackClass } from '../../services/tracker';
import StateTree from '../../stores/tree';
import { User } from '../../stores/user';
import { Locale } from '../../stores/locale';
import URLS from '../../urls';
import { replacePathLocale } from '../../utility';
import { LocaleLink, LocaleNavLink } from '../locale-helpers';
import {
  DashboardIcon,
  ExternalLinkIcon,
  MenuIcon,
  MicIcon,
  OldPlayIcon,
  TargetIcon,
  UserIcon,
  LogoutIcon,
} from '../ui/icons';
import { Avatar, LinkButton } from '../ui/ui';
import Content from './content';
import Footer from './footer';
import Logo from './logo';
import Nav from './nav';
import UserMenu from './user-menu';
import classnames from 'classnames';
import WelcomeModal from '../welcome-modal/welcome-modal';
import { ChallengeTeamToken, challengeTeamTokens, ChallengeToken, challengeTokens } from 'common';
import API from '../../services/api';
import NotificationBanner from './../notification-banner/notification-banner';
import { Notifications } from '../../stores/notifications';

export const LOCALES_WITH_NAMES = LOCALES.map(code => [code, NATIVE_NAMES[code] || code]).sort((l1, l2) =>
  l1[1].localeCompare(l2[1])
);

interface PropsFromState {
  locale: Locale.State;
  user: User.State;
  api: API;
}

interface PropsFromDispatch {
  setLocale: typeof Locale.actions.set;
}

interface LayoutProps extends PropsFromState, PropsFromDispatch, RouteComponentProps<any, any, any> {
  rank?: any;
}

interface LayoutState {
  challengeTeamToken: ChallengeTeamToken;
  challengeToken: ChallengeToken;
  isMenuVisible: boolean;
  hasScrolled: boolean;
  showWelcomeModal: boolean;
  /**
   * @deprecated TODO is this even used anywhere? , this was/is always set to null anyways
   */
  featureStorageKey?: string;
}

const SegmentBanner = ({ locale, featureStorageKey }: { locale: string; featureStorageKey: string }) => {
  const notification: Notifications.Notification = {
    id: 99,
    kind: 'banner',
    content: (
      <>
        <Localized id="target-segment-first-banner" vars={{ locale: NATIVE_NAMES[locale] }} />
      </>
    ),
    bannerProps: {
      storageKey: featureStorageKey,
      links: [
        {
          to: URLS.SPEAK,
          className: 'cta',
          persistAfterClick: true,
          children: (
            <>
              <TargetIcon />
              <Localized key="target-segment-add-voice" id="target-segment-add-voice">
                <div />
              </Localized>
            </>
          ),
        },
        {
          href: locale === 'es' ? URLS.TARGET_SEGMENT_INFO_ES : URLS.TARGET_SEGMENT_INFO,
          blank: true,
          persistAfterClick: true,
          className: 'cta external',
          children: (
            <>
              <ExternalLinkIcon />
              <Localized key="target-segment-learn-more" id="target-segment-learn-more">
                <div />
              </Localized>
            </>
          ),
        },
      ],
    },
  };

  return <NotificationBanner key="target-segment" notification={notification} />;
};

class Layout extends React.PureComponent<LayoutProps, LayoutState> {
  state: LayoutState = {
    challengeTeamToken: undefined,
    challengeToken: undefined,
    isMenuVisible: false,
    hasScrolled: false,
    showWelcomeModal: false,
    featureStorageKey: null,
  };

  async componentDidMount() {
    const { locale } = this.props;
    window.addEventListener('scroll', this.handleScroll);
    this.visitHash();

    const challengeTeamToken = this.getTeamToken();
    const challengeToken = this.getChallengeToken();

    this.setState({
      challengeTeamToken: challengeTeamToken,
      challengeToken: challengeToken,
      showWelcomeModal: challengeTeamToken !== undefined && challengeToken !== undefined,
      featureStorageKey: null,
    });
  }

  componentDidUpdate(nextProps: LayoutProps, nextState: LayoutState) {
    if (this.props.location.pathname !== nextProps.location.pathname) {
      this.setState({ isMenuVisible: false });

      // Immediately scrolling up after page change has no effect.
      setTimeout(() => {
        if (location.hash) {
          this.visitHash();
        } else {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }
      }, 250);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  private visitHash() {
    if (location.hash) {
      setTimeout(() => {
        const node = document.querySelector(location.hash);
        node && node.scrollIntoView();
      }, 100);
    }
  }

  private handleScroll = () => {
    const { scrollY } = window;
    this.setState({
      hasScrolled: scrollY > 0,
    });
  };

  private toggleMenu = () => {
    this.setState({ isMenuVisible: !this.state.isMenuVisible });
  };

  private selectLocale = async (locale: string) => {
    const { setLocale, history } = this.props;
    history.push(replacePathLocale(history.location.pathname, locale));
    setLocale(locale);
    this.setState({
      featureStorageKey: null,
    });
  };

  private getChallengeToken = () => {
    return challengeTokens.find(challengeToken => this.props.location.search.includes(`challenge=${challengeToken}`));
  };

  private getTeamToken = () => {
    return challengeTeamTokens.find(challengeTeamToken =>
      this.props.location.search.includes(`team=${challengeTeamToken}`)
    );
  };

  render() {
    const { location, user } = this.props;
    const { challengeTeamToken, challengeToken, hasScrolled, isMenuVisible, showWelcomeModal } = this.state;
    const isBuildingProfile = location.pathname.includes(URLS.PROFILE_INFO);

    const pathParts = location.pathname.replace(/(404|503)/g, 'error-page').split('/');
    const className = classnames(pathParts[2] ? pathParts.slice(2).join(' ') : 'home');

    const alreadyEnrolled = this.state.showWelcomeModal && user.account?.enrollment?.challenge;
    const redirectURL = URLS.DASHBOARD + URLS.CHALLENGE;

    return (
      <div id="main" className={className}>
        {alreadyEnrolled && <Redirect to={redirectURL} />}
        {showWelcomeModal && !alreadyEnrolled && (
          <WelcomeModal
            onRequestClose={() => {
              this.setState({ showWelcomeModal: false });
            }}
            challengeToken={challengeToken}
            teamToken={challengeTeamToken}
          />
        )}
        <header className={hasScrolled ? 'active' : ''}>
          <div>
            <Logo />
            <Nav id="main-nav" />
          </div>
          <div>
            {this.renderTallies()}
            {user.account ? (
              <UserMenu />
            ) : isBuildingProfile ? null : (
              <Localized id="login-signup">
                <LinkButton className="login" href="/login" rounded outline />
              </Localized>
            )}
            <button id="hamburger-menu" onClick={this.toggleMenu} className={isMenuVisible ? 'active' : ''}>
              {user.account ? (
                <Avatar url={user.account.avatar_url} />
              ) : (
                <MenuIcon className={isMenuVisible ? 'active' : ''} />
              )}
            </button>
          </div>
        </header>
        <Content location={location} />
        <Footer />
        <div id="navigation-modal" className={this.state.isMenuVisible ? 'active' : ''}>
          <Nav>
            <div className="user-nav">
              {user.account && (
                <div>
                  <LocaleNavLink className="user-nav-link" to={URLS.DASHBOARD}>
                    <DashboardIcon />
                    <Localized id="dashboard">
                      <span />
                    </Localized>
                  </LocaleNavLink>
                  <LocaleNavLink className="user-nav-link" to={URLS.PROFILE_INFO}>
                    <UserIcon />
                    <Localized id="profile">
                      <span />
                    </Localized>
                  </LocaleNavLink>
                  {/* <LocaleNavLink className="user-nav-link" to={URLS.PROFILE_SETTINGS}>
                    <CogIcon />
                    <Localized id="settings">
                      <span />
                    </Localized>
                  </LocaleNavLink> */}
                </div>
              )}
              {
                <>
                  {user.account ? (
                    <Localized id="logout">
                      <LinkButton rounded href="/logout" />
                    </Localized>
                  ) : (
                    <Localized id="login-signup">
                      <LinkButton rounded href="/login" />
                    </Localized>
                  )}
                </>
              }
            </div>
          </Nav>
        </div>
      </div>
    );
  }

  private renderTallies() {
    const { user } = this.props;
    return (
      <LocaleLink
        className={[
          'tallies',
          getTrackClass('fs', 'menubar-cta'),
          user.account ? getTrackClass('fs', 'logged-in') : '',
        ].join(' ')}
        to={user.account ? URLS.DASHBOARD : URLS.SPEAK}>
        <div className="record-tally">
          <MicIcon />
          <div>{user.account ? user.account.clips_count : user.recordTally}</div>
        </div>
        <div className="divider" />
        <div className="validate-tally">
          <OldPlayIcon />
          {user.account ? user.account.votes_count : user.validateTally}
        </div>
      </LocaleLink>
    );
  }
}

const mapStateToProps = (state: StateTree) => ({
  locale: state.locale,
  user: state.user,
  api: state.api,
  rank: state.rank.myRank,
});

const mapDispatchToProps = {
  setLocale: Locale.actions.set,
};

export default withRouter(connect<PropsFromState, PropsFromDispatch>(mapStateToProps, mapDispatchToProps)(Layout));
