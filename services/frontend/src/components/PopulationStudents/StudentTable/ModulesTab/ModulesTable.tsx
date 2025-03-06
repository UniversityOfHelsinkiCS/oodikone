import { CropSquare as CropSquareIcon } from '@mui/icons-material'
import { Box } from '@mui/material'
import { grey } from '@mui/material/colors'
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

const hasModuleInHOPS = (student: FormattedStudent, moduleCode: string) =>
  student.modulesInHOPS?.includes(moduleCode) ?? false

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
      accessorFn: (row: FormattedStudent) => (hasModuleInHOPS(row, code) ? 'X' : null),
      header: `${code} – ${getTextIn(formattedModules[code])}`,
      Header: () => (
        <>
          <Box>{code}</Box>
          <Box sx={{ color: 'text.secondary', fontWeight: 'normal' }}>{getTextIn(formattedModules[code])}</Box>
        </>
      ),
      Cell: ({ cell }) => (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center' }} title="Has the module in their primary study plan">
            {hasModuleInHOPS(cell.row.original, code) && <CropSquareIcon sx={{ color: grey[500] }} />}
          </Box>
        </>
      ),
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
    onColumnVisibilityChange: setColumnVisibility,
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
