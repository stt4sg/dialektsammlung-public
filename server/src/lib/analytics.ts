import * as analytics from 'universal-analytics';
import { getConfig, isProd } from '../config-helper';
import { hashClientId } from './utility';

const GA_ID = 'UA-181976231-2';

export function trackPageView(path: string, client_id: string) {
  if (isProd()) {
    analytics(GA_ID, { uid: hashClientId(client_id) })
      .pageview(path)
      .send();
  } else {
    console.log('analytics event (not tracked here)', 'pageView', path);
  }
}
