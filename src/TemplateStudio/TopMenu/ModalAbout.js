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
import { Divider, Header, Icon, Menu, Modal } from 'semantic-ui-react';
import * as ciceroPackageJson from '@accordproject/cicero-core/package.json';
import * as ergoPackageJson from '@accordproject/ergo-compiler/package.json';

const ciceroVersion = ciceroPackageJson.version;
const ergoVersion = ergoPackageJson.version;

const ModalAbout = () => (
  <Modal trigger={<Menu.Item><Icon name="question" /> About</Menu.Item>}>
    <Modal.Header>Accord Project &middot; Template Studio</Modal.Header>
    <Modal.Content>
      <Modal.Description>
        <Header>Welcome!</Header>
        <p>This template studio lets you load, edit and test legal clause or contract templates built with the <a href="https://accordproject.org/" target="_blank" rel="noopener noreferrer">Accord Project</a> technology.</p>
        <p>It is open-source and under active development. Contributions and bug reports are welcome on <a href="https://github.com/accordproject/template-studio" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
      </Modal.Description>
      <Divider />
      <Modal.Description>
        <Header>Getting started</Header>
        <p>Search a template from the <a href="https://templates.accordproject.org" target="_blank" rel="noopener noreferrer">Accord Project template library</a> (Search box at the top)</p>
        <p>Chose whether to edit the <b>Contract Text</b>, <b>the Model</b>,
        or the <b>Logic</b> (Tab on the upper left)</p>
        <p>Edit the <b>Test Contract</b> and inspect the corresponding <b>Contract data</b></p>
        <p>Edit the <b>Template</b> and see the corresponding <b>Test Contract</b></p>
        <p>Edit the <b>Ergo</b> contract logic and test it by executing requests</p>
      </Modal.Description>
      <Divider />
      <Modal.Description>
        <Header>Version Information</Header>
        <p>Cicero {ciceroVersion}</p>
        <p>Ergo {ergoVersion}</p>
      </Modal.Description>
    </Modal.Content>
  </Modal>
);

export default ModalAbout;
