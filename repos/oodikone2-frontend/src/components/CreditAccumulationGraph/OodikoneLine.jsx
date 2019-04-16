import { Line } from 'recharts'

class OodikoneLine extends Line {
  constructor(props) { // eslint-disable-line
    super(props)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.hide !== nextProps.hide
  }
}

export default OodikoneLine
