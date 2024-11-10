// biome-ignore lint/style/useImportType: <explanation>
import {
	Component,
	AfterViewInit,
	isDevMode,
	HostListener,
} from "@angular/core";
import {
	faVolumeUp,
	faVolumeMute,
	faCodeBranch,
	faGamepad,
} from "@fortawesome/free-solid-svg-icons";
import packageInfo from "../../../package.json";
import * as THREE from "three";
// biome-ignore lint/style/useImportType: <explanation>
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

type MandelUniform = {
	offsetX: number;
	offsetY: number;
	zoom: number;
	iterations: number;
	colorMode: number;
	modifierMode: number;
	windowRatio: number;
	cursorPositionX: number;
	cursorPositionY: number;
};

@Component({
	selector: "preview",
	templateUrl: "./preview.component.html",
	styleUrls: ["./preview.component.scss"],
})
export class PreviewComponent implements AfterViewInit {
	// Font Awesome Icons
	faVolumeDown = faVolumeUp;
	faVolumeMute = faVolumeMute;
	faIcon = faVolumeUp;
	faCodeBranch = faCodeBranch;
	faGamepad = faGamepad;

	/* ################################ */
	/* ##########  SETTINGS  ########## */
	/* ################################ */

	readonly SCROLL_HARDNESS = 1.07;
	readonly SCROLL_SLOWNESS = 100;
	readonly MAX_SCROLL_SPEED = 12;
	readonly TRANSITION_SENSITIVITY = 1.5;
	readonly TRANSITION_SLOWNESS = 0.5 * this.SCROLL_SLOWNESS;
	readonly FPS_UPDATE_DELAY = 40;
	readonly MIN_ZOOM = 0.3;
	readonly MAX_ZOOM = 2_000_000;
	readonly MIN_ITERATIONS = 2;
	readonly MAX_ITERATIONS = 1_000;
	readonly DEFAULT_ITERATIONS = 400;
	readonly ITERATIONS_SCROLL_SENSITIVITY = 1.2;
	readonly MUSIC_VOLUME = 0.1;
	readonly MUSIC_SCROLL_SENSITIVITY = 2;
	readonly JULIA_PREVIEW_SIZE = 0.25;
	readonly COLOR_MODES = ["Normal", "Smooth", "Night"];
	readonly MODIFIER_MODES = ["Normal", "Spikes", "Sponge", "3-head"];

	/* ################################ */
	/* ##########  SETTINGS  ########## */
	/* ################################ */

	previewElement!: HTMLElement;
	mesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
	renderer!: THREE.WebGLRenderer;
	camera!: THREE.OrthographicCamera;
	scene!: THREE.Scene;
	juliaMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
	juliaRenderer!: THREE.WebGLRenderer;
	juliaCamera!: THREE.OrthographicCamera;
	juliaScene!: THREE.Scene;
	lastTime!: number;
	fps = 50;
	scrollSpeed = 0;
	transitionSpeed = 0;
	fractalX = -0.5;
	fractalY = 0;
	futureFractalX = this.fractalX;
	futureFractalY = this.fractalY;
	zoom = 1;
	width = 0;
	height = 0;
	dragMode = false;
	dragStartX = 0;
	dragStartY = 0;
	iterations = this.DEFAULT_ITERATIONS;
	currentFrame = 0;
	colorMode = 0;
	modifierMode = 0;
	gpu = "";
	audio!: HTMLAudioElement;
	audioContext!: AudioContext;
	biquadFilter!: BiquadFilterNode;
	juliaWidth = 300;
	juliaHeight = 200;
	cursorPositionX = 0;
	cursorPositionY = 0;
	juliaMode = false;
	tutorialOpened = false;
	isHUDVisible = true;
	shouldRender = true;
	loaded = false;

	constructor(private http: HttpClient) {
		console.log(
			`%cFrac v${packageInfo.version}`,
			"background-color: #1e90ff; color: #fff; font-size: 16px; padding: 8px 16px; border-radius: 100px;",
		);
		this.audioContext = new AudioContext();
	}
	ngAfterViewInit() {
		void this.init();
	}

