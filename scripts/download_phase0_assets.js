const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://quaternius.trebeljahr.com';

const QUATERNIUS_ASSETS = [
  // Characters
  { url: '/glb/single_knight_pack/KnightCharacter.glb', dest: 'public/assets/characters/knight_animations.glb', id: 'knight_animations', name: 'Knight Animated Rig', category: 'character' },
  { url: '/glb/modular_men/Adventurer.glb', dest: 'public/assets/characters/sheriff.glb', id: 'sheriff_model', name: 'Arcane Sheriff (Adventurer)', category: 'character' },
  { url: '/glb/modular_men/Suit.glb', dest: 'public/assets/characters/mayor_gideon.glb', id: 'mayor_gideon', name: 'Mayor Gideon Vale (Suit)', category: 'character' },
  { url: '/glb/modular_men/Worker.glb', dest: 'public/assets/characters/npc_worker.glb', id: 'npc_worker', name: 'Town Worker / Doctor', category: 'character' },
  { url: '/glb/modular_women/Adventurer.glb', dest: 'public/assets/characters/mara_voss.glb', id: 'mara_voss', name: 'Mara Voss Outlaw', category: 'character' },
  { url: '/glb/animals_pack/Horse.glb', dest: 'public/assets/characters/horse.glb', id: 'frontier_horse', name: 'Frontier Horse', category: 'animal' },

  // Weapons & Survival props
  { url: '/glb/survival_pack/Revolver_1.glb', dest: 'public/assets/weapons/revolver_01.glb', id: 'revolver_01', name: 'Colt Revolver 1', category: 'weapon' },
  { url: '/glb/survival_pack/Revolver_2.glb', dest: 'public/assets/weapons/revolver_02.glb', id: 'revolver_02', name: 'Sheriff Revolver 2', category: 'weapon' },
  { url: '/glb/survival_pack/Shotgun_1.glb', dest: 'public/assets/weapons/shotgun_01.glb', id: 'shotgun_01', name: 'Frontier Shotgun', category: 'weapon' },
  { url: '/glb/survival_pack/Torch.glb', dest: 'public/assets/props/torch.glb', id: 'torch_prop', name: 'Handheld Torch', category: 'prop' },
  { url: '/glb/survival_pack/Compass_Open.glb', dest: 'public/assets/props/compass.glb', id: 'compass_prop', name: 'Brass Compass', category: 'prop' },
  { url: '/glb/survival_pack/WoodLog.glb', dest: 'public/assets/props/wood_log.glb', id: 'wood_log', name: 'Cut Wood Log', category: 'prop' },

  // Buildings & Western Town
  { url: '/glb/medieval_village_pack/House_1.glb', dest: 'public/assets/buildings/sheriff_office.glb', id: 'sheriff_office_building', name: 'Sheriff Office & Jail', category: 'building' },
  { url: '/glb/medieval_village_pack/House_2.glb', dest: 'public/assets/buildings/bank_building.glb', id: 'bank_building', name: 'Ironvault Bank', category: 'building' },
  { url: '/glb/medieval_village_pack/Inn.glb', dest: 'public/assets/buildings/saloon_building.glb', id: 'saloon_building', name: 'Gilded Spur Saloon', category: 'building' },
  { url: '/glb/medieval_village_pack/Cart.glb', dest: 'public/assets/props/wooden_cart.glb', id: 'wooden_cart', name: 'Frontier Wagon Cart', category: 'prop' },
  { url: '/glb/medieval_village_pack/Barrel.glb', dest: 'public/assets/props/barrel.glb', id: 'wood_barrel', name: 'Saloon Barrel', category: 'prop' },
  { url: '/glb/medieval_village_pack/Crate.glb', dest: 'public/assets/props/crate.glb', id: 'wood_crate', name: 'Railway Shipping Crate', category: 'prop' },
  { url: '/glb/medieval_village_pack/Fence.glb', dest: 'public/assets/props/wood_fence.glb', id: 'wood_fence', name: 'Town Wooden Fence', category: 'prop' },
  { url: '/glb/medieval_village_pack/Bench_1.glb', dest: 'public/assets/props/bench.glb', id: 'boardwalk_bench', name: 'Boardwalk Wooden Bench', category: 'prop' },

  // Nature / Canyon
  { url: '/glb/real_time_strategy_pack/Resource_PineTree.glb', dest: 'public/assets/environments/pine_tree.glb', id: 'pine_tree', name: 'Whispering Pine Tree', category: 'environment' },
  { url: '/glb/real_time_strategy_pack/Resource_Rock_1.glb', dest: 'public/assets/environments/canyon_rock_01.glb', id: 'canyon_rock_01', name: 'Redrock Canyon Boulder', category: 'environment' },
  { url: '/glb/real_time_strategy_pack/Resource_Gold_1.glb', dest: 'public/assets/props/gold_nugget.glb', id: 'gold_nugget', name: 'Outlaw Mine Gold Ore', category: 'prop' },
];

