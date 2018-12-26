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
import { Header, Icon, Menu, Modal } from 'semantic-ui-react';

import FileUpload from '../FileUpload';

const ModalUpload = props => (
  <Modal
    size="small"
    open={props.modalUploadOpen}
    onClose={props.handleUploadClose}
    trigger={<Menu.Item onClick={props.handleUploadOpen}><Icon name="upload" />...from disk</Menu.Item>}
  >
    <Header>Upload a template archive (.cta file) from your machine:</Header>
    <Modal.Content>
      <FileUpload handleUploadConfirm={props.handleUploadConfirm} />
    </Modal.Content>
  </Modal>
);

ModalUpload.propTypes = {
  handleUploadClose: PropTypes.func.isRequired,
  handleUploadConfirm: PropTypes.func.isRequired,
  handleUploadOpen: PropTypes.func.isRequired,
  modalUploadOpen: PropTypes.bool.isRequired,
};

export default ModalUpload;
