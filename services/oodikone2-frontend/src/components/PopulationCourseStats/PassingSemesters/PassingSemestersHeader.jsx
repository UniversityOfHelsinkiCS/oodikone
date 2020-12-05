import React from 'react'
import { Table } from 'semantic-ui-react'
import { UsePopulationCourseContext } from '../PopulationCourseContext'

const PassingSemestersHeader = () => {
  const { filterInput } = UsePopulationCourseContext()

  return (
    <Table.Header>
      <Table.Row>
        {filterInput('nameFilter', 'Name', '3')}
        {filterInput('codeFilter', 'Code')}

        <Table.HeaderCell>Students</Table.HeaderCell>
        <Table.HeaderCell>Passed</Table.HeaderCell>

        <Table.HeaderCell>Before 1st year</Table.HeaderCell>
        <Table.HeaderCell>1st fall</Table.HeaderCell>
        <Table.HeaderCell>1st spring</Table.HeaderCell>
        <Table.HeaderCell>2nd fall</Table.HeaderCell>
        <Table.HeaderCell>2nd spring</Table.HeaderCell>
        <Table.HeaderCell>3rd fall</Table.HeaderCell>
        <Table.HeaderCell>3rd spring</Table.HeaderCell>
        <Table.HeaderCell>4th fall</Table.HeaderCell>
        <Table.HeaderCell>4th spring</Table.HeaderCell>
        <Table.HeaderCell>5th year</Table.HeaderCell>
        <Table.HeaderCell>6th year</Table.HeaderCell>
        <Table.HeaderCell>Later</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  )
}

export default PassingSemestersHeader
