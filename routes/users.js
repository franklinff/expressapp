var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require("passport");
var ToDoHead = require('../models/toDotitle');
var ToDoSubtitle = require('../models/subtitleToDo');
var bcrypt = require('bcrypt');
var app = express();
var jwt = require('jsonwebtoken');
var jwtexp = require('express-jwt');

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

        var token = jwt.sign({userID: user._id}, 'todo-app-super-shared-secret', {expiresIn: '2h'});       
        console.log(token);
        return res.status(200).json({jwttoken:token});

       // return res.status(200).json({message:'Login successful'});
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
   // db.sessions.remove({ 'session.users': VALUE });
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.status(200).clearCookie('connect.sid', {path: '/'}).json({status: "Success"});
        res.redirect('/');
    });
    return res.status(200).json({message:'Logout Success'});
});
  
//Check if credentials match
function isValidUser(req,res,next){
    if(req.isAuthenticated()) next();
    else return res.status(401).json({message:'Unauthorized Request'});
}

//save Title head
router.post('/save_todo_title',function(req,res,next){
   // console.log(req.body);
    var head_todo =  new ToDoHead({
        userid :  req.body.user_id,
        listTitle:  req.body.title_list,
        delete:  '0',
        created_dt:Date.now(),
        updated_dt: '',
    });

    head_todo.save().then(item => {
        res.json('item saved to database');
    }).catch(err => {
        res.status(400).send("unable to save to database");
    });
});

//List the ToDo heads as per loggedin user
router.get('/retriveToDolist',function(req,res){
    console.log(req.headers.userid);
    var decoded = jwt.verify(req.headers.userid,'todo-app-super-shared-secret');
    console.log(decoded.userID);
    ToDoHead.find({userid:decoded.userID}).sort({created_dt: -1}).exec(function(err, docs) {
        res.json(docs);  
    });
});


//Get toDO head  
router.get('/viewHeadIndividual',function(req,res){
   // console.log('I am in viewHeadIndividual');
    ToDoHead.find({_id:req.query.title_head_id}).exec(function(error, docs) {
        res.json(docs);  
    });   
});

//Add subtitle
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

//List subtitles
router.get('/listSubtitles',function(req,res){
   // console.log(req.query.title_head_id);
    ToDoSubtitle.find({to_do_headtitleid:req.query.title_head_id,delete_subTitle:'0' }).sort({created_dt: -1}).exec(function(err, result) {
        res.json(result);  
    });

});

//ToDo subtitle task done
router.put('/subtitleChecked',function(req,res,next){
    ToDoSubtitle.updateOne( {"_id" : req.body.id},{delete_subTitle:'1',updated_dt:Date.now()}, function (err, result) {
          if (err) return next(err);
          res.json(result);
        });
});

//Retrive deleted subtitles
router.get('/deletdSubtitles',function(req,res){
        // console.log(req.query.title_head_id);
         ToDoSubtitle.find({to_do_headtitleid:req.query.title_head_id,delete_subTitle:'1' }).sort({created_dt: -1}).exec(function(err, result) {
             res.json(result);  
         });     
});

//Update profile
router.post('/updateProfile',function(req,res,next){     
        console.log(req.body);
        if(req.body.existingpassword !== null && req.body.newPassword !== null){
        User.find({_id:req.body.user_id}, 'password', function (err, docs) {
            bcrypt.compare(req.body.existingpassword, docs[0].password).then(result => {
                // console.log(result,'12');
                if(result == true){
                    // console.log("ia m in true");
                    User.findOneAndUpdate(
                        { "_id": req.body.user_id },
                        { "$set": { "email": req.body.email,"username": req.body.username,"password": User.hashPassword(req.body.newPassword) } }
                     ).then((data)=>{
                            if(data){
                                //res.status(200).json(data);
                                res.status(200).json(result);
                            }
                     }).catch((err)=>{
                        res.status(400).json(err);
                     })
                }else{
                //  res.status(200).json(result);
                    res.status(200).json("wrong password");
                }
            });
        });
        }else{
            res.status(200).json('false');
        }
});

//Uncheck the subtitle    
router.put('/uncheckedSubtitle',function(req,res,next){
        ToDoSubtitle.updateOne( {"_id" : req.body.id},{delete_subTitle:'0'}, function (err, result) {
              if (err) return next(err);
              res.json(result);
            });
});

//Update Todo head
router.post('/updateTitle',function(req,res,next){
    console.log(req.body._id);
    console.log(req.body.title_list);
    ToDoHead.updateOne( {"_id" : req.body._id}, { listTitle:req.body.title_list}  , function (err, result) {
        if (err) return next(err);
        res.json(result);
      });      
});

//Delete todo head
router.post('/deleteTitletodo',function(req,res,next){
     console.log(req.body._id);
      ToDoHead.remove({ _id: req.body._id }, function(err,result) {
        if (!err) {
            res.json(result);     
        }
        else {
            res.json(err);    
        }
    });
});

//Delete todo subtitle
router.post('/PermanentDeleteSubtitle', function(req,res,next) {
    console.log(req.body._id);
    ToDoSubtitle.find({ _id:req.body._id }).remove().exec(
        function(err, result) {
            res.json(result);  
        }); 
    });

 //Edit subtilte   
router.post('/subtitleUpdate',function(req,res,next){
        console.log("I am in updateSubtitle");    
        ToDoSubtitle.updateOne( {"_id" : req.body.subtitle_id}, { sub_title:req.body.subtitle_edit }  , function (err, result) {
            if (err) return next(err);
            res.json(result);
          });      
});

//
router.delete('/deleteToDo/:id', function(req, res, next) {
    console.log(id);console.log(id);console.log(id);console.log(id);console.log(id);
    // ToDoHead.findOneAndDelete(req.params.id, req.body, function (err, post) {
    //   if (err) return next(err);
    //   res.json(post);
    // });
  });    


module.exports = router;