// lib/mysql/utils.ts
export const formatToMySQLDateTime = (date: Date | undefined): string | null => {
  if (!date) return null
  return date.toISOString().slice(0, 19).replace("T", " ")
}
