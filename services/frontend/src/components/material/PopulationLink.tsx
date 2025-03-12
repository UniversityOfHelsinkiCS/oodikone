import { NorthEast as NorthEastIcon } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import moment from 'moment'
import { Link } from 'react-router'

import { Tag } from '@/shared/types'

const getMonths = (year: number) => {
  const end = moment()
  const lastDayOfMonth = moment(end).endOf('month')
  const start = `${year}-08-01`
  return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
}

const getUrl = (params: {
  months: number
  studyRights: string
  tag?: string
  year: string | number
  years?: string
}) => {
  const baseUrl = '/populations'
  const urlParts = [
    `months=${params.months}`,
    'semesters=FALL',
    'semesters=SPRING',
    `studyRights=${params.studyRights}`,
  ]

  if (params.years) {
    urlParts.push('year=All', `years=${params.years}`)
  } else {
    urlParts.push(`year=${params.year}`)
  }

  if (params.tag) {
    urlParts.push(`tag=${params.tag}`)
  }

  const url = `${baseUrl}?${urlParts.join('&')}`
  return url
}

const getStudyRights = (studyProgramme: string, combinedProgramme?: string, studyTrack?: string) => {
  const studyRights: Record<string, string> = { programme: studyProgramme }
  if (studyTrack) {
    studyRights.studyTrack = studyTrack
  }
  if (combinedProgramme) {
    studyRights.combinedProgramme = combinedProgramme
  }
  return encodeURIComponent(JSON.stringify(studyRights))
}

const getTitle = (selectedYear: string | number, year: string, tag?: Tag) => {
  if (tag) {
    return `Population statistics of class ${selectedYear} with tag ${tag.name}`
  }
  if (year === 'Total') {
    return 'Population statistics of all years'
  }
  return `Population statistics of class ${selectedYear}`
}

export const PopulationLink = ({
  combinedProgramme,
  cypress,
  studyProgramme,
  studyTrack,
  tag,
  year,
  years,
}: {
  combinedProgramme?: string
  cypress?: string
  studyProgramme: string
  studyTrack?: string
  tag?: Tag
  year: string
  years?: number[]
}) => {
  const selectedYear = tag?.year ?? (year === 'Total' ? Math.min(...(years ?? [])) : Number(year.slice(0, 4)))
  const months =
    year === 'Total'
      ? getMonths(Math.min(...(years ?? [])))
      : Math.ceil(moment.duration(moment().diff(`${selectedYear}-08-01`)).asMonths())

  const title = getTitle(selectedYear, year, tag)

  const studyRights = getStudyRights(studyProgramme, combinedProgramme, studyTrack)
  const url = getUrl({
    months,
    studyRights,
    year: year === 'Total' ? Math.min(...(years ?? [])) : selectedYear,
    years: year === 'Total' ? (years ?? []).join('&years=') : undefined,
    tag: tag?.id,
  })

  return (
    <Link title={title} to={url}>
      <IconButton
        color="primary"
        data-cy={cypress ? `${cypress.toLowerCase()}-population-link-button` : 'population-link-button'}
      >
        <NorthEastIcon fontSize="small" />
      </IconButton>
    </Link>
  )
}
