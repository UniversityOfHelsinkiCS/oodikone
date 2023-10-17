import React, { useState, useEffect, useMemo } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import { Segment, Header, Message, Label, Form, Input } from 'semantic-ui-react'
import _ from 'lodash'
import semestersApi from 'redux/semesters'
import { useFilteredAndFormattedElementDetails } from 'redux/elementdetails'

import RightsNotification from 'components/RightsNotification'
import PopulationCourseStatsFlat from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import PanelView from 'components/common/PanelView'
import { useProgress, useTitle } from '../../common/hooks'
import infotooltips from '../../common/InfoToolTips'
import { useGetStudentListCourseStatisticsQuery } from '../../redux/populationCourses'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import CustomPopulationProgrammeDist from './CustomPopulationProgrammeDist'
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

const selectCustomPopulationData = createSelector(
  semestersApi.endpoints.getSemesters.select(),
  state => state.populations.data,
  (semesters, populations) => ({
    allSemesters: semesters?.data?.semesters ?? [],
    custompop: populations?.students ?? [],
    studyProgramme: populations?.studyProgramme,
    discardedStudentNumbers: populations?.discardedStudentNumbers,
  })
)

const CustomPopulation = () => {
  const { language } = useLanguage()

  const {
    allSemesters,
    custompop,
    studyProgramme: associatedProgramme,
    discardedStudentNumbers,
  } = useSelector(selectCustomPopulationData)

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: custompop.map(s => s.studentNumber),
  })
  useTitle('Custom population')

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
        allSemesters: allSemesters ?? [],
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
      {students => (
        <CustomPopulationContent
          discardedStudentNumbers={discardedStudentNumbers}
          students={students}
          custompop={custompop}
        />
      )}
    </FilterView>
  )
}

const CustomPopulationContent = ({ students, custompop, discardedStudentNumbers }) => {
  const [selectedCustomPopulationSearch, setSelectedCustomPopulationSearch] = useState(null)
  const studyProgrammes = useFilteredAndFormattedElementDetails()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  const handleSelectedPopulationChange = selectedPopulation => {
    setSelectedCustomPopulationSearch(selectedPopulation)
  }

  useEffect(() => {
    setStudentAmountLimit(Math.round(students.length ? students.length * 0.3 : 0))
  }, [students.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  const populations = useSelector(state => state.populations)
  const { customPopulationFlag } = populations

  const { progress } = useProgress(populations.pending)

  const { data: courseStats } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: students.map(s => s.studentNumber),
  })

  const panels = [
    {
      title: `Credit accumulation (for ${students.length} students)`,
      content: <CreditAccumulationGraphHighCharts students={students} customPopulation />,
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={infotooltips.PopulationStatistics.ProgrammeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist samples={students} selectedStudents={_.map(students, 'studentNumber')} />
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
            filteredStudents={students}
            courses={courseStats}
            studentAmountLimit={studentAmountLimit}
          />
        </>
      ),
    },
    {
      title: `Students (${students.length})`,
      content: (
        <>
          <PopulationStudents
            variant="customPopulation"
            filteredStudents={students}
            dataExport={<UnihowDataExport students={students} />}
            customPopulationProgramme={populations.data.studyProgramme || ''}
          />
        </>
      ),
    },
  ]

  const renderCustomPopulation = () => (
    <div>
      {custompop && (
        <div style={{ margin: 'auto' }}>
          <Header className="segmentTitle" size="large" textAlign="center">
            Custom population
            {selectedCustomPopulationSearch && ` "${selectedCustomPopulationSearch.name}"`}
            {populations.data.studyProgramme && (
              <Label
                style={{ marginLeft: '2em' }}
                tag
                color="blue"
                content={studyProgrammes.find(p => p.key === populations.data.studyProgramme).text}
              />
            )}
          </Header>
        </div>
      )}
      <PanelView panels={panels} viewTitle="custompopulation" />
    </div>
  )

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
      {discardedStudentNumbers?.length > 0 && !populations.pending && (
        <RightsNotification discardedStudentNumbers={discardedStudentNumbers} />
      )}
      {discardedStudentNumbers?.length === 0 && students?.length === 0 && (
        <Message>No students found. Please re-check the student number list</Message>
      )}
      <CustomPopulationSearch onPopulationChange={handleSelectedPopulationChange} />
      {custompop.length > 0 && customPopulationFlag ? (
        <Segment className="contentSegment">{renderCustomPopulation()}</Segment>
      ) : (
        <Segment className="contentSegment">
          <ProgressBar progress={progress} />
        </Segment>
      )}
    </div>
  )
}

export default CustomPopulation
