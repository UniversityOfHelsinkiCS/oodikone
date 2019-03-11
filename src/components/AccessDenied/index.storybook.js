import React from 'react';
import { storiesOf } from '@storybook/react'
import AccessDenied from './'

storiesOf('AccessDenied', module)
  .add('with text', () => (
    <AccessDenied itWasError={true} />
  ))
