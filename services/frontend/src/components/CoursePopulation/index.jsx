import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'

import { getStudentToTargetCourseDateMap, getUnifyTextIn } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { SegmentContainer } from '@/components/common/SegmentContainer'
import {
  CustomPopulationProgrammeDist,
  findCorrectProgramme,
} from '@/components/CustomPopulation/CustomPopulationProgrammeDist'
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
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageLoading } from '@/components/material/Loading'
import { PageTitle } from '@/components/material/PageTitle'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { useTitle } from '@/hooks/title'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useGetSingleCourseStatsQuery } from '@/redux/singleCourseStats'
import { parseQueryParams } from '@/util/queryparams'
import { CoursePopulationCreditGainTable } from './CoursePopulationCreditGainTable'
import { CoursePopulationGradeDist } from './CoursePopulationGradeDist'
import { CoursePopulationLanguageDist } from './CoursePopulationLanguageDist'

import { useColumns as columnsGeneralTab } from './studentColumns'

export const CoursePopulation = () => {
  const location = useLocation()
  const { getTextIn } = useLanguage()
  const [codes, setCodes] = useState([])
  useTitle('Course population')

  const { coursecodes, from, to, separate, unifyCourses, combineSubstitutions } = parseQueryParams(location.search)

  const { data: population, isFetching } = useGetPopulationStatisticsByCourseQuery({
    coursecodes,
    from,
    to,
    separate,
    unifyCourses,
  })

  useEffect(() => {
    const parsedCourseCodes = JSON.parse(coursecodes)
    setCodes(parsedCourseCodes)
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

  const { data: [courseData] = [] } = useGetSingleCourseStatsQuery(
    { courseCodes: codes, separate, combineSubstitutions },
    { skip: codes.length === 0 }
  )

  const getFromToDates = (from, to, separate) => {
    if (semestersFetching) return {}
    const targetProp = separate ? 'semestercode' : 'yearcode'
    const data = separate ? allSemesters : semesterYears
    const dataValues = Object.values(data)
    const findDateByCode = code => dataValues.find(data => data[targetProp] === code)

    return {
      dateFrom: findDateByCode(Number(from)).startdate,
      dateTo: findDateByCode(Number(to)).enddate,
    }
  }

  const { dateFrom, dateTo } = getFromToDates(from, to, separate ? JSON.parse(separate) : false)
  const dateRange = `${new Date(dateFrom).getFullYear()}-${new Date(dateTo).getFullYear()}`

  const header = courseData
    ? `${getTextIn(courseData[unifyCourses].name)} ${dateRange} ${getUnifyTextIn(unifyCourses)}`
    : null

  const subHeader = codes.join(', ')

  if (!population || !semesters) return <PageLoading isLoading />

  const createPanels = (filteredStudents, filteredCourses) => [
    {
      title: 'Grade distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.gradeDistributionCoursePopulation} />
          <CoursePopulationGradeDist
            courseCodes={codes}
            from={dateFrom}
            singleCourseStats={courseData}
            students={filteredStudents}
            to={dateTo}
          />
        </div>
      ),
    },
    {
      title: 'Language distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.languageDistributionCoursePopulation} />
          <CoursePopulationLanguageDist codes={codes} from={dateFrom} samples={filteredStudents} to={dateTo} />
        </div>
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.programmeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist coursecode={codes} from={dateFrom} students={filteredStudents} to={dateTo} />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: <CustomPopulationCoursesWrapper filteredCourses={filteredCourses} filteredStudents={filteredStudents} />,
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
          generalTabColumnFunction={() => columnsGeneralTab()}
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
      courses={population?.coursestatistics ?? []}
      displayTray={!isFetching}
      filters={[
        genderFilter(),
        studentNumberFilter(),
        ageFilter(),
        courseFilter({ courses: population?.coursestatistics }),
        creditsEarnedFilter(),
        startYearAtUniFilter(),
        programmeFilter({
          additionalModes: [
            {
              key: 'attainment',
              label: 'Attainment',
              predicate: (student, studyRightElement) => {
                const correctProgramme = findCorrectProgramme(
                  student,
                  codes,
                  allSemesters,
                  dateFrom,
                  dateTo,
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
          <SegmentContainer>
            <PageTitle subtitle={subHeader} title={`Population of course ${header}`} />
          </SegmentContainer>
          <PanelView panels={createPanels(filteredStudents, filteredCourses)} />
        </>
      )}
    </FilterView>
  )
}

const CustomPopulationCoursesWrapper = ({ filteredCourses, filteredStudents }) => {
  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => setStudentAmountLimit(Math.round(filteredStudents.length * 0.3)), [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  return (
    <>
      <InfoBox content={populationStatisticsToolTips.coursesOfPopulation} />
      {/* FIXME:TODO: This is ripped off from CourseTableModeSelector */}
      <Stack direction="row" sx={{ alignItems: 'center', mt: '0.5em' }}>
        <Typography fontWeight={500}>Select all courses with at least</Typography>
        <TextField
          onChange={({ target }) => onStudentAmountLimitChange(target.value)}
          size="small"
          sx={{ maxWidth: '6em' }}
          type="number"
          value={studentAmountLimit}
        />
        <Typography fontWeight={500} sx={{ ml: '1em' }}>
          total students
        </Typography>
      </Stack>
      <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
    </>
  )
}
