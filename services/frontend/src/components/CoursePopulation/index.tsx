import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'

import { getStudentToTargetCourseDateMap, getUnifyTextIn } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PageTitle } from '@/components/common/PageTitle'
import { PanelView } from '@/components/common/PanelView'
import { StudentAmountLimiter } from '@/components/common/StudentAmountLimiter'
import { CoursePopulationCreditGainTable } from '@/components/CoursePopulation/CoursePopulationCreditGainTable'
import { CoursePopulationGradeDist } from '@/components/CoursePopulation/CoursePopulationGradeDist'
import { CoursePopulationLanguageDist } from '@/components/CoursePopulation/CoursePopulationLanguageDist'
import { useColumns as columnsGeneralTab } from '@/components/CoursePopulation/studentColumns'
import { FilterView } from '@/components/FilterView'
import {
  ageFilter,
  courseFilter,
  creditsEarnedFilter,
  genderFilter,
  hetuFilter,
  gradeFilter,
  programmeFilter,
  startYearAtUniFilter,
  studentNumberFilter,
} from '@/components/FilterView/filters'
import type { GenericFilter } from '@/components/FilterView/filters/createFilter'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageLoading } from '@/components/Loading'
import { CustomPopulationProgrammeDist } from '@/components/PopulationComponents/ProgrammeDist'
import { findCorrectProgramme } from '@/components/PopulationComponents/ProgrammeDist/util'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useTitle } from '@/hooks/title'
import { useSemesters } from '@/hooks/useSemesters'
import { useGetCourseDetailsQuery } from '@/redux/courseStats'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { parseQueryParams } from '@/util/queryparams'
import { SISStudyRightElement } from '@oodikone/shared/models'
import { FormattedStudent } from '@oodikone/shared/types'

export const CoursePopulation = () => {
  useTitle('Course population')

  const location = useLocation()
  const { getTextIn } = useLanguage()

  const [codes, setCodes] = useState<{ allCodes: string[]; mainCodes: string[] }>({
    allCodes: [],
    mainCodes: [],
  })

  const { coursecodes, from, to, separate, unifyCourses, includeSubstitutions } = parseQueryParams(location.search)

  const { data: courseDetails } = useGetCourseDetailsQuery({ codes: codes.mainCodes })
  const { data: population } = useGetPopulationStatisticsByCourseQuery({
    coursecodes,
    from,
    to,
    separate,
    unifyCourses,
    includeSubstitutions,
  })

  useEffect(() => {
    const parsedCourseCodes = JSON.parse(coursecodes)
    if (parsedCourseCodes.length) setCodes({ ...codes, mainCodes: parsedCourseCodes })
  }, [coursecodes])

  useEffect(() => {
    if (population?.allCourseCodes?.length) setCodes({ ...codes, allCodes: population.allCourseCodes })
  }, [population])

  const studentToTargetCourseDateMap = useMemo(
    () => getStudentToTargetCourseDateMap(population?.students ?? [], codes.allCodes),
    [population?.students, codes]
  )

  const {
    semesters: allSemesters,
    years: semesterYears,
    currentSemester,
    isLoading: semestersFetching,
  } = useSemesters()

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

  const isSeparate = separate ? JSON.parse(separate) : false
  const { dateFrom, dateTo } = getFromToDates(from, to, isSeparate)

  // Dates must be set
  if (!dateFrom || !dateTo) return null

  const singleSemester =
    from === to && isSeparate ? Object.values(allSemesters).find(s => s.semestercode === Number(from)) : null
  const dateRange = singleSemester
    ? (getTextIn(singleSemester.name) ?? '')
    : `${new Date(dateFrom).getFullYear()}-${new Date(dateTo).getFullYear()}`

  if (!population || !currentSemester) return <PageLoading isLoading />

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

  // Page title data
  const courseNames = courseDetails?.map(({ name }) => getTextIn(name)) ?? []
  const header = courseNames.length ? `${courseNames?.join(', ')}` : undefined

  const createPanels = (filteredStudents: FormattedStudent[], filteredCourses: FilteredCourse[]) => [
    {
      title: 'Grade distribution',
      content: (
        <CoursePopulationGradeDist
          courseCodes={codes.allCodes}
          from={dateFrom}
          students={filteredStudents}
          to={dateTo}
        />
      ),
    },
    {
      title: 'Language distribution',
      content: (
        <CoursePopulationLanguageDist codes={codes.allCodes} from={dateFrom} students={filteredStudents} to={dateTo} />
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <CustomPopulationProgrammeDist
          coursecodes={codes.allCodes}
          from={dateFrom}
          infotext={populationStatisticsToolTips.programmeDistributionCoursePopulation}
          students={filteredStudents}
          to={dateTo}
        />
      ),
    },
    {
      title: 'Courses of population',
      content: <CoursePopulationCoursesWrapper filteredCourses={filteredCourses} filteredStudents={filteredStudents} />,
    },
    {
      title: 'Credit gains',
      content: (
        <CoursePopulationCreditGainTable
          codes={codes.allCodes}
          from={dateFrom}
          students={filteredStudents}
          to={dateTo}
        />
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

              coursecodes: codes.allCodes,
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

  const filters: GenericFilter[] = [
    genderFilter(),
    studentNumberFilter(),
    ageFilter(),
    courseFilter({ courses: population?.coursestatistics.courses }),
    creditsEarnedFilter(),
    hetuFilter(),
    startYearAtUniFilter(),
    programmeFilter({
      additionalModes: [
        {
          key: 'attainment',
          label: 'Attainment',
          predicate: (student: FormattedStudent, studyRightElement: SISStudyRightElement) => {
            const correctProgramme = findCorrectProgramme(
              student,
              codes.allCodes,
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
      courseCodes: codes.allCodes,
      from: dateFrom,
      to: dateTo,
    }),
  ]

  return (
    <FilterView
      coursestatistics={population?.coursestatistics}
      filters={filters}
      initialOptions={{
        [programmeFilter.key]: { mode: 'attainment', selectedProgrammes: [] },
      }}
      students={population?.students ?? []}
    >
      {(filteredStudents, filteredCourses) => (
        <>
          <PageTitle title={header}>
            <Typography color="text.secondary" variant="h6">
              {codes.mainCodes.join(', ')}
            </Typography>
            <Typography
              color="text.secondary"
              variant="h6"
            >{`Class of ${dateRange}, ${population.students.length} students`}</Typography>
            <Typography color="text.secondary" variant="h6">
              {(includeSubstitutions === 'true' ? 'Include' : 'Exclude') +
                ' substitutions, ' +
                getUnifyTextIn(unifyCourses)}
            </Typography>
          </PageTitle>
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
        <InfoBox content={populationStatisticsToolTips.coursesOfClass.showAllWithAtLeast} />
      </Box>
      <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
    </>
  )
}
