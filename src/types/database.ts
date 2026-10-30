export type AccountRole = "admin" | "employee";
export type Profile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  birthday_day: number | null;
  birthday_month: number | null;
  avatar_path: string | null;
  role: AccountRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type DirectoryProfile = Pick<
  Profile,
  | "id"
  | "first_name"
  | "last_name"
  | "job_title"
  | "birthday_day"
  | "birthday_month"
  | "avatar_path"
>;
export type ProfileFields = Pick<
  Profile,
  "first_name" | "last_name" | "job_title" | "birthday_day" | "birthday_month"
>;
export type BirthdayCelebrationRow = {
  id: string;
  employee_id: string;
  title: string;
  invitation: string;
  starts_at: string;
  location: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};
export type VotingRoundStatus = "open" | "closed" | "published";
export type VotingRoundRow = {
  id: string;
  title: string;
  week_label: string;
  status: VotingRoundStatus;
  opens_at: string;
  closes_at: string;
  created_at: string;
  winner_id: string | null;
  podium: Array<{
    position: 1 | 2 | 3;
    employee_id: string;
    employee_name: string;
    employee_role: string;
    employee_photo?: string;
    votes: number;
    recognition: string;
  }> | null;
};
export type VotingBallotRow = {
  round_id: string;
  voter_id: string;
  voted_at: string;
};
export type VotingVoteRow = {
  id: string;
  round_id: string;
  candidate_id: string;
  created_at: string;
};
export type ActivityCategory = "food" | "coffee" | "social";
export type ActivityStatus = "open" | "closed";
export type ActivityRow = {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  creator_id: string;
  status: ActivityStatus;
  created_at: string;
  closed_at: string | null;
};
export type ActivityMessageRow = {
  id: string;
  activity_id: string;
  author_id: string;
  text: string;
  created_at: string;
};
export interface ActionState {
  status: "idle" | "error" | "success";
  message: string;
}
export const INITIAL_ACTION: ActionState = { status: "idle", message: "" };
type Empty = Record<string, never>;
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<
          Profile,
          "created_at" | "updated_at" | "is_active" | "avatar_path"
        > &
          Partial<
            Pick<
              Profile,
              "created_at" | "updated_at" | "is_active" | "avatar_path"
            >
          >;
        Update: Partial<Profile>;
        Relationships: [];
      };
      birthday_celebrations: {
        Row: BirthdayCelebrationRow;
        Insert: Omit<BirthdayCelebrationRow, "id" | "created_at" | "updated_at"> &
          Partial<Pick<BirthdayCelebrationRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<BirthdayCelebrationRow>;
        Relationships: [
          {
            foreignKeyName: "birthday_celebrations_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      voting_rounds: {
        Row: VotingRoundRow;
        Insert: Omit<VotingRoundRow, "id" | "created_at" | "opens_at" | "winner_id" | "podium"> &
          Partial<Pick<VotingRoundRow, "id" | "created_at" | "opens_at" | "winner_id" | "podium">>;
        Update: Partial<VotingRoundRow>;
        Relationships: [
          {
            foreignKeyName: "voting_rounds_winner_id_fkey";
            columns: ["winner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      voting_ballots_cast: {
        Row: VotingBallotRow;
        Insert: Omit<VotingBallotRow, "voted_at"> & Partial<Pick<VotingBallotRow, "voted_at">>;
        Update: Partial<VotingBallotRow>;
        Relationships: [];
      };
      voting_votes: {
        Row: VotingVoteRow;
        Insert: Omit<VotingVoteRow, "id" | "created_at"> & Partial<Pick<VotingVoteRow, "id" | "created_at">>;
        Update: Partial<VotingVoteRow>;
        Relationships: [];
      };
      activities: {
        Row: ActivityRow;
        Insert: Omit<ActivityRow, "id" | "created_at" | "closed_at"> &
          Partial<Pick<ActivityRow, "id" | "created_at" | "closed_at">>;
        Update: Partial<ActivityRow>;
        Relationships: [
          {
            foreignKeyName: "activities_creator_id_fkey";
            columns: ["creator_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_messages: {
        Row: ActivityMessageRow;
        Insert: Omit<ActivityMessageRow, "id" | "created_at"> &
          Partial<Pick<ActivityMessageRow, "id" | "created_at">>;
        Update: Partial<ActivityMessageRow>;
        Relationships: [
          {
            foreignKeyName: "activity_messages_activity_id_fkey";
            columns: ["activity_id"];
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_messages_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { employee_directory: { Row: DirectoryProfile; Relationships: [] } };
    Functions: {
      dircom_my_profile: { Args: Empty; Returns: Profile[] };
      dircom_resolve_username: {
        Args: { p_username: string };
        Returns: string;
      };
      dircom_can_bootstrap: { Args: Empty; Returns: boolean };
      dircom_consume_login_budget: {
        Args: { p_subjects: string[] };
        Returns: boolean;
      };
      dircom_issue_password_update: {
        Args: { p_user_id: string };
        Returns: string;
      };
      dircom_issue_admin_password_update: {
        Args: { p_user_id: string };
        Returns: string;
      };
      dircom_cancel_password_update: {
        Args: { p_user_id: string; p_nonce: string };
        Returns: boolean;
      };
      cast_vote: {
        Args: { p_round_id: string; p_candidate_id: string };
        Returns: boolean;
      };
    };
    Enums: Empty;
    CompositeTypes: Empty;
  };
};
