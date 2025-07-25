import { useMemo } from 'react'

import type { ColumnDef, TableOptions } from '@tanstack/react-table'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { FormattedStudentData } from '../GeneralTab'

import { useGetColumnDefinitions } from './baseColumns'

export const NewTable = ({
  includePrimaryProgramme,
  programme,
  combinedProgramme,

  columnFunction,
  formattingFunction,
}: {
  includePrimaryProgramme: boolean
  programme: string
  combinedProgramme: string | undefined
  filteredStudents: any[]

  columnFunction: () => [string[], string[]],
  formattingFunction: () => FormattedStudentData[]
}) => {
  const { getTextIn } = useLanguage()

  const data = formattingFunction()

  const combinedProgrammeCode = combinedProgramme ?? null

  const queryStudyrights = [programme, combinedProgramme].filter(studyright => !!studyright) as string[]
  const degreeProgrammeTypes = useDegreeProgrammeTypes(queryStudyrights)
  const isMastersProgramme = degreeProgrammeTypes[programme] === 'urn:code:degree-program-type:masters-degree'    

  const columns: ColumnDef<FormattedStudentData, any>[] = [
    ...useGetColumnDefinitions({
      getTextIn,
      combinedProgrammeCode,
      isMastersProgramme,
      includePrimaryProgramme,
    })
  ]

  const accessorKeys = useMemo(() => {
    const squashGroups = (column) => {
      if (column.columns) return column.columns.flatMap(squashGroups)
      return [column.accessorKey]
    }

    return columns.flatMap(squashGroups)
  }, [])

  const [visible, excelVisible] = columnFunction()

  const columnVisibility = useMemo(() =>
    Object.fromEntries(accessorKeys.map(key => [key, visible.includes(key)]))
  , [visible])

  const tableOptions: Partial<TableOptions<FormattedStudentData>> = {
    initialState: {
      columnPinning: { left: ['studentNumber'] },
    },
    state: { columnVisibility },
    defaultColumn: {
      enableResizing: false
    }
  }

  return <OodiTable data={data} columns={columns} options={tableOptions} />
}
