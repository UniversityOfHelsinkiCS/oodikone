import React, { Component } from 'react'
import { Form, Label, Segment, Header } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, func, oneOfType, number, string } from 'prop-types'
import selectors from '../../../selectors/courseStats'
import { fields, setValue } from '../../../redux/coursesSummaryForm'
import CumulativeTable from '../CumulativeTable'
import ProgrammeDropdown from '../ProgrammeDropdown'

class SummaryTab extends Component {
    handleChange = (e, { name, value }) => this.props.setValue(name, value)

    render() {
      const { statistics, programmes, queryInfo } = this.props
      const data = statistics.map((stat) => {
        const { coursecode, name, realisations, summary } = stat
        const { passed, failed, passrate } = summary
        return {
          id: coursecode,
          category: name,
          passed,
          failed,
          passrate,
          realisations
        }
      })

      return (
        <div>
          <Segment>
            <Form>
              <Header content="Filter statistics by study programme" as="h4" />
              <ProgrammeDropdown
                options={programmes}
                label="Study programme:"
                name={fields.programme}
                onChange={this.handleChange}
                value={this.props.form[fields.programme]}
              />
              <Form.Field>
                <label>Timeframe:</label>
                <Label.Group>
                  {queryInfo.timeframe.map(({ code, name }) => (
                    <Label key={code} content={name} />
                  ))}
                </Label.Group>
              </Form.Field>
            </Form>
          </Segment>
          <CumulativeTable
            categoryName="Course"
            onClickCourse={this.props.onClickCourse}
            data={data}
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
  setValue: func.isRequired,
  queryInfo: shape({
    courses: arrayOf(shape({})),
    timeframe: arrayOf(shape({}))
  }).isRequired,
  onClickCourse: func.isRequired
}

const mapStateToProps = (state) => {
  const programmes = selectors.getAllStudyProgrammes(state)
  const programme = state.courseSummaryForm[fields.programme]
  return {
    form: state.courseSummaryForm,
    statistics: selectors.summaryStatistics(state, { programmes, programme }),
    queryInfo: selectors.getQueryInfo(state),
    programmes
  }
}

export default connect(mapStateToProps, { setValue })(SummaryTab)
