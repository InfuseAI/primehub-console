import {createApp} from '../app';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as http from 'http';
import * as https from 'https';
import * as logger from '../logger';
const port = process.env.NODE_PORT || 3000;

createApp().then(({app, config}) => {
  const server = config.secure ?
    https.createServer({
      key: readFileSync(resolve(__dirname, '../../../../localhost+2-key.pem')),
      cert: readFileSync(resolve(__dirname, '../../../../localhost+2.pem'))
    }, app.callback()) :
    http.createServer(app.callback());

  server.listen(port, () => {
    if (config.env === 'production') {
      logger.info({
        component: logger.components.system,
        type: 'START_SERVER',
        port,
      });
      return;
    }
    // tslint:disable-next-line:no-console
    console.log(`
      🚀 Server ready on port ${port}
    `);
  });

  // handler for proxy of the websocket
  const {upgradeHandler} = app as any;
  if (upgradeHandler) {
    server.on('upgrade', upgradeHandler);
  }
})
.catch(err => {
  logger.error({
    component: logger.components.system,
    type: 'FAIL_START_SERVER',
    message: err.message,
    stack: err.stack
  });
});
