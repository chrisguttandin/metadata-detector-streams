module.exports = () => {
    return {
        'build': {
            cmd: `tsc --project src/tsconfig.json && \
                babel ./build/es2019 --config-file ./config/babel/build.json --out-dir ./build/node`
        },
        'clean': {
            cmd: 'rimraf build/*'
        },
        'lint-config': {
            cmd: 'npm run lint:config'
        },
        'lint-src': {
            cmd: 'npm run lint:src'
        },
        'lint-test': {
            cmd: 'npm run lint:test'
        },
        'test-integration': {
            cmd: 'mocha --bail --parallel --recursive --require config/mocha/config-integration.js test/integration'
        }
    };
};
