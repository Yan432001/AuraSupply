const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2a$10$DeLqK9rgLLsBmWTDSuEf8OmYTY99Hqly6EmWpgQpnFSWIkhgcPyay';
  console.log('Matches Sbc@12345:', await bcrypt.compare('Sbc@12345', hash));
  console.log('Matches sbc@12345:', await bcrypt.compare('sbc@12345', hash));
}
test();
