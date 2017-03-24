fs = require 'fs'
path = require 'path'
require 'babel-polyfill'
console.log('loaded');

module.exports = (robot, scripts) ->
  scriptsPath = path.resolve(__dirname, '../../dist/compiled-scripts')
  console.log(scriptsPath);
  fs.exists scriptsPath, (exists) ->
    if exists
      for script in fs.readdirSync(scriptsPath)
        if scripts? and '*' not in scripts
          robot.loadFile(scriptsPath, script) if script in scripts
        else
          robot.loadFile(scriptsPath, script)
