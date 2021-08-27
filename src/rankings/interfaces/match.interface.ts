export interface IMatch {
  winner: string;
  result: Array<IResult>;
  players: Array<string>;
  category: string;
  challenge: string;
  dateTimeChallenge: string;
}

export interface IResult {
  set: string;
}
