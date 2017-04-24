#!/usr/bin/env node
import overrideRequire from "override-require";

// Setup a callback used to determine whether a specific `require` invocation
// needs to be overridden.
const isOverride = (request, parent) => {
    return request === 'hubot-internal-discord'
};

// Setup a callback used to handle an overridden `require` invocation.
const resolveRequest = (request, parent) => {
    return require('./adapter')
};

const restoreOriginalModuleLoader = overrideRequire(isOverride, resolveRequest);

// Restore the original module loader.
require('../node_modules/webbybot/bin/webby');
