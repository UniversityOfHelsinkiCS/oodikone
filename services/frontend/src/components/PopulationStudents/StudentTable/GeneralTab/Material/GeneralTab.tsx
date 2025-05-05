import { Typography } from '@mui/material'
import {
  type MRT_ColumnDef,
  type MRT_VisibilityState,
  // type MRT_TableInstance,
  // type MRT_RowData,
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { type FormattedStudentData } from '.'

export const GeneralTab = ({ formattedData }: { formattedData: FormattedStudentData[] }) => {
  const { language } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>({
    lastName: namesVisible,
    firstNames: namesVisible,
  })

  useEffect(() => {
    setColumnVisibility({
      lastName: namesVisible,
      firstNames: namesVisible,
    })
  }, [namesVisible])

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'lastName',
        header: 'Last name',
      },
      {
        accessorKey: 'firstNames',
        header: 'First names',
      },
      {
        accessorKey: 'studentNumber',
        header: 'Student number',
        Header: () => <Typography fontWeight="bold">Student number</Typography>,
        Cell: ({ cell }) => (
          <StudentInfoItem sisPersonId={cell.row.original.sis_person_id} studentNumber={cell.getValue<string>()} />
        ),
        filterFn: 'startsWith',
      },
      {
        accessorKey: 'totalCredits',
        header: 'All',
      },
      {
        accessorKey: 'hopsCredits',
        header: 'HOPS',
      },
      {
        accessorKey: 'creditsSinceStart',
        header: 'Since start in programme',
      },
      {
        accessorKey: 'studyRightStart',
        header: 'Start of study right',
      },
      {
        accessorKey: 'programmeStart',
        header: 'Started in programme',
      },
      {
        accessorKey: 'master',
        header: 'Master',
      },
      {
        accessorKey: 'semestersPresent',
        header: 'Semesters present',
      },
      {
        accessorKey: 'graduationDate',
        header: 'Graduation date',
      },
      {
        accessorKey: 'startYearAtUniversity',
        header: 'Start year at uni',
      },
      {
        accessorKey: 'otherProgrammes',
        header: 'Other programmes',
      },
      {
        accessorKey: 'transferredFrom',
        header: 'Transferred from',
      },
      {
        accessorKey: 'admissionType',
        header: 'Admission type',
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
      },
      {
        accessorKey: 'citizenships',
        header: 'Citizenships',
      },
      {
        accessorKey: 'curriculumPeriod',
        header: 'Curriculum period',
      },
      {
        accessorKey: 'mostRecentAttainment',
        header: 'Latest attainment date',
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
      },
    ],
    []
  )

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
