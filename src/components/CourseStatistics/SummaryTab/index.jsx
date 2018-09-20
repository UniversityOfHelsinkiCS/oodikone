import React, { Component } from 'react'
import { Table, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, func } from 'prop-types'
import selectors from '../../../selectors/courseStats'
import { fields, setValue } from '../../../redux/coursesSummaryForm'

class SummaryTab extends Component {
    handleChange = (e, { name, value }) => this.props.setValue(name, value)

    render() {
      const { statistics } = this.props
      const options = this.props.programmes.map(p => ({
        ...p,
        label: {
          content: p.size,
          icon: 'user',
          basic: true
        }
      }))
      return (
        <div>
          <Form>
            <Form.Dropdown
              options={options}
              selection
              fluid
              label="Study programme"
              name={fields.programme}
              onChange={this.handleChange}
              value={this.props.form[fields.programme]}
            />
          </Form>
          <Table
            headerRow={['Course', 'Passed', 'Failed', 'Passrate']}
            tableData={statistics}
            renderBodyRow={({ coursecode, name, summary }) => ({
              key: coursecode,
              cells: [name, summary.passed, summary.failed, !summary.passrate ? '' : `${summary.passrate} %`]
            })}
          />
        </div>
      )
    }
}

SummaryTab.propTypes = {
  statistics: arrayOf(shape({})).isRequired,
  programmes: arrayOf(shape({})).isRequired,
  form: shape({}).isRequired,
  setValue: func.isRequired
}

const mapStateToProps = (state) => {
  const programmes = selectors.getAllStudyProgrammes(state)
  const programme = state.courseSummaryForm[fields.programme]
  return {
    form: state.courseSummaryForm,
    statistics: selectors.summaryStatistics(state, { programmes, programme }),
    programmes
  }
}

export default connect(mapStateToProps, { setValue })(SummaryTab)
