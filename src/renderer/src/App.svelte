<script>
  let hmFile = ''
  let fmFile = ''
  let outFile = ''
  let errMsg = $state('')

  async function getFile(h_or_f, o_or_c) {
    console.log('h_or_f', h_or_f, 'o_or_c', o_or_c)
    const res = await window.electron.ipcRenderer.invoke('opendialog', h_or_f, o_or_c)
    console.log('getFile =>', res)
    errMsg = ''
    return res
  }

  async function processCSV() {
    if (!hmFile || !fmFile || !outFile) {
      errMsg = 'Alle 3 Dateien müssen ausgewählt sein'
      return
    }
    const res = await window.electron.ipcRenderer.invoke('processCSV', hmFile, fmFile, outFile)
    console.log('res', res)
  }
</script>

<div>
  {#if errMsg}
    <p>{errMsg}</p>
  {/if}
  <button onclick={async () => (hmFile = await getFile(true, true))}>HM</button>
  <button onclick={async () => (fmFile = await getFile(false, true))}>FM</button>
  <button onclick={async () => (outFile = await getFile(true, false))}>OUT</button>
  <button onclick={processCSV}>Start</button>
</div>
