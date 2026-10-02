export interface SQLiteDB {
  execute: (
    sql: string,
    params?: any[],
  ) => Promise<{ rows?: any[] }> | { rows?: any[] };
  executeSync?: (
    sql: string,
    params?: any[],
  ) => { rows?: any[]; rowsAffected?: number };
}
