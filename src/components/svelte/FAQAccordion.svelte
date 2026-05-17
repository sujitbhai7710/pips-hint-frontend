<script lang="ts">
  interface FAQ {
    question: string;
    answer: string;
  }

  interface Props {
    faqs: FAQ[];
  }

  let { faqs }: Props = $props();
  let openIndex = $state<number | null>(null);

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i;
  }
</script>

<div class="space-y-3">
  {#each faqs as faq, i}
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onclick={() => toggle(i)}
        class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span class="font-semibold text-gray-900 dark:text-gray-100 pr-4">{faq.question}</span>
        <svg
          class="w-5 h-5 text-gray-500 flex-shrink-0 transition-transform {openIndex === i ? 'rotate-180' : ''}"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {#if openIndex === i}
        <div class="px-4 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in-up">
          {faq.answer}
        </div>
      {/if}
    </div>
  {/each}
</div>
