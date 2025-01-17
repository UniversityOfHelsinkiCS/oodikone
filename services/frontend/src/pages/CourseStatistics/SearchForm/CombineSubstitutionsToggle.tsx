import { FormControlLabel, Switch, Tooltip } from '@mui/material'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'

export const CombineSubstitutionsToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  const { getTextIn } = useLanguage()

  const tooltipText = getTextIn({
    fi: 'Jos "Combine substitutions" on valittuna (oletuksena), niin kurssi ja leikkaavat kurssit yhdistetään tilastoissa.',
    en: 'If "Combine substitutions" is on (default behavior), then course and its substitutions are combined in the statistics.',
  })

  return (
    <Tooltip arrow placement="top" title={tooltipText}>
      <FormControlLabel
        control={
          <Switch checked={checked} color="primary" data-cy="combine-substitutions-toggle" onChange={onChange} />
        }
        label="Combine substitutions"
      />
    </Tooltip>
  )
}
