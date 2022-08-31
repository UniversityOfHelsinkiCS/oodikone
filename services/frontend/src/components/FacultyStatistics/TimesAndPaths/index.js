import React, { useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetFacultyGraduationTimesQuery } from 'redux/facultyStats'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
// import ProgrammeSelector from './ProgrammeSelector'
import GraduationTimes from './GraduationTimes'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

const getDivider = (title, toolTipText) => (
  <>
    <div className="divider">
      <Divider data-cy={`Section-${toolTipText}`} horizontal>
        {title}
      </Divider>
    </div>
    <InfoBox content="Keskimääräiset valmistumisajat" />
    {/* <InfoBox content={toolTips[toolTipText]} /> */}
  </>
)

const TimesAndPathsView = ({ faculty, studyProgrammes, setStudyProgrammes }) => {
  const toolTipsProgramme = InfotoolTips.Faculty
  // const [programme, setProgramme] = useState(faculty)
  const [showMeanTime, setShowMeanTime] = useState(false)
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty?.code, studyProgrammeFilter })

  const isFetchingOrLoading = graduationStats.isLoading || graduationStats.isFetching

  const isError = graduationStats.isError || (graduationStats.isSuccess && !graduationStats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <div className="programmes-overview">
      <div className="toggle-container">
        <Toggle
          cypress="ProgrammeToggle"
          toolTips={toolTipsProgramme.ProgrammeToggle}
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
              {/* <ProgrammeSelector programme={programme} setProgramme={setProgramme} programmes={graduationStats?.data} /> */}
              <Toggle
                cypress="GraduationTimeToggle"
                firstLabel="Median time"
                secondLabel="Mean time"
                value={showMeanTime}
                setValue={setShowMeanTime}
              />
              <div>
                <GraduationTimes
                  level="bachelor"
                  title="Bachelor (36 kk)"
                  years={graduationStats?.data?.years}
                  amounts={graduationStats?.data.graduationAmounts.bachelor}
                  data={showMeanTime ? graduationStats?.data?.means.bachelor : graduationStats?.data?.medians.bachelor}
                />
                <GraduationTimes
                  level="bcMsCombo"
                  title="Bachelor + Master (60 kk)"
                  years={graduationStats?.data?.years}
                  amounts={graduationStats?.data.graduationAmounts.bcMsCombo}
                  data={
                    showMeanTime ? graduationStats?.data?.means?.bcMsCombo : graduationStats?.data?.medians?.bcMsCombo
                  }
                />
                <GraduationTimes
                  level="master"
                  title="Master (24 kk)"
                  years={graduationStats?.data?.years}
                  amounts={graduationStats?.data.graduationAmounts.master}
                  data={showMeanTime ? graduationStats?.data?.means?.master : graduationStats?.data?.medians?.master}
                />
                <GraduationTimes
                  level="doctor"
                  title="Doctor (48 kk)"
                  years={graduationStats?.data?.years}
                  amounts={graduationStats?.data.graduationAmounts.doctor}
                  data={showMeanTime ? graduationStats?.data?.means?.doctor : graduationStats?.data?.medians?.doctor}
                />
                <GraduationTimes
                  level="licentiate"
                  title="Licentiate (78 kk)"
                  years={graduationStats?.data?.years}
                  amounts={graduationStats?.data.graduationAmounts.licentiate}
                  data={
                    showMeanTime ? graduationStats?.data?.means?.licentiate : graduationStats?.data?.medians?.licentiate
                  }
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
