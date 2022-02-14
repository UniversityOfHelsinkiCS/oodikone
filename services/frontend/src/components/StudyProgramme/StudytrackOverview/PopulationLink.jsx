import React from 'react'
import { Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import moment from 'moment'

const PopulationLink = ({ studytrack, studyprogramme, year: yearLabel }) => {
  const year = Number(yearLabel.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
  const href = studytrack
    ? `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${year}`
    : `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
  return (
    <Link title={`Population statistics of class ${yearLabel}`} to={href}>
      <Icon name="level up alternate" />
    </Link>
  )
}

export default PopulationLink
