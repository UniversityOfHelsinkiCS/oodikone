import type { ColumnDef, TableOptions } from '@tanstack/react-table'
import { useMemo } from 'react'

import { isMastersProgramme } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { useGetProgrammesQuery } from '@/redux/populations'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import { FormattedStudentData } from '../GeneralTab'

import { getColumnDefinitions } from './baseColumns'

export const NewTable = ({
  includePrimaryProgramme,
  programme,
  combinedProgramme,

  columnFunction,
  formattingFunction,
}: {
  includePrimaryProgramme: boolean
  programme: string | undefined
  combinedProgramme: string | undefined

  columnFunction: () => [string[], string[]]
  formattingFunction: () => Partial<FormattedStudentData>[]
}) => {
  const { getTextIn } = useLanguage()
  const { data: degreeProgrammes, isSuccess: degreeProgrammesFound } = useGetProgrammesQuery()

  const [columns, accessorKeys]: [ColumnDef<FormattedStudentData, any>[], string[]] = useMemo(() => {
    if (!degreeProgrammesFound) return [[], []]

    const columns = getColumnDefinitions({
      getTextIn,
      combinedProgramme,
      includePrimaryProgramme,
      isMastersProgramme: degreeProgrammes[programme!]?.degreeProgrammeType === DegreeProgrammeType.MASTER,
    })

    const squashGroups = column => {
      if (column.columns) return column.columns.flatMap(squashGroups)
      return [column.accessorKey]
    }

    return [columns, columns.flatMap(squashGroups)]
  }, [combinedProgramme, includePrimaryProgramme, isMastersProgramme])

  const data = formattingFunction()
  const [visible, excelVisible] = columnFunction()

  const columnVisibility = useMemo(
    () => Object.fromEntries(accessorKeys.map(key => [key, visible.includes(key)])),
    [visible]
  )

  const exportColumns = useMemo(
    () => Object.fromEntries(accessorKeys.map(key => [key, visible.includes(key) || excelVisible.includes(key)])),
    [visible, excelVisible]
  )

  const tableOptions: Partial<TableOptions<FormattedStudentData>> = {
    initialState: {
      columnPinning: { left: ['studentNumber'] },
    },
    state: { columnVisibility },
    defaultColumn: {
      enableResizing: false,
    },
  }

  return (
    <>
      <OodiTableExcelExport exportColumns={exportColumns} exportData={data} />
      <OodiTable columns={columns} data={data as FormattedStudentData[]} options={tableOptions} />
    </>
  )
}
