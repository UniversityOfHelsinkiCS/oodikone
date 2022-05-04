import React, { useState, useEffect } from 'react'
import { min, max } from 'lodash'
import { useGetProgrammeCoursesStatsQuery } from 'redux/studyProgramme'
import { Loader, Segment, Header } from 'semantic-ui-react'
import CourseTabs from './CourseTabs'
import CoursesYearFilter from './CourseYearFilter'

const ProgrammeCoursesOverview = ({ studyProgramme, academicYear, setAcademicYear }) => {
  const { data, error, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    academicyear: academicYear,
  })
  const [fromYear, setFromYear] = useState(null)
  const [toYear, setToYear] = useState(null)
  const [years, setYears] = useState(null)

  useEffect(() => {
    if (data) {
      const yearcodes = data.map(s => s.year)
      const initFromYear = min(yearcodes)
      const initToYear = max(yearcodes)
      setFromYear(initFromYear)
      setToYear(initToYear)
      const tempYears = []
      for (let i = initFromYear; i <= initToYear; i++) {
        tempYears.push({ key: i, text: i.toString(), value: i })
      }
      setYears(tempYears)
    }
  }, [data])

  if (isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  /* const yearcodes = data.map(s => s.yearcode)
  const initFromYear = min(yearcodes)
  const initToYear = max(yearcodes)
  setFromYear(initFromYear)
  setToYear(initToYear) */

  if (error) return <h3>Something went wrong, please try refreshing the page.</h3>

  /*   const filteredYearsAndSemesters = () => {
    const yearcodes = data.map(s => s.yearcode)
    const from = min(yearcodes)
    const to = max(yearcodes)
    if (from == null || to == null) {
      return {
        filteredYears: years,
        filteredSemesters: semesters,
      }
    }

    const timeFilter = ({ value }) => value >= from && value <= to
    return {
      filteredYears: years.filter(timeFilter),
      filteredSemesters: semesters.filter(timeFilter),
    }
  } */

  return (
    <div className="studyprogramme-courses">
      <Segment style={{ marginTop: '1rem' }}>
        <Header as="h4">Time range</Header>
        <CoursesYearFilter
          years={years}
          fromYear={fromYear}
          toYear={toYear}
          handleChange={null}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
        />
      </Segment>
      <CourseTabs />
    </div>
  )
}

export default ProgrammeCoursesOverview
