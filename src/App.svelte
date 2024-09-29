<script lang="ts">
  import { fade } from "svelte/transition";
  import { Analyzer } from "./Analyzer.svelte";
  import { formatSize } from "./formatSize";
  import { DEMO_FILE_NAME } from "./demo";

  const analyzer = new Analyzer();

  let fileInput: HTMLInputElement | undefined;
  let selectedFileName = $state<string | undefined>();
  function handleChange(_event: Event) {
    if (fileInput?.files?.[0]) {
      analyzer.run(fileInput.files[0]);
      selectedFileName = fileInput.files[0].name;
    }
  }

  function runDemo(event: Event) {
    event.preventDefault();
    analyzer.runDemo();
    selectedFileName = DEMO_FILE_NAME;
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

  let fieldFocused = $state(false); // separate state variable to focus only once, not whenever .result changes
  $effect(() => {
    if (analyzer.result != undefined) {
      fieldFocused = true;
    }
  });
  let searchField = $state<HTMLInputElement | undefined>();
  $effect(() => {
    if (fieldFocused) {
      searchField?.focus();
    }
  });

  let totalSize = $derived(
    filteredResults && filteredResults.reduce((acc, [, size]) => acc + size, 0),
  );
</script>

<div class="wrapper">
  {#if analyzer.progress != undefined && analyzer.progress !== 1}
    <div class="progress-bar" style:width={`${analyzer.progress * 100}%`} out:fade></div>
  {/if}
  <aside>
    <p>
      <strong>See how much space your emails take up!</strong><br />
      Upload a <code>.mbox</code> file (for example, an export of your Gmail data from
      <a
        href="https://support.google.com/accounts/answer/3024190?hl=en"
        target="_blank"
        rel="noreferrer"
      >
        Google Takeout
      </a>). You’ll see a breakdown of storage space by <code>From:</code> address.
    </p>
    <p>
      <strong>Privacy? 🙀</strong><br />
      mbox.wtf processes your data locally and doesn’t send it anywhere. In fact, <em>it can’t</em>.
      A strict
      <a
        href="https://csp-evaluator.withgoogle.com/?csp=https://mbox.wtf"
        target="_blank"
        rel="noreferrer"
      >
        Content Security Policy
      </a>
      prevents this webpage from making any network connections.
      <a href="https://github.com/jtbandes/mbox.wtf" target="_blank" rel="noreferrer">
        Read more on GitHub.
      </a>
    </p>
  </aside>
  <header>
    <div class="input-bar">
      <label>
        Select a .mbox file:
        <button onclick={() => fileInput?.click()} disabled={analyzer.running}>Choose File</button>
        <span class="filename">{selectedFileName}</span>
        <input
          type="file"
          bind:this={fileInput}
          onchange={handleChange}
          accept=".mbox"
          disabled={analyzer.running}
        />
      </label>
      {#if selectedFileName == undefined}
        <!-- svelte-ignore a11y_invalid_attribute -->
        <span>Or, <a href="#" onclick={runDemo}><strong>try a demo!</strong></a></span>
      {/if}
      {#if analyzer.progress != undefined && analyzer.progress !== 1}
        <span class="speed">
          {(analyzer.progress * 100).toFixed(1)}% ({formatSize(analyzer.avgBytesPerSec ?? 0)}/s)
        </span>
      {:else if analyzer.progress === 1 && analyzer.elapsed != undefined}
        <span>Done in {(analyzer.elapsed / 1000).toFixed(1)} seconds</span>
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
          {#if filteredResults && filteredResults.length > 0}
            {#each filteredResults as [sender, size]}
              <tr>
                <td class="sender">{sender}</td>
                <td class="size">{formatSize(size)}</td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td>—</td>
              <td>—</td>
            </tr>
          {/if}
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
    gap: 0.5rem 1rem;
    position: relative;
    flex-wrap: wrap;
    align-items: baseline;
  }
  .input-bar input {
    display: none;
  }
  .filename {
    font-weight: bold;
  }
  aside {
    font-size: 14px;
    background-color: var(--theme-box-bg);
    border: 2px solid var(--theme-box-border);
    border-radius: 8px;
    padding: 0 0.8em;
  }
  .progress-bar {
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    height: 2px;
    background-color: var(--theme-primary);
  }
  .search-bar {
    display: flex;
  }
  .search-bar input {
    flex-grow: 1;
    padding: 0.5em 0.8em;
    border-radius: 2em;
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
  th.sender,
  td.sender {
    min-width: calc(min(500px, 30vw));
    word-break: break-word;
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
  .error {
    border: 1px solid rgb(235, 174, 174);
    background-color: rgb(255, 240, 240);
    padding: 0.5em 0.8em;
  }
  @media (prefers-color-scheme: dark) {
    header {
      background: rgba(36, 36, 36, 0.9);
    }
  }
</style>
