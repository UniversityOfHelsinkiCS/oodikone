import { Radio } from 'semantic-ui-react'

export const IncludeSubstitutionsToggle = ({ includeSubstitutions, toggleIncludeSubstitutions }) => {
  return (
    <div style={{ marginTop: 15, marginBottom: 10 }}>
      <Radio
        checked={includeSubstitutions}
        label="Include substitutions"
        onChange={toggleIncludeSubstitutions}
        toggle
      />
    </div>
  )
}
