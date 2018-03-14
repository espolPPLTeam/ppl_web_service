var CronJob = require('cron').CronJob;
var colors = require('colors');
var logger        = require('tracer').colorConsole({
  filters : [colors.underline, colors.yellow]
});
const co            = require('co'),
logger        = require('tracer').console(),
path          = require('path'),
_             = require('lodash'),
jsondiffpatch = require('jsondiffpatch').create({
  arrays: {
    detectMove: true,
    includeValueOnMove: true
  }
});
