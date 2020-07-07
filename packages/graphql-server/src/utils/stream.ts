import { Transform, TransformOptions, TransformCallback } from 'stream';

export default class TailStream extends Transform {
  private lines = [];
  private line;

  constructor(opts?: TransformOptions) {
    super(opts);
  }

  public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    // this.lines.push(chunk);
    this.line = chunk;
    callback();
  }

  public _flush(callback: TransformCallback): void {
    let i = this.lines.length > 3 ? this.lines.length - 3 : 0;
    for (; i < this.lines.length; i++) {
      // this.push(this.lines[i]);
      this.push(this.line);
      this.push('\n');
    }
    callback();
  }
}
