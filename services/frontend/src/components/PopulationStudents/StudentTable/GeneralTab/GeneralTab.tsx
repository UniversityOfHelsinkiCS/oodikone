import {
  type MRT_VisibilityState,
  MaterialReactTable,
  createMRTColumnHelper,
  useMaterialReactTable,
} from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { type FormattedStudentData } from '.'
import { useColumnDefinitions } from './ColumnDefinitions'

type Variant = 'population' | 'studyGuidanceGroupPopulation' | 'customPopulation' | 'coursePopulation'
export type DynamicColumnTitles = {
  creditsSince: string
  creditsCombinedProg: string
  option: string
  programmes: string
  primaryEndDate: string
  secondaryEndDate: string
}

export const GeneralTab = ({
  formattedData,
  variant,
  isCombinedProg,
  showAdminColumns,
  dynamicTitles,
  group,
  customPopulationProgramme,
  admissionTypeVisible,
  studyTrackVisible,
}: {
  formattedData: FormattedStudentData[]
  variant: Variant
  isCombinedProg: boolean
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
    semesterEnrollmentExport: false,
    programmeExport: false,
  })

  useEffect(() => {
    setColumnVisibility({
      lastName: namesVisible,
      firstNames: namesVisible,
      email: namesVisible,
      phoneNumber: namesVisible,
      studyTrack: studyTrackVisible,
      admissionType: admissionTypeVisible,
      semesterEnrollmentExport: false,
      programmesExport: false,
    })
  }, [namesVisible, studyTrackVisible, admissionTypeVisible])

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
    ...(isCombinedProg ? ['graduationDateCombinedProg', 'creditsCombinedProg'] : []),
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
    ...(isCombinedProg ? ['graduationDateCombinedProg', 'creditsCombinedProg'] : []),
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
    ...(isCombinedProg ? ['graduationDateCombinedProg', 'creditsCombinedProg'] : []),
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

  const visibleColumns = columnDefinitions.filter(col => {
    const isIncluded = columnsByVariant[variant].has(col.accessorKey ?? '')
    if (!showAdminColumns && adminColumns.includes(col.accessorKey ?? '')) return false
    return isIncluded
  })

  const columnHelper = createMRTColumnHelper<FormattedStudentData>()
  const exportExclusiveColumns = useMemo(
    () => [
      columnHelper.accessor('semesterEnrollments.exportValue', {
        id: 'semesterEnrollmentExport',
        header: 'Semester enrollment amount',
        visibleInShowHideMenu: false,
      }),
      columnHelper.accessor('programmes.exportValue', {
        id: 'programmesExport',
        header: `${dynamicTitles.programmes}`,
        visibleInShowHideMenu: false,
      }),
    ],
    []
  )

  const columns = useMemo(
    () => [...visibleColumns, ...exportExclusiveColumns],
    [
      exportExclusiveColumns,
      visibleColumns,
      variant,
      columnDefinitions,
      showAdminColumns,
      adminColumns,
      columnsByVariant,
    ]
  )

  const defaultOptions = getDefaultMRTOptions<FormattedStudentData>(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: formattedData ?? [],
    state: {
      columnVisibility,
      columnPinning: { left: ['studentNumber'] },
    },
    enableColumnFilters: false,
    onColumnVisibilityChange: setColumnVisibility,
  })

  const keysToIgnoreInExport = ['semesterEnrollments', 'programmes']
  const exportCols = columns.filter(column => !keysToIgnoreInExport.includes(column.accessorKey ?? ''))

  return (
    <>
      <ExportToExcelDialog<FormattedStudentData>
        exportColumns={exportCols}
        exportData={exportData}
        featureName="general_student_information"
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <MaterialReactTable table={table} />
    </>
  )
}
