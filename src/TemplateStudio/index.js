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

/* Default values */

const DEFAULT_TEMPLATE = `${ROOT_URI}/static/archives/helloworld@0.7.1.cta`;

/* Utilities */

import * as Utils from './Utils';

/* Cicero */

import { TemplateLibrary, Template, Clause } from '@accordproject/cicero-core';

import * as ciceroPackageJson from '@accordproject/cicero-core/package.json';

const ciceroVersion = ciceroPackageJson.version;

/* React */

import React, { Component } from 'react';

/* Studio components */

import BottomMenu from './BottomMenu';
import DimmableContainer from './DimmableContainer';
import TopMenu from './TopMenu';

const defaultlog =
      { text: 'success',
        model: 'success',
        logic: 'success',
        meta: 'success',
        execute: 'success',
        loading: 'success' };

class TemplateStudio extends Component {
  constructor() {
    super();
    this.state = {
      templates: [],
      templateURL: '',
      newTemplateUpload: '',
      loadingFailed: false,
      templateName: '',
      templateVersion: '',
      clause: null,
      package: 'null',
      readme: '',
      text: '[Please Select a Sample Template]',
      data: 'null',
      log: defaultlog,
      grammar: '[Please Select a Sample Template]',
      model: '[Please Select a Sample Template]',
      logic: '[Please Select a Sample Template]',
      request: 'null',
      cstate: 'null',
      response: JSON.stringify(null, null, 2),
      emit: '[]',
      clogic: { compiled: '', compiledLinked: '' },
      status: 'empty',
      loading: false,
      markers: [], // For code mirror marking
      markersSource: [], // For code mirror marking
    };
    this.handleLoadingFailed = this.handleLoadingFailed.bind(this);
    this.handleLoadingFailedConfirm = this.handleLoadingFailedConfirm.bind(this);
    this.handlePackageChange = this.handlePackageChange.bind(this);
    this.handleREADMEChange = this.handleREADMEChange.bind(this);
    this.handleSampleChange = this.handleSampleChange.bind(this);
    this.handleGrammarChange = this.handleGrammarChange.bind(this);
    this.handleModelChange = this.handleModelChange.bind(this);
    this.handleJSONChange = this.handleJSONChange.bind(this);
    this.handleLogicChange = this.handleLogicChange.bind(this);
    this.handleErgoMounted = this.handleErgoMounted.bind(this);
    this.handleRunLogic = this.handleRunLogic.bind(this);
    this.handleInitLogic = this.handleInitLogic.bind(this);
    this.loadTemplateLibrary = this.loadTemplateLibrary.bind(this);
    this.loadTemplateFromUrl = this.loadTemplateFromUrl.bind(this);
    this.loadTemplateFromBuffer = this.loadTemplateFromBuffer.bind(this);
    this.handleRequestChange = this.handleRequestChange.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  componentDidMount() {
    this.loadTemplateLibrary().then(() => {
      if (!this.loadTemplateFromUrl(Utils.initUrl(DEFAULT_TEMPLATE))) {
        this.loadTemplateFromUrl(DEFAULT_TEMPLATE);
      }
    });
  }

  componentDidUpdate() {
    if (this.state.status === 'changed') {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = undefined;
    }
  }

  handleLoadingFailed(message) {
    const state = this.state;
    state.loading = false;
    state.loadingFailed = true;
    state.log.loading = message;
    this.setState(state);
  }

  handleLoadingFailedConfirm() {
    const state = this.state;
    state.log.loading = 'Unknown Error';
    state.loadingFailed = false;
    this.setState(state);
  }

  handleStatusChange(status) {
    const state = this.state;
    state.status = status;
    this.setState(state);
  }

  handlePackageChange(text) {
    const state = this.state;
    try {
      const packageJson = JSON.parse(text);
      state.clause.getTemplate().setPackageJson(packageJson);
      state.package = JSON.stringify(packageJson, null, 2);
      state.templateName = packageJson.name;
      state.templateVersion = packageJson.version;
      state.templateType = packageJson.cicero.template;
      state.log.meta = 'package.json change successful!';
      this.setState(state);
      // Make sure to try re-parsing
      this.setState(Utils.parseSample(state.clause, state.text, state.log));
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      state.package = text;
      state.log.meta = `[Change Template package.json] ${error}`;
      this.setState(state);
    }
  }

  handleNameChange(e, input) {
    const state = this.state;
    state.templateName = input.value;
    try {
      const packageJson = JSON.parse(state.package);
      packageJson.name = input.value;
      state.clause.getTemplate().setPackageJson(packageJson);
      state.package = JSON.stringify(packageJson, null, 2);
      state.log.meta = 'Template Name change successful!';
      state.status = 'changed';
      this.setState(state);
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      state.log.meta = `[Change Template Name] ${error}`;
      this.setState(state);
    }
  }

  handleVersionChange(e, input) {
    const state = this.state;
    state.templateVersion = input.value;
    try {
      const packageJson = JSON.parse(state.package);
      packageJson.version = input.value;
      state.clause.getTemplate().setPackageJson(packageJson);
      state.package = JSON.stringify(packageJson, null, 2);
      state.log.meta = 'Template version change successful!';
      state.status = 'changed';
      this.setState(state);
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      state.log.meta = `[Change Template Version] ${error}`;
      this.setState(state);
    }
  }

  handleTypeChange(e, input) {
    const state = this.state;
    state.templateType = input.value;
    try {
      const packageJson = JSON.parse(state.package);
      packageJson.cicero.template = input.value;
      state.clause.getTemplate().setPackageJson(packageJson);
      state.package = JSON.stringify(packageJson, null, 2);
      state.log.meta = 'Template kind change successful!';
      state.status = 'changed';
      this.setState(state);
      // Make sure to try re-parsing
      this.setState(Utils.parseSample(state.clause, state.text, state.log));
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      state.log.meta = `[Change Template Type] ${error}`;
      this.setState(state);
    }
  }

  handleREADMEChange(text) {
    const state = this.state;
    try {
      const readme = text;
      const template = state.clause.getTemplate();
      if (template.getMetadata().getREADME() !== text) {
        state.status = 'changed';
        template.setReadme(readme);
      }
      state.readme = readme;
      state.log.meta = 'README change successful!';
      this.setState(state);
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      state.readme = text;
      state.log.meta = `[Change Template README] ${error}`;
      this.setState(state);
    }
  }

  handleSampleChange(text) {
    const state = this.state;
    const { clause, log } = state;
    if (Utils.updateSample(clause, text)) {
      state.status = 'changed';
      this.setState(state);
    }
    this.setState(Utils.parseSample(clause, text, log));
  }

  handleGrammarChange(text) {
    const state = this.state;
    const clause = state.clause;
    if (text !== state.grammar) {
      state.grammar = text;
      try {
        state.status = 'changed';
        state.data = JSON.stringify(clause.getData(), null, 2);
        state.log.text = 'Grammar change successful!';
        if (state.data !== 'null') {
          clause.getTemplate().buildGrammar(text);
          const changes = Utils.generateText(clause, state.data, state.log);
          if (changes.log.text.indexOf('successful') === -1) {
            throw new Error('Error generating text from this new grammar');
          }
          this.setState(changes);
        }
      } catch (error1) {
        try {
          console.log(`Error building grammar ${error1.message}`);
          state.status = 'changed';
          const template = clause.getTemplate();
          template.buildGrammar(text);
          state.log.text = `[Change Template] ${error1.message}`;
          this.setState(Utils.parseSample(clause, state.text, state.log));
        } catch (error2) {
          state.log.text = `[Change Template] ${error2.message}`;
          this.setState(state);
        }
      }
    }
  }

  handleRequestChange(text) {
    const state = this.state;
    if (Utils.updateRequest(state.clause, state.request, text)) {
      state.status = 'changed';
    }
    state.request = text;
    return this.setState(state);
  }

  handleStateChange(text) {
    const state = this.state;
    state.cstate = text;
    return this.setState(state);
  }

  handleModelChange(editor, name, model) {
    const state = this.state;
    const clause = state.clause;
    const oldmodel = state.model;
    const newmodel = [];
    let modelfails = false;
    for (const m of oldmodel) {
      if (m.name === name) {
        try {
          if (Utils.updateModel(clause, name, m.content, model, state.grammar)) {
            state.status = 'changed';
            state.log.model = 'Load model successful';
          }
        } catch (error) {
          modelfails = true;
          console.log(`ERROR! ${error.message}`);
          state.log.model = `Cannot load model: ${error.message}`;
        }
        newmodel.push({ name, content: model });
      } else {
        newmodel.push({ name: m.name, content: m.content });
      }
    }
    state.model = newmodel;
    this.setState(state);
    if (!modelfails) {
      state.log.model = 'Model loaded successfully';
      try {
        this.setState(Utils.parseSample(clause, state.text, state.log));
        try {
          this.setState(
            Utils.compileLogic(null, state.logic, state.model, state.markers, state.log),
          );
        } catch (error) {
          this.setState(state);
        }
      } catch (error) {
        this.setState(state);
      }
    } else {
      this.setState(state);
    }
  }

  handleJSONChange(data) {
    const state = this.state;
    const clause = state.clause;
    const log = state.log;
    if (data !== null) {
      this.setState(Utils.generateText(clause, data, log));
    }
  }

  handleLogicChange(editor, name, logic) {
    const state = this.state;
    const clause = state.clause;
    const oldlogic = state.logic;
    const newlogic = [];
    for (const m of oldlogic) {
      if (m.name === name) {
        try {
          if (Utils.updateLogic(clause, name, logic)) {
            state.status = 'changed';
          }
        } catch (error) {
          state.log.logic = `Cannot compile new logic ${error.message}`;
        }
        newlogic.push({ name, content: logic });
      } else {
        newlogic.push({ name: m.name, content: m.content });
      }
    }
    this.setState(Utils.parseSample(clause, state.text, state.log));
    this.setState(Utils.compileLogic(editor, newlogic, state.model, state.markers, state.log));
  }

  handleErgoMounted(editor) {
    const state = this.state;
    // Refresh markers
    state.markers = [];
    state.markersSource.forEach(marker =>
      state.markers.push(editor.markText(marker.start, marker.end, marker.kind)),
    );
  }

  handleRunLogic() {
    // XXX Should check whether the NL parses & the logic
    // compiles & the state/request are valid JSON first
    const state = this.state;
    try {
      const compiledLogic = state.clogic.compiledLinked;
      const contract = JSON.parse(state.data);
      const request = JSON.parse(state.request);
      const cstate = JSON.parse(state.cstate);
      const response = Utils.runLogic(compiledLogic, contract, request, cstate);
      if (response.hasOwnProperty('left')) {
        state.log.execute = 'Execution successful!';
        state.response = JSON.stringify(response.left.response, null, 2);
        state.cstate = JSON.stringify(response.left.state, null, 2);
        state.emit = JSON.stringify(response.left.emit, null, 2);
      } else {
        state.response = 'null';
        state.cstate = 'null';
        state.emit = '[]';
        state.log.execute = `[Ergo Error] ${JSON.stringify(response.right)}`;
      }
    } catch (error) {
      state.response = 'null';
      state.cstate = 'null';
      state.emit = '[]';
      state.log.execute = `[Error Executing Template] ${JSON.stringify(error.message)}`;
    }
    this.setState(state);
  }

  handleInitLogic() {
    // XXX Should check whether the NL parses & the logic
    // compiles & the state/request are valid JSON first
    const state = this.state;
    try {
      console.log('Initializing contract');
      const compiledLogic = state.clogic.compiledLinked;
      const contract = JSON.parse(state.data);
      const response = Utils.runInit(compiledLogic, contract);
      if (response.hasOwnProperty('left')) {
        state.log.execute = 'Execution successful!';
        state.response = JSON.stringify(response.left.response, null, 2);
        state.cstate = JSON.stringify(response.left.state, null, 2);
        state.emit = JSON.stringify(response.left.emit, null, 2);
      } else {
        state.response = 'null';
        state.cstate = 'null';
        state.emit = '[]';
        state.log.execute = `[Ergo Error] ${JSON.stringify(response.right)}`;
      }
    } catch (error) {
      state.response = 'null';
      state.cstate = 'null';
      state.emit = '[]';
      state.log.execute = `[Error Executing Template] ${JSON.stringify(error.message)}`;
    }
    this.setState(state);
  }

  loadTemplateLibrary() {
    const templateLibrary = new TemplateLibrary();
    const promisedIndex =
              templateLibrary.getTemplateIndex({ latestVersion: true, ciceroVersion });
    return promisedIndex.then((templateIndex) => {
      const templates = [];
      for (const t in templateIndex) {
        if (Object.prototype.hasOwnProperty.call(templateIndex, t)) {
          templates.push({ key: t, value: `ap://${t}#hash`, text: t });
        }
      }
      this.setState({ templates });
    });
  }

  loadTemplateFromUrl(templateURL) {
    let state = this.state;
    state.loading = true;
    this.setState(state);
    console.log(`Loading template:  ${templateURL}`);
    let promisedTemplate;
    try {
      promisedTemplate = Template.fromUrl(templateURL);
    } catch (error) {
      console.log(`LOAD FAILED! ${error.message}`); // Error!
      this.handleLoadingFailed(error.message);
      return false;
    }
    return promisedTemplate.then((template) => {
      state.templateURL = templateURL;
      state.clause = new Clause(template);
      state.templateName = state.clause.getTemplate().getMetadata().getName();
      state.templateVersion = state.clause.getTemplate().getMetadata().getVersion();
      state.templateType = state.clause.getTemplate().getMetadata().getTemplateType();
      state.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
      state.grammar = template.getTemplatizedGrammar();
      state.model = template.getModelManager().getModels();
      state.logic = template.getScriptManager().getLogic();
      state.text = template.getMetadata().getSamples().default;
      state.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
      state.data = 'null';
      state.status = 'loaded';
      this.setState(state);
      this.setState(
        Utils.compileLogic(null, state.logic, state.model, state.markers, state.log),
      ); // Now returns changes, not setting the rest of the state
      this.handleModelChange(null, state, state.model);
      this.handleSampleChange(state.text);
      this.handleLogicChange(null, state, state.logic);
      this.handlePackageChange(state.package);
      this.handleInitLogic(); // Initializes the contract state
      state = this.state;
      state.loading = false;
      this.setState(state);
      return true;
    }, (reason) => {
      console.log(`LOAD FAILED! ${reason.message}`); // Error!
      this.handleLoadingFailed(reason.message);
      return false;
    });
  }

  loadTemplateFromBuffer(buffer) {
    let state = this.state;
    state.loading = true;
    this.setState(state);
    console.log('Loading template from Buffer');
    let promisedTemplate;
    try {
      promisedTemplate = Template.fromArchive(buffer);
    } catch (error) {
      console.log(`LOAD FAILED! ${error.message}`); // Error!
      this.handleLoadingFailed(error.message);
      return false;
    }
    return promisedTemplate.then((template) => {
      state.clause = new Clause(template);
      state.templateName = state.clause.getTemplate().getMetadata().getName();
      state.templateVersion = state.clause.getTemplate().getMetadata().getVersion();
      state.templateType = state.clause.getTemplate().getMetadata().getTemplateType();
      state.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
      state.grammar = template.getTemplatizedGrammar();
      state.model = template.getModelManager().getModels();
      state.logic = template.getScriptManager().getLogic();
      state.text = template.getMetadata().getSamples().default;
      state.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
      state.data = 'null';
      state.status = 'loaded';
      this.setState(state);
      this.setState(Utils.compileLogic(null, state.logic, state.model, state.markers, state.log));
      this.handleModelChange(null, state, state.model);
      this.handleSampleChange(state.text);
      this.handleLogicChange(null, state, state.logic);
      this.handlePackageChange(state.package);
      this.handleInitLogic(); // Initializes the contract state
      state = this.state;
      state.loading = false;
      this.setState(state);
      return true;
    }, (reason) => {
      console.log(`LOAD FAILED! ${reason.message}`); // Error!
      this.handleLoadingFailed(reason.message);
      return false;
    });
  }

  render() {
    return (
      <div>
        <TopMenu
          loadTemplateFromBuffer={this.loadTemplateFromBuffer}
          loadTemplateFromUrl={this.loadTemplateFromUrl}
          status={this.state.status}
          templates={this.state.templates}
        />
        <DimmableContainer
          clause={this.state.clause}
          cstate={this.state.cstate}
          data={this.state.data}
          emit={this.state.emit}
          grammar={this.state.grammar}
          handleErgoMounted={this.handleErgoMounted}
          handleGrammarChange={this.handleGrammarChange}
          handleInitLogic={this.handleInitLogic}
          handleJSONChange={this.handleJSONChange}
          handleLoadingFailedConfirm={this.handleLoadingFailedConfirm}
          handleLogicChange={this.handleLogicChange}
          handleModelChange={this.handleModelChange}
          handleNameChange={this.handleNameChange}
          handlePackageChange={this.handlePackageChange}
          handleREADMEChange={this.handleREADMEChange}
          handleRequestChange={this.handleRequestChange}
          handleRunLogic={this.handleRunLogic}
          handleSampleChange={this.handleSampleChange}
          handleStateChange={this.handleStateChange}
          handleStatusChange={this.handleStatusChange}
          handleTypeChange={this.handleTypeChange}
          loading={this.state.loading}
          loadingFailed={this.state.loadingFailed}
          loadTemplateFromUrl={this.loadTemplateFromUrl}
          log={this.state.log}
          logic={this.state.logic}
          model={this.state.model}
          package={this.state.package}
          request={this.state.request}
          response={this.state.response}
          status={this.state.status}
          templateName={this.state.templateName}
          templateVersion={this.state.templateVersion}
          templateURL={this.state.templateURL}
          templateType={this.state.templateType}
          text={this.state.text}
        />
        <BottomMenu
          log={this.state.log}
        />
      </div>
    );
  }
}
export default TemplateStudio;

