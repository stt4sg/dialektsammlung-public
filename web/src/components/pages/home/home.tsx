import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { trackHome } from '../../../services/tracker';
import { useTypedSelector } from '../../../stores/tree';
import { ContributableLocaleLock } from '../../locale-helpers';
import { RecordLink } from '../../primary-buttons/primary-buttons';
import { StyledLink } from '../../ui/ui'; // Currently we don't need the LinkButton component
import { ClipsStats, VoiceStats } from './stats'; // (Version 2.0)
import { NameDrop } from '../../layout/logo.tsx';
import InfluenceCard from '../../layout/influence.tsx';

import './home.css';

export default function HomePage() {
  const { locale, user } = useTypedSelector(
    ({ locale, user }) => ({
      locale,
      user,
    }),
    shallowEqual
  );

  const organizer_logos = ['SwissNLP-Logo.png', 'ZHAW_Logo.png', 'fhnw-logo.png'];
  const partner_logos = [
    'eth_media_tech_centre.png',
    'AXA_Versicherungen_Logo.png',
    'twentyMins.png',
    'spinningBytes.png',
    'MF-Fisch.png',
    'uzh_logo.png',
    'tamedia.png',
  ];
  const influencers = [
    {
      name: 'Mike Müller',
      pitch: 'Eines Tages auf Schweizerdeutsch ins Handy zu diktieren wäre doch eine wunderbare Sache!',
      headshot: 'MikeMueller',
    },
    { name: 'Frölein Da Capo', pitch: 'Diese Dialektsammlung ist eine osennig gute Sache. Imfau.', headshot: 'DaCapo' },
    {
      name: 'Renato Kaiser',
      pitch:
        'Ich unterstütze die Dialektsammlung. Egal, wie uns der Schnabel gewachsen ist - im Kollektiv sprechen wir eine Sprache.',
      headshot: 'RenatoKaiser',
    },
    {
      name: 'Claudio Zuccolini',
      pitch: 'Miar bruchend jeda Dialekt - au wenn dr Bündner Dialekt sicher dr Schönschti isch!',
      headshot: 'claudio_zuccolini',
    },
    {
      name: 'Sina',
      pitch:
        'Je mehr Aufnahmen gesammelt werden, desto besser versteht man jeden einzelnen Dialekt und damit auch das Walliserdeutsch.',
      headshot: 'Sina',
    },
    {
      name: 'Simon Enzler',
      pitch: 'Wir brauchen jeden Dialekt in dieser neuen Dialektsammlung. Vor allem natürlich den Appenzeller Dialekt!',
      headshot: 'SimonEnzler',
    },
  ];

  return (
    <div className="home">
      <div className="text">
        <div className="inner">
          <div className="title">
            <h1>Schweizer Dialektsammlung – Jeder kann mitmachen!</h1>
          </div>

          <div className="description">
            <p>Schon mit 3 Minuten Ihrer Zeit können Sie uns unterstützen.</p>
            <ul>
              <li>
                <b>Sprechen:</b> Übersetzen Sie hochdeutsche Sätze in Ihren Dialekt und nehmen Sie sie auf.
              </li>
              <li>
                <b>Prüfen:</b> Überprüfen Sie die Aufnahmen von anderen Nutzern.
              </li>
            </ul>
            <p>
              Weitere Informationen finden Sie <StyledLink to="/about">hier</StyledLink>.
            </p>
          </div>

          <div className="dialekt-chart">
            <img src={require('../../../../img/dialekt_sketch.webp')} />
          </div>

          <RecordLink big trackClass="speak-from-home" onClick={() => trackHome('speak', locale)}>
            <p>Jetzt mitmachen!</p>
          </RecordLink>

          <div className="title">
            <h2>Was passiert mit den Daten?</h2>
          </div>

          <div className="description">
            <p>
              Die Daten aus der Dialektsammlung werden für Forschungszwecke zur Verfügung gestellt. Zusätzlich soll es
              auch eine kommerzielle Lizenz geben. Wir hoffen, dass damit viele spannende Anwendungen und Produkte
              entwickelt werden können, zum Beispiel:
            </p>
            <ul>
              <li>Automatische Protokolle von Sitzungen erzeugen</li>
              <li>Untertitel für Hörgeschädigte erstellen (TV, Gespräche, Vorträge)</li>
              <li>Sprachassistenten Schweizerdeutsch beibringen</li>
            </ul>
            <p>
              Weitere Informationen zum Projekt und zum Hintergrund gibt es <StyledLink to="/about">hier</StyledLink>.
            </p>
          </div>

          <div className="title">
            <h2>Unterstützer</h2>
          </div>

          <div className="influence-display">
            {influencers.slice(0, 3).map(promi => (
              <InfluenceCard key={promi.name} name={promi.name} pitch={promi.pitch} headshot={promi.headshot} />
            ))}
          </div>

          <div className="influence-display">
            {influencers.slice(3).map(promi => (
              <InfluenceCard key={promi.name} name={promi.name} pitch={promi.pitch} headshot={promi.headshot} />
            ))}
          </div>

          <NameDrop
            logos={organizer_logos.map(logo => `backer_logos/${logo}`)}
            head={
              <div className="title">
                <h2>Organisatoren</h2>
              </div>
            }
          />

          <NameDrop
            logos={partner_logos.map(logo => `backer_logos/${logo}`)}
            head={
              <div className="title">
                <h2>Partner</h2>
              </div>
            }
          />

          <RecordLink big trackClass="speak-from-home" onClick={() => trackHome('speak', locale)}>
            <p>Jetzt mitmachen!</p>
          </RecordLink>
        </div>
      </div>

      {/* Version 2.0
      <div className="stats" ref={statsRef}>
        <ClipsStats.Root />
        <VoiceStats />
      </div>
      */}
    </div>
  );
}
