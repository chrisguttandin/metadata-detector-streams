const createReadStream = require('fs').createReadStream;
const lengthsData = require('../fixtures/lengths-data.json');
const locationsData = require('../fixtures/locations-data.json');
const metadataDetectorStreams = require('../../src/module');

describe('metadata-detector-streams', function () {
    for (const [filename, locations] of locationsData) {
        describe('createLocateStream()', function () {
            const sanitizedFilename = filename.slice(-4) === '.txt' ? filename.slice(0, -4) : filename;

            it('should locate the metadata tags of the file', function (done) {
                const lctns = [];
                const locateStream = metadataDetectorStreams.createLocateStream();
                const readable = createReadStream('test/fixtures/' + sanitizedFilename, {
                    highWaterMark: 128
                });

                readable
                    .pipe(locateStream)
                    .on('error', function (err) {
                        done(err);
                    })
                    .on('finish', function () {
                        expect(lctns).to.deep.equal(locations);

                        done();
                    })
                    .on('location', function (location) {
                        lctns.push(location);
                    });
            });
        });
    }

    for (const [filename, byteLength] of lengthsData) {
        describe('createStripStream()', function () {
            const sanitizedFilename = filename.slice(-4) === '.txt' ? filename.slice(0, -4) : filename;

            it('should strip the metadata tags from the file', function (done) {
                let btLngth = 0;

                const readable = createReadStream('test/fixtures/' + sanitizedFilename, {
                    highWaterMark: 128
                });
                const stripStream = metadataDetectorStreams.createStripStream();

                readable
                    .pipe(stripStream)
                    .on('data', function (data) {
                        btLngth += data.length;
                    })
                    .on('error', function (err) {
                        done(err);
                    })
                    .on('finish', function () {
                        expect(btLngth).to.equal(byteLength);

                        done();
                    });
            });
        });
    }

    describe('locate()', function () {
        it('should be undefined', function () {
            expect(metadataDetectorStreams.locate).to.be.undefined;
        });
    });

    describe('strip()', function () {
        it('should be undefined', function () {
            expect(metadataDetectorStreams.strip).to.be.undefined;
        });
    });
});
