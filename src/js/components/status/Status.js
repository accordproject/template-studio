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

const parseFailure = (log) => (
    log.text.indexOf('success') == -1
);
const logicFailure = (log) => (
    log.logic.indexOf('success') == -1
);
const metaFailure = (log) => (
    log.meta.indexOf('success') == -1
);
const executeFailure = (log) => (
    log.execute.indexOf('success') == -1
);

const templateFailure = (log) => (
    parseFailure(log)
        || logicFailure(log)
        || metaFailure(log)
);
const otherFailure = (log) => (
    executeFailure(log)
);

const anyFailure = (log) => (
    templateFailure(log)
        || otherFailure(log)
);

const newlines = (log) => (log.split('\n').map(function(item, key) {
  return (
    <span key={key}>
      {item}
      <br/>
    </span>
  );
}));

const printErrors = (log) => (
    log.indexOf('success') == -1 ? 
        <Message attached='top'>
          <Message.List>{newlines(log)}</Message.List>
        </Message>
    : null
);

const ParseTable = (log) => (
    (parseFailure(log) ?
        <div>{printErrors(log.text)}</div>
     : <Message attached='top'><Message.Header>No Error</Message.Header></Message>)
);

const LogicTable = (log) => (
    (logicFailure(log) ?
        <div>{printErrors(log.logic)}</div>
     : <Message attached='top'><Message.Header>No Error</Message.Header></Message>)
);

const MetaTable = (log) => (
    (metaFailure(log) ?
        <div>{printErrors(log.meta)}</div>
     : <Message attached='top'><Message.Header>No Error</Message.Header></Message>)
);

const ExecuteTable = (log) => (
    (executeFailure(log) ?
        <div>{printErrors(log.execute)}</div>
     : <Message attached='top'><Message.Header>No Error</Message.Header></Message>)
);

const StatusLabel = ({ log }) => (
    (templateFailure(log) ?
        <Card.Meta><Icon name='warning sign' color='red'/> Errors</Card.Meta>
     : <Card.Meta><Icon name='check' color='green'/> No Errors</Card.Meta>)
);

const AllStatusLabel = ({ log }) => (
    (anyFailure(log) ?
        <Card.Meta>Errors</Card.Meta>
     : <Card.Meta><Icon name='check' color='green'/>No Errors</Card.Meta>)
);

const ParseStatus = ({ log }) => ParseTable(log);
ParseStatus.propTypes = {
    log: PropTypes.object.isRequired
};

const LogicStatus = ({ log }) => LogicTable(log);
LogicStatus.propTypes = {
    log: PropTypes.object.isRequired
};

const MetaStatus = ({ log }) => MetaTable(log);
MetaStatus.propTypes = {
    log: PropTypes.object.isRequired
};

const ExecuteStatus = ({ log }) => ExecuteTable(log);
ExecuteStatus.propTypes = {
    log: PropTypes.object.isRequired
};

export {
    parseFailure,
    logicFailure,
    metaFailure,
    executeFailure,
    templateFailure,
    otherFailure,
    anyFailure,
    ParseStatus,
    LogicStatus,
    MetaStatus,
    ExecuteStatus,
    StatusLabel,
    AllStatusLabel
};
