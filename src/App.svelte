<script lang="ts">
  import { Analyzer } from "./Analyzer.svelte";
  import { formatSize } from "./formatSize";

  const analyzer = new Analyzer();

  let fileInput: HTMLInputElement | undefined;
  function handleChange(_event: Event) {
    if (fileInput?.files?.[0]) {
      analyzer.run(fileInput.files[0]);
    }
  }

  let search = $state("");
  let filteredResults = $derived.by(() => {
    if (!analyzer.result) {
      return undefined;
    }
    if (search === "") {
      return analyzer.result.sizesBySender;
    }

    return analyzer.result.sizesBySender.filter(([sender, _size]) => {
      return sender.toLowerCase().includes(search.toLowerCase());
    });
  });
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
  {#if analyzer.error != undefined}
    <div class="error">{analyzer.error}</div>
  {/if}
  <div>
    {#if analyzer.progress != undefined}
      <progress value={analyzer.progress}></progress>
      <span class="speed">{formatSize(analyzer.avgBytesPerSec ?? 0)}/s</span>
    {/if}
    {#if filteredResults != undefined}
      <div>
        <input type="text" placeholder="Search" bind:value={search} />
      </div>
      <table>
        <tbody>
          {#each filteredResults as [sender, size]}
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
