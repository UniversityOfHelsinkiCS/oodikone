import React from 'react'
import { jStat } from 'jStat'
import PropTypes from 'prop-types'
import { Table } from 'semantic-ui-react'
import { getStudentTotalCredits } from '../../../common'

const StatisticsTab = ({ translate, filteredStudents }) => {
  const credits = filteredStudents.map(student => getStudentTotalCredits(student))
  const formatNumber = (x, decimals) => (Number.isNaN(x) ? 0 : x).toFixed(decimals)
  const quartiles = jStat.quartiles(credits)

  return (
    <Table celled collapsing className="statistics-table">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
            {translate('creditGainStats.statsTableNameHeader', { n: credits.length })}
          </Table.HeaderCell>
          <Table.HeaderCell>{translate('creditGainStats.statsTableCreditsHeader')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>{translate('creditGainStats.statsTableAverage')}</Table.Cell>
          <Table.Cell>{formatNumber(jStat.mean(credits), 2)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>{translate('creditGainStats.statsTableStdDev')}</Table.Cell>
          <Table.Cell>{formatNumber(jStat.stdev(credits), 2)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Min</Table.Cell>
          <Table.Cell>{formatNumber(jStat.min(credits), 0)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Q<sub>1</sub> (25%)
          </Table.Cell>
          <Table.Cell>{formatNumber(quartiles[0], 0)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Q<sub>2</sub> (50%)
          </Table.Cell>
          <Table.Cell>{formatNumber(quartiles[1], 0)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Q<sub>3</sub> (75%)
          </Table.Cell>
          <Table.Cell>{formatNumber(quartiles[2], 0)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Max</Table.Cell>
          <Table.Cell>{formatNumber(jStat.max(credits), 0)}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}

StatisticsTab.propTypes = {
  translate: PropTypes.func.isRequired,
  filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default StatisticsTab
