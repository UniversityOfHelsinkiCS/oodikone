import { chain, range } from 'lodash'
import moment from 'moment'
import { useState } from 'react'

import { getEnrollmentTypeTextForExcel, getHighestGradeOfCourseBetweenRange, getStudentTotalCredits } from '@/common'
import { getCopyableEmailColumn, getCopyableStudentNumberColumn, hiddenNameAndEmailForExcel } from '@/common/columns'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { PRIORITYCODE_TEXTS } from '@/constants'
import { DISPLAY_DATE_FORMAT, ISO_DATE_FORMAT, ISO_DATE_FORMAT_DEV } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetSemestersQuery } from '@/redux/semesters'
import { reformatDate } from '@/util/timeAndDate'
import { createMaps } from './columnHelpers/createMaps'
import { getSemestersPresentFunctions } from './columnHelpers/semestersPresent'
import { getStudyProgrammeFunctions } from './columnHelpers/studyProgramme'

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

  if (!populationStatistics || !populationStatistics.elementdetails) return null

  const studyGuidanceGroupProgrammes =
    group?.tags?.studyProgramme && group?.tags?.studyProgramme.includes('+')
      ? group?.tags?.studyProgramme.split('+')
      : [group?.tags?.studyProgramme]

  const programmeCode = query?.studyRights?.programme || studyGuidanceGroupProgrammes[0] || customPopulationProgramme

  const createSemesterEnrollmentsMap = student => {
    let semesterEnrollments

    if (programmeCode) {
      semesterEnrollments = student.studyrights.find(studyright =>
        studyright.studyright_elements.some(element => element.code === programmeCode)
      )?.semester_enrollments
    }

    semesterEnrollments = semesterEnrollments ?? student.semesterenrollments

    return semesterEnrollments.reduce((enrollments, { enrollmenttype, semestercode, statutoryAbsence }) => {
      enrollments[semestercode] = {
        enrollmenttype,
        statutoryAbsence: statutoryAbsence ?? false,
      }
      return enrollments
    }, {})
  }

  const selectedStudents = filteredStudents.map(student => student.studentNumber)
  const students = filteredStudents.reduce((acc, student) => {
    acc[student.studentNumber] = columnKeysToInclude.includes('semesterEnrollments')
      ? { ...student, semesterEnrollmentsMap: createSemesterEnrollmentsMap(student) }
      : student
    return acc
  }, {})

  const getCombinedProgrammeCode = (query, studyGuidanceGroupProgrammes) => {
    if (query && query?.studyRights?.combinedProgramme) return query.studyRights.combinedProgramme
    if (studyGuidanceGroupProgrammes.length > 1) return studyGuidanceGroupProgrammes[1]
    return ''
  }

  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const cleanedQueryStudyrights = queryStudyrights.filter(studyright => !!studyright)

  const combinedProgrammeCode = getCombinedProgrammeCode(query, studyGuidanceGroupProgrammes)

  const {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToProgrammeStartMap,
    studentToSecondStudyrightEndMap,
  } = createMaps({ students, selectedStudents, programmeCode, combinedProgrammeCode, year })

  const transferFrom = student => getTextIn(populationStatistics.elementdetails.data[student.transferSource].name)

  const studyrightCodes = (studyrights, value) => {
    return studyrights
      .filter(studyright => {
        const { studyright_elements: studyrightElements } = studyright
        return (
          studyrightElements.filter(element => cleanedQueryStudyrights.includes(element.code)).length >=
          cleanedQueryStudyrights.length
        )
      })
      .map(a => a[value])
  }

  const getStudyTrack = studyrights => {
    let startdate = '1900-01-01'
    let enddate = '2020-04-20'
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elements) => {
      elements
        .filter(element => populationStatistics.elementdetails.data[element.code].type === 20)
        .forEach(element => {
          if (cleanedQueryStudyrights.includes(element.code)) {
            startdate = element.startdate
            enddate = element.enddate
          }
        })
      elements
        .filter(element => populationStatistics.elementdetails.data[element.code].type === 30)
        .forEach(element => {
          if (element.enddate > startdate && element.startdate <= enddate) {
            acc.push({
              name: populationStatistics.elementdetails.data[element.code].name.fi,
              startdate: element.startdate,
              enddate: element.enddate,
            })
          }
        })
      acc.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))
      return acc
    }, [])
    return res
  }

  const priorityText = studyRights => {
    const codes = studyrightCodes(studyRights, 'prioritycode')
    return codes.map(code => (PRIORITYCODE_TEXTS[code] ? PRIORITYCODE_TEXTS[code] : code)).join(', ')
  }

  const extentCodes = studyRights => {
    const codes = studyrightCodes(studyRights, 'extentcode')
    return codes.join(', ')
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

  const containsStudyTracks = () => {
    const studentsInfo = selectedStudents.map(studentNumber => students[studentNumber])

    for (const { studyrights } of studentsInfo) {
      const studyRightElements = studyrightCodes(studyrights, 'studyright_elements').flat()
      if (studyRightElements.some(element => element.element_detail.type === 30)) {
        return true
      }
    }
    return false
  }

  const containsOption = cleanedQueryStudyrights.some(code => code.startsWith('MH') || code.startsWith('KH'))

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

  const getStudyright = student => {
    const studyright = student.studyrights.find(studyright =>
      studyright.studyright_elements.some(element => element.code === programmeCode)
    )
    return studyright
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

  const { getStudyProgrammeContent, studentProgrammesMap, getStudyStartDate } = getStudyProgrammeFunctions({
    coursecode,
    elementDetails: populationStatistics.elementdetails.data,
    getTextIn,
    programmeCode,
    selectedStudents,
    students,
    studentToProgrammeStartMap,
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
            course => new Date(course.date) >= studentToProgrammeStartMap[student.studentNumber]
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
    studyTrack: containsStudyTracks() && {
      key: 'studyTrack',
      title: 'Study track',
      getRowVal: student => getStudyTrack(student.studyrights).map(studytrack => studytrack.name)[0],
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
      getRowVal: student => getStudyStartDate(student),
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
          const studyright = getStudyright(student)
          if (!studyright) {
            return 'No study right'
          }
          const enrollment = studyright.semester_enrollments?.find(enrollment => enrollment.semestercode === semester)
          return getEnrollmentTypeTextForExcel(enrollment?.enrollmenttype, enrollment?.statutoryAbsence)
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
      getRowContent: student => getStudyProgrammeContent(student),
      getRowVal: student => {
        const programmesToUse = programmeCode
          ? studentProgrammesMap[student.studentNumber]?.programmes.filter(
              programme => programme.code !== programmeCode
            )
          : studentProgrammesMap[student.studentNumber]?.programmes
        return programmesToUse.map(programme => getTextIn(programme.name))
      },
      getRowExportVal: student => {
        const programmesToUse = programmeCode
          ? studentProgrammesMap[student.studentNumber]?.programmes.filter(
              programme => programme.code !== programmeCode
            )
          : studentProgrammesMap[student.studentNumber]?.programmes
        return programmesToUse.map(programme => getTextIn(programme.name)).join('; ')
      },
      cellProps: student => {
        return { title: studentProgrammesMap[student.studentNumber]?.getProgrammesList('\n') }
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
        student.semesterenrollments
          ? student.semesterenrollments.filter(enrollment => enrollment.enrollmenttype === 1).length
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
        const studyright = getStudyright(student)
        const admissionType = studyright && studyright.admission_type ? studyright.admission_type : 'Ei valintatapaa'
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
    option: containsOption && {
      key: 'option',
      title: cleanedQueryStudyrights.some(code => code.startsWith('MH')) ? 'Bachelor' : 'Master',
      getRowVal: student => (student.option ? getTextIn(student.option.name) : ''),
      formatValue: value => (value.length > 45 ? `${value.substring(0, 43)}...` : value),
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
      title: 'Latest attainment date',
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
    priority: {
      key: 'priority',
      title: 'Priority',
      getRowVal: student => priorityText(student.studyrights),
    },
    extent: {
      key: 'extent',
      title: 'Extent',
      getRowVal: student => extentCodes(student.studyrights),
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
