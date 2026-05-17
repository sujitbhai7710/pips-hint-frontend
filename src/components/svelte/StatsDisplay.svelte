<script lang="ts">
  import type { StatsResponse } from '../../lib/api';

  interface Props {
    stats: StatsResponse;
  }

  let { stats }: Props = $props();
</script>

<div class="space-y-8">
  <!-- Summary Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 card-hover">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Puzzles</p>
      <p class="text-3xl font-bold gradient-text">{stats.totalPuzzles}</p>
    </div>
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 card-hover">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Last 7 Days</p>
      <p class="text-3xl font-bold text-green-600 dark:text-green-400">{stats.recentAdditions?.last7Days || 0}</p>
    </div>
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 card-hover">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">First Puzzle</p>
      <p class="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.dateRange?.first || 'N/A'}</p>
    </div>
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 card-hover">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Latest Puzzle</p>
      <p class="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.dateRange?.last || 'N/A'}</p>
    </div>
  </div>

  <!-- Region Type Distribution -->
  {#if stats.regionTypeDistribution && Object.keys(stats.regionTypeDistribution).length > 0}
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
      <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Region Type Distribution</h3>
      <div class="space-y-3">
        {#each Object.entries(stats.regionTypeDistribution) as [type, count]}
          {@const maxCount = Math.max(...Object.values(stats.regionTypeDistribution))}
          {@const pct = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0}
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="capitalize font-medium text-gray-700 dark:text-gray-300">{type}</span>
              <span class="text-gray-500 dark:text-gray-400">{count as number}</span>
            </div>
            <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
              <div
                class="h-2.5 rounded-full bg-gradient-to-r from-primary-600 to-accent-600"
                style="width: {pct}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Top Constructors -->
  {#if stats.topConstructors && stats.topConstructors.length > 0}
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
      <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Constructors</h3>
      <div class="space-y-2">
        {#each stats.topConstructors.slice(0, 10) as constructor}
          <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span class="text-sm text-gray-700 dark:text-gray-300">{constructor.constructors}</span>
            <span class="text-sm font-bold text-primary-600 dark:text-primary-400">{constructor.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Editors -->
  {#if stats.editors && stats.editors.length > 0}
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
      <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Editors</h3>
      <div class="space-y-2">
        {#each stats.editors as editor}
          <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span class="text-sm text-gray-700 dark:text-gray-300">{editor.editor}</span>
            <span class="text-sm font-bold text-primary-600 dark:text-primary-400">{editor.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
