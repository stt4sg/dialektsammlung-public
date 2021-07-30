import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import * as React from 'react';
import { connect } from 'react-redux';
import { Flags } from '../../../stores/flags';
import { Locale } from '../../../stores/locale';
import StateTree from '../../../stores/tree';
import { User } from '../../../stores/user';
import { Sentence } from 'common';
import { getTrackClass, trackListening, trackProfile, trackRecording } from '../../../services/tracker';
import URLS from '../../../urls';
import { LocaleLink, LocaleNavLink, useLocale } from '../../locale-helpers';
import Modal, { ModalProps } from '../../modal/modal';
import { ArrowLeft, CheckIcon, ExternalLinkIcon, KeyboardIcon, SkipIcon } from '../../ui/icons';
import { Button, LinkButton, StyledLink } from '../../ui/ui';
import { PrimaryButton } from '../../primary-buttons/primary-buttons';
import ShareModal from '../../share-modal/share-modal';
import { ReportButton, ReportModal, ReportModalProps } from './report/report';
import Success from './success';
import Wave from './wave';
import { useAccount } from '../../../hooks/store-hooks';
import './contribution.css';
import { Tooltip } from 'react-tippy';
import { isSafari } from '../../../utility';
import DialectModal from 'web/src/components/pages/contribution/dialect-modal/dialect-modal';

const pick = require('lodash.pick');

const HAS_SEEN_ACCOUNT_MODAL_KEY = 'hasSeenRegisterModal2';
const ACTIVE_INDEX = 'activeIndex';
const WANTS_TO_SEE_REGISTER_MODAL = 'wantsToSeeRegisterModal';
const WANTS_TO_SEE_DIALECT_MODAL = 'wantsToSeeDialectModal';

// Not used - Leaving it for possible future use
const toggleRegisterModalInLocalStorage = async () => {
  let wantsToSeeRegisterModal = JSON.parse(localStorage.getItem(WANTS_TO_SEE_REGISTER_MODAL));
  localStorage.setItem(WANTS_TO_SEE_REGISTER_MODAL, JSON.stringify(!wantsToSeeRegisterModal));
};

// Not used - Leaving it for possible future use
const activateRegisterModalInLocalStorage = async () => {
  let wantsToSeeRegisterModal = JSON.parse(localStorage.getItem(WANTS_TO_SEE_REGISTER_MODAL));
  localStorage.setItem(WANTS_TO_SEE_REGISTER_MODAL, JSON.stringify(true));
};

const deactivateRegisterModalInLocalStorage = async () => {
  let wantsToSeeRegisterModal = JSON.parse(localStorage.getItem(WANTS_TO_SEE_REGISTER_MODAL));
  localStorage.setItem(WANTS_TO_SEE_REGISTER_MODAL, JSON.stringify(false));
};

const RegisterModal = (props: ModalProps) => {
  const account = useAccount();
  const hasAccount = Boolean(account);
  const [locale] = useLocale();
  return (
    !hasAccount && (
      <Modal {...props} className="register-modal-wrapper" innerClassName="register-modal">
        <div className="register-modal-image">
          <img src={require('./waves.svg')} alt="Waves" className="waves-background" />
          <img src={require('./mars-blue.svg')} alt="Mars Robot" className="mars-robot" />
        </div>
        <div className="register-modal-text">
          <h1>
            Vielen Dank für das fleissige Aufnehmen! Eine Registrierung bringt Ihnen viele Vorteile. Sie können Punkte
            sammeln und damit in der Rangliste sowie im Kampf der Kantone attraktive Preise gewinnen.
          </h1>
          <Localized id="login-to-get-started">
            <h2 />
          </Localized>
        </div>
        <div className="register-modal-buttons">
          <div className="button-wrapper">
            <Localized id="login-signup">
              <LinkButton
                rounded
                href="/login"
                className={getTrackClass('fs', `nudge-profile-modal`)}
                onClick={() => {
                  sessionStorage.setItem('redirectURL', location.pathname);
                  trackProfile('contribution-conversion-modal', locale);
                }}
              />
            </Localized>
          </div>
          <button
            className={'no-thx-button'}
            onClick={() => {
              deactivateRegisterModalInLocalStorage();
              props.onRequestClose();
            }}>
            Nein, danke
          </button>
        </div>
      </Modal>
    )
  );
};

