// Simple test to check Mux integration
const Mux = require('@mux/mux-node');

// Test Mux credentials
const mux = new Mux({
  tokenId: '505baa46-f6dd-40b4-b8b6-ae71a9d29',
  tokenSecret: 'rUxw4QxwjefS7+7GdV7TJ7JDjJb4fzpskmPzLHrygFoyboOk4eO29+fQs8BmeGMMdah2zad1c',
});

async function testMux() {
  try {
    console.log('Testing Mux API...');
    
    // Test creating a direct upload
    const upload = await mux.video.directUploads.create({
      cors_origin: 'http://localhost:3000',
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard',
      },
    });
    
    console.log('✅ Mux direct upload created successfully!');
    console.log('Upload ID:', upload.id);
    console.log('Upload URL:', upload.url);
    
  } catch (error) {
    console.error('❌ Mux API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMux();
