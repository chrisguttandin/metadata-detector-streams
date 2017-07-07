import { Buffer } from 'buffer';
import { Transform, TransformOptions } from 'stream';
import { decode } from 'synchsafe';

export class StripStream extends Transform {

    private _buffer: Buffer;

    private _isFirstAnalysis: Boolean;

    private _isLastAnalysis: Boolean;

    private _nextMpeg4AtomStart: number;

    private _nextOggPageStart: number;

    private _offset: number;

    constructor (options?: TransformOptions) {
        super(options);

        this._buffer = new Buffer(0);
        this._isFirstAnalysis = true;
        this._isLastAnalysis = false;
        this._nextMpeg4AtomStart = 0;
        this._nextOggPageStart = 0;
        this._offset = 0;
    }

    public _transform (chunk: any, _: string, callback: Function): void {
        this._buffer = Buffer.concat([this._buffer, chunk], this._buffer.length + chunk.length);

        if (this._analyzeBuffer()) {
            const offset = Math.min(this._buffer.length, 128);

            this.push(this._buffer.slice(0, -offset));
            this._offset += this._buffer.length - offset;
            this._buffer = this._buffer.slice(-offset);
        }

        callback();
    }

    protected _flush (callback: Function): void {
        this._isLastAnalysis = true;

        this._analyzeBuffer();

        this.push(this._buffer);

        callback(null);
    }

    private _analyzeBuffer () {
        if (this._isFirstAnalysis && this._buffer.length < 8) {
            return false;
        }

        if (this._isFirstAnalysis && this._buffer.toString('utf8', 0, 4) === 'fLaC') {
            let isLast = false;
            let length = 0;
            let offset = 4;

            while (!isLast) {
                offset += length;

                if (this._buffer.length < offset + 4) {
                    return false;
                }

                isLast = ((this._buffer.readUInt8(offset) & 0x80) !== 0); // tslint:disable-line:no-bitwise
                length = ((this._buffer.readUInt8(offset + 3) | // tslint:disable-line:no-bitwise
                    (this._buffer.readUInt8(offset + 2) << 8) | // tslint:disable-line:no-bitwise
                    (this._buffer.readUInt8(offset + 1) << 16)) + 4); // tslint:disable-line:no-bitwise
            }

            if (this._buffer.length >= offset + length) {
                this._buffer = this._buffer.slice(offset + length);
            } else {
                return false;
            }
        }

        if ((this._isFirstAnalysis && this._buffer.toString('utf8', 4, 8) === 'ftyp') ||
                (this._nextMpeg4AtomStart > 0)) {
            let offset = this._nextMpeg4AtomStart - this._offset;

            while (this._buffer.length > offset + 8) {
                const length = this._buffer.readUInt32BE(offset);
                const atom = this._buffer.toString('utf8', offset + 4, offset + 8);

                if (atom === 'moov' || atom === 'wide') {
                    if (this._buffer.length >= offset + length) {
                        this._buffer = Buffer.concat([
                            this._buffer.slice(0, offset),
                            this._buffer.slice(offset + length)
                        ], this._buffer.length - length);
                    } else {
                        return false;
                    }
                } else {
                    this._nextMpeg4AtomStart += length;
                    offset += length;
                }
            }

            if (this._buffer.length - 8 > offset) {
                return false;
            } else {
                return true;
            }
        }

        if (this._isFirstAnalysis && this._buffer.toString('utf8', 0, 3) === 'ID3') {
            const nextByte = decode(this._buffer.readUInt32BE(6)) + 10;

            if (this._buffer.length >= nextByte) {
                this._buffer = this._buffer.slice(nextByte);
            } else {
                return false;
            }
        }

        if (this._offset + this._buffer.length > this._nextOggPageStart + 4) {
            const offset = this._nextOggPageStart - this._offset;

            if (this._buffer.toString('utf8', offset, offset + 4) === 'OggS') {
                if (this._offset + this._buffer.length < this._nextOggPageStart + 27) {
                    return false;
                }

                const streamStructureVersion = this._buffer.readUInt8(offset + 4);

                if (streamStructureVersion === 0) {
                    const pageSegments = this._buffer.readUInt8(offset + 26);

                    let pageSize = 27 + pageSegments;

                    if (this._offset + this._buffer.length < this._nextOggPageStart + 28 + pageSegments + 1 + 6) {
                        return false;
                    }

                    for (let i = 0; i < pageSegments; i += 1) {
                        pageSize += this._buffer.readUInt8(offset + 27 + i);
                    }

                    const firstByte = this._buffer.readUInt8(offset + 27 + pageSegments);
                    const identifier = this._buffer.toString('utf8', offset + 27 + pageSegments + 1, offset + 27 + pageSegments + 1 + 6);

                    if (firstByte === 3 && identifier === 'vorbis') {
                        if (this._offset + this._buffer.length < this._nextOggPageStart + pageSize) {
                            return false;
                        }

                        this._buffer = Buffer.concat([
                            this._buffer.slice(0, this._nextOggPageStart - this._offset),
                            this._buffer.slice(this._nextOggPageStart + pageSize - this._offset)
                        ], this._buffer.length - pageSize);

                        this._nextOggPageStart += pageSize;
                    } else {
                        this._nextOggPageStart += pageSize;
                    }
                }
            }
        } else {
            return false;
        }

        if (this._isLastAnalysis && this._buffer.toString('utf8', this._buffer.length - 128, this._buffer.length - 125) === 'TAG') {
            this._buffer = this._buffer.slice(0, -128);
        }

        this._isFirstAnalysis = false;

        return true;
    }

}
