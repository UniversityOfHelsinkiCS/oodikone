import React from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, shape, number } from 'prop-types'
import { Segment } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import { calculateStatsForProgramme, calculateTotalPassedCourses, calculateTotalFailedCourses } from '../facultyUtils'
import SortableTable from '../../SortableTable'

const FacultyStats = ({ facultyProgrammes, selectedFacultyProgrammesStats, language, fromYear, toYear }) => {
  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: ({ code }) => {
        const foundProgramme = facultyProgrammes.find(p => p.code === code)
        return foundProgramme ? getTextIn(foundProgramme.name, language) : '-'
      }
    },
    {
      key: 'code',
      title: 'code',
      getRowVal: ({ code }) => code
    },
    {
      key: 'students',
      title: 'Student credits',
      getRowVal: ({ code }) => Math.round(calculateStatsForProgramme(selectedFacultyProgrammesStats[code], fromYear, toYear).totalStudentCredits)
    },
    {
      key: 'coursesPassed',
      title: 'Courses passed',
      getRowVal: ({ code }) => calculateTotalPassedCourses(calculateStatsForProgramme(selectedFacultyProgrammesStats[code], fromYear, toYear)),
      getRowContent: ({ code }) => `${calculateTotalPassedCourses(calculateStatsForProgramme(selectedFacultyProgrammesStats[code], fromYear, toYear)).toFixed(2)}%`
    },
    {
      key: 'coursesFailed',
      title: 'Courses failed',
      getRowVal: ({ code }) => calculateTotalFailedCourses(calculateStatsForProgramme(selectedFacultyProgrammesStats[code], fromYear, toYear)),
      getRowContent: ({ code }) => `${calculateTotalFailedCourses(calculateStatsForProgramme(selectedFacultyProgrammesStats[code], fromYear, toYear)).toFixed(2)}%`
    }
  ]

  if (!selectedFacultyProgrammesStats) {
    return (
      <Segment textAlign="center">
        No data
      </Segment>
    )
  }

  return (
    <SortableTable
      columns={headers}
      getRowKey={({ code }) => code}
      data={Object.entries(selectedFacultyProgrammesStats).map(([code, stats]) => ({ code, stats }))}
    />
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
