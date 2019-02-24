const fs = require('fs-extra');
const path = require('path');

module.exports = (dir, { name, homepage }) => {
  const configJs = `
      import { configure, addDecorator } from '@storybook/react';
      import { withNotes } from '@storybook/addon-notes';
      import { withOptions } from '@storybook/addon-options';
      import withSource from 'storybook-addon-source';
      const path = require('path');
    
      function loadStories() {
        require(path.join('${dir.split(path.sep).join('/')}', 'storybook/index.js'));
      }
    
      addDecorator(withNotes);
      addDecorator(withSource);
    
      addDecorator(
        withOptions({
          name: '${name}',
          url: '${homepage}',
          title:'${name}'
        })
      );
      
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
