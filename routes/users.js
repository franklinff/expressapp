var express = require('express');
var router = express.Router();
var User = require('../models/user');
var ToDoHead = require('../models/toDotitle');
var ToDoSubtitle = require('../models/subtitleToDo');
var passport = require("passport");
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
        return res.status(201).json(err.message);
      //  throw err;// return res.status(501).json(err);//  console.log('Error:', err.message)
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
        return res.status(200).json({jwttoken:token});
        //return res.status(200).json({message:'Login successful'});//return res.redirect('/users/' + user.username);         
    });

    })(req, res, next);
});

//user  
// router.get('/user',isValidUser,function(req,res,next){
//     console.log(req);
//     return res.status(200).json(req.user);
// });
  
//logout
router.get('/logout', function(req,res,next){
    req.logout();
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
       // res.status(200).clearCookie('connect.sid', {path: '/'}).json({status: "Success"});
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

    var total_subtiltes_count = 0;
    var checked_subtitles_count = 0;
    var total_completed_work = 0;
    var decoded = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');

    var head_todo =  new ToDoHead({
        userid :  decoded.userID,
        listTitle:  req.body.title_list,
        delete:  '0',
        created_dt:Date.now(),
        updated_dt: '',
    });

    head_todo.save().then(item => {

        ToDoSubtitle.find({user_id:decoded.userID}).exec(function(err, result) {
            total_subtiltes_count = result.length;            
        ToDoSubtitle.find({user_id:decoded.userID,delete_subTitle:'1' }).exec(function(err, result) {
                checked_subtitles_count = result.length;                    
                total_completed_work = (checked_subtitles_count/total_subtiltes_count);
    
                if (err) return next(err);
                ToDoHead.find({userid:decoded.userID}).sort({created_dt: -1}).exec(function(err, docs) {
                    if(isNaN(total_completed_work)){
                        res.json({
                            total_completed_work:(0.00).toFixed(2),
                            headertodo:docs
                        });
                    }else{
                        res.json({
                            total_completed_work:(total_completed_work*100).toFixed(2),
                            headertodo:docs
                        });
                    }
                });
            });
        });
       // res.json('item saved to database');
    }).catch(err => {
        res.status(400).send("unable to save to database");
    });
});

//List the ToDo heads as per loggedin user
router.get('/retriveToDolist',function(req,res){
    var decoded = jwt.verify(req.headers.userid,'todo-app-super-shared-secret');

    var total_subtiltes_count = 0;
    var checked_subtitles_count = 0;
    var total_completed_work = 0;

    ToDoHead.find({userid:decoded.userID}).sort({created_dt: -1}).exec(function(err, docs) {

    ToDoSubtitle.find({user_id:decoded.userID}).exec(function(err, result) {
        total_subtiltes_count = result.length;            
    ToDoSubtitle.find({user_id:decoded.userID,delete_subTitle:'1' }).exec(function(err, result) {
            checked_subtitles_count = result.length;    
            // console.log(checked_subtitles_count);
            total_completed_work = (checked_subtitles_count/total_subtiltes_count);

            if(isNaN(total_completed_work)){
                res.json({
                    listData:  docs,
                    work_done: ((0.0).toFixed(2))  
                  });
            }else{              
                res.json({
                    listData:  docs,
                    work_done: (total_completed_work*100).toFixed(2)   
                  });
            }
        });
    });
    });
});


router.get('/viewIndividual', function(req, res){  
  var data =  JSON.parse(req.headers.title_head_id);

  jwt.verify(data.user_id,'todo-app-super-shared-secret', function (err, payload) { 
    if (payload) {
        ToDoHead.find({_id:data.subtitle_id},function(errorOne, dataOne){
            if(errorOne)
               throw new Error(errorOne);
               ToDoSubtitle.find({to_do_headtitleid:data.subtitle_id}, function(errorTwo, dataTwo){
               if(errorTwo)
                   throw new Error(errorTwo);    
               res.json({
                   headertodo: dataOne,
                   listofsubtitles: dataTwo
               });
            }).sort({delete_subTitle: 0});
        });
    } else {
        console.log(err.message);
        res.json({ error:err.message }); 
    }
  })
});


