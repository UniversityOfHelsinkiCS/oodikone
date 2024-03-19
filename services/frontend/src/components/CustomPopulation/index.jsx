import React, { useEffect, useMemo, useState } from 'react'
import { Form, Header, Input, Label, Message, Segment } from 'semantic-ui-react'

import { useProgress, useTitle } from '@/common/hooks'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { FilterView } from '@/components/FilterView'
import {
  ageFilter,
  courseFilter,
  creditDateFilter,
  creditsEarnedFilter,
  enrollmentStatusFilter,
  genderFilter,
  hopsFilter,
  programmeFilter,
  startYearAtUniFilter,
  tagsFilter,
  transferredToProgrammeFilter,
} from '@/components/FilterView/filters'
import { InfoBox } from '@/components/Info/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudentsContainer as PopulationStudents } from '@/components/PopulationStudents'
import { ProgressBar } from '@/components/ProgressBar'
import { RightsNotification } from '@/components/RightsNotification'
import { useFilteredAndFormattedElementDetails } from '@/redux/elementdetails'
import { useGetStudentListCourseStatisticsQuery } from '@/redux/populationCourses'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { CustomPopulationProgrammeDist } from './CustomPopulationProgrammeDist'
import { CustomPopulationSearch } from './CustomPopulationSearch'
import { UnihowDataExport } from './UnihowDataExport'

export const CustomPopulation = () => {
  const { language } = useLanguage()
  const [customPopulationState, setCustomPopulationState] = useState({
    selectedSearch: null,
    studentNumbers: [],
    associatedProgramme: '',
  })

  const { data } = useGetSemestersQuery()
  const allSemesters = data?.semesters ?? []

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery(
    { studentNumbers: customPopulationState.studentNumbers },
    { skip: !customPopulationState.studentNumbers.length }
  )

  const { data: studentData, isFetching } = useGetCustomPopulationQuery(
    {
      studentNumbers: customPopulationState.studentNumbers,
      tags: { studyProgramme: customPopulationState.associatedProgramme },
    },
    { skip: !customPopulationState.studentNumbers.length }
  )

  useTitle('Custom population')

  const custompop = studentData?.students ?? []
  const associatedProgramme = studentData?.studyProgramme

  const filters = useMemo(() => {
    const filtersList = [
      genderFilter,
      ageFilter,
      courseFilter({ courses: courseStats?.coursestatistics ?? [] }),
      creditsEarnedFilter,
      transferredToProgrammeFilter,
      startYearAtUniFilter,
      tagsFilter,
      programmeFilter,
      creditDateFilter,
      enrollmentStatusFilter({
        allSemesters,
        language,
      }),
    ]
    if (associatedProgramme) {
      filtersList.push(hopsFilter({ programmeCode: associatedProgramme, combinedProgrammeCode: '' }))
    }
    return filtersList
  }, [courseStats, allSemesters, associatedProgramme, language])

  return (
    <FilterView displayTray={custompop.length > 0} filters={filters} name="CustomPopulation" students={custompop}>
      {filteredStudents => (
        <CustomPopulationContent
          customPopulationState={customPopulationState}
          filteredStudents={filteredStudents}
          isFetchingPopulation={isFetching}
          setCustomPopulationState={setCustomPopulationState}
          studentData={studentData}
        />
      )}
    </FilterView>
  )
}

const CustomPopulationContent = ({
  filteredStudents,
  customPopulationState,
  studentData,
  setCustomPopulationState,
  isFetchingPopulation,
}) => {
  const studyProgrammes = useFilteredAndFormattedElementDetails()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  const discardedStudentNumbers = studentData?.discardedStudentNumbers
  const allStudents = studentData?.students ?? []
  const associatedProgramme = studentData?.studyProgramme

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery(
    { studentNumbers: filteredStudents.map(student => student.studentNumber) },
    { skip: !filteredStudents.map(student => student.studentNumber).length }
  )

  const { progress } = useProgress(isFetchingPopulation)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: <CreditAccumulationGraphHighCharts customPopulation students={filteredStudents} />,
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.ProgrammeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist studentData={studentData} students={filteredStudents} />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: (
        <>
          <InfoBox content={populationStatisticsToolTips.CoursesOfPopulation} />
          <Form style={{ padding: '4px 4px 4px 8px' }}>
            <Form.Field inline>
              <label>Limit to courses where student number is at least</label>
              <Input
                onChange={event => onStudentAmountLimitChange(event.target.value)}
                style={{ width: '70px' }}
                value={studentAmountLimit}
              />
            </Form.Field>
          </Form>
          <PopulationCourseStatsFlat
            courses={courseStats}
            filteredStudents={filteredStudents}
            studentAmountLimit={studentAmountLimit}
          />
        </>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <PopulationStudents
          customPopulationProgramme={associatedProgramme || ''}
          dataExport={<UnihowDataExport students={filteredStudents} />}
          filteredStudents={filteredStudents}
          variant="customPopulation"
        />
      ),
    },
  ]

  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px', fontSize: '16px' }}>
        <Message.Header>Custom population</Message.Header>
        <p>
          Here you can create custom population using a list of studentnumbers. Clicking the blue custom population
          button will open a modal where you can enter a list of studentnumbers. You can also save a custom population
          by giving it a name and clicking the save button in the modal. It will then appear in the saved populations
          list. These populations are personal meaning that they will only show to you. You can only search
          studentnumbers you have access rights to i.e. you have rights to the programme they are in.
        </p>
      </Message>
      {discardedStudentNumbers?.length > 0 && !isFetchingPopulation && (
        <RightsNotification discardedStudentNumbers={discardedStudentNumbers} />
      )}
      {discardedStudentNumbers?.length === 0 && filteredStudents?.length === 0 && (
        <Message>No students found. Please re-check the student number list</Message>
      )}
      <CustomPopulationSearch setCustomPopulationState={setCustomPopulationState} />
      {!isFetchingPopulation && allStudents.length ? (
        <Segment className="contentSegment">
          <div>
            <div style={{ margin: 'auto' }}>
              <Header className="segmentTitle" size="large" textAlign="center">
                Custom population
                {customPopulationState.selectedSearch && ` "${customPopulationState.selectedSearch.name}"`}
                {associatedProgramme && (
                  <Label
                    color="blue"
                    content={studyProgrammes.find(p => p.key === associatedProgramme).text}
                    style={{ marginLeft: '2em' }}
                    tag
                  />
                )}
              </Header>
            </div>
            <PanelView panels={panels} viewTitle="custompopulation" />
          </div>
        </Segment>
      ) : (
        <Segment className="contentSegment">
          <ProgressBar progress={progress} />
        </Segment>
      )}
    </div>
  )
}
