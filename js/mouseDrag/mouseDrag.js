class mouseDrag{

    /**
     * ドラッグ機能の実装クラス
     * @param {HTMLHtmlElement} element 
     */
    constructor(element){

        this._element = element;

        this._onDownMethod = function(){};
        this._onMoveMethod = function(){};
        this._onUpMethod = function(){};

        this._funcDown = this._down.bind(this);
        this._funcMove = this._move.bind(this);
        this._funcUp = this._up.bind(this);

        this._element.addEventListener("mousedown", this._funcDown, false);
        
    }

    onDownEvent(callback){
        this._onDownMethod = callback;
    }

    onMoveEvent(callback){
        this._onMoveMethod = callback;
    }

    onUpEvent(callback){
        this._onUpMethod = callback;
    }

    clear(){
        this._element.addEventListener(this._funcDown, false);
    }

    _down(e){

        this._element.classList.add("drag");

        this._onDownMethod(e);

        document.body.addEventListener("mousemove", this._funcMove, true);
        document.body.addEventListener("mouseup", this._funcUp, false);
     	document.body.addEventListener("mouseleave", this._funcUp, false);
    }

    _move(e){
        e.preventDefault();
        this._onMoveMethod(e);
    }

    _up(e){
        e.preventDefault();

        this._element.classList.remove("drag");

        this._onUpMethod(e);

        document.body.removeEventListener("mousemove", this._funcMove, true);
        document.body.removeEventListener("mouseup", this._funcUp, false);
        document.body.removeEventListener("mouseleave", this._funcUp, false)
    }

    



}
