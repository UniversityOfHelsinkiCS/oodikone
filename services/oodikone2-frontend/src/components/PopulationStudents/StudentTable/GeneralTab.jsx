import React, { useState } from 'react'
import { Item, Icon, Popup } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { flatten } from 'lodash'
import { connect } from 'react-redux'
import SortableTable from '../../SortableTable'
import {
  getStudentTotalCredits,
  getTextIn,
  getNewestProgramme,
  reformatDate,
  copyToClipboard,
  getUserIsAdmin
} from '../../../common'
import { PRIORITYCODE_TEXTS } from '../../../constants'
import sendEvent from '../../../common/sendEvent'
import { getActiveLanguage } from 'react-localize-redux'

const GeneralTab = ({
  data,
  showNames,
  coursePopulation,
  customPopulation,
  populationStatistics,
  language,
  queryStudyrights,
  isAdmin,
  studentToTargetCourseDateMap,
  selectedStudents,
  students
}) => {
  const [popupStates, setPopupStates] = useState({})
  const sendAnalytics = sendEvent.populationStudents

  // TODO: This fixes crashing upon using back button. Find the root cause and fix it.
  if (!populationStatistics.elementdetails) {
    return null
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

  const transferFrom = s => getTextIn(populationStatistics.elementdetails.data[s.transferSource].name, language)

  const studyrightCodes = (studyrights, value) => {
    return studyrights
      .filter(sr => {
        const { studyright_elements: studyrightElements } = sr
        return studyrightElements.filter(sre => queryStudyrights.includes(sre.code)).length >= queryStudyrights.length
      })
      .map(a => a[value])
  }

  const studytrack = studyrights => {
    let startdate = '1900-01-01'
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 20)
        .forEach(el => {
          if (queryStudyrights.includes(el.code)) {
            startdate = el.startdate // eslint-disable-line
          }
        })
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
        .forEach(el => {
          if (el.enddate > startdate) {
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
        ).filter(e => e.code === queryStudyrights[0])
        res[sn] = targetStudyright[0] ? targetStudyright[0].startdate : null
        return res
      }, {})
    : null

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

  // TODO: asd

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
      headerProps: { colSpan: 2 }
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
      cellProps: { collapsing: true, className: 'iconCellNoPointer' }
    }
  )
  if (!(coursePopulation || customPopulation)) {
    columns.push({
      key: 'credits since start',
      title: 'credits since start of studyright',
      getRowVal: s => {
        const credits = getStudentTotalCredits(s)
        return credits
      }
    })
  }
  columns.push({
    key: 'all credits',
    title: 'All Credits',
    getRowVal: s => s.credits
  })

  if (!(coursePopulation || customPopulation)) {
    columns.push({
      key: 'transferred from',
      title: 'Transferred From',
      getRowVal: s => (s.transferredStudyright ? transferFrom(s) : '')
    })
  }
  if (containsStudyTracks() && !(coursePopulation || customPopulation)) {
    columns.push({
      key: 'studytrack',
      title: 'Study Track',
      getRowVal: s => studytrack(s.studyrights).map(st => st.name)[0]
    })
  }

  if (isAdmin && !(coursePopulation || customPopulation)) {
    columns.push(
      {
        key: 'priority',
        title: 'priority',
        getRowVal: s => priorityText(s.studyrights)
      },
      {
        key: 'extent',
        title: 'extent',
        getRowVal: s => extentCodes(s.studyrights)
      }
    )
  }
  columns.push({
    key: 'tags',
    title: 'Tags',
    getRowVal: s => (!s.obfuscated ? tags(s.tags) : '')
  })

  if (!(coursePopulation || customPopulation)) {
    columns.push({
      key: 'studystartdate',
      title: 'start of studyright',
      getRowVal: s => new Date(studentToStudyrightStartMap[s.studentNumber]).getTime(),
      getRowContent: s => reformatDate(studentToStudyrightStartMap[s.studentNumber], 'YYYY-MM-DD')
    })
  }

  if (coursePopulation || customPopulation) {
    columns.push(
      {
        key: 'programme',
        title: 'Study Programme',
        getRowVal: s => getTextIn(mainProgramme(s.studyrights, s.studentNumber), language) || 'No programme'
      },
      {
        key: 'startyear',
        title: 'Start Year at Uni',
        getRowVal: s => (!s.obfuscated ? reformatDate(s.started, 'YYYY') : '')
      }
    )
  }

  if (isAdmin) {
    columns.push({
      key: 'updatedAt',
      title: 'Last Updated At',
      getRowVal: s => reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss')
    })
  }
  if (showNames) {
    columns.push(
      {
        key: 'email',
        title: (
          <React.Fragment>
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
          </React.Fragment>
        ),
        getRowVal: s => s.email,
        headerProps: { colSpan: 2 }
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
        cellProps: { collapsing: true, className: 'iconCellNoPointer' }
      }
    )
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
          celled: true
        }}
        columns={columns}
        data={data}
      />
    </div>
  )
}

const mapStateToProps = state => {
  const {
    localize,
    populations,
    auth: {
      token: { roles }
    }
  } = state

  return {
    isAdmin: getUserIsAdmin(roles),
    language: getActiveLanguage(localize).code,
    populationStatistics: populations.data
  }
}

export default connect(mapStateToProps)(GeneralTab)
