import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { func, arrayOf, object, shape, string, bool, oneOfType, number } from 'prop-types'
import { Card, Icon, Button } from 'semantic-ui-react'
import _ from 'lodash'
import './populationQueryCard.css'
import { DISPLAY_DATE_FORMAT } from '../../constants'
import { reformatDate, getTextIn } from '../../common'

const PopulationQueryCard =
  ({ translate,
    population,
    query,
    removeSampleFn,
    units,
    updateStudentsFn,
    updating,
    language,
    history
  }) => {
    const removePopulation = (uuid) => {
      history.push('/populations')
      removeSampleFn(uuid)
    }
    const { uuid, startYear, semesters, months, studentStatuses } = query
    const { students } = population
    if (students.length > 0) {
      return (
        <Card className="cardContainer">
          <Card.Header className="cardHeader">
            <div>{Object.values(units).map(u => getTextIn(u.name, language)).join(', ')}</div>
            <Icon
              name="remove"
              className="controlIcon"
              onClick={() => removePopulation(uuid)}
            />
          </Card.Header>
          <Card.Meta>
            <div className="dateItem">
              <Icon name="calendar" size="small" />
              {`${semesters.map(s => translate(`populationStatistics.${s}`))}/
                ${startYear}-${Number(startYear) + 1}, showing ${months} months.`}
            </div>
            <div>
              {`${translate('populationStatistics.sampleSize', { amount: students.length })} `}
            </div>
            <div>
              {`Updated at ${reformatDate(_.minBy(students, 'updatedAt').updatedAt, DISPLAY_DATE_FORMAT)} `}
            </div>
            <div>{studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students</div>
            <div>{studentStatuses.includes('CANCELLED') ? 'Includes ' : 'Excludes '}
              students with cancelled study right
            </div>
            <div>{studentStatuses.includes('NONDEGREE') ? 'Includes ' : 'Excludes '}
              students with non-degree study right
            </div>
            {updating ?
              <Button disabled compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn} >
                <Icon loading name="refresh" />
                update population
              </Button>
              :
              <Button compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn} >
                <Icon name="refresh" />
                update population
              </Button>
            }
          </Card.Meta>
        </Card>
      )
    }
    return (
      <Card className="cardContainer">
        <Card.Header className="cardHeader">
          <div>{Object.values(units).map(u => getTextIn(u.name, language)).join(', ')}</div>
          <Icon
            name="remove"
            className="controlIcon"
            onClick={() => removeSampleFn(uuid)}
          />
        </Card.Header>
        <Card.Meta>
          <div className="dateItem">
            <Icon name="calendar" size="small" />
            {`${semesters.map(s => translate(`populationStatistics.${s}`))}/${startYear}-${Number(startYear) + 1},
             showing ${months} months.`}
          </div>
          <div>
            {`${translate('populationStatistics.sampleSize', { amount: students.length })} `}
          </div>
          {updating ?
            <Button disabled compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn} >
              <Icon loading name="refresh" />
              update population
            </Button>
            :
            <Button compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn} >
              <Icon name="refresh" />
              update population
            </Button>
          }
        </Card.Meta>
      </Card>)
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
  history: shape({}).isRequired
}

const mapStateToProps = ({ settings }) => ({ language: settings.language })

export default withRouter(connect(mapStateToProps, null)(PopulationQueryCard))
