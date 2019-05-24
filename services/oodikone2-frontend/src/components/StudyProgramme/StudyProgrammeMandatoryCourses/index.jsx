import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { Message } from 'semantic-ui-react'
import {
  getMandatoryCourses,
  addMandatoryCourse,
  deleteMandatoryCourse,
  setMandatoryCourseLabel
} from '../../../redux/populationMandatoryCourses'
import MandatoryCourseTable from '../MandatoryCourseTable'
import AddMandatoryCourses from '../AddMandatoryCourses'

class StudyProgrammeMandatoryCourses extends Component {
  static propTypes = {
    getMandatoryCourses: func.isRequired,
    addMandatoryCourse: func.isRequired,
    deleteMandatoryCourse: func.isRequired,
    setMandatoryCourseLabel: func.isRequired,
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
    if (!studyProgramme) return null

    return (
      <React.Fragment>
        <Message
          content="The set of mandatory courses which can be used in population filtering
              in the 'Study programme' > 'Search by class' results page. The label is used to group the courses in different views.
              You can for example use labels '1. year', '2. year' to define groups of 1st year and second year mandatory courses."
        />
        <AddMandatoryCourses
          addMandatoryCourse={this.props.addMandatoryCourse}
          studyProgramme={studyProgramme}
        />
        <MandatoryCourseTable
          mandatoryCourses={mandatoryCourses.data}
          studyProgramme={studyProgramme}
          deleteMandatoryCourse={this.props.deleteMandatoryCourse}
          setMandatoryCourseLabel={this.props.setMandatoryCourseLabel}
          language={language}
        />
      </React.Fragment >
    )
  }
}

export default connect(
  ({ populationMandatoryCourses, settings }) => ({
    mandatoryCourses: populationMandatoryCourses,
    language: settings.language
  }),
  { getMandatoryCourses, addMandatoryCourse, deleteMandatoryCourse, setMandatoryCourseLabel }
)(StudyProgrammeMandatoryCourses)
