// Override react-scripts webpack config for Node 24+ compatibility.
// Removes ModuleScopePlugin which incorrectly blocks react-refresh
// imports on newer Node versions due to absolute path resolution changes.
module.exports = function override(config) {
  config.resolve.plugins = config.resolve.plugins.filter(
    (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
  );
  return config;
};
