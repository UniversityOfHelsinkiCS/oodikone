import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Form, Input, Radio } from 'semantic-ui-react'
import useFilters from 'components/FilterView/useFilters'
import studyPlanFilter from 'components/FilterView/filters/hops'
import { creditDateFilter } from 'components/FilterView/filters'
import { useGetProgressCriteriaQuery } from 'redux/programmeProgressCriteria'
import PanelView from 'components/common/PanelView'
import { useGetAuthorizedUserQuery } from '../../redux/auth'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import InfoBox from '../Info/InfoBox'
import CreditGainStats from './CreditGainStats'
import AgeStats from './AgeStats'
import infotooltips from '../../common/InfoToolTips'
import CurriculumPicker from './CurriculumPicker'

const PopulationDetails = ({
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
    const { CreditAccumulation } = infotooltips.PopulationStatistics
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
        <InfoBox content={CreditAccumulation} />
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
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
              <Radio
                style={{ fontWeight: 'bold' }}
                label="Choose curriculum"
                name="coursesRadioGroup"
                value="curriculum"
                onChange={(event, { value }) => setCourseTableMode(value)}
                checked={courseTableMode === 'curriculum'}
              />
              <Radio
                style={{ fontWeight: 'bold' }}
                label="Show all courses with at least"
                name="coursesRadioGroup"
                value="all"
                onChange={(event, { value }) => setCourseTableMode(value)}
                checked={courseTableMode === 'all'}
              />
            </div>
            <div>
              <CurriculumPicker
                year={query?.year}
                programmeCodes={programmeCodes}
                setCurriculum={setCurriculum}
                disabled={courseTableMode !== 'curriculum'}
              />
              <Form style={{ padding: '4px 4px 4px 8px' }}>
                <Form.Field inline>
                  <Input
                    value={studentAmountLimit}
                    onChange={e => onStudentAmountLimitChange(e.target.value)}
                    disabled={courseTableMode !== 'all'}
                    style={{ width: '70px' }}
                  />
                  <label>total students</label>
                </Form.Field>
              </Form>
            </div>
          </div>
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
  return (
    <>
      <PanelView panels={panels} viewTitle="classstatistics" />
    </>
  )
}

export default connect(null)(PopulationDetails)
