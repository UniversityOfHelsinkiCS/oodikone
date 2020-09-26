import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { string, arrayOf, shape, number } from 'prop-types'
import { Segment, Icon, Header, Item } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import { calculateStatsForProgramme, calculateTotalPassedCourses, calculateTotalFailedCourses } from '../facultyUtils'
import SortableTable from '../../SortableTable'
import FacultyStatsGraph from '../FacultyStatsGraph'
import useLanguage from '../../LanguagePicker/useLanguage'

const ShowProgrammeOverView = ({ code }) => {
  return (
    <Item as={Link} title={`Overview of study programme ${code}`} to={`/study-programme/${code}`}>
      <Icon name="level up alternate" />
    </Item>
  )
}

ShowProgrammeOverView.propTypes = {
  code: string.isRequired
}

const FacultyStats = ({ facultyProgrammes, selectedFacultyProgrammesStats, fromYear, toYear }) => {
  const { language } = useLanguage()
  const totalStats = useMemo(
    () =>
      Object.entries(selectedFacultyProgrammesStats).reduce((res, [code, stats]) => {
        res[code] = calculateStatsForProgramme(stats, fromYear, toYear)
        return { ...res }
      }, {}),
    [fromYear, toYear]
  )

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
      getRowVal: ({ code }) => code,
      getRowContent: ({ code }) => (
        <div>
          {' '}
          {getNameOfProgramme(code)} <ShowProgrammeOverView code={code} />
        </div>
      )
    },
    {
      key: 'code',
      title: 'code',
      getRowVal: ({ code }) => code
    },
    {
      key: 'studentCredits',
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
    },
    {
      key: 'students',
      title: 'Students',
      getRowVal: ({ code }) => totalStats[code].totalStudents.length
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
  fromYear: number.isRequired,
  toYear: number.isRequired
}

const mapStateToProps = ({ faculties }) => ({
  facultyProgrammes: faculties.facultyProgrammes
})

export default connect(mapStateToProps)(FacultyStats)
