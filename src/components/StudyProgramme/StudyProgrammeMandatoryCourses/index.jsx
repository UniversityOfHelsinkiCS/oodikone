import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { Message } from 'semantic-ui-react'
import { getMandatoryCourses } from '../../../redux/populationMandatoryCourses'
import MandatoryCourseTable from '../MandatoryCourseTable'

class StudyProgrammeMandatoryCourses extends Component {
  static propTypes = {
    getMandatoryCourses: func.isRequired,
    studyProgramme: string.isRequired,
    mandatoryCourses: shape({}).isRequired,
    language: string.isRequired
  }

  componentDidMount() {
    const { studyProgramme } = this.props
    if (studyProgramme) this.props.getMandatoryCourses(studyProgramme)
  }

  componentDidUpdate(prevProps) {
    const { studyProgramme } = this.props
    if (studyProgramme !== prevProps.studyProgramme) {
      this.props.getMandatoryCourses(this.props.studyProgramme)
    }
  }

  render() {
    const { studyProgramme, mandatoryCourses, language } = this.props
    console.log(mandatoryCourses)
    if (!studyProgramme) return null

    return (
      <React.Fragment>
        <Message
          header={`Mandatory courses for study programme  ${studyProgramme}`}
          content="The set of mandatory courses which can be used in populeation filtering
              in the population statistics page"
        />
        <MandatoryCourseTable mandatoryCourses={mandatoryCourses.data} language={language} />
      </React.Fragment >
    )
  }
}

export default connect(
  ({ populationMandatoryCourses, settings }) => ({
    mandatoryCourses: populationMandatoryCourses,
    language: settings.language
  }),
  { getMandatoryCourses }
)(StudyProgrammeMandatoryCourses)
