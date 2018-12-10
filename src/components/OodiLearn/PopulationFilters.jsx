import React from 'react'
import { Table, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, func } from 'prop-types'
import { options, setValue, fields } from '../../redux/oodilearnPopulationForm'

const PopulationFilters = ({ form, setFormValue }) => (
  <Table definition textAlign="center">
    {/* <Table.Header>
      <Table.Row>
        <Table.HeaderCell />
        <Table.HeaderCell content="Category" />
      </Table.Row>
    </Table.Header> */}
    <Table.Body>
      {Object.values(fields).map(field => (
        <Table.Row key={field}>
          <Table.Cell content={field} width={3} />
          <Table.Cell>
            <Dropdown
              options={options}
              fluid
              clearable
              style={{ width: '100%' }}
              value={form[field]}
              onChange={(e, { value }) => setFormValue(field, value)}
              placeholder="Any"
            />
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
)

PopulationFilters.propTypes = {
  form: shape({}).isRequired,
  setFormValue: func.isRequired
}

const mapStateToProps = state => ({
  form: state.oodilearnPopulationForm
})

export default connect(mapStateToProps, { setFormValue: setValue })(PopulationFilters)
