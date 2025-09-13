"use strict";
// ASCII RPG Adventure Game
// A text-based RPG with ASCII art, combat, and exploration
class ProceduralGenerator {
    constructor(seed = Date.now()) {
        this.seed = seed;
    }
    // Simple PRNG based on seed
    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    // Generate random number in range
    randomRange(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    // Generate random element from array
    randomElement(array) {
        return array[Math.floor(this.random() * array.length)];
    }
    // Generate procedural dungeon
    generateDungeon(level) {
        const dungeonNames = [
            'Ancient Crypt', 'Shadow Lair', 'Crystal Caverns', 'Bone Chamber',
            'Fire Pit', 'Ice Cave', 'Thunder Hall', 'Earth Depths',
            'Dark Sanctum', 'Mystic Vault', 'Demon Den', 'Spirit Tomb'
        ];
        const descriptions = [
            'A dark and foreboding dungeon filled with ancient magic.',
            'Echoes of forgotten battles resonate through these halls.',
            'Strange crystals glow with otherworldly light.',
            'The air is thick with the stench of death and decay.',
            'Flaming torches cast dancing shadows on the walls.',
            'Ice formations create a beautiful but deadly maze.',
            'Lightning crackles through the air in this chamber.',
            'The very earth seems to pulse with power here.'
        ];
        const dungeonAscii = this.generateDungeonASCII();
        const name = this.randomElement(dungeonNames);
        const description = this.randomElement(descriptions);
        return {
            name: `${name} - Level ${level}`,
            description: `${description} You are on dungeon level ${level}.`,
            ascii: dungeonAscii,
            enemies: this.generateEnemies(level),
            items: this.generateLoot(level),
            exits: this.generateExits(level),
            isDungeon: true,
            dungeonLevel: level,
            hasBoss: this.shouldHaveBoss(level),
            explored: false
        };
    }
    generateDungeonASCII() {
        const asciiPatterns = [
            `
    ╔═══════════════════════════╗
    ║     🏰 DUNGEON 🏰         ║
    ╠═══════════════════════════╣
    ║  🔥    💀    🔥    💀   ║
    ║     🗝️           🗝️      ║
    ║  🔥    💀    🔥    💀   ║
    ║     🗝️           🗝️      ║
    ║  🔥    💀    🔥    💀   ║
    ╚═══════════════════════════╝`,
            `
    ╔═══════════════════════════╗
    ║      🕳️ CAVE 🕳️          ║
    ╠═══════════════════════════╣
    ║  💎    🦇    💎    🦇   ║
    ║     ⚡           ⚡      ║
    ║  💎    🦇    💎    🦇   ║
    ║     ⚡           ⚡      ║
    ║  💎    🦇    💎    🦇   ║
    ╚═══════════════════════════╝`,
            `
    ╔═══════════════════════════╗
    ║    🏛️ RUINS 🏛️           ║
    ╠═══════════════════════════╣
    ║  🗿    👻    🗿    👻   ║
    ║     ⚰️           ⚰️      ║
    ║  🗿    👻    🗿    👻   ║
    ║     ⚰️           ⚰️      ║
    ║  🗿    👻    🗿    👻   ║
    ╚═══════════════════════════╝`
        ];
        return this.randomElement(asciiPatterns);
    }
    generateEnemies(level) {
        const enemyCount = this.randomRange(1, Math.min(3, Math.floor(level / 2) + 1));
        const enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            const baseEnemy = this.generateRandomEnemy(level);
            enemies.push(this.scaleEnemyForLevel(baseEnemy, level));
        }
        return enemies;
    }
    generateRandomEnemy(level) {
        const enemyTemplates = [
            {
                name: 'Goblin',
                baseHp: 20,
                baseDamage: 5,
                baseDefense: 2,
                baseMagicResist: 1,
                baseSpeed: 12,
                ascii: '👹',
                spells: []
            },
            {
                name: 'Orc',
                baseHp: 35,
                baseDamage: 10,
                baseDefense: 4,
                baseMagicResist: 2,
                baseSpeed: 8,
                ascii: '🧌',
                spells: []
            },
            {
                name: 'Skeleton',
                baseHp: 25,
                baseDamage: 8,
                baseDefense: 3,
                baseMagicResist: 3,
                baseSpeed: 10,
                ascii: '💀',
                spells: []
            },
            {
                name: 'Dark Wizard',
                baseHp: 30,
                baseDamage: 6,
                baseDefense: 2,
                baseMagicResist: 8,
                baseSpeed: 9,
                ascii: '🧙‍♂️',
                spells: ['fireball', 'dark_blast']
            },
            {
                name: 'Shadow Beast',
                baseHp: 40,
                baseDamage: 12,
                baseDefense: 5,
                baseMagicResist: 6,
                baseSpeed: 11,
                ascii: '🐺',
                spells: ['dark_blast']
            }
        ];
        const template = this.randomElement(enemyTemplates);
        return {
            name: template.name,
            hp: template.baseHp,
            maxHp: template.baseHp,
            damage: template.baseDamage,
            defense: template.baseDefense,
            magicResist: template.baseMagicResist,
            speed: template.baseSpeed,
            xp: level * 10 + this.randomRange(5, 15),
            gold: level * 5 + this.randomRange(2, 8),
            ascii: template.ascii,
            level: level,
            isBoss: false,
            spells: template.spells.map(spellId => ({
                id: spellId,
                name: spellId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: `A ${spellId} spell`,
                cost: 10,
                damage: 15,
                type: 'offensive',
                element: this.randomElement(['fire', 'ice', 'lightning', 'earth', 'holy', 'dark'])
            }))
        };
    }
    scaleEnemyForLevel(enemy, level) {
        const levelMultiplier = 1 + (level - 1) * 0.3;
        return {
            ...enemy,
            hp: Math.floor(enemy.hp * levelMultiplier),
            maxHp: Math.floor(enemy.maxHp * levelMultiplier),
            damage: Math.floor(enemy.damage * levelMultiplier),
            defense: Math.floor(enemy.defense * levelMultiplier),
            magicResist: Math.floor(enemy.magicResist * levelMultiplier),
            xp: Math.floor(enemy.xp * levelMultiplier),
            gold: Math.floor(enemy.gold * levelMultiplier)
        };
    }
    generateLoot(level) {
        const lootCount = this.randomRange(0, 2);
        const loot = [];
        for (let i = 0; i < lootCount; i++) {
            loot.push(this.generateRandomItem(level));
        }
        return loot;
    }
    generateRandomItem(level) {
        const itemTypes = ['weapon', 'armor', 'potion'];
        const itemType = this.randomElement(itemTypes);
        switch (itemType) {
            case 'weapon':
                return this.generateRandomWeapon(level);
            case 'armor':
                return this.generateRandomArmor(level);
            case 'potion':
                return this.generateRandomPotion();
            default:
                return this.generateRandomPotion();
        }
    }
    generateRandomWeapon(level) {
        const weaponNames = ['Sword', 'Axe', 'Mace', 'Dagger', 'Staff', 'Bow', 'Spear', 'Hammer'];
        const weaponPrefixes = ['Rusty', 'Iron', 'Steel', 'Silver', 'Golden', 'Mithril', 'Dragon', 'Enchanted'];
        const name = `${this.randomElement(weaponPrefixes)} ${this.randomElement(weaponNames)}`;
        const baseDamage = 8 + level * 3;
        const damage = baseDamage + this.randomRange(-2, 4);
        return {
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            description: `A ${name.toLowerCase()} that deals ${damage} damage.`,
            type: 'weapon',
            value: damage * 5,
            damage,
            identified: false,
            cursed: this.randomRange(1, 10) === 1, // 10% chance of being cursed
            stackable: false
        };
    }
    generateRandomArmor(level) {
        const armorNames = ['Helmet', 'Chestplate', 'Leggings', 'Boots', 'Gauntlets', 'Shield'];
        const armorPrefixes = ['Leather', 'Chain', 'Plate', 'Scale', 'Dragon', 'Mithril', 'Enchanted'];
        const name = `${this.randomElement(armorPrefixes)} ${this.randomElement(armorNames)}`;
        const baseDefense = 3 + level * 2;
        const defense = baseDefense + this.randomRange(-1, 3);
        return {
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            description: `A ${name.toLowerCase()} that provides ${defense} defense.`,
            type: 'armor',
            value: defense * 8,
            defense,
            identified: false,
            cursed: this.randomRange(1, 10) === 1, // 10% chance of being cursed
            stackable: false
        };
    }
    generateRandomPotion() {
        const potionTypes = [
            { name: 'Health Potion', effect: 'heal', amount: 30 },
            { name: 'Mana Potion', effect: 'mana', amount: 25 },
            { name: 'Greater Health Potion', effect: 'heal', amount: 60 },
            { name: 'Greater Mana Potion', effect: 'mana', amount: 50 },
            { name: 'Elixir of Life', effect: 'both', amount: 40 }
        ];
        const potion = this.randomElement(potionTypes);
        return {
            id: potion.name.toLowerCase().replace(/\s+/g, '_'),
            name: potion.name,
            description: `A ${potion.name.toLowerCase()} that restores ${potion.amount} ${potion.effect === 'both' ? 'HP and MP' : potion.effect === 'heal' ? 'HP' : 'MP'}.`,
            type: 'potion',
            value: potion.amount * 2,
            effect: potion.effect,
            amount: potion.amount,
            identified: false,
            cursed: this.randomRange(1, 20) === 1, // 5% chance of being cursed
            stackable: true,
            quantity: 1
        };
    }
    generateExits(level) {
        const exits = ['tavern']; // Always can go back to tavern
        if (level < 10) {
            exits.push(`dungeon_${level + 1}`);
        }
        return exits;
    }
    shouldHaveBoss(level) {
        // Boss every 3 levels
        return level % 3 === 0;
    }
    generateBoss(level) {
        const bossTemplates = [
            {
                name: 'Ancient Dragon',
                baseHp: 150,
                baseDamage: 25,
                baseDefense: 15,
                baseMagicResist: 12,
                baseSpeed: 6,
                ascii: '🐉',
                mechanics: ['Fire Breath', 'Tail Swipe', 'Wing Buffet']
            },
            {
                name: 'Lich King',
                baseHp: 120,
                baseDamage: 20,
                baseDefense: 8,
                baseMagicResist: 15,
                baseSpeed: 7,
                ascii: '👑💀',
                mechanics: ['Necromancy', 'Dark Ritual', 'Soul Drain']
            },
            {
                name: 'Elemental Titan',
                baseHp: 200,
                baseDamage: 30,
                baseDefense: 20,
                baseMagicResist: 10,
                baseSpeed: 5,
                ascii: '🗿',
                mechanics: ['Elemental Shift', 'Earthquake', 'Meteor']
            }
        ];
        const template = this.randomElement(bossTemplates);
        const scaledBoss = this.scaleEnemyForLevel({
            name: template.name,
            hp: template.baseHp,
            maxHp: template.baseHp,
            damage: template.baseDamage,
            defense: template.baseDefense,
            magicResist: template.baseMagicResist,
            speed: template.baseSpeed,
            xp: level * 50,
            gold: level * 30,
            ascii: template.ascii,
            level: level,
            isBoss: true,
            bossMechanics: template.mechanics,
            spells: []
        }, level);
        return scaledBoss;
    }
}
class ASCIIRPG {
    constructor() {
        this.combatEnemy = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.locations = new Map();
        this.weapons = new Map();
        this.armors = new Map();
        this.potions = new Map();
        this.foods = new Map();
        this.scrolls = new Map();
        this.rings = new Map();
        this.spells = new Map();
        this.abilities = new Map();
        this.enemyTypes = [];
        this.bossTypes = [];
        this.dungeonSeed = Date.now();
        this.initializeGame();
        this.setupEventListeners();
        this.displayWelcome();
    }
    initializeGame() {
        // Initialize default player
        this.player = {
            name: "Adventurer",
            level: 1,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            xp: 0,
            xpToNext: 100,
            strength: 10,
            defense: 5,
            magic: 8,
            speed: 10,
            gold: 0,
            inventory: [],
            currentWeapon: null,
            currentArmor: null,
            spells: [],
            abilities: [],
            skillPoints: 0,
            dungeonLevel: 0,
            bossDefeated: false,
            // Roguelike properties
            hunger: 100,
            maxHunger: 100,
            turns: 0,
            floor: 1,
            statusEffects: [],
            identifiedItems: new Set(),
            cursedItems: new Set(),
            gameSeed: Date.now()
        };
        this.gameState = 'menu';
        this.currentLocation = 'tavern';
        this.proceduralGenerator = new ProceduralGenerator(this.dungeonSeed);
        this.initializeItems();
        this.initializeFoods();
        this.initializeScrolls();
        this.initializeRings();
        this.initializeSpells();
        this.initializeAbilities();
        this.initializeEnemyTypes();
        this.initializeBossTypes();
        this.initializeLocations();
        this.initializeEnemies();
    }
    initializeItems() {
        // Weapons
        this.weapons.set('rusty_sword', {
            id: 'rusty_sword',
            name: 'Rusty Sword',
            description: 'An old, rusty sword. Still sharp enough to cut.',
            type: 'weapon',
            value: 50,
            damage: 8,
            identified: true,
            cursed: false,
            stackable: false
        });
        this.weapons.set('iron_sword', {
            id: 'iron_sword',
            name: 'Iron Sword',
            description: 'A sturdy iron sword with good balance.',
            type: 'weapon',
            value: 150,
            damage: 15,
            identified: true,
            cursed: false,
            stackable: false
        });
        this.weapons.set('magic_staff', {
            id: 'magic_staff',
            name: 'Magic Staff',
            description: 'A staff imbued with magical energy.',
            type: 'weapon',
            value: 200,
            damage: 10,
            magicDamage: 15,
            identified: true,
            cursed: false,
            stackable: false
        });
        // Armor
        this.armors.set('leather_armor', {
            id: 'leather_armor',
            name: 'Leather Armor',
            description: 'Basic leather protection.',
            type: 'armor',
            value: 100,
            defense: 5,
            identified: true,
            cursed: false,
            stackable: false
        });
        this.armors.set('chain_mail', {
            id: 'chain_mail',
            name: 'Chain Mail',
            description: 'Interlocked metal rings provide good protection.',
            type: 'armor',
            value: 300,
            defense: 12,
            identified: true,
            cursed: false,
            stackable: false
        });
        // Potions
        this.potions.set('health_potion', {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 HP.',
            type: 'potion',
            value: 25,
            effect: 'heal',
            amount: 50,
            identified: true,
            cursed: false,
            stackable: true,
            quantity: 1
        });
        this.potions.set('mana_potion', {
            id: 'mana_potion',
            name: 'Mana Potion',
            description: 'Restores 30 MP.',
            type: 'potion',
            value: 20,
            effect: 'mana',
            amount: 30,
            identified: true,
            cursed: false,
            stackable: true,
            quantity: 1
        });
    }
    initializeFoods() {
        this.foods.set('bread', {
            id: 'bread',
            name: 'Bread',
            description: 'A loaf of fresh bread that restores hunger.',
            type: 'food',
            value: 5,
            hungerRestore: 20,
            identified: true,
            cursed: false,
            stackable: true,
            quantity: 1
        });
        this.foods.set('apple', {
            id: 'apple',
            name: 'Apple',
            description: 'A crisp, red apple.',
            type: 'food',
            value: 3,
            hungerRestore: 10,
            hpRestore: 5,
            identified: true,
            cursed: false,
            stackable: true,
            quantity: 1
        });
        this.foods.set('ration', {
            id: 'ration',
            name: 'Ration',
            description: 'A preserved food ration that restores significant hunger.',
            type: 'food',
            value: 10,
            hungerRestore: 40,
            identified: true,
            cursed: false,
            stackable: true,
            quantity: 1
        });
    }
    initializeScrolls() {
        this.scrolls.set('scroll_identify', {
            id: 'scroll_identify',
            name: 'Scroll of Identify',
            description: 'A scroll that identifies unknown items.',
            type: 'scroll',
            value: 50,
            spell: this.spells.get('identify') || {
                id: 'identify',
                name: 'Identify',
                description: 'Identifies unknown items.',
                cost: 0,
                type: 'utility',
                element: 'holy'
            },
            identified: false,
            cursed: false,
            stackable: true,
            quantity: 1
        });
        this.scrolls.set('scroll_enchant', {
            id: 'scroll_enchant',
            name: 'Scroll of Enchant Weapon',
            description: 'A scroll that enchants weapons.',
            type: 'scroll',
            value: 100,
            spell: this.spells.get('enchant') || {
                id: 'enchant',
                name: 'Enchant Weapon',
                description: 'Enchants a weapon.',
                cost: 0,
                type: 'utility',
                element: 'holy'
            },
            identified: false,
            cursed: false,
            stackable: true,
            quantity: 1
        });
    }
    initializeRings() {
        this.rings.set('ring_strength', {
            id: 'ring_strength',
            name: 'Ring of Strength',
            description: 'A ring that increases strength.',
            type: 'ring',
            value: 200,
            effect: 'strength',
            magnitude: 3,
            identified: false,
            cursed: false,
            stackable: false
        });
        this.rings.set('ring_defense', {
            id: 'ring_defense',
            name: 'Ring of Protection',
            description: 'A ring that increases defense.',
            type: 'ring',
            value: 200,
            effect: 'defense',
            magnitude: 3,
            identified: false,
            cursed: false,
            stackable: false
        });
        this.rings.set('ring_hunger', {
            id: 'ring_hunger',
            name: 'Ring of Sustenance',
            description: 'A ring that reduces hunger consumption.',
            type: 'ring',
            value: 150,
            effect: 'hunger',
            magnitude: 2,
            identified: false,
            cursed: false,
            stackable: false
        });
    }
    initializeSpells() {
        this.spells.set('fireball', {
            id: 'fireball',
            name: 'Fireball',
            description: 'Launch a ball of fire at your enemy.',
            cost: 10,
            damage: 20,
            type: 'offensive',
            element: 'fire'
        });
        this.spells.set('heal', {
            id: 'heal',
            name: 'Heal',
            description: 'Restore health to yourself.',
            cost: 15,
            healing: 30,
            type: 'defensive',
            element: 'holy'
        });
        this.spells.set('lightning_bolt', {
            id: 'lightning_bolt',
            name: 'Lightning Bolt',
            description: 'Strike your enemy with lightning.',
            cost: 12,
            damage: 25,
            type: 'offensive',
            element: 'lightning'
        });
        this.spells.set('ice_shard', {
            id: 'ice_shard',
            name: 'Ice Shard',
            description: 'Throw a sharp ice crystal at your enemy.',
            cost: 8,
            damage: 15,
            type: 'offensive',
            element: 'ice'
        });
        this.spells.set('earth_spike', {
            id: 'earth_spike',
            name: 'Earth Spike',
            description: 'Cause a spike of earth to erupt beneath your enemy.',
            cost: 14,
            damage: 22,
            type: 'offensive',
            element: 'earth'
        });
        this.spells.set('dark_blast', {
            id: 'dark_blast',
            name: 'Dark Blast',
            description: 'Unleash dark energy upon your enemy.',
            cost: 16,
            damage: 28,
            type: 'offensive',
            element: 'dark'
        });
    }
    initializeAbilities() {
        this.abilities.set('power_strike', {
            id: 'power_strike',
            name: 'Power Strike',
            description: 'Deliver a devastating physical attack.',
            cost: 0,
            cooldown: 3,
            currentCooldown: 0,
            effect: 'damage_multiplier',
            type: 'active',
            level: 1
        });
        this.abilities.set('magic_boost', {
            id: 'magic_boost',
            name: 'Magic Boost',
            description: 'Increase your magical power temporarily.',
            cost: 0,
            cooldown: 5,
            currentCooldown: 0,
            effect: 'magic_buff',
            type: 'active',
            level: 1
        });
        this.abilities.set('dodge', {
            id: 'dodge',
            name: 'Dodge',
            description: 'Increase your evasion for a short time.',
            cost: 0,
            cooldown: 4,
            currentCooldown: 0,
            effect: 'evasion_boost',
            type: 'active',
            level: 1
        });
        this.abilities.set('berserker_rage', {
            id: 'berserker_rage',
            name: 'Berserker Rage',
            description: 'Enter a rage that increases damage but lowers defense.',
            cost: 0,
            cooldown: 8,
            currentCooldown: 0,
            effect: 'berserker_mode',
            type: 'active',
            level: 2
        });
    }
    initializeEnemyTypes() {
        this.enemyTypes = [
            {
                name: 'Goblin Scout',
                hp: 25,
                maxHp: 25,
                damage: 6,
                defense: 2,
                magicResist: 1,
                speed: 12,
                xp: 15,
                gold: 10,
                ascii: '👹',
                level: 1,
                isBoss: false,
                drops: [this.potions.get('health_potion')]
            },
            {
                name: 'Orc Warrior',
                hp: 40,
                maxHp: 40,
                damage: 12,
                defense: 5,
                magicResist: 3,
                speed: 8,
                xp: 25,
                gold: 20,
                ascii: '🧌',
                level: 2,
                isBoss: false,
                drops: [this.weapons.get('iron_sword')]
            },
            {
                name: 'Skeleton Archer',
                hp: 30,
                maxHp: 30,
                damage: 10,
                defense: 3,
                magicResist: 2,
                speed: 10,
                xp: 20,
                gold: 15,
                ascii: '💀',
                level: 2,
                isBoss: false,
                drops: [this.armors.get('leather_armor')]
            },
            {
                name: 'Dark Wizard',
                hp: 35,
                maxHp: 35,
                damage: 8,
                defense: 2,
                magicResist: 8,
                speed: 9,
                xp: 30,
                gold: 25,
                ascii: '🧙‍♂️',
                level: 3,
                isBoss: false,
                spells: [this.spells.get('fireball'), this.spells.get('dark_blast')],
                drops: [this.potions.get('mana_potion')]
            }
        ];
    }
    initializeBossTypes() {
        this.bossTypes = [
            {
                name: 'Ancient Dragon',
                hp: 150,
                maxHp: 150,
                damage: 25,
                defense: 15,
                magicResist: 12,
                speed: 6,
                xp: 150,
                gold: 100,
                ascii: '🐉',
                level: 5,
                isBoss: true,
                bossMechanics: ['Fire Breath', 'Tail Swipe', 'Wing Buffet'],
                spells: [this.spells.get('fireball'), this.spells.get('dark_blast')],
                drops: [this.armors.get('chain_mail'), this.weapons.get('magic_staff')]
            },
            {
                name: 'Lich King',
                hp: 120,
                maxHp: 120,
                damage: 20,
                defense: 8,
                magicResist: 15,
                speed: 7,
                xp: 120,
                gold: 80,
                ascii: '👑💀',
                level: 6,
                isBoss: true,
                bossMechanics: ['Necromancy', 'Dark Ritual', 'Soul Drain'],
                spells: [this.spells.get('dark_blast'), this.spells.get('heal')],
                drops: [this.potions.get('health_potion')]
            },
            {
                name: 'Elemental Titan',
                hp: 200,
                maxHp: 200,
                damage: 30,
                defense: 20,
                magicResist: 10,
                speed: 5,
                xp: 200,
                gold: 150,
                ascii: '🗿',
                level: 8,
                isBoss: true,
                bossMechanics: ['Elemental Shift', 'Earthquake', 'Meteor'],
                spells: [this.spells.get('earth_spike'), this.spells.get('fireball'), this.spells.get('ice_shard')],
                drops: [this.weapons.get('magic_staff'), this.potions.get('mana_potion')]
            }
        ];
    }
    initializeLocations() {
        this.locations.set('tavern', {
            name: 'The Rusty Anchor Tavern',
            description: 'A cozy tavern with a warm fire. The bartender nods at you from behind the counter.',
            ascii: `
    ╔═══════════════════════════╗
    ║        🏠 TAVERN 🏠        ║
    ╠═══════════════════════════╣
    ║  🍺      🔥      🍺      ║
    ║     👤           👤      ║
    ║        🪑   🪑           ║
    ║     🪑              🪑    ║
    ║  🪑        👤        🪑   ║
    ╚═══════════════════════════╝
            `,
            enemies: [],
            items: [this.potions.get('health_potion')],
            exits: ['forest', 'dungeon'],
            isDungeon: false,
            explored: true
        });
        this.locations.set('forest', {
            name: 'Dark Forest',
            description: 'A mysterious forest filled with shadows and danger. Strange sounds echo from within.',
            ascii: `
    🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲
    🌲  🌲        🌲  🌲    🌲  🌲
    🌲    🌲  🌲    🌲  🌲    🌲
    🌲  🌲    🌲  🌲    🌲  🌲  🌲
    🌲    🌲  🌲    🌲  🌲    🌲
    🌲  🌲    🌲  🌲    🌲  🌲  🌲
    🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲
            `,
            enemies: [],
            items: [this.weapons.get('rusty_sword')],
            exits: ['tavern', 'cave'],
            isDungeon: false,
            explored: true
        });
        this.locations.set('dungeon', {
            name: 'Ancient Dungeon',
            description: 'A dark, foreboding dungeon. The air is thick with ancient magic and danger.',
            ascii: `
    ╔═══════════════════════════╗
    ║     🏰 DUNGEON 🏰         ║
    ╠═══════════════════════════╣
    ║  🔥    💀    🔥    💀   ║
    ║     🗝️           🗝️      ║
    ║  🔥    💀    🔥    💀   ║
    ║     🗝️           🗝️      ║
    ║  🔥    💀    🔥    💀   ║
    ╚═══════════════════════════╝
            `,
            enemies: [],
            items: [this.armors.get('chain_mail')],
            exits: ['tavern'],
            isDungeon: false,
            explored: true
        });
        this.locations.set('cave', {
            name: 'Mysterious Cave',
            description: 'A natural cave formation. Stalactites hang from the ceiling like fangs.',
            ascii: `
        🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽
      🔽               🔽
    🔽   💎        💎    🔽
  🔽       💎    💎        🔽
🔽           💎              🔽
  🔽       💎    💎        🔽
    🔽   💎        💎    🔽
      🔽               🔽
        🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽🔽
            `,
            enemies: [],
            items: [this.weapons.get('magic_staff')],
            exits: ['forest'],
            isDungeon: false,
            explored: true
        });
    }
    initializeEnemies() {
        // Add enemies to locations
        const goblin = {
            name: 'Goblin',
            hp: 25,
            maxHp: 25,
            damage: 6,
            defense: 2,
            magicResist: 1,
            speed: 12,
            xp: 15,
            gold: 10,
            ascii: `
    👹
   /|\\
  / | \\
    |
   / \\
            `,
            drops: [this.potions.get('health_potion')],
            level: 1,
            isBoss: false
        };
        const orc = {
            name: 'Orc Warrior',
            hp: 40,
            maxHp: 40,
            damage: 12,
            defense: 5,
            magicResist: 3,
            speed: 8,
            xp: 25,
            gold: 20,
            ascii: `
   🧌
  /|\\
 / | \\
   |
  / \\
            `,
            drops: [this.weapons.get('iron_sword')],
            level: 2,
            isBoss: false
        };
        const dragon = {
            name: 'Ancient Dragon',
            hp: 100,
            maxHp: 100,
            damage: 20,
            defense: 10,
            magicResist: 12,
            speed: 6,
            xp: 100,
            gold: 100,
            ascii: `
        🐉
       /|\\
      / | \\
        |
       / \\
            `,
            drops: [this.armors.get('chain_mail'), this.potions.get('mana_potion')],
            level: 5,
            isBoss: true,
            bossMechanics: ['Fire Breath', 'Tail Swipe', 'Wing Buffet']
        };
        // Add enemies to locations
        this.locations.get('forest').enemies = [goblin];
        this.locations.get('dungeon').enemies = [orc];
        this.locations.get('cave').enemies = [dragon];
    }
    setupEventListeners() {
        const commandInput = document.getElementById('command-input');
        const submitBtn = document.getElementById('submit-btn');
        const gameDisplay = document.getElementById('game-display');
        const handleCommand = () => {
            const command = commandInput.value.trim().toLowerCase();
            if (command) {
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
                this.processCommand(command);
                commandInput.value = '';
            }
        };
        submitBtn.addEventListener('click', handleCommand);
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCommand();
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    commandInput.value = this.commandHistory[this.historyIndex] || '';
                }
            }
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    commandInput.value = this.commandHistory[this.historyIndex] || '';
                }
                else if (this.historyIndex === this.commandHistory.length - 1) {
                    this.historyIndex = this.commandHistory.length;
                    commandInput.value = '';
                }
            }
        });
        // Auto-focus input
        commandInput.focus();
        // Restart button
        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restartGame();
        });
    }
    displayWelcome() {
        this.addToDisplay(`
╔══════════════════════════════════════════════════════════════╗
║              🏰 PROCEDURAL ROGUELIKE RPG 🏰                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Welcome to the ultimate roguelike RPG experience!          ║
║                                                              ║
║  🎮 Roguelike Features:                                     ║
║  • PERMADEATH - Death is permanent!                         ║
║  • Procedurally generated dungeons                          ║
║  • Hunger system - Eat or starve!                           ║
║  • Unknown items - Identify before using!                   ║
║  • Cursed items with negative effects                       ║
║  • Save/Load system                                         ║
║  • Status effects and magic                                 ║
║                                                              ║
║  ⚠️  WARNING: This is a HARDCORE roguelike!                ║
║  • Every decision matters                                   ║
║  • No second chances                                        ║
║  • Resource management is key                               ║
║                                                              ║
║  🚀 Quick Start:                                            ║
║  • Type 'start' to begin                                    ║
║  • Type 'dive' to enter the dungeon                         ║
║  • Type 'help' for all commands                             ║
║                                                              ║
║  Your adventure awaits! Type 'start' to begin!              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `);
    }
    processCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        this.addToDisplay(`> ${command}`);
        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'start':
                this.startGame();
                break;
            case 'stats':
                this.showStats();
                break;
            case 'inventory':
                this.showInventory();
                break;
            case 'look':
                this.lookAround();
                break;
            case 'go':
                if (args.length > 0 && args[0]) {
                    this.travelTo(args[0]);
                }
                else {
                    this.addToDisplay("Go where? Type 'go <location>' to travel.");
                }
                break;
            case 'attack':
                this.attack();
                break;
            case 'use':
                if (args.length > 0) {
                    this.useItem(args.join(' '));
                }
                else {
                    this.addToDisplay("Use what? Type 'use <item>' to use an item.");
                }
                break;
            case 'equip':
                if (args.length > 0) {
                    this.equipItem(args.join(' '));
                }
                else {
                    this.addToDisplay("Equip what? Type 'equip <item>' to equip an item.");
                }
                break;
            case 'name':
                if (args.length > 0) {
                    this.setPlayerName(args.join(' '));
                }
                else {
                    this.addToDisplay("What should your name be? Type 'name <your name>' to set it.");
                }
                break;
            case 'cast':
                if (args.length > 0) {
                    this.castSpell(args.join(' '));
                }
                else {
                    this.addToDisplay("Cast what? Type 'cast <spell>' to cast a spell.");
                }
                break;
            case 'ability':
                if (args.length > 0) {
                    this.useAbility(args.join(' '));
                }
                else {
                    this.addToDisplay("Use what ability? Type 'ability <ability>' to use an ability.");
                }
                break;
            case 'dive':
                this.enterDungeon();
                break;
            case 'spells':
                this.showSpells();
                break;
            case 'abilities':
                this.showAbilities();
                break;
            case 'skills':
                this.showSkills();
                break;
            case 'take':
                if (args.length > 0) {
                    this.takeItem(args.join(' '));
                }
                else {
                    this.addToDisplay("Take what? Type 'take <item>' to pick up an item.");
                }
                break;
            case 'identify':
                if (args.length > 0) {
                    this.identifyItem(args.join(' '));
                }
                else {
                    this.addToDisplay("Identify what? Type 'identify <item>' to identify an item.");
                }
                break;
            case 'eat':
                if (args.length > 0) {
                    this.eatFood(args.join(' '));
                }
                else {
                    this.addToDisplay("Eat what? Type 'eat <food>' to eat food.");
                }
                break;
            case 'wear':
                if (args.length > 0) {
                    this.wearRing(args.join(' '));
                }
                else {
                    this.addToDisplay("Wear what? Type 'wear <ring>' to wear a ring.");
                }
                break;
            case 'wait':
                this.wait();
                break;
            case 'save':
                this.saveGame();
                break;
            case 'load':
                this.loadGame();
                break;
            case 'quit':
                this.quitGame();
                break;
            default:
                this.addToDisplay(`Unknown command: ${cmd}. Type 'help' for available commands.`);
        }
    }
    startGame() {
        if (this.gameState === 'menu') {
            this.gameState = 'playing';
            this.updateStatusBar();
            this.lookAround();
            this.addToDisplay("\n🎮 Game started! You are now ready for adventure!");
        }
        else {
            this.addToDisplay("Game is already running!");
        }
    }
    showHelp() {
        this.addToDisplay(`
📖 ROGUELIKE COMMANDS:
═══════════════════════════════════════════════════════════════
Basic Commands:
• help - Show this help message
• start - Begin your adventure
• stats - View character statistics
• inventory - View your inventory
• look - Examine current location
• name <name> - Set your character's name
• wait - Wait and pass time (restores MP, applies hunger)

Movement & Exploration:
• go <location> - Travel to another location
• dive - Enter the procedural dungeon
• take <item> - Pick up an item from the ground

Combat:
• attack - Attack enemy (during combat)
• cast <spell> - Cast a spell during combat
• ability <ability> - Use a special ability

Magic & Abilities:
• spells - View your known spells
• abilities - View your abilities
• skills - View and upgrade your skills

Items & Equipment:
• use <item> - Use a potion or item
• equip <item> - Equip weapon or armor
• identify <item> - Identify an unknown item
• eat <food> - Eat food to restore hunger
• wear <ring> - Wear a magical ring

Roguelike Features:
• save - Save your game (permadeath!)
• load - Load a saved game
• quit - Quit and lose all progress

⚠️  WARNING: This is a ROGUELIKE!
• Permadeath - Death is permanent!
• Hunger system - You must eat to survive!
• Unknown items - Identify items before using!
• Cursed items - Some items have negative effects!
═══════════════════════════════════════════════════════════════
        `);
    }
    showStats() {
        const location = this.locations.get(this.currentLocation);
        this.addToDisplay(`
📊 Character Statistics:
═══════════════════════════════════════════════════════════════
Name: ${this.player.name}
Level: ${this.player.level}
HP: ${this.player.hp}/${this.player.maxHp} ${this.getHealthBar()}
MP: ${this.player.mp}/${this.player.maxMp} ${this.getManaBar()}
Hunger: ${this.player.hunger}/${this.player.maxHunger} ${this.getHungerBar()}
XP: ${this.player.xp}/${this.player.xpToNext} ${this.getXPBar()}
Gold: ${this.player.gold}
═══════════════════════════════════════════════════════════════
Strength: ${this.player.strength}
Defense: ${this.player.defense}
Magic: ${this.player.magic}
Speed: ${this.player.speed}
═══════════════════════════════════════════════════════════════
Floor: ${this.player.floor}
Turns: ${this.player.turns}
Dungeon Level: ${this.player.dungeonLevel}
═══════════════════════════════════════════════════════════════
Current Location: ${location.name}
Current Weapon: ${this.player.currentWeapon?.name || 'None'}
Current Armor: ${this.player.currentArmor?.name || 'None'}
Status Effects: ${this.player.statusEffects.length > 0 ? this.player.statusEffects.map(e => e.name).join(', ') : 'None'}
        `);
    }
    showInventory() {
        this.addToDisplay(`
🎒 Inventory:
═══════════════════════════════════════════════════════════════
Gold: ${this.player.gold}
═══════════════════════════════════════════════════════════════
        `);
        if (this.player.inventory.length === 0) {
            this.addToDisplay("Your inventory is empty.");
        }
        else {
            this.player.inventory.forEach((item, index) => {
                this.addToDisplay(`${index + 1}. ${item.name} - ${item.description} (Value: ${item.value} gold)`);
            });
        }
    }
    lookAround() {
        const location = this.locations.get(this.currentLocation);
        this.addToDisplay(`
${location.ascii}
📍 ${location.name}
═══════════════════════════════════════════════════════════════
${location.description}
        `);
        if (location.enemies.length > 0) {
            this.addToDisplay(`
⚠️  DANGER! Enemies detected:
            `);
            location.enemies.forEach(enemy => {
                this.addToDisplay(`${enemy.ascii}
${enemy.name} (HP: ${enemy.hp}/${enemy.maxHp})
                `);
            });
            this.addToDisplay("Type 'attack' to engage in combat!");
            this.gameState = 'combat';
            this.combatEnemy = location.enemies[0] || null;
        }
        if (location.items.length > 0) {
            this.addToDisplay(`
💎 Items found:
            `);
            location.items.forEach(item => {
                this.addToDisplay(`• ${item.name} - ${item.description}`);
            });
            this.addToDisplay("Type 'take <item>' to pick up items!");
        }
        this.addToDisplay(`
🚪 Available exits: ${location.exits.join(', ')}
Type 'go <location>' to travel.
        `);
    }
    travelTo(locationName) {
        const currentLocation = this.locations.get(this.currentLocation);
        if (!currentLocation.exits.includes(locationName)) {
            this.addToDisplay(`You can't go to ${locationName} from here. Available exits: ${currentLocation.exits.join(', ')}`);
            return;
        }
        // Handle procedural dungeon generation
        if (locationName.startsWith('dungeon_')) {
            const level = parseInt(locationName.split('_')[1] || '1');
            if (!this.locations.has(locationName)) {
                const newDungeon = this.proceduralGenerator.generateDungeon(level);
                this.locations.set(locationName, newDungeon);
                // Add boss if this level should have one
                if (newDungeon.hasBoss) {
                    const boss = this.proceduralGenerator.generateBoss(level);
                    newDungeon.enemies.push(boss);
                }
            }
        }
        if (!this.locations.has(locationName)) {
            this.addToDisplay(`Unknown location: ${locationName}`);
            return;
        }
        this.currentLocation = locationName;
        this.gameState = 'playing';
        this.combatEnemy = null;
        this.updateStatusBar();
        this.addToDisplay(`🚶 You travel to ${locationName}...`);
        this.lookAround();
    }
    attack() {
        if (this.gameState !== 'combat' || !this.combatEnemy) {
            this.addToDisplay("There's nothing to attack here!");
            return;
        }
        const playerDamage = Math.max(1, this.player.strength + (this.player.currentWeapon?.damage || 0) - this.combatEnemy.defense);
        this.combatEnemy.hp -= playerDamage;
        this.addToDisplay(`⚔️  You attack the ${this.combatEnemy.name} for ${playerDamage} damage!`);
        if (this.combatEnemy.hp <= 0) {
            this.defeatEnemy();
            return;
        }
        // Enemy counter-attack
        const enemyDamage = Math.max(1, this.combatEnemy.damage - this.player.defense - (this.player.currentArmor?.defense || 0));
        this.player.hp -= enemyDamage;
        this.addToDisplay(`💥 The ${this.combatEnemy.name} attacks you for ${enemyDamage} damage!`);
        if (this.player.hp <= 0) {
            this.gameOver();
            return;
        }
        this.updateStatusBar();
        this.addToDisplay(`
${this.combatEnemy.ascii}
${this.combatEnemy.name} HP: ${this.combatEnemy.hp}/${this.combatEnemy.maxHp}
Your HP: ${this.player.hp}/${this.player.maxHp}
        `);
    }
    defeatEnemy() {
        if (!this.combatEnemy)
            return;
        this.addToDisplay(`🎉 You defeated the ${this.combatEnemy.name}!`);
        // Gain XP and gold
        this.player.xp += this.combatEnemy.xp;
        this.player.gold += this.combatEnemy.gold;
        this.addToDisplay(`+${this.combatEnemy.xp} XP, +${this.combatEnemy.gold} gold`);
        // Check for level up
        if (this.player.xp >= this.player.xpToNext) {
            this.levelUp();
        }
        // Drop items
        if (this.combatEnemy.drops && this.combatEnemy.drops.length > 0) {
            this.combatEnemy.drops.forEach(item => {
                this.player.inventory.push(item);
                this.addToDisplay(`💎 ${item.name} dropped!`);
            });
        }
        // Learn spells from enemy if they have any
        if (this.combatEnemy.spells && this.combatEnemy.spells.length > 0) {
            const randomSpell = this.combatEnemy.spells[Math.floor(Math.random() * this.combatEnemy.spells.length)];
            if (randomSpell) {
                this.learnSpell(randomSpell);
            }
        }
        // Remove enemy from location
        const location = this.locations.get(this.currentLocation);
        location.enemies = location.enemies.filter(e => e !== this.combatEnemy);
        this.gameState = 'playing';
        this.combatEnemy = null;
        this.updateStatusBar();
        this.addToDisplay("The area is now clear. You can continue exploring.");
    }
    levelUp() {
        this.player.level++;
        this.player.xp -= this.player.xpToNext;
        this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
        // Increase stats
        const hpIncrease = 20;
        const mpIncrease = 10;
        this.player.maxHp += hpIncrease;
        this.player.hp = this.player.maxHp; // Full heal on level up
        this.player.maxMp += mpIncrease;
        this.player.mp = this.player.maxMp; // Full mana on level up
        this.player.strength += 2;
        this.player.defense += 1;
        this.player.magic += 1;
        this.addToDisplay(`
🎊 LEVEL UP! 🎊
You are now level ${this.player.level}!
+${hpIncrease} HP, +${mpIncrease} MP
+2 Strength, +1 Defense, +1 Magic
You feel stronger and more powerful!
        `);
    }
    useItem(itemName) {
        const item = this.player.inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
        if (!item) {
            this.addToDisplay(`You don't have a ${itemName}.`);
            return;
        }
        if (item.type === 'potion') {
            const potion = item;
            this.player.inventory = this.player.inventory.filter(i => i !== item);
            switch (potion.effect) {
                case 'heal':
                    const healAmount = Math.min(potion.amount, this.player.maxHp - this.player.hp);
                    this.player.hp += healAmount;
                    this.addToDisplay(`🧪 You drink the ${potion.name} and restore ${healAmount} HP!`);
                    break;
                case 'mana':
                    const manaAmount = Math.min(potion.amount, this.player.maxMp - this.player.mp);
                    this.player.mp += manaAmount;
                    this.addToDisplay(`🧪 You drink the ${potion.name} and restore ${manaAmount} MP!`);
                    break;
                case 'both':
                    const bothHeal = Math.min(potion.amount, this.player.maxHp - this.player.hp);
                    const bothMana = Math.min(potion.amount, this.player.maxMp - this.player.mp);
                    this.player.hp += bothHeal;
                    this.player.mp += bothMana;
                    this.addToDisplay(`🧪 You drink the ${potion.name} and restore ${bothHeal} HP and ${bothMana} MP!`);
                    break;
            }
            this.updateStatusBar();
        }
        else {
            this.addToDisplay(`You can't use the ${item.name} right now.`);
        }
    }
    equipItem(itemName) {
        const item = this.player.inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
        if (!item) {
            this.addToDisplay(`You don't have a ${itemName}.`);
            return;
        }
        if (item.type === 'weapon') {
            if (this.player.currentWeapon) {
                this.player.inventory.push(this.player.currentWeapon);
            }
            this.player.currentWeapon = item;
            this.player.inventory = this.player.inventory.filter(i => i !== item);
            this.addToDisplay(`⚔️  You equip the ${item.name}!`);
        }
        else if (item.type === 'armor') {
            if (this.player.currentArmor) {
                this.player.inventory.push(this.player.currentArmor);
            }
            this.player.currentArmor = item;
            this.player.inventory = this.player.inventory.filter(i => i !== item);
            this.addToDisplay(`🛡️  You equip the ${item.name}!`);
        }
        else {
            this.addToDisplay(`You can't equip the ${item.name}.`);
        }
        this.updateStatusBar();
    }
    setPlayerName(name) {
        this.player.name = name;
        this.addToDisplay(`Your name is now ${name}.`);
        this.updateStatusBar();
    }
    updateStatusBar() {
        document.getElementById('player-name').textContent = this.player.name;
        document.getElementById('player-level').textContent = `Level ${this.player.level}`;
        document.getElementById('player-hp').textContent = `HP: ${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('player-mp').textContent = `MP: ${this.player.mp}/${this.player.maxMp}`;
        document.getElementById('player-hunger').textContent = `Hunger: ${this.player.hunger}/${this.player.maxHunger}`;
        document.getElementById('player-gold').textContent = `Gold: ${this.player.gold}`;
        const location = this.locations.get(this.currentLocation);
        document.getElementById('location').textContent = `Location: ${location.name}`;
    }
    getHealthBar() {
        const percentage = Math.floor((this.player.hp / this.player.maxHp) * 10);
        return '[' + '█'.repeat(percentage) + ' '.repeat(10 - percentage) + ']';
    }
    getManaBar() {
        const percentage = Math.floor((this.player.mp / this.player.maxMp) * 10);
        return '[' + '█'.repeat(percentage) + ' '.repeat(10 - percentage) + ']';
    }
    getXPBar() {
        const percentage = Math.floor((this.player.xp / this.player.xpToNext) * 10);
        return '[' + '█'.repeat(percentage) + ' '.repeat(10 - percentage) + ']';
    }
    addToDisplay(text) {
        const gameDisplay = document.getElementById('game-display');
        gameDisplay.textContent += text + '\n';
        gameDisplay.scrollTop = gameDisplay.scrollHeight;
    }
    gameOver() {
        this.gameState = 'dead';
        const gameOverModal = document.getElementById('game-over');
        const gameOverTitle = document.getElementById('game-over-title');
        const gameOverMessage = document.getElementById('game-over-message');
        gameOverTitle.textContent = 'Game Over';
        gameOverMessage.textContent = `Your adventure has ended at level ${this.player.level}. You had ${this.player.gold} gold and ${this.player.xp} XP.`;
        gameOverModal.classList.remove('hidden');
    }
    restartGame() {
        const gameOverModal = document.getElementById('game-over');
        gameOverModal.classList.add('hidden');
        const gameDisplay = document.getElementById('game-display');
        gameDisplay.textContent = '';
        this.initializeGame();
        this.displayWelcome();
    }
    castSpell(spellName) {
        if (this.gameState !== 'combat' || !this.combatEnemy) {
            this.addToDisplay("You can only cast spells during combat!");
            return;
        }
        const spell = this.player.spells.find(s => s.name.toLowerCase().includes(spellName.toLowerCase()));
        if (!spell) {
            this.addToDisplay(`You don't know the spell "${spellName}".`);
            return;
        }
        if (this.player.mp < spell.cost) {
            this.addToDisplay(`Not enough MP to cast ${spell.name}. You need ${spell.cost} MP.`);
            return;
        }
        this.player.mp -= spell.cost;
        this.addToDisplay(`🔮 You cast ${spell.name}!`);
        if (spell.damage) {
            const damage = Math.max(1, spell.damage + this.player.magic - this.combatEnemy.magicResist);
            this.combatEnemy.hp -= damage;
            this.addToDisplay(`💥 ${spell.name} deals ${damage} damage to ${this.combatEnemy.name}!`);
        }
        if (spell.healing) {
            const healing = spell.healing + this.player.magic;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healing);
            this.addToDisplay(`✨ ${spell.name} heals you for ${healing} HP!`);
        }
        if (this.combatEnemy.hp <= 0) {
            this.defeatEnemy();
            return;
        }
        // Enemy counter-attack
        const enemyDamage = Math.max(1, this.combatEnemy.damage - this.player.defense - (this.player.currentArmor?.defense || 0));
        this.player.hp -= enemyDamage;
        this.addToDisplay(`💥 The ${this.combatEnemy.name} attacks you for ${enemyDamage} damage!`);
        if (this.player.hp <= 0) {
            this.gameOver();
            return;
        }
        this.updateStatusBar();
    }
    useAbility(abilityName) {
        const ability = this.player.abilities.find(a => a.name.toLowerCase().includes(abilityName.toLowerCase()));
        if (!ability) {
            this.addToDisplay(`You don't have the ability "${abilityName}".`);
            return;
        }
        if (ability.currentCooldown > 0) {
            this.addToDisplay(`${ability.name} is on cooldown for ${ability.currentCooldown} more turns.`);
            return;
        }
        if (this.player.mp < ability.cost) {
            this.addToDisplay(`Not enough MP to use ${ability.name}. You need ${ability.cost} MP.`);
            return;
        }
        this.player.mp -= ability.cost;
        ability.currentCooldown = ability.cooldown;
        this.addToDisplay(`⚡ You use ${ability.name}!`);
        // Apply ability effects
        switch (ability.effect) {
            case 'damage_multiplier':
                if (this.gameState === 'combat' && this.combatEnemy) {
                    const damage = Math.max(1, this.player.strength * 2 + (this.player.currentWeapon?.damage || 0) - this.combatEnemy.defense);
                    this.combatEnemy.hp -= damage;
                    this.addToDisplay(`💥 Power Strike deals ${damage} damage to ${this.combatEnemy.name}!`);
                }
                break;
            case 'magic_buff':
                this.player.magic += 5;
                this.addToDisplay("✨ Your magical power increases temporarily!");
                break;
            case 'evasion_boost':
                this.addToDisplay("💨 Your evasion increases!");
                break;
            case 'berserker_mode':
                this.player.strength += 10;
                this.player.defense -= 5;
                this.addToDisplay("🔥 You enter berserker rage! Damage increased, defense decreased!");
                break;
        }
        this.updateStatusBar();
    }
    enterDungeon() {
        this.player.dungeonLevel++;
        const dungeonKey = `dungeon_${this.player.dungeonLevel}`;
        if (!this.locations.has(dungeonKey)) {
            const newDungeon = this.proceduralGenerator.generateDungeon(this.player.dungeonLevel);
            this.locations.set(dungeonKey, newDungeon);
            // Add boss if this level should have one
            if (newDungeon.hasBoss) {
                const boss = this.proceduralGenerator.generateBoss(this.player.dungeonLevel);
                newDungeon.enemies.push(boss);
            }
        }
        this.currentLocation = dungeonKey;
        this.gameState = 'playing';
        this.combatEnemy = null;
        this.updateStatusBar();
        this.addToDisplay(`🏰 You dive into dungeon level ${this.player.dungeonLevel}!`);
        this.lookAround();
    }
    showSpells() {
        this.addToDisplay(`
🔮 Known Spells:
═══════════════════════════════════════════════════════════════
        `);
        if (this.player.spells.length === 0) {
            this.addToDisplay("You don't know any spells yet. Learn them from defeating enemies or finding spell books!");
        }
        else {
            this.player.spells.forEach(spell => {
                this.addToDisplay(`${spell.name} (${spell.cost} MP) - ${spell.description}`);
            });
        }
    }
    showAbilities() {
        this.addToDisplay(`
⚡ Abilities:
═══════════════════════════════════════════════════════════════
        `);
        if (this.player.abilities.length === 0) {
            this.addToDisplay("You don't have any abilities yet. Learn them from defeating bosses!");
        }
        else {
            this.player.abilities.forEach(ability => {
                const cooldownText = ability.currentCooldown > 0 ? ` (Cooldown: ${ability.currentCooldown})` : '';
                this.addToDisplay(`${ability.name}${cooldownText} - ${ability.description}`);
            });
        }
    }
    showSkills() {
        this.addToDisplay(`
🎯 Skills & Progression:
═══════════════════════════════════════════════════════════════
Skill Points: ${this.player.skillPoints}
Level: ${this.player.level}
Dungeon Level: ${this.player.dungeonLevel}

Available Skills:
• Power Strike - Devastating physical attack
• Magic Boost - Increase magical power temporarily
• Dodge - Increase evasion temporarily
• Berserker Rage - Enter rage mode (Level 2+)

Type 'upgrade <skill>' to spend skill points.
        `);
    }
    takeItem(itemName) {
        const location = this.locations.get(this.currentLocation);
        const item = location.items.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
        if (!item) {
            this.addToDisplay(`There's no ${itemName} here.`);
            return;
        }
        this.player.inventory.push(item);
        location.items = location.items.filter(i => i !== item);
        this.addToDisplay(`📦 You pick up the ${item.name}.`);
    }
    learnSpell(spell) {
        if (!this.player.spells.find(s => s.id === spell.id)) {
            this.player.spells.push(spell);
            this.addToDisplay(`🔮 You learn the spell: ${spell.name}!`);
        }
    }
    learnAbility(ability) {
        if (!this.player.abilities.find(a => a.id === ability.id)) {
            this.player.abilities.push(ability);
            this.addToDisplay(`⚡ You learn the ability: ${ability.name}!`);
        }
    }
    getHungerBar() {
        const percentage = Math.floor((this.player.hunger / this.player.maxHunger) * 10);
        return '[' + '█'.repeat(percentage) + ' '.repeat(10 - percentage) + ']';
    }
    identifyItem(itemName) {
        const item = this.player.inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));
        if (!item) {
            this.addToDisplay(`You don't have a ${itemName}.`);
            return;
        }
        if (item.identified) {
            this.addToDisplay(`${item.name} is already identified.`);
            return;
        }
        // Use identify scroll if available
        const identifyScroll = this.player.inventory.find(i => i.type === 'scroll' && i.name.toLowerCase().includes('identify'));
        if (identifyScroll) {
            item.identified = true;
            this.player.identifiedItems.add(item.id);
            this.player.inventory = this.player.inventory.filter(i => i !== identifyScroll);
            this.addToDisplay(`🔍 You identify the ${item.name}: ${item.description}`);
        }
        else {
            this.addToDisplay("You need a Scroll of Identify to identify unknown items.");
        }
    }
    eatFood(foodName) {
        const food = this.player.inventory.find(i => i.type === 'food' && i.name.toLowerCase().includes(foodName.toLowerCase()));
        if (!food) {
            this.addToDisplay(`You don't have ${foodName} to eat.`);
            return;
        }
        this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + food.hungerRestore);
        if (food.hpRestore) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + food.hpRestore);
            this.addToDisplay(`🍎 You eat the ${food.name} and restore ${food.hungerRestore} hunger and ${food.hpRestore} HP!`);
        }
        else {
            this.addToDisplay(`🍎 You eat the ${food.name} and restore ${food.hungerRestore} hunger!`);
        }
        // Remove food from inventory
        if (food.quantity && food.quantity > 1) {
            food.quantity--;
        }
        else {
            this.player.inventory = this.player.inventory.filter(i => i !== food);
        }
        this.updateStatusBar();
    }
    wearRing(ringName) {
        const ring = this.player.inventory.find(i => i.type === 'ring' && i.name.toLowerCase().includes(ringName.toLowerCase()));
        if (!ring) {
            this.addToDisplay(`You don't have a ${ringName} to wear.`);
            return;
        }
        if (!ring.identified) {
            this.addToDisplay(`You can't wear an unidentified ring. Identify it first!`);
            return;
        }
        // Apply ring effects
        switch (ring.effect) {
            case 'strength':
                this.player.strength += ring.magnitude;
                this.addToDisplay(`💪 You wear the ${ring.name}! Strength increased by ${ring.magnitude}.`);
                break;
            case 'defense':
                this.player.defense += ring.magnitude;
                this.addToDisplay(`🛡️ You wear the ${ring.name}! Defense increased by ${ring.magnitude}.`);
                break;
            case 'magic':
                this.player.magic += ring.magnitude;
                this.addToDisplay(`✨ You wear the ${ring.name}! Magic increased by ${ring.magnitude}.`);
                break;
            case 'speed':
                this.player.speed += ring.magnitude;
                this.addToDisplay(`💨 You wear the ${ring.name}! Speed increased by ${ring.magnitude}.`);
                break;
            case 'hunger':
                this.player.maxHunger += ring.magnitude * 10;
                this.addToDisplay(`🍞 You wear the ${ring.name}! Hunger capacity increased.`);
                break;
        }
        this.player.inventory = this.player.inventory.filter(i => i !== ring);
        this.updateStatusBar();
    }
    wait() {
        this.player.turns++;
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 5);
        this.player.hunger = Math.max(0, this.player.hunger - 2);
        // Apply status effects
        this.processStatusEffects();
        this.addToDisplay("⏰ You wait... MP restored, hunger decreases.");
        this.updateStatusBar();
        if (this.player.hunger <= 0) {
            this.addToDisplay("💀 You starve to death!");
            this.gameOver();
        }
    }
    processStatusEffects() {
        this.player.statusEffects = this.player.statusEffects.filter(effect => {
            effect.duration--;
            switch (effect.effect) {
                case 'poison':
                    this.player.hp -= effect.magnitude;
                    this.addToDisplay(`☠️ You take ${effect.magnitude} poison damage!`);
                    break;
                case 'burn':
                    this.player.hp -= effect.magnitude;
                    this.addToDisplay(`🔥 You take ${effect.magnitude} burn damage!`);
                    break;
                case 'regeneration':
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + effect.magnitude);
                    this.addToDisplay(`✨ You regenerate ${effect.magnitude} HP!`);
                    break;
            }
            return effect.duration > 0;
        });
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }
    saveGame() {
        const saveData = {
            player: this.player,
            currentLocation: this.currentLocation,
            gameState: this.gameState,
            locations: Array.from(this.locations.entries()),
            timestamp: Date.now()
        };
        localStorage.setItem('asciiRPG_save', JSON.stringify(saveData));
        this.addToDisplay("💾 Game saved! Use 'load' to continue later.");
    }
    loadGame() {
        const saveData = localStorage.getItem('asciiRPG_save');
        if (!saveData) {
            this.addToDisplay("No save file found. Start a new game with 'start'.");
            return;
        }
        try {
            const data = JSON.parse(saveData);
            this.player = data.player;
            this.currentLocation = data.currentLocation;
            this.gameState = data.gameState;
            // Restore locations map
            this.locations = new Map(data.locations);
            this.addToDisplay("📂 Game loaded successfully!");
            this.updateStatusBar();
            this.lookAround();
        }
        catch (error) {
            this.addToDisplay("❌ Failed to load save file. It may be corrupted.");
        }
    }
    quitGame() {
        this.addToDisplay("🚪 You quit the game. All progress is lost!");
        this.addToDisplay("Type 'start' to begin a new adventure.");
        this.gameState = 'menu';
    }
    applyHunger() {
        this.player.hunger = Math.max(0, this.player.hunger - 1);
        this.player.turns++;
        if (this.player.hunger <= 0) {
            this.addToDisplay("💀 You starve to death!");
            this.gameOver();
        }
    }
    processTurn() {
        // Reduce ability cooldowns
        this.player.abilities.forEach(ability => {
            if (ability.currentCooldown > 0) {
                ability.currentCooldown--;
            }
        });
        // Apply hunger every few turns
        if (this.player.turns % 3 === 0) {
            this.applyHunger();
        }
        // Process status effects
        this.processStatusEffects();
    }
}
// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ASCIIRPG();
});
//# sourceMappingURL=ascii-rpg.js.map