import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function cleanDatabase() {
  const client = await pool.connect();

  try {
    console.log('--- STARTING DATABASE CLEANUP ---');

    await client.query('BEGIN');

    // 1. Truncate dependent transactional tables
    console.log('Truncating transactional tables...');
    await client.query('TRUNCATE TABLE winner_proofs CASCADE;');
    await client.query('TRUNCATE TABLE donations CASCADE;');
    await client.query('TRUNCATE TABLE draw_entries CASCADE;');
    await client.query('TRUNCATE TABLE draws CASCADE;');
    await client.query('TRUNCATE TABLE scores CASCADE;');
    await client.query('TRUNCATE TABLE subscriptions CASCADE;');

    // 2. Clean users table, keeping only seeded admin
    console.log('Cleaning users table (preserving admin@golfdraw.com)...');
    await client.query(`DELETE FROM users WHERE email != 'admin@golfdraw.com';`);

    // Reset admin user to clean seeded state
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, subscription_status, onboarding_completed, selected_charity_id, charity_contribution_percent)
      VALUES (
        'admin@golfdraw.com',
        '$2a$10$Iw88rJP3rAAlbJ0c.9w5U.v4gEzxxztT2hr6Zb0gHLU/UHDEwbi4K',
        'Admin User',
        'admin',
        'active',
        true,
        NULL,
        10
      )
      ON CONFLICT (email) DO UPDATE SET
        full_name = 'Admin User',
        role = 'admin',
        subscription_status = 'active',
        onboarding_completed = true,
        selected_charity_id = NULL,
        charity_contribution_percent = 10;
    `);

    // 3. Reset charities total_raised to 0 and ensure Indian charities are seeded
    console.log('Ensuring Indian charities are seeded and resetting total_raised to 0.00...');
    const indianCharities = [
      {
        name: 'Goonj',
        description: 'A multi-award winning Indian non-profit addressing basic, ignored needs in rural and disaster-hit communities using urban surplus as a development catalyst.',
        website: 'https://goonj.org'
      },
      {
        name: 'Akshaya Patra Foundation',
        description: 'The world\'s largest NGO-run school meal programme, nourishing over 2 million children across 24,000+ government schools in India every single day.',
        website: 'https://www.akshayapatra.org'
      },
      {
        name: 'CRY - Child Rights and You',
        description: 'India\'s trusted children\'s charity, partnering with grassroots communities across 19 states to champion child education, nutrition, healthcare, and protection.',
        website: 'https://www.cry.org'
      },
      {
        name: 'Pratham Education Foundation',
        description: 'One of India\'s largest non-governmental organisations dedicated to improving learning outcomes and basic literacy for underprivileged children nationwide.',
        website: 'https://www.pratham.org'
      },
      {
        name: 'HelpAge India',
        description: 'Leading national NGO serving disadvantaged elderly citizens across India with mobile healthcare units, cataract surgeries, elder helplines, and livelihood support.',
        website: 'https://www.helpageindia.org'
      },
      {
        name: 'Magic Bus India Foundation',
        description: 'Empowering adolescents and youth from underserved Indian communities to move out of poverty through life-skills education and livelihood readiness programmes.',
        website: 'https://www.magicbus.org'
      },
      {
        name: 'WWF-India',
        description: 'Committed to wildlife conservation, protecting tiger corridors, river ecosystems, and sustainable biodiversity preservation across the Indian subcontinent.',
        website: 'https://www.wwfindia.org'
      },
      {
        name: 'GiveIndia (Give.do)',
        description: 'India\'s most trusted giving platform connecting donors to credible, verified 80G non-profits working across poverty alleviation, education, and healthcare.',
        website: 'https://give.do'
      }
    ];

    for (const c of indianCharities) {
      await client.query(`
        INSERT INTO charities (name, description, website, total_raised, is_active)
        VALUES ($1, $2, $3, 0, true)
        ON CONFLICT DO NOTHING;
      `, [c.name, c.description, c.website]);
    }
    await client.query('UPDATE charities SET total_raised = 0.00;');

    // 4. Ensure platform_settings has default seed
    console.log('Resetting platform settings to default...');
    await client.query(`
      INSERT INTO platform_settings (
        id,
        platform_name,
        default_prize_pool_percentage,
        minimum_contribution_percent,
        maximum_scores_per_user,
        tier1_match_share,
        tier2_match_share,
        tier3_match_share,
        jackpot_rollover_enabled,
        maintenance_mode,
        support_email
      ) VALUES (
        'default',
        'Play for Impact',
        60.00,
        10,
        5,
        40.00,
        35.00,
        25.00,
        true,
        false,
        'support@playforimpact.in'
      )
      ON CONFLICT (id) DO UPDATE SET
        platform_name = 'Play for Impact',
        default_prize_pool_percentage = 60.00,
        minimum_contribution_percent = 10,
        maximum_scores_per_user = 5,
        tier1_match_share = 40.00,
        tier2_match_share = 35.00,
        tier3_match_share = 25.00,
        jackpot_rollover_enabled = true,
        maintenance_mode = false,
        support_email = 'support@playforimpact.in';
    `);

    await client.query('COMMIT');
    console.log('✓ Database transaction committed successfully.');

    // 5. Clean local uploads folder (winner proofs)
    const uploadsDir = path.join(__dirname, '../../uploads/winner-proofs');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
      console.log(`✓ Cleaned ${files.length} uploaded files from winner-proofs.`);
    }

    // 6. Verify table counts
    console.log('\n--- VERIFYING TABLE COUNTS AFTER CLEANUP ---');
    const tables = [
      'users',
      'charities',
      'platform_settings',
      'scores',
      'subscriptions',
      'draws',
      'draw_entries',
      'winner_proofs',
      'donations'
    ];

    for (const t of tables) {
      const res = await client.query(`SELECT count(*) as count FROM ${t}`);
      console.log(`  • ${t.padEnd(20)}: ${res.rows[0].count} rows`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Cleanup failed, transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});
