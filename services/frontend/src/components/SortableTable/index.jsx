import _ from 'lodash'
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Icon } from 'semantic-ui-react'

import { computeColumnSpans, DataItem, getKey } from './columnContent'
import {
  calculateGroupDepth,
  ColumnFilters,
  createHeaders,
  extractColumnKeys,
  getInitialState,
  injectParentPointers,
  insertGroupColumns,
  tableStateReducer,
} from './columnHeader'
import { cloneColumns, group, row, SortableTableContext } from './common'
import { ExportModal } from './ExportModal'
import { FigureContainer } from './FigureContainer'
import { SortingFilteringVisitor } from './visitors/SortingFilteringVisitor'
import { ValueVisitor } from './visitors/ValueVisitor'
import './style.css'

/*
*** SortableTable documentation ***
Please update this when making changes inside SortableTable,
if they affect how the table and its columns are used.
Future uusihenkilö's will thank you.

--- SortableTable usage ---

tableId: id-property of the <table> tag
title: Table title
featureName: Describes the feature in the Excel filename: "oodikone_{featureName}_{timeStamp}.xlsx". Defaults to "export"
*data: Array of data items
*columns: Array of columns, see fields of columns below
onlyExportColumns: Array of columns, never shown but always added to export as the first columns
singleLine: default true, set to false to allow line wrapping (may make lines different size)
stretch: sets table's css width to 100%
actions: JSX to add in the top right corner of the table, for example buttons
hideHeaderBar: Hides the header bar that has a table icon, title, fullscreen button and menu/buttons
style: css style object of the whole table
striped: The style where every other row is grey. Boolean, default is true.
firstColumnSticky: Boolean, default is false. If true, the first column is sticky
defaultSort: [columnkey, order] of default sort column and order. For example ['name', 'desc']
toggleGroupExpansion: Function which is called when group of rows is collapsed or expanded
expandedGroups: Array (or set?) of keys of rows are supposed to be expanded. These two are used
    only in population of courses
maxHeight: Overwrite the maximum height. Defaults to 80vh if not set.
useFilteredDataOnExport: If true, uses filtered data (the data that's shown after applying all the selected filters) on exports. Defaults to true.
handleRowCountChange: A function that is called with the row count when it changes. Can be used to update the state in the parent component.
pageNumber: The current page number, used for pagination (should be used through the component PaginatedSortableTable).
rowsPerPage: The number of rows per page, used for pagination (should be used through the component PaginatedSortableTable).

--- Column usage: (* = required field) ---

- Fields that concern whole column or header

*key: Column key, unique
*title: Column header title (<th>). Can be either string or JSX. For string title, newlines are replaced by space for export.
textTitle: Required for excel, if title is JSX. Set to null to exclude a parent header from export
headerProps: These are given to header as: <th {...headerProps}>
sortable: set to false if you want to disable column sorting. If multiple columns merged, set it to all
filterable: same as sortable but for filter
forceToolsMode: Forces the filter and sort tools in header to either 'dangling', 'floating' or 'fixed'
helpText: If defined, shows question mark in header, which displays the helpText on hover
thickBorders: if true, adds thicker border to right side of column
export: set to false to omit this AND children from excel export. Notice: To only hide parent header, use textTitle: null
children: column objects. If this is defined, the column object is only a header, and you should only
          use cell value getters (getRowVal etc) in columns where children is undefined
displayColumn: set to false to hide whole column. Does not affect exporting
vertical: If true, header is vertical
noHeader: Just removes header, I think (not sure of the point of this, since you can just omit title)

- Fields that set cell content or properties. Can receive either a value, or a function that takes data
  item as an argument, and returns value for specific row (for example student => student.studentNumber)

cellProps: given to each cell like <td {...cellProps}>. Use for style, hover title, etc.
cellStyle: Basically shorthand for cellProps: { style: ... }
filterType: options are 'date', 'range' and 'multi' (or default if left empty). Check the filters folder
  for examples and documentation (at least multiSelectFilter.jsx has a good description how it works)
getRowVal: Get single cell value. This will be used for sorting and filtering, and displayed unless overridden.
getRowContent: Single cell JSX: Overrides getRowVal for value to display, but does not affect excel
getRowExport: Overrides getRowVal for excel
formatValue: Same as getRowContent, but avoids recalculating value already calculated in getRowVal.

--- Miscellaneous information ---

* Single rows can ignore filters or sorting by row options. To do this, import row-function
  from SortableTable-folder, and create data row with it (instead of just value as normally).
  For example, data can be set like this to have a totals-row on the top:
    [row(totals, { ignoreFilters: true, ignoreSorting: true }), ...students]
*/

