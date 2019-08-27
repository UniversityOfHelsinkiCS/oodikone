import React from 'react'
import { Table, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, func } from 'prop-types'
import { options, setValue, fields } from '../../redux/oodilearnPopulationForm'
import PopulationCourseSelect from './PopulationCourseSelect'

const PopulationFilters = ({ form, setFormValue }) => (
  <div>
    <PopulationCourseSelect />
    <Table definition textAlign="center" className="fixed-header">
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
                selectOnBlur={false}
                selectOnNavigation={false}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </div>
)

PopulationFilters.propTypes = {
  form: shape({}).isRequired,
  setFormValue: func.isRequired
}

const mapStateToProps = state => ({
  form: state.oodilearnPopulationForm
})

export default connect(mapStateToProps, {
  setFormValue: setValue
})(PopulationFilters)
