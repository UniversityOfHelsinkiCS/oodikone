import type { TableOptions } from '@tanstack/react-table'
import { useMemo } from 'react'

import { isMastersProgramme } from '@/common'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { useGetProgrammesQuery } from '@/redux/populations'
import { DegreeProgrammeType } from '@oodikone/shared/types'

import { useGetColumnDefinitions } from './columnDefinitions'
import { Programme } from './util'

export type FormattedStudentData = {
  firstNames: string
  lastName: string
  studentNumber: string
  sisuID: string
  email: string
  phoneNumber: string
  creditsTotal: number
  creditsHops: number
  creditsCombinedProg: number | null
  creditsSince: number | null
  studyRightStart: string | null
  programmeStart: string | null
  option: string | null
  semesterEnrollments: {
    exportValue: number
    content: {
      key: string
      onHoverString: string
      typeLabel: string
      graduationCrown: string
    }[]
  } | null
  graduationDate: string | null
  graduationDateCombinedProg: string | null
  startYearAtUniversity: number | null
  primaryProgramme: string | null
  programmes: { exportValue: string | null; programmes: Programme[] } | null
  programmeStatus: string | null
  transferredFrom: string | null
  admissionType: string | null
  gender: string
  citizenships: string | null
  curriculumPeriod: string | null
  mostRecentAttainment: string | null
  tags: string | null
  extent: string | null
  studyTrack: string | null
  updatedAt: string | null
  grade: string | null
  attainmentDate: string
  enrollmentDate: string
  language: string | null
  tvex: boolean | null
}

export const GeneralTab = ({
  includePrimaryProgramme,
  programme,
  combinedProgramme,
  year,

  columnFunction,
  formattingFunction,
}: {
  includePrimaryProgramme: boolean
  programme: string | undefined
  combinedProgramme: string | undefined
  year?: string

  columnFunction: () => [string[], string[]]
  formattingFunction: () => Partial<FormattedStudentData>[]
}) => {
  const { getTextIn } = useLanguage()
  const { useFilterSelector } = useFilters()
  const { data: degreeProgrammes } = useGetProgrammesQuery()

  const columns = useGetColumnDefinitions({
    getTextIn,
    useFilterSelector,

    programme,
    combinedProgramme,
    includePrimaryProgramme,
    isMastersProgramme: degreeProgrammes?.[programme!]?.degreeProgrammeType === DegreeProgrammeType.MASTER,
    year,
  })

  const accessorKeys: string[] = useMemo(() => {
    const squashGroups = column => {
      if (column.columns) return column.columns.flatMap(squashGroups)
      return [column.accessorKey]
    }

    return columns.flatMap(squashGroups)
  }, [combinedProgramme, includePrimaryProgramme, isMastersProgramme])

  const data = formattingFunction()
  const [visible, excelVisible] = columnFunction()

  const columnVisibility = useMemo(
    () => Object.fromEntries(accessorKeys.map(key => [key, visible.includes(key)])),
    [visible]
  )

  const exportColumnKeys = useMemo(
    () => accessorKeys.filter(accessorKey => visible.includes(accessorKey) || excelVisible.includes(accessorKey)),
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
      <OodiTableExcelExport data={data} exportColumnKeys={exportColumnKeys} />
      <OodiTable columns={columns} data={data as FormattedStudentData[]} options={tableOptions} />
    </>
  )
}
