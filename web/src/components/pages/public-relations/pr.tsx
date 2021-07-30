import * as React from 'react';
import { useState } from 'react';
import { Localized } from '@fluent/react';
import { StyledLink, DownloadButton } from '../../ui/ui';
import MediaModal from './media-modal';
import { NameDrop, FigDrop } from '../../layout/logo.tsx';
import { trackHome } from '../../../services/tracker';

import './pr.css';

interface ModalMeta {
  show: boolean;
  src: string;
  title: string;
}

export default function PRPage() {
  const [modalState, setModalState] = useState<ModalMeta>({ show: false, src: '', title: '' });
  const organizer_logos = ['SwissNLP-Logo.png', 'ZHAW_Logo.png', 'fhnw-logo.png'];
  const partner_logos = [
    'eth_media_tech_centre.png',
    'AXA_Versicherungen_Logo.png',
    'twentyMins.png',
    'MF-Fisch.png',
    'tamedia.png',
    'spinningBytes.png',
    'uzh_logo.png',
  ];
  const members = [
    { fname: 'Manfred_Vogel.jpg', cap: 'Prof. Dr. Manfred Vogel' },
    { fname: 'Manuela_Huerlimann.jpg', cap: 'Manuela Hürlimann' },
    { fname: 'Mark_Cieliebak.jpg', cap: 'Prof. Dr. Mark Cieliebak' },
  ];

  const mediaImgClick = (e: any) => {
    setModalState({ show: true, src: e.target.src, title: '' });
  };

  const mediaFigClick = (e: any) => {
    setModalState({ show: true, src: e.target.src, title: e.target.alt });
  };

  return (
    <div className="pr-meat">
      <h1>Mediendossier Schweizer Dialektsammlung</h1>

      <DownloadButton
        link="https://raw.githubusercontent.com/stt4sg/stt-docs/main/pr/Media-Kit-Schweizer-Dialektsammlung.pdf"
        rounded>
        <span>Gesamtes Mediendossier herunterladen</span>
      </DownloadButton>

      <h2>Was ist die Schweizer Dialektsammlung?</h2>
      <p>
        Die Schweizer Dialektsammlung ist ein schweizweites Forschungsprojekt für die Sammlung von Mundart-Aufnahmen.
        Dafür wird eine Webapplikation verwendet, mit der freiwillige Nutzer Audioaufnahmen erstellen und überprüfen
        können. Diese wird ab Mai 2021 auf{' '}
        <StyledLink href="https://dialektsammlung.ch/" blank>
          dialektsammlung.ch
        </StyledLink>{' '}
        verfügbar sein. Mit der so entstehenden Dialektsammlung können Computerprogramme trainiert werden, die
        gesprochenes Schweizerdeutsch verstehen.
      </p>

      <h3>Ziel</h3>
      <p>
        Unser Ziel ist es, mindestens 2000 Stunden schweizerdeutsche Aufnahmen aus allen Dialektregionen zu sammeln. Die
        Daten werden wir für Forschungszwecke zugänglich machen.
      </p>

      <h3>Wie kann man bei der Dialektsammlung mitmachen?</h3>
      <p>
        Interessierte Nutzerinnen und Nutzer können die Webapp auf{' '}
        <StyledLink href="https://dialektsammlung.ch/" blank>
          dialektsammlung.ch
        </StyledLink>{' '}
        nutzen, um Sprachaufnahmen zu erstellen. Es werden hochdeutsche Sätze angezeigt, die in die eigene Mundart
        übersetzt und aufgenommen werden. Die Angabe von persönlichen Daten (Dialekt, Alter, Geschlecht) ist freiwillig
        - die Webapp kann auch ohne Registrierung genutzt werden. In einem zweiten Schritt stellen wir sicher, dass die
        Aufnahmen korrekt und sinnvoll sind. Dafür können die Aufnahmen von anderen Teilnehmenden geprüft werden.
      </p>

      <figure className="big">
        <img src={require('../../../../img/pr_ammo/Webapp_Aufnahme_erstellen.png')} />
        <figcaption>Webapp: Erstellen einer Sprachaufnahme</figcaption>
      </figure>

      <h3>Beteiligte Organisationen</h3>
      <p>
        Die Schweizer Dialektsammlung wird von der Swiss Association for Natural Language Processing (
        <StyledLink href="https://swissnlp.org/" blank>
          SwissNLP
        </StyledLink>
        ) organisiert, dem Verband für Sprachtechnologie in der Schweiz. SwissNLP führt das Projekt gemeinsam mit den
        Fachhochschulen{' '}
        <StyledLink href="https://www.zhaw.ch/de/engineering/institute-zentren/init/" blank>
          ZHAW
        </StyledLink>{' '}
        (Zürcher Hochschule für Angewandte Wissenschaften) und{' '}
        <StyledLink href="https://www.fhnw.ch/de/die-fhnw/hochschulen/ht/institute/institut-fuer-data-science" blank>
          FHNW
        </StyledLink>{' '}
        (Fachhochschule Nordwestschweiz) durch. Das Projekt wird von der{' '}
        <StyledLink href="https://www.axa.ch/de/privatkunden.html" blank>
          AXA Versicherung
        </StyledLink>{' '}
        und der Initiative{' '}
        <StyledLink
          href="https://www.zhaw.ch/de/ueber-uns/leitbild-und-strategie/strategische-initiative-zhaw-digital/"
          blank>
          ZHAW Digital
        </StyledLink>{' '}
        finanziell und von{' '}
        <StyledLink href="https://spinningbytes.com/" blank>
          SpinningBytes
        </StyledLink>{' '}
        organisatorisch unterstützt.{' '}
        <StyledLink href="https://www.tamedia.ch/de/" blank>
          Tamedia
        </StyledLink>{' '}
        und{' '}
        <StyledLink href="https://www.20min.ch/" blank>
          20 Minuten
        </StyledLink>{' '}
        stellen die Textdaten als Basis für die Sprachaufnahmen zur Verfügung. Ausserdem unterstützt das{' '}
        <StyledLink href="https://mtc.ethz.ch/" blank>
          Media Technology Centre
        </StyledLink>{' '}
        der ETH das Projekt als Technologiepartner. Die gesammelten Daten werden unter anderem in einem
        Forschungsprojekt des Schweizer Nationalfonds (SNF) verwendet, um zu erforschen, wie ein Computer verschiedene
        Dialekte verstehen kann.
      </p>

      <h2>Welche Anwendungen werden mit der Schweizer Dialektsammlung möglich?</h2>
      <h3>Ausgangslage</h3>
      <p>
        Deutschschweizer können oft mit sprachverarbeitenden Systemen nicht so sprechen, wie ihnen “der Schnabel
        gewachsen” ist. Bei Schweizer Mundart von A(argau) bis Z(ug) versteht die Software häufig nur "
        <StyledLink
          href="https://www.srf.ch/play/tv/kultur-webvideos/video/versteht-siri-schwizerduetsch?urn=urn:srf:video:a0c8d5ab-f61e-470f-9c1c-aafd4efe2029"
          blank>
          Bahnhof!
        </StyledLink>
        " Das liegt daran, dass Systeme für die Transkription gesprochener Sprache (Speech-to-Text) grosse Mengen an
        Trainingsdaten benötigen, das heisst Audioaufnahmen und die dazugehörigen Transkripte. Für Schweizerdeutsch gibt
        es bisher nicht genug öffentlich verfügbare Daten, um entsprechende Computerprogramme zu trainieren. Für grosse
        Technologiefirmen wie Google oder Amazon ist der Schweizer Markt zu klein, deshalb ist es für sie wenig
        attraktiv, eine Lösung zu entwickeln, die Schweizerdeutsch versteht.
      </p>

      <h3>Beitrag der Dialektsammlung</h3>
      <p>
        Mit Hilfe der Schweizer Bevölkerung wollen wir die Daten sammeln, die es braucht, um Speech-to-Text-Systeme für
        Schweizerdeutsch zu entwickeln. Freiwillige Nutzer übersetzen hochdeutsche Sätze in Mundart und sprechen sie in
        ihrem Dialekt, oder sie überprüfen die Aufnahmen anderer Nutzer. Weil wir den Datensatz für Forschungszwecke
        veröffentlichen, können Computerprogramme entwickelt werden, die für verschiedene Zwecke eingesetzt werden
        können (siehe unten für potentielle Anwendungen). Die Schweizer Dialektsammlung stärkt also den Forschungs- und
        Innovationsstandort Schweiz - ausserdem ermöglicht sie Produkte und Dienstleistungen, die unser Leben einfacher
        machen!
      </p>

      <h3>Anwendungen</h3>
      <p>
        Sobald gesprochenes Schweizerdeutsch verschriftlicht werden kann, können damit viele spannende Anwendungen
        entstehen, zum Beispiel:
      </p>
      <ul>
        <li>Automatische Transkription von Sitzungen und Interviews - die lästige Protokollierung entfällt</li>
        <li>
          Sprachschnittstellen zu Anwendungen werden möglich, Sprachassistenten können auf Schweizerdeutsch angesprochen
          werden
        </li>
        <li>
          Firmen können automatisch Kundenfeedback auswerten, zum Beispiel Anrufe beim Kundendienst, und damit ihre
          Produkte und Dienstleistungen verbessern
        </li>
        <li>
          Sprachschnittstellen zu Anwendungen werden möglich, Sprachassistenten können auf Schweizerdeutsch angesprochen
          werden
        </li>
        <li>
          Wissenschaftler können Umfragen viel effizienter auswerten und dadurch schneller zu nützlichen Ergebnissen
          kommen
        </li>
        <li>Untertitel für Fernsehsendungen können automatisch erstellt werden</li>
        <li>
          Medienschaffende und Archivare können Audiomaterial viel einfacher nutzen, indem sie auf eine Schlagwortsuche
          zurückgreifen
        </li>
        <li>Gehörlose können durch die Transkription an Gesprächen teilnehmen</li>
      </ul>

      <h2>Kampf der Kantone - jede Stimme zählt!</h2>
      <p>
        Welcher Kanton kann am meisten Audioaufnahmen beisteuern? Mit dem "Kampf der Kantone" finden wir es heraus! Wir
        verfolgen tagesaktuell, wie viele Aufnahmen aus jedem Kanton eingehen und stellen es auf einer Schweizerkarte
        sowie als Rangliste dar. Der aktuelle Stand kann{' '}
        <StyledLink href="https://dialektsammlung.ch/de/kampf-der-kantone" blank>
          hier
        </StyledLink>{' '}
        eingesehen werden.
        <br />
        Dabei berücksichtigen wir natürlich auch, wie viele Schweizerdeutsch sprechende Personen es in jedem Kanton gibt
        - gewinnen wird der Kanton mit den meisten Sprachaufnahmen im Verhältnis zur deutschsprachigen Einwohnerschaft,
        wobei natürlich auch die Qualität eine Rolle spielt. Um die fleissigsten Teilnehmenden zu belohnen, vergibt die
        Dialektsammlung ausserdem attraktive Preise an registrierte Nutzerinnen und Nutzer. Nähere Infos sowie die
        aktuelle Rangliste sind{' '}
        <StyledLink href="https://dialektsammlung.ch/de/top-contributors" blank>
          hier
        </StyledLink>{' '}
        zu finden.
      </p>

      <h2>Wie baut man Systeme, die Schweizerdeutsch verstehen?</h2>
      <p>
        Die Technologien für das Training von Speech-to-Text-Systemen wurden in den letzten Jahren laufend weiter
        entwickelt und basieren heutzutage meistens auf Neuronalen Netzwerken. Für Sprachen wie Englisch und Deutsch
        liefern diese Methoden bereits hervorragende Ergebnisse mit Fehlerraten unter 2%. Wir müssen also das Rad nicht
        neu erfinden, sondern können bestehende Forschungsergebnisse nutzen. So wurde an der SwissText2020 Konferenz
        eine{' '}
        <StyledLink href="https://swisstext-and-konvens-2020.org/low-resource-speech-to-text/" blank>
          Competition
        </StyledLink>{' '}
        basierend auf 70 Stunden Parlamentsdaten durchgeführt und an der SwissText2021 Konferenz ein weiterer{' '}
        <StyledLink href="https://www.swisstext.org/task-3-swiss-german-speech-to-standard-german-text/" blank>
          Wettbewerb
        </StyledLink>{' '}
        mit einem grösseren Corpus von fast 300h annotierten Parlamentsdaten und über tausend Stunden Audios ohne
        Transkriptionen.
      </p>

      <h2>Kontakt</h2>
      <ul>
        <li>
          <StyledLink href="mailto:info@dialektsammlung.ch">info@dialektsammlung.ch</StyledLink>
        </li>
        <li>
          Für FHNW: Prof. Dr. Manfred Vogel,{' '}
          <StyledLink href="mailto:manfred.vogel@fhnw.ch">manfred.vogel@fhnw.ch</StyledLink>, Tel. +41 56 202 77 36
        </li>
        <li>
          Für ZHAW: Prof. Dr. Mark Cieliebak, <StyledLink href="mailto:ciel@zhaw.ch">ciel@zhaw.ch</StyledLink>, Tel. +41
          58 934 72 39
        </li>
      </ul>

      <h2>Medienmitteilungen</h2>
      <ul>
        <li>
          25.05.2021:{' '}
          <StyledLink
            href="https://raw.githubusercontent.com/stt4sg/stt-docs/main/pr/MM-dialekte-May25-2021.pdf"
            download>
            ZHAW und FHNW digitalisieren Schweizer Dialekte
          </StyledLink>
        </li>
      </ul>

      <h2>Grafiken und Fotos</h2>
      <NameDrop
        logos={['logo_dialektsammlung_org.png']}
        rowClass="logo-row"
        frameClass="pr-frame"
        clickHandler={mediaImgClick}
        head={<h3>Logo</h3>}
      />

      <FigDrop
        logos={members.map(m => ({ ...m, fname: `pr_ammo/${m.fname}` }))}
        frameClass="pr-frame"
        clickHandler={mediaFigClick}
        head={<h3>Team</h3>}
      />

      <NameDrop logos={organizer_logos.map(pic => `backer_logos/${pic}`)} head={<h3>Organisatoren</h3>} />

      <NameDrop logos={partner_logos.map(pic => `backer_logos/${pic}`)} head={<h3>Partner</h3>} />

      <h2>Copyright</h2>
      <p>
        Sämtliche auf dieser Seite durch SwissNLP bereitgestellten Texte können für die Erstellung von Presseartikeln
        und anderen Medienberichten frei verwendet werden. Die SwissNLP stellt ausserdem das Logo der Dialektsammlung
        sowie von SwissNLP zur Bebilderung von Presseartikeln im Zusammenhang mit dieser Medienmitteilung kostenfrei zur
        Verfügung. Eine Übernahme der Bilder in Bilddatenbanken und ein Verkauf der Bilder durch Dritte sind nicht
        gestattet.
      </p>

      <DownloadButton
        link="https://raw.githubusercontent.com/stt4sg/stt-docs/main/pr/Media-Kit-Schweizer-Dialektsammlung.pdf"
        rounded>
        <span>Gesamtes Mediendossier herunterladen</span>
      </DownloadButton>

      {modalState.show && (
        <MediaModal
          media={modalState.src}
          title={modalState.title}
          onClose={() => setModalState(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
