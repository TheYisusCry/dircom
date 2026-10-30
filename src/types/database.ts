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
    };
    Enums: Empty;
    CompositeTypes: Empty;
  };
};
