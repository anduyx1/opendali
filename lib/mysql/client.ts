console.warn("WARNING: MySQL client is deprecated. This application now uses Supabase. Please update your code to use Supabase services.")

export const dbPool: any = null

export async function getDbConnection(): Promise<never> {
  throw new Error("MySQL is no longer supported. This application has migrated to Supabase. Please use Supabase services instead.")
}

export const getConnection = getDbConnection

export function getMysqlClient(): never {
  throw new Error("MySQL is no longer supported. This application has migrated to Supabase. Please use Supabase services instead.")
}

export async function closeDbPool(): Promise<void> {
  console.log("MySQL pool is no longer in use. Application uses Supabase.")
}

export function getPoolStatus() {
  return {
    status: 'deprecated',
    message: 'MySQL is no longer in use. Application migrated to Supabase.'
  }
}

export function logPoolStatus() {
  console.log("[MySQL Pool Status]: Deprecated - Application uses Supabase")
}
