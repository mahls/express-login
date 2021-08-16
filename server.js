const express = require('express');
const mysql = require('mysql');
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser')
const ejs = require('ejs');
const app = express();
const debug = require('debug')('MJ_login');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

//Definition 
let mysqloptions = {
    host: "localhost",
    user: "",
    password: "",
    database: ""
};

//Connection
let db = mysql.createConnection(mysqloptions);
db.connect(function(err) {
  if(err) throw err;
  console.log("Connected!");
});
let sessionStore = new MySQLStore({}/* options */, db);

sessionStore.defaultOptions.schema.tableName = 'mysessiontbl';

app.use(session({
    secret: 'topsecret',
    resave: false,
    saveUnitialized: false,
            
}));

app.use(function(req, res, next){
    console.log('Authentication is set to: ' + req.session.isAuth +' and the session id is: '+ req.session.id);
    if (req.session.isAuth == true) {
        console.log("userdata:" + req.session.userdata.firstname);
    }
    next();
    
}); 

//Routes
app.get('/home',  (req, res)=>{
    console.log(req.session);
    res.render('home.ejs');
})

app.get('/admin', (req, res)=>{
    if(req.session.isAuth == true){

        res.render('admin.ejs', {'firstname': req.session.userdata.firstname});

    } else {
        res.render('home.ejs')  
    }
})

app.post('/home', (req,res)=>{
    console.log(req.body);
    // res.redirect('/home')
})

app.post('/register', (req,res)=>{

    let f = req.body.firstname;
    let s = req.body.surname;
    let e = req.body.email;
    let p = req.body.password;
    let sqlcheckemail = `select count(*) as emailcount from users where email = '${e}';`;

    let query =  db.query(sqlcheckemail,(err,result)=>{

        if(err) throw err;

        console.log(result[0].emailcount);

        if(result[0].emailcount == 0){

            let sql =  `insert into users (firstname, surname, email, password) values ('${f}', '${s}', '${e}', '${p}'); `;        
            query = db.query(sql,(err, result)=>{

                if(err) throw err;
                console.log(req.body);
                res.redirect('/home')

            }); 

        } else {

            res.render('home.ejs', {'errormsg': 'User already exists.'});
        }
    });
})

app.post('/login', (req,res)=>{

    let e = req.body.email;
    let p = req.body.password;
    let sqlgetuserbyemail = `select * from users where email = '${e}';`;

    let query =  db.query(sqlgetuserbyemail,(err,result)=>{

        if(err) throw err;

        if(result.length > 0){

            var passwordfromdb = result[0].password;
            if(passwordfromdb == p){
                req.session.isAuth = true;
                req.session.userdata = result[0];
                res.redirect('/admin');
                
            } else {

                res.render('home.ejs', {'errormsg': 'Password incorrect.'});
            }

        } else { 

            res.render('home.ejs', {'errormsg': 'Username incorrect.'});
        }

    });

});

app.get('/logout', (req, res)=>{
    req.session.isAuth = false;
   res.redirect('/home');
})

app.listen(3000);
