import Genre from '../models/genre.js';
import Book from '../models/book.js';
import async from 'async';
import {body, validationResult} from 'express-validator';

// Display list of all Genre.
export function genre_list(req, res, next) {
  Genre.find()
    .exec(function(err, list_genres) {
      if (err) return next(err);
      res.render('genre_list', {
        title: 'Genre List',
        genre_list: list_genres
      });
    });
};

// Display detail page for a specific Genre.
export function genre_detail(req, res, next) {
  async.parallel({
    genre: function(callback) {
      Genre.findById(req.params.id)
        .exec(callback);
    },
    genre_books: function(callback) {
      Book.find({genre: req.params.id})
        .exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.genre === null) {
      const err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }
    res.render('genre_detail', {
      title: "Render Detail",
      genre: results.genre,
      genre_books: results.genre_books
    });
  });
};

// Display Genre create form on GET.
export function genre_create_get(req, res) {
  res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
export const genre_create_post = [
  // Validate and sanitize the name field.
  body('name', 'Genre name required').trim().isLength({min: 1}).escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({name: req.body.name});
    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array()
      });
      return;
    } else {
      Genre.findOne({name: req.body.name})
        .exec(function(err, found_genre) {
          if (err) return next(err);
          if(found_genre) {
            res.redirect(found_genre.url)
          } else {
            genre.save(function(err) {
              if (err) return next(err);
              res.redirect(genre.url);
            });
          }
        })
    }
  }
];

// Display Genre delete form on GET.
export function genre_delete_get(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
export function genre_delete_post(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
export function genre_update_get(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
export function genre_update_post(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};