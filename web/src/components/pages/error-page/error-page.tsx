import * as React from 'react';
import { useEffect } from 'react';
import { Localized } from '@fluent/react';
import { trackError } from '../../../services/tracker';
import { LocaleLink } from '../../locale-helpers';

import './error-page.css';

export default ({ errorCode, prevPath = '' }: { errorCode: '404' | '503'; prevPath: string }) => {
  useEffect(() => {
    trackError(errorCode, prevPath);
  }, []);

  return (
    <div className="error-page-container-outer">
      <div className="error-page-container-inner">
        <div className="error-page-container-text">
          <Localized id={`error-title-${errorCode}`}>
            <h2 />
          </Localized>
          <Localized id="error-code" vars={{ code: errorCode }}>
            <p className="error-code" />
          </Localized>
          <Localized
            id={`error-content-${errorCode}`}
            elems={{
              homepageLink: <LocaleLink to="" />,
            }}>
            <p className="error-content" />
          </Localized>
        </div>
        <div className="mars">
          <div className="mars-body-container">
            <img alt="" className="mars-body" role="presentation" src={require('./images/mars-frown.svg')} />
          </div>
          <img alt="" className="mars-shadow" role="presentation" src={require('./images/mars-shadow.png')} />
        </div>
      </div>
    </div>
  );
};
