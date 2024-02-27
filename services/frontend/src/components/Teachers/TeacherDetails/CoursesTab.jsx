import { shape, string, arrayOf, func, number, oneOfType } from 'prop-types'
import React, { useState, useEffect } from 'react'
import { Tab, Form } from 'semantic-ui-react'

import { useLanguage } from '../../LanguagePicker/useLanguage'
import { TeacherStatisticsTable } from '../TeacherStatisticsTable'

const CourseTabDropdown = ({ options, doSelect, selected }) => (
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
)

CourseTabDropdown.propTypes = {
  options: arrayOf(shape({})).isRequired,
  doSelect: func.isRequired,
  selected: oneOfType([string, number]),
}

CourseTabDropdown.defaultProps = {
  selected: null,
}

export const CoursesTab = ({ courses, semesters }) => {
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
            <>
              <CourseTabDropdown options={semesterOptions} doSelect={setSemester} selected={selectedSemester} />
              <TeacherStatisticsTable variant="course" statistics={getSemesterStats(selectedSemester)} />
            </>
          ),
        },
        {
          menuItem: 'Course',
          render: () => (
            <>
              <CourseTabDropdown options={courseOptions} doSelect={setCourse} selected={selectedCourse} />
              <TeacherStatisticsTable variant="semester" statistics={getCourseStats(selectedCourse)} />
            </>
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
