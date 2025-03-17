import { Check as CheckIcon, CropSquare as CropSquareIcon } from '@mui/icons-material'
import { Box, Tooltip, Typography } from '@mui/material'
import {
  type MRT_ColumnDef,
  type MRT_VisibilityState,
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'

import type { FormattedModules, FormattedStudent } from '.'

const getModuleIfExists = (student: FormattedStudent, moduleCode: string) =>
  student.studyModulesInHOPS.find(studyModule => studyModule.code === moduleCode) ?? null

export const ModulesTab = ({
  formattedModules,
  formattedStudents,
}: {
  formattedModules: FormattedModules
  formattedStudents: FormattedStudent[]
}) => {
  const { getTextIn, language } = useLanguage()
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

  const isLoading = Object.keys(formattedModules).length === 0

  const staticColumns = useMemo<MRT_ColumnDef<any>[]>(
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
    ],
    []
  )

  const dynamicColumns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (!formattedModules) return []
    return Object.keys(formattedModules).map(code => ({
      accessorFn: (row: FormattedStudent) => {
        const studyModule = getModuleIfExists(row, code)
        return studyModule ? (studyModule.completed ? '1' : '0') : null
      },
      header: `${code} – ${getTextIn(formattedModules[code])}`,
      Header: () => (
        <Tooltip title={`${code} – ${getTextIn(formattedModules[code])}`}>
          <Box
            sx={{
              display: 'inline flow-root',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              whiteSpace: 'normal',
              overflow: 'visible',
              maxWidth: '15em',
              minHeight: '160px',
              maxHeight: '240px',
              padding: '0.4em 0',
            }}
          >
            <>
              <Typography fontWeight="bold">{code}</Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontWeight: 'normal',
                }}
              >
                {getTextIn(formattedModules[code])}
              </Typography>
            </>
          </Box>
        </Tooltip>
      ),
      Cell: ({ cell }) => {
        const studyModule = getModuleIfExists(cell.row.original, code)
        if (!studyModule) return <Box />
        return studyModule.completed ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }} title={`Completed on ${studyModule.completionDate}`}>
            <CheckIcon color="success" />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }} title="Has the module in their primary study plan">
            <CropSquareIcon sx={{ color: 'grey.500' }} />
          </Box>
        )
      },
      filterFn: 'empty',
    }))
  }, [formattedModules, getTextIn])

  const columns = useMemo(() => [...staticColumns, ...dynamicColumns], [staticColumns, dynamicColumns])

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: formattedStudents ?? [],
    state: {
      columnVisibility,
      isLoading,
      columnPinning: { left: ['studentNumber'] },
    },
    enableColumnActions: false,
    enableColumnFilters: false,
    defaultColumn: { size: 0 },

    onColumnVisibilityChange: setColumnVisibility,
    muiTableHeadCellProps: {
      sx: {
        overflow: 'visible',
        verticalAlign: 'top',
        borderWidth: '1px 1px 1px 0',
        borderStyle: 'solid',
        borderColor: 'grey.300',
        '& .MuiBadge-root': {
          display: 'none',
        },
        '& .Mui-TableHeadCell-Content': {
          flexDirection: 'column',
        },
        '& .Mui-TableHeadCell-Content-Wrapper': {
          display: 'inline-grid', // This will fix writing-mode: vertical-rl text collapsing issue on firefox
        },
      },
    },
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
        featureName="modules_of_students"
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <MaterialReactTable table={table} />
    </>
  )
}
