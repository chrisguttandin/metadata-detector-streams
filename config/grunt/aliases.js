module.exports = {
    build: ['sh:clean', 'sh:build'],
    lint: ['sh:lint-config', 'sh:lint-src', 'sh:lint-test'],
    test: ['build', 'sh:test-integration']
};
