import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'

import { Link } from '@/components/common/Link'
import { NorthEastIcon } from '@/theme'
import { getTitle, getUrl } from '@/util/populationLink'
import { Tag } from '@oodikone/shared/types'

export const PopulationLink = ({
  programme,
  years,
  combinedProgramme,
  studyTrack,
  tag,
  variant,
  cypress,
}: {
  programme: string
  years: number[]
  combinedProgramme?: string
  studyTrack?: string
  tag?: Tag
  variant?: 'button'
  cypress?: string
}) => {
  const title = getTitle(years[0], years.at(-1), tag)

  const url = getUrl({
    programme,
    combinedProgramme,
    studyTrack,
    years,
    tagId: tag?.id,
  })

  if (variant === 'button') {
    return (
      <Link title={title} to={url}>
        <Button
          color="primary"
          data-cy="population-link-show-button"
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
