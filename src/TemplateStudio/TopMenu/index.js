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
import { Confirm, Container, Dropdown, Header, Icon, Image, Menu } from 'semantic-ui-react';

import ModalURL from './ModalURL';
import ModalUpload from './ModalUpload';
import ModalAbout from './ModalAbout';

class TopMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalURLOpen: false,
      modalUploadOpen: false,
      newTemplateURL: '',
      confirm: { flag: false, temp: null },
      confirmNew: { flag: false, temp: null },
    };

    this.blobToBuffer = this.blobToBuffer.bind(this);
    this.handleNewChange = this.handleNewChange.bind(this);
    this.handleNewConfirmed = this.handleNewConfirmed.bind(this);
    this.handleNewAborted = this.handleNewAborted.bind(this);
    this.handleSelectTemplate = this.handleSelectTemplate.bind(this);
    this.handleSelectTemplateConfirmed = this.handleSelectTemplateConfirmed.bind(this);
    this.handleSelectTemplateAborted = this.handleSelectTemplateAborted.bind(this);
    this.handleUploadOpen = this.handleUploadOpen.bind(this);
    this.handleUploadClose = this.handleUploadClose.bind(this);
    this.handleUploadConfirm = this.handleUploadConfirm.bind(this);
    this.handleURLChange = this.handleURLChange.bind(this);
    this.handleURLOpen = this.handleURLOpen.bind(this);
    this.handleURLAbort = this.handleURLAbort.bind(this);
    this.handleURLConfirm = this.handleURLConfirm.bind(this);
  }

  blobToBuffer(blob, cb) {
    if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
      throw new Error('first argument must be a Blob');
    }
    if (typeof cb !== 'function') {
      throw new Error('second argument must be a function');
    }

    const reader = new FileReader();

    function onLoadEnd(e) {
      reader.removeEventListener('loadend', onLoadEnd, false);
      if (e.error) cb(e.error);
      else cb(null, Buffer.from(reader.result));
    }

    reader.addEventListener('loadend', onLoadEnd, false);
    reader.readAsArrayBuffer(blob);
  }

  handleURLChange(e, input) {
    this.setState({
      newTemplateURL: input.value,
      modalURLOpen: true,
    });
  }
  handleURLOpen() {
    this.setState({ modalURLOpen: true });
  }
  handleURLAbort() {
    this.setState({ modalURLOpen: false });
  }
  handleURLConfirm() {
    const templateURL = this.state.newTemplateURL;
    this.props.loadTemplateFromUrl(templateURL);
    this.setState({
      modalURLOpen: false,
      newTemplateURL: '',
    });
  }

  handleUploadOpen() {
    this.setState({ modalUploadOpen: true });
  }
  handleUploadClose() {
    this.setState({ modalUploadOpen: false });
  }
  handleUploadConfirm(file) {
    this.blobToBuffer(file, (err, buffer) => {
      if (err) throw err;
      this.props.loadTemplateFromBuffer(buffer);
    });
    this.setState({ modalUploadOpen: false });
  }

  handleSelectTemplateConfirmed() {
    const data = this.state.confirm.temp;
    this.props.loadTemplateFromUrl(data);
    this.setState({ confirm: { flag: false, temp: null } });
  }
  handleSelectTemplateAborted() {
    this.setState({ confirm: { flag: false, temp: null } });
  }
  handleSelectTemplate(event, data) {
    if (this.props.status === 'changed') {
      this.setState({ confirm: { flag: true, temp: data.value } });
    } else {
      this.props.loadTemplateFromUrl(data.value);
    }
  }

  handleNewChange(emptyTemplate) {
    if (this.props.status === 'changed') {
      this.setState({ confirmNew: { flag: true, temp: emptyTemplate } });
    } else {
      this.props.loadTemplateFromUrl(emptyTemplate);
    }
  }
  handleNewConfirmed() {
    const emptyTemplate = this.state.confirmNew.temp;
    this.setState({ confirmNew: { flag: false, temp: null } });
    this.props.loadTemplateFromUrl(emptyTemplate);
  }
  handleNewAborted() {
    this.setState({ confirmNew: { flag: false, temp: null } });
  }

  render() {
    const EMPTY_CONTRACT_TEMPLATE = `${ROOT_URI}/static/archives/empty-contract@0.8.0.cta`;
    const EMPTY_CLAUSE_TEMPLATE = `${ROOT_URI}/static/archives/empty@0.9.0.cta`;

    return (
      <Menu fixed="top" inverted style={{ background: '#1b2540'}}>
        <Container fluid>
          <Menu.Item header>
            <Image size="small" href="https://www.accordproject.org" src="static/img/logo.png" style={{ marginRight: '1.5em' }} target="_blank" />
            Template Studio
          </Menu.Item>
          <Menu.Item>
            <Confirm content="Your template has been edited, are you sure you want to load a new one? You can save your current template by using the Export button." confirmButton="I am sure" cancelButton="Cancel" open={this.state.confirm.flag} onCancel={this.handleSelectTemplateAborted} onConfirm={this.handleSelectTemplateConfirmed} />
            <Dropdown
              style={{ width: '270px' }}
              icon="search"
              className="ui icon fixed"
              text="Search Template Library"
              labeled
              button
              search
              options={this.props.templates}
              onChange={this.handleSelectTemplate}
            />
          </Menu.Item>
          <Menu.Item>
            <Dropdown item text="New Template" simple>
              <Dropdown.Menu>
                <Confirm content="Your template has been edited, are you sure you want to load a new one? You can save your current template by using the Export button." confirmButton="I am sure" cancelButton="Cancel" open={this.state.confirmNew.flag} onCancel={this.handleNewAborted} onConfirm={this.handleNewConfirmed} />
                <Menu.Item onClick={() => this.handleNewChange(EMPTY_CONTRACT_TEMPLATE)}>
                  <Icon name="file alternate outline" /> Contract Template
                </Menu.Item>
                <Menu.Item onClick={() => this.handleNewChange(EMPTY_CLAUSE_TEMPLATE)}>
                  <Icon name="file outline" /> Clause Template
                </Menu.Item>
                <Header as="h4">Import</Header>
                <ModalURL
                  handleURLAbort={this.handleURLAbort}
                  handleURLChange={this.handleURLChange}
                  handleURLConfirm={this.handleURLConfirm}
                  handleURLOpen={this.handleURLOpen}
                  modalURLOpen={this.state.modalURLOpen}
                  newTemplateURL={this.newTemplateURL}
                />
                <ModalUpload
                  handleUploadClose={this.handleUploadClose}
                  handleUploadConfirm={this.handleUploadConfirm}
                  handleUploadOpen={this.handleUploadOpen}
                  modalUploadOpen={this.state.modalUploadOpen}
                />
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown item text="Help" simple>
              <Dropdown.Menu>
                <ModalAbout />
                <Header as="h4">Content</Header>
                <Menu.Item href="https://templates.accordproject.org/" target="_blank">
                  <Icon name="book" /> Template Library
                </Menu.Item>
                <Menu.Item href="https://models.accordproject.org/" target="_blank">
                  <Icon name="sitemap" /> Models Library
                </Menu.Item>
                <Header as="h4">Documentation</Header>
                <Menu.Item href="https://docs.accordproject.org/" target="_blank">
                  <Icon name="info" /> Documentation
                </Menu.Item>
                <Menu.Item href="https://docs.accordproject.org/docs/logic-ergo.html" target="_blank">
                  <Icon name="lab" /> Ergo Language Guide
                </Menu.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Item>
        </Container>
      </Menu>
    );
  }
}

TopMenu.propTypes = {
  loadTemplateFromBuffer: PropTypes.func.isRequired,
  loadTemplateFromUrl: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  templates: PropTypes.array.isRequired,
};

export default TopMenu;
