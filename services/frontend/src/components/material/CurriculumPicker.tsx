import { FormControl, MenuItem, Select } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/populationCourses'

const chooseCurriculumToFetch = (curriculums, selectedCurriculum, startYear) => {
  if (selectedCurriculum?.curriculum_period_ids) {
    return selectedCurriculum
  }

  return (
    curriculums?.find(curriculum => new Date(curriculum.valid_from) <= new Date(`${startYear}-08-01`)) ??
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
  setCurriculum: (curriculum: any) => void
  year: string
}) => {
  const { data: curriculums = [] } = useGetCurriculumOptionsQuery(
    { code: programmeCodes[0] },
    { skip: !programmeCodes[0] }
  )
  const [selectedCurriculum, setSelectedCurriculum] = useState(null)
  const chosenCurriculum = chooseCurriculumToFetch(curriculums, selectedCurriculum, year)
  const { data: chosenCurriculumData } = useGetCurriculumsQuery(
    {
      code: programmeCodes[0],
      periodIds: chosenCurriculum?.curriculum_period_ids,
    },
    { skip: !chosenCurriculum?.curriculum_period_ids }
  )

  useEffect(() => {
    if (!chosenCurriculumData) {
      setCurriculum(null)
      return
    }
    setCurriculum({ ...chosenCurriculumData, version: chosenCurriculum?.curriculum_period_ids })
  }, [chosenCurriculumData])

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
            {curriculum.curriculumName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