export const SortableTable = ({
  actions,
  columns: pColumns,
  data,
  defaultSort,
  expandedGroups,
  featureName = 'export',
  firstColumnSticky = false,
  handleRowCountChange,
  hideHeaderBar,
  maxHeight = '80vh',
  onlyExportColumns = [],
  pageNumber,
  rowsPerPage,
  singleLine = true,
  stretch,
  striped = true,
  style,
  tableId,
  title,
  toggleGroupExpansion,
  useFilteredDataOnExport = true,
}) => {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [state, dispatch] = useReducer(
    tableStateReducer(defaultSort),
    null,
    getInitialState(defaultSort, expandedGroups)
  )
  const groupDepth = useMemo(() => calculateGroupDepth(data), [data])

  const toggleGroup = useCallback(
    groupKey => {
      dispatch({
        type: 'TOGGLE_GROUP',
        payload: { group: groupKey },
      })
      if (toggleGroupExpansion) {
        toggleGroupExpansion(groupKey)
      }
    },
    [dispatch]
  )

  const [columns, columnsByKey] = useMemo(() => {
    const columns = cloneColumns(pColumns)

    injectParentPointers(columns)
    insertGroupColumns(columns, groupDepth, toggleGroup, state.expandedGroups)

    const byKey = extractColumnKeys(columns)

    return [columns, byKey]
  }, [pColumns, groupDepth, toggleGroup, state.expandedGroups])

  const [columnSpans, columnDepth] = useMemo(() => computeColumnSpans(columns), [columns])

  const values = useMemo(
    () =>
      _.mapValues(ValueVisitor.visit(data, Object.values(columnsByKey), { honourIgnoreFilters: true }).values, set => [
        ...set,
      ]),
    [data, columnsByKey]
  )

  const headers = useMemo(() => createHeaders(columns, columnDepth, dispatch), [columns, columnDepth])

  const sortedData = useMemo(
    () => SortingFilteringVisitor.mutate(data, columnsByKey, state, ColumnFilters),
    [data, columnsByKey, state]
  )

  useEffect(() => {
    if (handleRowCountChange) handleRowCountChange(sortedData.length)
  }, [sortedData.length])

  const tableStyles = {
    position: 'relative',
  }

  if (stretch) {
    tableStyles.width = '100%'
  }

  const figureStyles = { ...style }

  if (!hideHeaderBar) {
    Object.assign(tableStyles, {
      borderRadius: 0,
      borderLeft: 'none',
      borderTop: 'none',
      background: 'white',
    })
  }

  const classNames = ['ui', 'table', 'collapsing', 'celled', 'ok-sortable-table']

  if (striped) {
    classNames.push('striped')
  }

  if (singleLine) {
    classNames.push('single', 'line')
  }

  if (!hideHeaderBar) {
    classNames.push('basic')
  }

  if (firstColumnSticky) {
    classNames.push('first-column-sticky')
  }

  const content = () => {
    const indexOfFirstColumn = (pageNumber - 1) * rowsPerPage
    const dataBeingDisplayed =
      rowsPerPage && pageNumber ? sortedData.slice(indexOfFirstColumn, indexOfFirstColumn + rowsPerPage) : sortedData
    return (
      <table className={classNames.join(' ')} id={tableId} style={tableStyles}>
        <thead>{headers}</thead>
        <tbody>
          {dataBeingDisplayed.map(item => (
            <DataItem item={item} key={`dataItem-${getKey(item)}`} />
          ))}
        </tbody>
      </table>
    )
  }

  const context = {
    state,
    dispatch,
    values,
    columns,
    columnsByKey,
    columnSpans,
    columnDepth,
  }

  if (hideHeaderBar) {
    return <SortableTableContext.Provider value={context}>{content()}</SortableTableContext.Provider>
  }

  return (
    <>
      <ExportModal
        columns={[...onlyExportColumns, ...columns]}
        data={useFilteredDataOnExport ? sortedData : data}
        featureName={featureName}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <SortableTableContext.Provider value={context}>
        <FigureContainer style={figureStyles}>
          <FigureContainer.Header actions={actions} onClickExport={() => setExportModalOpen(true)}>
            <Icon name="table" style={{ color: '#c2c2c2', marginRight: '0.5em', position: 'relative', top: '1px' }} />{' '}
            {title}
          </FigureContainer.Header>
          <FigureContainer.Content style={{ backgroundColor: '#e8e8e91c', maxHeight, overflow: 'auto', padding: 0 }}>
            {content()}
          </FigureContainer.Content>
        </FigureContainer>
      </SortableTableContext.Provider>
    </>
  )
}

export { group, row }
