import { useEffect, useState } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox'
import { PopulationStudentsContainer as PopulationStudents } from '@/components/PopulationStudents'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { getFullStudyProgrammeRights } from '@/util/access'
import { AgeStats } from './AgeStats'
import { CourseTableModeSelector } from './CourseTableModeSelector'
import { CreditGainStats } from './CreditGainStats'
import { PopulationCourses } from './PopulationCourses'

// TODO: make a filter :D
const filterCourses = (courseStatistics, _) => {
  return courseStatistics
}

export const PopulationDetails = ({ isLoading, query, programmeCodes, filteredStudents, courses }) => {
  const { isLoading: authLoading, programmeRights, fullAccessToStudentData } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const { useFilterSelector } = useFilters()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)
  const [curriculum, setCurriculum] = useState(null)

  const filteredStudentsLength = filteredStudents?.length ?? 0
  useEffect(() => setStudentAmountLimit(filteredStudentsLength * 0.3), [filteredStudentsLength])

  const [programme, combinedProgramme] = programmeCodes
  const criteria = useGetProgressCriteriaQuery({ programmeCode: programme }, { skip: !programme })
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  if (isLoading || !Object.keys(query).length) {
    return null
  }

  const filteredCourses = filterCourses(courses, filteredStudents)

  const onlyIamRights =
    !authLoading &&
    !fullAccessToStudentData &&
    !fullStudyProgrammeRights.includes(programme) &&
    !fullStudyProgrammeRights.includes(combinedProgramme)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
          {filteredStudents.length > 0 && (
            <CreditAccumulationGraphHighCharts
              programmeCodes={programmeCodes.filter(Boolean)}
              showBachelorAndMaster={query?.showBachelorAndMaster === 'true'}
              students={filteredStudents}
              studyPlanFilterIsActive={studyPlanFilterIsActive}
            />
          )}
        </div>
      ),
    },
    {
      title: 'Credit statistics',
      content: !query?.years ? (
        <CreditGainStats filteredStudents={filteredStudents} query={query} year={query?.year} />
      ) : (
        <div>This table is omitted when searching population of multiple years</div>
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
            filteredStudents={filteredStudents}
            onStudentAmountLimitChange={onStudentAmountLimitChange}
            setCourseTableMode={setCourseTableMode}
            setCurriculum={setCurriculum}
            setStudentAmountLimit={setStudentAmountLimit}
            studentAmountLimit={studentAmountLimit}
            studyProgramme={programme}
            year={query?.year}
          />
          <PopulationCourses
            courseTableMode={courseTableMode}
            courses={filteredCourses}
            curriculum={curriculum}
            filteredStudents={filteredStudents}
            isPending={isLoading}
            onlyIamRights={onlyIamRights}
            query={query}
            studentAmountLimit={studentAmountLimit}
          />
        </div>
      ),
      alwaysRender: true,
    },
    !onlyIamRights
      ? {
          title: `Students (${filteredStudents.length})`,
          content: (
            <div>
              <PopulationStudents
                courses={filteredCourses}
                criteria={criteria?.data}
                curriculum={curriculum}
                filteredStudents={filteredStudents}
                months={query?.months ?? 0}
                programmeCode={programme}
                showBachelorAndMaster={query?.showBachelorAndMaster}
                studyRights={query?.studyRights}
                variant="population"
                year={query?.year}
              />
            </div>
          ),
        }
      : null,
  ].filter(item => !!item)

  return <PanelView panels={panels} viewTitle="classstatistics" />
}
