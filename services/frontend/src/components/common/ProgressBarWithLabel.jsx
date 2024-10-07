import { Progress } from 'semantic-ui-react'

import { calculatePercentage } from '@/common'
import './progressBarWithLabel.css'

/**
 * A progress bar with a label that shows the percentage of the progress. This component is better for visualizing small percentages, as Semantic UI's Progress component has a minimum width (meaning that especially if the progress bar is small, the percentages below ~25% might all look the same). Semantic UI's Progress component might also hide the percentage partly if the progress bar is very small.
 * @param {number} value The numerator of the fraction
 * @param {number} total The denominator of the fraction
 * @param {number} numberOfDecimals The number of decimals to show in the percentage (default 1)
 */
export const ProgressBarWithLabel = ({ value, total, numberOfDecimals = 1 }) => (
  <div className="progress-bar-with-label">
    <Progress total={total} value={value} />
    <div className="progress-text">{calculatePercentage(value, total, numberOfDecimals)}</div>
  </div>
)
