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

/* Libraries */

import moment from 'moment-mini'; // For DateTime support during contract execution

/* Ergo */
const TemplateInstance = require('@accordproject/cicero-core/lib/templateinstance');
import { EvalEngine } from '@accordproject/ergo-engine/index.browser.js';

function getUrlVars() {
  const vars = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
    vars[key] = decodeURIComponent(value);
  });
  return vars;
}
function getUrlParam(parameter, defaultvalue) {
  let urlparameter = defaultvalue;
  try {
    if (window.location.href.indexOf(parameter) > -1) {
      if (getUrlVars()[parameter]) {
        urlparameter = getUrlVars()[parameter];
      } else {
        throw new Error('Cannot parse template URL parameter');
      }
    } else {
      console.log(`Did not find template URL parameter when loading studio, using default: ${urlparameter}`);
    }
  } catch (error) {
    console.log(`Did not find template URL parameter when loading studio, using default: ${urlparameter}`);
  }
  return urlparameter;
}
function initUrl(defaultUrl) {
  return getUrlParam('template', defaultUrl);
}
function textLog(log, msg) {
  return {
    text: msg,
    model: log.model,
    logic: log.logic,
    meta: log.meta,
    execute: log.execute,
    loading: log.loading,
  };
}
function logicLog(log, msg) {
  return {
    text: log.text,
    model: log.model,
    logic: msg,
    meta: log.meta,
    execute: log.execute,
    loading: log.loading,
  };
}
function modelLog(log, msg) {
  return {
    text: log.text,
    model: msg,
    logic: log.logic,
    meta: log.meta,
    execute: log.execute,
    loading: log.loading,
  };
}
function parseSample(clause, text, log) {
  const changes = {};
  try {
    console.log('PARSING SAMPLE TEXT: ' + text);
    clause.parse(text);
    changes.data = JSON.stringify(clause.getData(), null, 2);
    console.log('SUCCESS AND DATA IS : ' + changes.data);
    changes.log = textLog(log, 'Parse successful!');
  } catch (error) {
    console.log('FAILURE!' + error.message);
    changes.data = 'null';
    changes.log = textLog(log, `[Parse Contract] ${error.message}`);
  }
  return changes;
}

function updateTemplateSample(clause, sample) {
  const template = clause.getTemplate();
  const samples = template.getMetadata().getSamples();
  if (samples.default !== sample) {
    samples.default = sample;
    template.setSamples(samples);
    return true;
  }
  return false;
}

function updateRequest(clause, oldrequest, request) {
  if (oldrequest !== request) {
    try {
      clause.getTemplate().setRequest(JSON.parse(request));
    } catch (error) {
      console.log(`Update request error: ${error}`);
    }
    return true;
  }
  return false;
}
function updateModel(logicManager, name, newcontent, log) {
    const changes = {};
    try {
        logicManager.getModelManager().updateModel(newcontent, name);
        changes.log = modelLog(log, 'Parse model successful!');
    } catch (error) {
        changes.log = modelLog(log, `[Parse Model] ${error.message}`);
    }
    return changes;
}
function updateLogic(clause, name, content) {
  const scriptManager = clause.getTemplate().getScriptManager();
  if (scriptManager.getScript(name).getContents() !== content) {
    scriptManager.modifyScript(name, '.ergo', content);
    return true;
  }
  return false;
}

function draft(clause, data, log) {
  const changes = {};
  try {
    const dataContent = JSON.parse(data);
    clause.setData(dataContent);
    const options = {
      wrapVariables: false
    };
    // clear engine script cache before re-generating text 
    clause.getEngine().clearCacheJsScript();
    const text = clause.draft(options);
    changes.text = text;
    changes.data = data;
    if (updateTemplateSample(clause, text)) {
      changes.status = 'changed';
    }
    changes.log = textLog(log, 'GenerateText successful!');
  } catch (error) {
    changes.data = data;
    changes.log = textLog(log, `[Draft] ${error.message}`);
  }
  return changes;
}

function refreshMarkers(editor, oldMarkers, newMarkersSource) {
  const newMarkers = [];
  oldMarkers.forEach(marker => marker.clear());
  newMarkersSource.forEach(marker =>
    newMarkers.push(editor.markText(marker.start, marker.end, marker.kind)),
  );
  return newMarkers;
}

function logicError(error, logic, log, changes) {
    const message = error.message;
    const descriptor = error.fileLocation;
    let newMarkers = [];
    changes.log = logicLog(log, message);
    logic.forEach((m) => {
        if (message.indexOf(m.name) !== -1) {
            const mfix = m;
            mfix.markersSource = [];
            mfix.markersSource.push(
                { start: { line: descriptor.start.line - 1, ch: descriptor.start.character },
                  end: { line: descriptor.end.line - 1, ch: descriptor.end.character + 1 },
                  kind: { className: 'syntax-error', title: descriptor.message } },
            );
            newMarkers = mfix.markersSource;
        }
    });
    return newMarkers;
}

function rebuildParser(editor, markers, logic, clause, log, grammar) {
    const changes = {};
    let newMarkers = [];

    const template = clause.getTemplate();
    const parserManager = template.getParserManager();
    const logicManager = template.getLogicManager();
    try {
        TemplateInstance.rebuildParser(
            parserManager,
            logicManager,
            clause.getEngine(),
            clause.getIdentifier(),
            grammar
        );
        logic.forEach((m) => {
            const mfix = m;
            mfix.markersSource = [];
            newMarkers = mfix.markersSource;
        });
        changes.log = logicLog(log, 'Compilation successful');
    } catch (error) {
        newMarkers = logicError(error, logic, log, changes);
    }
    if (editor) { changes.markers = refreshMarkers(editor, markers, newMarkers) };
    return changes;
}

function compileLogic(editor, markers, logic, clause, log) {
    const changes = {};
    let newMarkers = [];
    if (logic.length === 0) {
        return;
    }

    const logicManager = clause.getTemplate().getLogicManager();
    try {
        logicManager.compileLogicSync(true);
        logic.forEach((m) => {
            const mfix = m;
            mfix.markersSource = [];
            newMarkers = mfix.markersSource;
        });
        changes.log = logicLog(log, 'Compilation successful');
    } catch (error) {
        newMarkers = logicError(error, logic, log, changes);
        changes.log = logicLog(log, `Compilation error ${error.message}`);
    }
    if (editor) { changes.markers = refreshMarkers(editor, markers, newMarkers) };
    return changes;
}

function runLogic(logicManager, contract, request, cstate) {
    const engine = new EvalEngine();
    const result = engine.trigger(logicManager, 'test', contract, request, cstate, moment().format());
    return result;
}

function runInit(logicManager, contract) {
    const engine = new EvalEngine();
    const response = engine.init(logicManager, 'test', contract, {}, moment().format());
    return response;
}

export {
    initUrl,
    parseSample,
    draft,
    refreshMarkers,
    compileLogic,
    rebuildParser,
    runLogic,
    runInit,
    updateTemplateSample,
    updateRequest,
    updateModel,
    updateLogic,
};
