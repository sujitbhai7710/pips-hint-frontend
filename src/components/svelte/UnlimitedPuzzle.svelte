<script lang="ts">
  import type { PuzzleResponse } from '../../lib/api';
  import { api, formatDate } from '../../lib/api';
  import PuzzleGrid from './PuzzleGrid.svelte';
  import DominoTile from './DominoTile.svelte';

  let puzzle = $state<PuzzleResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'easy' | 'medium' | 'hard'>('easy');
  let showHint = $state(false);
  let showAnswer = $state(false);
  let excludedDates = $state<string[]>([]);

  let currentPuzzle = $derived(puzzle?.[activeTab] ?? null);
  let currentExplanation = $derived(puzzle?.explanation?.[activeTab] ?? null);

  // Determine cell size based on difficulty
  let cellSize = $derived(
    activeTab === 'hard' ? 'sm' :
    activeTab === 'medium' ? 'md' :
    'lg'
  );

  async function loadRandomPuzzle() {
    loading = true;
    error = null;
    showHint = false;
    showAnswer = false;

    try {
      const result = await api.getUnlimited(undefined, excludedDates.join(','));
      if (result) {
        if (puzzle?.printDate) {
          excludedDates = [...excludedDates, puzzle.printDate];
        }
        puzzle = result as any;
      } else {
        error = 'No puzzle available';
      }
    } catch (e: any) {
      error = e?.message || 'Failed to load puzzle';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadRandomPuzzle();
  });
</script>

<div class="max-w-4xl mx-auto">
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div>
        <h2 class="text-xl font-bold gradient-text">Unlimited Pips</h2>
        {#if puzzle?.printDate}
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(puzzle.printDate)}</p>
        {/if}
      </div>
    </div>

    <!-- Difficulty Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      {#each ['easy', 'medium', 'hard'] as diff}
        <button
          onclick={() => { activeTab = diff as any; showHint = false; showAnswer = false; }}
          class="flex-1 py-3 text-sm font-medium transition-colors {activeTab === diff
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'}"
        >
          {diff.charAt(0).toUpperCase() + diff.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Content -->
    <div class="p-6 min-h-[300px]">
      {#if loading}
        <div class="flex items-center justify-center h-48">
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading random puzzle...</p>
          </div>
        </div>
      {:else if error}
        <div class="flex items-center justify-center h-48">
          <div class="text-center">
            <p class="text-gray-600 dark:text-gray-400 font-medium">{error}</p>
            <button onclick={loadRandomPuzzle} class="mt-3 text-sm text-primary-600 hover:underline">Try Again</button>
          </div>
        </div>
      {:else if currentPuzzle}
        <!-- Visual Puzzle Grid -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Puzzle Grid
          </h3>
          <div class="flex justify-center">
            <PuzzleGrid puzzle={currentPuzzle} {cellSize} showSolution={showAnswer} />
          </div>
        </div>

        <!-- Domino Tiles -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {currentPuzzle.dominoes?.length || 0} Dominoes
          </h3>
          <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
            {#each (currentPuzzle.dominoes || []) as domino, i}
              <DominoTile a={domino[0]} b={domino[1]} index={i} />
            {/each}
          </div>
        </div>

        <!-- Region Legend -->
        {#if currentPuzzle.regions?.length}
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Region Conditions</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {#each currentPuzzle.regions as region, i}
                <div class="rounded-lg border border-gray-200 dark:border-gray-600 p-2 text-center text-sm bg-gray-50 dark:bg-gray-900/50">
                  <div class="flex items-center justify-center gap-1">
                    {#if region.type === 'sum'}
                      <span class="font-bold text-primary-600 dark:text-primary-400 text-base">{region.target ?? ''}</span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">sum</span>
                    {:else if region.type === 'equals'}
                      <span class="font-bold text-emerald-600 dark:text-emerald-400 text-base">=</span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">equals</span>
                    {:else if region.type === 'unequal'}
                      <span class="font-bold text-amber-600 dark:text-amber-400 text-base">&ne;</span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">unequal</span>
                    {:else if region.type === 'greater'}
                      <span class="font-bold text-rose-600 dark:text-rose-400 text-base">&gt;{region.target ?? ''}</span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">greater</span>
                    {:else if region.type === 'less'}
                      <span class="font-bold text-blue-600 dark:text-blue-400 text-base">&lt;{region.target ?? ''}</span>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">less</span>
                    {:else}
                      <span class="text-gray-500 dark:text-gray-400 text-xs capitalize">{region.type}</span>
                    {/if}
                  </div>
                  <div class="text-xs text-gray-400 mt-0.5">{region.indices?.length || 0} cells</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Hint & Answer -->
        <div class="space-y-3">
          <button
            onclick={() => { showHint = !showHint; if (showHint) showAnswer = false; }}
            class="w-full flex items-center justify-between p-4 rounded-lg border border-primary-200 dark:border-primary-800 bg-gradient-to-r from-primary-50 to-accent-400/10 dark:from-primary-900/20 dark:to-accent-700/10 hover:from-primary-100 hover:to-accent-400/20 transition-all"
          >
            <span class="font-semibold text-primary-700 dark:text-primary-300">{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            <svg class="w-5 h-5 text-primary-600 dark:text-primary-400 transition-transform {showHint ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {#if showHint && currentExplanation}
            <div class="animate-fade-in-up p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h4 class="font-bold text-lg mb-2 gradient-text">{currentExplanation.heading}</h4>
              <div class="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{currentExplanation.body}</div>
            </div>
          {/if}

          <button
            onclick={() => { showAnswer = !showAnswer; if (showAnswer) showHint = false; }}
            class="w-full flex items-center justify-between p-4 rounded-lg border border-accent-600/30 dark:border-accent-600/50 bg-gradient-to-r from-accent-500/5 to-primary-500/5 dark:from-accent-700/10 dark:to-primary-700/10 hover:from-accent-500/10 hover:to-primary-500/10 transition-all"
          >
            <span class="font-semibold text-accent-600 dark:text-accent-400">{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
            <svg class="w-5 h-5 text-accent-600 dark:text-accent-400 transition-transform {showAnswer ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {#if showAnswer}
            <div class="animate-fade-in-up p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <h4 class="font-bold text-green-700 dark:text-green-400 mb-3">Solution</h4>
              {#if currentPuzzle.solution}
                <div class="flex justify-center">
                  <PuzzleGrid puzzle={currentPuzzle} {cellSize} showSolution={true} />
                </div>
              {:else}
                <p class="text-gray-500 dark:text-gray-400 text-sm">Solution data not available for this puzzle.</p>
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <p class="text-gray-500 dark:text-gray-400 text-center py-8">No puzzle data</p>
      {/if}
    </div>
  </div>

  <!-- New Puzzle Button -->
  <div class="text-center mt-6">
    <button
      onclick={loadRandomPuzzle}
      disabled={loading}
      class="gradient-btn px-8 py-3 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'New Random Puzzle'}
    </button>
  </div>
</div>
