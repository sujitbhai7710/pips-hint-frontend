<script lang="ts">
  import type { ArchiveEntry } from '../../lib/api';

  interface Props {
    archive: ArchiveEntry[];
    onDateSelect: (date: string) => void;
  }

  let { archive, onDateSelect }: Props = $props();

  let selectedMonth = $state('');

  // Group by month
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
</script>

<div>
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

  <!-- Calendar grid -->
  <div class="space-y-8">
    {#each filteredMonths as [month, entries]}
      <div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{formatMonth(month)}</h3>
        <div class="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
          {#each entries as entry}
            {@const dayInfo = formatDay(entry.date)}
            <button
              onclick={() => onDateSelect(entry.date)}
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
</div>
