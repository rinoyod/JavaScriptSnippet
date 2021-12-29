    /**
     * clickイベント時などのクリックした座標を求める
     * @param {PointerEvent} pointerEvent ポインターイベント
     * @returns {{x:number,y:number}}
     */
     function getPointerEvetPosition(pointerEvent){
        const clickX = pointerEvent.pageX;
        const clickY = pointerEvent.pageY;

        const clientRect = pointerEvent.currentTarget.getBoundingClientRect();
        const positionX  = clientRect.left + window.pageXOffset;
        const positionY  = clientRect.top  + window.pageYOffset;

        // 要素内におけるクリック位置を計算
        const x = clickX - positionX;
        const y = clickY - positionY;

        return {x:x,y:y}
    }