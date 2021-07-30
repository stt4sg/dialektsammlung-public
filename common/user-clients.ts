import { CustomGoal } from './goals';
import { Enrollment } from './challenge';

export type UserClient = {
  age?: string;
  avatar_clip_url?: string;
  avatar_url?: string;
  awards?: any[];
  basket_token?: string;
  canton?: string;
  client_id?: string;
  clips_count?: number;
  custom_goals?: CustomGoal[];
  email?: string;
  enrollment?: Enrollment;
  gender?: string;
  locales?: { locale: string; accent: string }[];
  sendEmails?: boolean;
  skip_submission_feedback?: boolean;
  username?: string;
  visible?: 0 | 1 | 2;
  votes_count?: number;
  wants_newsletter?: boolean;
  zipcode?: string;
};

export type DeleteUserClient = UserClient & { has_login: number; create_at: string; auth_token: string };
