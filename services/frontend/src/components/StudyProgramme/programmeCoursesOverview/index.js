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
  const [years, setYears] = useState({})

  // fromYear and toYear initial values are calculated from data and hence useEffect
  useEffect(() => {
    if (data) {
      const yearcodes = data?.map(s => s.year)
      const initFromYear = min(yearcodes)
      const initToYear = max(yearcodes)
      if (!fromYear) setFromYear(initFromYear)
      if (!toYear) setToYear(initToYear)
      const normal = []
      const academic = []
      for (let i = initFromYear; i <= initToYear; i++) {
        normal.push({ key: i, text: i.toString(), value: i })
        academic.push({ key: i, text: `${i}-${i + 1}`, value: i })
      }
      setYears({ normal, academic })
    }
  }, [data])

  if (isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  if (error) return <h3>Something went wrong, please try refreshing the page.</h3>

  const handleYearChange = (e, { name, value }) => {
    if (name === 'fromYear' && value <= toYear) setFromYear(value)
    else if (name === 'toYear' && value >= fromYear) setToYear(value)

    // sendAnalytics('Changed time frame', 'Course stats')
  }

  const filterDataByYear = (data, fromYear, toYear) => {
    const temp = data
      .filter(c => c.year >= fromYear && c.year <= toYear)
      .reduce((acc, curr) => {
        if (!acc[curr.code]) {
          acc[curr.code] = { ...curr }
        }
        acc[curr.code].totalAll += curr.totalAll
        acc[curr.code].totalOwn += curr.totalOwn

        return acc
      }, {})
    return Object.values(temp)
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
      <CourseTabs data={filterDataByYear(data, fromYear, toYear)} />
    </div>
  )
}

export default ProgrammeCoursesOverview
