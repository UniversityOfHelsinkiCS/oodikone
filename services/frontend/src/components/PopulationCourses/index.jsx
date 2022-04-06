import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Segment, Button } from 'semantic-ui-react'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import InfoBox from '../Info/InfoBox'
import FilterDegreeCoursesModal from './FilterDegreeCoursesModal'
import { getPopulationSelectedStudentCourses } from '../../redux/populationSelectedStudentCourses'
import infotooltips from '../../common/InfoToolTips'

const PopulationCourses = ({ query = {}, filteredStudents, selectedStudentsByYear }) => {
  const [showByStudytrack, setShowByStudytrack] = useState(true)
  const populationCourses = useSelector(({ populationCourses }) => populationCourses)
  const dispatch = useDispatch()

  const populationSelectedStudentCourses = useSelector(
    ({ populationSelectedStudentCourses }) => populationSelectedStudentCourses
  )

  useEffect(() => {
    dispatch(
      getPopulationSelectedStudentCourses({
        ...query,
        studyRights: [query.studyRights.programme],
        selectedStudents: filteredStudents.map(s => s.studentNumber),
        selectedStudentsByYear,
      })
    )
  }, [query, filteredStudents])

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const { pending } = selectedPopulationCourses

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
          filteredStudents={filteredStudents}
        />
      ) : (
        <CustomPopulationCourses
          courses={selectedPopulationCourses.data}
          filteredStudents={filteredStudents}
          showFilter={false}
        />
      )}
    </Segment>
  )
}

export default PopulationCourses
