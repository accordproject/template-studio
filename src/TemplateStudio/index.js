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

const DEFAULT_TEMPLATE = `${ROOT_URI}/static/archives/helloworld@0.9.0.cta`;

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
      templateLogic: null,
      status: 'empty',
      loading: false,
      markers: [],
    };
    this.handleErgoMounted = this.handleErgoMounted.bind(this);
    this.handleGrammarChange = this.handleGrammarChange.bind(this);
    this.handleInitLogic = this.handleInitLogic.bind(this);
    this.handleJSONChange = this.handleJSONChange.bind(this);
    this.handleLoadingFailed = this.handleLoadingFailed.bind(this);
    this.handleLoadingFailedConfirm = this.handleLoadingFailedConfirm.bind(this);
    this.handleLogicChange = this.handleLogicChange.bind(this);
    this.handleModelChange = this.handleModelChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleVersionChange = this.handleVersionChange.bind(this);
    this.handlePackageChange = this.handlePackageChange.bind(this);
    this.handleREADMEChange = this.handleREADMEChange.bind(this);
    this.handleRequestChange = this.handleRequestChange.bind(this);
    this.handleRunLogic = this.handleRunLogic.bind(this);
    this.handleSampleChange = this.handleSampleChange.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleStatusChange = this.handleStateChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.loadTemplateLibrary = this.loadTemplateLibrary.bind(this);
    this.loadTemplateFromUrl = this.loadTemplateFromUrl.bind(this);
    this.loadTemplateFromBuffer = this.loadTemplateFromBuffer.bind(this);
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
    this.setState({
      loading: false,
      loadingFailed: true,
      log: {
        ...this.state.log,
        loading: message,
      },
    });
  }

  handleLoadingFailedConfirm() {
    this.setState({
      log: {
        ...this.state.log,
        loading: 'Unknown Error',
      },
      loadingFailed: false,
    });
  }

  handleStatusChange(status) {
    this.setState({ status });
  }

  handlePackageChange(text) {
    try {
      const packageJson = JSON.parse(text);
      this.state.clause.getTemplate().setPackageJson(packageJson);
      const stringifiedPackage = JSON.stringify(packageJson, null, 2);
      const templateName = packageJson.name;
      const templateVersion = packageJson.version;
      const templateType = packageJson.cicero.template;
      // Make sure to try re-parsing
      const stateChanges = Utils.parseSample(this.state.clause, this.state.text, { ...this.state.log, meta: 'package.json change successful!' });
      this.setState({
        ...stateChanges,
        package: stringifiedPackage,
        templateName,
        templateVersion,
        templateType,
      });
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      this.setState({
        package: text,
        log: {
          ...this.state.log,
          meta: `[Change Template package.json] ${error}`,
        },
      });
    }
  }

  handleNameChange(e, input) {
    try {
      const packageJson = JSON.parse(this.state.package);
      packageJson.name = input.value;
      this.state.clause.getTemplate().setPackageJson(packageJson);
      const stringifiedPackage = JSON.stringify(packageJson, null, 2);
      const logMeta = 'Template Name change successful!';
      const status = 'changed';
      this.setState({
        templateName: input.value,
        package: stringifiedPackage,
        log: {
          ...this.state.log,
          meta: logMeta,
        },
        status,
      });
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      this.setState({
        templateName: input.value,
        log: {
          ...this.state.log,
          meta: `[Change Template Name] ${error}`,
        },
      });
    }
  }

  handleVersionChange(e, input) {
    try {
      const packageJson = JSON.parse(this.state.package);
      packageJson.version = input.value;
      this.state.clause.getTemplate().setPackageJson(packageJson);
      const stringifiedPackage = JSON.stringify(packageJson, null, 2);
      const logMeta = 'Template version change successful!';
      const status = 'changed';
      this.setState({
        templateVersion: input.value,
        package: stringifiedPackage,
        log: {
          ...this.state.log,
          meta: logMeta,
        },
        status,
      });
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      this.setState({
        templateVersion: input.value,
        log: {
          ...this.state.log,
          meta: `[Change Template Version] ${error}`,
        },
      });
    }
  }

  handleTypeChange(e, input) {
    try {
      const packageJson = JSON.parse(this.state.package);
      packageJson.cicero.template = input.value;
      this.state.clause.getTemplate().setPackageJson(packageJson);
      const stringifiedPackage = JSON.stringify(packageJson, null, 2);
      const status = 'changed';
      // Make sure to try re-parsing
      const stateChanges = Utils.parseSample(this.state.clause, this.state.text, { ...this.state.log, meta: 'Template kind change successful!' });
      this.setState({
        ...stateChanges,
        templateType: input.value,
        package: stringifiedPackage,
        status,
      });
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      this.setState({
        templateType: input.value,
        log: {
          ...this.state.log,
          meta: `[Change Template Type] ${error}`,
        },
      });
    }
  }

  handleREADMEChange(text) {
    try {
      const readme = text;
      let status = this.state.status;
      const template = this.state.clause.getTemplate();
      if (template.getMetadata().getREADME() !== text) {
        status = 'changed';
        template.setReadme(readme);
      }
      this.setState({
        status,
        readme,
        log: {
          ...this.state.log,
          meta: 'README change successful!',
        },
      });
    } catch (error) {
      console.log(`ERROR ${JSON.stringify(error.message)}`);
      this.setState({
        readme: text,
        log: {
          ...this.state.log,
          meta: `[Change Template README] ${error}`,
        },
      });
    }
  }

  handleSampleChange(text) {
    const { clause, log } = this.state;
    let status = this.state.status;
    if (Utils.updateSample(clause, text)) {
      status = 'changed';
    }
    const stateChanges = Utils.parseSample(clause, text, log);
    this.setState({
      ...stateChanges,
      status,
    });
  }

  handleGrammarChange(text) {
    const clause = this.state.clause;
    if (text !== this.state.grammar) {
      try {
        const status = 'changed';
        const data = JSON.stringify(clause.getData(), null, 2);
        const logText = 'Grammar change successful!';
        let changes = {};
        if (data !== 'null') {
          clause.getTemplate().buildGrammar(text);
          changes = Utils.generateText(clause, data, { ...this.state.log, text: logText });
          if (changes.log.text.indexOf('successful') === -1) {
            throw new Error('Error generating text from this new grammar');
          }
        }
        this.setState({
          ...changes,
          grammar: text,
          data,
          status,
        });
      } catch (error1) {
        try {
          console.log(`Error building grammar ${error1.message}`);
          const status = 'changed';
          const template = clause.getTemplate();
          template.buildGrammar(text);
          const log = { ...this.state.log, text: `[Change Template] ${error1.message}` };
          const changesText = Utils.parseSample(clause, this.state.text, log);
          this.setState({
            ...changesText,
            grammar: text,
            status,
          });
        } catch (error2) {
          this.setState({
            grammar: text,
            log: {
              ...this.state.log,
              text: `[Change Template] ${error2.message}`,
            },
          });
        }
      }
    }
  }

  handleRequestChange(text) {
    let status = this.state.status;
    if (Utils.updateRequest(this.state.clause, this.state.request, text)) {
      status = 'changed';
    }
    return this.setState({
      request: text,
      status,
    });
  }

  handleStateChange(text) {
    return this.setState({
      cstate: text,
    });
  }

  handleModelChange(editor, name, model) {
    const clause = this.state.clause;
    const oldModel = this.state.model;
    const newModel = [];
    let modelFails = false;
    let status = this.state.status;
    let logModel = this.state.log.model;
    oldModel.forEach((m) => {
      if (m.name === name) {
        try {
          if (Utils.updateModel(clause, name, m.content, model, this.state.grammar)) {
            status = 'changed';
            logModel = 'Load model successful';
          }
        } catch (error) {
          modelFails = true;
          console.log(`ERROR! ${error.message}`);
          logModel = `Cannot load model: ${error.message}`;
        }
        newModel.push({ name,
          content: model,
          markersSource: m.markersSource ? m.markersSource : [],
        });
      } else {
        newModel.push({ name: m.name, content: m.content, markersSource: m.markersSource });
      }
    });
    if (!modelFails) {
      logModel = 'Model loaded successfully';
    }
    this.setState({
      model: newModel,
      status,
      log: {
        ...this.state.log,
        model: logModel,
      },
    });
    if (!modelFails) {
      try {
        this.setState(Utils.parseSample(clause, this.state.text, this.state.log));
        try {
          const { markers, logic, log } = this.state;
          const changesLogic = Utils.compileLogic(editor, markers, logic, this.state.model, log);
          this.setState(changesLogic);
        } catch (error) {
          console.log(`ERROR! ${error.message}`);
        }
      } catch (error) {
        console.log(`ERROR! ${error.message}`);
      }
    }
  }

  handleJSONChange(data) {
    const { clause, log } = this.state;
    if (data !== null) {
      this.setState(Utils.generateText(clause, data, log));
    }
  }

  handleLogicChange(editor, name, logic) {
    const { clause, text, log, model, markers } = this.state;
    const oldLogic = this.state.logic;
    const newLogic = [];
    let status = this.state.status;
    let logLogic = this.state.log.logic;
    oldLogic.forEach((m) => {
      if (m.name === name) {
        try {
          if (Utils.updateLogic(clause, name, logic)) {
            status = 'changed';
          }
        } catch (error) {
          logLogic = `Cannot compile new logic ${error.message}`;
        }
        newLogic.push({ name,
          content: logic,
          markersSource: m.markersSource ? m.markersSource : [],
        });
      } else {
        newLogic.push({ name: m.name, content: m.content, markersSource: m.markersSource });
      }
    });
    const changesText = Utils.parseSample(clause, text, { ...log, logic: logLogic });
    this.setState({ ...changesText, status });
    const changesLogic = Utils.compileLogic(editor, markers, newLogic, model, this.state.log);
    this.setState(changesLogic);
  }

  handleErgoMounted(editor, newMarkers) {
    const { markers } = this.state;
    this.setState({ markers: Utils.refreshMarkers(editor, markers, newMarkers) });
  }

  handleRunLogic() {
    // XXX Should check whether the NL parses & the logic
    // compiles & the state/request are valid JSON first
    const state = this.state;
    try {
      const compiledLogic = state.templateLogic;
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
      console.log('run ERROR HERE!!! ', error);
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
      const compiledLogic = state.templateLogic;
      const contract = JSON.parse(state.data);
      console.log('we got here ----------------------------------');
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
      console.log('init ERROR HERE!!! ', error);
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
        Utils.compileLogic(null, state.markers, state.logic, state.model, state.log),
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
      this.setState(Utils.compileLogic(null, state.markers, state.logic, state.model, state.log));
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
          handleVersionChange={this.handleVersionChange}
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

