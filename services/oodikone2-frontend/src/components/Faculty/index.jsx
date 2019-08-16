import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getActiveLanguage } from 'react-localize-redux'
import { Header, Segment, Form } from 'semantic-ui-react'
import { uniq } from 'lodash'
import { string, arrayOf, shape, func } from 'prop-types'
import { getTextIn } from '../../common'
import { getFaculties, getFacultiesYearlyStats, getFacultyProgrammes } from '../../redux/faculties'
import YearFilter from '../CourseStatistics/SearchForm/YearFilter'
import FacultySelector from './FacultySelector'
import FacultyStats from './FacultyStats'

const Faculty = ({ getFaculties, getFacultiesYearlyStats, getFacultyProgrammes, faculties, facultyYearlyStats, history, match, language }) => {
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [fromYear, setFromYear] = useState(-1)
  const [toYear, setToYear] = useState(-1)
  const [years, setYears] = useState([])

  const facultyCodes = faculties.map(({ code }) => code)
  const selectedFacultyProgrammesStats = facultyYearlyStats.find(({ id }) => id === selectedFaculty)
  const hasLoaded = (faculties.length > 0 && facultyYearlyStats.length > 0)

  useEffect(() => {
    if (selectedFaculty) {
      history.push(`/faculties/${selectedFaculty}`)
    }
  }, [selectedFaculty])

  useEffect(() => {
    const { params: { facultyid } } = match
    if (facultyid) setSelectedFaculty(facultyid)
    else setSelectedFaculty(null)
  }, [history.location.pathname])

  useEffect(() => {
    getFaculties()
    getFacultiesYearlyStats()
    getFacultyProgrammes()
  }, [])

  const getYearFilterData = () => {
    const filterYears = uniq(facultyYearlyStats
      .filter(f => facultyCodes.includes(f.id))
      .map(({ data }) => Object.values(data).reduce((res, curr) => [...res, ...Object.keys(curr)], []))
      .reduce((acc, curr) => [...acc, ...curr], []))
      .sort((a, b) => b - a).map(year => parseInt(year, 10))

    return {
      fromYear: filterYears[filterYears.length - 1],
      toYear: filterYears[0],
      years: filterYears.map(y => ({ key: y, text: y, value: y }))
    }
  }

  useEffect(() => {
    if (faculties.length && facultyYearlyStats.length) {
      const { fromYear: newFromYear, toYear: newToYear, years: newYears } = getYearFilterData()
      if (fromYear < newFromYear || fromYear > newToYear) setFromYear(newFromYear)
      if (toYear < newFromYear || toYear > newToYear) setToYear(newToYear)
      setYears(newYears)
    }
  }, [faculties, facultyYearlyStats, selectedFaculty])

  const handleYearChange = (e, target) => {
    const { name, value } = target
    if (name === 'fromYear') setFromYear(value)
    else setToYear(value)
  }

  const getTitle = () => (
    selectedFaculty && hasLoaded ?
      getTextIn(faculties.find(({ code }) => code === selectedFaculty).name, language) :
      'Faculties'
  )

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        { hasLoaded && getTitle() }
      </Header>
      <Segment className="contentSegment" loading={!hasLoaded}>
        { !hasLoaded && null }
        { hasLoaded && (
          <React.Fragment>
            <Segment>
              <Form>
                <Header content="Filter by time range" as="h4" />
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
            { !selectedFaculty ?
              <FacultySelector
                faculties={faculties}
                facultyYearlyStats={facultyYearlyStats}
                fromYear={fromYear}
                toYear={toYear}
                handleSelect={setSelectedFaculty}
              /> :
              <FacultyStats
                selectedFacultyProgrammesStats={selectedFacultyProgrammesStats ? selectedFacultyProgrammesStats.data : {}}
                fromYear={fromYear}
                toYear={toYear}
              />
            }
          </React.Fragment>
        )}
      </Segment>
    </div>
  )
}

Faculty.propTypes = {
  getFaculties: func.isRequired,
  getFacultiesYearlyStats: func.isRequired,
  getFacultyProgrammes: func.isRequired,
  faculties: arrayOf(shape({})).isRequired,
  facultyYearlyStats: arrayOf(shape({})).isRequired,
  history: shape({}).isRequired,
  match: shape({}).isRequired,
  language: string.isRequired
}

const mapStateToProps = ({ faculties, localize }) => ({
  faculties: faculties.data,
  facultyYearlyStats: faculties.yearlyStats,
  language: getActiveLanguage(localize).code
})

const mapDispatchToProps = {
  getFaculties,
  getFacultiesYearlyStats,
  getFacultyProgrammes
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Faculty))
