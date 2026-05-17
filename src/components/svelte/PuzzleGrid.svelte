<script lang="ts">
  import type { Region, DifficultyPuzzle } from '../../lib/api';
  import type { DominoPlacementResult } from '../../lib/pipsSolver';

  interface Props {
    puzzle: DifficultyPuzzle;
    showSolution?: boolean;
    cellSize?: 'sm' | 'md' | 'lg';
    solution?: number[][] | null;
    dominoPlacements?: DominoPlacementResult[];
    selectedDominoIndex?: number | null;
  }

  let {
    puzzle,
    showSolution = false,
    cellSize = 'md',
    solution = null,
    dominoPlacements = [],
    selectedDominoIndex = null
  }: Props = $props();

  const REGION_COLORS = [
    { bg: '#dbeafe', border: '#93c5fd', label: '#1e3a8a' },  // blue
    { bg: '#fce7f3', border: '#f9a8d4', label: '#831843' },  // pink
    { bg: '#fef3c7', border: '#fcd34d', label: '#78350f' },  // yellow
    { bg: '#d1fae5', border: '#6ee7b7', label: '#064e3b' },  // green
    { bg: '#ede9fe', border: '#c4b5fd', label: '#3b0764' },  // purple
    { bg: '#ffedd5', border: '#fdba74', label: '#7c2d12' },  // orange
    { bg: '#e0e7ff', border: '#a5b4fc', label: '#312e81' },  // indigo
    { bg: '#fecdd3', border: '#fda4af', label: '#881337' },  // rose
  ];

  const REGION_COLORS_DARK = [
    { bg: '#172554', border: '#3b82f6', label: '#93c5fd' },  // blue
    { bg: '#500724', border: '#db2777', label: '#f9a8d4' },  // pink
    { bg: '#422006', border: '#ca8a04', label: '#fcd34d' },  // yellow
    { bg: '#052e16', border: '#16a34a', label: '#6ee7b7' },  // green
    { bg: '#2e1065', border: '#8b5cf6', label: '#c4b5fd' },  // purple
    { bg: '#431407', border: '#ea580c', label: '#fdba74' },  // orange
    { bg: '#1e1b4b', border: '#6366f1', label: '#a5b4fc' },  // indigo
    { bg: '#4c0519', border: '#e11d48', label: '#fda4af' },  // rose
  ];

  // Domino highlight colors (for highlighting which domino covers which cells)
  const DOMINO_HIGHLIGHT_COLORS = [
    'rgba(59, 130, 246, 0.3)',   // blue
    'rgba(168, 85, 247, 0.3)',   // purple
    'rgba(16, 185, 129, 0.3)',   // emerald
    'rgba(244, 63, 94, 0.3)',    // rose
    'rgba(245, 158, 11, 0.3)',   // amber
    'rgba(6, 182, 212, 0.3)',    // cyan
    'rgba(99, 102, 241, 0.3)',   // indigo
    'rgba(20, 184, 166, 0.3)',   // teal
    'rgba(249, 115, 22, 0.3)',   // orange
    'rgba(236, 72, 153, 0.3)',   // pink
  ];

  const INNER_BORDER_LIGHT = '#e5e7eb';
  const INNER_BORDER_DARK = '#374151';
  const DEFAULT_BG_LIGHT = '#f9fafb';
  const DEFAULT_BG_DARK = '#1f2937';

  // Track dark mode reactively
  let isDark = $state(false);

  $effect(() => {
    if (typeof window === 'undefined') return;
    isDark = document.documentElement.classList.contains('dark');

    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  });

  // Build grid size from region indices
  let size = $derived(() => {
    let maxRow = 0, maxCol = 0;
    for (const region of (puzzle.regions || [])) {
      for (const [r, c] of (region.indices || [])) {
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      }
    }
    return { rows: maxRow + 1, cols: maxCol + 1 };
  });

  let gridSize = $derived(size());

  // Build cell map: "row,col" -> { regionIndex, region }
  let cellMap = $derived(() => {
    const map = new Map<string, { regionIndex: number; region: Region }>();
    (puzzle.regions || []).forEach((region, index) => {
      for (const [r, c] of (region.indices || [])) {
        map.set(`${r},${c}`, { regionIndex: index, region });
      }
    });
    return map;
  });

  let cells = $derived(cellMap());

  // Build domino placement map: "row,col" -> dominoIndex
  let dominoCellMap = $derived(() => {
    const map = new Map<string, number>();
    for (const placement of dominoPlacements) {
      map.set(`${placement.cell1.row},${placement.cell1.col}`, placement.dominoIndex);
      map.set(`${placement.cell2.row},${placement.cell2.col}`, placement.dominoIndex);
    }
    return map;
  });

  let dominoCells = $derived(dominoCellMap());

  // Get region label text
  function getRegionLabel(region: Region): string {
    switch (region.type) {
      case 'sum': return region.target != null ? `${region.target}` : '';
      case 'equals': return '=';
      case 'unequal': return '\u2260';
      case 'less': return region.target != null ? `<${region.target}` : '<';
      case 'greater': return region.target != null ? `>${region.target}` : '>';
      case 'empty': return '';
      default: return '';
    }
  }

  // Determine if this cell should show the region label
  function isLabelCell(row: number, col: number, region: Region): boolean {
    if (!region.indices || region.indices.length === 0) return false;
    const sorted = [...region.indices].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return sorted[0][0] === row && sorted[0][1] === col;
  }

  // Get border info for a cell
  function getBorderInfo(row: number, col: number) {
    const current = cells.get(`${row},${col}`)?.regionIndex;
    return {
      top: row === 0 || cells.get(`${row - 1},${col}`)?.regionIndex !== current,
      right: col === gridSize.cols - 1 || cells.get(`${row},${col + 1}`)?.regionIndex !== current,
      bottom: row === gridSize.rows - 1 || cells.get(`${row + 1},${col}`)?.regionIndex !== current,
      left: col === 0 || cells.get(`${row},${col - 1}`)?.regionIndex !== current,
    };
  }

  // Get solution value for a cell
  function getSolutionValue(row: number, col: number): number | undefined {
    // Prefer explicitly passed solution, then puzzle.solution
    const sol = solution || puzzle.solution;
    if (!showSolution || !sol) return undefined;
    if (row < sol.length && col < sol[row].length) {
      const val = sol[row][col];
      const resolved = Array.isArray(val) ? val[0] : val;
      // -1 is a sentinel value for empty/uncovered cells – don't display it
      return resolved === -1 ? undefined : resolved;
    }
    return undefined;
  }

  // Check if cell is part of the selected domino
  function isDominoHighlighted(row: number, col: number): boolean {
    if (selectedDominoIndex === null) return false;
    return dominoCells.get(`${row},${col}`) === selectedDominoIndex;
  }

  // Get domino index for a cell
  function getDominoIndex(row: number, col: number): number | null {
    return dominoCells.get(`${row},${col}`) ?? null;
  }

  // Compute cell styles (handles dark mode reactively)
  function getCellStyle(row: number, col: number): string {
    const cellInfo = cells.get(`${row},${col}`);
    const regionIdx = cellInfo?.regionIndex ?? -1;
    const borders = getBorderInfo(row, col);

    const colors = regionIdx >= 0
      ? (isDark ? REGION_COLORS_DARK[regionIdx % REGION_COLORS_DARK.length] : REGION_COLORS[regionIdx % REGION_COLORS.length])
      : null;

    const bg = colors?.bg ?? (isDark ? DEFAULT_BG_DARK : DEFAULT_BG_LIGHT);
    const thickBorder = colors?.border ?? (isDark ? '#4b5563' : '#2563eb');
    const thinBorder = isDark ? INNER_BORDER_DARK : INNER_BORDER_LIGHT;

    // Add domino highlight if applicable
    let extraBg = '';
    const dIdx = getDominoIndex(row, col);
    if (dIdx !== null && dominoPlacements.length > 0) {
      if (selectedDominoIndex !== null && dIdx === selectedDominoIndex) {
        // Strong highlight for selected domino
        extraBg = 'background-image: linear-gradient(135deg, rgba(250, 204, 21, 0.4), rgba(250, 204, 21, 0.2));';
      } else if (selectedDominoIndex === null) {
        // Subtle highlight showing all domino placements
        const highlightColor = DOMINO_HIGHLIGHT_COLORS[dIdx % DOMINO_HIGHLIGHT_COLORS.length];
        extraBg = `background-image: linear-gradient(135deg, ${highlightColor}, transparent);`;
      }
    }

    const bw = (thick: boolean) => thick ? '3px' : '1px';
    const bc = (thick: boolean) => thick ? thickBorder : thinBorder;

    return `
      background-color: ${bg};
      ${extraBg}
      border-top: ${bw(borders.top)} solid ${bc(borders.top)};
      border-right: ${bw(borders.right)} solid ${bc(borders.right)};
      border-bottom: ${bw(borders.bottom)} solid ${bc(borders.bottom)};
      border-left: ${bw(borders.left)} solid ${bc(borders.left)};
    `;
  }

  // Get label color for a cell
  function getLabelColor(row: number, col: number): string {
    const cellInfo = cells.get(`${row},${col}`);
    const regionIdx = cellInfo?.regionIndex ?? -1;
    if (regionIdx < 0) return isDark ? '#9ca3af' : '#6b7280';
    const colors = isDark
      ? REGION_COLORS_DARK[regionIdx % REGION_COLORS_DARK.length]
      : REGION_COLORS[regionIdx % REGION_COLORS.length];
    return colors.label;
  }

  // Cell size classes
  let cellSizeClass = $derived(
    cellSize === 'sm' ? 'w-8 h-8 sm:w-9 sm:h-9' :
    cellSize === 'lg' ? 'w-12 h-12 sm:w-14 sm:h-14' :
    'w-10 h-10 sm:w-12 sm:h-12'
  );

  let labelSizeClass = $derived(
    cellSize === 'sm' ? 'text-[7px] sm:text-[8px]' :
    cellSize === 'lg' ? 'text-[10px] sm:text-xs' :
    'text-[9px] sm:text-[10px]'
  );

  let valueSizeClass = $derived(
    cellSize === 'sm' ? 'text-xs sm:text-sm' :
    cellSize === 'lg' ? 'text-lg sm:text-xl' :
    'text-sm sm:text-base'
  );
