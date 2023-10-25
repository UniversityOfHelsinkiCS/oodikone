import useLanguage from 'components/LanguagePicker/useLanguage'
import React, { useState } from 'react'
import { useGetLanguageCenterCoursesQuery } from 'redux/languageCenterView'
import { Loader } from 'semantic-ui-react'

const CourseSelecting = () => {
  const courseQuery = useGetLanguageCenterCoursesQuery()
  const { getTextIn } = useLanguage()
  const [search, setSearch] = useState('')
  const courses = courseQuery.isSuccess && courseQuery.data
  if (!courses) return <Loader />

  return (
    <div className="languagecenterview">
      <h1>Course selector</h1>
      <input type="text" onChange={event => setSearch(event.target.value)} />
      <p>
        {courses
          .filter(c => getTextIn(c.name).toUpperCase().includes(search) || c.code.toUpperCase().includes(search))
          .map(course => (
            <Course course={course} />
          ))}
      </p>
    </div>
  )
}

const Course = ({ course }) => {
  const { getTextIn } = useLanguage()
  return (
    <div style={{ border: '1px' }}>
      <span>{course.code}</span> <span>{getTextIn(course.name)}</span>
    </div>
  )
}

export default CourseSelecting
