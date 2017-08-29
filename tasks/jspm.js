"use strict";
module.exports = function (grunt) {
    var config = require("jspm/lib/config");
    var format = require("jspm/lib/ui").format;
    // jspm for simple builds
    var jspm = require("jspm");
    jspm.setPackagePath(".");
    jspm.on('log', function (type, msg) { return grunt.log.writeln(format[type](msg)); });
    // SystemJS Builder
    var builder = new jspm.Builder();
    var booleanUnbundle = function () {
        return (this.unbundle && jspm.unbundle()) || Promise.resolve();
    };
    var traceModulesFromFiles = require("./traceModulesFromFiles");
    /*function () {
        const files = this.files;
        grunt.log.writeln(grunt.log.wordlist(['Tracing expressions:'], {color: 'blue'}));
        const thenables = [];
        files.forEach(function (file) {
            const expression = file.orig.src[0];
            thenables.push(builder.trace(expression).then(tree => {
                grunt.log.write(expression + '...');
                grunt.log.ok();
                return tree;

            }, grunt.fail.warn));
        });
        return Promise.all(thenables);
    }; */
    var bundleCommonFromTraces = function (traces) {
        grunt.log.writeln(grunt.log.wordlist(['Bundling:'], { color: 'blue' }));
        var self = this;
        var files = self.files;
        var commonBundle = self.data.commonBundle;
        var warn = traces.length < 2;
        var bundleFunc = bundle;
        var commonTree;
        try {
            commonTree = warn ? traces[0] : builder.intersectTrees.apply(builder, traces);
        }
        catch (error) {
            grunt.log.write(error);
        }
        var options = self.options({
            sfx: true,
            mangle: true,
            minify: true
        });
        var bundles = [];
        if (warn) {
            var msg = grunt.log.wordlist(['Notice: ' + commonBundle.dest + ' will not be written since only 1 bundle was provided'], { color: 'yellow' });
            grunt.log.writeln(msg);
            bundles[0] = bundleFunc(commonTree, files[0].dest, options);
        }
        else {
            // Common bundle
            bundles[0] = bundleFunc(commonTree, commonBundle.dest, commonBundle.options);
            // all others
            traces.forEach(function (trace, index) {
                var subtractedTree = builder.subtractTrees(trace, commonTree);
                var file = files[index];
                var bundle = bundleFunc(subtractedTree, file.dest, options);
                bundles.push(bundle);
            });
        }
        return Promise.all(bundles);
    };
    var bundle = function (expressionOrTree, dest, options) {
        return builder[options.sfx ? "buildStatic" : "bundle"](expressionOrTree, dest, options).then(function (bundle) {
            grunt.log.write(dest + '...');
            grunt.log.ok();
            if (options.inject) {
                if (!config.loader.bundles) {
                    config.loader.bundles = {};
                }
                config.loader.bundles[dest] = bundle.modules;
            }
            return bundle;
        }, grunt.fail.warn);
    };
    grunt.registerMultiTask("jspm", "Bundle JSPM", function (self) {
        var options = self.options({
            sfx: true,
            mangle: true,
            minify: true
        });
        if (options.inject) {
            options.injectConfig = true;
        }
        var data = self.data;
        var bundle = options.sfx ? "buildStatic" : "bundle";
        var buildCommon = Boolean(data.commonBundle);
        if (buildCommon) {
            var done = self.async();
            /*if (bundle === 'buildStatic') {
                grunt.fail.warn('bundleSFX is not supported when creating a common bundle.');
            }*/
            grunt.log.writeln(grunt.log.wordlist(['Building common bundle...'], { color: 'green' }));
            config.load()
                .then(booleanUnbundle.bind(options))
                .then(traceModulesFromFiles.bind(self, builder))
                .then(bundleCommonFromTraces.bind(self))
                .then(config.save)
                .then(done);
        }
        else {
            var thenables_1 = [];
            var done_1 = self.async();
            config.load().then(function () {
                self.files.forEach(function (file) {
                    var moduleExpression = file.orig.src[0];
                    thenables_1.push(builder[bundle](moduleExpression, file.dest, options).then(function (bundle) {
                        if (options.inject) {
                            if (!config.loader.bundles) {
                                config.loader.bundles = {};
                            }
                            config.loader.bundles[file.dest] = bundle.modules;
                            grunt.log.writeln("Adding bundle to config");
                        }
                        return bundle;
                    }));
                    builder.reset();
                });
                Promise.all(thenables_1).then(function (bundles) {
                    bundles.forEach(function (bundle) {
                    });
                }, grunt.fail.warn).then(config.save).then(done_1);
            });
        }
    });
};
