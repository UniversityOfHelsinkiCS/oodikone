import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { getMandatoryCourses } from '../../redux/populationMandatoryCourses'

class StudyProgrammeMandatoryCourses extends Component {
  static propTypes = {
    getMandatoryCourses: func.isRequired,
    studyProgramme: string.isRequired,
    mandatoryCourses: shape({}).isRequired
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
    const { studyProgramme, mandatoryCourses } = this.props
    console.log(mandatoryCourses)
    if (!studyProgramme) return null

    return (
      <h1>Mandatory Courses for study programme {studyProgramme}, insert table, remove and add here</h1>
    )
  }
}

export default connect(
  ({ populationMandatoryCourses }) => ({ mandatoryCourses: populationMandatoryCourses }),
  { getMandatoryCourses }
)(StudyProgrammeMandatoryCourses)
