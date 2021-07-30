import { Dispatch } from 'redux';
const contributableLocales = require('../../../locales/contributable.json') as string[];
import { Clips } from './clips';
import { Sentences } from './sentences';
import StateTree from './tree';
import { DEFAULT_LOCALE } from '../services/localization.ts';

export namespace Locale {
  export type State = string;

  enum ActionType {
    SET = 'SET_LOCALE',
  }

  interface SetAction {
    type: ActionType.SET;
    locale: string;
  }

  export type Action = SetAction;

  export const actions = {
    set: (locale: string) => (dispatch: Dispatch<SetAction | any>, getState: () => StateTree) => {
      if (getState().locale === locale) return;
      dispatch({
        type: ActionType.SET,
        locale,
      });
      if (contributableLocales.includes(locale)) {
        dispatch(Sentences.actions.refill());
        dispatch(Clips.actions.refillCache());
      }
    },
  };

  // Since we don't support alternate locales, the SET_LOCALE action
  // currently always returns the default locale.
  export function reducer(state: State = null, action: Action): State {
    switch (action.type) {
      case ActionType.SET:
        return DEFAULT_LOCALE;

      default:
        return state;
    }
  }
}
