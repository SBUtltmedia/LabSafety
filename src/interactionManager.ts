import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { PointerInput } from "@babylonjs/core/DeviceInput/InputDevices/deviceEnums";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { HighlightLayer } from "@babylonjs/core/Layers/highlightLayer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { Observable } from "@babylonjs/core/Misc/observable";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience";
import { WebXRInputSource } from "@babylonjs/core/XR/webXRInputSource";
import { WebXRState } from "@babylonjs/core/XR/webXRTypes";
import { WebXRAbstractMotionController } from "@babylonjs/core/XR/motionController/webXRAbstractMotionController";

import { InteractableBehavior } from "./interactableBehavior";
import { log } from "./utils";
import { activateButton, grabButton, meshesLoaded } from "./scene";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";
import { KeyboardEventTypes, UniversalCamera, IMouseEvent } from "@babylonjs/core";

interface IModeSelectorMap {
	[mode: number]: {
		[id: number]: ISelector;
	};
}

interface ISelector {
	anchor: AbstractMesh;
	grabber: AbstractMesh;
	grabbedMesh: Nullable<AbstractMesh>;
	targetMesh: Nullable<AbstractMesh>;
}

export interface IMeshGrabInfo {
	anchor: AbstractMesh;
	grabber: AbstractMesh;
	state: GrabState;
}

export interface IMeshActivationInfo {
	anchor: AbstractMesh;
	grabber: AbstractMesh;
	state: ActivationState;
}

export interface IGrabInfo {
	mesh: AbstractMesh;
	state: GrabState;
}

export enum InteractionMode {
	DESKTOP,
	XR,
	MOBILE,
	LOADING,
}

export enum GrabState {
	GRAB,
	DROP,
}

export enum ActivationState {
	ACTIVE,
	INACTIVE,
}

const SELECTOR_LENGTH = 9.0;
const SELECTOR_DIAMETER = 0.005;

export class InteractionManager {
	onMeshGrabStateChangedObservable: Observable<IMeshGrabInfo> =
		new Observable();
	onMeshActivationStateChangedObservable: Observable<IMeshActivationInfo> =
		new Observable();
	onModeChangeObservable: Observable<InteractionMode> = new Observable();
	onHasAnyTargetsObservable: Observable<boolean> = new Observable(); // Fires when this.#activeTargets goes from being empty to non-empty or non-empty to empty.
	onGrabStateChangedObservable: Observable<IGrabInfo> = new Observable(); // Distinct from onMeshGrabStateChanged in that it notifies all observers, not just the relevant mesh's observer.
	scene: Scene;
	highlightLayer: HighlightLayer;
	modeSelectorMap: IModeSelectorMap = {
		[InteractionMode.DESKTOP]: {},
		[InteractionMode.XR]: {},
		[InteractionMode.MOBILE]: {},
		[InteractionMode.LOADING]: {},
	};
	hasDefaultSelector: boolean = false;
	#configuredDesktop: boolean = false;
	#configuredMobile: boolean = false;
	#configuredXR: boolean = false;
	#activeTargets: AbstractMesh[] = [];
	interactionMode: InteractionMode = InteractionMode.LOADING;
	interactableMeshes: AbstractMesh[] = [];
	mode: InteractionMode;

	xrExperience?: WebXRDefaultExperience;

	isUsingXRObservable: Observable<Boolean> = new Observable();

	constructor(scene: Scene, xrExperience?: WebXRDefaultExperience) {
		this.scene = scene;
		if (xrExperience) {
			this.xrExperience = xrExperience;
			this.xrExperience.baseExperience.onStateChangedObservable.add(
				(state) => {
					this.#switchModeFromXRState(state);
				}
			);
		}

		this.#switchModeFromXRState(
			this.xrExperience === undefined
				? WebXRState.NOT_IN_XR
				: this.xrExperience.baseExperience.state
		);

		this.highlightLayer = new HighlightLayer("interaction-highlight-layer");

