import React from 'react'
import { Statistic, Placeholder } from 'semantic-ui-react'
import { number, bool, arrayOf } from 'prop-types'
import { teacherType } from './util'
import styles from './courseGroup.css'

const getStatistic = (label, value) => (
  <Statistic className={styles.groupStatistic}>
    <Statistic.Label>{label}</Statistic.Label>
    <Statistic.Value>{value}</Statistic.Value>
  </Statistic>
)

const Statistics = ({ totalStudents, totalCourses, totalCredits, totalTeachers, activeTeachers, isLoading }) => {
  if (isLoading) {
    const lineKeys = [1, 2, 3, 4, 5]
    return (
      <Placeholder>
        {lineKeys.map(k => <Placeholder.Line key={k} length="full" />)}
      </Placeholder>)
  }
  let teacherAmount = totalTeachers
  let studentAmount = totalStudents
  let coursesAmount = totalCourses
  let creditAmount = totalCredits

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
  totalStudents: number,
  totalCourses: number,
  totalCredits: number,
  totalTeachers: number,
  activeTeachers: arrayOf(teacherType),
  isLoading: bool.isRequired
}

Statistics.defaultProps = {
  totalTeachers: undefined,
  totalStudents: undefined,
  totalCourses: undefined,
  totalCredits: undefined,
  activeTeachers: undefined
}

export default Statistics
