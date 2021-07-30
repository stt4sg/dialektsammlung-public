import { TypedUseSelectorHook, useSelector } from 'react-redux';
import API from '../services/api';
import { Clips } from './clips';
import { Flags } from './flags';
import { Notifications } from './notifications';
import { Sentences } from './sentences';
import { RequestedLanguages } from './requested-languages';
import { Uploads } from './uploads';
import { User } from './user';

interface Rank {
  myRank: number;
}
export default interface StateTree {
  api: API;
  clips: Clips.State;
  flags: Flags.State;
  notifications: Notifications.State;
  locale: string;
  requestedLanguages: RequestedLanguages.State;
  sentences: Sentences.State;
  uploads: Uploads.State;
  user: User.State;
  rank: Rank;
}

export const useTypedSelector: TypedUseSelectorHook<StateTree> = useSelector;
