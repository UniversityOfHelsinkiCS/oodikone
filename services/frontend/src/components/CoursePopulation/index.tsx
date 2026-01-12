import Box from '@mui/material/Box'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'

import { getStudentToTargetCourseDateMap, getUnifyTextIn } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PageTitle } from '@/components/common/PageTitle'
import { PanelView } from '@/components/common/PanelView'
import { CustomPopulationProgrammeDist } from '@/components/CustomPopulation/CustomPopulationProgrammeDist'
import { FilterView } from '@/components/FilterView'
import {
  ageFilter,
  courseFilter,
  creditsEarnedFilter,
  genderFilter,
  gradeFilter,
  programmeFilter,
  startYearAtUniFilter,
  studentNumberFilter,
} from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageLoading } from '@/components/Loading'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useTitle } from '@/hooks/title'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { parseQueryParams } from '@/util/queryparams'
import { SISStudyRightElement } from '@oodikone/shared/models'
import { FormattedStudent } from '@oodikone/shared/types'
import { StudentAmountLimiter } from '../common/StudentAmountLimiter'
import { findCorrectProgramme } from '../CustomPopulation/CustomPopulationProgrammeDist/util'
import { CoursePopulationCreditGainTable } from './CoursePopulationCreditGainTable'
import { CoursePopulationGradeDist } from './CoursePopulationGradeDist'
import { CoursePopulationLanguageDist } from './CoursePopulationLanguageDist'
import { useColumns as columnsGeneralTab } from './studentColumns'

const CourseTitle = ({ codes, dateRange, unifyCourses }) => {
  const { useFilterSelector } = useFilters()
  const { getTextIn } = useLanguage()

  const courseName = useFilterSelector(courseFilter.selectors.selectedCourseName(codes))
  const header = courseName ? `${getTextIn(courseName)} ${dateRange} ${getUnifyTextIn(unifyCourses)}` : null

  const subHeader = codes.join(', ')

  return <PageTitle subtitle={subHeader} title={header ? `Population of course ${header}` : undefined} />
}

