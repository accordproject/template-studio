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
import { Icon, Button } from 'semantic-ui-react';
import saveAs from 'file-saver';

require('@babel/core');
require('@babel/polyfill');

class ExportButton extends Button {
  constructor(props) {
    super(props);
    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.downloadCta = this.downloadCta.bind(this);
  }
  handleStatusChange(status) {
    this.props.handleStatusChange(status);
  }
  async downloadCta(clause) {
    if (clause !== null) {
      const template = clause.getTemplate();
      const name = template.getMetadata().getName();
      const cta = await template.toArchive('ergo');
      const blob = new Blob([cta], { type: 'application/zip' });
      saveAs(blob, `${name}.cta`);
      this.handleStatusChange('saved');
    } else {
      console.log('CLAUSE MISSING!');
    }
  }
  render() {
    return (
      <Button size="mini" primary onClick={() => this.downloadCta(this.props.clause)}>
        <Icon name="download" />
        Export
      </Button>
    );
  }
}
ExportButton.propTypes = {
  handleStatusChange: PropTypes.func.isRequired,
  clause: PropTypes.object,
};

class DiscardButton extends Button {
  constructor(props) {
    super(props);
    this.handleDiscardChange = this.handleDiscardChange.bind(this);
  }
  handleDiscardChange() {
    this.props.handleDiscardChange();
  }
  render() {
    return (
      this.props.enabled ?
        <Button size="mini" secondary onClick={this.handleDiscardChange}>
          <Icon name="redo" flipped="horizontally" />
          Discard Changes
        </Button> :
        <Button size="mini" secondary disabled>
          <Icon name="redo" flipped="horizontally" />
          Discard Changes
        </Button>
    );
  }
}
DiscardButton.propTypes = {
  enabled: PropTypes.bool,
  handleDiscardChange: PropTypes.func.isRequired,
};

export { ExportButton, DiscardButton };
