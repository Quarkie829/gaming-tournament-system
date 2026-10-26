export type UserRole = 'player' | 'admin';

export interface User {
  user_id: number;
  username: string;
  email: string;
  country: string;
  role: UserRole;
  created_at: string;
}

export interface Game {
  game_id: number;
  game_name: string;
  genre: string;
  platform: string;
  publisher: string;
  tournament_count?: number;
}

export type TournamentStatus = 'Upcoming' | 'Open' | 'Ongoing' | 'Completed' | 'Cancelled';
export type ParticipationType = 'Solo' | 'Team';

export interface Tournament {
  tournament_id: number;
  game_id: number;
  title: string;
  format: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  entry_fee: number;
  max_participants: number;
  status: TournamentStatus;
  game_name?: string;
  genre?: string;
  platform?: string;
  publisher?: string;
  rule_id?: number;
  participation_type?: ParticipationType;
  team_size?: number;
  min_age?: number | null;
  region_restriction?: string | null;
  rules_text?: string | null;
  registered_count?: number;
}

export interface Team {
  team_id: number;
  team_name: string;
  captain_id: number;
  captain_username?: string;
  captain_email?: string;
  member_count?: number;
  created_at: string;
}

export interface TeamMember {
  team_id: number;
  user_id: number;
  username?: string;
  email?: string;
  country?: string;
  member_role: string;
  joined_at: string;
  is_captain?: boolean;
}

export type RegistrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface Registration {
  registration_id: number;
  tournament_id: number;
  user_id: number | null;
  team_id: number | null;
  registration_date: string;
  status: RegistrationStatus;
  tournament_title?: string;
  game_name?: string;
  format?: string;
  entry_fee?: number;
  start_date?: string;
  end_date?: string;
  tournament_status?: TournamentStatus;
  participation_type?: ParticipationType;
  player_username?: string;
  player_email?: string;
  player_country?: string;
  username?: string;
  user_country?: string;
  team_name?: string;
  captain_username?: string;
  captain_name?: string;
  can_cancel?: boolean;
}

export interface UserEligibility {
  can_register_solo: boolean;
  is_registered_solo: boolean;
  user_solo_status: RegistrationStatus | null;
  captained_teams: Array<{
    team_id: number;
    team_name: string;
    member_count: number;
    is_registered: boolean;
    registration_status: RegistrationStatus | null;
    meets_size_requirement: boolean;
  }>;
  is_deadline_passed: boolean;
  is_full: boolean;
  is_open: boolean;
}
