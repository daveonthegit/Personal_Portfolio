/**
 * xiaoOS — minesweeper.exe
 * A minesweeper.online-style engine (chording, 3BV / 3BV-s / IOE stats,
 * no-guessing mode backed by a deterministic logical solver) wearing the
 * xiaoOS command-center skin.
 */

// ===== Types =====

type Mode = 'standard' | 'noguess';
type Level = 'beginner' | 'intermediate' | 'expert' | 'custom';

interface Cell {
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    count: number;
    exploded: boolean;
    wrongFlag: boolean;
}

interface Dims {
    rows: number;
    cols: number;
    mines: number;
}

interface ChordSettings {
    both: boolean;          // press left + right together on a number
    singleOnNumber: boolean; // left-click an already-revealed number
    middle: boolean;        // middle-mouse on a number
}

interface Settings {
    chord: ChordSettings;
}

const LEVELS: Record<Exclude<Level, 'custom'>, Dims> = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 },
};

const NUMBER_COLORS: Record<number, string> = {
    1: '#4aa3ff',
    2: '#4fd17a',
    3: '#ff6b6b',
    4: '#b18cff',
    5: '#ffa94d',
    6: '#38d9c9',
    7: '#f4efe6',
    8: '#a39d92',
};

const DEFAULT_SETTINGS: Settings = {
    chord: { both: true, singleOnNumber: true, middle: true },
};

const STORE_KEY = 'xiaoos-mines-settings';
const BEST_KEY = 'xiaoos-mines-best';

// ===== Solver =====
// Plays a fully-known board using only player-visible information to decide
// whether it can be cleared without ever guessing. Used to vet boards for
// no-guessing mode.

const COMPONENT_CAP = 20; // largest frontier component we brute-force

function neighborOffsets(): ReadonlyArray<readonly [number, number]> {
    return [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];
}

