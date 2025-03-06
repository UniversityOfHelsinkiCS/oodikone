import { Stack, Typography } from '@mui/material'

import { BasicCell } from './BasicCell'

const getTooltip = (
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>,
  studyProgramme: string,
  year: string
) => {
  const countriesData = otherCountriesStats?.[studyProgramme]?.[year]

  if (!countriesData || Object.keys(countriesData).length === 0) {
    return null
  }

  return (
    <Stack>
      {Object.keys(countriesData)
        .sort()
        .map(country => (
          <Typography key={country} variant="body2">
            {country}: <b>{countriesData[country]}</b>
          </Typography>
        ))}
    </Stack>
  )
}

export const OtherCountriesCell = ({
  otherCountriesStats,
  studyProgramme,
  value,
  year,
}: {
  otherCountriesStats: Record<string, Record<string, Record<string, number>>>
  studyProgramme: string
  value: string | number
  year: string
}) => {
  const tooltip = getTooltip(otherCountriesStats, studyProgramme, year)

  return <BasicCell tooltip={tooltip ?? null} value={value} />
}
