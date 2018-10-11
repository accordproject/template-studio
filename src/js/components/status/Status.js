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
import { Segment, Icon, Form, Label, Message } from 'semantic-ui-react';

const statusColor = (log) => (
    log.indexOf('success') != -1 ? 'green' :
        log.indexOf('fail') != -1 ? 'red' :
        'grey'
);
const newlines = (log) => (log.split('\n').map(function(item, key) {
  return (
    <span key={key}>
      {item}
      <br/>
    </span>
  )
}));
const printErrors = (log) => (
//      <Message.List><Segment>{log}</Segment></Message.List>
    log.indexOf('success') == -1 ? <Message.List><Segment>{newlines(log)}</Segment></Message.List> : <Message.List/>
);

const StatusTable = (log) => (
    <Message>
      <Label color={statusColor(log)}>Contract Instance Parses</Label>
      <Label color={statusColor(log)}>Contract Logic Compiles</Label>
      {printErrors(log)}
    </Message>
);

const Status = ({ log }) => StatusTable(log);
;
Status.propTypes = {
    log: PropTypes.string.isRequired
};
export default Status;
