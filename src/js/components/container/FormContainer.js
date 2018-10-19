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

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InputGrammar from '../presentational/InputGrammar';
import InputJson from '../presentational/InputJson';
import ModelForm from '../tabs/ModelForm';
import LogicForm from '../tabs/LogicForm';
import CompileForm from '../tabs/CompileForm';
import ParseForm from '../tabs/ParseForm';
import ExecuteForm from '../tabs/ExecuteForm';
import { Status, StatusIcon, StatusLabel } from '../status/Status';
import Options from '../status/Options';
import { UploadButton, DownloadLabel, NewButton } from '../status/TemplateTab';
import { Template, Clause } from '@accordproject/cicero-core';
import { Button, Form, Container, Divider, Segment, Tab, Label, Header, Image, Input, Grid, Dropdown, Menu, Modal, Icon, Card } from 'semantic-ui-react';
import Ergo from '@accordproject/ergo-compiler/lib/ergo.js';
import moment from 'moment';

import * as templateLibrary from '@accordproject/cicero-template-library/build/template-library.json';
import * as ciceroPackageJson from '@accordproject/cicero-core/package.json';
import * as ergoPackageJson from '@accordproject/ergo-compiler/package.json';
const semver = require('semver');

const ciceroVersion = ciceroPackageJson.version;
const ergoVersion = ergoPackageJson.version;

function getTemplates() {
    var templates = [];
    for(var t in templateLibrary.default) {
        let currentT = t;
        let currentTemplate = templateLibrary.default[t];
        let currentName = currentTemplate.name;
        let currentVersion = currentTemplate.version;
        // Keep only the last version for any given template
        for (var t2 in templateLibrary.default) {
            const newTemplate = templateLibrary.default[t2];
            const newName = newTemplate.name;
            const newVersion = newTemplate.version;
            if (newName === currentName && semver.gt(newVersion, currentVersion)) {
                currentT = t2;
                currentTemplate = newTemplate;
                currentName = currentTemplate.name;
                currentVersion = currentTemplate.version;
            }
        }
        // Make sure it's the right ciceroVersion and uses Ergo
        if (currentTemplate.ciceroVersion === '^0.8.0' && currentTemplate.language === 0) {
            if (templates.filter(t => t.key === currentT).length < 1)
                templates.push({'key':currentT, 'value':currentT, 'text':currentT});
        }
    }
    return templates;
}
const templates = getTemplates();

function parse(input_state,text) {
    const state = input_state;
    const clause = input_state.clause;
    try {
        clause.parse(text);
        state.data = JSON.stringify(clause.getData(),null,2);
        state.log.text = 'Parse successful!',
        state.text = text;
    } catch (error){
        state.data = 'null';
        state.log.text = '[Parse Contract] ' + error.message;
        state.text = text;
    }
    return state;
}

function generateText(input_state,data) {
    const state = input_state;
    try {
        const dataContent = JSON.parse(data);
        const clause = input_state.clause;
        clause.setData(dataContent);
        const text = clause.generateText();
        state.text = text;
        state.data = data;
        state.log.text = 'GenerateText successful!';
    } catch (error){
        state.data = data;
        state.log.text = '[Instantiate Contract] ' + error.log;
    }
    return state;
}

function compileLogic(editor,logic,state) {
    const model = state.model;
    const compiledLogic = Ergo.compileToJavaScript(logic,model,'cicero',false);
    state.markers.forEach(marker => marker.clear());
    state.markers = [];
    if (compiledLogic.hasOwnProperty('error')) {
        const error = compiledLogic.error;
        state.log.logic = error.verbose;
        state.logic = logic;
        if (editor) {
            console.log('ERROR'+JSON.stringify(error));
            state.markers.push
            (editor.markText({line:error.locstart.line-1,ch:error.locstart.character},
                             {line:error.locend.line-1,ch:error.locend.character+1},
                             {className: 'syntax-error', title: error.verbose}));
        }
    } else {
        const compiledLogicLinked = Ergo.compileToJavaScript(logic,model,'cicero',true);
        state.clogic = { compiled: compiledLogic.success, compiledLinked : compiledLogicLinked.success };
        state.logic = logic;
        state.log.logic = 'Compilation successful';
    }
    return state;
}

