import { Segment } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { FilterDegreeCoursesModal } from './FilterDegreeCoursesModal'

export const PopulationCourses = ({
  isPending,
  query,
  filteredCourses,
  filteredStudents,
  onlyIamRights,
  curriculum,
  courseTableMode,
  studentAmountLimit,
}) => (
  <Segment basic>
    <div style={{ display: 'flex' }}>
      {courseTableMode === 'curriculum' ? (
        <div style={{ marginBottom: '20px', marginRight: '10px' }}>
          <InfoBox content={populationStatisticsToolTips.coursesOfClass} />
        </div>
      ) : (
        <div style={{ marginBottom: '20px', marginRight: '10px' }}>
          <InfoBox content={populationStatisticsToolTips.coursesOfPopulation} />
        </div>
      )}
      {query.studyRights.programme && !onlyIamRights && (
        <div style={{ marginBottom: '20px' }}>
          <FilterDegreeCoursesModal studyProgramme={query.studyRights.programme} year={query.year} />
        </div>
      )}
    </div>
    <SegmentDimmer isLoading={isPending} />
    {courseTableMode === 'curriculum' ? (
      <PopulationCourseStats
        curriculum={curriculum}
        filteredCourses={filteredCourses}
        onlyIamRights={onlyIamRights}
        pending={isPending}
      />
    ) : (
      <PopulationCourseStatsFlat
        filteredCourses={filteredCourses}
        filteredStudents={filteredStudents}
        studentAmountLimit={studentAmountLimit}
      />
    )}
  </Segment>
)
