import { useState } from 'react'
import { Divider, Loader, Message } from 'semantic-ui-react'

import { getGraduationGraphTitle } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { CreditsProduced } from '@/components/common/CreditsProduced'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { BreakdownBarChart } from '@/components/StudyProgramme/BreakdownBarChart'
import { MedianTimeBarChart } from '@/components/StudyProgramme/MedianTimeBarChart'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import '@/components/StudyProgramme/studyprogramme.css'
import { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } from '@/redux/studyProgramme'
import { getTimestamp } from '@/util/timeAndDate'
import { BarChart } from './BarChart'
import { DataTable } from './DataTable'
import { LineGraph } from './LineGraph'
import { StackedBarChart } from './StackedBarChart'

const getDivider = (title, toolTipText) => (
  <>
    <div className="divider">
      <Divider data-cy={`Section-${toolTipText}`} horizontal>
        {title}
      </Divider>
    </div>
    <div style={{ marginBottom: '1em' }}>
      <InfoBox content={studyProgrammeToolTips[toolTipText]} />
    </div>
  </>
)

const isNewProgramme = code => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code)

const getGraduatedText = code => {
  if (code.slice(0, 1) === 'T' || code.slice(0, 3) === 'LIS') {
    return 'Graduated of the programme'
  }
  return 'Graduated and thesis writers of the programme'
}

