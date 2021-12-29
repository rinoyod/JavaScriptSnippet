/**
 * JavaScriptで文字列の矩形領域を１文字ずつ取得する
 * @param {Element} elem Element
 * @returns {[rect]}
*/
 function retrieveCharactersRects(elem) {
    if(elem.nodeType == elem.TEXT_NODE) {

        const range = elem.ownerDocument.createRange();

        // selectNodeContentsを実行することでText NodeにRangeをフォーカスさせ，
        // 文字列のoffsetを取得する
        range.selectNodeContents(elem);

        let current_pos = 0;
        const end_pos = range.endOffset;

        const results = [];

        while(current_pos  < end_pos) {
            range.setStart(elem, current_pos);
            range.setEnd(elem, (current_pos + 1)|0);
            current_pos = (current_pos+1)|0;

            results.push({character: range.toString(), rect: range.getBoundingClientRect()});
        }

        range.detach();

        return results;

    } else {

        const results = [];
        for(let i = 0; i < (elem.childNodes.length)|0; i=(i+1)|0) {
            //再帰
            results.push(retrieveCharactersRects(elem.childNodes[i|0]));
        }

        // 結果の配列をフラットにする
        return Array.prototype.concat.apply([], results);
    }

}