		this.scene.onBeforeRenderObservable.add(() => {
			// Clear targets from previous render
			const numPreviousTargets = this.#activeTargets.length;
			this.#activeTargets.splice(0, this.#activeTargets.length);

			// Find valid targets for active selectors
			const selectors = this.getActiveSelectors();
			const grabbedMeshes = selectors
				.filter(({ grabbedMesh }) => Boolean(grabbedMesh))
				.map(({ grabbedMesh }) => grabbedMesh);
			const availableSelectors = selectors.filter(
				({ grabbedMesh }) => !Boolean(grabbedMesh)
			); // Selectors not currently grabbing
			const validTargets = this.interactableMeshes.filter(
				(mesh) => !grabbedMeshes.includes(mesh)
			); // Interactables not currently grabbed
			const targets: {
				[id: number]: AbstractMesh;
			} = {};
			for (const selector of availableSelectors) {
				const targetMeshes = [];
				for (const target of validTargets) {
					if (selector.grabber.intersectsMesh(target, true)) {
						targetMeshes.push(target);
					}
				}
				selector.targetMesh = this.#selectTarget(
					selector.grabber,
					targetMeshes
				);
				if (selector.targetMesh) {
					targets[selector.targetMesh.uniqueId] = selector.targetMesh;
				}
			}
			this.#activeTargets.push(...Object.values(targets));

			// Highlight all valid targets
			this.highlightLayer.removeAllMeshes();
			for (const target of this.#activeTargets) {
				if (target instanceof Mesh) {
					this.highlightLayer.addMesh(target, Color3.Gray());
				}
			}

			if (this.#activeTargets.length === 0 && numPreviousTargets !== 0) {
				this.onHasAnyTargetsObservable.notifyObservers(false);
			} else if (
				this.#activeTargets.length !== 0 &&
				numPreviousTargets === 0
			) {
				this.onHasAnyTargetsObservable.notifyObservers(true);
			}
		});
	}

	#configureController = (controller: WebXRInputSource) => {
		if (controller.motionController) {
			this.#configureMotionController(
				controller.motionController,
				controller.pointer.uniqueId
			);
		}
		controller.onMotionControllerInitObservable.add((motionController) => {
			this.#configureMotionController(
				motionController,
				controller.pointer.uniqueId
			);
		});
	};

	#configureMotionController = (
		motionController: WebXRAbstractMotionController,
		anchorId: number
	) => {
		const squeeze = motionController.getComponentOfType("squeeze");
		if (squeeze) {
			squeeze.onButtonStateChangedObservable.add(() => {
				if (squeeze.changes.pressed) {
					console.log("Checking squeeze");
					this.#findGrabAndNotify(squeeze.pressed, anchorId);
				}
			});
		} else {
			log("Squeeze component not found on motion controller.");
		}

		const select = motionController.getMainComponent();
		if (select) {
			select.onButtonStateChangedObservable.add(() => {
				if (select.changes.pressed) {
					this.#checkActivate(select.pressed, anchorId);
				}
			});
		} else {
			log("Main component not found on motion controller.");
		}
	};

	#findGrabAndNotify = (grab: boolean, anchorId: number) => {
		const selector = this.modeSelectorMap[this.interactionMode][anchorId];
		let grabState;
		let mesh;
		if (grab) {
			if (selector.targetMesh) {
				selector.grabbedMesh = selector.targetMesh;
				selector.targetMesh = null;
				grabState = GrabState.GRAB;
				mesh = selector.grabbedMesh;
			}
		} else {
			if (selector.grabbedMesh) {
				mesh = selector.grabbedMesh;
				selector.grabbedMesh = null;
				grabState = GrabState.DROP;
			}
		}

		this.#notifyGrabMeshObserver(mesh, {
			anchor: selector.anchor,
			grabber: selector.grabber,
			state: grabState,
		});
	};

	#checkActivate = (activate: boolean, anchorId: number) => {
		const { anchor, grabber, grabbedMesh } =
			this.modeSelectorMap[this.interactionMode][anchorId];

		if (!grabbedMesh) {
			return;
		}
		// Note that we notify the behavior even if it isn't active or even activatable.
		// This is handled in the InteractableBehavior.
		if (activate) {
			this.#notifyActivationMeshObserver(grabbedMesh, {
				anchor,
				grabber,
				state: ActivationState.ACTIVE,
			});
		} else {
			this.#notifyActivationMeshObserver(grabbedMesh, {
				anchor,
				grabber,
				state: ActivationState.INACTIVE,
			});
		}
	};

	#notifyGrabMeshObserver = (mesh: AbstractMesh, grabInfo: IMeshGrabInfo) => {
		if (mesh.isDisposed()) {
			// If the mesh is grabbed by any selector, set it to null.
			// Don't notify observers, because the mesh's behaviors
			// were detached on disposal.
			for (const mode in this.modeSelectorMap) {
				for (const selector of Object.values(
					this.modeSelectorMap[mode]
				)) {
					if (selector.grabbedMesh === mesh) {
						selector.grabbedMesh = null;
					}
				}
			}
			return;
		}
		const behavior = mesh.getBehaviorByName(
			"Interactable"
		) as InteractableBehavior;
		if (!behavior) {
			throw new Error(
				"InteractionManager: grabbed mesh must have InteractableBehavior."
			);
		}
		this.onMeshGrabStateChangedObservable.notifyObserver(
			behavior.grabStateObserver,
			grabInfo
		);
		this.onGrabStateChangedObservable.notifyObservers({
			mesh,
			state: grabInfo.state,
		});
	};

	#notifyActivationMeshObserver = (
		mesh: AbstractMesh,
		activationInfo: IMeshActivationInfo
	) => {
		if (mesh.isDisposed()) {
			// @todo: I don't like that we have to handle this here.
			return;
		}
		const behavior = mesh.getBehaviorByName(
			"Interactable"
		) as InteractableBehavior;
		if (!behavior) {
			throw new Error(
				"InteractionManager: activated mesh must have InteractableBehavior."
			);
		}
		this.onMeshActivationStateChangedObservable.notifyObserver(
			behavior.activationStateObserver,
			activationInfo,
			mesh.uniqueId
		);
	};

	#switchModeFromXRState = (state: WebXRState) => {
		console.log("-------------Switch from XR state --- ");
		if (state === WebXRState.NOT_IN_XR) {
			console.log("Not in XR");
			if (
				"ontouchstart" in window ||
				navigator.maxTouchPoints > 0 ||
				navigator.maxTouchPoints > 0
			) {
				// @todo: predicate if mobile mode should be used
				this.#switchMode(InteractionMode.MOBILE);
			} else {
				// Fall back to desktop mode
				this.#switchMode(InteractionMode.DESKTOP);
			}
		} else if (state === WebXRState.IN_XR) {
			console.log("IN XR");
			this.#switchMode(InteractionMode.XR);
		} else {
			console.log("In loading");
			this.#switchMode(InteractionMode.LOADING);
		}
	};

	#switchMode = (mode: InteractionMode) => {
		const selectors = this.getActiveSelectors();
		this.mode = mode;
		this.onModeChangeObservable.notifyObservers(mode);
		// Drop everything
		for (const selector of selectors) {
			if (selector.grabbedMesh) {
				this.#notifyGrabMeshObserver(selector.grabbedMesh, {
					anchor: selector.anchor,
					grabber: selector.grabber,
					state: GrabState.DROP,
				});
				selector.grabbedMesh = null;
			}
		}

		this.interactionMode = mode;

		if (
			(mode === InteractionMode.DESKTOP ||
				mode === InteractionMode.MOBILE) &&
			!this.hasDefaultSelector
		) {
			this.#addDefaultSelector(this.scene.activeCamera);
		}

		if (mode === InteractionMode.DESKTOP) {
			this.#configureDesktopInteractionOnce();
		} else if (mode === InteractionMode.MOBILE) {
			this.#configureMobileInteractionOnce();
		} else if (mode === InteractionMode.XR) {
			this.#configureXRInteractionOnce();
		}
	};

	addSelector = (
		anchorMesh: AbstractMesh,
		grabberMesh: AbstractMesh,
		modes: InteractionMode[]
	) => {
		const selectorObj: ISelector = {
			anchor: anchorMesh,
			grabber: grabberMesh,
			grabbedMesh: null,
			targetMesh: null,
		};
		for (const mode of modes) {
			// Note: passed by reference
			this.modeSelectorMap[mode][anchorMesh.uniqueId] = selectorObj;
		}
	};

	#addDefaultSelector = (camera: Camera) => {
		const grabber = CreateCylinder("default-grabber", {
			height: SELECTOR_LENGTH,
			diameter: SELECTOR_DIAMETER,
		});
		grabber.isVisible = false;
		grabber.isPickable = false;
		grabber.setParent(camera);
		grabber.position.setAll(0);
		grabber.rotation.copyFromFloats(0, 0, 0);

		const anchor = new AbstractMesh("default-anchor");
		anchor.isPickable = false;
		anchor.setParent(camera);
		anchor.position.copyFrom(new Vector3(0, 0, 1));

		this.addSelector(anchor, grabber, [
			InteractionMode.DESKTOP,
			InteractionMode.MOBILE,
		]);
		this.hasDefaultSelector = true;
	};

	#configureInteraction = () => {
		const selector = Object.values(
			this.modeSelectorMap[InteractionMode.MOBILE]
		).find(({ anchor }) => anchor.name === "default-anchor");
		if (selector === undefined) {
			throw new Error(
				"Tried to configure mobile interaction without default selector."
			);
		}
		const { anchor } = selector;

		let cylinderNames = ["cylinder-a", "cylinder-b", "cylinder-c"];

		const canvas = this.scene.getEngine().getRenderingCanvas();

        const camera = this.scene.activeCamera as UniversalCamera;

		meshesLoaded.add((loaded) => {
			if (this.interactionMode !== InteractionMode.XR && loaded) {
				for (let cylinderName of cylinderNames) {
					const cylinderMesh =
						this.scene.getMeshByName(cylinderName);

					let ibh = cylinderMesh.getBehaviorByName(
						"Interactable"
					) as InteractableBehavior;
					ibh.moveAttached = false;

					const pointerDragBehavior = new PointerDragBehavior({
						dragPlaneNormal: new Vector3(0, 1, 0),
					});

					pointerDragBehavior.moveAttached = true;

					// Use drag plane in world space
					pointerDragBehavior.useObjectOrientationForDragging = false;

                    const rotateEdges = () => {
						// console.log(this.#scene.pointerX, this.#scene.pointerY);
						let pointerX = this.scene.pointerX;
						let pointerY = this.scene.pointerY;

						// Define border thresholds (e.g., within 10 pixels of the edge)
						const borderThreshold = 10;

						// Check if the pointer is near the left or right border
						const atLeftBorder = pointerX <= borderThreshold;
						const atRightBorder =
							pointerX >= canvas.width - borderThreshold;

						// Check if the pointer is near the top or bottom border
						const atTopBorder = pointerY <= borderThreshold;
						const atBottomBorder =
							pointerY >= canvas.height - borderThreshold;

                        const rotationDelta = 0.025;

						// Log the results or take action if at any border
						if (atLeftBorder) {
                            camera.rotation.y -= rotationDelta;
                        } else if (atRightBorder) {
                            camera.rotation.y += rotationDelta;
                        } else if (atTopBorder) {
                            camera.rotation.x -= rotationDelta;
                        } else if (atBottomBorder) {
                            camera.rotation.x += rotationDelta;
                        }
                    }

					// Listen to drag events
					pointerDragBehavior.onDragStartObservable.add((event) => {
						// problem over here is that sometiems you pick-up the label which is not good
						
						if (event.pointerInfo.event.inputIndex === PointerInput.LeftClick) {
							console.log(event.pointerInfo.event.inputIndex);

							let mesh = event.pointerInfo.pickInfo.pickedMesh;
							for (let cName of cylinderNames) {
								if (mesh.id.startsWith(cName)) {
									mesh = this.scene.getMeshByName(cName);
									break;
								}
							}
							this.modeSelectorMap[this.interactionMode][
								anchor.uniqueId
							].targetMesh = mesh;
							this.#findGrabAndNotify(true, anchor.uniqueId);
							rotateEdges();
						} else {
							pointerDragBehavior.releaseDrag();
						}
					});
					pointerDragBehavior.onDragEndObservable.add((event) => {
						if (event.pointerInfo.event.inputIndex === PointerInput.LeftClick) {
							let mesh = event.pointerInfo.pickInfo.pickedMesh;
							for (let cName of cylinderNames) {
								if (mesh.id.startsWith(cName)) {
									mesh = this.scene.getMeshByName(cName);
									break;
								}
							}
							this.#findGrabAndNotify(false, anchor.uniqueId);
							// camera.detachControl(true);
							rotateEdges();
						} else {
							pointerDragBehavior.releaseDrag();
						}
					});

					pointerDragBehavior.onDragObservable.add((event) => {
						if (event.pointerInfo.event.inputIndex === PointerInput.LeftClick) {
							camera.attachControl(true);
							rotateEdges();
						} else {
							pointerDragBehavior.releaseDrag();
						}
					});
					cylinderMesh.addBehavior(pointerDragBehavior);
				}

				const clipboard = this.scene.getMeshByName("clipboard");

				const fireExtinguisher =
					this.scene.getMeshByName("fire-extinguisher");

				let pickedMesh: Nullable<AbstractMesh>;

				const clickableObjects = [clipboard, fireExtinguisher];

				const castRay = () => {
					let ray = this.scene.createPickingRay(
						this.scene.pointerX,
						this.scene.pointerY,
						Matrix.Identity(),
						this.scene.activeCamera
					);
					let hit = this.scene.pickWithRay(ray);
					if (hit.pickedMesh) {
						let topLevelMesh: Nullable<AbstractMesh>;
						if (hit.pickedMesh.parent) {
							topLevelMesh = hit.pickedMesh.parent as AbstractMesh;
						} else {
							topLevelMesh = hit.pickedMesh;
						}
						if (clickableObjects.includes(topLevelMesh)) {
							pickedMesh = topLevelMesh;
							this.modeSelectorMap[this.interactionMode][
								anchor.uniqueId
							].targetMesh = pickedMesh;
							this.#findGrabAndNotify(true, anchor.uniqueId);
						}
					}
				};

				const drop = (event: any, pickInfo: any) => {
					// make sure only pointerUp on left click is registered as drop
					if (
						this.modeSelectorMap[this.interactionMode][anchor.uniqueId].grabbedMesh && 
						(clickableObjects.includes(pickedMesh)) && event.button === 0
					) {
						pickedMesh = null;
						this.#findGrabAndNotify(false, anchor.uniqueId);
					}
				};

				this.scene.onKeyboardObservable.add((kbInfo) => {
					if (
						kbInfo.type === KeyboardEventTypes.KEYUP &&
						kbInfo.event.key === "x"
					) {
						this.#findGrabAndNotify(false, anchor.uniqueId);
					}
				});

				this.scene.onPointerDown = castRay;
				this.scene.onPointerUp = drop;
			}
		});
	};

	#configureDesktopInteractionOnce = (): void => {
		if (this.#configuredDesktop) {
			return;
		}
		const selector = Object.values(
			this.modeSelectorMap[InteractionMode.DESKTOP]
		).find(({ anchor }) => anchor.name === "default-anchor");
		if (selector === undefined) {
			throw new Error(
				"Tried to configure desktop interaction without default selector."
			);
		}
		const { anchor } = selector;
		this.#configureInteraction();

		this.scene.onPointerObservable.add((pointerInfo) => {
			if (this.interactionMode === InteractionMode.DESKTOP) {
				if (pointerInfo.event.inputIndex === PointerInput.RightClick) {
					if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
						this.#checkActivate(true, anchor.uniqueId);
					} else if (
						pointerInfo.type === PointerEventTypes.POINTERUP
					) {
						this.#checkActivate(false, anchor.uniqueId);
					}
				}
			}
		});

		this.#configuredDesktop = true;
	};

	#configureMobileInteractionOnce = (): void => {
		if (this.#configuredMobile) {
			return;
		}
		const selector = Object.values(
			this.modeSelectorMap[InteractionMode.MOBILE]
		).find(({ anchor }) => anchor.name === "default-anchor");
		if (selector === undefined) {
			throw new Error(
				"Tried to configure mobile interaction without default selector."
			);
		}
		const { anchor } = selector;

		// @todo: Add hooks to call this.#checkGrab() and this.#checkActivate() when the appropriate buttons are pressed.
		let activateMethod = this.#checkActivate;

		this.#configureInteraction();

		if (activateButton) {
			activateButton.onPointerDownObservable.add(function (coordinates: {
				x: number;
				y: number;
			}) {
				activateMethod(true, anchor.uniqueId);
			});
			activateButton.onPointerUpObservable.add(function (coordinates: {
				x: number;
				y: number;
			}) {
				activateMethod(false, anchor.uniqueId);
			});
		}

		// for debug purposes
		this.scene.onKeyboardObservable.add((kbInfo) => {
			if (
				kbInfo.type === KeyboardEventTypes.KEYDOWN &&
				kbInfo.event.key === "e"
			) {
				activateMethod(true, anchor.uniqueId);
			} else if (
				kbInfo.type === KeyboardEventTypes.KEYUP &&
				kbInfo.event.key === "e"
			) {
				activateMethod(false, anchor.uniqueId);
			}
		});

		this.#configuredMobile = true;
	};

	#configureXRInteractionOnce = (): void => {
		if (this.#configuredXR) {
			return;
		}
		if (!this.xrExperience) {
			throw new Error(
				"Tried to configure XR interaction without an XR experience."
			);
		}

		this.scene.onPointerDown = null;
		this.scene.onPointerUp = null;	

		// TODO: find a way to dynamically load the cylinder names
		const cylinderNames = ["cylinder-a", "cylinder-b", "cylinder-c"];

		for (let cylinderName of cylinderNames) {
			const mesh = this.scene.getMeshByName(cylinderName);
			const interactableBehavior = mesh.getBehaviorByName("Interactable") as InteractableBehavior;
			interactableBehavior.moveAttached = false;

			const pointerDragBehavior = mesh.getBehaviorByName("PointerDrag") as PointerDragBehavior;
			pointerDragBehavior.enabled = false;
		}

		this.xrExperience.input.controllers.forEach(this.#configureController);
		this.xrExperience.input.onControllerAddedObservable.add(
			this.#configureController
		);

		this.isUsingXRObservable.notifyObservers(true);

		this.#configuredXR = true;
	};

	getActiveSelectors = (): ISelector[] => {
		return Object.values(
			Object.values(this.modeSelectorMap[this.interactionMode])
		);
	};

	#selectTarget = (
		sourceMesh: AbstractMesh,
		targetMeshes: AbstractMesh[]
	): Nullable<AbstractMesh> => {
		return InteractionManager.#GetNearestTo(
			sourceMesh,
			targetMeshes,
			this.interactionMode
		);
	};

	static #GetNearestTo = (
		mesh: AbstractMesh,
		meshes: AbstractMesh[],
		mode: InteractionMode
	): Nullable<AbstractMesh> => {
		// XR mode, simply find the nearest to the mesh's position. In desktop mode, find the
		// nearest to the mesh's line.
		let nearest = null;
		let nearestScore = Number.POSITIVE_INFINITY;
		// @todo: Implement a custom comparison algorithm for desktop and mobile. For example,
		// Find the mesh with the smallest distance to the line from the origin of the grabber to the tip of
		// the grabber.
		switch (mode) {
			case InteractionMode.DESKTOP: // Fallthrough
			case InteractionMode.MOBILE: // Fallthrough
			case InteractionMode.XR:
				for (const neighbor of meshes) {
					const distance = Vector3.Distance(
						mesh.getAbsolutePosition(),
						neighbor.getAbsolutePosition()
					);
					if (distance < nearestScore) {
						nearest = neighbor;
						nearestScore = distance;
					}
				}
				break;
		}
		return nearest;
	};
}
