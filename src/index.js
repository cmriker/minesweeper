import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'

function Square(props) {
	/**
	 * Helper to convert a function into a proper right-click handler
	 */
	function toRightClickHandler(f) {
		return function (event) {
			event.preventDefault()
			f(event)
			return false
		}
	}

	function getClassName(value) {
		let className = 'square'
		// only grey out squares that have been left-clicked
		if (value !== '' && value !== 'F' && value !== 'B') {
			className = `${className} visited`
		}

		return className
	}

	function getContents(value) {
		// add some distinguishing emoji
		switch (value) {
			case 'F':
				return '🚩'
			case 'B':
				return '💣'
			case 'E':
				return '💥'
			// 0s are not displayed in the original game
			case 0:
			case '':
				return ''
			default:
				return value
		}
	}

	return (
		<button
			className={getClassName(props.value)}
			style={{}}
			onClick={props.onLeftClick}
			disabled={props.disabled}
			onContextMenu={toRightClickHandler(props.onRightClick)}>
			{getContents(props.value)}
		</button>
	)
}

class Board extends React.Component {
	size = 10
	mineCount = 15

	constructor(props) {
		super(props)
		this.state = {
			squares: initializeSquareBoard(this.size, this.mineCount),
			boardDisabled: false,
			flaggedMines: 0,
			isLoss: false,
			isWin: false,
			remainingMines: this.mineCount,
			totalLosses: 0,
			totalWins: 0
		}
	}

	renderSquare(x, y) {
		const square = this.state.squares[x][y]

		let value
		if (square.markedAs === EXPOSED) {
			if (square.isMine) {
					value = 'B'
				if (square.exploded) {
					value = 'E'
				}
			} else {
				value = square.count
			}
		} else if (square.markedAs === FLAGGED) {
			value = 'F'
		} else {
			value = ''
		}

		return (
			<Square
				key={`${x}/${y}`}
				x={x}
				y={y}
				value={value}
				disabled={this.state.boardDisabled}
				onLeftClick={() => this.handleLeftClick(x, y)}
				onRightClick={() => this.handleRightClick(x, y)}
			/>
		)
	}

	startOver() {
		this.setState(() => ({
			squares: initializeSquareBoard(this.size, this.mineCount),
			boardDisabled: false,
			flaggedMines: 0,
			isLoss: false,
			isWin: false,
			remainingMines: this.mineCount
		}))
	}

	handleRightClick(x, y) {
		const square = this.state.squares[x][y]

		if (square.markedAs === FLAGGED) {
			square.markedAs = UNKNOWN

			if (square.isMine) {
				this.setState((prevState) => ({
					...prevState,
					remainingMines: prevState.remainingMines + 1,
					flaggedMines: prevState.flaggedMines - 1
				}))
			}
		} else if (square.markedAs === UNKNOWN) {
			square.markedAs = FLAGGED

			if (square.isMine) {
				this.setState((prevState) => {
					if (prevState.remainingMines === 1) {
						return {
							...prevState,
							isWin: true,
							boardDisabled: true,
							remainingMines: prevState.remainingMines - 1,
							flaggedMines: prevState.flaggedMines + 1,
							totalWins: prevState.totalWins + 1
						}
					}

					return {
						...prevState,
						remainingMines: prevState.remainingMines - 1,
						flaggedMines: prevState.flaggedMines + 1,
					}
				})
			}
		}

		this.setState((prevState) => ({...prevState, squares: this.state.squares.slice()}))
	}

	handleLeftClick(x, y) {
		const square = this.state.squares[x][y]
		if (square.markedAs !== EXPOSED) {
			square.markedAs = EXPOSED

			if (square.isMine) {
				square.exploded = true
				this.setState((prevState) => ({
					...prevState,
					boardDisabled: true,
					isLoss: true,
					totalLosses: prevState.totalLosses + 1,
				}))
				this.state.squares.map((row) => {
					row.map((square) => {
						if (square.isMine) {
							square.markedAs = EXPOSED
						}
					})
				})
			}

			if (square.count === 0) {
				this.uncoverSquare(x, y)
			}
		}

		this.setState((prevState) => ({...prevState, squares: this.state.squares.slice()}))
	}

