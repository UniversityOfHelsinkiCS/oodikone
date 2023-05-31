import React, { useState } from 'react'
import { Icon, Popup } from 'semantic-ui-react'
import _ from 'lodash'
import moment from 'moment'
import { useSelector } from 'react-redux'
import SortableTable from 'components/SortableTable'
import useFilters from 'components/FilterView/useFilters'
import creditDateFilter from 'components/FilterView/filters/date'
import {
  getStudentTotalCredits,
  getTextIn,
  getNewestProgramme,
  reformatDate,
  copyToClipboard,
  getHighestGradeOfCourseBetweenRange,
  getAllProgrammesOfStudent,
  hiddenNameAndEmailForExcel,
} from 'common'
import { useGetStudyGuidanceGroupPopulationQuery } from 'redux/studyGuidanceGroups'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { useGetSemestersQuery } from 'redux/semesters'
import StudentInfoItem from 'components/common/StudentInfoItem'
import { PRIORITYCODE_TEXTS } from '../../../constants'
import sendEvent from '../../../common/sendEvent'
import useLanguage from '../../LanguagePicker/useLanguage'

const GeneralTab = ({
  group,
  populations,
  columnKeysToInclude,
  studentToTargetCourseDateMap,
  coursecode,
  filteredStudents,
  from,
  to,
}) => {
  const { language } = useLanguage()
  const { useFilterSelector } = useFilters()
  const [popupStates, setPopupStates] = useState({})
  const sendAnalytics = sendEvent.populationStudents
  const { data: semesterData } = useGetSemestersQuery()
  const allSemesters = semesterData?.semesters ?? []

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
  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const cleanedQueryStudyrights = queryStudyrights.filter(sr => !!sr)
  const programmeCode = cleanedQueryStudyrights[0] || group?.tags?.studyProgramme
  const combinedProgrammeCode = cleanedQueryStudyrights.length > 1 ? cleanedQueryStudyrights[1] : ''

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

  const getStudentsProgrammeNames = s => {
    const programmes = getAllProgrammesOfStudent(
      s.studyrights,
      s.studentNumber,
      studentToTargetCourseDateMap,
      populationStatistics.elementdetails.data
    )
    if (programmes[0].code !== '00000' || !s.enrollments) {
      return programmes.map(prog => getTextIn(prog.name, language))
    }
    const filteredEnrollments = s.enrollments
      // eslint-disable-next-line camelcase
      .filter(({ course_code }) => coursecode.includes(course_code))
      .sort((a, b) => new Date(b.enrollment_date_time) - new Date(a.enrollment_date_time))
    if (!filteredEnrollments.length) return programmes.map(prog => getTextIn(prog.name, language))
    return getAllProgrammesOfStudent(
      s.studyrights,
      s.studentNumber,
      { [s.studentNumber]: filteredEnrollments[0].enrollment_date_time },
      populationStatistics.elementdetails.data
    ).map(prog => getTextIn(prog.name, language))
  }

  const { first: firstSemester, last: lastSemester } = filteredStudents.reduce(
    ({ first, last }, student) => {
      if (!student.semesterenrollments) return { first: 9999, last: 0 }
      const newFirst = Math.min(first, ...student.semesterenrollments.map(e => e.semestercode))
      const newLast = Math.max(last, ...student.semesterenrollments.map(e => e.semestercode))
      return { first: newFirst, last: newLast }
    },
    { first: 9999, last: 0 }
  )

  const mainProgramme = (studyrights, studentNumber, enrollments = []) => {
    const programme = getNewestProgramme(
      studyrights,
      studentNumber,
      studentToTargetCourseDateMap,
      populationStatistics.elementdetails.data
    )
    if (programme && programme.code !== '00000') {
      return programme
    }
    const filteredEnrollments = enrollments
      // eslint-disable-next-line camelcase
      .filter(({ course_code }) => coursecode.includes(course_code))
      .sort((a, b) => new Date(b.enrollment_date_time) - new Date(a.enrollment_date_time))
    if (!filteredEnrollments.length) return null
    return getNewestProgramme(
      studyrights,
      studentNumber,
      { [studentNumber]: filteredEnrollments[0].enrollment_date_time },
      populationStatistics.elementdetails.data
    )
  }

  const studentToStudyrightStartMap = selectedStudents.reduce((res, sn) => {
    const currentStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === programmeCode)
    )
    if (currentStudyright?.studyrightid && currentStudyright.studyrightid.slice(-2) === '-2') {
      const bachelorId = currentStudyright.studyrightid.replace(/-2$/, '-1')
      const bacherlorStudyright = students[sn].studyrights.find(studyright => studyright.studyrightid === bachelorId)
      res[sn] = bacherlorStudyright?.startdate || null
    } else {
      res[sn] = currentStudyright?.startdate || null
    }
    return res
  }, {})

  const studentToProgrammeStartMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = _.flatten(
      students[sn].studyrights.reduce((acc, curr) => {
        acc.push(curr.studyright_elements)
        return acc
      }, [])
    ).filter(e => e.code === programmeCode)
    // clean up odd bachelor start dates, (givendate)
    res[sn] = new Date(Math.max(new Date(targetStudyright[0]?.startdate), new Date(studentToStudyrightStartMap[sn])))
    return res
  }, {})

  const studentToStudyrightEndMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === programmeCode)
    )
    res[sn] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})

  const studentToSecondStudyrightEndMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === combinedProgrammeCode)
    )
    res[sn] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})

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

  const copyToClipboardAll = () => {
    const studentsInfo = selectedStudents.map(number => students[number])
    const emails = studentsInfo.filter(s => s.email && !s.obfuscated).map(s => s.email)
    const clipboardString = emails.join('; ')
    copyToClipboard(clipboardString)
    sendAnalytics('Copy all student emails to clipboard', 'Copy all student emails to clipboard')
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

  const enrollmentTypeText = type => {
    if (type === 1) return 'Present'
    if (type === 2) return 'Absent'
    if (type === 3) return 'Inactive'
    return 'Unknown enrollment type'
  }

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

  const graduatedOnSemester = (student, sem) => {
    const firstGraduation = studentToStudyrightEndMap[student.studentNumber]
    const secondGraduation = studentToSecondStudyrightEndMap[student.studentNumber]

    return (
      (firstGraduation && moment(firstGraduation).isBetween(allSemesters[sem].startdate, allSemesters[sem].enddate)) ||
      (secondGraduation && moment(secondGraduation).isBetween(allSemesters[sem].startdate, allSemesters[sem].enddate))
    )
  }

  const getSemesterEnrollmentsContent = student => {
    const semesterIcons = []

    const getSemesterJSX = (enrollmenttype, graduated) => {
      let type = 'none'
      if (enrollmenttype === 1) type = 'present'
      if (enrollmenttype === 2) type = 'absent'
      if (enrollmenttype === 3) type = 'passive'

      const graduationCrown = (
        <svg
          style={{ overflow: 'visible' }}
          width="23"
          height="23"
          viewBox="17 54 70 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M69.8203 29.1952L61.0704 56.1246H18.7499L10 29.1952L27.2632 38.9284L39.9102 15L52.5571 38.9284L69.8203 29.1952Z"
            stroke="#696969"
            fill="#fff238"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
      return <div className={`enrollment-label-no-margin label-${type}`}>{graduated ? graduationCrown : null}</div>
    }

    for (let sem = firstSemester; sem <= lastSemester; sem++) {
      semesterIcons.push(getSemesterJSX(student.semesterEnrollmentsMap[sem], graduatedOnSemester(student, sem)))
    }

    return <div style={{ display: 'flex', gap: '4px' }}>{semesterIcons}</div>
  }

  const getSemesterEnrollmentsProps = student => {
    if (allSemesters?.length === 0) return {}
    if (!student.semesterenrollments) return {}
    const title = student.semesterenrollments.reduce(
      (enrollmentsString, current) =>
        `${enrollmentsString}${enrollmentTypeText(current.enrollmenttype)} in ${getTextIn(
          allSemesters[current.semestercode].name,
          language
        )} ${graduatedOnSemester(student, current.semestercode) ? '(graduated) ' : ''} \n`,
      ''
    )
    return { title }
  }

  const getSemesterEnrollmentsForExcel = student => {
    if (allSemesters?.length === 0) return ''
    if (!student.semesterenrollments) return ''
    let enrollmentsString = `Starting from ${getTextIn(
      allSemesters[student.semesterenrollments[0].semestercode].name,
      language
    )}: `
    for (let sem = firstSemester; sem <= lastSemester; sem++) {
      const type = student.semesterEnrollmentsMap[sem]
      let sign = '_'
      if (type === 1) sign = '+'
      if (type === 2) sign = 'o'
      enrollmentsString += sign
    }

    return enrollmentsString
  }

  let creditsColumn = null
  const creditColumnKeys = columnKeysToInclude.filter(k => k.indexOf('credits.') === 0)

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
    studentnumber: {
      key: 'studentnumber',
      title: 'Student Number',
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
      title: 'Study Track',
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
      getRowVal: s => {
        if (programmeCode !== undefined) {
          return reformatDate(studentToProgrammeStartMap[s.studentNumber], 'YYYY-MM-DD')
        }

        const programme = mainProgramme(s.studyrights, s.studentNumber, s.enrollments) // enrollment = semester enrollment
        if (programme?.startdate) {
          return reformatDate(programme.startdate, 'YYYY-MM-DD')
        }
        return '-'
      },
    },
    endDate: {
      key: 'endDate',
      title: 'Graduation\ndate',
      filterType: 'date',
      getRowVal: s =>
        studentToStudyrightEndMap[s.studentNumber]
          ? reformatDate(studentToStudyrightEndMap[s.studentNumber], 'YYYY-MM-DD')
          : '',
    },
    endDateSecondPhase: {
      key: 'endDateSecondPhase',
      title: '2nd Graduation date',
      filterType: 'date',
      getRowVal: s =>
        studentToSecondStudyrightEndMap[s.studentNumber]
          ? reformatDate(studentToSecondStudyrightEndMap[s.studentNumber], 'YYYY-MM-DD')
          : '',
    },
    programme: {
      key: 'programme',
      title: 'Study Programme',
      getRowContent: s => {
        const programme = getTextIn(mainProgramme(s.studyrights, s.studentNumber, s.enrollments)?.name, language)
        if (!programme) return 'No programme'
        if (getStudentsProgrammeNames(s).length > 1) {
          return `${programme} ...`
        }
        return programme
      },
      getRowVal: s => getStudentsProgrammeNames(s).join('; '),
      cellProps: s => {
        return { title: getStudentsProgrammeNames(s).join('\n') }
      },
    },
    semesterEnrollments: {
      key: 'semesterEnrollments',
      title: 'Semesters\npresent',
      getRowContent: s => getSemesterEnrollmentsContent(s),
      cellProps: s => getSemesterEnrollmentsProps(s),
      getRowVal: s => s.semesterenrollments?.filter(e => e.enrollmenttype === 1).length ?? 0,
      getRowExportVal: s => getSemesterEnrollmentsForExcel(s),
      /* getSortingValue: s => {
        console.log(s)
        return s.semesterenrollments?.map(e => e.enrollmenttype === 1).length ?? 0
      }, */
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
    startYear: {
      key: 'startYear',
      title: 'Start Year\nat Uni',
      filterType: 'range',
      getRowVal: s => getStarted(s),
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
    email: {
      mergeHeader: true,
      merge: true,
      key: 'email',
      export: false,
      children: [
        {
          key: 'emailValue',
          title: (
            <>
              Email
              <Popup
                trigger={<Icon link name="copy" onClick={copyToClipboardAll} style={{ float: 'right' }} />}
                content="Copied email list!"
                on="click"
                open={popupStates['0']}
                onClose={() => handlePopupClose('0')}
                onOpen={() => handlePopupOpen('0')}
                position="top right"
              />
            </>
          ),
          textTitle: 'Email',
          getRowVal: s => s.email,
        },
        {
          key: 'copyEmail',
          textTitle: 'Secondary email',
          getRowVal: s => s.secondaryEmail,
          getRowContent: s =>
            s.email && !s.obfuscated ? (
              <Popup
                trigger={
                  <Icon
                    link
                    name="copy outline"
                    onClick={() => {
                      copyToClipboard(s.email)
                      sendAnalytics("Copy student's email to clipboard", "Copy student's email to clipboard")
                    }}
                    style={{ float: 'right' }}
                  />
                }
                content="Email copied!"
                on="click"
                open={popupStates[s.studentNumber]}
                onClose={() => handlePopupClose(s.studentNumber)}
                onOpen={() => handlePopupOpen(s.studentNumber)}
                position="top right"
              />
            ) : null,
          headerProps: { onClick: null, sorted: null },
          cellProps: { className: 'iconCellNoPointer' },
        },
      ],
    },
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
      tableProps={{
        collapsing: true,
        basic: true,
        compact: 'very',
        padded: false,
        celled: true,
      }}
      columns={columns}
      onlyExportColumns={hiddenNameAndEmailForExcel}
      data={selectedStudents.map(sn => students[sn])}
    />
  )
}

// study guidance groups -feature uses different population + rtk query, so it needs to
// be rendered differently. TODO: should refactor this, maybe with using allStudents
// from useFilters and making sure that it contains same students than the population
// backend returns with population query below (so caching works)
const StudyGuidanceGroupGeneralTabContainer = ({ group, ...props }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const { tags } = group
  const populations = useGetStudyGuidanceGroupPopulationQuery({ studentnumberlist: groupStudentNumbers, tags })
  return <GeneralTab populations={populations} group={group} {...props} />
}

const GeneralTabContainer = ({ studyGuidanceGroup, variant, ...props }) => {
  const populations = useSelector(({ populations }) => populations)
  const { namesVisible } = useSelector(({ settings }) => settings)
  const { isAdmin } = useGetAuthorizedUserQuery()

  const getStudyGuidanceGroupColumns = () => {
    const cols = ['credits.since', 'programme', 'startYear']
    if (studyGuidanceGroup?.tags?.studyProgramme)
      cols.push(
        'credits.hops',
        'studyrightStart',
        'studyStartDate',
        'studyStartDateActual',
        'endDate',
        'semesterEnrollments'
      )
    if (studyGuidanceGroup?.tags?.studyProgramme && studyGuidanceGroup?.tags?.year) {
      cols.push('admissionType')
    }
    return cols
  }

  const columnsByVariant = {
    customPopulation: ['credits.since', 'programme', 'startYear'],
    coursePopulation: [
      'gradeForSingleCourse',
      'programme',
      'passDate',
      'studyStartDate',
      'enrollmentDate',
      'language',
      'startYear',
    ],
    population: [
      'transferredFrom',
      'credits.hops',
      'credits.studyright',
      'priority',
      'extent',
      'semesterEnrollments',
      'studyrightStart',
      'studyStartDate',
      'studyStartDateActual',
      'endDate',
      'studyTrack',
      'admissionType',
    ],
    studyGuidanceGroupPopulation: getStudyGuidanceGroupColumns(),
  }
  if (populations?.query?.studyRights?.combinedProgramme && variant === 'population')
    columnsByVariant[variant].push('endDateSecondPhase')
  const baseColumns = ['credits', 'credits.all', 'studentnumber', 'tags', 'updatedAt', 'option']
  const nameColumnsToAdd = namesVisible ? ['email', 'lastname', 'firstname'] : []
  const adminColumnsToFilter = isAdmin ? [] : ['priority', 'extent', 'updatedAt']

  const columnKeysToInclude = _.chain(baseColumns)
    .union(columnsByVariant[variant])
    .union(nameColumnsToAdd)
    .difference(adminColumnsToFilter)
    .value()

  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <StudyGuidanceGroupGeneralTabContainer
        group={studyGuidanceGroup}
        columnKeysToInclude={columnKeysToInclude}
        {...props}
      />
    )
  }

  return <GeneralTab populations={populations} columnKeysToInclude={columnKeysToInclude} {...props} />
}

export default GeneralTabContainer
