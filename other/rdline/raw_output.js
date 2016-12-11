var stdin = process.stdin;
var stdout = process.stdout;
var quit;
if (stdin.isTTY && stdout.isTTY) {
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', function(ch) {
    stdout.write(ch);
    if (ch == '\u0003') { // Ctrl-C
      if (quit) {
        stdout.write('\x1b[H\x1b[2J\x1b[0m');
        stdin.pause();
      }
      quit = true;
    }
    else quit = false;
  });
  stdout.write('\x1b[' + stdout.rows + 'B\x1b[2J\x1b[H');
  stdout.write('Press ^C twice to quit...\n');
}
if (!stdin.isTTY) console.error('STDIN is not a TTY!');
if (!stdout.isTTY) console.error('STDOUT is not a TTY!');
