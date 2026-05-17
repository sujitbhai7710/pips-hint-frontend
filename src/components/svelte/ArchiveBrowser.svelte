<script lang="ts">
  import type { ArchiveEntry, PuzzleResponse } from '../../lib/api';
  import { api, formatDate } from '../../lib/api';

  let archive = $state<ArchiveEntry[]>([]);
  let loading = $state(true);
  let selectedMonth = $state('');
  let selectedPuzzle = $state<PuzzleResponse | null>(null);
  let puzzleLoading = $state(false);
  let puzzleError = $state<string | null>(null);
  let activeTab = $state<'easy' | 'medium' | 'hard'>('easy');
  let showHint = $state(false);
  let showAnswer = $state(false);

  let months = $derived(() => {
    const grouped: Record<string, ArchiveEntry[]> = {};
    for (const entry of archive) {
      const month = entry.date.substring(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(entry);
    }
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  });

  let monthList = $derived(months());
  let filteredMonths = $derived(
    selectedMonth
      ? monthList.filter(([m]) => m === selectedMonth)
      : monthList
  );

  let currentPuzzle = $derived(selectedPuzzle?.[activeTab] ?? null);
  let currentExplanation = $derived(selectedPuzzle?.explanation?.[activeTab] ?? null);

  async function loadArchive() {
    loading = true;
    try {
      const data = await api.getArchive();
      archive = data.dates || [];
    } catch (e) {
      console.error('Failed to load archive:', e);
    } finally {
      loading = false;
    }
  }

  async function selectDate(date: string) {
    puzzleLoading = true;
    puzzleError = null;
    showHint = false;
    showAnswer = false;

    try {
      selectedPuzzle = await api.getByDate(date);
    } catch (e: any) {
      puzzleError = e?.message || 'Failed to load puzzle for this date';
    } finally {
      puzzleLoading = false;
    }
  }

  function formatMonth(monthStr: string): string {
    const [y, m] = monthStr.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function formatDay(dateStr: string): { day: string; weekday: string } {
    const d = new Date(dateStr + 'T00:00:00Z');
    return {
      day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' }),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    };
  }

  $effect(() => {
    loadArchive();
  });
</script>

<div>
  {#if selectedPuzzle}
    <!-- Show selected puzzle -->
    <div>
      <button
        onclick={() => { selectedPuzzle = null; puzzleError = null; }}
        class="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-4"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Archive
      </button>

      <div class="max-w-4xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h2 class="text-xl font-bold gradient-text">Pips Hint</h2>
            {#if selectedPuzzle.printDate}
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(selectedPuzzle.printDate)}</p>
            {/if}
          </div>
          {#if selectedPuzzle.editor}
            <span class="text-xs text-gray-500 dark:text-gray-400">Editor: {selectedPuzzle.editor}</span>
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

        <!-- Puzzle Content -->
        <div class="p-6">
          {#if currentPuzzle}
            <!-- Dominoes -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {currentPuzzle.dominoes?.length || 0} Dominoes
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each (currentPuzzle.dominoes || []) as domino}
                  <div class="flex items-center bg-gradient-to-r from-primary-50 to-accent-400/10 dark:from-primary-900/30 dark:to-accent-700/20 rounded-lg px-3 py-2 border border-primary-200 dark:border-primary-800">
                    <span class="font-bold text-primary-700 dark:text-primary-300">{domino[0]}</span>
                    <span class="mx-1 text-gray-400">|</span>
                    <span class="font-bold text-accent-600 dark:text-accent-400">{domino[1]}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Hint -->
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

              <!-- Answer -->
              <button
                onclick={() => { showAnswer = !showAnswer; if (showAnswer) showHint = false; }}
                class="w-full flex items-center justify-between p-4 rounded-lg border border-accent-600/30 dark:border-accent-600/50 bg-gradient-to-r from-accent-500/5 to-primary-500/5 dark:from-accent-700/10 dark:to-primary-700/10 transition-all"
              >
                <span class="font-semibold text-accent-600 dark:text-accent-400">{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
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
                          {#if Array.isArray(cell)}{cell.join(',')}{:else}{cell}{/if}
                        </div>
                      {/each}
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <p class="text-gray-500 dark:text-gray-400">No puzzle data for this difficulty.</p>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Calendar view -->
    <div>
      {#if loading}
        <div class="flex justify-center py-12">
          <svg class="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      {:else if archive.length > 0}
        <!-- Month filter -->
        <div class="mb-6">
          <select
            bind:value={selectedMonth}
            class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Months</option>
            {#each monthList as [month]}
              <option value={month}>{formatMonth(month)}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-8">
          {#each filteredMonths as [month, entries]}
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{formatMonth(month)}</h3>
              <div class="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
                {#each entries as entry}
                  {@const dayInfo = formatDay(entry.date)}
                  <button
                    onclick={() => selectDate(entry.date)}
                    class="flex flex-col items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer group"
                  >
                    <span class="text-xs text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{dayInfo.weekday}</span>
                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">{dayInfo.day}</span>
                    <div class="flex gap-0.5 mt-1">
                      {#if entry.hasEasy}<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>{/if}
                      {#if entry.hasMedium}<span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>{/if}
                      {#if entry.hasHard}<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>{/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">No archive data available.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
