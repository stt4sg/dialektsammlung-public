import { withLocalization, WithLocalizationProps } from '@fluent/react';
import * as React from 'react';
import { User } from '../../../../stores/user';
import { useTypedSelector } from '../../../../stores/tree';
import './delete.css';
import { Button } from '../../../ui/ui';
import { RouteComponentProps, useHistory, withRouter } from 'react-router';
import { useAction } from '../../../../hooks/store-hooks';
import { Notifications } from '../../../../stores/notifications';

function DeleteProfile({}: WithLocalizationProps & RouteComponentProps<any, any, any>) {
  const history = useHistory();
  const addNotification = useAction(Notifications.actions.addPill);
  const deleteAccount = useAction(User.actions.deleteAccount);
  const user = useTypedSelector(({ user }) => user);
  const submit2 = async () => {
    const data: any = {
      visible: 0,
      client_id: user.userId,
      zipcode: null,
      canton: null,
      has_login: 0,
      created_at: null,
      auth_token: null,
      enrollment: user.userClients[0].enrollment || {
        team: null,
        challenge: null,
        invite: null,
      },
      username: '',
      age: null,
      gender: null,
      wants_newsletter: false,
    };
    await deleteAccount(data);
    addNotification('You are deleted!');
    history.push('/de');
    window.location.reload();
  };
  return (
    <Button className="save" rounded onClick={submit2}>
      Account löschen
    </Button>
  );
}

export default withLocalization(withRouter(DeleteProfile));
