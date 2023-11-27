import React, { useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetFacultyGraduationTimesQuery } from 'redux/facultyStats'
import { facultyToolTips } from 'common/InfoToolTips'
import { Toggle } from '../../StudyProgramme/Toggle'
import { InfoBox } from '../../Info/InfoBox'
import { GraduationTimes } from './GraduationTimes'
import '../faculty.css'

export const TimesAndPathsView = ({ faculty, studyProgrammes, setStudyProgrammes }) => {
  const [showMedian, setShowMedian] = useState(false)
  const [groupByStartYear, setGroupByStartYear] = useState(false)
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty?.code, studyProgrammeFilter })

  const groupBy = groupByStartYear ? 'byStartYear' : 'byGradYear'
  const label = groupByStartYear ? 'Start year' : 'Graduation year'
  const data = graduationStats?.data?.[groupBy].medians
  const goals = graduationStats?.data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty?.code === 'H30' }
  const programmeData = graduationStats?.data?.[groupBy].programmes.medians
  const programmeNames = graduationStats?.data?.programmeNames
  const classSizes = graduationStats?.data?.classSizes
  const commonProps = { label, programmeNames, showMedian, classSizes, goalExceptions }

  const isFetchingOrLoading = graduationStats.isLoading || graduationStats.isFetching

  const isError = graduationStats.isError || (graduationStats.isSuccess && !graduationStats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content={facultyToolTips[toolTipText]} />
    </>
  )

  const getContent = () => {
    if (isFetchingOrLoading) {
      return <Loader active style={{ marginTop: '15em' }} />
    }
    if (graduationStats.isSuccess && graduationStats.data) {
      return (
        <>
          {getDivider('Average graduation times', 'AverageGraduationTimes')}
          <div className="toggle-container">
            <Toggle
              cypress="GraduationTimeToggle"
              firstLabel="Breakdown"
              secondLabel="Median times"
              value={showMedian}
              setValue={setShowMedian}
            />
            <Toggle
              cypress="GroupByToggle"
              firstLabel="Group by: Graduation year"
              secondLabel="Starting year"
              value={groupByStartYear}
              setValue={setGroupByStartYear}
            />
          </div>
          <div>
            <GraduationTimes
              level="bachelor"
              title="Bachelor"
              data={data?.bachelor}
              goal={goals?.bachelor}
              levelProgrammeData={programmeData?.bachelor}
              {...commonProps}
            />
            <GraduationTimes
              level="bcMsCombo"
              title="Bachelor + Master"
              data={data?.bcMsCombo}
              goal={goals?.bcMsCombo}
              levelProgrammeData={programmeData?.bcMsCombo}
              groupBy={groupBy}
              {...commonProps}
            />
            <GraduationTimes
              level="master"
              title="Master"
              data={data?.master}
              goal={goals?.master}
              levelProgrammeData={programmeData?.master}
              {...commonProps}
            />
            <GraduationTimes
              level="doctor"
              title="Doctor"
              data={data?.doctor}
              goal={goals?.doctor}
              levelProgrammeData={programmeData?.doctor}
              {...commonProps}
            />
            <GraduationTimes
              level="licentiate"
              title="Licentiate"
              data={data?.licentiate}
              goal={goals?.licentiate}
              levelProgrammeData={programmeData?.licentiate}
              {...commonProps}
            />
          </div>
        </>
      )
    }
    return null
  }

  return (
    <div className="programmes-overview">
      <div className="toggle-container">
        <Toggle
          cypress="ProgrammeToggle"
          toolTips={facultyToolTips.ProgrammeToggle}
          firstLabel="New study programmes"
          secondLabel="All study programmes"
          value={studyProgrammes}
          setValue={setStudyProgrammes}
        />
      </div>

      {isFetchingOrLoading ? <Loader active style={{ marginTop: '15em' }} /> : <>{getContent()}</>}
    </div>
  )
}
