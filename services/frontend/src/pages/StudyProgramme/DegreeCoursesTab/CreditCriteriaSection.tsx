import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { useEffect, useState } from 'react'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Section } from '@/components/material/Section'
import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { useAddProgressCriteriaCreditsMutation } from '@/redux/progressCriteria'
import { isMedicalProgramme } from '@/util/studyProgramme'
import { ProgressCriteria } from '@oodikone/shared/types'

const emptyCredits = {
  year1: null,
  year2: null,
  year3: null,
  year4: null,
  year5: null,
  year6: null,
} as const

export const CreditCriteriaSection = ({
  criteria,
  studyProgramme,
}: {
  criteria: ProgressCriteria
  studyProgramme: string
}) => {
  const [creditLimits, setCreditLimits] = useState<Record<string, null | number>>(emptyCredits)

  const [addProgressCriteriaCredits, { isError, isSuccess }] = useAddProgressCriteriaCreditsMutation()
  const { setStatusNotification } = useStatusNotification()

  const setCreditsLimitCriteria = () => {
    const credits = {
      year1: creditLimits.year1 ?? criteria.credits.yearOne,
      year2: creditLimits.year2 ?? criteria.credits.yearTwo,
      year3: creditLimits.year3 ?? criteria.credits.yearThree,
      year4: creditLimits.year4 ?? criteria.credits.yearFour,
      year5: creditLimits.year5 ?? criteria.credits.yearFive,
      year6: creditLimits.year6 ?? criteria.credits.yearSix,
    }
    void addProgressCriteriaCredits({ programmeCode: studyProgramme, credits })
  }

  const clearLimits = () => {
    setCreditLimits(emptyCredits)
  }

  useEffect(() => {
    if (isSuccess) {
      clearLimits()
      setStatusNotification('Credit criteria updated', 'success')
    }
  }, [isSuccess])

  useEffect(() => {
    if (isError) {
      clearLimits()
      setStatusNotification('Failed to update credit criteria', 'error')
    }
  }, [isError])

  const inputs = [
    {
      key: 'year1',
      label: 'First',
      previousValue: criteria.credits.yearOne,
    },
    {
      key: 'year2',
      label: 'Second',
      previousValue: criteria.credits.yearTwo,
    },
    {
      key: 'year3',
      label: 'Third',
      previousValue: criteria.credits.yearThree,
    },
  ]

  if (isMedicalProgramme(studyProgramme)) {
    inputs.push(
      {
        key: 'year4',
        label: 'Fourth',
        previousValue: criteria.credits.yearFour,
      },
      {
        key: 'year5',
        label: 'Fifth',
        previousValue: criteria.credits.yearFive,
      },
      {
        key: 'year6',
        label: 'Sixth',
        previousValue: criteria.credits.yearSix,
      }
    )
  }

  const disabled = Object.values(creditLimits).every(value => value === null || value < 0)

  return (
    <Section cypress="credit-criteria" infoBoxContent={studyProgrammeToolTips.creditCriteria} title="Credit criteria">
      <Stack gap={2}>
        <Grid container spacing={1}>
          {inputs.map((input, index) => {
            const value = creditLimits[input.key]
            const error = value !== null && value < 0
            return (
              <Grid key={input.key} size={4}>
                <TextField
                  error={error}
                  fullWidth
                  helperText={error ? 'Please enter a number above 0' : `Previously set to ${input.previousValue}`}
                  label={`${input.label} year (${(index + 1) * 12} months)`}
                  onChange={event => setCreditLimits({ ...creditLimits, [input.key]: Number(event.target.value) })}
                  placeholder={`Enter criteria for the ${input.label.toLowerCase()} year`}
                  size="small"
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">credits</InputAdornment>,
                    },
                  }}
                  type="number"
                  value={value ?? ''}
                />
              </Grid>
            )
          })}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Stack direction="row" gap={1}>
            <Button disabled={disabled} onClick={clearLimits} variant="outlined">
              Clear
            </Button>
            <Button disabled={disabled} onClick={setCreditsLimitCriteria} variant="contained">
              Save changes
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Section>
  )
}
