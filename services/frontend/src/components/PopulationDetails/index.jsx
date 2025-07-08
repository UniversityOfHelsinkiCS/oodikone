import { useEffect, useState } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { getFullStudyProgrammeRights } from '@/util/access'
import { useCurriculumState } from '../../hooks/useCurriculums'
import { AgeStats } from './AgeStats'
import { CourseTableModeSelector } from './CourseTableModeSelector'
import { CreditGainStats } from './CreditGainStats'
import { PopulationCourses } from './PopulationCourses'

export const PopulationDetails = ({
  isLoading,
  query,
  programme,
  combinedProgramme,
  showBachelorAndMaster,
  filteredStudents,
  filteredCourses,
}) => {
  const { useFilterSelector } = useFilters()

  const { isFetching: authLoading, programmeRights, fullAccessToStudentData } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const [studentAmountLimit, setStudentAmountLimit] = useState(0)
  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(programme, query?.years?.[0])

  useEffect(() => setStudentAmountLimit(Math.floor(filteredStudents.length * 0.3)), [filteredStudents.length])

  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: programme }, { skip: !programme })
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const onStudentAmountLimitChange = value => {
    if (!Number.isNaN(Number(value))) setStudentAmountLimit(+value)
  }

  if (isLoading || authLoading) return null

  const onlyIamRights =
    !fullAccessToStudentData &&
    !fullStudyProgrammeRights.includes(programme) &&
    !fullStudyProgrammeRights.includes(combinedProgramme)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
          <CreditAccumulationGraphHighCharts
            programmeCodes={[programme, combinedProgramme].filter(Boolean)}
            showBachelorAndMaster={!!showBachelorAndMaster}
            students={filteredStudents}
            studyPlanFilterIsActive={studyPlanFilterIsActive}
          />
        </div>
      ),
    },
    {
      title: 'Credit statistics',
      content:
        query.years.length > 1 ? (
          <div>This table is omitted when searching population of multiple years</div>
        ) : (
          <CreditGainStats filteredStudents={filteredStudents} query={query} year={query.years[0]} />
        ),
    },
    {
      title: 'Age distribution',
      content: <AgeStats filteredStudents={filteredStudents} query={query} />,
    },
    {
      title: 'Courses of class',
      content: (
        <div>
          <CourseTableModeSelector
            courseTableMode={courseTableMode}
            curriculum={curriculum}
            curriculumList={curriculumList}
            onStudentAmountLimitChange={onStudentAmountLimitChange}
            setCourseTableMode={setCourseTableMode}
            setCurriculum={setCurriculum}
            studentAmountLimit={studentAmountLimit}
          />
          <PopulationCourses
            courseTableMode={courseTableMode}
            curriculum={curriculum}
            filteredCourses={filteredCourses}
            isPending={isLoading}
            onlyIamRights={onlyIamRights}
            query={query}
            studentAmountLimit={studentAmountLimit}
          />
        </div>
      ),
    },
    !onlyIamRights
      ? {
          title: `Students (${filteredStudents.length})`,
          content: (
            <div>
              <PopulationStudents
                combinedProgramme={combinedProgramme}
                criteria={criteria}
                curriculum={curriculum}
                filteredCourses={filteredCourses}
                filteredStudents={filteredStudents}
                programme={programme}
                showBachelorAndMaster={showBachelorAndMaster}
                variant="population"
              />
            </div>
          ),
        }
      : null,
  ]

  return <PanelView panels={panels} viewTitle="classstatistics" />
}
