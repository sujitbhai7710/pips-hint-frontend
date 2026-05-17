<script lang="ts">
  import type { PuzzleResponse, AIExplanation } from '../../lib/api';
  import { api, getPuzzleForDate, getTodayString, formatDate } from '../../lib/api';

  let puzzle = $state<PuzzleResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'easy' | 'medium' | 'hard'>('easy');
  let showHint = $state(false);
  let showAnswer = $state(false);
  let showTips = $state(false);
  let showLearned = $state(false);
  let showFAQ = $state(false);

  let currentPuzzle = $derived(puzzle?.[activeTab] ?? null);
  let currentExplanation = $derived(puzzle?.explanation?.[activeTab] ?? null);

  async function loadPuzzle() {
    loading = true;
    error = null;
    showHint = false;
    showAnswer = false;

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
        <!-- Dominoes -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {currentPuzzle.dominoes?.length || 0} Dominoes
          </h3>
          <div class="flex flex-wrap gap-2">
            {#each (currentPuzzle.dominoes || []) as domino}
              <div class="flex items-center bg-gradient-to-r from-primary-50 to-accent-400/10 dark:from-primary-900/30 dark:to-accent-700/20 rounded-lg px-3 py-2 border border-primary-200 dark:border-primary-800">
                <span class="font-bold text-primary-700 dark:text-primary-300">{domino[0]}</span>
                <svg class="w-4 h-4 mx-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="font-bold text-accent-600 dark:text-accent-400">{domino[1]}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Regions -->
        {#if currentPuzzle.regions?.length}
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Regions</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {#each currentPuzzle.regions as region}
                <div class="rounded-lg border border-gray-200 dark:border-gray-600 p-2 text-center text-sm bg-gray-50 dark:bg-gray-900/50">
                  <span class="font-medium capitalize text-gray-700 dark:text-gray-300">{region.type}</span>
                  {#if region.target}
                    <span class="ml-1 text-primary-600 dark:text-primary-400 font-bold">= {region.target}</span>
                  {/if}
                  <div class="text-xs text-gray-400 mt-0.5">{region.indices?.length || 0} cells</div>
                </div>
              {/each}
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
            onclick={() => { showAnswer = !showAnswer; if (showAnswer) showHint = false; }}
            class="w-full flex items-center justify-between p-4 rounded-lg border border-accent-600/30 dark:border-accent-600/50 bg-gradient-to-r from-accent-500/5 to-primary-500/5 dark:from-accent-700/10 dark:to-primary-700/10 hover:from-accent-500/10 hover:to-primary-500/10 transition-all"
          >
            <span class="font-semibold text-accent-600 dark:text-accent-400">
              {showAnswer ? 'Hide Answer' : 'Show Answer'} for {activeTab}
            </span>
            <svg class="w-5 h-5 text-accent-600 dark:text-accent-400 transition-transform {showAnswer ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showAnswer && currentPuzzle.solution}
            <div class="animate-fade-in-up p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <h4 class="font-bold text-green-700 dark:text-green-400 mb-2">Solution</h4>
              <div class="grid gap-1" style="grid-template-columns: repeat({Math.sqrt(currentPuzzle.solution.length || 1)}, 1fr);">
                {#each currentPuzzle.solution as row}
                  {#each row as cell}
                    <div class="flex items-center justify-center bg-white dark:bg-gray-800 rounded p-1 text-xs font-bold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                      {#if Array.isArray(cell)}
                        {cell.join(',')}
                      {:else}
                        {cell}
                      {/if}
                    </div>
                  {/each}
                {/each}
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
