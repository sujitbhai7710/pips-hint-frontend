<script lang="ts">
  import type { PuzzleResponse, AIExplanation } from '../../lib/api';
  import { api, getPuzzleForDate, getTodayString, formatDate } from '../../lib/api';
  import { solvePuzzle } from '../../lib/pipsSolver';
  import type { SolveResult } from '../../lib/pipsSolver';
  import PuzzleGrid from './PuzzleGrid.svelte';
  import DominoTile from './DominoTile.svelte';

  let puzzle = $state<PuzzleResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'easy' | 'medium' | 'hard'>('easy');
  let showHint = $state(false);
  let showAnswer = $state(false);
  let showTips = $state(false);
  let showLearned = $state(false);
  let showFAQ = $state(false);
  let solvingAll = $state(false);
  let solveResult = $state<SolveResult | null>(null);
  let selectedDominoIndex = $state<number | null>(null);

  let currentPuzzle = $derived(puzzle?.[activeTab] ?? null);
  let currentExplanation = $derived(puzzle?.explanation?.[activeTab] ?? null);

  let cellSize = $derived(
    activeTab === 'hard' ? 'sm' :
    activeTab === 'medium' ? 'md' :
    'lg'
  );

  // When switching tabs, reset solution state
  $effect(() => {
    activeTab;
    solveResult = null;
    selectedDominoIndex = null;
  });

  async function loadPuzzle() {
    loading = true;
    error = null;
    showHint = false;
    showAnswer = false;
    solveResult = null;
    selectedDominoIndex = null;

    try {
      puzzle = await getPuzzleForDate();
      if (!puzzle) {
        error = "Today's puzzle hasn't been published yet. Check back soon!";
      }
    } catch (e: any) {
      error = e?.message || 'Failed to load puzzle';
    } finally {
      loading = false;
    }
  }

  async function handleSolveAll() {
    if (!currentPuzzle) return;
    solvingAll = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = solvePuzzle(currentPuzzle);
      if (result) {
        solveResult = result;
        showAnswer = true;
      } else {
        error = 'Could not solve this puzzle automatically. The puzzle may have no valid solution.';
      }
    } catch (e: any) {
      error = 'Solver error: ' + (e?.message || 'Unknown error');
    } finally {
      solvingAll = false;
    }
  }

  function handleDominoClick(dominoIndex: number) {
    if (solveResult) {
      selectedDominoIndex = selectedDominoIndex === dominoIndex ? null : dominoIndex;
    } else {
      handleSolveAll();
    }
  }

  // Get the effective solution
  let effectiveSolution = $derived(solveResult?.solution ?? null);

  // Load on mount
  $effect(() => {
    loadPuzzle();
  });
</script>

