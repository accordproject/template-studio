/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Card, Confirm, Form, Input, Radio } from 'semantic-ui-react';

import { StatusLabel } from '../../Status';
import {
  DiscardButton,
  ExportButton,
} from './TemplateButton';

class TemplateForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      confirmReset: { flag: false, temp: null },
    };

    this.handleDiscardAborted = this.handleDiscardAborted.bind(this);
    this.handleDiscardChange = this.handleDiscardChange.bind(this);
    this.handleDiscardConfirmed = this.handleDiscardConfirmed.bind(this);
  }

  handleDiscardAborted() {
    this.setState({
      confirmReset: { flag: false, temp: null },
    });
  }

  handleDiscardChange() {
    if (this.props.status === 'changed') {
      this.setState({
        confirmReset: { flag: true, temp: null },
      });
    } else {
      this.props.loadTemplateFromUrl(this.props.templateURL);
    }
  }

  handleDiscardConfirmed() {
    this.setState({
      confirmReset: { flag: false, temp: null },
    });
    this.props.loadTemplateFromUrl(this.props.templateURL);
  }

  render() {
    const { log, status, templateStudioMode } = this.props;

    return (
      <Card fluid>
        <Card.Content>
          <Card.Header>Current Template</Card.Header>
          <StatusLabel log={log} status={status} textOnly={templateStudioMode} />
        </Card.Content>
        <Card.Content>
          <Form>
            <Form.Field
              control={Radio}
              slider
              label="full contract"
              value={this.props.templateType}
              checked={this.props.templateType === 'contract'}
              onChange={this.props.handleTypeChange}
            />
            <Form.Field
              control={Radio}
              slider
              label="logic off"
              value={this.props.templateStudioMode}
              checked={this.props.templateStudioMode === 'simple'}
                onChange={this.props.handleStudioModeChange}
            />
            <Form.Field
              control={Input}
              label="Name"
              onChange={this.props.handleNameChange}
              value={
                this.props.templateName
              }
            >
            </Form.Field>
            <Form.Field
              control={Input}
              label="Version"
              onChange={this.props.handleVersionChange}
              value={
                this.props.templateVersion
              }
            >
            </Form.Field>
          </Form>
        </Card.Content>
        <Card.Content>
          <ExportButton
            handleStatusChange={this.props.handleStatusChange}
            clause={this.props.clause}
          />
          <Confirm
            content="Your template has been edited, are you sure you want to discard those changes? You can save your current template by using the Export button."
            confirmButton="I am sure"
            cancelButton="Cancel"
            open={this.state.confirmReset.flag}
            onCancel={this.handleDiscardAborted}
            onConfirm={this.handleDiscardConfirmed}
          />
          <DiscardButton enabled={this.props.status === 'changed'} handleDiscardChange={this.handleDiscardChange} />
        </Card.Content>
      </Card>
    );
  }
}

TemplateForm.propTypes = {
  clause: PropTypes.object,
  handleNameChange: PropTypes.func.isRequired,
  handleVersionChange: PropTypes.func.isRequired,
  handleStatusChange: PropTypes.func.isRequired,
  handleTypeChange: PropTypes.func.isRequired,
  handleStudioModeChange: PropTypes.func.isRequired,
  loadTemplateFromUrl: PropTypes.func.isRequired,
  log: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  templateType: PropTypes.string,
  templateStudioMode: PropTypes.string,
  templateName: PropTypes.string.isRequired,
  templateVersion: PropTypes.string.isRequired,
  templateURL: PropTypes.string.isRequired,
};

export default TemplateForm;
