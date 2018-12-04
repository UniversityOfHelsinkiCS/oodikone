import React from 'react'
import { Statistic } from 'semantic-ui-react'
import { number, bool, arrayOf } from 'prop-types'
import { teacherType } from './util'
import styles from './courseGroup.css'

const getStatistic = (label, value) => (
  <Statistic className={styles.groupStatistic}>
    <Statistic.Label>{label}</Statistic.Label>
    <Statistic.Value>{value}</Statistic.Value>
  </Statistic>
)

const Statistics = ({ totalStudents, totalCourses, totalCredits, teachers, isLoading }) => {
  if (isLoading) {
    return null
  }
  let teacherAmount = teachers.length
  let studentAmount = totalStudents
  let coursesAmount = totalCourses
  let creditAmount = totalCredits
  const activeTeachers = teachers.filter(t => t.isActive)

  if (activeTeachers.length > 0) {
    const accumulator = {
      credits: 0,
      students: 0,
      courses: 0
    }

    const filteredStatistics = activeTeachers.reduce((acc, cur) => {
      acc.credits += cur.credits
      acc.students += cur.students
      acc.courses += cur.courses
      return acc
    }, accumulator)

    const { credits, students, courses } = filteredStatistics

    teacherAmount = activeTeachers.length
    studentAmount = students
    creditAmount = credits
    coursesAmount = courses
  }


  return (
    <Statistic.Group className={styles.groupStatistics}>
      {getStatistic('Total teachers', teacherAmount)}
      {getStatistic('Total students', studentAmount)}
      {getStatistic('Total courses', coursesAmount)}
      {getStatistic('Total credits', creditAmount)}
    </Statistic.Group>
  )
}

Statistics.propTypes = {
  totalStudents: number.isRequired,
  totalCourses: number.isRequired,
  totalCredits: number.isRequired,
  teachers: arrayOf(teacherType).isRequired,
  isLoading: bool.isRequired
}

export default Statistics
