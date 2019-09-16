import React from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { withRouter } from 'react-router-dom'
import { func, arrayOf, object, shape, string, bool, oneOfType, number } from 'prop-types'
import { Card, Icon, Button } from 'semantic-ui-react'
import { minBy } from 'lodash'
import './populationQueryCard.css'
import { DISPLAY_DATE_FORMAT } from '../../constants'
import { reformatDate, getTextIn } from '../../common'

const PopulationQueryCard = ({
  translate,
  population,
  query,
  removeSampleFn,
  units,
  updateStudentsFn,
  updating,
  language,
  history,
  tags
}) => {
  const removePopulation = uuid => {
    history.push('/populations')
    removeSampleFn(uuid)
  }
  const { uuid, startYear, endYear, semesters, months, studentStatuses, tag } = query
  const tagname = tag ? tags.find(t => t.tag_id === tag).tagname : ''
  const { students } = population
  if (students.length > 0) {
    return (
      <Card className="cardContainer">
        <Card.Header className="cardHeader">
          <div>
            {Object.values(units)
              .map(u => getTextIn(u.name, language))
              .join(', ')}
          </div>
          <Icon name="remove" className="controlIcon" onClick={() => removePopulation(uuid)} />
        </Card.Header>
        <Card.Meta>
          <div className="dateItem">
            <Icon name="calendar" size="small" />
            {tag
              ? `${semesters.map(s => translate(`populationStatistics.${s}`))}/
                ${startYear}-${endYear}, showing ${months} months.`
              : `${semesters.map(s => translate(`populationStatistics.${s}`))}/
                ${startYear}-${Number(startYear) + 1}, showing ${months} months.`}
          </div>
          {tag ? <div>{`Tagged with: ${tagname}`}</div> : null}
          <div>{`${translate('populationStatistics.sampleSize', { amount: students.length })} `}</div>
          <div>{`Updated at ${reformatDate(minBy(students, 'updatedAt').updatedAt, DISPLAY_DATE_FORMAT)} `}</div>
          <div>{studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students</div>
          <div>
            {studentStatuses.includes('CANCELLED') ? 'Includes ' : 'Excludes '}
            students with cancelled study right
          </div>
          <div>
            {studentStatuses.includes('NONDEGREE') ? 'Includes ' : 'Excludes '}
            students with non-degree study right
          </div>
          {updating ? (
            <Button disabled compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn}>
              <Icon loading name="refresh" />
              update population
            </Button>
          ) : (
            <Button compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn}>
              <Icon name="refresh" />
              update population
            </Button>
          )}
        </Card.Meta>
      </Card>
    )
  }
  return (
    <Card className="cardContainer">
      <Card.Header className="cardHeader">
        <div>
          {Object.values(units)
            .map(u => getTextIn(u.name, language))
            .join(', ')}
        </div>
        <Icon name="remove" className="controlIcon" onClick={() => removeSampleFn(uuid)} />
      </Card.Header>
      <Card.Meta>
        <div className="dateItem">
          <Icon name="calendar" size="small" />
          {`${semesters.map(s => translate(`populationStatistics.${s}`))}/${startYear}-${Number(startYear) + 1},
             showing ${months} months.`}
        </div>
        <div>{`${translate('populationStatistics.sampleSize', { amount: students.length })} `}</div>
        {updating ? (
          <Button disabled compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn}>
            <Icon loading name="refresh" />
            update population
          </Button>
        ) : (
          <Button compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn}>
            <Icon name="refresh" />
            update population
          </Button>
        )}
      </Card.Meta>
    </Card>
  )
}

PopulationQueryCard.propTypes = {
  language: string.isRequired,
  translate: func.isRequired,
  population: shape({ students: arrayOf(object), extents: arrayOf(object) }).isRequired,
  query: shape({
    startYear: oneOfType([string, number]),
    semester: string,
    studyRights: shape({ programme: string, degree: string, studyTrack: string }),
    uuid: string
  }).isRequired,
  removeSampleFn: func.isRequired,
  units: arrayOf(object).isRequired,
  unit: object, // eslint-disable-line
  updateStudentsFn: func.isRequired,
  updating: bool.isRequired,
  history: shape({}).isRequired,
  tags: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ localize }) => ({ language: getActiveLanguage(localize).code })

export default withRouter(
  connect(
    mapStateToProps,
    null
  )(PopulationQueryCard)
)
