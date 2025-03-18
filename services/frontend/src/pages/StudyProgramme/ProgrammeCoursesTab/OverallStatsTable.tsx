import { Stack } from '@mui/material'
import { max, min, range } from 'lodash'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Item, Icon } from 'semantic-ui-react'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { GetTextIn, useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import { SortableTable } from '@/components/SortableTable'
import { useGetProgrammeCoursesStatsQuery } from '@/redux/studyProgramme'
import { StudyProgrammeCourse } from '@/shared/types'
import { CourseYearFilter } from './CourseYearFilter'

const getColumns = (getTextIn: GetTextIn, showStudents: boolean) => {
  let columns = null

  if (showStudents) {
    columns = [
      {
        key: 'code',
        title: 'Code',
        getRowVal: course => course.code,
        formatValue: code => (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
            {code}
            <Item
              as={Link}
              target="_blank"
              to={`/coursestatistics?courseCodes=["${encodeURIComponent(code)}"]&separate=false&unifyOpenUniCourses=false`}
            >
              <Icon name="level up alternate" />
            </Item>
          </div>
        ),
      },
      {
        key: 'name',
        title: 'Name',
        helpText: studyProgrammeToolTips.name,
        getRowVal: course => getTextIn(course.name),
        formatValue: name => (
          <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        ),
        cellProps: course => {
          return { title: getTextIn(course.name) }
        },
      },
      {
        key: 'total',
        title: 'Total',
        filterType: 'range',
        getRowVal: course => course.totalAllStudents,
      },
      {
        key: 'breakdown',
        title: 'Breakdown of total',
        parent: true,
        sortable: false,
        filterable: false,
        children: [
          {
            key: 'passed',
            title: 'Passed',
            filterType: 'range',
            getRowVal: course => course.totalAllPassed,
          },
          {
            key: 'not-completed',
            title: 'Not\ncompleted',
            filterType: 'range',
            getRowVal: course => course.totalAllNotCompleted,
          },
        ],
      },
      {
        key: 'breakdown-passed',
        title: 'Breakdown of passed students',
        parent: true,
        sortable: false,
        filterable: false,
        children: [
          {
            key: 'totalOwnProgramme',
            title: 'Major\nstudents',
            filterType: 'range',
            getRowVal: course => course.totalProgrammeStudents,
          },
          {
            key: 'totalOtherProgramme',
            title: 'Non-major\nstudents',
            filterType: 'range',
            getRowVal: course => course.totalOtherProgrammeStudents,
          },
          {
            key: 'totalWithoutStudyRight',
            title: 'Non-degree\nstudents',
            filterType: 'range',
            getRowVal: course => course.totalWithoutStudyRightStudents,
          },
        ],
      },
      {
        key: 'exluded',
        title: 'Not included in\ntotal nor passed',
        parent: true,
        sortable: false,
        filterable: false,
        children: [
          {
            key: 'transfer',
            title: 'Transferred\nstudents',
            helpText: studyProgrammeToolTips.transferredCourses,
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalTransferStudents,
          },
        ],
      },
    ]
  } else {
    columns = [
      {
        key: 'code',
        title: 'Code',
        getRowVal: course => course.code,
        formatValue: code => (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
            {code}
            <Item
              as={Link}
              target="_blank"
              to={`/coursestatistics?courseCodes=["${encodeURIComponent(code)}"]&separate=false&unifyOpenUniCourses=false`}
            >
              <Icon name="level up alternate" />
            </Item>
          </div>
        ),
      },
      {
        key: 'name',
        title: 'Name',
        helpText: studyProgrammeToolTips.name,
        getRowVal: course => getTextIn(course.name),
        formatValue: name => (
          <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        ),
        cellProps: course => ({
          title: getTextIn(course.name),
        }),
      },
      {
        key: 'total',
        title: 'Total\ncredits',
        filterType: 'range',
        getRowVal: course => course.totalAllCredits,
      },
      {
        key: 'totalOwnProgramme',
        title: 'Major\ncredits',
        filterType: 'range',
        getRowVal: course => course.totalProgrammeCredits,
      },
      {
        key: 'totalOtherProgramme',
        title: 'Non-major\ncredits',
        filterType: 'range',
        getRowVal: course => course.totalOtherProgrammeCredits,
      },
      {
        key: 'totalWithoutStudyRight',
        title: 'Non-degree\ncredits',
        filterType: 'range',
        getRowVal: course => course.totalWithoutStudyRightCredits,
      },
      {
        key: 'totalTransfer',
        title: 'Transferred\ncredits',
        filterType: 'range',
        getRowVal: course => course.totalTransferCredits,
      },
    ]
  }
  const typeColumn = {
    key: 'type',
    title: 'Type',
    getRowVal: course => (course.isStudyModule ? 'Module' : 'Course'),
  }
  return [...columns, typeColumn]
}

const filterDataByYear = (data: StudyProgrammeCourse[], fromYear: number, toYear: number) => {
  const yearRange = range(fromYear, Number(toYear) + 1)
  const filteredAndMergedCourses = data
    .filter(course => {
      const arr = Object.keys(course.years).some(key => yearRange.includes(Number(key)))
      return arr
    })
    .map(course => {
      const values = Object.entries(course.years).reduce(
        (acc, curr) => {
          if (yearRange.includes(Number(curr[0]))) {
            acc.totalAllStudents += curr[1].totalAllStudents
            acc.totalAllPassed += curr[1].totalPassed
            acc.totalAllNotCompleted += curr[1].totalNotCompleted
            acc.totalAllCredits += curr[1].totalAllCredits
            acc.totalProgrammeStudents += curr[1].totalProgrammeStudents
            acc.totalProgrammeCredits += curr[1].totalProgrammeCredits
            acc.totalOtherProgrammeStudents += curr[1].totalOtherProgrammeStudents
            acc.totalOtherProgrammeCredits += curr[1].totalOtherProgrammeCredits
            acc.totalWithoutStudyRightStudents += curr[1].totalWithoutStudyRightStudents
            acc.totalWithoutStudyRightCredits += curr[1].totalWithoutStudyRightCredits
            acc.totalTransferCredits += curr[1].totalTransferCredits
            acc.totalTransferStudents += curr[1].totalTransferStudents
          }

          return acc
        },
        {
          totalAllStudents: 0,
          totalAllPassed: 0,
          totalAllNotCompleted: 0,
          totalAllCredits: 0,
          totalProgrammeStudents: 0,
          totalProgrammeCredits: 0,
          totalOtherProgrammeStudents: 0,
          totalOtherProgrammeCredits: 0,
          totalWithoutStudyRightStudents: 0,
          totalWithoutStudyRightCredits: 0,
          totalTransferCredits: 0,
          totalTransferStudents: 0,
        }
      )
      return {
        ...values,
        code: course.code,
        name: course.name,
        isStudyModule: course.isStudyModule,
      }
    })

  return filteredAndMergedCourses
}

type YearOption = {
  key: number
  text: string
  value: number
}

export const OverallStatsTable = ({
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
  const { getTextIn } = useLanguage()
  const { data, isError, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    yearType: academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
  })

  const [fromYear, setFromYear] = useState<number | null>(null)
  const [toYear, setToYear] = useState<number | null>(null)
  const [years, setYears] = useState<Record<string, YearOption[]>>({})
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
      infoBoxContent={
        showStudents
          ? studyProgrammeToolTips.studentsOfProgrammeCourses
          : studyProgrammeToolTips.creditsOfProgrammeCourses
      }
      isError={isError}
      isLoading={isLoading || !fromYear || !toYear || !years}
      title="Programme courses by credit type"
    >
      {data && fromYear && toYear && years && (
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
              cypress="creditsStudentsToggle"
              firstLabel="Show credits"
              secondLabel="Show students"
              setValue={setShowStudents}
              value={showStudents}
            />
          </ToggleContainer>
          <SortableTable
            columns={getColumns(getTextIn, showStudents)}
            data={filterDataByYear(data, fromYear, toYear)}
            defaultSort={['name', 'asc']}
            featureName="programme_courses"
            title="Student statistics for study programme courses"
          />
        </Stack>
      )}
    </Section>
  )
}
