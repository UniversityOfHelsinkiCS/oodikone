import { useMemo } from 'react'

import { GenderCodeToText } from '@oodikone/shared/types/genderCode'

import { getStudentTotalCredits, getHighestGradeOfCourseBetweenRange, findStudyRightForClass, getAllProgrammesOfStudent } from '@/common'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
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
  option: string | null
  semesterEnrollments: {
    exportValue: number
    content: {
      key: string
      onHoverString: string
      typeLabel: string
      graduationCrown: string
    }[]
  }
  graduationDate: string | null
  graduationDateCombinedProg?: string | null
  startYearAtUniversity: number | null
  primaryProgramme?: string
  programmes: { exportValue: string | null; programmes: Programme[] }
  programmeStatus: string | null
  transferredFrom: string
  admissionType: string | null
  gender: string
  citizenships: string | null
  curriculumPeriod: string
  mostRecentAttainment: string | null
  tags: string | null
  extent?: string
  studyTrack?: string | null
  updatedAt: string | null
  grade?: string
  attainmentDate?: string
  enrollmentDate?: string
  language?: string
  tvex: boolean
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
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())

  const { isAdmin } = useGetAuthorizedUserQuery()
  const { getTextIn } = useLanguage()

  const { data: programmes, isFetching: programmesFetching, isSuccess: programmesSuccess } = useGetProgrammesQuery()
  const { data: semesters, isFetching: semestersFetching, isSuccess: semestersSuccess} = useGetSemestersQuery()

  if (programmesFetching || semestersFetching) return null
  if (!programmesSuccess || !semestersSuccess) return null

  const allSemesters = semesters?.semesters
  const currentSemester = semesters?.currentSemester

  const queryStudyrights = [programme, combinedProgramme].filter(studyright => !!studyright) as string[]

  const [sggProgramme, sggCombinedProgramme] = group?.tags?.studyProgramme?.split('+') ?? []

  const programmeCode = programme ?? sggProgramme ?? customPopulationProgramme
  const combinedProgrammeCode = combinedProgramme ?? sggCombinedProgramme ?? null

  const isMastersProgramme = programmes[programmeCode]?.degreeProgrammeType === 'urn:code:degree-program-type:masters-degree'
  const shouldShowBachelorAndMaster = showBachelorAndMaster === 'true'

  const semestersToAddToStart = shouldShowBachelorAndMaster && isMastersProgramme ? 6 : 0

  const includePrimaryProgramme =
    variant === 'coursePopulation' || (variant === 'studyGuidanceGroupPopulation' && !programmeCode)

  const {
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
  } = createMaps(
    filteredStudents,
    programmeCode,
    combinedProgrammeCode,
    year,
    currentSemester?.semestercode,
    shouldShowBachelorAndMaster
  )

  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = getSemestersPresentFunctions({
    getTextIn,
    programme: programmeCode,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
    year,
    semestersToAddToStart,
  })

  const containsStudyTracks: boolean = filteredStudents.some(({ studyRights }) => {
    studyRights?.some(({ studyRightElements }) =>
      studyRightElements.some(element => queryStudyrights.includes(element.code))
    )
  })

  const formatStudent = (student: any): FormattedStudentData => {
    const studentProgrammes = getAllProgrammesOfStudent(student.studyRights ?? [], currentSemester)

    const primaryProgramme = studentProgrammes.find(({ code }) => code === programmeCode) ?? studentProgrammes[0]
    const otherProgrammes = studentProgrammes.filter(({ code }) => code !== programmeCode)

    const relevantStudyRight = findStudyRightForClass(student.studyRights, primaryProgramme?.code, year)
    const relevantStudyRightElement = relevantStudyRight?.studyRightElements.find(({ code }) => code === primaryProgramme?.code)

    const relevantStudyplan = student.studyplans?.find(({ programme_code }) => programme_code === primaryProgramme?.code)

    const degreeProgrammeTypeToCheck = !!relevantStudyRightElement && !isMastersProgramme
        ? 'urn:code:degree-program-type:masters-degree'
        : 'urn:code:degree-program-type:bachelors-degree'

    const secondStudyRightElement = (relevantStudyRight?.studyRightElements ?? [])
      .filter(element => {
        if (combinedProgramme) return element.code === combinedProgramme
        if (showBachelorAndMaster && !!relevantStudyRightElement)
          return element.degreeProgrammeType === degreeProgrammeTypeToCheck

        return false
      })
      .toSorted(({ startDate: a }, { startDate: b }) => Number(b < a) * 1 + Number(a < b) * -1)[0]

    /* ***** */ /* ***** */ /* ***** */
    /* ***** */ /* ***** */ /* ***** */
    /* ***** */ /* ***** */ /* ***** */

    const getCreditsBetween = student => {
      const sinceDate = creditDateFilterOptions.startDate ?? new Date(1970, 0, 1)
      const untilDate = creditDateFilterOptions.endDate ?? new Date()

      if (group?.tags?.year) return getStudentTotalCredits({
        courses: student.courses
          .filter((course) => new Date(group?.tags?.year, 7, 1) < new Date(course.date))
      })

      if (!sinceDate && !untilDate) return getStudentTotalCredits({
        courses: student.courses
          .filter((course) => new Date(relevantStudyRightElement?.startDate ?? 0).getTime() <= new Date(course.date).getTime())
      })

      return getStudentTotalCredits({ courses: student.courses.filter((course) => sinceDate <= new Date(course.date) && new Date(course.date) <= untilDate) })
    }

    const getStudyTracks = studyRights => {
      const correctStudyRight = studyRights?.find(studyRight =>
        queryStudyrights.some(code => studyRight.studyRightElements.some(element => element.code === code))
      )

      if (!correctStudyRight) return []
      return queryStudyrights
        .map(code => correctStudyRight.studyRightElements.find(element => element.code === code))
        .filter(element => element?.studyTrack)
        .map(element => getTextIn(element.studyTrack.name))
    }

    const studentWithEnrollmentMap = {
      studentNumber: student.studentNumber,
      semesterEnrollmentsMap: programmeCode
        ? relevantStudyRight?.semesterEnrollments?.reduce((enrollments, { type, semester, statutoryAbsence }) => {
            enrollments[semester] = {
              enrollmenttype: type,
              statutoryAbsence: statutoryAbsence ?? false,
            }
            return enrollments
          }, {}) ?? null
        : null,
    }

    const graduationDate = relevantStudyRightElement?.graduated
        ? formatDate(relevantStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null

    // This is so that "Study programmes" column is complete in views that have no associated "primary" programme.      
    const programmesList = [...(includePrimaryProgramme && primaryProgramme ? [primaryProgramme] : []), ...otherProgrammes]

    const getStudyRightStatus = () => {
      if (!primaryProgramme) return null
      if (primaryProgramme.graduated) return 'Graduated'
      if (primaryProgramme.cancelled) return 'Cancelled'
      if (primaryProgramme.active) return 'Active'
      return 'Inactive'
    }      

    const getAdmissiontype = () => {
      const admissionType = relevantStudyRight?.admissionType ?? 'Ei valintatapaa'
      return admissionType !== 'Koepisteet' ? admissionType : 'Valintakoe'
    }

    const getMostRecentAttainment = student => {
      if (!relevantStudyplan) return null

      const dates = student.courses
        .filter(({ course_code, passed }) => relevantStudyplan.included_courses.includes(course_code) && passed)
        .map(({ date }) => +new Date(date))
      if (!dates.length) return null

      const latestDate = Math.max(...dates)
      return formatDate(new Date(latestDate), DateFormat.ISO_DATE)
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
      studyRightStart: formatDate(relevantStudyRight?.startDate, DateFormat.ISO_DATE),
      programmeStart: formatDate(relevantStudyRightElement?.startDate, DateFormat.ISO_DATE),
      option: getTextIn(student.option?.name) ?? null,
      semesterEnrollments: {
        content: getSemesterEnrollmentsContent(studentWithEnrollmentMap),
        exportValue: getSemesterEnrollmentsVal(studentWithEnrollmentMap),
      },
      graduationDate,
      startYearAtUniversity: student.started
        ? new Date(student.started).getFullYear()
        : null,
      programmes: { programmes: programmesList, exportValue: joinProgrammes(programmesList, getTextIn, '; ') },
      programmeStatus: getStudyRightStatus(),
      transferredFrom: student.transferredStudyRight ?? getTextIn(programmes[student.transferSource]?.name) ?? student.transferSource,
      admissionType: getAdmissiontype(),
      gender: GenderCodeToText[student.gender_code],
      citizenships: student.citizenships?.map(getTextIn).sort().join(', ') ?? null,
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(student),
      tvex: !!relevantStudyRight?.tvex,
      tags: student.tags?.map(({ tag }) => tag.tagname).join(', ') ?? null,
      extent: isAdmin
        ? getExtent(student)
        : null,
      updatedAt: isAdmin
        ? formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV)
        : null,
    }

    if (combinedProgrammeCode || shouldShowBachelorAndMaster) {
      const getCombinedProgrammeCredits = student =>
        student.studyplans?.find(plan => {
          if (combinedProgrammeCode) return plan.programme_code === combinedProgrammeCode

          const studyRightIdOfProgramme = student.studyRights.find(studyRight => studyRight.studyRightElements?.some(element => element.code === programmeCode))
          return plan.sis_study_right_id === studyRightIdOfProgramme?.id && plan.programme_code !== programmeCode
        })?.completed_credits

      result.creditsCombinedProg = getCombinedProgrammeCredits(student) ?? 0
      result.graduationDateCombinedProg = secondStudyRightElement?.graduated
        ? formatDate(secondStudyRightElement.endDate, DateFormat.ISO_DATE)
        : null
    }

    if (variant === 'customPopulation' && !programmeCode) {
      if (primaryProgramme) {
        result.primaryProgramme = getTextIn(primaryProgramme.name) ?? ''
      }
    }

    if (variant === 'coursePopulation') {
      const getCourseInformation = student => {
        const courses = student.courses.filter(course => coursecodes.includes(course.course_code))
        const { grade } = getHighestGradeOfCourseBetweenRange(courses, from, to)
        if (!grade) return { grade: '-', date: '', language: '' }

        const { date: attainmentDate, language } = courses
          .filter(course => course.grade === grade)
          .sort((a, b) => +new Date(b.date) - +new Date(a.date))
          .pop()

        return { grade, attainmentDate, language }
      }

      const fromSemester = from
        ? Object.values(allSemesters)
            .filter(({ startdate }) => new Date(startdate) <= new Date(from))
            .sort((a, b) => +new Date(b.startdate) - +new Date(a.startdate))[0]?.semestercode
        : null

      const toSemester = to
        ? Object.values(allSemesters)
            .filter(({ enddate }) => new Date(to) <= new Date(enddate))
            .sort((a, b) => +new Date(a.enddate) - +new Date(b.enddate))[0]?.semestercode
        : null

      const getEnrollmentDate = student => {
        if (!fromSemester || !toSemester || student?.enrollments) return null
        const enrollments =
          student.enrollments
            ?.filter(enrollment => coursecodes.includes(enrollment?.course_code))
            ?.filter(enrollment => fromSemester <= enrollment?.semestercode && enrollment?.semestercode <= toSemester) ??
          null
        return enrollments ? (enrollments[0].enrollment_date_time ?? null) : null
      }

      const { attainmentDate, grade, language } = getCourseInformation(student)
      const enrollmentDate = getEnrollmentDate(student)
      result.attainmentDate = attainmentDate ? formatDate(attainmentDate, DateFormat.ISO_DATE) : 'No attainment'
      result.grade = grade
      result.language = language
      result.enrollmentDate = enrollmentDate ? formatDate(enrollmentDate, DateFormat.ISO_DATE) : 'No enrollment'
    }

    return result
  }

  const formattedData: FormattedStudentData[] = useMemo(() => filteredStudents.map(formatStudent), [filteredStudents])
  const containsAdmissionTypes = formattedData.some(student => student.admissionType !== 'Ei valintatapaa')

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

  return (
    <GeneralTab
      admissionTypeVisible={containsAdmissionTypes}
      customPopulationProgramme={customPopulationProgramme}
      dynamicTitles={{
        primaryEndDate: combinedProgrammeCode ? 'Bachelor graduation date' : 'Graduation date',
        creditsCombinedProg: getSecondaryProgCreditsDisplayText(),
        secondaryEndDate: getSecondaryEndDateDisplayText(),
        creditsSince: getCreditsSinceDisplayText(),
        option: isMastersProgramme ? 'Bachelor' : 'Master',
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
