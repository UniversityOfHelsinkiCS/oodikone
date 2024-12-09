import {
  Alert,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from '@mui/material'
import { pick, sampleSize } from 'lodash'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useCallback, useMemo } from 'react'
import { utils, writeFile } from 'xlsx'

import { ISO_DATE_FORMAT } from '@/constants/date'
import { getTimestamp, reformatDate } from '@/util/timeAndDate'

export const ExportToExcelDialog = ({
  open,
  onClose,
  exportColumns,
  exportData,
  featureName,
}: {
  open: boolean
  onClose: () => void
  exportColumns: MRT_ColumnDef<any>[]
  exportData: Record<string, unknown>[]
  featureName: string
}) => {
  const columns = useMemo<
    MRT_ColumnDef<{
      header: string
      sample: React.ReactNode[]
    }>[]
  >(
    () => [
      {
        accessorKey: 'header',
        header: 'Column',
      },
      {
        accessorKey: 'sample',
        header: 'Sample values',
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>{cell.getValue<React.ReactNode>()}</Box>
        ),
      },
    ],
    []
  )
  const sampleFromExportData = useMemo(() => sampleSize(exportData, 10), [exportData])

  const getSampleDataForColumn = useCallback(
    (column: string) => {
      const sample: React.ReactNode[] = []
      for (let i = 0; i < sampleFromExportData.length; i++) {
        const row = sampleFromExportData[i]
        const value = row[column]

        if (
          typeof value !== 'string' &&
          typeof value !== 'number' &&
          typeof value !== 'boolean' &&
          !(value instanceof Date)
        ) {
          continue
        }

        let displayValue: string | number

        if (value instanceof Date) {
          displayValue = reformatDate(value, ISO_DATE_FORMAT)
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'TRUE' : 'FALSE'
        } else {
          displayValue = value
        }

        sample.push(
          <Box
            component="span"
            key={i}
            sx={theme => ({
              backgroundColor: theme.palette.grey[50],
              border: `1px solid ${theme.palette.grey[300]}`,
              borderRadius: 1,
              color: theme.palette.text.secondary,
              paddingX: 0.5,
            })}
          >
            {displayValue}
          </Box>
        )
      }
      return sample
    },
    [sampleFromExportData]
  )

  const data = useMemo(
    () =>
      exportColumns.map(column => ({
        header: column.header,
        sample: getSampleDataForColumn(column.header),
      })),
    [exportColumns, getSampleDataForColumn]
  )

  const table = useMaterialReactTable({
    columns,
    data,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enablePagination: false,
    enableRowSelection: true,
    enableSorting: false,
    enableTopToolbar: false,
    getRowId: row => row.header,
    initialState: {
      density: 'compact',
    },
  })

  const selectedColumns = Object.keys(table.getState().rowSelection)

  const handleExport = () => {
    const worksheet = utils.json_to_sheet(exportData.map(row => pick(row, selectedColumns)))
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet)
    writeFile(workbook, `oodikone_${featureName}_${getTimestamp()}.xlsx`)
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Export to Excel</DialogTitle>
      <DialogContent>
        <DialogContentText component="div" sx={{ marginBottom: 2 }}>
          Exporting {exportData.length} rows into an Excel (.xlsx) file. Choose which columns you want to include in the
          generated file from the list below.
          {selectedColumns.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Please select at least one column to export. You can select all columns by clicking the checkbox in the
                table header.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You have selected {selectedColumns.length} column{selectedColumns.length === 1 ? '' : 's'}.
              </Typography>
            </Alert>
          )}
        </DialogContentText>
        <MaterialReactTable table={table} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={selectedColumns.length === 0}
          onClick={handleExport}
          sx={{ backgroundColor: theme => theme.palette.export }}
          variant="contained"
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  )
}
