import React from 'react'
import { Table } from 'semantic-ui-react'
import SortableHeaderCell from '../SortableHeaderCell'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const PassFailHeader = () => {
  const { onSortableColumnHeaderClick, filterInput, tableColumnNames, sortCriteria, reversed } =
    UsePopulationCourseContext()

  const getSortableHeaderCell = (label, columnName, rowSpan = 1) => (
    <SortableHeaderCell
      content={label}
      columnName={columnName}
      onClickFn={onSortableColumnHeaderClick}
      activeSortColumn={sortCriteria}
      reversed={reversed}
      rowSpan={rowSpan}
    />
  )

  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="4" content="Course" />
        {getSortableHeaderCell('Students', tableColumnNames.STUDENTS, 2)}
        <Table.HeaderCell colSpan="3" content="Passed" />
        <Table.HeaderCell colSpan="2" content="Failed" />
        <Table.HeaderCell colSpan="2" content="Attempts" />
        <Table.HeaderCell colSpan="2" content="percentage of population" />
      </Table.Row>
      <Table.Row>
        {filterInput('nameFilter', 'Name', '3')}
        {filterInput('codeFilter', 'Code')}
        {getSortableHeaderCell('n', tableColumnNames.PASSED)}
        {getSortableHeaderCell('after retry', tableColumnNames.RETRY_PASSED)}
        {getSortableHeaderCell('percentage', tableColumnNames.PERCENTAGE)}
        {getSortableHeaderCell('n', tableColumnNames.FAILED)}
        {getSortableHeaderCell('many times', tableColumnNames.FAILED_MANY)}
        {getSortableHeaderCell('n', tableColumnNames.ATTEMPTS)}
        {getSortableHeaderCell('per student', tableColumnNames.PER_STUDENT)}
        {getSortableHeaderCell('Passed', tableColumnNames.PASSED_OF_POPULATION)}
        {getSortableHeaderCell('attempted', tableColumnNames.TRIED_OF_POPULATION)}
      </Table.Row>
    </Table.Header>
  )
}

export default PassFailHeader
