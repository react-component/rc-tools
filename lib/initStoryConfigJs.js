const fs = require('fs-extra');
const path = require('path');

module.exports = (dir, { name, homepage }) => {
  const configJs = `
      import { configure,addParameters, addDecorator } from '@storybook/react';
      import withSource from 'storybook-addon-source';
    
      function loadStories() {
        require('${dir}storybook/index.js');
      }
    
      addDecorator(withSource);
    
      addParameters({
        options: {
          theme: {
            name: '${name}',
            brandUrl: '${homepage}',
            brandTitle: '${name}',
          },
        },
      });
      
      configure(loadStories, module);`;

  const manageHeaderHtml = `
    <script>
      // hackcode stroybook no support
      document.title = '${name.toUpperCase()}';
    </script>
    <link
      rel="icon"
      type="image/png"
      href="https://gw.alipayobjects.com/zos/rmsportal/rlpTLlbMzTNYuZGGCVYM.png"
    />
  `;
  fs.writeFileSync(path.join(__dirname, './storybook/config.js'), configJs);
  fs.writeFileSync(path.join(__dirname, './storybook/manager-head.html'), manageHeaderHtml);
};
