import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

import { useEffect, useState } from 'react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/curriculum'
import { CurriculumOption, CurriculumDetails } from '@oodikone/shared/types'

const chooseCurriculumToFetch = (
  curriculums: CurriculumOption[],
  selectedCurriculum: CurriculumOption | undefined,
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
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumOption | undefined>()
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
