(function () {
    window.Vimulator = {};

    Vimulator.Base = function () {
        this.init.apply(this, arguments);
    };

    Vimulator.Base.prototype.init = function (container) {
        this.modes = {
            normal: new Vimulator.NormalMode(this),
            insert: new Vimulator.InsertMode(this)
        };

        this.container = $(container).addClass('vimulator');
        this.textContainer = this.container.find('pre');
        this.commandList = this.container.find('ol');
        this.bindKeyListeners();

        this.setMode("normal");
        this.cursor = {row: 0, col: 0};
        this.lines = this.textContainer.text().split('\n');

        this.render();
    };

    Vimulator.Base.prototype.setMode = function (name) {
        this.mode = this.modes[name];
        if (!this.mode) {
            throw new Error("Illegal mode");
        }
    };

    Vimulator.Base.prototype.bindKeyListeners = function () {
        var vim = this;

        // Use keyup for special characters like escape
        $(window).keyup(function (e) {
            if (e.keyCode === 27) {
                vim.keyPress(e.keyCode);
                return false;
            }
        });

        // Use keypress for general characters
        $(window).keypress(function (e) {
            vim.keyPress(e.keyCode);
            return false;
        });
    };

    Vimulator.Base.prototype.keyPress = function (code) {
        var chr, op;
        chr = String.fromCharCode(code);
        op = this.mode.keyPress(chr);
        this.render(op);
    };

    Vimulator.Base.prototype.render = function (op) {
        var vim, rendered;

        vim = this;
        rendered = jQuery.map(this.lines, function (line, i) {
            var chr;

            if (i == vim.cursor.row) {
                chr = line.substr(vim.cursor.col, 1) || ' ';
                return line.substr(0, vim.cursor.col) +
                       '<mark class="cursor">' + chr + '</mark>' +
                       line.substr(vim.cursor.col + 1);
            } else {
                return line;
            }
        });

        this.textContainer
                .html(rendered.join('\n'))
                .attr('class', this.mode.name);
    };

    Vimulator.Base.prototype.moveCursorRow = function (row) {
        this.cursor.row = row;
        if (row === '$' || this.cursor.row >= this.lines.length) {
            this.cursor.row = this.lines.length - 1;
        }
        if (this.cursor.row < 0) {
            this.cursor.row = 0;
        }
    };
    Vimulator.Base.prototype.moveCursorCol = function (col) {
        this.cursor.col = col;
        if (col === '$' || this.cursor.col >= this.lines[this.cursor.row].length) {
            this.cursor.col = this.lines[this.cursor.row].length - 1;
        }
        if (this.cursor.col < 0) {
            this.cursor.col = 0;
        }
    };
    Vimulator.Base.prototype.moveCursor = function(row, col) {
        this.moveCursorRow(row);
        this.moveCursorCol(col);
    };
    Vimulator.Base.prototype.moveCursorRelative = function(rows, cols) {
        var row, col;
        if (rows === '$') { row = '$'; } else { row = this.cursor.row + rows; }
        if (cols === '$') { col = '$'; } else { col = this.cursor.col + cols; }
        return this.moveCursor(row, col);
    };

    Vimulator.Base.prototype.currentLine = function () {
        return this.lines[this.cursor.row];
    };

    Vimulator.Base.prototype.appendText = function (text) {
        line = this.currentLine();
        this.lines[this.cursor.row] =
                line.substr(0, this.cursor.col) +
                text +
                line.substr(this.cursor.col);
        this.cursor.col += text.length;
    };

    Vimulator.Base.prototype.insertRowBelow = function (text, index) {
        index = index || this.cursor.row;
        this.lines.splice(index + 1, 0, text);
    };
    Vimulator.Base.prototype.insertRowAbove = function (text, index) {
        index = index || this.cursor.row;
        this.lines.splice(index, 0, text);
    };
    Vimulator.Base.prototype.replaceRow = function (text, index) {
        index = (typeof index === "undefined" ? this.cursor.row : index);
        this.lines[index] = text;
    };
    Vimulator.Base.prototype.removeRows = function (start, end) {
        this.lines.splice(start, end - start);
    };

    Vimulator.Base.prototype.removeRange = function(start, end) {
        if (start.row > end.row || start.row == end.row && start.col > end.col) {
            return this.removeRange(end, start);
        }

        this.lines[start.row] = 
                this.lines[start.row].substr(0, start.col) +
                this.lines[end.row].substr(end.col);

        this.lines.splice(start.row + 1, end.row - start.row);
        this.moveCursor(start.row, start.col);
    };
}());