function isSolvable(
    _mine: boolean[][],
    count: number[][],
    start: { row: number; col: number },
    R: number,
    C: number,
    totalMines: number,
): boolean {
    const revealed: boolean[][] = Array.from({ length: R }, () => new Array<boolean>(C).fill(false));
    const knownMine: boolean[][] = Array.from({ length: R }, () => new Array<boolean>(C).fill(false));
    const offsets = neighborOffsets();

    const inBounds = (r: number, c: number): boolean => r >= 0 && r < R && c >= 0 && c < C;

    let revealedCount = 0;
    const floodReveal = (sr: number, sc: number): void => {
        const stack: Array<[number, number]> = [[sr, sc]];
        while (stack.length > 0) {
            const top = stack.pop();
            if (!top) break;
            const [r, c] = top;
            if (revealed[r]![c]) continue;
            revealed[r]![c] = true;
            revealedCount++;
            if (count[r]![c] === 0) {
                for (const [dr, dc] of offsets) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (inBounds(nr, nc) && !revealed[nr]![nc]) stack.push([nr, nc]);
                }
            }
        }
    };

    floodReveal(start.row, start.col);

    const hiddenNeighbors = (r: number, c: number): Array<[number, number]> => {
        const out: Array<[number, number]> = [];
        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && !revealed[nr]![nc] && !knownMine[nr]![nc]) out.push([nr, nc]);
        }
        return out;
    };

    const knownMinesAround = (r: number, c: number): number => {
        let m = 0;
        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (inBounds(nr, nc) && knownMine[nr]![nc]) m++;
        }
        return m;
    };

    const totalCells = R * C;
    const safeTotal = totalCells - totalMines;

    let guard = 0;
    while (revealedCount < safeTotal && guard++ < totalCells * 4) {
        let progress = false;

        // Rule 1: trivial satisfied / fully-mined constraints.
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (!revealed[r]![c] || count[r]![c] === 0) continue;
                const hidden = hiddenNeighbors(r, c);
                if (hidden.length === 0) continue;
                const rem = count[r]![c] - knownMinesAround(r, c);
                if (rem === 0) {
                    for (const [hr, hc] of hidden) {
                        if (!revealed[hr]![hc]) { floodReveal(hr, hc); progress = true; }
                    }
                } else if (rem === hidden.length) {
                    for (const [hr, hc] of hidden) {
                        if (!knownMine[hr]![hc]) { knownMine[hr]![hc] = true; progress = true; }
                    }
                }
            }
        }
        if (progress) continue;

        // Build live constraints for subset + enumeration rules.
        interface Constraint { cells: Array<[number, number]>; mines: number; key: string }
        const constraints: Constraint[] = [];
        for (let r = 0; r < R; r++) {
            for (let c = 0; c < C; c++) {
                if (!revealed[r]![c] || count[r]![c] === 0) continue;
                const hidden = hiddenNeighbors(r, c);
                if (hidden.length === 0) continue;
                const rem = count[r]![c] - knownMinesAround(r, c);
                constraints.push({
                    cells: hidden,
                    mines: rem,
                    key: hidden.map(([a, b]) => `${a},${b}`).sort().join('|'),
                });
            }
        }

        // Rule 2: subset deduction between overlapping constraints.
        for (const a of constraints) {
            for (const b of constraints) {
                if (a === b) continue;
                if (a.cells.length >= b.cells.length) continue;
                const bset = new Set(b.cells.map(([r, c]) => `${r},${c}`));
                const aIsSubset = a.cells.every(([r, c]) => bset.has(`${r},${c}`));
                if (!aIsSubset) continue;
                const diff = b.cells.filter(([r, c]) => !a.cells.some(([ar, ac]) => ar === r && ac === c));
                const diffMines = b.mines - a.mines;
                if (diffMines === 0) {
                    for (const [r, c] of diff) {
                        if (!revealed[r]![c] && !knownMine[r]![c]) { floodReveal(r, c); progress = true; }
                    }
                } else if (diffMines === diff.length) {
                    for (const [r, c] of diff) {
                        if (!knownMine[r]![c]) { knownMine[r]![c] = true; progress = true; }
                    }
                }
            }
        }
        if (progress) continue;

        // Rule 3: brute-force enumeration over connected frontier components.
        progress = enumerateComponents(constraints, floodReveal, knownMine, R, C, revealed);
        if (progress) continue;

        // Rule 4: global mine-count endgame shortcuts.
        let knownMineTotal = 0;
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (knownMine[r]![c]) knownMineTotal++;
        const minesLeft = totalMines - knownMineTotal;
        const hiddenLeft: Array<[number, number]> = [];
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
            if (!revealed[r]![c] && !knownMine[r]![c]) hiddenLeft.push([r, c]);
        }
        if (minesLeft === 0) {
            for (const [r, c] of hiddenLeft) { floodReveal(r, c); progress = true; }
        } else if (minesLeft === hiddenLeft.length) {
            for (const [r, c] of hiddenLeft) { knownMine[r]![c] = true; progress = true; }
        }
        if (!progress) break;
    }

    return revealedCount >= safeTotal;
}

interface Constraint { cells: Array<[number, number]>; mines: number }

