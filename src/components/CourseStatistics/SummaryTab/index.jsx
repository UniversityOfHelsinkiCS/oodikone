import React, { Component } from 'react'
import { Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, func, oneOfType, number, string } from 'prop-types'
import selectors from '../../../selectors/courseStats'
import { fields, setValue } from '../../../redux/coursesSummaryForm'
import CumulativeTable from '../CumulativeTable'

class SummaryTab extends Component {
    handleChange = (e, { name, value }) => this.props.setValue(name, value)

    render() {
      const { statistics, programmes } = this.props
      const options = programmes.map(p => ({
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
          <CumulativeTable
            categoryName="Course"
            data={statistics.map(s => ({
              id: s.coursecode,
              category: s.name,
              passed: s.summary.passed,
              failed: s.summary.failed,
              passrate: s.summary.passrate
            }))}
          />
        </div>
      )
    }
}

SummaryTab.propTypes = {
  statistics: arrayOf(shape({
    coursecode: oneOfType([number, string]),
    name: string,
    summary: shape({
      failed: number,
      passed: number,
      passrate: oneOfType([number, string])
    })
  })).isRequired,
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
