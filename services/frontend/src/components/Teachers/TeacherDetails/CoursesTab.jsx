import React, { useState, useEffect } from 'react'
import { Tab, Form } from 'semantic-ui-react'
import { shape, string, arrayOf, func, number, oneOfType, bool } from 'prop-types'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import useLanguage from '../../LanguagePicker/useLanguage'

const CourseStatsTab = ({ statistics, options, doSelect, selected, renderCourseLink }) => (
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
    {selected && <TeacherStatisticsTable statistics={statistics} onClickFn={() => {}} renderLink={renderCourseLink} />}
  </div>
)

CourseStatsTab.propTypes = {
  options: arrayOf(shape({})).isRequired,
  statistics: arrayOf(shape({})).isRequired,
  doSelect: func.isRequired,
  selected: oneOfType([string, number]),
  renderCourseLink: bool,
}

CourseStatsTab.defaultProps = {
  selected: null,
  renderCourseLink: false,
}

const CoursesTab = ({ courses, semesters }) => {
  const { getTextIn } = useLanguage()
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [semesterOptions, setSemesterOptions] = useState([])
  const [courseOptions, setCourseOptions] = useState([])

  const initialSemesterOptions = () => {
    return Object.values(semesters)
      .map(({ name, id }) => ({
        key: id,
        value: id,
        text: getTextIn(name),
      }))
      .sort((s1, s2) => s2.value - s1.value)
  }

  const initialCourseOptions = () => {
    const coursesValues = Object.values(courses)
    return coursesValues.map(({ name, id }) => ({
      key: id,
      value: id,
      description: id,
      text: getTextIn(name),
    }))
  }
  useEffect(() => {
    const initSemesterOptions = initialSemesterOptions()
    const initCourseOptions = initialCourseOptions()
    const courseWithMostCredits =
      Object.values(courses).length > 0
        ? Object.values(courses).reduce((c1, c2) => (c1.stats.credits > c2.stats.credits ? c1 : c2))
        : null
    setSemesterOptions(initSemesterOptions)
    setCourseOptions(initCourseOptions)
    setSelectedSemester(initSemesterOptions.length > 0 ? initSemesterOptions[0].value : null)
    setSelectedCourse(courseWithMostCredits != null ? courseWithMostCredits.id : null)
  }, [courses, semesters])

  const setCourse = selectedCourse => setSelectedCourse(selectedCourse)

  const setSemester = selectedSemester => setSelectedSemester(selectedSemester)

  const getCourseStats = courseid => {
    if (!courseid) {
      return []
    }
    const course = courses[courseid]
    return Object.entries(course.semesters).map(([semesterid, stats]) => ({
      id: semesterid,
      name: getTextIn(semesters[semesterid].name),
      ...stats,
    }))
  }

  const getSemesterStats = semesterid => {
    if (!semesterid) {
      return []
    }
    return Object.values(courses)
      .filter(course => !!course.semesters[semesterid])
      .map(({ id, name, semesters }) => ({
        id,
        name: getTextIn(name),
        ...semesters[semesterid],
      }))
  }

  return (
    <Tab
      menu={{ secondary: true, pointing: true }}
      panes={[
        {
          menuItem: 'Semester',
          render: () => (
            <CourseStatsTab
              options={semesterOptions}
              doSelect={setSemester}
              selected={selectedSemester}
              statistics={getSemesterStats(selectedSemester)}
              renderCourseLink
            />
          ),
        },
        {
          menuItem: 'Course',
          render: () => (
            <CourseStatsTab
              options={courseOptions}
              statistics={getCourseStats(selectedCourse)}
              doSelect={setCourse}
              selected={selectedCourse}
            />
          ),
        },
      ]}
    />
  )
}

CoursesTab.propTypes = {
  courses: shape({}).isRequired,
  semesters: shape({}).isRequired,
}

export default CoursesTab
