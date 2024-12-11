import { Stack, Switch, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

export const Toggle = ({
  cypress,
  disabled = false,
  firstLabel,
  secondLabel,
  value,
  setValue,
  infoBoxContent,
}: {
  cypress?: string
  disabled?: boolean
  firstLabel: string
  secondLabel: string
  value: boolean
  setValue: (value: boolean) => void
  infoBoxContent?: string
}) => {
  return (
    <Stack alignItems="center" direction="row" gap={1}>
      <Stack alignItems="center" direction="row">
        <Typography color={disabled ? 'text.secondary' : 'text.primary'}>{firstLabel}</Typography>
        <Switch checked={value} data-cy={cypress} disabled={disabled} onChange={() => setValue(!value)} />
        <Typography color={disabled ? 'text.secondary' : 'text.primary'}>{secondLabel}</Typography>
      </Stack>
      {infoBoxContent && <InfoBox content={infoBoxContent} mini />}
    </Stack>
  )
}
