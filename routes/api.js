'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function (app) {

  app.route('/api/books')
  
    .get(function (req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').find({}, {_id: 1, title: 1, comments: 1}).toArray(function(err, result) {
          if (err) throw err;
          var adjResult = []
          result.forEach(function(book) {
            var numComments
            book.comments == undefined ? numComments = 0 : numComments = book.comments.length            
            adjResult.push({_id: book._id, title: book.title, commentcount: numComments})            
          })          
          res.json(adjResult)
          })
        })       
    })
    
    .post(function (req, res){
      var title = req.body.title;
      if (!title) {
        res.type('text').send('No title provided')
        return
      }      
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {        
        db.collection('books').findOne({titleLowercase: title.toLowerCase()}, function(err, result) {
          if (err) throw err;          
          if (result == undefined) {
            db.collection('books').insertOne({title, titleLowercase: title.toLowerCase(), comments: []}, function(err, result) {
              if (err) throw err;
              result = result.ops[0]
              res.json({_id: result._id, title: result.title})
            })
          } else {
            res.type('text').send('Title is already in library')
          }                                             
        })
      })
    })
  
    
    .delete(function(req, res) {    
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').deleteMany({}, function(err, result) {
          if (err) throw err;
          console.log('deleting all books');
          res.type('text').send('complete delete was successful')
        })
      });
    })



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid;
      try {
        bookid = ObjectId(req.params.id);
      } catch(error) {
        res.type('text').send('no book exists')
        return
      }      
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').findOne({_id: ObjectId(bookid)}, {_id: 1, title: 1, comments: 1}, function(err, result) {
          if (err) throw err;
          res.json(result)
        })
      })
    })
    
    .post(function(req, res){      
      var bookid;
      try {
        bookid = ObjectId(req.params.id);
      } catch(error) {
        res.type('text').send('no book exists')
        return
      }   
      var comment = req.body.comment;      
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').findOne({_id: ObjectId(bookid)}, function(err, result) {
          if (err) throw err;
          if (result == undefined) {
            res.type('text').send('no book exists')
          } else {            
            var comments = result.comments || [];            
            comments = [...comments, comment]            
            var updateQuery = {comments: comments}
            db.collection('books').update({_id: ObjectId(bookid)}, {$set: updateQuery}, function(err, result) {
              if (err) throw err;
              res.redirect('/api/books/' + bookid)
            })
          }
        })
      })
    })
    
    .delete(function(req, res){
      var bookid;
      try {
        bookid = ObjectId(req.params.id);
      } catch(error) {
        res.type('text').send('no book exists')
        return
      }   
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        db.collection('books').findOne({_id: ObjectId(bookid)}, function(err, result) {
          if (err) throw err;
          if (result == undefined) {
            res.type('text').send('no book exists')
          } else {
            db.collection('books').deleteOne({_id: ObjectId(bookid)}, function(err, result) {
              if (err) throw err;
              res.type('text').send('delete successful')
            })
          }
        })
      })
    })
  
};