//List subtitles
router.get('/listSubtitles',function(req,res){
    
    var user_list = JSON.parse(req.headers.userid);
    var decoded = jwt.verify(user_list.token,'todo-app-super-shared-secret');
     ToDoSubtitle.find({to_do_headtitleid:user_list.head_id,delete_subTitle:'1' }).sort({created_dt: -1}).exec(function(err, result) {
        
        ToDoSubtitle.find({to_do_headtitleid:user_list.head_id}, function(errorTwo, dataTwo){
            if(errorTwo)
                throw new Error(errorTwo);

            res.json({
                headertodo: result,
                listofsubtitles: dataTwo
            });  
     });
    });
 });


//Add subtitle
router.post('/addSubTitle',function(req,res,next){ //console.log(req.body);

    var loggedindata = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');
    var subtitle =  new ToDoSubtitle({
        to_do_headtitleid :  req.body.headertodo_id,
        sub_title:  req.body.subtitle,
        delete_subTitle:  '0',
        user_id: loggedindata.userID,
        created_dt:Date.now(),
        updated_dt: ''
     });
 
    subtitle.save().then(item => {

    ToDoSubtitle.find({user_id:loggedindata.userID}).exec(function(err, result) {
        total_subtiltes_count = result.length;            
    ToDoSubtitle.find({user_id:loggedindata.userID,delete_subTitle:'1' }).exec(function(err, result) {
            checked_subtitles_count = result.length;    
            // console.log(checked_subtitles_count);
            total_completed_work = (checked_subtitles_count/total_subtiltes_count);
            if (err) return next(err);
            ToDoSubtitle.find({to_do_headtitleid: req.body.headertodo_id}, function(errorTwo, dataTwo){
                if(errorTwo)
                    throw new Error(errorTwo);    
                res.json({
                    total_completed_work: (total_completed_work*100).toFixed(2),
                    listofsubtitles: dataTwo
                });
             }).sort({delete_subTitle: 0});
        });
    });

    }).catch(err => {
     res.status(400).send("unable to save to database");
    });
 
 });



//ToDo subtitle task done
router.post('/subtitleChecked',function(req,res,next){  
   
    var total_subtiltes_count = 0;
    var checked_subtitles_count = 0;
    var total_completed_work = 0;
    var loggedin_user = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');

    ToDoSubtitle.updateOne( {"_id" : req.body.subtitle_id},{delete_subTitle:'1',updated_dt:Date.now()}, function (err, result) {

        ToDoSubtitle.find({user_id:loggedin_user.userID}).exec(function(err, result) {
            total_subtiltes_count = result.length;            
        ToDoSubtitle.find({user_id:loggedin_user.userID,delete_subTitle:'1' }).exec(function(err, result) {
            checked_subtitles_count = result.length;    
                // console.log(checked_subtitles_count);    
                total_completed_work = (checked_subtitles_count/total_subtiltes_count);
                if (err) return next(err);
                ToDoSubtitle.find({to_do_headtitleid:req.body.to_do_headtitleid}, function(errorTwo, dataTwo){
                    if(errorTwo)
                        throw new Error(errorTwo);
                    res.json({
                        total_completed_work: (total_completed_work*100).toFixed(2),
                        listofsubtitles: dataTwo
                    });
                    //res.json((total_completed_work*100).toFixed(2));
                 }).sort({delete_subTitle: 0});
            
            });
        }); 
    });
});

//Update profile
router.post('/updateProfile',function(req,res,next){     
      jwt.verify(req.body.user_id,'todo-app-super-shared-secret', function (err, payload) {
        if(req.body.newPassword == null){
            User.findOneAndUpdate( { "_id": payload.userID }, { "$set": { "username": req.body.username, "email": req.body.email } },  { runValidators: true }, function(err, doc) {       
                if (err) {
                     res.json({ error:err }); 
                }
                if (doc) {
                    res.json({ result:doc }); 
                }           
            }); 
        }
        if(req.body.newPassword != null){
            User.findOneAndUpdate( { "_id": payload.userID }, { "$set": { "username": req.body.username, "email": req.body.email, "password":User.hashPassword(req.body.newPassword)  } },{ runValidators: true }, function(err, doc) {
            
                if (err) {
                    res.json({ error:err }); 
                }
                if (doc) {
                    res.json({ result:doc }); 
                }           
            });  
        }
      });     
});


// //Update profile
// router.post('/updateProfile',function(req,res,next){     
//       //  console.log(req.body);
//         var loggedin_user = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');
        
