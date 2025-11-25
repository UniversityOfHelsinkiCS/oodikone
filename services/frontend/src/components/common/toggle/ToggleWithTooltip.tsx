import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'

import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'

/**
 * Single switch element with label to the right and an optional tooltip.
 * For toggle with labels on both sides, use ./Toggle.tsx.
 */
export const ToggleWithTooltip = ({
  checked,
  cypress,
  label,
  onChange,
  tooltipText,
}: {
  checked: boolean
  cypress?: string
  label: string
  onChange: () => void
  tooltipText?: string | null
}) => (
  <Stack direction="row" spacing={1}>
    <FormControlLabel control={<Switch checked={checked} data-cy={cypress} onChange={onChange} />} label={label} />
    {!!tooltipText && <InfoBox content={tooltipText} mini />}
  </Stack>
)
