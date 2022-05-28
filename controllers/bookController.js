import Book from '../models/book.js';
import Author from '../models/author.js';
import Genre from '../models/genre.js';
import BookInstance from '../models/bookinstance.js';
import async from 'async';
import {body, check, validationResult} from 'express-validator';

export function index(req, res) {
  async.parallel({
    book_count: function(callback) {
      Book.countDocuments({}, callback);
    },
    book_instance_count: function(callback) {
      BookInstance.countDocuments({}, callback);
    },
    book_instance_available_count: function(callback) {
      BookInstance.countDocuments({status: 'Available'}, callback);
    },
    author_count: function(callback) {
      Author.countDocuments({}, callback);
    },
    genre_count: function(callback) {
      Genre.countDocuments({}, callback);
    }
  }, function(err, results) {
    console.log(results);
    res.render('index', {
      title: 'Tiny Express Mongodb Library',
      error: err,
      data: results
    });
  });
};

// Display list of all books.
export function book_list(req, res, next) {
  Book.find({}, 'title author')
    .sort({title: 1})
    .populate('author')
    .exec(function(err, list_books) {
      if (err) return next(err);
      res.render('book_list', {
        title: 'Book List',
        book_list: list_books
      })
    });
};

// Display detail page for a specific book.
export function book_detail(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id)
        .populate('author genre')
        .exec(callback);
    },
    book_instance: function(callback) {
      BookInstance.find({'book': req.params.id,})
        .exec(callback);
    },
  }, function(err, results) {
    if (err) return next(err);
    if (results.book === null) {
      const err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    res.render('book_detail', {
      title: results.book.title,
      book: results.book,
      book_instances: results.book_instance
    });
  });
};

// Display book create form on GET.
export function book_create_get(req, res, next) {
  /* Get all authors and genres, which we can use for adding
  to our book. */  
  async.parallel({
    authors: function(callback) {
      Author.find(callback);
    },
    genres: function(callback) {
      Genre.find()
        .populate()
        .exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    res.render('book_form', {
      title: 'Create Book',
      authors: results.authors,
      genres: results.genres
    })
  });
};

const checklist = [
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({min: 1}),
    // .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({min: 1}),
    // .escape(),
  body('isbn', 'ISBN must not be empty')
    .trim()
    .isLength({min: 1}),
    // .escape(),
  body('genre.*'),
    // .escape(),
];

// Handle book create on POST.
export const book_create_post = [
  // Convert the genre the an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if(typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },
  // Validate and sanitize fields.
  ...checklist, 
  //Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // Create a Book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      async.parallel({
        authors: function(callback) {
          Author.find(callback);
        },
        genres: function(callback) {
          Genre.find(callback);
        }
      }, function(err, results) {
        if (err) return next(err);
        // Mark our selected genres as checked.
        for (let i = 0; i < results.genres.length; i++) {
          if (book.genre.indexof(results.genres[i]._id) > -1) {
            results.genres[i].checked = 'true';
          }
        }
        res.render('book_form', {
          title: 'Create Book',
          authors: results.authors,
          genres: results.genres,
          book: book,
          errors: errors.array()
        });
        return;
      });
    } else {
      // Data from form is valid. Save book.
      book.save(function(err) {
        return next(err);
      });
      res.redirect(book.url);
    }
  }
];

// Display book delete form on GET.
export function book_delete_get(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id)
        .exec(callback);
    },
    bookinstances: function(callback) {
      BookInstance.find({'book': req.params.id})
        .exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.book == null) {
      const err = new Error('Book not found.');
      err.status = 404;
      return next(err);
    }
    res.render('book_delete', {
      title: 'Delete Book',
      book: results.book,
      bookinstances: results.bookinstances
    });
  });
};

// Handle book delete on POST.
export function book_delete_post(req, res, next) {
  Book.findByIdAndRemove(req.params.id, function delete_book(err) {
    if (err) return next(err);
    res.redirect('/catalog/books');
  });
};

// Display book update form on GET.
export function book_update_get(req, res) {
  // Get book, authors and genres for form.
  async.parallel({
    book: function(callback) {
        Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
    },
    authors: function(callback) {
        Author.find(callback);
    },
    genres: function(callback) {
        Genre.find(callback);
    },
    }, function(err, results) {
      if (err) { return next(err); }
      if (results.book==null) { // No results.
        res.redirect('/catalog/books');
      }
      // Success.
      // Mark our selected genres as checked.
      for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
          for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
              if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                  results.genres[all_g_iter].checked='true';
              }
          }
      }
      res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
  });
};

// Handle book update on POST.
export const book_update_post = [

  // Convert the genre to an array
  (req, res, next) => {
      if(!(req.body.genre instanceof Array)){
          if(typeof req.body.genre==='undefined')
          req.body.genre=[];
          else
          req.body.genre=new Array(req.body.genre);
      }
      next();
  },
  // Validate and sanitize fields.
  ...checklist,
  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped/trimmed data and old id.
      var book = new Book(
        { title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
          _id:req.params.id //This is required, or a new ID will be assigned!
         });

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.

          // Get all authors and genres for form.
          async.parallel({
              authors: function(callback) {
                  Author.find(callback);
              },
              genres: function(callback) {
                  Genre.find(callback);
              },
          }, function(err, results) {
              if (err) { return next(err); }

              // Mark our selected genres as checked.
              for (let i = 0; i < results.genres.length; i++) {
                  if (book.genre.indexOf(results.genres[i]._id) > -1) {
                      results.genres[i].checked='true';
                  }
              }
              res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
          });
          return;
      }
      else {
          // Data from form is valid. Update the record.
          Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
              if (err) { return next(err); }
                 // Successful - redirect to book detail page.
                 res.redirect(thebook.url);
              });
      }
  }
];