export const SET_COUNT = 5;
export interface ContributionPillProps {
  isOpen: boolean;
  key: any;
  num: number;
  onClick: () => any;
  onShare: () => any;
  style?: any;
}

interface PropsFromState {
  flags: Flags.State;
  locale: Locale.State;
  user: User.State;
}

interface Props extends WithLocalizationProps, PropsFromState {
  demoMode: boolean;
  activeIndex: number;
  errorContent?: any;
  reportModalProps: Omit<ReportModalProps, 'onSubmitted'>;
  instruction: (props: { vars: { actionType: string }; children: any }) => React.ReactNode;
  isFirstSubmit?: boolean;
  isPlaying: boolean;
  isSubmitted: boolean;
  onReset: () => any;
  onSkip: () => any;
  onSubmit?: () => any;
  primaryButtons: React.ReactNode;
  pills: ((props: ContributionPillProps) => React.ReactNode)[];
  sentences: Sentence[];
  shortcuts: {
    key: string;
    label: string;
    action: () => any;
  }[];
  type: 'speak' | 'listen';
}

interface State {
  selectedPill: number;
  showRegisterModal: boolean;
  showDialectModal: boolean;
  showReportModal: boolean;
  showShareModal: boolean;
  showShortcutsModal: boolean;
}

class ContributionPage extends React.Component<Props, State> {
  static defaultProps = {
    isFirstSubmit: false,
  };

  state: State = {
    selectedPill: null,
    showRegisterModal: true,
    showDialectModal: true,
    showReportModal: false,
    showShareModal: false,
    showShortcutsModal: false,
  };

  private canvasRef: { current: HTMLCanvasElement | null } = React.createRef();
  private wave: Wave;

  private get showRegisterModalDefault() {
    const { flags, user } = this.props;
    return (
      flags.showAccountConversionModal && !user.account && !JSON.parse(localStorage.getItem(HAS_SEEN_ACCOUNT_MODAL_KEY))
    );
  }

  componentDidMount() {
    this.startWaving();
    window.addEventListener('keydown', this.handleKeyDown);

    // preload account modal images to prevent layout shifting
    if (this.showRegisterModalDefault) {
      new Image().src = require('./waves.svg');
      new Image().src = require('./mars-blue.svg');
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    this.startWaving();
    const { activeIndex, isPlaying, isSubmitted, onReset, user } = this.props;

    if (this.wave) {
      isPlaying ? this.wave.play() : this.wave.idle();
    }

    if (isSubmitted && user.account?.skip_submission_feedback) {
      onReset();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.wave) this.wave.idle();
  }

  private get isLoaded() {
    return this.props.sentences.length > 0;
  }

  private get isDone() {
    return this.isLoaded && this.props.activeIndex === -1;
  }

  private get shortcuts() {
    const { onSkip, shortcuts } = this.props;
    return shortcuts.concat({
      key: 'shortcut-skip',
      label: 'skip',
      action: onSkip,
    });
  }

  private startWaving = () => {
    const canvas = this.canvasRef.current;

    if (this.wave) {
      if (!canvas) {
        this.wave.idle();
        this.wave = null;
      }
      return;
    }

    if (canvas) {
      this.wave = new Wave(canvas);
    }
  };

  private selectPill(i: number) {
    this.setState({ selectedPill: i });
  }

  private toggleShareModal = () => this.setState({ showShareModal: !this.state.showShareModal });

  private toggleShortcutsModal = () => {
    const showShortcutsModal = !this.state.showShortcutsModal;
    if (showShortcutsModal) {
      const { locale, type } = this.props;
      (type == 'listen' ? trackListening : (trackRecording as any))('view-shortcuts', locale);
    }
    return this.setState({ showShortcutsModal });
  };

  // Not used - Leaving it for possible future use
  private toggleRegisterModal = () => this.setState({ showRegisterModal: !this.state.showRegisterModal });

  // Not used - Leaving it for possible future use
  private deactivateRegisterModalInState = () => this.setState({ showRegisterModal: false });

  private handleKeyDown = (event: any) => {
    const { getString, isSubmitted, locale, onReset, onSubmit, type } = this.props;

    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey || this.state.showReportModal || isSubmitted) {
      return;
    }

    const isEnter = event.key === 'Enter';
    if (isSubmitted && isEnter) {
      onReset();
      return;
    }
    if (this.isDone) {
      if (isEnter && onSubmit) onSubmit();
      return;
    }

    const shortcut = this.shortcuts.find(({ key }) => getString(key).toLowerCase() === event.key);
    if (!shortcut) return;

    shortcut.action();
    ((type === 'listen' ? trackListening : trackRecording) as any)('shortcut', locale);
    event.preventDefault();
  };

