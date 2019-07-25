import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, bool } from 'prop-types'

import { getCoursePopulation, getCoursePopulationCourses } from '../../redux/coursePopulation'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourseStats from '../PopulationCourseStats'

const CourseStudents = ({ getCoursePopulationDispatch, getCoursePopulationCoursesDispatch, studentData, courses, pending }) => {
  useEffect(() => {
    getCoursePopulationDispatch({ coursecode: '581325', yearcode: '67' })
    getCoursePopulationCoursesDispatch({ coursecode: '581325', yearcode: '67' })
  }, [])
  const selectedStudents = studentData.students ? studentData.students.map(student => student.studentNumber) : []
  return (
    <div>
      {studentData.students ? (
        <div>
          <CreditAccumulationGraphHighCharts
            students={studentData.students}
            selectedStudents={selectedStudents}
          />
          <PopulationCourseStats
            // key={populationCourses.query.uuid}
            courses={courses}
            // query={populationCourses.query}
            pending={pending}
            selectedStudents={selectedStudents}
          />
          <PopulationStudents
            samples={studentData.students}
            selectedStudents={selectedStudents}
          />
        </div>
      ) : (<div />)}

      fuck
    </div>
  )
}

CourseStudents.propTypes = {
  getCoursePopulationDispatch: func.isRequired,
  getCoursePopulationCoursesDispatch: func.isRequired,
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  studentData: shape({}).isRequired
}

const mapStateToProps = ({ coursePopulation }) => ({
  studentData: coursePopulation.students,
  courses: coursePopulation.courses,
  pending: coursePopulation.pending
})

export default withRouter(connect(mapStateToProps, { getCoursePopulationDispatch: getCoursePopulation, getCoursePopulationCoursesDispatch: getCoursePopulationCourses })(CourseStudents))
