import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useEffect, useState } from 'react'

import { PopulationLink } from '@/components/material/PopulationLink'

export const YearSelector = ({
  studyProgramme,
  studyTrack,
  years,
}: {
  studyProgramme: string
  studyTrack?: string
  years: string[]
}) => {
  const [startYear, setStartYear] = useState<number | null>(null)
  const [endYear, setEndYear] = useState<number | null>(null)
  const [yearRange, setYearRange] = useState<number[]>([0, 1])
  const [marks, setMarks] = useState<{ value: number; label?: string }[]>([])

  useEffect(() => {
    const availableYears = years
      .filter(year => year !== 'Total')
      .map(year => parseInt(year.slice(0, 4)))
      .sort((a, b) => a - b)

    const minYear = Math.min(...availableYears)
    const maxYear = Math.max(...availableYears)

    setStartYear(minYear)
    setEndYear(maxYear)
    setYearRange([minYear, maxYear])

    const newMarks = availableYears.map(year => ({
      value: year,
      label: [minYear, maxYear].includes(year) ? year.toString() : undefined,
    }))
    setMarks(newMarks)
  }, [studyProgramme, years])

  const getYears = () => {
    const [start, end] = yearRange
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setYearRange(newValue)
    }
  }

  const disabled = yearRange[0] === yearRange[1]

  return (
    <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
      {startYear !== null && endYear !== null && (
        <Stack alignItems="center" gap={2}>
          <Slider
            color={disabled ? 'error' : 'primary'}
            data-cy="year-selector-slider"
            disabled={endYear - startYear < 1}
            marks={marks}
            max={endYear}
            min={startYear}
            onChange={handleSliderChange}
            step={1}
            sx={{ width: 300 }}
            value={yearRange}
            valueLabelDisplay="auto"
          />
          <Stack alignItems="center" direction="row" gap={1}>
            {disabled ? (
              <Typography>Please select a range of years</Typography>
            ) : (
              <Typography>
                Show population between <b>{yearRange[0]}</b> and <b>{yearRange[1]}</b>
              </Typography>
            )}
            <PopulationLink
              studyProgramme={studyProgramme}
              studyTrack={studyTrack}
              variant="button"
              year="Total"
              years={getYears()}
            />
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
