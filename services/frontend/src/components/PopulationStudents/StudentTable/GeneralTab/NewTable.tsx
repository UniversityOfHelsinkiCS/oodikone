import { useMemo } from 'react'

import type { ColumnDef, TableOptions } from '@tanstack/react-table'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { FormattedStudentData } from '../GeneralTab'

import { useGetColumnDefinitions } from './baseColumns'
import { useGetProgrammesQuery } from '@/redux/populations'
import { isMastersProgramme } from '@/common'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'

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

  if (!degreeProgrammesFound) return null

  const [columns, accessorKeys]: [ColumnDef<FormattedStudentData, any>[], string[]] = useMemo(() => {
    const columns = useGetColumnDefinitions({
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
      <OodiTableExcelExport exportData={data} exportColumns={exportColumns} />
      <OodiTable data={data as FormattedStudentData[]} columns={columns} options={tableOptions} />
    </>
  )
}
