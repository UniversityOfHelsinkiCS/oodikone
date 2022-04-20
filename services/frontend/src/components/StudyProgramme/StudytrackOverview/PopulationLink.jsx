import React from 'react'
import { Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import moment from 'moment'

const getMonths = year => {
  const end = moment()
  const lastDayOfMonth = moment(end).endOf('month')
  const start = `${year}-08-01`
  return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
}

const PopulationStatisticsLink = ({ studytrack, studyprogramme, year }) => {
  const startYear = Number(year.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${startYear}-08-01`)).asMonths())
  const href = studytrack
    ? `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${startYear}`
    : `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${startYear}`
  return (
    <Link title={`Population statistics of class ${year}`} to={href}>
      <Icon name="level up alternate" />
    </Link>
  )
}

const TotalPopulationLink = ({ studytrack, studyprogramme, years }) => {
  const yearsString = years.join('&years=')
  const months = getMonths(Math.min(...years.map(year => Number(year))))
  const href = studytrack
    ? `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${years[0].value}&years=${yearsString}`
    : `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=All&years=${yearsString}`
  return (
    <Link title="Population statistics of all years" to={href}>
      <Icon name="level up alternate" />
    </Link>
  )
}

const PopulationLink = ({ year, ...rest }) => {
  if (year === 'Total') return <TotalPopulationLink {...rest} />
  return <PopulationStatisticsLink {...rest} year={year} />
}

export default PopulationLink
