"use strict";
const LEVELS = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 },
};
const NUMBER_COLORS = {
    1: '#4aa3ff',
    2: '#4fd17a',
    3: '#ff6b6b',
    4: '#b18cff',
    5: '#ffa94d',
    6: '#38d9c9',
    7: '#f4efe6',
    8: '#a39d92',
};
const DEFAULT_SETTINGS = {
    chord: { both: true, singleOnNumber: true, middle: true },
};
const STORE_KEY = 'xiaoos-mines-settings';
const BEST_KEY = 'xiaoos-mines-best';
const COMPONENT_CAP = 20;
function neighborOffsets() {
    return [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];
}
function isSolvable(_mine, count, start, R, C, totalMines) {
    const revealed = Array.from({ length: R }, () => new Array(C).fill(false));
    const knownMine = Array.from({ length: R }, () => new Array(C).fill(false));
    const offsets = neighborOffsets();
    const inBounds = (r, c) => r >= 0 && r < R && c >= 0 && c < C;
    let revealedCount = 0;
    const floodReveal = (sr, sc) => {
        const stack = [[sr, sc]];
        while (stack.length > 0) {
            const top = stack.pop();
            if (!top)
                break;
            const [r, c] = top;
            if (revealed[r][c])
                continue;
            revealed[r][c] = true;
            revealedCount++;
            if (count[r][c] === 0) {
                for (const [dr, dc] of offsets) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (inBounds(nr, nc) && !revealed[nr][nc])
                        stack.push([nr, nc]);
                }
            }
        }
    };
    floodReveal(start.row, start.col);
    const hiddenNeighbors = (r, c) => {
        const out = [];
        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && !revealed[nr][nc] && !knownMine[nr][nc])
                out.push([nr, nc]);
        }
        return out;
    };
    const knownMinesAround = (r, c) => {
        let m = 0;
        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && knownMine[nr][nc])
                m++;
        }
        return m;
    };
    const totalCells = R * C;
    const safeTotal = totalCells - totalMines;
    let guard = 0;
    while (revealedCount < safeTotal && guard++ < totalCells * 4) {
        let progress = false;
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (!revealed[r][c] || count[r][c] === 0)
                    continue;
                const hidden = hiddenNeighbors(r, c);
                if (hidden.length === 0)
                    continue;
                const rem = count[r][c] - knownMinesAround(r, c);
                if (rem === 0) {
                    for (const [hr, hc] of hidden) {
                        if (!revealed[hr][hc]) {
                            floodReveal(hr, hc);
                            progress = true;
                        }
                    }
                }
                else if (rem === hidden.length) {
                    for (const [hr, hc] of hidden) {
                        if (!knownMine[hr][hc]) {
                            knownMine[hr][hc] = true;
                            progress = true;
                        }
                    }
                }
            }
        }
        if (progress)
            continue;
        const constraints = [];
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (!revealed[r][c] || count[r][c] === 0)
                    continue;
                const hidden = hiddenNeighbors(r, c);
                if (hidden.length === 0)
                    continue;
                const rem = count[r][c] - knownMinesAround(r, c);
                constraints.push({
                    cells: hidden,
                    mines: rem,
                    key: hidden.map(([a, b]) => `${a},${b}`).sort().join('|'),
                });
            }
        }
        for (const a of constraints) {
            for (const b of constraints) {
                if (a === b)
                    continue;
                if (a.cells.length >= b.cells.length)
                    continue;
                const bset = new Set(b.cells.map(([r, c]) => `${r},${c}`));
                const aIsSubset = a.cells.every(([r, c]) => bset.has(`${r},${c}`));
                if (!aIsSubset)
                    continue;
                const diff = b.cells.filter(([r, c]) => !a.cells.some(([ar, ac]) => ar === r && ac === c));
                const diffMines = b.mines - a.mines;
                if (diffMines === 0) {
                    for (const [r, c] of diff) {
                        if (!revealed[r][c] && !knownMine[r][c]) {
                            floodReveal(r, c);
                            progress = true;
                        }
                    }
                }
                else if (diffMines === diff.length) {
                    for (const [r, c] of diff) {
                        if (!knownMine[r][c]) {
                            knownMine[r][c] = true;
                            progress = true;
                        }
                    }
                }
            }
        }
        if (progress)
            continue;
        progress = enumerateComponents(constraints, floodReveal, knownMine, R, C, revealed);
        if (progress)
            continue;
        let knownMineTotal = 0;
        for (let r = 0; r < R; r++)
            for (let c = 0; c < C; c++)
                if (knownMine[r][c])
                    knownMineTotal++;
        const minesLeft = totalMines - knownMineTotal;
        const hiddenLeft = [];
        for (let r = 0; r < R; r++)
            for (let c = 0; c < C; c++) {
                if (!revealed[r][c] && !knownMine[r][c])
                    hiddenLeft.push([r, c]);
            }
        if (minesLeft === 0) {
            for (const [r, c] of hiddenLeft) {
                floodReveal(r, c);
                progress = true;
            }
        }
        else if (minesLeft === hiddenLeft.length) {
            for (const [r, c] of hiddenLeft) {
                knownMine[r][c] = true;
                progress = true;
            }
        }
        if (!progress)
            break;
    }
    return revealedCount >= safeTotal;
}
function enumerateComponents(constraints, floodReveal, knownMine, _R, _C, revealed) {
    if (constraints.length === 0)
        return false;
    const cellId = new Map();
    const idCell = [];
    const idFor = (r, c) => {
        const k = `${r},${c}`;
        let id = cellId.get(k);
        if (id === undefined) {
            id = idCell.length;
            cellId.set(k, id);
            idCell.push([r, c]);
        }
        return id;
    };
    const conCells = constraints.map((con) => con.cells.map(([r, c]) => idFor(r, c)));
    const parent = idCell.map((_, i) => i);
    const find = (x) => { while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    } return x; };
    const union = (a, b) => { parent[find(a)] = find(b); };
    for (const cells of conCells) {
        for (let i = 1; i < cells.length; i++)
            union(cells[0], cells[i]);
    }
    const compCells = new Map();
    idCell.forEach((_, id) => {
        const root = find(id);
        const arr = compCells.get(root) ?? [];
        arr.push(id);
        compCells.set(root, arr);
    });
    let progress = false;
    for (const [, cells] of compCells) {
        if (cells.length > COMPONENT_CAP)
            continue;
        const local = constraints.filter((con) => con.cells.some(([r, c]) => find(idFor(r, c)) === find(cells[0])));
        const index = new Map();
        cells.forEach((id, i) => index.set(id, i));
        const localCons = local.map((con) => ({
            idx: con.cells.map(([r, c]) => index.get(idFor(r, c))),
            mines: con.mines,
        }));
        const n = cells.length;
        const assign = new Array(n).fill(-1);
        const everMine = new Array(n).fill(false);
        const everSafe = new Array(n).fill(false);
        let solutions = 0;
        const consistent = (upTo) => {
            for (const con of localCons) {
                let sum = 0;
                let unknown = 0;
                for (const i of con.idx) {
                    if (i <= upTo && assign[i] !== -1)
                        sum += assign[i];
                    else
                        unknown++;
                }
                if (sum > con.mines)
                    return false;
                if (sum + unknown < con.mines)
                    return false;
            }
            return true;
        };
        const recurse = (i) => {
            if (solutions > 200000)
                return;
            if (i === n) {
                solutions++;
                for (let k = 0; k < n; k++) {
                    if (assign[k] === 1)
                        everMine[k] = true;
                    else
                        everSafe[k] = true;
                }
                return;
            }
            for (const v of [0, 1]) {
                assign[i] = v;
                if (consistent(i))
                    recurse(i + 1);
            }
            assign[i] = -1;
        };
        recurse(0);
        if (solutions === 0)
            continue;
        for (let i = 0; i < n; i++) {
            const [r, c] = idCell[cells[i]];
            if (!everMine[i] && everSafe[i]) {
                if (!revealed[r][c] && !knownMine[r][c]) {
                    floodReveal(r, c);
                    progress = true;
                }
            }
            else if (everMine[i] && !everSafe[i]) {
                if (!knownMine[r][c]) {
                    knownMine[r][c] = true;
                    progress = true;
                }
            }
        }
    }
    return progress;
}
function compute3BV(mine, count, R, C) {
    const offsets = neighborOffsets();
    const inBounds = (r, c) => r >= 0 && r < R && c >= 0 && c < C;
    const visited = Array.from({ length: R }, () => new Array(C).fill(false));
    let bbbv = 0;
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (mine[r][c] || visited[r][c] || count[r][c] !== 0)
                continue;
            bbbv++;
            const stack = [[r, c]];
            while (stack.length > 0) {
                const top = stack.pop();
                if (!top)
                    break;
                const [cr, cc] = top;
                if (visited[cr][cc])
                    continue;
                visited[cr][cc] = true;
                if (count[cr][cc] === 0) {
                    for (const [dr, dc] of offsets) {
                        const nr = cr + dr;
                        const nc = cc + dc;
                        if (inBounds(nr, nc) && !mine[nr][nc] && !visited[nr][nc])
                            stack.push([nr, nc]);
                    }
                }
            }
        }
    }
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (!mine[r][c] && !visited[r][c] && count[r][c] > 0)
                bbbv++;
        }
    }
    return bbbv;
}
class Minesweeper {
    constructor() {
        this.board = [];
        this.cellEls = [];
        this.rows = 9;
        this.cols = 9;
        this.mines = 10;
        this.mode = 'standard';
        this.level = 'beginner';
        this.started = false;
        this.over = false;
        this.won = false;
        this.flags = 0;
        this.revealedSafe = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.bbbv = 0;
        this.bbbvDone = 0;
        this.leftClicks = 0;
        this.rightClicks = 0;
        this.chordClicks = 0;
        this.settings = structuredCloneSettings(DEFAULT_SETTINGS);
        this.buttons = new Set();
        this.chordHandled = false;
        this.boardEl = document.getElementById('ms-board');
        this.mineEl = document.getElementById('ms-mines');
        this.timeEl = document.getElementById('ms-time');
        this.faceEl = document.getElementById('ms-face');
        this.bbbvEl = document.getElementById('ms-bbbv');
        this.bbbvRateEl = document.getElementById('ms-bbbv-rate');
        this.ioeEl = document.getElementById('ms-ioe');
        this.clicksEl = document.getElementById('ms-clicks');
        this.statusEl = document.getElementById('ms-status');
        this.bestEl = document.getElementById('ms-best');
        this.genEl = document.getElementById('ms-gen');
        this.loadSettings();
        this.bindChrome();
        this.bindBoard();
        this.applyLevel('beginner');
    }
    loadSettings() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.chord)
                    this.settings.chord = { ...DEFAULT_SETTINGS.chord, ...parsed.chord };
            }
        }
        catch { }
        this.syncSettingsUI();
    }
    saveSettings() {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(this.settings));
        }
        catch { }
    }
    syncSettingsUI() {
        document.getElementById('opt-chord-both').checked = this.settings.chord.both;
        document.getElementById('opt-chord-single').checked = this.settings.chord.singleOnNumber;
        document.getElementById('opt-chord-middle').checked = this.settings.chord.middle;
    }
    bindChrome() {
        document.querySelectorAll('[data-mode]').forEach((el) => {
            el.addEventListener('click', () => {
                this.mode = el.dataset.mode;
                document.querySelectorAll('[data-mode]').forEach((m) => m.classList.toggle('is-active', m === el));
                this.newGame();
            });
        });
        document.querySelectorAll('[data-level]').forEach((el) => {
            el.addEventListener('click', () => {
                const lvl = el.dataset.level;
                if (lvl === 'custom') {
                    this.openCustom();
                    return;
                }
                document.querySelectorAll('[data-level]').forEach((m) => m.classList.toggle('is-active', m === el));
                this.applyLevel(lvl);
            });
        });
        this.faceEl.addEventListener('click', () => this.newGame());
        const gear = document.getElementById('ms-gear');
        const panel = document.getElementById('ms-settings');
        gear.addEventListener('click', () => panel.classList.toggle('open'));
        document.getElementById('ms-settings-close').addEventListener('click', () => panel.classList.remove('open'));
        const bindOpt = (id, set) => {
            document.getElementById(id).addEventListener('change', (e) => {
                set(e.target.checked);
                this.saveSettings();
            });
        };
        bindOpt('opt-chord-both', (v) => { this.settings.chord.both = v; });
        bindOpt('opt-chord-single', (v) => { this.settings.chord.singleOnNumber = v; });
        bindOpt('opt-chord-middle', (v) => { this.settings.chord.middle = v; });
        document.getElementById('ms-custom-apply').addEventListener('click', () => this.applyCustom());
        document.getElementById('ms-custom-cancel').addEventListener('click', () => {
            document.getElementById('ms-custom').classList.remove('open');
        });
    }
    openCustom() {
        const dlg = document.getElementById('ms-custom');
        document.getElementById('cf-rows').value = String(this.rows);
        document.getElementById('cf-cols').value = String(this.cols);
        document.getElementById('cf-mines').value = String(this.mines);
        dlg.classList.add('open');
    }
    applyCustom() {
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const rows = clamp(parseInt(document.getElementById('cf-rows').value, 10) || 9, 5, 40);
        const cols = clamp(parseInt(document.getElementById('cf-cols').value, 10) || 9, 5, 50);
        const maxMines = rows * cols - 9;
        const mines = clamp(parseInt(document.getElementById('cf-mines').value, 10) || 10, 1, maxMines);
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.level = 'custom';
        document.querySelectorAll('[data-level]').forEach((m) => m.classList.toggle('is-active', m.dataset.level === 'custom'));
        document.getElementById('ms-custom').classList.remove('open');
        this.newGame();
    }
    applyLevel(level) {
        const d = LEVELS[level];
        this.level = level;
        this.rows = d.rows;
        this.cols = d.cols;
        this.mines = d.mines;
        this.newGame();
    }
    newGame() {
        this.stopTimer();
        this.started = false;
        this.over = false;
        this.won = false;
        this.flags = 0;
        this.revealedSafe = 0;
        this.timer = 0;
        this.bbbv = 0;
        this.bbbvDone = 0;
        this.leftClicks = 0;
        this.rightClicks = 0;
        this.chordClicks = 0;
        this.buttons.clear();
        this.chordHandled = false;
        this.genEl.classList.remove('show');
        this.board = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => ({
            mine: false, revealed: false, flagged: false, count: 0, exploded: false, wrongFlag: false,
        })));
        this.buildGrid();
        this.setFace('idle');
        this.setStatus('READY');
        this.updateHud();
        this.renderBest();
    }
    buildGrid() {
        this.boardEl.style.setProperty('--cols', String(this.cols));
        this.boardEl.innerHTML = '';
        this.cellEls = [];
        const frag = document.createDocumentFragment();
        for (let r = 0; r < this.rows; r++) {
            const rowEls = [];
            for (let c = 0; c < this.cols; c++) {
                const el = document.createElement('div');
                el.className = 'ms-cell';
                el.dataset.r = String(r);
                el.dataset.c = String(c);
                frag.appendChild(el);
                rowEls.push(el);
            }
            this.cellEls.push(rowEls);
        }
        this.boardEl.appendChild(frag);
    }
    placeMines(safe) {
        const attemptsCap = this.mode === 'noguess' ? 1200 : 1;
        for (let attempt = 0; attempt < attemptsCap; attempt++) {
            const mine = this.randomLayout(safe);
            const count = this.countsFor(mine);
            if (this.mode === 'standard') {
                this.commitLayout(mine, count);
                return;
            }
            if (isSolvable(mine, count, safe, this.rows, this.cols, this.mines)) {
                this.commitLayout(mine, count);
                return;
            }
        }
        const mine = this.randomLayout(safe);
        this.commitLayout(mine, this.countsFor(mine));
    }
    randomLayout(safe) {
        const mine = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
        const forbidden = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = safe.row + dr;
                const c = safe.col + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols)
                    forbidden.add(`${r},${c}`);
            }
        }
        if (this.rows * this.cols - forbidden.size < this.mines) {
            forbidden.clear();
            forbidden.add(`${safe.row},${safe.col}`);
        }
        let placed = 0;
        while (placed < this.mines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            if (mine[r][c] || forbidden.has(`${r},${c}`))
                continue;
            mine[r][c] = true;
            placed++;
        }
        return mine;
    }
    countsFor(mine) {
        const offsets = neighborOffsets();
        const count = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (mine[r][c])
                    continue;
                let n = 0;
                for (const [dr, dc] of offsets) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && mine[nr][nc])
                        n++;
                }
                count[r][c] = n;
            }
        }
        return count;
    }
    commitLayout(mine, count) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.board[r][c].mine = mine[r][c];
                this.board[r][c].count = count[r][c];
            }
        }
        this.bbbv = compute3BV(mine, count, this.rows, this.cols);
    }
    bindBoard() {
        this.boardEl.addEventListener('contextmenu', (e) => e.preventDefault());
        this.boardEl.addEventListener('mousedown', (e) => {
            const cell = this.cellFromEvent(e);
            if (this.over)
                return;
            this.buttons.add(e.button);
            if (cell && this.buttons.has(0))
                this.setFace('suspense');
            const both = this.buttons.has(0) && this.buttons.has(2);
            if (cell && both && this.settings.chord.both) {
                this.chord(cell.r, cell.c);
                this.chordHandled = true;
            }
            e.preventDefault();
        });
        window.addEventListener('mouseup', (e) => {
            const cell = this.cellFromEvent(e);
            const wasChord = this.chordHandled;
            this.buttons.delete(e.button);
            if (this.buttons.size === 0)
                this.chordHandled = false;
            if (this.over || !cell) {
                if (!this.over)
                    this.setFaceBack();
                return;
            }
            if (wasChord) {
                this.setFaceBack();
                return;
            }
            if (e.button === 0) {
                this.handleLeft(cell.r, cell.c);
            }
            else if (e.button === 2) {
                this.handleRight(cell.r, cell.c);
            }
            else if (e.button === 1 && this.settings.chord.middle) {
                this.chord(cell.r, cell.c);
            }
            this.setFaceBack();
        });
    }
    cellFromEvent(e) {
        const target = e.target;
        if (!target || !target.classList.contains('ms-cell'))
            return null;
        return { r: Number(target.dataset.r), c: Number(target.dataset.c) };
    }
    setFaceBack() {
        if (this.over)
            return;
        this.setFace(this.started ? 'playing' : 'idle');
    }
    handleLeft(r, c) {
        const cell = this.board[r][c];
        if (cell.flagged)
            return;
        if (cell.revealed) {
            if (this.settings.chord.singleOnNumber && cell.count > 0)
                this.chord(r, c);
            return;
        }
        if (!this.started)
            this.begin(r, c);
        this.leftClicks++;
        this.reveal(r, c);
        this.postMove();
    }
    handleRight(r, c) {
        const cell = this.board[r][c];
        if (cell.revealed)
            return;
        if (!this.started) {
        }
        cell.flagged = !cell.flagged;
        this.flags += cell.flagged ? 1 : -1;
        this.rightClicks++;
        this.paintCell(r, c);
        this.updateHud();
    }
    chord(r, c) {
        const cell = this.board[r][c];
        if (!cell.revealed || cell.count === 0)
            return;
        const offsets = neighborOffsets();
        let flagged = 0;
        const targets = [];
        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols)
                continue;
            const n = this.board[nr][nc];
            if (n.flagged)
                flagged++;
            else if (!n.revealed)
                targets.push([nr, nc]);
        }
        if (flagged !== cell.count || targets.length === 0)
            return;
        this.chordClicks++;
        for (const [nr, nc] of targets)
            this.reveal(nr, nc);
        this.postMove();
    }
    begin(r, c) {
        this.started = true;
        if (this.mode === 'noguess') {
            this.genEl.classList.add('show');
            void this.boardEl.offsetWidth;
        }
        this.placeMines({ row: r, col: c });
        this.genEl.classList.remove('show');
        this.startTimer();
        this.setFace('playing');
        this.setStatus(this.mode === 'noguess' ? 'NO-GUESS' : 'LIVE');
    }
    reveal(r, c) {
        const cell = this.board[r][c];
        if (cell.revealed || cell.flagged)
            return;
        if (cell.mine) {
            cell.revealed = true;
            cell.exploded = true;
            this.lose();
            return;
        }
        const offsets = neighborOffsets();
        const stack = [[r, c]];
        while (stack.length > 0) {
            const top = stack.pop();
            if (!top)
                break;
            const [cr, cc] = top;
            const cur = this.board[cr][cc];
            if (cur.revealed || cur.flagged || cur.mine)
                continue;
            cur.revealed = true;
            this.revealedSafe++;
            this.paintCell(cr, cc);
            if (cur.count === 0) {
                for (const [dr, dc] of offsets) {
                    const nr = cr + dr;
                    const nc = cc + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols)
                        stack.push([nr, nc]);
                }
            }
        }
    }
    postMove() {
        if (this.over)
            return;
        this.recomputeProgress();
        this.updateHud();
        if (this.revealedSafe === this.rows * this.cols - this.mines)
            this.win();
    }
    recomputeProgress() {
        const mine = this.board.map((row) => row.map((x) => x.mine));
        const count = this.board.map((row) => row.map((x) => x.count));
        const offsets = neighborOffsets();
        const visited = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
        let done = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (mine[r][c] || visited[r][c] || count[r][c] !== 0)
                    continue;
                let allRevealed = true;
                const region = [];
                const stack = [[r, c]];
                while (stack.length > 0) {
                    const top = stack.pop();
                    const [cr, cc] = top;
                    if (visited[cr][cc])
                        continue;
                    visited[cr][cc] = true;
                    region.push([cr, cc]);
                    if (!this.board[cr][cc].revealed)
                        allRevealed = false;
                    if (count[cr][cc] === 0) {
                        for (const [dr, dc] of offsets) {
                            const nr = cr + dr;
                            const nc = cc + dc;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && !mine[nr][nc] && !visited[nr][nc])
                                stack.push([nr, nc]);
                        }
                    }
                }
                if (allRevealed)
                    done++;
            }
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!mine[r][c] && !visited[r][c] && count[r][c] > 0 && this.board[r][c].revealed)
                    done++;
            }
        }
        this.bbbvDone = done;
    }
    lose() {
        this.over = true;
        this.stopTimer();
        this.setFace('lose');
        this.setStatus('BOOM');
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell.mine && !cell.flagged)
                    cell.revealed = true;
                if (cell.flagged && !cell.mine)
                    cell.wrongFlag = true;
                this.paintCell(r, c);
            }
        }
        this.updateHud();
    }
    win() {
        this.over = true;
        this.won = true;
        this.stopTimer();
        this.setFace('win');
        this.setStatus('CLEAR');
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell.mine && !cell.flagged) {
                    cell.flagged = true;
                    this.flags++;
                }
                this.paintCell(r, c);
            }
        }
        this.saveBest();
        this.updateHud();
        this.renderBest();
    }
    paintCell(r, c) {
        const cell = this.board[r][c];
        const el = this.cellEls[r][c];
        el.className = 'ms-cell';
        el.textContent = '';
        el.style.color = '';
        if (cell.flagged) {
            el.classList.add('flag');
            el.textContent = '⚑';
            return;
        }
        if (!cell.revealed)
            return;
        el.classList.add('open');
        if (cell.mine) {
            el.classList.add('mine');
            if (cell.exploded)
                el.classList.add('boom');
            el.textContent = '✷';
            return;
        }
        if (cell.wrongFlag) {
            el.classList.add('wrong');
            el.textContent = '✕';
            return;
        }
        if (cell.count > 0) {
            el.textContent = String(cell.count);
            el.style.color = NUMBER_COLORS[cell.count] ?? '#f4efe6';
        }
    }
    setFace(state) {
        const glyphs = {
            idle: '◉', playing: '◉', suspense: '◎', win: '✓', lose: '✕',
        };
        this.faceEl.textContent = glyphs[state];
        this.faceEl.dataset.state = state;
    }
    setStatus(text) {
        this.statusEl.textContent = text;
    }
    startTimer() {
        this.timerInterval = window.setInterval(() => {
            this.timer++;
            this.updateHud();
        }, 1000);
    }
    stopTimer() {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    updateHud() {
        const remaining = this.mines - this.flags;
        this.mineEl.textContent = this.pad(remaining);
        this.timeEl.textContent = this.pad(this.timer);
        this.bbbvEl.textContent = `${this.bbbvDone}/${this.bbbv || '—'}`;
        const rate = this.timer > 0 ? (this.bbbvDone / this.timer) : 0;
        this.bbbvRateEl.textContent = rate > 0 ? rate.toFixed(2) : '0.00';
        const effectiveClicks = this.leftClicks + this.chordClicks;
        const ioe = effectiveClicks > 0 ? Math.round((this.bbbvDone / effectiveClicks) * 100) : 0;
        this.ioeEl.textContent = `${ioe}%`;
        this.clicksEl.textContent = `${this.leftClicks}L / ${this.rightClicks}R / ${this.chordClicks}C`;
    }
    pad(n) {
        if (n < 0)
            return '-' + String(Math.min(99, -n)).padStart(2, '0');
        return String(Math.min(999, n)).padStart(3, '0');
    }
    bestKey() {
        return `${this.mode}:${this.level}:${this.rows}x${this.cols}:${this.mines}`;
    }
    saveBest() {
        if (!this.won)
            return;
        try {
            const store = this.readBest();
            const key = this.bestKey();
            const prev = store[key];
            if (prev === undefined || this.timer < prev) {
                store[key] = this.timer;
                localStorage.setItem(BEST_KEY, JSON.stringify(store));
            }
        }
        catch { }
    }
    readBest() {
        try {
            const raw = localStorage.getItem(BEST_KEY);
            return raw ? JSON.parse(raw) : {};
        }
        catch {
            return {};
        }
    }
    renderBest() {
        const store = this.readBest();
        const rows = [];
        const label = { beginner: 'BEGINNER', intermediate: 'INTERMEDIATE', expert: 'EXPERT', custom: 'CUSTOM' };
        for (const lvl of ['beginner', 'intermediate', 'expert']) {
            const d = LEVELS[lvl];
            const stdKey = `standard:${lvl}:${d.rows}x${d.cols}:${d.mines}`;
            const ngKey = `noguess:${lvl}:${d.rows}x${d.cols}:${d.mines}`;
            const std = store[stdKey];
            const ng = store[ngKey];
            rows.push(`<div class="ms-best-row"><span>${label[lvl]}</span>` +
                `<span class="ms-best-val">${std !== undefined ? std + 's' : '—'}</span>` +
                `<span class="ms-best-val ng">${ng !== undefined ? ng + 's' : '—'}</span></div>`);
        }
        this.bestEl.innerHTML = rows.join('');
    }
}
function structuredCloneSettings(s) {
    return { chord: { ...s.chord } };
}
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
//# sourceMappingURL=minesweeper.js.map