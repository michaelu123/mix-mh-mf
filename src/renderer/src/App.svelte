<script>
  let hmFile = $state('')
  let fmFile = $state('')
  let outFile = $state('')
  let errMsg = $state('')
  let mode = $state('h')
  let output = $state('')
  let enabled = $derived(hmFile && fmFile && outFile)

  async function getFile(h_or_f, o_or_c) {
    console.log('h_or_f', h_or_f, 'o_or_c', o_or_c)
    const res = await window.electron.ipcRenderer.invoke('opendialog', h_or_f, o_or_c)
    console.log('getFile =>', res)
    errMsg = ''
    return res
  }

  async function processCSV() {
    output = ''
    if (!hmFile || !fmFile || !outFile) {
      errMsg = 'Alle 3 Dateien müssen ausgewählt sein'
      return
    }
    const lineArray = await window.electron.ipcRenderer.invoke(
      'processCSV',
      hmFile,
      fmFile,
      outFile,
      mode
    )
    output = lineArray.join('\n')
  }
</script>

<div class="flex flex-col justify-between">
  {#if errMsg}
    <p class="bg-red-300 text-center m-4 p-2">{errMsg}</p>
  {/if}
  <div class="flex justify-between m-8">
    <label class="mr-4 w-52" for="hfile">Hauptmitglieder</label>
    <input
      class="w-full bg-gray-50 mr-4 border-2 border-gray-500"
      type="text"
      name="hfile"
      id="hfile"
      value={hmFile}
    />
    <button
      class="bg-blue-200 px-4 rounded-lg"
      onclick={async () => (hmFile = await getFile(true, true))}>Wählen</button
    >
  </div>
  <div class="flex m-8">
    <label class="mr-4 w-52" for="ffile">Familienmitglieder</label>
    <input
      class="w-full bg-gray-50 mr-4 border-2 border-gray-500"
      type="text"
      name="ffile"
      id="ffile"
      value={fmFile}
    />
    <button
      class="bg-blue-200 px-4 rounded-lg"
      onclick={async () => (fmFile = await getFile(false, true))}>Wählen</button
    >
  </div>
  <div class="flex justify-between m-8">
    <label class="mr-4 w-52" for="ofile">Ausgabedatei</label>
    <input
      class="w-full bg-gray-50 mr-4 border-2 border-gray-500"
      type="text"
      name="ofile"
      id="ofile"
      value={outFile}
    />
    <button
      class="bg-blue-200 px-4 rounded-lg"
      onclick={async () => (outFile = await getFile(true, false))}>Wählen</button
    >
  </div>
  <div class="flex justify-around">
    <div>
      <input type="radio" id="hbox" name="mode" value="h" bind:group={mode} />
      <label for="hbox">Versand an Hauptmitglieder</label>
    </div>
    <div>
      <input type="radio" id="fbox" name="mode" value="f" bind:group={mode} />
      <label for="hbox">Versand an Familienmitglieder</label>
    </div>
    <button
      class="{enabled ? 'bg-red-200' : 'bg-gray-400'} px-4 rounded-lg"
      disabled={!enabled}
      onclick={processCSV}>Start</button
    >
  </div>
  <textarea class="bg-white m-4" rows="10" name="output" id="output">{output}</textarea>
</div>
