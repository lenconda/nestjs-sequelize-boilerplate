const { spawn } = require('child_process');
const path = require('path');

let startType;

switch ((process.env?.NODE_ENV || '')?.toLocaleLowerCase()) {
    case 'production':
        startType = 'prod';
        break;
    case 'pre':
        startType = 'pre';
        break;
    default:
        break;
}

if (!startType) {
    process.exit(1);
}

spawn('node', ['./dist/main.js'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
});
