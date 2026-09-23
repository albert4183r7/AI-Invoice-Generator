module.exports = {
    testEnvironment: 'node',

    // mongodb-memory-server fetches a ~600 MB MongoDB binary the first time it
    // runs on a machine. Jest's 5 s default expires during that download, so
    // beforeAll fails and every suite reports as broken -- which reads like a
    // code failure when it is really just a cold cache. CI caches the binary
    // (see .github/workflows/ci.yml); this covers local first runs.
    testTimeout: 300000,
};
