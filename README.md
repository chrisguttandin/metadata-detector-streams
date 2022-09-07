# metadata-detector-streams

**A tool to locate and strip metadata from files.**

[![version](https://img.shields.io/npm/v/metadata-detector-streams.svg?style=flat-square)](https://www.npmjs.com/package/metadata-detector-streams)

This package is currently capable of handling [ID3](http://id3.org/Home) tags within MP3s and metadata of FLAC files as described in the official [FLAC format specification](http://xiph.org/flac/format.html). It can also parse [Vorbis Comments](https://xiph.org/vorbis/doc/v-comment.html) within [OGG Containers](https://xiph.org/ogg). In addition to that it can also parse MPEG-4 files which are nicely explained on the homepage of [AtomicParsley](http://atomicparsley.sourceforge.net).

## Usage

This package is intended to be used with Node.js. Please take a look at [`metadata-detector`](https://github.com/chrisguttandin/metadata-detector) if you look for a package that works in the browser.

`metadata-detector-streams` is available as a package on npm. You can use the following command to install it:

```shell
npm install metadata-detector-streams
```

The package exports two functions to create streams which eather locate or strip metadata from a readable stream.

### createLocateStream()

`createLocateStream()` can be used to create a stream to locate metadata in another stream. It will emit tuples which consist of two values. These values are marking the start and end in bytes of any detected metadata.

```js
import { createLocateStream } from 'metadata-detector-streams';

const locateStream = createLocateStream();

readable.pipe(locateStream);
// a stream of tuples
```

### createStripStream()

`createStripStream()` can be used to create a stream which removes all detected metadata from a readable stream. It will emit only those bytes which are not detected as metadata.

```js
import { createStripStream } from 'metadata-detector-streams';

const stripStream = createStripStream();

readable.pipe(stripStream);
// a stream of the same data but without metadata
```
