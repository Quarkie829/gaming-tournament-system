export type UserRole = 'player' | 'admin';

export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash?: string;
  country: string;
  role: UserRole;
  created_at: string;
}

export interface UserProfile {
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
  // Joined from TournamentRules
  rule_id?: number;
  participation_type?: ParticipationType;
  team_size?: number;
  min_age?: number | null;
  region_restriction?: string | null;
  rules_text?: string | null;
  registered_count?: number;
}

export interface TournamentRule {
  rule_id: number;
  tournament_id: number;
  participation_type: ParticipationType;
  team_size: number;
  min_age: number | null;
  region_restriction: string | null;
  rules_text: string | null;
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
  // Metadata fields for display
  tournament_title?: string;
  game_name?: string;
  format?: string;
  participation_type?: ParticipationType;
  username?: string;
  user_email?: string;
  team_name?: string;
  captain_username?: string;
}

export interface AuthTokenPayload {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
}
