/**
 * クイックソート　オブジェクトの配列をクイックソートする
 * 
 * @param {[object]} array 
 * @param {Number} startId 0
 * @param {Number} endId array.length -1
 * @param {string} sortKey null指定の場合はプリミティブ型
 * @param {boolean} isDesc trueの場合は降順
 */
 function arrayObjectQuickSort(array, startId, endId, sortKey = null, isDesc = false){

    function getValue(index, key = null){
        if(key == null){
            return array[index];
        }else {
            console.log(`index = ${index} , key = ${key}` );
            return array[index][key];
        }
    }

    if(sortKey != null){
        if(!(sortKey in array[0])){
            console.error(`not in sortKey "${sortKey}"`);
            return;
        }
    }

    let pivot = Math.floor((startId + endId)/2);

    let left  = startId;
    let right = endId;

    

    while(true) {

        if(!isDesc) {
            //昇順
            while(getValue(left, sortKey) < getValue(pivot, sortKey)){
                left = (left + 1)|0;
            }

            while(getValue(pivot, sortKey) < getValue(right, sortKey)){
                right = (right - 1)|0;
            }
        } else {
            //降順
            while(getValue(left, sortKey) > getValue(pivot, sortKey)){
                left = (left + 1)|0;
            }

            while(getValue(pivot, sortKey) > getValue(right, sortKey)){
                right = (right - 1)|0;
            }

        }

        if(right <= left){
            break;
        }

        let temp     = array[left];
        array[left]  = array[right];
        array[right] = temp;

        left  = (left + 1)|0;
        right = (right - 1)|0;
    }

    if(startId < left-1){
        arrayObjectQuickSort(array,startId, left -1, sortKey, isDesc);
    }

    if(right +1 < endId){
        arrayObjectQuickSort(array, right +1, endId, sortKey, isDesc);
    }


}