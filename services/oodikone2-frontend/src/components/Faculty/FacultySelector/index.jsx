import React from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, shape, number, func } from 'prop-types'
import { calculateStatsForProgramme, calculateTotalPassedCourses, calculateTotalFailedCourses } from '../facultyUtils'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

const FacultySelector = ({ language, faculties, facultyYearlyStats, fromYear, toYear, handleSelect }) => {
  const calculateStatsForFaculty = (facultyCode) => {
    const res = {
      totalStudentCredits: 0,
      totalCoursesPassed: 0,
      totalCoursesFailed: 0
    }

    const faculty = facultyYearlyStats.find(f => f.id === facultyCode)
    if (!faculty) return res

    Object.values(faculty.data).forEach((programmeYearlyStats) => {
      const stats = calculateStatsForProgramme(programmeYearlyStats, fromYear, toYear)
      res.totalStudentCredits += stats.totalStudentCredits
      res.totalCoursesPassed += stats.totalCoursesPassed
      res.totalCoursesFailed += stats.totalCoursesFailed
    })

    return res
  }

  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: faculty => getTextIn(faculty.name, language)
    },
    {
      key: 'code',
      title: 'code',
      getRowVal: faculty => faculty.code
    },
    {
      key: 'students',
      title: 'Student credits',
      getRowVal: ({ code }) => Math.round(calculateStatsForFaculty(code).totalStudentCredits)
    },
    {
      key: 'coursesPassed',
      title: 'Courses passed',
      getRowVal: ({ code }) => calculateTotalPassedCourses(calculateStatsForFaculty(code, fromYear, toYear)),
      getRowContent: ({ code }) => `${calculateTotalPassedCourses(calculateStatsForFaculty(code, fromYear, toYear)).toFixed(2)}%`
    },
    {
      key: 'coursesFailed',
      title: 'Courses failed',
      getRowVal: ({ code }) => calculateTotalFailedCourses(calculateStatsForFaculty(code, fromYear, toYear)),
      getRowContent: ({ code }) => `${calculateTotalFailedCourses(calculateStatsForFaculty(code, fromYear, toYear)).toFixed(2)}%`
    }
  ]

  return (
    <SortableTable
      columns={headers}
      getRowKey={faculty => faculty.code}
      getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
      data={faculties}
    />
  )
}

FacultySelector.propTypes = {
  language: string.isRequired,
  faculties: arrayOf(shape({})).isRequired,
  facultyYearlyStats: arrayOf(shape({})).isRequired,
  fromYear: number.isRequired,
  toYear: number.isRequired,
  handleSelect: func.isRequired
}

const mapStateToProps = ({ localize }) => ({
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(FacultySelector)
