import * as React from 'react';
import { useTypedSelector } from '../../../stores/tree';
import { shallowEqual } from 'react-redux';
import { RecordLink } from '../../primary-buttons/primary-buttons';
import { trackHome } from '../../../services/tracker';

import './get-involved.css';

const GetInvolved: React.ComponentType = () => {
  const { locale, user } = useTypedSelector(
    ({ locale, user }) => ({
      locale,
      user,
    }),
    shallowEqual
  );

  return (
    <>
      <img className="wave-footer" src={require('../images/wave-footer@3x.png')} alt="" role="presentation" />

      <div className="text-section">
        <div className="line" />

        <RecordLink big trackClass="speak-from-about" onClick={() => trackHome('speak-about', locale)}>
          <p>Jetzt mitmachen!</p>
        </RecordLink>
      </div>
    </>
  );
};

export default GetInvolved;
