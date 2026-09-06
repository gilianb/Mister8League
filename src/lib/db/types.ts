// ------------------------------------------------------------------
// Types des lignes Supabase (tables et vues). Miroir de
// supabase/migrations/0001_schema.sql — à tenir à jour ensemble.
// ------------------------------------------------------------------

export type GameRow = { id: string; slug: string; name: string };

export type SeasonStatus = "draft" | "active" | "closed";
export type SeasonRow = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  starts_on: string;
  ends_on: string | null;
  qualified_count: number;
  status: SeasonStatus;
  created_at: string;
  updated_at: string;
};

export type PointScaleRuleRow = {
  id: string;
  season_id: string;
  label: string;
  placement_min: number;
  placement_max: number | null;
  points: number;
};

export type LeaderRow = {
  id: string;
  game_id: string;
  code: string | null;
  name: string;
  colors: string[];
  image_url: string | null;
};

export type ProfileRole = "player" | "admin";
export type ProfileRow = {
  id: string;
  pseudo: string | null;
  full_name: string | null;
  bandai_member_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  role: ProfileRole;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

/** Vue public_profiles : colonnes exposables à tous. */
export type PublicProfileRow = {
  id: string;
  pseudo: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
};

export type PlayerRow = {
  id: string;
  display_name: string;
  bandai_member_id: string | null;
  profile_id: string | null;
  merged_into: string | null;
  created_at: string;
  updated_at: string;
};

export type DeckRow = {
  id: string;
  profile_id: string;
  name: string;
  leader_id: string | null;
  decklist_text: string | null;
  notes: string | null;
  is_public: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventRow = {
  id: string;
  game_id: string;
  season_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  rules_text: string | null;
  schedule_text: string | null;
  prizes_text: string | null;
  format_label: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string;
  google_maps_url: string | null;
  starts_at: string;
  ends_at: string | null;
  registration_open_at: string | null;
  registration_close_at: string | null;
  capacity: number;
  price_cents: number;
  fee_bps: number;
  currency: string;
  cover_image_url: string | null;
  is_featured: boolean;
  rounds: number | null;
  counts_for_league: boolean;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SeatCountsRow = {
  event_id: string;
  active_count: number;
  paid_count: number;
  checked_in_count: number;
};

export type RegistrationStatus =
  | "pending_payment"
  | "paid"
  | "checked_in"
  | "cancelled"
  | "refunded";
export type PaymentProvider = "mollie" | "cash" | "free";

export type RegistrationRow = {
  id: string;
  event_id: string;
  profile_id: string | null;
  status: RegistrationStatus;
  expires_at: string | null;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  notes: string | null;
  deck_id: string | null;
  leader_id: string | null;
  payment_provider: PaymentProvider | null;
  mollie_payment_id: string | null;
  mollie_payment_status: string | null;
  amount_cents: number | null;
  currency: string | null;
  billing_data: BillingData | null;
  mollie_sales_invoice_id: string | null;
  mollie_sales_invoice_status: string | null;
  mollie_sales_invoice_number: string | null;
  mollie_sales_invoice_pdf_url: string | null;
  mollie_sales_invoice_created_at: string | null;
  ticket_pdf_path: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Adresse de facturation, format attendu par les factures Mollie. */
export type BillingData = {
  type: "consumer" | "business";
  locale: string;
  email: string;
  phone: string | null;
  streetAndNumber: string;
  streetAdditional: string | null;
  postalCode: string;
  city: string;
  region: string | null;
  country: string;
  givenName: string | null;
  familyName: string | null;
  organizationName: string | null;
  organizationNumber: string | null;
  vatNumber: string | null;
  title: string | null;
};

export type ResultImportStatus = "pending" | "applied" | "discarded";
export type ResultImportRow = {
  id: string;
  event_id: string;
  file_name: string | null;
  raw_csv: string | null;
  rounds: number | null;
  status: ResultImportStatus;
  created_by: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RowResolution =
  | "auto_player"
  | "auto_registration"
  | "registration"
  | "player"
  | "new_player"
  | "skip"
  | "unresolved";

export type ResultImportLineRow = {
  id: string;
  import_id: string;
  row_index: number;
  placement: number;
  bandai_member_id: string | null;
  player_name: string;
  match_points: number;
  wins: number;
  draws: number;
  losses: number;
  omw_pct: number | null;
  oomw_pct: number | null;
  memo: string | null;
  deck_urls: string | null;
  resolution: RowResolution;
  player_id: string | null;
  registration_id: string | null;
  leader_id: string | null;
  deck_id: string | null;
};

export type ResultRow = {
  id: string;
  event_id: string;
  player_id: string;
  placement: number;
  match_points: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  omw_pct: number | null;
  oomw_pct: number | null;
  leader_id: string | null;
  deck_id: string | null;
  league_points: number;
  import_id: string | null;
  created_at: string;
};

// ---------- Vues calculées ----------

export type StandingRow = {
  season_id: string;
  player_id: string;
  profile_id: string | null;
  display_name: string;
  pseudo: string | null;
  avatar_url: string | null;
  is_public: boolean;
  total_points: number;
  events_played: number;
  best_placement: number;
  wins: number;
  losses: number;
  draws: number;
  rank: number;
};

export type EventResultPublicRow = {
  event_id: string;
  result_id: string;
  player_id: string;
  profile_id: string | null;
  display_name: string;
  pseudo: string | null;
  avatar_url: string | null;
  is_public: boolean;
  placement: number;
  match_points: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  omw_pct: number | null;
  oomw_pct: number | null;
  league_points: number;
  leader_id: string | null;
  leader_name: string | null;
  leader_code: string | null;
  leader_image_url: string | null;
};

export type MetagameRow = {
  event_id: string;
  leader_id: string;
  leader_name: string;
  leader_code: string | null;
  colors: string[];
  image_url: string | null;
  players_count: number;
  best_placement: number;
};

export type PlayerHistoryRow = {
  player_id: string;
  result_id: string;
  event_id: string;
  event_slug: string;
  event_title: string;
  starts_at: string;
  season_id: string | null;
  placement: number;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  league_points: number;
  leader_id: string | null;
  leader_name: string | null;
  leader_code: string | null;
  leader_image_url: string | null;
};

export type PlayerDeckStatRow = {
  player_id: string;
  season_id: string | null;
  leader_id: string;
  leader_name: string;
  leader_code: string | null;
  leader_image_url: string | null;
  events_played: number;
  wins: number;
  losses: number;
  draws: number;
  best_placement: number;
  total_points: number;
};
