import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Form, Divider } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import { textAndDescriptionSearch } from '../../common'
import selectors from '../../selectors/programmes'
import { addUserUnits } from '../../redux/users'

const formatToOptions = ({ code, name }) => ({
  key: code,
  value: code,
  text: name,
  description: code
})

const initialState = {
  programme: undefined,
  loading: false
}

const AccessRights = ({ uid, programmes, pending, ...props }) => {
  const [state, setState] = useState({ ...initialState })
  const { programme } = state
  const handleClick = () => {
    const codes = [programme].filter(e => !!e)
    props.addUserUnits(uid, codes)
    setState({ ...state, ...initialState })
  }
  return (
    <Form loading={pending}>
      <Form.Dropdown
        name="programme"
        label="Study programme"
        placeholder="Select unit"
        options={programmes}
        value={programme}
        onChange={(_, { value }) => setState({
          ...state,
          programme: value
        })}
        fluid
        search={textAndDescriptionSearch}
        selection
        clearable
        selectOnBlur={false}
        selectOnNavigation={false}
      />
      <Divider />
      <Form.Button
        disabled={!programme}
        basic
        fluid
        positive
        content="Save"
        onClick={handleClick}
      />
    </Form>
  )
}

AccessRights.propTypes = {
  addUserUnits: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired,
  // used in filteredDropdownProgrammeSelector
  rights: PropTypes.arrayOf(PropTypes.string).isRequired,
  programmes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  pending: PropTypes.bool.isRequired
}

const mapStateToProps = (state, props) => {
  const options = selectors.filteredDropdownProgrammeSelector(state, props)
  const programmes = options.map(formatToOptions).sort((p1, p2) => p1.text.localeCompare(p2.text))
  return {
    programmes,
    pending: Boolean(state.users.userunitpending)
  }
}

export default connect(mapStateToProps, { addUserUnits })(AccessRights)
