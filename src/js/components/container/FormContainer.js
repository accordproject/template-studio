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
import ModelForm from '../tabs/ModelForm';
import LogicForm from '../tabs/LogicForm';
import CompileForm from '../tabs/CompileForm';
import ParseForm from '../tabs/ParseForm';
import ExecuteForm from '../tabs/ExecuteForm';
import { Status, StatusIcon } from '../status/Status';
import Options from '../status/Options';
import { UploadButton, DownloadButton, NewButton } from '../status/TemplateTab';
import { Template, Clause } from '@accordproject/cicero-core';
import { Button, Form, Container, Divider, Segment, Tab, Header, Image, Grid, Dropdown, Menu, Icon, Rail } from 'semantic-ui-react';
import Ergo from '@accordproject/ergo-compiler/lib/ergo.js';
import moment from 'moment';

import * as templateLibrary from '@accordproject/cicero-template-library/build/template-library.json';

function getTemplates() {
    var templates = [];
    for(var t in templateLibrary.default) {
        if (templateLibrary.default[t].ciceroVersion === '^0.8.0')
            templates.push({'key':t, 'value':t, 'text':t});
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
        state.log.text = "[Parse Contract] " + error.message;
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
        state.log.text = "[Instantiate Contract] " + error.log;
    }
    return state;
}

