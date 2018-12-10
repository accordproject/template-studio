import React from 'react';
import PropTypes from 'prop-types';
import { Confirm, Container, Dropdown, Header, Icon, Image, Menu } from 'semantic-ui-react';

import ModalURL from './ModalURL';
import ModalUpload from './ModalUpload';


class TopMenu extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      modalURLOpen: false,
      modalUploadOpen: false,
      newTemplateURL: '',
    }

    this.blobToBuffer = this.blobToBuffer.bind(this);
    this.handleURLChange = this.handleURLChange.bind(this);
    this.handleURLOpen = this.handleURLOpen.bind(this);
    this.handleURLAbort = this.handleURLAbort.bind(this);
    this.handleURLConfirm = this.handleURLConfirm.bind(this);
    this.handleUploadOpen = this.handleUploadOpen.bind(this);
    this.handleUploadClose = this.handleUploadClose.bind(this);
    this.handleUploadConfirm = this.handleUploadConfirm.bind(this);
  }

  blobToBuffer(blob, cb) {
    if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
        throw new Error('first argument must be a Blob');
    }
    if (typeof cb !== 'function') {
        throw new Error('second argument must be a function');
    }
    
    var reader = new FileReader();
    
    function onLoadEnd (e) {
        reader.removeEventListener('loadend', onLoadEnd, false);
        if (e.error) cb(e.error);
        else cb(null, Buffer.from(reader.result));
    }
    
    reader.addEventListener('loadend', onLoadEnd, false);
    reader.readAsArrayBuffer(blob);
}
  handleURLChange(e, { name, value }) {
    const state = this.state;
    state.newTemplateURL = value;
    state.modalURLOpen = true;
    this.setState(state);
  }
  handleURLOpen() {
      const state = this.state;
      state.modalURLOpen = true;
      this.setState(state);
  }
  handleURLAbort() {
      const state = this.state;
      state.modalURLOpen = false;
      this.setState(state);
  }
  handleURLConfirm() {
      const state = this.state;
      state.modalURLOpen = false;
      const templateURL = state.newTemplateURL;
      state.newTemplateURL = '';
      this.props.loadTemplateFromUrl(templateURL);
  }
  handleUploadOpen() {
      const state = this.state;
      state.modalUploadOpen = true;
      this.setState(state);
  }
  handleUploadClose() {
      const state = this.state;
      state.modalUploadOpen = false;
      this.setState(state);
  }
  handleUploadConfirm(file) {
    const state = this.state;
    const loadTemplateFun = this.props.loadTemplateFromBuffer;
    this.blobToBuffer(file, function (err, buffer) {
        if (err) throw err;
        loadTemplateFun(buffer);
    });
    state.modalUploadOpen = false;
}
  
  render() {
    return (
      <Menu fixed='top' inverted>
      <Container fluid>
        <Menu.Item header>
          <Image size='mini' href='https://www.accordproject.org' src='static/img/logo.png' style={{ marginRight: '1.5em' }} target='_blank'/>
          Accord Project &middot; Template Studio
        </Menu.Item>
        <Menu.Item>
          <Confirm content='Your template has been edited, are you sure you want to load a new one? You can save your current template by using the Export button.' confirmButton="I am sure" cancelButton='Cancel' open={this.props.confirmFlag} onCancel={this.props.handleSelectTemplateAborted} onConfirm={this.props.handleSelectTemplateConfirmed} />
          <Dropdown style={{'width': '270px'}} icon='search'
                    className='ui icon fixed'
                    text='Search Template Library'
                    labeled button
                    search
                    options={this.props.templates}
                    onChange={this.props.handleSelectTemplate}/>
        </Menu.Item>
        <Menu.Item>
          <Dropdown item text='New Template' simple>
            <Dropdown.Menu>
              <Confirm content='Your template has been edited, are you sure you want to load a new one? You can save your current template by using the Export button.' confirmButton="I am sure" cancelButton='Cancel' open={this.props.confirmnewFlag} onCancel={this.props.handleNewAborted} onConfirm={this.props.handleNewConfirmed} />
              <Menu.Item onClick={() => this.props.handleNewChange(EMPTY_CONTRACT_TEMPLATE)}>
                  <Icon name="file alternate outline"/> Empty Contract
              </Menu.Item>
              <Menu.Item onClick={() => this.props.handleNewChange(EMPTY_CLAUSE_TEMPLATE)}>
                  <Icon name="file outline"/> Empty Clause
              </Menu.Item>
              <Header as='h4'>Import</Header>
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
          <Dropdown item text='Help' simple>
            <Dropdown.Menu>
              {/* <ModalAbout/> */}
              <Header as='h4'>Documentation</Header>
              <Menu.Item href='https://docs.accordproject.org/' target='_blank'>
                <Icon name='info'/> Accord Project Documentation
              </Menu.Item>
              <Menu.Item href='https://docs.accordproject.org/docs/ergo-lang.html' target='_blank'>
                <Icon name='lab'/> Ergo Language Guide
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
  confirmFlag: PropTypes.bool.isRequired,
  confirmnewFlag: PropTypes.bool.isRequired,
  handleNewAborted: PropTypes.func.isRequired,
  handleNewChange: PropTypes.func.isRequired,
  handleNewConfirmed: PropTypes.func.isRequired,
  handleSelectTemplate: PropTypes.func.isRequired,
  handleSelectTemplateAborted: PropTypes.func.isRequired,
  handleSelectTemplateConfirmed: PropTypes.func.isRequired,
  loadTemplateFromBuffer: PropTypes.func.isRequired,
  loadTemplateFromUrl: PropTypes.func.isRequired,
  templates: PropTypes.array.isRequired,
}

export default TopMenu;