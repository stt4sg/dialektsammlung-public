import { Localized } from '@fluent/react';
import * as React from 'react';
import Modal from '../modal/modal';

export default ({ onCancel }: any) => (
  <Modal innerClassName="onboarding-modal" onRequestClose={onCancel}>
    <Localized id="listen-page-modal-title">
      <h1 className="title" />
    </Localized>
    <Localized id="listen-page-modal-body">
      <p className="text" />
    </Localized>
    <p className="text" style={{ textAlign: 'left' }}>
      Beispiel 1:
      <br />
      Hochdeutscher Satz: "Robben verstand dies wie viele andere Spieler nicht."
      <br />
      Aufnahme: "Robben verstand dies wie viele andere Spieler nicht."
      <br />
      Hochdeutsch aufgenommen -&gt; falsch
      <br />
      <br />
      Beispiel 2:
      <br />
      Hochdeutscher Satz: "Wir sind Mitarbeiterinnen einer grossen Buchhandlung."
      <br />
      Aufnahme: "Sie sind Mitarbeiterinne vomene grosse Buechlade gsi."
      <br />
      Inhalt des Satzes wurde verändert (sie statt wir, Vergangenheit statt Präsens) -&gt; falsch
    </p>
  </Modal>
);
