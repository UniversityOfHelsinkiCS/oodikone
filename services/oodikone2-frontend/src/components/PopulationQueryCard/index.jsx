import React from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object, shape, string, bool, oneOfType, number } from 'prop-types'
import { Card, Icon, Button } from 'semantic-ui-react'
import _ from 'lodash'
import styles from './populationQueryCard.css'
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
    language
  }) => {
    const { uuid, year, semesters, months, studentStatuses } = query
    const { students } = population
    if (students.length > 0) {
      return (
        <Card className={styles.cardContainer}>
          <Card.Header className={styles.cardHeader}>
            <div>{Object.values(units).map(u => getTextIn(u.name, language)).join(', ')}</div>
            <Icon
              name="remove"
              className={styles.controlIcon}
              onClick={() => removeSampleFn(uuid)}
            />
          </Card.Header>
          <Card.Meta>
            <div className={styles.dateItem}>
              <Icon name="calendar" size="small" />
              {`${semesters.map(s => translate(`populationStatistics.${s}`))}/
                ${year}-${Number(year) + 1}, showing ${months} months.`}
            </div>
            <div>
              {`${translate('populationStatistics.sampleSize', { amount: students.length })} `}
            </div>
            <div>
              {`Updated at ${reformatDate(_.minBy(students, 'updatedAt').updatedAt, DISPLAY_DATE_FORMAT)} `}
            </div>
            <div>{studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes' } exchange students</div>
            <div>{studentStatuses.includes('CANCELLED') ? 'Includes ' : 'Excludes ' }
              students with cancelled study right
            </div>
            <div>{studentStatuses.includes('NONDEGREE') ? 'Includes ' : 'Excludes ' }
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
      <Card className={styles.cardContainer}>
        <Card.Header className={styles.cardHeader}>
          <div>{Object.values(units).map(u => getTextIn(u.name, language)).join(', ')}</div>
          <Icon
            name="remove"
            className={styles.controlIcon}
            onClick={() => removeSampleFn(uuid)}
          />
        </Card.Header>
        <Card.Meta>
          <div className={styles.dateItem}>
            <Icon name="calendar" size="small" />
            {`${semesters.map(s => translate(`populationStatistics.${s}`))}/${year}-${Number(year) + 1},
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
    year: oneOfType([string, number]),
    semester: string,
    studyRights: arrayOf(string),
    uuid: string
  }).isRequired,
  removeSampleFn: func.isRequired,
  units: arrayOf(object).isRequired,
  unit: object, // eslint-disable-line
  updateStudentsFn: func.isRequired,
  updating: bool.isRequired
}

const mapStateToProps = ({ settings }) => ({ language: settings.language })

export default connect(mapStateToProps, null)(PopulationQueryCard)
