import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Segment, Button } from 'semantic-ui-react'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import InfoBox from '../Info/InfoBox'
import FilterDegreeCoursesModal from './FilterDegreeCoursesModal'
import infotooltips from '../../common/InfoToolTips'

const PopulationCourses = ({ selectedStudents, query = {}, filteredStudents }) => {
  const [showByStudytrack, setShowByStudytrack] = useState(true)
  const populationCourses = useSelector(({ populationCourses }) => populationCourses)
  const populationSelectedStudentCourses = useSelector(
    ({ populationSelectedStudentCourses }) => populationSelectedStudentCourses
  )

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
        <CustomPopulationCourses selectedStudents={selectedStudents} showFilter={false} />
      )}
    </Segment>
  )
}

export default PopulationCourses
