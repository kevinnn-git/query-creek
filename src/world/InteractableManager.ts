import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

export interface Interactable {
  id: string;
  name: string;
  prompt: string;
  position: Vector3;
  interactionRadius: number;
  type: 'clue' | 'npc' | 'document';
  payload?: any;
  markerMesh?: AbstractMesh;
}

export class InteractableManager {
  private scene: Scene;
  private interactables: Map<string, Interactable> = new Map();
  private activeNearbyInteractable: Interactable | null = null;
  private isSenseActive: boolean = false;
  private senseTimer: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    this.registerPhase1Interactables();
  }

  private registerPhase1Interactables() {
    // 1. Rowan Hale's Ledger on the Sheriff Office desk
    this.addInteractable({
      id: 'rowan_ledger',
      name: "Rowan Hale's Master Ledger",
      prompt: "Inspect Rowan Hale's Discarded Ledger",
      position: new Vector3(-13.2, 0.9, -4.2),
      interactionRadius: 2.8,
      type: 'clue',
      payload: {
        title: "Rowan Hale's Last Logged Notes",
        date: "October 14, 1891",
        author: "Rowan Hale, Arcane Sheriff",
        content: `To whoever wears the star next:

If you are reading this, Gideon Vale's syndicate has made their move. The Ironvault Bank robbery tonight was an inside job designed to wipe the audit trail before the territorial marshals arrive.

The official records in the town ledger are your weapon. Vale controls the town, but the arcane ledger cannot lie if queried correctly.

START AT THE BEGINNING:
Query the citizens table. Find every person registered in this town and their official status. Rowan Hale is not who they say I am.

Execute:
  SELECT * FROM citizens;`
      }
    });

    // 2. Mayor Gideon Vale on the boardwalk
    this.addInteractable({
      id: 'mayor_gideon',
      name: 'Mayor Gideon Vale',
      prompt: 'Speak with Mayor Gideon Vale',
      position: new Vector3(-6.0, 0.1, -4.0),
      interactionRadius: 3.2,
      type: 'npc',
      payload: {
        npcName: 'Mayor Gideon Vale',
        role: 'Town Mayor & Bank President',
        dialogue: [
          {
            speaker: 'Mayor Gideon Vale',
            text: "Ah, the new Sheriff. I trust your journey into Query Creek was uneventful. A pity about poor Rowan Hale... fine lawman, but his mind became unsettled by wild conspiracies.",
            responses: [
              {
                text: "What happened to Sheriff Hale, Mr. Mayor?",
                nextId: 'hale_inquiry'
              },
              {
                text: "Tell me about the Ironvault Bank robbery.",
                nextId: 'bank_inquiry'
              },
              {
                text: "I'll be inspecting the town records shortly.",
                nextId: 'records_inquiry'
              }
            ]
          },
          {
            id: 'hale_inquiry',
            speaker: 'Mayor Gideon Vale',
            text: "Hale abandoned his post three weeks back. Wandered into the canyon alone. Don't waste your time chasing a ghost, Sheriff. The town council expects you to focus on the outlaw Mara Voss.",
            responses: [
              { text: "I intend to conduct a thorough investigation.", nextId: 'close' }
            ]
          },
          {
            id: 'bank_inquiry',
            speaker: 'Mayor Gideon Vale',
            text: "Mara Voss and her riders hit the vault right around midnight. Took bearer bonds and reserve bullion. The incident records are clear. Bring her in, and the town will reward you generously.",
            responses: [
              { text: "I'll inspect the incident records myself.", nextId: 'close' }
            ]
          },
          {
            id: 'records_inquiry',
            speaker: 'Mayor Gideon Vale',
            text: "The official ledgers are open to you, of course. Just stick to the public ledgers, Sheriff. Unwarranted prying into private accounts will only cause unnecessary unrest.",
            responses: [
              { text: "Good day, Mayor Vale.", nextId: 'close' }
            ]
          }
        ]
      }
    });

    // 3. Ironvault Robbery Incident Notice at the jailhouse door
    this.addInteractable({
      id: 'incident_notice',
      name: 'Ironvault Robbery Incident Blotter',
      prompt: 'Read Sheriff Blotter Notice',
      position: new Vector3(-11.2, 1.4, -2.2),
      interactionRadius: 2.5,
      type: 'document',
      payload: {
        title: "Sheriff Incident Notice: Ironvault Bank Robbery",
        date: "Filed: 1891-10-14 23:45",
        author: "Reported by: Gideon Vale",
        content: `INCIDENT ID: 1
TYPE: Armed Vault Robbery
LOCATION: Ironvault Bank, Main Street

SUMMARY:
Bank vault breached during late night hours. Witness Gideon Vale reports seeing a rider clad in a dark leather duster and black brimmed hat escaping westward toward the Redrock canyon spur.

SUSPECT NAMED: Mara Voss.

INVESTIGATIVE NOTE (scrawled in margin):
The vault lock showed no sign of dynamite or forced pick. The combination was used. Who had the combination?`
      }
    });

    // Create visual glowing beacons for Sheriff's Sense
    this.createSenseVisuals();
  }

  private createSenseVisuals() {
    const beaconMat = new StandardMaterial('mat_sense_beacon', this.scene);
    beaconMat.diffuseColor = new Color3(1.0, 0.8, 0.2);
    beaconMat.emissiveColor = new Color3(0.9, 0.7, 0.15);
    beaconMat.alpha = 0.0; // Hidden by default

    this.interactables.forEach((item) => {
      const ring = MeshBuilder.CreateCylinder(`beacon_${item.id}`, {
        diameter: 1.2,
        height: 0.05,
      }, this.scene);
      ring.position = item.position.clone();
      ring.position.y += 0.05;
      ring.material = beaconMat;
      ring.isPickable = false;
      item.markerMesh = ring;
    });
  }

  public addInteractable(item: Interactable) {
    this.interactables.set(item.id, item);
  }

  public update(playerPosition: Vector3, deltaTime: number): Interactable | null {
    let closest: Interactable | null = null;
    let minDistance = Infinity;

    this.interactables.forEach((item) => {
      const dist = Vector3.Distance(playerPosition, item.position);
      if (dist <= item.interactionRadius && dist < minDistance) {
        minDistance = dist;
        closest = item;
      }
    });

    this.activeNearbyInteractable = closest;

    // Handle Sheriff Sense timer & pulse
    if (this.isSenseActive) {
      this.senseTimer -= deltaTime;
      if (this.senseTimer <= 0) {
        this.isSenseActive = false;
        this.setSenseHighlight(false);
      } else {
        // Pulse effect
        const pulse = (Math.sin(performance.now() * 0.008) + 1) * 0.4 + 0.2;
        this.interactables.forEach((item) => {
          if (item.markerMesh && item.markerMesh.material) {
            (item.markerMesh.material as StandardMaterial).alpha = pulse;
          }
        });
      }
    }

    return closest;
  }

  public triggerSheriffSense(durationSeconds: number = 5.0) {
    this.isSenseActive = true;
    this.senseTimer = durationSeconds;
    this.setSenseHighlight(true);
    console.log('[InteractableManager] Sheriff Sense activated.');
  }

  private setSenseHighlight(active: boolean) {
    this.interactables.forEach((item) => {
      if (item.markerMesh && item.markerMesh.material) {
        (item.markerMesh.material as StandardMaterial).alpha = active ? 0.6 : 0.0;
      }
    });
  }

  public getActiveInteractable(): Interactable | null {
    return this.activeNearbyInteractable;
  }

  public getInteractable(id: string): Interactable | undefined {
    return this.interactables.get(id);
  }
}
