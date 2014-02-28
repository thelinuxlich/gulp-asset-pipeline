/**
 * [exports description]
 * @type {[type]}
 */
module.exports = RcFinder;

var path = require('path');
var cloneDeep = require('lodash.clonedeep');
var fs = require('fs');

function RcFinder(rcName, opts) {
  if (!(this instanceof RcFinder))
    return new RcFinder(rcName, opts);

  opts = opts || {};
  var pathMap = {};
  var configMap = {};

  var loader = opts.loader || function (path) {
    return JSON.parse(fs.readFileSync(path));
  };

  if (loader === 'async') {
    loader = function (path, cb) {
      fs.readFile(path, function (err, file) {
        var config;
        if (!err) {
          try {
            config = JSON.parse(file);
          } catch(e) {
            err = cb(new Error(path + ' is not valid JSON: ' + e.message));
          }
        }
        cb(err, config);
      });
    };
  }

  // configurable to make testing simpler
  var syncCheck = opts._syncCheck || function (path) {
    return fs.existsSync(path);
  };
  var asyncCheck = opts._syncCheck || function (path, cb) {
    fs.stat(path, function (err, exists) {
      if (err && err.code !== 'ENOENT') return cb(err);
      cb(void 0, !err);
    });
  };

  this.find = function (from, cb) {
    from = from || process.cwd();

    var rcPath;
    var rcConfig;
    var checkPath;
    var searched = [];
    var dir = from;
    var sync = (typeof cb !== 'function');

    function respond(err, rcPath) {
      if (!rcPath) {
        // it should be safe to test for undef
        rcConfig = rcPath = false;
      } else {
        if (configMap[rcPath] === void 0) {
          // we need to populate the cache
          if (loader.length === 2) {
            if (sync) {
              throw new TypeError('You need to call find with a callback because the loader is async');
            }
            // async, stop and wait then retry responding
            return loader(rcPath, function (err, config) {
              // force false, so we can safely check for undef
              configMap[rcPath] = config || false;
              respond(err, rcPath);
            });
          } else {
            // sync, do what you do
            configMap[rcPath] = loader(rcPath) || false;
          }
        }
        // clone the cached copy so that people can't fuck with them
        rcConfig = cloneDeep(configMap[rcPath]);
      }

      searched.forEach(function (dir) {
        pathMap[dir] = rcPath;
      });

      if (sync) return rcConfig;
      cb(void 0, rcConfig);
    }

    if (sync) {
      for (; !~searched.indexOf(dir); dir = path.resolve(dir, '..')) {
        if (pathMap[dir] !== void 0) {
          rcPath = pathMap[dir];
          break;
        }

        searched.push(dir);
        checkPath = path.join(dir, rcName);
        if (syncCheck(checkPath)) {
          rcPath = checkPath;
          break;
        }
      }

      return respond(void 0, rcPath);
    }

    // async find
    process.nextTick(function next() {
      if (~searched.indexOf(dir))
        return respond();

      if (pathMap[dir] !== void 0)
        return respond(void 0, pathMap[dir]);

      searched.push(dir);
      checkPath = path.join(dir, rcName);
      asyncCheck(checkPath, function (err, exists) {
        if (err) return respond(err);
        if (exists) return respond(void 0, checkPath);
        // else keep looking
        dir = path.resolve(dir, '..');
        process.nextTick(next);
      });
    });
  };
}