function enumerateComponents(
    constraints: Constraint[],
    floodReveal: (r: number, c: number) => void,
    knownMine: boolean[][],
    _R: number,
    _C: number,
    revealed: boolean[][],
): boolean {
    if (constraints.length === 0) return false;

    // Map cells to constraints; union-find components by shared cells.
    const cellId = new Map<string, number>();
    const idCell: Array<[number, number]> = [];
    const idFor = (r: number, c: number): number => {
        const k = `${r},${c}`;
        let id = cellId.get(k);
        if (id === undefined) { id = idCell.length; cellId.set(k, id); idCell.push([r, c]); }
        return id;
    };

    const conCells: number[][] = constraints.map((con) => con.cells.map(([r, c]) => idFor(r, c)));
    const parent: number[] = idCell.map((_, i) => i);
    const find = (x: number): number => { while (parent[x]! !== x) { parent[x] = parent[parent[x]!]!; x = parent[x]!; } return x; };
    const union = (a: number, b: number): void => { parent[find(a)] = find(b); };
    for (const cells of conCells) {
        for (let i = 1; i < cells.length; i++) union(cells[0]!, cells[i]!);
    }
    // Also union via constraints that share cells (already handled since shared cell -> same id).

    const compCells = new Map<number, number[]>();
    idCell.forEach((_, id) => {
        const root = find(id);
        const arr = compCells.get(root) ?? [];
        arr.push(id);
        compCells.set(root, arr);
    });

    let progress = false;

    for (const [, cells] of compCells) {
        if (cells.length > COMPONENT_CAP) continue;
        const local = constraints.filter((con) => con.cells.some(([r, c]) => find(idFor(r, c)) === find(cells[0]!)));
        const index = new Map<number, number>();
        cells.forEach((id, i) => index.set(id, i));

        const localCons = local.map((con) => ({
            idx: con.cells.map(([r, c]) => index.get(idFor(r, c))!),
            mines: con.mines,
        }));

        const n = cells.length;
        const assign = new Array<number>(n).fill(-1);
        const everMine = new Array<boolean>(n).fill(false);
        const everSafe = new Array<boolean>(n).fill(false);
        let solutions = 0;

        const consistent = (upTo: number): boolean => {
            for (const con of localCons) {
                let sum = 0;
                let unknown = 0;
                for (const i of con.idx) {
                    if (i <= upTo && assign[i] !== -1) sum += assign[i]!;
                    else unknown++;
                }
                if (sum > con.mines) return false;
                if (sum + unknown < con.mines) return false;
            }
            return true;
        };

        const recurse = (i: number): void => {
            if (solutions > 200000) return;
            if (i === n) {
                solutions++;
                for (let k = 0; k < n; k++) {
                    if (assign[k] === 1) everMine[k] = true; else everSafe[k] = true;
                }
                return;
            }
            for (const v of [0, 1]) {
                assign[i] = v;
                if (consistent(i)) recurse(i + 1);
            }
            assign[i] = -1;
        };

        recurse(0);
        if (solutions === 0) continue;

        for (let i = 0; i < n; i++) {
            const [r, c] = idCell[cells[i]!]!;
            if (!everMine[i] && everSafe[i]) {
                if (!revealed[r]![c] && !knownMine[r]![c]) { floodReveal(r, c); progress = true; }
            } else if (everMine[i] && !everSafe[i]) {
                if (!knownMine[r]![c]) { knownMine[r]![c] = true; progress = true; }
            }
        }
    }

    return progress;
}

// ===== 3BV =====

function compute3BV(mine: boolean[][], count: number[][], R: number, C: number): number {
    const offsets = neighborOffsets();
    const inBounds = (r: number, c: number): boolean => r >= 0 && r < R && c >= 0 && c < C;
    const visited: boolean[][] = Array.from({ length: R }, () => new Array<boolean>(C).fill(false));
    let bbbv = 0;

    // Openings: flood-fill connected zero regions (and their numbered borders).
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (mine[r]![c] || visited[r]![c] || count[r]![c] !== 0) continue;
            bbbv++;
            const stack: Array<[number, number]> = [[r, c]];
            while (stack.length > 0) {
                const top = stack.pop();
                if (!top) break;
                const [cr, cc] = top;
                if (visited[cr]![cc]) continue;
                visited[cr]![cc] = true;
                if (count[cr]![cc] === 0) {
                    for (const [dr, dc] of offsets) {
                        const nr = cr + dr;
                        const nc = cc + dc;
                        if (inBounds(nr, nc) && !mine[nr]![nc] && !visited[nr]![nc]) stack.push([nr, nc]);
                    }
                }
            }
        }
    }

    // Remaining numbered cells not touched by any opening each need their own click.
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            if (!mine[r]![c] && !visited[r]![c] && count[r]![c] > 0) bbbv++;
        }
    }

    return bbbv;
}

// ===== Game =====

class Minesweeper {
    private board: Cell[][] = [];
    private cellEls: HTMLElement[][] = [];
    private rows = 9;
    private cols = 9;
    private mines = 10;
    private mode: Mode = 'standard';
    private level: Level = 'beginner';

    private started = false;
    private over = false;
    private won = false;
    private flags = 0;
    private revealedSafe = 0;

    private timer = 0;
    private timerInterval: number | null = null;

    // stats
    private bbbv = 0;
    private bbbvDone = 0;
    private leftClicks = 0;
    private rightClicks = 0;
    private chordClicks = 0;

    private settings: Settings = structuredCloneSettings(DEFAULT_SETTINGS);

    // mouse state for chording
    private buttons = new Set<number>();
    private chordHandled = false;

