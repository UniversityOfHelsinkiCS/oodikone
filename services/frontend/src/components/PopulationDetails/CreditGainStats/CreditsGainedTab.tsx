import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { ADMISSION_TYPES } from '@/common'
import { filter as admissionTypeFilter } from '@/components/FilterView/filters/admissionType'
import { FormattedStudent } from '@oodikone/shared/types'
import { CreditsGainedTable } from './CreditsGainedTable'
import { DividerWithText } from './DividerWithText'

const admissionTypes = Object.values(ADMISSION_TYPES)

type CreditsGainedTabProps = {
  filteredStudents: FormattedStudent[]
  programmeGoalTime: number
  programme: string
  year: number
}

export const CreditsGainedTab = ({ filteredStudents, programmeGoalTime, programme, year }: CreditsGainedTabProps) => {
  if (!filteredStudents?.length || !programme) return null

  const admissionTypesAvailable =
    filteredStudents.length !== filteredStudents.filter(admissionTypeFilter(programme)(null)).length

  return (
    <Stack direction="column" sx={{ p: 1 }}>
      <CreditsGainedTable
        filteredStudents={filteredStudents}
        programmeGoalTime={programmeGoalTime}
        type="All students of the class"
        year={year}
      />
      {admissionTypesAvailable ? (
        <Box>
          <DividerWithText text="By admission type" />
          {admissionTypes.map(type => {
            const studentsByAdmissionType = filteredStudents.filter(admissionTypeFilter(programme)(type))
            return studentsByAdmissionType.length ? (
              <CreditsGainedTable
                filteredStudents={studentsByAdmissionType}
                key={`creditsgainedtable-admissiontype-${type}`}
                programmeGoalTime={programmeGoalTime}
                type={type ?? 'Ei valintatapaa'}
                year={year}
              />
            ) : null
          })}
        </Box>
      ) : null}
    </Stack>
  )
}
