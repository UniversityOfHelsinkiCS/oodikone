import React from 'react'
import { Table } from 'semantic-ui-react'
import { shape, arrayOf, string } from 'prop-types'

const ProfileTable = ({ series, categories, selected }) => (
  <Table definition celled size="small">
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell content={null} />
        { categories.map(c => (
          <Table.HeaderCell
            key={c}
            content={c}
            textAlign="center"
          />
        ))}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      { series.map(({ name, data }) => (
        <Table.Row key={name}>
          <Table.Cell content={name} width={3} textAlign="center" />
          { data.map((value, i) => (
            <Table.Cell
              key={categories[i]}
              content={value}
              textAlign="center"
              active={selected === categories[i]}
            />
          ))}
        </Table.Row>
    ))}
    </Table.Body>
  </Table>
)

ProfileTable.propTypes = {
  series: arrayOf(shape({})).isRequired,
  categories: arrayOf(string).isRequired,
  selected: string.isRequired
}

export default ProfileTable