</script>

<div class="puzzle-grid-wrapper inline-block mx-auto">
  <div
    class="grid gap-0 rounded-xl overflow-hidden shadow-lg border-2 border-gray-300 dark:border-gray-600"
    style="grid-template-columns: repeat({gridSize.cols}, 1fr);"
  >
    {#each Array(gridSize.rows) as _, row}
      {#each Array(gridSize.cols) as _, col}
        {@const cellInfo = cells.get(`${row},${col}`)}
        {@const region = cellInfo?.region}
        {@const isLabel = region && isLabelCell(row, col, region)}
        {@const label = region ? getRegionLabel(region) : ''}
        {@const solVal = getSolutionValue(row, col)}
        {@const isHighlighted = isDominoHighlighted(row, col)}

        <div
          class="puzzle-cell {cellSizeClass} relative flex items-center justify-center {isHighlighted && selectedDominoIndex !== null ? 'ring-2 ring-inset ring-yellow-400 z-10' : ''}"
          style={getCellStyle(row, col)}
        >
          <!-- Region label (top-left corner) -->
          {#if isLabel && label}
            <span
              class="region-label absolute top-0 left-0.5 font-bold opacity-80 {labelSizeClass} leading-none"
              style="color: {getLabelColor(row, col)}"
            >
              {label}
            </span>
          {/if}

          <!-- Solution value -->
          {#if solVal !== undefined}
            <span class="font-bold {valueSizeClass} text-gray-800 dark:text-gray-200">{solVal}</span>
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .puzzle-cell {
    aspect-ratio: 1;
    font-variant-numeric: tabular-nums;
    transition: background-color 0.15s ease, border-color 0.15s ease;
    box-sizing: border-box;
  }

  .puzzle-cell:hover {
    filter: brightness(0.96);
  }

  .region-label {
    pointer-events: none;
    z-index: 1;
  }
</style>
