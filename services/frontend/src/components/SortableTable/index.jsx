import { mapValues } from 'lodash'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { Button, Card, Icon, Popup } from 'semantic-ui-react'

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
import { cloneColumns, group, SortableTableContext } from './common'
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
  columns: pColumns,
  data,
  defaultSort,
  expandedGroups,
  featureName = 'export',
  title,
  toggleGroupExpansion,
}) => {
  const [isFullscreen, setFullscreen] = useState(false)
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

  const classNames = ['ui', 'table', 'basic', 'collapsing', 'celled', 'ok-sortable-table', 'single', 'line', 'striped']

  const context = {
    state,
    dispatch,
    values,
    columns,
    columnsByKey,
    columnSpans,
    columnDepth,
  }

  return (
    <>
      <ExportModal
        columns={columns}
        data={sortedData}
        featureName={featureName}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <FigureContainer isFullscreen={isFullscreen}>
        <Card fluid style={{ height: '100%' }}>
          <Card.Content
            style={{ alignItems: 'center', display: 'flex', flexGrow: 0, height: '3.25em', padding: '1em' }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              <Icon name="table" style={{ color: '#c2c2c2', marginRight: '0.5em' }} />
              {title}
            </div>
            <div style={{ flexGrow: 1 }} />
            <Button
              onClick={() => setExportModalOpen(true)}
              size="tiny"
              style={{ marginRight: '1em', padding: '0.75em 1em' }}
            >
              <Icon name="save" />
              Export to Excel
            </Button>
            <Popup
              on="hover"
              position="left center"
              trigger={
                <Icon
                  name={isFullscreen ? 'compress' : 'expand'}
                  onClick={() => setFullscreen(!isFullscreen)}
                  style={{ cursor: 'pointer', height: 'auto' }}
                />
              }
            >
              Toggle fullscreen
            </Popup>
          </Card.Content>
          <Card.Content
            style={{
              backgroundColor: '#e8e8e91c',
              padding: 0,
              overflow: 'auto',
              height: '100%',
            }}
          >
            <SortableTableContext.Provider value={context}>
              <table
                className={classNames.join(' ')}
                style={{
                  position: 'relative',
                  borderRadius: 0,
                  borderLeft: 'none',
                  borderTop: 'none',
                  background: 'white',
                }}
              >
                <thead>{headers}</thead>
                <tbody>
                  {sortedData.map(item => (
                    <DataItem item={item} key={`dataItem-${getKey(item)}`} />
                  ))}
                </tbody>
              </table>
            </SortableTableContext.Provider>
          </Card.Content>
        </Card>
      </FigureContainer>
    </>
  )
}

export { group }
