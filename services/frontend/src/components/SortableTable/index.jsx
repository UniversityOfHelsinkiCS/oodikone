import { mapValues } from 'lodash'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
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

// NOTE
/*
Documentation in README.md of this folder.
Please update it when making changes inside SortableTable,
if they affect how the table and its columns are used.
Future uusihenkilö's will thank you.
*/

export const SortableTable = ({
  actions,
  columns: pColumns,
  data,
  defaultSort,
  expandedGroups,
  featureName = 'export',
  firstColumnSticky = false,
  handleDisplayedDataChange,
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
      mapValues(ValueVisitor.visit(data, Object.values(columnsByKey), { honourIgnoreFilters: true }).values, set => [
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
    if (handleDisplayedDataChange) handleDisplayedDataChange(sortedData)
  }, [sortedData])

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
