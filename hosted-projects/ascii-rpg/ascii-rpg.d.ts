interface Player {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    xp: number;
    xpToNext: number;
    strength: number;
    defense: number;
    magic: number;
    speed: number;
    gold: number;
    inventory: Item[];
    currentWeapon: Weapon | null;
    currentArmor: Armor | null;
    spells: Spell[];
    abilities: Ability[];
    skillPoints: number;
    dungeonLevel: number;
    bossDefeated: boolean;
    hunger: number;
    maxHunger: number;
    turns: number;
    floor: number;
    statusEffects: StatusEffect[];
    identifiedItems: Set<string>;
    cursedItems: Set<string>;
    gameSeed: number;
}
interface Item {
    id: string;
    name: string;
    description: string;
    type: 'weapon' | 'armor' | 'potion' | 'food' | 'scroll' | 'ring' | 'misc';
    value: number;
    identified: boolean;
    cursed: boolean;
    stackable: boolean;
    quantity?: number;
}
interface Weapon extends Item {
    type: 'weapon';
    damage: number;
    magicDamage?: number;
}
interface Armor extends Item {
    type: 'armor';
    defense: number;
    magicDefense?: number;
}
interface Potion extends Item {
    type: 'potion';
    effect: 'heal' | 'mana' | 'both';
    amount: number;
}
interface Spell {
    id: string;
    name: string;
    description: string;
    cost: number;
    damage?: number;
    healing?: number;
    effect?: string;
    type: 'offensive' | 'defensive' | 'utility';
    element: 'fire' | 'ice' | 'lightning' | 'earth' | 'holy' | 'dark';
}
interface Ability {
    id: string;
    name: string;
    description: string;
    cost: number;
    cooldown: number;
    currentCooldown: number;
    effect: string;
    type: 'passive' | 'active';
    level: number;
}
interface StatusEffect {
    id: string;
    name: string;
    description: string;
    duration: number;
    effect: 'poison' | 'burn' | 'freeze' | 'paralyze' | 'regeneration' | 'blessed' | 'cursed';
    magnitude: number;
}
interface Food extends Item {
    type: 'food';
    hungerRestore: number;
    hpRestore?: number;
}
interface Scroll extends Item {
    type: 'scroll';
    spell: Spell;
}
interface Ring extends Item {
    type: 'ring';
    effect: 'strength' | 'defense' | 'magic' | 'speed' | 'hunger';
    magnitude: number;
}
interface Enemy {
    name: string;
    hp: number;
    maxHp: number;
    damage: number;
    defense: number;
    magicResist: number;
    speed: number;
    xp: number;
    gold: number;
    ascii: string;
    drops?: Item[];
    spells?: Spell[];
    abilities?: Ability[];
    isBoss: boolean;
    bossMechanics?: string[];
    level: number;
}
interface GameLocation {
    name: string;
    description: string;
    ascii: string;
    enemies: Enemy[];
    items: Item[];
    exits: string[];
    isDungeon: boolean;
    dungeonLevel?: number;
    hasBoss?: boolean;
    explored: boolean;
}
declare class ProceduralGenerator {
    private seed;
    constructor(seed?: number);
    private random;
    randomRange(min: number, max: number): number;
    randomElement<T>(array: T[]): T;
    generateDungeon(level: number): GameLocation;
    private generateDungeonASCII;
    private generateEnemies;
    private generateRandomEnemy;
    private scaleEnemyForLevel;
    private generateLoot;
    private generateRandomItem;
    private generateRandomWeapon;
    private generateRandomArmor;
    private generateRandomPotion;
    private generateExits;
    private shouldHaveBoss;
    generateBoss(level: number): Enemy;
}
declare class ASCIIRPG {
    private player;
    private currentLocation;
    private gameState;
    private combatEnemy;
    private commandHistory;
    private historyIndex;
    private locations;
    private weapons;
    private armors;
    private potions;
    private foods;
    private scrolls;
    private rings;
    private spells;
    private abilities;
    private enemyTypes;
    private bossTypes;
    private dungeonSeed;
    private proceduralGenerator;
    constructor();
    private initializeGame;
    private initializeItems;
    private initializeFoods;
    private initializeScrolls;
    private initializeRings;
    private initializeSpells;
    private initializeAbilities;
    private initializeEnemyTypes;
    private initializeBossTypes;
    private initializeLocations;
    private initializeEnemies;
    private setupEventListeners;
    private displayWelcome;
    private processCommand;
    private startGame;
    private showHelp;
    private showStats;
    private showInventory;
    private lookAround;
    private travelTo;
    private attack;
    private defeatEnemy;
    private levelUp;
    private useItem;
    private equipItem;
    private setPlayerName;
    private updateStatusBar;
    private getHealthBar;
    private getManaBar;
    private getXPBar;
    private addToDisplay;
    private scrollToBottom;
    private gameOver;
    private restartGame;
    private castSpell;
    private useAbility;
    private enterDungeon;
    private showSpells;
    private showAbilities;
    private showSkills;
    private takeItem;
    private learnSpell;
    private learnAbility;
    private getHungerBar;
    private identifyItem;
    private eatFood;
    private wearRing;
    private wait;
    private processStatusEffects;
    private saveGame;
    private loadGame;
    private quitGame;
    private applyHunger;
    private processTurn;
}
