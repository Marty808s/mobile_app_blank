import * as SQLite from 'expo-sqlite';
import mockedFeed from '../constants/mockedFeed';
import { fetchRSSChannel } from '../api/FetchRSS';
// https://docs.expo.dev/versions/latest/sdk/sqlite/

// zde bude práce s databází

// Funkce pro získání nového připojení (async kvůli parametrizovaným dotazům)
async function getDb() {
    return await SQLite.openDatabaseAsync('myapp');
}

export async function initDB() {
    const db = await getDb();

    const createFeedsTable = async () => {await db.execAsync(`
        CREATE TABLE IF NOT EXISTS feeds(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            description TEXT,
            title TEXT
        );
    `);}

    const createContentTable = async () => {await db.execAsync(`
        CREATE TABLE IF NOT EXISTS content(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_id INTEGER,
            title TEXT,
            description TEXT,
            link TEXT,
            published TEXT,
            comments TEXT
        );
    `);}

    console.log("Tabulky jsou ready")

    await createFeedsTable();
    await createContentTable();

    // zajisti unikátnost až po vytvoření tabulek
    await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_feeds_url_unique ON feeds(url);
    `);

    await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_content_feed_link_unique ON content(feed_id, link);
    `);

    if (!mockedFeed || mockedFeed.length === 0) {
        console.log("Nemám data");
        return;
    }

    // naplnění dat – parametrizované dotazy, bez duplicit (OR IGNORE)
    const stmt = await db.prepareAsync('INSERT OR IGNORE INTO feeds (url, description, title) VALUES (?, ?, ?)');
    try {
        for (const feed of mockedFeed) {
            await stmt.executeAsync([feed.url, feed.description ?? '', feed.title]);
            console.log("Feed - insert", feed.title);
        }
    } finally {
        await stmt.finalizeAsync();
    }
}

export async function addContent(feedId) {
    console.log('Adding content for feed ID:', feedId);
    const db = await getDb();

    // načti feed podle ID (parametrizovaně)
    const feed = await db.getFirstAsync('SELECT * FROM feeds WHERE id = ?', [feedId]);
    if (!feed) {
        console.log('Feed nenalezen:', feedId);
        return;
    } else {
        console.log('Feed nalezen:', feed.title);
    }


    // získej data kanálu
    const url = typeof feed.url === 'string' ? feed.url : '';
    const json = await fetchRSSChannel(url);
    const items = json?.rss?.channel?.item;
    console.log('RSS items count:', items?.length || 0);
    if (!Array.isArray(items) || items.length === 0) {
        console.log('Žádné položky k vložení');
        return;
    }

    // připrav INSERT a vlož všechny položky
    const stmt = await db.prepareAsync('INSERT OR IGNORE INTO content (feed_id, title, description, link, published, comments) VALUES (?, ?, ?, ?, ?, ?)');
    try {
        let insertedCount = 0;
        for (const item of items) {
            const result = await stmt.executeAsync([
                feedId,
                item?.title ?? '',
                item?.description ?? '',
                item?.link ?? '',
                item?.pubDate ?? '',
                item?.comments ?? ''
            ]);
            if (result.changes > 0) {
                insertedCount++;
            }
        }
        console.log('Content - insert hotovo pro feed', feedId, 'Vloženo položek:', insertedCount);
    } finally {
        await stmt.finalizeAsync();
    }
}

export async function getFeeds() {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM feeds');
    return rows;
}

// smazání celé DB (pro debug)
export async function resetDB() {

    // smazání celé db
    try {
        await SQLite.deleteDatabaseAsync('myapp');
        console.log('Databáze myapp smazána');
        return;
    } catch (e) {
        console.log('Nepodařilo se smazat DB soubor, padám na DROP TABLE...', e);
    }

    // fallback: drop tabulky a indexy
    const db = await getDb();
    await db.execAsync(`
        DROP INDEX IF EXISTS idx_content_feed_link_unique;
        DROP INDEX IF EXISTS idx_feeds_url_unique;
        DROP TABLE IF EXISTS content;
        DROP TABLE IF EXISTS feeds;
    `);
    console.log('Tabulky a indexy smazány');
}

export async function getContent(feedId) {
    const db = await getDb();
    console.log('Hledám obsah pro feed ID:', feedId);
    const rows = await db.getAllAsync('SELECT * FROM content WHERE feed_id = ?', [feedId]);
    console.log('Nalezený obsah:', rows);
    return rows;
}

// funkce pro aktualizaci obsahu všech feedů - pro intervalovou aktualizaci
export async function getFeedsAndContent() {
    const db = await getDb();
    console.log('Hledám feedy a obsah');
    const rows = await db.getAllAsync('SELECT id, title, url FROM feeds');
    console.log('Nalezené feedy s odkazy:', rows);
    for (const feed of rows) {
        const content = await addContent(feed.id);
        console.log('Obsah aktualizován pro feed', feed.title, ':', content);
    }
}