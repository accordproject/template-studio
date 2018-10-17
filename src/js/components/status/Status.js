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

'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Icon, Label, Message, Tab, Card } from 'semantic-ui-react';

const isFailure = (log) => (
    log.text.indexOf('success') == -1 || log.logic.indexOf('success') == -1 || log.meta.indexOf('success') == -1
);

const statusColor = (log) => (
    log.indexOf('success') != -1 ? 'green' :
        log.indexOf('error') != -1 || log.indexOf('Error') != -1 || log.indexOf('invalid') != -1 ? 'red' :
        'grey'
);
const statusIcon = (log) => (
    log.indexOf('success') != -1 ? 'check' :
        log.indexOf('error') != -1 || log.indexOf('Error') != -1 || log.indexOf('invalid') != -1 ? 'warning sign' :
        'warning sign'
);
const newlines = (log) => (log.split('\n').map(function(item, key) {
  return (
    <span key={key}>
      {item}
      <br/>
    </span>
  )
}));

const printTextErrors = (log) => (
    log.indexOf('success') == -1 ? 
        <Message>
          <Message.Header>Natural Language Error</Message.Header>
          <Message.List><Segment>{newlines(log)}</Segment></Message.List>
        </Message>
    : null
);

const printLogicErrors = (log) => (
    log.indexOf('success') == -1 ? 
        <Message>
          <Message.Header>Contract Logic Error</Message.Header>
          <Message.List><Segment>{newlines(log)}</Segment></Message.List>
        </Message>
    : null
);

const printMetaErrors = (log) => (
    log.indexOf('success') == -1 ? 
        <Message>
          <Message.Header>Metadata Error</Message.Header>
          <Message.List><Segment>{newlines(log)}</Segment></Message.List>
        </Message>
    : null
);

const StatusTable = (log) => (
    (log.text.indexOf('success') == -1 || log.logic.indexOf('success') == -1 || log.meta.indexOf('success') == -1) ?
        <div>{printTextErrors(log.text)}{printLogicErrors(log.logic)}{printLogicErrors(log.meta)}</div>
    : <Message><Message.Header>No Error</Message.Header></Message>
);

const StatusIcon = ({ log }) => (
    log.indexOf('success') == -1
        ? <Icon name={statusIcon(log)} color={statusColor(log)}/>
        : null);
StatusIcon.propTypes = {
    log: PropTypes.string.isRequired
};

const StatusLabel = ({ log }) => (
    (isFailure(log) ?
        <Card.Meta><Icon name='warning sign' color='red'/> Errors</Card.Meta>
     : <Card.Meta><Icon name='check' color='green'/> No Errors</Card.Meta>)
);

const Status = ({ log }) => StatusTable(log);
Status.propTypes = {
    log: PropTypes.object.isRequired
};

export { StatusIcon, Status, StatusLabel };
