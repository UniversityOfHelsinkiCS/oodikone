import { Radio } from 'semantic-ui-react'

export const FilterOldProgrammesToggle = ({ checked, marginTop = '20px', onChange }) => {
  return (
    <Radio
      checked={checked}
      label="Filter out old and specialized programmes"
      onChange={() => onChange(!checked)}
      style={{ marginTop }}
      toggle
    />
  )
}
