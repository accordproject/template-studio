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
import PropTypes from 'prop-types';
import {
  Container,
  Tab,
  Grid,
  Menu,
  Icon,
  Confirm,
  Dimmer,
  Loader,
} from 'semantic-ui-react';

import TemplateForm from './TemplateForm';

import GrammarInput from '../inputs/GrammarInput';
import JsonInput from '../inputs/JsonInput';

import ModelForm from '../forms/ModelForm';
import LogicForm from '../forms/LogicForm';
import ParseForm from '../forms/ParseForm';
import ExecuteForm from '../forms/ExecuteForm';

class DimmableContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeItem: 'metadata',
      activeLegal: 'template',
      activeLogic: 'ergo',
      activeMeta: 'readme',
      activeModel: 'model',
    };

    this.handleEmitChange = this.handleEmitChange.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleLegalTabChange = this.handleLegalTabChange.bind(this);
    this.handleLogicTabChange = this.handleLogicTabChange.bind(this);
    this.handleMetaTabChange = this.handleMetaTabChange.bind(this);
    this.handleModelTabChange = this.handleModelTabChange.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
  }

  handleEmitChange() {
    // Emit should not be changed
  }
  handleItemClick(e, { name }) {
    this.setState({ activeItem: name });
  }
  handleLegalTabChange(e, { name }) {
    this.setState({ activeLegal: name });
  }
  handleLogicTabChange(e, { name }) {
    this.setState({ activeLogic: name });
  }
  handleMetaTabChange(e, { name }) {
    this.setState({ activeMeta: name });
  }
  handleModelTabChange(e, { name }) {
    this.setState({ activeModel: name });
  }
  handleResponseChange() {
    // Response should not be changed
  }

  render() {
    const {
      clause,
      text,
      grammar,
      model,
      logic,
      log,
      logo,
      author,
      data,
      request,
      cstate,
      response,
      emit,
      loading,
      loadingFailed,
      status,
      templateURL,
      templateName,
      templateVersion,
      templateType,
      loadTemplateFromUrl,
      handleNameChange,
      handleAuthorChange,
      handleVersionChange,
      handleTypeChange,
      handleStatusChange,
    } = this.props;
    const legalTabs = () => (
      <div>
        <Menu attached="top" tabular>
          <Menu.Item
            name="template"
            active={this.state.activeLegal === 'template'}
            onClick={this.handleLegalTabChange}
          >Grammar</Menu.Item>
          <Menu.Item
            name="sample"
            active={this.state.activeLegal === 'sample'}
            onClick={this.handleLegalTabChange}
          >Sample</Menu.Item>
          <Menu.Item
            href="https://docs.accordproject.org/docs/accordproject-concepts.html#template-text"
            target="_blank"
            position="right"
          >
            <Icon name="info" />
          </Menu.Item>
        </Menu>
        { this.state.activeLegal === 'template' ?
          <Tab.Pane attached="bottom">
            <GrammarInput
              grammar={grammar}
              handleTextChange={this.props.handleGrammarChange}
            />
          </Tab.Pane> :
          this.state.activeLegal === 'sample' ?
            <ParseForm
              text={text}
              log={log.text}
              data={data}
              handleSampleChange={this.props.handleSampleChange}
              handleJSONChange={this.props.handleJSONChange}
            /> : null }
      </div>
    );
    const logicTabs = () => (
      <div>
        <Menu attached="top" tabular>
          <Menu.Item
            name="ergo"
            active={this.state.activeLogic === 'ergo'}
            onClick={this.handleLogicTabChange}
          >Logic</Menu.Item>
          <Menu.Item
            name="execution"
            active={this.state.activeLogic === 'execution'}
            onClick={this.handleLogicTabChange}
          >Request</Menu.Item>
          <Menu.Item
            href="https://docs.accordproject.org/docs/accordproject-concepts.html#template-logic"
            target="_blank"
            position="right"
          >
            <Icon name="info" />
          </Menu.Item>
        </Menu>
        { this.state.activeLogic === 'ergo' ?
          <Tab.Pane attached="bottom">
            <LogicForm
              logic={logic}
              handleErgoMounted={this.props.handleErgoMounted}
              handleLogicChange={this.props.handleLogicChange}
            />
          </Tab.Pane> :
          this.state.activeLogic === 'execution' ?
            <ExecuteForm
              request={request}
              cstate={cstate}
              response={response}
              emit={emit}
              handleRequestChange={this.props.handleRequestChange}
              handleStateChange={this.props.handleStateChange}
              handleResponseChange={this.handleResponseChange}
              handleEmitChange={this.handleEmitChange}
              handleRunLogic={this.props.handleRunLogic}
              handleInitLogic={this.props.handleInitLogic}
            /> : null }
      </div>
    );
    const modelTabs = () => (
      <div>
        <Menu attached="top" tabular>
          <Menu.Item
            name="model"
            active={this.state.activeModel === 'model'}
            onClick={this.handleModelTabChange}
          >Model</Menu.Item>
          <Menu.Item
            href="https://docs.accordproject.org/docs/accordproject-concepts.html#template-model"
            target="_blank"
            position="right"
          >
            <Icon name="info" />
          </Menu.Item>
        </Menu>
        { this.state.activeModel === 'model' ?
          <Tab.Pane>
            <ModelForm
              model={model}
              handleModelChange={this.props.handleModelChange}
            />
          </Tab.Pane> : null }
      </div>
    );
    const metaTabs = () => (
      <div>
        <Menu attached="top" tabular>
          <Menu.Item
            name="readme"
            active={this.state.activeMeta === 'readme'}
            onClick={this.handleMetaTabChange}
          >README</Menu.Item>
          <Menu.Item
            name="package"
            active={this.state.activeMeta === 'package'}
            onClick={this.handleMetaTabChange}
          >package.json</Menu.Item>
          <Menu.Item
            href="https://docs.accordproject.org/docs/accordproject-concepts.html#template-metadata"
            target="_blank"
            position="right"
          >
            <Icon name="info" />
          </Menu.Item>
        </Menu>
        { this.state.activeMeta === 'readme' ?
          <Tab.Pane attached="bottom">
            <GrammarInput
              grammar={clause ? clause.getTemplate().getMetadata().getREADME() : 'null'}
              handleTextChange={this.props.handleREADMEChange}
            />
          </Tab.Pane> : this.state.activeMeta === 'package' ?
            <Tab.Pane attached="bottom">
              <JsonInput
                json={this.props.package}
                handleJSONChange={this.props.handlePackageChange}
              />
            </Tab.Pane> : null }
      </div>
    );
    const viewMenu = () =>
      (<Menu fluid vertical pointing>
        <Menu.Item name="legal" active={this.state.activeItem === 'legal'} onClick={this.handleItemClick}>
                   Text
        </Menu.Item>
        <Menu.Item name="model" active={this.state.activeItem === 'model'} onClick={this.handleItemClick}>
                   Model
        </Menu.Item>
        <Menu.Item name="logic" active={this.state.activeItem === 'logic'} onClick={this.handleItemClick}>
                   Logic
        </Menu.Item>
        <Menu.Item name="metadata" active={this.state.activeItem === 'metadata'} onClick={this.handleItemClick}>
                   Metadata
        </Menu.Item>
      </Menu>);
    return (
      <Container fluid style={{ marginTop: '7em' }}>
        <Confirm
          header="Could not load template"
          content={this.props.log.loading}
          confirmButton={null}
          cancelButton="Cancel"
          open={loadingFailed}
          onCancel={this.props.handleLoadingFailedConfirm}
        />
        <Dimmer.Dimmable dimmed={loading}>
          <Dimmer active={loading} inverted>
            <Loader>Loading Template</Loader>
          </Dimmer>
          <Grid padded>
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
                      <TemplateForm
                        clause={clause}
                        log={log}
                        logo={logo}
                        author={author}
                        status={status}
                        handleNameChange={handleNameChange}
                        handleAuthorChange={handleAuthorChange}
                        handleVersionChange={handleVersionChange}
                        handleStatusChange={handleStatusChange}
                        handleTypeChange={handleTypeChange}
                        loadTemplateFromUrl={loadTemplateFromUrl}
                        templateName={templateName}
                        templateVersion={templateVersion}
                        templateURL={templateURL}
                        templateType={templateType}
                      />
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Grid.Column>
              <Grid.Column width={12}>
                { this.state.activeItem === 'legal' ? legalTabs()
                  : this.state.activeItem === 'logic' ? logicTabs()
                    : this.state.activeItem === 'model' ? modelTabs()
                      : metaTabs() }
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Dimmer.Dimmable>
      </Container>
    );
  }
}

