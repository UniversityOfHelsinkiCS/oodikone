import moment from 'moment'

import { Tag } from '@oodikone/shared/types'

export const getMonths = (year: number) => {
  const end = moment()
  const lastDayOfMonth = moment(end).endOf('month')
  const start = `${year}-08-01`
  return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
}

export const getUrl = (params: {
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

export const getStudyRights = (studyProgramme: string, combinedProgramme?: string, studyTrack?: string) => {
  const studyRights: Record<string, string> = { programme: studyProgramme }
  if (studyTrack) {
    studyRights.studyTrack = studyTrack
  }
  if (combinedProgramme) {
    studyRights.combinedProgramme = combinedProgramme
  }
  return encodeURIComponent(JSON.stringify(studyRights))
}

export const getTitle = (selectedYear: string | number, year: string, tag?: Tag) => {
  if (tag) {
    return `Population statistics of class ${selectedYear} with tag ${tag.name}`
  }
  if (year === 'Total') {
    return 'Population statistics of all years'
  }
  return `Population statistics of class ${selectedYear}`
}
