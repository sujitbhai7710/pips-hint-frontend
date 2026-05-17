// Pips Puzzle Solver - Client-side constraint satisfaction solver
// Computes solutions from regions + dominoes since the API strips solution data

import type { Region, DifficultyPuzzle } from './api';

interface Cell {
  row: number;
  col: number;
}

export interface DominoPlacementResult {
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
      const minRemaining = remaining * 0;
      const maxRemaining = remaining * 6;
      if (currentSum > region.target) return false;
      if (currentSum + minRemaining > region.target) return false;
      if (currentSum + maxRemaining < region.target) return false;
      return true;
    }
    case 'equals': {
      return currentValues.every(v => v === currentValues[0]);
    }
    case 'unequal': {
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

// Result of solving a puzzle - includes both the solution grid and domino placements
export interface SolveResult {
  solution: Solution;
  placements: DominoPlacementResult[];
}

// Main solver using backtracking - returns both solution and domino placements
export function solvePipsPuzzle(puzzle: DifficultyPuzzle): SolveResult | null {
  const { rows, cols } = getGridSize(puzzle.regions);
  const dominoes = puzzle.dominoes || [];
  const regions = puzzle.regions || [];
  const cellRegionMap = buildCellRegionMap(regions);
  const validCells = getValidCells(regions);

  // Grid: -1 means empty/invalid, otherwise the value
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  // Track which dominoes are placed
  const placed: boolean[] = Array(dominoes.length).fill(false);
  // Track domino placements as we solve
  const currentPlacements: DominoPlacementResult[] = [];

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

      // Try placing domino in 4 orientations
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
        const placementIdx = currentPlacements.length;
        currentPlacements.push({
          dominoIndex: di,
          cell1,
          cell2,
          value1: val1,
          value2: val2
        });

        // Check constraints
        if (checkConstraints([cell1, cell2])) {
          if (backtrack()) return true;
        }

        // Undo placement
        grid[cell1.row][cell1.col] = -1;
        grid[cell2.row][cell2.col] = -1;
        placed[di] = false;
        currentPlacements.splice(placementIdx, 1);
      }
    }

    return false;
  }

  const success = backtrack();
  if (!success) return null;

  // Return both the solution grid and the placements
  return {
    solution: grid.map(row => [...row]),
    placements: [...currentPlacements]
  };
}

// Compute domino placements from a solution grid (fallback method)
export function computeDominoPlacements(
  puzzle: DifficultyPuzzle,
  solution: Solution
): DominoPlacementResult[] {
  const { rows, cols } = getGridSize(puzzle.regions);
  const validCells = getValidCells(puzzle.regions);
  const dominoes = puzzle.dominoes || [];
  const placements: DominoPlacementResult[] = [];
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const usedDominoes = new Set<number>();

  // Build adjacency pairs and try matching
  // First, collect all possible pairs of adjacent valid cells
  const pairs: { r1: number; c1: number; r2: number; c2: number; v1: number; v2: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!validCells.has(`${r},${c}`)) continue;
      if (solution[r][c] === -1 || solution[r][c] === undefined) continue;
      // Right neighbor
      if (c + 1 < cols && validCells.has(`${r},${c + 1}`) && solution[r][c + 1] !== -1 && solution[r][c + 1] !== undefined) {
        pairs.push({ r1: r, c1: c, r2: r, c2: c + 1, v1: solution[r][c], v2: solution[r][c + 1] });
      }
      // Bottom neighbor
      if (r + 1 < rows && validCells.has(`${r + 1},${c}`) && solution[r + 1][c] !== -1 && solution[r + 1][c] !== undefined) {
        pairs.push({ r1: r, c1: c, r2: r + 1, c2: c, v1: solution[r][c], v2: solution[r + 1][c] });
      }
    }
  }

  // Use backtracking to find a valid matching of pairs to dominoes
  // that covers every valid cell exactly once
  function matchBacktrack(pairIdx: number, coveredCells: Set<string>, usedDominoSet: Set<number>, currentPlacements: DominoPlacementResult[]): boolean {
    // Check if all valid cells are covered
    if (coveredCells.size === validCells.size) return true;

    // Skip pairs where cells are already covered
    while (pairIdx < pairs.length) {
      const pair = pairs[pairIdx];
      const key1 = `${pair.r1},${pair.c1}`;
      const key2 = `${pair.r2},${pair.c2}`;

      if (!coveredCells.has(key1) && !coveredCells.has(key2)) {
        // Try matching this pair to an unused domino
        for (let di = 0; di < dominoes.length; di++) {
          if (usedDominoSet.has(di)) continue;
          const [a, b] = dominoes[di];
          if ((a === pair.v1 && b === pair.v2) || (b === pair.v1 && a === pair.v2)) {
            // Try this match
            coveredCells.add(key1);
            coveredCells.add(key2);
            usedDominoSet.add(di);
            currentPlacements.push({
              dominoIndex: di,
              cell1: { row: pair.r1, col: pair.c1 },
              cell2: { row: pair.r2, col: pair.c2 },
              value1: pair.v1,
              value2: pair.v2
            });

            if (matchBacktrack(pairIdx + 1, coveredCells, usedDominoSet, currentPlacements)) {
              return true;
            }

            // Undo
            coveredCells.delete(key1);
            coveredCells.delete(key2);
            usedDominoSet.delete(di);
            currentPlacements.pop();
          }
        }
      }

      pairIdx++;
    }

    return false;
  }

  const coveredCells = new Set<string>();
  const usedDominoSet = new Set<number>();
  matchBacktrack(0, coveredCells, usedDominoSet, placements);

  return placements;
}

// Cache for solved puzzles
const solutionCache = new Map<string, { result: SolveResult | null; timestamp: number }>();

// Solve with caching - returns SolveResult with both solution and placements
export function solvePuzzle(puzzle: DifficultyPuzzle): SolveResult | null {
  const cacheKey = `${puzzle.id}-${puzzle.dominoes?.length || 0}`;
  const cached = solutionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
    return cached.result;
  }

  // If the puzzle already has a solution, use it and compute placements
  if (puzzle.solution && puzzle.solution.length > 0) {
    const placements = computeDominoPlacements(puzzle, puzzle.solution);
    const result = { solution: puzzle.solution, placements };
    solutionCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  const result = solvePipsPuzzle(puzzle);
  solutionCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}
