import { dbClient } from '../db/DbClient';
import { ElementType, SpellData } from './types';
import { EnemyManager } from './EnemyManager';
import { DeadEyeManager } from './DeadEyeManager';
import { BossManager } from './BossManager';

export interface CastResult {
  success: boolean;
  spellName: string;
  element: ElementType;
  damage: number;
  targetsHit: { enemyId: number; damageDealt: number; wasWeakness: boolean }[];
  message: string;
}

export class SpellManager {
  private static instance: SpellManager | null = null;
  private enemyManager: EnemyManager | null = null;

  public static getInstance(): SpellManager {
    if (!this.instance) {
      this.instance = new SpellManager();
    }
    return this.instance;
  }

  public setEnemyManager(manager: EnemyManager) {
    this.enemyManager = manager;
  }

  /**
   * Cast a Quick-Cast slot (1 to 4) using pre-bound SQL queries
   */
  public async castQuickSlot(slotIndex: number): Promise<CastResult> {
    const slotQueries = [
      "SELECT spell_name, damage, element FROM powers WHERE element = 'Arcane';",
      "SELECT spell_name, damage, element FROM powers WHERE element = 'Shock';",
      "SELECT spell_name, damage, element FROM powers WHERE element = 'Fire';",
      "SELECT p.spell_name, e.enemy_id, p.damage, p.element FROM powers p JOIN active_enemies e ON p.element = e.weakness WHERE e.hp > 0;",
    ];

    const sql = slotQueries[slotIndex - 1] || slotQueries[0];
    return this.executeSpellQuery(sql);
  }

  /**
   * Execute an arbitrary SQL query to evaluate and trigger an Arcane spell
   */
  public async executeSpellQuery(sql: string): Promise<CastResult> {
    try {
      const res = await dbClient.query(sql);
      if (!res || !res.rows || res.rows.length === 0) {
        return {
          success: false,
          spellName: 'Fizzled Incantation',
          element: 'Arcane',
          damage: 0,
          targetsHit: [],
          message: 'The query executed but matched zero arcane powers or targets.',
        };
      }

      // Column mapping
      const colMap = new Map<string, number>();
      res.columns.forEach((col, idx) => colMap.set(col.toLowerCase(), idx));

      const spellNameIdx = colMap.get('spell_name') ?? 0;
      const damageIdx = colMap.get('damage') ?? 1;
      const elementIdx = colMap.get('element') ?? 2;
      const enemyIdIdx = colMap.get('enemy_id');

      const firstRow = res.rows[0];
      const spellName = String(firstRow[spellNameIdx] || 'Arcane Bolt');
      const baseDamage = Number(firstRow[damageIdx] || 45);
      const element = (firstRow[elementIdx] as ElementType) || 'Arcane';

      const targetsHit: { enemyId: number; damageDealt: number; wasWeakness: boolean }[] = [];

      if (this.enemyManager) {
        if (enemyIdIdx !== undefined) {
          // Tactical targeting from JOIN query: hit each specified enemy!
          for (const row of res.rows) {
            const enemyId = Number(row[enemyIdIdx]);
            const rowDamage = Number(row[damageIdx] || baseDamage);
            const rowElement = (row[elementIdx] as ElementType) || element;
            const hitResult = this.enemyManager.damageEnemy(enemyId, rowDamage, rowElement);
            if (hitResult) {
              targetsHit.push({
                enemyId,
                damageDealt: hitResult.actualDamage,
                wasWeakness: hitResult.wasWeakness,
              });
            }
          }
        } else {
          // Area or closest enemy cast
          const closestEnemy = this.enemyManager.getClosestActiveEnemy();
          if (closestEnemy) {
            const hitResult = this.enemyManager.damageEnemy(
              closestEnemy.data.id,
              baseDamage,
              element
            );
            if (hitResult) {
              targetsHit.push({
                enemyId: closestEnemy.data.id,
                damageDealt: hitResult.actualDamage,
                wasWeakness: hitResult.wasWeakness,
              });
            }
          }
        }
      }

      // Also strike Mayor Gideon Vale if within range or boss encounter active
      const bossHit = BossManager.getInstance().strikeShield(element, baseDamage);

      // Deactivate Dead-Eye for cinematic slow-motion payoff
      DeadEyeManager.getInstance().deactivate();

      const combinedMsg = bossHit.hit
        ? `CAST SUCCESSFUL: ${spellName}! ${bossHit.message}`
        : `CAST SUCCESSFUL: ${spellName}! Dealt damage to ${targetsHit.length} target(s).`;

      return {
        success: true,
        spellName,
        element,
        damage: baseDamage,
        targetsHit,
        message: combinedMsg,
      };
    } catch (err: any) {
      return {
        success: false,
        spellName: 'Spell Execution Error',
        element: 'Arcane',
        damage: 0,
        targetsHit: [],
        message: err?.message || 'Syntax error in arcane incantation.',
      };
    }
  }
}

