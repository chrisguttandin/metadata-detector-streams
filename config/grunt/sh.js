module.exports = {
    build: {
        cmd: 'tsc -p src/tsconfig.json'
    },
    lint: {
        cmd: 'tslint -c config/tslint/src.json --project src/tsconfig.json src/**/*.ts'
    }
};
