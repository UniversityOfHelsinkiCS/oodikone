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
const getTotalPopulationLink = (studytrack, studyprogramme, combinedProgramme, months, yearsString) => {
  if (studytrack) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=All&years=${yearsString}`
    )
  }
  if (combinedProgramme) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"combinedProgramme"%3A"${combinedProgramme}"%7D&year=All&years=${yearsString}`
    )
  }
  return (
    `/populations?months=${months}&semesters=FALL&semesters=` +
    `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=All&years=${yearsString}`
  )
}

const getPopulationLink = (studytrack, studyprogramme, combinedProgramme, startYear, months) => {
  if (studytrack) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${startYear}`
    )
  }
  if (combinedProgramme) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"combinedProgramme"%3A"${combinedProgramme}"%7D&year=${startYear}`
    )
  }
  return (
    `/populations?months=${months}&semesters=FALL&semesters=` +
    `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${startYear}`
  )
}
const PopulationStatisticsLink = ({ studytrack, studyprogramme, combinedProgramme, year }) => {
  const startYear = Number(year.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${startYear}-08-01`)).asMonths())
  const href = getPopulationLink(studytrack, studyprogramme, combinedProgramme, startYear, months)
  return (
    <Link title={`Population statistics of class ${year}`} to={href}>
      <Icon name="level up alternate" />
    </Link>
  )
}

const TotalPopulationLink = ({ studytrack, studyprogramme, combinedProgramme, years }) => {
  const yearsString = years.join('&years=')
  const months = getMonths(Math.min(...years.map(year => Number(year))))
  const href = getTotalPopulationLink(studytrack, studyprogramme, combinedProgramme, months, yearsString)
  return (
    <Link title="Population statistics of all years" to={href}>
      <Icon name="level up alternate" />
    </Link>
  )
}

export const PopulationLink = ({ year, ...rest }) => {
  if (year === 'Total') return <TotalPopulationLink {...rest} />
  return <PopulationStatisticsLink {...rest} year={year} />
}
