import { Action as ReduxAction, Dispatch } from 'redux';
import StateTree from './tree';
import { User } from './user';
import { Clip } from 'common';

const MIN_CACHE_SIZE = 10;
export namespace Clips {
  export interface State {
    [locale: string]: {
      clips: Clip[];
      isLoading: boolean;
      showFirstContributionToast: boolean;
      showFirstStreakToast: boolean;
      hasEarnedSessionToast: boolean;
      challengeEnded: boolean;
    };
  }

  const localeClips = ({ locale, clips }: StateTree) => clips[locale];

  export const selectors = { localeClips };

  enum ActionType {
    REFILL_CACHE = 'REFILL_CLIPS_CACHE',
    REMOVE_CLIP = 'REMOVE_CLIP',
    LOAD = 'LOAD_CLIPS',
    ACHIEVEMENT = 'ACHIEVEMENT',
  }

  interface LoadAction extends ReduxAction {
    type: ActionType.LOAD;
  }

  interface AchievementAction extends ReduxAction {
    type: ActionType.ACHIEVEMENT;
    showFirstContributionToast?: boolean;
    hasEarnedSessionToast?: boolean;
    showFirstStreakToast?: boolean;
    challengeEnded?: boolean;
  }

  interface RefillCacheAction extends ReduxAction {
    type: ActionType.REFILL_CACHE;
    clips?: Clip[];
  }

  interface RemoveClipAction extends ReduxAction {
    type: ActionType.REMOVE_CLIP;
    clipId: string;
  }

  export type Action = LoadAction | RefillCacheAction | RemoveClipAction | AchievementAction;

  export const actions = {
    refillCache: () => async (dispatch: Dispatch<RefillCacheAction | LoadAction>, getState: () => StateTree) => {
      const state = getState();
      if (localeClips(state).clips.length > MIN_CACHE_SIZE) {
        return;
      }
      try {
        dispatch({ type: ActionType.LOAD });
        const clips = await state.api.fetchRandomClips(MIN_CACHE_SIZE - localeClips(state).clips.length);
        dispatch({
          type: ActionType.REFILL_CACHE,
          clips: clips.map(clip => {
            let sentence = clip.sentence;
            try {
              sentence.text = decodeURIComponent(sentence.text);
            } catch (e) {
              if (e.name !== 'URIError') {
                throw e;
              }
            }
            return {
              id: clip.id,
              glob: clip.glob,
              sentence,
              audioSrc: clip.audioSrc,
            };
          }),
        });
      } catch (err) {
        if (err instanceof XMLHttpRequest) {
          dispatch({ type: ActionType.REFILL_CACHE });
        } else {
          throw err;
        }
      }
    },
    vote:
      (isValid: boolean, clipId?: string) =>
      async (dispatch: Dispatch<Action | User.Action>, getState: () => StateTree) => {
        const state = getState();
        const id = clipId;
        dispatch({ type: ActionType.REMOVE_CLIP, clipId: id });
        const { showFirstContributionToast, hasEarnedSessionToast, showFirstStreakToast, challengeEnded } =
          await state.api.saveVote(id, isValid);
        if (!state.user.account) dispatch(User.actions.tallyVerification());
        if (state.user?.account?.enrollment?.challenge) {
          dispatch({
            type: ActionType.ACHIEVEMENT,
            showFirstContributionToast,
            hasEarnedSessionToast,
            showFirstStreakToast,
            challengeEnded,
          });
        }
        User.actions.refresh()(dispatch, getState);
        actions.refillCache()(dispatch, getState);
      },
    remove: (clipId: string) => async (dispatch: Dispatch<Action>, getState: () => StateTree) => {
      dispatch({ type: ActionType.REMOVE_CLIP, clipId });
      actions.refillCache()(dispatch, getState);
    },
  };

  export function reducer(
    locale: string,
    state: State = ['de'].reduce(
      (state, locale) => ({
        ...state,
        [locale]: {
          clips: [],
          isLoading: false,
          showFirstContributionToast: false,
          showFirstStreakToast: false,
          hasEarnedSessionToast: false,
        },
      }),
      {}
    ),
    action: Action
  ): State {
    const localeState = state[locale];

    switch (action.type) {
      case ActionType.LOAD:
        return {
          ...state,
          [locale]: {
            ...localeState,
            isLoading: true,
          },
        };
      case ActionType.REFILL_CACHE: {
        const clips = localeState ? (action.clips ? localeState.clips.concat(action.clips) : localeState.clips) : [];
        const filtered = clips.filter((clip1, i) => clips.findIndex(clip2 => clip2.id === clip1.id) === i);
        return {
          ...state,
          [locale]: {
            clips: filtered,
            isLoading: false,
            hasEarnedSessionToast: false,
            showFirstContributionToast: false,
            showFirstStreakToast: false,
            challengeEnded: true,
          },
        };
      }
      case ActionType.REMOVE_CLIP: {
        const clips = localeState.clips.filter(c => c.id !== action.clipId);
        return { ...state, [locale]: { ...localeState, clips } };
      }
      case ActionType.ACHIEVEMENT: {
        return {
          ...state,
          [locale]: {
            ...localeState,
            hasEarnedSessionToast: action.hasEarnedSessionToast,
            showFirstContributionToast: action.showFirstContributionToast,
            showFirstStreakToast: action.showFirstStreakToast,
            challengeEnded: action.challengeEnded,
          },
        };
      }
      default:
        return state;
    }
  }
}
