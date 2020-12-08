import * as chai from 'chai';
import { escapeToPrimehubLabel, escapePodName } from '../src/utils/escapism';

const expect = chai.expect;

describe('escapeToPrimehubLabel', () => {
  it('should escape "abcd測a試c@.b中文ed"', () => {
    expect(escapeToPrimehubLabel('abcd測a試c@.b中文ed'))
      .to.be.equals('escaped-abcd-e6-b8-aca-e8-a9-a6c-40-2eb-e4-b8-ad-e6-96-87ed');
  });

  it('should escape "abcd"', () => {
    expect(escapeToPrimehubLabel('abcd'))
      .to.be.equals('escaped-abcd');
  });
});


describe('escapeToPodName', () => {
  it('should be the same with a normal username', () => {
    expect(escapePodName('foobarbar')).to.be.equals('foobarbar');
  });

  it('should be escape special chars in a username', () => {
    expect(escapePodName('foobarbar@infuseai.io')).to.be.equals('foobarbar-40infuseai-2eio');
  });
})