import Stack from '@mui/material/Stack'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { PopulationQuery } from '@/types/populationSearch'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { FilterDegreeCoursesModal } from './FilterDegreeCoursesModal'

export const PopulationCourses = ({
  isLoading,
  query,
  filteredCourses,
  onlyIamRights,
  curriculum,
  courseTableMode,
  studentAmountLimit,
  setShowModules,
  showModules,
}: {
  isLoading: boolean
  query: Pick<PopulationQuery, 'programme' | 'years'>
  filteredCourses: FilteredCourse[]
  onlyIamRights: boolean
  curriculum: ExtendedCurriculumDetails
  courseTableMode: 'curriculum' | 'all'
  studentAmountLimit: number
  setShowModules: (input: boolean) => void
  showModules: boolean
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
          courseTableMode={courseTableMode}
          curriculum={curriculum}
          filteredCourses={filteredCourses}
          onlyIamRights={onlyIamRights}
          pending={isLoading}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ) : (
        <PopulationCourseStatsFlat
          courseTableMode={courseTableMode}
          filteredCourses={filteredCourses}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
          studentAmountLimit={studentAmountLimit}
        />
      )}
    </>
  )
}
