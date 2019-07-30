var mongoose = require('mongoose');
var passport = require("passport");
var bcrypt = require('bcrypt');
//var uniqueValidator = require('mongoose-unique-validator');
var validate = require('mongoose-validator');
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

//Schema for users collection
var UserSchema = new mongoose.Schema({
    email : {type:String,unique: true,required:true},
    username: {type:String, required:true },
    password:{type:String, required:true},
    creation_dt:{type:Date, required:true}
  },{ versionKey: '' }, { collection: 'users' });

  // UserSchema.plugin(uniqueValidator);

  UserSchema.statics.hashPassword = function hashPassword(password){
    return bcrypt.hashSync(password,10);
  }

  //check if password matches in the database while login
  UserSchema.methods.isValid = function(hashedpassword){
    return  bcrypt.compareSync(hashedpassword, this.password);
  }

module.exports = mongoose.model('User',UserSchema);