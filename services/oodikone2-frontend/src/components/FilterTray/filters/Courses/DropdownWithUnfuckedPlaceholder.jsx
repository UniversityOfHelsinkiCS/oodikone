import React, { useState, createRef } from 'react'
import PropTypes from 'prop-types'
import { Dropdown } from 'semantic-ui-react'

/**
 * I am not proud of this but the makers of semantic-ui-react should be even less so.
 * And yes, the <input> is fucking required to make their mess of a component work.
 */
const DropdownWithUnfuckedPlaceholder = ({ options, placeholder: defaultPlaceholder, onChange, className }) => {
  const [placeholder, setPlaceholder] = useState(defaultPlaceholder)
  const ref = createRef()

  return (
    <>
      <input type="text" ref={ref} className="hidden-focusable" />
      <Dropdown
        options={options}
        placeholder={placeholder}
        selection
        className={`mini ${className}`}
        fluid
        button
        value={[]}
        onChange={onChange}
        onFocus={() => setPlaceholder('')}
        onBlur={() => setPlaceholder(defaultPlaceholder)}
        onClose={() => ref.current.focus()}
        multiple
        closeOnChange
        search
      />
    </>
  )
}

DropdownWithUnfuckedPlaceholder.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  placeholder: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string
}

DropdownWithUnfuckedPlaceholder.defaultProps = {
  className: ''
}

export default DropdownWithUnfuckedPlaceholder
