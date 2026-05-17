// Pips Puzzle Solver - Client-side constraint satisfaction solver
// Computes solutions from regions + dominoes since the API strips solution data

import type { Region, DifficultyPuzzle } from './api';

interface Cell {
  row: number;
  col: number;
}

interface DominoPlacement {
  dominoIndex: number;
  cell1: Cell;
  cell2: Cell;
  value1: number;
  value2: number;
}

type Solution = number[][]; // solution[row][col] = value

// Get grid dimensions from regions
function getGridSize(regions: Region[]): { rows: number; cols: number } {
  let maxRow = 0, maxCol = 0;
  for (const region of regions) {
    for (const [r, c] of region.indices) {
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }
  }
  return { rows: maxRow + 1, cols: maxCol + 1 };
}

// Get the set of all valid cells (cells that belong to at least one region)
function getValidCells(regions: Region[]): Set<string> {
  const cells = new Set<string>();
  for (const region of regions) {
    for (const [r, c] of region.indices) {
      cells.add(`${r},${c}`);
    }
  }
  return cells;
}

// Build a map from cell position to region index
function buildCellRegionMap(regions: Region[]): Map<string, number> {
  const map = new Map<string, number>();
  regions.forEach((region, index) => {
    for (const [r, c] of region.indices) {
      map.set(`${r},${c}`, index);
    }
  });
  return map;
}

// Check if all values in a completed region satisfy its constraint
function checkRegionConstraint(
  region: Region,
  values: number[]
): boolean {
  if (values.length === 0) return true;

  switch (region.type) {
    case 'sum': {
      if (region.target == null) return true;
      const sum = values.reduce((a, b) => a + b, 0);
      return sum === region.target;
    }
    case 'equals': {
      return values.every(v => v === values[0]);
    }
    case 'unequal': {
      const seen = new Set(values);
      return seen.size === values.length;
    }
    case 'greater': {
      if (region.target == null) return true;
      return values.every(v => v > region.target!);
    }
    case 'less': {
      if (region.target == null) return true;
      return values.every(v => v < region.target!);
    }
    case 'empty':
      return true;
    default:
      return true;
  }
}

// Check if placing a value at a cell would violate any partial region constraint
function partialCheck(
  region: Region,
  currentValues: number[],
  totalCells: number
): boolean {
  if (currentValues.length === 0) return true;

  switch (region.type) {
    case 'sum': {
      if (region.target == null) return true;
      const currentSum = currentValues.reduce((a, b) => a + b, 0);
      const remaining = totalCells - currentValues.length;
      // Minimum possible remaining sum (all 0s for pips)
      const minRemaining = remaining * 0;
      // Maximum possible remaining sum (all 6s for pips)
      const maxRemaining = remaining * 6;
      // Current sum must not exceed target
      if (currentSum > region.target) return false;
      // It must still be possible to reach the target
      if (currentSum + minRemaining > region.target) return false;
      if (currentSum + maxRemaining < region.target) return false;
      return true;
    }
    case 'equals': {
      // All values seen so far must be the same
      return currentValues.every(v => v === currentValues[0]);
    }
    case 'unequal': {
      // No duplicates among seen values
      const seen = new Set(currentValues);
      return seen.size === currentValues.length;
    }
    case 'greater': {
      if (region.target == null) return true;
      return currentValues.every(v => v > region.target!);
    }
    case 'less': {
      if (region.target == null) return true;
      return currentValues.every(v => v < region.target!);
    }
    case 'empty':
      return true;
    default:
      return true;
  }
}

