var mongoose = require('mongoose');

var TodoHeadTitle = new mongoose.Schema({
    userid : {type:String, require:true},
    listTitle: {type:String, require:true},
    delete:  {type:String, require:true},
    created_dt:{type:Date, require:true},
    updated_dt:{type:Date, require:true}
    
  },{ versionKey: '' }, { collection: 'todo_list' });

module.exports = mongoose.model('ToDoHead',TodoHeadTitle);