  render() {
    const { errorContent, flags, getString, isSubmitted, onSkip, reportModalProps, type, user } = this.props;
    const { showRegisterModal, showDialectModal, showReportModal, showShareModal, showShortcutsModal } = this.state;

    return (
      <div className="contribution-wrapper" onClick={() => this.selectPill(null)}>
        {showShareModal && <ShareModal onRequestClose={this.toggleShareModal} />}
        {showShortcutsModal && (
          <Modal innerClassName="shortcuts-modal" onRequestClose={this.toggleShortcutsModal}>
            <Localized id="shortcuts">
              <h1 />
            </Localized>
            <div className="shortcuts">
              {this.shortcuts.map(({ key, label }) => (
                <div key={key} className="shortcut">
                  <kbd>{getString(key).toLowerCase()}</kbd>
                  <div className="label">{getString(label)}</div>
                </div>
              ))}
            </div>
          </Modal>
        )}
        {showReportModal && (
          <ReportModal
            onRequestClose={() => this.setState({ showReportModal: false })}
            onSubmitted={onSkip}
            {...reportModalProps}
          />
        )}

        {showRegisterModal &&
          isSubmitted &&
          JSON.parse(localStorage.getItem(ACTIVE_INDEX)) == 20 &&
          JSON.parse(localStorage.getItem(WANTS_TO_SEE_REGISTER_MODAL)) === null &&
          user.account == null &&
          this.props.type == 'speak' && (
            <RegisterModal onRequestClose={() => this.setState({ showRegisterModal: false })} />
          )}

        {showDialectModal &&
          isSubmitted &&
          JSON.parse(localStorage.getItem(ACTIVE_INDEX)) == 10 &&
          JSON.parse(localStorage.getItem(WANTS_TO_SEE_DIALECT_MODAL)) === null &&
          user.account == null &&
          this.props.type == 'speak' && (
            <DialectModal onRequestClose={() => this.setState({ showDialectModal: false })} />
          )}

        <div className={['contribution', type, this.isDone ? 'submittable' : ''].join(' ')}>
          <div className="top">
            <LocaleLink to={user.account ? URLS.DASHBOARD : URLS.ROOT} className="back">
              <ArrowLeft />
            </LocaleLink>

            <div className="links">
              <Localized id="speak">
                <LocaleNavLink className={getTrackClass('fs', `toggle-speak`)} to={URLS.SPEAK} />
              </Localized>
              <Localized id="listen">
                <LocaleNavLink className={getTrackClass('fs', `toggle-listen`)} to={URLS.LISTEN} />
              </Localized>
            </div>

            {this.isLoaded && !errorContent ? (
              <div className={'counter ' + (isSubmitted ? 'done' : '')}>
                {isSubmitted && <CheckIcon />}
                <Localized
                  id="clips-with-count-pluralized"
                  elems={{ bold: <b /> }}
                  vars={{ count: this.renderClipCount() }}>
                  <span className="text" />
                </Localized>
              </div>
            ) : (
              <div />
            )}
          </div>

          {this.renderContent()}
        </div>
      </div>
    );
  }

