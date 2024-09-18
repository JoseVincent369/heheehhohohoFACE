const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const fetch = require('node-fetch'); // Or use built-in fetch for Node.js v18+

exports.fetchImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const imageUrl = req.query.url;
    
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.buffer();
      res.set('Content-Type', response.headers.get('content-type'));
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error fetching image.');
    }
  });
});
