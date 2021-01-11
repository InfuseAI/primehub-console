import * as chai from 'chai';
import { isGroupNameAvailable } from '../src/utils/groupCheck';

const expect = chai.expect;
const groupList = [{name: 'primehub-abc'}];

describe('isGroupNameAvailable', () => {
  it('exact same group name primehub-abc, it have to reject', () => {
    expect(isGroupNameAvailable('primehub-abc', groupList))
      .to.be.false;
  });

  it('any group with the empty groupList', () => {
    expect(isGroupNameAvailable('PrimeHub_abc', []))
      .to.be.true;
  });

  it('primehub-ABC deny by toLowerCase', () => {
    expect(isGroupNameAvailable('primehub-ABC', groupList))
      .to.be.false;
  });

  it('primehub_abc deny by normalization - to _', () => {
    expect(isGroupNameAvailable('primehub_abc', groupList))
      .to.be.false;
  });

  it('allow a non-conflict group name', () => {
    expect(isGroupNameAvailable('infuseai', groupList))
      .to.be.true;
  });
});

