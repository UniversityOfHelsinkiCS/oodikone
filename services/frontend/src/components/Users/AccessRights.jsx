import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Form, Divider } from 'semantic-ui-react'
import { isEqual } from 'lodash'

import { addUserUnits } from 'redux/users'
import { textAndDescriptionSearch } from '../../common'
import { filteredDropdownProgrammeSelector } from '../../selectors/programmes'
import { useLanguage } from '../LanguagePicker/useLanguage'

const initialState = {
  programme: undefined,
  loading: false,
}

const AccessRights = ({ uid, programmes, pending, ...props }) => {
  const { getTextIn } = useLanguage()
  const [state, setState] = useState({ ...initialState })
  const { programme } = state

  const handleClick = () => {
    const codes = [programme].filter(e => !!e)
    props.addUserUnits(uid, codes)
    setState({ ...state, ...initialState })
  }

  const options = programmes
    .map(({ code, name }) => ({
      key: code,
      value: code,
      text: getTextIn(name),
      description: code,
    }))
    .sort((p1, p2) => p1.text.localeCompare(p2.text))

  return (
    <Form loading={pending}>
      <Form.Dropdown
        name="programme"
        label="Study programme"
        placeholder="Select unit"
        data-cy="access-rights-form"
        options={options}
        value={programme}
        onChange={(_, { value }) =>
          setState({
            ...state,
            programme: value,
          })
        }
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
        data-cy="access-rights-save"
      />
    </Form>
  )
}

const mapStateToProps = (state, props) => ({
  programmes: filteredDropdownProgrammeSelector(state, props),
  pending: Boolean(state.users.userunitpending),
})

export const ConnectedAccessRights = connect(mapStateToProps, { addUserUnits }, null, {
  areStatePropsEqual: isEqual,
})(AccessRights)