export const BasicOverview = ({
  academicYear,
  combinedProgramme,
  setAcademicYear,
  setSpecialGroupsExcluded,
  specialGroupsExcluded,
  studyprogramme,
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const { getTextIn } = useLanguage()
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const special = specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const basics = useGetBasicStatsQuery({
    id: studyprogramme,
    combinedProgramme,
    yearType,
    specialGroups: special,
  })
  const credits = useGetCreditStatsQuery({
    codes: [studyprogramme, combinedProgramme].filter(Boolean),
    isAcademicYear: academicYear,
    specialGroups: !specialGroupsExcluded,
  })
  const graduations = useGetGraduationStatsQuery({
    id: studyprogramme,
    combinedProgramme,
    yearType,
    specialGroups: special,
  })

  const doCombo = graduations?.data?.doCombo
  const timesData = graduations?.data?.graduationTimes
  const timesDataSecondProgramme = graduations?.data?.graduationTimesSecondProgramme

  const displayMedian = () => (
    <>
      {doCombo && (
        <MedianTimeBarChart
          byStartYear={false}
          data={graduations?.data?.comboTimes?.medians}
          goal={graduations?.data?.comboTimes?.goal}
          title={getGraduationGraphTitle(studyprogramme, doCombo)}
        />
      )}
      {studyprogramme !== 'MH90_001' && (
        <MedianTimeBarChart
          byStartYear={false}
          data={timesData?.medians}
          goal={graduations?.data.graduationTimes?.goal}
          title={getGraduationGraphTitle(studyprogramme)}
        />
      )}
      {combinedProgramme && (
        <MedianTimeBarChart
          byStartYear={false}
          data={timesDataSecondProgramme?.medians}
          goal={graduations?.data.graduationTimesSecondProgramme?.goal}
          title={getGraduationGraphTitle(combinedProgramme, true)}
        />
      )}
    </>
  )

  const displayBreakdown = () => (
    <>
      {doCombo && (
        <BreakdownBarChart
          data={graduations?.data?.comboTimes?.medians}
          title={getGraduationGraphTitle(studyprogramme, doCombo)}
        />
      )}
      {studyprogramme !== 'MH90_001' && (
        <BreakdownBarChart data={timesData?.medians} title={getGraduationGraphTitle(studyprogramme)} />
      )}
      {combinedProgramme && (
        <BreakdownBarChart
          data={timesDataSecondProgramme?.medians}
          title={getGraduationGraphTitle(combinedProgramme, true)}
        />
      )}
    </>
  )

  const isFetchingOrLoading =
    basics.isLoading ||
    credits.isLoading ||
    graduations.isLoading ||
    basics.isFetching ||
    credits.isFetching ||
    graduations.isFetching

  const isError =
    (basics.isError && credits.isError && graduations.isError) ||
    (basics.isSuccess &&
      !basics.data &&
      credits.isSuccess &&
      !credits.data &&
      graduations.isSuccess &&
      !graduations.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <div className="studyprogramme-overview">
      <div className="toggle-container">
        <Toggle
          cypress="YearToggle"
          firstLabel="Calendar year"
          secondLabel="Academic year"
          setValue={setAcademicYear}
          toolTips={studyProgrammeToolTips.yearToggle}
          value={academicYear}
        />
        <Toggle
          cypress="StudentToggle"
          firstLabel="All study rights"
          secondLabel="Special study rights excluded"
          setValue={setSpecialGroupsExcluded}
          toolTips={studyProgrammeToolTips.studentToggle}
          value={specialGroupsExcluded}
        />
      </div>
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          {!isNewProgramme(studyprogramme) && (
            <Message>
              Please note, that the data is complete only for current Bachelor, Masters and Doctoral programmes
            </Message>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Students of the study programme', 'studentsOfTheStudyProgramme')}
              <div className="section-container">
                <LineGraph
                  cypress="StudentsOfTheStudyProgramme"
                  data={basics?.data}
                  exportFileName={`oodikone_StudentsOfTheStudyProgramme_${studyprogramme}_${getTimestamp()}`}
                />
                <DataTable
                  cypress="StudentsOfTheStudyProgramme"
                  data={basics?.data?.tableStats}
                  titles={basics?.data?.titles}
                />
              </div>
            </>
          )}
          {credits?.data?.stats?.[studyprogramme]?.stats && (
            <>
              {getDivider('Credits produced by the study programme', 'creditsProducedByTheStudyProgramme')}
              <CreditsProduced
                academicYear={academicYear}
                data={credits?.data?.stats?.[studyprogramme]?.stats}
                secondData={credits?.data?.stats?.[combinedProgramme]?.stats}
              />
            </>
          )}
          {graduations.isSuccess && graduations.data && (
            <>
              {getDivider(getGraduatedText(studyprogramme), 'graduatedAndThesisWritersOfTheProgramme')}
              <div className="section-container">
                <BarChart cypress="GraduatedAndThesisWritersOfTheProgramme" data={graduations?.data} />
                <DataTable
                  cypress="GraduatedAndThesisWritersOfTheProgramme"
                  data={graduations?.data?.tableStats}
                  titles={graduations?.data?.titles}
                />
              </div>
              {getDivider('Average graduation times by year of graduation', 'averageGraduationTimes')}
              <div className="toggle-container">
                <Toggle
                  cypress="GraduationTimeToggle"
                  firstLabel="Breakdown"
                  secondLabel="Median time"
                  setValue={setShowMedian}
                  value={showMedian}
                />
              </div>
              <div className={`section-container${doCombo ? '' : '-centered'}`}>
                {showMedian ? displayMedian() : displayBreakdown()}
              </div>
              {graduations?.data?.programmesBeforeOrAfterGraphStats?.length && (
                <>
                  {getDivider(
                    studyprogramme.includes('KH')
                      ? 'Primary master programme studies after this programme'
                      : 'Primary bachelor programme studies before this programme',
                    'programmesBeforeOrAfter'
                  )}
                  <div className="section-container">
                    <StackedBarChart
                      cypress="ProgrammesBeforeOrAfter"
                      data={graduations?.data?.programmesBeforeOrAfterGraphStats.map(programme => ({
                        ...programme,
                        name: getTextIn(programme.name),
                      }))}
                      labels={graduations?.data?.years}
                      wideTable
                    />
                    <DataTable
                      data={graduations?.data?.programmesBeforeOrAfterTableStats.map(programme =>
                        programme.with(2, getTextIn(programme[2]))
                      )}
                      titles={graduations?.data?.programmesBeforeOrAfterTitles}
                      wideTable
                    />
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
