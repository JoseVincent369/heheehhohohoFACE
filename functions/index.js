const functions = require('firebase-functions');

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
