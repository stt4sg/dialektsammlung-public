import * as React from 'react';
import { Localized } from '@fluent/react';
import { trackNav } from '../../services/tracker';
import URLS from '../../urls';
import { TextButton } from '../ui/ui';
import { LocaleLink, useLocale } from '../locale-helpers';
import Logo from './logo';
import SubscribeNewsletter from './subscribe-newsletter';

import './footer.css';

const LocalizedLocaleLink = ({ id, to }: { id: string; to: string }) => {
  const [locale] = useLocale();
  return (
    <Localized id={id}>
      <LocaleLink to={to} onClick={() => trackNav(id, locale)} />
    </Localized>
  );
};

export default React.memo(() => {
  const [locale] = useLocale();
  return (
    <footer>
      <div id="footer-links">
        <div className="col1">
          <div className="logo-container">
            <Logo reverse />
          </div>
          <div className="privacy-terms-links">
            <LocalizedLocaleLink id="privacy" to={URLS.PRIVACY} />
            <LocalizedLocaleLink id="terms" to={URLS.TERMS} />
          </div>
        </div>

        <div className="col2">
          <div id="email-subscription">
            <SubscribeNewsletter />
          </div>
        </div>

        <div className="col3">
          <div className="impressum">
            <div className="contact-stuff">
              <h3>Kontakt</h3>
              <p>
                Allgemeine Anfragen: <a href="mailto:info@dialektsammlung.ch">info@dialektsammlung.ch</a>
              </p>
              <p>
                Technischer Support: <a href="mailto:support@dialektsammlung.ch">support@dialektsammlung.ch</a>
              </p>
              <p>
                Für Medienschaffende: <LocaleLink to={URLS.PR}>Mediendossier</LocaleLink>
              </p>
            </div>
            <div className="address">
              <div className="address-top">
                <h3>Organisation</h3>
                <a href="https://swissnlp.org" target="_blank">
                  swissnlp.org
                </a>
              </div>
              <div className="address-bottom">
                <p>Swiss Association for Natural Language Processing (SwissNLP)</p>
                <p>Albanistrasse 20</p>
                <p>8400 Winterthur</p>
              </div>
            </div>
          </div>
        </div>

        <Localized id="back-top">
          <TextButton
            className="back-top"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </Localized>
      </div>
    </footer>
  );
});
