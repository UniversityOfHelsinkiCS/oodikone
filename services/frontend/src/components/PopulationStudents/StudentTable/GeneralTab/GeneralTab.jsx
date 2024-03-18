import _ from 'lodash'
import moment from 'moment'
import React, { useState } from 'react'

import { getHighestGradeOfCourseBetweenRange, getStudentTotalCredits, reformatDate } from '@/common'
import { getCopyableEmailColumn, getCopyableStudentNumberColumn, hiddenNameAndEmailForExcel } from '@/common/columns'
import { creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { PRIORITYCODE_TEXTS } from '@/constants'
import { useGetSemestersQuery } from '@/redux/semesters'
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

  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)
  const students = filteredStudents.reduce((acc, stu) => {
    acc[stu.studentNumber] = columnKeysToInclude.includes('semesterEnrollments')
      ? { ...stu, semesterEnrollmentsMap: createSemesterEnrollmentsMap(stu) }
      : stu
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

  const transferFrom = s => getTextIn(populationStatistics.elementdetails.data[s.transferSource].name)

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

  const studytrack = studyrights => {
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
    const studentTags = tags.map(t => t.tag.tagname)
    return studentTags.join(', ')
  }

  const getStarted = ({ obfuscated, started }) => {
    if (obfuscated || !started) return ''
    return moment(started).get('year')
  }

  const getGradeAndDate = s => {
    const courses = s.courses.filter(c => coursecode.includes(c.course_code))
    const highestGrade = getHighestGradeOfCourseBetweenRange(courses, from, to)
    if (!highestGrade) return { grade: '-', date: '', language: '' }
    const { date, language } = courses
      .filter(c => c.grade === highestGrade.grade)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    return {
      grade: highestGrade.grade,
      date,
      language,
    }
  }

  const getCreditsBetween = s => {
    if (group?.tags?.year) {
      return getStudentTotalCredits({
        ...s,
        courses: s.courses.filter(c => new Date(c.date) > new Date(group?.tags?.year, 7, 1)),
      })
    }
    const sinceDate = creditDateFilterOptions?.startDate || new Date(1970, 0, 1)
    const untilDate = creditDateFilterOptions?.endDate || new Date()

    const credits = getStudentTotalCredits({
      ...s,
      courses: s.courses.filter(c => new Date(c.date) >= sinceDate && new Date(c.date) <= untilDate),
    })
    return credits
  }

  const getEnrollmentDate = s => {
    const enrollments =
      s.enrollments
        ?.filter(enrollment => coursecode.includes(enrollment.course_code))
        ?.filter(enrollment => enrollment.semestercode >= fromSemester && enrollment.semestercode <= toSemester) ?? null
    if (!enrollments || !enrollments.length) return ''
    return enrollments[0].enrollment_date_time
  }

  const copyItemsToClipboard = (event, fieldName) => {
    event.stopPropagation()
    const studentsInfo = selectedStudents.map(number => students[number])
    const list = studentsInfo.filter(s => s[fieldName] && !s.obfuscated).map(s => s[fieldName])
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

  // Filters to check data for whether to show certain columns
  const containsStudyTracks =
    Object.keys(populationStatistics.elementdetails.data) > 0
      ? selectedStudents
          .map(sn => students[sn])
          .map(st => st.studyrights)
          .map(
            studyrights =>
              studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elements) => {
                elements
                  .filter(element => populationStatistics.elementdetails?.data[element.code].type === 30)
                  .forEach(element => acc.push(getTextIn(populationStatistics.elementdetails.data[element.code].name)))
                return acc
              }, []).length > 0
          )
          .some(element => element === true)
      : false

  const containsOption = cleanedQueryStudyrights.some(code => code.startsWith('MH') || code.startsWith('KH'))

  const shouldShowAdmissionType = parseInt(query?.year, 10) >= 2020 || parseInt(group?.tags?.year, 10) >= 2020

  let creditColumnTitle = 'Since start\nin programme'

  if (creditDateFilterOptions) {
    const { startDate, endDate } = creditDateFilterOptions

    if (startDate && !endDate) {
      creditColumnTitle = `Since ${moment(startDate).format('DD.MM.YYYY')}`
    } else if (endDate && !startDate) {
      creditColumnTitle = `Before ${moment(endDate).format('DD.MM.YYYY')}`
    } else if (endDate && startDate) {
      creditColumnTitle = `Between ${moment(startDate).format('DD.MM.YYYY')} and ${moment(endDate).format(
        'DD.MM.YYYY'
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
      title += since ? `Since ${moment(since).format('DD.MM.YYYY')}` : 'Since 1.1.1970'
    }
    if (until) {
      title += `\nuntil ${moment(until).format('DD.MM.YYYY')}`
    }
    return title
  }

  let creditsColumn = null
  const creditColumnKeys = columnKeysToInclude.filter(k => k.indexOf('credits.') === 0)

  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsForExcel, getSemesterEnrollmentsVal } =
    getSemestersPresentFunctions({
      programmeCode,
      filteredStudents,
      allSemesters,
      allSemestersMap,
      year,
      studentToStudyrightEndMap,
      studentToSecondStudyrightEndMap,
      getTextIn,
    })

  const { getStudyProgrammeContent, studentProgrammesMap, getStudyStartDate } = getStudyProgrammeFunctions({
    selectedStudents,
    students,
    programmeCode,
    coursecode,
    studentToProgrammeStartMap,
    elementDetails: populationStatistics.elementdetails.data,
    getTextIn,
  })

  const availableCreditsColumns = {
    all: sole => ({
      key: 'credits-all',
      title: sole ? 'All Credits' : 'All',
      filterType: 'range',
      getRowVal: s => s.allCredits || s.credits,
    }),
    hops: sole => ({
      key: 'credits-hops',
      title: sole ? 'Credits in HOPS' : 'HOPS',
      filterType: 'range',
      getRowVal: s =>
        s.hopsCredits !== undefined
          ? s.hopsCredits
          : s.studyplans?.find(plan => plan.programme_code === programmeCode)?.completed_credits ?? 0,
    }),
    hopsCombinedProg: () => ({
      key: 'credits-hopsCombinedProg',
      title: combinedProgrammeCode === 'MH90_001' ? 'Licentiate\nHOPS' : 'Master\nHOPS',
      filterType: 'range',
      getRowVal: s => s.studyplans?.find(plan => plan.programme_code === combinedProgrammeCode)?.completed_credits ?? 0,
    }),
    studyright: sole => ({
      key: 'credits-studyright',
      title: sole ? `Credits ${creditColumnTitle}` : creditColumnTitle,
      filterType: 'range',
      getRowVal: s => {
        const credits = getStudentTotalCredits({
          ...s,
          courses: s.courses.filter(c => new Date(c.date) >= studentToProgrammeStartMap[s.studentNumber]),
        })
        return credits
      },
    }),

    since: sole => ({
      // If a year is associated and no filters exist, this will act differently
      key: 'credits-since',
      title: getTitleForCreditsSince(sole),
      filterType: 'range',
      getRowVal: s => getCreditsBetween(s),
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

  // All columns components user is able to use
  const columnsAvailable = {
    lastname: { key: 'lastname', title: 'Last name', getRowVal: s => s.lastname, export: false },
    firstname: { key: 'firstname', title: 'Given names', getRowVal: s => s.firstnames, export: false },
    phoneNumber: {
      key: 'phoneNumber',
      title: 'Phone number',
      export: true,
      displayColumn: false,
      getRowVal: s => s.phoneNumber,
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
      getRowVal: s => {
        const { grade } = getGradeAndDate(s)
        return grade
      },
    },
    studyTrack: containsStudyTracks && {
      key: 'studyTrack',
      title: 'Study track',
      getRowVal: s => studytrack(s.studyrights).map(st => st.name)[0],
    },
    studyrightStart: {
      key: 'studyrightStart',
      title: 'Start of\nstudyright',
      filterType: 'date',
      getRowVal: s => reformatDate(studentToStudyrightStartMap[s.studentNumber], 'YYYY-MM-DD'),
    },
    studyStartDate: {
      key: 'studyStartDate',
      title: 'Started in\nprogramme',
      filterType: 'date',
      getRowVal: s => getStudyStartDate(s),
    },
    semesterEnrollments: {
      key: 'semesterEnrollments',
      title: 'Semesters\npresent',
      filterType: 'range',
      getRowContent: s => getSemesterEnrollmentsContent(s),
      getRowVal: s => getSemesterEnrollmentsVal(s),
      getRowExportVal: s => getSemesterEnrollmentsForExcel(s),
    },
    endDate: {
      key: 'endDate',
      title: combinedProgrammeCode ? 'Bachelor\ngraduation\ndate' : 'Graduation\ndate',
      filterType: 'date',
      getRowVal: s =>
        studentToStudyrightEndMap[s.studentNumber]
          ? reformatDate(studentToStudyrightEndMap[s.studentNumber], 'YYYY-MM-DD')
          : '',
    },
    endDateCombinedProg: {
      key: 'endDateCombinedProg',
      title: combinedProgrammeCode === 'MH90_001' ? 'Licentiate\ngraduation\ndate' : 'Master\ngraduation\ndate',
      filterType: 'date',
      getRowVal: s =>
        studentToSecondStudyrightEndMap[s.studentNumber]
          ? reformatDate(studentToSecondStudyrightEndMap[s.studentNumber], 'YYYY-MM-DD')
          : '',
    },
    startYear: {
      key: 'startYear',
      title: 'Start year\nat uni',
      filterType: 'range',
      getRowVal: s => getStarted(s),
    },
    programme: {
      key: 'programme',
      title: programmeCode ? 'Other programmes' : 'Study programmes',
      filterType: 'multi',
      getRowContent: s => getStudyProgrammeContent(s),
      getRowVal: s => {
        return studentProgrammesMap[s.studentNumber]?.programmes.map(p => getTextIn(p.name))
      },
      cellProps: s => {
        return { title: studentProgrammesMap[s.studentNumber]?.getProgrammesList('\n') }
      },
      helpText:
        'If student has more than one programme, hover your mouse on the cell to see the rest. They are also displayed in the exported Excel file.',
    },
    semesterEnrollmentsAmount: {
      key: 'semesterEnrollmentsAmount',
      title: 'Semesters present amount',
      export: true,
      displayColumn: false,
      getRowVal: s => (s.semesterenrollments ? s.semesterenrollments.filter(e => e.enrollmenttype === 1).length : 0),
    },
    transferredFrom: {
      key: 'transferredFrom',
      title: 'Transferred\nfrom',
      getRowVal: s => (s.transferredStudyright ? transferFrom(s) : ''),
    },
    admissionType: shouldShowAdmissionType && {
      key: 'admissionType',
      title: 'Admission type',
      getRowVal: s => {
        const studyright = s.studyrights.find(studyright =>
          studyright.studyright_elements.some(e => e.code === programmeCode)
        )
        const admissionType = studyright && studyright.admission_type ? studyright.admission_type : 'Ei valintatapaa'
        return admissionType !== 'Koepisteet' ? admissionType : 'Valintakoe'
      },
    },
    passDate: {
      key: 'passDate',
      title: 'Attainment date',
      getRowVal: s => {
        const { date } = getGradeAndDate(s)
        return date ? reformatDate(date, 'YYYY-MM-DD') : 'No attainment'
      },
    },
    enrollmentDate: {
      key: 'enrollmentDate',
      title: 'Enrollment date',
      getRowVal: s => {
        const date = getEnrollmentDate(s)
        return date ? reformatDate(date, 'YYYY-MM-DD') : 'No enrollment'
      },
    },
    language: {
      key: 'language',
      title: 'Language',
      getRowVal: s => {
        const { language } = getGradeAndDate(s)
        return language
      },
    },
    option: containsOption && {
      key: 'option',
      title: cleanedQueryStudyrights.some(code => code.startsWith('MH')) ? 'Bachelor' : 'Master',
      getRowVal: s => (s.option ? getTextIn(s.option.name) : ''),
      formatValue: val => (val.length > 45 ? `${val.substring(0, 43)}...` : val),
      cellProps: s => {
        return {
          title: s.option ? getTextIn(s.option.name) : '',
        }
      },
    },
    latestAttainmentDate: {
      key: 'latestAttainmentDate',
      title: 'Latest attainment date',
      getRowVal: s => {
        const studyPlan = s.studyplans.find(sp => sp.programme_code === programmeCode)
        if (!studyPlan) return ''
        const { included_courses: coursesInStudyPlan } = studyPlan

        const dates = s.courses
          .filter(c => coursesInStudyPlan.includes(c.course_code) && c.passed === true)
          .map(c => c.date)
        if (!dates.length) return ''
        const latestDate = dates.sort((a, b) => new Date(b) - new Date(a))[0]
        return reformatDate(latestDate, 'YYYY-MM-DD')
      },
      helpText: getTextIn({
        fi: 'Päivämäärä, jolloin opiskelija on viimeksi suorittanut hyväksytysti kurssin, joka sisältyy hänen HOPSiinsa.',
        en: 'The date when the student last successfully completed a course included in their HOPS.',
      }),
    },
    priority: {
      key: 'priority',
      title: 'Priority',
      getRowVal: s => priorityText(s.studyrights),
    },
    extent: {
      key: 'extent',
      title: 'Extent',
      getRowVal: s => extentCodes(s.studyrights),
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
      getRowVal: s => (!s.obfuscated ? tags(s.tags) : ''),
    },
    updatedAt: {
      key: 'updatedAt',
      title: 'Last Updated At',
      filterType: 'date',
      getRowVal: s => reformatDate(s.updatedAt, 'YYYY-MM-DD  HH:mm:ss'),
    },
  }
  // Columns are shown in order they're declared above. JS guarantees this order of keys
  // to stay for non-integer keys
  const orderOfColumns = Object.values(columnsAvailable).reduce(
    (acc, curr, ind) => ({
      ...acc,
      [curr.key]: ind,
    }),
    {}
  )

  const columns = _.chain(columnKeysToInclude)
    .map(colKey => columnsAvailable[colKey])
    .filter(col => !!col)
    .sortBy(col => orderOfColumns[col.key])
    .value()

  return (
    <SortableTable
      columns={columns}
      data={selectedStudents.map(sn => students[sn])}
      featureName="students"
      onlyExportColumns={hiddenNameAndEmailForExcel}
      style={{ height: '80vh' }}
      title="General student information"
    />
  )
}
