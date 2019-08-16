import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, shape, number } from 'prop-types'
import { Segment } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import {
  calculateStatsForProgramme,
  calculateTotalPassedCourses,
  calculateTotalFailedCourses
} from '../facultyUtils'
import SortableTable from '../../SortableTable'
import FacultyStatsGraph from '../FacultyStatsGraph'

const FacultyStats = ({ facultyProgrammes, selectedFacultyProgrammesStats, language, fromYear, toYear }) => {
  const totalStats = useMemo(() => Object.entries(selectedFacultyProgrammesStats).reduce((res, [code, stats]) => {
    res[code] = calculateStatsForProgramme(stats, fromYear, toYear)
    return { ...res }
  }, {}), [fromYear, toYear])

  const getNameOfProgramme = (code) => {
    const foundProgramme = facultyProgrammes.find(p => p.code === code)
    return foundProgramme ? getTextIn(foundProgramme.name, language) : code
  }

  const graphData = useMemo(() => Object.entries(selectedFacultyProgrammesStats).map(([code, data]) => ({ name: getNameOfProgramme(code), data })), [])

  if (!Object.keys(selectedFacultyProgrammesStats).length) {
    return (
      <Segment textAlign="center">
        No data
      </Segment>
    )
  }

  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: ({ code }) => getNameOfProgramme(code)
    },
    {
      key: 'code',
      title: 'code',
      getRowVal: ({ code }) => code
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
        getRowKey={({ code }) => code}
        data={Object.entries(selectedFacultyProgrammesStats).map(([code, stats]) => ({ code, stats }))}
      />
      <FacultyStatsGraph
        data={graphData}
      />
    </React.Fragment>
  )
}

FacultyStats.propTypes = {
  facultyProgrammes: arrayOf(shape({})).isRequired,
  selectedFacultyProgrammesStats: shape({}).isRequired,
  language: string.isRequired,
  fromYear: number.isRequired,
  toYear: number.isRequired
}

const mapStateToProps = ({ faculties, localize }) => ({
  facultyProgrammes: faculties.facultyProgrammes,
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(FacultyStats)
