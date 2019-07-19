var mongoose = require('mongoose');

//Schema for todoSubtitle
var SubTitleToDo = new mongoose.Schema({
    to_do_headtitleid : {type:String, require:true},
    sub_title: {type:String, require:true},
    delete_subTitle:  {type:String, require:true},
    user_id: {type:String, require:true},
    created_dt:{type:Date, require:true},
    updated_dt:{type:Date, require:true}  
  },{ versionKey: '' }, { collection: 'todoSubtitle' });

module.exports = mongoose.model('ToDoSubtitle',SubTitleToDo);