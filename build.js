//BUILDING FOR WINDOWS/LINUX:

//Prerequisites: Must have Node, NPM, and Bower installed globally.
//
//This assumes you have a folder next to `scout-app` called `scout-app-build`.
//`scout-app-build` folder should contain:
//  * locales (folder)
//  * ffmpegsumo.dll
//  * icudtl.dat
//  * nw.pak
//  * Scout-App.exe
// All of those are from NW.js 0.12.3, the .exe is a renamed version of
// nw.exe with a custom icon


// Variables
var start = Date.now() + '';
var os = process.platform;
var win = false;
var lin = false;
var darwin = false;
if (os == 'win32' ) { win = true; }
if (os == 'linux' ) { lin = true; }
if (os == 'darwin') { darwin = true; }
if (os == 'freebsd' || os == 'sunos' || ( os != 'win32' && os != 'linux' && os != 'darwin' ) ) {
    lin = true;
    console.log('UNSUPPORTED OPERATING SYSTEM')
    console.log('Build will probably fail.');
}
var fs = require('fs-extra');
var exec = require('child_process').execSync;
//var rimraf = require('rimraf'); // used to set number of retries for async deleting of in use files
//var del = require('del'); // used to delete entire folders with the exception of specific files
var bowerJSON = fs.readJsonSync('bower.json');
var manifest = fs.readJsonSync('package.json');
delete manifest.devDependencies;
if (lin) {
    manifest.window.icon = 'scout-files/_img/logo_128.png';
}
var build = '../scout-app-build/';
var sf = 'scout-files/';
var bindings = '_assets/node-sass_v3.4.2/';
var ns = 'node_modules/node-sass/vendor/';

// Functions
function timer (finish, begin) {
    //3195
    var subtract = finish - begin;
    //319.5 becomes 320
    var round = Math.round(subtract / 10);
    //320 becomes 3.2
    var seconds = round / 100;
    //3.2 becomes ['3', '2']
    var splitSeconds = seconds.toString().split('.');
    if (splitSeconds[0].length < 2) {
        //'3' becomes ' 3'
        splitSeconds[0] = ' ' + splitSeconds[0];
    }
    if (splitSeconds.length == 1 || splitSeconds[1].length < 1) {
        //'' becomes '00'
        splitSeconds[1] = '00';
    } else if (splitSeconds[1].length == 1) {
        //'2' becomes '20'
        splitSeconds[1] = splitSeconds[1] + '0';
    }
    if (splitSeconds[0].length == 3) {
        splitSeconds[1] = splitSeconds[1][0];
    }
    //[' 3', '20'] becomes ' 3.20 seconds'
    var time = splitSeconds.join('.') + ' seconds';
    return time;
}

function minutes (finish, begin) {
    //82500
    var subtract = finish - begin;
    //82500 = 1.375
    var minutes = subtract / 60000;
    minutes = Math.round(minutes * 1000) / 1000;
    //1.375 = ['1', '375']
    var splitMinutes = minutes.toString().split('.');
    if (!splitMinutes[1]) {
        splitMinutes[1] = '000';
    } else if (splitMinutes[1].length == 1) {
        //['1', '3'] = ['1', '300']
        splitMinutes[1] = splitMinutes[1] * 100;
    } else if (splitMinutes[1].length == 2) {
        //['1', '32'] = ['1', '320']
        splitMinutes[1] = splitMinutes[1] * 10;
    }
    //['1', '300'] = ['1', '18']
    splitMinutes[1] = (splitMinutes[1] / 1000) * 60;
    splitMinutes[1] = Math.round(splitMinutes[1]).toString();
    //['1', '9'] = ['1', '09']
    if (splitMinutes[1].length == 1) {
        splitMinutes[1] = '0' + splitMinutes[1];
    }
    //['1', '09'] = '1:09'
    var time = splitMinutes.join(':');
    return time;
}

function rmrf (location) {
    if (win) {
        var winLocation = location.split('/').join('\\');
        while ( fs.existsSync(location) ) {
            exec('rd /S /Q ' + winLocation);
        }
    } else {
        while ( fs.existsSync(location) ) {
            fs.removeSync(location);
        }
    }
}


// Clean build folder
rmrf(build + 'License');
rmrf(build + 'bower_components');
rmrf(build + 'node_modules');
rmrf(build + sf);
fs.mkdirsSync(build + sf);
var timeClean = Date.now() + '';
console.log('Cleaning build folder - ' + timer(timeClean, start));


// Copy files over
fs.writeJsonSync(build + 'package.json', manifest);
fs.writeJsonSync(build + 'bower.json', bowerJSON);;
fs.copySync(sf + 'index.html', build + sf + 'index.html');
var timeFiles = Date.now() + '';
console.log('Copying files         - ' + timer(timeFiles, timeClean));


// Copy folders over
fs.copySync('License',        build + 'License');
fs.copySync(sf + '_fonts',    build + sf + '_fonts');
fs.copySync(sf + '_img',      build + sf + '_img');
fs.copySync(sf + '_markup',   build + sf + '_markup');
fs.copySync(sf + '_scripts',  build + sf + '_scripts');
fs.copySync(sf + '_sound',    build + sf + '_sound');
fs.copySync(sf + '_style',    build + sf + '_style');
fs.copySync(sf + '_themes',   build + sf + '_themes');
fs.copySync(sf + 'mixins',    build + sf + 'mixins');
fs.copySync(sf + 'cultures',  build + sf + 'cultures');
fs.removeSync(build + sf + 'cultures/cultures.xls');
fs.removeSync(build + sf + 'cultures/README.md');
var timeFolder = Date.now() + '';
console.log('Copying folders       - ' + timer(timeFolder, timeFiles));


// Run executables
process.chdir('../scout-app-build');
exec('npm --loglevel=error install');
if (fs.existsSync('bower_components/sass-css3-mixins/css3-mixins.scss')) {
    fs.removeSync('bower_components/sass-css3-mixins/css3-mixins.sass');
}
process.chdir('../scout-app');
var timeExec = Date.now() + '';
console.log('NPM & Bower Installs  - ' + timer(timeExec, timeFolder));


// Node-Sass Vendor Bindings
rmrf(build + 'node_modules/node-sass/vendor');
fs.copySync(sf + bindings + os + '-x64-43', build + ns + os + '-x64-43');
if (!darwin) {
    fs.copySync(sf + bindings + os + '-ia32-43', build + ns + os + '-ia32-43');
}
var timeNS = Date.now() + '';
console.log('Node-Sass bindings    - ' + timer(timeNS, timeExec));


// Total Time
var end = Date.now() + '';
console.log('-------------------------------------');
console.log('Total Build Time      - ' + timer(end, start) + ' or ' + minutes(end, start));


//Run the app
if (win) {
    if ( fs.existsSync(build + 'Scout-App.exe') ) {
        exec(build.split('/').join('\\') + 'Scout-App.exe');
    }
} else if (darwin) {
    //????
} else {
    if ( fs.existsSync(build + 'Scout-App') ) {
        exec(build + 'Scout-App');
    }
}
