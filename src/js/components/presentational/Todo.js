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
import { TextArea } from 'semantic-ui-react';

const Input = ({ value, handleChange }) => (
    <TextArea
      rows={20}
      onChange={handleChange}
      value={value}/>
);
Input.propTypes = {
    value: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired
};
export default Input;
