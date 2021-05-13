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
import { Button, Header, Icon, Input, Menu, Modal } from 'semantic-ui-react';


const ModalURL = props => (
  <Modal
    size="small"
    open={props.modalURLOpen}
    onClose={props.handleURLAbort}
    trigger={<Menu.Item onClick={props.handleURLOpen}><Icon name="world" />...from URL</Menu.Item>}
  >
    <Header>Enter the URL of the template archive to load:</Header>
    <Modal.Content>
      <Input
        autoFocus
        label={{ icon: 'linkify' }}
        labelPosition="left"
        onChange={props.handleURLChange}
        value={props.newTemplateURL}
        placeholder="e.g., https://templates.accordproject.org/archives/helloworld@0.14.0.cta"
        fluid
      />
    </Modal.Content>
    <Modal.Actions>
      <Button onClick={props.handleURLAbort}>
        <Icon name="close" /> Cancel
      </Button>
      <Button primary onClick={props.handleURLConfirm}>
        <Icon name="checkmark" /> Upload
      </Button>
    </Modal.Actions>
  </Modal>
);

ModalURL.propTypes = {
  handleURLAbort: PropTypes.func.isRequired,
  handleURLChange: PropTypes.func.isRequired,
  handleURLConfirm: PropTypes.func.isRequired,
  handleURLOpen: PropTypes.func.isRequired,
  modalURLOpen: PropTypes.bool.isRequired,
  newTemplateURL: PropTypes.string,
};

export default ModalURL;
