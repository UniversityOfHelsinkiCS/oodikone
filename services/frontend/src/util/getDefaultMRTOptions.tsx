import { Download as DownloadIcon } from '@mui/icons-material'
import { Button } from '@mui/material'
import { MRT_RowData, MRT_TableOptions, MRT_Row } from 'material-react-table'
import { MRT_Localization_EN } from 'material-react-table/locales/en'
import { MRT_Localization_FI } from 'material-react-table/locales/fi'

import { DEFAULT_LANG } from '@/shared/language'

export const getDefaultMRTOptions = <TData extends MRT_RowData>(
  setExportData: (data: Record<string, unknown>[]) => void,
  setExportModalOpen: (value: boolean) => void,
  language = DEFAULT_LANG
): Partial<MRT_TableOptions<TData>> => {
  const handleExportRows = (rows: MRT_Row<TData>[]) => {
    const exportedData = rows.map(row => {
      const rowData: Record<string, unknown> = {}

      for (const cell of row.getAllCells()) {
        const { header } = cell.column.columnDef
        const value = cell.getValue()
        rowData[header] = value
      }

      return rowData
    })
    setExportData(exportedData)
    setExportModalOpen(true)
  }

  return {
    defaultColumn: {
      muiFilterDatePickerProps: {
        format: 'YYYY-MM-DD',
      },
    },
    enableColumnOrdering: true,
    enableColumnDragging: false,
    enableFacetedValues: true,
    enableStickyHeader: true,
    initialState: {
      density: 'compact',
      pagination: {
        pageSize: 200,
        pageIndex: 0,
      },
      showColumnFilters: true,
    },
    localization: language === 'fi' ? MRT_Localization_FI : MRT_Localization_EN,
    muiPaginationProps: {
      rowsPerPageOptions: [50, 100, 200, 300, 400, 500],
    },
    muiTableHeadCellProps: {
      sx: theme => ({
        verticalAlign: 'bottom',
        borderWidth: '1px 1px 1px 0',
        borderStyle: 'solid',
        borderColor: theme.palette.grey[300],
      }),
    },
    muiTableHeadRowProps: {
      sx: {
        boxShadow: 'none',
      },
    },
    muiTableBodyCellProps: {
      sx: theme => ({
        borderRight: `1px solid ${theme.palette.grey[300]}`,
      }),
    },
    muiTableBodyProps: {
      sx: theme => ({
        '& tr:nth-of-type(odd) > td': {
          backgroundColor: theme.palette.grey[100],
        },
      }),
    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        disabled={table.getPrePaginationRowModel().rows.length === 0}
        onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
        startIcon={<DownloadIcon />}
        variant="contained"
      >
        Export to Excel
      </Button>
    ),
  }
}
