import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Button } from 'semantic-ui-react'
import uuidv4 from 'uuid/v4'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import InfoBox from '../InfoBox'
import FilterDegreeCoursesModal from './FilterDegreeCoursesModal'
import useCourseFilter from '../FilterTray/filters/Courses/useCourseFilter'
import infotooltips from '../../common/InfoToolTips'

const PopulationCourses = ({
  populationSelectedStudentCourses,
  populationCourses,
  selectedStudents,
  query,
  filteredStudents,
}) => {
  const { setCoursesOnce, resetCourses, runCourseQuery } = useCourseFilter()
  const [showByStudytrack, setShowByStudytrack] = useState(true)

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const { pending } = selectedPopulationCourses

  const makeCourseQueryOpts = () => {
    const selectedStudentsByYear = {}

    if (filteredStudents && filteredStudents.length > 0) {
      filteredStudents.forEach(student => {
        if (!selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()]) {
          selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()] = []
        }
        selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
      })
    }

    return {
      ...selectedPopulationCourses.query,
      uuid: uuidv4(),
      studyRights: [query.studyRights.programme],
      selectedStudents,
      selectedStudentsByYear,
      year: query.year,
      years: query.years,
    }
  }

  /**
   * These three hooks are required to make navigation work properly (context must be emptied
   * when unmounting this view.)
   */
  useEffect(() => {
    if (filteredStudents.length) {
      runCourseQuery(makeCourseQueryOpts())
    }
  }, [filteredStudents])

  useEffect(() => {
    const { pending, error, data } = selectedPopulationCourses
    if (!pending && !error) {
      setCoursesOnce(data.coursestatistics)
    }
  }, [selectedPopulationCourses.data])

  // Clear course filter data on unmount.
  useEffect(() => {
    return resetCourses
  }, [])

  const changeStructure = () => {
    setShowByStudytrack(!showByStudytrack)
  }

  return (
    <Segment basic>
      <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      <Button primary onClick={changeStructure} style={{ marginLeft: '1em' }}>
        {showByStudytrack === true ? 'Show the most attained courses' : 'Show by programme structure'}
      </Button>
      {query.studyRights.programme && <FilterDegreeCoursesModal studyProgramme={query.studyRights.programme} />}

      <SegmentDimmer isLoading={pending} />
      {showByStudytrack ? (
        <PopulationCourseStats
          key={selectedPopulationCourses.query.uuid}
          courses={selectedPopulationCourses.data}
          query={selectedPopulationCourses.query}
          pending={pending}
          selectedStudents={selectedStudents}
        />
      ) : (
        <CustomPopulationCourses selectedStudents={selectedStudents} showFilter={false} />
      )}
    </Segment>
  )
}

PopulationCourses.defaultPropTypes = {
  query: {},
}

PopulationCourses.propTypes = {
  populationSelectedStudentCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  populationCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  query: shape({}).isRequired,
  filteredStudents: arrayOf(shape({})).isRequired,
}

const mapStateToProps = ({ populationSelectedStudentCourses, populationCourses }) => ({
  populationCourses,
  populationSelectedStudentCourses,
})

export default connect(mapStateToProps)(PopulationCourses)
