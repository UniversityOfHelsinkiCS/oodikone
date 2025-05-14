import { type MRT_VisibilityState, MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { type FormattedStudentData } from '.'
import { useColumnDefinitions } from './ColumnDefinitions'

type Variant = 'population' | 'studyGuidanceGroupPopulation' | 'customPopulation' | 'coursePopulation'
export type DynamicColumnTitles = { creditsSince: string; option: string; programmes: string }

export const GeneralTab = ({
  formattedData,
  variant,
  showAdminColumns,
  dynamicTitles,
  group,
  customPopulationProgramme,
  admissionTypeVisible,
  studyTrackVisible,
}: {
  formattedData: FormattedStudentData[]
  variant: Variant
  showAdminColumns: boolean
  dynamicTitles: DynamicColumnTitles
  group: any
  customPopulationProgramme: any
  studyTrackVisible: boolean
  admissionTypeVisible: boolean
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
    phoneNumber: namesVisible,
    studyTrack: studyTrackVisible,
    admissionType: admissionTypeVisible,
  })

  useEffect(() => {
    setColumnVisibility({
      lastName: namesVisible,
      firstNames: namesVisible,
      email: namesVisible,
      phoneNumber: namesVisible,
      studyTrack: studyTrackVisible,
      admissionType: admissionTypeVisible,
    })
  }, [namesVisible, studyTrackVisible])

  const baseColumns = [
    'lastName',
    'firstNames',
    'email',
    'phoneNumber',
    'creditsTotal',
    'studentNumber',
    'tags',
    'updatedAt',
  ]

  const adminColumns = ['extent', 'updatedAt']

  const studyGuidanceGroupColumns = ['creditsSince', 'programmes', 'startYearAtUniversity']

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

  const customPopulationColumns = [
    'admissionType',
    'programmes',
    'startYearAtUniversity',
    'creditsHops',
    'creditsSince',
    'graduationDate',
    'studyRightStart',
    'programmeStart',
    'studyTrack',
    'gender',
    'citizenships',
    'mostRecentAttainment',
    'extent',
  ]

  const customPopulationWithProgrammeColumns = [
    'option',
    'transferredFrom',
    'semesterEnrollments',
    'curriculumPeriod',
    'extent',
  ]

  const customPopulationWithNoProgrammeColumns = ['primaryProgramme']

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
  ]

  const coursePopulationColumns = [
    'grade',
    'startYearAtUniversity',
    'programmes',
    'attainmentDate',
    'enrollmentDate',
    'language',
  ]

  const columnsByVariant: Record<Variant, Set<string>> = {
    population: new Set([...baseColumns, ...populationColumns]),
    studyGuidanceGroupPopulation: new Set([
      ...baseColumns,
      ...studyGuidanceGroupColumns,
      ...(group?.tags?.studyProgramme ? studyGuidanceGroupWithProgrammeColumns : []),
      ...(group?.tags?.studyProgramme && group?.tags?.year ? studyGuidanceGroupYearColumns : []),
    ]),
    customPopulation: new Set([
      ...baseColumns,
      ...customPopulationColumns,
      ...(customPopulationProgramme ? customPopulationWithProgrammeColumns : customPopulationWithNoProgrammeColumns),
    ]),
    coursePopulation: new Set([...baseColumns, ...coursePopulationColumns]),
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