	/**
	 * Initializes everything
	 */
	async init() {
		this.previewElement = document.querySelector("preview") as HTMLElement;
		this.width = this.previewElement.offsetWidth;
		this.height = this.previewElement.offsetHeight;
		this.juliaWidth = this.width * this.JULIA_PREVIEW_SIZE;
		this.juliaHeight = this.height * this.JULIA_PREVIEW_SIZE;

		// Initialize scene
		await this.createTHREEMandelbrotEnviroment();
		await this.createTHREEJuliaEnviroment();

		this.currentFrame = 0;
		this.render();
		this.loaded = true;

		// Load audio
		this.audio = new Audio("assets/sounds/ambient.wav");
		this.audio.loop = true;
		this.audio.autoplay = true;
		const source = this.audioContext.createMediaElementSource(this.audio);
		this.biquadFilter = this.audioContext.createBiquadFilter();
		this.biquadFilter.type = "lowshelf";
		this.biquadFilter.frequency.value = 200;
		this.biquadFilter.gain.value = 0;
		source.connect(this.biquadFilter);
		this.biquadFilter.connect(this.audioContext.destination);

		// Play background audio
		this.audio.volume =
			this.getCookie("muted") !== "false" ? this.MUSIC_VOLUME : 0;
		this.faIcon = this.audio.volume ? this.faVolumeDown : this.faVolumeMute;
	}

	/**
	 * Handles canvas resizing
	 */
	@HostListener("window:resize", ["$event"])
	onResize(event: Event) {
		this.width = this.previewElement?.offsetWidth ?? null;
		this.height = this.previewElement?.offsetHeight;
		this.juliaWidth = this.width * this.JULIA_PREVIEW_SIZE;
		this.juliaHeight = this.height * this.JULIA_PREVIEW_SIZE;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
		this.updateUniforms(this.mesh, { windowRatio: this.width / this.height });
	}

	/**
	 * Renders the scene
	 */
	render() {
		this.startOfFrame();

		// Render scene
		requestAnimationFrame(() => this.render());
		if (this.shouldRender) {
			this.renderer.render(this.scene, this.camera);
			this.juliaRenderer.render(this.juliaScene, this.juliaCamera);
			this.shouldRender = false;
		}

		// Handle smooth scrolling
		this.handleZoomScrolling();
		this.handleOffsetScrolling();

		this.endOfFrame();
	}

	/**
	 * Is called before frame rendering
	 */
	startOfFrame() {
		// Define last time (for calculating the fps)
		if (!this.lastTime) {
			this.lastTime = new Date().getTime() / 1000;
		}
	}

	/**
	 * Is called after frame rendering
	 */
	endOfFrame() {
		// Calculate FPS
		if (this.currentFrame % this.FPS_UPDATE_DELAY === 0) {
			const currentTime = new Date().getTime() / 1000;
			const delta = currentTime - this.lastTime;
			const fps = this.FPS_UPDATE_DELAY / delta;
			if (this.currentFrame > this.FPS_UPDATE_DELAY) this.fps = ~~fps;
			this.lastTime = currentTime;
		}
		this.currentFrame++;
	}

	/**
	 * Handles zoom changes making them smooth
	 */
	handleZoomScrolling() {
		if (this.scrollSpeed === 0 || !this.biquadFilter) return;

		// Calculate new zoom by *multiplying* the old zoom by a value
		// (if we would *add* a value the scroll would become very slow)
		const newZoom = this.zoom * (1 + this.scrollSpeed / this.SCROLL_SLOWNESS);

		// The zoom should not be less than MIN_ZOOM
		if (newZoom > this.MIN_ZOOM && newZoom < this.MAX_ZOOM) {
			this.zoom = newZoom;
			this.updateUniforms(this.mesh, { zoom: this.zoom });
		} else this.scrollSpeed = 0;

		// Slow down scroll
		this.scrollSpeed /= this.SCROLL_HARDNESS;
		this.biquadFilter.gain.value = Math.abs(
			this.MUSIC_SCROLL_SENSITIVITY * this.scrollSpeed,
		);

		// Stop the scroll if it becomes unrecognizably slow
		if (Math.abs(this.scrollSpeed) < 0.01) this.scrollSpeed = 0;
	}

