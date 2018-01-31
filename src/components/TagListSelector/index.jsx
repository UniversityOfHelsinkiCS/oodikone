import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon, Search, Label, Confirm } from 'semantic-ui-react';
import { connect } from 'react-redux';

import { addError, findTagsAction } from '../../actions';


import styles from './tagListSelector.css';


class TagListSelector extends Component {
  constructor(props) {
    super(props);

    this.renderTags = this.renderTags.bind(this);
    this.renderEditComponent = this.renderEditComponent.bind(this);
    this.setEditable = this.setEditable.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleAddTag = this.handleAddTag.bind(this);
    this.handleRemoveTag = this.handleRemoveTag.bind(this);
    this.setConfirm = this.setConfirm.bind(this);

    this.state = {
      isEdit: false,
      isLoading: false,
      searchStr: '',
      existingTags: [],
      isConfirm: false
    };
  }

  setEditable() {
    const { isEdit } = this.state;
    this.setState({ isEdit: !isEdit, searchStr: '' });
  }

  setConfirm() {
    const { isConfirm } = this.state;
    this.setState({ isConfirm: !isConfirm });
  }

  handleSearchChange(e, { value }) {
    this.fetchTags(value);
  }

  handleAddTag(e, { result }) {
    const { handleAddTagFn } = this.props;
    handleAddTagFn(result.title);
    this.setEditable();
  }

  handleRemoveTag(tag) {
    const { handleRemoveTagFn } = this.props;
    this.setState({ isConfirm: false });
    handleRemoveTagFn(tag);
  }

  fetchTags(searchStr) {
    this.setState({ isLoading: true, searchStr });
    this.props.dispatchFindTagsAction(searchStr)
      .then(
        json => this.setState({ existingTags: json.value, isLoading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  renderTags() {
    const { tags, translate } = this.props;
    const { isConfirm } = this.state;

    if (tags && tags.length > 0) {
      return tags.map(tag => (
        <Label key={tag} className={styles.tag}>
          {tag}
          <Icon name="delete" onClick={this.setConfirm} />
          <Confirm
            open={isConfirm}
            onCancel={this.setConfirm}
            onConfirm={() => this.handleRemoveTag(tag)}
            content={`${translate('tags.confirmDelete')}: ${tag}`}
            cancelButton={translate('common.cancel')}
            confirmButton={translate('common.ok')}
          />
        </Label>
      ));
    }
    return null;
  }

  renderEditComponent() {
    const { tags, translate } = this.props;
    const {
      isEdit, isLoading, searchStr, existingTags
    } = this.state;
    if (isEdit) {
      const results = existingTags
        .filter(tag => !tags.includes(tag))
        .map(tag => ({ title: tag }));

      return (
        <Search
          className={styles.tagSearch}
          input={{ fluid: true }}
          loading={isLoading}
          icon="caret down"
          placeholder={translate('tags.searchAndAdd')}
          onSearchChange={this.handleSearchChange}
          onResultSelect={this.handleAddTag}
          onFocus={this.handleSearchChange}
          minCharacters={0}
          results={results}
          noResultsMessage={translate('common.noResults')}
          value={searchStr}
          fluid
        />);
    }
    return (
      <div className={styles.editableContainer} onClick={this.setEditable}>
        <Icon.Group
          className={styles.selectableIcon}
        >
          <Icon name="tags" />
          <Icon corner name="add" />
        </Icon.Group>
        {translate('tags.addTag')}
      </div>);
  }

  render() {
    return (
      <div className={styles.tagsContainer}>
        { this.renderTags()}
        { this.renderEditComponent() }
      </div>
    );
  }
}


const { func, arrayOf, string } = PropTypes;

TagListSelector.defaultProps = {
  tags: []
};

TagListSelector.propTypes = {
  tags: arrayOf(string),
  translate: func.isRequired,
  handleAddTagFn: func.isRequired,
  handleRemoveTagFn: func.isRequired,
  dispatchFindTagsAction: func.isRequired,
  dispatchAddError: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchFindTagsAction: searchStr =>
    dispatch(findTagsAction(searchStr)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(TagListSelector);
