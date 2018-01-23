import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Icon, Dropdown, Dimmer, Segment, Loader } from 'semantic-ui-react';

import { addError, getDepartmentSuccessAction } from '../../actions';
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants';

import { violet, orange, lime, mellowBlue, turquoise } from '../../styles/variables/colors';
import styles from './departmentSuccess.css';

const BAR_COLOR_OPTIONS = [orange, lime, mellowBlue, turquoise];
const FIRST_DATE = '2005-08-01';

const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ name: key, value: data[key] }))) : []);

const reformatDate = (date, dateFormat) => moment(date).format(dateFormat);

const getSelectorDates = (startDate) => {
  const dates = [];
  let date = moment(startDate);
  while (date.isBefore(moment.now())) {
    const formattedDate = reformatDate(date, DISPLAY_DATE_FORMAT);
    dates.push({ text: formattedDate, value: date });
    date = moment(date).add(1, 'year');
  }
  return dates;
};

class DepartmentSuccess extends Component {
  constructor(props) {
    super(props);

    this.onDateChange = this.onDateChange.bind(this);
    this.onDateInputChange = this.onDateInputChange.bind(this);
    this.onControlLeft = this.onControlLeft.bind(this);
    this.onControlRight = this.onControlRight.bind(this);
    this.onControlButtonSwitch = this.onControlButtonSwitch.bind(this);

    this.state = {
      departmentSuccess: {
        value: {}
      },
      selectorDates: getSelectorDates(FIRST_DATE),
      selectedDate: {
        text: reformatDate(FIRST_DATE, DISPLAY_DATE_FORMAT),
        value: FIRST_DATE
      },
      loading: true
    };
  }

  componentDidMount() {
    this.props.dispatchGetDepartmentSuccess(this.state.selectedDate.value)
      .then(
        json => this.setState({ departmentSuccess: json, loading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  onDateChange() {
    const { selectedDate } = this.state;
    this.setState({ loading: true });
    this.props.dispatchGetDepartmentSuccess(reformatDate(selectedDate.value, API_DATE_FORMAT))
      .then(
        json => this.setState({ departmentSuccess: json, loading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  onDateInputChange(e, data) {
    this.setState({
      selectedDate: {
        text: reformatDate(data.value, DISPLAY_DATE_FORMAT),
        value: data.value
      }
    });
    this.onDateChange();
  }

  onControlLeft() {
    this.onControlButtonSwitch(-1);
  }

  onControlRight() {
    this.onControlButtonSwitch(1);
  }

  onControlButtonSwitch(amount) {
    const { selectorDates, selectedDate } = this.state;

    const index = selectorDates.findIndex(value => value === selectedDate);
    this.setState({ selectedDate: selectorDates[index + amount] });
    this.onDateChange();
  }

  render() {
    const {
      departmentSuccess, selectedDate, selectorDates, loading
    } = this.state;

    const selectedIndex = selectorDates.findIndex(value => value.text === selectedDate.text);
    const isFirstIndex = selectedDate.text === selectorDates[0].text;
    const isLastIndex = selectedDate === selectorDates[selectorDates.length - 1];
    const chartData = createChartData(departmentSuccess.value);
    const chartTitle = `Average credit gains after 13 months for BSc students starting ${selectedDate.text}`;

    return (
      <div className={styles.container} >
        <Dimmer.Dimmable as={Segment} dimmed={loading} className={styles.chartSegment}>
          <Dimmer active={loading} inverted>
            <Loader>Loading</Loader>
          </Dimmer>
          <div className={styles.chartTitle}>{chartTitle}</div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer height={400} >
              <BarChart data={chartData} >
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Bar dataKey="value" fill={violet}>
                  {
              chartData.map((entry, index) => <Cell key={`color-cell-${entry.name}`} fill={BAR_COLOR_OPTIONS[index]} />)
            }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.dateSelector}>
            <div
              className={styles.controlIconContiner}
              onClick={!isFirstIndex ? this.onControlLeft : undefined}
              onKeyPress={!isFirstIndex ? this.onControlLeft : undefined}
            >
              <Icon name="chevron left" className={styles.controlIcon} disabled={isFirstIndex} />
            </div>
            <Dropdown
              text={selectedDate.text}
              className={styles.controlDropdown}
              value={selectedDate.value}
              options={selectorDates}
              onChange={this.onDateInputChange}
              scrolling
            />
            <div
              className={styles.controlIconContiner}
              onClick={!isLastIndex ? this.onControlRight : undefined}
              onKeyPress={!isLastIndex ? this.onControlRight : undefined}
            >
              <Icon name="chevron right" className={styles.controlIcon} disabled={isLastIndex} />
            </div>
          </div>
          <div className={styles.dateBrowser}>
            <span className={styles.nextDate}>{!isFirstIndex ? `...${selectorDates[selectedIndex - 1].text}` : ' '}</span>
            <span className={styles.selectedDate}>{selectedDate.text}</span>
            <span className={styles.nextDate}>{!isLastIndex ? `${selectorDates[selectedIndex + 1 ].text}...` : ' '}</span>
          </div>
        </Dimmer.Dimmable>
      </div>
    );
  }
}

const { func } = PropTypes;

DepartmentSuccess.propTypes = {
  dispatchGetDepartmentSuccess: func.isRequired,
  dispatchAddError: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchGetDepartmentSuccess: date =>
    dispatch(getDepartmentSuccessAction(date)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentSuccess);
