import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Form, Accordion, Divider } from 'semantic-ui-react'
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
  selectedTracks: [],
  selectedDegrees: [],
  showOptional: false,
  loading: false
}

const AccessRights = ({ uid, rights, programmes, associations, ...props }) => {
  const [state, setState] = useState({ ...initialState })
  const { programme, selectedTracks, selectedDegrees, showOptional, loading } = state
  const { tracks = [], degrees = [] } = associations[programme] || {}
  const setAllOptions = () => {
    setState({
      ...state,
      selectedTracks: tracks.map(t => t.value),
      selectedDegrees: degrees.map(d => d.value)
    })
  }
  const toggleExpanded = () => setState({ ...state, showOptional: !showOptional })
  const handleClick = async () => {
    setState({ ...state, loading: true })
    const codes = [...selectedTracks, ...selectedDegrees, programme].filter(e => !!e)
    await props.addUserUnits(uid, codes)
    setState({ ...state, ...initialState })
  }
  return (
    <Form loading={loading}>
      <Form.Dropdown
        name="programme"
        required
        label="Study programme"
        placeholder="Select unit"
        options={programmes}
        value={programme}
        onChange={(_, { value }) => setState({
          ...state,
          programme: value,
          tracks: [],
          degrees: [],
          showOptional: !!value
        })}
        fluid
        search={textAndDescriptionSearch}
        selection
        clearable
        selectOnNavigation={false}
      />
      <Accordion>
        <Accordion.Title content="Optional" active={showOptional} onClick={toggleExpanded} />
        <Accordion.Content active={showOptional}>
          <Form.Dropdown
            label="Degree (optional)"
            disabled={!programme}
            name="degree"
            placeholder="Select specialization"
            options={degrees}
            value={selectedDegrees}
            onChange={(_, { value }) => setState({ ...state, selectedDegrees: value })}
            fluid
            search={textAndDescriptionSearch}
            multiple
            selection
            clearable
          />
          <Form.Dropdown
            disabled={!programme}
            label="Specialization (Optional)"
            name="specializations"
            placeholder="Select specialization"
            options={tracks}
            value={selectedTracks}
            onChange={(_, { value }) => setState({ ...state, selectedTracks: value })}
            fluid
            search={textAndDescriptionSearch}
            multiple
            selection
            clearable
          />
          <Form.Button
            disabled={!programme}
            basic
            fluid
            onClick={setAllOptions}
            content="Select all"
          />
        </Accordion.Content>
      </Accordion>
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
  associations: PropTypes.shape({}).isRequired,
  programmes: PropTypes.arrayOf(PropTypes.shape({})).isRequired
}

const mapStateToProps = (state, props) => {
  const options = selectors.filteredDropdownAssociationsSelector(state, props)
  const programmes = options.map(formatToOptions).sort((p1, p2) => p1.text.localeCompare(p2.text))
  const associations = options.reduce((acc, prog) => ({
    ...acc,
    [prog.code]: {
      tracks: prog.tracks.map(formatToOptions),
      degrees: prog.degrees.map(formatToOptions)
    }
  }), {})
  return {
    programmes,
    associations
  }
}

export default connect(mapStateToProps, { addUserUnits })(AccessRights)