	/**
	 * Handles offset/coordinate changes making them smooth
	 */
	handleOffsetScrolling() {
		if (this.scrollSpeed === 0) return;

		const futureOffsetX = this.futureFractalX - this.fractalX;
		const futureOffsetY = this.futureFractalY - this.fractalY;
		const deltaX =
			futureOffsetX / (this.TRANSITION_SLOWNESS / Math.abs(this.scrollSpeed));
		const deltaY =
			futureOffsetY / (this.TRANSITION_SLOWNESS / Math.abs(this.scrollSpeed));

		this.fractalX += deltaX;
		this.fractalY += deltaY;
		this.updateUniforms(this.mesh, {
			offsetX: this.fractalX,
			offsetY: this.fractalY,
		});
	}

	/**
	 * Updates the uniform values
	 */
	updateUniforms(
		mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>,
		uniforms?: Partial<MandelUniform>,
	) {
		if (!mesh) {
			console.error(
				"Could not update uniforms, mesh is not defined. Try reloading the page without cache.",
			);
			return;
		}

		// Apply offset changes
		if (uniforms?.offsetX && uniforms?.offsetY && !this.juliaMode) {
			mesh.material.uniforms.u_offset = new THREE.Uniform(
				new THREE.Vector2(uniforms.offsetX, uniforms.offsetY),
			);
		}

		// Apply zoom changes
		if (uniforms?.zoom && !this.juliaMode) {
			mesh.material.uniforms.u_zoom.value = uniforms.zoom;
		}

		// Apply iteration changes
		if (uniforms?.iterations) {
			mesh.material.uniforms.u_iterations.value = uniforms.iterations;
		}

		if (uniforms?.colorMode !== undefined) {
			mesh.material.uniforms.u_colormode.value = uniforms.colorMode;
		}

		if (uniforms?.modifierMode !== undefined) {
			mesh.material.uniforms.u_modifiermode.value = uniforms.modifierMode;
		}

		if (uniforms?.windowRatio) {
			mesh.material.uniforms.u_window_ratio.value = uniforms.windowRatio;
		}

		if (uniforms?.cursorPositionX && uniforms?.cursorPositionY) {
			mesh.material.uniforms.u_cursor_position = new THREE.Uniform(
				new THREE.Vector2(this.cursorPositionX, this.cursorPositionY),
			);
		}

		if (uniforms?.modifierMode) {
			mesh.material.uniforms.u_modifiermode.value = this.modifierMode;
		}

		if (uniforms?.colorMode) {
			mesh.material.uniforms.u_colormode.value = this.colorMode;
		}

		// Render on uniform change
		this.shouldRender = true;
	}

	/**
	 * Toggles preview of the julia set
	 */
	async toggleJuliaView() {
		this.juliaMode = !this.juliaMode;

		const jmaterial = await this.createJuliaMaterial();
		const material = await this.createMandelbrotMaterial();

		// Update Mandelbrot scene
		this.scene = new THREE.Scene();
		this.mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(),
			this.juliaMode ? jmaterial : material,
		);
		this.scene.add(this.mesh);

