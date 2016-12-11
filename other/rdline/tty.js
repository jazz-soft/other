(function() {

  function TTY(rows, cols, buff) {
    this._rows = rows;
    this._cols = cols;
    this._buff = buff;
    this._x = 0;
    this._y = 0;
    this._t = 0;     // top line
    this._c = true;  // cursor blink
    this._a = {};    // current attribute
    this._i = [];    // input buffer
    this._o = [];    // output buffer
    this._s = [];    // screen
    this._f = [];    // front buffer
    this._b = [];    // back buffer
    this._dirty = false;
    this._color = ['#000', '#b00', '#0b0', '#bb0', '#00b', '#b0b', '#0bb', '#bbb', '#777', '#f00', '#0f0', '#ff0', '#00f', '#f0f', '#0ff', '#fff'];
    var self = this;
    this._refresh = function() {
      self._update();
      self._dirty = false;
    }
  }
  TTY.prototype._create = function(at) {
    var self = this;
    var main = document.createElement('div');
    main.tabIndex = 0;
    main.style.whiteSpace = 'pre';
    main.style.fontFamily = '"Courier New", Courier, monospace';
    main.style.display = 'inline-block';
    main.style.padding = '0';
    main.style.margin = '0';
    main.style.border = '0';
    main.style.backgroundColor = '#000';
    main.style.color = '#bbb';
    var dummy = document.createElement('span');
    dummy.style.padding = '0';
    dummy.style.margin = '0';
    dummy.style.border = '0';
    dummy.innerHTML = '*';
    main.appendChild(dummy);
    while (at.lastChild) at.removeChild(at.lastChild);
    at.appendChild(main);
    this._dx = dummy.offsetWidth;
    this._dy = dummy.offsetHeight;
    main.removeChild(dummy);

    var scroll = document.createElement('div');
    scroll.style.display = 'inline-block';
    scroll.style.overflowY = 'scroll';
    scroll.style.padding = '0';
    scroll.style.margin = '0';
    scroll.style.border = '0';
    scroll.style.height = this._rows * this._dy + 'px';
    scroll.style.width = 'auto';

    main.style.height = this._rows * this._dy + 'px';

    var screen = document.createElement('div');
    screen.style.position = 'relative';
    screen.style.display = 'inline-block';
    screen.style.padding = '0';
    screen.style.margin = '0';
    screen.style.border = '0';
    screen.style.width = this._cols * this._dx + 'px';
    screen.style.height = this._buff * this._dy + 'px';

    var caret = document.createElement('div');
    caret.style.display = 'inline-block';
    caret.style.width = this._dx - 2 + 'px';
    caret.style.height = '3px';
    caret.style.backgroundColor = '#fff';
    caret.style.color = '#000';
    caret.style.position = 'absolute';

    var hide = document.createElement('div');
    hide.style.display = 'inline-block';
    hide.style.padding = '0';
    hide.style.margin = '0';
    hide.style.border = '0';
    hide.style.width = '0';
    hide.style.height = '0';
    hide.style.position = 'absolute';
    hide.style.overflow = 'hidden';

    var tarea = document.createElement('textarea');
    tarea.style.padding = '0';
    tarea.style.margin = '0';
    tarea.style.border = '0';
    tarea.style.opacity = '0.1';
    tarea.style.outline = 'none';

    hide.appendChild(tarea);

    var pad = document.createElement('div');

    screen.appendChild(pad);
    screen.appendChild(caret);
    screen.appendChild(hide);
    scroll.appendChild(screen);
    main.appendChild(scroll);

    this._main = main;
    this._scroll = scroll;
    this._screen = screen;
    this._pad = pad;
    this._caret = caret;
    this._hide = hide;
    this._tarea = tarea;
    this._position();
    this._blink = function() {
      self._c = !self._c;
      caret.style.visibility = self._c ? 'visible' : 'hidden';
    }
    setInterval(this._blink, 500);

    main.addEventListener("focus", function() { tarea.focus(); }, false);
    tarea.addEventListener("input", function() {
      var val = tarea.value;
      for (var i = 0; i < val.length; i++) self._emit(val[i]);
      tarea.value = '';
    }, false);
    tarea.addEventListener("keypress", function(e) {
      if (e.charCode) {
return;
//        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
      }
      else {
        e.preventDefault(); 
        if (e.keyCode == 8) self._emit('\010');
        if (e.keyCode == 9) self._emit('\011');
        if (e.keyCode == 13) self._emit('\n');
        if (e.keyCode == 38) self._emit('\033[A'); // Up
        if (e.keyCode == 40) self._emit('\033[B'); // Down
        if (e.keyCode == 39) self._emit('\033[C'); // Right
        if (e.keyCode == 37) self._emit('\033[D'); // Left
      }

    }, false);
    var unhide = function(e) {
      var r = screen.getBoundingClientRect();
      hide.style.left = (e.clientX - Math.ceil(r.left)) + 'px';
      hide.style.top = (e.clientY - Math.ceil(r.top)) + 'px';
      hide.style.width = '1px';
      hide.style.height = '1px';
      setTimeout(function() { hide.style.width = '0'; hide.style.height = '0'; }, 0);
    }
    screen.addEventListener("mousedown", unhide, false);
    screen.addEventListener("mouseup", unhide, false);
  }
  TTY.prototype._update = function() {
    while (this._pad.lastChild) this._pad.removeChild(this._pad.lastChild);
    for (var i = 0; i < this._b.length; i++) {
      var row = document.createElement('div');
      row.style.padding = '0';
      row.style.margin = '0';
      row.style.border = '0';
      row.style.height = this._dy + 'px';
      if (this._b[i]) for (var j = 0; j < this._b[i].length; j++) {
        var col = document.createElement('div');
        col.style.display = 'inline-block';
        col.style.width = this._dx + 'px';
        col.style.height = this._dy + 'px';
        if (this._b[i][j]) {
          col.innerHTML = this._b[i][j].s;
          if (this._b[i][j].i && this._b[i][j].t === undefined) col.style.color = '#fff';
          if (this._b[i][j].t !== undefined) col.style.color = this._b[i][j].i && this._b[i][j].t < 8 ? this._color[this._b[i][j].t + 8] : this._color[this._b[i][j].t];
          if (this._b[i][j].b !== undefined) col.style.backgroundColor = this._color[this._b[i][j].b];
        }
        else col.innerHTML = ' ';
        row.appendChild(col);
      }
      this._pad.appendChild(row);
    }
    this._position();
  }
  TTY.prototype._flash = function() {
  }
  TTY.prototype._position = function() {
    this._caret.style.left = this._x * this._dx + 1 + 'px';
    this._caret.style.top = (this._y + 1) * this._dy - 5 + 'px';
    this._hide.style.left = this._x * this._dx + 'px';
    this._hide.style.top = this._y * this._dy + 'px';
    this._scroll.scrollTop = this._t * this._dy;
  }
  TTY.prototype._esc = function(i) {
    var j = i + 1;
    if (j >= this._o.length) return; // need more input
    var c = this._o[j];
    var cc;
    switch (c) {
      case '[':
        j++;
        if (j >= this._o.length) return;
        c = this._o[j]; cc = c.charCodeAt(0);
        if (cc >= 32 && cc <= 47) { // ignore private codes
          for (j++; j < this._o.length; j++) {
            if (this._o[j].charCodeAt(0) >= 64) return { n: j - i };
          }
          return; // need more input
        }
        var n = '';
        var a = [];
        for (; j < this._o.length; j++) {
          c = this._o[j]; cc = c.charCodeAt(0);
          if (cc >= 48 && cc <= 57) n += c;
          else if (c == ';') {
            a.push(parseInt(n)); n = '';
          }
          else { // if (cc >= 64)
            a.push(parseInt(n));
            return { n: j - i, c: '[', t: c, a: a.slice() };
          }
        }
        return; // need more input
      default:
        return { n: 1, c: c };
    }
  }
  TTY.prototype._char = function(ch) {
    if (!this._b[this._y]) this._b[this._y] = [];
    var c = { s: ch };
    if (this._a.i) c.i = this._a.i;
    if (this._a.t !== undefined) c.t = this._a.t;
    if (this._a.b !== undefined) c.b = this._a.b;
    this._b[this._y][this._x] = c;
    this._x++;
    if (this._x >= this._cols) {
      this._x = 0; this._y++;
      if (this._y - this._t >= this._rows) this._t++;
    }
  }
  TTY.prototype._emit = function(ch) {
    this.write(ch);
  }
  TTY.prototype.write = function(str) {
    this._o = this._o.concat((str + '').split(''));
    var i = 0;
    var wait = false;
    while (i < this._o.length && !wait) {
      if (this._bp) {
        if (this._o[i] == '\007') this._bp = false;
        else if (this._o[i] == '\033') {
          if (i == this._o.length -1) break;
          if (this._o[i + 1] == '\\') { this._bp = false; i++; }
        }
        i++; continue;
      }
      switch (this._o[i]) {
        case '\033':
          var esc = this._esc(i);
          if (esc) {
            i += esc.n;
            if (esc.c == 'c') { // reset
              this._x = 0; this._y = 0; this._t = 0; this._b = [];
            }
            if (esc.c == ']' || esc.c == 'X' || esc.c == '^' || esc.c == '_') { // bypass
              this._bp = true;
            }
            else if (esc.c == '[') {
              switch (esc.t) {
                case 'A': // cursor up
                  this._y -= isNaN(esc.a[0]) ? 1 : esc.a[0];
                  if (this._y < this._t) this._y = this._t;
                  break;
                case 'B': // cursor down
                  this._y += isNaN(esc.a[0]) ? 1 : esc.a[0];
                  if (this._y > this._t + this._rows - 1) this._y = this._t + this._rows - 1;
                  break;
                case 'C': // cursor right
                  this._x += isNaN(esc.a[0]) ? 1 : esc.a[0];
                  if (this._x > this._cols - 1) this._x = this._cols - 1;
                  break;
                case 'D': // cursor left
                  this._x -= isNaN(esc.a[0]) ? 1 : esc.a[0];
                  if (this._x < 0) this._x = 0;
                  break;
                case 'H': case 'f': // cursor position
                  this._y = this._t - 1 + (isNaN(esc.a[0]) ? 1 : esc.a[0]);
                  if (this._y < this._t) this._y = this._t;
                  if (this._y > this._t + this._rows - 1) this._y = this._t + this._rows - 1;
                  this._x = esc.a[1] === undefined || isNaN(esc.a[1]) ? 0 : esc.a[1] - 1;
                  if (this._x < 0) this._x = 0;
                  if (this._x > this._cols - 1) this._x = this._cols - 1;
                  break;
                case 'J': // clear screen
                  if (isNaN(esc.a[0]) || !esc.a[0]) {
                    if (this._b[this._y]) this._b[this._y].splice(this._x);
                    for (var n = this._y + 1; n < this._t + this._rows; n++) if (this._b[n]) this._b[n] = []
                  }
                  else if (esc.a[0] == 1) {
                    if (this._b[this._y]) {
                      if (this._b[this._y].length <= this._x + 1) this._b[this._y] = [];
                      else for (var n = 0; n <= this._x; n++) delete this._b[this._y][n];
                    }
                    for (var n = this._t; n < this._y; n++) if (this._b[n]) this._b[n] = []
                  }
                  else if (esc.a[0] == 2) for (var n = this._t; n < this._t + this._rows; n++) if (this._b[n]) this._b[n] = [];
                  break;
                case 'K': // clear line
                  if (this._b[this._y]) {
                    if (isNaN(esc.a[0]) || !esc.a[0]) this._b[this._y].splice(this._x);
                    else if (esc.a[0] == 1) {
                      if (this._b[this._y].length <= this._x + 1) this._b[this._y] = [];
                      else for (var n = 0; n <= this._x; n++) delete this._b[this._y][n];
                    }
                    else if (esc.a[0] == 2) this._b[this._y] = [];
                  }
                  break;
                case 'm': // set attribute
                  for (var k = 0; k < esc.a.length; k++) {
                    if (isNaN(esc.a[k]) || !esc.a[k]) this._a = {};
                    else if (esc.a[k] == 1) this._a.i = true;
                    else if (esc.a[k] >= 30 && esc.a[k] <= 37) this._a.t = esc.a[k] - 30;
                    else if (esc.a[k] == 39) delete this._a.f;
                    else if (esc.a[k] >= 40 && esc.a[k] <= 47) this._a.b = esc.a[k] - 40;
                    else if (esc.a[k] == 49) delete this._a.b;
                  }
                  break;
              }
            }
          }
          else { wait = true; i--; }
          break;
        case '\010':  // bkspace
          if (this._x) this._x--;
          break;
        case '\t':  // \011 = tab
          var n = this._x - this._x % 8 + 8;
          if (n > this._cols) n = this._cols;
          n -= this._x;
          for (var k = 0; k < n; k++) this._char(' ');
          break;
        case '\r':
          this._x = 0; break;
        case '\n':
          this._x = 0; this._y++;
          if (this._y - this._t >= this._rows) this._t++;
          break;
        default:
          this._char(this._o[i]);
      }
      i++;
    }
    this._o.splice(0, i);
    if (!this._dirty) {
      this._dirty = true;
      setTimeout(this._refresh, 0);
    }
  }
  TTY.prototype.focus = function() { this._tarea.focus(); }
  tty = function(param) {
    if (!param) param = {};
    var at = param.at;
    if (typeof at === 'string') at = document.getElementById(at);
    var tty = new TTY(25, 80, 35);
    try {
      tty._create(at);
    }
    catch(e) {
      at = document.createElement('div');
      document.body.appendChild(at);
      tty._create(at);
    }
    return tty;
  }

})();