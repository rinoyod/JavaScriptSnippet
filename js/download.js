/**
 * 文字列を形式を指定してダウンロードする
 * @param {string} filename 
 * @param {string} str 
 * @param {string} mimeType   'text/plain' ,'text/html'...etc
 */
function download(filename, str, mimeType){
    const blob = new Blob([str], {"type": mimeType}); 
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}