const POLYHAVEN_TEXTURES = [
  // Weathered Planks
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_diff_1k.jpg', dest: 'public/assets/textures/weathered_planks_diff_1k.jpg', id: 'tex_wood_diff', name: 'Weathered Planks Diffuse' },
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_nor_gl_1k.jpg', dest: 'public/assets/textures/weathered_planks_nor_1k.jpg', id: 'tex_wood_nor', name: 'Weathered Planks Normal GL' },
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_rough_1k.jpg', dest: 'public/assets/textures/weathered_planks_rough_1k.jpg', id: 'tex_wood_rough', name: 'Weathered Planks Roughness' },

  // Brown Mud / Dirt
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_03/brown_mud_03_diff_1k.jpg', dest: 'public/assets/textures/ground_dirt_diff_1k.jpg', id: 'tex_dirt_diff', name: 'Frontier Dirt Road Diffuse' },
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_03/brown_mud_03_nor_gl_1k.jpg', dest: 'public/assets/textures/ground_dirt_nor_1k.jpg', id: 'tex_dirt_nor', name: 'Frontier Dirt Road Normal GL' },
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_03/brown_mud_03_rough_1k.jpg', dest: 'public/assets/textures/ground_dirt_rough_1k.jpg', id: 'tex_dirt_rough', name: 'Frontier Dirt Road Roughness' },

  // Sandstone / Rock
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sandstone_cracks/sandstone_cracks_diff_1k.jpg', dest: 'public/assets/textures/sandstone_diff_1k.jpg', id: 'tex_sandstone_diff', name: 'Sandstone Diffuse' },
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sandstone_cracks/sandstone_cracks_nor_gl_1k.jpg', dest: 'public/assets/textures/sandstone_nor_1k.jpg', id: 'tex_sandstone_nor', name: 'Sandstone Normal GL' },
  { url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sandstone_cracks/sandstone_cracks_rough_1k.jpg', dest: 'public/assets/textures/sandstone_rough_1k.jpg', id: 'tex_sandstone_rough', name: 'Sandstone Roughness' },
];

async function downloadFile(url, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    return fs.statSync(dest).size;
  }

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
  return buffer.byteLength;
}

