import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { BasicCell } from '@/components/common/StartingYearStatsTable/BasicCell'

const getTooltip = (countries: Record<string, number> | null | undefined) => {
  if (!countries || Object.keys(countries).length === 0) {
    return null
  }

  return (
    <Stack>
      {Object.keys(countries)
        .sort()
        .map(country => (
          <Typography key={country} variant="body2">
            {country}: <b>{countries[country]}</b>
          </Typography>
        ))}
    </Stack>
  )
}

export const OtherCountriesCell = ({
  countries,
  value,
}: {
  countries: Record<string, number> | null | undefined
  value: string | number
}) => {
  return <BasicCell tooltip={getTooltip(countries)} value={value} />
}
