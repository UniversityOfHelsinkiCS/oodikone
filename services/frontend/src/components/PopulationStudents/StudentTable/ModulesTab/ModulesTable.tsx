import CheckIcon from '@mui/icons-material/Check'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { ColumnDef, createColumnHelper, TableOptions } from '@tanstack/react-table'
import { useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import type { FormattedModules, FormattedStudent } from '@/components/PopulationStudents/StudentTable/ModulesTab'

const getModuleIfExists = (student: FormattedStudent, moduleCode: string) =>
  student.studyModulesInHOPS.find(studyModule => studyModule.code === moduleCode) ?? null

const DividedTableCell = ({ top, bottom }: { top?: string | number; bottom?: string | number }) => (
  <Box sx={{ alignItems: 'end', display: 'flex', flexDirection: 'column' }}>
    {top !== undefined && (
      <Typography sx={{ color: 'text.primary', padding: '8px', fontSize: '0.875rem' }}>{top}</Typography>
    )}
    <Divider aria-hidden="true" flexItem sx={{ position: 'absolute', left: 0, right: 0, top: '50%' }} />
    {bottom !== undefined && (
      <Typography sx={{ color: 'text.primary', padding: '8px', fontSize: '0.875rem' }}>{bottom}</Typography>
    )}
  </Box>
)

export const ModulesTab = ({
  formattedModules,
  formattedStudents,
}: {
  formattedModules: FormattedModules
  formattedStudents: FormattedStudent[]
}) => {
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const ooditableColumnHelper = createColumnHelper<FormattedStudent>()

  const ooditableStaticColumns = useMemo(
    () => [
      ooditableColumnHelper.accessor('lastName', { header: 'Last name' }),
      ooditableColumnHelper.accessor('firstNames', { header: 'First names' }),
      ooditableColumnHelper.accessor('studentNumber', {
        header: _ => <Typography fontWeight="bold">Student number</Typography>,
        cell: cell => <StudentInfoItem sisPersonId={cell.row.original.sisPersonID} studentNumber={cell.getValue()} />,
        footer: () => <DividedTableCell bottom="Completed" top="Planned" />,
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId)
          if (!filterValue) return true

          return value.toLowerCase().startsWith(filterValue.toLowerCase())
        },
      }),
    ],
    []
  )

  const ooditableDynamicColumns = useMemo(() => {
    if (!formattedModules) return []
    return Object.keys(formattedModules).flatMap(code => [
      ooditableColumnHelper.accessor(code as 'studyModulesInHOPS.code', {
        header: _ => (
          <Tooltip title={`${code} – ${getTextIn(formattedModules[code])}`}>
            <Box>
              <Typography fontWeight="bold">{code}</Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontWeight: 'normal',
                }}
              >
                {getTextIn(formattedModules[code])}
              </Typography>
            </Box>
          </Tooltip>
        ),
        cell: cell => {
          const studyModule = getModuleIfExists(cell.row.original, code)
          if (!studyModule) return null
          return studyModule.completed ? (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', m: 'auto' }}
              title={`Completed on ${studyModule.completionDate}`}
            >
              <CheckIcon color="success" />
            </Box>
          ) : (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', m: 'auto' }}
              title="Has the module in their primary study plan"
            >
              <CropSquareIcon sx={{ color: 'grey.500' }} />
            </Box>
          )
        },
        footer: ({ table }) => {
          const { planned, completed } = table.getFilteredRowModel().rows.reduce(
            (acc, row) => {
              const studyModule = getModuleIfExists(row.original, code)
              if (studyModule) {
                // 1 for completed, 0 for in HOPS
                if (studyModule.completed) {
                  acc.completed++
                } else {
                  acc.planned++
                }
              }
              return acc
            },
            { planned: 0, completed: 0 }
          )

          return <DividedTableCell bottom={completed} top={planned} />
        },
        sortingFn: (rowA, rowB, _) => {
          /*
           * Sorting order:
           *  1 - module completed
           *  0 - module in HOPS
           * -1 - module not found
           */
          const a = getModuleIfExists(rowA.original, code)
          const b = getModuleIfExists(rowB.original, code)

          const valueA = a ? Number(a.completed) : -1
          const valueB = b ? Number(b.completed) : -1

          return valueA - valueB
        },
      }),
    ])
  }, [formattedModules, getTextIn])

  const ooditableColumns: ColumnDef<FormattedStudent, any>[] = useMemo(
    () => [...ooditableStaticColumns, ...ooditableDynamicColumns],
    [ooditableStaticColumns, ooditableDynamicColumns]
  )

  const accessorKeys: string[] = useMemo(() => {
    const squashGroups = column => {
      if (column.columns) return column.columns.flatMap(squashGroups)
      return [column.accessorKey]
    }

    return ooditableColumns.flatMap(squashGroups)
  }, [])

  const columnVisibility = useMemo(
    () =>
      Object.fromEntries(
        accessorKeys.map(key => [key, ['firstNames', 'lastName'].includes(key) ? namesVisible : true])
      ),
    [accessorKeys, namesVisible]
  )

  const exportColumns = useMemo(() => Object.fromEntries(accessorKeys.map(key => [key, true])), [accessorKeys])

  const ooditableOptions: Partial<TableOptions<FormattedStudent>> = {
    initialState: {
      columnPinning: { left: ['studentNumber'] },
    },
    state: {
      useVerticalHeaders: Object.keys(formattedModules),
      columnVisibility,
    },
    defaultColumn: {
      enableResizing: false,
    },
  }

  return (
    <>
      <OodiTableExcelExport exportColumns={exportColumns} exportData={formattedStudents ?? []} />
      <OodiTable columns={ooditableColumns} data={formattedStudents ?? []} options={ooditableOptions} />
    </>
  )
}
