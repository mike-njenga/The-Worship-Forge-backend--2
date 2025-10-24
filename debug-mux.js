// Debug Mux client structure
const Mux = require('@mux/mux-node');

// console.log('Mux SDK version:', require('@mux/mux-node/package.json').version);

const mux = new Mux({
  tokenId: '505baa46-f6dd-40b4-b8b6-ae71a91e0d29',
  tokenSecret: 'rUxw4QxwjefS7+7GdV7TJ7JDjJb4fzpskm3BPzLHrygFoyboOk4eO29+fQs8BmeGMMdah2zad1c',
});

console.log('Mux client created');
console.log('Available properties on mux:', Object.keys(mux));
console.log('mux.video:', mux.video);
if (mux.video) {
  console.log('Available properties on mux.video:', Object.keys(mux.video));
  if (mux.video.uploads) {
    console.log('mux.video.uploads exists');
    console.log('Available methods on mux.video.uploads:', Object.keys(mux.video.uploads));
    console.log('mux.video.uploads prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(mux.video.uploads)));
  } else {
    console.log('mux.video.uploads does not exist');
  }
} else {
  console.log('mux.video does not exist');
}
