# auth0-instrumentation

The goal of this package is to make it easier to collect information about our services through logs, metrics and error catching.

## Logs

With the right configuration, logs will go from the local server to "THE CLOUD", then a bunch of awesome stuff will happen and they'll become available on the [tenant's dashboard](https://auth0.com/docs/api/v2#!/Logs/get_logs) (if it's related to "business" logs) or on [Kibana](https://www.elastic.co/products/kibana) (for everything else).

Usage:

```js
var serializers = require('./serializers'); // See https://github.com/trentm/node-bunyan#serializers
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env, serializers);
var logger = agent.logger;

logger.info('Foo');
// logs something along the lines of:
// {"name":"foo","process":{"app":"my-app","version":"0.0.1","node":"v5.7.1"},"hostname":"dirceu-auth0.local","pid":24102,"level":30,"msg":"Foo","time":"2016-03-22T19:39:21.609Z","v":0}
```

## Metrics

Using the right configuration, you can use a metrics collector to... well, collect metrics.

Usage:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);
var metrics = agent.metrics;

var tags = {
  'user': 'foo',
  'endpoint': '/login'
};

metrics.gauge('mygauge', 42, tags);
metrics.increment('requests.served', tags); // increment by 1
metrics.increment('some.other.thing', 5, tags); // increment by 5
metrics.histogram('service.time', 0.248);
```

## Errors

You can use the error reporter to send exceptions to an external service. You can set it up on your app in three ways, depending on what framework is being used.

### Hapi

For `hapi`, the error reporter is a plugin. To use it, you can do something like this:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);

var hapi = require('hapi');
var server = new hapi.Server();

// to capture hapi exceptions with context
server.register([agent.errorReporter.hapi.plugin], function() {});

// to capture a specific error with some extra information
agent.errorReporter.captureException('My error', {
  extra: {
    user: myUser,
    something: somethingElse,
    foo: 'bar'
  }
});
```

## Express

For `express`, the error reporter is composed of two middlewares. To use it, you can do something like this:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);

var express = require('express');
var app = express();

// before any other request handlers
app.use(agent.errorReporter.express.requestHandler);

// before any other error handlers
app.use(agent.errorReporter.express.errorHandler);

// to capture a specific error with some extra information
agent.errorReporter.captureException('My error', {
  extra: {
    user: myUser,
    something: somethingElse,
    foo: 'bar'
  }
});
```

## Other

If you don't use `hapi` or `express` - maybe it's not an HTTP API, it's a worker process or a command-line application - you can do something like this:

```js
var pkg = require('./package.json');
var env = require('./lib/env');
var agent = require('auth0-instrumentation');
agent.init(pkg, env);

// to capture all uncaughts
agent.errorReporter.patchGlobal(function() {
  setTimeout(function(){
    process.exit(1);
  }, 200);
});

// to capture a specific error with some extra information
agent.errorReporter.captureException('My error', {
  extra: {
    user: myUser,
    something: somethingElse,
    foo: 'bar'
  }
});
```

## Configuration

Configuration is done through an object with predefined keys, usually coming from environment variables. You only need to configure the variables you want to change.

These are the variables that can be used, along with their default values:

```js

const env = {
  // general configuration
  'CONSOLE_LOG_LEVEL': 'info', // log level for console

  // AWS configuration for Kinesis
  'AWS_ACCESS_KEY_ID': undefined,
  'AWS_ACCESS_KEY_SECRET': undefined,
  'AWS_REGION': undefined

  // Kinesis configuration
  'LOG_TO_KINESIS': undefined, // Kinesis stream name
  'LOG_TO_KINESIS_LEVEL': 'info', // log level for Kinesis
  'LOG_TO_KINESIS_LOG_TYPE': undefined, //Bunyan stream type
  'KINESIS_OBJECT_MODE': true,
  'KINESIS_TIMEOUT': 5,
  'KINESIS_LENGTH': 50,

  //optional if you want a pool of kinesis for failover
  'KINESIS_POOL': [
    {
      //IF any of this config options are undefined will take root level
      'LOG_TO_KINESIS': undefined, // Kinesis stream name
      'LOG_TO_KINESIS_LEVEL': 'info', // log level for Kinesis
      'LOG_TO_KINESIS_LOG_TYPE': undefined, //Bunyan stream type
      'AWS_ACCESS_KEY_ID': undefined,
      'AWS_ACCESS_KEY_SECRET': undefined,
      'AWS_REGION': undefined      
    }
  ]

  // Error reporter configuration
  'ERROR_REPORTER_URL': undefined, // Sentry URL

  // Metrics collector configuration
  'METRICS_API_KEY': undefined, // DataDog API key
  'METRICS_HOST': require('os').hostname(),
  'METRICS_PREFIX': pkg.name + '.',
  'METRICS_FLUSH_INTERVAL': 15 // seconds
};
```
