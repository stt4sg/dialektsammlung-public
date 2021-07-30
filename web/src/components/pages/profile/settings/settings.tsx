import { Localized, withLocalization, WithLocalizationProps } from '@fluent/react';
import * as React from 'react';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { UserClient } from 'common';
import { Notifications } from '../../../../stores/notifications';
import StateTree from '../../../../stores/tree';
import { User } from '../../../../stores/user';

import './settings.css';
import { useIsSubscribed } from '../../../../hooks/store-hooks';

const Section = ({
  title,
  titleAction,
  className = '',
  children,
  ...props
}: {
  title: string;
  titleAction?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) => (
  <section className={'user-setting ' + className} {...props}>
    <div className="section-title">
      <h2>{title}</h2>
      {titleAction}
    </div>
    {children && <div className="section-body">{children}</div>}
  </section>
);

interface PropsFromState {
  account: UserClient;
  locale: string;
}

interface PropsFromDispatch {
  addNotification: typeof Notifications.actions.addPill;
  saveAccount: any;
}

interface Props extends WithLocalizationProps, PropsFromState, PropsFromDispatch {}

function Settings(props: Props) {
  const { account, addNotification, getString, saveAccount } = props;
  const isSubscribed = useIsSubscribed();

  useEffect(() => {
    const { pathname, search } = location;
    if (search.includes('success=false')) {
      addNotification(
        <Localized id="email-already-used">
          <span />
        </Localized>,
        'error'
      );
      history.replaceState({}, null, pathname);
    } else if (search.includes('success=true')) {
      addNotification('Gespeichert');
      history.replaceState({}, null, pathname);
    }
  }, []);

  return <div></div>;
}

export default connect<PropsFromState, PropsFromDispatch>(
  ({ locale, user }: StateTree) => ({
    account: user.account,
    locale,
  }),
  {
    addNotification: Notifications.actions.addPill,
    saveAccount: User.actions.saveAccount,
  }
)(withLocalization(Settings));
