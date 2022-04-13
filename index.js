const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

const port = process.env.PORT || 3000

// Set the view engine for the express app
app.set("view engine", "jade")

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-//form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    console.log('contains _method')
    var method = req.body._method
    delete req.body._method
    console.log(method)
    return method
  }
}))

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
   res.setHeader("Access-Control-Allow-Credentials", "true");
   res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
   res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Origin,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization");
 next();
});

// Database
const Pool = require('pg').Pool

var connectionParams = null;
if (process.env.DATABASE_URL != null) {
    connectionParams = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
} else {
    connectionParams = {
        user: 'api_user',
        host: 'localhost',
        database: 'api',
        password: 'password',
        port: 5432
    }
}
const pool = new Pool(connectionParams)

// [READ] List of team members 
app.get('/', (req, res) => {

  console.log('Accept: ' + req.get('Accept'))

  pool.query('SELECT VERSION()', (err, version_results) => {

    if (err) {

      return console.error('Error executing query', err.stack)
    }

    console.log(err, version_results.rows)

    pool.query('SELECT * FROM team_members', (err, team_members_results) => {
      console.log(err, team_members_results)

      res.render('index', {
                            teamNumber: 1,
                            databaseVersion: version_results.rows[0].version, 
                            teamMembers: team_members_results.rows 
                          })
      
      console.log('Content-Type: ' + res.get('Content-Type'))
    })  
  })
})

app.get('/team_member_form', (req, res) => {

  res.render('create')

})

// [CREATE] team_members
app.post('/team_members', (req, res) => {
  
    console.log(req.path)

    pool.query(`INSERT INTO team_members (first_name, last_name) VALUES ('${req.body.first_name}', '${req.body.last_name}')`, (err, result) => {
        
        console.log(err, result)
        
        res.redirect('/')
    })
})

// [UPDATE] team_members
app.get('/team_members/:id/form', (req, res) => {

  const id = req.params["id"]

  pool.query(`SELECT * FROM team_members WHERE id = ${id}`, (err, result) => {

    if (result.rows.length == 0) {
      res.status(404)
      return
    }

    res.render('update', {

      teamMember: result.rows[0]
    })
  })

})

app.put('/team_members/:id', (req, res) => {

  console.log('patch')
  console.log(req.path)

  pool.query(`UPDATE team_members SET first_name='${req.body.first_name}', last_name='${req.body.last_name}' WHERE id = ${req.params["id"]}`, (err, result) => {
      
      console.log(err, result)
      
      res.redirect('/')
  })

})
// [DELETE] team_members
app.delete('/team_members/:id', (req, res) => {

  const id = req.params["id"]

  console.log(id)

  pool.query(`DELETE FROM team_members WHERE id = ${id}`, (err, result) => {
    console.log(err)
    
    res.redirect('/')
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
