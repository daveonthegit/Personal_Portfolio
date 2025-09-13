"use strict";
class MinesweeperGame {
    constructor() {
        this.gameBoard = [];
        this.mineCount = 40;
        this.flagCount = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.flagMode = false;
        this.timer = 0;
        this.timerInterval = null;
        this.rows = 16;
        this.cols = 16;
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        this.initializeDOMElements();
        this.setupEventListeners();
        this.initGame();
    }
    initializeDOMElements() {
        this.gameBoardElement = document.getElementById('game-board');
        this.mineCountElement = document.getElementById('mine-count');
        this.timerElement = document.getElementById('timer');
        this.flagCountElement = document.getElementById('flag-count');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameButton = document.getElementById('new-game');
        this.flagModeButton = document.getElementById('flag-mode');
        this.playAgainButton = document.getElementById('play-again');
        this.gameOverElement = document.getElementById('game-over');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
    }
    setupEventListeners() {
        this.difficultySelect.addEventListener('change', () => this.changeDifficulty());
        this.newGameButton.addEventListener('click', () => this.newGame());
        this.flagModeButton.addEventListener('click', () => this.toggleFlagMode());
        this.playAgainButton.addEventListener('click', () => this.newGame());
    }
    changeDifficulty() {
        const difficulty = this.difficultySelect.value;
        const config = this.difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.newGame();
    }
    initGame() {
        this.gameBoard = [];
        this.flagCount = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.timer = 0;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
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
    placeMines(excludePosition) {
        let minesPlaced = 0;
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if ((row === excludePosition.row && col === excludePosition.col) || this.gameBoard[row][col].isMine) {
                continue;
            }
            this.gameBoard[row][col].isMine = true;
            minesPlaced++;
        }
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.gameBoard[i][j].isMine) {
                    this.gameBoard[i][j].neighborCount = this.countNeighborMines(i, j);
                }
            }
        }
    }
    countNeighborMines(row, col) {
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
    renderBoard() {
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
                }
                else if (cell.isRevealed) {
                    if (cell.isMine) {
                        cellElement.textContent = '💣';
                        cellElement.classList.add('mine');
                    }
                    else if (cell.neighborCount > 0) {
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
    handleCellClick(row, col) {
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
    handleRightClick(row, col) {
        if (this.gameOver || this.gameBoard[row][col].isRevealed) {
            return;
        }
        this.toggleFlag(row, col);
    }
    toggleFlag(row, col) {
        const cell = this.gameBoard[row][col];
        if (cell.isFlagged) {
            cell.isFlagged = false;
            this.flagCount--;
        }
        else {
            cell.isFlagged = true;
            this.flagCount++;
        }
        this.updateDisplay();
        this.renderBoard();
    }
    revealCell(row, col) {
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
    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.gameBoard[i][j].isMine) {
                    this.gameBoard[i][j].isRevealed = true;
                }
            }
        }
    }
    checkWin() {
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
    showGameOver(won) {
        if (won) {
            this.gameOverTitle.textContent = '🎉 You Win!';
            this.gameOverMessage.textContent = `Congratulations! You cleared all mines in ${this.timer} seconds!`;
        }
        else {
            this.gameOverTitle.textContent = '💥 Game Over!';
            this.gameOverMessage.textContent = 'You hit a mine! Better luck next time.';
        }
        this.gameOverElement.classList.remove('hidden');
    }
    startTimer() {
        this.timerInterval = window.setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }
    updateDisplay() {
        this.mineCountElement.textContent = (this.mineCount - this.flagCount).toString();
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
        this.flagCountElement.textContent = this.flagCount.toString();
    }
    newGame() {
        this.gameOverElement.classList.add('hidden');
        this.initGame();
    }
    toggleFlagMode() {
        this.flagMode = !this.flagMode;
        this.flagModeButton.style.background = this.flagMode
            ? 'rgba(255, 193, 7, 0.8)'
            : 'rgba(255, 255, 255, 0.2)';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});
//# sourceMappingURL=minesweeper.js.map