import { chain, range } from 'lodash'
import moment from 'moment'
import { useState } from 'react'

import { getEnrollmentTypeTextForExcel, getHighestGradeOfCourseBetweenRange, getStudentTotalCredits } from '@/common'
import { getCopyableEmailColumn, getCopyableStudentNumberColumn, hiddenNameAndEmailForExcel } from '@/common/columns'
import { useCurrentSemester, useDegreeProgrammeTypes } from '@/common/hooks'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { DISPLAY_DATE_FORMAT, ISO_DATE_FORMAT, ISO_DATE_FORMAT_DEV } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { reformatDate } from '@/util/timeAndDate'
import { createMaps } from './columnHelpers/createMaps'
import { getSemestersPresentFunctions } from './columnHelpers/semestersPresent'

export const GeneralTab = ({
  group,
  populations,
  customPopulationProgramme,
  columnKeysToInclude,
  coursecode,
  filteredStudents,
  from,
  to,
  year,
}) => {
  const { getTextIn } = useLanguage()
  const { useFilterSelector } = useFilters()
  const [popupStates, setPopupStates] = useState({})
  const { data: semesterData } = useGetSemestersQuery()
  const allSemesters = semesterData?.semesters ? Object.entries(semesterData.semesters).map(item => item[1]) : []
  const allSemestersMap = allSemesters.reduce((obj, cur, index) => {
    obj[index + 1] = cur
    return obj
  }, {})
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { data: programmes = {} } = useGetProgrammesQuery()

  const fromSemester = from
    ? Object.values(semesterData.semesters)
        .filter(({ startdate }) => new Date(startdate) <= new Date(from))
        .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]?.semestercode
    : null

  const toSemester = to
    ? Object.values(semesterData.semesters)
        .filter(({ enddate }) => new Date(enddate) >= new Date(to))
        .sort((a, b) => new Date(a.enddate) - new Date(b.enddate))[0]?.semestercode
    : null
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)

  const { data: populationStatistics, query } = populations

  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const cleanedQueryStudyrights = queryStudyrights.filter(studyright => !!studyright)

  const degreeProgrammeTypes = useDegreeProgrammeTypes(cleanedQueryStudyrights)

  const currentSemester = useCurrentSemester()

  if (!populationStatistics) return null

  const studyGuidanceGroupProgrammes =
    group?.tags?.studyProgramme && group?.tags?.studyProgramme.includes('+')
      ? group?.tags?.studyProgramme.split('+')
      : [group?.tags?.studyProgramme]

  const programmeCode = query?.studyRights?.programme || studyGuidanceGroupProgrammes[0] || customPopulationProgramme

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

  const selectedStudents = filteredStudents.map(student => student.studentNumber)
  const students = filteredStudents.reduce((acc, student) => {
    acc[student.studentNumber] = columnKeysToInclude.includes('semesterEnrollments')
      ? { ...student, semesterEnrollmentsMap: programmeCode != null ? createSemesterEnrollmentsMap(student) : null }
      : student
    return acc
  }, {})

  const getCombinedProgrammeCode = (query, studyGuidanceGroupProgrammes) => {
    if (query && query?.studyRights?.combinedProgramme) return query.studyRights.combinedProgramme
    if (studyGuidanceGroupProgrammes.length > 1) return studyGuidanceGroupProgrammes[1]
    return ''
  }

  const combinedProgrammeCode = getCombinedProgrammeCode(query, studyGuidanceGroupProgrammes)

  const {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToProgrammeStartMap,
    studentToSecondStudyrightEndMap,
    studentToOtherProgrammesMap,
  } = createMaps({
    students,
    selectedStudents,
    programmeCode,
    combinedProgrammeCode,
    year,
    getTextIn,
    currentSemester: currentSemester?.semestercode,
  })

  const transferFrom = student => getTextIn(programmes[student.transferSource]?.name) ?? student.transferSource

  const getCorrectStudyRight = studyRights =>
    studyRights?.find(studyRight =>
      cleanedQueryStudyrights.some(code => studyRight.studyRightElements.some(element => element.code === code))
    )

  const getStudyTracks = studyRights => {
    const correctStudyRight = getCorrectStudyRight(studyRights)
    if (!correctStudyRight) {
      return []
    }
    return cleanedQueryStudyrights.reduce((acc, code) => {
      const element = correctStudyRight.studyRightElements.find(element => element.code === code)
      const studyTrack = element?.studyTrack ? getTextIn(element.studyTrack.name) : null
      if (studyTrack) acc.push(studyTrack)
      return acc
    }, [])
  }

  const tags = tags => {
    const studentTags = tags.map(tag => tag.tag.tagname)
    return studentTags.join(', ')
  }

  const getStarted = ({ obfuscated, started }) => {
    if (obfuscated || !started) return ''
    return moment(started).get('year')
  }

  const getGradeAndDate = student => {
    const courses = student.courses.filter(course => coursecode.includes(course.course_code))
    const highestGrade = getHighestGradeOfCourseBetweenRange(courses, from, to)
    if (!highestGrade) return { grade: '-', date: '', language: '' }
    const { date, language } = courses
      .filter(course => course.grade === highestGrade.grade)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    return {
      grade: highestGrade.grade,
      date,
      language,
    }
  }

  const getCreditsBetween = student => {
    if (group?.tags?.year) {
      return getStudentTotalCredits({
        ...student,
        courses: student.courses.filter(course => new Date(course.date) > new Date(group?.tags?.year, 7, 1)),
      })
    }
    const sinceDate = creditDateFilterOptions?.startDate || new Date(1970, 0, 1)
    const untilDate = creditDateFilterOptions?.endDate || new Date()

    const credits = getStudentTotalCredits({
      ...student,
      courses: student.courses.filter(
        course => new Date(course.date) >= sinceDate && new Date(course.date) <= untilDate
      ),
    })
    return credits
  }

  const getEnrollmentDate = student => {
    const enrollments =
      student.enrollments
        ?.filter(enrollment => coursecode.includes(enrollment.course_code))
        ?.filter(enrollment => enrollment.semestercode >= fromSemester && enrollment.semestercode <= toSemester) ?? null
    if (!enrollments || !enrollments.length) return ''
    return enrollments[0].enrollment_date_time
  }

  const copyItemsToClipboard = (event, fieldName) => {
    event.stopPropagation()
    const studentsInfo = selectedStudents.map(number => students[number])
    const list = studentsInfo
      .filter(student => student[fieldName] && !student.obfuscated)
      .map(student => student[fieldName])
    const clipboardString = list.join(';')
    navigator.clipboard.writeText(clipboardString)
  }

  const popupTimeoutLength = 1000
  const timeout = {}

  const handlePopupOpen = id => {
    setPopupStates({ [id]: true })

    timeout[id] = setTimeout(() => {
      setPopupStates({ [id]: false })
    }, popupTimeoutLength)
  }

  const handlePopupClose = id => {
    setPopupStates({ [id]: false })
    clearTimeout(timeout[id])
  }

  const containsStudyTracks = filteredStudents.some(student => getStudyTracks(student.studyRights).length > 0)

  const isBachelorsProgramme = Object.values(degreeProgrammeTypes).includes(
    'urn:code:degree-program-type:bachelors-degree'
  )
  const isMastersProgramme = Object.values(degreeProgrammeTypes).includes('urn:code:degree-program-type:masters-degree')

  const shouldShowAdmissionType = parseInt(query?.year, 10) >= 2020 || parseInt(group?.tags?.year, 10) >= 2020

  let creditColumnTitle = 'Since start\nin programme'

  if (creditDateFilterOptions) {
    const { startDate, endDate } = creditDateFilterOptions

    if (startDate && !endDate) {
      creditColumnTitle = `Since ${moment(startDate).format(DISPLAY_DATE_FORMAT)}`
    } else if (endDate && !startDate) {
      creditColumnTitle = `Before ${moment(endDate).format(DISPLAY_DATE_FORMAT)}`
    } else if (endDate && startDate) {
      creditColumnTitle = `Between ${moment(startDate).format(DISPLAY_DATE_FORMAT)} and ${moment(endDate).format(
        DISPLAY_DATE_FORMAT
      )}`
    }
  }

  const getTitleForCreditsSince = sole => {
    let title = sole ? 'Credits ' : ''
    const since = creditDateFilterOptions?.startDate
    const until = creditDateFilterOptions?.endDate
    if (group?.tags?.year && !since) {
      title += `Since 1.8.${group.tags.year}`
    } else {
      title += since ? `Since ${moment(since).format(DISPLAY_DATE_FORMAT)}` : 'Since 1.1.1970'
    }
    if (until) {
      title += `\nuntil ${moment(until).format(DISPLAY_DATE_FORMAT)}`
    }
    return title
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

  let creditsColumn = null
  const creditColumnKeys = columnKeysToInclude.filter(key => key.indexOf('credits.') === 0)

  const { getFirstSemester, getLastSemester, getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } =
    getSemestersPresentFunctions({
      allSemesters,
      allSemestersMap,
      filteredStudents,
      getTextIn,
      programmeCode,
      studentToSecondStudyrightEndMap,
      studentToStudyrightEndMap,
      year,
    })

  const availableCreditsColumns = {
    all: sole => ({
      key: 'credits-all',
      title: sole ? 'All credits' : 'All',
      filterType: 'range',
      getRowVal: student => student.allCredits || student.credits,
    }),
    hops: sole => ({
      key: 'credits-hops',
      title: sole ? 'Credits in HOPS' : 'HOPS',
      filterType: 'range',
      getRowVal: student =>
        student.hopsCredits !== undefined
          ? student.hopsCredits
          : (student.studyplans?.find(plan => plan.programme_code === programmeCode)?.completed_credits ?? 0),
    }),
    hopsCombinedProg: () => ({
      key: 'credits-hopsCombinedProg',
      title: combinedProgrammeCode === 'MH90_001' ? 'Licentiate\nHOPS' : 'Master\nHOPS',
      filterType: 'range',
      getRowVal: student =>
        student.studyplans?.find(plan => plan.programme_code === combinedProgrammeCode)?.completed_credits ?? 0,
    }),
    studyright: sole => ({
      key: 'credits-studyright',
      title: sole ? `Credits ${creditColumnTitle}` : creditColumnTitle,
      filterType: 'range',
      getRowVal: student => {
        const credits = getStudentTotalCredits({
          ...student,
          courses: student.courses.filter(
            course =>
              new Date(course.date).getTime() >= new Date(studentToProgrammeStartMap[student.studentNumber]).getTime()
          ),
        })
        return credits
      },
    }),
    since: sole => ({
      // If a year is associated and no filters exist, this will act differently
      key: 'credits-since',
      title: getTitleForCreditsSince(sole),
      filterType: 'range',
      getRowVal: student => getCreditsBetween(student),
    }),
  }

  if (creditColumnKeys.length === 1) {
    const key = creditColumnKeys[0].split('.')[1]
    creditsColumn = availableCreditsColumns[key](true)
  } else if (creditColumnKeys.length > 1) {
    creditsColumn = {
      key: 'credits-parent',
      title: 'Credits',
      children: Object.keys(availableCreditsColumns)
        .map(name => availableCreditsColumns[name](false))
        .filter(col => creditColumnKeys.includes(col.key.replace('-', '.'))),
    }
  }

  const columnsAvailable = {
    lastname: { key: 'lastname', title: 'Last name', getRowVal: student => student.lastname, export: false },
    firstname: { key: 'firstname', title: 'Given names', getRowVal: student => student.firstnames, export: false },
    phoneNumber: {
      key: 'phoneNumber',
      title: 'Phone number',
      export: true,
      displayColumn: false,
      getRowVal: student => student.phoneNumber,
    },
    studentnumber: getCopyableStudentNumberColumn({
      popupStates,
      copyItemsToClipboard,
      handlePopupClose,
      handlePopupOpen,
      fieldName: 'studentNumber',
    }),
    credits: creditsColumn,
    gradeForSingleCourse: {
      key: 'gradeForSingleCourse',
      title: 'Grade',
      getRowVal: student => {
        const { grade } = getGradeAndDate(student)
        return grade
      },
    },
    studyTrack: containsStudyTracks && {
      key: 'studyTrack',
      title: 'Study track',
      getRowVal: student => getStudyTracks(student.studyRights).join(', '),
    },
    studyrightStart: {
      key: 'studyrightStart',
      title: 'Start of\nstudyright',
      filterType: 'date',
      getRowVal: student => reformatDate(studentToStudyrightStartMap[student.studentNumber], ISO_DATE_FORMAT),
    },
    studyStartDate: {
      key: 'studyStartDate',
      title: 'Started in\nprogramme',
      filterType: 'date',
      getRowVal: student => reformatDate(studentToProgrammeStartMap[student.studentNumber], ISO_DATE_FORMAT),
    },
    semesterEnrollments: {
      key: 'semesterEnrollments',
      title: 'Semesters\npresent',
      export: false,
      filterType: 'range',
      getRowContent: student => getSemesterEnrollmentsContent(student),
      getRowVal: student => getSemesterEnrollmentsVal(student),
    },
    semesterEnrollmentsForExcel: {
      key: 'semesterEnrollmentsForExcel',
      title: 'Enrollment status',
      displayColumn: false,
      children: range(getFirstSemester(), getLastSemester() + 1).map(semester => ({
        key: `${semester}`,
        title: getTextIn(allSemestersMap[`${semester}`]?.name),
        displayColumn: false,
        getRowVal: student => {
          const studyRight = getStudyRight(student)
          if (!studyRight) {
            return 'No study right'
          }
          const enrollment = studyRight.semesterEnrollments?.find(enrollment => enrollment.semester === semester)
          return getEnrollmentTypeTextForExcel(enrollment?.type, enrollment?.statutoryAbsence)
        },
      })),
    },
    endDate: {
      key: 'endDate',
      title: combinedProgrammeCode ? 'Bachelor\ngraduation\ndate' : 'Graduation\ndate',
      filterType: 'date',
      getRowVal: student =>
        studentToStudyrightEndMap[student.studentNumber]
          ? reformatDate(studentToStudyrightEndMap[student.studentNumber], ISO_DATE_FORMAT)
          : '',
    },
    endDateCombinedProg: {
      key: 'endDateCombinedProg',
      title: combinedProgrammeCode === 'MH90_001' ? 'Licentiate\ngraduation\ndate' : 'Master\ngraduation\ndate',
      filterType: 'date',
      getRowVal: student =>
        studentToSecondStudyrightEndMap[student.studentNumber]
          ? reformatDate(studentToSecondStudyrightEndMap[student.studentNumber], ISO_DATE_FORMAT)
          : '',
    },
    startYear: {
      key: 'startYear',
      title: 'Start year\nat uni',
      filterType: 'range',
      getRowVal: student => getStarted(student),
    },
    programme: {
      key: 'programme',
      title: programmeCode ? 'Other programmes' : 'Study programmes',
      filterType: 'multi',
      getRowVal: student =>
        studentToOtherProgrammesMap[student.studentNumber]?.programmes.map(programme => getTextIn(programme.name)),
      formatValue: value => {
        if (!value.length) return null

        const formattedProgramme = value[0].length > 45 ? `${value[0].substring(0, 43)}...` : value[0]
        if (value.length === 1) return formattedProgramme

        return (
          <>
            {formattedProgramme} + {value.length - 1}
          </>
        )
      },
      getRowExportVal: student => studentToOtherProgrammesMap[student.studentNumber]?.getProgrammesList('; '),
      cellProps: student => {
        return { title: studentToOtherProgrammesMap[student.studentNumber]?.getProgrammesList('\n') }
      },
      helpText:
        'If student has more than one programme, hover your mouse on the cell to see the rest. They are also displayed in the exported Excel file.',
    },
    semesterEnrollmentsAmount: {
      key: 'semesterEnrollmentsAmount',
      title: 'Semesters present amount',
      export: true,
      displayColumn: false,
      getRowVal: student =>
        student.semesterEnrollmentsMap
          ? Object.values(student.semesterEnrollmentsMap).filter(enrollment => enrollment.enrollmenttype === 1).length
          : 0,
    },
    transferredFrom: {
      key: 'transferredFrom',
      title: 'Transferred\nfrom',
      getRowVal: student => (student.transferredStudyright ? transferFrom(student) : ''),
    },
    admissionType: shouldShowAdmissionType && {
      key: 'admissionType',
      title: 'Admission type',
      getRowVal: student => {
        const studyRight = getStudyRight(student)
        const admissionType = studyRight?.admissionType ?? 'Ei valintatapaa'
        return admissionType !== 'Koepisteet' ? admissionType : 'Valintakoe'
      },
    },
    passDate: {
      key: 'passDate',
      title: 'Attainment date',
      getRowVal: student => {
        const { date } = getGradeAndDate(student)
        return date ? reformatDate(date, ISO_DATE_FORMAT) : 'No attainment'
      },
    },
    enrollmentDate: {
      key: 'enrollmentDate',
      title: 'Enrollment date',
      getRowVal: student => {
        const date = getEnrollmentDate(student)
        return date ? reformatDate(date, ISO_DATE_FORMAT) : 'No enrollment'
      },
    },
    language: {
      key: 'language',
      title: 'Language',
      getRowVal: student => {
        const { language } = getGradeAndDate(student)
        return language
      },
    },
    gender: {
      key: 'gender',
      title: 'Gender',
      getRowVal: student => getGender(student.gender_code),
    },
    citizenship: {
      key: 'citizenship',
      title: 'Citizenship',
      getRowVal: student =>
        getTextIn({ fi: student.home_country_fi, en: student.home_country_en, sv: student.home_country_sv }),
    },
    option: (isBachelorsProgramme || isMastersProgramme) && {
      key: 'option',
      title: isMastersProgramme ? 'Bachelor' : 'Master',
      getRowVal: student => (student.option ? getTextIn(student.option.name) : ''),
      formatValue: value => (
        <div style={{ maxWidth: '290px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      ),
      cellProps: student => {
        return {
          title: student.option ? getTextIn(student.option.name) : '',
        }
      },
    },
    curriculumPeriod: {
      key: 'curriculumPeriod',
      title: 'Curriculum\nperiod',
      getRowVal: student => student.curriculumVersion,
    },
    latestAttainmentDate: {
      key: 'latestAttainmentDate',
      title: 'Latest\nattainment\ndate',
      getRowVal: student => {
        const studyPlan = student.studyplans.find(plan => plan.programme_code === programmeCode)
        if (!studyPlan) return ''
        const { included_courses: coursesInStudyPlan } = studyPlan
        const dates = student.courses
          .filter(course => coursesInStudyPlan.includes(course.course_code) && course.passed === true)
          .map(course => course.date)
        if (!dates.length) return ''
        const latestDate = dates.sort((a, b) => new Date(b) - new Date(a))[0]
        return reformatDate(latestDate, ISO_DATE_FORMAT)
      },
      helpText: getTextIn({
        fi: 'Päivämäärä, jolloin opiskelija on viimeksi suorittanut hyväksytysti kurssin, joka sisältyy hänen HOPSiinsa.',
        en: 'The date when the student last successfully completed a course included in their HOPS.',
      }),
    },
    extent: {
      key: 'extent',
      title: 'Extent',
      getRowVal: student =>
        student.studyRights
          .filter(
            studyRight =>
              studyRight.studyRightElements.filter(element => cleanedQueryStudyrights.includes(element.code)).length >=
              cleanedQueryStudyrights.length
          )
          .map(studyRight => studyRight.extentCode)
          .join(', '),
    },
    email: getCopyableEmailColumn({
      popupStates,
      copyItemsToClipboard,
      handlePopupOpen,
      handlePopupClose,
      fieldName: 'email',
    }),
    tags: {
      key: 'tags',
      title: 'Tags',
      getRowVal: student => (!student.obfuscated ? tags(student.tags) : ''),
    },
    updatedAt: {
      key: 'updatedAt',
      title: 'Last updated at',
      filterType: 'date',
      getRowVal: student => reformatDate(student.updatedAt, isAdmin ? ISO_DATE_FORMAT_DEV : ISO_DATE_FORMAT),
    },
  }

  // Columns are shown in order they're declared above. JS
  // guarantees this order of keys to stay for non-integer keys
  const orderOfColumns = Object.values(columnsAvailable).reduce(
    (acc, curr, index) => ({
      ...acc,
      [curr.key]: index,
    }),
    {}
  )

  const columns = chain(columnKeysToInclude)
    .map(colKey => columnsAvailable[colKey])
    .filter(col => !!col)
    .sortBy(col => orderOfColumns[col.key])
    .value()

  return (
    <SortableTable
      columns={columns}
      data={selectedStudents.map(studentNumber => students[studentNumber])}
      featureName="students"
      onlyExportColumns={hiddenNameAndEmailForExcel}
      title="General student information"
    />
  )
}
