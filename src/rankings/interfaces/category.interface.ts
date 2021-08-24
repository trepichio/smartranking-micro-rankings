export interface CategoryInterface {
  readonly _id: string;
  readonly category: string;
  description: string;
  events: Array<EventInterface>;
}

export interface EventInterface {
  name: string;
  operation: string;
  value: number;
}