  renderClipCount() {
    const { activeIndex, isSubmitted } = this.props;
    return (isSubmitted ? SET_COUNT : activeIndex + 1 || SET_COUNT) + '/' + SET_COUNT;
  }

  renderContent() {
    const {
      activeIndex,
      errorContent,
      getString,
      instruction,
      isFirstSubmit,
      isSubmitted,
      onReset,
      onSkip,
      onSubmit,
      pills,
      primaryButtons,
      sentences,
      type,
    } = this.props;
    const { selectedPill } = this.state;

    const ContributeMoreButton = (props: { children: React.ReactNode }) => (
      <Button className="contribute-more-button" rounded onClick={onReset} {...props} />
    );

    const ContributeMoreAnonymousButton = (props: { children: React.ReactNode }) => (
      <Button
        className="contribute-more-anonymous-button"
        onClick={function () {
          onReset();
          onSkip();
        }}
        {...props}
      />
    );

    return isSubmitted ? (
      <Success onReset={onReset} type={type} />
    ) : (
      errorContent ||
        (this.isLoaded && (
          <>
            <div className="cards-and-pills">
              <div />

              <div className="cards-and-instruction">
                <div className="cards">
                  {sentences.map((sentence, i) => {
                    const activeSentenceIndex = this.isDone ? SET_COUNT - 1 : activeIndex;
                    const isActive = i === activeSentenceIndex;
                    return (
                      <div
                        key={sentence ? sentence.text : i}
                        className={'card card-dimensions ' + (isActive ? '' : 'inactive')}
                        style={{
                          transform: [
                            `scale(${isActive ? 1 : 0.9})`,
                            `translateX(${(document.dir == 'rtl' ? -1 : 1) * (i - activeSentenceIndex) * -130}%)`,
                          ].join(' '),
                          opacity: i < activeSentenceIndex ? 0 : 1,
                        }}>
                        <div style={{ margin: 'auto', width: '100%' }}>
                          {sentence?.text}
                          {sentence?.taxonomy ? (
                            <div className="sentence-taxonomy">
                              <Localized id="target-segment-generic-card">
                                <span className="taxonomy-message" />
                              </Localized>
                              <StyledLink
                                className="taxonomy-link"
                                blank
                                href={`${URLS.GITHUB_ROOT}/blob/main/docs/taxonomies/${sentence.taxonomy.source}.md`}>
                                <ExternalLinkIcon />
                                <Localized id="target-segment-learn-more">
                                  <span />
                                </Localized>
                              </StyledLink>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {instruction({
                  vars: { actionType: getString('action-click') },
                  children: <div className="instruction hidden-sm-down" />,
                }) || <div className="instruction hidden-sm-down" />}
                {type === 'speak' && isSafari() && (
                  <div className="apple-heads">
                    <p>
                      Bei Safari gibt es z.T. Probleme mit abgeschnittenen Aufnahmen.{' '}
                      <span id="apple-cta">Überprüfen Sie bitte Ihre Aufnahmen vor dem ersten Absenden</span>. Sind Sie
                      auch betroffen, empfehlen wir Chrome oder einen anderen Browser zu benützen. Danke!
                    </p>
                  </div>
                )}
              </div>

              <div className="pills">
                <div className="inner">
                  {!errorContent && (
                    <div className="counter">
                      <Localized
                        id="clips-with-count-pluralized"
                        elems={{ bold: <b /> }}
                        vars={{ count: this.renderClipCount() }}>
                        <span className="text" />
                      </Localized>
                    </div>
                  )}
                  {this.isDone && (
                    <div className="review-instructions">
                      <Localized id="review-instruction">
                        <span />
                      </Localized>
                    </div>
                  )}
                  {pills.map((pill, i) =>
                    pill({
                      isOpen: this.isDone || selectedPill === i,
                      key: i,
                      num: i + 1,
                      onClick: () => this.selectPill(i),
                      onShare: this.toggleShareModal,
                      style:
                        selectedPill !== null && Math.abs(Math.min(Math.max(selectedPill, 1), pills.length - 2) - i) > 1
                          ? { display: 'none' }
                          : {},
                    })
                  )}
                </div>
              </div>
            </div>

            {instruction({
              vars: { actionType: getString('action-tap') },
              children: <div className="instruction hidden-md-up" />,
            }) || <div className="instruction hidden-md-up" />}

            <div className="primary-buttons">
              <canvas ref={this.canvasRef} />
              {primaryButtons}
            </div>

            <div className="buttons">
              <div>
                <Button rounded outline className="hidden-sm-down" onClick={this.toggleShortcutsModal}>
                  <KeyboardIcon />
                  <Localized id="shortcuts">
                    <span />
                  </Localized>
                </Button>
                <div className="extra-button">
                  <ReportButton onClick={() => this.setState({ showReportModal: true })} />
                </div>
              </div>
              <div>
                <Tooltip
                  title={
                    this.props.type === 'speak'
                      ? 'Satz überspringen, z.B., wenn Sie sich nicht sicher sind, wie der Satz auf Schweizerdeutsch zu übersetzen ist.'
                      : 'Beispiel überspringen, z.B., wenn Sie sich nicht sicher sind, ob die Aufnahme den Satz korrekt auf Schweizerdeutsch wiedergibt.'
                  }>
                  <Button
                    style={{ margin: 0 }}
                    rounded
                    outline
                    className={['skip', getTrackClass('fs', `skip-${type}`), 'fs-ignore-rage-clicks'].join(' ')}
                    disabled={!this.isLoaded}
                    onClick={onSkip}>
                    <Localized id="skip">
                      <span />
                    </Localized>{' '}
                    <SkipIcon />
                  </Button>
                </Tooltip>
                {onSubmit && (
                  <Tooltip
                    arrow
                    disabled={!this.isDone}
                    title={getString('record-submit-anonymous-tooltip', {
                      actionType: getString('action-tap'),
                    })}>
                    <Localized id="contribute-more-anonymous">
                      <PrimaryButton
                        className={['continue-without-saving', getTrackClass('fs', `submit-${type}`)].join(' ')}
                        disabled={!this.isDone}
                        onClick={function () {
                          onReset();
                          onSkip();
                        }}
                        type="submit"
                      />
                    </Localized>
                  </Tooltip>
                )}

                {onSubmit && (
                  <Tooltip
                    arrow
                    disabled={!this.isDone}
                    open={isFirstSubmit || undefined}
                    title={getString('record-submit-tooltip', {
                      actionType: getString('action-tap'),
                    })}>
                    <Localized id="submit-form-action">
                      <PrimaryButton
                        className={['submit', getTrackClass('fs', `submit-${type}`)].join(' ')}
                        disabled={!this.isDone}
                        onClick={onSubmit}
                        type="submit"
                      />
                    </Localized>
                  </Tooltip>
                )}

                {/*<ContributeMoreAnonymousButton>
                  <Localized id="contribute-more-anonymous">
                    <span />
                  </Localized>
                </ContributeMoreAnonymousButton>*/}
              </div>
            </div>
          </>
        ))
    );
  }
}

export default connect<PropsFromState>(({ flags, locale, user }: StateTree) => ({
  flags,
  locale,
  user,
}))(withLocalization(ContributionPage));
