import { NorthEast as NorthEastIcon } from '@mui/icons-material'
import { Button, IconButton } from '@mui/material'
import moment from 'moment'
import { Link } from 'react-router'

import { Tag } from '@/shared/types'
import { getMonths, getStudyRights, getTitle, getUrl } from '@/util/populationLink'

export const PopulationLink = ({
  combinedProgramme,
  cypress,
  studyProgramme,
  studyTrack,
  tag,
  variant,
  year,
  years,
}: {
  combinedProgramme?: string
  cypress?: string
  studyProgramme: string
  studyTrack?: string
  tag?: Tag
  variant?: 'button'
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

  if (variant === 'button') {
    return (
      <Link title={title} to={url}>
        <Button
          color="primary"
          disabled={years?.length === 1}
          endIcon={<NorthEastIcon fontSize="small" />}
          size="small"
          variant="contained"
        >
          Show
        </Button>
      </Link>
    )
  }

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
