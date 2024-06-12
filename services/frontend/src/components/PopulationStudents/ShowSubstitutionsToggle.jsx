import { Radio } from 'semantic-ui-react'

export const ShowSubstitutionsToggle = ({ showSubstitutions, toggleShowSubstitutions }) => {
  return (
    <div style={{ marginTop: 15, marginBottom: 10 }}>
      <Radio checked={showSubstitutions} label="Show substitutions" onChange={toggleShowSubstitutions} toggle />
    </div>
  )
}
