import * as React from 'react';
import './verification-pending-page.css';

export class VerificationPendingPage extends React.Component {
  render() {
    return (
      <div className={'verificationNeededContainer'}>
        <h1>
          Wir haben zur Validierung eine Email an Sie geschickt. Bitte klicken Sie auf den Link in der Email, um Ihre
          Adresse zu validieren.
        </h1>
      </div>
    );
  }
}
