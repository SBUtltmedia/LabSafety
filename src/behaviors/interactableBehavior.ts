import { Behavior } from "@babylonjs/core/Behaviors/behavior";
import { Nullable } from "@babylonjs/core/types";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";

import { ActivationState, GrabState, IMeshActivationInfo, IMeshGrabInfo, InteractionManager, InteractionMode } from "../managers/interactionManager";


// The core behavior to implement grabbing a mesh and activating it while being grabbed.
// Note the use of preconditions and postconditions for certain private methods and attributes.
// These must be upheld to ensure correctness. These are the principles for the preconditions
// and postconditions:

// #grab(): If you're already being grabbed by something, you can't be grabbed by something else
// #drop(): If you're not being grabbed by something, you can't be dropped
// #activate(): You can't be activated if you're not being held or not activatable, and you can't be activated twice.
// #active: You can't be active if you're not being held or not activatable.
// #deactivate(): You can't be deactivated it you're not already active.
// These conditions should be upheld *before* calling the method or changing the attribute:
// they are *not* checked within the methods.

export interface IInteractableOptions {
    activatable?: boolean, // Specifies whether a mesh is activatable (default false)
    moveAttached?: boolean, // Specifies whether the default grab implementation is used (default true)
    defaultAnchorPosition?: Vector3 // The position (local to the anchor) to set a mesh to on grab (default Vector3.Zero()). Has no effect when moveAttached is false.
    defaultAnchorRotation?: Vector3, // The rotation (local to the anchor) to set a mesh to on grab (default Vector3.Zero()). Has no effect when moveAttached is false.
    modeDefaults?: {
        [mode: number]: {
            defaultAnchorPosition?: Vector3, // Same as above, but only applied in the specified interaction mode. This, if specified, takes precedence over IInteractableOptions.defaultPosition.
            defaultAnchorRotation?: Vector3 // Same as above, but only applied in the specified interaction mode. This, if specified, takes precedence over IInteractableOptions.defaultRotation.
        }
    }
}

interface IDefaults {
    [mode: number]: {
        defaultAnchorPosition: Vector3,
        defaultAnchorRotation: Vector3
    }
}

export class InteractableBehavior implements Behavior<AbstractMesh> {
    #mesh: Nullable<AbstractMesh>;
    interactionManager: InteractionManager;
    #grabStateObserver: Nullable<Observer<IMeshGrabInfo>> = null;
    #activationStateObserver: Nullable<Observer<IMeshActivationInfo>> = null;
    onGrabStateChangedObservable: Observable<IMeshGrabInfo> = new Observable();
    onMobileGrabStateChangeObservable: Observable<GrabState> = new Observable();
    onActivationStateChangedObservable: Observable<IMeshActivationInfo> = new Observable();
    defaults: IDefaults = {};
    hideGrabber: boolean = true;
    #moveAttached: boolean;
    #grabberWasVisible: boolean = false;
    #activatable: boolean;
    #active: boolean = false; // Precondition: this.#activatable && this.grabbing
    #anchor: Nullable<AbstractMesh> = null;
    #grabber: Nullable<AbstractMesh> = null;
    #defaultGrabObserver: Nullable<Observer<IMeshGrabInfo>> = null;
    #enabled: boolean = true;
    onAttachObservable: Observable<Boolean> = new Observable();
    
    constructor(interactionManager: InteractionManager, options?: IInteractableOptions) {
        this.interactionManager = interactionManager;
        this.#activatable = Boolean(options?.activatable);
        this.#moveAttached = options?.moveAttached === false ? false : true;

        for (const mode of [InteractionMode.DESKTOP, InteractionMode.MOBILE, InteractionMode.XR, InteractionMode.LOADING]) {
            this.defaults[mode] = {
                defaultAnchorPosition: options?.modeDefaults?.[mode]?.defaultAnchorPosition || options?.defaultAnchorPosition || Vector3.Zero(),
                defaultAnchorRotation: options?.modeDefaults?.[mode]?.defaultAnchorRotation || options?.defaultAnchorRotation || Vector3.Zero()
            }
        }
    }

