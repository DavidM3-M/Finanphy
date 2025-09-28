import fs from 'fs';
import path from 'path';

const ENTITIES_DIR = path.join(__dirname, 'src');
const ENTITY_PATTERN = /\.entity\.ts$/;

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');

  const updated = content.replace(
    /^(\s+)(\w+): ([\w\[\]]+);$/gm,
    (_, indent, name, type) => `${indent}${name}!: ${type};`
  );

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Actualizado: ${filePath}`);
  }
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (ENTITY_PATTERN.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

walk(ENTITIES_DIR);