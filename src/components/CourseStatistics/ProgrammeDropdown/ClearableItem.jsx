import React from 'react'
import { Icon } from 'semantic-ui-react'
import { string, func } from 'prop-types'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  text: {
    flexGrow: 1
  },
  clear: {
    flexGrow: 0
  }
}

const handler = onClick => (e) => {
  e.stopPropagation()
  onClick()
}

const ClearableItem = ({ name, onClear, icon, ...props }) => (
  <div style={styles.container} {...props}>
    <div style={styles.clear}>
      <Icon name={icon} disabled={!onClear} onClick={handler(onClear)} />
    </div>
    <div style={styles.text}>
      <span style={{ paddingLeft: '0.5rem' }}>{name}</span>
    </div>
  </div>
)

ClearableItem.propTypes = {
  name: string.isRequired,
  onClear: func.isRequired,
  icon: string
}


ClearableItem.defaultProps = {
  icon: 'cancel'
}

export default ClearableItem
