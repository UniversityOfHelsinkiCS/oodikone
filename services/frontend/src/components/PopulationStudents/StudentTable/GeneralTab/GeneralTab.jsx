import React, { useState } from 'react'
import _ from 'lodash'
import moment from 'moment'
import SortableTable from 'components/SortableTable'
import useFilters from 'components/FilterView/useFilters'
import creditDateFilter from 'components/FilterView/filters/date'
import {
  getStudentTotalCredits,
  getTextIn,
  reformatDate,
  copyToClipboard,
  getHighestGradeOfCourseBetweenRange,
} from 'common'
import { hiddenNameAndEmailForExcel, getCopyableEmailColumn } from 'common/columns'
import { useGetSemestersQuery } from 'redux/semesters'
import StudentInfoItem from 'components/common/StudentInfoItem'
import { PRIORITYCODE_TEXTS } from '../../../../constants'
import sendEvent from '../../../../common/sendEvent'
import useLanguage from '../../../LanguagePicker/useLanguage'
import createMaps from './columnHelpers/createMaps'
import getSemestersPresentFunctions from './columnHelpers/semestersPresent'
import getStudyProgrammeFunctions from './columnHelpers/studyProgramme'

const GeneralTab = ({ group, populations, columnKeysToInclude, coursecode, filteredStudents, from, to, year }) => {
  const { language } = useLanguage()
  const { useFilterSelector } = useFilters()
  const [popupStates, setPopupStates] = useState({})
  const sendAnalytics = sendEvent.populationStudents
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

  const createSemesterEnrollmentsMap = student =>
    student.semesterenrollments?.reduce((enrollments, enrollment) => {
      const newEnrollmentsObject = { ...enrollments }
      newEnrollmentsObject[enrollment.semestercode] = enrollment.enrollmenttype
      return newEnrollmentsObject
    }, {})

  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)
  const students = Object.fromEntries(
    filteredStudents
      .map(stu => {
        return {
          ...stu,
          semesterEnrollmentsMap: createSemesterEnrollmentsMap(stu),
        }
      })
      .map(stu => [stu.studentNumber, stu])
  )

  const getCombinedProgrammeCode = (cleanedQueryStudyrights, studyGuidangeGroupProgrammes) => {
    if (cleanedQueryStudyrights.length > 1) return cleanedQueryStudyrights[1]
    if (studyGuidangeGroupProgrammes.length > 1) return studyGuidangeGroupProgrammes[1]
    return ''
  }

  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const cleanedQueryStudyrights = queryStudyrights.filter(sr => !!sr)
  const studyGuidangeGroupProgrammes =
    group?.tags?.studyProgramme && group?.tags?.studyProgramme.includes('+')
      ? group?.tags?.studyProgramme.split('+')
      : [group?.tags?.studyProgramme]
  const programmeCode = cleanedQueryStudyrights[0] || studyGuidangeGroupProgrammes[0]
  const combinedProgrammeCode = getCombinedProgrammeCode(cleanedQueryStudyrights, studyGuidangeGroupProgrammes)

  const {
    studentToStudyrightStartMap,
    studentToStudyrightEndMap,
    studentToProgrammeStartMap,
    studentToSecondStudyrightEndMap,
  } = createMaps({ students, selectedStudents, programmeCode, combinedProgrammeCode })

  const transferFrom = s => getTextIn(populationStatistics.elementdetails.data[s.transferSource].name, language)

  const studyrightCodes = (studyrights, value) => {
    return studyrights
      .filter(sr => {
        const { studyright_elements: studyrightElements } = sr
        return (
          studyrightElements.filter(sre => cleanedQueryStudyrights.includes(sre.code)).length >=
          cleanedQueryStudyrights.length
        )
      })
      .map(a => a[value])
  }

  const studytrack = studyrights => {
    let startdate = '1900-01-01'
    let enddate = '2020-04-20'
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 20)
        .forEach(el => {
          if (cleanedQueryStudyrights.includes(el.code)) {
            startdate = el.startdate // eslint-disable-line
            enddate = el.enddate // eslint-disable-line
          }
        })
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
        .forEach(el => {
          if (el.enddate > startdate && el.startdate <= enddate) {
            acc.push({
              name: populationStatistics.elementdetails.data[el.code].name.fi,
              startdate: el.startdate,
              enddate: el.enddate,
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
    const sinceDate = creditDateFilterOptions?.startDate || new Date('1.1.1970')
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
        ?.filter(e => coursecode.includes(e.course_code))
        ?.filter(e => e.semestercode >= fromSemester && e.semestercode <= toSemester) ?? null
    if (!enrollments || !enrollments.length) return ''
    return enrollments[0].enrollment_date_time
  }

  const copyToClipboardAll = event => {
    event.stopPropagation()
    const studentsInfo = selectedStudents.map(number => students[number])
    const emails = studentsInfo.filter(s => s.email && !s.obfuscated).map(s => s.email)
    const clipboardString = emails.join('; ')
    copyToClipboard(clipboardString)
    sendAnalytics('Copy all student emails to clipboard', 'Copy all student emails to clipboard')
  }

  const popupTimeoutLength = 1000
  let timeout = null

  const handlePopupOpen = id => {
    setPopupStates({ [id]: true })

    timeout = setTimeout(() => {
      setPopupStates({ [id]: false })
    }, popupTimeoutLength)
  }

  const handlePopupClose = id => {
    setPopupStates({ [id]: false })
    clearTimeout(timeout)
  }

  // Filters to check data for whether to show certain columns
  const containsStudyTracks = selectedStudents
    .map(sn => students[sn])
    .map(st => st.studyrights)
    .map(
      studyrights =>
        studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
          elemArr
            .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
            .forEach(el => acc.push(getTextIn(populationStatistics.elementdetails.data[el.code].name, language)))
          return acc
        }, []).length > 0
    )
    .some(el => el === true)

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

  const {
    getSemesterEnrollmentsContent,
    getSemesterEnrollmentsProps,
    getSemesterEnrollmentsForExcel,
    getSemesterEnrollmentsVal,
  } = getSemestersPresentFunctions({
    filteredStudents,
    language,
    allSemesters,
    allSemestersMap,
    year,
    studentToStudyrightEndMap,
    studentToSecondStudyrightEndMap,
  })

  const { getStudyProgrammeContent, studentProgrammesMap, getStudyStartDate } = getStudyProgrammeFunctions({
    selectedStudents,
    students,
    programmeCode,
    coursecode,
    studentToProgrammeStartMap,
    elementDetails: populationStatistics.elementdetails.data,
    language,
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
      forceToolsMode: 'none',
      headerProps: { style: { display: 'none' } },
      cellProps: { style: { display: 'none' } },
      getRowVal: s => s.phoneNumber,
    },
    studentnumber: {
      key: 'studentnumber',
      title: 'Student number',
      getRowVal: s => (!s.obfuscated ? s.studentNumber : 'hidden'),
      getRowContent: s => <StudentInfoItem student={s} showSisuLink tab="General Tab" />,
    },
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
      cellProps: s => getSemesterEnrollmentsProps(s),
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
      getRowContent: s => getStudyProgrammeContent(s),
      getRowVal: s => {
        return studentProgrammesMap[s.studentNumber]?.getProgrammesList('; ')
      },
      cellProps: s => {
        return { title: studentProgrammesMap[s.studentNumber]?.getProgrammesList('\n') }
      },
      helpText:
        'If students has more than one programme, hover your mouse on the cell to see the rest. They are also displayed in the exported Excel-file.',
    },
    semesterEnrollmentsAmount: {
      key: 'semesterEnrollmentsAmount',
      title: 'Semesters present amount',
      export: true,
      forceToolsMode: 'none',
      headerProps: { style: { display: 'none' } },
      cellProps: { style: { display: 'none' } },
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
        const studyright = s.studyrights.find(sr => sr.studyright_elements.some(e => e.code === programmeCode))
        return studyright && studyright.admission_type ? studyright.admission_type : 'Ei valintatapaa'
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
      getRowVal: s => (s.option ? getTextIn(s.option.name, language) : ''),
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
      copyToClipboardAll,
      sendAnalytics,
      handlePopupOpen,
      handlePopupClose,
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
      style={{ height: '80vh' }}
      title="General student information"
      getRowKey={s => s.studentNumber}
      columns={columns}
      onlyExportColumns={hiddenNameAndEmailForExcel}
      data={selectedStudents.map(sn => students[sn])}
    />
  )
}

export default GeneralTab