	uncoverSquare(x, y) {
		const adjacentSquares = this.getAdjacentSquares(x, y)

		// check over each of the surrounding squares
		adjacentSquares.forEach((square) => {
			// if it's another 0, check its adjacent squares too
			if (this.state.squares[square.x][square.y].count === 0) {
				// call handleLeftClick() to check if the square is already uncovered
				// if it isn't, uncover it and call uncoverSquare() to get new neighbors
				this.handleLeftClick(square.x, square.y)
				// if it is not a 0
			} else {
				// expose the number and exit
				this.state.squares[square.x][square.y].markedAs = EXPOSED
			}
		})
	}

	getAdjacentSquares(x, y) {
		let adjacentSquares = []

		// get all the surrounding squares
		for (let i = x - 1; i <= x + 1; i++) {
			for (let j = y - 1; j <= y + 1; j++) {
				// make sure they are inside the bounds of the game,
				if (0 <= i && i < this.size && 0 <= j && j < this.size) {
					// exclude the original square from the list
					if (!(i === x && j === y)) {
						adjacentSquares.push({x: i, y: j})
					}
				}
			}
		}

		return adjacentSquares
	}

	render() {
		// based on the 34px square size, calculate the game size
		const gameWidth = this.size * 34
		const rows = this.state.squares.map((row, x) => {
			return (
				<div className="board-row" key={x}>
					{row.map((square, y) => this.renderSquare(x, y))}
				</div>
			)
		})

		return (
			<section style={{minWidth: `${gameWidth}px`}}>
				<div className="game-info" style={{maxWidth: `${gameWidth}px`}}>
					<button onClick={this.startOver.bind(this)}>
						Start Over
					</button>
					{this.state.isLoss && <span>Game over!</span>}
					{this.state.isWin && <span>You win!</span>}
				</div>
				<div className="game-board">
					{rows}
				</div>
				<section className="game-info" style={{maxWidth: `${gameWidth}px`}}>
					<div>
						<p>Mines remaining: {this.state.remainingMines}</p>
						<p>Mines found: {this.state.flaggedMines}</p>
					</div>
					<div className="right-align-text">
						<p>Wins: {this.state.totalWins}</p>
						<p>Losses: {this.state.totalLosses}</p>
					</div>
				</section>
			</section>
		)
	}
}

/**
 * The (mutually exclusive) states that a square can be in
 */
const UNKNOWN = 'UNKNOWN'
const FLAGGED = 'FLAGGED'
const EXPOSED = 'EXPOSED'

/**
 * Return a two dimensional array representing a square grid with the given side length.
 */
function initializeSquareBoard(sideLength, mineCount) {

	// Create grid
	let board = Array(sideLength).fill(null).map(() => Array(sideLength).fill(null).map(() => {
		return {
			isMine: false,
			markedAs: UNKNOWN
		}
	}))

	// Assign Mines
	const mines = Array(sideLength * sideLength).fill(null).map((el, i) => i)
	shuffle(mines)
	mines.slice(0, mineCount).forEach(mine => {
		let x = mine % sideLength
		let y = Math.floor(mine / sideLength)
		board[x][y].isMine = true
	})

	// Calculate Counts
	for (var i = 0; i < sideLength; i++) {
		for (var j = 0; j < sideLength; j++) {
			for (var ct = 0, ii = Math.max(0, i - 1); ii <= Math.min(sideLength - 1, i + 1); ii++) {
				for (var jj = Math.max(0, j - 1); jj <= Math.min(sideLength - 1, j + 1); jj++) {
					if (board[ii][jj].isMine) {
						ct++
					}
				}
			}
			board[i][j].count = ct
		}
	}

	return board
}

function shuffle(array) {
	for (var i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * i)
		const temp = array[i]
		array[i] = array[j]
		array[j] = temp
	}
}

// ========================================

ReactDOM.render(
	<Board/>,
	document.getElementById('root')
)
