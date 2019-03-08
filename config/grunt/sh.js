module.exports = {
    'build': {
        cmd: 'tsc -p src/tsconfig.json'
    },
    'lint': {
        cmd: 'tslint --config config/tslint/src.json --project src/tsconfig.json src/*.ts src/**/*.ts'
    },
    'test-integration': {
        cmd: 'mocha --bail --recursive --require config/mocha/config-integration.js test/integration'
    }
};
