import { NorthEast as NorthEastIcon } from '@mui/icons-material'
import moment from 'moment'
import { Link } from 'react-router'

const getMonths = (year: number) => {
  const end = moment()
  const lastDayOfMonth = moment(end).endOf('month')
  const start = `${year}-08-01`
  return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
}

const getTotalPopulationLink = (
  combinedProgramme: string | undefined,
  months: number,
  studyProgramme: string,
  studyTrack: string | undefined,
  years: string
) => {
  if (studyTrack) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyProgramme}"%2C"studyTrack"%3A"${studyTrack}"%7D&year=All&years=${years}`
    )
  }
  if (combinedProgramme) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyProgramme}"%2C"combinedProgramme"%3A"${combinedProgramme}"%7D&year=All&years=${years}`
    )
  }
  return (
    `/populations?months=${months}&semesters=FALL&semesters=` +
    `SPRING&studyRights=%7B"programme"%3A"${studyProgramme}"%7D&year=All&years=${years}`
  )
}

const getPopulationLink = (
  combinedProgramme: string | undefined,
  months: number,
  startYear: number,
  studyProgramme: string,
  studyTrack: string | undefined
) => {
  if (studyTrack) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyProgramme}"%2C"studyTrack"%3A"${studyTrack}"%7D&year=${startYear}`
    )
  }
  if (combinedProgramme) {
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyProgramme}"%2C"combinedProgramme"%3A"${combinedProgramme}"%7D&year=${startYear}`
    )
  }
  return (
    `/populations?months=${months}&semesters=FALL&semesters=` +
    `SPRING&studyRights=%7B"programme"%3A"${studyProgramme}"%7D&year=${startYear}`
  )
}

export const PopulationLink = ({
  combinedProgramme,
  studyProgramme,
  studyTrack,
  year,
  years,
}: {
  combinedProgramme?: string
  studyProgramme: string
  studyTrack?: string
  year: string
  years: number[]
}) => {
  if (year === 'Total') {
    const yearsString = years.join('&years=')
    const months = getMonths(Math.min(...years.map(year => Number(year))))
    const href = getTotalPopulationLink(combinedProgramme, months, studyProgramme, studyTrack, yearsString)
    return (
      <Link title="Population statistics of all years" to={href}>
        <NorthEastIcon fontSize="small" />
      </Link>
    )
  }

  const startYear = Number(year.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${startYear}-08-01`)).asMonths())
  const href = getPopulationLink(combinedProgramme, months, startYear, studyProgramme, studyTrack)
  return (
    <Link title={`Population statistics of class ${year}`} to={href}>
      <NorthEastIcon fontSize="small" />
    </Link>
  )
}
