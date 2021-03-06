const express = require('express');
const app = express();
const multer = require('multer');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/image');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

var db;
MongoClient.connect(process.env.DB_URL, function (error, client) {
  if (error) {
    return console.log(error);
  }
  db = client.db('imagecontainer');
  app.listen(process.env.PORT, function () {
    console.log('SERVER IS RUNNING ON PORT 8080');
  });
});

app.get('/', function (_, res) {
  db.collection('url')
    .find()
    .toArray(function (_, result) {
      // console.log(result);
      res.render('index.ejs', { imageFile: result });
    });
});

app.get('/upload', function (_, res) {
  res.render('upload.ejs');
});

app.post('/upload', upload.single('photo'), function (req, res) {
  db.collection('counter').findOne({ name: 'idMaker' }, function (_, result) {
    let newId = result.idNumber;
    db.collection('url').insertOne(
      { _id: newId + 1, url: req.file.originalname },
      function () {
        console.log('IMAGE UPLOAD SUCCESS');
        db.collection('counter').updateOne(
          { name: 'idMaker' },
          { $inc: { idNumber: 1 } },
          function (error, _) {
            if (error) {
              return console.log(error);
            }
          }
        );
        res.redirect('/');
      }
    );
  });
});

app.get('/image/:name', function (req, res) {
  res.sendFile(__dirname + '/public/image/' + req.params.name);
});

app.delete('/delete', function (req, res) {
  req.body._id = parseInt(req.body._id);
  db.collection('url').deleteOne(req.body, function () {
    console.log('DELETE SUCCESS');
    res.redirect('/');
  });
});

app.get('/detail/:id', function (req, res) {
  db.collection('url').findOne({ _id: parseInt(req.params.id) }, function (
    error,
    result
  ) {
    res.render('detail.ejs', { imageFile: result });
  });
});