// Main solver using backtracking
export function solvePipsPuzzle(puzzle: DifficultyPuzzle): Solution | null {
  const { rows, cols } = getGridSize(puzzle.regions);
  const dominoes = puzzle.dominoes || [];
  const regions = puzzle.regions || [];
  const cellRegionMap = buildCellRegionMap(regions);
  const validCells = getValidCells(regions);

  // Grid: -1 means empty/invalid, otherwise the value
  // Only valid cells (those in at least one region) need to be filled
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  // Track which dominoes are placed
  const placed: boolean[] = Array(dominoes.length).fill(false);

  // Get region values for a region given current grid state
  function getRegionValues(regionIndex: number): number[] {
    const region = regions[regionIndex];
    const values: number[] = [];
    for (const [r, c] of region.indices) {
      if (grid[r][c] !== -1) {
        values.push(grid[r][c]);
      }
    }
    return values;
  }

  // Check if placing values at cells violates constraints
  function checkConstraints(cells: Cell[]): boolean {
    const affectedRegions = new Set<number>();
    for (const cell of cells) {
      const ri = cellRegionMap.get(`${cell.row},${cell.col}`);
      if (ri !== undefined) affectedRegions.add(ri);
    }

    for (const ri of affectedRegions) {
      const region = regions[ri];
      const values = getRegionValues(ri);
      const totalCells = region.indices.length;
      const allFilled = values.length === totalCells;

      if (allFilled) {
        if (!checkRegionConstraint(region, values)) return false;
      } else {
        if (!partialCheck(region, values, totalCells)) return false;
      }
    }
    return true;
  }

  // Find first empty valid cell (only cells that are part of the puzzle)
  function findFirstEmpty(): Cell | null {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === -1 && validCells.has(`${r},${c}`)) return { row: r, col: c };
      }
    }
    return null;
  }

  // Backtracking solver
  function backtrack(): boolean {
    const empty = findFirstEmpty();
    if (!empty) return true; // All valid cells filled

    const { row, col } = empty;

    // Try each unplaced domino
    for (let di = 0; di < dominoes.length; di++) {
      if (placed[di]) continue;

      const [a, b] = dominoes[di];

      // Try placing domino in 4 orientations:
      // 1. Horizontal: (row,col)=a, (row,col+1)=b
      // 2. Horizontal: (row,col)=b, (row,col+1)=a
      // 3. Vertical: (row,col)=a, (row+1,col)=b
      // 4. Vertical: (row,col)=b, (row+1,col)=a

      const orientations: [Cell, Cell, number, number][] = [];

      // Horizontal placements - both cells must be valid
      if (col + 1 < cols && grid[row][col + 1] === -1 && validCells.has(`${row},${col + 1}`)) {
        orientations.push(
          [{ row, col }, { row, col: col + 1 }, a, b],
          [{ row, col }, { row, col: col + 1 }, b, a]
        );
      }

      // Vertical placements - both cells must be valid
      if (row + 1 < rows && grid[row + 1][col] === -1 && validCells.has(`${row + 1},${col}`)) {
        orientations.push(
          [{ row, col }, { row: row + 1, col }, a, b],
          [{ row, col }, { row: row + 1, col }, b, a]
        );
      }

      for (const [cell1, cell2, val1, val2] of orientations) {
        // Place domino
        grid[cell1.row][cell1.col] = val1;
        grid[cell2.row][cell2.col] = val2;
        placed[di] = true;

        // Check constraints
        if (checkConstraints([cell1, cell2])) {
          if (backtrack()) return true;
        }

        // Undo placement
        grid[cell1.row][cell1.col] = -1;
        grid[cell2.row][cell2.col] = -1;
        placed[di] = false;
      }
    }

    return false;
  }

  const success = backtrack();
  if (!success) return null;

  // Return a copy of the grid
  return grid.map(row => [...row]);
}

// Compute domino placements from a solution grid
export interface DominoPlacementResult {
  dominoIndex: number;
  cell1: Cell;
  cell2: Cell;
  value1: number;
  value2: number;
}

export function computeDominoPlacements(
  puzzle: DifficultyPuzzle,
  solution: Solution
): DominoPlacementResult[] {
  const { rows, cols } = getGridSize(puzzle.regions);
  const validCells = getValidCells(puzzle.regions);
  const dominoes = puzzle.dominoes || [];
  const placements: DominoPlacementResult[] = [];
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  // Build a map from domino pair to indices
  // Each domino can match [a,b] or [b,a]
  const usedDominoes = new Set<number>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip cells that are not part of the puzzle or already visited
      if (visited[r][c] || !validCells.has(`${r},${c}`)) continue;
      // Skip cells with no solution value
      if (solution[r][c] === -1 || solution[r][c] === undefined) continue;

      // Try to find an adjacent cell to form a domino
      const val = solution[r][c];
      let found = false;

      // Try right neighbor
      if (c + 1 < cols && !visited[r][c + 1] && validCells.has(`${r},${c + 1}`)) {
        const rightVal = solution[r][c + 1];
        if (rightVal !== -1 && rightVal !== undefined) {
          // Find matching domino
          for (let di = 0; di < dominoes.length; di++) {
            if (usedDominoes.has(di)) continue;
            const [a, b] = dominoes[di];
            if ((a === val && b === rightVal) || (b === val && a === rightVal)) {
              usedDominoes.add(di);
              placements.push({
                dominoIndex: di,
                cell1: { row: r, col: c },
                cell2: { row: r, col: c + 1 },
                value1: val,
                value2: rightVal
              });
              visited[r][c] = true;
              visited[r][c + 1] = true;
              found = true;
              break;
            }
          }
        }
        if (found) continue;
      }

      // Try bottom neighbor
      if (r + 1 < rows && !visited[r + 1][c] && validCells.has(`${r + 1},${c}`)) {
        const bottomVal = solution[r + 1][c];
        if (bottomVal !== -1 && bottomVal !== undefined) {
          for (let di = 0; di < dominoes.length; di++) {
            if (usedDominoes.has(di)) continue;
            const [a, b] = dominoes[di];
            if ((a === val && b === bottomVal) || (b === val && a === bottomVal)) {
              usedDominoes.add(di);
              placements.push({
                dominoIndex: di,
                cell1: { row: r, col: c },
                cell2: { row: r + 1, col: c },
                value1: val,
                value2: bottomVal
              });
              visited[r][c] = true;
              visited[r + 1][c] = true;
              found = true;
              break;
            }
          }
        }
      }
    }
  }

  return placements;
}

// Cache for solved puzzles
const solutionCache = new Map<string, { solution: Solution | null; timestamp: number }>();

// Solve with caching
export function solvePuzzle(puzzle: DifficultyPuzzle): Solution | null {
  const cacheKey = `${puzzle.id}-${puzzle.dominoes?.length || 0}`;
  const cached = solutionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
    return cached.solution;
  }

  // If the puzzle already has a solution, use it
  if (puzzle.solution && puzzle.solution.length > 0) {
    return puzzle.solution;
  }

  const solution = solvePipsPuzzle(puzzle);
  solutionCache.set(cacheKey, { solution, timestamp: Date.now() });
  return solution;
}
