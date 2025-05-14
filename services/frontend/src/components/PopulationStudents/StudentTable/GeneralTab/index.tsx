import { useSelector } from 'react-redux'
import { getStudentTotalCredits, getHighestGradeOfCourseBetweenRange } from '@/common'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { useCurrentSemester } from '@/hooks/currentSemester'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { formatDate } from '@/util/timeAndDate'
import { createMaps } from './columnHelpers/createMaps'
import { getSemestersPresentFunctions } from './columnHelpers/semestersPresent'

import { GeneralTab } from './GeneralTab'

export type FormattedStudentData = {
  firstNames: string
  lastName: string
  studentNumber: string
  sisuID: string
  email: string
  phoneNumber: string
  creditsTotal: number
  creditsHops: number
  creditsCombinedProg?: number
  creditsSince: number
  studyRightStart: string
  programmeStart: string
  option: string
  semesterEnrollments: { exportValue: number; content: JSX.Element | null }
  graduationDate: string
  graduationDateCombinedProg?: string | null
  startYearAtUniversity: number | string
  primaryProgramme?: string
  programmes: { programmes: string[]; programmeList: string; exportValue: string }
  transferredFrom: string
  admissionType: string | null
  gender: string
  citizenships: string[]
  curriculumPeriod: string
  mostRecentAttainment: string
  tags: string | null
  extent?: string
  studyTrack?: string | null
  updatedAt?: string
  grade?: string
  attainmentDate?: string
  enrollmentDate?: string
  language?: string
}

