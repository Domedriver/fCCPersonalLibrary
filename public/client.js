var newTitle = document.getElementById('new-title-form');
var newTitleBox = document.getElementById('new-title-box');
var titles = document.getElementById('current-titles')
var detailsBox = document.getElementById('book-details')
var bookTitle = document.getElementById('book-title')
var bookId = document.getElementById('book-id')
var bookComments = document.getElementById('book-comments')
var bookButtons = document.getElementById('book-buttons')
var newComment = document.getElementById('new-comment')
var deleteLibrary = document.getElementById('delete-library')
var deleteCheck = document.getElementById('delete-check');


function sendRequest(method, url, request={}, callback) {
  var req = new XMLHttpRequest()
  req.open(method, url, true)
  req.setRequestHeader("Content-Type", "application/json")
  req.send(JSON.stringify(request))
  req.onload = function() {
    callback(req)
  }
}

function loadLibrary() {
  while (titles.firstChild) {
    titles.removeChild(titles.firstChild)
  }
  sendRequest('GET', '/api/books', {}, function(req) {
    var library = JSON.parse(req.response);
    library.sort(function(a, b) {
      var textA = a.title.toUpperCase();
      var textB = b.title.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    })
    var fragment = document.createDocumentFragment();
    library.forEach(function(book) {
      var bookTitle = document.createElement('button');
      bookTitle.type = 'button';
      bookTitle.innerText = book.title;
      bookTitle.id = book._id
      bookTitle.setAttribute('class', 'library-book');
      fragment.appendChild(bookTitle)
    })
    titles.appendChild(fragment)    
  })
}

function handleNewComment(event) {
  var id = event.target.getAttribute('data-state')    
  event.preventDefault();  
  sendRequest('POST', '/api/books/' + id, {comment: newComment.elements.comment.value}, function() {    
    sendRequest('GET', '/api/books/' + id, {}, function(req) {
      newComment.reset()      
      displayDetails(JSON.parse(req.response))
    })
  })
}

function commentPressed(event) {  
  var commentBox = document.createElement('input')
  commentBox.type = 'text'
  commentBox.name = 'comment'
  commentBox.placeholder = 'New Comment'
  commentBox.required = 'true'
  var commentSubmit = document.createElement('input')
  commentSubmit.type = 'submit'
  commentSubmit.value = 'Submit Comment'
  newComment.appendChild(commentBox)
  newComment.firstChild.focus()
  newComment.appendChild(commentSubmit)
  newComment.setAttribute('data-state', event.target.getAttribute('data-state'))      
  newComment.addEventListener('submit', handleNewComment)
}

function deletePressed(event) {
  var bookid = event.target.getAttribute('data-state')
  sendRequest('DELETE', '/api/books/' + bookid, {}, function() {
    clearDetails()
    loadLibrary()
  })
}

function handleBookButtons(event) {
  newComment.removeEventListener('submit', handleNewComment)     
  // disable 'Add New Comment' and 'Delete Book' buttons
  var buttons = event.target.parentNode.childNodes
  for (var i=0; i < buttons.length; i++) {
    buttons[i].disabled = 'true'
  }  
  var bookid = event.target.getAttribute('data-state')  
  switch (event.target.id) {
    case 'comment-button':
      commentPressed(event)      
      break;
    case 'delete-button':
      deletePressed(event)      
      break;
  }
}

