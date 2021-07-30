import { Localized } from '@fluent/react';
import * as React from 'react';
//import { useState } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useAction, useAPI } from '../../hooks/store-hooks';
import { useTypedSelector } from '../../stores/tree';
import { Notifications } from '../../stores/notifications';
import { Uploads } from '../../stores/uploads';
import { User } from '../../stores/user';
import { trackGlobal } from '../../services/tracker';
import URLS from '../../urls';
import { LocaleLink, LocalizedGetAttribute, useLocale } from '../locale-helpers';
import { CautionIcon, CheckIcon, OldPlayIcon } from '../ui/icons';
import { LabeledCheckbox } from '../ui/ui';
import './subscribe-newsletter.css';

const pick = require('lodash.pick');

export default function SubscribeNewsletter() {
  const api = useAPI();
  const [locale] = useLocale();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [status, setStatus] = useState<null | 'submitting' | 'submitted' | 'error'>(null);

  const [userFields, setUserFields] = useState<{
    email: string;
    wants_newsletter: boolean;
  }>({
    email: '',
    wants_newsletter: false,
  });

  const { email, wants_newsletter } = userFields;

  const user = useTypedSelector(({ user }) => user);
  const { account, userClients } = user;

  return (
    <form
      className="subscribe-newsletter"
      onSubmit={async e => {
        e.preventDefault();

        if (!privacyAgreed) {
          setStatus('error');
          return;
        }

        setStatus('submitting');
        try {
          await api.subscribeToNewsletter({
            client_id: user.userId,
            auth_token: user.authToken,
            email: userFields.email,
          });
          trackGlobal('footer-newsletter', locale);
          setStatus('submitted');
        } catch (e) {
          setStatus('error');
          console.error(e);
        }
      }}>
      <Localized id="email-subscription-title-new">
        <div className="goal-title" />
      </Localized>

      <LabeledCheckbox
        label={
          <Localized id="accept-privacy" elems={{ privacyLink: <LocaleLink to={URLS.PRIVACY} blank /> }}>
            <span />
          </Localized>
        }
        style={{ marginBottom: 20 }}
        checked={privacyAgreed}
        onChange={(event: any) => {
          setStatus(null);
          setPrivacyAgreed(event.target.checked);
        }}
      />

      <div className="submittable-field">
        <LocalizedGetAttribute id="download-form-email" attribute="label">
          {label => (
            <input
              className={userFields.email.length > 0 ? 'has-value' : ''}
              type="email"
              name="email"
              value={userFields.email}
              onChange={event => {
                setUserFields({ email: event.target.value, wants_newsletter: true });
                setStatus(null);
              }}
              placeholder={label}
              required
            />
          )}
        </LocalizedGetAttribute>

        <button
          type="submit"
          disabled={status != null}
          {...(status == 'submitting' || status == 'submitted'
            ? {
                className: 'success-button',
                children: <CheckIcon className="icon" />,
              }
            : status == 'error'
            ? {
                className: 'error-button',
                children: <CautionIcon className="icon" />,
              }
            : {
                className: 'submit-button',
                children: <OldPlayIcon className="icon" />,
              })}
        />
      </div>
    </form>
  );
}
