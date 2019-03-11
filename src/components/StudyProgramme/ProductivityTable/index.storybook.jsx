import React from 'react'
import { storiesOf } from '@storybook/react' // eslint-disable-line
import ProductivityTable from '.'

const productivityData = [
  {
    year: 2018,
    credits: 2334,
    thesis: 24,
    graduated: 22
  },
  {
    year: 2017,
    credits: 3004,
    thesis: 70,
    graduated: 55
  },
  {
    year: 2016,
    credits: 1002,
    thesis: 12,
    graduated: 10
  }
]


storiesOf('ProductivityTable', module)
  .add('with text', () => (
    <ProductivityTable productivity={productivityData} />
  ))
