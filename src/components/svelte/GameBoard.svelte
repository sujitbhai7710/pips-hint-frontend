<script lang="ts">
  import type { DifficultyPuzzle, Region } from '../../lib/api';

  interface Props {
    puzzle: DifficultyPuzzle;
    showSolution?: boolean;
  }

  let { puzzle, showSolution = false }: Props = $props();

  // Determine grid size from regions
  let gridCells = $derived(() => {
    const cells: { row: number; col: number; value?: number }[] = [];
    let maxRow = 0, maxCol = 0;

    for (const region of (puzzle.regions || [])) {
      for (const [r, c] of (region.indices || [])) {
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      }
    }

    const size = Math.max(maxRow, maxCol) + 1;
    const grid: (number | undefined)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => undefined)
    );

    // Fill solution values if showing
    if (showSolution && puzzle.solution) {
      for (let r = 0; r < puzzle.solution.length && r < size; r++) {
        for (let c = 0; c < puzzle.solution[r].length && c < size; c++) {
          const val = puzzle.solution[r][c];
          grid[r][c] = Array.isArray(val) ? val[0] : val;
        }
      }
    }

    return { grid, size };
  });

  let gridData = $derived(gridCells());

  // Get region borders for a cell
  function getRegionBorders(row: number, col: number): string {
    let borders = '';
    const regions = puzzle.regions || [];

    for (const region of regions) {
      const indices = region.indices || [];
      const isInRegion = indices.some(([r, c]) => r === row && c === col);
      if (!isInRegion) continue;

      const hasTop = indices.some(([r, c]) => r === row - 1 && c === col);
      const hasBottom = indices.some(([r, c]) => r === row + 1 && c === col);
      const hasLeft = indices.some(([r, c]) => r === row && c === col - 1);
      const hasRight = indices.some(([r, c]) => r === row && c === col + 1);

      if (!hasTop) borders += 'region-top ';
      if (!hasBottom) borders += 'region-bottom ';
      if (!hasLeft) borders += 'region-left ';
      if (!hasRight) borders += 'region-right ';
    }

    return borders;
  }

  // Get region label for a cell (top-left cell of each region)
  function getRegionLabel(row: number, col: number): { text: string; type: string } | null {
    const regions = puzzle.regions || [];
    for (const region of regions) {
      const indices = region.indices || [];
      if (indices.length === 0) continue;
      // Find the top-left most cell
      const sorted = [...indices].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const [topR, topC] = sorted[0];
      if (topR === row && topC === col) {
        let text = '';
        if (region.type === 'sum' && region.target) text = `${region.target}`;
        else if (region.type === 'equals') text = '=';
        else if (region.type === 'unequal') text = '\u2260';
        else if (region.type === 'less') text = '<';
        else if (region.type === 'greater') text = '>';
        return { text, type: region.type };
      }
    }
    return null;
  }
</script>

<div class="inline-block">
  <div
    class="grid gap-0 border-2 border-primary-600 dark:border-primary-400 rounded-lg overflow-hidden"
    style="grid-template-columns: repeat({gridData.size}, 1fr);"
  >
    {#each gridData.grid as row, r}
      {#each row as cell, c}
        <div
          class="domino-cell w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 {getRegionBorders(r, c)}"
        >
          {#if getRegionLabel(r, c)}
            {@const label = getRegionLabel(r, c)}
            <span class="absolute top-0.5 left-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400">
              {label?.text}
            </span>
          {/if}
          {#if cell !== undefined}
            <span class="font-bold text-gray-800 dark:text-gray-200">{cell}</span>
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</div>
