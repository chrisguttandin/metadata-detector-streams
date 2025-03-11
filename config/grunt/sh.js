module.exports = () => {
    return {
        'build': {
            cmd: 'npm run build'
        },
        'test-integration': {
            cmd: 'mocha --bail --parallel --recursive --require config/mocha/config-integration.js test/integration'
        }
    };
};
