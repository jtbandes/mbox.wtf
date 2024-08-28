<script lang="ts">
  import { fade } from "svelte/transition";
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

  let searchField = $state<HTMLInputElement | undefined>();
  $effect(() => {
    if (analyzer.result != undefined) {
      searchField?.focus();
    }
  });

  let totalSize = $derived(
    filteredResults && filteredResults.reduce((acc, [, size]) => acc + size, 0),
  );
</script>

<div class="wrapper">
  <header>
    {#if analyzer.progress != undefined && analyzer.progress !== 1}
      <div class="progress-bar" style:width={`${analyzer.progress * 100}%`} out:fade></div>
    {/if}
    <div class="input-bar">
      <label>
        Select a .mbox file: <input
          type="file"
          bind:this={fileInput}
          onchange={handleChange}
          accept=".mbox"
        />
      </label>
      {#if analyzer.progress != undefined}
        <span class="speed">{formatSize(analyzer.avgBytesPerSec ?? 0)}/s</span>
      {/if}
    </div>
    {#if analyzer.error != undefined}
      <div class="error">{analyzer.error}</div>
    {/if}
    <div class="search-bar">
      <input
        type="text"
        placeholder="Search"
        bind:value={search}
        bind:this={searchField}
        disabled={filteredResults == undefined}
      />
    </div>
  </header>
  <main>
    <div>
      <table>
        <tbody>
          <tr>
            <th class="sender">Sender</th>
            <th>Size</th>
          </tr>
          {#if totalSize != undefined}
            <tr>
              <td class="total">Total</td>
              <td class="total">{formatSize(totalSize)}</td>
            </tr>
          {/if}
          {#each filteredResults ?? [] as [sender, size]}
            <tr>
              <td>{sender}</td>
              <td class="size">{formatSize(size)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </main>
</div>

<style>
  .wrapper {
    flex: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  header {
    margin: -1rem;
    padding: 1rem;
    flex: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.9);
  }
  main {
    flex: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .speed {
    font-feature-settings: "tnum";
  }
  .input-bar {
    display: flex;
    gap: 1rem;
    position: relative;
  }
  .progress-bar {
    position: absolute;
    height: 2px;
    background-color: var(--theme-primary);
    top: 0;
    left: 0;
  }
  .search-bar input {
    padding: 0.5em 0.8em;
    border-radius: 2em;
    width: 50%;
  }
  table {
    border-collapse: collapse;
  }
  th,
  td {
    padding: 0.1em 0.5em;
  }
  th {
    text-align: left;
  }
  th.sender {
    min-width: 30vw;
  }
  td.total {
    font-weight: bold;
  }
  td.size {
    white-space: nowrap;
  }
  tr:hover td {
    background-color: var(--theme-hover-bg);
  }
</style>
