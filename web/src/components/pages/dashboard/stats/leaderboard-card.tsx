import { Localized } from '@fluent/react';
import * as React from 'react';
import { lazy, Suspense, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useAccount, useAction } from '../../../../hooks/store-hooks';
import API from '../../../../services/api';
import { trackDashboard, trackHome, trackVoiceAvatar } from "../../../../services/tracker";
import { Locale } from '../../../../stores/locale';
import StateTree from '../../../../stores/tree';
import { User } from '../../../../stores/user';
import URLS from '../../../../urls';
import { LocaleLink, LocalizedGetAttribute } from '../../../locale-helpers';
import {
  BookmarkIcon,
  CrossIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  MicIcon,
  GoldCoinIcon,
  OldPlayIcon,
  PlayOutlineIcon,
} from '../../../ui/icons';
import { Avatar, Toggle } from '../../../ui/ui';
import StatsCard from './stats-card';
import { isProduction } from '../../../../utility';
import './leaderboard.css';
import { RecordLink } from "../../../primary-buttons/primary-buttons";

const Lottie = lazy(() => import('react-lottie'));
const animationData = require('../../../layout/data.json');

const FETCH_SIZE = 20;

function formatNumber(n: number) {
  return n > 1000 ? Math.floor(n / 1000) + 'k' : n;
}

interface PropsFromState {
  api: API;
  globalLocale: Locale.State;
}

interface Props extends PropsFromState {
  ref: { current: any };
  locale: string;
  type: 'clip' | 'vote';
  setRank?: any;
  setNumberOfRanks?: any;
  // rank: any;
}

const FetchRow = (props: React.HTMLProps<HTMLButtonElement>) => (
  <li className="more">
    <button {...(props as any)}>
      <div>...</div>
    </button>
  </li>
);
interface State {
  rows: { position: number; [key: string]: any }[];
  isAtEnd: boolean;
  playingClipIndex: number;
  myRank: number;
  numberOfParticipants: number;
}

class UnconnectedLeaderboard extends React.Component<Props, State> {
  state: State = {
    rows: [],
    isAtEnd: false,
    playingClipIndex: null,
    myRank: 0,
    numberOfParticipants: 0,
  };
  audioRef = React.createRef<HTMLAudioElement>();

  scroller: { current: HTMLUListElement | null } = React.createRef();
  youRow: { current: HTMLLIElement | null } = React.createRef();

  async componentDidMount() {
    const { api, locale, type } = this.props;
    const { leaderboard, my_rank: myRank, numberOfParticipants } = await api.forLocale(locale).fetchLeaderboard(type);
    this.setState(
      {
        rows: leaderboard,
        myRank: myRank,
        numberOfParticipants: numberOfParticipants,
      },
      this.scrollToUser
    );
    this.props.setRank(myRank);
    this.props.setNumberOfRanks(numberOfParticipants);
  }

  async fetchMore(cursor: [number, number]) {
    const { api, globalLocale, locale, type } = this.props;
    trackDashboard('leaderboard-load-more', globalLocale);
    const {
      leaderboard: newRows,
      my_rank,
      numberOfParticipants,
    } = await api.forLocale(locale).fetchLeaderboard(type, cursor);

    this.props.setRank(my_rank);
    this.props.setNumberOfRanks(numberOfParticipants);

    this.setState(
      ({ rows }) => {
        const allRows = [...newRows, ...rows.filter(r1 => !newRows.find((r2: any) => r1.clientHash == r2.clientHash))];
        allRows.sort((r1, r2) => (r1.position > r2.position ? 1 : -1));
        return {
          rows: allRows,
          isAtEnd: newRows.length == 0,
        };
      },
      () => {
        this.updateScrollIndicator();
      }
    );
  }

  playAvatarClip = function (clipUrl: string, position: any, self: boolean) {
    const { locale } = this.props;
    trackVoiceAvatar(self ? 'self-listen' : 'listen', locale);

    if (this.state.playingClipIndex === null) {
      this.setState({ playingClipIndex: position });

      this.audioRef.current.src = clipUrl;

      this.audioRef.current.play();
    } else {
      this.audioRef.current.pause();
      this.audioRef.current.currentTime = 0;
      this.setState({ playingClipIndex: null });
    }
  };

  scrollToUser = () => {
    const row = this.youRow.current;
    if (!row) return;

    const scroller = this.scroller.current;
    scroller.scrollTop = row.offsetTop - scroller.offsetTop;
    this.updateScrollIndicator();
  };

  updateScrollIndicator = () => {
    const SIZE = 32;
    const el = this.scroller.current;
    el.style.setProperty('--before-height', Math.min(el.scrollTop, SIZE) + 'px');
    el.style.setProperty('--after-height', Math.min(el.scrollHeight - el.scrollTop - el.clientHeight, SIZE) + 'px');
  };

