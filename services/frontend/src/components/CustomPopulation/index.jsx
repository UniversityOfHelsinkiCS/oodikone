import React, { useState, useEffect, useMemo } from 'react'
import { Segment, Header, Message, Label, Form, Input } from 'semantic-ui-react'
import { useGetSemestersQuery } from 'redux/semesters'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'

import RightsNotification from 'components/RightsNotification'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import { useGetCustomPopulationQuery } from 'redux/populations'
import { useGetStudentListCourseStatisticsQuery } from 'redux/populationCourses'
import PanelView from 'components/common/PanelView'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import { CustomPopulationProgrammeDist } from './CustomPopulationProgrammeDist'
import ProgressBar from '../ProgressBar'
import InfoBox from '../Info/InfoBox'
import FilterView from '../FilterView'
import {
  ageFilter,
  courseFilter,
  programmeFilter,
  creditsEarnedFilter,
  genderFilter,
  transferredToProgrammeFilter,
  startYearAtUniFilter,
  hopsFilter,
  tagsFilter,
  creditDateFilter,
  enrollmentStatusFilter,
} from '../FilterView/filters'
import useLanguage from '../LanguagePicker/useLanguage'
import CustomPopulationSearch from './CustomPopulationSearch'
import UnihowDataExport from './UnihowDataExport'

const CustomPopulation = () => {
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
    <FilterView name="CustomPopulation" filters={filters} students={custompop} displayTray={custompop.length > 0}>
      {filteredStudents => (
        <CustomPopulationContent
          filteredStudents={filteredStudents}
          studentData={studentData}
          customPopulationState={customPopulationState}
          setCustomPopulationState={setCustomPopulationState}
          isFetchingPopulation={isFetching}
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

  const discardedStudentNumbers = studentData?.discardedStudentNumber
  const allStudents = studentData?.students ?? []
  const associatedProgramme = studentData?.studyProgramme

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery(
    { studentNumbers: filteredStudents.map(s => s.studentNumber) },
    { skip: !filteredStudents.map(s => s.studentNumber).length }
  )

  const { progress } = useProgress(isFetchingPopulation)

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: <CreditAccumulationGraphHighCharts students={filteredStudents} customPopulation />,
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist students={filteredStudents} studentData={studentData} />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: (
        <>
          <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
          <Form style={{ padding: '4px 4px 4px 8px' }}>
            <Form.Field inline>
              <label>Limit to courses where student number is at least</label>
              <Input
                value={studentAmountLimit}
                onChange={e => onStudentAmountLimitChange(e.target.value)}
                style={{ width: '70px' }}
              />
            </Form.Field>
          </Form>
          <PopulationCourseStatsFlat
            filteredStudents={filteredStudents}
            courses={courseStats}
            studentAmountLimit={studentAmountLimit}
          />
        </>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <PopulationStudents
          variant="customPopulation"
          filteredStudents={filteredStudents}
          dataExport={<UnihowDataExport students={filteredStudents} />}
          customPopulationProgramme={associatedProgramme || ''}
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
                    style={{ marginLeft: '2em' }}
                    tag
                    color="blue"
                    content={studyProgrammes.find(p => p.key === associatedProgramme).text}
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

export default CustomPopulation
