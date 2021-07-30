import { UserClient } from 'common';
import URLS from './urls';

const SEARCH_REG_EXP = new RegExp('</?[^>]+(>|$)', 'g');

/**
 * Generate RFC4122 compliant globally unique identifier.
 */
export function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function dec2hex(n: number) {
  return ('0' + n.toString(16)).substr(-2);
}

export function generateToken(length = 40) {
  const arr = new Uint8Array(length / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join('');
}

/**
 * Count the syllables in a string. Completely stolen from:
 * https://codegolf.stackexchange.com/
 *   questions/47322/how-to-count-the-syllables-in-a-word
 */
let re = /[aiouy]+e*|e(?!d$|ly).|[td]ed|le$/gi;
export function countSyllables(text: string): number {
  let matches = text.match(re);
  return matches.length;
}

/**
 * Test whether this is a browser on iOS.
 *
 * NOTE: As of early 2020 this is not reliable on iPad for some privacy-minded
 * browsers, including Safari (!!), Brave, and Firefox Focus.
 */
export function isIOS(): boolean {
  return /iPod|iPhone|iPad|iOS/i.test(window.navigator.userAgent);
}

/**
 *
 * The logic is collected from answers to this SO question: https://stackoverflow.com/q/3007480
 */
function safariImpostor(): boolean {
  return /Chrome|Focus|CriOS|OPiOS|OPT\/|FxiOS|EdgiOS|mercury/i.test(window.navigator.userAgent);
}

// Check whether the browser is mobile Safari on iOS.
export function isMobileSafari(): boolean {
  return (
    isIOS() && !window.navigator.standalone && /AppleWebKit/i.test(window.navigator.userAgent) && !safariImpostor()
  );
}

// More general Safari detection
export function isSafari(): boolean {
  return /AppleWebKit/i.test(window.navigator.userAgent) && !safariImpostor();
}

export function isMobileResolution(): boolean {
  return window.matchMedia('(max-width: 768px)').matches;
}

/**
 * @deprecated this was used by common-voice and may trigger some unexpected code to be activated somewhere.
 */
export function isProduction(): boolean {
  return window.location.origin === URLS.HTTP_ROOT;
}

/**
 * @deprecated this was used by common-voice and may trigger some unexpected code to be activated somewhere.
 */
export function isStaging(): boolean {
  return window.location.origin === URLS.STAGING_ROOT;
}

/**
 * Replaces the locale part of a given path
 */
export function replacePathLocale(pathname: string, locale: string) {
  const pathParts = pathname.split('/');
  pathParts[1] = locale;
  return pathParts.join('/');
}

export const getAudioFormat = (() => {
  const preferredFormat = 'audio/ogg; codecs=opus';
  const audio = document.createElement('audio');
  const format = audio.canPlayType(preferredFormat) ? preferredFormat : 'audio/wav';
  return function getAudioFormat() {
    return format;
  };
})();

export async function hash(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function stringContains(haystack: string, needles: string) {
  return haystack.toUpperCase().replace(SEARCH_REG_EXP, '').indexOf(needles) !== -1;
}

export function doNotTrack() {
  return navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes';
}
