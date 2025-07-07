import { Tag } from '@oodikone/shared/types'

export const getUrl = (params: {
  programme: string
  years: number[]
  combinedProgramme?: string
  studyTrack?: string
  tagId?: string
}) => {
  const baseUrl = '/populations'
  const urlParts = [`programme=${params.programme}`, 'semesters=FALL', 'semesters=SPRING']

  for (const year of params.years) {
    urlParts.push(`years=${year}`)
  }

  if (params.combinedProgramme) {
    urlParts.push(`combinedProgramme=${params.combinedProgramme}`)
  }

  if (params.studyTrack) {
    urlParts.push(`studyTrack=${params.studyTrack}`)
  }

  if (params.tagId) {
    urlParts.push(`tag=${params.tagId}`)
  }

  const url = `${baseUrl}?${urlParts.join('&')}`
  return url
}

// Either a rangeStart or a tag should be supplied
export const getTitle = (rangeStart?: number, rangeEnd?: number, tag?: Tag) => {
  if (tag) {
    return `Population statistics of class ${tag.year} with tag ${tag.name}`
  }
  if (!!rangeEnd && rangeStart !== rangeEnd) {
    return `Population statistics of classes ${rangeStart} - ${rangeEnd}`
  }
  return `Population statistics of class ${rangeStart}`
}
