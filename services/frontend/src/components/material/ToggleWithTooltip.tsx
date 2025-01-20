import { Stack, Switch, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

export const ToggleWithTooltip = ({
  checked,
  cypress,
  label,
  onChange,
  tooltipText,
}: {
  checked: boolean
  cypress: string
  label: string
  onChange: () => void
  tooltipText?: string | null
}) => {
  return (
    <Stack alignItems="center" direction="row" gap={1}>
      <Stack alignItems="center" direction="row">
        <Switch checked={checked} data-cy={cypress} onChange={onChange} />
        <Typography color="text.primary">{label}</Typography>
      </Stack>
      {tooltipText && <InfoBox content={tooltipText} mini />}
    </Stack>
  )
}
