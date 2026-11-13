export interface DistrictDefinition {
  id: string;
  name: string;
  shortName: string;
  unlockedAtChapter: number;
  center: { x: number; z: number };
  radius: number;
  description: string;
  pointsOfInterest: {
    id: string;
    name: string;
    coordinates: { x: number; z: number };
    type: 'building' | 'npc' | 'evidence' | 'hazard' | 'boss';
  }[];
}

export const QUERY_CREEK_DISTRICTS: DistrictDefinition[] = [
  {
    id: 'sheriff_office',
    name: "Sheriff's Office & Jailhouse",
    shortName: "Sheriff Office",
    unlockedAtChapter: 1,
    center: { x: -14, z: -4 },
    radius: 12,
    description: "The municipal office of Query Creek and the last known post of Rowan Hale before his sudden disappearance.",
    pointsOfInterest: [
      { id: 'poi_desk', name: "Rowan Hale's Archive Desk", coordinates: { x: -13.2, z: -4.2 }, type: 'evidence' },
      { id: 'poi_jail', name: "Holding Cell #2", coordinates: { x: -11.2, z: -2.2 }, type: 'building' }
    ]
  },
  {
    id: 'saloon',
    name: "The Gilded Spur Saloon",
    shortName: "Gilded Spur",
    unlockedAtChapter: 1,
    center: { x: 14, z: 2 },
    radius: 14,
    description: "The beating heart of town gossip, card tables, and secret midnight transactions managed by Silas Thorne.",
    pointsOfInterest: [
      { id: 'poi_bar', name: "Saloon Counter & Ledger", coordinates: { x: 14, z: 2 }, type: 'evidence' },
      { id: 'poi_silas', name: "Silas Thorne (Proprietor)", coordinates: { x: 12, z: 3 }, type: 'npc' }
    ]
  },
  {
    id: 'bank',
    name: "Ironvault Bank of Query Creek",
    shortName: "Ironvault Bank",
    unlockedAtChapter: 1,
    center: { x: -14, z: 14 },
    radius: 12,
    description: "The granite-faced financial fortress storing frontier mining gold and the clandestine Syndicate accounts.",
    pointsOfInterest: [
      { id: 'poi_vault', name: "Breached Subterranean Vault", coordinates: { x: -14, z: 14 }, type: 'building' },
      { id: 'poi_mayor', name: "Mayor Gideon Vale", coordinates: { x: -6.0, z: -4.0 }, type: 'npc' }
    ]
  },
  {
    id: 'telegraph',
    name: "Western Union Telegraph Station",
    shortName: "Telegraph Office",
    unlockedAtChapter: 2,
    center: { x: 16, z: -16 },
    radius: 12,
    description: "The copper-wire nerve center operated by Clara Higgins, transmitting encrypted syndicate transmissions.",
    pointsOfInterest: [
      { id: 'poi_wire_terminal', name: "Encrypted Dispatch Receiver", coordinates: { x: 16, z: -16 }, type: 'evidence' },
      { id: 'poi_clara', name: "Clara Higgins (Operator)", coordinates: { x: 15, z: -15 }, type: 'npc' }
    ]
  },
  {
    id: 'apothecary',
    name: "Dr. Vance's Frontier Apothecary",
    shortName: "Apothecary",
    unlockedAtChapter: 2,
    center: { x: -18, z: -20 },
    radius: 12,
    description: "A medicinal dispensary containing chemical tonics, surgical instruments, and manipulated autopsy reports.",
    pointsOfInterest: [
      { id: 'poi_autopsy_log', name: "Dr. Vance's Examination Ledger", coordinates: { x: -18, z: -20 }, type: 'evidence' },
      { id: 'poi_vance', name: "Dr. Alistair Vance", coordinates: { x: -16, z: -19 }, type: 'npc' }
    ]
  },
  {
    id: 'train_depot',
    name: "Redrock Mountain Train Depot",
    shortName: "Redrock Depot",
    unlockedAtChapter: 3,
    center: { x: 28, z: 24 },
    radius: 16,
    description: "The rail freight siding where express engines haul heavy bullion and unregistered dynamite into the territory.",
    pointsOfInterest: [
      { id: 'poi_cargo_manifest', name: "Freight Siding Car 402 Manifest", coordinates: { x: 28, z: 24 }, type: 'evidence' },
      { id: 'poi_train_tracks', name: "Redrock Railroad Junction", coordinates: { x: 26, z: 20 }, type: 'building' }
    ]
  },
  {
    id: 'cemetery',
    name: "Whispering Pines Cemetery",
    shortName: "Whispering Pines",
    unlockedAtChapter: 3,
    center: { x: -30, z: 28 },
    radius: 14,
    description: "A quiet, windswept hillside cemetery surrounded by ancient pines, concealing a disinterred shallow tomb.",
    pointsOfInterest: [
      { id: 'poi_plot_47', name: "Plot 47: Disinterred Grave (Rowan Hale)", coordinates: { x: -30, z: 28 }, type: 'evidence' },
      { id: 'poi_crypt', name: "Old Pioneer Mausoleum", coordinates: { x: -34, z: 30 }, type: 'building' }
    ]
  },
  {
    id: 'abandoned_mine',
    name: "North Ridge Abandoned Outlaw Mine",
    shortName: "Abandoned Mine",
    unlockedAtChapter: 4,
    center: { x: 36, z: -34 },
    radius: 20,
    description: "A fortified underground excavation guarded by syndicate riflemen and Mayor Gideon Vale's Arcane Aegis.",
    pointsOfInterest: [
      { id: 'poi_boss_vale', name: "Mayor Gideon Vale (Boss Encounter)", coordinates: { x: 36, z: -34 }, type: 'boss' },
      { id: 'poi_master_ledger', name: "The Recovered Master Ledger", coordinates: { x: 38, z: -36 }, type: 'evidence' }
    ]
  }
];

