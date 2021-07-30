import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import { connect } from 'react-redux';
import { Clip as ClipType } from 'common';
import { getTrackClass, trackListening } from '../../../../services/tracker';
import { Clips } from '../../../../stores/clips';
import { Locale } from '../../../../stores/locale';
import StateTree from '../../../../stores/tree';
import API from '../../../../services/api';
import URLS from '../../../../urls';
import { localeConnector, LocalePropsFromState } from '../../../locale-helpers';
import {
  CheckIcon,
  CrossIcon,
  MicIcon,
  OldPlayIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  VolumeIcon,
} from '../../../ui/icons';
import { LinkButton } from '../../../ui/ui';
import ContributionPage, { ContributionPillProps, SET_COUNT } from '../contribution';
import { Notifications } from '../../../../stores/notifications';
import { PlayButton } from '../../../primary-buttons/primary-buttons';
import Pill from '../pill';
import './listen.css';
import { RouteComponentProps, withRouter } from 'react-router';
import ListenPageModal from './../../../../components/listen-page-modal/ListenPageModal';
import { Cookies } from 'react-cookie';
import { User } from '../../../../stores/user';
import * as React from 'react';
import { ButtonHTMLAttributes, Component, createRef } from 'react';

const VOTE_NO_PLAY_MS = 3000; // Threshold when to allow voting no
const USERDATA = 'userdata';

const activateListenModalInLocalStorage = async () => {
  let userdata = JSON.parse(localStorage.getItem(USERDATA));
  userdata.settings.seen_listen_modal = 1;
  localStorage.setItem(USERDATA, JSON.stringify(userdata));
};

const VoteButton = ({ kind, ...props }: { kind: 'yes' | 'no' } & ButtonHTMLAttributes<any>) => (
  <button type="button" className={['vote-button', kind, getTrackClass('fs', `vote-${kind}`)].join(' ')} {...props}>
    {kind === 'yes' && <ThumbsUpIcon />}
    {kind === 'no' && <ThumbsDownIcon />}
    <Localized id={'vote-' + kind}>
      <span />
    </Localized>
  </button>
);

interface PropsFromState {
  api: API;
  challengeEnded: boolean;
  clips: ClipType[];
  hasEarnedSessionToast: boolean;
  isLoading: boolean;
  locale: Locale.State;
  showFirstContributionToast: boolean;
  showFirstStreakToast: boolean;
  user: User.State;
}

interface PropsFromDispatch {
  addAchievement: typeof Notifications.actions.addAchievement;
  refreshUser: typeof User.actions.refresh;
  removeClip: typeof Clips.actions.remove;
  updateUser: typeof User.actions.update;
  vote: typeof Clips.actions.vote;
}

interface Props extends
  LocalePropsFromState,
  WithLocalizationProps,
  PropsFromState,
  PropsFromDispatch,
  RouteComponentProps<any, any, any> {
  dispatch: any;
}

interface State {
  clips: (ClipType & { isValid?: boolean })[];
  hasPlayed: boolean;
  hasPlayedSome: boolean;
  isPlaying: boolean;
  isSubmitted: boolean;
  isListenModalVisible: boolean;
}

const initialState: State = {
  clips: [],
  hasPlayed: false,
  hasPlayedSome: false,
  isPlaying: false,
  isSubmitted: false,
  isListenModalVisible: false,
};

class ListenPage extends Component<Props, State> {
  audioRef = createRef<HTMLAudioElement>();
  playedSomeInterval: any;

