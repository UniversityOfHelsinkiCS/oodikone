import { type MRT_VisibilityState, MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { type FormattedStudentData } from '.'
import { useColumnDefinitions } from './ColumnDefinitions'

type Variant = 'population' | 'studyGuidanceGroupPopulation'

export const GeneralTab = ({
  formattedData,
  variant,
  showAdminColumns,
  creditFilterText,
  group,
}: {
  formattedData: FormattedStudentData[]
  variant: Variant
  showAdminColumns: boolean
  creditFilterText: string
  group: any
}) => {
  const { language } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const columnDefinitions = useColumnDefinitions(creditFilterText)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>({
    lastName: namesVisible,
    firstNames: namesVisible,
    email: namesVisible,
  })

  // console.log(formattedData)

  useEffect(() => {
    setColumnVisibility({
      lastName: namesVisible,
      firstNames: namesVisible,
      email: namesVisible,
    })
  }, [namesVisible])

  const baseColumns = [
    'lastName',
    'firstNames',
    'email',
    'creditsTotal',
    'studentNumber',
    'tags',
    'phoneNumber',
    'updatedAt',
  ]

  const adminColumns = ['extent', 'updatedAt']

  const baseStudyGuidanceGroupColumns = ['creditsSince', 'programmes', 'startYearAtUniversity']

  const studyGuidanceGroupWithProgrammeColumns = [
    'citizenships',
    'creditsHops',
    'curriculumPeriod',
    'graduationDate',
    'extent',
    'gender',
    'mostRecentAttainment',
    'semesterEnrollments',
  ]

  const studyGuidanceGroupYearColumns = [
    'admissionType',
    'studyRightStart',
    'programmeStart',
    'studyTrack',
    'transferredFrom',
  ]

  const populationColumns = [
    'creditsHops',
    'creditsSince',
    'studyTrack',
    'studyRightStart',
    'programmeStart',
    'master',
    'semesterEnrollments',
    'graduationDate',
    'startYearAtUniversity',
    'programmes',
    'transferredFrom',
    'admissionType',
    'gender',
    'citizenships',
    'curriculumPeriod',
    'mostRecentAttainment',
    'extent',
    'updatedAt',
  ]

  const columnsByVariant: Record<Variant, Set<string>> = {
    population: new Set([...baseColumns, ...populationColumns]),
    studyGuidanceGroupPopulation: new Set([
      ...baseColumns,
      ...baseStudyGuidanceGroupColumns,
      ...(group?.tags?.studyProgramme ? studyGuidanceGroupWithProgrammeColumns : []),
      ...(group?.tags?.studyProgramme && group?.tags?.year ? studyGuidanceGroupYearColumns : []),
    ]),
  }

  const columns = useMemo(() => {
    return columnDefinitions.filter(col => {
      const isIncluded = columnsByVariant[variant].has(col.accessorKey ?? '')
      if (!showAdminColumns && adminColumns.includes(col.accessorKey ?? '')) return false
      return isIncluded
    })
  }, [variant, columnDefinitions, showAdminColumns, adminColumns, columnsByVariant])

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: formattedData ?? [],
    state: {
      columnVisibility,
      columnPinning: { left: ['studentNumber'] },
    },
    enableColumnActions: false,
    enableColumnFilters: false,
    enableStickyFooter: true,
    defaultColumn: { size: 0 },

    onColumnVisibilityChange: setColumnVisibility,
    muiTableContainerProps: {
      sx: {
        tableLayout: 'auto',
        whiteSpace: 'nowrap',
      },
    },
  })

  return (
    <>
      <ExportToExcelDialog
        exportColumns={columns}
        exportData={exportData}
        featureName="general_student_information"
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <MaterialReactTable table={table} />
    </>
  )
}
