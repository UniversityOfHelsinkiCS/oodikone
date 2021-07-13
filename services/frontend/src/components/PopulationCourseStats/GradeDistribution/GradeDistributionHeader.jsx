import React from 'react'
import { arrayOf, number } from 'prop-types'
import { Table } from 'semantic-ui-react'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import SortableHeaderCell from '../SortableHeaderCell'

const GradeDistributionHeader = ({ gradeTypes }) => {
  const { onSortableColumnHeaderClick, filterInput, reversed, sortCriteria, tableColumnNames } =
    UsePopulationCourseContext()

  return (
    <Table.Header>
      <Table.Row>
        {filterInput('nameFilter', 'Name', '3')}
        {filterInput('codeFilter', 'Code')}

        <SortableHeaderCell
          content="Attempts"
          columnName={tableColumnNames.STUDENTS}
          onClickFn={onSortableColumnHeaderClick}
          activeSortColumn={sortCriteria}
          reversed={reversed}
        />

        <Table.HeaderCell>0</Table.HeaderCell>
        {gradeTypes.map(g => (
          <Table.HeaderCell content={g} key={g} />
        ))}
        <Table.HeaderCell content="Other passed" />
      </Table.Row>
    </Table.Header>
  )
}

GradeDistributionHeader.propTypes = {
  gradeTypes: arrayOf(number).isRequired,
}

export default GradeDistributionHeader
