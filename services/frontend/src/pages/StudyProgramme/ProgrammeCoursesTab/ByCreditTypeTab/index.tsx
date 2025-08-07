import Stack from '@mui/material/Stack'

import { max, min } from 'lodash'
import { useEffect, useState } from 'react'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import { useGetProgrammeCoursesStatsQuery } from '@/redux/studyProgramme'
import { CourseYearFilter } from './CourseYearFilter'
import { OverallStatsTable } from './OverallStatsTable'

type YearOption = {
  key: number
  text: string
  value: number
}

export const ByCreditTypeTab = ({
  academicYear,
  combinedProgramme,
  setAcademicYear,
  studyProgramme,
}: {
  academicYear: boolean
  combinedProgramme: string
  studyProgramme: string
  setAcademicYear: (value: boolean) => void
}) => {
  const { data, isError, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    yearType: academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
  })

  const [fromYear, setFromYear] = useState<number | null>(null)
  const [toYear, setToYear] = useState<number | null>(null)
  const [years, setYears] = useState<{ academic: YearOption[]; calendar: YearOption[] } | null>(null)
  const [showStudents, setShowStudents] = useState(false)

  useEffect(() => {
    if (!data) {
      return
    }
    const yearCodes = [...new Set(data.map(course => Object.keys(course.years)).flat())]
    const initFromYear = Number(min(yearCodes))
    const initToYear = Number(max(yearCodes))
    if (!fromYear) {
      setFromYear(initFromYear)
    }
    if (!toYear) {
      setToYear(initToYear)
    }
    const academic: YearOption[] = []
    const calendar: YearOption[] = []
    for (let i = initFromYear; i <= initToYear; i++) {
      academic.push({ key: i, text: `${i}-${i + 1}`, value: i })
      calendar.push({ key: i, text: i.toString(), value: i })
    }
    if (!fromYear && !toYear) {
      setYears({ academic, calendar })
    }
  }, [data, fromYear, toYear])

  const handleFromYearChange = event => {
    const year = event.target.value
    if (toYear && year <= toYear) {
      setFromYear(year)
    }
  }

  const handleToYearChange = event => {
    const year = event.target.value
    if (fromYear && year >= fromYear) {
      setToYear(year)
    }
  }

  return (
    <Section
      cypress="by-credit-type"
      // TODO: exportOnClick={}
      infoBoxContent={
        showStudents
          ? studyProgrammeToolTips.studentsOfProgrammeCourses
          : studyProgrammeToolTips.creditsOfProgrammeCourses
      }
      isError={isError}
      isLoading={isLoading || !fromYear || !toYear || !years}
      title="Programme courses by credit type"
    >
      {data && fromYear && toYear && years ? (
        <Stack gap={2}>
          <CourseYearFilter
            academicYear={academicYear}
            fromYear={fromYear}
            handleFromYearChange={handleFromYearChange}
            handleToYearChange={handleToYearChange}
            setAcademicYear={setAcademicYear}
            toYear={toYear}
            years={academicYear ? years.academic : years.calendar}
          />
          <ToggleContainer>
            <Toggle
              cypress="show-credits-students-toggle"
              firstLabel="Show credits"
              secondLabel="Show students"
              setValue={setShowStudents}
              value={showStudents}
            />
          </ToggleContainer>
          <OverallStatsTable data={data} fromYear={fromYear} showStudents={showStudents} toYear={toYear} />
        </Stack>
      ) : null}
    </Section>
  )
}
