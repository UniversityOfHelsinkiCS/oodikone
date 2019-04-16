import React from 'react'
import { storiesOf } from '@storybook/react' // eslint-disable-line
import AccessDenied from '.'

storiesOf('AccessDenied', module)
  .add('with text', () => (
    <AccessDenied itWasError />
  ))
