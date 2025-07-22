import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ADMISSION_TYPES } from '@/common'
import { filter as admissionTypeFilter } from '@/components/FilterView/filters/admissionType'
import { CreditsGainedTable } from './CreditsGainedTable'

const admissionTypes = Object.values(ADMISSION_TYPES)

type CreditsGainedTabProps = {
  filteredStudents: any[] // TODO: type
  programmeGoalTime: number
  programme: string
  year: number
}

export const CreditsGainedTab = ({ filteredStudents, programmeGoalTime, programme, year }: CreditsGainedTabProps) => {
  if (!filteredStudents?.length || !programme) return null

  const admissionTypesAvailable =
    filteredStudents.length !== filteredStudents.filter(admissionTypeFilter(programme)(null)).length

  const GetCreditsGainedTable = ({ type }: { type: (typeof admissionTypes)[number] }) => {
    const filteredStudentsByAdmissionType = filteredStudents.filter(admissionTypeFilter(programme)(type))
    return (
      <CreditsGainedTable
        filteredStudents={filteredStudentsByAdmissionType}
        key={`creditsgainedtable-admissiontype-${type}`}
        programmeGoalTime={programmeGoalTime}
        type={type ?? 'Ei valintatapaa'}
        year={year}
      />
    )
  }

  return (
    <Stack direction="column" spacing={'2em'}>
      <CreditsGainedTable
        filteredStudents={filteredStudents}
        programmeGoalTime={programmeGoalTime}
        type="All students of the class"
        year={year}
      />
      {admissionTypesAvailable && (
        <>
          <Divider sx={{ my: '0em' }}>
            <Typography fontSize="1em" variant="overline">
              By admission type
            </Typography>
          </Divider>
          {admissionTypes.map(type => (
            <GetCreditsGainedTable key={type} type={type} />
          ))}
        </>
      )}
    </Stack>
  )
}