export const GeneralTabContainer = ({
  filteredStudents,
  customPopulationProgramme,
  group,
  year,
  variant,
  courseCode,
  from,
  to,
}) => {
  const { getTextIn } = useLanguage()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const currentSemester = useCurrentSemester()
  const { data: semesterData } = useGetSemestersQuery()
  const allSemesters = Object.values(semesterData?.semesters ?? {})
  const allSemestersMap = allSemesters.reduce((obj, cur, index) => {
    obj[index + 1] = cur
    return obj
  }, {})

  const { data: programmes = {} } = useGetProgrammesQuery()

  const { useFilterSelector } = useFilters()

  // @ts-expect-error add typing
  const { query } = useSelector(({ populations }) => populations)

  const queryStudyrights = Object.values(query?.studyRights ?? {}).filter(studyright => !!studyright) as string[]
  const degreeProgrammeTypes = useDegreeProgrammeTypes(queryStudyrights)
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)

  const studyGuidanceGroupProgrammes = group?.tags?.studyProgramme?.includes('+')
    ? group?.tags?.studyProgramme.split('+')
    : [group?.tags?.studyProgramme]
  const programmeCode = query?.studyRights?.programme || studyGuidanceGroupProgrammes[0] || customPopulationProgramme

  const isMastersProgramme = degreeProgrammeTypes[programmeCode] === 'urn:code:degree-program-type:masters-degree'

  const fromSemester = from
    ? Object.values(semesterData?.semesters ?? {})
        .filter(({ startdate }) => new Date(startdate) <= new Date(from))
        .sort((a, b) => +new Date(b.startdate) - +new Date(a.startdate))[0]?.semestercode
    : null

  const toSemester = to
    ? Object.values(semesterData?.semesters ?? {})
        .filter(({ enddate }) => new Date(enddate) >= new Date(to))
        .sort((a, b) => +new Date(a.enddate) - +new Date(b.enddate))[0]?.semestercode
    : null

  const getTransferredFrom = (student: any) =>
    getTextIn(programmes[student.transferSource]?.name) ?? student.transferSource

  const showBachelorAndMaster = query?.showBachelorAndMaster === 'true'

  const getStudyRight = student => {
    const code = programmeCode ?? studentToPrimaryProgrammeMap[student.studentNumber]?.code
    return student.studyRights.find(studyRight => studyRight.studyRightElements.some(element => element.code === code))
  }

  const createSemesterEnrollmentsMap = student => {
    const semesterEnrollments = getStudyRight(student)?.semesterEnrollments
    if (!semesterEnrollments) return null

    return semesterEnrollments.reduce((enrollments, { type, semester, statutoryAbsence }) => {
      enrollments[semester] = {
        enrollmenttype: type,
        statutoryAbsence: statutoryAbsence ?? false,
      }
      return enrollments
    }, {})
  }

  const selectedStudentNumbers = filteredStudents.map(student => student.studentNumber)
  const students = filteredStudents.reduce((acc, student) => {
    acc[student.studentNumber] = {
      ...student,
      semesterEnrollmentsMap: programmeCode != null ? createSemesterEnrollmentsMap(student) : null,
    }
    return acc
  }, {})

  const combinedProgrammeCode = query?.studyRights?.combinedProgramme
    ? query.studyRights.combinedProgramme
    : studyGuidanceGroupProgrammes.length > 1
      ? studyGuidanceGroupProgrammes[1]
      : null

  const getCombinedProgrammeCredits = student =>
    student.studyplans?.find(plan => {
      if (combinedProgrammeCode) {
        return plan.programme_code === combinedProgrammeCode
      }
      const studyRightIdOfProgramme = student.studyRights.find(studyRight =>
        studyRight.studyRightElements?.some(element => element.code === programmeCode)
      )?.id
      return plan.sis_study_right_id === studyRightIdOfProgramme && plan.programme_code !== programmeCode
    })?.completed_credits ?? 0

  const shouldShowAdmissionType =
    parseInt(query?.year, 10) >= 2020 || parseInt(group?.tags?.year, 10) >= 2020 || variant === 'customPopulation'
  const getAdmissiontype = student => {
    const studyRight = getStudyRight(student)
    const admissionType = studyRight?.admissionType ?? 'Ei valintatapaa'
    return admissionType !== 'Koepisteet' ? admissionType : 'Valintakoe'
  }

  const getGender = genderCode => {
    const genders = {
      0: 'Unknown',
      1: 'Male',
      2: 'Female',
      3: 'Other',
    }
    return genders[genderCode]
  }

  const getMostRecentAttainment = student => {
    const code = programmeCode ?? studentToPrimaryProgrammeMap[student.studentNumber]?.code
    const studyPlan = student.studyplans.find(plan => plan.programme_code === code) ?? null
    if (!studyPlan) return ''

    const { included_courses } = studyPlan
    const dates = student.courses
      .filter(course => included_courses.includes(course.course_code) && course.passed === true)
      .map(course => course.date)
    if (!dates.length) return ''
    const latestDate = dates.sort((a, b) => +new Date(b) - +new Date(a))[0]
    return formatDate(latestDate, DateFormat.ISO_DATE)
  }

  const parseTags = tags => {
    const studentTags = tags.map(tag => tag.tag.tagname)
    return studentTags.join(', ')
  }

  const getStartingYear = ({ started }) => (started ? new Date(started).getFullYear() : '')

  const getGraduationDate = ({ studentNumber }) =>
    studentToStudyrightEndMap[studentNumber]
      ? formatDate(studentToStudyrightEndMap[studentNumber], DateFormat.ISO_DATE)
      : ''

  const getCreditsFromHops = student => {
    const code = programmeCode ?? studentToPrimaryProgrammeMap[student.studentNumber]?.code
    return student.hopsCredits ?? student.studyplans?.find(plan => plan.programme_code === code)?.completed_credits ?? 0
  }

  const getCreditsBetween = student => {
    if (group?.tags?.year) {
      return getStudentTotalCredits({
        ...student,
        courses: student.courses.filter(course => new Date(course.date) > new Date(group?.tags?.year, 7, 1)),
      })
    }

    let { sinceDate, untilDate } = creditDateFilterOptions ?? {}

    if (!sinceDate && !untilDate) {
      return getStudentTotalCredits({
        ...student,
        courses: student.courses.filter(
          course =>
            new Date(course.date).getTime() >= new Date(studentToProgrammeStartMap[student.studentNumber]).getTime()
        ),
      })
    }

    sinceDate = sinceDate ?? new Date(1970, 0, 1)
    untilDate = untilDate ?? new Date()

    return getStudentTotalCredits({
      ...student,
      courses: student.courses.filter(
        course => new Date(course.date) >= sinceDate && new Date(course.date) <= untilDate
      ),
    })
  }

  const getCreditsSinceDisplayText = () => {
    if (creditDateFilterOptions) {
      const { startDate, endDate } = creditDateFilterOptions

      if (startDate && endDate) {
        return `Credits between ${formatDate(startDate, DateFormat.DISPLAY_DATE)} and ${formatDate(endDate, DateFormat.DISPLAY_DATE)}`
      } else if (startDate) {
        return `Credits since ${formatDate(startDate, DateFormat.DISPLAY_DATE)}`
      } else if (group?.tags?.year) {
        if (endDate) {
          return `Credits between 1.8.${group.tags.year} and ${formatDate(endDate, DateFormat.DISPLAY_DATE)}`
        } else {
          return `Credits since 1.8.${group.tags.year}`
        }
      } else if (endDate) {
        return `Credits before ${formatDate(endDate, DateFormat.DISPLAY_DATE)}`
      }
    }
    if (variant === 'studyGuidanceGroupPopulation') {
      return 'Credits since 1.1.1970'
    }
    return 'Credits since start in programme'
  }

  const getSecondaryProgCreditsDisplayText = () => {
    if (combinedProgrammeCode === 'MH90_001') return 'Credits in licentiate HOPS'
    if (isMastersProgramme) return 'Credits in Bachelor HOPS'
    return 'Credits in Master HOPS'
  }
  const getSecondaryEndDateDisplayText = () => {
    if (combinedProgrammeCode === 'MH90_001') return 'Licentiate graduation date'
    if (isMastersProgramme) return 'Bachelor graduation date'
    return 'Master graduation date'
  }

  const getOptionDisplayText = () => (isMastersProgramme ? 'Bachelor' : 'Master')

  const getProgrammesDisplayText = () =>
    variant === 'coursePopulation' || (variant === 'studyGuidanceGroupPopulation' && !programmeCode)
      ? 'Study programmes'
      : 'Other programmes'

  const getCorrectStudyRight = studyRights =>
    studyRights?.find(studyRight =>
      queryStudyrights.some(code => studyRight.studyRightElements.some(element => element.code === code))
    )

  const getStudyTracks = studyRights => {
    const correctStudyRight = getCorrectStudyRight(studyRights)
    if (!correctStudyRight) return []
    return queryStudyrights
      .map(code => correctStudyRight.studyRightElements.find(element => element.code === code))
      .filter(element => element?.studyTrack)
      .map(element => getTextIn(element.studyTrack.name))
  }

  const getStudyProgrammes = ({ studentNumber }) => {
    const { programmes, getProgrammesList } = studentToOtherProgrammesMap[studentNumber] ?? {}
    return {
      programmes: programmes.map(programme => getTextIn(programme.name)) ?? [],
      programmeList: getProgrammesList('\n'),
      exportValue: getProgrammesList('; '),
    }
  }

  const containsStudyTracks: boolean = filteredStudents.some(student => getStudyTracks(student.studyRights).length > 0)

  const getCourseInformation = student => {
    const courses = student.courses.filter(course => courseCode.includes(course.course_code))
    const highestGrade = getHighestGradeOfCourseBetweenRange(courses, from, to)
    if (!highestGrade) return { grade: '-', date: '', language: '' }
    const { date, language } = courses
      .filter(course => course.grade === highestGrade.grade)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]
    return {
      grade: highestGrade.grade,
      attainmentDate: date,
      language,
    }
  }

  const getEnrollmentDate = student => {
    if (!fromSemester || !toSemester) return ''
    const enrollments =
      student.enrollments
        ?.filter(enrollment => courseCode.includes(enrollment.course_code))
        ?.filter(enrollment => enrollment.semestercode >= fromSemester && enrollment.semestercode <= toSemester) ?? null
    return enrollments[0]?.enrollment_date_time ?? ''
  }

  const getExtent = student =>
    student.studyRights
      .filter(
        studyRight =>
          studyRight.studyRightElements.filter(element => queryStudyrights.includes(element.code)).length >=
          queryStudyrights.length
      )
      .map(studyRight => studyRight.extentCode)
      .join(', ')

  const {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToProgrammeStartMap,
    studentToSecondStudyrightEndMap,
    studentToOtherProgrammesMap,
    studentToPrimaryProgrammeMap,
  } = createMaps(
    selectedStudentNumbers,
    students,
    programmeCode,
    combinedProgrammeCode,
    year,
    currentSemester?.semestercode,
    getTextIn,
    showBachelorAndMaster
  )

  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = getSemestersPresentFunctions({
    allSemesters,
    allSemestersMap,
    filteredStudents,
    getTextIn,
    programmeCode,
    studentToSecondStudyrightEndMap,
    studentToStudyrightEndMap,
    year,
    semestersToAddToStart: showBachelorAndMaster && isMastersProgramme ? 6 : 0,
  })

  const formatStudent = (student: any): FormattedStudentData => {
    const result: FormattedStudentData = {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.studentNumber,
      email: student.email,
      phoneNumber: student.phoneNumber,
      sisuID: student.sis_person_id,
      creditsTotal: student.allCredits ?? student.credits,
      creditsHops: getCreditsFromHops(student),
      creditsSince: getCreditsBetween(student),
      studyTrack: containsStudyTracks ? getStudyTracks(student.studyRights).join(', ') : null,
      studyRightStart: formatDate(studentToStudyrightStartMap[student.studentNumber], DateFormat.ISO_DATE),
      programmeStart: formatDate(studentToProgrammeStartMap[student.studentNumber], DateFormat.ISO_DATE),
      option: getTextIn(student.option?.name) ?? '',
      semesterEnrollments: {
        exportValue: getSemesterEnrollmentsVal(student),
        content: getSemesterEnrollmentsContent(student) ?? null,
      },
      graduationDate: getGraduationDate(student),
      startYearAtUniversity: getStartingYear(student),
      programmes: getStudyProgrammes(student),
      transferredFrom: student.transferredStudyRight ?? getTransferredFrom(student),
      admissionType: shouldShowAdmissionType && getAdmissiontype(student),
      gender: getGender(student.gender_code),
      citizenships: student.citizenships.map(getTextIn).sort().join(', '),
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(student),
      tags: parseTags(student.tags) ?? null,
      extent: isAdmin && getExtent(student),
      updatedAt: isAdmin && formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV),
    }

    if (combinedProgrammeCode || showBachelorAndMaster) {
      const secondaryStudyRightEnd = studentToSecondStudyrightEndMap[student.studentNumber]
      result.creditsCombinedProg = getCombinedProgrammeCredits(student)
      result.graduationDateCombinedProg = secondaryStudyRightEnd
        ? formatDate(secondaryStudyRightEnd, DateFormat.ISO_DATE)
        : null
    }

    if (variant === 'customPopulation' && !programmeCode) {
      result.primaryProgramme = getTextIn(studentToPrimaryProgrammeMap[student.studentNumber]?.name) ?? ''
    }

    if (variant === 'coursePopulation') {
      const { attainmentDate, grade, language } = getCourseInformation(student)
      const enrollmentDate = getEnrollmentDate(student)
      result.attainmentDate = attainmentDate ? formatDate(attainmentDate, DateFormat.ISO_DATE) : 'No attainment'
      result.grade = grade
      result.language = language
      result.enrollmentDate = enrollmentDate ? formatDate(enrollmentDate, DateFormat.ISO_DATE) : 'No enrollment'
    }

    return result
  }

  const formattedData: FormattedStudentData[] = selectedStudentNumbers.map(studentNumber =>
    formatStudent(students[studentNumber])
  )
  const containsAdmissionTypes = formattedData.some(student => student.admissionType !== 'Ei valintatapaa')

  return (
    <GeneralTab
      admissionTypeVisible={containsAdmissionTypes}
      customPopulationProgramme={customPopulationProgramme}
      dynamicTitles={{
        primaryEndDate: combinedProgrammeCode ? 'Bachelor graduation date' : 'Graduation date',
        secondaryEndDate: getSecondaryEndDateDisplayText(),
        creditsSince: getCreditsSinceDisplayText(),
        creditsCombinedProg: getSecondaryProgCreditsDisplayText(),
        option: getOptionDisplayText(),
        programmes: getProgrammesDisplayText(),
      }}
      formattedData={formattedData}
      group={group}
      isCombinedProg={!!combinedProgrammeCode || showBachelorAndMaster}
      showAdminColumns={isAdmin}
      studyTrackVisible={containsStudyTracks}
      variant={variant}
    />
  )
}
