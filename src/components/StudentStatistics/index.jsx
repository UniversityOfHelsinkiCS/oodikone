import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addError, findStudentsAction } from '../../actions';

class StudentStatistics extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  componentDidMount() {
    /* TODO: test purpose onlys  */
    const defaultSearch = 'ee';
    this.props.dispatchFindStudents(defaultSearch)
      .then(
        json => this.setState({ students: json }),
        err => this.props.dispatchFindStudents(err)
      );
  }

  render() {
    return (
      <div>
        {JSON.stringify(this.state.students)}
      </div>
    );
  }
}


const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchFindStudents: searchStr =>
    dispatch(findStudentsAction(searchStr)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(StudentStatistics);

