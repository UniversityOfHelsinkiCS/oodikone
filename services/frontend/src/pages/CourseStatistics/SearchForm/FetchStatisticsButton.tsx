import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const FetchStatisticsButton = ({
  disabled,
  maxSelectedCourses,
  onClick,
  selectedCourses,
}: {
  disabled: boolean
  maxSelectedCourses: number
  onClick: () => void
  selectedCourses: number
}) => {
  const { getTextIn } = useLanguage()

  const tooltipText = getTextIn({
    fi: `Olet valinnut ${selectedCourses} kurssia. Voit valita tarkasteltavaksi enintään ${maxSelectedCourses} kurssia kerrallaan. Tarkenna hakua tai poista valittuja kursseja.`,
    en: `You have selected ${selectedCourses} courses. You can select up to ${maxSelectedCourses} courses at a time. Refine your search or remove selected courses.`,
  })

  const FetchStatisticsButton = (
    <Button data-cy="fetch-stats-button" disabled={disabled} fullWidth onClick={onClick} variant="contained">
      Fetch statistics
    </Button>
  )

  if (selectedCourses === 0) {
    return null
  }

  if (disabled) {
    return (
      <Tooltip arrow placement="top" title={tooltipText}>
        <span>{FetchStatisticsButton}</span>
      </Tooltip>
    )
  }

  return FetchStatisticsButton
}
