#!/usr/bin/env node

/**
 * Mux Asset Management Script
 * 
 * This script helps manage Mux assets, particularly useful for cleaning up
 * assets when hitting the free plan limit of 10 assets.
 * 
 * Usage:
 *   node scripts/manage-mux-assets.js list
 *   node scripts/manage-mux-assets.js delete <asset-id>
 */

require('dotenv').config();
const Mux = require('@mux/mux-node');

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

async function listAssets() {
  try {
    console.log('📋 Listing Mux assets...\n');
    
    const assets = await mux.video.assets.list();
    
    if (assets.data.length === 0) {
      console.log('No assets found.');
      return;
    }
    
    console.log(`Found ${assets.data.length} assets:\n`);
    
    assets.data.forEach((asset, index) => {
      console.log(`${index + 1}. Asset ID: ${asset.id}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   Duration: ${asset.duration ? Math.round(asset.duration) + 's' : 'N/A'}`);
      console.log(`   Created: ${asset.created_at ? new Date(asset.created_at * 1000).toLocaleDateString() : 'N/A'}`);
      console.log(`   Playback IDs: ${asset.playback_ids ? asset.playback_ids.length : 0}`);
      console.log('');
    });
    
    console.log(`\n💡 You can delete assets using:`);
    console.log(`   node scripts/manage-mux-assets.js delete <asset-id>`);
    
  } catch (error) {
    console.error('❌ Error listing assets:', error.message);
  }
}

async function deleteAsset(assetId) {
  try {
    console.log(`🗑️  Deleting asset: ${assetId}`);
    
    await mux.video.assets.delete(assetId);
    
    console.log('✅ Asset deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting asset:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  const assetId = process.argv[3];
  
  if (!command) {
    console.log('Usage:');
    console.log('  node scripts/manage-mux-assets.js list');
    console.log('  node scripts/manage-mux-assets.js delete <asset-id>');
    process.exit(1);
  }
  
  switch (command) {
    case 'list':
      await listAssets();
      break;
    case 'delete':
      if (!assetId) {
        console.error('❌ Asset ID is required for delete command');
        process.exit(1);
      }
      await deleteAsset(assetId);
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