DimmableContainer.propTypes = {
  clause: PropTypes.object,
  cstate: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired,
  emit: PropTypes.string.isRequired,
  grammar: PropTypes.string.isRequired,
  handleErgoMounted: PropTypes.func.isRequired,
  handleGrammarChange: PropTypes.func.isRequired,
  handleInitLogic: PropTypes.func.isRequired,
  handleJSONChange: PropTypes.func.isRequired,
  handleLoadingFailedConfirm: PropTypes.func.isRequired,
  handleLogicChange: PropTypes.func.isRequired,
  handleModelChange: PropTypes.func.isRequired,
  handleNameChange: PropTypes.func.isRequired,
  handleVersionChange: PropTypes.func.isRequired,
  handlePackageChange: PropTypes.func.isRequired,
  handleREADMEChange: PropTypes.func.isRequired,
  handleRequestChange: PropTypes.func.isRequired,
  handleRunLogic: PropTypes.func.isRequired,
  handleSampleChange: PropTypes.func.isRequired,
  handleStateChange: PropTypes.func.isRequired,
  handleStatusChange: PropTypes.func.isRequired,
  handleTypeChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  loadingFailed: PropTypes.bool.isRequired,
  loadTemplateFromUrl: PropTypes.func.isRequired,
  log: PropTypes.object.isRequired,
  logic: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ]),
  model: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ]),
  package: PropTypes.string.isRequired,
  request: PropTypes.string.isRequired,
  response: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  templateName: PropTypes.string.isRequired,
  templateVersion: PropTypes.string.isRequired,
  templateURL: PropTypes.string.isRequired,
  templateType: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  text: PropTypes.string.isRequired,
};

export default DimmableContainer;
