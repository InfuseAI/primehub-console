import * as chai from 'chai';
import { Stream, Readable } from 'stream';
import CombinedStream from 'combined-stream';
import {stdout} from 'process';
import split from 'split';
import getStream from 'get-stream';
import TailStream from '../src/utils/stream';

const expect = chai.expect;

export const makeStream = (str: string): Readable => {
  const stream = new Readable();
  stream.push(str);
  stream.push(null);
  return stream;
  // return new StringStream(str);
};

export const makeMultilineStream = (str: string, num: number): Readable => {
  const line = str + '\n';
  let counter = 0;

  const stream = new Readable({
    read(size) {
      this.push(line);
      counter++;
      if (counter === num) {
        this.push(null);
      }
    }
  });
  return stream;
};

describe('Test stream', () => {
  it('combine stream', async () => {
    const str = 'hello hello';
    const merged = CombinedStream.create();
    merged.append(makeStream(str));
    merged.append(makeStream(str));
    merged.pipe(stdout);
  });

  it('split stream', async () => {
    const str =
    `first line
    second line
    last line`;

    return new Promise(resolve => {
      makeStream(str)
      .pipe(split())
      .on('data', data => {
        // tslint:disable-next-line: no-console
        console.log('<' + data + '>');
      })
      .on('end', data => {
        resolve();
      });
    });
  });

  it('tail stream', async () => {
    const str =
`
line
line
line
line
line
last third line
last second line
last one line`;

    const str2 =
`last third line
last second line
last one line
`;

    const stream =
    makeStream(str)
    .pipe(split())
    .pipe(new TailStream(3));
    // .pipe(stdout);

    // expect(await getStream(stream)).to.be.equals(str2);

    const stream2 =
    makeMultilineStream('hello', 100)
    .pipe(split())
    .pipe(new TailStream(3));

    expect(await getStream(stream2)).to.be.equals('');
  });
});
