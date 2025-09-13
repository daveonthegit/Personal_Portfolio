/**
 * Minesweeper Game - TypeScript Implementation
 * A classic minesweeper game with modern UI and TypeScript type safety
 */

// Types and Interfaces
interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborCount: number;
}

interface GameConfig {
    rows: number;
    cols: number;
    mines: number;
}

interface Position {
    row: number;
    col: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

// Game State Class
class MinesweeperGame {
    private gameBoard: Cell[][] = [];
    private mineCount: number = 40;
    private flagCount: number = 0;
    private gameStarted: boolean = false;
    private gameOver: boolean = false;
    private flagMode: boolean = false;
    private timer: number = 0;
    private timerInterval: number | null = null;
    private rows: number = 16;
    private cols: number = 16;

    private readonly difficulties: Record<Difficulty, GameConfig> = {
        easy: { rows: 9, cols: 9, mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard: { rows: 16, cols: 30, mines: 99 }
    };

    // DOM Elements
    private gameBoardElement!: HTMLElement;
    private mineCountElement!: HTMLElement;
    private timerElement!: HTMLElement;
    private flagCountElement!: HTMLElement;
    private difficultySelect!: HTMLSelectElement;
    private newGameButton!: HTMLButtonElement;
    private flagModeButton!: HTMLButtonElement;
    private playAgainButton!: HTMLButtonElement;
    private gameOverElement!: HTMLElement;
    private gameOverTitle!: HTMLElement;
    private gameOverMessage!: HTMLElement;

    constructor() {
        this.initializeDOMElements();
        this.setupEventListeners();
        this.initGame();
    }

    private initializeDOMElements(): void {
        this.gameBoardElement = document.getElementById('game-board')!;
        this.mineCountElement = document.getElementById('mine-count')!;
        this.timerElement = document.getElementById('timer')!;
        this.flagCountElement = document.getElementById('flag-count')!;
        this.difficultySelect = document.getElementById('difficulty') as HTMLSelectElement;
        this.newGameButton = document.getElementById('new-game') as HTMLButtonElement;
        this.flagModeButton = document.getElementById('flag-mode') as HTMLButtonElement;
        this.playAgainButton = document.getElementById('play-again') as HTMLButtonElement;
        this.gameOverElement = document.getElementById('game-over')!;
        this.gameOverTitle = document.getElementById('game-over-title')!;
        this.gameOverMessage = document.getElementById('game-over-message')!;
    }

    private setupEventListeners(): void {
        this.difficultySelect.addEventListener('change', () => this.changeDifficulty());
        this.newGameButton.addEventListener('click', () => this.newGame());
        this.flagModeButton.addEventListener('click', () => this.toggleFlagMode());
        this.playAgainButton.addEventListener('click', () => this.newGame());
    }

    private changeDifficulty(): void {
        const difficulty = this.difficultySelect.value as Difficulty;
        const config = this.difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.newGame();
    }

    private initGame(): void {
        this.gameBoard = [];
        this.flagCount = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.timer = 0;
        
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Initialize board
        for (let i = 0; i < this.rows; i++) {
            this.gameBoard[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.gameBoard[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborCount: 0
                };
            }
        }

        this.updateDisplay();
        this.renderBoard();
    }

    private placeMines(excludePosition: Position): void {
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or if already a mine
            if ((row === excludePosition.row && col === excludePosition.col) || this.gameBoard[row][col].isMine) {
                continue;
            }
            
            this.gameBoard[row][col].isMine = true;
            minesPlaced++;
        }

        // Calculate neighbor counts
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.gameBoard[i][j].isMine) {
                    this.gameBoard[i][j].neighborCount = this.countNeighborMines(i, j);
                }
            }
        }
    }

    private countNeighborMines(row: number, col: number): number {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                    if (this.gameBoard[newRow][newCol].isMine) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    private renderBoard(): void {
        this.gameBoardElement.innerHTML = '';

        for (let i = 0; i < this.rows; i++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            
            for (let j = 0; j < this.cols; j++) {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = i.toString();
                cellElement.dataset.col = j.toString();
                
                const cell = this.gameBoard[i][j];
                
                if (cell.isFlagged) {
                    cellElement.textContent = '🚩';
                    cellElement.classList.add('flagged');
                } else if (cell.isRevealed) {
                    if (cell.isMine) {
                        cellElement.textContent = '💣';
                        cellElement.classList.add('mine');
                    } else if (cell.neighborCount > 0) {
                        cellElement.textContent = cell.neighborCount.toString();
                        cellElement.classList.add(`number-${cell.neighborCount}`);
                    }
                    cellElement.classList.add('revealed');
                }
                
                cellElement.addEventListener('click', () => this.handleCellClick(i, j));
                cellElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(i, j);
                });
                
                rowElement.appendChild(cellElement);
            }
            
            this.gameBoardElement.appendChild(rowElement);
        }
    }

    private handleCellClick(row: number, col: number): void {
        if (this.gameOver || this.gameBoard[row][col].isRevealed || this.gameBoard[row][col].isFlagged) {
            return;
        }

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.placeMines({ row, col });
            this.startTimer();
        }

        if (this.flagMode) {
            this.toggleFlag(row, col);
            return;
        }

        this.revealCell(row, col);
    }

    private handleRightClick(row: number, col: number): void {
        if (this.gameOver || this.gameBoard[row][col].isRevealed) {
            return;
        }
        this.toggleFlag(row, col);
    }

    private toggleFlag(row: number, col: number): void {
        const cell = this.gameBoard[row][col];
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
        } else {
            cell.isFlagged = true;
            this.flagCount++;
        }
        this.updateDisplay();
        this.renderBoard();
    }

    private revealCell(row: number, col: number): void {
        const cell = this.gameBoard[row][col];
        
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }

        cell.isRevealed = true;

        if (cell.isMine) {
            this.gameOver = true;
            this.revealAllMines();
            this.showGameOver(false);
            return;
        }

        if (cell.neighborCount === 0) {
            // Auto-reveal neighbors
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }

        this.renderBoard();
        this.checkWin();
    }

    private revealAllMines(): void {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.gameBoard[i][j].isMine) {
                    this.gameBoard[i][j].isRevealed = true;
                }
            }
        }
    }

    private checkWin(): void {
        let revealedCount = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.gameBoard[i][j].isRevealed && !this.gameBoard[i][j].isMine) {
                    revealedCount++;
                }
            }
        }

        if (revealedCount === (this.rows * this.cols - this.mineCount)) {
            this.gameOver = true;
            this.showGameOver(true);
        }
    }

    private showGameOver(won: boolean): void {
        if (won) {
            this.gameOverTitle.textContent = '🎉 You Win!';
            this.gameOverMessage.textContent = `Congratulations! You cleared all mines in ${this.timer} seconds!`;
        } else {
            this.gameOverTitle.textContent = '💥 Game Over!';
            this.gameOverMessage.textContent = 'You hit a mine! Better luck next time.';
        }

        this.gameOverElement.classList.remove('hidden');
    }

    private startTimer(): void {
        this.timerInterval = window.setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }

    private updateDisplay(): void {
        this.mineCountElement.textContent = (this.mineCount - this.flagCount).toString();
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
        this.flagCountElement.textContent = this.flagCount.toString();
    }

    private newGame(): void {
        this.gameOverElement.classList.add('hidden');
        this.initGame();
    }

    private toggleFlagMode(): void {
        this.flagMode = !this.flagMode;
        this.flagModeButton.style.background = this.flagMode 
            ? 'rgba(255, 193, 7, 0.8)' 
            : 'rgba(255, 255, 255, 0.2)';
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});
