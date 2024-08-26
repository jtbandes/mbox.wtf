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
      <table>
        <tbody>
          {#each analyzer.result.sizesBySender as [sender, size]}
            <tr>
              <td>{sender}</td>
              <td>{formatSize(size)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</main>

<style>
  .speed {
    font-feature-settings: "tnum";
  }
</style>
