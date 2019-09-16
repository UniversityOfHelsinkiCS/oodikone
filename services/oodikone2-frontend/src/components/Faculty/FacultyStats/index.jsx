import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, shape, number, func } from 'prop-types'
import { Segment, Icon, Header } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import { calculateStatsForProgramme, calculateTotalPassedCourses, calculateTotalFailedCourses } from '../facultyUtils'
import SortableTable from '../../SortableTable'
import FacultyStatsGraph from '../FacultyStatsGraph'

const FacultyStats = ({ facultyProgrammes, selectedFacultyProgrammesStats, language, fromYear, toYear, history }) => {
  const totalStats = useMemo(
    () =>
      Object.entries(selectedFacultyProgrammesStats).reduce((res, [code, stats]) => {
        res[code] = calculateStatsForProgramme(stats, fromYear, toYear)
        return { ...res }
      }, {}),
    [fromYear, toYear]
  )

  const showProgrammeOverView = code => {
    history.push(`/study-programme/${code}`)
  }

  const getNameOfProgramme = code => {
    const foundProgramme = facultyProgrammes.find(p => p.code === code)
    return foundProgramme ? getTextIn(foundProgramme.name, language) : code
  }

  const graphData = useMemo(
    () =>
      Object.entries(selectedFacultyProgrammesStats).map(([code, data]) => ({ name: getNameOfProgramme(code), data })),
    []
  )

  if (!Object.keys(selectedFacultyProgrammesStats).length) {
    return <Segment textAlign="center">No data</Segment>
  }

  /* eslint-disable react/prop-types */
  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: ({ code }) => (
        <div>
          {' '}
          {getNameOfProgramme(code)} <Icon name="level up alternate" onClick={() => showProgrammeOverView(code)} />
        </div>
      )
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
  /* eslint-enable react/prop-types */

  const data = Object.entries(selectedFacultyProgrammesStats).map(([code, stats]) => ({ code, stats }))
  const bachelors = data.filter(programme => programme.code.includes('KH'))
  const masters = data.filter(programme => programme.code.includes('MH'))

  return (
    <React.Fragment>
      <Header>Bachelor degrees</Header>
      <SortableTable columns={headers} getRowKey={({ code }) => code} data={bachelors} />
      <Header>Masters degrees</Header>
      <SortableTable columns={headers} getRowKey={({ code }) => code} data={masters} />
      <FacultyStatsGraph data={graphData} />
    </React.Fragment>
  )
}

FacultyStats.propTypes = {
  facultyProgrammes: arrayOf(shape({})).isRequired,
  selectedFacultyProgrammesStats: shape({}).isRequired,
  language: string.isRequired,
  fromYear: number.isRequired,
  toYear: number.isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired
}

const mapStateToProps = ({ faculties, localize }) => ({
  facultyProgrammes: faculties.facultyProgrammes,
  language: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(FacultyStats)
