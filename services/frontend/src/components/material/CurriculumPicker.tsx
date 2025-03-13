import { FormControl, MenuItem, Select } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/curriculum'
import { Curriculum, CurriculumDetails } from '@/shared/types'

const chooseCurriculumToFetch = (
  curriculums: Curriculum[],
  selectedCurriculum: Curriculum | undefined,
  startYear: string
) => {
  if (selectedCurriculum?.periodIds) {
    return selectedCurriculum
  }

  return (
    curriculums?.find(curriculum => new Date(curriculum.validFrom) <= new Date(`${startYear}-08-01`)) ??
    curriculums[0] ??
    null
  )
}

export const CurriculumPicker = ({
  disabled = false,
  programmeCodes,
  setCurriculum,
  year,
}: {
  disabled?: boolean
  programmeCodes: string[]
  setCurriculum: (curriculum: (CurriculumDetails & { version: string[] }) | null) => void
  year: string
}) => {
  const { data: curriculums = [] } = useGetCurriculumOptionsQuery(
    { code: programmeCodes[0] },
    { skip: !programmeCodes[0] }
  )
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | undefined>(undefined)
  const chosenCurriculum = chooseCurriculumToFetch(curriculums, selectedCurriculum, year)
  const { data: chosenCurriculumData } = useGetCurriculumsQuery(
    {
      code: programmeCodes[0],
      periodIds: chosenCurriculum?.periodIds,
    },
    { skip: !chosenCurriculum?.periodIds }
  )

  useEffect(() => {
    if (!chosenCurriculumData) {
      setCurriculum(null)
    } else {
      setCurriculum({ ...chosenCurriculumData, version: chosenCurriculum.periodIds })
    }
  }, [chosenCurriculum, chosenCurriculumData])

  if (curriculums.length === 0) {
    return null
  }

  return (
    <FormControl disabled={disabled} variant="standard">
      <Select
        MenuProps={{
          disablePortal: true,
        }}
        data-cy="curriculum-picker"
        onChange={event => setSelectedCurriculum(curriculums.find(({ id }) => id === event.target.value))}
        value={chosenCurriculum.id}
      >
        {curriculums.map(curriculum => (
          <MenuItem key={curriculum.id} value={curriculum.id}>
            {curriculum.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
