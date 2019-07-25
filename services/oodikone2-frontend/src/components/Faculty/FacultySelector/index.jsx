import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Segment, Form } from 'semantic-ui-react'
import { string, func, arrayOf, shape } from 'prop-types'
import { uniq } from 'lodash'
import { getFaculties, getFacultiesYearlyStats } from '../../../redux/faculties'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'
import YearFilter from '../../CourseStatistics/SearchForm/YearFilter'

const FacultySelector = ({ language, getFaculties, getFacultiesYearlyStats, faculties, facultyYearlyStats }) => {
  const [ selectedFaculties, setSelectedFaculties ] = useState([])
  const [ fromYear, setFromYear ] = useState(-1)
  const [ toYear, setToYear ] = useState(-1)
  const [ years, setYears ] = useState([])

  const handleSelect = code => setSelectedFaculties(
    selectedFaculties.includes(code) ?
      selectedFaculties.filter(c => c !== code) :
      selectedFaculties.concat(code)
  )

  useEffect(() => {
    getFaculties()
    getFacultiesYearlyStats()
  }, [])

  useEffect(() => {
    const { fromYear: newFromYear, toYear: newToYear, years: newYears } = getYearFilterData()
    if (fromYear < newFromYear || fromYear > newToYear) setFromYear(newFromYear)
    if (toYear < newFromYear || toYear > newToYear) setToYear(newToYear)
    setYears(newYears)
  }, [ selectedFaculties ])

  const getYearFilterData = () => {
    const years = uniq(
      facultyYearlyStats
        .filter(f => selectedFaculties.includes(f.id))
        .map(({ data }) => Object.keys(data).map(y => parseInt(y)))
        .reduce((acc, curr) => [ ...acc, ...curr ], [])
    ).sort((a, b) => b - a)

    return {
      fromYear: years[years.length - 1],
      toYear: years[0],
      years: years.map(y => ({ key: y, text: y, value: y }))
    }
  }

  const handleYearChange = (e, target) => {
    const { name, value } = target
    name === 'fromYear' ?
      setFromYear(value) :
      setToYear(value)
  }

  const calculateAccumulativeStatsFor = (facultyCode) => {
    const yearlyStats = facultyYearlyStats.find(f => f.id === facultyCode)
    return yearlyStats ?
      Math.round(Object.entries(yearlyStats.data)
        .filter(([ year ]) => year >= fromYear && year <= toYear)
        .reduce((acc, [ year, credits ]) => acc + credits, 0)) :
      0
  }

  if (!faculties || !facultyYearlyStats) return null
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
      getRowVal: faculty => calculateAccumulativeStatsFor(faculty.code)
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
                years={years }
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
  dispatchGetFaculties: func.isRequired,
  faculties: arrayOf(shape({})).isRequired,
  facultyYearlyStats: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ faculties, settings }) => ({
  faculties: faculties.data,
  facultyYearlyStats: faculties.yearlyStats,
  language: settings.language
})

export default connect(mapStateToProps, { getFaculties, getFacultiesYearlyStats })(withRouter(FacultySelector))
