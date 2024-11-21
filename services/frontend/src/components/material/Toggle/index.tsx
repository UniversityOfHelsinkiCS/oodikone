import { Stack, Switch, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

export const Toggle = ({
  cypress,
  firstLabel,
  secondLabel,
  value,
  setValue,
  infoBoxContent,
}: {
  cypress?: string
  firstLabel: string
  secondLabel: string
  value: boolean
  setValue: (value: boolean) => void
  infoBoxContent?: string
}) => {
  return (
    <Stack alignItems="center" direction="row">
      <Typography>{firstLabel}</Typography>
      <Switch checked={value} data-cy={cypress} onChange={() => setValue(!value)} />
      <Typography>{secondLabel}</Typography>
      {infoBoxContent && <InfoBox content={infoBoxContent} mini />}
    </Stack>
  )
}
