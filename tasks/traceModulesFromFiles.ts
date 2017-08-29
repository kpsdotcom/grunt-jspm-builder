export function traceModulesFromFiles(builder) {
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
}
