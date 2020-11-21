import { sortBy } from 'lodash'
import React from 'react'
import { useSelector } from 'react-redux'
import { Button, Icon } from 'semantic-ui-react'
import xlsx from 'xlsx'
import { getStudentTotalCredits, getTextIn, reformatDate } from '../../common'
import sendEvent from '../../common/sendEvent'
import { PRIORITYCODE_TEXTS } from '../../constants'
import useFilters from '../FilterTray/useFilters'
import useLanguage from '../LanguagePicker/useLanguage'

const sendAnalytics = sendEvent.populationStudents

export default () => {
  const { filteredStudents } = useFilters()
  const { language } = useLanguage()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const populationStatistics = useSelector(({ populations }) => populations.data)
  const queryStudyrights = useSelector(({ populations }) =>
    populations.query ? Object.values(populations.query.studyRights) : []
  )

  // FIXME:
  const mandatoryPassed = useSelector(({ populationCourses, populationMandatoryCourses }) => {
    const mandatoryCodes = populationMandatoryCourses.data
      .filter(course => course.visible && course.visible.visibility)
      .map(c => c.code)

    let mandatoryPassed = {}

    if (populationCourses.data.coursestatistics) {
      const courses = populationCourses.data.coursestatistics
      mandatoryPassed = mandatoryCodes.reduce((obj, code) => {
        const foundCourse = !!courses.find(c => c.course.code === code)
        obj[code] = foundCourse ? Object.keys(courses.find(c => c.course.code === code).students.passed) : null
        return obj
      }, {})
    }

    return mandatoryPassed
  })

  const transferFrom = s => getTextIn(populationStatistics.elementdetails.data[s.transferSource].name, language)

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

  const studytrack = studyrights => {
    let startdate = '1900-01-01'
    let enddate = '2020-04-20'
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 20)
        .forEach(el => {
          if (queryStudyrights.includes(el.code)) {
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
              enddate: el.enddate
            })
          }
        })
      acc.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))
      return acc
    }, [])
    return res
  }

  const hasPassedMandatory = (studentNumber, code) =>
    mandatoryPassed[code] && mandatoryPassed[code].includes(studentNumber)

  const totalMandatoryPassed = studentNumber =>
    mandatoryCourses.reduce((acc, m) => (hasPassedMandatory(studentNumber, m.code) ? acc + 1 : acc), 0)

  const generateWorkbook = () => {
    const sortedMandatory = sortBy(mandatoryCourses, [
      m => {
        const res = m.code.match(/\d+/)
        return res ? Number(res[0]) : Number.MAX_VALUE
      }
    ])

    const worksheet = xlsx.utils.json_to_sheet(
      filteredStudents.map(s => ({
        'last name': s.lastname,
        'given names': s.firstnames,
        'student number': s.studentNumber,
        'credits since start': getStudentTotalCredits(s),
        'all credits': s.credits,
        email: s.email,
        'transferred from': s.transferredStudyright ? transferFrom(s) : '',
        priority: priorityText(s.studyrights),
        extent: extentCodes(s.studyrights),
        studytrack: studytrack(s.studyrights).map(st => st.name)[0],
        tags: tags(s.tags),
        'start year at university': reformatDate(s.started, 'YYYY'),
        'updated at': reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss'),
        'mandatory total passed': totalMandatoryPassed(s.studentNumber),
        ...sortedMandatory.reduce((acc, m) => {
          acc[`${getTextIn(m.name, language)}\n${m.code}`] = hasPassedMandatory(s.studentNumber, m.code)
          return acc
        }, {})
      }))
    )
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet)
    return workbook
  }

  return (
    <Button
      icon
      labelPosition="right"
      onClick={() => {
        xlsx.writeFile(generateWorkbook(), 'students.xlsx')
        sendAnalytics('Download excel button clicked', 'Download excel button clicked')
      }}
    >
      Save as XLSX
      <Icon name="file excel" />
    </Button>
  )
}