		// Update Julia scene
		this.juliaScene = new THREE.Scene();
		this.juliaMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(),
			this.juliaMode ? material : jmaterial,
		);
		this.juliaScene.add(this.juliaMesh);
	}

	/*
	 * Creates and handles all THREE.js realted stuff (Mandelbrot Set)
	 */
	async createTHREEMandelbrotEnviroment() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);
		this.renderer = new THREE.WebGLRenderer({
			preserveDrawingBuffer: true,
			antialias: true,
			precision: "highp",
			powerPreference: "high-performance",
			depth: false,
			stencil: false,
		});
		this.renderer.gammaFactor = 2.2;
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		const geometry = new THREE.PlaneGeometry();
		const material = await this.createMandelbrotMaterial();
		this.mesh = new THREE.Mesh(geometry, material);
		this.renderer.setSize(this.width, this.height);
		this.previewElement?.appendChild(this.renderer.domElement);
		this.scene.add(this.mesh);

		// Display hardware information
		try {
			this.gpu = this.getGPU() ?? "";
		} catch (e) {}
	}

	/**
	 * Creates a mandelbrot set material
	 */
	async createMandelbrotMaterial() {
		return new THREE.ShaderMaterial({
			uniforms: {
				u_zoom: { value: this.zoom },
				u_window_ratio: { value: this.width / this.height },
				u_iterations: { value: this.iterations },
				u_offset: new THREE.Uniform(
					new THREE.Vector2(this.fractalX, this.fractalY),
				),
				u_colormode: { value: this.colorMode },
				u_modifiermode: { value: this.modifierMode },
			},
			vertexShader: await this.fetchShader("mandelbrot", "vertex"),
			fragmentShader: await this.fetchShader("mandelbrot", "fragment"),
		});
	}

	/*
	 * Creates and handles all THREE.js realted stuff (Julia Set)
	 */
	async createTHREEJuliaEnviroment() {
		this.juliaScene = new THREE.Scene();
		this.juliaCamera = new THREE.OrthographicCamera(
			-0.5,
			0.5,
			0.5,
			-0.5,
			-1,
			1,
		);
		this.juliaRenderer = new THREE.WebGLRenderer({
			preserveDrawingBuffer: true,
			antialias: true,
			precision: "highp",
			powerPreference: "high-performance",
			depth: false,
			stencil: false,
		});
		this.juliaRenderer.gammaFactor = 2.2;
		this.juliaRenderer.outputEncoding = THREE.sRGBEncoding;
		const geometry = new THREE.PlaneGeometry();
		const material = await this.createJuliaMaterial();
		this.juliaMesh = new THREE.Mesh(geometry, material);
		this.juliaRenderer.setSize(this.juliaWidth, this.juliaHeight);
		this.juliaRenderer.domElement.className += "julia";
		this.juliaRenderer.domElement.addEventListener("click", () =>
			this.toggleJuliaView.call(this),
		);
		this.previewElement?.appendChild(this.juliaRenderer.domElement);
		this.juliaScene.add(this.juliaMesh);
	}

	/**
	 * Creates a julia set material
	 */
	async createJuliaMaterial() {
		return new THREE.ShaderMaterial({
			uniforms: {
				u_window_ratio: { value: this.juliaWidth / this.juliaHeight },
				u_iterations: { value: this.iterations },
				u_colormode: { value: this.colorMode },
				u_modifiermode: { value: this.modifierMode },
				u_cursor_position: new THREE.Uniform(
					new THREE.Vector2(this.cursorPositionX, this.cursorPositionY),
				),
			},
			vertexShader: await this.fetchShader("julia", "vertex"),
			fragmentShader: await this.fetchShader("julia", "fragment"),
		});
	}

	/**
	 * Returns GPU hardware information
	 */
	getGPU() {
		function extractValue(reg: RegExp, str: string) {
			const matches = str.match(reg);
			return matches?.[0];
		}

		// WebGL Context Setup
		const canvas = document.createElement("canvas");
		const gl = canvas.getContext("webgl");
		if (!gl) return "";

		const renderer = gl.getParameter(gl.RENDERER);
		console.log(`Renderer: "${renderer}"`);

		// Full card description and webGL layer (if present)
		const directInfoIndex = renderer?.indexOf("Direct") ?? -1;
		return (
			directInfoIndex > 0
				? renderer.substring(0, directInfoIndex).trim()
				: renderer
		).replace(", or similar", "");
	}

	/**
	 * Fetches a shader from the shader folder
	 *
	 * @param name Name of the glsl file
	 * @param type Fragment or vertex shader
	 */
	async fetchShader(name: string, type: 'fragment' | 'vertex'): Promise<string> {
    const path = `assets/shaders/${type}/${name}.glsl`;
    return firstValueFrom(this.http.get(path, { responseType: 'text' }));
  }

	/**
	 * Handles the zoomIn event
	 */
	zoomIn(event: MouseEvent) {
		if (!this.loaded) return;
		if (this.juliaMode) {
			this.scrollSpeed = 0;
			return;
		}

		if (this.scrollSpeed < this.MAX_SCROLL_SPEED) this.scrollSpeed += 2;

		const fractalWidth = 1 / this.zoom;
		const ratioX = event.x / this.width - 0.5;
		const ratioY = -(event.y / this.height) + 0.5;
		const newFractalX =
			this.fractalX +
			(this.TRANSITION_SENSITIVITY * ratioX * fractalWidth * this.width) /
				this.height;
		const newFractalY =
			this.fractalY + this.TRANSITION_SENSITIVITY * ratioY * fractalWidth;

		this.futureFractalX = newFractalX;
		this.futureFractalY = newFractalY;
		this.transitionSpeed = 2;
	}

	/**
	 * Handles the zoomOut event
	 */
	zoomOut(event: MouseEvent) {
		if (!this.loaded) return;
		if (this.juliaMode) {
			this.scrollSpeed = 0;
			return;
		}

		if (this.scrollSpeed > -this.MAX_SCROLL_SPEED) this.scrollSpeed -= 2;

		const fractalWidth = 1 / this.zoom;
		const ratioX = event.x / this.width - 0.5;
		const ratioY = -(event.y / this.height) + 0.5;
		const newFractalX =
			this.fractalX -
			(this.TRANSITION_SENSITIVITY * ratioX * fractalWidth * this.width) /
				this.height;
		const newFractalY =
			this.fractalY - this.TRANSITION_SENSITIVITY * ratioY * fractalWidth;

		this.futureFractalX = newFractalX;
		this.futureFractalY = newFractalY;
		this.transitionSpeed = 2;
	}

	/**
	 * Handles the mousemove event (used on mouse-drag)
	 */
	mouseMove(event: MouseEvent) {
		if (!this.loaded) return;

		// Play audio on user interaction
		try {
			if (this.audioContext) this.audioContext.resume();
			this.audio.play();
		} catch (e) {}

		// Store current cursor position for julia set evaluation
		const fractalWidthX = (2 * (this.width / this.height)) / this.zoom;
		const fractalWidthY = 2 / this.zoom;
		this.cursorPositionX =
			(this.dragMode ? this.futureFractalX : this.fractalX) +
			(event.x / this.width - 0.5) * fractalWidthX;
		this.cursorPositionY =
			(this.dragMode ? this.futureFractalY : this.fractalY) -
			(event.y / this.height - 0.5) * fractalWidthY;
		this.updateUniforms(this.juliaMesh, {
			cursorPositionX: this.cursorPositionX,
			cursorPositionY: this.cursorPositionY,
		});
		this.updateUniforms(this.mesh, {
			cursorPositionX: this.cursorPositionX,
			cursorPositionY: this.cursorPositionY,
		});

		if ((event.buttons !== 1 || !this.dragMode) && !this.juliaMode) return;

		const deltaPixelsX = this.dragStartX - event.x;
		const deltaPixelsY = -this.dragStartY + event.y;
		const newFractalX =
			this.fractalX + (fractalWidthX * deltaPixelsX) / this.width;
		const newFractalY =
			this.fractalY + (fractalWidthY * deltaPixelsY) / this.height;

		this.futureFractalX = newFractalX;
		this.futureFractalY = newFractalY;
		this.updateUniforms(this.mesh, {
			offsetX: newFractalX,
			offsetY: newFractalY,
		});
	}

	/**
	 * Handles the mouseUp event (when mouse-click is released)
	 */
	mouseUp(event: MouseEvent) {
		if (!this.loaded) return;
		if (this.juliaMode) return;
		this.dragMode = false;
		this.fractalX = this.futureFractalX;
		this.fractalY = this.futureFractalY;
	}

	/**
	 * Handles the mouseDown event (when mouse-click is pressed)
	 */
	mouseDown(event: MouseEvent) {
		if (!this.loaded) return;
		if (this.juliaMode) return;
		this.dragMode = true;
		this.dragStartX = event.x;
		this.dragStartY = event.y;
		this.scrollSpeed = 0;
	}

	/**
	 * Increases the iteration count
	 */
	increaseIterations(event: MouseEvent) {
		if (!this.loaded) return;
		const newIterations = this.iterations * this.ITERATIONS_SCROLL_SENSITIVITY;
		if (newIterations > this.MAX_ITERATIONS) {
			this.iterations = this.MAX_ITERATIONS;
		} else if (newIterations < this.MIN_ITERATIONS) {
			this.iterations = this.MIN_ITERATIONS;
		} else {
			this.iterations = newIterations;
		}

		this.updateUniforms(this.mesh, { iterations: Math.floor(this.iterations) });
		this.updateUniforms(this.juliaMesh, {
			iterations: Math.floor(this.iterations),
		});
	}

	/**
	 * Decreases the iteration count
	 */
	decreaseIterations(event: MouseEvent) {
		if (!this.loaded) return;
		const newIterations = this.iterations / this.ITERATIONS_SCROLL_SENSITIVITY;
		if (newIterations > this.MAX_ITERATIONS) {
			this.iterations = this.MAX_ITERATIONS;
		} else if (newIterations < this.MIN_ITERATIONS) {
			this.iterations = this.MIN_ITERATIONS;
		} else {
			this.iterations = newIterations;
		}

		this.updateUniforms(this.mesh, { iterations: Math.floor(this.iterations) });
		this.updateUniforms(this.juliaMesh, {
			iterations: Math.floor(this.iterations),
		});
	}

	toggleColorModeUp(event: MouseEvent) {
		if (!this.loaded) return;
		this.colorMode = (this.colorMode + 1) % this.COLOR_MODES.length;
		this.toggleColorMode();
	}

	toggleColorModeDown(event: MouseEvent) {
		if (!this.loaded) return;
		const N = this.COLOR_MODES.length;
		this.colorMode = (this.colorMode - (1 % N) + N) % N;
		this.toggleColorMode();
	}

	toggleColorMode() {
		if (!this.loaded) return;
		this.updateUniforms(this.mesh, { colorMode: this.colorMode });
		this.updateUniforms(this.juliaMesh, { colorMode: this.colorMode });
	}

	toggleModifierModeUp(event: MouseEvent) {
		if (!this.loaded) return;
		this.modifierMode = (this.modifierMode + 1) % this.MODIFIER_MODES.length;
		this.toggleModifierMode();
	}

	toggleModifierModeDown(event: MouseEvent) {
		if (!this.loaded) return;
		const N = this.MODIFIER_MODES.length;
		this.modifierMode = (this.modifierMode - (1 % N) + N) % N;
		this.toggleModifierMode();
	}

	toggleModifierMode() {
		if (!this.loaded) return;
		this.updateUniforms(this.mesh, { modifierMode: this.modifierMode });
		this.updateUniforms(this.juliaMesh, { modifierMode: this.modifierMode });
	}

	saveDialog(event: MouseEvent) {
		const saveDialog = document.getElementById("save");
		if (!saveDialog) return;

		saveDialog.style.display = "block";
		saveDialog.style.left = `${event.x}px`;
		saveDialog.style.top = `${event.y}px`;
	}

	onClick(event: MouseEvent) {
		const saveDialog = document.getElementById("save");
		if (!saveDialog) return;

		saveDialog.style.display = "none";
	}

	onSave(event: MouseEvent) {
		const saveDialog = document.getElementById("save");
		if (!saveDialog) return;

		saveDialog.style.display = "none";

		const canvas = document.getElementsByTagName("canvas");
		if (!canvas.length) return;

		const data = canvas[0].toDataURL("image/png");
		this.download(this.juliaMode ? "julia.png" : "mandelbrot.png", data);
	}

	// must be called in a click handler or some other user action
	download(filename: string, dataUrl: string) {
		const element = document.createElement("a");

		const dataBlob = this.dataURLtoBlob(dataUrl);
		element.setAttribute("href", URL.createObjectURL(dataBlob));
		element.setAttribute("download", filename);
		element.style.display = "none";
		document.body.appendChild(element);
		element.click();

		function clickHandler() {
			requestAnimationFrame(() => {
				URL.revokeObjectURL(element.href);
			});

			element.removeAttribute("href");
			element.removeEventListener("click", clickHandler);
		}
		element.addEventListener("click", clickHandler);

		document.body.removeChild(element);
	}

	dataURLtoBlob(dataurl: string) {
		const parts = dataurl.split(",");
		const mime = parts[0].match(/:(.*?);/)?.[1] ?? "image/png";
		if (parts[0].indexOf("base64") !== -1) {
			const bstr = atob(parts[1]);
			let n = bstr.length;
			const u8arr = new Uint8Array(n);
			while (n--) {
				u8arr[n] = bstr.charCodeAt(n);
			}

			return new Blob([u8arr], { type: mime });
		}

		const raw = decodeURIComponent(parts[1]);
		return new Blob([raw], { type: mime });
	}

	/**
	 * Mutes and unmutes the background music
	 */
	toggleVolume() {
		if (this.audio.volume) {
			this.audio.volume = 0;
			this.faIcon = faVolumeMute;
		} else {
			this.audio.volume = this.MUSIC_VOLUME;
			this.faIcon = faVolumeUp;
		}

		this.setCookie("muted", !!this.audio.volume);
	}

	/**
	 * Sets a cookie
	 */
	setCookie(name: string, value: string | number | boolean) {
		const d = new Date();
		d.setTime(d.getTime() + 14 * 24 * 60 * 60 * 1000);
		const expires = `expires=${d.toUTCString()}`;
		document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
	}

	/**
	 * Fetches a cookie
	 */
	getCookie(name: string): string {
		const cookieName = `${name}=`;
		const decodedCookie = decodeURIComponent(document.cookie);
		const ca = decodedCookie.split(";");
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === " ") {
				c = c.substring(1);
			}
			if (c.indexOf(cookieName) === 0) {
				return c.substring(cookieName.length, c.length);
			}
		}
		return "";
	}

	/**
	 * Fires when user presses a key
	 */
	@HostListener("document:keypress", ["$event"])
	handleKeyboardEvent(event: KeyboardEvent) {
		const handlers: Record<string, () => unknown> = {
			j: this.toggleJuliaView,
			J: this.toggleJuliaView,
			M: this.toggleVolume,
			m: this.toggleVolume,
			T: this.toggleTutorial,
			t: this.toggleTutorial,
			" ": this.toggleHUD,
		};

		handlers[event.key]?.call(this);
	}

	/**
	 * Opens the tutorial page
	 */
	openTutorial() {
		this.tutorialOpened = true;
	}

	/**
	 * Closes the tutorial page
	 */
	closeTutorial() {
		this.tutorialOpened = false;
	}

	/**
	 * Closes/Opens the tutorial page
	 */
	toggleTutorial() {
		this.tutorialOpened = !this.tutorialOpened;
	}

	/**
	 * Toggles Settings, Julia Preview ...
	 */
	toggleHUD() {
		this.isHUDVisible = !this.isHUDVisible;
		const fpsElement = document.getElementById("fps");
		const settingsElement = document.getElementById("settings");
		const modeElement = document.getElementById("mode");
		const juliaElements = document.getElementsByClassName("julia");
		const juliaElement = juliaElements.length
			? (juliaElements[0] as HTMLElement)
			: null;

		if (fpsElement)
			fpsElement.style.display = this.isHUDVisible ? "block" : "none";

		if (settingsElement)
			settingsElement.style.display = this.isHUDVisible ? "block" : "none";

		if (modeElement)
			modeElement.style.display = this.isHUDVisible ? "block" : "none";

		if (juliaElement)
			juliaElement.style.display = this.isHUDVisible ? "block" : "none";
	}
}
