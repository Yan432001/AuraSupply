const pool = require('../API/app/config/dbPool');

async function check() {
  const [cols1] = await pool.query('SHOW COLUMNS FROM aura_rewards_exchange');
  console.log('aura_rewards_exchange columns:\n', cols1.map(c => ` ${c.Field} (${c.Type}, Null:${c.Null})`).join('\n'));

  const [cols2] = await pool.query('SHOW COLUMNS FROM aura_reward_exchange_items');
  console.log('\naura_reward_exchange_items columns:\n', cols2.map(c => ` ${c.Field} (${c.Type}, Null:${c.Null})`).join('\n'));

  const [cols3] = await pool.query('SHOW COLUMNS FROM aura_rewards');
  console.log('\naura_rewards columns:\n', cols3.map(c => ` ${c.Field} (${c.Type}, Null:${c.Null})`).join('\n'));

  const [companies] = await pool.query("SELECT id, name, group_name, award_points FROM aura_companies WHERE group_name = 'customer' LIMIT 5");
  console.log('\nsample customers:\n', companies);

  const [exchanges] = await pool.query('SELECT * FROM aura_rewards_exchange LIMIT 3');
  console.log('\nexisting rewards exchanges count:', exchanges.length);
  if (exchanges.length > 0) {
    console.log('sample exchange:', exchanges[0]);
  }

  process.exit(0);
}
check().catch(err => {
  console.error(err);
  process.exit(1);
});
