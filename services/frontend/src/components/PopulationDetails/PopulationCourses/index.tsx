import Stack from '@mui/material/Stack'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { PopulationQuery } from '@/types/populationSearch'
import { FormattedCourse } from '@oodikone/shared/types'
import { FilterDegreeCoursesModal } from './FilterDegreeCoursesModal'

export const PopulationCourses = ({
  isLoading,
  query,
  filteredCourses,
  onlyIamRights,
  curriculum,
  courseTableMode,
  studentAmountLimit,
}: {
  isLoading: boolean
  query: Pick<PopulationQuery, 'programme' | 'years'>
  filteredCourses: FormattedCourse[]
  onlyIamRights: boolean
  curriculum: ExtendedCurriculumDetails
  courseTableMode: 'curriculum' | 'all'
  studentAmountLimit: number
}) => {
  const tooltipText =
    courseTableMode === 'curriculum'
      ? populationStatisticsToolTips.coursesOfClass
      : populationStatisticsToolTips.coursesOfPopulation

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ my: 1, justifyContent: 'space-between' }}>
        {query.programme && !onlyIamRights ? (
          <FilterDegreeCoursesModal degreeProgramme={query.programme} years={query.years} />
        ) : null}
        <InfoBox content={tooltipText} />
      </Stack>
      <SegmentDimmer isLoading={isLoading} />
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats
          curriculum={curriculum}
          filteredCourses={filteredCourses}
          onlyIamRights={onlyIamRights}
          pending={isLoading}
        />
      ) : (
        <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
      )}
    </>
  )
}
