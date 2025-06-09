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

export const PopulationDetails = ({ filteredStudents, isLoading, programmeCodes, query, selectedStudentsByYear }) => {
  const { isLoading: authLoading, programmeRights, fullAccessToStudentData } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const { useFilterSelector } = useFilters()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)
  const [curriculum, setCurriculum] = useState(null)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const criteria = useGetProgressCriteriaQuery(
    { programmeCode: query?.studyRights?.programme },
    { skip: !query?.studyRights?.programme }
  )
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  if (isLoading || !Object.keys(query).length) {
    return null
  }

  const onlyIamRights =
    !authLoading &&
    !fullAccessToStudentData &&
    !fullStudyProgrammeRights.includes(query?.studyRights?.programme) &&
    !fullStudyProgrammeRights.includes(query?.studyRights?.combinedProgramme)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
          {filteredStudents.length > 0 && (
            <CreditAccumulationGraphHighCharts
              programmeCodes={programmeCodes}
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
            studyProgramme={query?.studyRights?.programme}
            year={query?.year}
          />
          <PopulationCourses
            courseTableMode={courseTableMode}
            curriculum={curriculum}
            filteredStudents={filteredStudents}
            onlyIamRights={onlyIamRights}
            query={query}
            selectedStudentsByYear={selectedStudentsByYear}
            studentAmountLimit={studentAmountLimit}
          />
        </div>
      ),
      alwaysRender: true,
    },
  ]

  if (!onlyIamRights) {
    panels.push({
      title: `Students (${filteredStudents.length})`,
      content: (
        <div>
          <PopulationStudents
            criteria={criteria?.data}
            curriculum={curriculum}
            filteredStudents={filteredStudents}
            months={query?.months ?? 0}
            programmeCode={query?.studyRights?.programme}
            showBachelorAndMaster={query?.showBachelorAndMaster}
            studyRights={query?.studyRights}
            variant="population"
            year={query?.year}
          />
        </div>
      ),
    })
  }
  return <PanelView panels={panels} viewTitle="classstatistics" />
}
