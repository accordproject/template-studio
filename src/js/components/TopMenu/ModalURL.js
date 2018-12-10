import React from 'react';
import PropTypes from 'prop-types';
import { Button, Header, Icon, Input, Menu, Modal } from 'semantic-ui-react';


const ModalURL = (props) => (
  <Modal size='small' open={props.modalURLOpen}
         onClose={props.handleURLAbort}
         trigger={<Menu.Item onClick={props.handleURLOpen}><Icon name='world'/>...from URL</Menu.Item>}>
    <Header>Enter the URL of the template archive to load:</Header>
    <Modal.Content>
      <Input autoFocus
             label={{ icon: 'linkify' }} labelPosition='left'
             onChange={ props.handleURLChange }
             value={ props.newTemplateURL }
             placeholder='e.g., https://templates.accordproject.org/archives/helloworld@0.7.0.cta'
             fluid></Input>
    </Modal.Content>
    <Modal.Actions>
      <Button color='red' onClick={props.handleURLAbort} inverted>
        <Icon name='close' /> Cancel
      </Button>
      <Button color='green' onClick={props.handleURLConfirm} inverted>
        <Icon name='checkmark' /> Upload
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
}

export default ModalURL;
