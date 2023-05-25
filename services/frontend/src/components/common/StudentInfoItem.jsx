import React from 'react'
import sendEvent from 'common/sendEvent'
import { Icon, Item } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import SisuLinkItem from './SisuLinkItem'

const StudentInfoItem = ({ student, view, tab, showSisuLink }) => {
  const sendAnalytics = sendEvent[view] ?? sendEvent.common
  if (student.obfuscated) {
    return (
      <span style={student.obfuscated ? { fontStyle: 'italic', color: 'graytext' } : {}}>
        {!student.obfuscated ? student.studentNumber : 'hidden'}
      </span>
    )
  }
  return (
    <div style={{ display: 'inline-flex' }}>
      <div>{student.studentNumber}</div>
      <Item
        as={Link}
        to={`/students/${student.studentNumber}`}
        onClick={() => {
          sendAnalytics('Student details button clicked', view)
        }}
        style={{ marginLeft: '10px', marginRight: '10px' }}
      >
        <Icon name="user outline" />
      </Item>
      {showSisuLink && <SisuLinkItem id={student.sis_person_id} tab={tab} />}
    </div>
  )
}

export default StudentInfoItem
