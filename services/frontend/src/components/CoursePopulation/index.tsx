import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { getStudentToCourseCompletionDateTimeMap, getUnifyTextIn } from '@/common'
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
import { PopulationStudents } from '@/components/PopulationComponents/Students'
import { useFormat as formatGeneralTab } from '@/components/PopulationComponents/Students/Table/GeneralTab/format'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useTitle } from '@/hooks/title'
import { useSemesters } from '@/hooks/useSemesters'
import { useGetCourseDetailsQuery } from '@/redux/courseStats'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { useParseQueryParams } from '@/util/queryparams'
import { SISStudyRightElement } from '@oodikone/shared/models'
import { FormattedStudent } from '@oodikone/shared/types'
import { getFromToDates, getStudentRelevantProgrammes } from './util'

export const CoursePopulation = () => {
  'use memo'
  useTitle('Course population')

  const { getTextIn } = useLanguage()

  const params = useParseQueryParams()
  const courses = params.courses
  const from = params.from?.[0]
  const to = params.to?.[0]
  const separate = params.separate?.[0]
  const substitutions = params.substitutions?.[0]
  const unifyCourses = params.unifyCourses?.[0]

  const { data: population, isFetching: populationFetching } = useGetPopulationStatisticsByCourseQuery(
    {
      courses: courses?.[0],
      from,
      to,
      separate,
      unifyCourses,
      substitutions,
    },
    {
      skip: !courses?.length || !from || !to,
    }
  )

  const { data: courseDetails } = useGetCourseDetailsQuery({ courses: courses ?? [] }, { skip: !courses?.length })

  const {
    semesters: allSemesters,
    years: semesterYears,
    currentSemester,
    isLoading: semestersFetching,
  } = useSemesters()

  const isSeparate = separate === 'true'

  if (!courses?.length) return null
  if (populationFetching || !population || semestersFetching || !currentSemester) return <PageLoading isLoading />

  const populationCourseIds = Object.keys(population.idToGroupIdMap)

  // Dates must be set
  const { dateFrom, dateTo } = getFromToDates(Number(from), Number(to), isSeparate, allSemesters, semesterYears)
  if (!dateFrom || !dateTo) return null

  const singleSemester =
    from === to && isSeparate ? Object.values(allSemesters).find(s => s.semestercode === Number(from)) : null
  const dateRange = singleSemester
    ? (getTextIn(singleSemester.name) ?? '')
    : `${new Date(dateFrom).getFullYear()}-${new Date(dateTo).getFullYear()}`

  // Page title data
  const courseNames = courseDetails?.map(({ name }) => getTextIn(name)) ?? []
  const header = courseNames.length ? `${courseNames?.join(', ')}` : undefined

  const getRelatedProgrammeMap = getStudentRelevantProgrammes(
    populationCourseIds,
    allSemesters,
    dateFrom,
    dateTo,
    currentSemester.semestercode,
    getTextIn
  )

  const studentToTargetCourseDateMap = getStudentToCourseCompletionDateTimeMap(
    population.students ?? [],
    populationCourseIds
  )
  const createPanels = (filteredStudents: FormattedStudent[], filteredCourses: FilteredCourse[]) => [
    {
      title: 'Grade distribution',
      content: (
        <CoursePopulationGradeDist
          courseIds={populationCourseIds}
          from={dateFrom}
          students={filteredStudents}
          to={dateTo}
        />
      ),
    },
    {
      title: 'Language distribution',
      content: (
        <CoursePopulationLanguageDist
          courseIds={populationCourseIds}
          from={dateFrom}
          students={filteredStudents}
          to={dateTo}
        />
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <CustomPopulationProgrammeDist
          courseIds={populationCourseIds}
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
          courseIds={populationCourseIds}
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

              courseIds: populationCourseIds,
              from: dateFrom,
              to: dateTo,
              relatedProgrammeMap: getRelatedProgrammeMap(filteredStudents),
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
    courseFilter({
      courses: population?.coursestatistics.courses ?? [],
      includeSubstitutions: substitutions === 'true',
      idToGroupIdMap: population?.coursestatistics.idToGroupIdMap ?? {},
    }),
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
              populationCourseIds,
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
      courseIds: populationCourseIds,
      from: dateFrom,
      to: dateTo,
    }),
  ]

  const courseCodes = courses
    .map(course => courseDetails?.find(cd => cd.groupId === course)?.code)
    .filter(Boolean)
    .join(', ')

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
              {courseCodes}
            </Typography>
            <Typography
              color="text.secondary"
              variant="h6"
            >{`Class of ${dateRange}, ${population.students.length} students`}</Typography>
            <Typography color="text.secondary" variant="h6">
              {`Substitutions ${substitutions === 'true' ? 'included' : 'excluded'}, ${getUnifyTextIn(unifyCourses)}`}
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
