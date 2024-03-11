import React from 'react'
import { Dropdown } from 'semantic-ui-react'

import { LANGUAGE_CODES } from '@/constants'
import { useLanguage } from './useLanguage'

export const LanguagePicker = () => {
  const { language, setLanguage } = useLanguage()

  const onChange = (_, { value }) => setLanguage(value)

  const options = LANGUAGE_CODES.map(code => ({
    key: code,
    text: code.toUpperCase(),
    value: code,
  }))

  return (
    <Dropdown
      button
      className="icon"
      floating
      icon="world"
      onChange={onChange}
      options={options}
      selectOnBlur={false}
      selectOnNavigation={false}
      size="small"
      text={language}
    />
  )
}
