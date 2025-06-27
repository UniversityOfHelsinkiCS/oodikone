import DownloadIcon from '@mui/icons-material/Download'
import Button from '@mui/material/Button'
import { MRT_RowData, MRT_TableOptions, MRT_Row } from 'material-react-table'
import { MRT_Localization_EN } from 'material-react-table/locales/en'
import { MRT_Localization_FI } from 'material-react-table/locales/fi'

import { DateFormat } from '@/constants/date'
import { DEFAULT_LANG } from '@oodikone/shared/language'

// If defining sx props in a column definition, existing props defined here would be
// completely overridden. Export and ...spread from here as needed to avoid copy pasting.
export const muiTableBodyCellPropsDefaultSx = {
  borderWidth: '0 1px 0 0',
  borderStyle: 'solid',
  borderColor: 'grey.300',
}

/**
 * Oodikone-wide default properties for MRT tables
 * !! Remember to provide the type of table data as a generic !!
 */
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
        format: DateFormat.ISO_DATE,
      },
      size: 100,
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
    muiFilterTextFieldProps: ({ column }) => {
      if (
        column.columnDef.filterVariant &&
        ['multi-select', 'select', 'text'].includes(column.columnDef.filterVariant)
      ) {
        return { placeholder: '' }
      }
      return {}
    },
    muiPaginationProps: {
      rowsPerPageOptions: [50, 100, 200, 300, 400, 500],
    },
    muiTableHeadCellProps: {
      sx: {
        verticalAlign: 'bottom',
        borderWidth: '1px 1px 1px 0',
        borderStyle: 'solid',
        borderColor: 'grey.300',
      },
    },
    muiTableHeadRowProps: {
      sx: {
        boxShadow: 'none',
      },
    },
    muiTableBodyCellProps: {
      sx: muiTableBodyCellPropsDefaultSx,
    },
    muiTableBodyProps: {
      sx: {
        '& tr:nth-of-type(odd) > td': {
          backgroundColor: 'grey.100',
        },
      },
    },
    muiTableFooterCellProps: {
      sx: {
        padding: 0,
        borderWidth: '1px 1px 1px 0',
        borderStyle: 'solid',
        borderColor: 'grey.300',
      },
    },
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        disabled={table.getPrePaginationRowModel().rows.length === 0}
        onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
        startIcon={<DownloadIcon />}
        sx={{
          backgroundColor: 'export',
        }}
        variant="contained"
      >
        Export to Excel
      </Button>
    ),
  }
}
