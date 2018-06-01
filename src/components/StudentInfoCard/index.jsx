import React from 'react'
import { func, bool } from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'

import { reformatDate } from '../../common'
import { studentDetailsType } from '../../constants/types'
import { DISPLAY_DATE_FORMAT } from '../../constants'

import styles from './studentInfoCard.css'

import { removeStudentSelection, resetStudent } from '../../redux/students'

const StudentInfoCard = (props) => {
  const { student, translate, showName } = props
  const name = showName ? `${student.name}, ` : ''
  const onRemove = () => {
    props.resetStudent()
    props.removeStudentSelection()
  }
  const getLatestDegreeStudyRight = student2 => student2.studyrights.filter(studyright => !studyright.highlevelname.toLowerCase().includes('non-degree') || studyright.prioritycode !== 2)
  const studyright = getLatestDegreeStudyRight(student)
  return (
    <Card fluid>
      <Card.Content>
        <Card.Header className={styles.cardHeader}>
          <div>{name}{student.studentNumber}</div>
          <Icon
            name="remove"
            className={styles.controlIcon}
            onClick={onRemove}
          />
        </Card.Header>
        <Card.Meta>
          <div className={styles.startDate}>
            {`${translate('common.started')}: ${reformatDate(student.started, DISPLAY_DATE_FORMAT)}`}
          </div>
          <div className={styles.startDate}>
            {studyright.slice(-1)[0].highlevelname}
            {` (${reformatDate(studyright.slice(-1)[0].startdate, DISPLAY_DATE_FORMAT)})`}
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
  showName: bool.isRequired,
  removeStudentSelection: func.isRequired,
  resetStudent: func.isRequired
}

const mapStateToProps = state => ({
  showName: state.settings.namesVisible
})

export default connect(mapStateToProps, { removeStudentSelection, resetStudent })(StudentInfoCard)

