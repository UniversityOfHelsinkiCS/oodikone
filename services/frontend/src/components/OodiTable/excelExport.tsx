import DownloadIcon from '@mui/icons-material/Download'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'

import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { RowSelectionState, TableOptions } from '@tanstack/react-table'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { utils, writeFile } from 'xlsx'

import { DateFormat } from '@/constants/date'
import { getTimestamp, reformatDate } from '@/util/timeAndDate'
import { OodiTable } from './index'

const getDisplayValue = (value: unknown) => {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'symbol':
    case 'bigint':
      return String(value)
    case 'boolean':
      return String(value).toUpperCase()
  }

  if (value instanceof Date) return reformatDate(value, DateFormat.ISO_DATE)
  return null
}

const churnSampleData = (value: unknown, key: number) => {
  const displayValue = getDisplayValue(value)
  if (displayValue === null) return null

  return (
    <Box
      component="span"
      key={key}
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

type ExportData = {
  header: string
  sample: React.ReactNode[]
}

const columnHelper = createColumnHelper<ExportData>()

export const OodiTableExcelExport = <TData extends object>({
  exportColumnKeys,
  data,
}: {
  exportColumnKeys: string[]
  data: TData[]
}) => {
  const extendedColumns = [
    columnHelper.display({
      id: 'select-col',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    }),
    columnHelper.accessor('header', {
      header: 'Column',
    }),
    columnHelper.accessor('sample', {
      header: 'Sample values',
      cell: cell => {
        const value = cell.getValue<React.ReactNode>()
        return (
          <Stack flexDirection="row" sx={{ gap: 1 }}>
            {value}
          </Stack>
        )
      },
    }),
  ]

  const exportData = useMemo(
    () =>
      data.map(dataItem =>
        Object.fromEntries(Object.entries(dataItem).map(([key, value]) => [key, value?.exportValue ?? value]))
      ),
    [data]
  )

  const prepData = exportData.slice(0, 10)

  const pivotedData = useMemo(
    () =>
      exportColumnKeys.map(accessorKey => ({
        header: accessorKey,
        sample: prepData
          .map(row => row[accessorKey])
          .filter(value => value !== undefined)
          .map(churnSampleData),
      })),
    [exportColumnKeys, exportData]
  )

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const tableOptions: Partial<TableOptions<ExportData>> = {
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    defaultColumn: {
      enableResizing: false,
    },
  }

  const [dialogOpen, setDialogOpen] = useState(false)

  const handleExport = () => {
    const selectedRows = Object.entries(rowSelection)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => Number(key))

    const selectedCols = pivotedData.filter((_, index) => selectedRows.includes(index)).map(({ header }) => header)

    const worksheet = utils.json_to_sheet(
      exportData.map(row => Object.fromEntries(Object.entries(row).filter(([key, _]) => selectedCols.includes(key))))
    )
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet)
    writeFile(workbook, `oodikone_${''}_${getTimestamp()}.xlsx`)
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 0 }} variant="outlined">
      <Button
        disabled={dialogOpen}
        onClick={() => setDialogOpen(true)}
        startIcon={<DownloadIcon />}
        sx={{
          backgroundColor: 'export',
        }}
        variant="contained"
      >
        Export to Excel
      </Button>
      <Dialog fullWidth maxWidth="md" onClose={() => setDialogOpen(false)} open={dialogOpen}>
        <DialogTitle>Export to Excel</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" sx={{ marginBottom: 2 }}>
            Exporting {exportData.length} rows into an Excel (.xlsx) file. Choose which columns you want to include in
            the generated file from the list below.
            {Object.keys(rowSelection).length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Please select at least one column to export. You can select all columns by clicking the checkbox in
                  the table header.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">You have selected {Object.keys(rowSelection).length} column(s).</Typography>
              </Alert>
            )}
          </DialogContentText>
          <OodiTable columns={extendedColumns} data={pivotedData} isExportView options={tableOptions} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} sx={{ backgroundColor: theme => theme.palette.export }} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
