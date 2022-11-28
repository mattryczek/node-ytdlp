const express = require('express')
const path = require('path')
const app = express()
const port = 3000

// https://nodejs.org/api/child_process.html#child_process_options_stdio
let spawn = require('child_process').spawn

// https://stackoverflow.com/questions/32679505/node-and-express-send-json-formatted
app.set('json spaces', 2)

app.use(express.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api', (req, res) => {
  console.log(`Got URL: ${req.body.url}`)
  let filepath, ytdlp

  if (req.body.filename) {
    ytdlp = spawn('yt-dlp', ['--no-simulate --print after_move:filepath -o ' + req.body.filename + '.%(ext)s', req.body.opts, req.body.url], { cwd: 'downloads', windowsVerbatimArguments: true })
  } else {
    ytdlp = spawn('yt-dlp', ['--no-simulate --print after_move:filepath -o %(title)s.%(ext)s', req.body.opts, req.body.url], { cwd: 'downloads', windowsVerbatimArguments: true })
  }

  ytdlp.stdout.on('data', (data) => {
    filepath = data.toString().replace(/\r?\n|\r/g, "")
    console.log(filepath)
  });

  ytdlp.stderr.on('data', (data) => {
    res.header("Content-Type", 'application/json');
    res.json({ status: 'error', url: req.body.url, opts: req.body.opts, filename: req.body.filename, debug: data.toString() })
  });

  ytdlp.on('exit', function (code) {
    if (code === 0) {
      // Need to test if can keep API like reponse and pass along DL link too
      // res.json({ status: 'success', url: req.body.url, opts: req.body.opts, filename: req.body.filename, filepath: filepath})
      res.download(filepath)
    }
  });
})

app.get('/downloads/*', function (req, res) {
  res.sendFile(path.join(__dirname, '../' + req.url));
});

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, req.url));
});

app.listen(port, () => {
  console.log(`App live on http://localhost:${port}`)
})