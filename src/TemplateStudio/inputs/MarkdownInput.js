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
import { MarkdownEditor } from '@accordproject/markdown-editor';
import List from '@accordproject/markdown-editor/dist/plugins/list';

const plugins = [List()];

class MarkdownInput extends React.Component {
  render() {
    return (
      <MarkdownEditor
        markdown={this.props.markdown}
        onChange={this.props.onChange}
        plugins={plugins}
      />
    );
  }
}

MarkdownInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  markdown: PropTypes.string.isRequired,
};

export default MarkdownInput;
