import React from 'react';
import PropTypes from 'prop-types';
import { Header, Icon, Menu, Modal } from 'semantic-ui-react';

import FileUpload from '../../components/presentational/FileUpload';

const ModalUpload = (props) => (
  <Modal size='small' open={props.modalUploadOpen}
         onClose={props.handleUploadClose}
         trigger={<Menu.Item onClick={props.handleUploadOpen}><Icon name='upload'/>...from disk</Menu.Item>}>
    <Header>Upload a template archive (.cta file) from your machine:</Header>
    <Modal.Content>
      <FileUpload handleUploadConfirm={props.handleUploadConfirm}/>
    </Modal.Content>
  </Modal>
);

ModalUpload.propTypes = {
  handleUploadClose: PropTypes.func.isRequired,
  handleUploadConfirm: PropTypes.func.isRequired,
  handleUploadOpen: PropTypes.func.isRequired,
  modalUploadOpen: PropTypes.bool.isRequired,
}

export default ModalUpload;
