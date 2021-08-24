export interface MatchInterface {
  winner: string;
  result: Array<ResultInterface>;
  players: Array<string>;
  category: string;
  challenge: string;
}

export interface ResultInterface {
  set: string;
}
