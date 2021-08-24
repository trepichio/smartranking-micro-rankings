export interface ICategory {
  readonly _id: string;
  readonly category: string;
  description: string;
  events: Array<IEvent>;
}

export interface IEvent {
  name: string;
  operation: string;
  value: number;
}
