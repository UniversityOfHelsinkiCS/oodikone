/* eslint-disable no-return-assign */

import React, { useState, useMemo, useReducer, useCallback } from 'react'
import { Icon } from 'semantic-ui-react'
import FigureContainer from 'components/FigureContainer'
import _ from 'lodash'
import ExportModal from './ExportModal'
import { row, group, SortableTableContext } from './common'
import SortingFilteringVisitor from './visitors/SortingFilteringVisitor'
import GroupKeyVisitor from './visitors/GroupKeyVisitor'
import ValueVisitor from './visitors/ValueVisitor'
import './style.css'
import {
  computeColumnSpans,
  insertGroupColumns,
  injectParentPointers,
  extractColumnKeys,
  calculateGroupDepth,
  createHeaders,
  tableStateReducer,
  getInitialState,
  DataItem,
  ColumnFilters,
  getKey,
} from './columnHeader'

/*
*** SortableTable documentation ***
Please update this when making changes inside SortableTable,
if they affect how the table and its columns are used.
Future uusihenkilö's will thank you.



--- SortableTable usage ---

tableId: id-property of the <table> tag
title: Table title
*data: Array of data items
*columns: Array of columns, see fields of columns below
onlyExportColumns: Array of columns, never shown but always added to export as the first columns
singleLine: default true, set to false to allow line wrapping (may make lines different size)
stretch: sets table's css width to 100%
actions: JSX to add in the top right corner of the table, for example buttons
contextMenuItems: Array of items added into the menu that has by default "Export Excel" and "Reset filters"
hideHeaderBar: Hides the header bar that has a table icon, title, fullscreen button and menu/buttons
style: css style object of the whole table
defaultSort: [columnkey, order] of default sort column and order. For example ['name', 'desc']
toggleGroupExpansion: Function which is called when group of rows is collapsed or expanded
expandedGroups: Array (or set?) of keys of rows are supposed to be expanded. These two are used
    only in population of courses


--- Column usage: (* = required field) ---

- Fields that concern whole column or header

*key: Column key, unique
*title: Column header title (<th>). Can be either string or JSX. For string title, newlines are replaced
        by space for export.
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

- Fields that set cell content or properties. Can receive either a value, or a function that takes data
  item as an argument, and returns value for specific row (for example s => s.studentNumber)

cellProps: given to each cell like <td {...cellProps}>. Use for style, hover title, etc.
cellStyle: Basically shorthand for cellProps: { style: ... }
filterType: set to 'date' or 'range' to make the filter work differently
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

const SortableTable = ({
  tableId,
  columns: pColumns,
  title,
  data,
  defaultSort,
  style,
  actions,
  stretch,
  contextMenuItems: pContextMenuItems,
  singleLine = true,
  hideHeaderBar,
  toggleGroupExpansion,
  expandedGroups,
  onlyExportColumns = [],
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

  const handleUnfoldAllGroups = useCallback(() => {
    const { groups } = GroupKeyVisitor.visit(data)

    dispatch({
      type: 'SET_UNFOLDED_GROUPS',
      payload: { groups },
    })
    if (toggleGroupExpansion) {
      toggleGroupExpansion('', false, groups)
    }
  }, [data])

  const handleFoldAllGroups = useCallback(() => {
    dispatch({
      type: 'SET_UNFOLDED_GROUPS',
      payload: { groups: [] },
    })
    if (toggleGroupExpansion) {
      toggleGroupExpansion('', true)
    }
  }, [data])

  const [columns, columnsByKey] = useMemo(() => {
    const columns = _.cloneDeep(pColumns)

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

  const classNames = ['ui', 'table', 'collapsing', 'striped', 'celled', 'ok-sortable-table']

  if (singleLine) {
    classNames.push('single', 'line')
  }

  if (!hideHeaderBar) {
    classNames.push('basic')
  }

  const content = (
    <table className={classNames.join(' ')} id={tableId} style={tableStyles}>
      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>{headers}</thead>
      <tbody>
        {sortedData.map(item => (
          <DataItem key={`dataItem-${getKey(item)}`} item={item} />
        ))}
      </tbody>
    </table>
  )

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
    return <SortableTableContext.Provider value={context}>{content}</SortableTableContext.Provider>
  }

  const contextMenuItems = [
    {
      label: 'Export to Excel',
      onClick: () => setExportModalOpen(true),
    },
    {
      label: 'Reset filters',
      onClick: () => dispatch({ type: 'RESET_FILTERS' }),
    },
    ...(groupDepth > 0
      ? [
          {
            label: 'Unfold all groups',
            onClick: handleUnfoldAllGroups,
          },
          {
            label: 'Fold all groups',
            onClick: handleFoldAllGroups,
          },
        ]
      : []),
    ...(pContextMenuItems ?? []),
  ]

  return (
    <>
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={data}
        columns={[...onlyExportColumns, ...columns]}
      />
      <SortableTableContext.Provider value={context}>
        <FigureContainer style={figureStyles}>
          <FigureContainer.Header actions={actions} contextItems={contextMenuItems}>
            <Icon style={{ color: '#c2c2c2', position: 'relative', top: '1px', marginRight: '0.5em' }} name="table" />{' '}
            {title}
          </FigureContainer.Header>
          <FigureContainer.Content
            style={{ padding: 0, overflow: 'auto', backgroundColor: '#e8e8e91c', maxHeight: '80vh' }}
          >
            {content}
          </FigureContainer.Content>
        </FigureContainer>
      </SortableTableContext.Provider>
    </>
  )
}

export { group, row }

export default SortableTable
