import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Segment, Button } from 'semantic-ui-react'
// import uuidv4 from 'uuid/v4'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import InfoBox from '../Info/InfoBox'
import FilterDegreeCoursesModal from './FilterDegreeCoursesModal'
import infotooltips from '../../common/InfoToolTips'

const PopulationCourses = ({ selectedStudents, query = {}, filteredStudents }) => {
  // FIXME const { setCoursesOnce, resetCourses, runCourseQuery } = useCourseFilter()
  const [showByStudytrack, setShowByStudytrack] = useState(true)
  const populationCourses = useSelector(({ populationCourses }) => populationCourses)
  const populationSelectedStudentCourses = useSelector(
    ({ populationSelectedStudentCourses }) => populationSelectedStudentCourses
  )

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const { pending } = selectedPopulationCourses

  /* const makeCourseQueryOpts = () => {
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
  } */

  /**
   * These three hooks are required to make navigation work properly (context must be emptied
   * when unmounting this view.)
   */
  useEffect(() => {
    if (filteredStudents.length) {
      // FIXME: runCourseQuery(makeCourseQueryOpts())
    }
  }, [filteredStudents])

  useEffect(() => {
    const { pending, error /* , data */ } = selectedPopulationCourses
    if (!pending && !error) {
      // FIXME setCoursesOnce(data.coursestatistics)
    }
  }, [selectedPopulationCourses.data])

  // Clear course filter data on unmount.
  useEffect(() => {
    return () => {} // FIXME: resetCourses
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
          pending={pending}
          selectedStudents={selectedStudents}
        />
      ) : (
        <CustomPopulationCourses selectedStudents={selectedStudents} showFilter={false} />
      )}
    </Segment>
  )
}

export default PopulationCourses
