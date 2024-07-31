import { useState } from 'react'
import { Button, Divider, Loader, Popup } from 'semantic-ui-react'
import { utils, writeFile } from 'xlsx'

import { facultyToolTips } from '@/common/InfoToolTips'
import '@/components/FacultyStatistics/faculty.css'
import { InfoBox } from '@/components/Info/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import { useGetFacultyGraduationTimesQuery } from '@/redux/facultyStats'
import { getTimestamp } from '@/util/timeAndDate'
import { GraduationTimes } from './GraduationTimes'

export const TimesAndPathsView = ({ faculty, setStudyProgrammes, studyProgrammes }) => {
  const [showMedian, setShowMedian] = useState(false)
  const [groupByStartYear, setGroupByStartYear] = useState(false)
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty?.code, studyProgrammeFilter })
  const { getTextIn } = useLanguage()

  const groupBy = groupByStartYear ? 'byStartYear' : 'byGradYear'
  const yearLabel = groupByStartYear ? 'Start year' : 'Graduation year'
  const data = graduationStats?.data?.[groupBy].medians
  const goals = graduationStats?.data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty?.code === 'H30' }
  const programmeData = graduationStats?.data?.[groupBy].programmes.medians
  const programmeNames = graduationStats?.data?.programmeNames
  const classSizes = graduationStats?.data?.classSizes
  const commonProps = { yearLabel, programmeNames, showMedian, classSizes, goalExceptions }

  const isFetchingOrLoading = graduationStats.isLoading || graduationStats.isFetching

  const isError = graduationStats.isError || (graduationStats.isSuccess && !graduationStats.data)

  if (isError) {
    return <h3>Something went wrong, please try refreshing the page.</h3>
  }

  const exportToExcel = (graduationStats, programmeNames) => {
    const educationLevels = ['bachelor', 'bcMsCombo', 'master', 'doctor', 'licentiate']
    const sheetTitles = {
      bachelor: 'Bachelor',
      bcMsCombo: 'Bachelor + Master',
      master: 'Master',
      doctor: 'Doctor',
      licentiate: 'Licentiate',
    }

    const book = utils.book_new()

    educationLevels.forEach(level => {
      const levelData = graduationStats.data[groupBy]?.programmes?.medians[level]
      if (!levelData) {
        return
      }

      const sheetData = []

      Object.keys(levelData).forEach(year => {
        const yearData = levelData[year]
        const { programmes } = yearData
        const { data } = yearData

        data.forEach((item, index) => {
          sheetData.push({
            Code: programmes[index],
            Abbreviation: item.name,
            Name: getTextIn(programmeNames[programmes[index]]),
            [yearLabel]: year,
            'On time': item.statistics.onTime || 0,
            'Max. year overtime': item.statistics.yearOver || 0,
            Overtime: item.statistics.wayOver || 0,
            'Median study time (months)': item.median || 0,
          })
        })
      })

      const sheet = utils.json_to_sheet(sheetData)
      utils.book_append_sheet(book, sheet, sheetTitles[level])
    })

    writeFile(book, `oodikone_${faculty.code}_graduation_times_${getTimestamp()}.xlsx`)
  }

  const getContent = () => {
    if (isFetchingOrLoading) {
      return <Loader active style={{ marginTop: '15em' }} />
    }

    if (!(graduationStats.isSuccess && graduationStats.data)) {
      return null
    }

    return (
      <>
        <div className="divider">
          <Divider data-cy="Section-AverageGraduationTimes" horizontal>
            Average graduation times
          </Divider>
        </div>
        <div style={{ marginBottom: '3em' }}>
          <InfoBox content={facultyToolTips.AverageGraduationTimes} />
        </div>
        <Popup
          content="Download statistics as xlsx file"
          trigger={
            <Button
              data-cy="DownloadButton-AverageGraduationTimes"
              floated="right"
              icon="download"
              onClick={() => exportToExcel(graduationStats, programmeNames)}
              style={{ backgroundColor: 'white', borderRadius: 0 }}
            />
          }
        />
        <div className="toggle-container">
          <Toggle
            cypress="GraduationTimeToggle"
            firstLabel="Breakdown"
            secondLabel="Median study times"
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
        </div>
      </>
    )
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
      {getContent()}
    </div>
  )
}
