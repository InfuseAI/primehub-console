/**
 * Setup sandbox
 */

import chai from 'chai';
import http from 'http';
import chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

import { createSandbox, destroySandbox } from './sandbox';
// import app
import { createApp } from '../src/app';

before(async () => {
  // setup testing realm and related env
  await createSandbox();
  // tslint:disable-next-line:no-console
  console.log(`sandbox created`);

  // create app
  const PORT = 4000;
  const {app, server} = await createApp();
  const httpServer = http.createServer(app.callback());
  const requester = chai.request(httpServer).keepOpen();
  (global as any).graphqlRequest = async (query, variables, authorzation?) => {
    const request = requester
      .post(server.graphqlPath);

    if (authorzation) {
      request.set('Authorization', authorzation);
    } else {
      request.auth(process.env.KC_USERNAME, process.env.KC_PWD);
    }

    const res = await request.send({
      operationName: null,
      query,
      variables
    });

    if (res.body && res.body.errors) {
      // tslint:disable-next-line:no-console
      console.log(JSON.stringify(res.body.errors, null, 2));
      return res.body.errors;
    }

    return res.body.data;
  };
});

after(async () => {
  await destroySandbox();
});