//         if(req.body.existingpassword !== null){
//         User.find({_id:loggedin_user.userID}, 'password', function (err, docs) {
//             bcrypt.compare(req.body.existingpassword, docs[0].password).then(result => {
//                 // console.log(result,'12');
//                 if(result == true){
                    
//                     if(req.body.newPassword == null){
//                         User.findOneAndUpdate(
//                             { "_id": loggedin_user.userID },
//                             { "$set": { "email": req.body.email,"username": req.body.username,"password": User.hashPassword(req.body.existingpassword) } }
//                         ).then((data)=>{
//                                 if(data){
//                                     //res.status(200).json(data);
//                                     res.status(200).json(result);
//                                 }
//                         }).catch((err)=>{
//                             res.json('duplicate_email');
//                         })
//                     }else{
//                         User.findOneAndUpdate(
//                             { "_id": loggedin_user.userID },
//                             { "$set": { "email": req.body.email,"username": req.body.username,"password": User.hashPassword(req.body.newPassword) } }
//                         ).then((data)=>{
//                                 if(data){
//                                     //res.status(200).json(data);
//                                     res.status(200).json(result);
//                                 }
//                         }).catch((err)=>{
//                             res.json('duplicate_email');
//                         })
//                     }
//                 }else{
//                 //  res.status(200).json(result);
//                     res.status(200).json("wrong password");
//                 }
//             });
//         });
//         }else{
//             res.status(200).json('false');
//         }
// });
router.post('/uncheckedSubtitle',function(req,res,next){  

    var total_subtiltes_count = 0;
    var checked_subtitles_count = 0;
    var total_completed_work = 0;
    var loggedin_user = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');
   // console.log(req.body);

        ToDoSubtitle.updateOne( {"_id" : req.body.subtitle_id},{delete_subTitle:'0'}, function (err, result) {         
            ToDoSubtitle.find({user_id:loggedin_user.userID}).exec(function(err, result) {
                total_subtiltes_count = result.length;            
            ToDoSubtitle.find({user_id:loggedin_user.userID,delete_subTitle:'1' }).exec(function(err, result) {
                    checked_subtitles_count = result.length;        
                    total_completed_work = (checked_subtitles_count/total_subtiltes_count);
                    if (err) return next(err);

                    ToDoSubtitle.find({to_do_headtitleid:req.body.to_do_headtitleid}, function(errorTwo, dataTwo){
                        if(errorTwo)
                            throw new Error(errorTwo);
                        res.json({
                            total_completed_work: (total_completed_work*100).toFixed(2),
                            listofsubtitles: dataTwo
                        });
                        //res.json((total_completed_work*100).toFixed(2));
                     }).sort({delete_subTitle: 0});

                   // res.json((total_completed_work*100).toFixed(2));
                });
            });           
        });
});



//Update Todo head
router.post('/updateTitle',function(req,res,next){
    var loggedin_user = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');
    ToDoHead.updateOne( {"_id" : req.body._id}, { listTitle:req.body.title_list}  , function (err, result) {
        if (err) return next(err);
       // res.json(result);
        ToDoHead.find({_id:req.body._id},function(errorOne, dataOne){
            if(errorOne)
               throw new Error(errorOne);
               ToDoSubtitle.find({to_do_headtitleid:req.body._id}, function(errorTwo, dataTwo){
               if(errorTwo)
                throw new Error(errorTwo);
                ToDoHead.find({userid:loggedin_user.userID},function(errorThree, dataThree){
                    res.json({
                        headertodo: dataOne,
                        listofsubtitles: dataTwo,
                        listData: dataThree,
                        edit_result:result  
                    });
                });

            }).sort({created_dt: 0});
        });
      });      
});

