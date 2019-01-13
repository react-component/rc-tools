const fs = require('fs-extra');
const path = require('path');

module.exports = (dir, dev, { name, homepage }) => {
  const configJs = `
      import { configure, addDecorator } from '@storybook/react';
      import { withNotes } from '@storybook/addon-notes';
      import { withOptions } from '@storybook/addon-options';
      import withSource from 'storybook-addon-source';
    
      function loadStories() {
        require('${dir}storybook/index.js');
      }
    
      ${dev && 'addDecorator(withNotes)'};
      addDecorator(withSource);
    
      addDecorator(
        withOptions({
          name: '${name}'
          url: '${homepage}',
          title:'${name}'
        })
      );
      
      configure(loadStories, module);`;
  fs.writeFileSync(path.join(__dirname, './storybook/config.js'), configJs);
};
