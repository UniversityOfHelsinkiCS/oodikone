import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { ADMISSION_TYPES } from '@/common'
import { filter as admissionTypeFilter } from '@/components/FilterView/filters/admissionType'
import { FormattedStudent } from '@oodikone/shared/types'
import { DividerWithText } from './DividerWithText'
import { StatisticsTable } from './StatisticsTable'

const admissionTypes = Object.values(ADMISSION_TYPES)

type StatisticsTabProps = {
  filteredStudents: FormattedStudent[]
  programme: string
}

export const StatisticsTab = ({ filteredStudents, programme }: StatisticsTabProps) => {
  const admissionTypesAvailable =
    filteredStudents.length !== filteredStudents.filter(admissionTypeFilter(programme)(null)).length

  return (
    <Stack sx={{ alignItems: 'center', p: '2em' }}>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <StatisticsTable filteredStudents={filteredStudents} type="All students of the population" />
      </Box>
      {admissionTypesAvailable ? (
        <>
          <DividerWithText text="By admission type" />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2em', justifyContent: 'center', width: '100%' }}>
            {admissionTypes.map(type => {
              const studentsByAdmissionType = filteredStudents.filter(admissionTypeFilter(programme)(type))
              return studentsByAdmissionType.length ? (
                <StatisticsTable
                  filteredStudents={studentsByAdmissionType}
                  key={`admissiontype-${type}`}
                  type={type ?? 'Ei valintatapaa'}
                />
              ) : null
            })}
          </Box>
        </>
      ) : null}
    </Stack>
  )
}
