import { useSelector } from 'react-redux'
import { getStudentTotalCredits } from '@/common'
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
import { createMaps } from '../columnHelpers/createMaps'
import { getSemestersPresentFunctions } from '../columnHelpers/semestersPresent'

import { GeneralTab } from './GeneralTab'

export type FormattedStudentData = {
  firstNames: string
  lastName: string
  studentNumber: string
  sisuID: string
  email: string
  creditsTotal: number
  creditsHops: number
  creditsSince: number
  studyTrack?: string
  studyRightStart: string
  programmeStart: string
  option: string
  semesterEnrollments: { exportValue: number; content: JSX.Element | null }
  graduationDate: string
  startYearAtUniversity: number | string
  programmes: { programmes: string[]; programmeList: string[] }
  transferredFrom: string
  admissionType: string
  gender: string
  citizenships: string[]
  curriculumPeriod: string
  mostRecentAttainment: string
  tags: any
  extent?: string
  updatedAt?: string
}

export const GeneralTabContainer = ({ filteredStudents, customPopulationProgramme, group, year, variant }) => {
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

  const getTransferredFrom = (student: any) =>
    getTextIn(programmes[student.transferSource]?.name) ?? student.transferSource

  const showBachelorAndMaster = query?.showBachelorAndMaster === 'true'

  const getStudyRight = student =>
    student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === programmeCode)
    )

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

  const shouldShowAdmissionType = parseInt(query?.year, 10) >= 2020 || parseInt(group?.tags?.year, 10) >= 2020
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

  const getOptionDisplayText = () =>
    programmeCode ? (isMastersProgramme ? 'Bachelor' : 'Master') : 'Primary study programme'

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
    }
  }

  const containsStudyTracks: boolean = filteredStudents.some(student => getStudyTracks(student.studyRights).length > 0)

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

  // console.log("filteredStudents:", filteredStudents)
  const formatStudent = (student: any): FormattedStudentData => {
    return {
      firstNames: student.firstnames,
      lastName: student.lastname,
      studentNumber: student.studentNumber,
      email: student.email,
      sisuID: student.sis_person_id,
      creditsTotal: student.allCredits ?? student.credits,
      creditsHops: getCreditsFromHops(student),
      creditsSince: getCreditsBetween(student),
      studyTrack: containsStudyTracks ? getStudyTracks(student.studyRights).join(', ') : '',
      studyRightStart: formatDate(studentToStudyrightStartMap[student.studentNumber], DateFormat.ISO_DATE),
      programmeStart: formatDate(studentToProgrammeStartMap[student.studentNumber], DateFormat.ISO_DATE),
      option: programmeCode
        ? (getTextIn(student.option?.name) ?? '')
        : (getTextIn(studentToPrimaryProgrammeMap[student.studentNumber]?.name) ?? ''),
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
      tags: parseTags(student.tags),
      extent: isAdmin && getExtent(student),
      updatedAt: isAdmin && formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV),
    }
  }
  // console.log("filteredStudents:", filteredStudents)
  // console.log("populationstatistics", populationStatistics)
  // console.log("populationstats length:", populationStatistics?.students?.length, "students length:", Object.keys(students).length)
  // console.log("selectedstudentnumbers and students lengths match?", selectedStudentNumbers.length === Object.keys(students).length)
  const formattedData = selectedStudentNumbers.map(studentNumber => formatStudent(students[studentNumber]))
  return (
    <GeneralTab
      customPopulationProgramme={customPopulationProgramme}
      dynamicTitles={{ creditsSince: getCreditsSinceDisplayText(), option: getOptionDisplayText() }}
      formattedData={formattedData}
      group={group}
      showAdminColumns={isAdmin}
      studyTrackVisible={containsStudyTracks}
      variant={variant}
    />
  )
}
