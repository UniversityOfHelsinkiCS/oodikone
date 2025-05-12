import { type MRT_VisibilityState, MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { type FormattedStudentData } from '.'
import { useColumnDefinitions } from './ColumnDefinitions'

type Variant = 'population' | 'studyGuidanceGroupPopulation' | 'customPopulation'
export type DynamicColumnTitles = { creditsSince: string; option: string }

export const GeneralTab = ({
  formattedData,
  variant,
  showAdminColumns,
  dynamicTitles,
  group,
  customPopulationProgramme,
  studyTrackVisible,
}: {
  formattedData: FormattedStudentData[]
  variant: Variant
  showAdminColumns: boolean
  dynamicTitles: DynamicColumnTitles
  group: any
  customPopulationProgramme: any
  studyTrackVisible: boolean
}) => {
  const { language } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const columnDefinitions = useColumnDefinitions(dynamicTitles)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>({
    lastName: namesVisible,
    firstNames: namesVisible,
    email: namesVisible,
    studyTrack: studyTrackVisible,
  })

  // console.log('FormattedData:', formattedData)

  useEffect(() => {
    setColumnVisibility({
      lastName: namesVisible,
      firstNames: namesVisible,
      email: namesVisible,
      studyTrack: studyTrackVisible,
    })
  }, [namesVisible, studyTrackVisible])

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

  const baseCustomPopulationColumns = ['programmes', 'startYearAtUniversity']

  const customPopulationWithProgrammeColumns = [
    'creditsHops',
    'creditsSince',
    'graduationDate',
    'semesterEnrollments',
    'studyRightStart',
    'programmeStart',
    'studyTrack',
    'option',
    'transferredFrom',
    'admissionType',
    'gender',
    'citizenships',
    'curriculumPeriod',
    'mostRecentAttainment',
    'extent',
  ]

  const populationColumns = [
    'creditsHops',
    'creditsSince',
    'studyTrack',
    'studyRightStart',
    'programmeStart',
    'option',
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
    customPopulation: new Set([
      ...baseColumns,
      ...baseCustomPopulationColumns,
      ...(customPopulationProgramme ? customPopulationWithProgrammeColumns : []),
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
