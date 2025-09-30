import mysql from "mysql2/promise"

// Create a connection pool
export const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: '+07:00', // Set timezone to Asia/Ho_Chi_Minh (UTC+7)
  waitForConnections: true,
  connectionLimit: 5, // Giảm từ 10 xuống 5
  queueLimit: 10, // Thêm queue limit
  // Loại bỏ các options không hợp lệ cho MySQL2
  // acquireTimeout: 60000, // Không hỗ trợ trong MySQL2
  // timeout: 60000, // Không hỗ trợ trong MySQL2  
  // reconnect: true, // Không hỗ trợ trong MySQL2
})

// Function to get a connection from the pool
export async function getDbConnection() {
  return dbPool.getConnection()
}

export const getConnection = getDbConnection

export function getMysqlClient() {
  return dbPool
}

// Manual cleanup function (can be called when needed)
export async function closeDbPool() {
  try {
    console.log("Closing MySQL connection pool...")
    await dbPool.end()
    console.log("MySQL connection pool closed.")
  } catch (error) {
    console.error("Error closing MySQL pool:", error)
  }
}

// Function to get pool status
export function getPoolStatus() {
  try {
    return {
      threadId: dbPool.threadId,
      connectionLimit: dbPool.config?.connectionLimit || 'unknown',
      queueLimit: dbPool.config?.queueLimit || 'unknown',
      acquireTimeout: dbPool.config?.acquireTimeout || 'unknown',
      timeout: dbPool.config?.timeout || 'unknown',
    }
  } catch (error) {
    return {
      threadId: 'unknown',
      connectionLimit: 'unknown',
      queueLimit: 'unknown',
      acquireTimeout: 'unknown',
      timeout: 'unknown',
      error: 'Failed to get pool status'
    }
  }
}

// Function to log pool status
export function logPoolStatus() {
  console.log("[MySQL Pool Status]:", getPoolStatus())
}
