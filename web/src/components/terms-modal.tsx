import * as React from 'react';
import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import URLS from '../urls';
import { LocaleLink } from './locale-helpers';
import Modal from './modal/modal';

const TermsModal = ({
  getString,
  onAgree,
  onDisagree,
}: { onAgree: () => any; onDisagree: () => any } & WithLocalizationProps) => (
  <Localized
    id="review-terms"
    elems={{
      termsLink: <LocaleLink style={{ color: 'blue' }} to={URLS.TERMS} blank />,
      privacyLink: <LocaleLink style={{ color: 'blue' }} to={URLS.PRIVACY} blank />,
    }}>
    <Modal
      buttons={{
        [getString('terms-agree')]: onAgree,
        [getString('terms-disagree')]: onDisagree,
      }}
    />
  </Localized>
);
export default withLocalization(TermsModal);
