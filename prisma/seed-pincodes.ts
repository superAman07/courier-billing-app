import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) throw new Error("Missing DATABASE_URL");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── SECTOR DEFINITIONS (exactly matching your current SECTORS array) ───
const SECTORS = [
    { code: "LOCAL", name: "Local" },
    { code: "UP", name: "UP" },
    { code: "UK", name: "UK" },
    { code: "DELHI", name: "Delhi" },
    { code: "BJ", name: "Bihaar / Jharkhand" },
    { code: "NORTH", name: "North (Haryana / Punjaab / Rajasthaan)" },
    { code: "METRO", name: "Metro ( Mumbai, Hyderabad, Chennai, Banglore, Kolkata)" },
    { code: "ROI", name: "Rest of India" },
    { code: "NE", name: "North East" },
    { code: "SPECIAL", name: "Special Sector ( Darjling, Silchaar, Daman)" },
];

// ─── ZONE DEFINITIONS (matching your existing 5 zones) ───
const ZONES = [
    { code: "N", name: "NORTH" },
    { code: "S", name: "SOUTH" },
    { code: "E", name: "EAST" },
    { code: "W", name: "WEST" },
    { code: "C", name: "CENTRAL" },
];

// ─── STATE → ZONE mapping (geographical) ───
const STATE_TO_ZONE: Record<string, string> = {
    // NORTH
    "UTTAR PRADESH": "N", "UTTARAKHAND": "N", "DELHI": "N",
    "HARYANA": "N", "PUNJAB": "N", "RAJASTHAN": "N",
    "HIMACHAL PRADESH": "N", "JAMMU AND KASHMIR": "N", "LADAKH": "N",
    "CHANDIGARH": "N",
    // SOUTH
    "TAMIL NADU": "S", "KERALA": "S", "KARNATAKA": "S",
    "ANDHRA PRADESH": "S", "TELANGANA": "S", "PUDUCHERRY": "S",
    "LAKSHADWEEP": "S",
    // EAST
    "WEST BENGAL": "E", "BIHAR": "E", "JHARKHAND": "E",
    "ODISHA": "E", "ASSAM": "E", "SIKKIM": "E",
    "MANIPUR": "E", "MEGHALAYA": "E", "TRIPURA": "E",
    "MIZORAM": "E", "NAGALAND": "E", "ARUNACHAL PRADESH": "E",
    // WEST
    "MAHARASHTRA": "W", "GUJARAT": "W", "GOA": "W",
    "DADRA AND NAGAR HAVELI AND DAMAN AND DIU": "W",
    "DADRA AND NAGAR HAVELI": "W", "DAMAN AND DIU": "W",
    // CENTRAL
    "MADHYA PRADESH": "C", "CHHATTISGARH": "C",
    "ANDAMAN AND NICOBAR ISLANDS": "E",
};

// ─── STATE → SECTOR mapping (matching your STATIC_SECTOR_MAP in calculate-rate) ───
const STATE_TO_SECTOR: Record<string, string> = {
    "UTTAR PRADESH": "UP",
    "UTTARAKHAND": "UK",
    "DELHI": "Delhi",
    "BIHAR": "Bihaar / Jharkhand",
    "JHARKHAND": "Bihaar / Jharkhand",
    "HARYANA": "North (Haryana / Punjaab / Rajasthaan)",
    "PUNJAB": "North (Haryana / Punjaab / Rajasthaan)",
    "RAJASTHAN": "North (Haryana / Punjaab / Rajasthaan)",
    "ASSAM": "North East",
    "SIKKIM": "North East",
    "MANIPUR": "North East",
    "MEGHALAYA": "North East",
    "TRIPURA": "North East",
    "MIZORAM": "North East",
    "NAGALAND": "North East",
    "ARUNACHAL PRADESH": "North East",
    // Everything else falls to "Rest of India"
};

const DEFAULT_ZONE = "N"; // fallback zone code
const DEFAULT_SECTOR = "Rest of India"; // fallback sector