  render() {
    const { rows, isAtEnd, playingClipIndex } = this.state;
    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
      },
    };

    // TODO: Render <Fetchrow>s outside of `items` to flatten the list.
    const items = rows.map((row, i) => {
      const prevPosition = i > 0 ? rows[i - 1].position : null;
      const nextPosition = i < rows.length - 1 ? rows[i + 1].position : isAtEnd ? 0 : Infinity;
      return [
        prevPosition && prevPosition + 1 < row.position ? (
          <FetchRow
            key={row.position + 'prev'}
            onClick={() => this.fetchMore([Math.max(prevPosition + 1, row.position - FETCH_SIZE), row.position])}
          />
        ) : null,
        <li key={row.position} className={'row ' + (row.you ? 'you' : '')} ref={row.you ? this.youRow : null}>
          <div className="position" style={{ display: 'flex' }}>
            {row.position < 9 && '0'}
            {row.position + 1}
          </div>

          {!isProduction() ? (
            row.avatarClipUrl === null ? (
              <div className="avatar-container">
                <Avatar url={row.avatar_url} />
              </div>
            ) : (
              <div>
                <audio
                  preload="auto"
                  ref={this.audioRef}
                  onEnded={() => this.setState({ playingClipIndex: null })}
                  onError={() => this.setState({ playingClipIndex: null })}
                />
                <button
                  className="avatar-container"
                  onMouseEnter={() => this.playAvatarClip(row.avatarClipUrl, row.position, row.you)}
                  onMouseLeave={() => this.playAvatarClip(row.avatarClipUrl, row.position, row.you)}
                  onClick={() => this.playAvatarClip(row.avatarClipUrl, row.position, row.you)}>
                  <div>
                    <Avatar url={row.avatar_url} />
                  </div>
                </button>
              </div>
            )
          ) : (
            <div className="avatar-container">
              <Avatar url={row.avatar_url} />
            </div>
          )}

          <div className="username" title={row.username}>
            {row.username || '???'}
            {row.you && (
              <>
                {' ('}
                <Localized id="you">
                  <span />
                </Localized>
                )
              </>
            )}
          </div>
          {playingClipIndex === row.position && (
            <div className="lottie">
              <Suspense fallback={<div />}>
                <div className="animation">
                  <Lottie options={defaultOptions} eventListeners={[]} height={80} width={250} />
                </div>
              </Suspense>{' '}
            </div>
          )}
          <div className="total" title={row.total}>
            {this.props.type == 'clip' ? <GoldCoinIcon /> : <OldPlayIcon className="play" />}
            {row.total}
          </div>
        </li>,
        nextPosition && nextPosition - 1 > row.position && nextPosition - FETCH_SIZE > row.position ? (
          <FetchRow
            key={row.position + 'next'}
            onClick={() =>
              this.fetchMore([row.position + 1, Math.min(row.position + 1 + FETCH_SIZE, nextPosition - 1)])
            }
          />
        ) : null,
      ];
    });

    return (
      <ul className="leaderboard" ref={this.scroller} onScroll={this.updateScrollIndicator}>
        {items}
      </ul>
    );
  }
}

const Leaderboard = connect<PropsFromState>(
  ({ api, locale, user, rank }: StateTree) => ({
    api,
    globalLocale: locale,
    user,
    rank,
  }),
  dispatch => {
    return {
      setRank: (rank: any) => {
        dispatch({ type: 'SET_RANK', rank: rank });
      },
      setNumberOfRanks: (numRank: any) => {
        dispatch({ type: 'SET_NUMBER_OF_RANKS', numRank: numRank });
      },
    };
  },
  null,
  { forwardRef: true }
)(UnconnectedLeaderboard);

