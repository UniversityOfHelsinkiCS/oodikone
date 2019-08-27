import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Tab, Form } from 'semantic-ui-react'
import { shape, string, arrayOf, func, number, oneOfType } from 'prop-types'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import { getTextIn } from '../../common'

const CourseStatsTab = ({ statistics, options, doSelect, selected }) => (
  <div>
    <Form>
      <Form.Dropdown
        options={options}
        placeholder="Select..."
        selection
        search
        value={selected}
        onChange={(_, { value }) => doSelect(value)}
        selectOnBlur={false}
        selectOnNavigation={false}
      />
    </Form>
    {selected && <TeacherStatisticsTable statistics={statistics} onClickFn={() => { }} />}
  </div>
)

CourseStatsTab.propTypes = {
  options: arrayOf(shape({})).isRequired,
  statistics: arrayOf(shape({})).isRequired,
  doSelect: func.isRequired,
  selected: oneOfType([string, number])
}

CourseStatsTab.defaultProps = {
  selected: null
}

class CoursesTab extends Component {
  state = {
    selectedSemester: null,
    selectedCourse: null,
    semesterOptions: [],
    courseOptions: []
  }

  componentDidMount() {
    const { courses } = this.props
    const semesterOptions = this.semesterOptions()
    const courseOptions = this.courseOptions()
    const courseWithMostCredits = Object.values(courses).length > 0 ?
      Object.values(courses).reduce((c1, c2) => (c1.stats.credits > c2.stats.credits ? c1 : c2)) : null
    this.setState({
      semesterOptions,
      courseOptions,
      selectedSemester: semesterOptions.length > 0 ? semesterOptions[0].value : null,
      selectedCourse: courseWithMostCredits != null ? courseWithMostCredits.id : null
    })
  }

  setCourse = selectedCourse => this.setState({ selectedCourse })

  setSemester = selectedSemester => this.setState({ selectedSemester })

  getCourseStats(courseid) {
    if (!courseid) {
      return []
    }
    const { courses, semesters, language } = this.props
    const course = courses[courseid]
    return Object.entries(course.semesters).map(([semesterid, stats]) => ({
      id: semesterid,
      name: getTextIn(semesters[semesterid].name, language),
      ...stats
    }))
  }

  getSemesterStats(semesterid) {
    if (!semesterid) {
      return []
    }
    const { courses, language } = this.props
    return Object.values(courses)
      .filter(course => !!course.semesters[semesterid])
      .map(({ id, name, semesters }) => ({
        id,
        name: getTextIn(name, language),
        ...semesters[semesterid]
      }))
  }

  semesterOptions() {
    const { semesters, language } = this.props
    return Object.values(semesters)
      .map(({ name, id }) => ({
        key: id,
        value: id,
        text: getTextIn(name, language)
      }))
      .sort((s1, s2) => s2.value - s1.value)
  }

  courseOptions() {
    const { language } = this.props
    const courses = Object.values(this.props.courses)
    return courses.map(({ name, id }) => ({
      key: id,
      value: id,
      description: id,
      text: getTextIn(name, language)
    }))
  }

  dropdownOptions = () => ({
    courses: this.courseOptions(),
    semesters: this.semesterOptions()
  })

  render = () => {
    const { selectedCourse, selectedSemester, courseOptions, semesterOptions } = this.state
    return (
      <Tab
        menu={{ secondary: true, pointing: true }}
        panes={[
          {
            menuItem: 'Semester',
            render: () => (
              <CourseStatsTab
                options={semesterOptions}
                doSelect={this.setSemester}
                selected={selectedSemester}
                statistics={this.getSemesterStats(selectedSemester)}
              />
            )
          },
          {
            menuItem: 'Course',
            render: () => (
              <CourseStatsTab
                options={courseOptions}
                statistics={this.getCourseStats(selectedCourse)}
                doSelect={this.setCourse}
                selected={selectedCourse}
              />
            )
          }
        ]}
      />
    )
  }
}

CoursesTab.propTypes = {
  courses: shape({}).isRequired,
  semesters: shape({}).isRequired,
  language: string.isRequired
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(CoursesTab)
