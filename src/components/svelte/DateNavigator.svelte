<script lang="ts">
  interface Props {
    currentDate: string;
    onDateChange: (date: string) => void;
  }

  let { currentDate, onDateChange }: Props = $props();

  function navigate(days: number) {
    const d = new Date(currentDate + 'T00:00:00Z');
    d.setDate(d.getDate() + days);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onDateChange(newDate);
  }

  function formatDateDisplay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  function handleDateInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.value) {
      onDateChange(input.value);
    }
  }
</script>

<div class="flex items-center gap-3">
  <button
    onclick={() => navigate(-1)}
    class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    aria-label="Previous day"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  </button>

  <div class="relative">
    <input
      type="date"
      value={currentDate}
      onchange={handleDateInput}
      class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  </div>

  <button
    onclick={() => navigate(1)}
    class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    aria-label="Next day"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>

  <span class="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
    {formatDateDisplay(currentDate)}
  </span>
</div>
