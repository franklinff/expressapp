var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require("passport");
var ToDoHead = require('../models/toDotitle');
var ToDoSubtitle = require('../models/subtitleToDo');



/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

//register
router.post('/register',function(req,res,next){
    addToDB(req,res);
});

async function addToDB(req,res){
    var user =  new User({
        email : req.body.email,
        username:req.body.username,
        password: User.hashPassword(req.body.password),
        creation_dt:Date.now()
    });

    try{
        doc = await user.save();
        return res.status(201).json(doc);
    }
    catch(err){
        return res.status(501).json(err);
    } 
}

//login
router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return res.status(501).json(err); }
      if (!user) { return res.status(501).json(info); }
      req.logIn(user, function(err) {
        if (err) { return res.status(501).json(err); }
        return res.status(200).json({message:'Login successful'});
        //return res.redirect('/users/' + user.username);    
    });
    })(req, res, next);
  });

//user  
router.get('/user',isValidUser,function(req,res,next){
   // console.log(req.user);
    return res.status(200).json(req.user);
});
  
//logout
router.get('/logout',isValidUser, function(req,res,next){
    req.logout();
    return res.status(200).json({message:'Logout Success'});
});
  
function isValidUser(req,res,next){
    if(req.isAuthenticated()) next();
    else return res.status(401).json({message:'Unauthorized Request'});
}

router.post('/save_todo_title',function(req,res,next){
   // console.log(req.body);
    var head_todo =  new ToDoHead({
        userid :  req.body.user_id,
        listTitle:  req.body.title_list,
        delete:  '0',
        created_dt:Date.now(),
        updated_dt: '',
    });

    head_todo.save()
    .then(item => {
    res.json('item saved to database');
    })
    .catch(err => {
    res.status(400).send("unable to save to database");
    });

});

router.get('/retriveToDolist',function(req,res){

    ToDoHead.find({userid:req.query.userid}).sort({created_dt: -1}).exec(function(err, docs) {
        res.json(docs);  
    });

    console.log(req.query.userid);
    // var listofTODO = ToDoHead.find({userid:req.query.userid}, function(error, comments).sort( { age: -1 } ) {
    // res.json(comments);  
    // });
});

router.delete('/deleteToDo/:id', function(req, res, next) {
    //console.log(id);
    ToDoHead.findOneAndDelete(req.params.id, req.body, function (err, post) {
      if (err) return next(err);
      res.json(post);
    });
  });

 router.get('/viewHeadIndividual',function(req,res){
    console.log('I am in viewHeadIndividual');
    ToDoHead.find({_id:req.query.title_head_id}).exec(function(error, docs) {
        res.json(docs);  
    });   
 });


router.post('/addSubTitle',function(req,res,next){

    var subtitle =  new ToDoSubtitle({
        to_do_headtitleid :  req.body.headertodo_id,
        sub_title:  req.body.subtitle,
        delete_subTitle:  '0',
        created_dt:Date.now(),
        updated_dt: ''
     });
 
     subtitle.save().then(item => {
     res.json("SubTitle added");
     }).catch(err => {
     res.status(400).send("unable to save to database");
     });
 
 });

 router.get('/listSubtitles',function(req,res){
    console.log(req.query.title_head_id);
    ToDoSubtitle.find({to_do_headtitleid:req.query.title_head_id}).sort({created_dt: -1}).exec(function(err, result) {
        res.json(result);  
    });

    
    // var listofTODO = ToDoHead.find({userid:req.query.userid}, function(error, comments).sort( { age: -1 } ) {
    // res.json(comments);  
    // });
});

router.put('/subtitleChecked',function(req,res,next){
        ToDoSubtitle.updateOne( {"_id" : req.body.id},{delete_subTitle:'0'}, function (err, result) {
          if (err) return next(err);
          res.json(result);
        });
});

 

module.exports = router;