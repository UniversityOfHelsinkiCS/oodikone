import React, { Component } from 'react'
import { Tab, Form } from 'semantic-ui-react'
import { shape, string, arrayOf, func, number, oneOfType } from 'prop-types'
import TeacherStatisticsTable from '../TeacherStatisticsTable'

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
      />
    </Form>
    {selected && <TeacherStatisticsTable statistics={statistics} onClickFn={null} />}
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
    state={
      selectedSemester: null,
      selectedCourse: null,
      semesterOptions: [],
      courseOptions: []
    }

    componentDidMount() {
      const { courses } = this.props
      const semesterOptions = this.semesterOptions()
      const courseOptions = this.courseOptions()
      const courseWithMostCredits = Object.values(courses)
        .reduce((c1, c2) => (c1.stats.credits > c2.stats.credits ? c1 : c2))
      this.setState({
        semesterOptions,
        courseOptions,
        selectedSemester: semesterOptions[0].value,
        selectedCourse: courseWithMostCredits.id
      })
    }

    setCourse = selectedCourse => this.setState({ selectedCourse })

    setSemester = selectedSemester => this.setState({ selectedSemester })

    getCourseStats(courseid) {
      if (!courseid) {
        return []
      }
      const { courses, semesters } = this.props
      const course = courses[courseid]
      return Object.entries(course.semesters).map(([semesterid, stats]) => ({
        id: semesterid,
        name: semesters[semesterid].name.fi,
        ...stats
      }))
    }

    getSemesterStats(semesterid) {
      if (!semesterid) {
        return []
      }
      const { courses } = this.props
      return Object.values(courses)
        .filter(course => !!course.semesters[semesterid])
        .map(({ id, name, semesters }) => ({
          id,
          name: name.fi,
          ...semesters[semesterid]
        }))
    }

    semesterOptions() {
      const { semesters } = this.props
      return Object.values(semesters)
        .map(({ name, id }) => ({
          key: id,
          value: id,
          text: name.fi
        }))
        .sort((s1, s2) => s2.value - s1.value)
    }

    courseOptions() {
      const courses = Object.values(this.props.courses)
      return courses.map(({ name, id }) => ({
        key: id,
        value: id,
        description: id,
        text: name.fi
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
  semesters: shape({}).isRequired
}

export default CoursesTab
