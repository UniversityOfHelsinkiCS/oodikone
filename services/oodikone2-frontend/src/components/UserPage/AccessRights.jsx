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

const AccessRights = ({ uid, rights, programmes, ...props }) => {
  const [state, setState] = useState({ ...initialState })
  const { programme, loading } = state
  const handleClick = async () => {
    setState({ ...state, loading: true })
    const codes = [programme].filter(e => !!e)
    await props.addUserUnits(uid, codes)
    setState({ ...state, ...initialState })
  }
  return (
    <Form loading={loading}>
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
  rights: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string
  })).isRequired,
  programmes: PropTypes.arrayOf(PropTypes.shape({})).isRequired
}

const mapStateToProps = (state, props) => {
  const options = selectors.filteredDropdownAssociationsSelector(state, props)
  const programmes = options.map(formatToOptions).sort((p1, p2) => p1.text.localeCompare(p2.text))
  return {
    programmes
  }
}

export default connect(mapStateToProps, { addUserUnits })(AccessRights)