function runLogic(compiledLogic,contract,request,cstate) {
	  const params = { 'contract': contract, 'request': request, 'state' : cstate, 'emit': [], 'now': moment('2018-05-21') };
	  const clauseCall = 'dispatch(params);'; // Create the clause call
    const response = eval(compiledLogic + clauseCall); // Call the logic
    return response;
}

function runInit(compiledLogic,contract) {
	  const params = { 'contract': contract, 'request': null, 'state' : null, 'emit': [], 'now': moment('2018-05-21') };
	  const clauseCall = 'init(params);'; // Create the clause call
    const response = eval(compiledLogic + clauseCall); // Call the logic
    return response;
}

class FormContainer extends Component {
    constructor() {
        super();
        this.state = {
            clause: null,
            package: 'null',
            readme: '',
            text: `[Please Select a Sample Template]`,
            data: 'null',
            log: { text: 'Not yet parsed.', logic: 'Not yet compiled.', meta: 'Not yet loaded.' },
            grammar: `[Please Select a Sample Template]`,
            model: `[Please Select a Sample Template]`,
            logic: `[Please Select a Sample Template]`,
            request: JSON.stringify({
                '$class': 'org.accordproject.helloworld.MyRequest',
                'input': 'Accord Project'
            },null,2),
            cstate: 'null',
            response: JSON.stringify(null, null, 2),
            emit: '[]',
            options: { lineNumbers: false },
            activeItem: 'metadata',
            activeLegal: 'template',
            activeModel: 'model',
            activeLogic: 'ergo',
            activeMeta: 'readme',
            clogic: { compiled: '', compiledLinked: '' },
            markers: [] // For code mirror marking
        };
        this.handlePackageChange = this.handlePackageChange.bind(this);
        this.handleREADMEChange = this.handleREADMEChange.bind(this);
        this.handleSampleChange = this.handleSampleChange.bind(this);
        this.handleGrammarChange = this.handleGrammarChange.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.handleJSONChange = this.handleJSONChange.bind(this);
        this.handleLogicChange = this.handleLogicChange.bind(this);
        this.handleRunLogic = this.handleRunLogic.bind(this);
        this.handleInitLogic = this.handleInitLogic.bind(this);
        this.handleCompileChange = this.handleCompileChange.bind(this);
        this.handleSelectTemplate = this.handleSelectTemplate.bind(this);
        this.loadTemplate = this.loadTemplate.bind(this);
        this.handleItemClick = this.handleItemClick.bind(this);
        this.handleRequestChange = this.handleRequestChange.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.handleResponseChange = this.handleResponseChange.bind(this);
        this.handleEmitChange = this.handleEmitChange.bind(this);
        this.handleLegalTabChange = this.handleLegalTabChange.bind(this);
        this.handleModelTabChange = this.handleModelTabChange.bind(this);
        this.handleLogicTabChange = this.handleLogicTabChange.bind(this);
        this.handleMetaTabChange = this.handleMetaTabChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
    }

