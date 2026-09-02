export type EventStatus = "draft" | "published" | "completed";

export type LeagueEvent = {
  slug: string;
  name: string;
  gameSlug: "one-piece" | "riftbound";
  gameName: string;
  startsAt: string; // ISO
  location: string;
  formatLabel: string;
  capacity: number;
  priceEuros: number;
  ticketUrl?: string;
  rounds?: number;
  status: EventStatus;
};

export type Season = {
  slug: string;
  name: string;
  gameName: string;
  qualifiedCount: number;
  status: "active" | "closed";
};

export type StandingRow = {
  rank: number;
  playerId: string;
  displayName: string;
  totalPoints: number;
  eventsPlayed: number;
  bestPlacement: number;
  wins: number;
  losses: number;
};

export type EventResultRow = {
  placement: number;
  displayName: string;
  bandaiMemberId?: string;
  wins: number;
  losses: number;
  draws: number;
  omwPct?: number;
  oomwPct?: number;
  leaderName?: string;
  leaderCode?: string;
  leaguePoints: number;
};

export type MetagameSlice = {
  leaderName: string;
  leaderCode?: string;
  count: number;
  bestPlacement: number;
};

export type PlayerHistoryRow = {
  eventSlug: string;
  eventName: string;
  date: string;
  placement: number;
  wins: number;
  losses: number;
  draws: number;
  leaderName?: string;
  leaderCode?: string;
  leaguePoints: number;
};

export type DeckStat = {
  leaderName: string;
  leaderCode?: string;
  eventsPlayed: number;
  wins: number;
  losses: number;
  bestPlacement: number;
};

export type PlayerDashboard = {
  displayName: string;
  bandaiMemberId: string;
  rank: number;
  totalPoints: number;
  eventsPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  bestPlacement: number;
  qualifiedCount: number;
  /** Points du dernier joueur actuellement qualifié */
  cutPoints: number;
  history: PlayerHistoryRow[];
  decks: DeckStat[];
};
