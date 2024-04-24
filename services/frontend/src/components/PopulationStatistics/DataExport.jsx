import { flatten, sortBy } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'
import { Button, Icon, Popup } from 'semantic-ui-react'
import { utils, writeFile } from 'xlsx'

import { getStudentTotalCredits, getStudentToStudyrightStartMap, getTimestamp, reformatDate } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PRIORITYCODE_TEXTS } from '@/constants'
import { useGetCurriculumsQuery } from '@/redux/populationCourses'

export const DataExport = ({ students, programmeCode, curriculumYears }) => {
  const { getTextIn } = useLanguage()
  const queryYear = useSelector(({ populations }) => populations?.query?.year)
  const { data: mandatoryCourses } = useGetCurriculumsQuery(
    { code: programmeCode, periodIds: curriculumYears },
    { skip: !curriculumYears }
  )
  const populationStatistics = useSelector(({ populations }) => populations.data)
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const queryStudyrights = useSelector(({ populations }) =>
    populations.query ? Object.values(populations.query.studyRights) : []
  )

  const mandatoryPassed = () => {
    const mandatoryCodes = mandatoryCourses?.defaultProgrammeCourses
      ? mandatoryCourses?.defaultProgrammeCourses
          .filter(course => course.visible && course.visible.visibility)
          .map(course => course.code)
      : []
    const mandatoryCodesSecondProgramme = mandatoryCourses?.secondProgrammeCourses
      ? mandatoryCourses.secondProgrammeCourses
          .filter(course => course.visible && course.visible.visibility)
          .map(course => course.code)
      : []
    let mandatoryPassedCourses = {}
    if (courses) {
      mandatoryPassedCourses = {
        ...mandatoryCodes.reduce((obj, code) => {
          const foundCourse = courses.find(course => course.course.code === code)
          obj[code] = foundCourse
            ? Object.keys(courses.find(course => course.course.code === code).students.passed)
            : null
          return obj
        }, {}),
        ...mandatoryCodesSecondProgramme.reduce((obj, code) => {
          const foundCourse = courses.find(course => course.course.code === code)
          obj[code] = foundCourse
            ? Object.keys(courses.find(course => course.course.code === code).students.passed)
            : null
          return obj
        }, {}),
      }
    }
    return mandatoryPassedCourses
  }

  const transferFrom = student => getTextIn(populationStatistics.elementdetails.data[student.transferSource].name)

  const studyrightCodes = (studyrights, value) => {
    return studyrights
      .filter(studyright => {
        const { studyright_elements: studyrightElements } = studyright
        return (
          studyrightElements.filter(element => queryStudyrights.includes(element.code)).length >=
          queryStudyrights.length
        )
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
    return studyrights.find(studyright => studyright.studyright_elements.some(element => element.code === code))
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
    ).filter(element => element.code === code)
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
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elements) => {
      elements
        .filter(element => populationStatistics.elementdetails.data[element.code].type === 20)
        .forEach(element => {
          if (queryStudyrights.includes(element.code)) {
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
    const studentToProgrammeStartMap = students.reduce((res, student) => {
      const targetStudyright = flatten(
        student.studyrights.reduce((acc, curr) => {
          acc.push(curr.studyright_elements)
          return acc
        }, [])
      ).filter(element => element.code === programmeCode)
      res[student.studentNumber] = new Date(
        Math.max(new Date(targetStudyright[0]?.startdate), new Date(studentToStudyrightStarts[student.studentNumber]))
      )
      return res
    }, {})

    const worksheet = utils.json_to_sheet(
      students.map(student => ({
        'last name': student.lastname,
        'given names': student.firstnames,
        'student number': student.studentNumber,
        'all credits': student.allCredits ? student.allCredits : student.credits,
        'hops credits': student.hopsCredits,
        'credits since start': getStudentTotalCredits({
          ...student,
          courses: student.courses.filter(
            course => new Date(course.date) >= studentToProgrammeStartMap[student.studentNumber]
          ),
        }),
        'phone number': student.phoneNumber,
        email: student.email,
        secondaryEmail: student.secondaryEmail,
        'transferred from': student.transferredStudyright ? transferFrom(student) : '',
        priority: priorityText(student.studyrights),
        extent: extentCodes(student.studyrights),
        studytrack: studytrack(student.studyrights).map(studyright => studyright.name)[0],
        tags: tags(student.tags),
        'start year at university': reformatDate(student.started, 'YYYY'),
        'start of studyright': reformatDate(getStartOfStudyright(student.studyrights), 'YYYY-MM-DD'),
        'started in programme': reformatDate(getStartedInProgramme(student.studyrights), 'YYYY-MM-DD'),
        'admission type': parseInt(queryYear, 10 >= 2020) ? getAdmissionType(student.studyrights) : undefined,
        bachelor: student.option ? getTextIn(student.option.name) : '',
        'updated at': reformatDate(student.updatedAt, 'YYYY-MM-DD hh:mm:ss'),
        'mandatory total passed': totalMandatoryPassed(student.studentNumber, codes, programmeCode),
        ...sortedMandatory.reduce((acc, m) => {
          const bestGrade = findBestGrade(student.courses, m.code)
          let bestGradeOnChart
          if (!bestGrade) {
            if (
              student.enrollments &&
              student.enrollments.some(
                enrollment => enrollment.course_code === m.code && enrollment.state === 'ENROLLED'
              )
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
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet)
    return workbook
  }

  return (
    <Popup
      content="Click here to download a large Excel-workbook with both 'General' and 'Courses' tabs of the table below. To download them separately and select the columns, use the 'Export to Excel' button in the top-right corner of the table."
      trigger={
        <Button onClick={() => writeFile(generateWorkbook(), `oodikone_students_${getTimestamp()}.xlsx`)}>
          <Icon name="save" />
          Combined Excel
        </Button>
      }
    />
  )
}
