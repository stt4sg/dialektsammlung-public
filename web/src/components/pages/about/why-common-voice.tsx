import * as React from 'react';
import { Localized } from '@fluent/react';
import { StyledLink } from '../../ui/ui';

import './why-common-voice.css';

const WhyCommonVoice: React.ComponentType<{}> = () => {
  const infoSections = ['why-needed', 'goals', 'results-usage', 'national-benefit', 'building'];

  return (
    <>
      <img className="wave-top" src={require('./images/wave-top.png')} alt="Wave" />

      <div className="about-container about-heading">
        <div className="about-header">
          <div className="about-header-text">
            <div className="line" />

            <Localized id="about-title">
              <h1 />
            </Localized>

            <Localized id="about-subtitle">
              <h2 />
            </Localized>

            <Localized id="about-header-description">
              <h2 className="header-description" />
            </Localized>

            {infoSections.map(secName => (
              <React.Fragment key={secName}>
                <Localized id={`about-${secName}-header`}>
                  <h3 />
                </Localized>

                {secName === 'results-usage' ? (
                  <>
                    <Localized id={`about-${secName}-leadup`}>
                      <p />
                    </Localized>

                    <ul>
                      {[...Array(6).keys()].map(n => (
                        <Localized key={`about-${secName}-item${n + 1}`} id={`about-${secName}-item${n + 1}`}>
                          <li />
                        </Localized>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Localized
                    id={`about-${secName}-exp`}
                    elems={{
                      lineBreak: <br />,
                      trainLink: (
                        <StyledLink
                          href="https://www.srf.ch/play/tv/kultur-webvideos/video/versteht-siri-schwizerduetsch?urn=urn:srf:video:a0c8d5ab-f61e-470f-9c1c-aafd4efe2029"
                          blank
                        />
                      ),
                      swisstext20Link: (
                        <StyledLink href="https://swisstext-and-konvens-2020.org/low-resource-speech-to-text/" blank />
                      ),
                      swisstext21Link: (
                        <StyledLink
                          href="https://www.swisstext.org/task-3-swiss-german-speech-to-standard-german-text/"
                          blank
                        />
                      ),
                    }}>
                    <p />
                  </Localized>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default WhyCommonVoice;
