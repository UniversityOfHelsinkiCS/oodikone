import { useMemo } from 'react'
import { getStudentTotalCredits, getHighestGradeOfCourseBetweenRange } from '@/common'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { formatDate } from '@/util/timeAndDate'
import { createMaps } from './columnHelpers/createMaps'
import { getSemestersPresentFunctions } from './columnHelpers/semestersPresent'

import { GeneralTab } from './GeneralTab'
import { joinProgrammes, Programme } from './util'

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
  semesterEnrollments: {
    exportValue: number
    content: {
      key: string
      onHoverString: string
      springMargin: string
      typeLabel: string
      graduationCrown: string
    }[]
  }
  graduationDate: string
  graduationDateCombinedProg?: string | null
  startYearAtUniversity: number | string
  primaryProgramme?: string
  programmes: { exportValue: string | null; programmes: Programme[] }
  programmeStatus: string | null
  transferredFrom: string
  admissionType: string | null
  gender: string
  citizenships: string | null
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
  tvex?: boolean
}

export const GeneralTabContainer = ({
  filteredStudents,
  customPopulationProgramme,
  group,
  year,
  variant,
  coursecodes,
  from,
  to,
  programme,
  combinedProgramme,
  showBachelorAndMaster,
}) => {
  const { getTextIn } = useLanguage()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesters ?? { semesters: {}, currentSemester: null }

  const { data: programmes = {} } = useGetProgrammesQuery()

  const { useFilterSelector } = useFilters()

  const queryStudyrights = [programme, combinedProgramme].filter(studyright => !!studyright) as string[]
  const degreeProgrammeTypes = useDegreeProgrammeTypes(queryStudyrights)
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())

  const [sggProgramme, sggCombinedProgramme] = group?.tags?.studyProgramme?.split('+') ?? []
  const programmeCode = programme ?? sggProgramme ?? customPopulationProgramme

  const isMastersProgramme = degreeProgrammeTypes[programmeCode] === 'urn:code:degree-program-type:masters-degree'

  const fromSemester = from
    ? Object.values(allSemesters)
        .filter(({ startdate }) => new Date(startdate) <= new Date(from))
        .sort((a, b) => +new Date(b.startdate) - +new Date(a.startdate))[0]?.semestercode
    : null

  const toSemester = to
    ? Object.values(allSemesters)
        .filter(({ enddate }) => new Date(enddate) >= new Date(to))
        .sort((a, b) => +new Date(a.enddate) - +new Date(b.enddate))[0]?.semestercode
    : null

  const getTransferredFrom = (student: any) =>
    getTextIn(programmes[student.transferSource]?.name) ?? student.transferSource

  const shouldShowBachelorAndMaster = showBachelorAndMaster === 'true'

  const getStudyRight = student => {
    const code = programmeCode ?? studentToPrimaryProgrammeMap.get(student.studentNumber)?.code
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
      semesterEnrollmentsMap: programmeCode ? createSemesterEnrollmentsMap(student) : null,
    }
    return acc
  }, {})

  const combinedProgrammeCode = combinedProgramme ?? sggCombinedProgramme ?? null

  const includePrimaryProgramme =
    variant === 'coursePopulation' || (variant === 'studyGuidanceGroupPopulation' && !programmeCode)

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
    const code = programmeCode ?? studentToPrimaryProgrammeMap.get(student.studentNumber)?.code
    const studyPlan = student.studyplans?.find(plan => plan.programme_code === code) ?? null
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
    const studentTags = tags?.map(studentTag => studentTag.tag.tagname)
    return studentTags.join(', ')
  }

  const getStartingYear = ({ started }) => (started ? new Date(started).getFullYear() : '')

  const getGraduationDate = ({ studentNumber }) => {
    const studyRightEnd = studentToStudyrightEndMap.get(studentNumber)
    return studyRightEnd ? formatDate(studyRightEnd, DateFormat.ISO_DATE) : ''
  }

  const getStudyRightStatus = ({ studentNumber }) => {
    const primaryProgramme = studentToPrimaryProgrammeMap.get(studentNumber)
    if (!primaryProgramme) return null
    if (primaryProgramme.graduated) return 'Graduated'
    if (primaryProgramme.cancelled) return 'Cancelled'
    if (primaryProgramme.active) return 'Active'
    return 'Inactive'
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
            new Date(course.date).getTime() >=
            new Date(studentToProgrammeStartMap.get(student.studentNumber) ?? 0).getTime()
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

  const containsStudyTracks: boolean = filteredStudents.some(student => getStudyTracks(student.studyRights).length > 0)

  const getCourseInformation = student => {
    const courses = student.courses.filter(course => coursecodes.includes(course.course_code))
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
    if (!fromSemester || !toSemester || student?.enrollments) return null
    const enrollments =
      student.enrollments
        ?.filter(enrollment => coursecodes.includes(enrollment?.course_code))
        ?.filter(enrollment => enrollment?.semestercode >= fromSemester && enrollment?.semestercode <= toSemester) ??
      null
    return enrollments ? (enrollments[0].enrollment_date_time ?? null) : null
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

  // This is so that "Study programmes" column is complete in views that have no associated "primary" programme.
  const getProgrammeList = ({ studentNumber }) => {
    const other = studentToOtherProgrammesMap.get(studentNumber)
    if (includePrimaryProgramme) {
      const primary = studentToPrimaryProgrammeMap.get(studentNumber)
      return [...(primary ? [primary] : []), ...(other ?? [])]
    }
    return other ?? []
  }

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
    shouldShowBachelorAndMaster
  )

  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = getSemestersPresentFunctions({
    currentSemester,
    allSemesters,
    getTextIn,
    programmeCode,
    studentToSecondStudyrightEndMap,
    studentToStudyrightEndMap,
    year,
    semestersToAddToStart: shouldShowBachelorAndMaster && isMastersProgramme ? 6 : 0,
  })

  const formatStudent = (student: any): FormattedStudentData => {
    const correctStudyRight = getStudyRight(student)
    const programmesList = getProgrammeList(student)

    const result: FormattedStudentData = {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      email: student.email,
      phoneNumber: student.phoneNumber,
      sisuID: student.sis_person_id,
      creditsTotal: student.credits,
      creditsHops: student.hopsCredits,
      creditsSince: getCreditsBetween(student),
      studyTrack: containsStudyTracks ? getStudyTracks(student.studyRights).join(', ') : null,
      studyRightStart: formatDate(studentToStudyrightStartMap.get(student.studentNumber), DateFormat.ISO_DATE),
      programmeStart: formatDate(studentToProgrammeStartMap.get(student.studentNumber), DateFormat.ISO_DATE),
      option: getTextIn(student.option?.name) ?? '',
      semesterEnrollments: {
        exportValue: getSemesterEnrollmentsVal(student),
        content: getSemesterEnrollmentsContent(student),
      },
      graduationDate: getGraduationDate(student),
      startYearAtUniversity: getStartingYear(student),
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      programmeStatus: getStudyRightStatus(student),
      transferredFrom: student.transferredStudyRight ?? getTransferredFrom(student),
      admissionType: getAdmissiontype(student),
      gender: getGender(student.gender_code),
      citizenships: student.citizenships?.map(getTextIn).sort().join(', ') ?? null,
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(student),
      tvex: !!correctStudyRight?.tvex,
      tags: parseTags(student.tags) ?? null,
      extent: isAdmin && getExtent(student),
      updatedAt: isAdmin && formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV),
    }

    if (combinedProgrammeCode || shouldShowBachelorAndMaster) {
      const secondaryStudyRightEnd = studentToSecondStudyrightEndMap.get(student.studentNumber)
      result.creditsCombinedProg = getCombinedProgrammeCredits(student)
      result.graduationDateCombinedProg = secondaryStudyRightEnd
        ? formatDate(secondaryStudyRightEnd, DateFormat.ISO_DATE)
        : null
    }

    if (variant === 'customPopulation' && !programmeCode) {
      const primaryProgramme = studentToPrimaryProgrammeMap.get(student.studentNumber)
      if (primaryProgramme) {
        result.primaryProgramme = getTextIn(primaryProgramme.name) ?? ''
      }
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

  const formattedData: FormattedStudentData[] = useMemo(
    () => selectedStudentNumbers.map(studentNumber => formatStudent(students[studentNumber])),
    [filteredStudents]
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
        programmes: includePrimaryProgramme ? 'Study programmes' : 'Other programmes',
      }}
      formattedData={formattedData}
      group={group}
      isCombinedProg={!!combinedProgrammeCode || shouldShowBachelorAndMaster}
      showAdminColumns={isAdmin}
      studyTrackVisible={containsStudyTracks}
      variant={variant}
    />
  )
}
