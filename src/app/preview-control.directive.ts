import { Directive, Output, HostListener, EventEmitter } from '@angular/core';

@Directive({
  selector: '[controls]'
})
export class PreviewControlDirective {

  /*
    Event Emitters for the scene
  */
  @Output() mouseWheelUp = new EventEmitter();
  @Output() mouseWheelDown = new EventEmitter();
  @Output() mouseWheelUpWithCtrl = new EventEmitter();
  @Output() mouseWheelDownWithCtrl = new EventEmitter();
  @Output() mouseWheelUpWithAlt = new EventEmitter();
  @Output() mouseWheelDownWithAlt = new EventEmitter();
  @Output() mouseWheelUpWithShift = new EventEmitter();
  @Output() mouseWheelDownWithShift = new EventEmitter();
  @Output() mouseMove = new EventEmitter();
  @Output() mouseUp = new EventEmitter();
  @Output() mouseDown = new EventEmitter();
  @Output() rightClick = new EventEmitter();


  /* Mouse Wheel Event */
  @HostListener('mousewheel', ['$event']) onMouseWheelChrome(event: any) {
    if (event.ctrlKey) this.mouseWheelFuncWithCtrl(event);
    else if (event.altKey) this.mouseWheelFuncWithAlt(event);
    else if (event.shiftKey) this.mouseWheelFuncWithShift(event);
    else this.mouseWheelFunc(event);
  }


  /* Mouse Wheel Event */
  @HostListener('DOMMouseScroll', ['$event']) onMouseWheelFirefox(event: any) {
    if (event.ctrlKey) this.mouseWheelFuncWithCtrl(event);
    else if (event.altKey) this.mouseWheelFuncWithAlt(event);
    else if (event.shiftKey) this.mouseWheelFuncWithShift(event);
    else this.mouseWheelFunc(event);
  }


  /* Mouse Wheel Event */
  @HostListener('onmousewheel', ['$event']) onMouseWheelIE(event: any) {
    if (event.ctrlKey) this.mouseWheelFuncWithCtrl(event);
    else if (event.altKey) this.mouseWheelFuncWithAlt(event);
    else if (event.shiftKey) this.mouseWheelFuncWithShift(event);
    else this.mouseWheelFunc(event);
  }


  /* Mouse Move Event */
  @HostListener('mousemove', ['$event']) onMouseMove(event: any) {
    this.mouseMove.emit(event);
  }


  /* Mouse Up Event (button release) */
  @HostListener('mouseup', ['$event']) onMouseUp(event: any) {
    this.mouseUp.emit(event);
  }


  /* Mouse Down Event (button press) */
  @HostListener('mousedown', ['$event']) onMouseDown(event: any) {
    this.mouseDown.emit(event);
  }

  /* Mouse Right Click Event */
  @HostListener('contextmenu', ['$event']) onRightClick(event: any) {
    event.preventDefault();
    this.rightClick.emit(event);
    return false;
  }

  /* Mouse Wheel Event */
  mouseWheelFunc(event: any) {
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

    if (delta > 0) {
      this.mouseWheelUp.emit(event);
    } else if (delta < 0) {
      this.mouseWheelDown.emit(event);
    }

    if (event.preventDefault) {
      event.preventDefault();
    }
  }

  mouseWheelFuncWithCtrl(event: any) {
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

    if (delta > 0) {
      this.mouseWheelUpWithCtrl.emit(event);
    } else if (delta < 0) {
      this.mouseWheelDownWithCtrl.emit(event);
    }

    if (event.preventDefault) {
      event.preventDefault();
    }
  }

  mouseWheelFuncWithAlt(event: any) {
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

    if (delta > 0) {
      this.mouseWheelUpWithAlt.emit(event);
    } else if (delta < 0) {
      this.mouseWheelDownWithAlt.emit(event);
    }

    if (event.preventDefault) {
      event.preventDefault();
    }
  }

  mouseWheelFuncWithShift(event: any) {
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

    if (delta > 0) {
      this.mouseWheelUpWithShift.emit(event);
    } else if (delta < 0) {
      this.mouseWheelDownWithShift.emit(event);
    }

    if (event.preventDefault) {
      event.preventDefault();
    }
  }

}
