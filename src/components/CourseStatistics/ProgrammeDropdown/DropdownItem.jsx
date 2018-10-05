import React from 'react'
import { Label } from 'semantic-ui-react'
import { string, oneOfType, number } from 'prop-types'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  text: {
    flexGrow: 1
  },
  students: {
    flexGrow: 0
  }
}

const DropdownItem = ({ name, code, size }) => (
  <div style={styles.container}>
    <div style={styles.text}>
      <Label content={size} icon="user" size="tiny" />
      <span style={{ paddingLeft: '1rem' }}>{name}</span>
    </div>
    <div style={styles.students}>
      <Label content={code} size="tiny" />
    </div>
  </div>
)

DropdownItem.propTypes = {
  name: string.isRequired,
  code: string.isRequired,
  size: oneOfType([number, string]).isRequired
}

export default DropdownItem
