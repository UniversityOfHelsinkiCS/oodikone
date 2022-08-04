import React from 'react'
import { Table } from 'semantic-ui-react'
import CollapsedStackedBar from './CollapsedStackedBar'
import ToggleTableView from './ToggleTableView'

const InteractiveDataTable = ({ cypress, dataStats, dataProgrammeStats, titles, wideTable }) => {
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
              key={`toggle-${yearArray[0]}-${Math.random()}`}
              yearArray={yearArray}
              show={`Show stats ${yearArray[0]}`}
              hide="Hide"
              ref={yearRef}
            >
              <Table.Cell key={`stack-cell${Math.random()}`} colSpan={100}>
                <CollapsedStackedBar
                  data={Object.keys(dataProgrammeStats)?.map(programme =>
                    dataProgrammeStats[programme][yearIndex].slice(2)
                  )}
                  labels={Object.keys(dataProgrammeStats)?.map(programme => programme)}
                  names={titles.slice(2)}
                  key={`stack-${Math.random()}`}
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
