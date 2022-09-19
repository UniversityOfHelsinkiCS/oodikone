import React, { useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetFacultyGraduationTimesQuery } from 'redux/facultyStats'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import GraduationTimes from './GraduationTimes'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

const TimesAndPathsView = ({ faculty, studyProgrammes, setStudyProgrammes }) => {
  const toolTips = InfotoolTips.Faculty
  const [showMeanTime, setShowMeanTime] = useState(false)
  const [groupByGradYear, setGroupByGradYear] = useState(false)
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty?.code, studyProgrammeFilter })

  const groupBy = groupByGradYear ? 'byGradYear' : 'byStartYear'
  const label = groupByGradYear ? 'Graduation year' : 'Start year'
  const data = showMeanTime ? graduationStats?.data?.[groupBy].means : graduationStats?.data?.[groupBy].medians
  const years = graduationStats?.data?.years
  const goals = graduationStats?.data?.goals

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
      <InfoBox content={toolTips[toolTipText]} />
    </>
  )

  return (
    <div className="programmes-overview">
      <div className="toggle-container">
        <Toggle
          cypress="ProgrammeToggle"
          toolTips={toolTips.ProgrammeToggle}
          firstLabel="New study programmes"
          secondLabel="All study programmes"
          value={studyProgrammes}
          setValue={setStudyProgrammes}
        />
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <>
          {graduationStats.isSuccess && graduationStats.data && (
            <>
              {getDivider('Average graduation times', 'AverageGraduationTimes')}
              <div className="toggle-container">
                <Toggle
                  cypress="GroupByToggle"
                  firstLabel="Group by: Starting year"
                  secondLabel="Graduation year"
                  value={groupByGradYear}
                  setValue={setGroupByGradYear}
                />
                <Toggle
                  cypress="GraduationTimeToggle"
                  firstLabel="Median time"
                  secondLabel="Mean time"
                  value={showMeanTime}
                  setValue={setShowMeanTime}
                />
              </div>
              <div>
                <GraduationTimes
                  level="bachelor"
                  title="Bachelor"
                  data={data?.bachelor}
                  years={years}
                  goal={goals?.bachelor}
                  label={label}
                />
                <GraduationTimes
                  level="bcMsCombo"
                  title="Bachelor + Master"
                  data={data?.bcMsCombo}
                  years={years}
                  goal={goals?.bcMsCombo}
                  label={label}
                />
                <GraduationTimes
                  level="master"
                  title="Master"
                  data={data?.master}
                  years={years}
                  goal={goals?.master}
                  label={label}
                />
                <GraduationTimes
                  level="doctor"
                  title="Doctor"
                  data={data?.doctor}
                  years={years}
                  goal={goals?.doctor}
                  label={label}
                />
                <GraduationTimes
                  level="licentiate"
                  title="Licentiate"
                  data={data?.licentiate}
                  years={years}
                  goal={goals?.licentiate}
                  label={label}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default TimesAndPathsView