function displayDetails(book) {    
  // remove previous listener for 'Add New Comment' and 'Delete Book' buttons
  bookButtons.removeEventListener('click', handleBookButtons)
  // remove previous book comments if any
  while (bookComments.firstChild) {
    bookComments.removeChild(bookComments.firstChild)
  }
  // remove 'Add New Comment' and 'Delete Book' buttons
  while (bookButtons.firstChild) {
    bookButtons.removeChild(bookButtons.firstChild)
  }
  // remove comment box and submit button  
  while (newComment.firstChild) {
    newComment.removeChild(newComment.firstChild)
  }
  detailsBox.setAttribute('class', 'book-details-style')
  bookTitle.innerText = book.title
  bookId.innerText = '(ID#: ' + book._id + ')'
  var fragment = document.createDocumentFragment()  
  book.comments.forEach(function(comment) {
    var commentLine = document.createElement('li')
    commentLine.innerText = comment
    fragment.appendChild(commentLine)    
  })
  bookComments.appendChild(fragment)  
  // create and add 'Add New Comment' and 'Delete Book' buttons
  var commentButton = document.createElement('button')
  commentButton.type = 'button'
  commentButton.innerText = 'Add New Comment'
  commentButton.id = 'comment-button'
  commentButton.setAttribute('data-state', book._id)
  var delButton = document.createElement('button')
  delButton.type = 'button'
  delButton.innerText = 'Delete Book'
  delButton.id = 'delete-button'
  delButton.setAttribute('data-state', book._id)  
  bookButtons.appendChild(commentButton)
  bookButtons.appendChild(delButton)  
  bookButtons.addEventListener('click', handleBookButtons)
}

function handleTitleClick(event) {  
  var bookId = event.target.id;
  sendRequest('GET', '/api/books/' + bookId, {}, function(req) {
    displayDetails(JSON.parse(req.response))
  })  
}

function clearDetails() {  
  detailsBox.setAttribute('class', '')
  bookTitle.innerText = ''
  bookId.innerText = ''
  // remove previous book comments if any
  while (bookComments.firstChild) {
    bookComments.removeChild(bookComments.firstChild)
  }
  // remove 'Add New Comment' and 'Delete Book' buttons
  while (bookButtons.firstChild) {
    bookButtons.removeChild(bookButtons.firstChild)
  }
  // remove comment box and submit button
  while (newComment.firstChild) {
    newComment.removeChild(newComment.firstChild)
  }
  // clean-up delete entire library
  while (deleteCheck.firstChild) {
    deleteCheck.removeChild(deleteCheck.firstChild)
  }
}

function handleNewTitle(event) {
  clearDetails()    
  event.preventDefault()
  var formData = {title: newTitle.elements.title.value}
  sendRequest('POST', '/api/books', formData, function() {
    newTitle.reset()
    loadLibrary()    
  })  
}

function handleDeleteCheck(event) {  
  event.preventDefault();  
  var children = event.target.parentNode.children
  for (var i=0; i < children.length; i++) {
    if (children[i].nodeName == 'BUTTON') {
      children[i].disabled = 'true'
    }
  }  
  switch (event.target.name){
    case 'yes':      
      sendRequest('DELETE', '/api/books', {}, function() {
        clearDetails()
        deleteLibrary.disabled = false
        loadLibrary()
      })      
      break;
    case 'no':      
      clearDetails()      
      deleteLibrary.disabled = false
      break;                           }
}

function handleDeleteLibrary(event) {
  event.target.disabled = true;  
  var fragment = document.createDocumentFragment()
  var warningMsg = document.createElement('h4')
  warningMsg.innerText = 'Are you sure you want to delete your ENTIRE library?'
  var yesBtn = document.createElement('button')
  yesBtn.type = 'button'
  yesBtn.name = 'yes'
  yesBtn.innerText = 'Yes, DELETE my library'
  var noBtn = document.createElement('button')
  noBtn.type = 'button'
  noBtn.name = 'no'
  noBtn.innerText = 'No, I lost my mind'
  fragment.appendChild(warningMsg)
  fragment.appendChild(yesBtn)
  fragment.appendChild(noBtn)
  deleteCheck.appendChild(fragment) 
  deleteCheck.addEventListener('click', handleDeleteCheck)
}

loadLibrary()
newTitleBox.addEventListener('focus', clearDetails)
newTitle.addEventListener('submit', handleNewTitle);
titles.addEventListener('click', handleTitleClick)
deleteLibrary.addEventListener('click', handleDeleteLibrary)
