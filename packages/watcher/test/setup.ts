/**
 * Setup sandbox
 */

import chai from 'chai';
import http from 'http';
import { crd as instanceType} from '@infuseai/graphql-server/src/resolvers/instanceType';
import { crd as dataset} from '@infuseai/graphql-server/src/resolvers/dataset';
import { crd as image} from '@infuseai/graphql-server/src/resolvers/image';

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
  (global as any).mutations = {
    ...dataset.resolveInMutation(),
    ...image.resolveInMutation(),
    ...instanceType.resolveInMutation()
  };
});

after(async () => {
  await destroySandbox();
});
