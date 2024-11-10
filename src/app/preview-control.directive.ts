import { Directive, Output, HostListener, EventEmitter } from "@angular/core";

@Directive({
	selector: "[controls]",
})
export class PreviewControlDirective {
	/*
    Event Emitters for the scene
  */
	@Output() mouseWheelUp = new EventEmitter<MouseEvent>();
	@Output() mouseWheelDown = new EventEmitter<MouseEvent>();
	@Output() mouseWheelUpWithCtrl = new EventEmitter<MouseEvent>();
	@Output() mouseWheelDownWithCtrl = new EventEmitter<MouseEvent>();
	@Output() mouseWheelUpWithAlt = new EventEmitter<MouseEvent>();
	@Output() mouseWheelDownWithAlt = new EventEmitter<MouseEvent>();
	@Output() mouseWheelUpWithShift = new EventEmitter<MouseEvent>();
	@Output() mouseWheelDownWithShift = new EventEmitter<MouseEvent>();
	@Output() mouseMove = new EventEmitter<MouseEvent>();
	@Output() mouseUp = new EventEmitter<MouseEvent>();
	@Output() mouseDown = new EventEmitter<MouseEvent>();
	@Output() rightClick = new EventEmitter<MouseEvent>();

	@HostListener("wheel", ["$event"])
	onWheel(event: WheelEvent): void {
			if (event.ctrlKey) this.mouseWheelFuncWithCtrl(event);
			else if (event.altKey) this.mouseWheelFuncWithAlt(event);
			else if (event.shiftKey) this.mouseWheelFuncWithShift(event);
			else this.mouseWheelFunc(event);
	}

	@HostListener("mousemove", ["$event"])
	onMouseMove(event: MouseEvent): void {
		this.mouseMove.emit(event);
	}

	@HostListener("mouseup", ["$event"])
	onMouseUp(event: MouseEvent): void {
		this.mouseUp.emit(event);
	}

	@HostListener("mousedown", ["$event"])
	onMouseDown(event: MouseEvent): void {
		this.mouseDown.emit(event);
	}

	@HostListener("contextmenu", ["$event"])
	onRightClick(event: MouseEvent): boolean {
		event.preventDefault();
		this.rightClick.emit(event);
		return false;
	}

	mouseWheelFunc(event: WheelEvent) {
		const delta = event.deltaY !== undefined ? -Math.sign(event.deltaY) : -Math.sign(event.detail);

		if (delta > 0) {
			this.mouseWheelUp.emit(event);
		} else if (delta < 0) {
			this.mouseWheelDown.emit(event);
		}

		if (event.preventDefault) {
			event.preventDefault();
		}
	}

	mouseWheelFuncWithCtrl(event: WheelEvent) {
		const delta = -Math.sign(event.deltaY);

		if (delta > 0) {
			this.mouseWheelUpWithCtrl.emit(event);
		} else if (delta < 0) {
			this.mouseWheelDownWithCtrl.emit(event);
		}

		if (event.preventDefault) {
			event.preventDefault();
		}
	}

	mouseWheelFuncWithAlt(event: WheelEvent) {
		const delta = -Math.sign(event.deltaY);

		if (delta > 0) {
			this.mouseWheelUpWithAlt.emit(event);
		} else if (delta < 0) {
			this.mouseWheelDownWithAlt.emit(event);
		}

		if (event.preventDefault) {
			event.preventDefault();
		}
	}

	mouseWheelFuncWithShift(event: WheelEvent) {
		const delta = -Math.sign(event.deltaY);

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
