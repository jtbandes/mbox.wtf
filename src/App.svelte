<script lang="ts">
  import { Analyzer } from "./Analyzer.svelte";

  const analyzer = new Analyzer();

  let fileInput: HTMLInputElement | undefined;
  function handleChange(_event: Event) {
    if (fileInput?.files?.[0]) {
      analyzer.run(fileInput.files[0]);
    }
  }

  function formatSize(size: number) {
    const suffixes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    let value = size;
    let suffix = 0;
    while (value > 1023.9 && suffix + 1 < suffixes.length) {
      value /= 1024;
      suffix++;
    }
    return `${value.toFixed(suffix === 0 ? 0 : 1)} ${suffixes[suffix]!}`;
  }
</script>

<main>
  <div>
    <label>
      Select a .mbox file: <input
        type="file"
        bind:this={fileInput}
        onchange={handleChange}
        accept=".mbox"
      />
    </label>
  </div>
  <div>
    {#if analyzer.progress != undefined}
      <progress value={analyzer.progress}></progress>
      <span class="speed">{formatSize(analyzer.avgBytesPerSec ?? 0)}/s</span>
    {/if}
    {#if analyzer.result != undefined}
      <pre>{JSON.stringify(analyzer.result, null, 2)}</pre>
    {/if}
  </div>
</main>

<style>
  .speed {
    font-feature-settings: "tnum";
  }
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
