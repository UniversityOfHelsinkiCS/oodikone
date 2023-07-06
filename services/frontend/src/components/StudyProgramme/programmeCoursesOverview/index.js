import React, { useState, useEffect } from 'react'
import { min, max, range } from 'lodash'
import { useGetProgrammeCoursesStatsQuery } from 'redux/studyProgramme'
import { Loader, Segment, Header } from 'semantic-ui-react'
import CourseTabs from './CourseTabs'
import CoursesYearFilter from './CourseYearFilter'

const ProgrammeCoursesOverview = ({ studyProgramme, combinedProgramme, academicYear, setAcademicYear }) => {
  const { data, error, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    academicyear: academicYear ? 'ACADEMIC_YEAR' : 'NOT_ACADEMIC_YEAR',
    combinedProgramme,
  })
  const [fromYear, setFromYear] = useState(null)
  const [toYear, setToYear] = useState(null)
  const [years, setYears] = useState({})
  const [showStudents, setShowStudents] = useState(false)
  // fromYear and toYear initial values are calculated from data and hence useEffect
  useEffect(() => {
    if (data) {
      const yearcodes = [...new Set(data.map(s => Object.keys(s.years)).flat())]
      const initFromYear = Number(min(yearcodes))
      const initToYear = Number(max(yearcodes))
      if (!fromYear) setFromYear(initFromYear)
      if (!toYear) setToYear(initToYear)
      const normal = []
      const academic = []
      for (let i = initFromYear; i <= initToYear; i++) {
        normal.push({ key: i, text: i.toString(), value: i })
        academic.push({ key: i, text: `${i}-${i + 1}`, value: i })
      }
      if (!fromYear && !toYear) setYears({ normal, academic })
    }
  }, [data])

  if (isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  if (error) return <h3>Something went wrong, please try refreshing the page.</h3>

  const handleYearChange = (e, { name, value }) => {
    if (name === 'fromYear' && value <= toYear) setFromYear(value)
    else if (name === 'toYear' && value >= fromYear) setToYear(value)
  }

  const filterDataByYear = (data, fromYear, toYear) => {
    const yearRange = range(fromYear, Number(toYear) + 1)
    const filteredAndmergedCourses = data
      .filter(c => {
        const arr = Object.keys(c.years).some(key => yearRange.includes(Number(key)))
        return arr
      })
      .map(course => {
        const values = Object.entries(course.years).reduce(
          (acc, curr) => {
            if (yearRange.includes(Number(curr[0]))) {
              acc.totalAllStudents += curr[1].totalAllStudents
              acc.totalAllPassed += curr[1].totalPassed
              acc.totalAllNotCompleted += curr[1].totalNotCompleted
              acc.totalAllCredits += curr[1].totalAllCredits
              acc.totalProgrammeStudents += curr[1].totalProgrammeStudents
              acc.totalProgrammeCredits += curr[1].totalProgrammeCredits
              acc.totalOtherProgrammeStudents += curr[1].totalOtherProgrammeStudents
              acc.totalOtherProgrammeCredits += curr[1].totalOtherProgrammeCredits
              acc.totalWithoutStudyrightStudents += curr[1].totalWithoutStudyrightStudents
              acc.totalWithoutStudyrightCredits += curr[1].totalWithoutStudyrightCredits
              acc.totalTransferCredits += curr[1].totalTransferCredits
              acc.totalTransferStudents += curr[1].totalTransferStudents
            }

            return acc
          },
          {
            totalAllStudents: 0,
            totalAllPassed: 0,
            totalAllNotCompleted: 0,
            totalAllCredits: 0,
            totalProgrammeStudents: 0,
            totalProgrammeCredits: 0,
            totalOtherProgrammeStudents: 0,
            totalOtherProgrammeCredits: 0,
            totalWithoutStudyrightStudents: 0,
            totalWithoutStudyrightCredits: 0,
            totalTransferCredits: 0,
            totalTransferStudents: 0,
          }
        )
        return {
          ...values,
          code: course.code,
          name: course.name,
        }
      })

    return filteredAndmergedCourses
  }

  return (
    <div className="studyprogramme-courses">
      <Segment style={{ marginTop: '1rem' }}>
        <Header as="h4">Time range</Header>
        <CoursesYearFilter
          years={academicYear ? years.academic : years.normal}
          fromYear={fromYear}
          toYear={toYear}
          handleChange={handleYearChange}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
        />
      </Segment>
      <CourseTabs
        data={filterDataByYear(data, fromYear, toYear)}
        showStudents={showStudents}
        handleShowStudentsChange={setShowStudents}
      />
    </div>
  )
}

export default ProgrammeCoursesOverview
