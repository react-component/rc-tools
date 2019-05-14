const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

/**
 * ReactDom.render(<Demo />, document.getElementById('__react-content'));
 * to
 * export default ()=><Demo />
 */
const replaceFileContent = (filePath) => {
  const regex = /[\s\S]*^(\S*\.render\(([\s\S]*), document\.getElementById\('__react-content'\)\);)/m;
  const content = fs.readFileSync(filePath, 'utf-8');
  // 有了 export default 说明已经是新版本的了直接放过
  if (content.includes('export default')) {
    return true;
  }
  const regexObj = content.match(regex);
  if (!regexObj) {
    return false;
  }
  const className = regexObj[2];
  const renderString = regexObj[1];
  if (!renderString || !className) {
    return false;
  }
  const newContent = content.replace(renderString, `export default ()=>${className}`);

  fs.writeFileSync(filePath, newContent);
  return true;
};

const genStorybook = (dir) => {
  const config = require(path.join(dir, './package.json'));

  const firstUpperCase = ([ first, ...rest ]) => first.toUpperCase() + rest.join('');

  // get all files
  const files = glob.sync(path.join(dir, './examples/*.js'), {});

  const importString = [];
  const importSourceString = [];
  const addString = [];
  const jsList = files.filter((filePath) => replaceFileContent(filePath)).map((fileName) => {
    return fileName.split('/').pop().replace('.js', '');
  });

  // single-animation => SingleAnimation
  jsList.forEach((fileName) => {
    const ComponentName = fileName.split('-').map((item) => firstUpperCase(item)).join('');

    importString.push(`import ${ComponentName} from '../examples/${fileName}';`);
    importSourceString.push(
      `import ${ComponentName}Source from 'rc-source-loader!../examples/${fileName}';`,
    );

    addString.push(`.add('${fileName}', () => <${ComponentName} />,{
    source: {
      code: ${ComponentName}Source,
    },
  })`);
  });

  const fileContent = `
/* eslint-disable import/no-webpack-loader-syntax */
import React from 'react';
import Markdown from 'react-markdown';
import { checkA11y } from '@storybook/addon-a11y';
import { storiesOf } from '@storybook/react';
import { withConsole } from '@storybook/addon-console';
import { withViewport } from '@storybook/addon-viewport';
import { withInfo } from '@storybook/addon-info';
${importSourceString.join('\n')}
${importString.join('\n')}
import READMECode from '../README.md';

storiesOf('${config.name}', module)
.addDecorator(checkA11y) 
.addDecorator(withInfo)
.addDecorator((storyFn, context) => withConsole()(storyFn)(context))
.addDecorator(withViewport())
.add(
  'readMe',
  () => (
    <div
      className="markdown-body entry-content"
      style={{
        padding: 24,
      }}
    >
      <Markdown escapeHtml={false} source={READMECode} />
    </div>
  ),
  {
    source: {
      code: READMECode,
    },
  },
)
${addString.join('\n')}
`;
  if (!fs.existsSync(path.join(dir, './storybook/'))) {
    fs.mkdir(path.join(dir, './storybook/'));
  }
  fs.writeFileSync(path.join(dir, './storybook/index.js'), fileContent);
};

module.exports = genStorybook;
