import React from 'react'
import { func, bool } from 'prop-types'
import { Card, Icon, Radio } from 'semantic-ui-react'
import { connect } from 'react-redux'

import { reformatDate } from '../../common'
import { studentDetailsType } from '../../constants/types'
import { DISPLAY_DATE_FORMAT } from '../../constants'

import styles from './studentInfoCard.css'

const StudentInfoCard = ({ student, translate, showName }) => {
  const name = showName ? `${student.name}, ` : ''
  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Icon.Group size="large">
            <Icon name="student" />
            <Icon corner name="hashtag" />
          </Icon.Group>
          <span className={styles.cardHeader}>{name}{student.studentNumber}</span>
        </Card.Header>
        <Card.Meta>
          <div className={styles.startDate}>
            {`${translate('common.started')}: ${reformatDate(student.started, DISPLAY_DATE_FORMAT)}`}
          </div>
        </Card.Meta>
        <Card.Description>
          {`${translate('common.credits')}: ${student.credits || 0}`}
        </Card.Description>
      </Card.Content>
    </Card>
  )
}

StudentInfoCard.propTypes = {
  student: studentDetailsType.isRequired,
  translate: func.isRequired,
  showName: bool.isRequired
}

const mapStateToProps = state => ({
  showName: state.settings.namesVisible
})

export default connect(mapStateToProps)(StudentInfoCard)

