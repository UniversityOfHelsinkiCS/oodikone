import { type MRT_VisibilityState, MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { useEffect, useMemo, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { type FormattedStudentData } from '.'
import { adminColumns, columnsByVariant, useColumnDefinitions, type Variant } from './ColumnDefinitions'

export const GeneralTab = ({
  formattedData,
  variant,
  showAdminColumns,
  creditFilterText,
}: {
  formattedData: FormattedStudentData[]
  variant: Variant
  showAdminColumns: boolean
  creditFilterText: string
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

  const columns = useMemo(() => {
    return columnDefinitions.filter(col => {
      const isIncluded = columnsByVariant[variant].has(col.accessorKey ?? '')
      if (!showAdminColumns && adminColumns.includes(col.accessorKey ?? '')) return false
      return isIncluded
    })
  }, [variant, columnDefinitions, showAdminColumns])

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
