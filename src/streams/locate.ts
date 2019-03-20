import { Buffer } from 'buffer';
import { Writable, WritableOptions } from 'stream';
import { decode } from 'synchsafe';
import { TWritableCallback } from '../types';

export class LocateStream extends Writable {

    private _buffer: Buffer;

    private _isFirstAnalysis: boolean;

    private _isLastAnalysis: boolean;

    private _nextMpeg4AtomStart: number;

    private _nextOggPageStart: number;

    private _offset: number;

    constructor (options?: WritableOptions) {
        super(options);

        this._buffer = Buffer.alloc(0);
        this._isFirstAnalysis = true;
        this._isLastAnalysis = false;
        this._nextMpeg4AtomStart = 0;
        this._nextOggPageStart = 0;
        this._offset = 0;
    }

    public _write (chunk: any, _: string, callback: TWritableCallback): void {
        this._buffer = Buffer.concat([this._buffer, chunk], this._buffer.length + chunk.length);

        if (this._analyzeBuffer()) {
            this._offset += this._buffer.length - 128;
            this._buffer = this._buffer.slice(-128);
        }

        callback();
    }

    public end (chunk?: any, encoding?: string | TWritableCallback, callback?: TWritableCallback): void {
        this._isLastAnalysis = true;

        if (chunk === undefined) {
            this._analyzeBuffer();
        }

        if (typeof encoding === 'string') {
            super.end(chunk, encoding, callback);
        } else {
            super.end(chunk, callback);
        }
    }

    private _analyzeBuffer (): boolean {
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

            this.emit('location', [
                0,
                offset + length
            ]);
        }

        if ((this._isFirstAnalysis && this._buffer.toString('utf8', 4, 8) === 'ftyp') ||
                (this._nextMpeg4AtomStart > 0)) {
            let offset = this._nextMpeg4AtomStart - this._offset;

            while (offset < this._buffer.length - 8) {
                const length = this._buffer.readUInt32BE(offset);
                const atom = this._buffer.toString('utf8', offset + 4, offset + 8);

                if (atom === 'moov' || atom === 'wide') {
                    this.emit('location', [
                        this._nextMpeg4AtomStart,
                        this._nextMpeg4AtomStart + length
                    ]);
                }

                this._nextMpeg4AtomStart += length;
                offset += length;
            }

            if (offset < this._buffer.length) {
                return false;
            }
        }

        if (this._isFirstAnalysis && this._buffer.toString('utf8', 0, 3) === 'ID3') {
            this.emit('location', [
                0,
                decode(this._buffer.readUInt32BE(6)) + 10
            ]);
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

                    if (firstByte === 3) {
                        const index = offset + 27 + pageSegments + 1;
                        const identifier = this._buffer.toString('utf8', index, index + 6);

                        if (identifier === 'vorbis') {
                            this.emit('location', [
                                offset,
                                offset + pageSize
                            ]);
                        }
                    }

                    this._nextOggPageStart += pageSize;
                }
            }
        } else {
            return false;
        }

        if (this._isLastAnalysis && this._buffer.toString('utf8', this._buffer.length - 128, this._buffer.length - 125) === 'TAG') {
            this.emit('location', [
                this._offset + this._buffer.length - 128,
                this._offset + this._buffer.length
            ]);
        }

        this._isFirstAnalysis = false;

        return true;
    }

}