    // elements
    private boardEl = document.getElementById('ms-board')!;
    private mineEl = document.getElementById('ms-mines')!;
    private timeEl = document.getElementById('ms-time')!;
    private faceEl = document.getElementById('ms-face') as HTMLButtonElement;
    private bbbvEl = document.getElementById('ms-bbbv')!;
    private bbbvRateEl = document.getElementById('ms-bbbv-rate')!;
    private ioeEl = document.getElementById('ms-ioe')!;
    private clicksEl = document.getElementById('ms-clicks')!;
    private statusEl = document.getElementById('ms-status')!;
    private bestEl = document.getElementById('ms-best')!;
    private genEl = document.getElementById('ms-gen')!;

    constructor() {
        this.loadSettings();
        this.bindChrome();
        this.bindBoard();
        this.applyLevel('beginner');
    }

    // ---- setup / chrome ----

    private loadSettings(): void {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<Settings>;
                if (parsed.chord) this.settings.chord = { ...DEFAULT_SETTINGS.chord, ...parsed.chord };
            }
        } catch { /* ignore corrupt storage */ }
        this.syncSettingsUI();
    }

    private saveSettings(): void {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
    }

    private syncSettingsUI(): void {
        (document.getElementById('opt-chord-both') as HTMLInputElement).checked = this.settings.chord.both;
        (document.getElementById('opt-chord-single') as HTMLInputElement).checked = this.settings.chord.singleOnNumber;
        (document.getElementById('opt-chord-middle') as HTMLInputElement).checked = this.settings.chord.middle;
    }

    private bindChrome(): void {
        document.querySelectorAll<HTMLElement>('[data-mode]').forEach((el) => {
            el.addEventListener('click', () => {
                this.mode = el.dataset.mode as Mode;
                document.querySelectorAll<HTMLElement>('[data-mode]').forEach((m) => m.classList.toggle('is-active', m === el));
                this.newGame();
            });
        });

        document.querySelectorAll<HTMLElement>('[data-level]').forEach((el) => {
            el.addEventListener('click', () => {
                const lvl = el.dataset.level as Level;
                if (lvl === 'custom') { this.openCustom(); return; }
                document.querySelectorAll<HTMLElement>('[data-level]').forEach((m) => m.classList.toggle('is-active', m === el));
                this.applyLevel(lvl);
            });
        });

        this.faceEl.addEventListener('click', () => this.newGame());

        // settings panel
        const gear = document.getElementById('ms-gear')!;
        const panel = document.getElementById('ms-settings')!;
        gear.addEventListener('click', () => panel.classList.toggle('open'));
        document.getElementById('ms-settings-close')!.addEventListener('click', () => panel.classList.remove('open'));

        const bindOpt = (id: string, set: (v: boolean) => void): void => {
            (document.getElementById(id) as HTMLInputElement).addEventListener('change', (e) => {
                set((e.target as HTMLInputElement).checked);
                this.saveSettings();
            });
        };
        bindOpt('opt-chord-both', (v) => { this.settings.chord.both = v; });
        bindOpt('opt-chord-single', (v) => { this.settings.chord.singleOnNumber = v; });
        bindOpt('opt-chord-middle', (v) => { this.settings.chord.middle = v; });

        // custom dialog
        document.getElementById('ms-custom-apply')!.addEventListener('click', () => this.applyCustom());
        document.getElementById('ms-custom-cancel')!.addEventListener('click', () => {
            document.getElementById('ms-custom')!.classList.remove('open');
        });
    }

    private openCustom(): void {
        const dlg = document.getElementById('ms-custom')!;
        (document.getElementById('cf-rows') as HTMLInputElement).value = String(this.rows);
        (document.getElementById('cf-cols') as HTMLInputElement).value = String(this.cols);
        (document.getElementById('cf-mines') as HTMLInputElement).value = String(this.mines);
        dlg.classList.add('open');
    }

    private applyCustom(): void {
        const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
        const rows = clamp(parseInt((document.getElementById('cf-rows') as HTMLInputElement).value, 10) || 9, 5, 40);
        const cols = clamp(parseInt((document.getElementById('cf-cols') as HTMLInputElement).value, 10) || 9, 5, 50);
        const maxMines = rows * cols - 9;
        const mines = clamp(parseInt((document.getElementById('cf-mines') as HTMLInputElement).value, 10) || 10, 1, maxMines);
        this.rows = rows; this.cols = cols; this.mines = mines; this.level = 'custom';
        document.querySelectorAll<HTMLElement>('[data-level]').forEach((m) => m.classList.toggle('is-active', m.dataset.level === 'custom'));
        document.getElementById('ms-custom')!.classList.remove('open');
        this.newGame();
    }

    private applyLevel(level: Exclude<Level, 'custom'>): void {
        const d = LEVELS[level];
        this.level = level;
        this.rows = d.rows; this.cols = d.cols; this.mines = d.mines;
        this.newGame();
    }

    // ---- board lifecycle ----

    private newGame(): void {
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

        this.board = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => ({
                mine: false, revealed: false, flagged: false, count: 0, exploded: false, wrongFlag: false,
            })),
        );

        this.buildGrid();
        this.setFace('idle');
        this.setStatus('READY');
        this.updateHud();
        this.renderBest();
    }

    private buildGrid(): void {
        this.boardEl.style.setProperty('--cols', String(this.cols));
        this.boardEl.innerHTML = '';
        this.cellEls = [];
        const frag = document.createDocumentFragment();
        for (let r = 0; r < this.rows; r++) {
            const rowEls: HTMLElement[] = [];
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

    // ---- mine placement ----

    private placeMines(safe: { row: number; col: number }): void {
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
        // Fallback: accept the last layout if no guess-free board was found in time.
        const mine = this.randomLayout(safe);
        this.commitLayout(mine, this.countsFor(mine));
    }

    private randomLayout(safe: { row: number; col: number }): boolean[][] {
        const mine: boolean[][] = Array.from({ length: this.rows }, () => new Array<boolean>(this.cols).fill(false));
        const forbidden = new Set<string>();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = safe.row + dr;
                const c = safe.col + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) forbidden.add(`${r},${c}`);
            }
        }
        // If board is too small to keep a full 3x3 opening, only protect the click itself.
        if (this.rows * this.cols - forbidden.size < this.mines) {
            forbidden.clear();
            forbidden.add(`${safe.row},${safe.col}`);
        }
        let placed = 0;
        while (placed < this.mines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            if (mine[r]![c] || forbidden.has(`${r},${c}`)) continue;
            mine[r]![c] = true;
            placed++;
        }
        return mine;
    }

    private countsFor(mine: boolean[][]): number[][] {
        const offsets = neighborOffsets();
        const count: number[][] = Array.from({ length: this.rows }, () => new Array<number>(this.cols).fill(0));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (mine[r]![c]) continue;
                let n = 0;
                for (const [dr, dc] of offsets) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && mine[nr]![nc]) n++;
                }
                count[r]![c] = n;
            }
        }
        return count;
    }

    private commitLayout(mine: boolean[][], count: number[][]): void {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.board[r]![c]!.mine = mine[r]![c]!;
                this.board[r]![c]!.count = count[r]![c]!;
            }
        }
        this.bbbv = compute3BV(mine, count, this.rows, this.cols);
    }

    // ---- input ----

    private bindBoard(): void {
        this.boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

        this.boardEl.addEventListener('mousedown', (e) => {
            const cell = this.cellFromEvent(e);
            if (this.over) return;
            this.buttons.add(e.button);
            if (cell && this.buttons.has(0)) this.setFace('suspense');

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
            if (this.buttons.size === 0) this.chordHandled = false;

            if (this.over || !cell) { if (!this.over) this.setFaceBack(); return; }
            if (wasChord) { this.setFaceBack(); return; }

            if (e.button === 0) {
                this.handleLeft(cell.r, cell.c);
            } else if (e.button === 2) {
                this.handleRight(cell.r, cell.c);
            } else if (e.button === 1 && this.settings.chord.middle) {
                this.chord(cell.r, cell.c);
            }
            this.setFaceBack();
        });
    }

    private cellFromEvent(e: MouseEvent): { r: number; c: number } | null {
        const target = e.target as HTMLElement | null;
        if (!target || !target.classList.contains('ms-cell')) return null;
        return { r: Number(target.dataset.r), c: Number(target.dataset.c) };
    }

    private setFaceBack(): void {
        if (this.over) return;
        this.setFace(this.started ? 'playing' : 'idle');
    }

    private handleLeft(r: number, c: number): void {
        const cell = this.board[r]![c]!;
        if (cell.flagged) return;
        if (cell.revealed) {
            if (this.settings.chord.singleOnNumber && cell.count > 0) this.chord(r, c);
            return;
        }
        if (!this.started) this.begin(r, c);
        this.leftClicks++;
        this.reveal(r, c);
        this.postMove();
    }

    private handleRight(r: number, c: number): void {
        const cell = this.board[r]![c]!;
        if (cell.revealed) return;
        if (!this.started) {
            // first interaction shouldn't be a flag-driven start; allow flagging pre-start
        }
        cell.flagged = !cell.flagged;
        this.flags += cell.flagged ? 1 : -1;
        this.rightClicks++;
        this.paintCell(r, c);
        this.updateHud();
    }

    private chord(r: number, c: number): void {
        const cell = this.board[r]![c]!;
        if (!cell.revealed || cell.count === 0) return;
        const offsets = neighborOffsets();
        let flagged = 0;
        const targets: Array<[number, number]> = [];
        for (const [dr, dc] of offsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
            const n = this.board[nr]![nc]!;
            if (n.flagged) flagged++;
            else if (!n.revealed) targets.push([nr, nc]);
        }
        if (flagged !== cell.count || targets.length === 0) return;
        this.chordClicks++;
        for (const [nr, nc] of targets) this.reveal(nr, nc);
        this.postMove();
    }

    // ---- reveal / flood ----

    private begin(r: number, c: number): void {
        this.started = true;
        if (this.mode === 'noguess') {
            this.genEl.classList.add('show');
            // Force a synchronous paint of the generating indicator before solving.
            void this.boardEl.offsetWidth;
        }
        this.placeMines({ row: r, col: c });
        this.genEl.classList.remove('show');
        this.startTimer();
        this.setFace('playing');
        this.setStatus(this.mode === 'noguess' ? 'NO-GUESS' : 'LIVE');
    }

    private reveal(r: number, c: number): void {
        const cell = this.board[r]![c]!;
        if (cell.revealed || cell.flagged) return;

        if (cell.mine) {
            cell.revealed = true;
            cell.exploded = true;
            this.lose();
            return;
        }

        // Track 3BV progress: opening flood = 1; isolated number click = 1.
        const offsets = neighborOffsets();
        const stack: Array<[number, number]> = [[r, c]];
        while (stack.length > 0) {
            const top = stack.pop();
            if (!top) break;
            const [cr, cc] = top;
            const cur = this.board[cr]![cc]!;
            if (cur.revealed || cur.flagged || cur.mine) continue;
            cur.revealed = true;
            this.revealedSafe++;
            this.paintCell(cr, cc);
            if (cur.count === 0) {
                for (const [dr, dc] of offsets) {
                    const nr = cr + dr;
                    const nc = cc + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) stack.push([nr, nc]);
                }
            }
        }
    }

    private postMove(): void {
        if (this.over) return;
        this.recomputeProgress();
        this.updateHud();
        if (this.revealedSafe === this.rows * this.cols - this.mines) this.win();
    }

    private recomputeProgress(): void {
        // Recompute solved-3BV from the revealed state for an accurate 3BV/s.
        const mine: boolean[][] = this.board.map((row) => row.map((x) => x.mine));
        const count: number[][] = this.board.map((row) => row.map((x) => x.count));
        const offsets = neighborOffsets();
        const visited: boolean[][] = Array.from({ length: this.rows }, () => new Array<boolean>(this.cols).fill(false));
        let done = 0;
        // openings fully revealed
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (mine[r]![c] || visited[r]![c] || count[r]![c] !== 0) continue;
                let allRevealed = true;
                const region: Array<[number, number]> = [];
                const stack: Array<[number, number]> = [[r, c]];
                while (stack.length > 0) {
                    const top = stack.pop()!;
                    const [cr, cc] = top;
                    if (visited[cr]![cc]) continue;
                    visited[cr]![cc] = true;
                    region.push([cr, cc]);
                    if (!this.board[cr]![cc]!.revealed) allRevealed = false;
                    if (count[cr]![cc] === 0) {
                        for (const [dr, dc] of offsets) {
                            const nr = cr + dr;
                            const nc = cc + dc;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && !mine[nr]![nc] && !visited[nr]![nc]) stack.push([nr, nc]);
                        }
                    }
                }
                if (allRevealed) done++;
            }
        }
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!mine[r]![c] && !visited[r]![c] && count[r]![c] > 0 && this.board[r]![c]!.revealed) done++;
            }
        }
        this.bbbvDone = done;
    }

    // ---- end states ----

    private lose(): void {
        this.over = true;
        this.stopTimer();
        this.setFace('lose');
        this.setStatus('BOOM');
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r]![c]!;
                if (cell.mine && !cell.flagged) cell.revealed = true;
                if (cell.flagged && !cell.mine) cell.wrongFlag = true;
                this.paintCell(r, c);
            }
        }
        this.updateHud();
    }

    private win(): void {
        this.over = true;
        this.won = true;
        this.stopTimer();
        this.setFace('win');
        this.setStatus('CLEAR');
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r]![c]!;
                if (cell.mine && !cell.flagged) { cell.flagged = true; this.flags++; }
                this.paintCell(r, c);
            }
        }
        this.saveBest();
        this.updateHud();
        this.renderBest();
    }

    // ---- rendering ----

    private paintCell(r: number, c: number): void {
        const cell = this.board[r]![c]!;
        const el = this.cellEls[r]![c]!;
        el.className = 'ms-cell';
        el.textContent = '';
        el.style.color = '';

        if (cell.flagged) {
            el.classList.add('flag');
            el.textContent = '⚑';
            return;
        }
        if (!cell.revealed) return;

        el.classList.add('open');
        if (cell.mine) {
            el.classList.add('mine');
            if (cell.exploded) el.classList.add('boom');
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

    // ---- hud / timer ----

    private setFace(state: 'idle' | 'playing' | 'suspense' | 'win' | 'lose'): void {
        const glyphs: Record<typeof state, string> = {
            idle: '◉', playing: '◉', suspense: '◎', win: '✓', lose: '✕',
        } as Record<typeof state, string>;
        this.faceEl.textContent = glyphs[state];
        this.faceEl.dataset.state = state;
    }

    private setStatus(text: string): void {
        this.statusEl.textContent = text;
    }

    private startTimer(): void {
        this.timerInterval = window.setInterval(() => {
            this.timer++;
            this.updateHud();
        }, 1000);
    }

    private stopTimer(): void {
        if (this.timerInterval !== null) { clearInterval(this.timerInterval); this.timerInterval = null; }
    }

    private updateHud(): void {
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

    private pad(n: number): string {
        if (n < 0) return '-' + String(Math.min(99, -n)).padStart(2, '0');
        return String(Math.min(999, n)).padStart(3, '0');
    }

    // ---- best times ----

    private bestKey(): string {
        return `${this.mode}:${this.level}:${this.rows}x${this.cols}:${this.mines}`;
    }

    private saveBest(): void {
        if (!this.won) return;
        try {
            const store = this.readBest();
            const key = this.bestKey();
            const prev = store[key];
            if (prev === undefined || this.timer < prev) {
                store[key] = this.timer;
                localStorage.setItem(BEST_KEY, JSON.stringify(store));
            }
        } catch { /* ignore */ }
    }

    private readBest(): Record<string, number> {
        try {
            const raw = localStorage.getItem(BEST_KEY);
            return raw ? (JSON.parse(raw) as Record<string, number>) : {};
        } catch { return {}; }
    }

    private renderBest(): void {
        const store = this.readBest();
        const rows: string[] = [];
        const label: Record<string, string> = { beginner: 'BEGINNER', intermediate: 'INTERMEDIATE', expert: 'EXPERT', custom: 'CUSTOM' };
        for (const lvl of ['beginner', 'intermediate', 'expert'] as const) {
            const d = LEVELS[lvl];
            const stdKey = `standard:${lvl}:${d.rows}x${d.cols}:${d.mines}`;
            const ngKey = `noguess:${lvl}:${d.rows}x${d.cols}:${d.mines}`;
            const std = store[stdKey];
            const ng = store[ngKey];
            rows.push(
                `<div class="ms-best-row"><span>${label[lvl]}</span>` +
                `<span class="ms-best-val">${std !== undefined ? std + 's' : '—'}</span>` +
                `<span class="ms-best-val ng">${ng !== undefined ? ng + 's' : '—'}</span></div>`,
            );
        }
        this.bestEl.innerHTML = rows.join('');
    }
}

function structuredCloneSettings(s: Settings): Settings {
    return { chord: { ...s.chord } };
}

document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
