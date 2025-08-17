#!/usr/bin/env node
/**
 * Migration script to add characters arrays to existing project JSON files
 * This script reads all files in public/sceneData and adds characters arrays
 * if they don't already exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateCharactersFromScenes(scenes) {
  const charactersSet = new Set();
  scenes.forEach(scene => {
    scene.lines.forEach(line => {
      charactersSet.add(line.character);
    });
  });
  return Array.from(charactersSet).sort();
}

function migrateProjectFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Handle both array format (existing files) and single object format
    const projects = Array.isArray(parsedData) ? parsedData : [parsedData];
    let changesMade = false;
    
    projects.forEach((project, index) => {
      if (!project.scenes) {
        console.log(`  ⚠ Project ${index} has no scenes property, skipping`);
        return;
      }
      
      // Check if characters array already exists
      if (project.characters && Array.isArray(project.characters)) {
        console.log(`  ✓ Project "${project.project}" already has characters array with ${project.characters.length} characters`);
        return;
      }
      
      // Generate characters array from scenes
      const characters = generateCharactersFromScenes(project.scenes);
      project.characters = characters;
      changesMade = true;
      
      console.log(`  ✓ Added characters array to "${project.project}" with ${characters.length} characters: ${characters.join(', ')}`);
    });
    
    if (changesMade) {
      // Write back to file with proper formatting, preserving array structure
      const outputData = Array.isArray(parsedData) ? projects : projects[0];
      fs.writeFileSync(filePath, JSON.stringify(outputData, null, 2));
    }
    
    return changesMade;
    
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const sceneDataDir = path.join(process.cwd(), 'public', 'sceneData');
  
  if (!fs.existsSync(sceneDataDir)) {
    console.error(`Scene data directory not found: ${sceneDataDir}`);
    process.exit(1);
  }
  
  console.log('🔄 Starting migration of project files...');
  console.log(`📁 Directory: ${sceneDataDir}\n`);
  
  const files = fs.readdirSync(sceneDataDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('No JSON files found in sceneData directory.');
    return;
  }
  
  let migratedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(sceneDataDir, file);
    const wasMigrated = migrateProjectFile(filePath);
    if (wasMigrated) {
      migratedCount++;
    }
  });
  
  console.log(`\n✅ Migration complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - Total files: ${files.length}`);
  console.log(`   - Files migrated: ${migratedCount}`);
  console.log(`   - Files already up-to-date: ${files.length - migratedCount}`);
  
  if (migratedCount > 0) {
    console.log(`\n💡 ${migratedCount} files were updated with characters arrays.`);
  }
}

// Run the script if it's the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateCharactersFromScenes, migrateProjectFile };