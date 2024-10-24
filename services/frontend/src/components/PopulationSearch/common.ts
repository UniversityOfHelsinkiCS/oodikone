import moment from 'moment'

export const getMonths = (year: string, term: 'FALL' | 'SPRING') => {
  const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
  return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
}
