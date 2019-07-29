import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Form } from 'semantic-ui-react'
import { string, func, arrayOf, shape } from 'prop-types'
import { uniq } from 'lodash'
import { getFaculties as getFacultiesAction, getFacultiesYearlyStats as getFacultiesYearlyStatsAction } from '../../../redux/faculties'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'
import YearFilter from '../../CourseStatistics/SearchForm/YearFilter'

const FacultySelector = ({ language, getFaculties, getFacultiesYearlyStats, faculties, facultyYearlyStats }) => {
  const [selectedFaculties, setSelectedFaculties] = useState([])
  const [fromYear, setFromYear] = useState(-1)
  const [toYear, setToYear] = useState(-1)
  const [years, setYears] = useState([])

  useEffect(() => {
    getFaculties()
    getFacultiesYearlyStats()
  }, [])

  const handleSelect = code => setSelectedFaculties(selectedFaculties.includes(code) ?
    selectedFaculties.filter(c => c !== code) :
    selectedFaculties.concat(code))

  const getYearFilterData = () => {
    const filterYears = uniq(facultyYearlyStats
      .filter(f => selectedFaculties.includes(f.id))
      .map(({ data }) => Object.keys(data).map(y => parseInt(y, 10)))
      .reduce((acc, curr) => [...acc, ...curr], []))
      .sort((a, b) => b - a)

    return {
      fromYear: filterYears[filterYears.length - 1],
      toYear: filterYears[0],
      years: filterYears.map(y => ({ key: y, text: y, value: y }))
    }
  }

  useEffect(() => {
    const { fromYear: newFromYear, toYear: newToYear, years: newYears } = getYearFilterData()
    if (fromYear < newFromYear || fromYear > newToYear) setFromYear(newFromYear)
    if (toYear < newFromYear || toYear > newToYear) setToYear(newToYear)
    setYears(newYears)
  }, [selectedFaculties])

  const handleYearChange = (e, target) => {
    const { name, value } = target
    if (name === 'fromYear') setFromYear(value)
    else setToYear(value)
  }

  const calculateStatsFor = (facultyCode) => {
    const yearlyStats = facultyYearlyStats.find(f => f.id === facultyCode)
    const res = {
      totalStudentCredits: 0,
      totalCoursesPassed: 0,
      totalCoursesFailed: 0
    }
    if (!yearlyStats) return res
    Object.entries(yearlyStats.data)
      .filter(([year]) => year >= fromYear && year <= toYear)
      .forEach(([, stat]) => {
        const { studentCredits, coursesPassed, coursesFailed } = stat
        res.totalStudentCredits += studentCredits
        res.totalCoursesPassed += coursesPassed
        res.totalCoursesFailed += coursesFailed
      })
    return res
  }

  const calculateTotalPassedCoursesFor = (facultyCode) => {
    const { totalCoursesPassed, totalCoursesFailed } = calculateStatsFor(facultyCode)
    const ratio = ((totalCoursesPassed / (totalCoursesPassed + totalCoursesFailed)) * 100)
    return Number.isNaN(ratio) ? 0 : ratio
  }

  const calculateTotalFailedCoursesFor = (facultyCode) => {
    const totalPassedRatio = calculateTotalPassedCoursesFor(facultyCode)
    if (totalPassedRatio === 0) return 0
    return 100 - totalPassedRatio
  }

  if (!faculties || !facultyYearlyStats) return null
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
    }
  ]

  const selectedHeaders = [
    ...headers,
    {
      key: 'students',
      title: 'Student credits',
      getRowVal: ({ code }) => Math.round(calculateStatsFor(code).totalStudentCredits)
    },
    {
      key: 'coursesPassed',
      title: 'Courses passed',
      getRowVal: ({ code }) => calculateTotalPassedCoursesFor(code),
      getRowContent: ({ code }) => `${calculateTotalPassedCoursesFor(code).toFixed(2)}%`
    },
    {
      key: 'coursesFailed',
      title: 'Courses failed',
      getRowVal: ({ code }) => calculateTotalFailedCoursesFor(code),
      getRowContent: ({ code }) => `${calculateTotalFailedCoursesFor(code).toFixed(2)}%`
    }
  ]

  const selectedLength = selectedFaculties.length
  return (
    <div>
      { selectedLength !== faculties.length &&
        <SortableTable
          columns={headers}
          getRowKey={faculty => faculty.code}
          getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
          data={faculties.filter(({ code }) => !selectedFaculties.includes(code))}
        />
      }
      { selectedLength !== 0 && (
        <div>
          <Segment>
            <Form>
              <YearFilter
                fromYear={fromYear}
                toYear={toYear}
                years={years}
                handleChange={handleYearChange}
                showCheckbox={false}
                separate={false}
              />
            </Form>
          </Segment>
          <SortableTable
            columns={selectedHeaders}
            getRowKey={faculty => faculty.code}
            getRowProps={faculty => ({ onClick: () => handleSelect(faculty.code), style: { cursor: 'pointer' } })}
            data={faculties.filter(({ code }) => selectedFaculties.includes(code))}
          />
        </div>
      ) }
    </div>
  )
}

FacultySelector.propTypes = {
  language: string.isRequired,
  getFaculties: func.isRequired,
  getFacultiesYearlyStats: func.isRequired,
  faculties: arrayOf(shape({})).isRequired,
  facultyYearlyStats: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ faculties, localize }) => ({
  faculties: faculties.data,
  facultyYearlyStats: faculties.yearlyStats,
  language: getActiveLanguage(localize).code
})

const mapDispatchToProps = {
  getFaculties: getFacultiesAction,
  getFacultiesYearlyStats: getFacultiesYearlyStatsAction
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(FacultySelector))
