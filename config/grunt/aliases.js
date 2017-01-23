module.exports = {
    build: [
        'clean:build',
        'sh:build',
        'babel:build'
    ],
    lint: [
        'eslint',
        'tslint'
    ],
    test: [
        'build',
        'mochaTest:test'
    ]
};
