import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, shape, number, func } from 'prop-types'
import {
  calculateTotalPassedCourses,
  calculateTotalFailedCourses
} from '../facultyUtils'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'
import FacultyStatsGraph from '../FacultyStatsGraph'

const FacultySelector = ({ language, faculties, facultyYearlyStats, fromYear, toYear, handleSelect }) => {
  const calculateYearlyStatsForFaculty = (facultyCode) => {
    const res = {}
    const yearData = {
      studentCredits: 0,
      coursesPassed: 0,
      coursesFailed: 0
    }

    const faculty = facultyYearlyStats.find(f => f.id === facultyCode)
    if (!faculty) return res
    Object.values(faculty.data).forEach((programmeYearlyStats) => {
      Object.entries(programmeYearlyStats).forEach(([year, stat]) => {
        if (!res[year]) res[year] = { ...yearData }
        res[year].studentCredits += stat.studentCredits
        res[year].coursesPassed += stat.coursesPassed
        res[year].coursesFailed += stat.coursesFailed
      })
    })
    return res
  }

  const calculateTotalStatsForFaculty = (facultyCode) => {
    const initial = {
      totalStudentCredits: 0,
      totalCoursesPassed: 0,
      totalCoursesFailed: 0
    }
    return Object.entries(calculateYearlyStatsForFaculty(facultyCode))
      .filter(([year]) => year >= fromYear && year <= toYear)
      .reduce((res, [, curr]) => ({
        totalStudentCredits: res.totalStudentCredits + curr.studentCredits,
        totalCoursesPassed: res.totalCoursesPassed + curr.coursesPassed,
        totalCoursesFailed: res.totalCoursesFailed + curr.coursesFailed
      }), { ...initial })
  }

  const totalStats = useMemo(() => faculties.reduce((res, { code }) => {
    res[code] = calculateTotalStatsForFaculty(code)
    return { ...res }
  }, {}), [fromYear, toYear])

  const graphData = useMemo(() => faculties.map(({ code, name }) => ({
    name: getTextIn(name, language),
    data: calculateYearlyStatsForFaculty(code)
  })), [])

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
      getRowVal: ({ code }) => Math.round(totalStats[code].totalStudentCredits)
    },
    {
      key: 'coursesPassed',
      title: 'Courses passed',
      getRowVal: ({ code }) => calculateTotalPassedCourses(totalStats[code]),
      getRowContent: ({ code }) => `${calculateTotalPassedCourses(totalStats[code]).toFixed(2)}%`
    },
    {
      key: 'coursesFailed',
      title: 'Courses failed',
      getRowVal: ({ code }) => calculateTotalFailedCourses(totalStats[code]),
      getRowContent: ({ code }) => `${calculateTotalFailedCourses(totalStats[code]).toFixed(2)}%`
    }
  ]

  return (
    <React.Fragment>
      <SortableTable
        columns={headers}
        getRowKey={faculty => faculty.code}
        getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
        data={faculties}
      />
      <FacultyStatsGraph
        data={graphData}
      />
    </React.Fragment>
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