//Delete todo head
router.post('/deleteTitletodo',function(req,res,next){  
      ToDoHead.deleteMany({ _id: req.body._id }, function(err,result) {
        //ToDoSubtitle.find({ to_do_headtitleid:req.body._id }).remove().exec();
        ToDoSubtitle.deleteMany({ to_do_headtitleid:req.body._id }, function(error,solution){});
        if (!err) {
            var total_subtiltes_count = 0;
            var checked_subtitles_count = 0;
            var total_completed_work = 0;
            var loggedin_user = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');

            ToDoSubtitle.find({user_id:loggedin_user.userID}).exec(function(err, result) {
                total_subtiltes_count = result.length;          
                ToDoSubtitle.find({user_id:loggedin_user.userID,delete_subTitle:'1' }).exec(function(err, result) {
                    checked_subtitles_count = result.length; 
                    total_completed_work = (checked_subtitles_count/total_subtiltes_count);
                    if (err) return next(err);

                    ToDoHead.find({userid:loggedin_user.userID}).sort({created_dt: -1}).exec(function(err, docs) {

                        if(isNaN(total_completed_work)){
                            res.json(  {
                                total_completed_work:((0.0).toFixed(2)),  
                                list_of_title_head : docs
                            });

                        }else{
                            res.json({
                                total_completed_work:(total_completed_work*100).toFixed(2),
                                list_of_title_head : docs  
                            });
                        }

                    });

                });
                
            });          
        }
        else {
            res.json(err);    
        }
    });
});

//Delete todo subtitle
router.post('/PermanentDeleteSubtitle', function(req,res,next) { // console.log(req.body);
    var total_subtiltes_count = 0;
    var checked_subtitles_count = 0;
    var total_completed_work = 0;
    var loggedin_user = jwt.verify(req.body.user_id,'todo-app-super-shared-secret');

        ToDoSubtitle.deleteMany({ _id:req.body.subtitle_id }, function(err,result) {
            ToDoSubtitle.find({user_id:loggedin_user.userID}).exec(function(err, result) {
                total_subtiltes_count = result.length;          
                ToDoSubtitle.find({user_id:loggedin_user.userID,delete_subTitle:'1' }).exec(function(err, result) {
                    checked_subtitles_count = result.length; 
                    total_completed_work = (checked_subtitles_count/total_subtiltes_count);

                    if (err) return next(err);
                    if(isNaN(total_completed_work)){

                        ToDoHead.find({_id:req.body.head_todo_id},function(errorOne, dataOne){
                            if(errorOne)
                               throw new Error(errorOne);
                               ToDoSubtitle.find({to_do_headtitleid:req.body.head_todo_id}, function(errorTwo, dataTwo){
                               if(errorTwo)
                                throw new Error(errorTwo);
                    
                                res.json({
                                   headertodo: dataOne,
                                   listofsubtitles: dataTwo,
                                   total_completed_work : (0.0).toFixed(2)
                                });
                            }).sort({delete_subTitle: 0});
                        });
//                        res.json({total_completed_work : 0.0} );
                    }else{

                        ToDoHead.find({_id:req.body.head_todo_id},function(errorOne, dataOne){
                            if(errorOne)
                               throw new Error(errorOne);
                               ToDoSubtitle.find({to_do_headtitleid:req.body.head_todo_id}, function(errorTwo, dataTwo){
                               if(errorTwo)
                                   throw new Error(errorTwo);
                    
                               res.json({
                                   headertodo: dataOne,
                                   listofsubtitles: dataTwo,
                                   total_completed_work : (total_completed_work*100).toFixed(2)
                               });
                            }).sort({delete_subTitle: 0});
                        });

                      //  res.json( {total_completed_work : (total_completed_work*100).toFixed(2) }  );
                    }
                });
                
            });
            // res.json(result);  
        });
});


 //Edit subtilte   
router.post('/subtitleUpdate',function(req,res,next){
        ToDoSubtitle.updateOne( {"_id" : req.body.subtitle_id}, { sub_title:req.body.subtitle_edit }  , function (err, result) {
            if (err) return next(err);
         //   res.json(result);

            ToDoHead.find({_id:req.body.head_todo_id},function(errorOne, dataOne){
                if(errorOne)
                   throw new Error(errorOne);
                   ToDoSubtitle.find({to_do_headtitleid:req.body.head_todo_id}, function(errorTwo, dataTwo){
                   if(errorTwo)
                       throw new Error(errorTwo);
                   res.json({
                       headertodo: dataOne,
                       listofsubtitles: dataTwo,
                       edit_result:result  
                   });
                }).sort({delete_subTitle: 0});
            });

          });      
});

//getuser_info 
router.get('/getuser_info',function(req,res,next){
    var jwt_payload = jwt.verify(req.headers.token,'todo-app-super-shared-secret');
    User.findOne({_id: jwt_payload.userID}, function(err, user) {
        if (err) {
            return res.status(200).json(err);
        }
        if (user) {
            return res.status(200).json(user);
        }
    });
});  

module.exports = router;