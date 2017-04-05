'use strict';

const assert = require('assert');

const stubs = require('../lib/stubs');
const utils = require('../lib/utils');
const logFormatter = utils.logFormatter;
const loggerStub = stubs.logger;

const captureLog = logFormatter(loggerStub);
const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const spy = require('sinon').spy;

levels.forEach(function(lvl) {
  loggerStub[lvl] = spy();
});

describe('Utils', function() {
  describe('logFormatter', function() {
    var logger = {};
    before(function() {
      levels.forEach(function(lvl) {
        logger[lvl] = captureLog(lvl);
      });
    });

    afterEach(function() {
      levels.forEach(function(lvl) {
        loggerStub[lvl].reset();
      });
    });
    it('should not modify str logs', function() {
      levels.forEach(function(lvl) {
        logger[lvl]('test');
        assert(loggerStub[lvl].calledWith({}, 'test'));
      });
    });
    it('should not modify bunyan compatible logs', function() {
      levels.forEach(function(lvl) {
        logger[lvl](new Error(), 'test');
        assert(loggerStub[lvl].calledWith(new Error(), 'test'));
      });
    });
    it('should switch object to first index on winston style logs', function() {
      levels.forEach(function(lvl) {
        logger[lvl]('test', new Error());
        assert(loggerStub[lvl].calledWith(new Error(), 'test'));
      });
    });
    it('should proxy subsequent strings and args', function() {
      levels.forEach(function(lvl) {
        logger[lvl]('test', new Error(), 'some otherstrings');
        assert(loggerStub[lvl].calledWith(new Error(), 'test', 'some otherstrings'));
      });
    });
  });
});