<div class="max-w-4xl mx-auto">
  <!-- Puzzle Card -->
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div>
        <h2 class="text-xl font-bold gradient-text">Pips Hint</h2>
        {#if puzzle?.printDate}
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(puzzle.printDate)}</p>
        {/if}
      </div>
      {#if puzzle?.editor}
        <span class="text-xs text-gray-500 dark:text-gray-400">Editor: {puzzle.editor}</span>
      {/if}
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
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading today's puzzle...</p>
          </div>
        </div>
      {:else if error}
        <div class="flex items-center justify-center h-48">
          <div class="text-center">
            <svg class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-600 dark:text-gray-400 font-medium">{error}</p>
            <div class="flex gap-3 justify-center mt-4">
              <button onclick={loadPuzzle} class="text-sm text-primary-600 dark:text-primary-400 hover:underline">Try Again</button>
              <a href="/archive" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">Browse Archive</a>
            </div>
          </div>
        </div>
      {:else if currentPuzzle}
        <!-- Solve All Button - prominent at the top -->
        <div class="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onclick={handleSolveAll}
            disabled={solvingAll || !!solveResult}
            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {#if solvingAll}
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Solving...
            {:else if solveResult}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Solved!
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Solve All - Reveal Complete Solution
            {/if}
          </button>
          {#if solveResult}
            <button
              onclick={() => { solveResult = null; selectedDominoIndex = null; showAnswer = false; }}
              class="px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              Reset
            </button>
          {/if}
        </div>

        <!-- Visual Puzzle Grid -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Puzzle Grid
          </h3>
          <div class="flex justify-center">
            <PuzzleGrid
              puzzle={currentPuzzle}
              {cellSize}
              showSolution={showAnswer || !!solveResult}
              solution={effectiveSolution}
              dominoPlacements={solveResult?.placements ?? []}
              selectedDominoIndex={selectedDominoIndex}
            />
          </div>
        </div>

        <!-- Domino Tiles - Clickable -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {currentPuzzle.dominoes?.length || 0} Dominoes
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Click a domino to highlight its placement on the grid</p>
          <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
            {#each (currentPuzzle.dominoes || []) as domino, i}
              {@const placement = solveResult?.placements?.find(p => p.dominoIndex === i)}
              <button
                onclick={() => handleDominoClick(i)}
                class="transform transition-all duration-200 {selectedDominoIndex === i ? 'scale-110 ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-800' : 'hover:scale-105'} cursor-pointer"
              >
                <DominoTile
                  a={domino[0]}
                  b={domino[1]}
                  index={i}
                  placed={!!placement}
                />
              </button>
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

        <!-- Solution Display (when solved) -->
        {#if solveResult}
          <div class="mb-6 p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <h4 class="font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Complete Solution
            </h4>
            <div class="flex justify-center">
              <PuzzleGrid
                puzzle={currentPuzzle}
                {cellSize}
                showSolution={true}
                solution={solveResult.solution}
                dominoPlacements={solveResult.placements}
                selectedDominoIndex={selectedDominoIndex}
              />
            </div>
          </div>
        {/if}

        <!-- Hints & Answers -->
        <div class="space-y-3">
          <!-- Hint Button -->
          <button
            onclick={() => { showHint = !showHint; if (showHint) showAnswer = false; }}
            class="w-full flex items-center justify-between p-4 rounded-lg border border-primary-200 dark:border-primary-800 bg-gradient-to-r from-primary-50 to-accent-400/10 dark:from-primary-900/20 dark:to-accent-700/10 hover:from-primary-100 hover:to-accent-400/20 transition-all"
          >
            <span class="font-semibold text-primary-700 dark:text-primary-300">
              {showHint ? 'Hide Hint' : 'Show Hint'} for {activeTab}
            </span>
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

          <!-- Answer Button -->
          <button
            onclick={() => { showAnswer = !showAnswer; if (showAnswer) showHint = false; if (showAnswer && !solveResult) handleSolveAll(); }}
            class="w-full flex items-center justify-between p-4 rounded-lg border border-accent-600/30 dark:border-accent-600/50 bg-gradient-to-r from-accent-500/5 to-primary-500/5 dark:from-accent-700/10 dark:to-primary-700/10 hover:from-accent-500/10 hover:to-primary-500/10 transition-all"
          >
            <span class="font-semibold text-accent-600 dark:text-accent-400">
              {showAnswer ? 'Hide Answer' : 'Show Answer'} for {activeTab}
            </span>
            <svg class="w-5 h-5 text-accent-600 dark:text-accent-400 transition-transform {showAnswer ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showAnswer && !solveResult}
            <div class="animate-fade-in-up p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <h4 class="font-bold text-green-700 dark:text-green-400 mb-3">Solution</h4>
              <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Computing solution...
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex items-center justify-center h-48">
          <p class="text-gray-500 dark:text-gray-400">No puzzle data available</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Tips Section -->
  {#if puzzle?.explanation?.tips}
    <div class="mt-6">
      <button
        onclick={() => showTips = !showTips}
        class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
      >
        <span class="font-semibold text-gray-700 dark:text-gray-300">Solving Tips</span>
        <svg class="w-5 h-5 text-gray-400 transition-transform {showTips ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {#if showTips}
        <div class="animate-fade-in-up p-4 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{puzzle.explanation.tips}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Learned Section -->
  {#if puzzle?.explanation?.learned}
    <div class="mt-3">
      <button
        onclick={() => showLearned = !showLearned}
        class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
      >
        <span class="font-semibold text-gray-700 dark:text-gray-300">What We Learned</span>
        <svg class="w-5 h-5 text-gray-400 transition-transform {showLearned ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {#if showLearned}
        <div class="animate-fade-in-up p-4 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{puzzle.explanation.learned}</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- FAQs Section -->
  {#if puzzle?.explanation?.faqs?.length}
    <div class="mt-3">
      <button
        onclick={() => showFAQ = !showFAQ}
        class="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
      >
        <span class="font-semibold text-gray-700 dark:text-gray-300">Frequently Asked Questions</span>
        <svg class="w-5 h-5 text-gray-400 transition-transform {showFAQ ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {#if showFAQ}
        <div class="mt-2 space-y-2">
          {#each puzzle.explanation.faqs as faq}
            <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">{faq.question}</p>
              <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
