import { Stack, Switch, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

const ToggleLabel = ({ active, disabled, label }: { active: boolean; disabled: boolean; label: string }) => {
  return (
    <Typography color={disabled ? 'text.secondary' : 'text.primary'} fontWeight={active ? 'bold' : ''}>
      {label}
    </Typography>
  )
}

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
        <ToggleLabel active={!value} disabled={disabled} label={firstLabel} />
        <Switch checked={value} data-cy={cypress} disabled={disabled} onChange={() => setValue(!value)} />
        <ToggleLabel active={value} disabled={disabled} label={secondLabel} />
      </Stack>
      {infoBoxContent && <InfoBox content={infoBoxContent} mini />}
    </Stack>
  )
}
