import React from 'react'
import { Table } from 'semantic-ui-react'
import CollapsedStackedBar from './CollapsedStackedBar'
import ToggleTableView from './ToggleTableView'

const InteractiveDataTable = ({
  cypress,
  dataStats,
  dataProgrammeStats,
  programmeNames,
  titles,
  wideTable,
  language,
}) => {
  if (!dataStats || !titles || !dataProgrammeStats) return null

  const yearRef = React.createRef()
  return (
    <div className={`table-container${wideTable ? '-wide' : ''}`}>
      <Table data-cy={`Table-${cypress}`} celled>
        <Table.Header>
          <Table.Row key={`randow-header-row-${Math.random()}`}>
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {dataStats?.map((yearArray, yearIndex) => (
            <ToggleTableView
              yearArray={yearArray}
              cypress={cypress}
              yearIndex={yearIndex}
              ref={yearRef}
              key={`togglable-${Math.random()}`}
            >
              <Table.Cell data-cy={`Cell-${cypress}-${yearIndex}`} key={`stack-cell${Math.random()}`} colSpan={100}>
                <CollapsedStackedBar
                  data={Object.keys(dataProgrammeStats)?.map(programme =>
                    dataProgrammeStats[programme][yearIndex]?.slice(2)
                  )}
                  labels={Object.keys(dataProgrammeStats)?.map(programme => programme)}
                  longLabels={programmeNames}
                  language={language}
                  names={titles?.slice(2)}
                />
              </Table.Cell>
            </ToggleTableView>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default InteractiveDataTable
