import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { useAction, useAPI } from '../../../../hooks/store-hooks';
import { trackProfile } from '../../../../services/tracker';
import { Notifications } from '../../../../stores/notifications';
import { useTypedSelector } from '../../../../stores/tree';
import { Uploads } from '../../../../stores/uploads';
import { User } from '../../../../stores/user';
import URLS from '../../../../urls';
import { LocaleLink, useLocale } from '../../../locale-helpers';
import TermsModal from '../../../terms-modal';
import { Button, Hr, LabeledCheckbox, LabeledInput, LabeledOutput, LabeledSelect } from '../../../ui/ui';
import { isEnrolled } from '../../dashboard/challenge/constants';
import './info.css';
import { MunicipalitySearch } from './municipalitySearch';

const pick = require('lodash.pick');
type Locales = { locale: string; accent: string }[];
let zipcodeSelected: string = undefined;
let cantonSelected: string = undefined;

function ProfilePage({ getString, history }: WithLocalizationProps & RouteComponentProps<any, any, any>) {
  const api = useAPI();
  const [locale, toLocaleRoute] = useLocale();
  const user = useTypedSelector(({ user }) => user);
  const { account, userClients } = user;
  const addNotification = useAction(Notifications.actions.addPill);
  const addUploads = useAction(Uploads.actions.add);
  const saveAccount = useAction(User.actions.saveAccount);

  const [userFields, setUserFields] = useState<{
    age: string;
    canton: string;
    email: string;
    gender: string;
    municipality: string;
    privacyAgreed: boolean;
    privacyAgreed2: boolean;
    sendEmails: boolean;
    username: string;
    visible: number | string;
    wants_newsletter: boolean;
    zipcode: string;
  }>({
    age: '',
    canton: '',
    email: '',
    gender: '',
    municipality: '',
    privacyAgreed: false,
    privacyAgreed2: false,
    sendEmails: false,
    username: '',
    visible: 0,
    wants_newsletter: false,
    zipcode: '',
  });

  const {
    age,
    canton,
    gender,
    privacyAgreed,
    privacyAgreed2,
    sendEmails,
    username,
    visible,
    wants_newsletter,
    zipcode,
  } = userFields;

  const [locales, setLocales] = useState<Locales>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [termsStatus, setTermsStatus] = useState<null | 'show' | 'agreed'>(null);
  const isEnrolledInChallenge = user?.userClients[0]?.enrollment || isEnrolled(account);

  useEffect(() => {
    if (user.isFetchingAccount || isInitialized) {
      return;
    }
    setIsInitialized(true);

    if (!account && userClients.length == 0) {
      history.push('/');
    }

    setUserFields({
      ...userFields,
      sendEmails: !!account?.basket_token,
      visible: 0,
      ...pick(user, 'age', 'email', 'username', 'gender', 'municipality', 'zipcode', 'canton', 'wants_newsletter'),
      ...(account
        ? pick(
            account,
            'age',
            'email',
            'username',
            'gender',
            'visible',
            'municipality',
            'zipcode',
            'canton',
            'wants_newsletter'
          )
        : {
            age: userClients.reduce((init, u) => u.age || init, ''),
            gender: userClients.reduce((init, u) => u.gender || init, ''),
          }),
      privacyAgreed: Boolean(account),
      privacyAgreed2: Boolean(account),
    });

    let locales: Locales = [];
    if (!account) {
      locales = userClients.reduce((locales, u) => locales.concat(u.locales || []), []);
      locales = locales.filter((l1, i) => i == locales.findIndex(l2 => l2.locale == l1.locale));
    }
    setLocales(account ? account.locales : locales);
  }, [user]);

  const handleChangeFor =
    (field: string) =>
    ({ target }: React.ChangeEvent<any>) => {
      setUserFields({
        ...userFields,
        [field]: target.type == 'checkbox' ? target.checked : target.value,
      });
    };

  const submit = useCallback(() => {
    if (!user.account) {
      trackProfile('create', locale);
    }

    setIsSaving(true);
    setIsSubmitted(true);
    setTermsStatus('agreed');

    const data = {
      ...pick(userFields, 'username', 'age', 'gender'),
      locales: locales.filter(l => l.locale),
      visible: JSON.parse(visible.toString()),
      client_id: user.userId,
      zipcode: zipcode ? zipcode : user.zipcode,
      canton: canton ? canton : user.canton,
      wants_newsletter: wants_newsletter,
      enrollment: user.userClients[0].enrollment || {
        team: null,
        challenge: null,
        invite: null,
      },
    };

    addUploads([
      async () => {
        await saveAccount(data);
        if (!user.account?.basket_token && sendEmails) {
          await api.subscribeToNewsletter(user.userClients[0].email);
        }

        addNotification('Gespeichert');
        setIsSaving(false);
      },
    ]);
  }, [api, getString, locale, locales, termsStatus, user, userFields]);

  const submit2 = useCallback(() => {
    const data: any = {
      visible: 0,
      client_id: user.userId,
      zipcode: null,
      canton: null,
      enrollment: user.userClients[0].enrollment || {
        team: null,
        challenge: null,
        invite: null,
      },
      username: null,
      age: null,
      gender: null,
    };

    addUploads([
      async () => {
        await saveAccount(data);
        if (!user.account?.basket_token && sendEmails) {
          await api.subscribeToNewsletter(user.userClients[0].email);
        }
        addNotification(getString('You are deleted!'));
      },
    ]);
  }, [api, getString, locale, locales, termsStatus, user, userFields]);

  if (!isInitialized) {
    return null;
  }

  if (!isSaving && isSubmitted && isEnrolledInChallenge) {
    return (
      <Redirect
        to={{
          pathname: toLocaleRoute(URLS.DASHBOARD + URLS.CHALLENGE),
          state: {
            showOnboardingModal: true,
            earlyEnroll: window.location.search.includes('achievement=1'),
          },
        }}
      />
    );
  }

  return (
    <div className="profile-info">
      {termsStatus == 'show' && <TermsModal onAgree={submit} onDisagree={() => setTermsStatus(null)} />}
      {!user.account && (
        <Localized id="thanks-for-account">
          <h2 />
        </Localized>
      )}

      <span style={{ fontSize: '12px' }}>* markiert ein obligatorisches Feld</span>

      <MunicipalitySearch
        onSelectionHandler={e => {
          zipcodeSelected = e.PLZ4 + '';
          cantonSelected = e.KTKZ;
          const userFieldsCopy = { ...userFields };
          userFieldsCopy.zipcode = zipcodeSelected;
          userFieldsCopy.canton = cantonSelected;
          setUserFields(userFieldsCopy);
        }}
        municipalityData={'2020'}
      />

      <Localized id="profile-form-municipality" attrs={{ label: true, title: true }}>
        <LabeledOutput className="output-box" showHelpIcon={true}>
          {userFields.zipcode} {userFields.canton}{' '}
        </LabeledOutput>
      </Localized>
      <div className="form-fields" style={{ marginTop: '2rem' }}>
        <Localized id="profile-form-age" attrs={{ label: true, title: true }}>
          <LabeledSelect value={age} onChange={handleChangeFor('age')} showHelpIcon={true} name="age">
            <option key="" value="" />
            <option key="teens" value="teens">
              &lt; 19
            </option>
            <option key="twenties" value="twenties">
              19 - 29
            </option>
            <option key="thirties" value="thirties">
              30 - 39
            </option>
            <option key="fourties" value="fourties">
              40 - 49
            </option>
            <option key="fifties" value="fifties">
              50 - 59
            </option>
            <option key="sixties" value="sixties">
              60 - 69
            </option>
            <option key="seventies" value="seventies">
              70 - 79
            </option>
            <option key="eighties" value="eighties">
              80 - 89
            </option>
            <option key="nineties" value="nineties">
              &gt; 89
            </option>
          </LabeledSelect>
        </Localized>
        <Localized id="profile-form-gender-2" attrs={{ label: true, title: true }}>
          <LabeledSelect value={gender} onChange={handleChangeFor('gender')} showHelpIcon={true} name="gender">
            <option key="" value="" />
            <option key="male" value="male">
              männlich
            </option>
            <option key="female" value="female">
              weiblich
            </option>
            <option key="other" value="other">
              non-binär
            </option>
          </LabeledSelect>
        </Localized>
      </div>

      <Hr />

      <Localized id="profile-form-username" attrs={{ label: true, title: true }}>
        <LabeledInput value={username} onChange={handleChangeFor('username')} showHelpIcon={true} />
      </Localized>

      <div className="margin">
        <LabeledCheckbox
          label={
            <>
              <p>
                <strong>Punktestand in der öffentlichen Rangliste anzeigen</strong>
              </p>
              <p>
                <span>
                  Mit jeder Aufnahme und jeder Validierung sammeln Sie Punkte und können in der Rangliste aufsteigen.
                  Diese Option legt fest, ob Ihre gesammelten Punkte in der öffentlichen Rangliste einsehbar sein
                  sollen. Es wird nur Ihr Anzeigename dargestellt, nicht Ihre Emailadresse.
                </span>
              </p>
            </>
          }
          checked={visible}
          onChange={handleChangeFor('visible')}
        />
      </div>
      <Hr />

      {!user.account?.basket_token && (
        <>
          <div className="signup-section">
            <LabeledInput label="E-Mail-Adresse" value={user.userClients[0].email} disabled />
            <div className="checkboxes">
              <LabeledCheckbox
                label={
                  <>
                    <Localized id="email-opt-in-info-title">
                      <strong />
                    </Localized>
                    <Localized id="email-opt-in-info-sub-with-challenge">
                      <span />
                    </Localized>
                  </>
                }
                onChange={handleChangeFor('wants_newsletter')}
                checked={wants_newsletter}
              />

              {!user.account && !isSubmitted && (
                <>
                  <LabeledCheckbox
                    label={
                      <>
                        <strong>* Datenschutzerklärung</strong>
                        <Localized
                          id="accept-privacy"
                          elems={{
                            privacyLink: <LocaleLink to={URLS.PRIVACY} blank />,
                          }}>
                          <span />
                        </Localized>
                      </>
                    }
                    checked={privacyAgreed}
                    onChange={handleChangeFor('privacyAgreed')}
                  />
                  <LabeledCheckbox
                    label={
                      <>
                        <strong>* Nutzungsbestimmungen</strong>
                        <Localized
                          id="accept-privacy-2"
                          elems={{
                            privacyLink: <LocaleLink to={URLS.TERMS} blank />,
                          }}>
                          <span />
                        </Localized>
                      </>
                    }
                    checked={privacyAgreed2}
                    onChange={handleChangeFor('privacyAgreed2')}
                  />
                </>
              )}
            </div>
          </div>

          <Hr />
        </>
      )}

      <div className="row" style={{ textAlign: 'center', paddingBottom: '100px' }}>
        <div className="button-wrapper">
          {!account ? (
            <Button className="save" rounded disabled={isSaving || !(privacyAgreed && privacyAgreed2)} onClick={submit}>
              Registrierung abschliessen
            </Button>
          ) : (
            <Button className="save" rounded disabled={false} onClick={submit}>
              Speichern
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Profile Page containing basic information
 */
export default withLocalization(withRouter(ProfilePage));
