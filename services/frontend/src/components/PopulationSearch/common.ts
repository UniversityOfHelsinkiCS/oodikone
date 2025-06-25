export const getMonths = (year: string, term: 'FALL' | 'SPRING') => {
  const now = new Date()
  const start = term === 'FALL' ? new Date(`${year}-08-01`) : new Date(`${Number(year) + 1}-01-01`)
  return (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1
}
