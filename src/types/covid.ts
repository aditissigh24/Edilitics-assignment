export interface CovidData {
    country: string;
    continent: string;
    cases: number;
    deaths: number;
    recovered: number;
  }
  
  export type SortType = 'asc' | 'desc';
  export type FilterType = 'all' | string;