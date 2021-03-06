import { Localized } from '@fluent/react';
import * as React from 'react';
import { trackNav, getTrackClass } from '../../services/tracker';
import URLS from '../../urls';
import { ContributableLocaleLock, LocaleNavLink, useLocale } from '../locale-helpers';

import './nav.css';

const LocalizedNavLink = ({ id, to }: { id: string; to: string }) => {
  const [locale] = useLocale();
  return (
    <Localized id={id}>
      <LocaleNavLink className={getTrackClass('fs', id)} to={to} exact onClick={() => trackNav(id, locale)} />
    </Localized>
  );
};

export default ({ children, ...props }: { [key: string]: any }) => (
  <nav {...props} className="nav-list">
    <div className="nav-links">
      <ContributableLocaleLock>
        <LocalizedNavLink id="contribute" to={URLS.SPEAK} />
      </ContributableLocaleLock>
      <LocalizedNavLink id="about" to={URLS.ABOUT} />
      <LocalizedNavLink id="pr-coverage" to={URLS.PR_COVERAGE} />
      <LocalizedNavLink id="top-contributors" to={URLS.TOP_CONTRIBUTORS} />
      <LocalizedNavLink id="kampf-der-kantone" to={URLS.KAMPF_DER_KANTONE} />
    </div>
    {children}
  </nav>
);
