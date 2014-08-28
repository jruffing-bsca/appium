"use strict";

var setup = require("../common/setup-base")
  , _ = require("underscore")
  , ChaiAsserter = require('../../helpers/asserter.js').ChaiAsserter
  , getAppPath = require('../../helpers/app').getAppPath;

describe('crash recovery', function () {
  var driver;
  var desired = {
    app: getAppPath('TestApp')
  };

  setup(this, desired, {}, {FAST_TESTS: false}).then(function (d) { driver = d; });

  it('should be able to recover gracefully from an app crash during shutdown', function (done) {

    var sourceDuringCrash = function () {
      // sometimes we don't catch the server right while it's shutting down
      // so keep trying to get the source until we get it in the middle of
      // a crash
      return new ChaiAsserter(function () {
        return driver.sleep(100).source()
          .should.eventually.be.rejectedWith('13');
      });
    };
    driver
      .elementByAccessibilityId("Crash")
      .click()
      .waitFor(sourceDuringCrash())
    .nodeify(done);
  });

  it('should be able to recover gracefully from an app crash after shutdown', function (done) {
    driver
      .elementByAccessibilityId("Crash")
      .click()
      .then(function () {
        return driver.sleep(6000);
      })
      .source() // will 404 because the session is gone
        .should.eventually.be.rejectedWith('6')
    .nodeify(done);
  });
});

describe('crash commands', function () {

  var driver;
  var desired = {
    app: getAppPath('TestApp')
  };

  setup(this, desired, {}, {FAST_TESTS: false}).then(function (d) { driver = d; });

  it('should not process new commands until after crash shutdown', function (done) {
    driver
      .execute("$.crash()") // this causes instruments to shutdown during
                            // this command
        .should.eventually.be.rejectedWith('13')
      .status()
      .then(function (s) {
        if (_.has(s, 'isShuttingDown')) {
          s.isShuttingDown.should.eql(false);
        }
      })
    .nodeify(done);
  });
});

