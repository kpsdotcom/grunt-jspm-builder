"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function traceModulesFromFiles(builder) {
    var files = this.files;
    grunt.log.writeln(grunt.log.wordlist(['Tracing expressions:'], { color: 'blue' }));
    var thenables = [];
    files.forEach(function (file) {
        var expression = file.orig.src[0];
        thenables.push(builder.trace(expression).then(function (tree) {
            grunt.log.write(expression + '...');
            grunt.log.ok();
            return tree;
        }, grunt.fail.warn));
    });
    return Promise.all(thenables);
}
exports.traceModulesFromFiles = traceModulesFromFiles;