export class DistrictManager {
  private static instance: DistrictManager | null = null;
  private currentDistrictId: string = 'sheriff_office';
  private onNotification?: (title: string, message: string) => void;

  public static getInstance(): DistrictManager {
    if (!DistrictManager.instance) {
      DistrictManager.instance = new DistrictManager();
    }
    return DistrictManager.instance;
  }

  public setNotificationHandler(handler: (title: string, message: string) => void) {
    this.onNotification = handler;
  }

  public getDistricts(): DistrictDefinition[] {
    return QUERY_CREEK_DISTRICTS;
  }

  public getDistrict(id: string): DistrictDefinition | undefined {
    return QUERY_CREEK_DISTRICTS.find((d) => d.id === id);
  }

  public isDistrictUnlocked(districtId: string, currentChapterNumber: number): boolean {
    const district = this.getDistrict(districtId);
    if (!district) return false;
    return currentChapterNumber >= district.unlockedAtChapter;
  }

  public updatePlayerPosition(playerPos: { x: number; y: number; z: number }, currentChapterNumber: number): {
    currentDistrict: DistrictDefinition;
    isInsideLockedDistrict: boolean;
    nearestDistrict: DistrictDefinition;
  } {
    let nearestDist = QUERY_CREEK_DISTRICTS[0];
    let minDist = Number.MAX_VALUE;

    for (const d of QUERY_CREEK_DISTRICTS) {
      const distSq = (playerPos.x - d.center.x) ** 2 + (playerPos.z - d.center.z) ** 2;
      if (distSq < minDist) {
        minDist = distSq;
        nearestDist = d;
      }
    }

    const distFromNearest = Math.sqrt(minDist);
    if (distFromNearest <= nearestDist.radius) {
      if (this.currentDistrictId !== nearestDist.id) {
        this.currentDistrictId = nearestDist.id;
        const isUnlocked = this.isDistrictUnlocked(nearestDist.id, currentChapterNumber);

        if (this.onNotification) {
          if (isUnlocked) {
            this.onNotification(
              `Entering: ${nearestDist.name}`,
              nearestDist.description
            );
          } else {
            this.onNotification(
              `Warning: Restricted Area`,
              `The path to ${nearestDist.name} is currently sealed. Advance the campaign to unlock.`
            );
          }
        }
      }
    }

    const isInsideLocked = !this.isDistrictUnlocked(nearestDist.id, currentChapterNumber);

    return {
      currentDistrict: nearestDist,
      isInsideLockedDistrict: isInsideLocked,
      nearestDistrict: nearestDist,
    };
  }

  public getCurrentDistrictId(): string {
    return this.currentDistrictId;
  }
}
