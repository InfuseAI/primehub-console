import http from 'http';
import { promisify } from 'util';
import { createSandbox, destroySandbox } from '../../sandbox';
import { createApp } from '../../../src/app';
import BPromise from 'bluebird';

// constants
const PORT = 3000;

// Admin service
class AdminService {
  private httpServer: http.Server;

  public init = async () => {
    await createSandbox();
    process.env.KC_GRANT_TYPE = 'authorization_code';
    // tslint:disable-next-line:no-console
    console.log(`sandbox created`);

    // create app
    const { app } = await createApp();
    this.httpServer = http.createServer(app.callback());
    await new Promise((resolve, reject) => {
      this.httpServer.listen(PORT, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  public destroy = async () => {
    await new Promise((resolve, reject) => {
      this.httpServer.close(() => resolve());
    });
    await destroySandbox();
  }

  public url = (path: string = '/') => {
    return `http://localhost:${PORT}${path}`;
  }
}

// expose a singleton service
export const adminService = new AdminService();
