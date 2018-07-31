import * as chai from 'chai';
import { toRelay, paginate } from '../src/resolvers/utils';
import { times, first, last } from 'lodash/fp';
import faker from 'faker';
const dataGen = times(() => ({
  id: faker.random.uuid(),
  name: faker.internet.userName()
}));
const fakeData = dataGen(5);

const expect = chai.expect;

const toEdge = (rows: any[]) => {
  return rows.map(row => ({
    cursor: row.id,
    node: row
  }));
};

describe('utils', () => {
  describe('paginate', () => {
    it('should paginate without parameter and empty object', () => {
      expect(paginate(fakeData).length).to.be.eql(5);
      // empty object
      expect(paginate(fakeData, {}).length).to.be.eql(5);
    });

    it('should paginate with first', () => {
      const rows = paginate(fakeData, {first: 2});
      expect(rows.length).to.be.eql(2);
      expect(rows[0]).to.be.eql(fakeData[0]);
    });

    it('should paginate with first and after', () => {
      const rows = paginate(fakeData, {first: 2, after: fakeData[1].id});
      expect(rows.length).to.be.eql(2);
      expect(rows[0]).to.be.eql(fakeData[2]);
    });

    it('should paginate with last', () => {
      const rows = paginate(fakeData, {last: 2});
      expect(rows.length).to.be.eql(2);
      expect(rows[0]).to.be.eql(fakeData[3]);
    });

    it('should paginate with last and before', () => {
      const rows = paginate(fakeData, {last: 2, before: fakeData[2].id});
      expect(rows.length).to.be.eql(2);
      expect(rows[0]).to.be.eql(fakeData[0]);
    });
  });

  describe('toRelay', () => {
    it('should relay-style response without parameter', () => {
      expect(toRelay(fakeData)).to.be.eql({
        edges: toEdge(fakeData),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: first(fakeData).id,
          endCursor: last(fakeData).id
        }
      });
    });

    it('should get relay-style response with first and after', () => {
      expect(toRelay(fakeData, {first: 2, after: fakeData[1].id})).to.be.eql({
        edges: toEdge(fakeData.slice(2, 4)),
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: fakeData[2].id,
          endCursor: fakeData[3].id
        }
      });
    });
  });
});
