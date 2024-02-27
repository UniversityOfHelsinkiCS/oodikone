import React, { useEffect, useState } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { creditDateFilter, hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgressCriteriaQuery } from '@/redux/programmeProgressCriteria'
import { CreditAccumulationGraphHighCharts } from '../CreditAccumulationGraphHighCharts'
import { InfoBox } from '../Info/InfoBox'
import { PopulationStudentsContainer as PopulationStudents } from '../PopulationStudents'
import { AgeStats } from './AgeStats'
import { CreditGainStats } from './CreditGainStats'
import { CourseTableModeSelector } from './CurriculumPicker'
import { PopulationCourses } from './PopulationCourses'

export const PopulationDetails = ({
  allStudents,
  filteredStudents,
  queryIsSet,
  isLoading,
  query,
  dataExport,
  selectedStudentsByYear,
  programmeCodes,
}) => {
  const { isLoading: authLoading, rights, isAdmin } = useGetAuthorizedUserQuery()
  const { useFilterSelector } = useFilters()
  const [curriculum, setCurriculum] = useState(null)
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)
  const criteria = useGetProgressCriteriaQuery({ programmeCode: query?.studyRights?.programme })
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
  const RenderCreditGainGraphs = () => {
    const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={filteredStudents}
        title="Id"
        trayOpen={() => {}}
        studyPlanFilterIsActive={studyPlanFilterIsActive}
        programmeCodes={programmeCodes}
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
    !isAdmin &&
    !rights.includes(query?.studyRights?.programme) &&
    !rights.includes(query?.studyRights?.combinedProgramme)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: <div>{RenderCreditGainGraphs()}</div>,
    },
    {
      title: 'Credit statistics',
      content: !query?.years ? (
        <CreditGainStats
          query={query}
          filteredStudents={filteredStudents}
          creditDateFilterOptions={creditDateFilterOptions}
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
            setCourseTableMode={setCourseTableMode}
            year={query?.year}
            studyProgramme={query?.studyRights?.programme}
            studentAmountLimit={studentAmountLimit}
            setCurriculum={setCurriculum}
            setStudentAmountLimit={setStudentAmountLimit}
            filteredStudents={filteredStudents}
            onStudentAmountLimitChange={onStudentAmountLimitChange}
          />
          <PopulationCourses
            query={query}
            curriculum={curriculum}
            allStudents={allStudents}
            filteredStudents={filteredStudents}
            selectedStudentsByYear={selectedStudentsByYear}
            onlyIamRights={onlyIamRights}
            courseTableMode={courseTableMode}
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
            variant="population"
            filteredStudents={filteredStudents}
            dataExport={dataExport}
            criteria={criteria?.data}
            programmeCode={query?.studyRights?.programme}
            year={query?.year}
            curriculum={curriculum}
          />
        </div>
      ),
    })
  }
  return <PanelView panels={panels} viewTitle="classstatistics" />
}
