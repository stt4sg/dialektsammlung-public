import * as React from 'react';
import { useEffect, useState } from 'react';
import './kampf-der-kantone.css';
import { useAPI } from '../../../hooks/store-hooks';
import { Localized } from '@fluent/react';
import { InfoIcon } from '../../ui/icons';
import KampfDerKantoneMap from './kampf-der-kantone-map/kampf-der-kantone-map';
import { trackHome } from "../../../services/tracker";
import { RecordLink } from "../../primary-buttons/primary-buttons";
import { StyledLink } from "../../ui/ui";

export default function KampfDerKantone() {
  const api = useAPI();
  const [showInfo, setShowInfo] = useState(false);
  const [ds, setDs] = useState<any>({ result: [] });
  const fetchAndSetOverallCount = async () => setDs(await api.getCantonStats());
  useEffect(() => {
    fetchAndSetOverallCount();
  }, []);

  return (
    <div className="kampf-der-kantone">
      <h1>Kampf der Kantone</h1>
      <br/>
      <p>
      Im Kampf der Kantone messen sich die Kantone der Schweiz untereinander. Wem liegt der eigene Dialekt besonders am Herzen? Nehmen Sie Ihren Dialekt auf und helfen Sie Ihrem Kanton! Möge der fleissigste Kanton gewinnen!<br/>
      <br/>
      Am Stichtag 27. August 2021 ermitteln wir den Sieger-Kanton. Dabei berücksichtigen wir, wie viele Aufnahmen aus dem Kanton stammen, wie gut deren Qualität ist - und natürlich auch wie viele Personen überhaupt in dem Kanton leben!<br/>
      <br/>
      Der Gewinnerkanton wird mit einem Preis ausgezeichnet. Aber auch Sie können einen Preis für Ihren persönlichen Beitrag erhalten! Gehen Sie auf die <StyledLink to="/top-contributors">Rangliste</StyledLink>, um mehr zu erfahren.<br/>
      </p>
      <br/>
      <div className="cards">
        <div className="stats-card-kampf-der-kantone kampf-der-kantone-card">
          <div className="stats-card__inner">
            <div className="title-and-icon">
              <h2>Kampf der Kantone Rangliste</h2>
              <div className="kampf-der-kantone-info">
                {showInfo && (
                  <div className="info-menu">
                    <div style={{ height: 10 }}>
                      <div className="triangle triangle-top" />
                    </div>
                    <ul>
                      {[{ label: 'kampf-der-kantone-text' }].map(({ label }) => (
                        <li key={label} style={{ height: 'unset' }}>
                          <Localized id={label}>
                            <span />
                          </Localized>
                        </li>
                      ))}
                    </ul>
                    <div style={{ height: 10 }}>
                      <div className="triangle triangle-bottom" />
                    </div>
                  </div>
                )}
                <button
                  className={showInfo ? 'active' : ''}
                  style={{ display: 'flex' }}
                  onClick={() => setShowInfo(!showInfo)}
                  type="button">
                  <InfoIcon />
                </button>
              </div>
            </div>
            <div className="content">
              <table className="kampf-der-kantone-leaderboard">
                <thead>
                  <tr className="row">
                    <th className="position"></th>
                    <th className="flag-wrap"></th>
                    <th className="username"></th>
                    <th className="total">Punkte</th>
                  </tr>
                </thead>
                <tbody>
                  {ds.result.map((l: any, i: number) => {
                    return (
                      <tr className="row" key={l.canton}>
                        <td className="position">
                          {i < 9 ? '0' : ''}
                          {i + 1}
                        </td>
                        <td className="flag-wrap">
                          <img src={l.flag} />
                        </td>
                        <td className="username" title={l.name}>
                          {' '}
                          {l.name}{' '}
                        </td>
                        <td className="total"> {l.result} </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <KampfDerKantoneMap cantons={ds.result} />

      <RecordLink big trackClass="speak-from-home" onClick={() => trackHome('speak', 'de')}>
        <p>Jetzt mitmachen!</p>
      </RecordLink>
    </div>
  );
}
