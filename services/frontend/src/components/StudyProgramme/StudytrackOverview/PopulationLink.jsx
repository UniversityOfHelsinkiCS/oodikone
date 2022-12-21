import React from 'react'
import { Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import moment from 'moment'

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

const PopulationLink = ({ year, ...rest }) => {
  if (year === 'Total') return null
  return <PopulationStatisticsLink {...rest} year={year} />
}

export default PopulationLink
