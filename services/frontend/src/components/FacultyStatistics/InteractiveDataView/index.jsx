import React from 'react'
import { Table, Button } from 'semantic-ui-react'
import CollapsedStackedBar from './CollapsedStackedBar'

const InteractiveDataTable = ({ cypress, dataStats, dataProgrammeStats, titles, wideTable }) => {
  if (!dataStats || !titles || !dataProgrammeStats) return null

  const handleClick = () => {}

  return (
    <div className={`table-container${wideTable ? '-wide' : ''}`}>
      <Table data-cy={`Table-${cypress}`} celled>
        <Table.Header>
          <Table.Row>
            {titles?.map(title => (
              <Table.HeaderCell key={title}>{title}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {dataStats?.map((yearArray, yearIndex) => (
            <>
              <Table.Row key={`random-year-key-${Math.random()}`}>
                {yearArray?.map((value, index) => (
                  <>
                    {index === 0 ? (
                      <Table.Cell key={`random-yearcell-key-${Math.random()}`}>
                        <Button key={`button-random-key-${Math.random()}`} onClick={handleClick}>
                          {yearArray[0]}
                        </Button>
                      </Table.Cell>
                    ) : (
                      <Table.Cell key={`random-cell-key-${Math.random()}`}>{value}</Table.Cell>
                    )}
                  </>
                ))}
              </Table.Row>
              <Table.Row rowSpan={100} key={`random-stacked-bar-${Math.random()}`}>
                <Table.Cell colSpan={100}>
                  <CollapsedStackedBar
                    data={Object.keys(dataProgrammeStats)?.map(programme =>
                      dataProgrammeStats[programme][yearIndex].slice(2)
                    )}
                    labels={Object.keys(dataProgrammeStats)?.map(programme => programme)}
                    names={titles.slice(2)}
                  />
                </Table.Cell>
              </Table.Row>
            </>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default InteractiveDataTable
