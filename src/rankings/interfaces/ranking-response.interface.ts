export interface IRankingResponse {
  player?: string;
  rank?: number;
  score?: number;
  matchesHistory?: IMatchHistory;
}

export interface IMatchHistory {
  wins?: number;
  losses?: number;
  matches?: number;
}
