import { Stack } from '@mui/material'
import { useState } from 'react'
import { utils, writeFile } from 'xlsx'

import { facultyToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { GraduationTimes } from '@/components/material/FacultyGraduations/GraduationTimes'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { useGetFacultyGraduationTimesQuery } from '@/redux/facultyStats'
import { Name } from '@/shared/types'
import { GetFacultiesResponse, GetFacultyGraduationTimesResponse } from '@/types/api/faculty'
import { getTimestamp } from '@/util/timeAndDate'

export const GraduationTimesTab = ({
  faculty,
  setStudyProgrammes,
  studyProgrammes,
}: {
  faculty: GetFacultiesResponse
  setStudyProgrammes: (value: boolean) => void
  studyProgrammes: boolean
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const [groupByStartYear, setGroupByStartYear] = useState(false)
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty?.id, studyProgrammeFilter })
  const { getTextIn } = useLanguage()

  const groupBy = groupByStartYear ? ('byStartYear' as const) : ('byGradYear' as const)
  const yearLabel = groupByStartYear ? ('Start year' as const) : ('Graduation year' as const)
  const data = graduationStats?.data?.[groupBy].medians
  const goals = graduationStats?.data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty?.code === 'H30' }
  const programmeData = graduationStats?.data?.[groupBy].programmes.medians
  const programmeNames = graduationStats?.data?.programmeNames
  const classSizes = graduationStats?.data?.classSizes
  const isError = graduationStats.isError || (graduationStats.isSuccess && !graduationStats.data)
  const isLoading = graduationStats.isLoading || graduationStats.isFetching
  const commonProps = {
    classSizes,
    goalExceptions,
    groupBy,
    isError,
    isLoading,
    mode: 'programme' as const,
    names: programmeNames,
    showMedian,
    yearLabel,
  }

  const exportToExcel = (data?: GetFacultyGraduationTimesResponse, programmeNames?: Record<string, Name>) => {
    if (!data || !programmeNames) {
      return
    }

    const educationLevels = ['bachelor', 'bcMsCombo', 'master', 'doctor', 'licentiate'] as const
    const sheetTitles = {
      bachelor: 'Bachelor',
      bcMsCombo: 'Bachelor + Master',
      master: 'Master',
      doctor: 'Doctor',
      licentiate: 'Licentiate',
    }

    const book = utils.book_new()

    educationLevels.forEach(level => {
      const levelData = data[groupBy]?.programmes?.medians[level]
      if (!levelData) {
        return
      }

      const sheetData: Record<string, any>[] = []

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

  return (
    <Stack gap={2}>
      <Section
        cypress="Section-AverageGraduationTimes"
        exportOnClick={() => exportToExcel(graduationStats.data, programmeNames)}
        infoBoxContent={facultyToolTips.averageGraduationTimes}
        title="Average graduation times by education level"
      >
        <Stack alignItems="center" direction="column" gap={2} justifyContent="space-around">
          <Toggle
            cypress="GraduationTimeToggle"
            disabled={isError || isLoading}
            firstLabel="Breakdown"
            secondLabel="Median study times"
            setValue={setShowMedian}
            value={showMedian}
          />
          <Toggle
            cypress="GroupByToggle"
            disabled={isError || isLoading}
            firstLabel="Group by: Graduation year"
            secondLabel="Starting year"
            setValue={setGroupByStartYear}
            value={groupByStartYear}
          />
          <Toggle
            cypress="ProgrammeToggle"
            disabled={isError || isLoading}
            firstLabel="New study programmes"
            infoBoxContent={facultyToolTips.programmeToggle}
            secondLabel="All study programmes"
            setValue={setStudyProgrammes}
            value={studyProgrammes}
          />
        </Stack>
      </Section>
      <Stack gap={2}>
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
      </Stack>
    </Stack>
  )
}
