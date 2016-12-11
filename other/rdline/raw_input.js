var stdin = process.stdin;
var stdout = process.stdout;
var quit;
if (stdin.isTTY && stdout.isTTY) {
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', function(ch) {
    console.log(ch.length, ch);
    if (ch == '\u0003') { // Ctrl-C
      if (quit) stdin.pause();
      quit = true;
    }
    else quit = false;
  });
  stdout.on('resize', function() {
    stdout.write(`${process.stdout.columns}x${process.stdout.rows}\n\r`);
  });
  stdout.write('Press ^C twice to quit...\n');
}
if (!stdin.isTTY) console.error('STDIN is not a TTY!');
if (!stdout.isTTY) console.error('STDOUT is not a TTY!');
