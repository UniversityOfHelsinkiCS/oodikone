import React, { Fragment } from 'react'
import { func, shape, string } from 'prop-types'

import { Divider, Table, Icon, Header, Item } from 'semantic-ui-react'
import { sortBy } from 'lodash'

import { Link } from 'react-router-dom'

import { reformatDate, getTextIn } from '../../../common'

const StudyrightsTable = ({
  degreesAndProgrammes,
  student,
  language,
  handleStartDateChange,
  showPopulationStatistics,
  studyrightid
}) => {
  if (!student) return null

  const { programmes } = degreesAndProgrammes
  const programmeCodes = programmes ? Object.keys(programmes) : []
  const studyRightHeaders = ['Degree', 'Programme', 'Study Track', 'Graduated']

  const studyRightRows = student.studyrights.map(studyright => {
    const degree = sortBy(studyright.studyright_elements, 'enddate').find(e => e.element_detail.type === 10)
    const formattedDegree = degree && {
      startdate: degree.startdate,
      studystartdate: studyright.studystartdate,
      enddate: degree.enddate,
      name: getTextIn(degree.element_detail.name, language),
      graduateionDate: degree.graduation_date,
      canceldate: degree.canceldate
    }
    const programmes = sortBy(studyright.studyright_elements, 'enddate')
      .filter(e => e.element_detail.type === 20)
      .map(programme => ({
        code: programme.code,
        startdate: programme.startdate,
        enddate: programme.enddate,
        name: getTextIn(programme.element_detail.name, language)
      }))
    const studytracks = sortBy(studyright.studyright_elements, 'enddate')
      .filter(e => e.element_detail.type === 30)
      .map(studytrack => ({
        startdate: studytrack.startdate,
        enddate: studytrack.enddate,
        name: getTextIn(studytrack.element_detail.name, language)
      }))
    return {
      studyrightid: studyright.studyrightid,
      graduated: studyright.graduated,
      canceldate: studyright.canceldate,
      enddate: studyright.enddate,
      elements: { degree: formattedDegree, programmes, studytracks }
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
    if (c.canceldate)
      return (
        <div>
          <p style={{ color: 'red', fontWeight: 'bold' }}>CANCELED</p>
        </div>
      )
    if (c.graduated)
      return (
        <div>
          <Icon name="check circle outline" color="green" />
          <p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p>
        </div>
      )
    return (
      <div>
        <Icon name="circle outline" color="red" />
        <p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p>
      </div>
    )
  }

  const renderDegrees = c => (
    <p key={c.elements.degree.name}>
      {/* Sometimes studystartdate contains the right date while startdate is off so we do this. */}
      {/* Same on population statistics page so attempting to keep consistency.*/}
      {`${c.elements.degree.name}
      (${reformatDate(c.elements.degree.studystartdate || c.elements.degree.startdate, 'DD.MM.YYYY')} -
      ${reformatDate(c.elements.degree.studystartdate || c.elements.degree.enddate, 'DD.MM.YYYY')})`}
      <br />
    </p>
  )

  const renderProgrammes = c =>
    sortBy(c.elements.programmes.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(programme => (
        <p key={`${programme.name}-${programme.startdate}`}>
          {`${programme.name} (${reformatDate(programme.startdate, 'DD.MM.YYYY')} - ${reformatDate(
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

  return (
    <Fragment>
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
              if (c.elements.programmes.length > 0 || c.elements.degree) {
                return (
                  <Table.Row
                    active={c.studyrightid === studyrightid}
                    key={c.studyrightid}
                    onClick={() => handleStartDateChange(c.elements, c.studyrightid)}
                  >
                    <Table.Cell verticalAlign="middle">{c.elements.degree && renderDegrees(c)}</Table.Cell>
                    <Table.Cell>{c.elements.programmes.length > 0 && renderProgrammes(c)}</Table.Cell>
                    <Table.Cell>{renderStudytracks(c)}</Table.Cell>
                    <Table.Cell>{renderGraduated(c)}</Table.Cell>
                  </Table.Row>
                )
              }
              return null
            })}
        </Table.Body>
      </Table>
    </Fragment>
  )
}

StudyrightsTable.defaultProps = {
  studyrightid: ''
}

StudyrightsTable.propTypes = {
  degreesAndProgrammes: shape({}).isRequired,
  student: shape({}).isRequired,
  language: string.isRequired,
  handleStartDateChange: func.isRequired,
  showPopulationStatistics: func.isRequired,
  studyrightid: string
}

export default StudyrightsTable
