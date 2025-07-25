import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { Form, Header, Input, Segment } from 'semantic-ui-react'
import { getStudentToTargetCourseDateMap, getUnifyTextIn } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
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
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudents } from '@/components/PopulationStudents'
import { ProgressBar } from '@/components/ProgressBar'
import { useProgress } from '@/hooks/progress'
import { useTitle } from '@/hooks/title'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useGetSingleCourseStatsQuery } from '@/redux/singleCourseStats'
import { parseQueryParams } from '@/util/queryparams'
import { CoursePopulationCreditGainTable } from './CoursePopulationCreditGainTable'
import { CoursePopulationGradeDist } from './CoursePopulationGradeDist'
import { CoursePopulationLanguageDist } from './CoursePopulationLanguageDist'

import { useColumns as columnsGeneralTab, format as formatGeneralTab } from './format/GeneralTab'

export const CoursePopulation = () => {
  const location = useLocation()
  const { getTextIn } = useLanguage()
  const [codes, setCodes] = useState([])
  useTitle('Course population')

  const { coursecodes, from, to, separate, unifyCourses, years, years2, combineSubstitutions } = parseQueryParams(
    location.search
  )

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

  const { progress } = useProgress(isFetching)
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

  const { data: [courseData = undefined] = [] } = useGetSingleCourseStatsQuery(
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

  const header = courseData
    ? `${getTextIn(courseData[unifyCourses].name)} ${years || years2} ${getUnifyTextIn(unifyCourses)}`
    : null

  const subHeader = codes.join(', ')

  if (!population || !semesters) {
    return (
      <Segment className="contentSegment">
        <ProgressBar progress={progress} />
      </Segment>
    )
  }

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
          coursecodes={codes}
          filteredStudents={filteredStudents}
          from={dateFrom}
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          to={dateTo}
          variant="coursePopulation"

          generalTabColumnFunction={() => columnsGeneralTab()}
          generalTabFormattingFunction={() => formatGeneralTab({
            from: dateFrom,
            to: dateTo,
            coursecodes: codes,
            
            filteredStudents,
          })}
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
        <div className="segmentContainer">
          <Segment className="contentSegment">
            <Header className="segmentTitle" size="large" textAlign="center">
              Population of course {header}
            </Header>
            <Header className="segmentTitle" size="medium" textAlign="center">
              {subHeader}
            </Header>
            <PanelView panels={createPanels(filteredStudents, filteredCourses)} viewTitle="coursepopulation" />
          </Segment>
        </div>
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
      <Form style={{ padding: '4px 4px 4px 8px' }}>
        <Form.Field inline>
          <label>Limit to courses where student number is at least</label>
          <Input
            onChange={event => onStudentAmountLimitChange(event.target.value)}
            style={{ width: '70px' }}
            value={studentAmountLimit}
          />
        </Form.Field>
      </Form>
      <PopulationCourseStatsFlat filteredCourses={filteredCourses} studentAmountLimit={studentAmountLimit} />
    </>
  )
}