export const CoursePopulation = () => {
  useTitle('Course population')

  const location = useLocation()
  const { getTextIn } = useLanguage()

  const [codes, setCodes] = useState<string[]>([])

  const { coursecodes, from, to, separate, unifyCourses } = parseQueryParams(location.search)

  const { data: population, isFetching } = useGetPopulationStatisticsByCourseQuery({
    coursecodes,
    from,
    to,
    separate,
    unifyCourses,
  })

  useEffect(() => {
    const parsedCourseCodes = JSON.parse(coursecodes)
    if (parsedCourseCodes.length) setCodes(parsedCourseCodes)
  }, [coursecodes])

  const studentToTargetCourseDateMap = useMemo(
    () => getStudentToTargetCourseDateMap(population?.students ?? [], codes),
    [population?.students, codes]
  )

  const { data: semesters, isFetching: semestersFetching } = useGetSemestersQuery()
  const {
    semesters: allSemesters,
    years: semesterYears,
    currentSemester,
  } = semesters ?? { semesters: {}, years: {}, currentSemester: null }

  const getFromToDates = (from: number, to: number, separate: boolean) => {
    if (semestersFetching) return {}

    const dataValues = separate ? Object.values(allSemesters) : Object.values(semesterYears)

    const key = separate ? 'semestercode' : 'yearcode'

    const findDateByCode = (code: number) => dataValues.find(item => item[key] === code)

    return {
      dateFrom: findDateByCode(Number(from))?.startdate,
      dateTo: findDateByCode(Number(to))?.enddate,
    }
  }

  const { dateFrom, dateTo } = getFromToDates(from, to, separate ? JSON.parse(separate) : false)

  // Dates must be set
  if (!dateFrom || !dateTo) return null

  const dateRange = `${new Date(dateFrom).getFullYear()}-${new Date(dateTo).getFullYear()}`

  if (!population || !semesters) return <PageLoading isLoading />

  const getStudentRelevantProgrammes = (students: FormattedStudent[]) =>
    students.reduce<Map<string, string>>((programmes, student) => {
      const programme = findCorrectProgramme(
        student,
        coursecodes,
        allSemesters,
        new Date(dateFrom),
        new Date(dateTo),
        currentSemester?.semestercode
      )

      programmes.set(student.studentNumber, getTextIn(programme.name) ?? '')
      return programmes
    }, new Map())

  const createPanels = (filteredStudents: FormattedStudent[], filteredCourses: FilteredCourse[]) => [
    {
      title: 'Grade distribution',
      content: (
        <CoursePopulationGradeDist courseCodes={codes} from={dateFrom} students={filteredStudents} to={dateTo} />
      ),
    },
    {
      title: 'Language distribution',
      content: <CoursePopulationLanguageDist codes={codes} from={dateFrom} students={filteredStudents} to={dateTo} />,
    },
    {
      title: 'Programme distribution',
      content: (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'end' }}>
            <InfoBox
              content={getTextIn(populationStatisticsToolTips.programmeDistributionCoursePopulation) ?? ''}
              sx={{ mb: 2 }}
            />
          </Box>
          <CustomPopulationProgrammeDist coursecodes={codes} from={dateFrom} students={filteredStudents} to={dateTo} />
        </>
      ),
    },
    {
      title: 'Courses of population',
      content: <CoursePopulationCoursesWrapper filteredCourses={filteredCourses} filteredStudents={filteredStudents} />,
    },
    {
      title: 'Credit gains',
      content: (
        <CoursePopulationCreditGainTable codes={codes} from={dateFrom} students={filteredStudents} to={dateTo} />
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <PopulationStudents
          filteredStudents={filteredStudents}
          generalTabColumnFunction={columnsGeneralTab}
          generalTabFormattingFunction={() =>
            formatGeneralTab({
              variant: 'coursePopulation',
              filteredStudents,

              years: [],

              programme: undefined,
              combinedProgramme: undefined,

              showBachelorAndMaster: false,
              includePrimaryProgramme: true,

              coursecodes: codes,
              from: dateFrom,
              to: dateTo,
              relatedProgrammeMap: getStudentRelevantProgrammes(filteredStudents),
            })
          }
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          variant="coursePopulation"
        />
      ),
    },
  ]

  return (
    <FilterView
      coursestatistics={population?.coursestatistics}
      displayTray={!isFetching}
      filters={[
        genderFilter(),
        studentNumberFilter(),
        ageFilter(),
        courseFilter({ courses: population?.coursestatistics.courses }),
        creditsEarnedFilter(),
        startYearAtUniFilter(),
        programmeFilter({
          additionalModes: [
            {
              key: 'attainment',
              label: 'Attainment',
              predicate: (student: FormattedStudent, studyRightElement: SISStudyRightElement) => {
                const correctProgramme = findCorrectProgramme(
                  student,
                  codes,
                  allSemesters,
                  new Date(dateFrom),
                  new Date(dateTo),
                  currentSemester?.semestercode
                )
                return correctProgramme?.code === studyRightElement.code
              },
              description: 'Student had an active study right at the time of course attainment.',
            },
          ],
        }),
        gradeFilter({
          courseCodes: codes,
          from: dateFrom,
          to: dateTo,
        }),
      ]}
      initialOptions={{
        [programmeFilter.key]: { mode: 'attainment', selectedProgrammes: [] },
      }}
      name="CoursePopulation"
      students={population?.students ?? []}
    >
      {(filteredStudents, filteredCourses) => (
        <>
          <CourseTitle codes={codes} dateRange={dateRange} unifyCourses={unifyCourses} />
          <PanelView panels={createPanels(filteredStudents, filteredCourses)} />
        </>
      )}
    </FilterView>
  )
}

const CoursePopulationCoursesWrapper = ({
  filteredCourses,
  filteredStudents,
}: {
  filteredCourses: FilteredCourse[]
  filteredStudents: FormattedStudent[]
}) => {
  const [studentAmountLimit, setStudentAmountLimit] = useDebouncedState(Math.round(filteredStudents.length * 0.3))

  const onStudentAmountLimitChange = (value: string | number) => {
    const num = Number(value)
    if (!Number.isNaN(num)) {
      setStudentAmountLimit(num)
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ flex: 1 }}>
          <StudentAmountLimiter
            onStudentAmountLimitChange={onStudentAmountLimitChange}
            studentAmountLimit={studentAmountLimit}
          />
        </Box>
        <InfoBox content={populationStatisticsToolTips.coursesOfPopulation} />
      </Box>
      <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
    </>
  )
}
