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
        <Switch
          checked={value}
          data-cy={cypress}
          disabled={disabled}
          onChange={() => setValue(!value)}
          sx={{
            '& .MuiSwitch-switchBase': {
              color: 'white',
            },
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: 'white',
            },
            '& .MuiSwitch-track': {
              backgroundColor: 'gray',
              opacity: 0.5,
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'gray',
            },
          }}
        />
        <ToggleLabel active={value} disabled={disabled} label={secondLabel} />
      </Stack>
      {infoBoxContent && <InfoBox content={infoBoxContent} mini />}
    </Stack>
  )
}
