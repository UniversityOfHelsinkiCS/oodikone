import React, { useEffect, useState } from 'react'

import { getFullStudyProgrammeRights } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { creditDateFilter, hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/Info/InfoBox'
import { PopulationStudentsContainer as PopulationStudents } from '@/components/PopulationStudents'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgressCriteriaQuery } from '@/redux/programmeProgressCriteria'
import { AgeStats } from './AgeStats'
import { CreditGainStats } from './CreditGainStats'
import { CourseTableModeSelector } from './CurriculumPicker'
import { PopulationCourses } from './PopulationCourses'

export const PopulationDetails = ({
  curriculum,
  setCurriculum,
  filteredStudents,
  queryIsSet,
  isLoading,
  query,
  dataExport,
  selectedStudentsByYear,
  programmeCodes,
}) => {
  const { isLoading: authLoading, programmeRights, fullAccessToStudentData } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const { useFilterSelector } = useFilters()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)
  const criteria = useGetProgressCriteriaQuery(
    { programmeCode: query?.studyRights?.programme },
    { skip: !query?.studyRights?.programme }
  )
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
  const RenderCreditGainGraphs = () => {
    const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

    const graphs = (
      <CreditAccumulationGraphHighCharts
        programmeCodes={programmeCodes}
        students={filteredStudents}
        studyPlanFilterIsActive={studyPlanFilterIsActive}
        title="Id"
        trayOpen={() => {}}
      />
    )
    return (
      <>
        <InfoBox content={populationStatisticsToolTips.CreditAccumulation} />
        {filteredStudents.length > 0 && graphs}
      </>
    )
  }

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  if (isLoading || !queryIsSet) {
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
      content: <div>{RenderCreditGainGraphs()}</div>,
    },
    {
      title: 'Credit statistics',
      content: !query?.years ? (
        <CreditGainStats
          creditDateFilterOptions={creditDateFilterOptions}
          filteredStudents={filteredStudents}
          query={query}
          year={query?.year}
        />
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
            dataExport={dataExport}
            filteredStudents={filteredStudents}
            programmeCode={query?.studyRights?.programme}
            variant="population"
            year={query?.year}
          />
        </div>
      ),
    })
  }
  return <PanelView panels={panels} viewTitle="classstatistics" />
}
