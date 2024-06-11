import { Radio } from 'semantic-ui-react'

export const CombineSubstitutionsToggle = ({ combineSubstitutions, toggleCombineSubstitutions }) => {
  return (
    <div style={{ marginTop: 15, marginBottom: 10 }}>
      <Radio
        checked={combineSubstitutions}
        disabled // until the functionality is implemented
        label="Combine substitutions"
        onChange={toggleCombineSubstitutions}
        toggle
      />
    </div>
  )
}
