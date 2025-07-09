import { useMemo } from 'react'

import type { ColumnDef, TableOptions } from '@tanstack/react-table'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { FormattedStudentData } from '../GeneralTab'

import { formatStudent } from './formatStudents'
import { baseColumns } from './baseColumns'

export const NewTable = ({
  variant,
  programme,
  combinedProgramme,
  filteredStudents,
}: {
  variant: string
  programme: string
  combinedProgramme: string | undefined
  filteredStudents: any[]
}) => {
  const { getTextIn } = useLanguage()

  const programmeCode = programme
  const combinedProgrammeCode = combinedProgramme ?? null

  const queryStudyrights = [programme, combinedProgramme].filter(studyright => !!studyright) as string[]
  const degreeProgrammeTypes = useDegreeProgrammeTypes(queryStudyrights)
  const isMastersProgramme = degreeProgrammeTypes[programmeCode] === 'urn:code:degree-program-type:masters-degree'

  const includePrimaryProgramme =
    variant === 'coursePopulation' || (variant === 'studyGuidanceGroupPopulation' && !programmeCode)

  const isAdmin = true

  const data = useMemo(() => filteredStudents.map(student => formatStudent(student, { isAdmin, programmeCode, getTextIn })), [filteredStudents])

  const columns: ColumnDef<FormattedStudentData, any>[] = [
    ...baseColumns({
      getTextIn,
      combinedProgrammeCode,
      isMastersProgramme,
      includePrimaryProgramme,
    })
  ]

  const tableOptions: Partial<TableOptions<FormattedStudentData>> = {
    initialState: {
      columnPinning: {
        left: ['studentNumber']
      }
    },
    defaultColumn: {
      enableResizing: false
    }
  }

  return <OodiTable data={data} columns={columns} options={tableOptions} />
}
