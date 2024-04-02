import { number, oneOfType, string } from 'prop-types'
import React from 'react'
import { Label, Popup } from 'semantic-ui-react'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flexGrow: 1,
  },
  students: {
    flexGrow: 0,
  },
}

export const DropdownItem = ({ name, code, size, description }) =>
  ['ALL', 'OTHER', 'EXCLUDED'].includes(code) ? (
    <Popup
      content={description}
      size="small"
      trigger={
        <div style={styles.container}>
          <div style={styles.text}>
            <Label content={size} icon="user" size="tiny" />
            <span style={{ paddingLeft: '1rem' }}>{name}</span>
          </div>
          <div style={styles.students}>
            <Label content={code} size="tiny" />
          </div>
        </div>
      }
    />
  ) : (
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

DropdownItem.defaultProps = {
  description: '',
}
DropdownItem.propTypes = {
  name: string.isRequired,
  code: string.isRequired,
  size: oneOfType([number, string]).isRequired,
  description: string,
}
