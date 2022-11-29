require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const validating = require('valid-url')
const mongoose = require('mongoose')
const idGenerator = require('generate-unique-id');
const {check,} = require('express-validator')


// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static(`${process.cwd()}/public`));

//database connection
mongoose.connect(process.env.MONGODB_URL)

//database schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
})

//database model
const urlModel = mongoose.model('URL', urlSchema)

//id Generator
const generateId = idGenerator({
  length:  1,
  useLetters: false
});

//assignable id
let id = generateId


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// saving url object 
app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url
  //url formate validator 
  if (validating.isUri(url) === undefined) {
    res.json({ error: 'invalid url' })
  } else {
    // preventing repeated url
    let urlExistance = await urlModel.findOne({ original_url: url })
    if (urlExistance) {
      res.json({original_url: urlExistance.original_url, short_url: urlExistance.short_url})
    } else {
      // preventing repeated id
      let idExistance = await urlModel.findOne({ short_url: id })
      if (idExistance) {
      id = parseInt(id)
        id += Math.floor(Math.random() * 10)
      }
      //saving the url object
    let newUrl = new urlModel({ original_url: url, short_url: id})
    newUrl.save()
    res.json({ original_url: url, short_url: id })
  }
  }
})

//redirecting to url by id
app.get('/api/shorturl/:id',  (req, res) => {
  const id =  req.params.id
  urlModel.findOne({ short_url: id }, (err, data) => {
  if (err) { res.json({ error: 'something went wrong' }) }
  else {
    res.redirect(data.original_url)
    }
  })
  
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
