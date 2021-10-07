import React, { useState } from 'react'
import { shape, bool, string, arrayOf } from 'prop-types'
import { Item, Icon, Popup } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { flatten } from 'lodash'
import moment from 'moment'
import { connect } from 'react-redux'
import SortableTable from '../../SortableTable'
import {
  getStudentTotalCredits,
  getTextIn,
  getNewestProgramme,
  reformatDate,
  copyToClipboard,
  getUserIsAdmin,
} from '../../../common'
import { PRIORITYCODE_TEXTS } from '../../../constants'
import sendEvent from '../../../common/sendEvent'
import useFilters from '../../FilterTray/useFilters'
import useLanguage from '../../LanguagePicker/useLanguage'

// TODO: Refactoring in process, contains lot of duplicate code.

const GeneralTab = ({
  showNames,
  coursePopulation,
  customPopulation,
  populationStatistics,
  queryStudyrights,
  isAdmin,
  studentToTargetCourseDateMap,
  coursecode,
  queryYear,
}) => {
  const { language } = useLanguage()
  const { filteredStudents } = useFilters()
  const [popupStates, setPopupStates] = useState({})
  const sendAnalytics = sendEvent.populationStudents

  // TODO: Refactor this away:
  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)

  // TODO: This fixes crashing upon using back button. Find the root cause and fix it.
  if (!populationStatistics.elementdetails) {
    return null
  }

  const students = Object.fromEntries(filteredStudents.map(stu => [stu.studentNumber, stu]))
  const cleanedQueryStudyrights = queryStudyrights.filter(sr => !!sr)

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

  const mainProgramme = (studyrights, studentNumber) => {
    const programme = getNewestProgramme(
      studyrights,
      studentNumber,
      studentToTargetCourseDateMap,
      populationStatistics.elementdetails.data
    )
    if (programme) {
      return programme.name
    }
    return null
  }

  const studentToStudyrightStartMap = !(customPopulation || coursePopulation)
    ? selectedStudents.reduce((res, sn) => {
        const targetStudyright = flatten(
          students[sn].studyrights.reduce((acc, curr) => {
            acc.push(curr.studyright_elements)
            return acc
          }, [])
        ).filter(e => e.code === cleanedQueryStudyrights[0])
        res[sn] = targetStudyright[0] ? targetStudyright[0].startdate : null
        return res
      }, {})
    : null

  const studentToStudyrightActualStartMap = !(customPopulation || coursePopulation)
    ? selectedStudents.reduce((res, sn) => {
        const targetStudyright = students[sn].studyrights.find(studyright =>
          studyright.studyright_elements.some(e => e.code === cleanedQueryStudyrights[0])
        )
        res[sn] = targetStudyright ? targetStudyright.studystartdate : null
        return res
      }, {})
    : null

  const studentToStudyrightEndMap = !(customPopulation || coursePopulation)
    ? selectedStudents.reduce((res, sn) => {
        const targetStudyright = students[sn].studyrights.find(studyright =>
          studyright.studyright_elements.some(e => e.code === cleanedQueryStudyrights[0])
        )
        res[sn] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
        return res
      }, {})
    : null

  const getActualStartDate = studentNumber => {
    const studyRightStart = studentToStudyrightStartMap[studentNumber]
    const studyRightStartActual = studentToStudyrightActualStartMap[studentNumber]

    if (!studyRightStart) return studyRightStartActual
    if (!studyRightStartActual) return studyRightStart

    return new Date(studyRightStart).getTime() > new Date(studyRightStartActual).getTime()
      ? studyRightStart
      : studyRightStartActual
  }

  const copyToClipboardAll = () => {
    const studentsInfo = selectedStudents.map(number => students[number])
    const emails = studentsInfo.filter(s => s.email && !s.obfuscated).map(s => s.email)
    const clipboardString = emails.join('; ')
    copyToClipboard(clipboardString)
    sendAnalytics('Copy all student emails to clipboard', 'Copy all student emails to clipboard')
  }

  const containsStudyTracks = () => {
    const allStudyrights = selectedStudents.map(sn => students[sn]).map(st => st.studyrights)
    return allStudyrights
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
  }

  const columns = []
  if (showNames) {
    columns.push(
      { key: 'lastname', title: 'last name', getRowVal: s => s.lastname },
      { key: 'firstname', title: 'given names', getRowVal: s => s.firstnames }
    )
  }
  columns.push(
    {
      key: 'studentnumber',
      title: 'Student Number',
      getRowVal: s => (!s.obfuscated ? s.studentNumber : 'hidden'),
      getRowContent: s => (
        <span style={s.obfuscated ? { fontStyle: 'italic', color: 'graytext' } : {}}>
          {!s.obfuscated ? s.studentNumber : 'hidden'}
        </span>
      ),
      headerProps: { colSpan: 2 },
    },
    {
      key: 'icon',
      getRowVal: s =>
        !s.obfuscated && (
          <Item
            as={Link}
            to={`/students/${s.studentNumber}`}
            onClick={() => {
              sendAnalytics('Student details button clicked', 'General tab')
            }}
          >
            <Icon name="level up alternate" />
          </Item>
        ),
      cellProps: { collapsing: true, className: 'iconCellNoPointer' },
    }
  )
  if (!(coursePopulation || customPopulation)) {
    columns.push({
      key: 'credits since start',
      title: 'credits since start of studyright',
      getRowVal: s => {
        const credits = getStudentTotalCredits(s)
        return credits
      },
    })
  }

  if (coursecode.length > 0) {
    columns.push({
      key: 'grade for single course',
      title: 'Grade',
      getRowVal: s => {
        const grade = s.courses.filter(c => coursecode.includes(c.course_code))
        if (grade) {
          grade.sort((a, b) => (moment(a.date).isBefore(b.date) ? 1 : -1))
          return grade[0].grade
        }
        return ''
      },
    })
  }

  columns.push({
    key: 'all credits',
    title: 'All Credits',
    getRowVal: s => s.credits,
  })

  if (!(coursePopulation || customPopulation)) {
    columns.push({
      key: 'transferred from',
      title: 'Transferred From',
      getRowVal: s => (s.transferredStudyright ? transferFrom(s) : ''),
    })
  }
  if (containsStudyTracks() && !(coursePopulation || customPopulation)) {
    columns.push({
      key: 'studytrack',
      title: 'Study Track',
      getRowVal: s => studytrack(s.studyrights).map(st => st.name)[0],
    })
  }

  if (isAdmin && !(coursePopulation || customPopulation)) {
    columns.push(
      {
        key: 'priority',
        title: 'priority',
        getRowVal: s => priorityText(s.studyrights),
      },
      {
        key: 'extent',
        title: 'extent',
        getRowVal: s => extentCodes(s.studyrights),
      }
    )
  }
  columns.push({
    key: 'tags',
    title: 'Tags',
    getRowVal: s => (!s.obfuscated ? tags(s.tags) : ''),
  })

  if (!(coursePopulation || customPopulation)) {
    if (isAdmin) {
      columns.push({
        key: 'studystartdate',
        title: 'start of studyright',
        getRowVal: s => new Date(studentToStudyrightStartMap[s.studentNumber]).getTime(),
        getRowContent: s => reformatDate(studentToStudyrightStartMap[s.studentNumber], 'YYYY-MM-DD'),
      })
    }

    // potentially will replace the 'start of studyright' column - both present for validation
    columns.push({
      key: 'studystartdateactual',
      title: 'started in studyright',
      getRowVal: s => new Date(getActualStartDate(s.studentNumber)).getTime(),
      getRowContent: s => reformatDate(getActualStartDate(s.studentNumber), 'YYYY-MM-DD'),
    })

    columns.push({
      key: 'enddate',
      title: 'graduation date',
      getRowVal: s => new Date(studentToStudyrightEndMap[s.studentNumber]).getTime(),
      getRowContent: s =>
        studentToStudyrightEndMap[s.studentNumber]
          ? reformatDate(studentToStudyrightEndMap[s.studentNumber], 'YYYY-MM-DD')
          : '',
    })
  }

  if (!(coursePopulation || customPopulation) && parseInt(queryYear, 10) >= 2020) {
    const code = queryStudyrights[0]
    columns.push({
      key: 'admission type',
      title: 'admission type',
      getRowVal: s => {
        const studyright = s.studyrights.find(sr => sr.studyright_elements.some(e => e.code === code))
        return studyright && studyright.admission_type ? studyright.admission_type : 'Ei valintatapaa'
      },
    })
  }

  if (coursePopulation || customPopulation) {
    columns.push(
      {
        key: 'programme',
        title: 'Study Programme',
        getRowVal: s => getTextIn(mainProgramme(s.studyrights, s.studentNumber), language) || 'No programme',
      },
      {
        key: 'startyear',
        title: 'Start Year at Uni',
        getRowVal: s => (!s.obfuscated ? reformatDate(s.started, 'YYYY') : ''),
      }
    )
  }

  if (cleanedQueryStudyrights.some(code => code.startsWith('MH') || code.startsWith('KH')))
    columns.push({
      key: 'option',
      title: cleanedQueryStudyrights.some(code => code.startsWith('MH')) ? 'Bachelor' : 'Master',
      getRowVal: s => (s.option ? getTextIn(s.option.name, language) : ''),
    })

  if (showNames) {
    columns.push(
      {
        key: 'email',
        title: (
          <>
            email
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
        getRowVal: s => s.email,
        headerProps: { colSpan: 2 },
      },
      {
        key: 'copy email',
        getRowVal: s =>
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
        cellProps: { collapsing: true, className: 'iconCellNoPointer' },
      }
    )
  }

  if (isAdmin) {
    columns.push({
      key: 'updatedAt',
      title: 'Last Updated At',
      getRowVal: s => reformatDate(s.updatedAt, 'YYYY-MM-DD  HH:mm:ss'),
    })
  }

  return (
    <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
      <SortableTable
        getRowKey={s => s.studentNumber}
        tableProps={{
          collapsing: true,
          basic: true,
          compact: 'very',
          padded: false,
          celled: true,
        }}
        columns={columns}
        data={selectedStudents.map(sn => students[sn])}
      />
    </div>
  )
}

GeneralTab.defaultProps = {
  studentToTargetCourseDateMap: null,
  customPopulation: false,
  coursePopulation: false,
}

GeneralTab.propTypes = {
  showNames: bool.isRequired,
  coursePopulation: bool,
  customPopulation: bool,
  populationStatistics: shape({}).isRequired,
  queryStudyrights: arrayOf(string).isRequired,
  isAdmin: bool.isRequired,
  studentToTargetCourseDateMap: shape({}),
}

const mapStateToProps = state => {
  const {
    populations,
    auth: {
      token: { roles },
    },
  } = state

  return {
    isAdmin: getUserIsAdmin(roles),
    populationStatistics: populations.data,
    queryStudyrights: populations.query ? Object.values(populations.query.studyRights) : [],
    queryYear: populations?.query?.year,
  }
}

export default connect(mapStateToProps)(GeneralTab)
