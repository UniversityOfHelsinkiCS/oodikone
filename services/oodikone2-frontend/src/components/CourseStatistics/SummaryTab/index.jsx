import React, { Component } from 'react'
import { Form, Label, Segment, Header } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, func, oneOfType, number, string } from 'prop-types'
import selectors, { ALL } from '../../../selectors/courseStats'
import { fields, setValue } from '../../../redux/coursesSummaryForm'
import CumulativeTable from '../CumulativeTable'
import ProgrammeDropdown from '../ProgrammeDropdown'

class SummaryTab extends Component {
    handleChange = (e, { name, value }) => {
      let selected = [...value].filter(v => v !== ALL.value)
      if ((!this.props.form[fields.programmes].includes(ALL.value) && value.includes(ALL.value)) || value.length === 0) {
        selected = [ALL.value]
      }
      this.props.setValue(name, selected)
    }

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
              <Header content="Filter statistics by study programmes" as="h4" />
              <ProgrammeDropdown
                options={programmes}
                label="Study programmes:"
                name={fields.programmes}
                onChange={this.handleChange}
                value={this.props.form[fields.programmes]}
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
          {<CumulativeTable
            categoryName="Course"
            onClickCourse={this.props.onClickCourse}
            data={data}
          />}
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
  const programmeCodes = state.courseSummaryForm[fields.programmes]
  return {
    form: state.courseSummaryForm,
    statistics: selectors.summaryStatistics(state, { programmes, programmeCodes }),
    queryInfo: selectors.getQueryInfo(state),
    programmes
  }
}

export default connect(mapStateToProps, { setValue })(SummaryTab)
