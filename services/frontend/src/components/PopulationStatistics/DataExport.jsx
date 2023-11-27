import { flatten, sortBy } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'
import { Button, Icon, Popup } from 'semantic-ui-react'
import xlsx from 'xlsx'
import { curriculumsApi } from 'redux/populationCourses'
import { reformatDate, getStudentTotalCredits, getStudentToStudyrightStartMap } from '../../common'
import { PRIORITYCODE_TEXTS } from '../../constants'
import { useLanguage } from '../LanguagePicker/useLanguage'

const { useGetCurriculumsQuery } = curriculumsApi

export const DataExport = ({ students, programmeCode }) => {
  const { getTextIn } = useLanguage()
  const queryYear = useSelector(({ populations }) => populations?.query?.year)
  const curriculumQuery = useGetCurriculumsQuery({ code: programmeCode, period_ids: [queryYear] })
  const mandatoryCourses = curriculumQuery?.currentData
  const populationStatistics = useSelector(({ populations }) => populations.data)
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const queryStudyrights = useSelector(({ populations }) =>
    populations.query ? Object.values(populations.query.studyRights) : []
  )

  const mandatoryPassed = () => {
    const mandatoryCodes = mandatoryCourses?.defaultProgrammeCourses
      ? mandatoryCourses?.defaultProgrammeCourses
          .filter(course => course.visible && course.visible.visibility)
          .map(c => c.code)
      : []
    const mandatoryCodesSecondProgramme = mandatoryCourses?.secondProgrammeCourses
      ? mandatoryCourses.secondProgrammeCourses
          .filter(course => course.visible && course.visible.visibility)
          .map(c => c.code)
      : []
    let mandatoryPassedCourses = {}
    if (courses) {
      mandatoryPassedCourses = {
        ...mandatoryCodes.reduce((obj, code) => {
          const foundCourse = courses.find(c => c.course.code === code)
          obj[code] = foundCourse ? Object.keys(courses.find(c => c.course.code === code).students.passed) : null
          return obj
        }, {}),
        ...mandatoryCodesSecondProgramme.reduce((obj, code) => {
          const foundCourse = courses.find(c => c.course.code === code)
          obj[code] = foundCourse ? Object.keys(courses.find(c => c.course.code === code).students.passed) : null
          return obj
        }, {}),
      }
    }
    return mandatoryPassedCourses
  }

  const transferFrom = s => getTextIn(populationStatistics.elementdetails.data[s.transferSource].name)

  const studyrightCodes = (studyrights, value) => {
    return studyrights
      .filter(sr => {
        const { studyright_elements: studyrightElements } = sr
        return studyrightElements.filter(sre => queryStudyrights.includes(sre.code)).length >= queryStudyrights.length
      })
      .map(a => a[value])
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

  const findCorrectStudyright = studyrights => {
    const code = queryStudyrights[0]
    if (!code || !studyrights) return ''
    return studyrights.find(sr => sr.studyright_elements.some(e => e.code === code))
  }

  const getStartOfStudyright = studyrights => {
    const studyright = findCorrectStudyright(studyrights)
    return studyright?.startdate ? studyright.startdate : ''
  }

  const getStartedInProgramme = studyrights => {
    const code = queryStudyrights[0]
    if (!code || !studyrights) return ''
    const element = flatten(
      studyrights.reduce((acc, curr) => {
        acc.push(curr.studyright_elements)
        return acc
      }, [])
    ).filter(e => e.code === code)
    return new Date(Math.max(new Date(element[0]?.startdate), new Date(getStartOfStudyright(studyrights))))
  }

  const getAdmissionType = studyrights => {
    const studyright = findCorrectStudyright(studyrights)
    const admissionType = studyright && studyright.admission_type ? studyright.admission_type : 'Ei valintatapaa'
    return admissionType === 'Koepisteet' ? 'Valintakoe' : admissionType
  }

  const studytrack = studyrights => {
    let startdate = '1900-01-01'
    let enddate = '2020-04-20'
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 20)
        .forEach(el => {
          if (queryStudyrights.includes(el.code)) {
            startdate = el.startdate
            enddate = el.enddate
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

  const hasPassedMandatory = (studentNumber, code, codes) => {
    return codes[code] && codes[code].includes(studentNumber)
  }

  const totalMandatoryPassed = (studentNumber, codes, programmeCode) => {
    if (!programmeCode) return 0
    return (
      mandatoryCourses.defaultProgrammeCourses.reduce(
        (acc, m) => (hasPassedMandatory(studentNumber, m.code, codes) ? acc + 1 : acc),
        0
      ) +
      mandatoryCourses.secondProgrammeCourses.reduce(
        (acc, m) => (hasPassedMandatory(studentNumber, m.code, codes) ? acc + 1 : acc),
        0
      )
    )
  }

  const findBestGrade = (courses, code) => {
    const courseAttainments = courses.filter(course => [code, `AY${code}`, `A${code}`].includes(course.course_code))

    const bestGrade =
      courseAttainments.length > 0
        ? sortBy(courseAttainments, element => {
            const order = { 5: 0, 4: 1, 3: 2, 2: 3, 1: 4, HT: 5, TT: 6, 'Hyv.': 7, 'Hyl.': 8 }
            return order[element.grade]
          })[0].grade
        : null

    return bestGrade
  }

  const generateWorkbook = () => {
    const codes = mandatoryPassed()
    const sortedMandatory = programmeCode
      ? sortBy(
          [...mandatoryCourses.defaultProgrammeCourses, ...mandatoryCourses.secondProgrammeCourses],
          [
            m => {
              const res = m.code.match(/\d+/)
              return res ? Number(res[0]) : Number.MAX_VALUE
            },
          ]
        )
      : []

    const studentToStudyrightStarts = getStudentToStudyrightStartMap(students, programmeCode)
    const studentToProgrammeStartMap = students.reduce((res, sn) => {
      const targetStudyright = flatten(
        sn.studyrights.reduce((acc, curr) => {
          acc.push(curr.studyright_elements)
          return acc
        }, [])
      ).filter(e => e.code === programmeCode)
      // clean up odd bachelor start dates, (givendate)
      res[sn.studentNumber] = new Date(
        Math.max(new Date(targetStudyright[0]?.startdate), new Date(studentToStudyrightStarts[sn.studentNumber]))
      )
      return res
    }, {})

    const worksheet = xlsx.utils.json_to_sheet(
      students.map(s => ({
        'last name': s.lastname,
        'given names': s.firstnames,
        'student number': s.studentNumber,
        'all credits': s.allCredits ? s.allCredits : s.credits,
        'hops credits': s.hopsCredits,
        'credits since start': getStudentTotalCredits({
          ...s,
          courses: s.courses.filter(c => new Date(c.date) >= studentToProgrammeStartMap[s.studentNumber]),
        }),
        'phone number': s.phoneNumber,
        email: s.email,
        secondaryEmail: s.secondaryEmail,
        'transferred from': s.transferredStudyright ? transferFrom(s) : '',
        priority: priorityText(s.studyrights),
        extent: extentCodes(s.studyrights),
        studytrack: studytrack(s.studyrights).map(st => st.name)[0],
        tags: tags(s.tags),
        'start year at university': reformatDate(s.started, 'YYYY'),
        'start of studyright': reformatDate(getStartOfStudyright(s.studyrights), 'YYYY-MM-DD'),
        'started in programme': reformatDate(getStartedInProgramme(s.studyrights), 'YYYY-MM-DD'),
        'admission type': parseInt(queryYear, 10 >= 2020) ? getAdmissionType(s.studyrights) : undefined,
        bachelor: s.option ? getTextIn(s.option.name) : '',
        'updated at': reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss'),
        'mandatory total passed': totalMandatoryPassed(s.studentNumber, codes, programmeCode),
        ...sortedMandatory.reduce((acc, m) => {
          const bestGrade = findBestGrade(s.courses, m.code)
          let bestGradeOnChart

          if (!bestGrade) {
            if (
              s.enrollments &&
              s.enrollments.some(enrollment => enrollment.course_code === m.code && enrollment.state === 'ENROLLED')
            ) {
              bestGradeOnChart = 0
            } else {
              bestGradeOnChart = ''
            }
          } else if (bestGrade === 'Hyl.') {
            bestGradeOnChart = 0
          } else if (['1', '2', '3', '4', '5'].includes(bestGrade)) {
            bestGradeOnChart = parseInt(bestGrade, 10)
          } else {
            bestGradeOnChart = bestGrade
          }

          acc[`${getTextIn(m.name)} ${m.code}`] = bestGradeOnChart
          return acc
        }, {}),
      }))
    )
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet)
    return workbook
  }

  return (
    <Popup
      trigger={
        <Button
          onClick={() => {
            xlsx.writeFile(generateWorkbook(), 'students.xlsx')
          }}
        >
          <Icon name="save" />
          Combined Excel
        </Button>
      }
      content="Click here to download a large Excel-workbook with both 'General' and 'Courses' tabs of the table below. To download them separately and select the columns, use the 'Export to Excel' button in the top-right corner of the table."
    />
  )
}
