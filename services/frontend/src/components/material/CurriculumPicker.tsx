import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

import { useEffect, useState } from 'react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/curriculum'
import { CurriculumOption, CurriculumDetails } from '@oodikone/shared/types'

export const CurriculumPicker = ({
  programmeCode,
  setCurriculum,
  year,
  disabled = false,
}: {
  disabled?: boolean
  programmeCode: string
  setCurriculum: (curriculum: (CurriculumDetails & { version: string[] }) | null) => void
  year: string
}) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumOption | undefined>(undefined)

  const { data: curriculums = [], isFetching: curriculumsLoading } = useGetCurriculumOptionsQuery(
    { code: programmeCode },
    { skip: !programmeCode }
  )

  const chosenCurriculum: CurriculumOption | null =
    selectedCurriculum ??
    curriculums?.find(curriculum => new Date(curriculum.validFrom) <= new Date(`${year}-08-01`)) ??
    curriculums?.[0] ??
    null

  const { data: chosenCurriculumData } = useGetCurriculumsQuery(
    {
      code: programmeCode,
      periodIds: chosenCurriculum?.periodIds,
    },
    { skip: curriculumsLoading || !chosenCurriculum?.periodIds }
  )

  useEffect(() => {
    if (chosenCurriculumData) {
      setCurriculum({ ...chosenCurriculumData, version: chosenCurriculum.periodIds })
    }
  }, [chosenCurriculumData])

  if (curriculumsLoading) return null

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
        {curriculums.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
