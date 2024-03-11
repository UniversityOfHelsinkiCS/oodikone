import React, { useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { facultyToolTips } from '@/common/InfoToolTips'
import '@/components/FacultyStatistics/faculty.css'
import { InfoBox } from '@/components/Info/InfoBox'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import { useGetFacultyGraduationTimesQuery } from '@/redux/facultyStats'
import { GraduationTimes } from './GraduationTimes'

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
              setValue={setShowMedian}
              value={showMedian}
            />
            <Toggle
              cypress="GroupByToggle"
              firstLabel="Group by: Graduation year"
              secondLabel="Starting year"
              setValue={setGroupByStartYear}
              value={groupByStartYear}
            />
          </div>
          <div>
            <GraduationTimes
              data={data?.bachelor}
              goal={goals?.bachelor}
              level="bachelor"
              levelProgrammeData={programmeData?.bachelor}
              title="Bachelor"
              {...commonProps}
            />
            <GraduationTimes
              data={data?.bcMsCombo}
              goal={goals?.bcMsCombo}
              groupBy={groupBy}
              level="bcMsCombo"
              levelProgrammeData={programmeData?.bcMsCombo}
              title="Bachelor + Master"
              {...commonProps}
            />
            <GraduationTimes
              data={data?.master}
              goal={goals?.master}
              level="master"
              levelProgrammeData={programmeData?.master}
              title="Master"
              {...commonProps}
            />
            <GraduationTimes
              data={data?.doctor}
              goal={goals?.doctor}
              level="doctor"
              levelProgrammeData={programmeData?.doctor}
              title="Doctor"
              {...commonProps}
            />
            <GraduationTimes
              data={data?.licentiate}
              goal={goals?.licentiate}
              level="licentiate"
              levelProgrammeData={programmeData?.licentiate}
              title="Licentiate"
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
      <div className="toggle-container" style={{ marginTop: '30px' }}>
        <Toggle
          cypress="ProgrammeToggle"
          firstLabel="New study programmes"
          secondLabel="All study programmes"
          setValue={setStudyProgrammes}
          toolTips={facultyToolTips.ProgrammeToggle}
          value={studyProgrammes}
        />
      </div>
      {isFetchingOrLoading ? <Loader active style={{ marginTop: '15em' }} /> : <>{getContent()}</>}
    </div>
  )
}
