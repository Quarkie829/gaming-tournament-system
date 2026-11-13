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

export type MatchStatus = 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
export type MatchOutcome = 'Win' | 'Loss' | 'Draw' | 'Forfeit';
export type DisputeStatus = 'Open' | 'Under Review' | 'Resolved' | 'Rejected';

export interface Match {
  match_id: number;
  tournament_id: number;
  tournament_title?: string;
  game_name?: string;
  round_name: string;
  match_number: number;
  scheduled_time: string;
  status: MatchStatus;
  participants?: MatchParticipantDetail[];
}

export interface MatchParticipantDetail {
  match_id: number;
  registration_id: number;
  slot_number: number;
  user_id?: number | null;
  team_id?: number | null;
  username?: string;
  team_name?: string;
  entrant_name?: string;
  score?: number | null;
  outcome?: MatchOutcome | null;
  recorded_at?: string | null;
}

export interface MatchResult {
  match_id: number;
  registration_id: number;
  score: number;
  outcome: MatchOutcome;
  recorded_at: string;
}

export interface MatchDispute {
  dispute_id: number;
  match_id: number;
  registration_id: number;
  reason: string;
  status: DisputeStatus;
  raised_at: string;
  entrant_name?: string;
  round_name?: string;
  match_number?: number;
  tournament_id?: number;
  tournament_title?: string;
  is_participant?: boolean;
}

export interface ResultCorrection {
  correction_id: number;
  match_id: number;
  registration_id: number;
  dispute_id: number | null;
  old_score: number;
  new_score: number;
  corrected_at: string;
  entrant_name?: string;
  round_name?: string;
  match_number?: number;
}

export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Refunded';

export interface Payment {
  payment_id: number;
  registration_id: number;
  amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  transaction_reference: string;
  paid_at: string;
  tournament_id?: number;
  tournament_title?: string;
  entrant_name?: string;
  user_id?: number | null;
  team_id?: number | null;
}

export interface Prize {
  prize_id: number;
  tournament_id: number;
  placement: number;
  prize_amount: number;
  description: string | null;
  awarded_registration_id: number | null;
  tournament_title?: string;
  winner_name?: string;
}

export interface Sponsor {
  sponsor_id: number;
  sponsor_name: string;
  contact_email: string | null;
  country: string | null;
  tournament_count?: number;
  total_contribution?: number;
}

export interface TournamentSponsor {
  tournament_id: number;
  sponsor_id: number;
  contribution_amount: number;
  sponsored_on: string;
  sponsor_name?: string;
  contact_email?: string | null;
  country?: string | null;
  tournament_title?: string;
}

export interface AuthTokenPayload {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
}
