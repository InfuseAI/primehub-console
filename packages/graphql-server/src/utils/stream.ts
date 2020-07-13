import { Transform, TransformOptions, TransformCallback } from 'stream';

export default class TailStream extends Transform {
  private lines = [];
  private tailLine: number;

  constructor(tailLine: number) {
    super({});
    this.tailLine = tailLine;
  }

  public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    this.lines.push(chunk);

    if (this.lines.length === this.tailLine * 2) {
      this.lines = this.lines.slice(this.tailLine, this.lines.length);
    }
    callback();
  }

  public _flush(callback: TransformCallback): void {
    let i = this.lines.length > this.tailLine ? this.lines.length - this.tailLine : 0;
    for (; i < this.lines.length; i++) {
      this.push(this.lines[i]);
      this.push('\n');
    }
    callback();
  }
}