// ─── CSV PARSER ───
async function parseCSV(filePath: string) {
    const rows: Array<{ pincode: string; district: string; statename: string }> = [];

    const rl = createInterface({
        input: createReadStream(filePath, { encoding: 'utf-8' }),
        crlfDelay: Infinity,
    });

    let isFirstLine = true;
    let headers: string[] = [];

    for await (const line of rl) {
        if (isFirstLine) {
            headers = line.split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
            isFirstLine = false;
            continue;
        }

        // Simple CSV parse — handles quoted fields
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const pincodeIdx = headers.indexOf('pincode');
        const districtIdx = headers.indexOf('district');
        const statenameIdx = headers.indexOf('statename');

        if (pincodeIdx === -1 || districtIdx === -1 || statenameIdx === -1) {
            console.error('CSV column headers not found! Expected: pincode, district, statename');
            process.exit(1);
        }

        const pincode = values[pincodeIdx]?.replace(/"/g, '').trim();
        const district = values[districtIdx]?.replace(/"/g, '').trim().toUpperCase();
        const statename = values[statenameIdx]?.replace(/"/g, '').trim().toUpperCase();

        if (pincode && district && statename && /^\d{6}$/.test(pincode)) {
            rows.push({ pincode, district, statename });
        }
    }

    return rows;
}

// ─── MAIN SEED FUNCTION ───
async function main() {
    console.log('🚀 Starting pincode database seed...\n');

    // 1. Parse CSV
    const csvPath = resolve(dirname(fileURLToPath(import.meta.url)), 'data', 'all-cities-pincodes.csv');
    console.log(`📂 Reading CSV from: ${csvPath}`);
    const rawRows = await parseCSV(csvPath);
    console.log(`   → ${rawRows.length} total rows read from CSV`);

    // 2. Deduplicate
    const uniqueStates = new Set<string>();
    const uniqueDistricts = new Map<string, string>(); // "STATE|DISTRICT" → district
    const uniquePincodes = new Map<string, { district: string; statename: string }>();

    for (const row of rawRows) {
        uniqueStates.add(row.statename);
        uniqueDistricts.set(`${row.statename}|${row.district}`, row.district);
        if (!uniquePincodes.has(row.pincode)) {
            uniquePincodes.set(row.pincode, { district: row.district, statename: row.statename });
        }
    }

    console.log(`\n📊 Deduplication results:`);
    console.log(`   States:   ${uniqueStates.size}`);
    console.log(`   Cities:   ${uniqueDistricts.size}`);
    console.log(`   Pincodes: ${uniquePincodes.size}`);

    // 3. Seed SectorMaster
    console.log('\n🏷️  Seeding SectorMaster...');
    for (const sector of SECTORS) {
        await prisma.sectorMaster.upsert({
            where: { code: sector.code },
            update: { name: sector.name },
            create: { code: sector.code, name: sector.name, active: true },
        });
    }
    console.log(`   → ${SECTORS.length} sectors upserted`);

    // 4. Seed ZoneMaster (upsert to keep existing data)
    console.log('\n🗺️  Seeding ZoneMaster...');
    const zoneIdMap = new Map<string, string>(); // code → id
    for (const zone of ZONES) {
        const result = await prisma.zoneMaster.upsert({
            where: { code: zone.code },
            update: { name: zone.name },
            create: { code: zone.code, name: zone.name, active: true },
        });
        zoneIdMap.set(zone.code, result.id);
    }
    console.log(`   → ${ZONES.length} zones upserted`);

    // 5. Seed StateMaster
    console.log('\n🏛️  Seeding StateMaster...');
    const stateIdMap = new Map<string, string>(); // statename → id
    let stateCount = 0;

    for (const stateName of uniqueStates) {
        const zoneCode = STATE_TO_ZONE[stateName] || DEFAULT_ZONE;
        const zoneId = zoneIdMap.get(zoneCode)!;
        const sector = STATE_TO_SECTOR[stateName] || DEFAULT_SECTOR;

        // Create a code from first 2 chars (handle duplicates)
        let code = stateName.substring(0, 2).toUpperCase();

        // Check if code already exists for a different state
        const existing = await prisma.stateMaster.findUnique({ where: { code } });
        if (existing && existing.name !== stateName) {
            // Use first 3 chars or add number
            code = stateName.substring(0, 3).toUpperCase();
            const existing2 = await prisma.stateMaster.findUnique({ where: { code } });
            if (existing2 && existing2.name !== stateName) {
                code = stateName.substring(0, 2).toUpperCase() + stateCount;
            }
        }

        const result = await prisma.stateMaster.upsert({
            where: { code },
            update: { name: stateName, zoneId, sector },
            create: { code, name: stateName, zoneId, active: true, sector },
        });
        stateIdMap.set(stateName, result.id);
        stateCount++;
    }
    console.log(`   → ${stateCount} states upserted`);

    // 6. Seed CityMaster
    console.log('\n🏙️  Seeding CityMaster...');
    const cityIdMap = new Map<string, string>(); // "STATE|DISTRICT" → id
    let cityCount = 0;
    let citySkipped = 0;

    for (const [key, districtName] of uniqueDistricts) {
        const stateName = key.split('|')[0];
        const stateId = stateIdMap.get(stateName);
        if (!stateId) {
            citySkipped++;
            continue;
        }

        // Generate city code: first 3 chars of district + first 2 chars of state
        let code = (districtName.substring(0, 3) + stateName.substring(0, 2)).toUpperCase();

        // Check for existing city code collision
        const existing = await prisma.cityMaster.findUnique({ where: { code } });
        if (existing && existing.name !== districtName) {
            code = (districtName.substring(0, 4) + stateName.substring(0, 2)).toUpperCase();
            const existing2 = await prisma.cityMaster.findUnique({ where: { code } });
            if (existing2 && existing2.name !== districtName) {
                code = (districtName.substring(0, 3) + stateName.substring(0, 2) + cityCount).toUpperCase();
            }
        }

        try {
            const result = await prisma.cityMaster.upsert({
                where: { code },
                update: { name: districtName, stateId },
                create: { code, name: districtName, stateId, active: true },
            });
            cityIdMap.set(key, result.id);
            cityCount++;
        } catch (e: any) {
            // Handle unique constraint errors gracefully
            if (e.code === 'P2002') {
                const existing = await prisma.cityMaster.findFirst({
                    where: { name: districtName, stateId }
                });
                if (existing) {
                    cityIdMap.set(key, existing.id);
                }
            } else {
                console.error(`   ⚠️ Error inserting city ${districtName}: ${e.message}`);
            }
            citySkipped++;
        }

        if ((cityCount + citySkipped) % 100 === 0) {
            process.stdout.write(`\r   → ${cityCount} cities inserted, ${citySkipped} skipped...`);
        }
    }
    console.log(`\r   → ${cityCount} cities upserted, ${citySkipped} skipped`);

    // 7. Seed PincodeMaster (in batches for performance)
    console.log('\n📮 Seeding PincodeMaster...');
    let pincodeCount = 0;
    let pincodeSkipped = 0;
    const BATCH_SIZE = 100;
    const pincodeEntries = Array.from(uniquePincodes.entries());

    for (let i = 0; i < pincodeEntries.length; i += BATCH_SIZE) {
        const batch = pincodeEntries.slice(i, i + BATCH_SIZE);

        const operations = batch.map(([pincode, data]) => {
            const stateId = stateIdMap.get(data.statename);
            const cityKey = `${data.statename}|${data.district}`;
            const cityId = cityIdMap.get(cityKey);

            if (!stateId || !cityId) return null;

            return prisma.pincodeMaster.upsert({
                where: { pincode },
                update: { stateId, cityId },
                create: { pincode, stateId, cityId, active: true },
            });
        }).filter(Boolean);

        try {
            const results = await Promise.allSettled(operations as Promise<any>[]);
            const fulfilled = results.filter(r => r.status === 'fulfilled').length;
            pincodeCount += fulfilled;
            pincodeSkipped += results.filter(r => r.status === 'rejected').length;
        } catch (e: any) {
            console.error(`   ⚠️ Batch error: ${e.message}`);
        }

        process.stdout.write(`\r   → ${pincodeCount} pincodes inserted (${Math.round(((i + BATCH_SIZE) / pincodeEntries.length) * 100)}%)...`);
    }

    console.log(`\r   → ${pincodeCount} pincodes upserted, ${pincodeSkipped} failed                    `);

    // 8. Summary
    console.log('\n' + '═'.repeat(50));
    console.log('✅ SEED COMPLETE!');
    console.log('═'.repeat(50));

    const counts = {
        sectors: await prisma.sectorMaster.count(),
        zones: await prisma.zoneMaster.count(),
        states: await prisma.stateMaster.count(),
        cities: await prisma.cityMaster.count(),
        pincodes: await prisma.pincodeMaster.count(),
    };

    console.log(`   Sectors:  ${counts.sectors}`);
    console.log(`   Zones:    ${counts.zones}`);
    console.log(`   States:   ${counts.states}`);
    console.log(`   Cities:   ${counts.cities}`);
    console.log(`   Pincodes: ${counts.pincodes}`);
    console.log('═'.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
