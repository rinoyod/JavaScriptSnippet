## constractor
 new mouseDrag(element: HtmlElement)
#### 引数

* element: HtmlElement
ドラッグ対象となるelement
<br>
 

---
<br>

## メソッド

### *onDownEvent(callback(e): func)*
マウスカーソルダウン時に処理をする関数を指定します
#### 引数
* callback コールバック関数
   * e mousedown イベント
<br>
<br>

### *onMoveEvent(callback(e): func)*
マウスカーソル移動(ドラッグ）時に処理をする関数を指定します
#### 引数
* callback コールバック関数
   * e mousemove イベント
<br>
<br>

### *onUpEvent(callback(e): func)*
マウスカーソルボタンが離れた時に処理をする関数を指定します
#### 引数
* callback コールバック関数
   * e mouseup イベント
<br>
<br>
## 使用例

以下の例は特定のエレメントをドラッグで移動できるようにする例です

```javascript
//ドラッグさせたいエレメントを指定してインスタンスを作成します
var mouse = new mouseDrag(document.getElementById("box"));
var x;
var y;

//マウスが押された時の処理を記述します
mouse.onDownEvent(function(e){

    //指定されたエレメントの位置を取得しています
    const event = e;
    x = event.pageX - box.offsetLeft;
    y = event.pageY - box.offsetTop;
    console.log("down");
});

//マウスカーソルが移動した時の処理を記述します
mouse.onMoveEvent(function(e){

    //指定されたエレメントの位置をマウスカーソル合わせて調整してます
    const event = e;
    box.style.left = event.pageX - x + "px";
    box.style.top  = event.pageY - y + "px";
    console.log("move");
});

mouse.onUpEvent(function(e){
    console.log("up");
});



```
