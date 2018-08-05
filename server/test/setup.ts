/**
 * Setup sandbox
 */

import chai from 'chai';

const expect = chai.expect;

import { createSandbox, destroySandbox } from './sandbox';
// import app
import { createApp } from '../src/app';

before(async () => {
  // setup testing realm and related env
  await createSandbox();

  // create app
  const PORT = 3000;
  const {app, server} = await createApp();
  (global as any).server = app.listen(PORT);
  (global as any).graphqlRequest = async (query, variables) => {
    const res = await chai.request((global as any).server)
      .post(server.graphqlPath)
      .send({
        operationName: null,
        query,
        variables
      });

    if (res.body && res.body.errors) {
      // tslint:disable-next-line:no-console
      console.log(JSON.stringify(res.body.errors, null, 2));
    }
    expect(res).to.have.status(200);
    return res.body.data;
  };
});

after(async () => {
  await destroySandbox();
});
