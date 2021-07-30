import { isProduction } from '../utility';

declare const ga: any;

export function track(
  category:
    | 'Home-New'
    | 'Recording'
    | 'Listening'
    | 'Profile'
    | 'Dashboard'
    | 'Global'
    | 'Nav'
    | 'Challenge'
    | 'voice-avatar'
    | 'Error',
  action: string,
  locale?: string
) {
  if (isProduction() && typeof ga === 'function') {
    ga('send', 'event', category, action, locale);
  } else {
    console.debug('analytics event (not tracked here)', {
      category,
      action,
      locale,
    });
  }
}

export function trackGlobal(action: 'github' | 'contact' | 'footer-newsletter', locale: string) {
  track('Global', action, locale);
}

export function trackNav(route: string, locale: string) {
  track('Nav', route, locale);
}

export function trackHome(
  action:
    | 'speak'
    | 'speak-mars'
    | 'speak-about'
    | 'listen'
    | 'change-benefits-tabs'
    | 'click-whats-public-item'
    | 'click-benefits-item'
    | 'click-benefits-register',
  locale: string
) {
  track('Home-New', action, locale);
}

export function trackRecording(
  action: 'record' | 'submit' | 'rerecord' | 'view-shortcuts' | 'shortcut' | 'skip' | 'listen',
  locale: string
) {
  track('Recording', action, locale);
}

export function trackListening(
  action: 'listen' | 'listen-home' | 'vote-yes' | 'vote-no' | 'view-shortcuts' | 'shortcut' | 'skip',
  locale: string
) {
  track('Listening', action, locale);
}

export function trackProfile(
  action:
    | 'create'
    | 'login'
    | 'give-email'
    | 'give-username'
    | 'give-accent'
    | 'give-age'
    | 'give-gender'
    | 'give-avatar'
    | 'contribution-conversion-modal',
  locale: string
) {
  track('Profile', action, locale);
}

export function trackVoiceAvatar(action: 'self-listen' | 'listen' | 'create-voice-avatar', locale: string) {
  track('voice-avatar', action, locale);
}

export function trackDashboard(
  action: 'speak-cta' | 'listen-cta' | 'change-language' | 'leaderboard-load-more',
  locale: string
) {
  track('Dashboard', action, locale);
}

export function trackChallenge(action: 'dashboard-view' | 'modal-invite' | 'modal-onboarding' | 'modal-welcome') {
  track('Challenge', action);
}

// Error pages send the full previous route as a third argument, which is
// typically reserved for locale.
export function trackError(action: '404' | '503', route: string) {
  track('Error', action, route);
}

export function getTrackClass(service: 'amp' | 'fs', name: string) {
  return `track-${service}-${name}`;
}
