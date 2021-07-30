import { Localized } from '@fluent/react';
import * as React from 'react';
import Modal from '../modal/modal';

export default ({ onCancel }: any) => (
  <Modal innerClassName="onboarding-modal" onRequestClose={onCancel}>
    <Localized id="speak-page-modal-title">
      <h1 className="title" />
    </Localized>
    <Localized id="speak-page-modal-body">
      <p className="text" />
    </Localized>

    <p className="text" style={{ textAlign: 'left' }}>
      Beispiel 1:
      <br />
      Hochdeutscher Satz: "Robben verstand dies wie viele andere Spieler nicht."
      <br />
      Mögliche schweizerdeutsche Formulierung: "De Robben het das wie vieli anderi Spieler nid verstande."
      <br />
      <br />
      Beispiel 2:
      <br />
      Hochdeutscher Satz: "Wir sind Mitarbeiterinnen einer grossen Buchhandlung."
      <br />
      Mögliche schweizerdeutsche Formulierung: "Mir sind Mitarbeiterinne vomene grosse Buechlade."
      <br />
    </p>
  </Modal>
);
