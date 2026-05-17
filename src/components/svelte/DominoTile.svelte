<script lang="ts">
  interface Props {
    a: number;
    b: number;
    index?: number;
    placed?: boolean;
    small?: boolean;
    colorIndex?: number;
  }

  let { a, b, index = 0, placed = false, small = false, colorIndex = -1 }: Props = $props();

  const DOMINO_COLORS = [
    { bg: 'from-blue-500 to-blue-600', ring: 'ring-blue-300 dark:ring-blue-700' },
    { bg: 'from-purple-500 to-purple-600', ring: 'ring-purple-300 dark:ring-purple-700' },
    { bg: 'from-emerald-500 to-emerald-600', ring: 'ring-emerald-300 dark:ring-emerald-700' },
    { bg: 'from-rose-500 to-rose-600', ring: 'ring-rose-300 dark:ring-rose-700' },
    { bg: 'from-amber-500 to-amber-600', ring: 'ring-amber-300 dark:ring-amber-700' },
    { bg: 'from-cyan-500 to-cyan-600', ring: 'ring-cyan-300 dark:ring-cyan-700' },
    { bg: 'from-indigo-500 to-indigo-600', ring: 'ring-indigo-300 dark:ring-indigo-700' },
    { bg: 'from-teal-500 to-teal-600', ring: 'ring-teal-300 dark:ring-teal-700' },
    { bg: 'from-orange-500 to-orange-600', ring: 'ring-orange-300 dark:ring-orange-700' },
    { bg: 'from-pink-500 to-pink-600', ring: 'ring-pink-300 dark:ring-pink-700' },
  ];

  let color = $derived(
    colorIndex >= 0
      ? DOMINO_COLORS[colorIndex % DOMINO_COLORS.length]
      : DOMINO_COLORS[index % DOMINO_COLORS.length]
  );
</script>

<div
  class="domino-tile relative flex items-stretch rounded-lg shadow-md ring-1 {color.ring} {small ? 'h-8' : 'h-10 sm:h-12'} overflow-hidden transition-all hover:scale-105 hover:shadow-lg {placed ? 'opacity-60' : ''}"
>
  <!-- Left half -->
  <div class="flex items-center justify-center bg-gradient-to-br {color.bg} {small ? 'w-7 sm:w-8' : 'w-9 sm:w-11'} text-white font-bold {small ? 'text-sm' : 'text-base sm:text-lg'} select-none">
    {a}
  </div>

  <!-- Divider -->
  <div class="w-px bg-white/30 dark:bg-black/20 self-stretch"></div>

  <!-- Right half -->
  <div class="flex items-center justify-center bg-gradient-to-br {color.bg} {small ? 'w-7 sm:w-8' : 'w-9 sm:w-11'} text-white font-bold {small ? 'text-sm' : 'text-base sm:text-lg'} select-none">
    {b}
  </div>

  <!-- Placed checkmark -->
  {#if placed}
    <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
      <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    </div>
  {/if}
</div>