    handlePackageChange(text) {
        const state = this.state;
        try {
            const packageJson = JSON.parse(text);
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'package.json change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.package = text;
            state.log.meta = '[Change Template package.json] ' + error;
            this.setState(state);
        }
    }
    handleNameChange(e, { name, value }) {
        const state = this.state;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.name = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template Name change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Name] ' + error;
            this.setState(state);
        }
    }
    handleVersionChange(e, { name, value }) {
        const state = this.state;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.version = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template version change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Version] ' + error;
            this.setState(state);
        }
    }
    handleREADMEChange(text) {
        const state = this.state;
        try {
            const readme = text;
            state.clause.getTemplate().setReadme(readme);
            state.readme = readme
            state.log.meta = 'README change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.readme = text;
            state.log.meta = '[Change Template README] ' + error;
            this.setState(state);
        }
    }

    handleSampleChange(text) {
        const state = this.state;
        this.setState(parse(this.state, text));
    }

    handleLegalTabChange(e, { name }) {
        const state = this.state;
        state.activeLegal = name;
        this.setState(state);
    }
    handleModelTabChange(e, { name }) {
        const state = this.state;
        state.activeModel = name;
        this.setState(state);
    }
    handleLogicTabChange(e, { name }) {
        const state = this.state;
        state.activeLogic = name;
        this.setState(state);
    }
    handleMetaTabChange(e, { name }) {
        const state = this.state;
        state.activeMeta = name;
        this.setState(state);
    }

    handleGrammarChange(text) {
        const state = this.state;
        if (text !== state.grammar) {
            try {
                state.data = JSON.stringify(state.clause.getData(),null,2);
                state.log.text = 'Grammar change successful!';
                state.grammar = text;
                if (state.data !== 'null') {
                    const template = state.clause.getTemplate();
                    state.clause.getTemplate().buildGrammar(text);
                    this.setState(generateText(state,state.data));
                }
            } catch (error){
                state.data = 'null';
                state.log.text = '[Change Template] ' + error.log;
                state.grammar = text;
                this.setState(state);
            }
        }
    }

    handleCompileChange(text) {
        // Compiled code should not be changed
    }

    handleRequestChange(text) {
        const state = this.state;
        state.request = text;
        return this.setState(state);
    }

    handleStateChange(text) {
        const state = this.state;
        state.cstate = text;
        return this.setState(state); 
    }

    handleResponseChange(text) {
        // Response should not be changed
    }

    handleEmitChange(text) {
        // Emit should not be changed
    }

    handleModelChange(editor,name,model) {
        const state = this.state;
        const oldmodel = state.model;
        var newmodel = [];
        for (const m of oldmodel) {
            if (m.name === name) {
                newmodel.push({name : name, content: model });
            } else {
                newmodel.push({name : m.name, content: m.content });
            }
        }
        state.model = newmodel;
        this.setState(compileLogic(editor,state.logic,state));
    }

    handleJSONChange(data) {
        const state = this.state;
        if (data !== null) {
            this.setState(generateText(state, data));
        }
    }

    handleLogicChange(editor,name,logic) {
        const state = this.state;
        const oldlogic = state.logic;
        var newlogic = [];
        for (const m of oldlogic) {
            if (m.name === name) {
                newlogic.push({name : name, content: logic });
            } else {
                newlogic.push({name : m.name, content: m.content });
            }
        }
        this.setState(compileLogic(editor,newlogic,state));
    }

    handleRunLogic() {
        // XXX Should check whether the NL parses & the logic compiles & the state/request are valid JSON first
        const state = this.state;
        try {
            const compiledLogic = state.clogic.compiledLinked;
            const contract = JSON.parse(state.data);
            const request = JSON.parse(state.request);
            const cstate = JSON.parse(state.cstate);
            const response = runLogic(compiledLogic,contract,request,cstate);
            if (response.hasOwnProperty('left')) {
                state.log.logic = 'Execution successful!';
                state.response = JSON.stringify(response.left.response,null,2);
                state.cstate = JSON.stringify(response.left.state,null,2);
                state.emit = JSON.stringify(response.left.emit,null,2);
            } else {
                state.response = 'null';
                state.emit = '[]';
                state.log.logic = '[Ergo Error]' + JSON.stringify(response.right);
            }
        } catch (error){
            state.response = 'null';
            state.emit = '[]';
            state.log.logic = '[Cannot Run Template] ' + JSON.stringify(error.message);
        }
        this.setState(state);
    }

    handleInitLogic() {
        // XXX Should check whether the NL parses & the logic compiles & the state/request are valid JSON first
        const state = this.state;
        try {
            console.log('Initializing contract');
            const compiledLogic = state.clogic.compiledLinked;
            const contract = JSON.parse(state.data);
            const response = runInit(compiledLogic,contract);
            if (response.hasOwnProperty('left')) {
                state.log.logic = 'Execution successful!';
                state.response = JSON.stringify(response.left.response,null,2);
                state.cstate = JSON.stringify(response.left.state,null,2);
                state.emit = JSON.stringify(response.left.emit,null,2);
            } else {
                state.response = 'null';
                state.emit = '[]';
                state.log.logic = '[Ergo Error]' + JSON.stringify(response.right);
            }
        } catch (error){
            state.response = 'null';
            state.emit = '[]';
            state.log.logic = '[Cannot Run Template] ' + JSON.stringify(error.message);
        }
        this.setState(state);
    }

    handleSelectTemplate(event, data) {
        this.loadTemplate(data.value);
    }

    loadTemplate(templateName) {
        let state = this.state;
        Template.fromUrl(ROOT_URI+'/static/archives/'+templateName+'.cta').then((template) => { 
            console.log('Loaded template: ' + template.getIdentifier());
            state.clause = new Clause(template);
            state.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
            state.grammar = template.getTemplatizedGrammar();
            state.model = template.getModels();
            state.logic = template.getLogic();
            state.text = template.getMetadata().getSamples().default;
            state.request = template.getMetadata().getRequest();
            state.log.text = 'Not yet parsed.';
            state.data = 'null';
            state = compileLogic(null,state.logic, state);
            this.setState(state);
            this.handleSampleChange(state.text);
            this.handleLogicChange(null,state,state.logic);
            this.handlePackageChange(state.package);
            this.handleInitLogic(); // Initializes the contract state
        });
    }

    componentDidMount() {
        this.loadTemplate('helloworld@0.6.0');
    }
    handleItemClick(e, { name }) {
        const state = this.state;
        state.activeItem = name;
        this.setState(state);
    }
    render() {
        const { text, grammar, model, logic, clogic, log, data, request, cstate, response, emit } = this.state;
        const legalTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='template'
                  active={this.state.activeLegal === 'template'}
                  onClick={this.handleLegalTabChange}>Template</Menu.Item>
                <Menu.Item
                  name='sample'
                  active={this.state.activeLegal === 'sample'}
                  onClick={this.handleLegalTabChange}
                >Test Contract</Menu.Item>
                <Menu.Item
                  name='status'
                  active={this.state.activeLegal === 'status'}
                  onClick={this.handleLegalTabChange}
                  position='right'
                >Errors &nbsp;<StatusIcon log={this.state.log}/></Menu.Item>
              </Menu>
              { this.state.activeLegal === 'template' ?
                <Tab.Pane attached='bottom'>
                  <InputGrammar
                    grammar={grammar}
                    handleTextChange={this.handleGrammarChange}/>
                </Tab.Pane> :
                this.state.activeLegal === 'sample' ?
                <ParseForm text={text} grammar={grammar} log={log.text} data={data}
                           handleSampleChange={this.handleSampleChange}
                           handleJSONChange={this.handleJSONChange}/> : <Status log={log}/> }
            </div>
        );
        const logicTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='ergo'
                  active={this.state.activeLogic === 'ergo'}
                  onClick={this.handleLogicTabChange}>Ergo</Menu.Item>
                <Menu.Item
                  name='execution'
                  active={this.state.activeLogic === 'execution'}
                  onClick={this.handleLogicTabChange}
                >Test Request</Menu.Item>
                <Menu.Item
                  name='status'
                  active={this.state.activeLogic === 'status'}
                  onClick={this.handleLogicTabChange}
                  position='right'
                >Errors &nbsp;<StatusIcon log={this.state.log}/></Menu.Item>
              </Menu>
              { this.state.activeLogic === 'ergo' ?
                <Tab.Pane attached='bottom'>
                  <LogicForm logic={logic}
                             handleLogicChange={this.handleLogicChange}/>
                </Tab.Pane> :
                this.state.activeLogic === 'execution' ?
                <ExecuteForm request={request} cstate={cstate} response={response} emit={emit}
                             handleRequestChange={this.handleRequestChange}
                             handleStateChange={this.handleStateChange}
                             handleResponseChange={this.handleResponseChange}
                             handleEmitChange={this.handleEmitChange}
                             handleRunLogic={this.handleRunLogic}
                             handleInitLogic={this.handleInitLogic}/> : <Status log={log}/> }
            </div>
        );
        const modelTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='model'
                  active={this.state.activeModel === 'model'}
                  onClick={this.handleModelTabChange}
                >Data Model</Menu.Item>
                <Menu.Item
                  name='status'
                  active={this.state.activeModel === 'status'}
                  onClick={this.handleModelTabChange}
                  position='right'
                >Errors &nbsp;<StatusIcon log={this.state.log}/></Menu.Item>
              </Menu>
              { this.state.activeModel === 'model' ?
                <Tab.Pane>
                  <ModelForm model={model} handleModelChange={this.handleModelChange}/>
                </Tab.Pane> : <Status log={log}/> }
            </div>
        );
        const metaTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='readme'
                  active={this.state.activeMeta === 'readme'}
                  onClick={this.handleMetaTabChange}
                >README</Menu.Item>
                <Menu.Item
                  name='package'
                  active={this.state.activeMeta === 'package'}
                  onClick={this.handleMetaTabChange}>package.json</Menu.Item>
                <Menu.Item
                  name='status'
                  active={this.state.activeMeta === 'status'}
                  onClick={this.handleMetaTabChange}
                  position='right'
                >Errors &nbsp;<StatusIcon log={this.state.log}/></Menu.Item>
              </Menu>
              { this.state.activeMeta === 'readme' ?
                <Tab.Pane attached='bottom'>
                  <InputGrammar
                    grammar={this.state.clause ? this.state.clause.getTemplate().getMetadata().getREADME() : 'null'}
                    handleTextChange={this.handleREADMEChange}/>
                </Tab.Pane> : this.state.activeMeta === 'package' ?
                <Tab.Pane attached='bottom'>
                  <InputJson
                    json={this.state.package}
                    handleJSONChange={this.handlePackageChange}/>
                </Tab.Pane> :
                <Status log={log}/> }
            </div>
        );
        const ModalAbout = () => (
            <Modal trigger={<Menu.Item>About</Menu.Item>}>
              <Modal.Header>Accord Project &middot; Template Studio (Experimental)</Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <Header>Welcome!</Header>
                  <p>This template studio lets you edit and execute legal contract templates built with the <a href='https://accordproject.org/' target='_blank'>Accord Project</a>.</p>
                  <p>It is open-source and under active development. Contributions and bug reports are welcome on <a href='https://github.com/accordproject/template-studio' target='_blank'>GitHub</a>.</p>
                </Modal.Description>
                <Divider/>
                <Modal.Description>
                  <Header>Getting started</Header>
                  <p>Search a template from the <a href='https://templates.accordproject.org' target='_blank'>Accord Project template library</a> (Search box at the top)</p>
                  <p>Chose whether to edit the Natural Language or the Contract Logic (Tab on the left)</p>
                  <p>Edit the contract template and try it on a sample contract</p>
                  <p>Edit the Ergo contract logic and try it by executing a simple request</p>
                </Modal.Description>
                <Divider/>
                <Modal.Description>
                  <Header>Version Information</Header>
                  <p>Cicero {ciceroVersion}</p>
                  <p>Ergo {ergoVersion}</p>
                </Modal.Description>
              </Modal.Content>
            </Modal>
        );
        const topMenu = () =>
              (<Menu fixed='top' inverted>
                 <Container>
                   <Menu.Item header>
                     <Image size='mini' href='https://www.accordproject.org' src='static/img/accordlogo.png' style={{ marginRight: '1.5em' }} target='_blank'/>
                     Accord Project &middot; Template Studio
                   </Menu.Item>
                   <Menu.Item>
                     <Dropdown icon='search'
                               placeholder='Search'
                               search
                               selection
                               options={templates}
                               onChange={this.handleSelectTemplate}/>
                     <Label color='grey' pointing='left'>Load template<br/>from library</Label>
                   </Menu.Item>
                   <Menu.Item position='right'>
                     <Dropdown item text='Help' simple position='right' direction='left'>
                       <Dropdown.Menu>
                         <ModalAbout/>
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
               </Menu>);
        const bottomMenu = () =>
              (<Menu fixed='bottom' color='grey' inverted>
                 <Container>
                   <Menu.Item header>
                     <Image size='mini' href='https://www.accordproject.org' src='static/img/accordlogo.png' style={{ marginRight: '1.5em' }} target='_blank'/>
                     Accord Project &middot; Template Studio
                   </Menu.Item>
                   <Menu.Item>
                     <Dropdown icon='search'
                               placeholder='Search'
                               search
                               selection
                               options={templates}
                               onChange={this.handleSelectTemplate}/>
                     <Label color='grey' pointing='left'>Load template<br/>from library</Label>
                   </Menu.Item>
                   <Menu.Item position='right'>
                     <Dropdown item text='Help' simple position='right' direction='left'>
                       <Dropdown.Menu>
                         <ModalAbout/>
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
               </Menu>);
        const viewMenu = () =>
              (<Menu floated='right' compact secondary vertical pointing>
                 <Menu.Item name='legal' active={this.state.activeItem === 'legal'} onClick={this.handleItemClick}>
                   Natural Language
                 </Menu.Item>
                 <Menu.Item name='model' active={this.state.activeItem === 'model'} onClick={this.handleItemClick}>
                   Data Model
                 </Menu.Item>
                 <Menu.Item name='tech' active={this.state.activeItem === 'tech'} onClick={this.handleItemClick}>
                   Contract Logic
                 </Menu.Item>
                 <Menu.Item name='metadata' active={this.state.activeItem === 'metadata'} onClick={this.handleItemClick}>
                   Metadata
                 </Menu.Item>
               </Menu>);
        const templateForm = () =>
              (  <Card>
                   <Card.Content>
                     <Card.Header>Current Template</Card.Header>
                     <StatusLabel log={this.state.log}/>
                   </Card.Content>
                   <Card.Content>
                     <Input label={{ basic: true, content: 'Name' }} fluid placeholder='Name'
                            onChange={this.handleNameChange}
                            value={
                                this.state.clause ? this.state.clause.getTemplate().getMetadata().getPackageJson().name : ''
                            }></Input>
                     <br/>
                     <Input label={{ basic: true, content: 'Version' }} fluid placeholder='Version'
                            onChange={this.handleVersionChange}
                            value={
                                this.state.clause ? this.state.clause.getTemplate().getMetadata().getPackageJson().version : ''
                            }></Input>
                     <br/>
                     <DownloadLabel clause={this.state.clause}/>
                   </Card.Content>
                 </Card>
              );
        return (
            <div>
              {topMenu()}
              <Container style={{ marginTop: '7em' }}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={4}>
                      <Grid>
                        <Grid.Row>
                          <Grid.Column>
                            {viewMenu()}
                          </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                          <Grid.Column>
                            {templateForm()}
                          </Grid.Column>
                        </Grid.Row>
                      </Grid>
                    </Grid.Column>
                    <Grid.Column width={12}>
                      { this.state.activeItem === 'legal' ? legalTabs()
                        : this.state.activeItem === 'tech' ? logicTabs()
                        : this.state.activeItem === 'model' ? modelTabs()
                        : metaTabs() }
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              {bottomMenu()}
              </Container>
            </div>
        );
    }
}
export default FormContainer;

const wrapper = document.getElementById('create-article-form');
wrapper ? ReactDOM.render(<FormContainer />, wrapper) : false;
