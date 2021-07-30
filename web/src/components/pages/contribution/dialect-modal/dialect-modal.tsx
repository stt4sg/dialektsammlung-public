import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import * as React from 'react';
import { useLocale } from 'web/src/components/locale-helpers';
import Modal from 'web/src/components/modal/modal';
import { Button, LabeledOutput } from 'web/src/components/ui/ui';
import { useCallback, useEffect, useState } from 'react';
import { useAction, useAPI, useAccount } from 'web/src/hooks/store-hooks';
import { useTypedSelector } from 'web/src/stores/tree';
import { Notifications } from 'web/src/stores/notifications';
import { MunicipalitySearchUnregisteredUser } from 'web/src/components/pages/profile/info/municipalitySearchUnregisteredUser';
import './dialect-modal.css';

const pick = require('lodash.pick');

const WANTS_TO_SEE_DIALECT_MODAL = 'wantsToSeeDialectModal';
const deactivateDialectModalInLocalStorage = async () => {
  let wantsToSeeDialectModal = JSON.parse(localStorage.getItem(WANTS_TO_SEE_DIALECT_MODAL));
  localStorage.setItem(WANTS_TO_SEE_DIALECT_MODAL, JSON.stringify(false));
};

interface Props {
  onRequestClose: () => void;
}

const DialectModal = ({ onRequestClose }: Props) => {
  let zipcodeSelected: string = undefined;
  let cantonSelected: string = undefined;
  const api = useAPI();
  const user = useTypedSelector(({ user }) => user);
  const addNotification = useAction(Notifications.actions.addPill);
  const account = useAccount();
  const hasAccount = Boolean(account);
  const [locale] = useLocale();
  const [userFields, setUserFields] = useState<{
    canton: string;
    zipcode: string;
  }>({
    canton: '',
    zipcode: '',
  });
  const { canton, zipcode } = userFields;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (user.isFetchingAccount || isInitialized) {
      return;
    }
    setIsInitialized(true);
    setUserFields({
      ...userFields,
      ...pick(user, 'zipcode', 'canton'),
      ...(account ? pick(account, 'zipcode', 'canton') : {}),
    });
  }, [user]);

  const submit = useCallback(async () => {
    setIsSaving(true);
    setIsSubmitted(true);

    const data = {
      ...pick(userFields),
      client_id: user.userId,
      zipcode: zipcode ? zipcode : user.zipcode,
      canton: canton ? canton : user.canton,
    };

    try {
      addNotification('Gespeichert');
      setIsSaving(false);
      onRequestClose();
      await deactivateDialectModalInLocalStorage();
      await api.saveUnregisteredAccount({
        client_id: user.userId,
        auth_token: user.authToken,
        zipcode: data.zipcode,
        canton: data.canton,
      });
    } catch (e) {
      console.error(e);
    }
  }, [user, locale, userFields, api]);

  return (
    !hasAccount && (
      <>
        <Modal className="dialect-modal-wrapper" innerClassName="dialect-modal" onRequestClose={onRequestClose}>
          <div className="dialect-modal-image">
            <img src={require('./ch_map_red_marker.svg')} alt="Switzerland map" className="bg" />
          </div>
          <div className="dialect-modal-text">
            <h1>
              Vielen Dank für das fleissige Aufnehmen! Wenn Sie uns verraten, woher Ihr Dialekt stammt, werden Ihre
              Aufnahmen noch wertvoller für uns.
            </h1>
            <div className="dialect-modal-fields">
              <MunicipalitySearchUnregisteredUser
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
                <LabeledOutput className="output-box-modal" showHelpIcon={true}>
                  {userFields.zipcode} {userFields.canton}{' '}
                </LabeledOutput>
              </Localized>
            </div>
            <div className="dialect-modal-buttons">
              <div className="button-wrapper">
                <Button className="save" rounded disabled={false} onClick={submit}>
                  Speichern
                </Button>
              </div>
              <button
                className={'no-thx-button-modal'}
                onClick={async () => {
                  onRequestClose();
                  deactivateDialectModalInLocalStorage();
                }}>
                Nein, danke
              </button>
            </div>
          </div>
        </Modal>
      </>
    )
  );
};

export default DialectModal;
