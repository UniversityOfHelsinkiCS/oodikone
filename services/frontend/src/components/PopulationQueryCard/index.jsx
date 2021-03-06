import React from 'react'
import { withRouter } from 'react-router-dom'
import { func, arrayOf, object, shape, string, oneOfType, number } from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import { minBy } from 'lodash'
import './populationQueryCard.css'
import { DISPLAY_DATE_FORMAT } from '../../constants'
import { reformatDate, getTextIn } from '../../common'
import useLanguage from '../LanguagePicker/useLanguage'

const PopulationQueryCard = ({ population, query, removeSampleFn, units, tags }) => {
  const { language } = useLanguage()
  const { uuid, year, semesters, months, studentStatuses, tag, years } = query
  const tagname = tag && tags.length > 0 ? tags.find(t => t.tag_id === tag).tagname : ''
  const lowestYear = query.years ? Math.min(...query.years.map(year => Number(year))) : null
  const highestYear = query.years ? Math.max(...query.years.map(year => Number(year))) : null
  const { students } = population
  const header = units.map(u => getTextIn(u.name, language)).join(', ')
  const semesterList = semesters.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(', ')

  if (students.length > 0) {
    return (
      <>
        <Card className="cardContainer">
          <Card.Header className="cardHeader">
            <div>{header}</div>
          </Card.Header>
          <Card.Meta>
            <div className="dateItem">
              <Icon name="calendar" size="small" />
              {!years
                ? `${semesterList} /
                ${year}-${Number(year) + 1}, showing ${months} months.`
                : `${semesterList} /
                started during ${lowestYear}-${highestYear}`}
            </div>
            {tag ? <div>{`Tagged with: ${tagname}`}</div> : null}
            <div>Sample size: {students.length} students</div>
            <div>{`Updated at ${reformatDate(minBy(students, 'updatedAt').updatedAt, DISPLAY_DATE_FORMAT)} `}</div>
            <div>{studentStatuses.includes('EXCHANGE') ? 'Includes' : 'Excludes'} exchange students</div>
            <div>
              {studentStatuses.includes('CANCELLED') ? 'Includes ' : 'Excludes '}
              students who haven't enrolled present nor absent
            </div>
            <div>
              {studentStatuses.includes('NONDEGREE') ? 'Includes ' : 'Excludes '}
              students with non-degree study right
            </div>
            <div>
              {studentStatuses.includes('TRANSFERRED') ? 'Includes ' : 'Excludes '}
              students who have transferred out of this programme
            </div>
          </Card.Meta>
        </Card>
      </>
    )
  }
  return (
    <Card className="cardContainer">
      <Card.Header className="cardHeader">
        <div>{header}</div>
        <Icon name="remove" className="controlIcon" onClick={() => removeSampleFn(uuid)} />
      </Card.Header>
      <Card.Meta>
        <div className="dateItem">
          <Icon name="calendar" size="small" />
          {`${semesterList} / ${year}-${Number(year) + 1},
             showing ${months} months.`}
        </div>
        <div>Sample size: {students.length} students</div>
      </Card.Meta>
    </Card>
  )
}

PopulationQueryCard.propTypes = {
  population: shape({ students: arrayOf(object), extents: arrayOf(object) }).isRequired,
  query: shape({
    year: oneOfType([string, number]),
    semester: string,
    studyRights: shape({ programme: string, degree: string, studyTrack: string }),
    uuid: string,
  }).isRequired,
  removeSampleFn: func.isRequired,
  units: arrayOf(object).isRequired,
  tags: arrayOf(shape({})).isRequired,
}

export default withRouter(PopulationQueryCard)
