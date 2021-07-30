import { Dispatch } from 'redux';
import { DeleteUserClient, UserClient, Settings } from 'common';
import { generateGUID, generateToken } from '../utility';
import StateTree from './tree';

export namespace User {
  export interface State {
    account: UserClient;
    authToken: string;
    canton: string;
    email: string;
    hasDownloaded: false;
    isFetchingAccount: boolean;
    isFetchingUserSettings: Boolean;
    privacyAgreed: boolean;
    privacyAgreed2: boolean;
    recordTally: number;
    sendEmails: boolean;
    settings: Settings;
    userClients: UserClient[];
    userId: string;
    validateTally: number;
    wants_newsletter: boolean;
    zipcode: string;
  }

  function getDefaultState(): State {
    return {
      account: null,
      authToken: generateToken(),
      canton: '',
      email: null,
      hasDownloaded: false,
      isFetchingAccount: true,
      isFetchingUserSettings: null,
      privacyAgreed: false,
      privacyAgreed2: false,
      recordTally: 0,
      sendEmails: false,
      settings: null,
      userClients: [],
      userId: generateGUID(),
      validateTally: 0,
      wants_newsletter: false,
      zipcode: '',
    };
  }

  enum ActionType {
    UPDATE = 'UPDATE_USER',
    TALLY_RECORDING = 'TALLY_RECORDING',
    TALLY_VERIFICATION = 'TALLY_VERIFICATION',
  }

  interface UpdateAction {
    type: ActionType.UPDATE;
    state: Partial<State>;
  }

  interface TallyRecordingAction {
    type: ActionType.TALLY_RECORDING;
  }

  interface TallyVerificationAction {
    type: ActionType.TALLY_VERIFICATION;
  }

  export type Action = UpdateAction | TallyRecordingAction | TallyVerificationAction | any;

  export const actions = {
    update: (state: Partial<State>): UpdateAction => ({
      type: ActionType.UPDATE,
      state,
    }),

    tallyRecording: (): TallyRecordingAction => ({
      type: ActionType.TALLY_RECORDING,
    }),

    tallyVerification: (): TallyVerificationAction => ({
      type: ActionType.TALLY_VERIFICATION,
    }),

    refresh: () => async (dispatch: Dispatch<UpdateAction>, getState: () => StateTree) => {
      const { api } = getState();
      dispatch({
        type: ActionType.UPDATE,
        state: { isFetchingAccount: true },
      });
      const [account, userClients] = await Promise.all([api.fetchAccount(), api.fetchUserClients()]);
      dispatch({
        type: ActionType.UPDATE,
        state: { account, userClients, isFetchingAccount: false },
      });
      await actions.claimLocalUser(dispatch, getState);
    },

    saveAccount: (data: UserClient) => async (dispatch: Dispatch<UpdateAction>, getState: () => StateTree) => {
      const { api, user } = getState();
      dispatch({
        type: ActionType.UPDATE,
        state: { isFetchingAccount: true },
      });
      dispatch({
        type: ActionType.UPDATE,
        state: {
          account: await api.saveAccount(data),
          isFetchingAccount: false,
        },
      });
      await actions.claimLocalUser(dispatch, getState);
    },

    saveSettings: (settings: Settings): any => ({
      type: ActionType.UPDATE,
      state: { settings: { ...settings } },
    }),

    deleteAccount: (data: DeleteUserClient) => async (dispatch: Dispatch<UpdateAction>, getState: () => StateTree) => {
      const { api, user } = getState();
      await api.deleteAccount(data);
    },

    claimLocalUser: async (dispatch: Dispatch<UpdateAction>, getState: () => StateTree) => {
      const { api, user } = getState();
      if (user.account && user.userId) {
        await api.claimAccount();
        dispatch({
          type: ActionType.UPDATE,
          state: {
            userId: null,
            recordTally: 0,
            validateTally: 0,
          },
        });
        actions.refresh()(dispatch, getState);
      }
    },
  };

  export function reducer(state = getDefaultState(), action: Action): State {
    state = {
      ...state,
      userId: state.userId || (state.isFetchingAccount || state.account ? null : generateGUID()),
    };
    switch (action.type) {
      case ActionType.UPDATE:
        return { ...state, ...action.state };

      case ActionType.TALLY_RECORDING:
        return { ...state, recordTally: state.recordTally + 1 };

      case ActionType.TALLY_VERIFICATION:
        return { ...state, validateTally: state.validateTally + 1 };

      default:
        return state;
    }
  }
}
