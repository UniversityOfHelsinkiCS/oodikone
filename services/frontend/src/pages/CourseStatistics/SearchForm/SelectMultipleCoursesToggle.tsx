import { FormControlLabel, Switch, Tooltip } from '@mui/material'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const SelectMultipleCoursesToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  const { getTextIn } = useLanguage()

  const tooltipText = getTextIn({
    fi: 'Jos "Select multiple courses" on valittuna, voit valita tarkasteltavaksi useita kursseja.',
    en: 'If "Select multiple courses" is on, you can select multiple courses to view statistics for.',
  })

  return (
    <Tooltip arrow placement="top" title={tooltipText}>
      <FormControlLabel
        control={
          <Switch checked={checked} color="primary" data-cy="select-multiple-courses-toggle" onChange={onChange} />
        }
        label="Select multiple courses"
      />
    </Tooltip>
  )
}