    get name(): string {
        return "Interactable";
    }

    // Preconditions: none
    // Postconditions: if !value { !this.#activatable and if this.#active then !this.#active } else { this.#activatable }
    set activatable(value: boolean) {
        if (!value && this.#active) {
            this.#deactivate();
        }
        this.#activatable = value;
    }

    get grabbing(): boolean {
        return Boolean(this.#anchor) && Boolean(this.#grabber);
    }

    // NOTE: This is read-only! Modifying the observer
    // (e.g., by calling remove()) is likely to break things!
    get grabStateObserver(): Observer<IMeshGrabInfo> {
        return this.#grabStateObserver;
    }

    // NOTE: This is read-only! Modifying the observer
    // (e.g., by calling remove()) is likely to break things!
    get activationStateObserver(): Observer<IMeshActivationInfo> {
        return this.#activationStateObserver;
    }

    // Preconditions: !#defaultGrabObserver && mesh
    // Postconditions: #defaultGrabObserver
    #enableDefaultGrab = (): void => {
        this.#defaultGrabObserver = this.onGrabStateChangedObservable.add(({ anchor, state }) => {
            if (state === GrabState.GRAB) {
                this.#mesh.setParent(anchor);
                const { defaultAnchorPosition: defaultPosition, defaultAnchorRotation: defaultRotation } = this.defaults[this.interactionManager.interactionMode];
                this.#mesh.position.copyFrom(defaultPosition);
                this.#mesh.rotation.copyFrom(defaultRotation);
            } else if (state === GrabState.DROP) {
                this.#mesh.setParent(null);
            }
        });
    }

    // Preconditions: #defaultGrabObserver && mesh
    // Postconditions: !#defaultGrabObserver
    #disableDefaultGrab = (): void => {
        this.#defaultGrabObserver.remove();
        this.#defaultGrabObserver = null;

        // Deregistering the observer doesn't actually make the
        // mesh stop following the anchor's movements, so do
        // that here. We do not call #drop; we're just disabling
        // the default behavior!
        if (this.grabbing) {
            this.#mesh.setParent(null);
        }
    }

    set moveAttached(value: boolean) {
        // If this is called before the behavior is attached to a mesh,
        // default grab will be enabled as part of being attached.
        if (value && !this.#moveAttached && this.#mesh) {
            this.#enableDefaultGrab();
        } else if (!value && this.#moveAttached && this.#mesh) {
            this.#disableDefaultGrab();
        }
        this.#moveAttached = value;
    }

    set enabled(value: boolean) {
        if (value && !this.#enabled && !this.#subscribed && this.#attached) {
            this.#subscribeToInteractionManager();
        } else if (!value && this.#enabled && this.#subscribed) {
            this.#unsubscribeFromInteractionManager();
        }
        this.#enabled = value;
    }

    get enabled(): boolean {
        return this.#enabled;
    }

    get #attached(): boolean {
        return Boolean(this.#mesh);
    }

    // Preconditions: this.#activatable, this.grabbing, and !this.#active
    // Postconditions: this.#activatable, this.grabbing, and this.#active
    #activate = (): void => {
        this.#active = true;
        this.onActivationStateChangedObservable.notifyObservers({ anchor: this.#anchor, grabber: this.#grabber, state: ActivationState.ACTIVE });
    }

    // Preconditions: this.#activatable, this.grabbing, and this.#active (Simplifies to this.#active)
    // Postconditions: this.#activatable, this.grabbing, and !this.#active
    #deactivate = (): void => {
        this.#active = false;
        this.onActivationStateChangedObservable.notifyObservers({ anchor: this.#anchor, grabber: this.#grabber, state: ActivationState.INACTIVE });
    }

    // Preconditions: !this.grabbing
    // Postconditions: this.grabbing
    #grab = (anchor: AbstractMesh, grabber: AbstractMesh): void => {
        this.onGrabStateChangedObservable.notifyObservers({ anchor, grabber, state: GrabState.GRAB });
        
        // Satisfying the postcondition
        this.#anchor = anchor;
        this.#grabber = grabber;

        // Hide the grabber
        if (this.hideGrabber && this.#grabberWasVisible) {
            grabber.isVisible = false;
        }
    }

    // Preconditions: this.grabbing
    // Postconditions: !this.grabbing and if this.#active then !this.#active
    #drop = () => {
        // Satisfying postcondition if this.#active then !this.#active
        if (this.#active) {
            this.#deactivate();
        }

        // Show the grabber (e.g. the hand) if it was visible before
        if (this.hideGrabber && this.#grabberWasVisible) {
            this.#grabber.isVisible = true;
        }        
        
        this.onGrabStateChangedObservable.notifyObservers({ anchor: this.#anchor, grabber: this.#grabber, state: GrabState.DROP });

        // Satisfying postcondition !this.grabbing
        this.#anchor = null;
        this.#grabber = null;        
    }

    init(): void {

    }

    // Preconditions: !this.$active and !this.grabbing
    // Postconditions: #mesh
    attach = (mesh: AbstractMesh): void => {
        this.#mesh = mesh;
        if (this.enabled) {
            this.#subscribeToInteractionManager();
        }
        if (this.#moveAttached) {
            this.#enableDefaultGrab();
        }
        this.interactionManager.interactableMeshes.push(this.#mesh);
        this.onAttachObservable.notifyObservers(true);


    }

    // Preconditions: !#subscribed and #attached
    // Postconditions: #subscribed
    #subscribeToInteractionManager = (): void => {
        // TODO: race condition investigate
        this.#grabStateObserver = this.interactionManager.onMeshGrabStateChangedObservable.add(({ anchor, grabber, state }) => {
            if (state === GrabState.GRAB && !this.grabbing) {
                this.#grabberWasVisible = grabber.isVisible;
                this.#grab(anchor, grabber);
            } else if (state === GrabState.DROP && this.grabbing) {
                this.#drop();
            }
        }, this.#mesh.uniqueId);
        this.#activationStateObserver = this.interactionManager.onMeshActivationStateChangedObservable.add(({ anchor, grabber, state}) => {
            if (this.#activatable && this.grabbing) {
                if (state === ActivationState.ACTIVE && !this.#active) {
                    this.#activate();
                } else if (state === ActivationState.INACTIVE && this.#active) {
                    this.#deactivate();
                }
            }
        }, this.#mesh.uniqueId);
    }

    enable = (): void => {
        this.enabled = true;
    }

    disable = (): void => {
        this.enabled = false;
    }

    // Preconditions: #subscribed
    // Postconditions: !#subscribed
    #unsubscribeFromInteractionManager = (): void => {
        this.#grabStateObserver.remove();
        this.#activationStateObserver.remove();
        this.#grabStateObserver = null;
        this.#activationStateObserver = null;
    }

    get #subscribed(): boolean {
        return Boolean(this.#grabStateObserver) && Boolean(this.#activationStateObserver);
    }

    // Preconditions: attach() was called
    // Postconditions: !#mesh, !this.grabbing, !this.#active, all observers and observables cleared
    detach = (): void => {
        if (this.#moveAttached) {
            this.#disableDefaultGrab();
        }
        if (this.grabbing) {
            this.#drop();
        }
        if (this.#subscribed) {
            this.#unsubscribeFromInteractionManager();
        }
        this.onGrabStateChangedObservable.clear();
        this.onActivationStateChangedObservable.clear();
        const index = this.interactionManager.interactableMeshes.findIndex(mesh => mesh === this.#mesh);
        if (index !== -1) {
            this.interactionManager.interactableMeshes.splice(index, 1);
        }
        this.#mesh = null;
        this.onAttachObservable.notifyObservers(false);
    }
}