function compileLogic(logic,state) {
    const model = state.model;
    const compiledLogic = Ergo.compileToJavaScript(logic,model,'cicero',false);
    if (compiledLogic.hasOwnProperty('error')) {
        state.log.logic = compiledLogic.error.verbose;
        state.logic = logic;
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
            text: `[Please Select a Sample Template]`,
            data: 'null',
            log: { text: 'Not yet parsed.', logic: 'Not yet compiled.' },
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
            activeItem: 'legal',
            activeLegal: 1,
            activeLogic: 1,
            clogic: { compiled: '', compiledLinked: '' }
        };
        this.handleSampleChange = this.handleSampleChange.bind(this);
        this.handleGrammarChange = this.handleGrammarChange.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.handleJSONChange = this.handleJSONChange.bind(this);
        this.handleLogicChange = this.handleLogicChange.bind(this);
        this.handleRunLogic = this.handleRunLogic.bind(this);
        this.handleRunInit = this.handleRunInit.bind(this);
        this.handleCompileChange = this.handleCompileChange.bind(this);
        this.handleSelectTemplate = this.handleSelectTemplate.bind(this);
        this.loadTemplate = this.loadTemplate.bind(this);
        this.handleItemClick = this.handleItemClick.bind(this);
        this.handleRequestChange = this.handleRequestChange.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.handleResponseChange = this.handleResponseChange.bind(this);
        this.handleEmitChange = this.handleEmitChange.bind(this);
        this.handleLegalTabChange = this.handleLegalTabChange.bind(this);
        this.handleLogicTabChange = this.handleLogicTabChange.bind(this); 
   }

    handleSampleChange(text) {
        const state = this.state;
        this.setState(parse(this.state, text));
    }


    handleLegalTabChange(e, { activeIndex }) {
        const state = this.state;
        state.activeLegal = activeIndex;
        this.setState(state);
    }
    handleLogicTabChange(e, { activeIndex }) {
        const state = this.state;
        state.activeLogic = activeIndex;
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
                state.log.text = "[Change Template] " + error.log;
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

    handleModelChange(text) {
        // TBD
    }

    handleJSONChange(data) {
        const state = this.state;
        if (data !== null) {
            this.setState(generateText(state, data));
        }
    }

    handleLogicChange(name,logic) {
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
        this.setState(compileLogic(newlogic,state));
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
                state.log.logic = "Execution successful!";
                state.response = JSON.stringify(response.left.response,null,2);
                state.cstate = JSON.stringify(response.left.state,null,2);
                state.emit = JSON.stringify(response.left.emit,null,2);
            } else {
                state.response = 'null';
                state.emit = '[]';
                state.log.logic = "[Ergo Error]" + JSON.stringify(response.right);
            }
        } catch (error){
            state.response = 'null';
            state.emit = '[]';
            state.log.logic = "[Cannot Run Template] " + JSON.stringify(error.message);
        }
        this.setState(state);
    }

    handleRunInit() {
        // XXX Should check whether the NL parses & the logic compiles & the state/request are valid JSON first
        const state = this.state;
        try {
            console.log('Initializing contract');
            const compiledLogic = state.clogic.compiledLinked;
            const contract = JSON.parse(state.data);
            const response = runInit(compiledLogic,contract);
            if (response.hasOwnProperty('left')) {
                state.log.logic = "Execution successful!";
                state.response = JSON.stringify(response.left.response,null,2);
                state.cstate = JSON.stringify(response.left.state,null,2);
                state.emit = JSON.stringify(response.left.emit,null,2);
            } else {
                state.response = 'null';
                state.emit = '[]';
                state.log.logic = "[Ergo Error]" + JSON.stringify(response.right);
            }
        } catch (error){
            state.response = 'null';
            state.emit = '[]';
            state.log.logic = "[Cannot Run Template] " + JSON.stringify(error.message);
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
            state.grammar = template.getTemplatizedGrammar();
            state.model = template.getModels();
            state.logic = template.getLogic();
            state.text = template.getMetadata().getSamples().default;
            state.request = template.getMetadata().getRequest();
            state.log.text = 'Not yet parsed.';
            state.data = 'null';
            state = compileLogic(state.logic, state);
            this.setState(state);
            this.handleSampleChange(state.text);
            this.handleLogicChange(state,state.logic);
            this.handleRunInit(); // Initializes the contract state
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
        const naturalLanguagePanes = [
            { menuItem: 'Template',
              render: () =>
              <Tab.Pane>
                  <InputGrammar
                    grammar={grammar}
                    handleTextChange={this.handleGrammarChange}/>
              </Tab.Pane> },
            { menuItem: 'Contract Sample', render: () =>
                <ParseForm text={text} grammar={grammar} log={log.text} data={data}
                           handleSampleChange={this.handleSampleChange}
                           handleJSONChange={this.handleJSONChange}/> },
            { menuItem: 'Model', render: () =>
              <Tab.Pane>
                <ModelForm model={model} handleModelChange={this.handleModelChange}/>
              </Tab.Pane> },
        ];
        const logicPanes = [
            { menuItem: 'Ergo', render: () =>
              <Tab.Pane>
                <LogicForm logic={logic}
                           handleLogicChange={this.handleLogicChange}/>
              </Tab.Pane> },
            { menuItem: 'Execution', render: () =>
              <ExecuteForm request={request} cstate={cstate} response={response} emit={emit}
                           handleRequestChange={this.handleRequestChange}
                           handleStateChange={this.handleStateChange}
                           handleResponseChange={this.handleResponseChange}
                           handleEmitChange={this.handleEmitChange}
                           handleRunLogic={this.handleRunLogic}/> },
            { menuItem: 'Model', render: () =>
              <Tab.Pane>
                <ModelForm model={model} handleModelChange={this.handleModelChange}/>
              </Tab.Pane> },
            { menuItem: 'Compiled Code',
              render: () =>
              <CompileForm compiledLogic={clogic.compiled}
                           handleCompileChange={this.handleCompileChange}/> },
            ];
        const toppanes1 = <Tab panes={naturalLanguagePanes} activeIndex={this.state.activeLegal} onTabChange={this.handleLegalTabChange} />;
        const toppanes2 = <Tab panes={logicPanes} activeIndex={this.state.activeLogic} onTabChange={this.handleLogicTabChange} />;
        const bottompanes = () => [
            { menuItem: 'Template Status', render: () => <Status log={log}/> },
/*          { menuItem: 'Options', render: () =>
              <Options
                lineNumbers={this.state.options.lineNumbers}/>
            }, */
        ];
        const templateMenu = () =>
              (<Menu text compact>
                 <Dropdown icon='search'
                           placeholder='Select a template'
                           search
                           selection
                           options={templates}
                           onChange={this.handleSelectTemplate}/>
                 <Dropdown item icon='wrench'>
                   <Dropdown.Menu>
                     <NewButton clause={this.state.clause}/>
                     <UploadButton clause={this.state.clause}/>
                     <DownloadButton clause={this.state.clause}/>
                   </Dropdown.Menu>
                 </Dropdown>
               </Menu>);
        const viewMenu = () =>
              (<Menu compact secondary vertical pointing>
                 <Menu.Item name='legal' active={this.state.activeItem === 'legal'} onClick={this.handleItemClick}>
                   Natural Language <StatusIcon log={this.state.log.text}/>
                 </Menu.Item>
                 <Menu.Item name='tech' active={this.state.activeItem === 'tech'} onClick={this.handleItemClick}>
                   Contract Logic <StatusIcon log={this.state.log.logic}/>
                 </Menu.Item>
               </Menu>);
        return (
            <Container>
              <Grid>

                <Grid.Row>
                  <Grid.Column width={16}>
                    <Divider hidden/>
                    <Header as='h2'>Accord Project &middot; Template Studio
                      <Image href='https://github.com/accordproject/ergo' title='Running Ergo' src='static/img/ergologo.png' size='small' floated='right' />
                      <Image href='https://ergo.accordproject.org/' title='Powered by Accord Project' src='static/img/accordlogo.png' size='small' floated='right' />
                    </Header>
                    <Divider fitted/>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column width={16}>
                    {templateMenu()}
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column width={3}>
                    {viewMenu()}
                  </Grid.Column>
                  <Grid.Column width={13}>
                    { this.state.activeItem === 'legal' ? toppanes1 : toppanes2 }
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column width={16}>
                    <Tab menu={{ secondary: true, pointing: true }} panes={bottompanes()}/>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Container>
        );
    }
}
export default FormContainer;

const wrapper = document.getElementById('create-article-form');
wrapper ? ReactDOM.render(<FormContainer />, wrapper) : false;
