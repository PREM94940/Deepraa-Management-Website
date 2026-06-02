const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'supabase', 'migrations');

fs.readdirSync(dir).filter(f => f.endsWith('.sql')).forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Match CREATE POLICY "name" ON table
  const regex = /CREATE\s+POLICY\s+(["'])(.*?)\1\s+ON\s+([a-zA-Z0-9_.]+)/gi;
  let modified = false;
  
  content = content.replace(regex, (match, quote, name, table) => {
    modified = true;
    return `DROP POLICY IF EXISTS "${name}" ON ${table};\n${match}`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed policies in ' + file);
  }
});