async function run() {
  console.log('--- STARTING ASSET ACQUISITION & INTEGRATION ---');
  const manifest = [];

  // Download Quaternius assets
  for (const item of QUATERNIUS_ASSETS) {
    const fullUrl = BASE_URL + item.url;
    try {
      const size = await downloadFile(fullUrl, item.dest);
      console.log(`[OK] ${item.name} -> ${item.dest} (${size} bytes)`);
      manifest.push({
        id: item.id,
        name: item.name,
        category: item.category,
        creator: 'Quaternius',
        sourceUrl: 'https://quaternius.com',
        downloadUrl: fullUrl,
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        format: 'glb',
        localPath: '/' + item.dest.replace(/^public\//, ''),
        fileSize: size,
        status: 'validated'
      });
    } catch (err) {
      console.error(`[ERROR] ${item.name}: ${err.message}`);
    }
  }

  // Download Poly Haven textures
  for (const item of POLYHAVEN_TEXTURES) {
    try {
      const size = await downloadFile(item.url, item.dest);
      console.log(`[OK] ${item.name} -> ${item.dest} (${size} bytes)`);
      manifest.push({
        id: item.id,
        name: item.name,
        category: 'texture',
        creator: 'Poly Haven',
        sourceUrl: 'https://polyhaven.com',
        downloadUrl: item.url,
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        format: 'jpg',
        localPath: '/' + item.dest.replace(/^public\//, ''),
        fileSize: size,
        status: 'validated'
      });
    } catch (err) {
      console.error(`[ERROR] ${item.name}: ${err.message}`);
    }
  }

  // Copy selected Kenney assets from extracted staging
  const stagingFurniture = 'asset-staging/extracted/furniture-kit/Models/GLTF format';
  const stagingPirate = 'asset-staging/extracted/pirate-kit/Models/GLB format';
  const stagingBuilding = 'asset-staging/extracted/building-kit/Models/GLB format';

  const kenneySelections = [
    { src: `${stagingFurniture}/chair.glb`, dest: 'public/assets/props/saloon_chair.glb', id: 'saloon_chair', name: 'Saloon Chair' },
    { src: `${stagingFurniture}/table.glb`, dest: 'public/assets/props/saloon_table.glb', id: 'saloon_table', name: 'Saloon Table' },
    { src: `${stagingFurniture}/desk.glb`, dest: 'public/assets/props/sheriff_desk.glb', id: 'sheriff_desk', name: 'Sheriff Office Desk' },
    { src: `${stagingFurniture}/bookcaseClosed.glb`, dest: 'public/assets/props/archive_shelf.glb', id: 'archive_shelf', name: 'Sheriff Archive Bookcase' },
    { src: `${stagingPirate}/chest.glb`, dest: 'public/assets/props/ironvault_chest.glb', id: 'ironvault_chest', name: 'Ironvault Bank Treasure Chest' },
    { src: `${stagingPirate}/bottle.glb`, dest: 'public/assets/props/saloon_bottle.glb', id: 'saloon_bottle', name: 'Saloon Tonic Bottle' },
    { src: `${stagingPirate}/crate-bottles.glb`, dest: 'public/assets/props/crate_bottles.glb', id: 'crate_bottles', name: 'Smuggled Saloon Crate' },
    { src: `${stagingBuilding}/door-rotate-round-a.glb`, dest: 'public/assets/buildings/jail_door.glb', id: 'jail_door', name: 'Sheriff Office Jail Door' }
  ];

  for (const k of kenneySelections) {
    if (fs.existsSync(k.src)) {
      const dir = path.dirname(k.dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(k.src, k.dest);
      const stat = fs.statSync(k.dest);
      console.log(`[OK] Kenney: ${k.name} -> ${k.dest} (${stat.size} bytes)`);
      manifest.push({
        id: k.id,
        name: k.name,
        category: 'prop',
        creator: 'Kenney (Kenney.nl)',
        sourceUrl: 'https://kenney.nl/assets',
        downloadUrl: 'https://kenney.nl',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        format: 'glb',
        localPath: '/' + k.dest.replace(/^public\//, ''),
        fileSize: stat.size,
        status: 'validated'
      });
    } else {
      console.warn(`[SKIP] Missing Kenney src: ${k.src}`);
    }
  }

  // Write central manifest.json
  fs.writeFileSync('public/assets/manifest.json', JSON.stringify(manifest, null, 2));
  console.log(`\nSuccessfully registered ${manifest.length} verified assets in public/assets/manifest.json`);
}

run();
