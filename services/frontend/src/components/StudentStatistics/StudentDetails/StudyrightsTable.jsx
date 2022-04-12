import React, { Fragment } from 'react'
import { func, shape, string } from 'prop-types'

import { Divider, Table, Icon, Header, Item } from 'semantic-ui-react'
import { sortBy } from 'lodash'

import { Link } from 'react-router-dom'

import { reformatDate, getTextIn } from '../../../common'

const StudyrightsTable = ({
  Programmes,
  student,
  language,
  handleStartDateChange,
  showPopulationStatistics,
  studyrightid,
}) => {
  if (!student) return null

  const { programmes } = Programmes
  const programmeCodes = programmes ? Object.keys(programmes) : []
  const studyRightHeaders = ['Programme', 'Study Track', 'Graduated', 'Completed']

  const studyRightRows = student.studyrights.map(studyright => {
    const programmes = sortBy(studyright.studyright_elements, 'enddate')
      .filter(e => e.element_detail.type === 20)
      .map(programme => ({
        code: programme.code,
        startdate: programme.startdate,
        studystartdate: studyright.studystartdate,
        enddate: programme.enddate,
        name: getTextIn(programme.element_detail.name, language),
      }))
    const studytracks = sortBy(studyright.studyright_elements, 'enddate')
      .filter(e => e.element_detail.type === 30)
      .map(studytrack => ({
        startdate: studytrack.startdate,
        enddate: studytrack.enddate,
        name: getTextIn(studytrack.element_detail.name, language),
      }))
    return {
      studyrightid: studyright.studyrightid,
      graduated: studyright.graduated,
      enddate: studyright.enddate,
      elements: { programmes, studytracks },
    }
  })

  const filterDuplicates = (elem1, index, array) => {
    for (let i = 0; i < array.length; i++) {
      const elem2 = array[i]
      if (
        elem1.name === elem2.name &&
        ((elem1.startdate > elem2.startdate && elem1.enddate <= elem2.enddate) ||
          (elem1.enddate < elem2.enddate && elem1.startdate >= elem2.startdate))
      ) {
        return false
      }
    }
    return true
  }

  const renderGraduated = c => {
    // if (c.canceldate)
    //   return (
    //     <div>
    //       <p style={{ color: 'red', fontWeight: 'bold' }}>CANCELED</p>
    //     </div>
    //   )
    if (c.graduated)
      return (
        <div>
          <Icon name="check circle outline" color="green" />
          <p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p>
        </div>
      )
    return (
      <div style={{ padding: '.5em 0' }}>
        <Icon name="circle outline" color="red" />
      </div>
    )
  }

  const getActualStartDate = c =>
    new Date(c.startdate).getTime() > new Date(c.studystartdate).getTime() ? c.startdate : c.studystartdate

  const renderProgrammes = c =>
    sortBy(c.elements.programmes.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(programme => (
        <p key={`${programme.name}-${programme.startdate}`}>
          {`${programme.name} (${reformatDate(getActualStartDate(programme), 'DD.MM.YYYY')} - ${reformatDate(
            programme.enddate,
            'DD.MM.YYYY'
          )})`}
          {programmeCodes.includes(programme.code) && (
            <Item as={Link} to={showPopulationStatistics(programme.code, programme.startdate)}>
              <Icon name="level up alternate" />
            </Item>
          )}{' '}
          <br />
        </p>
      ))

  const renderStudytracks = c =>
    sortBy(c.elements.studytracks.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(studytrack => (
        <p key={studytrack.name}>
          {`${studytrack.name} (${reformatDate(studytrack.startdate, 'DD.MM.YYYY')} - ${reformatDate(
            studytrack.enddate,
            'DD.MM.YYYY'
          )})`}
          <br />{' '}
        </p>
      ))

  const renderCompletionPercent = (c, student) => {
    const programmeCodes = c.elements.programmes.filter(filterDuplicates).map(programme => programme.code)
    const studyplans = student.studyplans.filter(sp => programmeCodes.includes(sp.programme_code))

    if (studyplans.length === 0) {
      return <>-</>
    }

    const getCompletedCredits = courseCode => {
      const course = student.courses.find(course => course.course_code === courseCode)

      if (!course) return 0

      return course.credits
    }

    const courses = studyplans.map(sp => sp.included_courses).flat()
    const totalCredits = programmeCodes[0].includes('KH') ? 180 : 120
    const completedCredits = courses.reduce((acc, course) => getCompletedCredits(course) + acc, 0)

    return <>{(Math.min(1, completedCredits / Math.max(totalCredits, 1)) * 100).toFixed(0)}%</>
  }

  return (
    <>
      <Divider horizontal style={{ padding: '20px' }}>
        <Header as="h4">Studyrights</Header>
      </Divider>
      <Table className="fixed-header">
        <Table.Header>
          <Table.Row>
            {studyRightHeaders.map(header => (
              <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sortBy(studyRightRows, c => Number(c.studyrightid))
            .reverse()
            .map(c => {
              if (c.elements.programmes.length > 0) {
                return (
                  <Table.Row
                    active={c.studyrightid === studyrightid}
                    key={c.studyrightid}
                    onClick={() => handleStartDateChange(c.elements, c.studyrightid)}
                  >
                    <Table.Cell>{c.elements.programmes.length > 0 && renderProgrammes(c)}</Table.Cell>
                    <Table.Cell>{renderStudytracks(c)}</Table.Cell>
                    <Table.Cell>{renderGraduated(c)}</Table.Cell>
                    <Table.Cell>{renderCompletionPercent(c, student)}</Table.Cell>
                  </Table.Row>
                )
              }
              return null
            })}
        </Table.Body>
      </Table>
    </>
  )
}

StudyrightsTable.defaultProps = {
  studyrightid: '',
}

StudyrightsTable.propTypes = {
  Programmes: shape({}).isRequired,
  student: shape({}).isRequired,
  language: string.isRequired,
  handleStartDateChange: func.isRequired,
  showPopulationStatistics: func.isRequired,
  studyrightid: string,
}

export default StudyrightsTable
