var mongoose = require('mongoose');

var SubTitleToDo = new mongoose.Schema({
    to_do_headtitleid : {type:String, require:true},
    sub_title: {type:String, require:true},
    delete_subTitle:  {type:String, require:true},
    created_dt:{type:Date, require:true},
    updated_dt:{type:Date, require:true}
    
  },{ versionKey: '' }, { collection: 'todoSubtitle' });

module.exports = mongoose.model('ToDoSubtitle',SubTitleToDo);