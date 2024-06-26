import { func, string } from 'prop-types'
import { Icon } from 'semantic-ui-react'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  text: {
    flexGrow: 1,
  },
  clear: {
    flexGrow: 0,
  },
}

const handler = onClick => event => {
  event.stopPropagation()
  onClick()
}

export const ClearableItem = ({ name, onClear, icon = 'cancel', ...props }) => (
  <div style={styles.container} {...props}>
    <div style={styles.clear}>
      <Icon disabled={!onClear} name={icon} onClick={handler(onClear)} />
    </div>
    <div style={styles.text}>
      <span style={{ paddingLeft: '0.5rem' }}>{name}</span>
    </div>
  </div>
)

ClearableItem.propTypes = {
  name: string.isRequired,
  onClear: func.isRequired,
}
