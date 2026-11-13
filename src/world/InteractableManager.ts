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
      id: 'mayor_gideon_vale',
      name: 'Mayor Gideon Vale',
      prompt: 'Speak with Mayor Gideon Vale',
      position: new Vector3(-6.0, 0.1, -4.0),
      interactionRadius: 3.2,
      type: 'npc',
      payload: {
        npcId: 'mayor_gideon_vale',
        npcName: 'Mayor Gideon Vale',
        role: 'Town Mayor & Bank President',
        dialogue: [
          {
            id: 'start',
            speaker: 'Mayor Gideon Vale',
            text: "Ah, the new Sheriff. I trust your journey into Query Creek was uneventful. A pity about poor Rowan Hale... fine lawman, but his mind became unsettled by wild conspiracies.",
            responses: [
              {
                text: "Where were you during the bank robbery, Mayor?",
                nextId: 'vale_alibi'
              },
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
            id: 'vale_alibi',
            speaker: 'Mayor Gideon Vale',
            text: "I was retired in my Town Hall residence by 9:00 PM and never went near the bank or touched the vault. Mara Voss and her gang bear sole guilt for the breach.",
            responses: [
              { text: "Are you certain you authorized no late transactions?", nextId: 'vale_alibi' },
              { text: "I have other inquiries, Mayor.", nextId: 'close' }
            ]
          },
          {
            id: 'vale_cornered',
            speaker: 'Mayor Gideon Vale',
            text: "You... you dredged up the 23:15 contingency withdrawal slip?! Fine, Sheriff. Yes, I authorized the transfer before midnight. But if you think that proves I breached my own vault, you know nothing of the powers running Query Creek. Rowan Hale meddled in syndicate ledgers, and look where he ended up.",
            responses: [
              { text: "Where is Rowan Hale, Vale?!", nextId: 'vale_threat' },
              { text: "Your syndicate won't escape the law.", nextId: 'close' }
            ]
          },
          {
            id: 'vale_threat',
            speaker: 'Mayor Gideon Vale',
            text: "Check The Gilded Spur Saloon, Sheriff. Silas Thorne holds the secondary register. Ask him what arrives on the midnight train from the North Ridge Mine.",
            responses: [
              { text: "I'll be speaking with Silas immediately.", nextId: 'close' }
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

    // 4. Saloon Proprietor Silas Thorne outside the Gilded Spur Saloon
    this.addInteractable({
      id: 'silas_thorne',
      name: 'Silas Thorne',
      prompt: 'Talk to Silas Thorne',
      position: new Vector3(-14.0, 0.4, 18.0),
      interactionRadius: 3.5,
      type: 'npc',
      payload: {
        npcId: 'silas_thorne',
        npcName: 'Silas Thorne',
        role: 'Saloon Proprietor & Cashier',
        dialogue: [
          {
            id: 'start',
            speaker: 'Silas Thorne',
            text: "Howdy, Sheriff. Looking for a drink or asking questions? Word travels fast in Query Creek—people say you're digging into Rowan Hale's old files.",
            responses: [
              { text: "Tell me what you saw the night of the bank robbery.", nextId: 'silas_denial' },
              { text: "Did Mara Voss visit the saloon on October 14?", nextId: 'silas_mara' },
              { text: "I'll be looking over your saloon tabs.", nextId: 'close' }
            ]
          },
          {
            id: 'silas_denial',
            speaker: 'Silas Thorne',
            text: "Saloon was packed till late. I don't know anything about mining shipments or gold transfers, Sheriff. I just pour whiskey and mind my own business.",
            responses: [
              { text: "Ezekiel Cross was here with armed mine guards.", nextId: 'silas_denial' },
              { text: "I'll check the records myself.", nextId: 'close' }
            ]
          },
          {
            id: 'silas_mara',
            speaker: 'Silas Thorne',
            text: "Mara was here, yes. Ordered one cider and rode off toward the south valley well before 9 PM. If Mayor Vale says she robbed the bank at midnight, he's mistaken or lying.",
            responses: [
              { text: "That confirms Mara's alibi.", nextId: 'close' }
            ]
          },
          {
            id: 'silas_confession',
            speaker: 'Silas Thorne',
            text: "Alright, keep your voice down! Ezekiel Cross and his mine crew have been meeting here every Tuesday. They aren't hauling ore—they're transferring iron lockboxes onto the midnight express for Mayor Vale!",
            responses: [
              { text: "Where do the lockboxes go?", nextId: 'close' }
            ]
          }
        ]
      }
    });

    // 5. Saloon Bar Tab Ledger on the outdoor saloon table
    this.addInteractable({
      id: 'saloon_tab_ledger',
      name: 'Saloon Patron Register',
      prompt: 'Inspect Saloon Bar Tabs',
      position: new Vector3(-15.5, 0.8, 19.5),
      interactionRadius: 2.5,
      type: 'document',
      payload: {
        title: "The Gilded Spur: October 14 Patron Register",
        date: "October 14, 1891",
        author: "Silas Thorne, Proprietor",
        content: `SALOON LOG ENTRIES (OCTOBER 14):
- Mara Voss: Ordered 1 cider, 25 cents. Time In: 19:30, Time Out: 20:45. Departed on horseback.
- Dr. Alistair Vance: Ordered 1 bourbon, 35 cents. Time In: 21:45, Time Out: 22:30.
- Ezekiel Cross: 6 whiskeys, 120 cents. Time In: 20:30, Time Out: 23:30. Accompanied by two armed guards.

SHERIFF'S INSIGHT:
Mara Voss was gone by 20:45 (8:45 PM). She could not have breached the bank vault at midnight!`
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

