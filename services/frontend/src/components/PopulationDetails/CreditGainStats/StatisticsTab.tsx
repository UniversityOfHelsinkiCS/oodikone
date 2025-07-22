import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { ADMISSION_TYPES } from '@/common'
import { filter as admissionTypeFilter } from '@/components/FilterView/filters/admissionType'
import { DividerWithText } from './DividerWithText'
import { StatisticsTable } from './StatisticsTable'

const admissionTypes = Object.values(ADMISSION_TYPES)

type StatisticsTabProps = {
  filteredStudents: any[] // TODO: type
  programme: string
}

export const StatisticsTab = ({ filteredStudents, programme }: StatisticsTabProps) => {
  const admissionTypesAvailable =
    filteredStudents.length !== filteredStudents.filter(admissionTypeFilter(programme)(null)).length

  return (
    <Stack>
      <StatisticsTable filteredStudents={filteredStudents} type="All students of the population" />
      {admissionTypesAvailable && (
        <Box>
          <DividerWithText text="By admission type" />
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
      )}
    </Stack>
  )
}