  state: State = initialState;
  demoMode = false;

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.clips.length > 0) return null;
    if (props.clips.length > 0) {
      return {
        clips: props.clips.slice(0, SET_COUNT).map(clip => ({ ...clip, isValid: null })),
      };
    }
    return null;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.isListenModalVisible == false) {
      this.showListenModalIfApplicable();
    }
  }

  componentDidMount = () => {
    this.showListenModalIfApplicable();
  };

  showListenModalIfApplicable() {
    const user = this.props.user;
    if (user === null || (user && user.account === null)) {
      const cookies = new Cookies();
      if (cookies.get('seen_listen_modal') !== '1') {
        this.setState({
          ...this.state,
          isListenModalVisible: true,
        });
        cookies.set('seen_listen_modal', 1, { path: '/' });
        document.cookie = document.cookie + ';seen_listen_modal=1;';
      } else if (cookies.get('seen_listen_modal') === '1') {
        // do nothing
      }
    } else if (user !== null && user.account !== null && user.settings) {
      const cookies = new Cookies();
      if (user.settings.seen_listen_modal === 0) {
        this.setState({
          ...this.state,
          isListenModalVisible: true,
        });
        this.markListenModalAsSeen(user);
      } else if (user.settings.seen_listen_modal === 1) {
        // do nothing
      }
    }
  }

  markListenModalAsSeen(user: any) {
    activateListenModalInLocalStorage();
    let email = user.account.email;
    let authToken = user.authToken;
    const modalType = 'listen-modal';
    const self = this;

    fetch('/api/v1/seen-modal/' + modalType, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email, authToken: authToken }),
    })
      .then(function (resp) {
        return resp.json();
      })
      .then(function (json) {
        self.props.dispatch(User.actions.saveSettings(json.modal_settings[0]));
      });
  }

  componentWillUnmount() {
    clearInterval(this.playedSomeInterval);
  }

  render() {
    const { clips, hasPlayed, hasPlayedSome, isPlaying, isSubmitted, isListenModalVisible } = this.state;
    const clipIndex = this.getClipIndex();
    const activeClip = clips[clipIndex];
    const userdata = JSON.parse(localStorage.getItem(USERDATA));
    return (
      <>
        <div id="listen-page">
          {isListenModalVisible && <ListenPageModal onCancel={this.onCancel}></ListenPageModal>}
          <audio
            {...(activeClip && { src: activeClip.audioSrc })}
            preload="auto"
            onEnded={this.hasPlayed}
            ref={this.audioRef}
          />
          <ContributionPage
            activeIndex={clipIndex}
            demoMode={this.demoMode}
            errorContent={
              !this.props.isLoading &&
              (clips.length === 0 || !activeClip) && (
                <div className="empty-container">
                  <div className="error-card card-dimensions">
                    <Localized id="listen-empty-state">
                      <span />
                    </Localized>
                    <LinkButton rounded to={URLS.SPEAK} className="record-instead">
                      <MicIcon />{' '}
                      <Localized id="record-button-label">
                        <span />
                      </Localized>
                    </LinkButton>
                  </div>
                </div>
              )
            }
            instruction={props =>
              activeClip &&
              !isPlaying &&
              !hasPlayedSome &&
              !hasPlayed && (
                <Localized
                  id={
                    clipIndex === SET_COUNT - 1
                      ? 'listen-last-time-instruction'
                      : ['listen-instruction', 'listen-again-instruction', 'listen-3rd-time-instruction'][clipIndex] ||
                        'listen-again-instruction'
                  }
                  elems={{ playIcon: <OldPlayIcon /> }}
                  {...props}
                />
              )
            }
            isPlaying={isPlaying}
            isSubmitted={isSubmitted}
            onReset={this.reset}
            onSkip={this.handleSkip}
            primaryButtons={
              <>
                <VoteButton kind="yes" onClick={this.voteYes} disabled={!hasPlayed} />
                <PlayButton isPlaying={isPlaying} onClick={this.play} trackClass="play-clip" />
                <VoteButton kind="no" onClick={this.voteNo} disabled={!hasPlayed && !hasPlayedSome} />
              </>
            }
            pills={clips.map(({ isValid }, i) => (props: ContributionPillProps) => {
              const isVoted = isValid !== null;
              const isActive = clipIndex === i;
              return (
                <Pill
                  className={isVoted ? (isValid ? 'valid' : 'invalid') : ''}
                  onClick={null}
                  status={isActive ? 'active' : isVoted ? 'done' : 'pending'}
                  {...props}>
                  {isActive ? <VolumeIcon /> : isVoted ? isValid ? <CheckIcon /> : <CrossIcon /> : null}
                </Pill>
              );
            })}
            reportModalProps={{
              reasons: ['offensive-speech', 'grammar-or-spelling', 'different-language'],
              kind: 'clip',
              id: activeClip ? activeClip.id : null,
            }}
            sentences={clips.map(clip => clip.sentence)}
            shortcuts={[
              {
                key: 'shortcut-play-toggle',
                label: 'shortcut-play-toggle-label',
                action: this.play,
              },
              {
                key: 'shortcut-vote-yes',
                label: 'vote-yes',
                action: this.voteYes,
              },
              {
                key: 'shortcut-vote-no',
                label: 'vote-no',
                action: this.voteNo,
              },
            ]}
            type="listen"
          />
        </div>
      </>
    );
  }

  private getClipIndex() {
    return this.state.clips.findIndex(clip => clip.isValid === null);
  }

  private play = () => {
    if (this.state.isPlaying) {
      this.stop();
      return;
    }

    this.audioRef.current.play();
    this.setState({ isPlaying: true });
    clearInterval(this.playedSomeInterval);
    this.playedSomeInterval = setInterval(() => this.setState({ hasPlayedSome: true }), VOTE_NO_PLAY_MS);
  };

  private stop = () => {
    const audio = this.audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    clearInterval(this.playedSomeInterval);
    this.setState({ isPlaying: false });
  };

  private hasPlayed = () => {
    this.setState({ hasPlayed: true, isPlaying: false });
    trackListening('listen', this.props.locale);
  };

  private vote = (isValid: boolean) => {
    const { clips } = this.state;

    const {
      showFirstContributionToast,
      hasEarnedSessionToast,
      addAchievement,
      api,
      showFirstStreakToast,
      challengeEnded,
    } = this.props;
    const clipIndex = this.getClipIndex();

    this.stop();
    this.props.vote(isValid, this.state.clips[this.getClipIndex()].id);

    sessionStorage.setItem('challengeEnded', JSON.stringify(challengeEnded));
    sessionStorage.setItem('hasContributed', 'true');

    if (showFirstContributionToast) {
      addAchievement(50, "You're on your way! Congrats on your first contribution.", 'success');
    }
    if (showFirstStreakToast) {
      addAchievement(50, 'You completed a three-day streak! Keep it up.', 'success');
    }
    if (
      !JSON.parse(sessionStorage.getItem('challengeEnded')) &&
      JSON.parse(sessionStorage.getItem('hasShared')) &&
      !hasEarnedSessionToast
    ) {
      addAchievement(50, "You're on a roll! You sent an invite and contributed in the same session.", 'success');
      sessionStorage.removeItem('hasShared');
      // Tell back-end user get unexpected achievement: invite + contribute in the same session
      // Each user can only get once.
      api.setInviteContributeAchievement();
    }
    this.setState({
      hasPlayed: false,
      hasPlayedSome: false,
      isPlaying: false,
      isSubmitted: clipIndex === SET_COUNT - 1,
      clips: clips.map((clip, i) => (i === clipIndex ? { ...clip, isValid } : clip)),
    });
  };

  private voteYes = () => {
    if (!this.state.hasPlayed) {
      return;
    }
    this.vote(true);
    trackListening('vote-yes', this.props.locale);
  };

  private voteNo = () => {
    const { hasPlayed, hasPlayedSome } = this.state;
    if (!hasPlayed && !hasPlayedSome) {
      return;
    }
    this.vote(false);
    trackListening('vote-no', this.props.locale);
  };

  private handleSkip = () => {
    const { removeClip } = this.props;
    const { clips } = this.state;
    this.stop();
    removeClip(clips[this.getClipIndex()].id);
    this.setState({
      clips: clips.map((clip, i) =>
        this.getClipIndex() === i ? { ...this.props.clips.slice(SET_COUNT)[0], isValid: null } : clip
      ),
      hasPlayed: false,
      hasPlayedSome: false,
    });
  };

  private reset = () => this.setState(initialState);

  private onCancel = () => {
    this.setState({
      ...this.state,
      isListenModalVisible: false,
    });
  };
}

const mapStateToProps = (state: StateTree) => {
  const { clips, isLoading, showFirstContributionToast, hasEarnedSessionToast, showFirstStreakToast, challengeEnded } =
    Clips.selectors.localeClips(state);
  const { api } = state;
  return {
    clips,
    isLoading,
    showFirstContributionToast,
    hasEarnedSessionToast,
    showFirstStreakToast,
    challengeEnded,
    api,
    locale: state.locale,
    user: state.user,
  };
};

const mapDispatchToProps = {
  removeClip: Clips.actions.remove,
  vote: Clips.actions.vote,
  addAchievement: Notifications.actions.addAchievement,
};

export default withRouter(
  localeConnector(withLocalization(connect<PropsFromState, any>(mapStateToProps, mapDispatchToProps)(ListenPage)))
);
