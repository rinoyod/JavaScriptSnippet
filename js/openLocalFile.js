async function openLocalFile(){
    let fileHandle;
    [fileHandle] = await window.showOpenFilePicker({multiple: false});

    return fileHandle;

}