// TODO this is probably still used/useful for https://github.com/jonasfabian/STT4SG/issues/27
export default function LeaderboardCard({
  currentLocale,
  style,
}: {
  currentLocale?: string;
  style?: { width: string };
}) {
  const account = useAccount();
  const saveAccount = useAction(User.actions.saveAccount);

  const [showInfo, setShowInfo] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const leaderboardRef = useRef(null);

  return (
    <div style={{ width: '100%' }}>
      <h1>Rangliste</h1>
      <br/>
      <p>
      Die folgende Rangliste zeigt, wer bisher am meisten zur Schweizer Dialektsammlung beigetragen hat.
      Sie beruht darauf, wie viele Aufnahmen jemand gemacht oder überprüft hat.
      Dies wird in die Währung “Schoggitaler” umgerechnet, wobei auch die Qualität der Aufnahmen berücksichtigt wird.
      Die Teilnehmenden mit den meisten Schoggitalern haben die Chance, bis zum 27. August 2021 attraktive Preise zu gewinnen!
      </p>
      <br/>
      <StatsCard
        style={style}
        key="leaderboard"
        {...{ currentLocale }}
        className={'leaderboard-card ' + (showOverlay ? 'has-overlay' : '')}
        title="top-contributors"
        iconButtons={
          <div className="icon-buttons">
            {Boolean(account?.visible) && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    leaderboardRef.current.scrollToUser();
                  }}>
                  <BookmarkIcon />{' '}
                  <Localized id="show-ranking">
                    <span className="text" />
                  </Localized>
                </button>

                <div className="icon-divider" />
              </>
            )}

            {Boolean(account?.username !== undefined) && (
              <button type="button" onClick={() => setShowOverlay(true)}>
                {account?.visible ? <EyeIcon /> : <EyeOffIcon />}
                <Localized id="set-visibility">
                  <span className="text" />
                </Localized>
              </button>
            )}

            <div className="icon-divider" />

            <div
              className="leaderboard-info">
              {showInfo && (
                <div className="info-menu">
                  <div style={{ height: 10 }}>
                    <div className="triangle triangle-top" />
                  </div>
                  <ul>
                    {[{ label: 'leaderboard-info-text' }].map(({ label }) => (
                      <li key={label} style={{ height: 'unset' }}>
                        <Localized id={label}>
                          <span />
                        </Localized>
                      </li>
                    ))}
                  </ul>
                  <div style={{ height: 10 }}>
                    <div className="triangle triangle-bottom" />
                  </div>
                </div>
              )}
              <button
                className={showInfo ? 'active' : ''}
                style={{ display: 'flex' }}
                onClick={() => setShowInfo(!showInfo)}
                type="button">
                <InfoIcon />
              </button>
            </div>
          </div>
        }
        overlay={
          showOverlay && (
            <div className="leaderboard-overlay">
              <button className="close-overlay" type="button" onClick={() => setShowOverlay(false)}>
                <CrossIcon />
              </button>
              <LocalizedGetAttribute id="leaderboard-visibility" attribute="label">
                {label => <h2>{label}</h2>}
              </LocalizedGetAttribute>
              <Toggle
                offText="hidden"
                onText="visible"
                defaultChecked={Boolean(account.visible)}
                onChange={(event: any) => {
                  saveAccount({ visible: event.target.checked });
                }}
              />
              <Localized id="visibility-explainer" vars={{ minutes: 20 }}>
                <p className="explainer" />
              </Localized>
              <div className="info">
                <InfoIcon />
                <Localized
                  id="visibility-overlay-note"
                  elems={{
                    profileLink: <LocaleLink to={URLS.PROFILE_INFO} />,
                  }}>
                  <p className="note" />
                </Localized>
              </div>
            </div>
          )
        }
        tabs={{
          currency: ({ locale }) => <Leaderboard key={'c' + locale} locale={locale} type="clip" ref={leaderboardRef} />,
        }}
      />
      <br/>
      <h1>Wettbewerb bis 27. August 2021</h1>
      <p>
        Die fleissigsten zehn Teilnehmenden am Stichtag 27. August 2021, Mitternacht werden für ihren Beitrag ausgezeichnet. <br/>
        Es gibt folgende Preise zu gewinnen:
        <p className="competition-img-box">
          <div className="img-box">
            <img src="/img/matterhorn_wettbewerb_q.jpeg" alt="Helikopter-Flug ums Matterhorn"/>
            <p>
              Platz 1:<br/>Helikopter-Flug ums Matterhorn
            </p>
          </div>
          <div className="img-box">
            <img src="/img/iPhone_Wettbewerb.PNG" alt="iPhone"/>
            <p>
              Platz 2:<br/>Apple iPhone 12 oder Samsung Galaxy S21 (nach Wahl)
            </p>
          </div>
          <div className="img-box">
            <img src="/img/Speaker_Wettbewerb_q.png" alt="Bose Speaker"/>
            <p>
              Platz 3:<br/>Bose Bluetooth Speaker
            </p>
          </div>
        </p>
        <p>
          4. - 6. Platz: Grosser Essenskorb mit Schweizer Spezialitäten<br/>
          7. - 10. Platz: Quiz-Spiel “SwissIQ”<br/>
          <br/>
        </p>
      </p>

      Ausserdem gibt es einen attraktiven Sonderpreis für die Person, deren Tonaufnahmen die beste Qualität hatten!

      <RecordLink big trackClass="speak-from-home" onClick={() => trackHome('speak', 'de')}>
        <p>Jetzt mitmachen!</p>
      </RecordLink>
      <br/>
      <br/>
      Bedingungen: Entscheidend ist der Stand der Rangliste am 27. August 2021 um Mitternacht. Die GewinnerInnen werden von SwissNLP direkt benachrichtigt. Es werden nur registrierte BenutzerInnen berücksichtigt, die im Profil zugestimmt haben, dass ihr Profil in der Rangliste angezeigt wird. Eine Änderung oder Barauszahlung der Preise ist ausgeschlossen. Der Rechtsweg ist ausgeschlossen.

    </div>
  );
}
