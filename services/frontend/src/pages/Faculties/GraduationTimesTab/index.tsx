import Stack from '@mui/material/Stack'

import { useState } from 'react'
import { utils, writeFile } from 'xlsx'

import { facultyToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { GraduationTimes, GraduationTimesProps } from '@/components/GraduationTimes'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { useGetFacultyGraduationTimesQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/types/api/faculty'
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
  const { getTextIn } = useLanguage()
  const [showMedian, setShowMedian] = useState(false)
  const [groupByStartYear, setGroupByStartYear] = useState(false)
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_DEGREE_PROGRAMMES'

  const {
    data,
    isError: queryError,
    isSuccess: querySuccess,
    isFetching
  } = useGetFacultyGraduationTimesQuery({ id: faculty?.id, studyProgrammeFilter })

  const groupBy = groupByStartYear ? ('byStartYear' as const) : ('byGradYear' as const)
  const yearLabel = groupByStartYear ? ('Start year' as const) : ('Graduation year' as const)

  const groupedData = data?.[groupBy].medians
  const goals = data?.goals
  const goalExceptions = { ...goals?.exceptions, needed: faculty?.code === 'H30' }
  const programmeData = data?.[groupBy].programmes.medians
  const classSizes = data?.classSizes

  const isError = queryError || (querySuccess && !data)

  const commonProps: Omit<GraduationTimesProps, 'data' | 'goal' | 'level' | 'title'> = {
    allowExpand: true,
    classSizes,
    goalExceptions,
    groupBy,
    isError,
    isLoading: isFetching,
    mode: 'programme',
    names: data?.programmeNames,
    showMedian,
    yearLabel,
  } as const

  const exportToExcel = () => {
    if (!data) return
    const programmeNames = data.programmeNames

    const sheetTitles = {
      bachelor: 'Bachelor',
      bcMsCombo: 'Bachelor + Master',
      master: 'Master',
      doctor: 'Doctor',
      licentiate: 'Licentiate',
    }

    const book = utils.book_new()

    Object.keys(sheetTitles).forEach(level => {
      const levelData = data[groupBy]?.programmes?.medians[level]
      if (!levelData) return

      const sheetData: Record<string, any>[] = []

      Object.keys(levelData).forEach(year => {
        const yearData = levelData[year]
        const { programmes } = yearData

        yearData.data.forEach((item, index) => {
          sheetData.push({
            Code: programmes[index],
            Abbreviation: item.name,
            Name: getTextIn(programmeNames[programmes[index]]),
            [yearLabel]: year,
            'On time': item.statistics.onTime ?? 0,
            'Max. year overtime': item.statistics.yearOver ?? 0,
            Overtime: item.statistics.wayOver ?? 0,
            'Median study time (months)': item.median ?? 0,
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
        cypress="average-graduation-times"
        exportOnClick={() => exportToExcel()}
        infoBoxContent={facultyToolTips.common.averageGraduationTimes}
        title="Average graduation times by education level"
      >
        <ToggleContainer>
          <Toggle
            cypress="graduation-time-toggle"
            disabled={isError || isFetching}
            firstLabel="Breakdown"
            secondLabel="Median study times"
            setValue={setShowMedian}
            value={showMedian}
          />
          <Toggle
            cypress="group-by-toggle"
            disabled={isError || isFetching}
            firstLabel="Group by: Graduation year"
            secondLabel="Starting year"
            setValue={setGroupByStartYear}
            value={groupByStartYear}
          />
          <Toggle
            cypress="programme-toggle"
            disabled={isError || isFetching}
            firstLabel="New degree programmes"
            infoBoxContent={facultyToolTips.common.programmeToggle}
            secondLabel="All degree programmes"
            setValue={setStudyProgrammes}
            value={studyProgrammes}
          />
        </ToggleContainer>
      </Section>
      <Stack gap={2}>
        <GraduationTimes
          data={groupedData?.bachelor}
          goal={goals?.bachelor}
          level="bachelor"
          levelProgrammeData={programmeData?.bachelor}
          title="Bachelor"
          {...commonProps}
        />
        <GraduationTimes
          data={groupedData?.bcMsCombo}
          goal={goals?.bcMsCombo}
          level="bcMsCombo"
          levelProgrammeData={programmeData?.bcMsCombo}
          title="Bachelor + Master"
          {...commonProps}
        />
        <GraduationTimes
          data={groupedData?.master}
          goal={goals?.master}
          level="master"
          levelProgrammeData={programmeData?.master}
          title="Master"
          {...commonProps}
        />
        <GraduationTimes
          data={groupedData?.doctor}
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
