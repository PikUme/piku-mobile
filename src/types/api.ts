export interface Page<T> {
  content: T[];
  last: boolean;
  totalElements: number;
  number: number;
  size: number;
}
