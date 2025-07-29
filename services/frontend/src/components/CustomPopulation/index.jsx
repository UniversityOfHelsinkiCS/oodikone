import { useEffect, useMemo, useState } from 'react'
import { Form, Header, Input, Label, Message, Segment } from 'semantic-ui-react'

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
import { InfoBox } from '@/components/InfoBox'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { ProgressBar } from '@/components/ProgressBar'
import { RightsNotification } from '@/components/RightsNotification'
import { useProgress } from '@/hooks/progress'
import { useTitle } from '@/hooks/title'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { CustomPopulationProgrammeDist } from './CustomPopulationProgrammeDist'
import { CustomPopulationSearch } from './CustomPopulationSearch'
import { UnihowDataExport } from './UnihowDataExport'

import { useColumns as columnsGeneralTab, format as formatGeneralTab } from './format/GeneralTab'

export const CustomPopulation = () => {
  const [customPopulationState, setCustomPopulationState] = useState({
    selectedSearch: null,
    studentNumbers: [],
    associatedProgramme: '',
  })

  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? { semesters: {} }

  const { data: population, isFetching } = useGetCustomPopulationQuery(
    {
      studentNumbers: customPopulationState.studentNumbers,
      tags: { studyProgramme: customPopulationState.associatedProgramme },
    },
    { skip: !customPopulationState.studentNumbers.length }
  )

  useTitle('Custom population')

  const custompop = population?.students ?? []
  const associatedProgramme = population?.studyProgramme

  const filters = useMemo(() => {
    const filtersList = [
      genderFilter(),
      ageFilter(),
      courseFilter({ courses: population?.coursestatistics ?? [] }),
      creditsEarnedFilter(),
      transferredToProgrammeFilter(),
      startYearAtUniFilter(),
      tagsFilter(),
      programmeFilter(),
      creditDateFilter(),
      enrollmentStatusFilter({
        allSemesters,
        programme: associatedProgramme,
      }),
    ]
    if (associatedProgramme) {
      filtersList.push(hopsFilter({ programmeCode: associatedProgramme, combinedProgrammeCode: '' }))
    }
    return filtersList
  }, [population, allSemesters, associatedProgramme])

  return (
    <FilterView
      courses={population?.coursestatistics ?? []}
      displayTray={custompop.length > 0}
      filters={filters}
      initialOptions={[]}
      name="CustomPopulation"
      students={custompop}
    >
      {(filteredStudents, filteredCourses) => (
        <CustomPopulationContent
          customPopulationState={customPopulationState}
          filteredCourses={filteredCourses}
          filteredStudents={filteredStudents}
          isFetchingPopulation={isFetching}
          population={population}
          setCustomPopulationState={setCustomPopulationState}
        />
      )}
    </FilterView>
  )
}

const CustomPopulationContent = ({
  filteredStudents,
  filteredCourses,
  customPopulationState,
  population,
  setCustomPopulationState,
  isFetchingPopulation,
}) => {
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  const discardedStudentNumbers = population?.discardedStudentNumbers
  const allStudents = population?.students ?? []
  const associatedProgramme = population?.studyProgramme

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

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
          <InfoBox content={populationStatisticsToolTips.programmeDistributionCustomPopulation} />
          <CustomPopulationProgrammeDist students={filteredStudents} />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: (
        <>
          <InfoBox content={populationStatisticsToolTips.coursesOfPopulation} />
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
            filteredCourses={filteredCourses}
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
          dataExport={<UnihowDataExport students={filteredStudents} />}
          filteredStudents={filteredStudents}
          variant="customPopulation"
          generalTabColumnFunction={() =>
            columnsGeneralTab({
              programme: associatedProgramme || null,
            })
          }
          generalTabFormattingFunction={() =>
            formatGeneralTab({
              programme: associatedProgramme || null,
              filteredStudents,
            })
          }
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
                    content={studyProgrammes.find(programme => programme.key === associatedProgramme).text}
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
